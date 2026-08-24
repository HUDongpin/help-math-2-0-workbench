# ADR-0001: Family portal Phase 1 synthetic architecture

- Status: **Proposed**
- Date: 2026-08-23
- Decision owner: **Owner approval pending**
- Security review: **Prior independent review found no open P0/P1 code issue in its predecessor; 015–018 exact-artifact review and release assurance remain open**
- Privacy/legal/DPA/district review: **Not performed / not approved**
- Implementation status: **Exact local synthetic product flow verified; independent release and production conformance remain unverified**
- Production authorization: **None**

## Context

HELP Math 2.0 has a modern My Lesson learner experience, local-only identity
experiments, device-local progress, and a pseudonymous learning-event path. It
does not currently have an accepted application role/relationship system that
proves an adult may view a particular learner. A public Student/Teacher preview
switch is not authentication or authorization, an anonymous LRS actor is not a
learner identity, and browser-local progress is not a family account record.

The product needs a bounded family experience without prematurely creating real
minor or adult records. The first implementation must therefore demonstrate the
product and security shape using synthetic data while keeping all real-family
flows fail-closed.

## Decision

Build Phase 1 as a district-oriented, invitation-shaped, synthetic-only family
portal. The canonical application role is `guardian`; user-facing copy may say
"Family", "Parent or guardian", or the reviewed Spanish equivalent. A route
name is a product decision and does not grant authority; whichever route is
selected must enforce the same server-side contract.

The Phase 1 portal will:

1. Run only in an explicitly identified synthetic environment or synthetic
   feature mode.
2. Support two named, fail-closed profiles: default `synthetic_ui_demo`, and a
   protected opt-in `synthetic_integration_test` using synthetic Supabase-local
   data, Clerk development identity, and an exact reserved-domain recipient in
   a fixed loopback Mailpit sink/outbox.
3. Use seeded synthetic tenants, adults, learners, relationships, assignments,
   progress projections, support notes, message bodies and test destinations.
4. Resolve application identity and role through an app-owned session boundary;
   product code must not trust editable identity-provider metadata.
5. Authorize every learner read through an active, tenant-scoped
   `GuardianLearnerRelationship` (proposed name) after deriving actor and tenant
   from the server session.
6. Read family-safe projections rather than querying raw learning events, raw
   LRS statements, assessment responses, Nova conversations, or a classroom
   roster.
7. Exercise the projection input only through a separately authenticated,
   signed-in learner assignment path. The current bounded candidate accepts an
   opaque assignment locator for the already registered G4 L3 My Lesson course,
   derives learner/tenant/student/enrollment/content authority server-side,
   returns exactly its 39 source-ordered placements, and records only current
   session `LearningEventV2` events. It never uploads legacy V1/LRS or saved
   browser progress and never gives a guardian a lesson link or learner session.
8. Expose only the fields in [the DTO allowlist](./dto-allowlist.md).
9. In the default UI demo, provide synthetic notes plus a plain-text local reply
   preview capped at 2,000
   characters and component-memory demonstration state for mark-read, terminal
   thread close, and open/closed filtering. A closed thread is read-only and has
   no reopen action. The preview is not sent or persisted to a backend.
10. In the controlled integration profile, exercise a complete synthetic
   invite→family→two-way-message→controlled-test-email→revoke E2E through the
   candidate server actions, RPCs, outbox, retention cron and fixed local
   Mailpit path. The exact-Svix Resend lifecycle webhook is a separate inbound
   maintenance boundary with no send authority.
   Every actor, row, address and message remains synthetic and allowlisted.
   Existing synthetic school announcements may be read in Family Overview; an
   authorized Teacher may publish bounded synthetic plain text only after an
   exact school allowlist/preflight and mutation-side lifecycle recheck. A
   Family reply creates a separate private thread through an allowlisted staff
   contact rather than appending a public announcement comment.
11. Keep all real invitations, arbitrary or real-recipient delivery, real
    messages, exports, real-family writes, and non-test provider configurations
    disabled.
12. Delete every Phase 1 record and provider copy within the 30-day synthetic
    maximum.
13. Preserve the independent lesson/migration gates listed in the packet README.

## Proposed logical components

These names describe contracts, not deployed services:

- **App-owned auth session**: provider-independent subject mapped to an opaque
  application user, active tenant membership, and application role.
- **Family authorization service**: validates tenant membership, `guardian`
  role, active relationship, requested learner, and feature mode on every call.
  The conceptual `GuardianLearnerRelationship` maps to the current candidate
  physical table name `guardian_links`. Migration text in a worktree is
  not evidence that a database was deployed, its policies passed review, or
  the relationship is authorized for real families.
- **Family projection service**: supplies a minimal assignment/progress view
  built from versioned, family-safe projections. The candidate
  `family_workspace_for_tenant_v1` RPC may aggregate bounded synthetic
  `learning_events_v2` rows inside its security boundary, but no raw event row
  or payload is selectable by a family client or returned in a DTO.
- **Bounded learner assignment event bridge**: a non-production, default-off
  companion to the existing G4 L3 My Lesson route. It accepts only an opaque
  assignment UUID, resolves one current signed learner context, cross-binds the
  exact 39 placement/release tuple to the existing course descriptor, strips its
  server-only tenant envelope, and records only a current in-memory batch through
  the assignment-scoped RPC. It is not a Family DTO, guardian navigation,
  historical-progress import, generic lesson launcher, or migration acceptance
  signal.
- **Synthetic fixture store**: deterministic, visibly synthetic data with TTL
  metadata; it must not be loaded from historical HELP Math records.
- **Synthetic notes view**: allowlisted copies of synthetic support notes plus
  a browser-local, visibly unsent reply preview in the default UI demo. It does
  not invoke a send endpoint or delivery integration.
- **Synthetic school-announcement boundary**: a strict Teacher tenant/school
  allowlist, resource-derived preflight and independently reauthorized publish
  mutation for bounded plain text. Family reads occur only inside its already
  authorized workspace. A private reply reuses the ordinary new-thread message
  authorization and never grants roster, announcement-edit, destination or
  monitored-support authority.
- **Controlled synthetic integration service**: default-off server actions,
  transactional RPCs, outbox/cron and a non-production `mailpit-local` adapter
  fixed to `127.0.0.1:1025` and exact `@helpmath.invalid` recipients
  used only for the exact integration profile. It authorizes participants and
  test destinations server-side, caps plain text at 2,000 characters, and emits
  synthetic-only delivery/audit receipts without widening real-family access.
- **Flag-independent lifecycle maintenance**: the bearer-protected cron route
  invokes service-only bounded retention before reading the portal/email egress
  result. Turning either product flag off skips digest enqueue, claim and
  provider egress but does not stop expiry/purge work. The worker parses every
  returned tenant run and fails the request with a retryable error unless each
  status is `succeeded`; an outer successful RPC is insufficient. The signed
  Resend webhook also remains reachable after outbound flags turn off so exact
  Svix-verified delivered/bounce/complaint/suppression events can close already-
  sent work. It uses a short-lived dedicated `family_webhook_writer` JWT plus
  the publishable key; the role is NOLOGIN, has no table privileges, and is
  intended to execute only the event RPC. The public route never holds
  `service_role`. Local claim parsing is only preflight; the exact current
  001–018 loopback PostgREST harness dynamically verified the writer role
  transition, strict HTTP 204,
  one delivery event/outbox transition, exact one-RPC authority and denial for
  anon/authenticated/`service_role`/wrong-audience/table/cross-RPC attempts. The
  RPC can append only an allowlisted
  event, never send or directly mutate outbox state. Hosted asymmetric-key
  validation, an exact deployed schedule, production secret rotation,
  monitoring and deployed deletion/no-resurrection drills remain unverified.
- **Audit sink**: privacy-minimized records of security-relevant access,
  relationship, invite, and kill-switch decisions.
- **Server-enforced release controls**: the Phase 0 product contract authorizes
  only the global Portal, Messaging, and Email switches plus the tenant-level
  `family_portal_enabled` gate. Migration 013's default-off tenant column
  `family_messaging_enabled` is the database-side safety mirror of that same
  approved Messaging switch—not a fifth product flag. Effective messaging
  requires both the global environment switch and the exact tenant mirror. The
  global switch gates application/worker reachability; the database cannot read
  that environment variable, so the tenant mirror independently denies a direct
  authenticated RPC when the database layer is off. Activation and incident
  procedures must set and verify both layers rather than assuming either one
  propagates to the other. Synthetic environment/data-mode checks and the default-off learning-
  event interlock are additional safety predicates, not new invitation,
  relationship, projection, export, or curriculum product switches. Exact 013
  code and local dynamic evidence passed; deployment and release approval remain
  separate.

## Authorization invariants

For a guardian to read learner-scoped data, all of the following must be true:

```text
synthetic_mode
AND exact_phase1_profile
AND authenticated_application_user
AND active_tenant_membership
AND application_role = guardian
AND active_guardian_learner_relationship
AND request_tenant = session_tenant
AND requested_learner = relationship_learner
AND requested_data_class is allowlisted
AND the approved global and tenant portal controls are enabled
```

The server derives the authoritative actor, role, and tenant. A client-supplied
`tenantId`, `guardianId`, `learnerId`, role, relationship status, or feature flag
is an untrusted selector and can never widen access. Missing or ambiguous state
returns a non-disclosing denial.

## Phase 1 product scope

Allowed synthetic views:

- adult greeting using a synthetic alias;
- one or more authorized synthetic learner cards;
- current synthetic assignments and due-state labels;
- lesson/page completion summaries tied to explicit content release IDs;
- coarse skill/support bands with an explanation that they are not grades;
- synthetic school-support notes;
- existing synthetic school announcements for the selected authorized learner;
- a plain-text, maximum-2,000-character local guardian reply preview that is
  visibly unsent and cleared from memory on refresh/sign-out;
- component-memory mark-read plus terminal close/filter demonstration state;
  closed threads are read-only and cannot be reopened;
- in the separately labeled integration-test profile, server-backed synthetic
  invitation, two-way plain-text message, controlled test-email delivery and
  relationship revocation flows with exact test receipts;
- in the same controlled profile, authorized synthetic Teacher announcement
  publishing and a Family announcement-to-private-thread reply through an
  allowlisted staff contact, with no public reply or monitored-support claim;
- privacy, data-use, and synthetic-demo disclosures.

Explicitly out of scope:

- real sign-up, real relationship activation, roster import, arbitrary/real
  email/SMS/push, or recovery of historical HELP Math accounts;
- child-initiated adult linking or relationship proof based only on a shared
  name, code, email, school, browser cookie, or LRS actor;
- real two-way messaging, real/arbitrary recipients, attachments, contact forms,
  production notifications, or real school workflow integration. Synthetic
  server-persisted message/test-delivery records are permitted only in the
  controlled integration profile;
- raw assessment responses, answer keys, exact free text, Nova prompts/replies,
  audio, images, diagnosis, disability, IEP/504, discipline, attendance, precise
  location, credentials, or other sensitive records;
- editing assignments, grades, mastery, pathways, learner settings, teacher
  controls, or My Lesson state;
- a guardian "continue lesson" action or impersonation of the learner;
  `family_workspace_for_tenant_v1`, its strict DTO/type and the Family UI expose no
  `lessonHref`; the internal assignment table may retain a registry-constrained
  field for teacher/service use only;
- persistence of Messages or Settings demo state; only a non-personal theme
  preference may use `localStorage`;
- production auth/database/provider selection or real-family release.

## Data and provider decisions

Phase 1 must work without assuming a production provider. Clerk development
identity and Supabase local are the controlled integration-test candidates and
may hold only synthetic accounts/rows under the exact test profile. The exact
eighteen-migration candidate, fictional seed and 489-test pgTAP plan passed in a
fresh local PostgreSQL 16 database, with 38/38 public tables RLS-enabled. The
same exact current 001–018 artifact was exercised through a disposable loopback
stack using PostgreSQL 16.15, PostgREST 16.2, GoTrue 2.195, Mailpit 1.31 and the
local gateway harness. This does not close any hosted Supabase, asymmetric-key
gateway, provider-cutover, deployment or real-data gate. No
identity provider becomes the source of truth for application role or guardian/
learner relationship.

A future Supabase Auth cutover is governed by
[the production-auth runbook](./production-auth-cutover-runbook.md). The
candidate requires exact `FAMILY_AUTH_PROVIDER`, cutover, issuer and audience
configuration and never accepts Clerk and Supabase simultaneously or falls back
between them. Provider authentication still maps through `app_users`,
`provider_identities`, tenant issuer allowlists and app-owned authorization.
PKCE, verified email, recovery, local/others/global sign-out, session revocation,
rollback and the hosted production PostgREST/RLS boundary remain dynamically
unverified and Owner/Privacy/Legal/DPA/district-gated; no production cutover is
authorized. A successful synthetic GoTrue signup and one local Mailpit capture
do not close those production-auth gates.

A controlled email adapter may deliver only to the fixed local Mailpit sink for
an exact reserved-domain recipient. `FAMILY_EMAIL_TRANSPORT=mailpit-local` is
non-production-only, fixed to `127.0.0.1:1025`, and is not a general SMTP or
Resend fallback. Its local access, capture, payload allowlist, cleanup/deletion
path and egress trace must be bound to the synthetic test receipt. The
same-origin server-only action validates the exact development
issuer and verified allowlisted test address, then computes a versioned keyed
HMAC with a separate 32-byte base64url secret. SQL compares that HMAC only; the
database receives neither address plaintext nor HMAC/decryption keys, and a
browser/direct RPC cannot bypass the issuer boundary. This limited test path is
not approval of real invite or message email.

The candidate now grants create/resend to neither `authenticated`,
`service_role` nor `public`. An authenticated scoped administrator may request
a one-use, 90-second attestation bound to actor issuer/subject, tenant,
synthetic student, recipient digest and idempotency key; only the dedicated
NOLOGIN/no-table `family_invitation_issuer` custom role can consume it through
the create/resend RPC. The app supplies a short-lived externally provisioned
ES256 bearer and performs a local claim/time preflight, but cryptographic
signature and role assumption remain the gateway's responsibility. The local
PostgreSQL/pgTAP pass verifies the database role/grant/attestation shape, and the
exact current 001–018 loopback PostgREST harness verified HTTP create/resend plus
the anon/authenticated/service-role/wrong-purpose/wrong-audience/table/cross-RPC
denial matrix and the protected local invite-to-revoke product E2E. Hosted
asymmetric-key behavior, production credential rotation and release approval
remain open.

Candidate v2 encryption now uses a keyring/key ID, purpose-derived token/email
subkeys and immutable tenant/record/purpose AAD, and candidate outbox validation
is recursive, complexity-bounded and exact-kind. Both are
`CLOSED_DYNAMIC_LOCAL`, not release approval. Controlled integration remains
default off outside the exact harness. Hosted keyring, gateway roles,
outbox/worker/provider rotation and compromise drills remain unverified. Complete
identity/contact/relationship/message/provider/backup
lifecycle anchors and terminal teardown have candidate SQL. The exact local
runner deleted an expired governance record and preserved terminal state across
two fresh logical restores, but provider/test-inbox/log/cache/hosted-backup
reconciliation, deployed deletion receipts and independent operations review
remain open. Real-time ingest and service-role
projection rebuild now share the same uniquely resolved student-row lock. For
the exact current 001–018 artifact, one local HTTP ingest and one HTTP rebuild
ran concurrently on two active PostgreSQL backends and finished consistently
after lock coordination. A separate two-ingest race also passed locally;
hosted/production concurrency remains open.
These are security/privacy lifecycle blockers, not deferred polish.

Prior independent security review reported no open P0/P1 code finding for its
reviewed predecessor. The local PostgREST custom-role JWT boundary was dynamically verified
for the exact current 001–018 artifact; hosted Supabase asymmetric-key and
release-environment behavior remain open, and migrations 015–018 require an
independent exact-artifact review. The
former remote-HTTP P2 is closed by
unit-tested URL policy: HTTPS is required except for exact non-production
loopback HTTP, and remote/userinfo/path/query/fragment variants fail closed.

The eventual production store must support deny-by-default tenant isolation,
row-level enforcement, immutable audit, retention/deletion propagation, and
backup suppression. Candidate migration text does not settle the exact
database/provider/account/region or close configuration and operational review.

Existing anonymous xAPI/Learning Locker events are not silently attached to a
new learner. The current synthetic G4 L3 projection path begins only from an
explicitly authorized, versioned identity/event boundary. Historical SQL accounts and
activity are prohibited inputs.

The candidate real-time ingest shape is limited to `read committed`, a
single-assignment batch, exactly one authorized student/enrollment mapping, and
a transaction-held lock on that unique student row. Non-`read committed`
isolation and zero/multiple mappings fail closed. The current pgTAP suite verifies
those named contracts. `rebuild_family_projections_v1` uses the same student-row
lock, and the exact one-ingest/one-rebuild plus two-ingest local HTTP pairings
passed; hosted and production concurrency still require separate evidence.

## Content and acceptance separation

A family projection may carry `contentReleaseId`, `lessonId`, completion counts,
and an availability label received from the product registry. It must not
calculate, promote, or restate Current-JS coverage, Flash fidelity, audio
acceptance, strict completion, migration Owner acceptance, Lesson publication,
or wider-curriculum release.

Family-portal Owner acceptance concerns only the family product surface and does
not count as migration Owner acceptance. Likewise, migration Owner acceptance
does not approve family data processing or family release.

## Alternatives rejected for Phase 1

| Alternative | Reason rejected |
|---|---|
| Add `guardian` to the public query-string role switch | It is a preview mechanism, not authorization. |
| Read Learning Locker directly from the browser | It would bypass application authorization and expose raw event semantics. |
| Infer a learner from the current anonymous actor cookie | A pseudonymous device actor does not prove learner or family identity. |
| Import historical HELP Math accounts/relationships | Legacy identities, credentials, and records are restricted, stale, and not proof of current authority. |
| Start with real email invitations | Identity, consent, provider, legal, DPA, district, support, and retention gates are open. |
| Implement real live two-way messaging | Recipient authority, moderation, records obligations, notifications, and abuse controls are unresolved. Controlled synthetic two-way E2E remains in Phase 1. |
| Let guardians enter My Lesson as the child | This confuses adult and learner sessions and risks corrupting learner state. |
| Let a successful portal test imply Lesson acceptance | Family and migration evidence domains are independent. |

## Consequences

Benefits:

- product and security behavior can be reviewed without collecting real PII;
- the role/relationship model is explicit and testable;
- the UI can be developed against stable, minimal DTOs;
- future identity/database provider choices remain replaceable;
- release status cannot silently expand into real-family or Lesson acceptance.

Costs and limitations:

- Phase 1 can demonstrate only controlled synthetic test delivery; it cannot
  demonstrate real delivery, district rostering, consent,
  identity proofing, support operations, or cross-device family history;
- synthetic progress cannot prove the production event/projection pipeline;
- a second authorization and release program is required before real families;
- provider-specific RLS, backups, monitoring, and deletion remain to be
  reconciled with this contract and independently verified; candidate code is
  not acceptance evidence.

## Conditions to supersede this ADR

A successor ADR must be approved before any real-family pilot. It must bind the
exact operating model, legal basis, district responsibility, identity and
relationship proofing, providers/subprocessors, field inventory, retention,
data-rights channel, incident response, rollback, and release evidence. It must
also explicitly state that none of those decisions changes a Lesson migration
or publication gate.
