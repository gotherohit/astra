import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface PromptInputProps {
	value: string;
	isDisabled: boolean;
	onChange: (value: string)=>void; // for every keystroke
	onSubmit: (value: string)=>void; // for entire submit using Enter

}

export function PromptInput({value, isDisabled, onChange, onSubmit}: PromptInputProps) {

	return (

		<Box>
			<Text color='green' bold>{'> '}</Text>
			{/* While the agent is running we swap the live input for a dim dots lime. Simplest way to disable typing */}
			{isDisabled ? (<Text color='gray' dimColor>...</Text>) : (
				<TextInput
				value={value}
				onChange={onChange}
				onSubmit={onSubmit}
				placeholder="Type a message, or / command e.g. /config"
				/>)}
		</Box>
	);

}
