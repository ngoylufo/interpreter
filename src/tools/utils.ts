type Callable = (...args: never[]) => unknown;

type Serializer = (args: never[]) => string;

export const memoize = <T extends Callable>(
	callback: T,
	serializer: Serializer = JSON.stringify
): T => {
	const cache: { [x: string]: unknown } = {};

	return ((...args: never[]) => {
		const key = serializer(args);
		return cache[key] ?? (cache[key] = callback(...args));
	}) as unknown as T;
};

type UnfoldCallback<A, B> = (a: A) => [B, A] | null;

export const unfold = <A, B>(fn: UnfoldCallback<A, B>, seed: A): B[] => {
	const accumulated: B[] = [];
	let result = fn(seed);

	while (result) {
		accumulated.push(result[0]);
		result = fn(result[1]);
	}

	return accumulated;
};
