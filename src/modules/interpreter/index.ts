import { AST } from '../ast';
import { Cells, evaluate } from './utils';

export default class Interpreter {
	run(cells: Cells, program: AST) {
		return evaluate(program.body, cells);
	}
}
