import Channel from "$channels";
import {
	CustomError,
	report_lexeme,
	report_source,
	unfold,
	UnfoldCallback
} from "$utils";
import Lexer, { LexerError } from "../lexer";
import Parser, { ParseError } from "../parser";

export type Cell = { name: string; formula: string };
export type Cells = Map<string, Cell>;

class RuntimeError extends CustomError {}

const CONSTANTS = {
	PI: Math.PI
};

const FUNCTIONS = {
	TIMESTAMP: {
		validate: async (_: Interpreter, args: Parser.CallNode["args"]) => {
			if (args.length > 0) {
				throw new RuntimeError(
					"TIMESTAMP is not a function, it cannot take arguments"
				);
			}
			return [];
		},
		call: (_: Awaited<ReturnType<typeof evaluate>>[]) => {
			return Date.now();
		}
	},
	DATE: {
		validate: (_: Interpreter, args: Parser.CallNode["args"]) => {
			if (args.length > 0) {
				throw new RuntimeError(
					"DATE is not a function, it cannot take arguments"
				);
			}
			return [];
		},
		call: (_: Awaited<ReturnType<typeof evaluate>>[]) => {
			return new Date().toString();
		}
	},
	SUM: {
		validate: (interpreter: Interpreter, args: Parser.CallNode["args"]) => {
			if (args.length < 1) {
				throw new RuntimeError(
					`SUM expects at least 1 argument, got ${args.length}`
				);
			}
			return evaluate_args(interpreter, args);
		},
		call: (args: Awaited<ReturnType<typeof evaluate>>[]) => {
			if (args.find((a) => typeof a !== "number")) {
				throw new RuntimeError("SUM expected a number");
			}
			return (args as number[]).reduce((a, b) => a + b);
		}
	},
	LEN: {
		validate: (interpreter: Interpreter, args: Parser.CallNode["args"]) => {
			if (args.length !== 1) {
				throw new RuntimeError(
					`LEN expects exactly 1 argument, but got ${args.length}`
				);
			}
			return evaluate_args(interpreter, args);
		},
		call: (args: Awaited<ReturnType<typeof evaluate>>[]) => {
			if (args.find((a) => typeof a !== "string")) {
				throw new RuntimeError("LEN expects a string");
			}
			return (args as string[]).reduce((a, b) => a + b.length, 0);
		}
	}
};

export const evaluate_args = async (
	interpreter: Interpreter,
	args: Parser.CallNode["args"]
) => {
	const evaluated: Awaited<ReturnType<typeof evaluate>>[] = [];
	for (const node of args) {
		if (node.type === "Range") {
			evaluated.push(...(await evaluate_range(interpreter, node)));
		} else {
			evaluated.push(await evaluate(interpreter, node));
		}
	}
	return evaluated;
};

export const cells: Cells = new Map();

type Types =
	| "undefined"
	| "number"
	| "bigint"
	| "boolean"
	| "string"
	| "symbol"
	| "object"
	| "function";

function assert<T>(type: Types, value: unknown): asserts value is T {
	if (typeof value !== type) {
		throw new RuntimeError(`Unexpected type ${typeof value}, expected ${type}`);
	}
}

const expects = <T>(type: Types, value: unknown): T => {
	return assert<T>(type, value), value as T;
};

const evaluate = async (
	interpreter: Interpreter,
	node: Parser.Node
): Promise<string | number> => {
	switch (node.type) {
		case "Text":
			return node.value;
		case "String":
			return node.value;
		case "Number":
			return node.value;
		case "Cell":
			return evaluate_cell(interpreter, node);
		case "Unary":
			return evaluate_unary(interpreter, node);
		case "Group":
			return evaluate_group(interpreter, node);
		case "Binary":
			return evaluate_binary(interpreter, node);
		case "Call":
			return evaluate_call(interpreter, node);
		case "Constant":
			return evaluate_constant(interpreter, node);
		case "Identifier":
			return evaluate_identifier(interpreter, node);
	}

	if (node.type === "Range") {
		const left = await evaluate(interpreter, node.left);
		const right = await evaluate(interpreter, node.right);

		throw new RuntimeError(
			`Unexpected ${node.type} ${left}:${right}.` +
				"\n	Ranges can only be used as arguments to functions."
		);
	}
	throw new RuntimeError("Unknown error");
};

const evaluate_cell = async (
	interpreter: Interpreter,
	node: Parser.CellNode
) => {
	const cell = interpreter.cell(node.name);
	const value = await interpreter.run(cell.formula);
	if (value === undefined) {
		throw new RuntimeError(`Unexpectedly crashed evaluating cell ${node.name}`);
	}
	return value;
};

const evaluate_unary = async (
	interpreter: Interpreter,
	node: Parser.UnaryNode
) => {
	const m = node.op === "+" ? 1 : -1;
	if (node.right.type === "Range") {
		throw Error("Unexpected range node");
	}
	const resolved = await evaluate(interpreter, node.right);
	return m * expects<number>("number", resolved);
};

const evaluate_group = (interpreter: Interpreter, node: Parser.GroupNode) => {
	return evaluate(interpreter, node.expr);
};

const evaluate_binary = async (
	interpreter: Interpreter,
	node: Parser.BinaryNode
): Promise<number> => {
	if (node.left.type === "Range" || node.right.type === "Range") {
		throw Error("Unexpected range node");
	}

	const left = expects<number>(
		"number",
		await evaluate(interpreter, node.left)
	);
	const right = expects<number>(
		"number",
		await evaluate(interpreter, node.right)
	);

	switch (node.op) {
		case "+":
			return left + right;
		case "-":
			return left - right;
		case "*":
			return left * right;
		case "/":
			return left / right;
	}
};

const evaluate_range = async (
	interpreter: Interpreter,
	node: Parser.RangeNode
) => {
	type RangeNode = Parser.CellNode | Parser.NumberNode;

	const parse_range = (left: RangeNode, right: RangeNode) => {
		if (left.type === "Number" && right.type === "Number") {
			const fn: UnfoldCallback<number, number> =
				left.value > right.value
					? (n: number) => (n > right.value ? [n, n - 1] : null)
					: (n: number) => (n < right.value ? [n, n + 1] : null);
			return unfold(fn, left.value);
		}

		const split = (value: string): [string, number] => {
			const remove = (regex: RegExp) => value.replace(regex, "");
			return [remove(/\d+/), +remove(/[A-Z]+/)];
		};

		const fromCodePoint = (point: number): string => {
			return String.fromCodePoint(point);
		};

		const toCodePoint = (character: string): number => {
			return character.codePointAt(0) as number;
		};

		const [col_1, row_1] = split((left as Parser.CellNode).name);
		const [col_2, row_2] = split((right as Parser.CellNode).name);

		const columns = unfold(
			([s, e]) => (s > e ? null : [fromCodePoint(s), [++s, e]]),
			[toCodePoint(col_1), toCodePoint(col_2)]
		);

		const rows = unfold(
			([s, e]) => (s > e ? null : [s, [++s, e]]),
			[row_1, row_2]
		);

		const names = rows.map((r) => columns.map((c) => `${c}${r}`)).flat();
		return names.map((name) => ({ type: "Cell", name } as Parser.CellNode));
	};

	const nodes = parse_range(node.left as RangeNode, node.right as RangeNode);

	if (typeof nodes[0] === "number") {
		return nodes as number[];
	}

	const evaluated: Awaited<ReturnType<typeof evaluate>>[] = [];
	for (const node of nodes) {
		evaluated.push(await evaluate(interpreter, node as Parser.CellNode));
	}
	return evaluated;
};

const evaluate_call = async (
	interpreter: Interpreter,
	node: Parser.CallNode
) => {
	const func = FUNCTIONS[node.name as keyof typeof FUNCTIONS];
	const args = await func.validate(interpreter, node.args);
	return func.call(args);
};

const evaluate_constant = async (_: Interpreter, node: Parser.ConstantNode) => {
	const value = CONSTANTS[node.name as keyof typeof CONSTANTS];
	if (value === undefined) {
		throw new RuntimeError(`Unknown identifier "${node.name}".`);
	}
	return value;
};

const evaluate_identifier = async (
	interpreter: Interpreter,
	node: Parser.IdentifierNode
) => {
	const value = interpreter.identifier(node.name);
	if (value === undefined) {
		throw new RuntimeError(`Unknown identifier "${node.name}"`);
	}
	return value;
};

type Identifiers = Map<string, number | string>;

export default class Interpreter {
	private identifiers: Identifiers;
	private cells: Cells;

	constructor(cells: Cells = new Map(), identifiers: Identifiers = new Map()) {
		this.cells = cells;
		this.identifiers = identifiers;
	}

	cell(name: string): Cell {
		const cell = this.cells.get(name);
		if (cell === undefined) {
			throw new RuntimeError(`Unknown cell "${name}".`);
		}
		return cell;
	}

	identifier(name: string): number | string | undefined {
		return this.identifiers.get(name);
	}

	async run(source: string): Promise<ReturnType<typeof evaluate> | void> {
		const chan = new Channel<Lexer.Lexeme>();
		const lexer = new Lexer();
		const parser = new Parser();

		lexer.lex(chan, source).catch((error: LexerError) => {
			const line = report_source(source, error.index);
			console.log(`${error.name}: ${error.message}${line}`);
			error.cause && console.log(error.cause);
		});

		try {
			return parser.parse(chan).then((program) => {
				return evaluate(this, program.body);
			});
		} catch (error: unknown) {
			if (error instanceof ParseError) {
				const line = report_lexeme(source, error.lexeme);
				console.log(`${error.name}: ${error.message}${line}`);
				return void (error.cause && console.log(error.cause));
			}
			if (error instanceof LexerError) {
				const line = report_source(source, error.index);
				console.log(`${error.name}: ${error.message}${line}`);
				return void (error.cause && console.log(error.cause));
			}
			if (error instanceof RuntimeError) {
				console.log(`${error.name}: ${error.message}`);
				return void (error.cause && console.log(error.cause));
			}
			throw new RuntimeError("Unknown error.", { cause: error });
		}
	}
}
