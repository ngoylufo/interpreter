type BaseNode = {
	type: string;
};

export interface AST extends BaseNode {
	type: 'Program';
	body: Node;
}

export interface StringNode extends BaseNode {
	type: 'String';
	value: string;
}

export interface NumberNode extends BaseNode {
	type: 'Number';
	value: number;
}

export interface IdentifierNode extends BaseNode {
	type: 'IdentifierNode';
	value: string;
}

export interface CellNode extends BaseNode {
	type: 'CellNode';
	value: string;
}

export interface CallNode extends BaseNode {
	type: 'CallNode';
	name: string;
	args: Node[];
}

export interface BinaryNode extends BaseNode {
	type: 'BinaryNode';
	operator: '+' | '-' | '/' | '*';
	left: Node;
	right: Node;
}

export interface CellRangeNode extends BaseNode {
	type: 'CellRangeNode';
	operator: ':';
	left: CellNode;
	right: CellNode;
}

export interface UnaryNode extends BaseNode {
	type: 'UnaryNode';
	operator: '-' | '+';
	right: Node;
}

export interface GroupNode extends BaseNode {
	type: 'GroupNode';
	expr: Node;
}

export type Node =
	| NumberNode
	| StringNode
	| IdentifierNode
	| CellNode
	| GroupNode
	| UnaryNode
	| CellRangeNode
	| BinaryNode
	| CallNode;
