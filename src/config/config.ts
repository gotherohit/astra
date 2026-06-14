import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

//-----schema-----------------------------

// which auth method user picked
const AuthMethodSchema = z.enum(['apiKey', 'oauth', 'credentialsFile']);

const CredentialStorageSchema = z.enum(['plain', 'keychain', 'encrypted']);

// Provider facts live in registry. User choice for the provider for the moment live in config

const ProviderConfigSchema = z.object({
	
	authSelected: AuthMethodSchema,
	credentialStorage: CredentialStorageSchema,
	selectedModel: z.string(),
	extraAuthConfig: z.record(z.string(), z.unknown()),
});

// now complete config schema

const AstraConfigSchema = z.object({

	version: z.string(),
	activeProvider: z.string().nullable(),
	providers: z.record(z.string(), ProviderConfigSchema),
});

// Derive TypeScript schema

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type AstraConfig = z.infer<typeof AstraConfigSchema>;

// Constant

const CONFIG_DIR = join(homedir(),'.astra');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Defualt config, when nothing is configured

const DEFAULT_CONFIG: AstraConfig = {

	version: '1',
	activeProvider: null,
	providers: {},
} 

// Read Write config files

export function loadConfig(file: string = CONFIG_FILE): AstraConfig{
	// we have to handle what is config file is not there/broken/corrupt
	// we initially donot now what parsed data type can be as it can be something edited
	// so we use unknown type which forces us to do type narrowing before doing any operation on parsed object
	let parsed: unknown;
	// first we try to load the file if its is not in json format we we throw error and reset to defualt
	try {
	parsed = JSON.parse(readFileSync(file, 'utf-8'));
	} catch {
		return resetToDefault(file);
	}

	// now atleast we have json, but do we have valid schema. Remember here we need to do runtime schema validation
	// we are using safeParse because safeParse give discrimminated union with sucees key having boolean key
	// safeParse will not throw error if error in parsing occur like aprse rather it give result object and we
	// can use success key to branch. In this case since config can be of wrong shape with user edit it is good choice
	const result = AstraConfigSchema.safeParse(parsed);

	if (!result.success) {
		return resetToDefault(file);
	}
	
	// result.data contain data when parse is success, it also let typescript know the shape of it
	return result.data;
}

export function saveConfig(config: AstraConfig, file: string=CONFIG_FILE): void {

	mkdirSync(dirname(file), {recursive: true});
	writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8');
}

function resetToDefault(file: string): AstraConfig {
	saveConfig(DEFAULT_CONFIG, file);
	return DEFAULT_CONFIG;
}
