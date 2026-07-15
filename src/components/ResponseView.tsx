import { Box, Text } from 'ink';
import { ConversationTurn, Segment } from '../agent/types.js';

interface ResponseViewProps {
	history: ConversationTurn[];
	liveTurn: Segment[];
}

// renderer for each Segment from Segment[]

function renderSegment(seg: Segment, index: number, isLast: boolean) {

	switch(seg.type) {
		case 'text':
			return (
			<Text key={index} wrap="wrap">
			{seg.text}
			{isLast ? '▌' : '' }
			</Text>
		);

		case 'tool-call':
			return (
			<Text key={index} color="magenta">
				🔧 {seg.toolName}({JSON.stringify(seg.input)})
			</Text>
		);

		case 'tool-result':
                      // the (previewed) result — dimmed, secondary
                      return (
                              <Text key={index} color="gray" dimColor>
                                      ↳ {seg.output}
                              </Text>
                      );
	
	}

}

// ResponseViewProps below is type of the prop object not just history property inside it which we are destructuring
export function ResponseView({ history, liveTurn }: ResponseViewProps) {

	const isStreaming = liveTurn.length > 0;
	if (history.length === 0 && !isStreaming) {
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
	{/* if we have list of item like .map here will return it is REQUIRED to have unique key defined as prop for each item in list*/}
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

	{/* The LIVE partial turn. Re-renders everytime App grows `streamingText`*/}
	{isStreaming && (
	<Box
	flexDirection="column"
	paddingLeft={2}
	borderStyle="single"
	borderColor="green"
	borderLeft={true}
	borderRight={false}
	borderTop={false}
	borderBottom={false}
	>
	<Text color="green" bold>Astra:</Text>
	{liveTurn.map((seg, i) => renderSegment(seg, i, i === liveTurn.length - 1),)}
	</Box>
	)}
	</Box>
	);
	
}
