# Guardian invite threat model

Status: **Synthetic-only Phase 1; exact local controlled E2E verified; default invite delivery and every real/external delivery path off**

## Security objective

An invitation must never be sufficient by itself to disclose a learner or
create a real family relationship. In Phase 1, an invite is only a synthetic
workflow artifact used to exercise expiry, replay, tenant, role, and revocation
behavior. The default UI-demo profile does not deliver it. The controlled
integration profile may send it only to the exact local Mailpit sink for a
reserved `@helpmath.invalid` recipient as part of the exact E2E. It is never
evidence of an adult's identity, custody,
guardianship, consent, or district authorization.

Candidate invite actions, schemas, secret helpers, RPCs and outbox triggers are
locally verified within the controlled Phase 1 integration-test scope. They
remain default off and unauthorized outside that exact profile. Phase 0 did not
authorize a separate invitation product flag. The
approved global and tenant Portal gates, exact synthetic recipient/provider
policy, one-use issuer capability, and server/RPC authorization must all deny
outside the controlled profile. A hidden UI is not sufficient.

## Candidate P0 disposition: local gateway verified; hosted release unverified

The candidate denies `create_guardian_invitation_v1` and
`resend_guardian_invitation_v1` to `authenticated`, `service_role` and `public`.
An authenticated scoped administrator can only create a 90-second, one-use
attestation bound to its signed issuer/subject, authoritative tenant/student,
recipient digest and idempotency key. Only the dedicated
`family_invitation_issuer` custom role may consume it. That role is NOLOGIN,
NOINHERIT, has no table authority and can execute only the create/resend RPCs.
The app supplies a short-lived externally provisioned ES256 bearer and has no
project signing private key or service-role fallback.

The exact eighteen migrations and fictional seed applied to a fresh local
PostgreSQL 16 database, and the final pgTAP plan passed `489/489`. Those checks
verify the local issuer role attributes, grants and attestation contracts. They
do not complete the workflow. The app's issuer preflight parses claims and time
bounds but does not verify the signature. The exact current 001–018 disposable
loopback PostgREST harness verified real HTTP create/resend and denied anon,
authenticated,
service-role, wrong-purpose, wrong-audience, table and cross-RPC calls. Catalog
checks confirmed zero table/sequence and exactly two function privileges for the
issuer. The protected local invite-to-revoke product E2E passed. Hosted Supabase
asymmetric-key behavior, production token provision/rotation and one-use/key-
rotation drills remain open. The same disposable stack also exercised a
fictional production-shaped tenant with approved retention and live Supabase
session enforcement, but sent no Internet email and created no real record.
Every dependent release gate stays blocked until its own evidence exists.

The candidate v2 encryption envelope now includes a key ID, derives distinct
token/email subkeys, and authenticates immutable purpose/tenant/record context.
Static tests reject token↔email, cross-tenant and cross-record swaps and cover
key selection. This is `CLOSED_STATIC / DYNAMIC_UNVERIFIED`: real keyring
provision, overlap/retirement, compromise, backup/restore and deployed worker/
invite flows remain open. Legacy v1 is an optional, explicitly gated read-only
drain path; it is default off and cannot write new ciphertext.

Prior independent security review records no open P0/P1 code finding for its
reviewed predecessor. Migrations 015–018 require independent exact-artifact
review. The former remote-HTTP P2 is closed by unit-tested URL policy: the
issuer requires HTTPS except for exact non-production loopback HTTP and rejects
other remote HTTP, userinfo, paths, queries and fragments. This does not change
the synthetic-only Phase 1 recipient rule or verify hosted networking.

## Separate production-shaped candidate boundary

The production-shaped path is not part of Phase 1 and is not approved for real
use. It is reachable only when all of the following agree: production runtime,
Supabase Auth, Resend, `school-verified-production`, the explicit production-
invitation opt-in, global/tenant/email gates, a dedicated issuer, an exact
production tenant/issuer and approved retention for every identity, invitation,
link, outbox and audit class. `tenant_identity_issuers.requires_database_session`
must be true. Mapped RPCs, the administrator attestation, issuer consumption,
invitation acceptance and decline all recheck the live Supabase `auth.sessions`
registry. A newly verified adult may decline without first creating an app-user
mapping; acceptance remains the only path that may bootstrap that mapping.

The exact loopback harness exercised create/resend and `local`/`others`/`global`
session revocation with fictional data, including denial of a revoked session
and its unconsumed attestation. It did not contact Resend, deliver to a real
address, use a hosted Supabase project, prove school verification, or obtain
Privacy/Legal/DPA/district/Owner approval.

The candidate action/schema surface also includes an adult-email-shaped field,
a seven-day application default, and an eight-day database upper bound for
invite expiry. In Phase 1 the field may contain only the exact reserved-domain
address registered for the local Mailpit sink; any arbitrary or real address is rejected before encryption/
outbox work. The candidate TTL must be deliberately reviewed against the shorter
test default below and bound to the exact receipt. The exact current 001–018
loopback harness verified GoTrue signup, invitation and family-message Mailpit
delivery within the protected product E2E. It does not approve a hosted sink.

## Phase 1 trust model

- The default Admin Family Access UI accepts only visibly synthetic `.invalid`
  addresses and keeps create/revoke/restore state in component memory. It does
  not call a server action, create an outbox row, or deliver anything. A display
  value—even one at `helpmath.invalid`—is not evidence that the controlled local
  Mailpit sink or server integration path ran.
- In `synthetic_integration_test`, the remaining bullets below apply. The
  current positive admin/action policy accepts only exact
  `local-part@helpmath.invalid` in non-production and hard-requires a synthetic
  database tenant. Only `FAMILY_EMAIL_TRANSPORT=mailpit-local` may route that
  reserved address to the fixed loopback sink `127.0.0.1:1025`; production,
  unknown transports, Resend/Internet delivery and every other recipient deny.
  That code shape cannot close the controlled test-email E2E without an exact
  dynamic Mailpit receipt and cleanup proof.
- A synthetic tenant administrator or deterministic fixture process creates an
  invite for an already synthetic tenant, school, adult alias, and learner.
- The invite service generates an opaque random token, stores only its digest,
  and presents the plaintext only inside the isolated test harness.
- Adult-email matching is different from token hashing: the server-only action
  normalizes the allowlisted synthetic address and computes a versioned keyed
  HMAC using `FAMILY_EMAIL_DIGEST_KEY` (32 random bytes, base64url encoded). Bare
  SHA-256 of an email is prohibited because the small address space permits
  offline guessing. The HMAC key and outbox decryption key never enter the
  database, browser, logs, receipts, or provider payload.
- The browser accepts the token only from the URL fragment, moves it to the
  fixed, versioned session key `help_math:family-invitation-token:v1`, and
  immediately removes the fragment with history replacement before rendering
  external resources or user-visible invite content. It never uses
  `searchParams`, server-rendered HTML, an analytics event, or a persistent URL.
- A synthetic app identity may pass the token from that bounded session key to
  an optional, same-origin, rate-limited server-action callback. The key is
  deleted after the first terminal success/failure, explicit cancel, expiry,
  sign-out, global/tenant Portal disable, or issuer/recipient-policy withdrawal.
- Redemption atomically verifies data mode, environment, tenant, intended
  synthetic identity, exact issuer, server-computed email HMAC, expiry,
  unused/revoked status, administrator authority, and absence of a conflicting
  active relationship. SQL compares the submitted HMAC to the stored value; it
  does not receive email plaintext or compute/decrypt an address. A direct RPC
  path that bypasses the server-only action must be denied; the candidate now
  has a one-use custom issuer shape. The exact current 001–018 full-stack and
  protected product E2E passed locally; hosted/production evidence remains open.
- The result is an `active_synthetic` conceptual relationship backed by a
  candidate `guardian_links` row, not proof of a real-world relationship.
- Invite creation/redemption and relationship activation/revocation produce
  privacy-minimized audit events.
- The approved global and tenant Portal controls default off. Issuance also
  fails closed without the one-use issuer capability and exact non-production
  recipient policy; these are capability/safety predicates, not a newly defined
  invitation product flag.
- Only in `synthetic_integration_test`, an allowlisted outbox/worker may deliver
  the synthetic invite to the exact loopback Mailpit sink, after which
  redemption, family access, synthetic two-way message/email, and revoke are
  exercised.

No invite token, digest, URL, identity-provider subject, alias, or learner
selector belongs in analytics, ordinary logs, screenshots, CI artifacts, issue
text, server-rendered HTML, search parameters, or browser history. The fragment
to fixed `sessionStorage` key flow above is the only candidate transport. The
token must not be duplicated under another key, and unrelated client code may
not read it. The optional server callback receives it only in the protected POST
body and must not log or reflect it.

The default UI demo permits no provider email, contact, delivery token or outbox
payload. The controlled integration profile may use only the reserved-domain
local-Mailpit address/digest/ciphertext and encrypted outbox token required by
the exact test flow. Those values never enter a family response/log and are
deleted under the original synthetic retention anchor.

## Assets to protect

- tenant and school isolation;
- learner existence and synthetic profile;
- guardian/learner relationship state;
- invitation token and token digest;
- application role and membership;
- audit integrity and revocation state;
- invite/relationship TTL and deletion;
- service credentials and kill switches;
- future real adult/learner identity and contact information, which are not
  permitted in Phase 1.

## Threat actors

- an unauthenticated internet user;
- an authenticated user in the wrong tenant or role;
- a synthetic guardian attempting to link another learner;
- a synthetic teacher or tenant admin exceeding assigned authority;
- a person who obtains or forwards a token;
- automated scanners and brute-force clients;
- compromised browser storage, referrer, log, screenshot, or CI output;
- a compromised support/admin account;
- a faulty service, cache, retry, or concurrent request;
- an operator restoring stale data or misconfiguring the feature mode;
- future insider or provider access to real data.

## Threats and required controls

| Threat | Example failure | Required Phase 1 control | Real-family additional gate |
|---|---|---|---|
| Enumeration | Different responses reveal adult, learner, school, or invite existence | Uniform status/body/timing envelope where practical; opaque IDs; no lookup by name/email/student ID | Legal-approved support and identity recovery path; monitoring and notice. |
| Weak token | Short/predictable code can be guessed | Cryptographic random token, at least 128 bits of entropy and preferably 256; no sequential IDs; store digest only | Independent security review and provider delivery threat model. |
| Token leak | Token appears in URL logs, referrer, analytics, screenshot, DOM/HTML, session storage after use, or email preview | Fragment only; copy once to the exact versioned session key; clear fragment immediately; no analytics/logging/reflection; `Referrer-Policy: no-referrer`; no third-party resources; delete key on every terminal/cleanup path; immediate revoke path | Exact email domain/link/redirect policy, safe-link scanner handling, DPA and retention. |
| Guessable email digest | Bare SHA-256 lets someone enumerate a small set of likely addresses offline | Versioned keyed HMAC from normalized address using a 32-byte base64url server-only key; constant-time comparison where applicable; no plaintext/key/database hashing; test vectors and entropy/config validation | Production KMS/key custody, rotation, access audit and re-identification risk review. |
| Digest/decryption key compromise | One key or database role can correlate and decrypt test destinations | Separate HMAC and encryption keys; neither key in database; mail worker gets only the minimum decrypt capability; kill invite/email paths, cancel outbox, rotate, expire/recreate synthetic invites | Production key-management ADR, HSM/KMS policy, dual control and incident plan. |
| Ciphertext context swap / unrotatable key | The same valid AES-GCM blob is moved between token/email fields or records, or a `v1` key must change without a key ID/keyring | **Closed static / dynamic unverified:** v2 key ID, purpose-derived subkeys, immutable purpose/tenant/record AAD, exact-field decrypt APIs and static swap-denial tests. Legacy v1 is read-only/default-off. Still prove real keyring provision, overlap/retirement, compromise and backup/no-resurrection drills. | Production KMS envelope-encryption design, key lifecycle/cryptoperiod, backup rewrap or destruction policy and independent cryptography review. |
| Server-action issuance bypass | An admin calls authenticated create/resend RPC directly with self-chosen email/token digests, then another subject redeems using the same known digest | `authenticated`, `service_role` and `public` cannot create/resend. Candidate uses a one-use actor/student/digest/idempotency attestation and a short-lived NOLOGIN/no-table custom issuer role. Local PostgREST HTTP create/resend and the caller/claim/table/cross-RPC denial matrix passed. Keep one-use race, full product E2E, hosted asymmetric-key behavior and token-rotation gates open. | Production key/role custody, service identity, audit and independent penetration test. |
| Replay | Used token creates multiple links | Atomic compare-and-consume; single-use; idempotent same-result handling without second link | Multi-region/concurrency proof and reconciliation runbook. |
| Decline leaks or replays | A decline confirms an invite exists, leaves a deliverable outbox row, or later acceptance revives it | Same fragment/session-key and verified-email HMAC boundary as accept; non-enumerating response; exact row lock; terminal revoked state; cancel pending invitation delivery; clear token and URL fragment | Production notification/appeal policy and monitored race test. |
| Token forwarding | Another signed-in adult redeems the token | Phase 1 token bound to an intended synthetic app identity and tenant; mismatch denied | Verified adult contact/account ownership plus district-approved relationship proof; token alone never enough. |
| Cross-tenant confusion | Tenant A admin creates or redeems for Tenant B learner | Server derives tenant from admin/session; all referenced rows must share tenant/environment; RLS and service checks | Tenant/DPA/IdP mapping audit and district UAT. |
| Child self-link | Learner supplies an adult email/code or approves access | No learner invite/create/approve capability; no child session can execute invite functions | District/legal-defined process and adult verification; child assent does not replace required authorization. |
| Role escalation | Provider metadata or request body says `guardian`, `school_admin` or `district_admin` | Application-owned membership only; reject client/provider-editable role; no self-promotion | Production identity lifecycle, MFA for admins, role-change audit and periodic review. |
| Admin overreach | Admin links a learner outside their school/tenant | Tenant/school scope derived from current admin assignment; two-person or reviewed batch policy before real data | District responsibility/RACI, least privilege, audit review, support escalation. |
| Brute force | High-volume token attempts | Per-origin/session/tenant budgets, progressive delay or lockout, generic denial, alerting; never block an unrelated learner account based solely on attacker input | Production WAF/monitoring/incident thresholds and tested recovery. |
| CSRF/cross-origin redemption | Malicious page redeems token using victim session | Same-origin enforcement, CSRF defense, `SameSite`, bounded POST body; no GET mutation | Production cookie/session review and browser matrix. |
| Open redirect/phishing | Invite link redirects to attacker or lookalike domain | Fixed canonical origin/path; no arbitrary redirect; visible domain guidance; no remote assets | Domain/DNS/TLS and anti-phishing/support procedures. |
| Race | Redeem/revoke/expire requests interleave | Transactional state transition and row lock/unique constraint; current server time; exactly one terminal outcome | Distributed consistency and failover tests. |
| Stale cache/session | Revoked relationship remains visible | Private/no-store; relationship checked on every request; session/cache invalidation; immediate deny | Production cache inventory, revoke SLO and incident test. |
| Orphan link | Deleted membership/learner leaves active access | Referential constraints plus active parent checks; retention job closes/deletes dependent records | District offboarding and roster reconciliation. |
| Token retained too long | Invite survives test/environment lifecycle | Short synthetic TTL; in all cases record expires/deletes within 30-day maximum; token digest removed after terminal retention | Contract/legal retention and backup suppression. |
| Log/backup persistence | Token or link remains after deletion | Token/body denylist, redaction tests, bounded backups, deletion tombstone/suppression | Provider deletion receipts and restore drills. |
| Support bypass | Support manually activates a link or uses message support authority to expand relationship access | No support path can activate/revive a guardian link. There is no standing learner/message access; the implemented message-support case is exact-thread, requestor-only, approved by a different district admin, expires within 15 minutes and is audited | Legal/district support policy, MFA, dual authorization and user notice where required. |
| Environment mix-up | Synthetic code points at production tenant/provider | Synthetic namespaces and credentials; environment/data-mode constraints in service and RLS; global kill switch fail-closed | Separate accounts/projects/secrets, staged promotion and production preflight. |
| Wrong-profile reachability | Create/resend/accept action reaches encryption/RPC/outbox from default UI or a non-test configuration | Approved global and tenant Portal gates; exact profile assertion before contact use; reserved-domain recipient policy plus fixed loopback-Mailpit transport; one-use issuer capability and server-only action assertion; direct browser RPC denial; default no-egress and controlled positive/negative traces. No separate invitation product flag is assumed. | Exact real-family ADR, provider, identity, legal/DPA/district/Owner and release approval. |

## Proposed synthetic invite states

```text
created_synthetic -> redeemed_synthetic
created_synthetic -> expired
created_synthetic -> revoked
redeemed_synthetic -> relationship_revoked
```

No transition returns to `created_synthetic`. Retrying the same accepted request
may return a generic idempotent success but cannot create another link. A token
cannot change tenant, learner, intended synthetic user, or role after creation.

Synthetic defaults and current candidate limits:

- token entropy: 256 random bits;
- redemption window: 30 minutes preferred for the bounded harness; the longer
  candidate application default (seven days) and database maximum (eight days)
  are explicit security-review items, never implicit approval;
- known-invitation acceptance: expected `P0003`/`P0004`/`P0005` failures count
  against that invitation and lock it at 10 failures for its lifetime; resend
  does not reset the counter. An unknown random token returns the same empty
  result without creating a token-derived resource row;
- signed-provider-identity acceptance aggregate: every non-replay attempt,
  including malformed/unknown tokens and the first successful acceptance, is
  charged at 20 per fixed 10-minute window and 100 per UTC day. Exact committed
  immutable replay is free. Only a SHA-256 digest of signed issuer+subject is
  retained; token, email, raw issuer and raw subject are forbidden;
- invitation creation: 5 per fixed hour and 20 per UTC day for the exact
  actor+tenant+student;
- invitation resend: 3 per fixed hour and 10 per UTC day for the exact
  actor+tenant+invitation;
- plaintext storage: never;
- primary terminal-record retention: only as long as needed for synthetic audit,
  and never beyond 30 days from original creation;
- outbound delivery: none in the default UI demo; exact reserved-domain
  recipient to fixed loopback Mailpit only in the controlled integration profile;
- real contact fields: none; the registered test address is synthetic test
  infrastructure, not an adult contact.

Migration 011 implements the resource-bound counters atomically and keeps exact
idempotent replays from being charged twice. Migration 018 adds the pre-resource
signed-provider-identity aggregate without storing a token/email or resolving an
unknown token to a tenant. The exact current 001–018 local pgTAP suite passed
`489/489`; the real PostgREST HTTP check sent 21 unknown-token probes under one
synthetic signed identity, observed the same `200`/empty-array response for all
21, and proved both buckets stopped atomically at 20 increments each. Anonymous
source-IP/device/network edge-WAF enforcement, distributed multi-account limits,
alerting and production recovery remain open release gates.

## Abuse and incident response

Immediately set the approved global Portal control—and the exact tenant Portal
gate when safely scoped—to off, withdraw the issuer capability/recipient policy,
and keep Messaging/Email off when any of these occurs:

- a token, digest, URL, identity value, or real contact appears in logs or UI;
- the HMAC/encryption key is missing, malformed, reused, exposed, available to
  the database/browser, or cannot be rotated without unsafe retention;
- ciphertext can be replayed across token/email purposes, tenants or records,
  lacks an authenticated purpose/record/version binding, or cannot identify the
  correct decryption-key version;
- authenticated create/resend becomes executable again or can accept an
  unsigned or otherwise server-unproven email/token digest or ciphertext;
- cross-tenant or unlinked learner access is observed or suspected;
- replay creates more than one link;
- rate limiting, same-origin/CSRF, or atomic redemption cannot be proven;
- synthetic/real environment boundaries are ambiguous;
- deletion/expiry or revocation stops working;
- an unexpected provider/network call occurs;
- a real person or real record enters the synthetic system.

Then follow the global runbook: disable the family portal if scope is uncertain,
preserve privacy-minimized evidence, revoke tokens/links, rotate exposed secrets
when applicable, delete unauthorized data, assess notification obligations with
authorized legal/security owners, and do not re-enable until the exact cause and
tests are closed.

## Required synthetic tests

- random/digest/token-length and plaintext-storage assertions;
- deterministic keyed-HMAC test vectors, normalization equivalence,
  wrong/missing/malformed/rotated-key denial, bare-SHA/email-enumeration scan,
  exact issuer binding, database-no-plaintext/no-key proof, and direct-RPC
  bypass denial;
- AES-GCM token/email purpose separation or immutable-context AAD vectors,
  cross-purpose/cross-record/cross-tenant swap denial, key-version selection,
  old-key retirement and corrupted-IV/tag/ciphertext denial;
- a valid scoped admin JWT cannot directly create/resend with a chosen digest,
  ciphertext or token proof; the dedicated server-only issuer/signature is
  required and its absence fails closed;
- valid one-time redemption and idempotent retry;
- expired, revoked, malformed, previously used, and unknown token denial;
- wrong synthetic identity, role, tenant, school, learner, environment and data
  mode denial;
- concurrent redemption and redeem-vs-revoke race;
- CSRF/cross-origin/GET mutation rejection;
- exact create 5/hour+20/day, resend 3/hour+10/day, known-invitation lifetime-10
  and non-disclosing response tests; exact idempotent retries do not consume a
  second slot, resend does not reset acceptance failures, and expected failures
  are audited without token/email/body content;
- unknown random tokens return the same empty result and create no token-derived
  resource counter; the signed-provider-identity aggregate charges the path at
  20/fixed 10 minutes and 100/UTC day without raw identity/token/email storage,
  while independently evidenced anonymous IP/device/network edge-WAF and
  distributed multi-account controls remain required;
- no token in logs, referrer, analytics, trace, exception, DOM after use, or test
  artifact;
- fragment is removed before rendering/egress; token appears only under
  `help_math:family-invitation-token:v1`; no query/search parameter or
  server-rendered HTML contains it; every success/failure/cancel/expiry/sign-out
  and kill-switch path deletes the session key;
- optional server-action callback is same-origin/CSRF-protected, receives a
  bounded POST body, never reflects/logs the token, and is unreachable when the
  global or tenant Portal control, issuer capability, or recipient policy is off;
- relationship is inaccessible immediately after revoke/expiry;
- retention and restore do not revive token or relationship;
- HMAC-key rotation disables create/accept first, cancels pending delivery,
  expires old synthetic invites/digests, creates new key-versioned fixtures, and
  proves a restored old digest cannot redeem;
- default profile makes no email/SMS/push/contact/provider call and cannot reach
  invite actions/RPCs/outbox;
- controlled profile delivers only to the fixed loopback Mailpit sink, rejects
  production/unknown transports and every other address, reconciles outbox/sink
  status, then revokes and deletes;
- invite actions/RPCs/outbox/worker are unreachable with the dedicated invite
  switch or integration profile off;
- no historical or real identity fixture.

Passing these tests may establish only `VERIFIED_SYNTHETIC`. It does not prove
adult identity, guardianship, consent, district authorization, legal compliance,
production security, or real-family release readiness.
