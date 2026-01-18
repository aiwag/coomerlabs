import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default defineConfig([
  {
    input: "src/main.ts",
    output: {
      file: ".vite/build/main.js",
      format: "cjs",
    },
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: ".vite/build",
      }),
      babel({
        extensions: [".ts", ".tsx"],
        exclude: "node_modules/**",
        presets: [
          ["@babel/preset-typescript", { jsxImportSource: "react" }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
        babelHelpers: "bundled",
      }),
    ],
    external: ["electron"],
  },
  {
    input: "src/preload.ts",
    output: {
      file: ".vite/build/preload.js",
      format: "cjs",
    },
    plugins: [
      resolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: ".vite/build",
      }),
      babel({
        extensions: [".ts", ".tsx"],
        exclude: "node_modules/**",
        presets: [
          ["@babel/preset-typescript", { jsxImportSource: "react" }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
        babelHelpers: "bundled",
      }),
    ],
    external: ["electron"],
  },
]);