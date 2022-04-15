import readline from 'readline';

type Listener = (line: string) => void;
type Command = (reader: readline.Interface, ...args: string[]) => void;

const commands = new Map<string, Command>();

const is_command = (line: string) => {
	const [name] = line.split(' ') ?? [];
	return commands.has(name.trim());
};

const execute_command = (reader: readline.Interface, line: string) => {
	const names = [...commands.keys()].join('|');
	const regex = RegExp(`(?<command>(${names}))( (?<input>([\\S\\s]+)))?`);
	const matches = regex.exec(line);

	if (matches && matches.groups) {
		const { groups } = matches;
		const command = commands.get(groups.command);
		command && command(reader, groups.input);
	} else {
		console.log('poopoo');
	}
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
