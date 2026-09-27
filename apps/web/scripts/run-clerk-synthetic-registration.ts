import {spawn, type ChildProcess} from 'node:child_process';
import {
  constants as fsConstants,
  access,
  chmod,
  lstat,
  mkdtemp,
  open,
  realpath,
  rm,
  unlink,
  type FileHandle,
} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';

import nextEnv from '@next/env';

import {inspectClerkLocalAuthPreflight} from '../lib/clerk-local-auth-preflight';
import {
  CLERK_SYNTHETIC_CANARY_DOMAIN,
  CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION,
  CLERK_SYNTHETIC_DATA_CLASSIFICATION,
  CLERK_SYNTHETIC_DIST_DIR,
  CLERK_SYNTHETIC_EMAIL_CODE,
  CLERK_SYNTHETIC_HOST,
  CLERK_SYNTHETIC_INSTANCE_CONTRACT,
  CLERK_SYNTHETIC_ORIGIN,
  CLERK_SYNTHETIC_PORT,
  CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION,
  CLERK_SYNTHETIC_RECOVERY_FILE,
  CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION,
  CLERK_SYNTHETIC_RUNNER_GUARD,
  clerkSyntheticPhaseMarkerPath,
  isClerkSyntheticFailurePhase,
  parseClerkSyntheticPhaseMarker,
  parseClerkSyntheticRecoveryReceipt,
  serializeClerkSyntheticPhaseMarker,
  type ClerkSyntheticFailurePhase,
  type ClerkSyntheticRecoveryReceipt,
} from '../lib/clerk-synthetic-execution';

export const CLERK_SYNTHETIC_FRESH_TEST_GREP =
  'Clerk synthetic registration contract \\(external, destructive\\) EN synthetic registration$';
export const CLERK_SYNTHETIC_RECOVERY_TEST_GREP =
  'Clerk synthetic registration contract \\(external, destructive\\) EN synthetic recovery cleanup$';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = path.resolve(webRoot, '../..');
const playwrightBinary = path.join(
  repositoryRoot,
  'node_modules/.bin/playwright',
);
const playwrightConfig = path.join(webRoot, 'playwright.clerk.config.ts');
const outputPrefix = 'help-math-clerk-synthetic-';
const runLockFile = path.join(
  tmpdir(),
  'help-math-clerk-synthetic-runner-v1.lock',
);
const maximumCapturedOutputBytes = 64 * 1024;
const childTimeoutMilliseconds = 330_000;
const childTerminationGraceMilliseconds = 5_000;

const rejectedAmbientClerkOverrides = Object.freeze([
  'CLERK_API_URL',
  'CLERK_FAPI',
  'CLERK_FAPI_URL',
  'CLERK_TESTING_TOKEN',
] as const);

const allowedChildEnvironmentVariables = Object.freeze([
  'ComSpec',
  'CLERK_LOCAL_AUTH_ENABLED',
  'CLERK_SECRET_KEY',
  'HOME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'NEXT_PUBLIC_CLERK_KEYLESS_DISABLED',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'PATH',
  'PATHEXT',
  'SHELL',
  'SystemRoot',
  'TEMP',
  'TMP',
  'TMPDIR',
] as const);

type LauncherOutcome = 'PASS' | 'NOT_AUTHORIZED' | 'FAIL' | 'INTERRUPTED';
type SyntheticMode = 'fresh' | 'recovery';

class LauncherFailure extends Error {
  constructor(
    readonly outcome: Exclude<LauncherOutcome, 'PASS'>,
    readonly failurePhase: ClerkSyntheticFailurePhase | null = null,
  ) {
    super('Clerk synthetic launcher failed closed.');
    this.name = 'LauncherFailure';
  }
}

type ReporterSummary = Readonly<{
  failurePhases: readonly ClerkSyntheticFailurePhase[];
  globalErrorCount: number;
  results: readonly ('PASS' | 'INTERRUPTED' | 'FAIL')[];
  statuses: readonly ('PASS' | 'SKIP' | 'FAIL')[];
  testCounts: readonly number[];
}>;

export type ChildResult = Readonly<{
  code: number | null;
  outputOverflowed: boolean;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
}>;

type RuntimeState = {
  currentChild: ChildProcess | null;
  interrupted: boolean;
};

type OwnedRunLock = Readonly<{
  content: string;
  device: number;
  handle: FileHandle;
  inode: number;
}>;

type RunLockPayload = Readonly<{
  pid: number;
  token: string;
  version: 1;
}>;

function fail(
  outcome: Exclude<LauncherOutcome, 'PASS'> = 'FAIL',
  failurePhase: ClerkSyntheticFailurePhase | null = null,
): never {
  throw new LauncherFailure(outcome, failurePhase);
}

function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return value instanceof Error;
}

function isOwnedOutputDirectory(value: string) {
  return path.dirname(value) === tmpdir()
    && new RegExp(`^${outputPrefix}[a-zA-Z0-9_-]+$`, 'u').test(
      path.basename(value),
    );
}

function assertNoAmbientClerkOverrides(environment: NodeJS.ProcessEnv) {
  for (const variable of rejectedAmbientClerkOverrides) {
    if (environment[variable] !== undefined) fail();
  }
  if ((environment.CLERK_SYNTHETIC_LIFECYCLE_E2E ?? '').length > 0) fail();
  if ((environment.CLERK_SYNTHETIC_RECOVERY_ONLY ?? '').length > 0) fail();
}

function assertSharedAuthorization(environment: NodeJS.ProcessEnv) {
  if (
    environment.NODE_ENV === 'production'
    || environment.CLERK_SYNTHETIC_CLEANUP_AUTHORIZED
      !== CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION
  ) fail('NOT_AUTHORIZED');

  const result = inspectClerkLocalAuthPreflight({
    CLERK_LOCAL_AUTH_ENABLED: environment.CLERK_LOCAL_AUTH_ENABLED,
    CLERK_LOCAL_AUTH_ORIGIN: CLERK_SYNTHETIC_ORIGIN,
    CLERK_SECRET_KEY: environment.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED:
      environment.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NODE_ENV: 'development',
  });
  if (!result.ready) fail('NOT_AUTHORIZED');
}

function isFreshRegistrationAuthorized(environment: NodeJS.ProcessEnv) {
  return environment.CLERK_SYNTHETIC_REGISTRATION_E2E
    === CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION;
}

export function buildClerkSyntheticChildEnvironment({
  baseEnvironment,
  mode,
  outputDirectory,
  runId,
}: Readonly<{
  baseEnvironment: NodeJS.ProcessEnv;
  mode: SyntheticMode;
  outputDirectory: string;
  runId: string;
}>): NodeJS.ProcessEnv {
  if (!isOwnedOutputDirectory(outputDirectory)) fail();

  const environment: NodeJS.ProcessEnv = {NODE_ENV: 'development'};
  for (const variable of allowedChildEnvironmentVariables) {
    const value = baseEnvironment[variable];
    if (value !== undefined) environment[variable] = value;
  }

  Object.assign(environment, {
    __NEXT_PROCESSED_ENV: 'true',
    CLERK_LOCAL_AUTH_ORIGIN: CLERK_SYNTHETIC_ORIGIN,
    CLERK_SYNTHETIC_CANARY_DOMAIN,
    CLERK_SYNTHETIC_CANARY_RUN_ID: runId,
    CLERK_SYNTHETIC_CLEANUP_AUTHORIZED:
      CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION,
    CLERK_SYNTHETIC_DATA_CLASSIFICATION,
    CLERK_SYNTHETIC_EMAIL_CODE,
    CLERK_SYNTHETIC_INSTANCE_CONTRACT,
    CLERK_SYNTHETIC_OUTPUT_DIR: outputDirectory,
    CLERK_SYNTHETIC_RUNNER_GUARD,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'development',
    NO_COLOR: '1',
    PLAYWRIGHT_NO_COPY_PROMPT: '1',
    PLAYWRIGHT_HOST: CLERK_SYNTHETIC_HOST,
    PLAYWRIGHT_PORT: String(CLERK_SYNTHETIC_PORT),
    PLAYWRIGHT_REUSE_EXISTING_SERVER: '0',
  });

  if (mode === 'recovery') {
    environment.CLERK_SYNTHETIC_RECOVERY_ONLY =
      CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION;
  } else {
    environment.CLERK_SYNTHETIC_REGISTRATION_E2E =
      CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION;
  }

  return environment;
}

export function parseClerkSyntheticReporterOutput(
  stdout: string,
  stderr: string,
): ReporterSummary {
  const testCounts: number[] = [];
  const statuses: ('PASS' | 'SKIP' | 'FAIL')[] = [];
  const results: ('PASS' | 'INTERRUPTED' | 'FAIL')[] = [];
  const failurePhases: ClerkSyntheticFailurePhase[] = [];
  let globalErrorCount = 0;

  for (const stream of [stdout, stderr]) {
    for (const line of stream.split(/\r?\n/u)) {
      if (line.length === 0) continue;
      const countMatch = /^CLERK_SYNTHETIC_TEST_COUNT=(\d+)$/u.exec(line);
      if (countMatch) {
        testCounts.push(Number.parseInt(countMatch[1]!, 10));
        continue;
      }
      const statusMatch =
        /^CLERK_SYNTHETIC_TEST_STATUS=(PASS|SKIP|FAIL)$/u.exec(line);
      if (statusMatch) {
        statuses.push(statusMatch[1] as 'PASS' | 'SKIP' | 'FAIL');
        continue;
      }
      const resultMatch =
        /^CLERK_SYNTHETIC_RESULT=(PASS|INTERRUPTED|FAIL)$/u.exec(line);
      if (resultMatch) {
        results.push(resultMatch[1] as 'PASS' | 'INTERRUPTED' | 'FAIL');
        continue;
      }
      const failurePhaseMatch =
        /^CLERK_SYNTHETIC_FAILURE_PHASE=([A-Z_]+)$/u.exec(line);
      if (failurePhaseMatch) {
        const phase = failurePhaseMatch[1];
        if (!isClerkSyntheticFailurePhase(phase)) fail();
        failurePhases.push(phase);
        continue;
      }
      if (line === 'CLERK_SYNTHETIC_GLOBAL_ERROR=REDACTED') {
        globalErrorCount += 1;
        continue;
      }
      fail();
    }
  }

  return Object.freeze({
    failurePhases: Object.freeze(failurePhases),
    globalErrorCount,
    results: Object.freeze(results),
    statuses: Object.freeze(statuses),
    testCounts: Object.freeze(testCounts),
  });
}

function assertListResult(result: ChildResult) {
  if (
    result.code !== 0
    || result.signal !== null
    || result.outputOverflowed
  ) fail('FAIL', 'COLLECT');
  const summary = parseClerkSyntheticReporterOutput(
    result.stdout,
    result.stderr,
  );
  if (
    summary.globalErrorCount !== 0
    || summary.failurePhases.length !== 0
    || summary.testCounts.length !== 1
    || summary.testCounts[0] !== 1
    || summary.statuses.length !== 0
    || summary.results.some((value) => value !== 'PASS')
    || summary.results.length > 1
  ) fail('FAIL', 'COLLECT');
}

export function assertClerkSyntheticExecutionResult(result: ChildResult) {
  if (
    result.signal !== null
    || result.outputOverflowed
  ) fail('FAIL', 'UNKNOWN_REDACTED');
  const summary = parseClerkSyntheticReporterOutput(
    result.stdout,
    result.stderr,
  );
  const passingContract =
    result.code === 0
    && summary.globalErrorCount === 0
    && summary.failurePhases.length === 0
    && summary.testCounts.length === 1
    && summary.testCounts[0] === 1
    && summary.statuses.length === 1
    && summary.statuses[0] === 'PASS'
    && summary.results.length === 1
    && summary.results[0] === 'PASS';
  if (passingContract) return;

  const controlledFailureContract =
    result.code === 1
    && summary.globalErrorCount <= 1
    && summary.failurePhases.length === 1
    && summary.testCounts.length === 1
    && summary.testCounts[0] === 1
    && summary.statuses.length === 1
    && summary.statuses[0] === 'FAIL'
    && summary.results.length === 1
    && summary.results[0] === 'FAIL'
    && (
      summary.globalErrorCount === 0
      || summary.failurePhases[0] === 'UNKNOWN_REDACTED'
    );
  if (controlledFailureContract) {
    fail('FAIL', summary.failurePhases[0]!);
  }

  fail('FAIL', 'UNKNOWN_REDACTED');
}

async function readRecoveryReceipt(): Promise<
  ClerkSyntheticRecoveryReceipt | null
> {
  let handle;
  try {
    handle = await open(
      CLERK_SYNTHETIC_RECOVERY_FILE,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return null;
    fail();
  }

  try {
    const stat = await handle.stat();
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || stat.size < 1
      || stat.size > 4096
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) fail();
    const source = await handle.readFile({encoding: 'utf8'});
    let parsed: unknown;
    try {
      parsed = JSON.parse(source);
    } catch {
      fail();
    }
    const receipt = parseClerkSyntheticRecoveryReceipt(parsed);
    if (receipt.locale !== 'en') fail();
    return receipt;
  } catch (error) {
    if (error instanceof LauncherFailure) throw error;
    fail();
  } finally {
    await handle.close();
  }
}

async function recoveryReceiptExists() {
  try {
    await lstat(CLERK_SYNTHETIC_RECOVERY_FILE);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return false;
    fail();
  }
}

export function parseClerkSyntheticRunLockContent(
  content: string,
): RunLockPayload {
  if (!content.endsWith('\n') || content.slice(0, -1).includes('\n')) fail();
  let value: unknown;
  try {
    value = JSON.parse(content.slice(0, -1));
  } catch {
    fail();
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail();
  }
  const candidate = value as Partial<RunLockPayload>;
  if (
    Object.keys(candidate).sort().join(',') !== 'pid,token,version'
    || candidate.version !== 1
    || typeof candidate.pid !== 'number'
    || !Number.isSafeInteger(candidate.pid)
    || candidate.pid < 1
    || candidate.pid > 2_147_483_647
    || typeof candidate.token !== 'string'
    || !/^[a-f0-9]{64}$/u.test(candidate.token)
  ) fail();
  return Object.freeze(candidate as RunLockPayload);
}

async function acquireRunLock(): Promise<OwnedRunLock> {
  let handle: FileHandle;
  try {
    handle = await open(
      runLockFile,
      fsConstants.O_CREAT
        | fsConstants.O_EXCL
        | fsConstants.O_NOFOLLOW
        | fsConstants.O_WRONLY,
      0o600,
    );
  } catch {
    // LOCKED_REQUIRES_MANUAL_PROCESS_AUDIT. A detached child may outlive an
    // uncatchable launcher crash, so an unknown lock is never auto-reclaimed.
    // The only user-visible record remains the fixed generic FAIL outcome.
    fail();
  }

  const token = randomBytes(32).toString('hex');
  const content = `${JSON.stringify({pid: process.pid, token, version: 1})}\n`;
  let lock: OwnedRunLock | null = null;
  try {
    const createdStat = await handle.stat();
    lock = Object.freeze({
      content,
      device: createdStat.dev,
      handle,
      inode: createdStat.ino,
    });
    await handle.chmod(0o600);
    await handle.writeFile(content, {encoding: 'utf8'});
    await handle.sync();
    const stat = await handle.stat();
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) fail();
    if (stat.dev !== lock.device || stat.ino !== lock.inode) fail();
    return lock;
  } catch (error) {
    if (lock === null) {
      await handle.close();
    } else {
      await releaseRunLock(lock, false);
    }
    if (error instanceof LauncherFailure) throw error;
    fail();
  }
}

async function releaseRunLock(lock: OwnedRunLock, requireToken = true) {
  let candidate: FileHandle;
  try {
    candidate = await open(
      runLockFile,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
  } catch {
    await lock.handle.close();
    fail();
  }

  try {
    const [heldStat, candidateStat, candidateToken] = await Promise.all([
      lock.handle.stat(),
      candidate.stat(),
      candidate.readFile({encoding: 'utf8'}),
    ]);
    if (
      !heldStat.isFile()
      || !candidateStat.isFile()
      || heldStat.dev !== lock.device
      || heldStat.ino !== lock.inode
      || candidateStat.dev !== lock.device
      || candidateStat.ino !== lock.inode
      || candidateStat.nlink !== 1
      || (candidateStat.mode & 0o777) !== 0o600
      || (requireToken && candidateToken !== lock.content)
      || (
        typeof process.getuid === 'function'
        && candidateStat.uid !== process.getuid()
      )
    ) fail();
    await unlink(runLockFile);
  } finally {
    await candidate.close();
    await lock.handle.close();
  }
}

async function createOutputDirectory() {
  const outputDirectory = await mkdtemp(path.join(tmpdir(), outputPrefix));
  if (!isOwnedOutputDirectory(outputDirectory)) fail();
  await chmod(outputDirectory, 0o700);
  const stat = await lstat(outputDirectory);
  if (!stat.isDirectory() || (stat.mode & 0o777) !== 0o700) fail();
  return outputDirectory;
}

async function removeOutputDirectory(outputDirectory: string) {
  if (!isOwnedOutputDirectory(outputDirectory)) fail();
  await rm(outputDirectory, {force: true, recursive: true});
  const markerPath = syntheticPhaseMarkerPath(outputDirectory);
  try {
    const stat = await lstat(markerPath);
    if (
      !stat.isFile()
      || stat.isSymbolicLink()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) fail();
    await unlink(markerPath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return;
    if (error instanceof LauncherFailure) throw error;
    fail();
  }
}

function syntheticPhaseMarkerPath(outputDirectory: string) {
  if (!isOwnedOutputDirectory(outputDirectory)) fail();
  return clerkSyntheticPhaseMarkerPath(outputDirectory);
}

async function installSyntheticPhaseMarker(outputDirectory: string) {
  const markerPath = syntheticPhaseMarkerPath(outputDirectory);
  let handle: FileHandle | null = null;
  try {
    handle = await open(
      markerPath,
      fsConstants.O_CREAT
        | fsConstants.O_EXCL
        | fsConstants.O_NOFOLLOW
        | fsConstants.O_WRONLY,
      0o600,
    );
    await handle.writeFile(
      serializeClerkSyntheticPhaseMarker('EXECUTION_SETUP'),
      {encoding: 'utf8'},
    );
    await handle.sync();
    const stat = await handle.stat();
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) fail();
  } catch (error) {
    if (error instanceof LauncherFailure) throw error;
    fail();
  } finally {
    await handle?.close();
  }
}

async function readSyntheticPhaseMarker(outputDirectory: string) {
  const markerPath = syntheticPhaseMarkerPath(outputDirectory);
  let handle: FileHandle | null = null;
  try {
    handle = await open(
      markerPath,
      fsConstants.O_NOFOLLOW | fsConstants.O_RDONLY,
    );
    const stat = await handle.stat();
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || stat.size < 2
      || stat.size > 64
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) return 'UNKNOWN_REDACTED' as const;
    return parseClerkSyntheticPhaseMarker(
      await handle.readFile({encoding: 'utf8'}),
    );
  } catch {
    return 'UNKNOWN_REDACTED' as const;
  } finally {
    await handle?.close();
  }
}

async function removeSyntheticDistDirectory() {
  const target = path.join(webRoot, CLERK_SYNTHETIC_DIST_DIR);
  try {
    const stat = await lstat(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
    if (await realpath(target) !== target) fail();
    await rm(target, {force: true, recursive: true});
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return;
    if (error instanceof LauncherFailure) throw error;
    fail();
  }
}

async function assertLocalPlaywrightBinary() {
  await access(playwrightBinary, fsConstants.X_OK);
  await access(playwrightConfig, fsConstants.R_OK);
  const resolvedBinary = await realpath(playwrightBinary);
  const localNodeModules = `${path.join(repositoryRoot, 'node_modules')}${path.sep}`;
  if (!resolvedBinary.startsWith(localNodeModules)) fail();
}

async function assertSyntheticPortAvailable() {
  await new Promise<void>((resolve, reject) => {
    const server = createServer({pauseOnConnect: true});
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (error) reject(new LauncherFailure('FAIL'));
      else resolve();
    };
    server.once('error', () => finish(new Error('port unavailable')));
    server.listen({
      exclusive: true,
      host: CLERK_SYNTHETIC_HOST,
      port: CLERK_SYNTHETIC_PORT,
    }, () => {
      server.close((error) => finish(error));
    });
  });
}

function terminateChildTree(
  child: ChildProcess,
  signal: NodeJS.Signals,
) {
  try {
    if (process.platform !== 'win32' && child.pid !== undefined) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch {
    // A child that exited between the status check and kill needs no action.
  }
}

async function runChild(
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
  runtime: RuntimeState,
): Promise<ChildResult> {
  if (runtime.interrupted) fail('INTERRUPTED');
  await assertSyntheticPortAvailable();
  if (runtime.interrupted) fail('INTERRUPTED');

  return new Promise<ChildResult>((resolve) => {
    const child = spawn(playwrightBinary, args, {
      cwd: webRoot,
      detached: process.platform !== 'win32',
      env: environment,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    runtime.currentChild = child;
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let capturedBytes = 0;
    let outputOverflowed = false;
    let settled = false;

    const terminationTimer = setTimeout(() => {
      outputOverflowed = true;
      terminateChildTree(child, 'SIGTERM');
      setTimeout(() => {
        terminateChildTree(child, 'SIGKILL');
      }, childTerminationGraceMilliseconds).unref();
    }, childTimeoutMilliseconds);
    terminationTimer.unref();

    const capture = (chunks: Buffer[], chunk: Buffer) => {
      if (outputOverflowed) return;
      capturedBytes += chunk.byteLength;
      if (capturedBytes > maximumCapturedOutputBytes) {
        outputOverflowed = true;
        terminateChildTree(child, 'SIGTERM');
        setTimeout(() => {
          terminateChildTree(child, 'SIGKILL');
        }, childTerminationGraceMilliseconds).unref();
        return;
      }
      chunks.push(Buffer.from(chunk));
    };
    child.stdout.on('data', (chunk: Buffer) => capture(stdoutChunks, chunk));
    child.stderr.on('data', (chunk: Buffer) => capture(stderrChunks, chunk));

    const finish = (code: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(terminationTimer);
      if (runtime.currentChild === child) runtime.currentChild = null;
      resolve({
        code,
        outputOverflowed,
        signal,
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
      });
    };
    child.once('error', () => finish(null, null));
    child.once('close', finish);
  });
}

async function runExactSyntheticTest({
  baseEnvironment,
  grep,
  mode,
  runId,
  runtime,
}: Readonly<{
  baseEnvironment: NodeJS.ProcessEnv;
  grep: string;
  mode: SyntheticMode;
  runId: string;
  runtime: RuntimeState;
}>) {
  const outputDirectory = await createOutputDirectory();
  try {
    const environment = buildClerkSyntheticChildEnvironment({
      baseEnvironment,
      mode,
      outputDirectory,
      runId,
    });
    const commonArgs = [
      'test',
      '--config',
      playwrightConfig,
      '--grep',
      grep,
      '--workers=1',
      '--retries=0',
      '--repeat-each=1',
      '--max-failures=1',
    ] as const;

    const listed = await runChild([...commonArgs, '--list'], environment, runtime);
    if (runtime.interrupted) fail('INTERRUPTED');
    assertListResult(listed);

    await installSyntheticPhaseMarker(outputDirectory);

    const executed = await runChild(commonArgs, environment, runtime);
    if (runtime.interrupted) fail('INTERRUPTED');
    try {
      assertClerkSyntheticExecutionResult(executed);
    } catch (error) {
      if (
        error instanceof LauncherFailure
        && error.outcome === 'FAIL'
        && error.failurePhase === 'UNKNOWN_REDACTED'
      ) fail('FAIL', await readSyntheticPhaseMarker(outputDirectory));
      throw error;
    }
  } finally {
    try {
      await removeSyntheticDistDirectory();
    } finally {
      await removeOutputDirectory(outputDirectory);
    }
  }
}

function installSignalHandlers(runtime: RuntimeState) {
  const signals = ['SIGHUP', 'SIGINT', 'SIGTERM'] as const;
  const handler = () => {
    runtime.interrupted = true;
    if (runtime.currentChild !== null) {
      terminateChildTree(runtime.currentChild, 'SIGTERM');
      setTimeout(() => {
        if (runtime.currentChild !== null) {
          terminateChildTree(runtime.currentChild, 'SIGKILL');
        }
      }, childTerminationGraceMilliseconds).unref();
    }
  };
  for (const signal of signals) process.once(signal, handler);
  return () => {
    for (const signal of signals) process.removeListener(signal, handler);
  };
}

async function runLauncher(): Promise<LauncherOutcome> {
  if (process.argv.length > 2) fail();
  nextEnv.loadEnvConfig(
    webRoot,
    true,
    {error: () => {}, info: () => {}},
    true,
  );

  const baseEnvironment: NodeJS.ProcessEnv = {...process.env};
  assertNoAmbientClerkOverrides(baseEnvironment);
  assertSharedAuthorization(baseEnvironment);
  await assertLocalPlaywrightBinary();

  const runtime: RuntimeState = {currentChild: null, interrupted: false};
  const removeSignalHandlers = installSignalHandlers(runtime);
  let runLock: OwnedRunLock | null = null;
  try {
    runLock = await acquireRunLock();
    if (runtime.interrupted) fail('INTERRUPTED');
    const recoveryReceipt = await readRecoveryReceipt();
    if (recoveryReceipt !== null) {
      await runExactSyntheticTest({
        baseEnvironment,
        grep: CLERK_SYNTHETIC_RECOVERY_TEST_GREP,
        mode: 'recovery',
        runId: recoveryReceipt.runId,
        runtime,
      });
      if (await recoveryReceiptExists()) fail();
    }

    if (runtime.interrupted) fail('INTERRUPTED');
    if (!isFreshRegistrationAuthorized(baseEnvironment)) {
      // A governed recovery is independently useful after an interrupted run.
      // Do not require or infer permission for a second provider mutation.
      if (recoveryReceipt !== null) return 'PASS';
      fail('NOT_AUTHORIZED');
    }
    const runId = randomBytes(12).toString('hex');
    await runExactSyntheticTest({
      baseEnvironment,
      grep: CLERK_SYNTHETIC_FRESH_TEST_GREP,
      mode: 'fresh',
      runId,
      runtime,
    });
    if (await recoveryReceiptExists()) fail();
    return 'PASS';
  } finally {
    try {
      if (runLock !== null) await releaseRunLock(runLock);
    } finally {
      removeSignalHandlers();
      if (runtime.interrupted) fail('INTERRUPTED');
    }
  }
}

async function main() {
  let outcome: LauncherOutcome;
  let failurePhase: ClerkSyntheticFailurePhase | null = null;
  try {
    outcome = await runLauncher();
  } catch (error) {
    if (error instanceof LauncherFailure) {
      outcome = error.outcome;
      failurePhase = outcome === 'FAIL'
        ? error.failurePhase ?? 'UNKNOWN_REDACTED'
        : null;
    } else {
      outcome = 'FAIL';
      failurePhase = 'UNKNOWN_REDACTED';
    }
  }
  if (outcome === 'FAIL') {
    const safePhase = failurePhase !== null
      && isClerkSyntheticFailurePhase(failurePhase)
      ? failurePhase
      : 'UNKNOWN_REDACTED';
    process.stdout.write(`CLERK_SYNTHETIC_LAUNCHER_PHASE=${safePhase}\n`);
  }
  process.stdout.write(`CLERK_SYNTHETIC_LAUNCHER=${outcome}\n`);
  if (outcome !== 'PASS') process.exitCode = 1;
}

const invokedUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : '';
if (invokedUrl === import.meta.url) void main();
