import { Token, TokenType } from './tokens';

type LexFn = ((lexer: Lexer) => LexFn) | void;

const symbols: Map<string, TokenType> = new Map([
	['(', 'LEFT_PARENS'],
	[')', 'RIGHT_PARENS'],
	['+', 'PLUS'],
	['-', 'MINUS'],
	['*', 'MULTIPLY'],
	['/', 'DIVIDE'],
	[':', 'COLON'],
	[',', 'COMMA']
]);

const lexText: LexFn = (lexer) => {
	const character = lexer.next();

	if (character === '=') {
		return lexNextToken;
	}

	let value = character;
	while (!lexer.eof()) {
		value += lexer.next();
	}
	lexer.add(new Token('STRING', value));
	lexer.add(new Token('EOF'));
};

const lexNextToken: LexFn = (lexer) => {
	const character = lexer.next();

	if (/\s/.test(character)) {
		return lexNextToken;
	}

	if (character === '"') {
		return lexStringToken;
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

	if (character === undefined && lexer.eof()) {
		lexer.add(new Token('EOF'));
	} else {
		throw new Error(`Unexpected character: "${character}"`);
	}
};

const lexStringToken: LexFn = (lexer) => {
	let value = lexer.next();
	while (!lexer.eof() && lexer.peek() !== '"') {
		value += lexer.next();
	}
	lexer.add(new Token('STRING', value));
	lexer.consume('"');
	return lexNextToken;
};

const lexSymbolToken: LexFn = (lexer) => {
	const character = lexer.current();
	const tokenType = symbols.get(character);

	if (tokenType) {
		return lexer.add(new Token(tokenType)), lexNextToken;
	}

	throw new Error(
		`Unexpected character: Expected a symbol but got "${character}"`
	);
};

const lexNumberToken: LexFn = (lexer) => {
	let value = lexer.current();

	while (!lexer.eof() && /[0-9.]/.test(lexer.peek())) {
		value += lexer.next();
	}

	if (value.endsWith('.')) {
		throw new Error(`Badly formatted number: "${value}"`);
	}

	lexer.add(new Token('NUMBER', value));
	return lexNextToken;
};

const lexIdentifierToken: LexFn = (lexer) => {
	let value = lexer.current();

	while (!lexer.eof() && /[A-Z0-9]/.test(lexer.peek())) {
		value += lexer.next();
	}

	lexer.add(new Token('IDENTIFIER', value));
	return lexNextToken;
};

export default class Lexer {
	private index = 0;
	private source: string;
	private tokens: Token[] = [];

	constructor(source: string) {
		this.source = source;
	}

	next(): string {
		return this.source[this.index++];
	}

	peek(offset = 0): string {
		return this.source[this.index + offset];
	}

	current(): string {
		return this.source[this.index - 1];
	}

	consume(expected: string): void {
		const character = this.next();
		if (character !== expected) {
			throw new Error(
				`Unexpected character: Expected "${expected}" but got "${character}"`
			);
		}
	}

	add(token: Token): void {
		this.tokens.push(token);
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
