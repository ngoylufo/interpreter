import { unfold } from '../../tools/utils';

import {
	BinaryNode,
	CallNode,
	CellNode,
	CellRangeNode,
	GroupNode,
	Node,
	UnaryNode
} from '../ast';

export interface Cells {
	get(cell: string): Cell | undefined;
}

export interface BaseCell {
	type: string;
	formula: string;
}

export interface NumberCell extends BaseCell {
	type: 'number';
	value: number;
}

export interface TextCell extends BaseCell {
	type: 'text';
	value: string;
}

export type Cell = NumberCell | TextCell;

type TypeOfTag =
	| 'undefined'
	| 'number'
	| 'bigint'
	| 'boolean'
	| 'string'
	| 'symbol'
	| 'object'
	| 'function';

function expects<T>(
	type: TypeOfTag,
	n: unknown,
	error: string
): asserts n is T {
	if (typeof n !== type) {
		throw new Error(error);
	}
}

function assert<T>(type: TypeOfTag, a: unknown, error: string): asserts a is T {
	if (typeof a !== type) {
		throw new Error(`Expected a number, but got "${a}".`);
	}
}

function assert_number(n: unknown): asserts n is number {
	assert<number>('number', n, `Expected a number, but got "${n}"`);
}

function assert_string(a: unknown): asserts a is string {
	assert<string>('string', a, `Expected a string, but got "${a}"`);
}

export const evaluate = (node: Node, cells: Cells): number | string => {
	switch (node.type) {
		case 'String':
			return node.value;
		case 'Number':
			return node.value;
		case 'CellNode':
			return evaluate_cell(node, cells);
		case 'UnaryNode':
			return evaluate_unary(node, cells);
		case 'BinaryNode':
			return evaluate_binary(node, cells);
		case 'CallNode':
			return evaluate_call(node, cells);
		case 'GroupNode':
			return evaluate_group(node, cells);
	}

	throw new Error(`Unexpected node: ${node.type}`);
};

const evaluate_cell = (node: CellNode, cells: Cells): number | string => {
	const cell = cells.get(node.value);
	return (cell as Cell).value;
};

const evaluate_unary = (node: UnaryNode, cells: Cells): number => {
	const n = evaluate(node.right, cells);
	expects<number>('number', n, `Expected a number, got "${n}"!`);

	switch (node.operator) {
		case '+':
			return +n;
		case '-':
			return -n;
	}
};

const evaluate_binary = (node: BinaryNode, cells: Cells): number => {
	const left = evaluate(node.left, cells);
	const right = evaluate(node.right, cells);

	expects<number>('number', left, `Expected a number, got "${left}"!`);
	expects<number>('number', right, `Expected a number, got "${right}"!`);

	switch (node.operator) {
		case '+':
			return left + right;
		case '-':
			return left - right;
		case '*':
			return left * right;
		case '/':
			return left / right;
	}
};

type GlobalFunctions = {
	[x: string]: GlobalFunction;
};

type GlobalFunction = {
	unary?: true;
	callback: KnownFunction;
};

type KnownFunction = (...args: any[]) => any;

const functions: GlobalFunctions = {
	SUM: {
		callback: (first: number, rest: number[]) => {
			return rest.reduce((a, b) => a + b, first);
		}
	},
	AVERAGE: {
		callback: (first: number, rest: number[]) => {
			const count = [first, ...rest].length;
			return functions.SUM.callback(first, rest) / count;
		}
	},
	LEN: {
		unary: true,
		callback: (first: string): number => {
			assert_string(first);
			return first.length;
		}
	},
	MAX: {
		callback: (first: number, rest: number[]): number => {
			[first, ...rest].map(assert_number);
			return Math.max(first, ...rest);
		}
	},
	MIN: {
		callback: (first: number, rest: number[]): number => {
			[first, ...rest].map(assert_number);
			return Math.min(first, ...rest);
		}
	},
	CONCATENATE: {
		callback: (first: string, rest: string[]): string => {
			[first, ...rest].map(assert_string);
			return [first, ...rest].join("");
		}
	}
};

const evaluate_call = (node: CallNode, cells: Cells): number | string => {
	const callback = functions[node.name];

	const [first, ...rest] = node.args
		.map((node) => {
			if (node.type === 'CellRangeNode') return evaluate_range(node, cells);
			return evaluate(node, cells);
		})
		.flat();

	if (callback.unary) {
		return callback.callback(first);
	}
	return callback.callback(first, rest);
};

const parse_range = (left: string, right: string): CellNode[] => {
	const split = (value: string): [string, number] => {
		const remove = (regex: RegExp) => value.replace(regex, '');
		return [remove(/\d+/), +remove(/[A-Z]+/)];
	};

	const convert = (value: number | string): number | string => {
		if (typeof value === 'number') {
			return String.fromCodePoint(value + 65);
		}
		return value.codePointAt(0)! - 65;
	};

	const [col_1, row_1] = split(left);
	const [col_2, row_2] = split(right);

	const columns = unfold(
		([s, e]) => (s > e ? null : [convert(s) as string, [++s, e]]),
		[convert(col_1) as number, convert(col_2) as number]
	);

	const rows = unfold(
		([s, e]) => (s > e ? null : [s, [++s, e]]),
		[row_1, row_2]
	);

	const names = rows.map((r) => columns.map((c) => `${c}${r}`)).flat();
	return names.map((value) => ({ type: 'CellNode', value }));
};

const evaluate_range = (
	node: CellRangeNode,
	cells: Cells
): (number | string)[] => {
	const nodes = parse_range(node.left.value, node.right.value);
	return nodes.map((node) => evaluate(node, cells));
};

const evaluate_group = (node: GroupNode, cells: Cells) => {
	return evaluate(node.expr, cells);
};
