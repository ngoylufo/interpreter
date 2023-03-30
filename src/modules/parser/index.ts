import type Channel from "$channels";

import { CustomError } from "$utils";
import * as utils from "./utils";

const IDENTIFIERS = ["DATE", "TIMESTAMP"];
const CONSTANTS = ["PI"];

export class ParseError extends CustomError {
	lexeme: Lexer.Lexeme;

	constructor(
		lexeme: Lexer.Lexeme,
		message: string,
		{ cause }: { cause?: unknown } = {}
	) {
		super(message, { cause });
		this.lexeme = lexeme;
	}
}

export class InvalidRange extends ParseError {
	constructor(lexeme: Lexer.Lexeme, message: string) {
		super(lexeme, message);
	}
}

const parse_expression = async (parser: Parser): Promise<Parser.Node> => {
	return await parse_term(parser);
};

const parse_term = async (parser: Parser): Promise<Parser.Node> => {
	const left = await parse_factor(parser);

	if ((await parser.expects("PLUS")) && (await parser.consume("PLUS"))) {
		return utils.create_binary_node("+", left, await parse_term(parser));
	}

	if ((await parser.expects("MINUS")) && (await parser.consume("MINUS"))) {
		return utils.create_binary_node("-", left, await parse_term(parser));
	}

	return left;
};

const parse_factor = async (parser: Parser): Promise<Parser.Node> => {
	const left = await parse_unary(parser);

	if (
		(await parser.expects("MULTIPLY")) &&
		(await parser.consume("MULTIPLY"))
	) {
		const right = await parse_expression(parser);
		if (left.type === "Number" && right.type === "Number") {
			return { type: "Number", value: left.value * right.value };
		}
		return utils.create_binary_node("*", left, right);
	}

	if ((await parser.expects("DIVIDE")) && (await parser.consume("DIVIDE"))) {
		const right = await parse_expression(parser);
		if (left.type === "Number" && right.type === "Number") {
			if (+right.value === 0) {
				throw new ParseError(
					parser.current(),
					"Why are you trying to divide by zero?"
				);
			}
			return { type: "Number", value: +left.value / +right.value };
		}
		return utils.create_binary_node("/", left, right);
	}

	if ((await parser.expects("COLON")) && (await parser.consume("COLON"))) {
		// TODO: Throw better error messages for invalid range expressions

		// const invalid_range_start = (given: string, got: string) => {
		// 	throw new InvalidRange(
		// 		parser.current(),
		// 		`START should be of type ${given}, but was of type ${got}.`
		// 	);
		// };

		const invalid_range_end = (given: string, got: string) => {
			throw new InvalidRange(
				parser.current(),
				`END should be of type ${given}, given START was of type ${given},` +
					` but was of type ${got}.`
			);
		};

		if (left.type === "Cell") {
			const right = await parse_unary(parser);
			// InvalidRangeError::RangeEndType
			try {
				return utils.create_range_node(left, utils.expected(right, "Cell"));
			} catch (error) {
				if (error instanceof Error) {
					const type = error.message.split(" ").reverse().at(0)!;
					invalid_range_end(left.type, type);
				}
				throw new ParseError(parser.current(), "Unknown Error During Parsing", {
					cause: error
				});
			}
		}

		if (left.type === "Number") {
			const right = await parse_unary(parser);
			try {
				return utils.create_range_node(left, utils.expected(right, "Number"));
			} catch (error: unknown) {
				if (error instanceof Error) {
					const type = error.message.split(" ").reverse().at(0)!;
					invalid_range_end(left.type, type);
				}
				throw new ParseError(parser.current(), "Unknown Error During Parsing", {
					cause: error
				});
			}
		}

		// InvalidRangeError::RangeStartType
		throw new ParseError(
			parser.current(),
			"Invalid Range: START should be one of Cell or Number"
		);
	}

	return left;
};

const parse_unary = async (parser: Parser): Promise<Parser.Node> => {
	if ((await parser.expects("PLUS")) && (await parser.consume("PLUS"))) {
		// invalidate_unary(await parse_call(parser), 'STRING');
		const right = await parse_call(parser);
		if (right.type === "Number") {
			return { type: "Number", value: right.value * 1 };
		}
		return utils.create_unary_node("+", right);
	}

	if ((await parser.expects("MINUS")) && (await parser.consume("MINUS"))) {
		const right = await parse_call(parser);
		if (right.type === "Number") {
			return { type: "Number", value: right.value * -1 };
		}
		return utils.create_unary_node("-", right);
	}

	return parse_call(parser);
};

const parse_call = async (parser: Parser): Promise<Parser.Node> => {
	const node = await parse_primary(parser);

	if (node.type === "Identifier") {
		if (
			(await parser.expects("LEFT_PARENS")) &&
			(await parser.consume("LEFT_PARENS"))
		) {
			const args = await parse_arguments(parser);
			return (
				parser.consume("RIGHT_PARENS"), utils.create_call_node(node.name, args)
			);
		}

		const is_cell_name = (a: string): a is Parser.CellNode["name"] => {
			return /^([A-Z]+[0-9]+)$/.test(a);
		};

		if (is_cell_name(node.name)) {
			return { type: "Cell", name: node.name };
		}

		if (CONSTANTS.includes(node.name)) {
			return { type: "Constant", name: node.name };
		}

		if (IDENTIFIERS.includes(node.name)) {
			return utils.create_call_node(node.name);
		}
	}

	return node;
};

const parse_arguments = async (parser: Parser): Promise<Parser.Node[]> => {
	const args = [await parse_expression(parser)];
	while ((await parser.expects("COMMA")) && (await parser.consume("COMMA"))) {
		args.push(await parse_expression(parser));
	}
	return args;
};

const parse_primary = async (parser: Parser): Promise<Parser.Node> => {
	if (
		(await parser.expects("LEFT_PARENS")) &&
		(await parser.consume("LEFT_PARENS"))
	) {
		const node: Parser.GroupNode = {
			type: "Group",
			expr: await parse_expression(parser)
		};
		return parser.consume("RIGHT_PARENS"), node;
	}

	if (await parser.expects("IDENTIFIER")) {
		const { value: name } = await parser.consume("IDENTIFIER");

		return { type: "Identifier", name: name as string };
	}

	if (await parser.expects("TEXT")) {
		const { value } = await parser.consume("TEXT");
		return { type: "Text", value: `${value}` };
	}

	if (await parser.expects("STRING")) {
		const { value } = await parser.consume("STRING");
		return { type: "String", value: `${value}` };
	}

	if (await parser.expects("NUMBER")) {
		const { value } = await parser.consume("NUMBER");
		return { type: "Number", value: parseFloat(value as string) };
	}

	throw new ParseError(
		parser.current(),
		`Unexpected token type: ${parser.current()}`
	);
};

export default class Parser {
	private chan!: Channel<Lexer.Lexeme>;
	private lexeme!: Lexer.Lexeme;

	async next(): Promise<Lexer.Lexeme> {
		return (this.lexeme = await this.chan.pop());
	}

	current() {
		return this.lexeme;
	}

	eof(): boolean {
		return this.current()?.type === "EOF";
	}

	async peek(_: number): Promise<Lexer.Lexeme> {
		return await this.chan.peek();
	}

	async expects(type: Lexer.LexemeType): Promise<boolean> {
		return (await this.peek(0))?.type === type;
	}

	async consume(type?: Lexer.LexemeType): Promise<Lexer.Lexeme> {
		const lexeme = await this.next();
		if (lexeme === undefined) {
			throw new ParseError(
				this.current(),
				`Expected a token but got ${lexeme}`
			);
		}
		if (type && lexeme.type !== type) {
			throw new ParseError(
				this.current(),
				`Expected token of type ${type} but got ${lexeme.type}`
			);
		}
		return lexeme;
	}

	async parse(chan: Channel<Lexer.Lexeme>): Promise<Parser.SyntaxTree> {
		this.chan = chan;
		return { type: "Program", body: await parse_expression(this) };
	}
}
