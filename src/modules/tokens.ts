export type TokenType =
	| 'STRING'
	| 'NUMBER'
	| 'FUNCTION'
	| 'IDENTIFIER'
	| 'LEFT_PARENS'
	| 'RIGHT_PARENS'
	| 'COLON'
	| 'COMMA'
	| 'PLUS'
	| 'MINUS'
	| 'DIVIDE'
	| 'MULTIPLY'
	| 'EQUALS'
	| 'EOF';

export class Token {
	readonly type: TokenType;
	readonly value: string | null;

	constructor(type: TokenType, value: string | null = null) {
		this.type = type;
		this.value = value;
	}

	print(): string {
		return `${this.type}${this.value ? `:${this.value}` : ''}`;
	}
}
