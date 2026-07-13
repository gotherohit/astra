import {z} from 'zod';
import {readFile} from 'node:fs/promises';
import {isAbsolute} from 'node:path';

// Limit constants

const DEFAULT_LINE_LIMIT = 2000; // Default limit when no limit is given
const MAX_LINE_LENGTH = 2000; // clip absurdly long lines 

const readInputSchema = z.object({
	// .describe() text is sent to model - it is per field prompt guidance
	filePath: z.string().describe('The absolute path to the file to read. '),
	offset: z.number().int().positive().optional().describe('1-based line number to start reading from. Defaults to 1'),
	limit: z.number().int().positive().optional().describe('Maximum number of lines to read. Defaults to 2000. '),

});

type ReadInput = z.infer<typeof readInputSchema>;

export const readTool = {
	name: 'read',
	description: 'Read a file from the local filesystem. Returns the file contents with ' +
		'line numbers (cat -n style). The filePath MUST be absolute path.' + 
		'Use `offset` and `limit` to page through large files.',
	inputSchema: readInputSchema,
	readOnly: true,
	parallelSafe: true,

	run: async ({filePath, offset, limit }: ReadInput): Promise<string> => {
		// reject relative path -> return string error
		if (!isAbsolute(filePath)) {
			return `Error: filePath must be absolute path. "${filePath}"`;
		}

		let content: string;
		try {
			content = await readFile(filePath, 'utf-8');
		} catch (err) {
			const e = err as NodeJS.ErrnoException;
			if (e.code === 'ENOENT') return `Error: File not found: ${filePath}`;
			if (e.code === 'EISDIR') return `Error: Path is a Directory, not a file: ${filePath}`;
			if (e.code === 'EACCES') return `Error: Permission Denied: ${filePath}`;
			return `Error reading file: ${e.message}`;
			
		}

		if (content === '') {
			return `(File is empty: ${filePath})`;
		}

		// Split all lines on \n, keeps \r on windows CLRF

		const allLines = content.split('\n');
		const startIndex = (offset ?? 1) - 1;
		const count = limit ?? DEFAULT_LINE_LIMIT;

		const selected = allLines.slice(startIndex, startIndex + count);

		if (selected.length === 0) {
			return `(No Lines to read: file has ${allLines.length} lines, offset was ${offset ?? 1}.)`;
		}

		// built line number cat -n style output
		const numbered = selected.map((line, i) => {
                      const lineNumber = startIndex + i + 1;
                      const clipped =
				line.length > MAX_LINE_LENGTH
                        ? line.slice(0, MAX_LINE_LENGTH) + '… [line truncated]'
                                      : line;
                      return `${lineNumber}\t${clipped}`;   // "12\tconst x = 1"
              });

	        const lastLineShown = startIndex + selected.length;
              const footer =
                      lastLineShown < allLines.length
                        ? `\n\n… ${allLines.length - lastLineShown} more lines. ` +
                `Call read again with offset=${lastLineShown + 1} to continue.`
                              : '';
              return numbered.join('\n') + footer;
	}
}
