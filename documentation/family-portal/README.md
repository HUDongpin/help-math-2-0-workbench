# HELP Math 2.0 Family Portal implementation packet

Status: **DRAFT / EXACT LOCAL SYNTHETIC PRODUCT E2E VERIFIED / RELEASE AND REAL-FAMILY USE UNAPPROVED**

Packet date: 2026-08-24
Initial phase: **Phase 1 synthetic-only, with default UI-demo and controlled integration-test profiles**

This directory defines the proposed implementation, privacy, security, and
release contracts for a HELP Math 2.0 family portal. Candidate UI, server, and
database artifacts may coexist in this worktree, but their presence is only
`IMPLEMENTED_UNVERIFIED`. This packet is not evidence that those artifacts meet
the contracts, are deployed, are connected to a provider, or have privacy,
security, legal, district, Owner, or production approval.

Server actions, RPCs, outbox tables, cron/webhook routes, and a controlled test-
email adapter are within the Phase 1 integration-test implementation scope, but
they default off. Their existence does not authorize activation. Outside the
exact controlled test profile—and for every real recipient, real record, or
non-test configuration—the paths must remain unreachable and fail closed.

## Mandatory Phase 1 boundary

Phase 1 may use only clearly labeled synthetic tenants, synthetic adult
guardians, synthetic learners, synthetic assignments, synthetic progress, and
synthetic support notes. It must not ingest, infer, display, transmit, or retain
real names, real email addresses, school identifiers, student identifiers, dates
of birth, education records, credentials, contact information, or other real
personal data. The only email destination permitted by the current Phase 1
candidate is a normalized `@helpmath.invalid` address captured by the fixed
loopback Mailpit sink in a non-production integration harness. No Internet
recipient or external-provider egress is authorized. Sink access, purpose,
capture and cleanup must be recorded in the exact test receipt. Adult-email matching uses a
versioned keyed HMAC computed only by a same-origin server action with the
separate 32-byte base64url `FAMILY_EMAIL_DIGEST_KEY`; bare email hashes are
forbidden. The database has neither email plaintext nor HMAC/decryption keys,
and direct RPC access cannot bypass exact development-issuer validation.

Phase 1 has two explicit profiles:

| Profile | Allowed behavior | Required boundary |
|---|---|---|
| `synthetic_ui_demo` (default) | Display synthetic family, Teacher Messages and Admin Family Access companion surfaces; `.invalid` local invite demonstrations; plain-text local replies ≤2,000; component-memory mark-read, terminal close/filter and Settings demo; theme-only `localStorage` | No backend message/invite mutation and no egress. Closed threads are read-only with no reopen; replies are visibly not sent. |
| `synthetic_integration_test` (controlled opt-in) | Synthetic local PostgreSQL/PostgREST/GoTrue full E2E: create/deliver/redeem a synthetic invite, open Family, exchange two-way synthetic plain-text messages, capture controlled auth/invite/message email in loopback Mailpit, then revoke and prove immediate denial | Protected test operators only; all actors/tenants/learners/content/destinations synthetic; exact reserved-domain and loopback controls; default-off actions/RPCs/outbox/email work. A bearer-protected retention route and exact-Svix-signed delivery-event route may remain reachable for lifecycle closure; no arbitrary address, real recipient, real PII, public audience, or production provider/account. |

The local reply preview never silently becomes a send action when flags change.
The integration profile uses separately labeled server-backed compose/send test
controls and receipts. Attachments, SMS, push, arbitrary webhook destinations,
real recipients, and learner-session continuation remain excluded from both.

Verifying only the default UI demo cannot close Phase 1. The Phase 1 synthetic
exit gate requires both profile contracts plus the complete controlled
invite→family→two-way-message→test-email→revoke/deny/delete E2E. Even that exit
authorizes no real family, real PII, production identity cutover or deployment.

Every Phase 1 record must be deletable and must expire no later than 30 calendar
days after creation. Environment teardown must not extend that clock. The
details are in [Retention and synthetic-data policy](./retention-and-synthetic-data-policy.md).

## Meaning of the current candidate slice

The current engineering target is a **default-off synthetic vertical slice**:
a visibly fictitious family UI plus production-shaped contracts for app roles,
tenant/relationship authorization, RLS, DTOs, invites, messaging boundaries,
retention, audit, recovery and release controls. Its controlled integration test
may exercise production-shaped server boundaries using only local/development
synthetic systems and a reserved-domain loopback Mailpit capture. "Production-shaped" describes
interfaces and failure boundaries; it does not mean production-configured,
production-tested, approved, released, or suitable for real records.

Real identity-provider cutover, real adult/learner relationship proof, privacy
notice and legal review, DPA/contracts, district authorization, Owner approval,
provider/account configuration, deployment, production verification and
real-family release are not completed by this slice.

The candidate denies `authenticated`, `service_role` and `public` execution of
the create/resend invitation RPCs. A scoped authenticated administrator may
create only a short-lived, one-use attestation; a dedicated NOLOGIN/no-table
`family_invitation_issuer` role may consume it through an externally provisioned
short-lived ES256 bearer. The application holds no issuer signing private key
and has no `service_role` fallback. The local loopback full-stack harness
verified the database role/grant/attestation shape plus real HTTP create/resend
through PostgREST, with denial for anon, authenticated, service-role, wrong-
purpose, wrong-audience, table and cross-RPC callers against the exact current
001–018 artifact. The current SQL/code therefore has local dynamic evidence for
the named role transition and denial matrix. Hosted asymmetric-key validation
and production credential provision/rotation remain release gates.

The Phase 1 recipient policy remains the exact non-production
`synthetic-invalid-only` policy for normalized `local-part@helpmath.invalid`.
The reserved domain prevents Internet recipient delivery. A separately selected
non-production `mailpit-local` transport may deliver only to a loopback Mailpit
sink at `127.0.0.1:1025`; it is not a general SMTP fallback or permission to use
Resend/real inboxes. A separate default-off production-shaped candidate now
supports `school-verified-production`, but only when the runtime is production,
Supabase Auth and Resend are selected exactly,
`FAMILY_PRODUCTION_INVITATIONS_ENABLED=true`, the tenant has complete approved
retention, and its identity issuer requires a live database-backed Supabase
session. That path was verified only with fictional records in a disposable
loopback stack and no external delivery; it is not authorized for a real
address or family. The exact local
invite→Family→two-way-message→Mailpit-test-email→revoke/deny product E2E is now
dynamically verified for the frozen synthetic candidate. Synthetic release
approval remains separate and open.

The current frozen sequence contains eighteen migrations, a fictional
synthetic seed, and a pgTAP suite. On 2026-08-24, the exact artifacts were
applied in order to a fresh local PostgreSQL 16 database; the seed completed
and pgTAP reported plan `1..489`, `489` passed and `0` failed/skip/todo. All 38
public physical tables had RLS enabled. The invitation-issuer and webhook-writer
roles retained zero table/sequence authority and only their exact RPC grants.
The exact SHA-256 manifest is recorded in the
[RLS matrix](./rls-permission-matrix.md#local-database-evidence-and-frozen-artifact-identity).
This is `CLOSED_DYNAMIC_LOCAL` evidence for those named database checks. The
exact current 001–018 full-stack harness also used PostgreSQL 16.15, PostgREST
16.2, GoTrue 2.195 and Mailpit 1.31 to verify health, scoped custom-role HTTP
paths, auth delivery, the named concurrency pairs, the complete protected
browser product flow and owned cleanup.
Neither run is a linked/hosted Supabase project, hosted asymmetric-key gateway,
deployment, approval, or authorization to process real data. Superseded or
artifact-mismatched results remain unusable.

Latest local application evidence reports `56/56` focused Family tests,
typecheck and exact changed-file lint green, plus `7/7` synthetic Family Playwright
scenarios covering EN/ES private-reply Cancel/toggle, EN/ES announcement
composition, governance, invitation accept/decline, print, seven viewport shapes
including 375/768 Teacher overflow and required Family widths, axe checks, role
denial and revocation. A subsequent rendered
[accessibility engineering review](./accessibility-audit-2026-08-24/README.md)
confirmed visible skip-link focus, light/dark desktop/phone layouts and 44 x 44
phone language targets, and expanded the blocking axe pass across all five
Family screens; named human and screen-reader acceptance remains open. The signed G4 L3
learner flow passed its separate `1/1` Playwright scenario. The protected
product flow passed its runner-owned browser scenario against the exact local
stack, including recovery request→Mailpit link→PKCE callback→password update,
old-password denial, a generic duplicate sign-up response, exact-one identity
cardinality and new-password Family sign-in. The same local run verified a
real refresh grant, global provider-session revocation and a disabled-provider
rollback restart in which all four Family/auth entry paths returned `404`.
A direct Next production build
passed for the current worktree. The
repository workspace build wrapper remained blocked before Next by an unrelated
missing Grade 5 source-asset file; no source asset was copied or changed to
conceal that gap. These are local code/UI results only. The exact current 001–018
isolated harness verified GoTrue synthetic signup, invitation and message
Mailpit captures, issuer/writer PostgREST paths and their negative matrices,
and the complete protected synthetic product E2E. None of this activates the opt-in Vercel
configuration or verifies a hosted deployment.

The root `npm run verify:family:production-config` command now performs a
network-free, secret-redacted production-shape preflight. It checks exact
feature/profile selection, Supabase Auth issuer/audience/project shape,
short-lived ES256 invitation/writer capability claims, purpose-separated
service/provider/cron/HMAC/encryption credentials, legacy-read disablement,
the zero-production-binding LearningEventV2 boundary and the opt-in five-minute
cron contract. The current unconfigured worktree correctly returns exit `1`
with `CONFIGURATION_NOT_READY`; a fully populated synthetic-shape unit/CLI
fixture returns only `CONFIGURATION_READY_NOT_RELEASE_APPROVED`, with
`releaseApproved=false` and no secret values. Passing this preflight would not
verify signatures, secret custody, hosted Supabase, Resend domain/webhook,
scheduler execution, any reviewer/approval, deployment or production behavior.

The non-demo (`context.synthetic === false`) Family, Teacher Messages and Admin
Family Access pages now have production-shaped request repositories for
`family_workspace_for_tenant_v1(uuid, uuid)`,
`teacher_family_inbox_v1()` and `admin_family_access_workspace_v1()`. They use
strict bounded DTOs, the request identity rather than `service_role`, tenant-ID
cross-checks, private/no-store rendering, `403` for wrong role and `404` for a
missing/out-of-scope resource. Missing RPCs and invalid/unknown response fields
fail closed. `lessonHref` is absent from the Family RPC, strict DTO/type and UI;
there is no guardian enter/continue-lesson control. This wiring is not evidence
of a real identity, real record, hosted database, dynamic RLS result or release.
In Phase 1, a database-backed context must still resolve only to a synthetic
tenant/environment; “non-demo” never means production data is authorized.

## Current candidate app coverage and explicit code gaps

The current application candidate now maps and renders the complete bounded
Family thread history admitted by the strict DTO (at most 200 messages per
thread), including a redacted-message tombstone label rather than exposing
redaction metadata or original content. The send-message RPC receipt is parsed
with a strict Zod schema before it becomes an application receipt. Family
Overview maps and displays existing school announcements. Settings links
authorized account/session actions to `/account`. Admin pending-invite resend,
guardian first-thread creation from an allowlisted `messageContacts` entry, and
the existing reply/read/terminal-close paths are wired. Migration 014 and its
strict app layer add guardian rights requests and privacy-safe account activity,
teacher invitation suggestions, scoped school review, two-person 15-minute
exact-thread support, audited redaction tombstones, and server-side invitation
decline. These are implemented
local candidate capabilities, not `CODE_COMPLETE`, production E2E, provider or
release evidence.

The remaining implementation/release gaps are explicit:

- **Phase 1 blockers:** the bounded signed-in G4 L3 `LearningEventV2` caller,
  exact-tenant workspace, default-off tenant database mirror of Messaging,
  dual-tenant/direct-RPC/outbox-disable checks, and complete
  invite→Family→two-way-message→loopback-Mailpit→revoke/deny product E2E are
  locally verified against 001–018. Migration 018 additionally enforces a
  database-side, signed-provider-identity aggregate for invitation acceptance:
  20 non-replay attempts per fixed 10-minute window and 100 per UTC day,
  including malformed and unknown tokens, while keeping the same empty response
  on denial. Anonymous IP/device/network edge-WAF and distributed multi-account
  protection remain open. Independent security, accessibility and product approval,
  a protected deployment, teardown and recovery receipts also remain open;
- **Locally verified implemented candidates:** Teacher announcement publishing
  and a Family announcement-to-new-private-thread reply are no longer code gaps.
  Their database, targeted-contract, UI-browser and protected product-flow
  checks passed for the named local synthetic behaviors; this is not hosted
  verification or production acceptance;
- **Public policy-copy candidate:** current EN/ES Support, Privacy and Terms copy
  distinguishes public local lessons from the default-off school-invited Family
  candidate, describes conditional Supabase/auth/email flows and synthetic/
  approved-tenant retention, and says legacy local/V1 identity does not auto-map.
  It is `IMPLEMENTED_CANDIDATE`, not Privacy, legal, DPA, district or Owner
  approval; the implemented rights workflow remains a candidate pending that
  independent review;
- **Governance candidate:** rights requests, filtered account activity, teacher
  suggestions, two-person JIT support, redaction and invitation decline are no
  longer code gaps. Their 014 SQL/RLS/pgTAP paths, strict DTO/actions, synthetic
  browser surfaces and exact protected local product flow passed. Staffing,
  case policy, user notice, retention approval and hosted operation remain open;
- **Broader learning integration:** the signed assignment-event product caller
  is deliberately limited to synthetic G4 L3. The current canonical Lesson
  release ledger reports `0` published releases and `0` strict-complete
  members, so G4 L3 is not a production release binding. A negative-drift
  contract now fails if a future `published=true` Lesson lacks an explicit V2
  production binding; any non-empty binding still requires separate database,
  route, browser, privacy, Owner and release evidence and must not alter the
  independent Current-JS, fidelity, audio, human/Owner or publication gates.
  Run `npm run verify:family:release-bindings` as a Family telemetry admission
  check. It is deliberately separate from canonical `release-ledger:check` and
  cannot publish, unpublish or redefine a Lesson.

Candidate 013's `tenants.family_messaging_enabled` is not an additional product
flag. It is the database-side, default-off safety mirror of global
`FAMILY_MESSAGING_ENABLED`. The global variable gates app/worker reachability;
the database does not read it, so the tenant mirror independently denies direct
authenticated calls when the database layer is off. Effective product messaging
requires both layers, and operations must set/verify both rather than assuming
one propagates to the other.
With the tenant mirror off, direct send, mark-read, close, Teacher announcement
publish, Teacher inbox and preference opt-in deny; pending `family_message`
outbox rows are cancelled and claim/pre-send validation recheck the mirror.
Existing Family workspace/history and school announcements remain read-only,
while preference opt-out, revoke, relinquish, redaction and retention remain
available. This behavior passed the exact local 001–018 pgTAP and integration
harness. It is not a deployed kill-switch receipt.

These gaps are product/release accounting, not a reinterpretation of the final
security review's `0` open P0/P1 **code finding** disposition.

The previously identified real-time qualifying-`practice_evaluated` ingest race
is **`CLOSED_DYNAMIC_LOCAL`** in this
candidate. The RPC rejects
any transaction isolation level other than `read committed` with SQLSTATE
`25000`; takes a single-assignment batch; requires its authorization join to
resolve to exactly one eligible student/enrollment mapping; and fails closed on
zero or multiple rows. It then locks that uniquely resolved student row for the
whole transaction before the qualifying count. This gives the real-time batch
one stable lock target and avoids arbitrary event ownership or ordering multiple
per-skill locks. The final local pgTAP run includes the isolation, student-lock
and ambiguous-binding contracts in the current `489/489` suite. The exact full
harness also raced two distinct real HTTP ingest requests on two PostgreSQL
backends and verified the deterministic stored event/projection result.
Hosted/production concurrency remains open.

That finding is intentionally narrower than all projection concurrency.
`rebuild_family_projections_v1` is a service-role replay tool that now takes the
same uniquely resolved student-row lock as real-time ingest. Against the exact
current 001–018 artifact, the local loopback harness ran one HTTP ingest
concurrently with one HTTP rebuild, observed two distinct active PostgreSQL
backends, saw both return HTTP 200 after lock coordination, and found a
consistent final event/projection watermark. That closes only the exact local
ingest-vs-rebuild pairing. The separate two-ingest pairing also passed locally.
Neither result closes hosted or production concurrency gates.

Additional security/privacy gates remain open in the candidate even where the
earlier static design gaps now have code:

- **Lifecycle and no-resurrection:** the lifecycle migration adds immutable
  maximum-30-day anchors, terminal tenant shutdown, bounded purge/scrub paths
  across identity, provider, role, relationship, thread/read/preference,
  suppression, content fixtures and operational rows. Migration 017 fixes the
  teardown dependency order for staffed classes. The exact local migration and
  pgTAP run plus two empty-database logical restores passed without reviving a
  closed tenant, expired/revoked link, active role/open thread or a deleted
  governance row. Deployed scheduler behavior, worker-off cleanup, caches,
  logs, test inbox/provider copies, hosted backups, deletion receipts and
  independent operations review remain unverified;
- **Encryption key lifecycle:** the v2 envelope now uses a keyring/key ID,
  purpose-derived token/email subkeys, and immutable purpose/tenant/record AAD.
  Static cross-purpose/record/tenant swap tests do not prove real key
  provisioning, overlapping-key rotation, retirement, compromise response or
  restored-backup behavior;
- **Outbox persistence:** recursive forbidden-key scanning, exact per-kind
  top-level schemas and payload byte/depth/node bounds now exist in candidate
  SQL and are covered by the exact local migration/pgTAP pass. The real
  worker/provider boundary and profile-specific no-egress traces remain open;
  and
- **Projection concurrency:** the shared student-row lock, exact 001–018
  loopback ingest-vs-rebuild test, and exact two-ingest test are verified;
  hosted/production concurrency remains unverified.

The final independent code-security disposition recorded no open P0 or P1 code
findings for the reviewed candidate. It classified the exact local database run
as `CLOSED_DYNAMIC_LOCAL` and the keyring/AAD, one-use issuer attestation,
synthetic-only issuance, revoked-identity denial, recursive exact outbox,
lifecycle/no-resurrection, teacher/admin read RPCs, first-thread contact path,
admin resend, and explicit auth/email selectors as `CLOSED_STATIC`. This is not
release approval. The PostgREST custom-role JWT boundary was dynamically
verified for the exact current 001–018 loopback artifact; hosted Supabase
asymmetric-key configuration and release-environment behavior remain
unverified. The former
remote-HTTP P2 is closed: issuer and webhook-writer clients require HTTPS, with
HTTP allowed only for exact non-production loopback hosts; userinfo/path/query/
fragment and other remote HTTP forms deny in unit tests.

The complete controlled local product E2E and both named concurrency races are
closed for the exact synthetic candidate. Hosted infrastructure checks,
recovery drills, anonymous IP/device/network edge-WAF and distributed
multi-account invitation-probe protection, and
independent release approvals remain fail-closed blockers. None of the local
closures authorizes real data, external recipients or a deployment.

## Independent evidence boundaries

Family-portal work is independent of every Flash-to-JavaScript and lesson
acceptance gate. A family-portal implementation, test, review, or release does
not establish or change any of the following:

- custody, extraction, or interpretation of original FLA/SWF evidence;
- Current-JavaScript registration or page coverage;
- modern My Lesson integration or learner availability;
- original-runtime or visual fidelity;
- audio correctness or audio acceptance;
- human visual review or migration Owner acceptance;
- strict migration completion;
- Lesson release, publication, or wider-curriculum publication.

The reverse is also true: a runnable or published Lesson does not authorize a
guardian to view a learner, create a family relationship, receive a message, or
process real family data. Family surfaces may reference only a release ID and
learner-accessible content state supplied by the product registry; they must not
reinterpret a lesson's migration or acceptance status.

Legacy HELP Math account, password, organization, and activity records are not
family-portal migration inputs. They must not be used to identify adults,
learners, or relationships.

## Real-family activation is a different phase

No real adult or learner may be onboarded until all applicable Privacy Notice,
legal, DPA/contract, target-district, child-notice/consent, security, data-rights,
and Owner gates have written evidence for the exact release. A synthetic demo,
local Clerk candidate, proposed Supabase design, or passing test suite cannot
substitute for those approvals.

The production identity provider, primary database, email/invite provider,
hosting configuration, jurisdictions, retention periods, and subprocessors
remain unapproved until separate decisions and receipts exist. Clerk development,
Supabase local, and the controlled test-email adapter are Phase 1 test
candidates only; this packet does not claim they are configured, verified, or
selected for production.

The root-level `vercel.family-portal.json` is an opt-in candidate only. It is not
evidence of deployment. Its cron belongs only to a controlled synthetic
runtime. The bearer-protected route remains reachable independently of product
flags and always attempts service-only retention first. If either the portal or
email flag is off, it then skips weekly digest, claim and all egress. A UI-demo-
only deployment may include this maintenance route only after its retention-only
scope is explicitly approved and verified against the isolated synthetic store;
otherwise the schedule must be omitted before any server record exists. Once
stored state exists, a product kill switch must never strand it: retain this
route or provide an approved equivalent purge path. Do not activate the opt-in
configuration until the exact synthetic gates, protected audience, flag/route/
cron/test-inbox review, profile-specific egress evidence, rollback and teardown
prerequisites in the
[runbook](./backup-recovery-and-kill-switch-runbook.md#opt-in-vercelfamily-portaljson-activation-prerequisites)
are satisfied. It never authorizes a production alias or real-family use.
The current `mailpit-local` transport and synthetic-demo flag are deliberately
rejected/ignored in a production `NODE_ENV`; therefore the opt-in Vercel
candidate cannot host the local full-email integration profile as written and
must keep messaging/email egress off. The full Mailpit step runs only in an
isolated local harness. Any future hosted synthetic transport requires a new
implementation, threat review and exact authorization rather than weakening
those checks.
The Resend webhook route likewise remains reachable after an outbound kill
switch, but accepts only an exact valid Svix signature and may only append the
allowlisted delivered/bounce/complaint/suppression event through the dedicated
event RPC. Candidate code removes `service_role` from that public route and uses a
short-lived NOLOGIN/no-table/one-RPC `family_webhook_writer` JWT plus publishable
key. The exact current 001–018 loopback harness verified HTTP 204, exactly one
delivery event, the matching outbox transition, exact function/table/sequence
authority, and the anon/authenticated/service-role/wrong-audience/table/cross-
RPC denials. Hosted Supabase asymmetric-key verification and production token
provision/rotation remain unverified.
Continued lifecycle ingress is not permission to send.

## Packet contents

1. [ADR-0001: Phase 1 architecture](./ADR-0001-family-portal-phase-1.md)
2. [Data fields and DTO allowlist](./dto-allowlist.md)
3. [Data flow and subprocessor boundaries](./data-flow-and-subprocessors.md)
4. [RLS permission matrix](./rls-permission-matrix.md)
5. [Invite threat model](./invite-threat-model.md)
6. [Messaging threat model](./messaging-threat-model.md)
7. [Retention and synthetic-data policy](./retention-and-synthetic-data-policy.md)
8. [Backup, recovery, and kill-switch runbook](./backup-recovery-and-kill-switch-runbook.md)
9. [Independent release gates and status template](./release-gates-and-status-template.md)
10. [Production authentication cutover runbook](./production-auth-cutover-runbook.md)
11. [Machine-readable fail-closed status template](./release-gate-status.template.json)
12. [Local integration harness](./local-integration-harness.md)
13. [Implementation status — 2026-08-24](./implementation-status-2026-08-24.md)
14. [Real-family final release receipt verifier](./real-family-release-receipt.md)
15. [External readiness audit — 2026-08-24](./external-readiness-audit-2026-08-24.md)

## Status vocabulary

Use only the following values in this packet's release records:

| Status | Meaning |
|---|---|
| `NOT_STARTED` | Required work or evidence does not yet exist. |
| `NOT_EVALUATED` | This packet does not assess an external independent gate; consult its authoritative ledger/evidence. |
| `DRAFT` | A proposal exists but is not implemented or accepted. |
| `IMPLEMENTED_UNVERIFIED` | Code/configuration exists, but its required verification is incomplete. |
| `VERIFIED_SYNTHETIC` | The exact named synthetic profile passed its named automated and human checks; the other profile is not implied. |
| `BLOCKED` | A named unmet prerequisite prevents the gate from closing. |
| `APPROVED_FOR_SYNTHETIC_RELEASE` | Named reviewers approved the exact synthetic artifact/profile; no real data is authorized. |
| `APPROVED_FOR_REAL_FAMILY_RELEASE` | All real-family gates closed for an exact artifact, tenant scope, data flow, and policy set. This value must never be inferred from another status. |

Blank, unknown, stale, mismatched, or unverifiable evidence fails closed.
