import { AST } from '../ast';
import { print } from './pprint';
import { Cells, evaluate } from './utils';

export default class Interpreter {
	print(program: AST) {
		return print(program.body);
	}

	run(cells: Cells, program: AST) {
		return evaluate(program.body, cells);
	}
}
