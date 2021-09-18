import readline from 'readline';

type Listener = (line: string) => void;
type Command = (reader: readline.Interface, ...args: string[]) => void;

const commands = new Map<string, Command>();

const is_command = (line: string) => {
	const [name] = line.split(' ') ?? [];
	return commands.has(name.trim());
};

const execute_command = (reader: readline.Interface, line: string) => {
	const [name, ...args] = line.trim().split(' ') ?? [];
	const command = commands.get(name);
	command && command(reader, ...args);
};

const prompt_after = (
	reader: readline.Interface,
	line: string,
	callback: Listener
): void => {
	return callback(line.trim()), reader.prompt();
};

export const registerCommand = (name: string, command: Command): void => {
	commands.set(name, command);
};

export default function cli(prompt: string, listener?: Listener): void {
	const reader = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: prompt
	});

	registerCommand('clear', () => console.clear());
	registerCommand('exit', () => process.exit());

	reader.on('line', function readline(line) {
		if (is_command(line)) {
			prompt_after(reader, line, (line: string) => {
				execute_command(reader, line);
			});
		} else {
			listener && prompt_after(reader, line, listener);
		}
	});

	reader.prompt();
}
