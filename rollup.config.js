import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/main.ts",
	output: { format: "esm", file: "main.js", sourcemap: true },
	plugins: [commonjs(), typescript({ tsconfig: "./tsconfig.json" })]
};
