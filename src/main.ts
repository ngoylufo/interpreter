import Lexer from './modules/lexer';
import Parser from './modules/parser';
import Interpreter from './modules/interpreter';
import cli, { registerCommand } from './tools/cli';
import type { Cell } from './modules/interpreter/utils';
import { tree, call, number, binary } from './modules/interpreter/tree';

const cells: Map<string, Cell> = new Map();
const interpreter = new Interpreter();

cells.set('A1', { type: 'text', formula: 'Hello', value: 'Hello' });
cells.set('A2', { type: 'number', formula: '=22', value: 22 });

registerCommand('tokens', function (reader, line) {
	const tokens = new Lexer(line).lex();
	console.log(tokens);
});

registerCommand('pretty', function (reader, line) {
	const tokens = new Lexer(line).lex();
	const program = new Parser(tokens).parse();
	console.log(interpreter.print(program));
});

registerCommand('tree', function (reader, line) {
	// const tokens = new Lexer(line).lex();
	// const program = new Parser(tokens).parse();
	// console.log(interpreter.tree(program));
	console.log(tree(call));
});

cli('(SFI) $ ', function line(line: string): void {
	try {
		const tokens = new Lexer(line).lex();
		const program = new Parser(tokens).parse();
		console.log(program);
		// console.log(interpreter.run(cells, program));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(`  ${error.name}: ${error.message}`);
		} else {
			throw new Error('Unknown error occurred.');
		}
	}
});
