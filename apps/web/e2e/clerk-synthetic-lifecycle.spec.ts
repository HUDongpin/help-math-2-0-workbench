import {randomBytes} from 'node:crypto';
import {
  closeSync,
  fstatSync,
  fsyncSync,
  openSync,
  writeSync,
} from 'node:fs';
import {
  constants as fsConstants,
  open,
  unlink,
  type FileHandle,
} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {createClerkClient} from '@clerk/backend';
import type {SessionJSON, UserJSON} from '@clerk/nextjs/server';
import {parsePublishableKey} from '@clerk/shared/keys';
import {
  clerk,
  clerkSetup,
  setupClerkTestingToken,
} from '@clerk/testing/playwright';
import {
  expect,
  test,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';

import {
  hasClerkDevelopmentKeyForms,
  isValidClerkLocalAuthOrigin,
} from '../lib/clerk-local-auth-config';
import {
  clerkSyntheticOtpKeystrokes,
  isClerkSyntheticVerificationAttempt,
  sendClerkSyntheticSensitiveCdp,
} from '../lib/clerk-synthetic-otp';
import {proveClerkDevelopmentKeyBinding} from '../lib/clerk-synthetic-key-binding';
import {
  CLERK_SYNTHETIC_CANARY_DOMAIN,
  CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION,
  CLERK_SYNTHETIC_DATA_CLASSIFICATION,
  CLERK_SYNTHETIC_EMAIL_CODE,
  CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
  CLERK_SYNTHETIC_HOST,
  CLERK_SYNTHETIC_INSTANCE_CONTRACT,
  CLERK_SYNTHETIC_ORIGIN,
  CLERK_SYNTHETIC_PORT,
  CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION,
  CLERK_SYNTHETIC_RECOVERY_FILE,
  CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION,
  CLERK_SYNTHETIC_RUN_ID_PATTERN,
  CLERK_SYNTHETIC_RUNNER_GUARD,
  clerkSyntheticCanaryEmail,
  clerkSyntheticPhaseMarkerPath,
  parseClerkSyntheticRecoveryReceipt,
  serializeClerkSyntheticPhaseMarker,
  type ClerkSyntheticFailurePhase,
  type ClerkSyntheticRecoveryReceipt,
} from '../lib/clerk-synthetic-execution';

/**
 * Destructive external-provider contract. This suite is deliberately skipped
 * unless every gate below is present with its exact value. It must be invoked
 * as a targeted test; it is not part of ordinary browser regression.
 *
 * Required non-secret gates:
 *
 *   CLERK_SYNTHETIC_REGISTRATION_E2E=run-external-clerk-registration
 *
 * The registration authorization above covers only sign-up, required email
 * verification, session readback, sign-out, and password sign-in. Password
 * recovery plus exact provider-side session revocation require the separate,
 * broader authorization below instead:
 *
 *   CLERK_SYNTHETIC_LIFECYCLE_E2E=run-external-clerk-lifecycle
 *   CLERK_SYNTHETIC_DATA_CLASSIFICATION=synthetic-only-no-student-data
 *   CLERK_SYNTHETIC_INSTANCE_CONTRACT=email-password-email-code
 *   CLERK_SYNTHETIC_CLEANUP_AUTHORIZED=revoke-exact-sessions-and-delete-exact-users
 *   CLERK_SYNTHETIC_CANARY_DOMAIN=example.com
 *   CLERK_SYNTHETIC_CANARY_RUN_ID=<12-32 lowercase ASCII letters or digits>
 *   CLERK_SYNTHETIC_EMAIL_CODE=424242
 *
 * The ordinary local-auth gate, a canonical loopback origin, and a paired
 * Clerk development publishable/secret key are also mandatory. Keyless mode
 * is never accepted. Do not put key values, a canary email, password, user ID,
 * session ID, cookie, or token in a test title, annotation, assertion message,
 * console call, screenshot, trace, or video.
 */

const LIFECYCLE_EXECUTION_AUTHORIZATION = 'run-external-clerk-lifecycle';
const CLERK_BACKEND_API_ORIGIN = 'https://api.clerk.com';

function setSyntheticFailurePhase(
  testInfo: TestInfo,
  phase: ClerkSyntheticFailurePhase,
) {
  writeSyntheticPhaseMarker(phase);
  const existing = testInfo.annotations.filter(
    (annotation) =>
      annotation.type === CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
  );
  if (existing.length > 1) {
    throw new Error('Synthetic failure-phase annotation failed closed.');
  }
  if (existing.length === 1) {
    existing[0]!.description = phase;
    return;
  }
  testInfo.annotations.push({
    description: phase,
    type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
  });
}

function writeSyntheticPhaseMarker(phase: ClerkSyntheticFailurePhase) {
  const outputDirectory = process.env.CLERK_SYNTHETIC_OUTPUT_DIR;
  if (typeof outputDirectory !== 'string' || outputDirectory.length === 0) {
    throw new Error('Synthetic phase marker failed closed.');
  }
  const markerPath = clerkSyntheticPhaseMarkerPath(outputDirectory);
  const descriptor = openSync(
    markerPath,
    fsConstants.O_NOFOLLOW | fsConstants.O_TRUNC | fsConstants.O_WRONLY,
  );
  try {
    const stat = fstatSync(descriptor);
    if (
      !stat.isFile()
      || stat.nlink !== 1
      || (stat.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && stat.uid !== process.getuid()
      )
    ) throw new Error('Synthetic phase marker failed closed.');
    writeSync(descriptor, serializeClerkSyntheticPhaseMarker(phase));
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function clearSyntheticFailurePhase(testInfo: TestInfo) {
  for (let index = testInfo.annotations.length - 1; index >= 0; index -= 1) {
    if (
      testInfo.annotations[index]?.type
      === CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION
    ) testInfo.annotations.splice(index, 1);
  }
  writeSyntheticPhaseMarker('EXECUTION_SETUP');
}

const registrationExecutionRequested =
  process.env.CLERK_SYNTHETIC_REGISTRATION_E2E
    === CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION;
const extendedLifecycleRequested =
  process.env.CLERK_SYNTHETIC_LIFECYCLE_E2E
    === LIFECYCLE_EXECUTION_AUTHORIZATION;
const mutationExecutionRequested =
  registrationExecutionRequested || extendedLifecycleRequested;
const recoveryExecutionRequested =
  process.env.CLERK_SYNTHETIC_RECOVERY_ONLY
    === CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION;
const executionRequested =
  mutationExecutionRequested || recoveryExecutionRequested;

type LocaleScenario = Readonly<{
  accountHeading: string;
  accountPath: string;
  accountTitle: string;
  codeLabels: RegExp;
  continueLabel: RegExp;
  forgotPasswordLabel: RegExp;
  homePath: string;
  locale: 'en' | 'es';
  resetPasswordLabel: RegExp;
  signInHeading: string;
  signInPath: string;
  signInTitle: string;
  signOutLabel: string;
  signUpHeading: string;
  signUpPath: string;
  signUpTitle: string;
  viewport: Readonly<{height: number; width: number}>;
}>;

type Canary = Readonly<{
  email: string;
  initialPassword: string;
  replacementPassword: string;
}>;

type SensitiveInputName =
  | 'email'
  | 'emailCode'
  | 'initialPassword'
  | 'replacementPassword';

const scenarios: readonly LocaleScenario[] = [
  {
    accountHeading: 'Local session active',
    accountPath: '/account',
    accountTitle: 'Local learning account',
    codeLabels: /enter (?:the )?(?:reset password |verification )?code|digit 1/iu,
    continueLabel: /^(?:continue|verify)$/iu,
    forgotPasswordLabel: /^forgot password\?$/iu,
    homePath: '/',
    locale: 'en',
    resetPasswordLabel: /^reset (?:your )?password$/iu,
    signInHeading: 'Return to your learning',
    signInPath: '/sign-in',
    signInTitle: 'Sign in to the local learning workspace',
    signOutLabel: 'Sign out',
    signUpHeading: 'Create your account',
    signUpPath: '/sign-up',
    signUpTitle: 'Create a local learning account',
    viewport: {height: 900, width: 1440},
  },
  {
    accountHeading: 'Sesión local activa',
    accountPath: '/es/account',
    accountTitle: 'Cuenta de aprendizaje local',
    codeLabels: /(?:introduce|ingresa) (?:el )?(?:código|codigo)|dígito 1/iu,
    continueLabel: /^(?:continuar|verificar)$/iu,
    forgotPasswordLabel: /^(?:has olvidado|olvidaste) tu contraseña\?$/iu,
    homePath: '/es',
    locale: 'es',
    resetPasswordLabel: /^restablecer (?:tu )?contraseña$/iu,
    signInHeading: 'Vuelve a tu aprendizaje',
    signInPath: '/es/sign-in',
    signInTitle: 'Inicia sesión en el espacio de aprendizaje local',
    signOutLabel: 'Cerrar sesión',
    signUpHeading: 'Crea tu cuenta',
    signUpPath: '/es/sign-up',
    signUpTitle: 'Crea una cuenta de aprendizaje local',
    viewport: {height: 844, width: 390},
  },
] as const;

function requiredEnvironmentProblems() {
  const problems: string[] = [];

  if (
    Number(registrationExecutionRequested)
      + Number(extendedLifecycleRequested)
      + Number(recoveryExecutionRequested)
    !== 1
  ) problems.push('exactly one synthetic Clerk execution authorization');

  if (
    process.env.CLERK_SYNTHETIC_RUNNER_GUARD
    !== CLERK_SYNTHETIC_RUNNER_GUARD
  ) problems.push('governed synthetic runner');
  if (process.env.NODE_ENV !== 'development') problems.push('development runtime');
  if (
    process.env.PLAYWRIGHT_HOST !== CLERK_SYNTHETIC_HOST
    || process.env.PLAYWRIGHT_PORT !== String(CLERK_SYNTHETIC_PORT)
  ) problems.push('fixed synthetic loopback listener');
  if (process.env.CLERK_LOCAL_AUTH_ENABLED !== 'true') {
    problems.push('CLERK_LOCAL_AUTH_ENABLED=true');
  }
  if (
    !isValidClerkLocalAuthOrigin(process.env.CLERK_LOCAL_AUTH_ORIGIN)
    || process.env.CLERK_LOCAL_AUTH_ORIGIN !== CLERK_SYNTHETIC_ORIGIN
  ) {
    problems.push('canonical CLERK_LOCAL_AUTH_ORIGIN');
  }
  if (!hasClerkDevelopmentKeyForms(process.env)) {
    problems.push('explicit Clerk development-key forms');
  }
  if (process.env.NEXT_PUBLIC_CLERK_KEYLESS_DISABLED !== 'true') {
    problems.push('NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true');
  }
  if (
    process.env.CLERK_SYNTHETIC_DATA_CLASSIFICATION
    !== CLERK_SYNTHETIC_DATA_CLASSIFICATION
  ) {
    problems.push('synthetic-only data classification');
  }
  if (
    process.env.CLERK_SYNTHETIC_INSTANCE_CONTRACT
    !== CLERK_SYNTHETIC_INSTANCE_CONTRACT
  ) {
    problems.push('email/password/email-code instance contract');
  }
  if (
    process.env.CLERK_SYNTHETIC_CLEANUP_AUTHORIZED
    !== CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION
  ) {
    problems.push('exact cleanup authorization');
  }
  if (
    process.env.CLERK_SYNTHETIC_CANARY_DOMAIN
    !== CLERK_SYNTHETIC_CANARY_DOMAIN
  ) {
    problems.push('reserved synthetic canary domain');
  }
  if (
    !CLERK_SYNTHETIC_RUN_ID_PATTERN.test(
      process.env.CLERK_SYNTHETIC_CANARY_RUN_ID ?? '',
    )
  ) {
    problems.push('bounded synthetic canary run ID');
  }
  if (process.env.CLERK_SYNTHETIC_EMAIL_CODE !== CLERK_SYNTHETIC_EMAIL_CODE) {
    problems.push('Clerk development test email code');
  }
  if (process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === '1') {
    problems.push('fresh Playwright-owned development server');
  }
  for (const variable of [
    'CLERK_TESTING_TOKEN',
    'CLERK_FAPI',
    'CLERK_FAPI_URL',
    'CLERK_API_URL',
  ] as const) {
    if (process.env[variable] !== undefined) {
      problems.push(`${variable} unset`);
    }
  }
  if ((process.env.CLERK_TESTING_DEBUG ?? '').length > 0) {
    problems.push('CLERK_TESTING_DEBUG unset or empty');
  }
  if ((process.env.DEBUG ?? '').length > 0 || (process.env.PWDEBUG ?? '').length > 0) {
    problems.push('Playwright debug output disabled');
  }

  return problems;
}

function createCanary(locale: LocaleScenario['locale']): Canary {
  const runId = process.env.CLERK_SYNTHETIC_CANARY_RUN_ID ?? '';
  const domain = process.env.CLERK_SYNTHETIC_CANARY_DOMAIN ?? '';
  const email = clerkSyntheticCanaryEmail(runId, locale);
  const initialPassword = `Hm2!${randomBytes(18).toString('base64url')}Old9`;
  const replacementPassword = `Hm2!${randomBytes(18).toString('base64url')}New7`;

  const validSyntheticCanary =
    CLERK_SYNTHETIC_RUN_ID_PATTERN.test(runId)
    && domain === CLERK_SYNTHETIC_CANARY_DOMAIN
    && /^help-math-[a-z0-9]{12,32}-(?:en|es)\+clerk_test@example\.com$/u.test(email)
    && initialPassword !== replacementPassword;
  if (!validSyntheticCanary) {
    throw new Error('Synthetic canary construction failed closed; values redacted.');
  }

  return {email, initialPassword, replacementPassword};
}

function sensitiveInputValue(canary: Canary, name: SensitiveInputName) {
  const values = Object.freeze({
    email: canary.email,
    emailCode: CLERK_SYNTHETIC_EMAIL_CODE,
    initialPassword: canary.initialPassword,
    replacementPassword: canary.replacementPassword,
  } satisfies Record<SensitiveInputName, string>);
  if (!Object.hasOwn(values, name)) {
    throw new Error('Synthetic input request failed closed.');
  }
  return values[name];
}

async function fillSensitiveInput(
  locator: Locator,
  name: SensitiveInputName,
  canary: Canary,
) {
  await locator.focus();
  await expect(locator).toBeFocused();
  // Clerk can retain the previous identifier in client state after sign-out.
  // Clear any existing value using non-sensitive key commands before the
  // secret-safe CDP insertion; otherwise the canary address can be appended to
  // a prefilled address and password sign-in fails for the wrong reason.
  await locator.press('ControlOrMeta+A');
  await locator.press('Backspace');
  const clearedLength = await locator.evaluate((element) =>
    (element as HTMLInputElement).value.length);
  if (clearedLength !== 0) {
    throw new Error('Synthetic input could not be cleared; values redacted.');
  }
  await insertSensitiveText(locator.page(), name, canary);
  const insertedLength = await locator.evaluate((element) =>
    (element as HTMLInputElement).value.length);
  if (insertedLength !== sensitiveInputValue(canary, name).length) {
    throw new Error('Synthetic input length did not match; values redacted.');
  }
}

async function insertSensitiveText(
  page: Page,
  name: SensitiveInputName,
  canary: Canary,
) {
  const value = sensitiveInputValue(canary, name);
  const session = await page.context().newCDPSession(page);
  try {
    await sendClerkSyntheticSensitiveCdp(
      session,
      'Input.insertText',
      {text: value},
    );
  } finally {
    await session.detach();
  }
}

async function typeSensitiveEmailCodeAcrossDigitInputs(
  page: Page,
  canary: Canary,
  afterDigit: (index: number) => Promise<void>,
) {
  const keystrokes = clerkSyntheticOtpKeystrokes(
    sensitiveInputValue(canary, 'emailCode'),
  );
  const session = await page.context().newCDPSession(page);
  try {
    for (const [index, keystroke] of keystrokes.entries()) {
      await sendClerkSyntheticSensitiveCdp(
        session,
        'Input.dispatchKeyEvent',
        keystroke.keyDown,
      );
      await sendClerkSyntheticSensitiveCdp(
        session,
        'Input.dispatchKeyEvent',
        keystroke.keyUp,
      );
      await afterDigit(index);
    }
  } finally {
    await session.detach();
  }
}

async function readRecoveryReceiptFromHandle(handle: FileHandle) {
  const metadata = await handle.stat();
  if (
    !metadata.isFile()
    || metadata.nlink !== 1
    || (metadata.mode & 0o777) !== 0o600
    || metadata.size < 2
    || metadata.size > 2_048
    || (
      typeof process.getuid === 'function'
      && metadata.uid !== process.getuid()
    )
  ) throw new Error('Recovery file metadata failed closed.');
  return Object.freeze({
    device: metadata.dev,
    inode: metadata.ino,
    receipt: parseClerkSyntheticRecoveryReceipt(JSON.parse(
      await handle.readFile({encoding: 'utf8'}),
    )),
  });
}

async function readRecoveryReceipt() {
  let handle: FileHandle | null = null;
  try {
    handle = await open(
      CLERK_SYNTHETIC_RECOVERY_FILE,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
    return (await readRecoveryReceiptFromHandle(handle)).receipt;
  } catch {
    throw new Error('Synthetic recovery receipt could not be read safely.');
  } finally {
    await handle?.close();
  }
}

async function createRecoveryReceipt(
  receipt: ClerkSyntheticRecoveryReceipt,
) {
  let handle: FileHandle | null = null;
  try {
    handle = await open(
      CLERK_SYNTHETIC_RECOVERY_FILE,
      fsConstants.O_CREAT
        | fsConstants.O_EXCL
        | fsConstants.O_NOFOLLOW
        | fsConstants.O_WRONLY,
      0o600,
    );
    await handle.writeFile(`${JSON.stringify(receipt)}\n`, {encoding: 'utf8'});
    await handle.sync();
    const installedMetadata = await handle.stat();
    if (
      !installedMetadata.isFile()
      || installedMetadata.nlink !== 1
      || (installedMetadata.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && installedMetadata.uid !== process.getuid()
      )
    ) throw new Error('Recovery receipt metadata failed closed.');
    await handle.close();
    handle = null;
    const installed = await readRecoveryReceipt();
    if (!sameRecoveryReceipt(installed, receipt)) {
      throw new Error('Recovery receipt verification failed closed.');
    }
  } catch {
    throw new Error('Synthetic recovery receipt could not be installed safely.');
  } finally {
    await handle?.close();
  }
}

async function removeRecoveryReceipt(
  expected: ClerkSyntheticRecoveryReceipt,
) {
  let held: FileHandle | null = null;
  let candidate: FileHandle | null = null;
  try {
    held = await open(
      CLERK_SYNTHETIC_RECOVERY_FILE,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
    const installed = await readRecoveryReceiptFromHandle(held);
    if (!sameRecoveryReceipt(installed.receipt, expected)) {
      throw new Error('Recovery receipt ownership failed closed.');
    }
    candidate = await open(
      CLERK_SYNTHETIC_RECOVERY_FILE,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
    const candidateMetadata = await candidate.stat();
    if (
      !candidateMetadata.isFile()
      || candidateMetadata.nlink !== 1
      || candidateMetadata.dev !== installed.device
      || candidateMetadata.ino !== installed.inode
      || (candidateMetadata.mode & 0o777) !== 0o600
      || (
        typeof process.getuid === 'function'
        && candidateMetadata.uid !== process.getuid()
      )
    ) throw new Error('Recovery receipt path ownership failed closed.');
    await unlink(CLERK_SYNTHETIC_RECOVERY_FILE);
  } catch {
    throw new Error('Synthetic recovery receipt could not be removed safely.');
  } finally {
    await candidate?.close();
    await held?.close();
  }
}

function sameRecoveryReceipt(
  left: ClerkSyntheticRecoveryReceipt,
  right: ClerkSyntheticRecoveryReceipt,
) {
  return left.version === right.version
    && left.runId === right.runId
    && left.locale === right.locale
    && left.earliestOwnedTimestamp === right.earliestOwnedTimestamp
    && left.latestOwnedTimestamp === right.latestOwnedTimestamp
    && left.instanceFingerprint === right.instanceFingerprint;
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

type NodeConsoleGuardState = {
  diagnosticObserved: boolean;
  originalDebug: typeof console.debug;
  originalError: typeof console.error;
  originalInfo: typeof console.info;
  originalLog: typeof console.log;
  originalWarn: typeof console.warn;
};

let activeNodeConsoleGuard: NodeConsoleGuardState | null = null;
let pairedInstanceFingerprint: string | null = null;

/**
 * Clerk's helpers can emit provider response bodies after their setup promise
 * resolves (for example, from an installed route callback during navigation).
 * The lifecycle tests therefore hold this redactor from the beginning of each
 * serial test through the end of exact cleanup. It records only whether a
 * diagnostic occurred, never its arguments, and restores the console before
 * returning that fixed boolean to the caller.
 */
function installRedactedNodeConsoleGuard() {
  if (activeNodeConsoleGuard !== null) {
    throw new Error('Node console redaction guard was already active.');
  }

  const state: NodeConsoleGuardState = {
    diagnosticObserved: false,
    originalDebug: console.debug,
    originalError: console.error,
    originalInfo: console.info,
    originalLog: console.log,
    originalWarn: console.warn,
  };
  activeNodeConsoleGuard = state;
  const redactDiagnostic = () => {
    state.diagnosticObserved = true;
  };
  console.debug = redactDiagnostic;
  console.error = redactDiagnostic;
  console.info = redactDiagnostic;
  console.log = redactDiagnostic;
  console.warn = redactDiagnostic;

  let finished = false;
  return () => {
    if (finished || activeNodeConsoleGuard !== state) {
      throw new Error('Node console redaction guard ownership was lost.');
    }
    finished = true;
    console.debug = state.originalDebug;
    console.warn = state.originalWarn;
    console.error = state.originalError;
    console.info = state.originalInfo;
    console.log = state.originalLog;
    activeNodeConsoleGuard = null;
    return state.diagnosticObserved;
  };
}

/**
 * beforeAll still needs a bounded guard for the initial setup promise. During
 * a lifecycle test, reuse the already-installed whole-test guard so nested
 * helpers cannot replace or prematurely restore it.
 */
async function withRedactedNodeConsoleGuard<T>(
  operation: () => Promise<T>,
  failureMessage: string,
) {
  if (activeNodeConsoleGuard !== null) {
    try {
      return await operation();
    } catch {
      throw new Error(failureMessage);
    }
  }

  const finishGuard = installRedactedNodeConsoleGuard();
  let diagnosticObserved = false;
  let guardFailed = false;
  let operationFailed = false;
  let result: T | undefined;

  try {
    result = await operation();
  } catch {
    operationFailed = true;
  } finally {
    try {
      diagnosticObserved = finishGuard();
    } catch {
      guardFailed = true;
    }
  }

  if (guardFailed || diagnosticObserved) {
    throw new Error('Clerk helper emitted a terminal diagnostic; content redacted.');
  }
  if (operationFailed) throw new Error(failureMessage);
  return result as T;
}

async function clerkBackendJson<T>(
  path: string,
  method: 'DELETE' | 'GET' | 'POST' = 'GET',
) {
  if (!path.startsWith('/v1/') || path.includes('://')) {
    throw new Error('Clerk backend path failed closed.');
  }
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey || !hasClerkDevelopmentKeyForms(process.env)) {
    throw new Error('Clerk development-key forms are unavailable.');
  }

  return withRedactedNodeConsoleGuard(async () => {
    const response = await fetch(`${CLERK_BACKEND_API_ORIGIN}${path}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error('Provider response rejected.');
    return await response.json() as T;
  }, 'Clerk backend operation failed; provider details redacted.');
}

/**
 * `clerkSetup()` creates a testing token with the secret key and separately
 * parses the publishable key; it does not prove that the keys share an
 * instance. This read-only domain binding must therefore succeed first.
 */
async function proveClerkDevelopmentKeyPair() {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey || !hasClerkDevelopmentKeyForms(process.env)) {
    throw new Error('Clerk development-key form check failed closed.');
  }

  try {
    const client = createClerkClient({
      apiUrl: CLERK_BACKEND_API_ORIGIN,
      secretKey,
      telemetry: {disabled: true},
    });
    return await proveClerkDevelopmentKeyBinding({
      environment: process.env,
      listDomains: () => withRedactedNodeConsoleGuard(
        () => client.domains.list(),
        'Clerk key-pair proof was unavailable; details redacted.',
      ),
    });
  } catch {
    throw new Error('Clerk key-pair proof failed closed; details redacted.');
  }
}

function clerkListPayload<T>(value: unknown): readonly T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value !== null
    && typeof value === 'object'
    && Array.isArray((value as {data?: unknown}).data)
  ) return (value as {data: T[]}).data;
  throw new Error('Clerk backend list response failed closed.');
}

async function exactUsersForEmail(email: string) {
  try {
    const query = new URLSearchParams({email_address: email, limit: '10'});
    const response = await clerkBackendJson<unknown>(`/v1/users?${query.toString()}`);
    const users = clerkListPayload<UserJSON>(response);
    if (
      response !== null
      && typeof response === 'object'
      && typeof (response as {total_count?: unknown}).total_count === 'number'
      && (response as {total_count: number}).total_count > users.length
    ) throw new Error('Exact user enumeration was incomplete.');
    return users.filter((user) =>
      user.email_addresses.some(
        (address) => address.email_address.toLowerCase() === email.toLowerCase(),
      ));
  } catch {
    throw new Error('Exact synthetic-user lookup failed; provider details redacted.');
  }
}

async function waitForOneExactUser(email: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const users = await exactUsersForEmail(email);
    if (users.length === 1) return users[0]!;
    if (users.length > 1) {
      throw new Error('Synthetic-user lookup was not unique; identifiers redacted.');
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Synthetic user was not observable after registration.');
}

function isEmptyRecord(value: Readonly<Record<string, unknown>>) {
  return Object.keys(value).length === 0;
}

function assertSyntheticDataMinimization(user: UserJSON, canary: Canary) {
  const exactEmail = user.email_addresses.length === 1
    && user.email_addresses[0]?.email_address.toLowerCase()
      === canary.email.toLowerCase();
  const verifiedEmail = user.email_addresses[0]?.verification?.status === 'verified';
  const minimized =
    exactEmail
    && verifiedEmail
    && user.password_enabled
    && user.first_name === null
    && user.last_name === null
    && user.username === null
    && user.external_id === null
    && user.phone_numbers.length === 0
    && user.web3_wallets.length === 0
    && user.external_accounts.length === 0
    && user.enterprise_accounts.length === 0
    && isEmptyRecord(user.public_metadata)
    && isEmptyRecord(user.private_metadata)
    && isEmptyRecord(user.unsafe_metadata);
  if (!minimized) {
    throw new Error('Synthetic account violated the no-student-data contract.');
  }
}

function installSensitiveBrowserLogGuard(page: Page, canary: Canary) {
  let unsafeLogObserved = false;
  let runtimeErrorObserved = false;
  const exactValues = [
    canary.email,
    canary.initialPassword,
    canary.replacementPassword,
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
    process.env.CLERK_SECRET_KEY ?? '',
    process.env.CLERK_SYNTHETIC_EMAIL_CODE ?? '',
  ].filter((value) => value.length > 0);
  const authMaterialLabel =
    /(?:authorization|set-cookie|cookie|session[_ -]?id|bearer|jwt|token)\s*[:=]/iu;
  const compactJwt = /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\./u;

  page.on('console', (message) => {
    const text = message.text();
    if (
      exactValues.some((value) => text.includes(value))
      || authMaterialLabel.test(text)
      || compactJwt.test(text)
    ) unsafeLogObserved = true;
  });
  page.on('pageerror', (error) => {
    runtimeErrorObserved = true;
    const text = error.message;
    if (
      exactValues.some((value) => text.includes(value))
      || authMaterialLabel.test(text)
      || compactJwt.test(text)
    ) unsafeLogObserved = true;
  });

  return () => {
    if (unsafeLogObserved) {
      throw new Error('Sensitive auth material reached a browser log; content redacted.');
    }
    if (runtimeErrorObserved) {
      throw new Error('Auth page emitted a runtime error; content redacted.');
    }
  };
}

async function cleanupExactCanaryUser({
  canary,
  earliestOwnedTimestamp,
  latestOwnedTimestamp,
  knownUserId,
}: Readonly<{
  canary: Canary;
  earliestOwnedTimestamp: number;
  latestOwnedTimestamp: number;
  knownUserId: string | null;
}>) {
  const deleteOwnedUser = async (user: UserJSON) => {
    const exactKnownUser = knownUserId === null || user.id === knownUserId;
    const createdDuringThisRun = user.created_at >= earliestOwnedTimestamp
      && user.created_at <= latestOwnedTimestamp;
    if (!exactKnownUser || !createdDuringThisRun) {
      throw new Error('Cleanup ownership could not be proven; nothing broad was deleted.');
    }

    let sessions: readonly SessionJSON[];
    try {
      const query = new URLSearchParams({limit: '100', user_id: user.id});
      const response = await clerkBackendJson<unknown>(
        `/v1/sessions?${query.toString()}`,
      );
      sessions = clerkListPayload<SessionJSON>(response);
      if (
        response !== null
        && typeof response === 'object'
        && typeof (response as {total_count?: unknown}).total_count === 'number'
        && (response as {total_count: number}).total_count > sessions.length
      ) throw new Error('Exact session enumeration was incomplete.');
    } catch {
      throw new Error('Exact synthetic-session lookup failed; details redacted.');
    }
    for (const session of sessions) {
      if (session.user_id !== user.id) {
        throw new Error('Cleanup session ownership mismatch; identifiers redacted.');
      }
      if (session.status === 'active') {
        try {
          await clerkBackendJson<SessionJSON>(
            `/v1/sessions/${encodeURIComponent(session.id)}/revoke`,
            'POST',
          );
        } catch {
          throw new Error('Exact synthetic-session cleanup failed; details redacted.');
        }
      }
    }

    try {
      await clerkBackendJson<unknown>(
        `/v1/users/${encodeURIComponent(user.id)}`,
        'DELETE',
      );
    } catch {
      throw new Error('Exact synthetic-user deletion failed; details redacted.');
    }
  };

  let consecutiveAbsences = 0;
  let deletionObserved = false;
  const minimumDiscoveryAttempts = 30;
  const maximumAttempts = 45;
  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const users = await exactUsersForEmail(canary.email);
    if (users.length > 1) {
      throw new Error('Synthetic cleanup lookup was not unique.');
    }
    if (users.length === 1) {
      consecutiveAbsences = 0;
      await deleteOwnedUser(users[0]!);
      deletionObserved = true;
    } else {
      consecutiveAbsences += 1;
      const discoveryWindowElapsed = attempt + 1 >= minimumDiscoveryAttempts;
      if (
        consecutiveAbsences >= 3
        && (deletionObserved || discoveryWindowElapsed)
      ) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Synthetic-user cleanup could not reach stable absence.');
}

async function prepareClerkPage(context: BrowserContext, page: Page, path: string) {
  await context.clearCookies();
  await withRedactedNodeConsoleGuard(
    () => setupClerkTestingToken({context}),
    'Clerk testing-token setup failed; details redacted.',
  );
  const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
  if (response?.status() !== 200) {
    throw new Error('Local auth route was not available to the synthetic contract.');
  }
  try {
    await clerk.loaded({page});
  } catch {
    throw new Error('Clerk did not load for the synthetic contract; details redacted.');
  }
}

async function assertNoHighImpactAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({page}).analyze();
  const highImpactViolation = result.violations.some(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
  if (highImpactViolation) {
    throw new Error(
      'Auth page has a serious or critical accessibility violation; details redacted.',
    );
  }
}

async function assertNoHorizontalPageOverflow(page: Page) {
  const fitsViewport = await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  if (!fitsViewport) {
    throw new Error('Auth page has horizontal viewport overflow.');
  }
}

async function assertNoServerOrKeylessSecretLeakage({
  page,
}: Readonly<{page: Page}>) {
  const browserLeakage = await page.evaluate(() => {
    const readStorage = (storage: Storage) => {
      const entries: Record<string, string | null> = {};
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key !== null) entries[key] = storage.getItem(key);
      }
      return entries;
    };
    const serialized = JSON.stringify({
      cookie: document.cookie,
      html: document.documentElement.outerHTML,
      localStorage: readStorage(localStorage),
      sessionStorage: readStorage(sessionStorage),
    });
    const cookieNames = document.cookie.split(';').map((cookie) =>
      cookie.trim().split('=', 1)[0] ?? '');
    return {
      keylessCookieExists: cookieNames.some((name) => /keyless/iu.test(name)),
      serverSecretPatternVisible: /(?:sk_test_|sk_live_)/u.test(serialized),
    };
  });
  if (
    browserLeakage.serverSecretPatternVisible
    || browserLeakage.keylessCookieExists
  ) {
    throw new Error(
      'Server or keyless secret reached browser-readable state; content redacted.',
    );
  }
}

async function clickLocalizedContinue(page: Page, scenario: LocaleScenario) {
  const button = page.getByRole('button', {name: scenario.continueLabel}).last();
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');
}

async function fillTestEmailCode(
  page: Page,
  scenario: LocaleScenario,
  canary: Canary,
) {
  const singleInput = page.locator(
    'input[autocomplete="one-time-code"], input[name="code"]',
  ).first();
  const firstDigit = page.getByRole('textbox', {
    name: /(?:digit|dígito) 1(?:\D|$)/iu,
  }).first();
  await expect.poll(async () =>
    (await firstDigit.isVisible()) || (await singleInput.isVisible())).toBe(true);
  const frontendApi = process.env.CLERK_FAPI ?? '';
  if (frontendApi.length === 0) {
    throw new Error('Synthetic verification origin was unavailable.');
  }
  const verificationTransition = page.waitForResponse(
    (response) => isClerkSyntheticVerificationAttempt(
      response.request().method(),
      response.url(),
      frontendApi,
    ),
    {timeout: 30_000},
  ).then(() => true, () => false);

  if (await firstDigit.isVisible()) {
    const digitInputs = page.getByRole('textbox', {
      name: /(?:digit|dígito) [1-6](?:\D|$)/iu,
    });
    await expect(digitInputs).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) {
      await expect(digitInputs.nth(index)).toBeVisible();
    }
    await firstDigit.click();
    await expect(firstDigit).toBeFocused();
    await typeSensitiveEmailCodeAcrossDigitInputs(
      page,
      canary,
      async (index) => {
        if (index < 5) {
          await expect(digitInputs.nth(index + 1)).toBeFocused();
        }
      },
    );
  } else {
    await fillSensitiveInput(singleInput, 'emailCode', canary);
  }

  const submit = page.getByRole('button', {name: scenario.continueLabel}).last();
  if (await submit.isVisible()) {
    await submit.focus();
    await expect(submit).toBeFocused();
    await page.keyboard.press('Enter');
  }
  if (!(await verificationTransition)) {
    throw new Error(
      'Synthetic verification transition was not observed; details redacted.',
    );
  }
}

async function waitForClientSession(page: Page) {
  await page.waitForFunction(() => Boolean(window.Clerk?.session), null, {
    timeout: 30_000,
  });
}

async function waitForClientSessionOrVerification(page: Page) {
  const verificationInput = page.locator(
    'input[autocomplete="one-time-code"], input[name="code"]',
  ).first().or(page.getByRole('textbox', {
    name: /(?:digit|dígito) 1(?:\D|$)/iu,
  }).first());
  const outcome = await expect.poll(async () => {
    const sessionAvailable = await page.evaluate(() =>
      Boolean(window.Clerk?.session));
    if (sessionAvailable) return 'session';
    if (await verificationInput.isVisible()) return 'verification';
    return 'pending';
  }, {timeout: 30_000}).not.toBe('pending');
  void outcome;

  return await page.evaluate(() => Boolean(window.Clerk?.session))
    ? 'session' as const
    : 'verification' as const;
}

async function expectAccountPage(page: Page, scenario: LocaleScenario) {
  if (new URL(page.url()).pathname !== scenario.accountPath) {
    await page.goto(scenario.accountPath, {waitUntil: 'domcontentloaded'});
  }
  await expect(page.getByRole('heading', {
    level: 1,
    name: scenario.accountHeading,
  })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(
    escapeRegularExpression(scenario.accountTitle),
    'u',
  ));
}

async function expectApplicationSession(page: Page, signedIn: boolean) {
  const response = await page.request.get('/api/auth/session');
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  const body = await response.json() as Record<string, unknown>;

  if (signedIn) {
    expect(response.status()).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['ok', 'provider', 'status']);
    expect(body.ok).toBe(true);
    expect(body.provider).toBe('clerk');
    expect(body.status).toBe('signed-in');
    return;
  }

  expect(response.status()).toBe(401);
  expect(Object.keys(body).sort()).toEqual(['ok', 'status']);
  expect(body.ok).toBe(false);
  expect(body.status).toBe('signed-out');
}

async function signOutThroughApplication(page: Page, scenario: LocaleScenario) {
  await expectAccountPage(page, scenario);
  const signOut = page.getByRole('button', {
    name: scenario.signOutLabel,
    exact: true,
  });
  await signOut.focus();
  await expect(signOut).toBeFocused();
  const focusIndicator = await signOut.evaluate((element) => {
    const style = getComputedStyle(element);
    return {boxShadow: style.boxShadow, outlineStyle: style.outlineStyle};
  });
  if (
    focusIndicator.boxShadow === 'none'
    && focusIndicator.outlineStyle === 'none'
  ) throw new Error('Sign-out control has no visible keyboard focus indicator.');
  await page.keyboard.press('Enter');
  await page.waitForURL((url) => url.pathname === scenario.homePath);
  await expectApplicationSession(page, false);
}

async function signInThroughLocalizedUi({
  canary,
  context,
  page,
  passwordName,
  scenario,
  setPhase,
}: Readonly<{
  canary: Canary;
  context: BrowserContext;
  page: Page;
  passwordName: 'initialPassword' | 'replacementPassword';
  scenario: LocaleScenario;
  setPhase?: (phase: ClerkSyntheticFailurePhase) => void;
}>) {
  setPhase?.('PASSWORD_SIGN_IN_NAVIGATION');
  const redirect = new URLSearchParams({redirect_url: scenario.accountPath});
  await prepareClerkPage(
    context,
    page,
    `${scenario.signInPath}?${redirect.toString()}`,
  );
  await expect(page.getByRole('heading', {
    level: 1,
    name: scenario.signInHeading,
  })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(
    escapeRegularExpression(scenario.signInTitle),
    'u',
  ));
  setPhase?.('PASSWORD_SIGN_IN_IDENTIFIER');
  await fillSensitiveInput(
    page.locator('input[name="identifier"]'),
    'email',
    canary,
  );
  const passwordInput = page.locator('input[name="password"]');
  if (!(await passwordInput.isVisible())) await clickLocalizedContinue(page, scenario);
  await expect(passwordInput).toBeVisible();
  setPhase?.('PASSWORD_SIGN_IN_PASSWORD');
  await fillSensitiveInput(passwordInput, passwordName, canary);
  await clickLocalizedContinue(page, scenario);
  const signInOutcome = await waitForClientSessionOrVerification(page);
  if (signInOutcome === 'verification') {
    setPhase?.('PASSWORD_SIGN_IN_VERIFICATION');
    await fillTestEmailCode(page, scenario, canary);
  }
  setPhase?.('PASSWORD_SIGN_IN_SESSION');
  await waitForClientSession(page);
  setPhase?.('PASSWORD_SIGN_IN_ACCOUNT');
  await expectAccountPage(page, scenario);
  await expectApplicationSession(page, true);
}

async function recoverPasswordThroughLocalizedUi({
  canary,
  context,
  page,
  scenario,
}: Readonly<{
  canary: Canary;
  context: BrowserContext;
  page: Page;
  scenario: LocaleScenario;
}>) {
  const redirect = new URLSearchParams({redirect_url: scenario.accountPath});
  await prepareClerkPage(
    context,
    page,
    `${scenario.signInPath}?${redirect.toString()}`,
  );
  await fillSensitiveInput(
    page.locator('input[name="identifier"]'),
    'email',
    canary,
  );
  await clickLocalizedContinue(page, scenario);
  const forgotPassword = page.getByRole('link', {
    name: scenario.forgotPasswordLabel,
  });
  await expect(forgotPassword).toBeVisible();
  await forgotPassword.focus();
  await expect(forgotPassword).toBeFocused();
  await page.keyboard.press('Enter');

  const resetChoice = page.getByRole('button', {
    name: scenario.resetPasswordLabel,
  });
  const codeEntry = page.locator(
    'input[autocomplete="one-time-code"], input[name="code"]',
  ).first().or(page.getByRole('textbox', {name: scenario.codeLabels}).first());
  await expect(resetChoice.or(codeEntry).first()).toBeVisible();
  if (await resetChoice.isVisible()) {
    await resetChoice.focus();
    await expect(resetChoice).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await fillTestEmailCode(page, scenario, canary);

  const newPassword = page.locator('input[name="newPassword"]');
  await expect(newPassword).toBeVisible();
  await fillSensitiveInput(newPassword, 'replacementPassword', canary);
  const confirmation = page.locator('input[name="confirmPassword"]');
  if (await confirmation.isVisible()) {
    await fillSensitiveInput(confirmation, 'replacementPassword', canary);
  }
  const reset = page.getByRole('button', {name: scenario.resetPasswordLabel});
  await expect(reset).toBeVisible();
  await reset.focus();
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');
  await waitForClientSession(page);
  await expectAccountPage(page, scenario);
  await expectApplicationSession(page, true);
}

async function signUpThroughLocalizedUi({
  canary,
  context,
  page,
  scenario,
  setPhase,
}: Readonly<{
  canary: Canary;
  context: BrowserContext;
  page: Page;
  scenario: LocaleScenario;
  setPhase: (phase: ClerkSyntheticFailurePhase) => void;
}>) {
  setPhase('NAVIGATION');
  await prepareClerkPage(context, page, scenario.signUpPath);
  await expect(page.getByRole('heading', {
    level: 1,
    name: scenario.signUpHeading,
  })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(
    escapeRegularExpression(scenario.signUpTitle),
    'u',
  ));
  await assertNoHighImpactAccessibilityViolations(page);
  await assertNoHorizontalPageOverflow(page);
  await expect(page.getByText(
    scenario.locale === 'es'
      ? 'Este registro local usa una instancia de desarrollo de Clerk.'
      : 'This local registration uses a Clerk development instance.',
    {exact: false},
  )).toHaveCount(0);

  const legalConsent = page.locator('input[name="legalAccepted"]');
  if (await legalConsent.isVisible()) {
    throw new Error('Synthetic signup requires unsupported legal consent; stopped.');
  }
  setPhase('SIGNUP');
  await fillSensitiveInput(
    page.locator('input[name="emailAddress"]'),
    'email',
    canary,
  );
  const password = page.locator('input[name="password"]');
  if (await password.isVisible()) {
    await fillSensitiveInput(password, 'initialPassword', canary);
  }
  await clickLocalizedContinue(page, scenario);
  if (!(await password.isHidden())) {
    if ((await password.inputValue()).length === 0) {
      await fillSensitiveInput(password, 'initialPassword', canary);
      await clickLocalizedContinue(page, scenario);
    }
  }
  setPhase('VERIFICATION');
  await fillTestEmailCode(page, scenario, canary);
  setPhase('SESSION');
  await waitForClientSession(page);
  await expectAccountPage(page, scenario);
  await expectApplicationSession(page, true);
}

/**
 * Verifies forced provider-side invalidation before the recorded expireAt.
 * This is not a claim that natural wall-clock session expiry was exercised.
 */
async function revokeCurrentSessionAndExpectForcedInvalidation({
  page,
  scenario,
  user,
}: Readonly<{
  page: Page;
  scenario: LocaleScenario;
  user: UserJSON;
}>) {
  const sessionId = await page.evaluate(() => window.Clerk?.session?.id ?? null);
  if (!sessionId) throw new Error('Current synthetic session was unavailable.');

  let session: SessionJSON;
  try {
    session = await clerkBackendJson<SessionJSON>(
      `/v1/sessions/${encodeURIComponent(sessionId)}`,
    );
  } catch {
    throw new Error('Exact synthetic-session lookup failed; details redacted.');
  }
  const ownedActiveSession =
    session.user_id === user.id
    && session.status === 'active'
    && session.expire_at > Date.now();
  if (!ownedActiveSession) {
    throw new Error('Active synthetic-session ownership was not proven.');
  }

  let revoked: SessionJSON;
  try {
    revoked = await clerkBackendJson<SessionJSON>(
      `/v1/sessions/${encodeURIComponent(sessionId)}/revoke`,
      'POST',
    );
  } catch {
    throw new Error('Synthetic-session revocation failed; details redacted.');
  }
  if (revoked.status !== 'revoked') {
    throw new Error('Synthetic session did not enter the revoked state.');
  }

  await expect.poll(async () => {
    const response = await page.request.get('/api/auth/session');
    return response.status();
  }, {timeout: 30_000}).toBe(401);
  await page.goto(scenario.accountPath, {waitUntil: 'domcontentloaded'});
  await expect.poll(() => new URL(page.url()).pathname).toBe(scenario.signInPath);
  await expectApplicationSession(page, false);
}

test.use({
  screenshot: 'off',
  trace: 'off',
  video: 'off',
});

test.describe('Clerk synthetic registration contract (external, destructive)', () => {
  test.describe.configure({mode: 'serial', retries: 0});
  test.skip(
    !executionRequested,
    'External Clerk registration is disabled by default; all explicit gates are required.',
  );

  test.beforeAll(async ({}, testInfo) => {
    setSyntheticFailurePhase(testInfo, 'ENVIRONMENT_PREFLIGHT');
    const problems = requiredEnvironmentProblems();
    if (problems.length > 0) {
      throw new Error(
        `Synthetic Clerk lifecycle preflight failed closed: ${problems.join('; ')}.`,
      );
    }

    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;
    const secretKey = process.env.CLERK_SECRET_KEY!;
    setSyntheticFailurePhase(testInfo, 'KEY_BINDING');
    pairedInstanceFingerprint = await proveClerkDevelopmentKeyPair();
    if (recoveryExecutionRequested) {
      clearSyntheticFailurePhase(testInfo);
      return;
    }

    setSyntheticFailurePhase(testInfo, 'TESTING_SETUP');
    await withRedactedNodeConsoleGuard(
      () => clerkSetup({
        debug: false,
        dotenv: false,
        publishableKey,
        secretKey,
      }),
      'Clerk testing preflight failed; provider details redacted.',
    );
    const parsed = parsePublishableKey(publishableKey, {fatal: true});
    if (
      process.env.CLERK_FAPI !== parsed.frontendApi
      || !(process.env.CLERK_TESTING_TOKEN ?? '').trim()
    ) {
      throw new Error('Clerk testing setup did not match the proven instance.');
    }
    clearSyntheticFailurePhase(testInfo);
  });

  test.afterAll(() => {
    pairedInstanceFingerprint = null;
    Reflect.deleteProperty(process.env, 'CLERK_FAPI');
    Reflect.deleteProperty(process.env, 'CLERK_TESTING_TOKEN');
  });

  test('EN synthetic recovery cleanup', async ({}, testInfo) => {
    test.skip(
      !recoveryExecutionRequested,
      'Recovery cleanup runs only when a governed receipt exists.',
    );
    test.setTimeout(90_000);
    setSyntheticFailurePhase(testInfo, 'RECOVERY_CLEANUP');
    const finishNodeConsoleGuard = installRedactedNodeConsoleGuard();
    let recoveryFailed = false;
    let nodeConsoleGuardFailed = false;

    try {
      const receipt = await readRecoveryReceipt();
      const exactRecoveryBoundary = receipt.locale === 'en'
        && receipt.runId === process.env.CLERK_SYNTHETIC_CANARY_RUN_ID
        && receipt.instanceFingerprint === pairedInstanceFingerprint;
      if (!exactRecoveryBoundary) {
        throw new Error('Synthetic recovery ownership failed closed.');
      }
      const canary = createCanary(receipt.locale);
      await cleanupExactCanaryUser({
        canary,
        earliestOwnedTimestamp: receipt.earliestOwnedTimestamp,
        latestOwnedTimestamp: receipt.latestOwnedTimestamp,
        knownUserId: null,
      });
      await removeRecoveryReceipt(receipt);
    } catch {
      recoveryFailed = true;
    } finally {
      try {
        nodeConsoleGuardFailed = finishNodeConsoleGuard();
      } catch {
        nodeConsoleGuardFailed = true;
      }
    }

    if (nodeConsoleGuardFailed) {
      setSyntheticFailurePhase(testInfo, 'LOG_SAFETY');
      throw new Error('Synthetic Clerk log-safety contract failed; details redacted.');
    }
    if (recoveryFailed) {
      throw new Error('Synthetic Clerk recovery cleanup failed closed; details redacted.');
    }
    clearSyntheticFailurePhase(testInfo);
  });

  for (const scenario of scenarios) {
    test(`${scenario.locale.toUpperCase()} synthetic ${
      extendedLifecycleRequested ? 'extended lifecycle' : 'registration'
    }`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        recoveryExecutionRequested,
        'A cleanup-only recovery run cannot create a new account.',
      );
      test.setTimeout(180_000);
      const finishNodeConsoleGuard = installRedactedNodeConsoleGuard();
      await page.setViewportSize(scenario.viewport);
      // Exact-email absence is checked before creation. The narrow clock-skew
      // allowance below prevents provider clock drift from stranding a user;
      // it is never sufficient on its own to authorize deletion.
      const earliestOwnedTimestamp = Date.now() - 60_000;
      const latestOwnedTimestamp = Date.now() + 180_000;
      let cleanupCanary: Canary | null = null;
      let recoveryReceipt: ClerkSyntheticRecoveryReceipt | null = null;
      let knownUserId: string | null = null;
      setSyntheticFailurePhase(testInfo, 'EXACT_PRECREATION_LOOKUP');
      let flowFailed = false;
      let cleanupFailed = false;
      let logGuardFailed = false;
      let nodeConsoleGuardFailed = false;
      let assertNoUnsafeLogs: (() => void) | null = null;

      try {
        if (pairedInstanceFingerprint === null) {
          throw new Error('Clerk instance proof was unavailable.');
        }
        const canary = createCanary(scenario.locale);
        cleanupCanary = canary;
        assertNoUnsafeLogs = installSensitiveBrowserLogGuard(page, canary);
        if ((await exactUsersForEmail(canary.email)).length !== 0) {
          throw new Error('Synthetic canary already exists; refusing to reuse it.');
        }

        setSyntheticFailurePhase(testInfo, 'RECOVERY_RECEIPT_INSTALL');
        recoveryReceipt = Object.freeze({
          earliestOwnedTimestamp,
          instanceFingerprint: pairedInstanceFingerprint,
          latestOwnedTimestamp,
          locale: scenario.locale,
          runId: process.env.CLERK_SYNTHETIC_CANARY_RUN_ID!,
          version: 1,
        });
        await createRecoveryReceipt(recoveryReceipt);
        await signUpThroughLocalizedUi({
          canary,
          context,
          page,
          scenario,
          setPhase: (phase) => setSyntheticFailurePhase(testInfo, phase),
        });
        setSyntheticFailurePhase(testInfo, 'POST_SIGNUP_VALIDATION');
        const user = await waitForOneExactUser(canary.email);
        knownUserId = user.id;
        if (
          user.created_at < earliestOwnedTimestamp
          || user.created_at > latestOwnedTimestamp
        ) {
          throw new Error('Synthetic-user creation time did not prove ownership.');
        }
        assertSyntheticDataMinimization(user, canary);
        await assertNoHighImpactAccessibilityViolations(page);
        await assertNoHorizontalPageOverflow(page);
        await assertNoServerOrKeylessSecretLeakage({page});

        // A 640 CSS-pixel viewport models the reflow width of a 1280px canvas
        // viewed at 200%; it must remain operable without page-level overflow.
        await page.setViewportSize({height: 400, width: 640});
        await assertNoHorizontalPageOverflow(page);
        const signOutTarget = page.getByRole('button', {
          name: scenario.signOutLabel,
          exact: true,
        });
        const signOutBox = await signOutTarget.boundingBox();
        if (!signOutBox || signOutBox.height < 44 || signOutBox.width < 44) {
          throw new Error('Auth action is smaller than the 44px target floor.');
        }
        await page.setViewportSize(scenario.viewport);

        setSyntheticFailurePhase(testInfo, 'ACCOUNT_SESSION');
        await expectAccountPage(page, scenario);
        await expectApplicationSession(page, true);

        setSyntheticFailurePhase(testInfo, 'SIGN_OUT');
        await signOutThroughApplication(page, scenario);

        setSyntheticFailurePhase(testInfo, 'PASSWORD_SIGN_IN');
        await signInThroughLocalizedUi({
          canary,
          context,
          page,
          passwordName: 'initialPassword',
          scenario,
          setPhase: (phase) => setSyntheticFailurePhase(testInfo, phase),
        });
        setSyntheticFailurePhase(testInfo, 'SIGN_OUT_AFTER_PASSWORD_SIGN_IN');
        await signOutThroughApplication(page, scenario);

        if (extendedLifecycleRequested) {
          setSyntheticFailurePhase(testInfo, 'PASSWORD_RECOVERY');
          await recoverPasswordThroughLocalizedUi({
            canary,
            context,
            page,
            scenario,
          });
          await signOutThroughApplication(page, scenario);

          setSyntheticFailurePhase(testInfo, 'SIGN_IN_AFTER_RECOVERY');
          await signInThroughLocalizedUi({
            canary,
            context,
            page,
            passwordName: 'replacementPassword',
            scenario,
          });

          setSyntheticFailurePhase(testInfo, 'FORCED_INVALIDATION');
          await revokeCurrentSessionAndExpectForcedInvalidation({
            page,
            scenario,
            user,
          });
        }
      } catch {
        flowFailed = true;
      } finally {
        if (recoveryReceipt !== null && cleanupCanary !== null) {
          try {
            await cleanupExactCanaryUser({
              canary: cleanupCanary,
              earliestOwnedTimestamp,
              latestOwnedTimestamp,
              knownUserId,
            });
            await removeRecoveryReceipt(recoveryReceipt);
          } catch {
            cleanupFailed = true;
          }
        }
        if (assertNoUnsafeLogs !== null) {
          try {
            assertNoUnsafeLogs();
          } catch {
            logGuardFailed = true;
          }
        }
        try {
          nodeConsoleGuardFailed = finishNodeConsoleGuard();
        } catch {
          nodeConsoleGuardFailed = true;
        }
      }

      if (cleanupFailed) {
        setSyntheticFailurePhase(testInfo, 'CLEANUP');
        throw new Error('Synthetic Clerk cleanup failed closed; details redacted.');
      }
      if (logGuardFailed || nodeConsoleGuardFailed) {
        setSyntheticFailurePhase(testInfo, 'LOG_SAFETY');
        throw new Error('Synthetic Clerk log-safety contract failed; details redacted.');
      }
      if (flowFailed) {
        throw new Error('Synthetic Clerk lifecycle failed; details redacted.');
      }
      clearSyntheticFailurePhase(testInfo);
    });
  }
});
