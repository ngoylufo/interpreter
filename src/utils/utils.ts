export class CustomError extends Error {
	constructor(message: string, { cause }: { cause?: unknown } = {}) {
		super(message, { cause });
		this.name = this.constructor.name;
	}
}

export type UnfoldCallback<A, B> = (a: A) => [B, A] | null;

export const unfold = <A, B>(fn: UnfoldCallback<A, B>, seed: A): B[] => {
	const accumulated: B[] = [];
	let result = fn(seed);

	while (result) {
		accumulated.push(result[0]);
		result = fn(result[1]);
	}

	return accumulated;
};

export const report_lexeme = (source: string, lexeme: Lexer.Lexeme) => {
	const start = lexeme.idx > 25 ? lexeme.idx - 25 : 0;
	const length = lexeme.idx - start + lexeme.length;
	const decorator = "".padEnd(lexeme.idx - start).padEnd(length, "^");
	return `\n\t> ${source.slice(start, lexeme.idx + 25)}\n\t  ${decorator}`;
};

export const report_source = (source: string, idx: number) => {
	const start = idx > 10 ? idx - 10 : 0;
	const decorator = "".padStart(idx - start);
	return `\n\t> ${source.slice(start, idx + 10)}\n\t  ${decorator}^`;
};
