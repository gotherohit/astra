import type { Registry } from '../registry.js';
import type { AstraConfig, CredentialStorage } from '../config.js';
import { PlaintextStore } from './plaintext.js';

// A credentialStore is a abstraction over ANYWHERE an API key can live.
// credentialStore is of three types/backend for this Harness 1) Plain .json file 2) in OS credentials Manager 3) Password-encrypted file
// All these 3 store provide identical interface for other part of code base to interact.

export interface CredentialStore {
	get(providerId: string): Promise<string | null>;
	set(providerId: string, apiKey: string): Promise<void>;
	delete(providerId: string): Promise<void>;
	isAvailable(): Promise<boolean>;
}

export function createCredentialStore(kind: CredentialStorage): CredentialStore {
	switch (kind) {
		case 'plain':
			return new PlaintextStore();
		case 'keychain':
		case 'encrypted':
			throw new Error(`Credential storage "${kind}" coming in later release`);
		default: {
			const _exhaustive: never = kind
			throw new Error(`Unknown Credential Storage ${String(_exhaustive)}`);
		}
	}
}

//Resolve API key EnvVar base on registry -> configured backend -> null

export async function resolveApiKey(
	providerId: string,
	registry: Registry,
	config: AstraConfig,
	): Promise<string | null> {
	
		const info = registry.providers[providerId];
		if (info !== undefined && info.envVar !== '') {
			const fromEnv = process.env[info.envVar]
			if (fromEnv !== undefined && fromEnv !== '') return fromEnv;
		}

		// fallback to whatever backend defined for this provider
		const pc = config.providers[providerId];
    		if (pc === undefined) return null;          // provider not configured at all
    		const store = createCredentialStore(pc.credentialStorage);
    		return store.get(providerId);

}

