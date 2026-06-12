import { Box, Text } from 'ink';
import { ConversationTurn} from '../agent/types.js';

interface ResponseViewProps {
	history: conversationTurn[];
}

// ResponseViewProps below is type of the prop object not just history property inside it which we are destructuring
export function ResponseView({ history }: ResponseViewProps) {

	if (history.length === 0) {
		return (
			<Box marginTop={1} paddingX={1}>
			<Text color="gray" dimColor>
			No conversation yet. Type a message below to begin.
			</Text>
			</Box>
			
		);
	}
	
	// if we have history, render all turns
	return (
	//gap={1} adds 1 blank line between each child box
	<Box flexDirection="column" gap={1} marginTop={1}>
	{/* history.map() return an array for each turn transforming it into JSX like [JSX1, JSX2,....]*/}
	{/* if we have lsit of item like .map here will return it is REQUIRED to have unique key defined as prop for each item in list*/}
	{history.map((turn)=>(
			<Box key={turn.id} 
			flexDirection="column" 
			paddingLeft={2}
			borderStyle="single"
			borderColor="gray"
			borderLeft={true}
			borderRight={false}
			borderTop={false}
			borderBottom={false}
			>
			{/*flexDirection="row" palces You: and text side by side*/}
			<Box flexDirection="row" gap={1}>
				<Text color="cyan" bold>You:</Text>
				<Text>{turn.userPrompt}</Text>
			</Box>
			<Box flexDirection="row" gap={1} marginTop={1}>
				<Text color="green" bold>Astra:</Text>
				<Text wrap="wrap">{turn.agentResponse}</Text>
			</Box>
			<Text color="gray" dimColor>
			 {turn.timestamp.toLocaleTimeString()}
			</Text>
			</Box>
				))}
	</Box>
	);
	
}
