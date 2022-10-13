declare namespace Lexer {
	export type LexemeType =
		| "TEXT"
		| "STRING"
		| "NUMBER"
		| "FUNCTION"
		| "IDENTIFIER"
		| "LEFT_PARENS"
		| "RIGHT_PARENS"
		| "COLON"
		| "COMMA"
		| "PLUS"
		| "MINUS"
		| "DIVIDE"
		| "MULTIPLY"
		| "EQUAL"
		| "GREATER_THAN"
		| "GREATER_THAN_EQUAL"
		| "LESSER_THAN"
		| "LESSER_THAN_EQUAL"
		| "EOF";

	export type Lexeme = {
		idx: number;
		length: number;
		type: LexemeType;
		value?: number | string;
	};
}

declare namespace Parser {
	export type Node =
		| TextNode
		| StringNode
		| NumberNode
		| ConstantNode
		| IdentifierNode
		| CellNode
		| UnaryNode
		| BinaryNode
		| RangeNode
		| GroupNode
		| CallNode;

	export type SyntaxTree = {
		type: "Program";
		body: Node;
	};

	export type TextNode = {
		type: "Text";
		value: string;
	};

	export type StringNode = {
		type: "String";
		value: string;
	};

	export type NumberNode = {
		type: "Number";
		value: number;
	};

	export type ConstantNode = {
		type: "Constant";
		name: string;
	};

	export type IdentifierNode = {
		type: "Identifier";
		name: string;
	};

	export type CellNode = {
		type: "Cell";
		name: `${string}${number}`;
	};

	export type UnaryNode = {
		type: "Unary";
		op: "+" | "-";
		right: Node;
	};

	export type BinaryNode = {
		type: "Binary";
		op: "+" | "-" | "/" | "*";
		left: Node;
		right: Node;
	};

	export type RangeNode = {
		type: "Range";
		op: ":";
		left: Node;
		right: Node;
	};

	export type GroupNode = {
		type: "Group";
		expr: Node;
	};

	export type CallNode = {
		type: "Call";
		name: string;
		args: Node[];
	};
}
