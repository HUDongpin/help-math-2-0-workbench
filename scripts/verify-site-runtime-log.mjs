#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const MAXIMUM_UPDATE_DEPTH = 'Maximum update depth exceeded';

export function inspectSiteRuntimeLog(text, inputPath = '<memory>') {
  if (text.length === 0) {
    throw new Error(`Site runtime log is empty: ${inputPath}`);
  }
  const lines = text.split(/\r?\n/u);
  const matchingLines = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].includes(MAXIMUM_UPDATE_DEPTH)) matchingLines.push(index + 1);
  }
  const result = {
    schemaVersion: 'help-math-site-runtime-log-gate.v1',
    inputPath,
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
    lineCount: lines.length,
    maximumUpdateDepthCount: matchingLines.length,
    maximumUpdateDepthLines: matchingLines,
    status: matchingLines.length === 0 ? 'PASS' : 'FAIL',
  };
  if (matchingLines.length > 0) {
    throw new Error(`SITE_RUNTIME_LOG_GATE_FAIL ${JSON.stringify(result)}`);
  }
  return result;
}

export async function verifySiteRuntimeLog(inputPath) {
  const text = await readFile(inputPath, 'utf8');
  return inspectSiteRuntimeLog(text, inputPath);
}

async function main() {
  if (process.argv.length !== 3) {
    throw new Error('Usage: verify-site-runtime-log.mjs <complete-site-log>');
  }
  const result = await verifySiteRuntimeLog(process.argv[2]);
  process.stdout.write(`SITE_RUNTIME_LOG_GATE_PASS ${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
