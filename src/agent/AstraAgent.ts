import { 
	streamText, 
	type LanguageModel,
	type ModelMessage,
	type ToolResultPart,
	type LanguageModelUsage
} from 'ai';
import type { AgentInput, AgentOutput } from './types.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { buildModelTools, dispatch } from './tools/index.js';
// Let's define AstraAgent class
// export means this class can be imported in other files
export interface RunOptions {
	model: LanguageModel;
	onToken: (delta: string) => void;
	system?: string;
}

// Hard cap for model to not go in infinite loop -> Later to be configurable
const MAX_STEP = 50;
// per model call give
interface StepResult {
	text: string;
	toolCalls: Awaited<ReturnType<typeof streamText>['toolCalls']>;
	usage: LanguageModelUsage;
	 // responseMessages -> the assistant msg (incl. tool-call parts) the SDK built
      // already in correct wire shape — we append it verbatim.
	responseMessages: ModelMessage[];

}


export class AstraAgent {

	// one step code
	private async step(
		messages: ModelMessage[],		
		options: RunOptions,
	): Promise<StepResult> {

		const result = streamText({
			model: options.model,
			system: options.system ?? buildSystemPrompt(),
			messages,
			tools: buildModelTools(),
		})

		let text ='';
		 for await (const delta of result.textStream) {
			text += delta;
			options.onToken(delta);
		 }

		 // stream drained
		 return {
			 text,
			 toolCalls: await result.toolCalls,
			 usage: await result.usage,
			 responseMessages: await result.responseMessages,
		 };
	}

	async run(input: AgentInput, options: RunOptions): Promise<AgentOutput> {
		
		// Date.now() gives time in milliseconds since 1970
		const startTime = Date.now();
		const messages: ModelMessage[] = input.conversationHistory.flatMap((turn) => [
			{role:'user' as const, content: turn.userPrompt },
			{role: 'assistant' as const, content: turn.agentResponse},
		]);

		messages.push({role: 'user' as const, content: input.prompt});

		let usage: LanguageModelUsage | undefined;
		let lastText = '';

		// -- Loop --
		for (let stepNum =0; stepNum < MAX_STEP; stepNum++) {

			const step = await this.step(messages, options);
			usage = usage === undefined ? step.usage : addUsage(usage, step.usage);
			lastText = step.text;

			// No tool call, end the loop
			if (step.toolCalls.length === 0) {

				return {response: step.text, durationMs: Date.now()- startTime, usage}
			}

			// Model asked for toolcall run each tool and collect result
			const toolResults: ToolResultPart[] = [];

			for (const call of step.toolCalls) {

				const output = await dispatch(call.toolName, call.input);
				toolResults.push({

					type: 'tool-result',
					toolCallId: call.toolCallId,
					toolName: call.toolName,
					output: {type: 'text', value: output},
				});
			}

			messages.push(...step.responseMessages);
			messages.push({role: 'tool', content: toolResults });
		}

		// after MAX_STEPS
		return {
			response: lastText || `(Stopped: reached the ${MAX_STEP}-step tool limit.)`,
			durationMs: Date.now() - startTime,
			usage,

		};
	}
}

function addUsage(a: LanguageModelUsage, b: LanguageModelUsage): LanguageModelUsage {
      return {
              ...b, // keep b's detail sub-objects as a reasonable default
              inputTokens: (a.inputTokens ?? 0) + (b.inputTokens ?? 0),
              outputTokens: (a.outputTokens ?? 0) + (b.outputTokens ?? 0),
              totalTokens: (a.totalTokens ?? 0) + (b.totalTokens ?? 0),
      };
}

