import { BinaryNode, CallNode, CellNode, CellRangeNode, GroupNode, Node, UnaryNode } from "../ast";

export const print = (node: Node) => {
	switch (node.type) {
		case "String":
			return node.value as string;
		case "Number":
			return `${node.value}`;
		case 'CellNode':
			return print_cell(node);
		case 'UnaryNode':
			return print_unary(node);
		case 'BinaryNode':
			return print_binary(node);
		case 'CallNode':
			return print_call(node);
		case 'GroupNode':
			return print_group(node);
	}
	throw new Error(`Unexpected node: ${node.type}`);
}

const print_cell = (node: CellNode): string => {
	return node.value;
}

const print_unary = (node: UnaryNode): string => {
	const value = print(node.right);
	return `(${node.operator}${value})`;
}

const print_binary = (node: BinaryNode): string => {
	const left = print(node.left);
	const right = print(node.right);
	return `(${left} ${node.operator} ${right})`;
}

const print_range = (node: CellRangeNode): string => {
	return `(${print(node.left)}:${print(node.right)})`;
};

const print_call = (node: CallNode): string => {
	const args = node.args.map(a => {
		if (a.type === "CellRangeNode") {
			return print_range(a);
		}
		return print(a);
	}).join(", ");

	return `${node.name}(${args})`;
}

const print_group = (node: GroupNode): string => {
	return `(${print(node.expr)})`;
};