# Family portal independent release gates and status template

Status: **Draft gate contract; no gate is closed by this document**

## Three release outcomes that must not be conflated

1. **Synthetic implementation verified**: exact code and synthetic behavior
   pass the required technical checks. This does not authorize deployment.
2. **Synthetic release approved**: named authorized reviewers approve one exact
   protected synthetic artifact/deployment with no real PII. This does not
   authorize real family access or public production.
3. **Real-family release approved**: all privacy, legal, DPA/contract, district,
   identity, consent/notice, security, operations, data-rights, Owner and exact
   release gates close. This cannot be inferred from the first two outcomes.

Unknown, missing, stale or artifact-mismatched evidence fails closed. A verbal
"looks good", passing unit test, READY deployment, local login, synthetic demo,
or existing HELP Math release cannot substitute for a required receipt.

Synthetic evidence must name one profile. `synthetic_ui_demo` is the default,
no-egress local interaction surface. `synthetic_integration_test` is a separate
protected opt-in that may exercise Supabase local, Clerk development,
server actions/RPC/RLS, outbox/cron/signed webhook and one exact loopback
Mailpit test sink for reserved `@helpmath.invalid` recipients. Passing one
profile does not imply the other passed. The local sink is not an external
provider/recipient authorization.

`APPROVED_FOR_SYNTHETIC_RELEASE` and Phase 1 exit require both profiles and the
complete controlled invite→family→two-way-message→test-email→revoke/deny/delete
E2E. A verified UI demo alone may be reported only as
`VERIFIED_SYNTHETIC` for `synthetic_ui_demo`.

## Phase 1 synthetic gates

| ID | Gate | Required evidence | Required independent decision | Failure result |
|---|---|---|---|---|
| `FP-S00` | Scope and Owner direction | Approved ADR/scope, synthetic-only audience, route/role/copy, explicit non-goals and independent Lesson boundaries | Product Owner for exact scope | Family work remains `DRAFT`; no release. |
| `FP-S01` | Artifact and change control | Exact Git commit/tree, branch, clean diff review, dependency/build lock, generated file check, no unrelated/private artifacts | Release reviewer separate from implementer | Artifact cannot be promoted. |
| `FP-S02` | Synthetic data provenance | Deterministic fixture inventory/digest; `data_mode`; no real/legacy input; exact synthetic Clerk-dev/reserved-domain-Mailpit provenance; PII/secret/forbidden-field scan | Privacy/data reviewer | Global and tenant Portal controls remain off. |
| `FP-S03` | DTO and egress boundary | Exact profile/versioned schema tests, unknown-field rejection, recursive prohibited-field scan including nested outbox payloads, exact per-kind/depth/byte bounds, private/no-store proof; UI-demo no-egress trace; integration exact test-provider/destination allowlist trace | Security/privacy reviewer | API/data surface disabled. |
| `FP-S04` | App identity and role | Provider-independent session; exact active Clerk-development issuer/subject allowlist; synthetic identity lifecycle; server-derived tenant/role; no editable metadata authority; server-only invite-accept boundary and direct-RPC bypass denial | Identity/security reviewer | All family routes deny. |
| `FP-S05` | Relationship authorization and RLS | Exact migration/policy digest, service and direct-policy negative suite, revoke/cache/race tests, no client tenant/role trust; same signed identity in two tenants proves explicit tenant/default-child scoping, child-cookie clearing, owner-only unscoped core and no fallback/merged report | Database/security reviewer | Learner-scoped reads/writes deny. |
| `FP-S06` | Synthetic invite | Default-off proof plus controlled create→fixed-loopback-Mailpit delivery→fragment/session-key cleanup→atomic redemption; token entropy/digest; versioned keyed-email HMAC using a separate 32-byte base64url server-only key; no bare hash/plaintext/database key; exact issuer; single use/expiry/revoke/race/rate limit/CSRF/reserved-domain policy/no token leakage; HMAC rotation plus AES purpose/tenant/record/version binding, swap denial and keyring/destructive-rotation test | Security reviewer | Global and tenant Portal controls remain off; issuer capability and recipient policy are withdrawn; Messaging and Email remain off. No separate invitation product flag is implied. |
| `FP-S07` | Family overview/progress and synthetic event boundary | Functional/API/browser tests; strict learner-scoped `LearningEventV2` write if exercised; `read committed` fail-closed enforcement; one-assignment batch; exact-one student/enrollment mapping and ambiguous-binding denial; student-row lock plus two-session ingest race test; rebuild-versus-live-ingest maintenance-window or shared-lock proof; raw-table denial; aggregate/projection-only family read; consistent counts/watermark/release IDs; no historical anonymous LRS/answer/Nova/other learner; no learner impersonation | Product/data reviewer | Global/tenant Portal and internal learning-event safety predicates remain off; service-role rebuild stays disabled until the exact target environment has either an approved ingest-quiescent maintenance receipt or the shared-lock/concurrent-session proof. No projection product flag is implied. |
| `FP-S08` | Synthetic messaging profiles | UI demo: fixed notes, visible non-delivery, local `maxlength=2000`, no write/egress, component-memory state, terminal close/no reopen. Integration: distinct server compose, two-way plain text ≤2,000 at every boundary, authorized participants, global Messaging switch **AND** exact tenant database mirror, direct-RPC denial while either is off, pending-message outbox cancellation plus claim/pre-send recheck, outbox/cron/fixed-loopback Mailpit, separately tested exact-Svix lifecycle webhook, dedicated short-lived no-table/one-RPC writer JWT rather than `service_role`, revoke/suppress/delete E2E | Product/security reviewer | Global Messaging and every tenant mirror remain off; Email remains off; real messaging remains off. The tenant mirror is not a new product flag. |
| `FP-S09` | Retention/deletion | 30-day absolute policy; original anchors and terminal tenant-teardown coverage for identity/contact, provider, role/fixture, relationship, thread/read/preference, suppression, content and operational classes; local/cache/queue/test-inbox/provider/log/backup reconciliation; deletion receipt; restore no-resurrection | Privacy/operations reviewer | Affected feature or global family portal off. |
| `FP-S10` | Backup/recovery/kill switch | Control inventory, actual disable proof, clean regeneration/restore, measured synthetic RPO/RTO, rollback/no-resurrection drill | Operations/security reviewer | No release; global off on uncertain scope. |
| `FP-S11` | Security and abuse | Threat-model closure; CSRF/origin; exact create 5/hour+20/day, resend 3/hour+10/day, message 20/10-minutes+100/day and known-invitation lifetime-10 database budget tests; signed-provider-identity acceptance aggregate 20/10-minutes+100/day with a non-disclosing denial shape; independent anonymous IP/device/network edge-WAF and distributed multi-account controls; CSP/cache/error/log review; dependency/secret scan; HMAC-vs-encryption key separation; AES purpose/context AAD or subkeys; explicit key version/keyring; writer-JWT/Svix least-purpose access; nested-outbox rejection; rotation/compromise drill; high/critical finding disposition | Independent security reviewer | Any open critical/high or missing anonymous/distributed volumetric protection blocks release. |
| `FP-S12` | EN/ES and accessibility | Semantic equivalence, visible synthetic copy, keyboard/focus/screen reader/reflow/zoom/reduced-motion/contrast, automated + named human results | Language/accessibility reviewers | No synthetic release. |
| `FP-S13` | Product/human acceptance | Exact supported devices/flows, no misleading production/teacher/message/grade claims, family usability review | Product Owner; family/educator reviewer if authorized | No synthetic release. |
| `FP-S14` | Protected synthetic deployment | Exact build/deployment ID; opt-in config digest; cron/route inventory; access boundary; environment/provider/data inventory; runtime/browser/API/no-egress verification; rollback object | Release manager after prior gates | No alias/public promotion; rollback/disable. |
| `FP-S15` | Synthetic release receipt | Immutable receipt binds every prior evidence digest, reviewers, exceptions, switch states, 30-day expiry/teardown date | Owner authorizes exact protected synthetic artifact | Status remains `VERIFIED_SYNTHETIC`, not released. |

`FP-S00` through `FP-S15` may close only for synthetic data. The approved
artifact must continue to show a visible synthetic/non-operational notice.

The candidate denies create/resend invitation RPCs to `authenticated`,
`service_role` and `public`, removing the direct caller-chosen-proof bypass. It
now has a dedicated NOLOGIN/no-table custom issuer role and a 90-second one-use
attestation bound to the scoped administrator, signed identity, synthetic
tenant/student, recipient digest and idempotency key. App code supplies an
externally provisioned short-lived ES256 bearer and has no signing-key or
service-role fallback. The exact local PostgreSQL/pgTAP run verifies the role,
grant and attestation contracts (`CLOSED_DYNAMIC_LOCAL`); the app/key shape is
`CLOSED_STATIC`. The exact current 001–018 disposable loopback PostgREST harness
also verified HTTP create/resend, the caller/claim/table/cross-RPC denial matrix,
and the protected browser product journey.
`FP-S04`, `FP-S05`, `FP-S06` and every dependent integration/message/email gate
remain blocked until independent review, one-use/key-rotation drills, hosted
asymmetric-key behavior where required, and an exact release decision pass for
the candidate.

## Opt-in Vercel candidate is not a deployment

`vercel.family-portal.json` is an opt-in candidate configuration, not evidence
of a Vercel project, deployment, alias, domain, cron installation, or approval.
It must not be activated until the prerequisites in the
[kill-switch runbook](./backup-recovery-and-kill-switch-runbook.md#opt-in-vercelfamily-portaljson-activation-prerequisites)
are met. At minimum, the exact configuration must be digest-bound. For UI demo,
messaging/email flags remain off and the declared
`/api/cron/family-notifications` schedule is either omitted before server state
exists or approved and verified as retention-only against the exact isolated
synthetic store. Once state exists it may be removed only after an approved
equivalent lifecycle path takes over. For a
separately approved controlled integration test, its email branch may run only
against the synthetic outbox and exact reserved-domain loopback-Mailpit sink
with signed webhook, lease/validate/complete, retry, log, retention,
revoke/suppression and deletion evidence. The synthetic-runtime condition must
be reconciled without weakening it. `FAMILY_EMAIL_DIGEST_KEY` must be a
validated 32-byte base64url server-only secret, separate from the outbox
encryption key, with version/rotation/compromise evidence; neither secret value
may be recorded in a status receipt. Exact-issuer validation, direct-RPC bypass
denial, a protected audience, and rollback/teardown plan must also exist.
The only current email integration transport is non-production
`mailpit-local`, fixed to `127.0.0.1:1025` and exact reserved-domain recipients.
It is rejected in a production `NODE_ENV`, so the Vercel candidate must keep its
email branch off. A local Mailpit receipt cannot be promoted into an external
provider/inbox or hosted-email approval.
The Resend event route remains reachable when outbound flags are off only so
exact-Svix-verified delivered/bounce/complaint/suppression events can close
already-sent work. It may append through the event RPC only; it cannot send or
directly update the outbox. Its dedicated NOLOGIN `family_webhook_writer` must
have zero table/other-function authority and use a short-lived JWT plus
publishable key; the public route never receives `service_role`. Local claim
preflight is not signature verification. The exact current 001–018 loopback
PostgREST harness verified strict HTTP 204, exactly one event/outbox transition,
exact least authority and denial for anon/authenticated/`service_role`/wrong-
audience/table/cross-RPC attempts. Hosted
Supabase asymmetric-key behavior, production credential rotation and a deployed
webhook remain unverified.

The candidate's one bearer-protected cron route remains reachable and runs
retention before product-flag branching. If either portal or email is off it
skips weekly-digest enqueue, claim and all egress; only when both are on may the
email branch proceed. The worker requires every tenant retention run status to
be `succeeded` or returns a retryable failure. That code path and opt-in schedule
are not evidence that a Vercel cron exists or that cadence, alerts, cleanup and
deployed no-resurrection work. The exact local runner's two logical restores
passed, but they do not establish any Vercel or managed-backup behavior.
Projection rebuild remains manual with no declared cadence. `FP-S09` stays open
until the authenticated retention route, secret, runtime results, worker-off
case and managed-backup/external-copy deletion drill are bound to the exact
deployed artifact.

Activating this file cannot close `FP-S14` by itself. No production alias or
real-family deployment is authorized, even after a protected synthetic test.

## Real-family gates

All of these are initially `NOT_STARTED`. They are required even if every
synthetic gate passes.

| ID | Gate | Minimum closure evidence |
|---|---|---|
| `FP-R00` | Owner approves real-family product scope | Exact audience/operating model, features/non-goals, tenant/route/role, launch cohort and authority record. |
| `FP-R01` | Privacy Notice and data inventory | EN/ES approved notice and exact browser/server/provider/field/purpose/retention/rights inventory for the release. |
| `FP-R02` | Legal basis and child/family terms | Written qualified legal review of parent/guardian/school roles, notice/consent, eligibility, FERPA/COPPA/state/jurisdiction and rights handling. |
| `FP-R03` | Contract/DPA/subprocessors | Executed applicable agreement/DPA; exact processor/subprocessor, region, use, retention, deletion, incident and change-notice terms. |
| `FP-R04` | Target district authorization | Named district/school scope, responsible officials, IdP/SIS/roster/relationship authority, notice/consent and written go/no-go. |
| `FP-R05` | Production identity and relationship proof | Adult account verification, app-owned roles, guardian/learner authoritative provenance, invite/recovery/revoke/offboarding, MFA for privileged users and audit. |
| `FP-R06` | Real data platform | Production tenant isolation/RLS, versioned events/projections, field minimization, encryption/keys, export/delete/correction, retention, backups and restore suppression. |
| `FP-R07` | Real invite and notification | Exact provider/credentials/domain/delivery fields, anti-abuse, safe-link behavior, bounce/complaint/opt-out, content/privacy/retention and incident tests. |
| `FP-R08` | Live messaging, if included | Successor ADR/threat model, sender/recipient authority, moderation/escalation/support, records/notifications/retention. Default is excluded/off. |
| `FP-R09` | Security assurance | Threat model, code/config review, penetration test, 0 open critical/high, monitoring/on-call/incident tabletop and break-glass review. |
| `FP-R10` | Accessibility/language/human UAT | EN/ES equivalence, named human WCAG/core-flow results, mobile/Chromebook, family/district UAT and support training. |
| `FP-R11` | Production retention/recovery | Contract-bound rules, delete/export receipts, provider deletion, backups/RPO/RTO restore drill, no-resurrection and rollback. |
| `FP-R12` | Exact Owner/legal/district release authorization | All three authorities bind exact commit/build/deployment, policy versions, tenant/cohort, provider inventory and rollback. |
| `FP-R13` | Staged production/promotion verification | Protected staging then exact authorized promotion; browser→API→RLS→data flow, DNS/TLS/cache/log/egress/rollback and runtime verification. |
| `FP-R14` | Post-release monitoring and acceptance | Time-bounded elevated monitoring, access/deny/retention/incident checks, no unauthorized data/provider, named acceptance and no rollback trigger. |

If live messaging, export, real invite delivery, or another feature is omitted,
its switch remains off and verification must prove there is no call, data send,
UI promise, route, outbox or provider dependency. Omission is not implicit
approval to add it later.

### Final real-family receipt boundary

After—and only after—every `FP-R00` through `FP-R14` authority has produced its
own evidence, use the [real-family release receipt verifier](./real-family-release-receipt.md).
It requires all fifteen root-contained SHA-256 evidence files, all fifteen
gate-bound Ed25519 signatures, distinct accountable keys for Owner scope,
legal basis, district, independent security and independent accessibility, ten
exact production positive/negative checks, a current ≤30-day receipt and the
exact clean Git commit. The actual receipt, evidence and trust roots stay in a
restricted external store.

The verifier cannot create an approval or deployment. Missing inputs and the
current dirty/unapproved worktree return
`REAL_FAMILY_RELEASE_RECEIPT_INVALID`; this is the only honest current result.
Run:

```bash
npm run verify:family:real-release-receipt -- \
  --receipt <external-receipt.json> \
  --evidence-root <external-evidence-directory> \
  --trust-roots <external-trust-roots.json>
```

## Independent Lesson and migration gates

The family status record must reference—but must not set, refresh, close or
reinterpret—the authoritative state for each independent gate:

| External gate | Family portal effect | Required treatment |
|---|---|---|
| Original FLA/SWF source custody/evidence | None | Preserve sources; family artifacts do not read or bundle them. |
| Current-JavaScript page registration/coverage | None | Consume only product-authorized release metadata; do not recalculate or promote coverage. |
| Modern My Lesson integration | None | Family portal does not replace, remove, enter as learner, or write My Lesson state. |
| Original-runtime and visual fidelity | None | No family screenshot/QA/result is fidelity evidence. |
| Audio correctness/acceptance | None | Family portal copy/status cannot assert audio acceptance. |
| Human visual migration review | None | Family usability review is a different named review. |
| Migration Owner acceptance | None | Family Owner acceptance is product-surface-only. |
| Strict migration completion | None | Family progress does not change a strict ledger. |
| Lesson release/publication | None | Family release is not Lesson publication; Lesson publication is not family authorization. |
| Wider-curriculum publication | None | A family catalog/count must fail closed to exact learner-accessible releases. |

Each external gate is recorded as `NOT_EVALUATED` in the family template unless
the status record links to a separately current authoritative ledger/receipt.
Even then, the family record copies no conclusion; it records only a reference
and digest/currentness check.

## Status record rules

Use [the JSON template](./release-gate-status.template.json) for each candidate.

- Replace every placeholder; null or placeholder means not closed.
- Bind an exact commit/tree, build, deployment, policy/schema/fixture version,
  provider/environment inventory, test/evidence digest and reviewer identity.
- Record observed/approved timestamps separately.
- Store no secret, credential, token, PII, real learner identifier, raw message,
  Nova content, LRS actor or private source path.
- Record exceptions as blockers unless the exact gate owner formally accepts a
  bounded synthetic exception that cannot affect a real-family gate.
- A code/config/schema/data-flow/provider/policy/route/content/kill-switch change
  makes affected evidence stale and requires a new candidate/receipt.
- Never edit an immutable historical receipt to match a newer candidate.
- A status file is evidence metadata, not the evidence itself.

## Human-readable status template

```text
Candidate ID:
Recorded at (UTC):
Data mode: synthetic | real-family
Phase 1 profile: synthetic_ui_demo | synthetic_integration_test
Git commit/tree:
Build/deployment:
Environment/audience:
Schema/RLS/DTO/fixture versions and digests:
Provider/subprocessor inventory version:
Email-HMAC and outbox-encryption key versions (never values):
Opt-in deployment config path + SHA-256:
Cron/route inventory and disabled-path evidence:
Privacy/Terms/DPA/district versions (real-family only):
Kill-switch states:
Retention deadline / teardown date:

Synthetic gates FP-S00..FP-S15:
  status:
  evidence paths + SHA-256:
  reviewer + role + observed/approved time:
  blockers/exceptions:

Real-family gates FP-R00..FP-R14:
  status:
  evidence paths + SHA-256:
  reviewer + role + observed/approved time:
  blockers/exceptions:

Independent Lesson/migration gates:
  NOT_EVALUATED or authoritative reference + current digest only
  familyPortalEffect: NONE

Overall synthetic implementation status:
Synthetic UI-demo status:
Synthetic integration-test status:
Overall synthetic release status:
Overall real-family release status:
Production verification status:
Rollback/disable disposition:
Next smallest safe action:
```

## Current packet verdict

At the current packet evidence date (2026-08-24):

- documentation and implementation artifacts exist in the isolated worktree;
  they are not committed, deployed or approved for real family data;
- the exact eighteen migrations and fictional seed applied to fresh PostgreSQL
  16, pgTAP passed `489/489` with no fail/skip/todo, and all 38 public tables had
  RLS enabled. Exact SHA-256 values are recorded in the RLS matrix;
- the exact 001–018 PostgreSQL 16.15/PostgREST 16.2/GoTrue 2.195/Mailpit 1.31
  harness passed dedicated issuer/writer role matrices, same-identity dual-
  tenant isolation, ingest-vs-rebuild and two-ingest two-backend races, message-
  gate linearization, preference idempotency, a real-HTTP 21-probe invitation-
  acceptance budget check, and owned cleanup;
- the same runner terminalized the staffed fictional Maple tenant, deleted an
  expired governance record, created a 930,281-byte logical snapshot and
  restored it into two empty databases. Both restored 38/38 RLS catalogs kept
  closed/expired/revoked/deleted state terminal; the local timings are not a
  production RPO/RTO commitment;
- the protected browser product flow passed: administrator invite, outbox to
  loopback Mailpit, adult signup and email verification, invite acceptance,
  protected Family workspace, current-session sign-out, Mailpit recovery link,
  PKCE callback, password update, old-password denial, generic duplicate sign-up
  response, exact-one auth/provider identity cardinality, new-password sign-in,
  notification opt-in, guardian message, teacher reply, persisted history,
  reminder delivery, guardian rights request, teacher access suggestion, school
  review, distinct district-admin approval of one 15-minute exact-thread support
  case, redaction tombstone, administrator revoke and immediate `404` denial;
- a production-shaped GoTrue refresh grant retained the exact mapped
  authorization context. The same local run then globally revoked that session,
  denied its old token, restarted Next with provider/cutover/product/egress
  controls disabled and observed `404` for all Family/auth entry paths;
- application evidence is `56/56` focused Family tests, typecheck and exact
  changed-file lint green, `7/7` synthetic Family Playwright, `1/1` signed G4 L3
  LearningEventV2 Playwright, and a current direct Next production build. The
  repository build wrapper remains independently blocked before Next by the
  missing Grade 5 `L5VB12.swf`; no source asset was copied or altered;
- the rendered accessibility engineering review records desktop/phone and
  light/dark screenshots, visible skip-link focus, 44 x 44 phone language
  targets and blocking axe coverage on all five Family screens. This is
  automated/visual candidate evidence only; named manual WCAG 2.2 AA,
  screen-reader, zoom/forced-colors and human acceptance remain open;
- the Family workspace is exact-tenant scoped; Messaging requires the approved
  global switch plus its default-off tenant database mirror; direct disabled-
  state calls and pending outbox work fail closed. These checks are local, not a
  deployed kill-switch receipt;
- independent code-security review recorded no open P0/P1 code finding for its
  reviewed candidate. `SECURITY_ACCEPTED` nevertheless remains open until the
  final exact artifact receives the required independent release review and
  production-environment evidence;
- migration 018 bounds non-replay invitation acceptance attempts for one signed
  provider identity at 20/fixed 10 minutes and 100/UTC day without retaining a
  token, email or raw provider identity. Remaining volumetric protection at the
  anonymous IP/device/network edge-WAF and distributed multi-account layers,
  plus real key/provider rotation and
  compromise drills, managed backup/restore no-resurrection, hosted scheduler
  and deployed teardown receipts. The governance workflows are implemented local candidates,
  but their hosted operating policy, staffing, notices and independent approval
  remain open. LearningEventV2 product integration is still limited to signed
  synthetic G4 L3. The canonical release ledger currently reports no published
  Lesson; a negative-drift contract requires an explicit production V2 binding
  before a future published Lesson can pass the focused Family suite, without
  granting publication or replacing its independent evidence;
- production identity/provider/account configuration, hosted Supabase, Vercel,
  Resend/domain, deployment, production verification, legal/privacy/DPA,
  district, accessibility-human, security-release and Owner authorization are
  not established by local evidence;
- `npm run verify:family:production-config` is a network-free, secret-redacted
  prerequisite only. The current unconfigured environment returns
  `CONFIGURATION_NOT_READY`; its ready-shape fixture returns
  `CONFIGURATION_READY_NOT_RELEASE_APPROVED` and can never set release approval.
  Hosted provider/domain/webhook/scheduler, independent review, authorization,
  deployment and production behavior still require separate receipts;
- Phase 1 remains synthetic-only; real PII, external recipients, real-family
  access, live real messaging and exports remain unauthorized and off; and
- every Lesson/migration/Current-JS/My Lesson/fidelity/audio/Owner/strict/release
  gate remains independent and unassessed by this packet.
