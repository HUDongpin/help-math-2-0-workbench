import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next-local-reference-diagnostic/**",
    ".next-*-package*/**",
    "candidate-assets/**",
    "public/flash-assets/**",
    "server-assets/**",
    "next-env.d.ts",
  ]),
]);
