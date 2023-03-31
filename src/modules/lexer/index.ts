import type Channel from "$channels";
import { CustomError } from "$utils";

type LexFn = void | ((lexer: Lexer) => Promise<LexFn>);

const symbols: Map<string, Lexer.LexemeType> = new Map([
	["(", "LEFT_PARENS"],
	[")", "RIGHT_PARENS"],
	["+", "PLUS"],
	["-", "MINUS"],
	["*", "MULTIPLY"],
	["/", "DIVIDE"],
	[":", "COLON"],
	[",", "COMMA"]
]);

export class LexerError extends CustomError {
	index: number;

	constructor(index: number, message: string) {
		super(message);
		this.index = index;
	}
}

export class UnexpectedCharacter extends LexerError {
	constructor(index: number, message: string) {
		super(index, message);
	}
}

const lex_text: LexFn = async (lexer) => {
	if (lexer.expects("=") && lexer.consume("=")) {
		return lex_next_token;
	}

	await lexer.add("TEXT", lexer.dump());
	return void (await lexer.add("EOF"));
};

const lex_next_token: LexFn = async (lexer) => {
	if (!lexer.peek(0) && lexer.eof()) {
		return void (await lexer.add("EOF"));
	}

	if (lexer.peek(0).match(/\s/) && lexer.consume()) {
		return lex_next_token;
	}

	if (lexer.peek(0) === '"' && lexer.consume('"')) {
		return lex_string_token;
	}

	if (symbols.has(lexer.peek(0)) && lexer.consume()) {
		return lex_symbol_token;
	}

	if (lexer.peek(0).match(/[0-9\.]/)) {
		return lex_number_token;
	}

	if (lexer.peek(0).match(/[A-Za-z_]/)) {
		return lex_identifier_token;
	}

	return lexer.error(`"${lexer.peek(0)}"`);
};

const lex_string_token = async (lexer: Lexer) => {
	let value = lexer.next();
	while (!lexer.eof() && !lexer.expects('"')) {
		value += lexer.next();
	}
	lexer.consume('"');
	await lexer.add("STRING", value);
	return lex_next_token;
};

const lex_symbol_token = async (lexer: Lexer) => {
	const type = symbols.get(lexer.current());

	if (type) {
		await lexer.add(type);
		return lex_next_token;
	}

	return lexer.error(`Expected a symbol but got "${lexer.peek(0)}"`);
};

const lex_number_token = async (lexer: Lexer) => {
	let value = lexer.next();
	while (!lexer.eof() && lexer.peek(0).match(/[0-9\.]/)) {
		value += lexer.next();
	}

	await lexer.add("NUMBER", value);
	return lex_next_token;
};

const lex_identifier_token = async (lexer: Lexer) => {
	let value = lexer.next();
	while (!lexer.eof() && lexer.peek(0).match(/[_a-zA-Z0-9]/)) {
		value += lexer.next();
	}
	await lexer.add("IDENTIFIER", value);
	return lex_next_token;
};

export default class Lexer {
	private chan!: Channel<Lexer.Lexeme>;
	private lexemes: Lexer.Lexeme[] = [];
	private source: string = "";
	private idx = 0;

	error(message: string): asserts message {
		throw new UnexpectedCharacter(this.idx, message);
	}

	next(): string {
		return this.source[this.idx++];
	}

	current(): string {
		return this.source[this.idx - 1];
	}

	peek(offset: number): string {
		const index = this.idx + offset;
		if (index < 0 || index > this.source.length) {
			const min = this.idx ? -this.idx : this.idx;
			const max = this.idx + (this.source.length - this.idx);

			throw Error(`Lexer peek offset ${offset} out of bounds. Should be between ${min} and ${max}`);
		}

		return this.source[index];
	}

	expects(character: string): boolean {
		return this.peek(0) === character;
	}

	consume(expected?: string): string {
		const character = this.next();
		if (expected && character !== expected) {
			this.error(`Expected "${expected}" but got "${character}":`);
		}
		return character;
	}

	async add(type: Lexer.LexemeType, value?: string): Promise<void> {
		if (type === "EOF") {
			await this.chan.push({ idx: this.idx, length: 0, type, value });
			return this.chan.close();
		}

		const length = value ? `${value}`.length : 1;
		await this.chan.push({ idx: this.idx - length, length, type, value });
	}

	eof(): boolean {
		return this.idx >= this.source.length;
	}

	dump(): string {
		this.idx = this.source.length;
		return this.source;
	}

	async lex(chan: Channel<Lexer.Lexeme>, source: string) {
		let lex: LexFn = lex_text;

		this.source = source;
		this.chan = chan;
		this.idx = 0;

		while (lex) {
			lex = await lex(this);
		}

		return this.lexemes;
	}
}
