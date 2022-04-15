import { AST } from '../ast';
import { print } from './pprint';
import { tree } from './tree';
import { Cells, evaluate } from './utils';

export default class Interpreter {
	print(program: AST): string {
		return print(program.body);
	}

	tree(program: AST): string {
		return tree(program.body);
	}

	run(cells: Cells, program: AST): string | number {
		return evaluate(program.body, cells);
	}
}
