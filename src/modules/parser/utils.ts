export const expected = (
	node: Parser.Node,
	...types: Parser.Node["type"][]
) => {
	if (types.length > 1) {
		const valid = types.some((type) => node.type === type);

		if (!valid) {
			const [fst, lst] = [types.slice(0, -1).join(", "), types.at(-1)];

			throw new Error(
				`Expected token to be either of type ${fst} or ${lst} but was ${node.type}.`
			);
		}
	} else if (node.type !== types[0]) {
		throw new Error(`Expected token of type ${types[0]} but was ${node.type}`);
	}
	return node;
};

export const create_binary_node = (
	op: Parser.BinaryNode["op"],
	left: Parser.Node,
	right: Parser.Node
): Parser.BinaryNode => {
	return { type: "Binary", op, left, right };
};

export const create_range_node = (
	left: Parser.Node,
	right: Parser.Node
): Parser.RangeNode => {
	return { op: ":", left, right, type: "Range" };
};

export const create_unary_node = (
	op: Parser.UnaryNode["op"],
	right: Parser.Node
): Parser.UnaryNode => {
	return { type: "Unary", op, right };
};

export const create_call_node = (
	name: string,
	args: Parser.Node[] = []
): Parser.CallNode => {
	return { type: "Call", name, args };
};

export const resolve_unary_node = (node: Parser.UnaryNode): Parser.Node => {
	let resolved: Parser.Node = node;
	while (resolved.type === "Unary") {
		resolved = resolved.right;
	}
	return resolved;
};

export const resolve_group_node = (node: Parser.GroupNode): Parser.Node => {
	let resolved: Parser.Node = node;
	while (resolved.type === "Group") {
		resolved = resolved.expr;
	}
	return resolved;
};

export const validate_group = (
	node: Parser.Node,
	...types: Parser.Node["type"][]
) => {
	if (node.type === "Group") {
		const expr = resolve_group_node(node);
		return expected(expr, ...types);
	}
	// TODO: Better error message for this validation function;
	return expected(node, "Group");
};

export const validate_unary = (
	node: Parser.Node,
	...types: Parser.Node["type"][]
): Parser.Node => {
	if (node.type === "Unary") {
		const right = resolve_unary_node(node);
		return expected(right, ...types);
	}
	// TODO: Better error message for this validation function;
	return expected(node, "Unary");
};

export const invalidate_unary = (
	node: Parser.Node,
	...types: Parser.Node["type"][]
): Parser.Node => {
	if (node.type === "Unary") {
		const right = resolve_unary_node(node);
		try {
			expected(right, ...types);
			throw new Error(
				`Expected token of type ${types[0]} but was ${node.type}`
			);
		} catch {
			return node;
		}
	}
	// TODO: Better error message for this validation function;
	return expected(node, "Unary");
};
