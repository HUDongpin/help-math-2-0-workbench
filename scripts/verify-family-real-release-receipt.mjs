#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {
  parseBoundedJson,
  verifyFamilyRealReleaseReceipt,
} from './lib/family-real-release-receipt-v1.mjs';

const execFileAsync = promisify(execFile);
const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null;
}

const allowed = new Set(['--receipt', '--evidence-root', '--trust-roots']);
const validArguments = args.length === 6
  && args.every((value, index) => index % 2 === 1 || allowed.has(value))
  && [...allowed].every((name) => args.filter((value) => value === name).length === 1);

async function gitState() {
  const [{stdout: commit}, {stdout: status}] = await Promise.all([
    execFileAsync('git', ['rev-parse', 'HEAD'], {maxBuffer: 64 * 1024}),
    execFileAsync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
      maxBuffer: 4 * 1024 * 1024,
    }),
  ]);
  return {commit: commit.trim(), clean: status.length === 0};
}

let report = {
  checks: [{
    id: 'invocation',
    passed: false,
    requirement: 'Provide exactly --receipt, --evidence-root and --trust-roots.',
  }],
  disposition: 'REAL_FAMILY_RELEASE_RECEIPT_INVALID',
  releaseReceiptValid: false,
  secretValuesIncluded: false,
};

if (validArguments) {
  try {
    const receiptPath = path.resolve(argument('--receipt'));
    const trustRootsPath = path.resolve(argument('--trust-roots'));
    const evidenceRoot = path.resolve(argument('--evidence-root'));
    const [receiptText, trustRootsText, git] = await Promise.all([
      readFile(receiptPath, 'utf8'),
      readFile(trustRootsPath, 'utf8'),
      gitState(),
    ]);
    report = await verifyFamilyRealReleaseReceipt({
      evidenceRoot,
      expectedGitCommit: git.commit,
      expectedTrustRootsSha256:
        process.env.FAMILY_REAL_RELEASE_TRUST_ROOTS_SHA256,
      receipt: parseBoundedJson(receiptText),
      trustRoots: parseBoundedJson(trustRootsText),
      trustRootsFileSha256: createHash('sha256')
        .update(trustRootsText)
        .digest('hex'),
      worktreeClean: git.clean,
    });
  } catch {
    // Keep the public result generic. Paths, evidence content, identities,
    // credentials and signature material must not enter logs.
  }
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.releaseReceiptValid ? 0 : 1;
