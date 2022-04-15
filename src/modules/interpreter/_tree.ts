import type {
	BinaryNode,
	CallNode,
	CellNode,
	CellRangeNode,
	GroupNode,
	Node,
	NumberNode,
	UnaryNode
} from '../ast';

export const tree = (node: Node): string => {
	return `Program\n|- Body\n${_tree(node, 1)}`;
};

export const _tree = (node: Node, level = 0): string => {
	const trim = (str: string) => {
		if (str.length > 10) {
			return `"${str.slice(0, 10)}..."`;
		}
		return `"${str}"`;
	};

	switch (node.type) {
		case 'String':
			return decorate(trim(node.value), '    '.repeat(level));
		case 'Number':
			return print_number(node, level);
		case 'CellNode':
			return print_cell(node, level);
		case 'UnaryNode':
			return print_unary(node, level);
		case 'BinaryNode':
			return print_binary(node, level);
		case 'CallNode':
			return print_call(node, level);
		case 'GroupNode':
			return print_group(node, level);
	}
	throw new Error(`Unexpected node: ${node.type}`);
};

const decorate = (value: string, prefix = ''): string => {
	return `${prefix}|- ${value}\n`;
};

const print_number = (node: NumberNode, level: number) => {
	const prefix = '    '.repeat(level);
	return decorate(`Number ${node.value}`, prefix);
};

const print_cell = (node: CellNode, level = 0): string => {
	const prefix = '    '.repeat(level);
	return decorate(`Cell ${node.value}`, prefix);
};

const print_unary = (node: UnaryNode, level = 0): string => {
	const prefix = '    '.repeat(level);
	const name = decorate('Unary', prefix);
	const op = decorate(`Operator "${node.operator}"`, prefix);

	const value = _tree(node.right, level + 1);
	return `${name}${op}${value}`;
};

const print_binary = (node: BinaryNode, level = 0): string => {
	const prefix = '    '.repeat(level);
	const name = decorate('Binary', prefix);
	const op = decorate(`Operator "${node.operator}"`, prefix);
	const left = _tree(node.left, level);
	const right = _tree(node.right, level);
	return name + op + left + right;
};

const print_call = (node: CallNode, level: number): string => {
	const prefix = '    '.repeat(level);

	const name = decorate('Call', prefix);
	const callName = decorate(node.name, prefix);
	const args = node.args
		.map((a) => {
			if (a.type === 'CellRangeNode') {
				return print_range(a, level + 1);
			}
			return _tree(a, level + 1);
		})
		.join('');

	return name + callName + args;
};

const print_range = (node: CellRangeNode, level: number): string => {
	const prefix = '    '.repeat(level);
	const name = decorate('Range', prefix);
	const left = decorate(`From`, prefix) + print_cell(node.left, level + 2);
	const right = decorate(`To`, prefix) + print_cell(node.right, level + 2);
	return name + left + right;
};

const print_group = (node: GroupNode, level: number): string => {
	const prefix = '    '.repeat(level);
	const name = decorate('Group', prefix);
	const value = _tree(node.expr, level + 1);
	return name + value;
};
