// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import dev from 'rollup-plugin-dev'

const packageJson = require("./package.json");

export default [
  {
    input: "src/components/index.ts",
    output: [
      {
        file: packageJson.exports,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      dev(),
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
      postcss(),
    ],
    external: ["react", "react-dom", /\.css$/],
  },
  {
    input: "src/components/index.ts",
    output: [{ file: "dist/types.d.ts", format: "es" }],
    plugins: [dts.default()],
  },
];
