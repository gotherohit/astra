// Box from ink our root layout container

import { Box, useInput } from 'ink';
import { ConversationTurn } from './agent/types.js';

// import our Header component
import { Header } from './components/Header.js';
import { ResponseView } from './components/ResponseView.js'

// App is root componenet - Top of componenet tree
// Everything will be added inside here as we build more componenets

export function App() {

	//useInput is an Ink hook that listens for keypresses
	// empty callback for now - just having it registered keeps Ink alive
	// this is temporary - once we add PromptInput it will handle naturally
	
	useInput(()=>{});
	//Hardcoded Test data for demo
	const testHistory: ConversationTurn[] = [{
		id:'1',
		userPrompt: 'Hello Astra',
		agentResponse: 'Hello! I am a placeholder response',
		timestamp: new Date(),
	}
	]
	return (
		// The outermost Box act as the full terminal viewport
		// flexDirection="column" stacks all children top-to-bottom
		// padding={1} adds 1 cell of space on all sides
		<Box flexDirection="column" padding={1}> 
			<Header />
			<ResponseView history={testHistory} />
		</Box>

	);
}
