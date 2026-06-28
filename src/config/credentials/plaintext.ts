import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { CredentialStore } from './index.js';

// schema for astra-cred.json, this is shared between plain and encrypted storage
// we will use discriminated union to differentiate between encrypted and plain interface

const PlainEntrySchema = z.object({
	encrypted: z.literal(false),
	apiKey: z.string(),
});

const EncryptedEntrySchema = z.object({
	encrypted: z.literal(true),
	ciphertext: z.string(),
	salt: z.string(),
	iv: z.string(),
	authTag: z.string(),
});

const CredEntrySchema = z.discriminatedUnion('encrypted', [PlainEntrySchema, EncryptedEntrySchema,]);

const CredFileSchema = z.object({
providers: z.record(z.string(), CredEntrySchema),
})

type CredFile = z.infer<typeof CredFileSchema>;

// ---constants--------------------------
const CRED_DIR = join(homedir(),'.astra');
const CRED_FILE = join(CRED_DIR, 'astra-cred.json');
const EMPTY: CredFile = { providers: {} };

// --- file helpers ------------------
function readCredFile(path: string = CRED_FILE): CredFile {
	try {
		const raw = readFileSync(path, 'utf-8');
		return CredFileSchema.parse(JSON.parse(raw));
	} catch {
		return EMPTY;
	}
}

function writeCredFile(data: CredFile, path: string = CRED_FILE): void {
	mkdirSync(dirname(path), {recursive: true});
	writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
	lockPermissions(path);
}

//Best effort restrict the file to current user

function lockPermissions(file: string): void {
	try {
		if (process.platform === 'win32') {

			execFileSync('icacls', 
			[file, '/inheritance:r', '/grant:r', `${process.env.USERDOMAIN}\\${process.env.USERNAME}:F`],
			{stdio: 'ignore'},);
		}
		else {
			chmodSync(file, 0o600);
		}
	
	} catch {
		// never block saving a key even if we permission tightening gave error
	}
}

// main backend

export class PlaintextStore implements CredentialStore {
	async get(providerId: string): Promise<string | null> {
		const file = readCredFile();
		const entry = file.providers[providerId];
		if (entry === undefined) return null;
		if (entry.encrypted) return null;
		return entry.apiKey;
	}

	async set(providerId: string, apiKey: string): Promise<void> {
		const file = readCredFile();
		file.providers[providerId] = {encrypted: false, apiKey};
		writeCredFile(file);
	}

	async delete(providerId: string): Promise<void> {
		const file = readCredFile();
		delete file.providers[providerId];
		writeCredFile(file);
	}

	async isAvailable(): Promise<boolean> {
		return true;
	}

}
