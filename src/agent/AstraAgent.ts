import { streamText, type LanguageModel } from 'ai';
import type { AgentInput, AgentOutput } from './types.js';
import { buildSystemPrompt } from './systemPrompt.js';
// Let's define AstraAgent class
// export means this class can be imported in other files
export interface RunOptions {
	model: LanguageModel;
	onToken: (delta: string) => void;
	system?: string;
}


export class AstraAgent {	

	async run(input: AgentInput, options: RunOptions): Promise<AgentOutput> {
		
		// Date.now() gives time in milliseconds since 1970
		const startTime = Date.now();
		const messages = input.conversationHistory.flatMap((turn) => [
			{role:'user' as const, content: turn.userPrompt },
			{role: 'assistant' as const, content: turn.agentResponse},
		]);

		messages.push({role: 'user' as const, content: input.prompt});
		const result = streamText({
			model: options.model,
			system: options.system ?? buildSystemPrompt(),
			messages,
		});
		let fullText = '';
		for await (const delta of result.textStream) {
			fullText += delta;
			options.onToken(delta);
		}

		// return an object Matching AgentOutput interface
		return {
			response: fullText,
			 durationMs: Date.now() - startTime
		};
	}
}


