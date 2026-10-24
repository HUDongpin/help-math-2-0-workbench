#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(scriptPath), '..');
const projectRoot = path.resolve(webRoot, '../..');
const nextEnvPath = path.join(webRoot, 'next-env.d.ts');
const lockRoot = path.join(webRoot, '.next-env.current-js-e2e.lock');
const playwrightCli = path.join(
  projectRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function validateRunId(value) {
  invariant(
    typeof value === 'string' && /^[A-Za-z0-9._-]+$/u.test(value),
    'HELP_MATH_PLAYWRIGHT_RUN_ID must contain only letters, digits, dot, underscore, or hyphen.',
  );
  return value;
}

export function candidateQaNextEnvPostimage(preimage) {
  const source = preimage.toString('utf8');
  const routeImport = 'import "./.next/types/routes.d.ts";';
  const rootParamsImport = 'import "./.next/types/root-params.d.ts";';
  invariant(
    source.includes(routeImport) && source.includes(rootParamsImport),
    'next-env.d.ts preimage is not the tracked generic Next type contract',
  );
  return Buffer.from(source
    .replace(
      routeImport,
      'import "./.next-current-js-candidate-qa/dev/types/routes.d.ts";',
    )
    .replace(
      rootParamsImport,
      'import "./.next-current-js-candidate-qa/dev/types/root-params.d.ts";',
    ));
}

export function isAllowedNextEnvPostimage(preimage, postimage) {
  return postimage.equals(preimage)
    || postimage.equals(candidateQaNextEnvPostimage(preimage));
}

async function snapshotOrdinaryFile(filePath, label) {
  const handle = await open(filePath, 'r');
  try {
    const metadata = await handle.stat();
    invariant(metadata.isFile(), `${label} is not an ordinary file`);
    invariant(metadata.nlink === 1, `${label} must have exactly one hard link`);
    const bytes = await handle.readFile();
    const pathnameMetadata = await lstat(filePath);
    invariant(
      !pathnameMetadata.isSymbolicLink()
        && pathnameMetadata.isFile()
        && pathnameMetadata.dev === metadata.dev
        && pathnameMetadata.ino === metadata.ino,
      `${label} changed identity while it was read`,
    );
    return Object.freeze({
      bytes,
      sha256: sha256(bytes),
      dev: metadata.dev,
      ino: metadata.ino,
      mode: metadata.mode & 0o777,
    });
  } finally {
    await handle.close();
  }
}

async function acquireLock(runId, preimage) {
  await mkdir(lockRoot, {mode: 0o700});
  const owner = {
    schemaVersion: 1,
    runId,
    pid: process.pid,
    nextEnvPreimageSha256: preimage.sha256,
  };
  const ownerPath = path.join(lockRoot, 'owner.json');
  await writeFile(ownerPath, `${JSON.stringify(owner, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o400,
  });
  return Object.freeze({owner, ownerPath});
}

async function preservePreimage(runId, preimage) {
  const evidenceRoot = path.join(
    projectRoot,
    'test-results',
    'helpmath-next-env-preimages',
    runId,
  );
  await mkdir(evidenceRoot, {recursive: true, mode: 0o700});
  const bytesPath = path.join(evidenceRoot, 'next-env.d.ts');
  const receiptPath = path.join(evidenceRoot, 'receipt.json');
  await writeFile(bytesPath, preimage.bytes, {flag: 'wx', mode: 0o400});
  await writeFile(receiptPath, `${JSON.stringify({
    schemaVersion: 1,
    runId,
    path: 'apps/web/next-env.d.ts',
    bytes: preimage.bytes.length,
    sha256: preimage.sha256,
  }, null, 2)}\n`, {flag: 'wx', mode: 0o400});
  return evidenceRoot;
}

async function runPlaywright(arguments_) {
  await snapshotOrdinaryFile(playwrightCli, 'Playwright CLI');
  const child = spawn(process.execPath, [playwrightCli, 'test', ...arguments_], {
    cwd: webRoot,
    env: process.env,
    stdio: 'inherit',
  });
  const forwardedSignals = new Map();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const listener = () => child.kill(signal);
    forwardedSignals.set(signal, listener);
    process.on(signal, listener);
  }
  try {
    return await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code, signal) => resolve({code, signal}));
    });
  } finally {
    for (const [signal, listener] of forwardedSignals) {
      process.off(signal, listener);
    }
  }
}

async function restoreAllowedPostimage(preimage, runId) {
  const observed = await snapshotOrdinaryFile(nextEnvPath, 'next-env.d.ts postimage');
  invariant(
    isAllowedNextEnvPostimage(preimage.bytes, observed.bytes),
    `next-env.d.ts changed beyond the exact candidate-QA postimage; ` +
      `preserved preimage SHA-256 ${preimage.sha256}`,
  );
  if (observed.bytes.equals(preimage.bytes)) return;

  const temporaryPath = path.join(
    webRoot,
    `.next-env.d.ts.restore-${runId}-${process.pid}`,
  );
  const temporary = await open(temporaryPath, 'wx', preimage.mode);
  try {
    await temporary.writeFile(preimage.bytes);
    await temporary.sync();
  } finally {
    await temporary.close();
  }
  await chmod(temporaryPath, preimage.mode);
  try {
    const current = await snapshotOrdinaryFile(
      nextEnvPath,
      'next-env.d.ts pre-restore postimage',
    );
    invariant(
      current.dev === observed.dev
        && current.ino === observed.ino
        && current.sha256 === observed.sha256,
      'next-env.d.ts changed after postimage validation',
    );
    await rename(temporaryPath, nextEnvPath);
    const restored = await snapshotOrdinaryFile(nextEnvPath, 'restored next-env.d.ts');
    invariant(
      restored.sha256 === preimage.sha256
        && restored.bytes.equals(preimage.bytes),
      'next-env.d.ts restoration did not reproduce the exact preimage',
    );
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function releaseLock(lock) {
  const owner = JSON.parse(await readFile(lock.ownerPath, 'utf8'));
  invariant(
    JSON.stringify(owner) === JSON.stringify(lock.owner),
    'Current-JS E2E lock owner drifted',
  );
  await unlink(lock.ownerPath);
  await rmdir(lockRoot);
}

export async function main(arguments_ = process.argv.slice(2)) {
  const runId = validateRunId(
    process.env.HELP_MATH_PLAYWRIGHT_RUN_ID ?? `pid-${process.pid}`,
  );
  const preimage = await snapshotOrdinaryFile(nextEnvPath, 'next-env.d.ts preimage');
  candidateQaNextEnvPostimage(preimage.bytes);
  const lock = await acquireLock(runId, preimage).catch((error) => {
    throw new Error(
      `Current-JS E2E cannot acquire ${path.relative(projectRoot, lockRoot)}: ${error.message}`,
    );
  });
  let restorationSucceeded = false;
  try {
    await preservePreimage(runId, preimage);
    const child = await runPlaywright(arguments_);
    await restoreAllowedPostimage(preimage, runId);
    restorationSucceeded = true;
    invariant(
      child.code === 0 && child.signal === null,
      `Playwright failed with ${child.signal ?? `exit code ${child.code}`}`,
    );
  } finally {
    if (restorationSucceeded) await releaseLock(lock);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
