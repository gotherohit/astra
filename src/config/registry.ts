// Zod gives us runtime validation 
import {z} from 'zod';
import { readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// we can import data like json to a variable as well
import bundledJson from './providers.bundled.json' with {type: 'json'}; 

// --------schemas--------

// AuthMethod schema in json
// z.enum restricts string to exactly one of the value
// same idea a typescript union but checked at runtime
const AuthMethodSchema = z.enum(['apikey','oauth', 'credentialsFile']);

// provider schema in json. Providers is a object containing multiple provider schema value with dynamic string key for new providers
// .refine method in zod let's us write custom validation logic like involving multiple fields that native field level validation cannot provide
// .refine taken 2 thing a function that returns true or flase and second error info object with message key which is used if function returns false

const ProviderSchema = z.object({

	name: z.string(),
	// authSupported: ["api key","Oauth", "credentials"] -> provider can support any combination of auth method
	// z.array(X) = an array whose every element belongs to X
	authSupported: z.array(AuthMethodSchema),
	// z.record(k, v) = an object with any number of keys of type k, each value is type v. z.unknown() = any value
	authConfig: z.record(z.string(), z.unknown()),
	sdkAdapter: z.enum(['openai', 'anthropic', 'google', 'openai-compatible']),
	baseUrl: z.string().url().optional(),
	models: z.array(z.string()),
	envVar: z.string(),
	requiresApiKey: z.boolean(),
	addnProviderConfig: z.record(z.string(), z.unknown()),
}).refine((p) => p.sdkAdapter !== 'openai-compatible' || p.baseUrl !== undefined, { "message" : 'openai-compatible providers must define baseUtl'}, 
	 );


// whole registery file

const RegistrySchema = z.object({
	schemaVersion: z.literal(1),
	updatedAt: z.string(),
	providers: z.record(z.string(), ProviderSchema),
});

// cached schema
const cacheSchema = z.object({
	fetchedAt: z.string(),// ISO date string eg: "2026-06-11T09:30:00.000Z"
	registry: RegistrySchema,
});

// Note we need not define explicit type for zoda schema as TypeScript is intelligent enough to infer it

// Types derived from schema to be used 

export type ProviderInfo = z.infer<typeof ProviderSchema>;
export type registry = z.infer<typeof RegistrySchema>;
