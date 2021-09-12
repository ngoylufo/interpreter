import cli from './tools/cli';
import Lexer from './modules/lexer';
import Parser from './modules/parser';
import Interpreter from './modules/interpreter';
import type { Cell } from './modules/interpreter/utils';

const cells: Map<string, Cell> = new Map();
const interpreter = new Interpreter();

cells.set('A1', { type: 'text', formula: 'Hello', value: 'Hello' });
cells.set('A2', { type: 'number', formula: '=22', value: 22 });

cli('(SFI) $ ', function line(line: string): void {
	try {
		const tokens = new Lexer(line).lex();
		const program = new Parser(tokens).parse();
		console.log(interpreter.run(cells, program));
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(`  ${error.name}: ${error.message}`);
		} else {
			throw new Error('Unknown error occurred.');
		}
	}
});
