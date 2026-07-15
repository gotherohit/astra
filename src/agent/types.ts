// Single source of truth for all shared types across the project.
// No React or Ink imports here — pure TypeScript only.

// Overall exclusive state App can be in
import type { LanguageModelUsage } from 'ai';

export type AppStatus = 'idle' | 'running' | 'configuring';
// One completed exchange between user and agent
export interface ConversationTurn {
    id: string;
    userPrompt: string;
    agentResponse: string;
    timestamp: Date;
  }

  // What you must pass when calling agent.run()
export interface AgentInput {
    prompt: string;
    conversationHistory: ConversationTurn[]; // all previous turns
  }

  // What agent.run() gives back when it finishes
export interface AgentOutput {
    response: string;
    durationMs: number;
    usage?: LanguageModelUsage;
  }

export type AgentEvent = 
	| {type: 'tool-call'; toolName: string; input: unknown}
	| {type: 'tool-result'; toolName: string; output: string};

export type Segment = {type: 'text'; text: string } | AgentEvent;
