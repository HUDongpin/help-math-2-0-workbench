import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next-current-js-candidate-qa/**",
    ".next-local-reference-diagnostic/**",
    ".next-*-package*/**",
    "candidate-assets/flash-assets/**",
    "public/flash-assets/**",
    "next-env.d.ts",
  ]),
]);
