// Generate the final system prompt for the agent 
// below interface will be updated as the need grows over the course of improvement
export interface SystemPromptContext {
	now?: Date;
}

// Base Persona
const BASE_PERSONA = 'You are an AI Agent named Astra.';

export function buildSystemPrompt(context: SystemPromptContext={}): string {
	const sections: string[] = [BASE_PERSONA];
	if (context.now !== undefined) {
		sections.push(`The current date is ${context.now.toDateString()}.`);
	}

	return sections.join('\n\n');

}
