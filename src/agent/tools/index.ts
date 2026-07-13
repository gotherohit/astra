import {tool, type ToolSet} from 'ai';
import { z } from 'zod';
import { readTool } from './read.js';

export interface tool<TInput=unknown> {
	name: string;
	description: string;
	inputSchema: z.ZodType<TInput>;
	run: (input: TInput) => Promise<string>;
	readOnly?: boolean;
	parallelSafe?: boolean;
	requiresPermission?: boolean;
}

export const toolRegistry: Record<string, tool<any>> = {
	[readTool.name]: readTool,
};

//--- buildModelTools() create a tool object with tool detail to pass to streamText---

export function buildModelTools(): ToolSet {
	const modelTools: ToolSet = {};

	for (const t of Object.values(toolRegistry)) {
		modelTools[t.name] = tool({
			description: t.description,
			inputSchema: t.inputSchema,
		});
	}
	return modelTools;
}

// dispatch function to do perform tool calling

export async function dispatch(name: string, rawInput: unknown): Promise<string> {

	const t = toolRegistry[name];
	if (t === undefined) {
		return `Error: unknown tool "${name}".`
	}

	const parsed = t.inputSchema.safeParse(rawInput);
	if(!parsed.success) {
		return `Error: invalid arguments for "${name}": ${parsed.error.message}`;
	}

	try {

		return await t.run(parsed.data);
	} catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              return `Error while running "${name}": ${message}`;
		
	}

}
