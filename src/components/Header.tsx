// Ink's provide "Box" and "Text" to work with TUI similar to <div> and <span> for browser DOM

import { Box, Text } from 'ink';

// This is React Functional componenet
// A component is just a function that return JSX (The HTML style syntax below)
// Below component takes no prop, i.e. no input from parent - it alwyas look same 

export function Header() {

	// everything inside "return () is JSX". It looks like HTML but is actually TypeScript
	// Ink convert JSX into terminal characters instead of browser HTML.


	return (
		// Box is like a flext container. By default its child stack side by side.
      		// "flexDirection='column'" makes children stack top-to-bottom instead.
      		// "borderStyle='round'" draws a rounded Unicode box around its contents.
      		// "borderColor='cyan'" sets that border's color.
      		// "paddingX={2}" adds 2 spaces of padding on the left and right sides.
      		// "marginBottom={1}" adds 1 blank line below this box.
		// {} has a special meaning inside JSX. It is used to provide javascript code block inside JSX syntax which is MarkUp based like comments.

	<Box
		flexDirection="column"
		borderStyle="round"
		borderColor="cyan"
		paddingX={2}
		marginBottom={1}
		> 
		{/* Text renders a line of terminal text */}
		{/* "bold" is a boolean prop - writing it alone means bold={true}*/}
		{/* "color='cyan'" sets the text color */}
		<Text bold color="cyan">
			ASTRA
		</Text>
		{/* "dimColor" reduces the brightness */}
		<Text color="gray" dimColor>
			Agentic Terminal Harness v0.1.0
		</Text>
	</Box>

	);
}
