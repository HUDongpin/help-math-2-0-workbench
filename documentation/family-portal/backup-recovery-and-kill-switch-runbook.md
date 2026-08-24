# Family portal backup, recovery, and kill-switch runbook

Status: **Proposed synthetic runbook; no backup, alert, switch, RPO/RTO, or production recovery capability is claimed**

## Scope and priority

This runbook covers only Phase 1 synthetic family-portal state. It must not
modify, rebuild, delete, restore, republish, or reinterpret:

- original FLA/SWF/source archives or evidence;
- Current-JavaScript registries or page coverage;
- the modern My Lesson player or learner progress on an existing device;
- fidelity/audio/human/Owner/strict-completion evidence;
- Lesson release or publication ledgers;
- production aliases or deployments without separate authorization.

If an incident affects shared infrastructure, disable the family surface first
and coordinate through the owning product/release process. Never repair family
availability by weakening content, auth, privacy, RLS, migration or publication
gates.

## Recovery strategy for synthetic Phase 1

The preferred recovery source is reviewed, deterministic fixture templates plus
schema/migration code—not a long-lived copy of instantiated synthetic users or
activity. Recreate a clean isolated environment and new synthetic IDs rather
than restoring stale session, invitation, relationship, UI-state or message
records.

If a stateful synthetic database snapshot is required to test restore behavior,
it must be isolated, access-controlled, encrypted under a reviewed key policy,
inventory-bound, and aged/deleted before each source record's original 30-day
deadline. A restore never resets retention clocks and must apply deletion
tombstones/suppression before becoming readable.

Proposed internal recovery objectives for a synthetic demo are `RPO <= 24h` and
`RTO <= 8h`. They are test targets only, not measured results, contractual SLOs,
or production commitments.

## Approved kill-switch registry

Phase 0 authorizes exactly three global product/reliability switches and one
tenant gate. This runbook does not invent separate invitation, relationship,
projection, note, export, or real-data product flags. Those capabilities remain
bounded by authorization, synthetic data mode, recipient/provider policy, RPC
grants, retention policy, and the absence of a real-data release—not by an
undecided flag taxonomy.

| Approved control | Fail-closed state | What disabling it must do |
|---|---|---|
| `FAMILY_PORTAL_ENABLED` | `false` | Deny every Family product route and ordinary product API/data operation; show a non-disclosing unavailable state and clear local synthetic UI state on next load. Do not strand lifecycle duties: bearer-protected retention and exact-Svix-signed delivery-event ingest remain independently reachable. |
| `tenants.family_portal_enabled` | `false` | Deny every Family read or mutation for that exact tenant, including an app-selected tenant. It must not cause a fallback to another tenant or a cross-tenant merged workspace. |
| Messaging: global `FAMILY_MESSAGING_ENABLED` **AND** tenant `tenants.family_messaging_enabled` | both `false` | Deny server compose/send/thread-state mutations and prevent message-derived outbox creation. Browser-local visibly unsent synthetic preview remains a distinct UI-only behavior. The tenant column is a database-side safety mirror of the already approved Messaging switch—not a fifth product flag. The global variable gates app/worker reachability; SQL cannot read it, so the tenant mirror independently denies direct authenticated database calls when the database layer is off. Operations must set and verify both layers. |
| `FAMILY_EMAIL_NOTIFICATIONS_ENABLED` | `false` | Deny new digest enqueue, claim, and outbound email. Retention still runs, and the exact-Svix-signed webhook remains reachable to close already-sent delivery, bounce, complaint, and suppression state. |

Missing, invalid, stale, inaccessible, or conflicting control state is `off`.
Client UI state cannot enable a control. Enforcement occurs server-side before
data access or mutation; RLS, tenant status, synthetic data mode, recipient
allowlists, and least-privilege RPC grants remain independent denial layers.

### Candidate environment-variable mapping

| Approved control or safety predicate | Candidate code/configuration | Phase 1 requirement |
|---|---|---|
| Global Portal | `FAMILY_PORTAL_ENABLED` | Exact lowercase string `true` is necessary but never sufficient for product access; default/missing is off. It does not disable the separately authenticated retention or delivery-event maintenance routes. |
| Tenant Portal | `tenants.family_portal_enabled` | Must be true only for the exact selected tenant and rechecked by each authoritative read/mutation. Switching tenants clears the selected-child cookie; a missing or ambiguous tenant/child mapping fails closed. |
| Messaging | global `FAMILY_MESSAGING_ENABLED` **AND** tenant `tenants.family_messaging_enabled` | Both are false in the default UI demo and both must be true only for the exact protected synthetic integration tenant/E2E. The global variable gates application and worker behavior; the tenant mirror gates direct authenticated message send, mark-read, close, Teacher announcement publish and Teacher inbox reads. Enabling notification preferences also requires the tenant mirror, while opting out remains available. Turning the tenant mirror off cancels pending `family_message` outbox rows; service claim and pre-send validation recheck it. Existing Family workspace/message history and school-announcement reads remain read-only, and revocation, relinquishment, redaction and retention remain available. Neither control affects the browser-local unsent preview. |
| Email | `FAMILY_EMAIL_NOTIFICATIONS_ENABLED` | Depends on Messaging and remains false in the default UI demo; may be true only for the exact local Mailpit/outbox step. It stops outbound work, not retention or signed delivery-event maintenance. |
| Synthetic runtime assertion | `FAMILY_SYNTHETIC_DEMO_ENABLED`, non-production environment, and `tenants.data_mode='synthetic'` | Defense-in-depth for the local synthetic profile, not a fourth global product switch and never authority for real data. |
| Synthetic learning-event interlock | candidate application gate plus tenant `learning_events_v2_enabled` | Internal default-off safety predicate for the bounded synthetic learner-assignment caller. It is not an invitation, relationship, assignment, projection, or Family product flag and grants no guardian lesson continuation. |

These mappings describe candidate code only. They do not prove a Vercel, Supabase,
or other environment contains the variables or that their effects were tested.
The messaging/email variables are not, by name alone, synthetic-profile proof.
Before either is true, the server must independently establish
`synthetic_integration_test`, `data_mode='synthetic'`, a non-production
identity/database context, and the exact test-destination allowlist. Any
production-shaped non-synthetic branch remains unreachable in Phase 1.

### Candidate secret/configuration inventory (names only)

The current candidate server paths reference `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`FAMILY_EMAIL_DIGEST_KEY`, `FAMILY_OUTBOX_ENCRYPTION_KEYRING`,
`FAMILY_OUTBOX_ENCRYPTION_ACTIVE_KEY_ID`,
`FAMILY_OUTBOX_LEGACY_V1_READ_ENABLED`,
`FAMILY_OUTBOX_LEGACY_V1_READ_KEY`, `FAMILY_EMAIL_TRANSPORT`,
`FAMILY_FROM_EMAIL`, `RESEND_API_KEY`,
`RESEND_WEBHOOK_SECRET`, `CRON_SECRET`,
`FAMILY_WEBHOOK_WRITER_JWT`, `FAMILY_WEBHOOK_WRITER_JWT_ISSUER`, and
`FAMILY_WEBHOOK_WRITER_JWT_AUDIENCE`;
`FAMILY_INVITATION_ISSUER_JWT`, `FAMILY_INVITATION_ISSUER_JWT_ISSUER`,
`FAMILY_INVITATION_ISSUER_JWT_AUDIENCE`, and
`FAMILY_INVITATION_RECIPIENT_POLICY`; plus `FAMILY_AUTH_PROVIDER`,
`FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED`, `FAMILY_SUPABASE_AUTH_ISSUER`, and
`FAMILY_SUPABASE_AUTH_AUDIENCE`, in addition to the four feature variables
above. `FAMILY_EMAIL_DIGEST_KEY` is contractually a 32-random-byte
base64url server-only key and must be distinct from every value in the outbox
encryption keyring. The publishable key is public configuration, but it grants
no writer or issuer authority without the corresponding valid short-lived
custom-role JWT. The legacy-v1 read key is optional, read-only, and must remain
disabled except during an explicitly reviewed bounded drain/re-encryption; v1
writes are forbidden. This list records code reachability, not configured
values or approval. Never put a value, token, ciphertext, key or credential in
a release receipt.

Before the controlled integration profile can enable email, reviewers must bind
the exact protected origin; local Mailpit process/socket/UI access and cleanup;
outbox key custody and rotation; email-HMAC key custody/version/rotation;
reserved-domain from/to identities; cron secret/route; and the exact server-side
recipient policy. If the independent Resend lifecycle-event route is in the
artifact, also bind its signed webhook secret/route, dedicated writer JWT
issuer/audience/role/expiry, PostgREST verification/role-assumption and rotation.
The current non-production
`synthetic-invalid-only` recipient policy rejects every real address and accepts
only exact `local-part@helpmath.invalid`. The candidate
`FAMILY_EMAIL_TRANSPORT=mailpit-local` can route that reserved address only to a
loopback Mailpit sink fixed at `127.0.0.1:1025`; production selection, unknown
transport values and every other recipient fail closed. This is a local
synthetic test-inbox candidate, not a general SMTP fallback or permission to use
Resend/Internet recipients. An email schema, keyed digest, reserved-domain UI
rule or transport branch does not prove Mailpit was running, received the exact
message, was access controlled, or was cleaned up. Missing that exact local-sink
evidence keeps the test-email E2E open; it does not stop the independently
authenticated retention-only branch.

### Email HMAC/encryption key rotation

The database may store only a versioned keyed HMAC of the normalized test
address plus separately application-encrypted delivery material. It must never
receive email plaintext, `FAMILY_EMAIL_DIGEST_KEY`, or
`FAMILY_OUTBOX_ENCRYPTION_KEYRING` (or the optional legacy-v1 read key), and its
roles must have no decryption capability. The current candidate implements a
v2 envelope with an explicit non-secret key ID, purpose-derived token/email
subkeys, and immutable purpose/tenant/record associated data; its exact-field
decrypt APIs reject token↔email, cross-record and cross-tenant swaps in static
tests. This is `CLOSED_STATIC / DYNAMIC_UNVERIFIED`, not activation evidence.
No real keyring provisioning, overlapping-key rotation, old-key retirement,
compromise drill, restored-backup behavior, or deployed worker/invitation flow
has been verified. Legacy v1 is read-only behind the two explicit legacy
variables and must default off; it never authorizes a v1 write.
For Phase 1, prefer destructive synthetic rotation over a long dual-key window:

1. Set `FAMILY_MESSAGING_ENABLED=false`, set each affected tenant's
   `family_messaging_enabled=false`, and set
   `FAMILY_EMAIL_NOTIFICATIONS_ENABLED=false`; if invitation integrity or
   destination secrecy is in doubt, also set `FAMILY_PORTAL_ENABLED=false` and
   withdraw the short-lived issuer capability/recipient-policy configuration.
   Stop new digest/claim/provider egress. Keep
   bearer-authenticated retention and exact-Svix-signed lifecycle-event ingest
   running unless their own integrity is compromised.
2. Cancel/suppress pending outbox rows and expire/revoke every invite or
   destination digest bound to the retiring key version.
3. Rotate the HMAC key and, if its exposure is possible, the independent outbox
   encryption key/purpose-derived subkeys in the server/worker secret store.
   Record only key version, purpose-binding scheme, operator, UTC time and
   secret-store receipt ID—not key bytes or derived addresses.
4. Recreate only the reviewed synthetic test-inbox fixtures with the new key
   version. Do not attempt database-side re-HMAC/decryption and do not extend the
   original 30-day retention anchor.
5. Prove old digests/tokens/ciphertext cannot redeem or deliver, a restored old
   snapshot remains suppressed, the database still has no key/plaintext, and the
   new HMAC normalization plus encryption purpose/record/AAD/key-version vectors
   pass before staged re-enable.

A missing, malformed, wrong-length, reused, unknown-version, or database-visible
key is a fail-closed configuration incident, not a fallback to unkeyed hashing.

### Delivery-event writer JWT rotation

`FAMILY_WEBHOOK_WRITER_JWT` is a short-lived infrastructure credential for the
NOLOGIN `family_webhook_writer` role. It is distinct from `service_role`, the
Resend signing secret, the HMAC key and the outbox-encryption key. The route's
local issuer/audience/role/expiry parse is only a configuration preflight;
Supabase/PostgREST must cryptographically verify the signature and assume only
the dedicated role, whose sole database capability is the delivery-event RPC.

1. Keep outbound email off during a planned rotation. Retention continues.
   Resend may retry signed lifecycle events during the bounded writer outage.
2. Mint a short-lived JWT through the approved Supabase signing path with exact
   issuer, audience, `role='family_webhook_writer'`, expiry and no broader
   claims/capability. Never mint it in browser code or store it in Git.
3. Install it atomically in the protected server environment. Record only token
   version/ID, issuer/audience, not-before/expiry, operator, UTC time and secret-
   store receipt—not the JWT or signature.
4. Through the exact target PostgREST gateway, prove the new token can execute only
   `record_family_email_delivery_event_v1`; the old/expired/wrong-issuer/wrong-
   audience/wrong-role tokens, anon, authenticated and service-role callers are
   denied. Prove the database role check observes the identity PostgREST actually
   assumes and that the role has zero table privileges.
5. Confirm a valid Svix-signed test event yields strict HTTP 204, a duplicate is
   idempotent, invalid signatures/claims/event types fail closed, and no direct
   outbox mutation or provider send occurs. Then revoke/expire the old token.

The exact current 001–018 disposable loopback PostgREST harness verified the
candidate writer's strict HTTP 204, exactly one event/outbox transition, zero
table/sequence and exact one-function authority, and denial for anon/
authenticated/`service_role`/wrong-audience/table/cross-RPC attempts. Hosted
Supabase asymmetric-key configuration, production token
provision/rotation, provider retry and deployed webhook remain unverified.

## Opt-in `vercel.family-portal.json` activation prerequisites

The repository-level `vercel.family-portal.json` is an opt-in candidate build
configuration. It is not the default project configuration, not a deployment
receipt, and not evidence that a deployment or cron exists. It currently
declares a five-minute request to `/api/cron/family-notifications`. That route is
in scope only for a deliberately selected protected synthetic runtime and must
remain email-inert in the default UI demo. In the current candidate, proxy
routing keeps it reachable independent of product flags, while a valid
`CRON_SECRET` is still mandatory. The worker calls
`run_family_retention_v1(1000)` before product-flag branching. If either portal
or email is off, it skips weekly digest, outbox claim and all egress. Only when
both are enabled does it call `enqueue_weekly_family_digests_v1`, claim an
outbox lease, validate immediately before send, invoke the test-email adapter,
and complete by claim-token compare-and-set. The worker requires every returned
tenant retention run to have `status='succeeded'`; otherwise the route returns a
retryable failure and performs no egress. The signed Resend webhook remains
reachable after outbound flags turn off, requires the exact valid Svix
signature, and calls only `record_family_email_delivery_event_v1`; it does not
send or update the outbox directly.
`rebuild_family_projections_v1` remains a manual service tool with no declared
cadence. It now shares the student-row lock with real-time ingest. Against the
exact current 001–018 artifact, one loopback HTTP ingest and one HTTP rebuild
ran concurrently on two active PostgreSQL backends, both returned 200 after
lock coordination, and the final watermark was consistent. A separate two-
concurrent-ingest race also passed. Hosted/production concurrency remains
unverified. These are candidate code/config
shapes, not evidence that Vercel
installed a cron, a database/provider is connected, a run succeeded, or a
deployed retention/deletion drill passed.

The lifecycle extension now has static original-anchor/non-extension controls,
terminal tenant shutdown, immediate authorization/egress denial and bounded
purge/scrub paths across identity/contact, provider mapping, roles, guardian
links, thread/read/preferences, suppressions, content fixtures and operational
rows. The exact local migrations and pgTAP suite passed, but that is not a
completed deployed lifecycle. The exact local runner also closed the staffed
Maple tenant, deleted an expired governance record, made one 930,281-byte
custom-format backup in approximately 134 ms, and restored it twice in
approximately 358/351 ms without reviving closed/expired/revoked/deleted state
or losing 38/38 RLS. Those are synthetic local measurements, not production
RPO/RTO. Worker-off cleanup, provider/test-inbox/log/cache/managed-backup
reconciliation, deletion receipts and independent operations review still must
pass before an integration profile persists state. A working cron cannot delete
or attest to external copies it does not own.

Do not select, copy, merge, or deploy this configuration until all of the
following are true for one exact artifact:

1. `FP-S00` through `FP-S13` have evidence and the Owner has authorized the
   exact protected synthetic deployment attempt; unresolved gates remain
   fail-closed.
2. The exact commit/tree, build command, root/output directory, framework and
   every route/cron in the opt-in file are reviewed. No unrelated production
   configuration or secret is inherited implicitly.
3. For `synthetic_ui_demo`, the email branch is proven unreachable with
   messaging/email flags off. If the cron remains selected, its flag-independent
   retention-first branch may touch only the exact isolated synthetic store and
   must have `CRON_SECRET`, bounded-run, monitoring, deletion-receipt and
   worker-off/no-resurrection evidence. It may be omitted before any server
   state exists; after state exists, an approved equivalent lifecycle path must
   replace it before removal. The current Vercel candidate must keep its email
   branch off: `mailpit-local` is rejected in a production `NODE_ENV`, and the
   reserved-domain policy authorizes no external recipient. The separately run
   local `synthetic_integration_test` may enable email only after exact route
   authentication, exact per-kind recursive outbox schema plus depth/byte
   limits, pre-send lease revalidation, claim-token completion CAS, fixed
   loopback Mailpit/from policy, retry/idempotency, capture/log and deletion
   tests. The separate signed lifecycle webhook must use the dedicated short-lived
   `family_webhook_writer` JWT path—not `service_role`—with exact Svix and
   PostgREST signature/issuer/audience/role/expiry verification, sole-RPC/no-
   table grant proof, 256-KiB streaming body limit, strict 204 behavior and a
   rotation receipt. Svix verification must depend only on
   `RESEND_WEBHOOK_SECRET`, not the outbound provider API key.
   The same review must bind exact development issuers, a valid 32-byte
   base64url server-only `FAMILY_EMAIL_DIGEST_KEY`, an independent outbox
   encryption key with purpose/tenant/record/version binding (or purpose-
   separated subkeys), keyring/destructive-rotation owner, cross-field/record
   swap denial, database-no-key/no-plaintext proof, and direct-RPC invite-
   redemption denial. The candidate denies create/resend execution to
   `authenticated`, `service_role` and `public`; a scoped admin creates a
   90-second one-use attestation and only the dedicated NOLOGIN/no-table
   `family_invitation_issuer` may consume it using an externally provisioned
   short-lived ES256 bearer. Before the controlled integration profile is
   activated, the exact selected PostgREST gateway must verify that token and
   assume only the issuer role, and positive issuance, replay/race, valid-admin
   direct-RPC denial, credential provisioning and rotation must pass. The exact
   current 001–018 disposable loopback harness proves the bounded local role
   transition, denial matrix and protected product flow; it does not close a
   hosted asymmetric-key or production-credential gate.
4. `FAMILY_PORTAL_ENABLED` and the synthetic-mode mechanism are bound to a
   protected non-public review environment. The candidate
   `NODE_ENV != 'production'` condition is reconciled deliberately; operators
   must not weaken or spoof it to force a hosted production runtime.
5. The selected profile and flag states are recorded. Both messaging/email flags
   are false for UI demo. They may be true only for the controlled integration
   test after its gates close. Real messaging and every unrelated Phase 1-
   prohibited capability remain unavailable through synthetic data mode,
   recipient/provider policy, authorization and RPC grants; this does not imply
   another product flag. Missing/malformed values fail closed.
   The full test-email step belongs to the isolated local integration harness
   unless a successor hosted synthetic transport/policy receives its own
   implementation, threat review and authorization.
6. No real identity, tenant, destination, database row, historical account,
   environment variable, backup, provider project or PII is reachable. Fixtures
   pass provenance/forbidden-field review and the 30-day policy.
7. Protected audience/access controls, non-indexing, private/no-store behavior,
   preview URL policy, region/log/analytics inventory, CSP and default-deny
   egress are reviewed and runtime-tested.
8. Browser/API/network evidence proves the local UI reply/read/terminal-close/
   Settings/page-load path has no egress. If the integration profile is selected,
   separate evidence traces only the exact synthetic invite/message/test-email/
   revoke path and proves all non-test destinations/providers remain unreachable.
9. A rollback object, kill-switch operator, incident contact and teardown date
   no later than the synthetic records' 30-day deadline are recorded.
10. `FP-S14` closes only after the exact protected deployment is independently
    verified; `FP-S15` and explicit Owner authorization are then required for
    any limited synthetic audience. No production alias, domain or public
    promotion is authorized.

Real identity cutover, real-family data, real messaging/delivery, district use,
and production promotion remain blocked by every `FP-R*` gate even if the
opt-in configuration is successfully exercised.

## Authority and access

Before operation, the implementation must assign named, least-privileged roles:

- incident commander;
- application operator allowed to disable family controls;
- security/privacy reviewer;
- database/backup operator;
- controlled loopback-Mailpit/capture custodian;
- release verifier;
- Owner/legal/district contacts for real-data or external-notification decisions.

Phase 1 documentation does not name or authorize those people. No single person
should create, approve, promote and re-enable the same high-risk change. Break-
glass credentials must be time-limited, MFA-protected, audited and absent from
ordinary app sessions; their actual design remains a gate.

## When to activate kill switches

Disable the narrowest approved and proven control immediately. Set
`FAMILY_PORTAL_ENABLED=false` and, where relevant, the affected tenant's
`family_portal_enabled=false` when scope is uncertain, for any of the following:

- real or historical person/learner/account data appears anywhere;
- cross-tenant, cross-school, cross-child or revoked-link access is possible;
- app role/tenant/relationship is accepted from a client or editable provider
  metadata;
- RLS/service authorization is unavailable, bypassed or ambiguous;
- token/auth data enters logs, analytics, caches, URLs, screenshots or traces;
  message/progress/body data enters telemetry, an unapproved capture, or any
  provider/destination outside the controlled synthetic allowlist;
- invitation replay, brute force, leakage or non-atomic activation occurs;
- create/resend is granted back to `authenticated`/`service_role`, or an
  authenticated admin can bypass the Next action with a caller-chosen
  email/token digest or ciphertext;
- an encrypted invitation token/email destination can be swapped across
  purpose, tenant or record, its key version is ambiguous, or retiring a key
  would require unsafe indefinite retention;
- a forbidden token/email/body/auth field can be persisted under a nested
  outbox key, or payload depth/bytes/per-kind shape are not bounded before
  storage;
- any send/email egress is reachable outside the exact controlled profile, any
  SMS/push/arbitrary destination is reachable, the test allowlist fails, or the
  local reply preview is presented as delivered; the always-reachable webhook
  is an incident if Svix verification can be bypassed or it performs anything
  beyond allowlisted lifecycle-event recording;
- synthetic notes are mistaken for monitored real communication;
- projection data is stale, inconsistent, raw, identity-misbinding, or inferred
  from an anonymous actor;
- deletion, TTL, backup aging or restore suppression fails;
- secret/provider/environment configuration is missing, mixed or exposed;
- the email digest uses bare hashing, the HMAC/encryption keys are not separate,
  a key is visible to the database/browser/logs, issuer/server-action binding can
  be bypassed, or key version/rotation cannot be proven;
- an unauthorized release/deployment, content gate expansion, or alias change is
  detected.

## Emergency disable procedure

1. Record UTC time, reporter, observed symptom, affected approved controls and a
   privacy-minimized incident ID. Do not copy sensitive payloads into the record.
2. Set `FAMILY_PORTAL_ENABLED=false` if blast radius is unknown and set the
   affected tenant's `family_portal_enabled=false` when tenant containment is
   safe and exact. For any communications incident also set the global
   `FAMILY_MESSAGING_ENABLED=false`, set each affected exact tenant's
   `family_messaging_enabled=false`, and set
   `FAMILY_EMAIL_NOTIFICATIONS_ENABLED=false`. Real data and real messaging
   remain prohibited by scope, authorization, data mode and provider policy;
   no separate switch is assumed.
3. Verify from an independent session that family routes/APIs fail closed and
   no cache, direct database path, background job, outbox or provider continues
   processing.
4. Revoke synthetic sessions, unused invitations and affected relationships.
   Rotate secrets only when exposure or policy requires it; do not print them.
5. Stop projection, invite, note, export and retention jobs only if doing so is
   necessary for containment. Keep or replace expiry enforcement so stopped jobs
   cannot expose expired data.
6. Quarantine the affected synthetic environment and preserve only minimal,
   access-controlled evidence. If real data is involved, invoke authorized
   security/privacy/legal assessment; Codex or this runbook does not decide
   notification obligations.
7. Inventory primary rows, derived projections, caches, queues, objects, logs,
   local-state namespaces, backups and unexpected egress using counts/digests,
   not content.
8. Delete unauthorized/unneeded data and issue retention suppression before any
   restore. Record a privacy-safe receipt.
9. Do not re-enable until root cause, repair, negative tests, independent review
   and exact staged-release authorization close.

## Backup creation checklist

No backup job is authorized merely by this checklist. Before enabling one:

- prove all inputs are synthetic and namespace isolated;
- list exact tables/objects and exclude secrets, plaintext tokens, sessions,
  local browser state, raw logs, source archives and migration evidence;
  encrypted/digested local-Mailpit/outbox/lifecycle metadata may be included only if
  the controlled profile explicitly needs it and its original deadline follows;
- define encryption, key owner, access log, region, provider, restore role,
  schedule and deletion API;
- propagate `retention_anchor_at` and deletion tombstones;
- enforce source-anchored maximum age, never "30 days after backup";
- validate snapshot completeness and integrity with counts/digests;
- run an isolated restore and no-resurrection test;
- record actual RPO/RTO measurements as dated evidence;
- obtain security/privacy approval for the exact mechanism.

For ordinary Phase 1 review, regenerating deterministic fixtures is preferable
to backing up instantiated state.

## Clean recovery procedure

1. Keep all family controls off.
2. Select an isolated synthetic environment with no production provider, real
   tenant, real identity, historical source or reused secret.
3. Verify schema/migration/fixture artifact digests against the authorized
   synthetic release record.
4. Create an empty store and apply reviewed schema/RLS. Never restore into an
   already populated or differently scoped tenant.
5. Apply deletion tombstones/suppression before loading a stateful snapshot.
6. Prefer generating new deterministic synthetic fixtures and IDs. If restoring
   a snapshot, validate encryption/integrity, original retention anchors,
   environment/tenant/data-mode fields, expiry and complete object inventory.
7. Rebuild family projections from the reviewed synthetic source; do not read
   anonymous LRS events, browser progress, real SIS/IdP or historical SQL.
8. Run RLS/service negative tests, DTO/forbidden-field tests, no-egress tests,
   deletion/expiry and restore/no-resurrection tests.
9. Verify the content references resolve only through current product registry
   APIs and that no migration/lesson gate changed.
10. Enable controls in the staged order below only after independent review.
11. Record a recovery receipt with artifact digests, counts, test results,
   measured RPO/RTO, reviewers, unresolved issues and final switch states.

## Staged re-enable order

1. Keep all three global switches false and every candidate tenant
   `family_portal_enabled=false`. Configure only the isolated synthetic runtime,
   synthetic data mode, strict identity issuer, and reserved-domain Mailpit
   policy.
2. Validate synthetic session, exact tenant selection, RLS/direct-RPC denials,
   retention, and no-egress behavior while the product remains unavailable.
3. If the bounded learner-assignment event path is in the receipt, enable its
   application and tenant safety interlocks only for the exact synthetic G4 L3
   fixture; validate learner binding, schema-v2 bounds, idempotency, expiry,
   raw-table denial and no anonymous/LRS history. This does not expose a Family
   lesson link or create a new product switch.
4. Set `tenants.family_portal_enabled=true` only for the exact synthetic tenant;
   prove another tenant remains denied and no default child is selected outside
   the chosen tenant.
5. Set `FAMILY_PORTAL_ENABLED=true` only for the protected synthetic audience.
   Validate allowlisted projection/announcement/thread DTOs and the visibly
   unsent, maximum-2,000-character local preview.
6. For the default UI demo, keep both global `FAMILY_MESSAGING_ENABLED=false`
   and every tenant `family_messaging_enabled=false`; also keep
   `FAMILY_EMAIL_NOTIFICATIONS_ENABLED=false`.
7. For the separately approved controlled integration test, set the exact
   synthetic tenant's messaging mirror true and then set the global Messaging
   switch true, prove its database mutation cannot be called around either
   layer, and run the
   synthetic two-way message. Set Email true only for the exact Mailpit outbox/
   cron step. Invitation issuance additionally requires the existing one-use
   issuer attestation and non-production `.invalid` recipient policy; it is not
   controlled by a newly invented invitation flag.
8. Revoke the synthetic guardian link, prove subsequent read/send/enqueue denial,
   cancel pending work, reconcile/delete database/outbox/provider copies, then
   return Email, global Messaging, every tenant messaging mirror, Portal, and
   the tenant portal gate to false.

Real/arbitrary recipients, production messaging, exports, and real data remain
prohibited by the Phase 1 scope and authority model. No staged order authorizes
public production or real-family access.

## Restore verification matrix

| Verification | Required result |
|---|---|
| Artifact identity | Exact reviewed schema/RLS/fixture/application digests. |
| Environment | Synthetic namespace only; no production account/project/tenant. |
| Data inventory | Expected tables/objects/counts; no unexpected class or provider data. |
| Retention | Original anchors preserved; expired data absent; all deadlines ≤30 days. |
| Revocation | Revoked membership/link/invite remains denied and cannot be revived. |
| Authorization | Anonymous/wrong-role/wrong-tenant/unlinked/revoked/foreign-object tests deny. |
| DTO | Exact allowlists only; no unknown/forbidden field. |
| Messaging | UI demo: fixed notes + unsent local preview, no write/egress. Controlled integration: exact synthetic two-way messages/test email only, plain text ≤2,000, registered test destination, revoke/suppression/deletion proven. Real messaging remains off. |
| Egress/logs | No unexpected call; no payload/token/alias/progress/note in telemetry. |
| Content boundary | No registry/migration/strict/audio/Owner/publication state changed. |
| Accessibility/locale | EN/ES, keyboard, focus, screen reader and reflow checks pass for the recovered artifact. |
| Deletion drill | Primary/derived/cache/backup copies delete and do not reappear on a second restore. |

## Rollback

The safe rollback is to switch the family surface off and remove/quarantine the
synthetic environment. Do not roll back to an unknown database snapshot, old
policy, stale relationship set or differently approved deployment. A rollback
object must be exact, inventory-bound, within retention and already verified.

Family rollback does not roll back My Lesson, animation implementations,
content registries, migration evidence or public lesson deployments unless a
separate incident owner explicitly authorizes that distinct action.

## Drill cadence and evidence

Before a synthetic release and at least once per active 30-day environment:

- exercise the global Portal, exact tenant Portal, both the global and exact-
  tenant layers of the single approved Messaging control, and Email switch,
  plus denial tests for every non-product safety predicate in scope;
- run clean fixture regeneration;
- run one bounded snapshot restore if backups are in scope;
- revoke an invite/link and prove no resurrection;
- expire/delete all data classes and reconcile copies;
- record actual RPO/RTO and operator/reviewer separation;
- record unresolved exceptions as blocking, not "future optimization".

Passing a synthetic drill cannot be promoted into a production recovery, data
protection, legal, district, Owner, or real-family acceptance claim.
