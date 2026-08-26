#!/usr/bin/env node

import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  PACKAGE_ID,
  runGenerator,
  stableJson,
} from "./lib/g5-l4-v7-final-successors.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");

export async function main(argv = process.argv.slice(2)) {
  const result = await runGenerator({
    kind: "owner",
    projectRoot: PROJECT_ROOT,
    argv,
  });
  process.stdout.write(stableJson({
    ...result,
    packageId: PACKAGE_ID,
    namedPrimaryOperator: "Dr. Peter Hu",
    exactSessionDeclarationEstablished: false,
    strictCompleteCount: 0,
    published: false,
    strictAcceptanceEffect: "none",
  }));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
