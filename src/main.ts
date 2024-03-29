import Lexer, { LexerError } from "./modules/lexer";
import Channel from "$channels";
import cli, { registerCommand } from "$cli";
import { report_source } from "$utils";
import Interpreter, { Cell } from "./modules/interpreter";

`
Argument :: [T bool] { name :: string, type :: 'bool', default :: T }
Argument :: { ..., on :: 'input' | 'output', callback :: (value :: T) -> string }
Argument :: { ..., type :: 'number', default :: number }
Argument :: { ..., type :: 'string', default :: string }

Command :: { name :: string, args :: []Argument, callback :: () -> {} }

registerCommand('tokens', {
	
});
`;

const cells: Map<string, Cell> = new Map();
cells.set("A1", { name: "A1", formula: "Hello" });
cells.set("A2", { name: "A2", formula: "=22" });

registerCommand("tokens", async (_, source) => {
	const chan = new Channel<Lexer.Lexeme>();
	const lexemes: Lexer.Lexeme[] = [];
	const lexer = new Lexer();

	lexer.lex(chan, source).catch((error: LexerError) => {
		const line = report_source(source, error.index);
		console.log(`${error.name}: ${error.message}${line}`);
	});

	while (chan.receiving) {
		const lexeme = await chan.pop();
		lexemes.push(lexeme);
	}

	console.log(lexemes);
});

const interpreter = new Interpreter(cells);

cli("(SFI) $ ", async function line(source: string): Promise<void> {
	const value = await interpreter.run(source);
	value && console.log(value);
});
