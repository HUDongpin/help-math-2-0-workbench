import {tmpdir} from 'node:os';
import path from 'node:path';

export const CLERK_SYNTHETIC_REGISTRATION_AUTHORIZATION =
  'run-external-clerk-registration';
export const CLERK_SYNTHETIC_PROVIDER_PREFLIGHT_AUTHORIZATION =
  'read-only-clerk-domain-origin';
export const CLERK_SYNTHETIC_CLEANUP_AUTHORIZATION =
  'revoke-exact-sessions-and-delete-exact-users';
export const CLERK_SYNTHETIC_DATA_CLASSIFICATION =
  'synthetic-only-no-student-data';
export const CLERK_SYNTHETIC_INSTANCE_CONTRACT =
  'email-password-email-code';
export const CLERK_SYNTHETIC_CANARY_DOMAIN = 'example.com';
export const CLERK_SYNTHETIC_EMAIL_CODE = '424242';
export const CLERK_SYNTHETIC_HOST = '127.0.0.1';
export const CLERK_SYNTHETIC_PORT = 3211;
export const CLERK_SYNTHETIC_ORIGIN =
  `http://${CLERK_SYNTHETIC_HOST}:${CLERK_SYNTHETIC_PORT}`;
export const CLERK_SYNTHETIC_RUNNER_GUARD =
  'help-math-clerk-synthetic-runner-v1';
export const CLERK_SYNTHETIC_FAILURE_PHASE_ANNOTATION =
  'clerk-synthetic-failure-phase-v1';
export const CLERK_SYNTHETIC_PHASE_MARKER_FILENAME =
  'clerk-synthetic-phase-v1.txt';
export const CLERK_SYNTHETIC_DIST_DIR = '.next-clerk-synthetic';
export const CLERK_SYNTHETIC_DIST_DIR_AUTHORIZATION =
  'use-isolated-clerk-synthetic-dist-v1';
export const CLERK_SYNTHETIC_RECOVERY_AUTHORIZATION =
  'recover-exact-clerk-canary';
export const CLERK_SYNTHETIC_RUN_ID_PATTERN = /^[a-z0-9]{12,32}$/u;
export const CLERK_SYNTHETIC_FAILURE_PHASES = Object.freeze([
  'COLLECT',
  'EXECUTION_SETUP',
  'ENVIRONMENT_PREFLIGHT',
  'KEY_BINDING',
  'TESTING_SETUP',
  'RECOVERY_CLEANUP',
  'EXACT_PRECREATION_LOOKUP',
  'RECOVERY_RECEIPT_INSTALL',
  'NAVIGATION',
  'SIGNUP',
  'VERIFICATION',
  'SESSION',
  'POST_SIGNUP_VALIDATION',
  'ACCOUNT_SESSION',
  'SIGN_OUT',
  'PASSWORD_SIGN_IN',
  'PASSWORD_SIGN_IN_NAVIGATION',
  'PASSWORD_SIGN_IN_IDENTIFIER',
  'PASSWORD_SIGN_IN_PASSWORD',
  'PASSWORD_SIGN_IN_VERIFICATION',
  'PASSWORD_SIGN_IN_SESSION',
  'PASSWORD_SIGN_IN_ACCOUNT',
  'SIGN_OUT_AFTER_PASSWORD_SIGN_IN',
  'PASSWORD_RECOVERY',
  'SIGN_IN_AFTER_RECOVERY',
  'FORCED_INVALIDATION',
  'CLEANUP',
  'LOG_SAFETY',
  'UNKNOWN_REDACTED',
] as const);
export const CLERK_SYNTHETIC_RECOVERY_FILE = path.join(
  tmpdir(),
  'help-math-clerk-synthetic-recovery-v1.json',
);

export type ClerkSyntheticLocale = 'en' | 'es';
export type ClerkSyntheticFailurePhase =
  typeof CLERK_SYNTHETIC_FAILURE_PHASES[number];

export function isClerkSyntheticFailurePhase(
  value: unknown,
): value is ClerkSyntheticFailurePhase {
  return typeof value === 'string'
    && (CLERK_SYNTHETIC_FAILURE_PHASES as readonly string[]).includes(value);
}

export function clerkSyntheticPhaseMarkerPath(outputDirectory: string) {
  const outputBasename = path.basename(outputDirectory);
  if (
    path.dirname(outputDirectory) !== tmpdir()
    || outputDirectory !== path.join(tmpdir(), outputBasename)
    || !/^help-math-clerk-synthetic-[a-zA-Z0-9_-]+$/u.test(
      outputBasename,
    )
  ) {
    throw new Error('Clerk synthetic phase-marker path failed closed.');
  }
  return path.join(
    tmpdir(),
    `${outputBasename}.${CLERK_SYNTHETIC_PHASE_MARKER_FILENAME}`,
  );
}

export function serializeClerkSyntheticPhaseMarker(
  phase: ClerkSyntheticFailurePhase,
) {
  if (!isClerkSyntheticFailurePhase(phase)) {
    throw new Error('Synthetic phase marker failed closed.');
  }
  return `${phase}\n`;
}

export function parseClerkSyntheticPhaseMarker(
  value: unknown,
): ClerkSyntheticFailurePhase {
  if (
    typeof value !== 'string'
    || !value.endsWith('\n')
    || value.slice(0, -1).includes('\n')
  ) throw new Error('Synthetic phase marker failed closed.');
  const phase = value.slice(0, -1);
  if (!isClerkSyntheticFailurePhase(phase)) {
    throw new Error('Synthetic phase marker failed closed.');
  }
  return phase;
}

export type ClerkSyntheticRecoveryReceipt = Readonly<{
  earliestOwnedTimestamp: number;
  instanceFingerprint: string;
  latestOwnedTimestamp: number;
  locale: ClerkSyntheticLocale;
  runId: string;
  version: 1;
}>;

export function clerkSyntheticCanaryEmail(
  runId: string,
  locale: ClerkSyntheticLocale,
) {
  if (!CLERK_SYNTHETIC_RUN_ID_PATTERN.test(runId)) {
    throw new Error('Synthetic canary run ID failed closed.');
  }
  return `help-math-${runId}-${locale}+clerk_test@${CLERK_SYNTHETIC_CANARY_DOMAIN}`;
}

export function parseClerkSyntheticRecoveryReceipt(
  value: unknown,
): ClerkSyntheticRecoveryReceipt {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Synthetic recovery receipt failed closed.');
  }
  const candidate = value as Partial<ClerkSyntheticRecoveryReceipt>;
  const exactKeys = Object.keys(candidate).sort().join(',')
    === [
      'earliestOwnedTimestamp',
      'instanceFingerprint',
      'latestOwnedTimestamp',
      'locale',
      'runId',
      'version',
    ].sort().join(',');
  const valid = exactKeys
    && candidate.version === 1
    && (candidate.locale === 'en' || candidate.locale === 'es')
    && typeof candidate.earliestOwnedTimestamp === 'number'
    && Number.isSafeInteger(candidate.earliestOwnedTimestamp)
    && candidate.earliestOwnedTimestamp > 0
    && typeof candidate.latestOwnedTimestamp === 'number'
    && Number.isSafeInteger(candidate.latestOwnedTimestamp)
    && candidate.latestOwnedTimestamp >= candidate.earliestOwnedTimestamp
    && candidate.latestOwnedTimestamp - candidate.earliestOwnedTimestamp
      <= 600_000
    && typeof candidate.instanceFingerprint === 'string'
    && /^[a-f0-9]{64}$/u.test(candidate.instanceFingerprint)
    && typeof candidate.runId === 'string'
    && CLERK_SYNTHETIC_RUN_ID_PATTERN.test(candidate.runId);
  if (!valid) throw new Error('Synthetic recovery receipt failed closed.');
  return Object.freeze(candidate as ClerkSyntheticRecoveryReceipt);
}
