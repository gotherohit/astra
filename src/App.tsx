// we will use react hook useState and useCallback to track state across our app
import { useState, useCallback} from 'react';
// Box from ink our root layout container
// useApp is a hook from ink that let's you manage the app lifecycle ex. quiting the app in specific scenario
import { Box, Text, useApp, useInput } from 'ink';
import { ConversationTurn, AppStatus, Segment } from './agent/types.js';
import { AstraAgent } from './agent/AstraAgent.js';
// import our Header component
import { Header } from './components/Header.js';
import { buildActiveModel, NotConfiguredError } from './agent/model.js';
import { ResponseView } from './components/ResponseView.js';
import { PromptInput } from './components/PromptInput.js';
import { ConfigWizard } from './components/ConfigWizard.js';

// we define agent outside App component as we donot want want agent to be created every time App rerender
const agent = new AstraAgent();
// App is root componenet - Top of componenet tree
// Everything will be added inside here as we build more componenets

export function App() {

	// exit() quits the Ink application
	const { exit } = useApp();
	// Now we will create state required to track our application
	const [status, setStatus] = useState<AppStatus>('idle');
	const [currentPrompt, setCurrentPrompt] = useState<string>('');
	const [history, setHistory] = useState<ConversationTurn[]>([]);
	// the live partial answer. '' when idle; grows token by token while streaming
	const [liveTurn, setLiveTurn] = useState<Segment[]>([]);

	//useInput is an Ink hook that listens for keypresses, so if Esc is clicked in config mode we go to idle mode else exit
	// empty callback for now - just having it registered keeps Ink alive
	// this is temporary - once we add PromptInput it will handle naturally
	
	useInput((_input, key)=>{
		if (key.escape) {
			if (status === 'configuring') setStatus('idle');
			else exit();
		}
	
	});
	// useCallback is used to memoise function so that it does not recreated every render, except when dependency array goes under change
	// useCallback(func, dependencyArray)
	const handleSubmit = useCallback(
		async (value: string) => {
			const trimmed = value.trim();
			// guard check
			if (trimmed === '' || status === 'running') return;

			// command detection: anything starting with '/' is a command
			if (trimmed.startsWith('/')) {
				const commandArgs = trimmed.split(' ');
				const command = commandArgs[0];
				setCurrentPrompt('');
				if (command === '/config') setStatus('configuring');
				return;
			}
			
			// --- normal Prompt: currently placeholder
			setStatus('running');
			setCurrentPrompt('');
			setLiveTurn([]);
			// build model
			
			let active;
			try {
				active = await buildActiveModel();
			} catch (err) {
				const message = err instanceof NotConfiguredError ? err.message : `Could not start the model: ${String(err)}`;
				setHistory((prev) => [...prev, {id: crypto.randomUUID(), userPrompt: trimmed, agentResponse: message, timestamp: new Date()},]);
				setStatus('idle');
				return;
			}

			// run the stream
			try {
				const output = await agent.run({prompt: trimmed, conversationHistory: history}, {model: active.model, 
			onToken: (delta) => setLiveTurn((prev) => {
					const last = prev[prev.length - 1];
					if (last !== undefined && last.type === 'text') {
						const extended = {...last, text: last.text + delta};
						return [...prev.slice(0, -1), extended];
					} 

					return [...prev, {type: 'text', text: delta}]
				}),

				onEvent: (event) => setLiveTurn((prev) => [...prev, event]),
				},);
			setHistory((prev) => [...prev, {id: crypto.randomUUID(), userPrompt: trimmed, agentResponse: output.response, timestamp: new Date()},]);
			} catch (err) {
			 setHistory((prev) => [
         			 ...prev,
         			 { id: crypto.randomUUID(), userPrompt: trimmed, agentResponse: `⚠ Error: ${String(err)}`, timestamp: new Date() },
        ]);

			} finally {

				setLiveTurn([]);
				setStatus('idle');
			}
		},
		[status, history]
	)
	return (
		// The outermost Box act as the full terminal viewport
		// flexDirection="column" stacks all children top-to-bottom
		// padding={1} adds 1 cell of space on all sides
		<Box flexDirection="column" padding={1}> 
			<Header />
			<ResponseView history={history} liveTurn={liveTurn} />
			{/* Conditional rendering using && right side renders only if left is true*/}
			{status === 'running' && liveTurn.length === 0 && <Text color="yellow">Astra is Thinking</Text>}
			{status !== 'configuring' && (
			<PromptInput 
			value={currentPrompt}
			isDisabled={status==='running'}
			onChange={setCurrentPrompt}
			onSubmit={handleSubmit}
			/>
			)}
			{status === 'configuring' && <ConfigWizard />}
		</Box>

	);
}
