#!/usr/bin/env node

import path from "node:path";
import {fileURLToPath} from "node:url";

import {main as runSuccessorBuilder} from "./build-fla-swf-counterpart-successor-plan.mjs";

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  return "node scripts/check-fla-swf-counterpart-successor-review.mjs --ledger <immutable-signed-ledger.json>";
}

function parseArguments(argv) {
  if (argv.includes("--help") || argv.includes("-h")) return {help: true};
  if (argv.length !== 2 || argv[0] !== "--ledger" || !argv[1]) {
    throw new Error(usage());
  }
  return {ledger: path.resolve(argv[1])};
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  await runSuccessorBuilder([
    "--validate-review",
    "--review-ledger",
    options.ledger,
  ]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
