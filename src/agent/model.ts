import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

import  { loadConfig } from '../config/config.js';
import { loadRegistry } from '../config/registry.js';
import { resolveApiKey } from '../config/credentials/index.js';

// we would want to throw an custom error if config is not set before using agent

export class NotConfiguredError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotConfiguredError";
	}
}

export interface ActiveModel {
	model: LanguageModel;
	providerId: string;
	modelId: string;
}

export async function buildActiveModel(): Promise<ActiveModel> {
	const config = loadConfig();
	if(config.activeProvider === null) {
		throw new NotConfiguredError('No active provider. Run /config to set one up.');
	}
	const providerId = config.activeProvider;
	const pc = config.providers[providerId];
	if(pc === undefined) {
		throw new NotConfiguredError(`Provider "${providerId}" is active but has no saved config.`);
	}

	const modelId = pc.selectedModel;
	const registry = await loadRegistry();
	const info = registry.providers[providerId];
	if(info === undefined) {
		throw new NotConfiguredError(`Provider "${providerId} not in registry"`);
	}

	const apiKey = await resolveApiKey(providerId, registry, config);
	if(info.requiresApiKey && (apiKey===null || apiKey==='')) {
		throw new NotConfiguredError(`No Api key found for "${providerId}". Run /config.`);
	}

	let model: LanguageModel;
	
	switch (info.sdkAdapter){

	case 'openai' : {
		const openai = createOpenAI({apiKey: apiKey ?? ''});
		model = openai(modelId);
		break;
	}
	case 'anthropic' : {
		const anthropic = createAnthropic({apiKey: apiKey ?? ''});
		model = anthropic(modelId);
		break;
	}
	case 'openai-compatible': {
		const compat = createOpenAICompatible({
			name: providerId,
			baseURL: info.baseUrl ?? '',
			apiKey: apiKey ?? '',
		});
		model = compat(modelId);
		break;
	}
	case 'google': {
      		throw new NotConfiguredError('Google adapter not installed yet.'); 			// enum allows it; no package
	}
    default: {
      const _exhaustive: never = info.sdkAdapter;
      throw new Error(`Unknown sdkAdapter: ${String(_exhaustive)}`);
    }

	}
	return {model, providerId, modelId};
}
