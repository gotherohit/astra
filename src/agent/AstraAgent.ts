import { AgentInput, ConversationTurn, AgentOutput } from './types.js';

// Let's define AstraAgent class
// export means this class can be imported in other files
export class AstraAgent {

	// private means this variable cannot be accessed outside the class, readonly means once this variable is initialized in constructor then cannot be changed	
	private readonly simulatedDelayMs: number;
	
	// constructor runs once when we write new AstraAgent()
	constructor(simulatedDelayMs = 1500) {
		// "this" refers to specific instance being created
		this.simulatedDelayMs = simulatedDelayMs;
	}
	
	// async function returns promise. Promise<AgentOutput> means the promise will eveentually resolve to give an AgentOutput
	async run(input: AgentInput): Promise<AgentOutput> {
		
		// Date.now() gives time in milliseconds since 1970
		const startTime = Date.now();
		
		// we have used await because the function return Promise and to execute it to simulate delay we need await as it will pause the execution. else it will get promise and continue
		await this.sleep(this.simulatedDelayMs);
		
		// response type will be automatically inferred as string as the function returns string
		const response = this.buildMockResponse(
			input.prompt,
			input.conversationHistory.length
		);

		// return an object Matching AgentOutput interface
		return {
			response, // instead of creating object like {x:x} we can do {x} as shortcut
			 duration: Date.now() - startTime
		};
	}

	// private means this function is only usable inside AstraAgent
	// returns Promise<void> because when setTimeout calls reolve() without any argument which gives undefined as return value and void means no value/undefined
	private sleep(ms : number): Promise<void> {
	
		return new Promise((resolve) => setTimeout(resolve, ms));	
	}

	private buildMockResponse(prompt: string, turnNumber: number): string {

		return (
			`[Astra - Turn ${turnNumber + 1}]\n` +
				`You said: "${prompt}"\n` + 
				`Placeholder response. Real agent logic will be wired later`
		);
	}
}

