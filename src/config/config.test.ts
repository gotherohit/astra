import { describe, test, expect, afterEach } from 'vitest';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// tmpdir() os temp folder eg: ~/AppData/Local/Temp
// safe space to have test files
import { tmpdir } from 'node:os';
import { loadConfig, saveConfig, type AstraConfig } from './config.js';

const TEST_FILE = join(tmpdir(), 'astra-test-config.json');

afterEach(() => {
	if (existsSync(TEST_FILE)) rmSync(TEST_FILE);
});

describe('config', () => {
	test('return defaults config when file doesnot exists', () =>{
		const config = loadConfig(TEST_FILE);
		// .tobeNull asserts value to be exactly null
		expect(config.activeProvider).toBeNull();
		//toEqual does deep equality not just memory refence like toBe. i.e. it compares the content of object not the identity
		expect(config.providers).toEqual({});	
	});

	test('round-trips the save config', () => {

		const input: AstraConfig = {

			version: '1',
			activeProvider: 'openai',
			providers: {

				openai:{
				
					authSelected: 'apiKey',
					credentialStorage: 'plain',
					selectedModel: 'gpt-4o',
					extraAuthConfig: {},
			  },
			},
		     };
		saveConfig(input, TEST_FILE);
		expect(loadConfig(TEST_FILE)).toEqual(input);
	});

	test('reset to default when file has wrong shape', () => {

		// we deliberatly erite garbage thn load and check if it is same as default
		// The "as unknown as AstraConfig" pattern mean we are asking TypeScript to trust that this is AstraConfig type even though it is not
		saveConfig({junk: true} as unknown as AstraConfig, TEST_FILE)
		expect(loadConfig(TEST_FILE).providers).toEqual({});
	})

});
