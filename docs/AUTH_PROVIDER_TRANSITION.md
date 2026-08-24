# Authentication provider transition

Status: local product decision plus a local-only Clerk implementation candidate,
recorded 2026-08-14 and refreshed 2026-08-15. This document is not a deployment, security approval,
privacy approval, or release receipt.

## Current product truth

- HELP Math 2.0 now has local-only Sign in, Sign up, Sign out, account, and
  server-checked session surfaces. They require
  `CLERK_LOCAL_AUTH_ENABLED=true`, a valid loopback origin, and both ignored
  Clerk development keys. The shared gate additionally requires
  `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true`. Keyless bootstrap is deliberately
  not an accepted runtime or test path: merely opening a local page must not
  create an external Clerk application or place a provider secret in
  client-readable state.
- The local auth origin is fixed to `http://127.0.0.1:3211`. A narrow
  middleware normalization removes only Clerk's same-path, same-port HTTP
  loopback-alias rewrite and preserves every external, cross-port, or
  path-changing rewrite. This avoids the Next development-server self-proxy
  loop without trusting public Host headers or widening the production route
  surface.
- The current application includes Clerk only as a development candidate. The
  routes fail closed in production and when the exact local flag is absent. No
  learner should be told that production account registration is available.
- Historical HELP Math credentials and account records are not migration input.
  They must never be tested, imported, displayed, or reused.

## Verification snapshot — 2026-08-15

- The app-owned local Sign in, Sign up, account, Sign out, and
  `/api/auth/session` surfaces exist behind the exact development-only gate.
  The canonical EN `/sign-up` route returns HTTP 200 and mounts Clerk's email,
  password, and Continue controls; the signed-out session endpoint returns 401.
  Focused local Auth tests, TypeScript, and the visible local form pass, but
  these are not proof of a completed external registration lifecycle.
- An earlier governed EN synthetic attempt failed closed in `NAVIGATION` before
  `SIGNUP`. After the local route and middleware fixes, a newly authorized
  2026-08-15 attempt passed environment preflight, development-key/domain
  binding, Clerk testing setup, sign-up, email verification, application
  session readback, account validation, and the first sign-out. It then failed
  while the former broad `PASSWORD_SIGN_IN` phase was active. That phase also
  covered the second sign-out, so it does not prove which operation inside that
  range failed. The phase contract is now split into fixed, non-sensitive
  navigation, identifier, password, session, account, and post-sign-in sign-out
  stages before any future separately authorized canary. The password flow also
  distinguishes an immediately established session from a provider-required
  email-code verification screen; it enters the existing synthetic test code
  only when that screen is actually present.
- The governed runner completed exact cleanup for the failed attempt. No
  automatic retry occurred, and no recovery receipt, runner lock, synthetic
  temporary output, synthetic-owned listener, or dedicated build residue
  remains. This failed attempt is not Clerk lifecycle acceptance.
- After the input-normalization and optional verification fixes, one separately
  authorized EN development-instance canary returned the fixed terminal record
  `CLERK_SYNTHETIC_LAUNCHER=PASS`. It completed sign-up, required email
  verification, application-session and account-route validation, sign-out,
  password sign-in, the post-sign-in sign-out, and exact synthetic session/user
  cleanup. The post-run recovery receipt, runner lock, isolated build directory,
  synthetic temporary items, and synthetic listener were all absent. The dated,
  privacy-safe local receipt is
  `reports/help-math-clerk-synthetic-registration-receipt-2026-08-15.json`.
  Its companion checksum is
  `reports/help-math-clerk-synthetic-registration-receipt-2026-08-15.json.sha256`
  (SHA-256
  `9b8c52dc38b193024af560e7d0de6ae62ca6f8469fbc448753afe6a8e6a8f2a7`).
- This PASS verifies the narrow EN development registration lifecycle only. It
  does not verify ES, password recovery, natural session expiry, forced
  invalidation, production readiness, child-privacy/legal approval, Supabase
  migration, deployment, or publication.
- The governed runner now records only an allowlisted lifecycle phase in a
  mode-`0600` marker and removes its isolated `.next-clerk-synthetic` build
  directory after every terminal outcome. It still never records a key,
  synthetic email, password, verification code, token, provider body, or
  dynamic error message.
- A separate provider preflight is implemented and default-off. When separately
  authorized, it performs one bounded, secret-authenticated `domains.list()`
  request. The latest governed run already proved that the development
  publishable key and secret-key instance resolve to one non-satellite primary
  Frontend API; Clerk returned an empty optional `developmentOrigin`, so the
  exact `http://127.0.0.1:3211` origin remains independently enforced by the
  local runtime and runner. The check never creates a user or session and
  returns only a fixed redacted status.
- The accurate status is now **EN Clerk development registration lifecycle
  externally verified; broader authentication and production gates remain
  open**.

## Adopted sequence

### Phase 1 — make Clerk registration work locally

Clerk is the first implementation target. Before any public or production use,
the local candidate must provide a complete and testable registration lifecycle:

1. Sign up, email verification, sign in, sign out, session expiry, and account
   recovery work through accessible HELP Math UI.
2. Protected routes fail closed on the server as well as in the browser.
3. The application owns an `AuthSession` adapter. Product components consume
   that adapter and never depend directly on Clerk's user object or component
   APIs.
4. Provider secrets remain server-only; no secret, raw token, verification URL,
   or provider response is written to client logs, learning events, fixtures,
   screenshots, or source control.
5. Roles and authorization are application data, not trusted from editable
   profile metadata. Student, teacher, guardian, and administrator privileges
   require an explicit authorization design and tests.
6. Child privacy, consent, retention, deletion, support, and incident-response
   requirements are reviewed before any real learner account is created.
7. EN and ES flows, keyboard-only use, error recovery, mobile layouts, and
   automated accessibility checks pass locally.

Until all of these checks pass, Clerk remains a local implementation candidate;
it is not an available production registration service. The local candidate
uses an app-owned `AuthSession` boundary, does not display provider profile data,
and requires paired ignored development keys. The narrow EN synthetic
sign-up/verification/sign-in/sign-out/cleanup contract has passed; the broader
Phase 1 requirements above remain independently open.

The core external canary is deliberately narrower than the extended lifecycle
suite. `CLERK_SYNTHETIC_REGISTRATION_E2E=run-external-clerk-registration`
authorizes only synthetic sign-up, required email-code verification, application
session readback, sign-out, password sign-in, privacy checks, and exact cleanup.
Password recovery and provider-side forced session revocation remain behind the
separate `CLERK_SYNTHETIC_LIFECYCLE_E2E=run-external-clerk-lifecycle` gate; a
registration-only authorization must never be expanded to those operations.

The extended synthetic contract includes a provider-side forced-session
revocation check, but that branch has not been externally accepted. Even after
it eventually passes, forced revocation would prove only that the application
fails closed after a revoked session; it would not prove natural wall-clock
expiry. Natural expiry requires a separately bounded development-instance
TTL/test-clock scenario and must not be inferred from revocation.

### Phase 2 — migrate the adapter to Supabase Auth

Supabase Auth is the planned successor. Migration begins only after a separate,
explicit migration authorization and a reviewed data-mapping and rollback plan.
The provider swap must preserve the app-owned `AuthSession` contract so learner
and teacher UI does not need a provider-specific rewrite.

The migration gate requires:

- a deterministic mapping from the Clerk subject to the new Supabase Auth user
  and the application-owned profile/role record;
- verified ownership and email-verification semantics, with duplicate and
  conflict handling;
- session and cookie cutover, revocation, logout-all-devices, recovery, and
  rollback tests;
- an audit trail containing only privacy-safe identifiers and counts;
- no password export, password replay, credential dual-write, or copying of
  historical HELP Math credential material;
- a staged test with synthetic accounts before any authorized real-account
  migration; and
- documented deletion/retention treatment for the retired Clerk identity after
  cutover acceptance.

Clerk and Supabase Auth must not both be treated as independent sources of truth
for the same production identity. During any authorized cutover, the application
identity record and the migration mapping are authoritative, and every ambiguous
or failed mapping is quarantined for review rather than guessed.

## Acceptance boundary

The current accepted decision is only:

> First make Clerk registration work behind an app-owned authentication adapter;
> later migrate that adapter to Supabase Auth through a separately reviewed
> cutover.

The current local implementation authorization covers Clerk development UI,
SDK integration, and synthetic-account verification only. It does not authorize
real student accounts, Supabase provider contact, moving student data, or
deploying an authentication change.
