#!/usr/bin/env node

import {lstat, readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";

import {verifyEvidenceReceiptV1} from "./lib/evidence-receipt-v1.mjs";

const EXPECTED_FLAGS = Object.freeze({
  "--expected-commit": "commitSha",
  "--expected-release-definition": "releaseDefinitionSha256",
  "--expected-source-manifest": "sourceManifestSha256",
  "--expected-renderer-registry": "rendererRegistrySha256",
  "--expected-completion-ledger": "completionLedgerSha256",
  "--expected-release-ledger": "releaseLedgerSha256",
});

export function usage() {
  return [
    "Usage:",
    "  node scripts/verify-evidence-receipt-v1.mjs \\",
    "    --receipt <receipt.json> --public-key <release-authority-ed25519.pem> \\",
    "    --expected-commit <git-sha> \\",
    "    --expected-release-definition <sha256> \\",
    "    --expected-source-manifest <sha256> \\",
    "    --expected-renderer-registry <sha256> \\",
    "    --expected-completion-ledger <sha256> \\",
    "    --expected-release-ledger <sha256> [--now <canonical-utc-iso>] [--json]",
    "",
    "This verifier checks closed receipt shape, Ed25519 integrity, expiry, and",
    "exact current hashes. It does not establish signer authority or revocation",
    "status; those remain production promotion protocol responsibilities.",
  ].join("\n");
}

export function parseArguments(argv) {
  const result = {json: false, expectedBindings: {}};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") {
      result.json = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      result.help = true;
      continue;
    }
    const knownValueFlags = new Set([
      "--receipt",
      "--public-key",
      "--now",
      ...Object.keys(EXPECTED_FLAGS),
    ]);
    if (!knownValueFlags.has(argument)) throw new Error(`unknown argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value`);
    index += 1;
    if (argument === "--receipt") result.receiptFile = value;
    else if (argument === "--public-key") result.publicKeyFile = value;
    else if (argument === "--now") result.now = value;
    else result.expectedBindings[EXPECTED_FLAGS[argument]] = value;
  }
  if (result.help) return result;
  if (!result.receiptFile) throw new Error("--receipt is required");
  if (!result.publicKeyFile) throw new Error("--public-key is required");
  for (const [flag, field] of Object.entries(EXPECTED_FLAGS)) {
    if (!result.expectedBindings[field]) throw new Error(`${flag} is required`);
  }
  return result;
}

async function readRegularFile(file, label) {
  const stat = await lstat(file);
  if (stat.isSymbolicLink()) throw new Error(`${label} must not be a symlink`);
  if (!stat.isFile()) throw new Error(`${label} must be a regular file`);
  return readFile(file, "utf8");
}

export async function verifyReceiptFromFiles(options) {
  let receipt;
  try {
    receipt = JSON.parse(await readRegularFile(options.receiptFile, "receipt file"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`receipt file is not valid JSON: ${error.message}`);
    throw error;
  }
  const publicKeyPem = await readRegularFile(options.publicKeyFile, "public key file");
  return verifyEvidenceReceiptV1({
    receipt,
    publicKeyPem,
    expectedBindings: options.expectedBindings,
    now: options.now,
  });
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    const result = await verifyReceiptFromFiles(options);
    const output = {
      status: "cryptographic-integrity-and-current-bindings-valid",
      productionAuthority: "not-established-by-this-verifier",
      ...result,
    };
    if (options.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      process.stdout.write(
        [
          "EvidenceReceiptV1 PASS",
          `releaseId: ${result.releaseId}`,
          `receiptSha256: ${result.receiptSha256}`,
          `signerSubjectId: ${result.signer.subjectId}`,
          "authority: not established by this verifier; validate through the production promotion trust protocol",
        ].join("\n") + "\n",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options?.json || process.argv.includes("--json")) {
      process.stderr.write(`${JSON.stringify({status: "fail", error: message}, null, 2)}\n`);
    } else {
      process.stderr.write(`EvidenceReceiptV1 FAIL: ${message}\n`);
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
