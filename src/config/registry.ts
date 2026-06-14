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
const AuthMethodSchema = z.enum(['apiKey','oauth', 'credentialsFile']);

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
}).refine((p) => p.sdkAdapter !== 'openai-compatible' || p.baseUrl !== undefined, { "message" : 'openai-compatible providers must define baseUrl'}, 
	 );


// whole registery file

const RegistrySchema = z.object({
	schemaVersion: z.literal(1),
	updatedAt: z.string(),
	providers: z.record(z.string(), ProviderSchema),
});

// cached schema
const CacheSchema = z.object({
	fetchedAt: z.string(),// ISO date string eg: "2026-06-11T09:30:00.000Z"
	registry: RegistrySchema,
});

// Note we need not define explicit type for zoda schema as TypeScript is intelligent enough to infer it

// Types derived from schema to be used
// typeof in typescript returns the type of the runtime object, here when we do typeof ProviderSchema, it return complex zod object with methods like parse, safeParese, refine etc... all additional zod nonsense associate with zod class rather than just data type. for this zod provide a generic utility called z.infer to filter only data type out of it for us

export type ProviderInfo = z.infer<typeof ProviderSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

// ---Defining constants--
const REGISTRY_URL = 'https://raw.githubusercontent.com/gotherohit/astra/main/src/config/providers.bundled.json';
const CONFIG_DIR = join(homedir(),'.astra');
const  CACHE_FILE = join(CONFIG_DIR,'registry-cache.json');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// any baseUrl outside the below allowed lsit in registery is not allowed
const ALLOWED_HOSTS = [
'api.openai.com',
'api.anthropic.com',
'openrouter.ai',
'huggingface.co',
'api.groq.com',
'api.mistral.ai',
'api.x.ai',
'generativelanguage.googleapis.com',
'localhost',
'127.0.0.1',
];

// below is to make sure we are shipping right bundled schema in line with the maintained one
const BUNDLED: Registry = RegistrySchema.parse(bundledJson);

// few helpers function

// throws error if base url is outside allowed list

function validateBaseUrls(registry: Registry): void {
	// object.values return value of the object as an array
	// for of iterate over the value of array not index
	for(const provider of Object.values(registry.providers)) {
		if(provider.baseUrl === undefined) continue;

		const host = new URL(provider.baseUrl).hostname;
		if(!ALLOWED_HOSTS.includes(host)) {

			throw new Error(`Registry rejected: baseUrl host "${host}" is not in allowlist`,);
		}
	}
	
}

// Below function read the cache and gives cache and its age, if cache is corrupt or not correct shape return null
// Typescript forces to handle null case

function readCache(): { registry: Registry; ageMs: number}  | null {
	
	try {

		const raw = readFileSync(CACHE_FILE, 'utf-8');
		// we validate with zod so that nothing unwanted enters app. z.parse return JS object not zod object
		const cache = CacheSchema.parse(JSON.parse(raw));
		// new Date(iso).getTime() -> ms since 1970
		const ageMs = Date.now() - new Date(cache.fetchedAt).getTime();

		return { registry: cache.registry, ageMs };
	} catch {
		// File missing, unreadable, invalid JSON, or wrong shape —
		return null;
	}
}

function writeCache(registry: Registry): void {
	// create ~/.astra if doenot exist, if exisit no error
	mkdirSync(CONFIG_DIR, {recursive: true});
	writeFileSync(CACHE_FILE, JSON.stringify({fetchedAt: new Date().toISOString(), registry}, null, 2), 'utf-8',);
}

// fetch and fully validate remote registry

async function fetchRemote(): Promise<Registry> {

	// Node has built in fetch
	// we can use AbortSignal.timeout(5000) to send signal to abort fetch after 5 sec to avoid hung startup
	const response = await fetch(REGISTRY_URL, {signal: AbortSignal.timeout(5000) });

	// fetch does not throw any http error like 404 - only network failure
	// response.ok is only true for staus code 200 - 299
	
	if(!response.ok) {
	throw new Error(`Registry fetch failed with: HTTP ${response.status}`);
	}

	const data = await response.json();

	const registry = RegistrySchema.parse(data);
	
	validateBaseUrls(registry)

	return registry;
}

// -------- The public loader ---------------

export async function loadRegistry(): Promise<Registry> {

	const cached = readCache();
	
	if(cached !== null && cached.ageMs < CACHE_TTL_MS) {
		
		return cached.registry;
	}

	try {

		const remote = await fetchRemote();
		writeCache(remote);
		return remote;
	} catch {

		if (cached !== null) {
			return cached.registry;
		}
	}

	return BUNDLED;

}
