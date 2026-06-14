// if we enable globals:true in vitest.config.ts we can directly use below without import as vitest inject those in global scope. But still importing is best practice for more clarity
// "describe",  lets us group multiple test case in a same logical group it take 2 parameter name and callback function which can define multiple test case as well as nested describe as required
// "test" or aliased as "it" is the fundamental building block of test suite it is used to define specific scenario we want to test. test is like file inside describe folder
// test take 2 argument name for what is being tested, callback function actuals code that run logics and perform assertion
// "except", is what allows us to add assertion to the test, i.e. check our test case. It allows us to compare actual value to the expected value using matchers like .toBe() for exact refrence in memory 
// .toEqual() checking each value in the object
// "vi" = Vitest's mocking toolkit, we use it to mockup how certain behave function by faking its behaviour like faking fow fetch behave so that it return fake data. vi.fn() create a brand new  mock function. vi.stubGlobal, vi.unstubAllGlobals use to mock and un-mock global function like fetch, window or localstorage
// afterEach provides a hook that runs after every test mainly for cleanup

import { describe, test, expect, vi, afterEach } from 'vitest';

// we will test through public api's that real app uses

import { loadRegistry } from './registry.js';

describe("loadRegistry", () => {

	afterEach(() => {
    		// vi.unstubAllGlobals() undoes any global we faked during a test.
    		// Without this, a fake "fetch" from one test would leak into the next.
		vi.unstubAllGlobals();
	})
	
	test("alwyas return a registry containing core providers", async () => {

		const registry = await loadRegistry();
		expect(Object.keys(registry.providers)).toContain('anthropic');
		expect(Object.keys(registry.providers)).toContain('openai');


	});

	test("fall back gracefully when the network is down", async () => {

		// we will use vi.stubGlobal to replace global fetch with fake one that alwyas reject resulting in no network simulation
		// vi.fn() allows to create a mock function and .mockRejectedValue tells mock function to immedeatly return rejected promise i.e. simulating a network error
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		const registry = await loadRegistry();
		expect(registry).toBeDefined();
		expect(Object.keys(registry.providers).length).toBeGreaterThan(0);
	});






});
