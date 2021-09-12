import { Token, TokenType } from './tokens';

type LexFn = ((lexer: Lexer) => LexFn) | void;

const lexText: LexFn = (lexer) => {
	const character = lexer.next();

	if (character === '=') {
		return lexNextToken;
	}

	let value = character;
	while (!lexer.eof()) {
		value += lexer.next();
	}
	lexer.push('STRING', value);
	lexer.push('EOF');
};

const lexNextToken: LexFn = (lexer) => {
	const character = lexer.next();

	if (character === undefined && lexer.eof()) {
		return lexer.push('EOF');
	}

	if (/\s/.test(character)) {
		return lexNextToken;
	}

	if ('"' === character) {
		return lexString;
	}

	if ('( + - : , / * )'.includes(character)) {
		return lexSymbolToken;
	}

	if (/[0-9]/.test(character)) {
		return lexNumberToken;
	}

	if (/[A-Z]/.test(character)) {
		return lexIdentifierToken;
	}

	throw new Error(`Unexpected character: "${character}".`);
};

const lexString: LexFn = (lexer) => {
	let value = lexer.next();
	while (!lexer.eof() && lexer.peek() !== '"') {
		value += lexer.next();
	}
	lexer.push('STRING', value);
	lexer.consume('"');
	return lexNextToken;
};

const lexSymbolToken: LexFn = (lexer) => {
	const character = lexer.current();

	if (character === '(') {
		lexer.push('LEFT_PARENS');
	}

	if (character === ')') {
		lexer.push('RIGHT_PARENS');
	}

	if (character === ':') {
		lexer.push('COLON');
	}

	if (character === ',') {
		lexer.push('COMMA');
	}

	if (character === '+') {
		lexer.push('PLUS');
	}

	if (character === '-') {
		lexer.push('MINUS');
	}

	if (character === '/') {
		lexer.push('DIVIDE');
	}

	if (character === '*') {
		lexer.push('MULTIPLY');
	}

	return lexNextToken;
};

const lexNumberToken: LexFn = (lexer) => {
	let value = lexer.current();

	while (!lexer.eof() && /[0-9.]/.test(lexer.peek())) {
		value += lexer.next();
	}

	if (value.endsWith('.')) {
		throw new Error(`Lexing Error: Badly formatted number: "${value}".`);
	}

	return lexer.push('NUMBER', value), lexNextToken;
};

const lexIdentifierToken: LexFn = (lexer) => {
	let value = lexer.current();
	while (!lexer.eof() && /[A-Z0-9]/.test(lexer.peek())) {
		value += lexer.next();
	}
	return lexer.push('IDENTIFIER', value), lexNextToken;
};

export default class Lexer {
	private index = 0;
	private source: string;
	private tokens: Token[] = [];

	constructor(source: string) {
		this.source = source;
	}

	peek(): string {
		return this.source[this.index];
	}

	next(): string {
		return this.source[this.index++];
	}

	current(): string {
		return this.source[this.index - 1];
	}

	push(type: TokenType, value: string | null = null) {
		this.tokens.push(new Token(type, value));
	}

	consume(next: string) {
		if (this.next() !== next) {
			throw new Error(`Expected "${next}" but got "${this.current()}"`);
		}
	}

	eof(): boolean {
		return this.index >= this.source.length;
	}

	lex(): Token[] {
		let lex: LexFn = lexText;
		while (lex) {
			lex = lex(this);
		}
		return this.tokens;
	}
}
