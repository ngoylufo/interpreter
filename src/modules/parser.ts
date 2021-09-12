import { Node, AST, NumberNode, StringNode, GroupNode, CallNode } from './ast';
import { Token, TokenType } from './tokens';

type ParseFn = ((parser: Parser) => ParseFn) | void;

const parseExpression = (parser: Parser): Node => {
	return parseTerm(parser);
};

const parseTerm = (parser: Parser): Node => {
	const node: Node = parseFactor(parser);
	const symbols: [TokenType, TokenType] = ['PLUS', 'MINUS'];

	while (symbols.includes(parser.peek().type)) {
		if (parser.peek().type === 'PLUS') {
			parser.consume('PLUS');

			return {
				type: 'BinaryNode',
				operator: '+',
				left: node,
				right: parseExpression(parser)
			};
		}

		if (parser.peek().type === 'MINUS') {
			parser.consume('MINUS');

			return {
				type: 'BinaryNode',
				operator: '-',
				left: node,
				right: parseExpression(parser)
			};
		}
	}

	return node;
};

const parseFactor = (parser: Parser): Node => {
	const node: Node = parseUnary(parser);
	const symbols: TokenType[] = ['MULTIPLY', 'DIVIDE', 'COLON'];

	while (symbols.includes(parser.peek().type)) {
		if (parser.peek().type === 'MULTIPLY') {
			parser.consume('MULTIPLY');
			const n: Node = {
				type: 'BinaryNode',
				operator: '*',
				left: node,
				right: parseExpression(parser)
			};

			return n;
		}

		if (parser.peek().type === 'DIVIDE') {
			parser.consume('DIVIDE');

			return {
				type: 'BinaryNode',
				operator: '/',
				left: node,
				right: parseExpression(parser)
			};
		}

		if (node.type === 'CellNode' && parser.peek().type === 'COLON') {
			parser.consume('COLON');
			const right = parseUnary(parser);

			if (right.type === 'CellNode') {
				return { type: 'CellRangeNode', operator: ':', left: node, right };
			}

			throw new Error(
				`Expected a cell reference after ":", got ${right.type}.`
			);
		}
	}

	return node;
};

const parseUnary = (parser: Parser): Node => {
	if (parser.peek().type === 'MINUS') {
		parser.consume('MINUS');

		return {
			type: 'UnaryNode',
			operator: '-',
			right: parseCall(parser)
		};
	}

	if (parser.peek().type === 'PLUS') {
		parser.consume('PLUS');

		return {
			type: 'UnaryNode',
			operator: '+',
			right: parseCall(parser)
		};
	}

	return parseCall(parser);
};

const parseCall = (parser: Parser): Node => {
	const node = parsePrimary(parser);

	if (node.type === 'IdentifierNode') {
		if (parser.peek().type === 'LEFT_PARENS') {
			parser.consume('LEFT_PARENS');
			const call: CallNode = {
				type: 'CallNode',
				name: node.value,
				args: [parseExpression(parser)]
			};

			while (parser.peek().type == 'COMMA') {
				parser.consume('COMMA');
				call.args.push(parseExpression(parser));
			}
			parser.consume('RIGHT_PARENS');

			return call;
		}

		const CELL = /^([A-Z]+[0-9]+)$/;
		if (CELL.test(node.value as string)) {
			return { type: 'CellNode', value: node.value as string };
		}
		throw new Error(`"${node.value}" is not a valid cell reference.`);
	}

	return node;
};

const parsePrimary = (parser: Parser): Node => {
	if (parser.peek().type === 'NUMBER') {
		const node: NumberNode = {
			type: 'Number',
			value: parseFloat(parser.consume('NUMBER').value as string)
		};
		return node;
	}

	if (parser.peek().type === 'STRING') {
		const node: StringNode = {
			type: 'String',
			value: parser.consume('STRING').value as string
		};
		return node;
	}

	if (parser.peek().type === 'IDENTIFIER') {
		const { value } = parser.consume('IDENTIFIER');
		return { type: 'IdentifierNode', value: value as string };
	}

	if (parser.peek().type === 'LEFT_PARENS') {
		parser.consume('LEFT_PARENS');
		const node: GroupNode = {
			type: 'GroupNode',
			expr: parseExpression(parser)
		};
		parser.consume('RIGHT_PARENS');
		return node;
	}

	throw new Error(`Primary: Unexpected token type: ${parser.peek().type}`);
};

export default class Parser {
	private index = 0;
	private tokens: Token[];

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	current(): Token {
		return this.tokens[this.index - 1];
	}

	peek(offset = 0): Token {
		return this.tokens[this.index + offset];
	}

	next(): Token {
		return this.tokens[this.index++];
	}

	consume(type: TokenType): Token {
		const token = this.tokens.shift() as Token;
		if (token && token.type === type) {
			return token;
		}
		throw new Error(`Expected token type ${type} but got ${token.type}`);
	}

	parse(): AST {
		return {
			type: 'Program',
			body: parseExpression(this)
		};
	}
}
