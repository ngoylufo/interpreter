enum NodeType {
	Number,
	String,
	Binary,
	Call
}

type NumberNode = {
	type: NodeType.Number;
	value: string;
};

type StringNode = {
	type: NodeType.String;
	value: string;
};

type BinaryNode = {
	type: NodeType.Binary;
	operator: '+' | '-';
	value: [Node, Node];
};

type CallNode = {
	type: NodeType.Call;
	name: string;
	args: Node[];
};

type Node = NumberNode | StringNode | BinaryNode | CallNode;

const test = (n: Node): string => {
	switch (n.type) {
		case NodeType.Number:
			return n.value;
		case NodeType.String:
			return n.value;
		case NodeType.Binary:
			return n.value.map(test).join(' | ');
		case NodeType.Call:
			return n.name;
	}
};

type AST = {
	type: 'Program';
	body: Node;
};

const decorate = (str: string, prefix = '|--'): string => {
	return `${prefix} ${str}\n`;
};

const printNumber = (node: NumberNode, prefix?: string): string => {
	return decorate('Number ' + node.value, prefix);
};

const printString = (node: StringNode, prefix?: string): string => {
	const trim = (str: string) =>
		`"${str.length >= 10 ? `${str.slice(0, 7)}...` : str}"`;
	return decorate('String ' + trim(node.value), prefix);
};

const indent = (spaces: number, prefix?: string) => {
	return ' '.repeat(spaces) + (prefix ?? '');
};

const printBinary = (node: BinaryNode, prefix?: string): string => {
	const leafName = decorate('Binary', prefix);
	console.log({ prefix });
	const operator = decorate(`Operator "${node.operator}"`, indent(4, prefix));
	let left = decorate('Left', indent(4, prefix));
	left += tree(node.value[0], indent(8, '|' + prefix?.slice(1)));
	let right = decorate('Right', indent(4, prefix));
	right += tree(node.value[1], indent(8, prefix));

	return leafName + operator + left + right;
};

const printCall = (node: CallNode, prefix?: string): string => {
	const leafName = decorate('Call', prefix);
	const name = decorate(`Name "${node.name}"`, indent(4, prefix));
	const args = node.args.map((n, i, a) => {
		if (i !== a.length - 1) {
			return tree(n, indent(4, '|--'));
		}
		return tree(n, indent(4, prefix));
	});

	// const last = node.args.at(-1) as Node;
	// const first = node.args.slice(0, -1);

	// const args = first.map((n) => tree(n, indent(4, '|' + prefix?.slice(1))));
	// args.push(tree(last, indent(4, prefix)));

	return leafName + name + args.join('');
};

export const tree = (node: Node, prefix = '|--'): string => {
	switch (node.type) {
		case NodeType.Number:
			return printNumber(node, prefix);
		case NodeType.String:
			return printString(node, prefix);
		case NodeType.Binary:
			return printBinary(node, prefix);
		case NodeType.Call:
			return printCall(node, prefix);
	}
};

export const number: NumberNode = {
	type: NodeType.Number,
	value: '22'
};

const number33: NumberNode = {
	type: NodeType.Number,
	value: '33'
};

export const binary: BinaryNode = {
	type: NodeType.Binary,
	operator: '+',
	value: [number, number33]
};

const binaryMinus: BinaryNode = {
	type: NodeType.Binary,
	operator: '-',
	value: [number, number33]
};

export const call: CallNode = {
	type: NodeType.Call,
	name: 'SUM',
	args: [binary, binaryMinus]
};

`
Program
|-- Body
    |-- BinaryNode
        |-- Operator "*"
        |-- Left
        |   |-- CallNode
        |       |-- name "SUM"
        |       |-- Number 22
        |       |-- CallNode
        |           |-- name "SUM"
        |           |-- Number 1
        |           |-- Number 4
        |-- Right
            |-- Number 78
`;
