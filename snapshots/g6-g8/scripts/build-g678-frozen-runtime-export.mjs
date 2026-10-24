#!/usr/bin/env node
/** Reuse the frozen P012 runtime without editing or reimplementing it.
 * Only a proof-locked source and one exact AST function can produce output. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {pinFile, readJsonPin, readPin} from '../lib/g678-admission-proof.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P012_FROZEN_PROOF = Object.freeze({
  path: 'catalog/g678-admission-v1/shared-alg001-l12-p012.json',
  bytes: 155537,
  sha256: '1401882fcc7e3c5381b4ce8ef3a86c1cda3cfffac6b09a2468ad536fd236266c',
});
export const P012_FROZEN_SOURCE = Object.freeze({
  path: 'apps/web/components/g678-alg-l12-p012-host-lesson.tsx',
  bytes: 12341,
  sha256: 'ff8859055ea589662506f57461f9aff33791e1dc8cde1dd08954b3a23bd6b745',
});
export const P012_RUNTIME_EXPORT = 'apps/web/components/g678-alg-l12-p012-runtime.generated.tsx';

const neededImports = new Set([
  'react', '@/lib/lesson-runtime-adapter',
  '../../../packages/demos/src/alg-l12-p012-lesson',
  '../../../packages/demos/src/alg-l12-p012-controls',
  '../../../packages/demos/src/alg-l12-p012-audio',
  '../../../packages/demos/src/alg-l12-p012-typography-renderer',
  '../../../packages/demos/src/alg-l12-p012-typography-asset',
  '../../../packages/demos/src/alg-l12-p012-state',
  '../../../packages/demos/src/alg-l12-p012.css',
  '../../../packages/demos/src/alg-l12-p012-typography.css',
]);
const fail = message => `P012_FROZEN_RUNTIME_EXPORT: ${message}`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function extractFrozenRuntime(sourceText) {
  const source = ts.createSourceFile('g678-alg-l12-p012-host-lesson.tsx', sourceText,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.equal(source.parseDiagnostics.length, 0, fail('source parses as TSX'));
  const statements = source.statements;
  assert(ts.isExpressionStatement(statements[0]) &&
    ts.isStringLiteral(statements[0].expression) && statements[0].expression.text === 'use client',
  fail('client directive is first'));
  const imports = statements.filter(ts.isImportDeclaration);
  assert.equal(imports.length, 12, fail('exact frozen import shape'));
  const modules = imports.map(statement => statement.moduleSpecifier.text);
  assert.equal(new Set(modules).size, modules.length, fail('unique imports'));
  for (const moduleName of neededImports) assert(modules.includes(moduleName), fail(`needed import ${moduleName}`));
  assert.deepStrictEqual(modules.filter(moduleName => !neededImports.has(moduleName)),
    ['./g678-alg-l12-p006-host-lesson', '@/lib/whole-lesson-player-descriptor'],
  fail('only the wrapper-specific imports are excluded'));
  const ids = statements.filter(statement => ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.some(declaration => declaration.name.getText(source) === 'ID'));
  assert.equal(ids.length, 1, fail('one top-level ID declaration'));
  assert.equal(ids[0].getText(source), "const ID = 'shared-alg001-l12-p012';", fail('exact P012 identity'));
  const runtimes = statements.filter(statement => ts.isFunctionDeclaration(statement) &&
    statement.name?.text === 'P012Runtime');
  assert.equal(runtimes.length, 1, fail('one top-level P012Runtime'));
  const runtime = runtimes[0];
  assert(runtime.body && !runtime.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword),
    fail('private P012Runtime body'));
  const wrapper = statements.filter(statement => ts.isFunctionDeclaration(statement) &&
    statement.name?.text === 'G678AlgL12P012HostLesson');
  assert.equal(wrapper.length, 1, fail('one frozen P012 host wrapper'));
  const runtimeText = sourceText.slice(runtime.getStart(source), runtime.end);
  assert(runtimeText.startsWith('function P012Runtime(') && runtimeText.endsWith('\n}'),
    fail('exact function text bounds'));
  const selectedImports = imports.filter(statement => neededImports.has(statement.moduleSpecifier.text))
    .map(statement => sourceText.slice(statement.getStart(source), statement.end));
  return {imports: selectedImports, id: ids[0].getText(source), runtimeText};
}

export function buildFrozenRuntimeExport({root = ROOT, expectedSourcePin = P012_FROZEN_SOURCE} = {}) {
  assert.equal(fs.realpathSync(root), root, fail('physical workspace root'));
  const proof = readJsonPin(root, P012_FROZEN_PROOF);
  assert.equal(proof.schemaVersion, 1, fail('frozen proof schema'));
  assert.equal(proof.animationId, 'shared-alg001-l12-p012', fail('frozen proof identity'));
  const sourcePins = proof.files.filter(item => item.path === P012_FROZEN_SOURCE.path);
  assert.equal(sourcePins.length, 1, fail('one frozen runtime source pin'));
  assert.deepStrictEqual(sourcePins[0], P012_FROZEN_SOURCE, fail('proof retains reviewed source pin'));
  assert.deepStrictEqual(expectedSourcePin, sourcePins[0], fail('caller expected the frozen source pin'));
  const sourceBytes = readPin(root, sourcePins[0]);
  const extracted = extractFrozenRuntime(sourceBytes.toString('utf8'));
  const header = `// GENERATED by scripts/build-g678-frozen-runtime-export.mjs. Do not edit.\n`+
    `// Frozen source: ${P012_FROZEN_SOURCE.path}\n`+
    `// Source SHA-256: ${P012_FROZEN_SOURCE.sha256}; proof SHA-256: ${P012_FROZEN_PROOF.sha256}\n`;
  const output = Buffer.from(header + "'use client';\n\n" + extracted.imports.join('\n') +
    '\n\n' + extracted.id + '\n\nexport ' + extracted.runtimeText + '\n');
  return {sourcePin: sourcePins[0], proofPin: P012_FROZEN_PROOF,
    output: {path: P012_RUNTIME_EXPORT, bytes: output}, extracted};
}

export function writeFrozenRuntimeExport(plan, root = ROOT) {
  const target = path.join(root, plan.output.path);
  assert(!fs.existsSync(target), fail('generated output already exists; use --check'));
  fs.writeFileSync(target, plan.output.bytes, {flag: 'wx'});
  return checkFrozenRuntimeExport(plan, root);
}

export function checkFrozenRuntimeExport(plan, root = ROOT) {
  const current = readPin(root, {path: plan.output.path, bytes: plan.output.bytes.length,
    sha256: sha256(plan.output.bytes)});
  assert(current.equals(plan.output.bytes), fail('generated bytes equal producer output'));
  return {status: 'P012_FROZEN_RUNTIME_EXPORT_CHECKED', source: plan.sourcePin,
    proof: plan.proofPin, output: pinFile(root, plan.output.path), acceptanceEffect: 'none'};
}

export function main(argv = process.argv.slice(2)) {
  assert(argv.length === 1 && ['--write','--check'].includes(argv[0]),
    fail('use --write or --check'));
  const plan = buildFrozenRuntimeExport();
  const result = argv[0] === '--write' ? writeFrozenRuntimeExport(plan) : checkFrozenRuntimeExport(plan);
  process.stdout.write(JSON.stringify(result) + '\n');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {main();} catch (error) {process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1;}
}
