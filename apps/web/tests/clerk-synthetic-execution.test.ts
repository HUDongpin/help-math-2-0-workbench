import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import ClerkSyntheticRedactedReporter from '../e2e/clerk-synthetic-redacted-reporter';
import {
  CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
  CLERK_SYNTHETIC_FAILURE_PHASES,
  CLERK_SYNTHETIC_PHASE_MARKER_FILENAME,
  clerkSyntheticCanaryEmail,
  clerkSyntheticPhaseMarkerPath,
  isClerkSyntheticFailurePhase,
  parseClerkSyntheticPhaseMarker,
  parseClerkSyntheticRecoveryReceipt,
  serializeClerkSyntheticPhaseMarker,
} from '../lib/clerk-synthetic-execution';

const webRoot = path.resolve(import.meta.dirname, '..');
const receipt = Object.freeze({
  earliestOwnedTimestamp: 1_788_000_000_000,
  instanceFingerprint: 'a'.repeat(64),
  latestOwnedTimestamp: 1_788_000_180_000,
  locale: 'en' as const,
  runId: 'abc123def456',
  version: 1 as const,
});

test('recovery receipt parser accepts only the exact bounded schema', () => {
  const parsed = parseClerkSyntheticRecoveryReceipt(receipt);
  assert.deepEqual(parsed, receipt);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(
    clerkSyntheticCanaryEmail(receipt.runId, receipt.locale),
    'help-math-abc123def456-en+clerk_test@example.com',
  );

  for (const candidate of [
    null,
    [],
    {...receipt, extra: true},
    {...receipt, version: 2},
    {...receipt, locale: 'fr'},
    {...receipt, runId: 'TOO-SHORT'},
    {...receipt, earliestOwnedTimestamp: 0},
    {...receipt, latestOwnedTimestamp: receipt.earliestOwnedTimestamp - 1},
    {...receipt, latestOwnedTimestamp: receipt.earliestOwnedTimestamp + 600_001},
    {...receipt, instanceFingerprint: 'not-a-fingerprint'},
  ]) assert.throws(
    () => parseClerkSyntheticRecoveryReceipt(candidate),
    /failed closed/u,
  );
});

test('failure phases are a fixed allowlist with a redacted fallback', () => {
  for (const phase of CLERK_SYNTHETIC_FAILURE_PHASES) {
    assert.equal(isClerkSyntheticFailurePhase(phase), true, phase);
  }
  for (const candidate of [
    undefined,
    null,
    '',
    'signup',
    'SIGNUP ',
    'SIGNUP=PRIVATE',
    'PRIVATE-SYNTHETIC-CREDENTIAL-SENTINEL',
  ]) assert.equal(isClerkSyntheticFailurePhase(candidate), false);
});

test('phase markers serialize only one fixed allowlisted phase', () => {
  for (const phase of CLERK_SYNTHETIC_FAILURE_PHASES) {
    const serialized = serializeClerkSyntheticPhaseMarker(phase);
    assert.equal(serialized, `${phase}\n`);
    assert.equal(parseClerkSyntheticPhaseMarker(serialized), phase);
  }
  for (const candidate of [
    '',
    'SIGNUP',
    'SIGNUP\nPRIVATE\n',
    'signup\n',
    'PRIVATE_SENTINEL\n',
  ]) assert.throws(
    () => parseClerkSyntheticPhaseMarker(candidate),
    /failed closed/u,
  );
});

test('phase marker remains outside the Playwright-cleaned output directory', () => {
  const outputDirectory = path.join(
    tmpdir(),
    'help-math-clerk-synthetic-contract123',
  );
  const markerPath = clerkSyntheticPhaseMarkerPath(outputDirectory);
  assert.equal(
    markerPath,
    path.join(
      tmpdir(),
      `help-math-clerk-synthetic-contract123.${CLERK_SYNTHETIC_PHASE_MARKER_FILENAME}`,
    ),
  );
  assert.notEqual(path.dirname(markerPath), outputDirectory);
  for (const invalid of [
    '',
    outputDirectory + '/',
    path.join(outputDirectory, 'nested'),
    path.join(tmpdir(), 'unowned-output'),
  ]) assert.throws(
    () => clerkSyntheticPhaseMarkerPath(invalid),
    /failed closed/u,
  );
});

test('lifecycle source installs recovery custody before provider creation and has a cleanup-only path', async () => {
  const source = await readFile(
    path.join(webRoot, 'e2e/clerk-synthetic-lifecycle.spec.ts'),
    'utf8',
  );
  const receiptInstall = source.indexOf('await createRecoveryReceipt(recoveryReceipt)');
  const precreationLookup = source.indexOf(
    "if ((await exactUsersForEmail(canary.email)).length !== 0)",
  );
  const signup = source.indexOf('await signUpThroughLocalizedUi(');
  const verificationWait = source.indexOf(
    'const verificationTransition = page.waitForResponse(',
  );
  const splitOtpBranch = source.indexOf('if (await firstDigit.isVisible())');
  const splitOtpInput = source.indexOf(
    'await typeSensitiveEmailCodeAcrossDigitInputs(',
  );
  const singleOtpInput = source.indexOf(
    "await fillSensitiveInput(singleInput, 'emailCode', canary)",
  );
  const verificationTransitionAssertion = source.indexOf(
    'if (!(await verificationTransition))',
  );

  assert.ok(receiptInstall > 0);
  assert.ok(precreationLookup > 0);
  assert.ok(receiptInstall > precreationLookup);
  assert.ok(signup > receiptInstall);
  assert.ok(verificationWait > 0);
  assert.ok(splitOtpBranch > verificationWait);
  assert.ok(splitOtpInput > splitOtpBranch);
  assert.ok(singleOtpInput > splitOtpInput);
  assert.ok(verificationTransitionAssertion > singleOtpInput);
  assert.match(source, /test\('EN synthetic recovery cleanup'/u);
  assert.match(source, /await cleanupExactCanaryUser\([\s\S]*await removeRecoveryReceipt/u);
  assert.match(source, /minimumDiscoveryAttempts = 30/u);
  assert.match(source, /user\.created_at <= latestOwnedTimestamp/u);
  assert.match(source, /fsConstants\.O_NOFOLLOW/u);
  assert.match(source, /candidateMetadata\.dev !== installed\.device/u);
  assert.match(source, /candidateMetadata\.ino !== installed\.inode/u);
  assert.doesNotMatch(source, /\.fill\(|keyboard\.type\(|clerk\.signIn/u);
  assert.match(source, /locator\.press\('ControlOrMeta\+A'\)/u);
  assert.match(source, /locator\.press\('Backspace'\)/u);
  assert.match(source, /clearedLength !== 0/u);
  assert.match(source, /insertedLength !== sensitiveInputValue\(canary, name\)\.length/u);
  assert.doesNotMatch(source, /exposeFunction|__helpMathSyntheticInput/u);
  assert.match(source, /newCDPSession/u);
  assert.match(source, /Input\.insertText/u);
  assert.match(source, /Input\.dispatchKeyEvent/u);
  assert.match(source, /sendClerkSyntheticSensitiveCdp/u);
  assert.doesNotMatch(source, /session\.send\('Input\.(?:insertText|dispatchKeyEvent)'/u);
  assert.match(source, /clerkSyntheticOtpKeystrokes/u);
  assert.match(source, /await expect\(digitInputs\.nth\(index \+ 1\)\)\.toBeFocused/u);
  assert.match(source, /isClerkSyntheticVerificationAttempt/u);
  assert.match(source, /Synthetic verification transition was not observed/u);
  assert.match(source, /trace: 'off'/u);
  assert.match(source, /screenshot: 'off'/u);
  assert.match(source, /video: 'off'/u);
  assert.match(source, /proveClerkDevelopmentKeyPair\(\)[\s\S]*clerkSetup\(/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_NAVIGATION'\)/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_IDENTIFIER'\)/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_PASSWORD'\)/u);
  assert.match(source, /waitForClientSessionOrVerification\(page\)/u);
  assert.match(source, /signInOutcome === 'verification'/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_VERIFICATION'\)/u);
  assert.match(source, /await fillTestEmailCode\(page, scenario, canary\)/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_SESSION'\)/u);
  assert.match(source, /setPhase\?\.\('PASSWORD_SIGN_IN_ACCOUNT'\)/u);
  assert.match(
    source,
    /setSyntheticFailurePhase\(testInfo, 'SIGN_OUT_AFTER_PASSWORD_SIGN_IN'\)/u,
  );
});

function captureReporterRecords(
  operation: (reporter: ClerkSyntheticRedactedReporter) => void,
) {
  const records: string[] = [];
  const originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    records.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  try {
    operation(new ClerkSyntheticRedactedReporter());
  } finally {
    process.stdout.write = originalWrite;
  }
  return records.join('');
}

test('redacted reporter emits a single allowlisted phase without error details', () => {
  const sentinel = 'PRIVATE-SYNTHETIC-CREDENTIAL-SENTINEL';
  const output = captureReporterRecords((reporter) => {
    reporter.onBegin({} as never, {
      allTests: () => [{title: sentinel}],
    } as never);
    reporter.onTestEnd({title: sentinel} as never, {
      annotations: [{
        description: 'SESSION',
        type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
      }],
      errors: [{message: sentinel}],
      status: 'failed',
    } as never);
    reporter.onEnd({status: 'failed'} as never);
  });

  assert.equal(output.includes(sentinel), false);
  assert.equal(output, [
    'CLERK_SYNTHETIC_TEST_COUNT=1\n',
    'CLERK_SYNTHETIC_TEST_STATUS=FAIL\n',
    'CLERK_SYNTHETIC_FAILURE_PHASE=SESSION\n',
    'CLERK_SYNTHETIC_RESULT=FAIL\n',
  ].join(''));
});

test('redacted reporter downgrades global, missing, invalid, and conflicting phases', () => {
  const sentinel = 'PRIVATE-SYNTHETIC-CREDENTIAL-SENTINEL';
  for (const annotations of [
    [],
    [{
      description: sentinel,
      type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
    }],
    [
      {
        description: 'SIGNUP',
        type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
      },
      {
        description: 'SESSION',
        type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
      },
    ],
  ]) {
    const output = captureReporterRecords((reporter) => {
      reporter.onBegin({} as never, {allTests: () => [{}]} as never);
      reporter.onTestEnd({} as never, {
        annotations,
        errors: [{message: sentinel}],
        status: 'failed',
      } as never);
      reporter.onEnd({status: 'failed'} as never);
    });
    assert.equal(output.includes(sentinel), false);
    assert.match(output, /CLERK_SYNTHETIC_FAILURE_PHASE=UNKNOWN_REDACTED/u);
  }

  const globalOutput = captureReporterRecords((reporter) => {
    reporter.onBegin({} as never, {allTests: () => [{}]} as never);
    reporter.onError();
    reporter.onTestEnd({} as never, {
      annotations: [{
        description: 'SESSION',
        type: CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION,
      }],
      errors: [{message: sentinel}],
      status: 'failed',
    } as never);
    reporter.onEnd({status: 'failed'} as never);
  });
  assert.equal(globalOutput.includes(sentinel), false);
  assert.match(globalOutput, /CLERK_SYNTHETIC_GLOBAL_ERROR=REDACTED/u);
  assert.match(
    globalOutput,
    /CLERK_SYNTHETIC_FAILURE_PHASE=UNKNOWN_REDACTED/u,
  );
});

test('redacted reporter emits no failure phase for a clean pass', () => {
  const output = captureReporterRecords((reporter) => {
    reporter.onBegin({} as never, {allTests: () => [{}]} as never);
    reporter.onTestEnd({} as never, {
      annotations: [],
      status: 'passed',
    } as never);
    reporter.onEnd({status: 'passed'} as never);
  });
  assert.equal(output, [
    'CLERK_SYNTHETIC_TEST_COUNT=1\n',
    'CLERK_SYNTHETIC_TEST_STATUS=PASS\n',
    'CLERK_SYNTHETIC_RESULT=PASS\n',
  ].join(''));
});
