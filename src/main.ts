import Channel from "$channels";
import { report_source } from "$utils";
import cli, { registerCommand } from "$cli";

import Lexer, { LexerError } from "./modules/lexer";
import Interpreter, { Cell } from "./modules/interpreter";

const cells: Map<string, Cell> = new Map();
const interpreter = new Interpreter(cells);

cells.set("A1", { name: "A1", formula: "Hello" });
cells.set("A2", { name: "A2", formula: "=22" });
cells.set("A3", { name: "A3", formula: "=34" });
cells.set("A4", { name: "A4", formula: "=A2+A3" });

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

cli("(SFI) $ ", async function line(source: string): Promise<void> {
	try {
		const value = await interpreter.run(source);
		value && console.log(value);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(`${error.name}: ${error.message}`);
			error.cause && console.log(error.cause);
		} else {
			console.log("Unknown Error");
		}
	}
});
