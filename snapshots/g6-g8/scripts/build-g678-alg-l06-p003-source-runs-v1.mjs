#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const SOURCE_SHA = 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766';
const OUTPUT = path.join(ROOT, 'packages/demos/src/alg-l06-p003-source-runs.generated.ts');
const RUNS = Object.freeze([
  {id: 'source-run-01', file: 'source-run-01.mp3', bytes: 190580,
    sha256: 'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70'},
  {id: 'source-run-02', file: 'source-run-02.mp3', bytes: 73060,
    sha256: '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db'},
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function ordinaryBytes(file, expectedSha, expectedBytes) {
  if (realpathSync(file) !== file) throw Error('source must be a physical file');
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n)
    throw Error('source must be an ordinary single-link file');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (['dev', 'ino', 'size', 'mtimeNs', 'nlink'].some(key =>
    before[key] !== after[key]) || bytes.length !== expectedBytes || sha(bytes) !== expectedSha)
    throw Error(`source bytes changed: ${path.basename(file)}`);
  return bytes;
}

export function buildP003SourceRuns(auditDir, sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT) {
  if (sourceRoot !== SOURCE_ROOT || realpathSync(sourceRoot) !== SOURCE_ROOT ||
      lstatSync(sourceRoot).isSymbolicLink()) throw Error('Source must be a real directory, not symlink');
  ordinaryBytes(path.join(sourceRoot, SOURCE), SOURCE_SHA, 1220637);
  if (!path.isAbsolute(auditDir) || realpathSync(auditDir) !== auditDir ||
      !lstatSync(auditDir).isDirectory() || lstatSync(auditDir).isSymbolicLink())
    throw Error('audit directory must be physical');
  const runs = RUNS.map(run => ({...run,
    base64: ordinaryBytes(path.join(auditDir, run.file), run.sha256, run.bytes).toString('base64')}));
  const text = `// Generated from the exact P003 source run bytes; do not edit.\n` +
    `// Original-runtime synchronization and listening remain unaccepted.\n` +
    `export const ALG_L06_P003_SOURCE_RUNS = Object.freeze({\n` +
    `  sourceSwfSha256: '${SOURCE_SHA}',\n` +
    `  runs: Object.freeze([\n` + runs.map(run =>
      `    Object.freeze({id: '${run.id}', bytes: ${run.bytes}, sha256: '${run.sha256}', base64: ${JSON.stringify(run.base64)}}),\n`).join('') +
    `  ]),\n});\n`;
  return Object.freeze({text, bytes: Buffer.byteLength(text), sha256: sha(Buffer.from(text))});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const auditIndex = args.indexOf('--audit-dir');
  if (auditIndex < 0 || !args[auditIndex + 1] || args.some(arg =>
      !['--audit-dir', args[auditIndex + 1], '--check'].includes(arg)))
    throw Error('usage: build-g678-alg-l06-p003-source-runs-v1.mjs --audit-dir <absolute-path> [--check]');
  const built = buildP003SourceRuns(args[auditIndex + 1]);
  if (args.includes('--check')) {
    const current = ordinaryBytes(OUTPUT, built.sha256, built.bytes);
    if (current.toString('utf8') !== built.text) throw Error('generated output differs');
  } else {
    writeFileSync(OUTPUT, built.text, {flag: 'wx'});
  }
  process.stdout.write(JSON.stringify({status: args.includes('--check') ? 'verified' : 'created',
    output: OUTPUT, bytes: built.bytes, sha256: built.sha256}) + '\n');
}
