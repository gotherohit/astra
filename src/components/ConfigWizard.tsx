// useEffect is also a react hook, it is used to define a function which perform side effect, which reacts all after rerendering and based on dependency array.
// useEffect expects nothing or clean up function that react can call before rendering again or unmounting the component
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';

import { loadRegistry, type Registry} from '../config/registry.js';
import { loadConfig, saveConfig} from '../config/config.js';
import { createCredentialStore } from '../config/credentials/index.js';

// WizardBox will have few steps defined by below type

type WizardStep = 
	| 'loading' 
	| 'selectProvider' 
	| 'selectModel' 
	| 'keySource' // show ONLY when an env var is already set: use it vs store a key
	| 'enterApiKey' // masked key entry
	| 'saved';

// ink-select-Input expects label and value as a row. Label -> User facing, value -> what we get onSelect
interface Item {
	label: string;
	value: string;
}

// let's create a function that will be called when when user hits enter or save to save the config based on input, 
// wrapper function encapsulating loading and saving config

function saveSelection(providerId: string, model: string ): void {
	const config = loadConfig();
	config.providers[providerId] = {
		authSelected: 'apiKey',
		credentialStorage: 'plain',
		selectedModel: model,
		extraAuthConfig: {},
	};
	config.activeProvider = providerId;
	saveConfig(config);
}
// create a function to store cred based on backend and if env is preffered
async function persistProvider(
	providerId: string,
	model: string,
	apiKey: string | null,
	) : Promise<void> {
	saveSelection(providerId, model);
	if  (apiKey !== null && apiKey !== ''){
		const store = createCredentialStore('plain');
		await store.set(providerId, apiKey);
	}
}

export function ConfigWizard() {
	const [step, setStep] = useState<WizardStep>('loading');
	// registry might not be loaded so it will be null because loading is it in useEffect which runs after component renders
	const [registry, setRegistry] = useState<Registry | null>(null);
	const [providerId, setProviderId] = useState<string>('');
	const [model, setModel] = useState<string>('');
	const [apiKey, setApiKey] = useState<string>('');
	//-----useEffect run the sideeffect after render-------
	// useEffect(fn, dependency) runs fn after render if dependency is changed
	// [] in dependency array means the fn is executed only once after the first mount
	// perfect for onetime data loading during mount
	useEffect(() => {
		// useEffect fn itself must not be async (react expect return to be either nothing or cleanup function never promise)
		async function load() {
			const reg = await loadRegistry();
			setRegistry(reg);
			setStep('selectProvider')
		}
		load();

	},[]);
	// ---- render ---------
	// never ever call setState directly during render, state change belong in side-effect or event handler. Doing it during render causes infinite re-render loop
	
	if (step === 'loading' || registry === null) {

		return (

			<Box marginTop={1}>
				<Text color="yellow">
					<Spinner type="dots" /> Loading providers...
				</Text>
			</Box>
		);
	        }

	if (step === 'selectProvider') {
		// Object.entries convert {openai: {},..} -> [["openai", {}],...]
		// map just iterates over these tuples
		const items: Item[] = Object.entries(registry.providers).map(([id, info]) => ({label: info.name, value: id}),);
		return (

			<Box flexDirection='column' marginTop={1}>
			<Text bold color="cyan">Select a provider:</Text>
			{/* SelectInput hanadles arrow key for navigation and Enter to select
			    onSelect eventHandler fires on Enter.
				*/}
			<SelectInput 
			items={items}
			onSelect={ (item) => {
				setProviderId(item.value);
				const prov = registry.providers[item.value];
				// some provider like ollama doesnot ship preset models - skip model selection
				if (prov !== undefined && prov.models.length === 0 ) {
					void persistProvider(item.value, '', null);//`void` = intentionally not awaiting. i.e. intentionally discarding the promise
					setStep('saved');
				}
				else {
					setStep('selectModel');
				}
			}}
			/>
			</Box>
		);
		}

	if (step === 'selectModel') {
		const provider = registry.providers[providerId];
		if (provider === undefined) { //bcs of noUncheckedIndexedAccess tsconfig
			return <Text color="red">Provider not found. Press Esc to go back.</Text>
		}
		const items: Item[] = provider.models.map((m) => ({label: m, value: m}));
		return (
			<Box flexDirection="column" marginTop={1}>
			<Text bold color = "cyan"> Select a model for {provider.name}:</Text>
			<SelectInput 
			items={items}
			onSelect={(item) => {
				setModel(item.value);
				if(!provider.requiresApiKey) {
					void persistProvider(providerId, item.value, null);
					setStep('saved');
					return;
				}
				// Env aware branch 
				const envPresent = 
					provider.envVar !== '' && !!process.env[provider.envVar];
				setStep(envPresent ? 'keySource' : 'enterApiKey');
			}}
			/>
			</Box>
		);
		}
		// step === 'keySource'
		if (step === 'keySource') {
			const provider = registry.providers[providerId];
			const envVar = provider?.envVar ?? '';
			// ?. ?? 
			//means if provider is missing then return ''
			const items: Item[] = [
        			{ label: `Use environment variable (${envVar})`, value: 'env' },
        			{ label: 'Enter & store an API key', value: 'enter' },
      						];
			return (
				<Box flexDirection="column" marginTop={1}>
				<Text bold color="cyan">Found {envVar} in your environment</Text>
				<Text color="gray" dimColor>Astra can use it directly — storing a key is optional.</Text>
				<SelectInput 
				items={items}
				onSelect={async (item) => {
					if(item.value === 'env') {
						await persistProvider(providerId, model, null);
						setStep('saved');
					} else {
						setStep('enterApiKey');
					}
				}}
				/>
				</Box>
			);
		}
		// step === 'enter ApiKey'
		if (step === 'enterApiKey') {
			const provider = registry.providers[providerId];
			return (
				<Box flexDirection="column" marginTop={1}>
				<Text bold color="cyan">Enter API Key for {provider?.name ?? providerId}:</Text>
				<Box>
				<Text color="green">{'> '}</Text>
				<TextInput
				value={apiKey}
				onChange={setApiKey}
				mask="*"
				placeholder="paste key (hidden)"
				onSubmit={async (value) => {
					const trimmed = value.trim();
					if (trimmed === '') return;
					await persistProvider(providerId, model, trimmed);
					setStep('saved');
				}}
				/>
				</Box>
					<Text color="gray" dimColor>Stored in plain text at ~/.astra/astra-cred.json</Text>
				</Box>
			);
		}
		// step === 'saved'
		return (
		<Box flexDirection="column" marginTop={1}>
			<Text color="green">✓ Saved. "{providerId}" is now your active provider.</Text>
			<Text color="gray" dimColor>Press Esc to return.</Text>
		</Box>
		);
}


