# Family portal messaging threat model

Status: **Phase 1 exact local controlled integration verified; release approval remains blocked and real messaging is off**

## Phase 1 product truth

The default `synthetic_ui_demo` Family and Teacher Messages companion surfaces
do not provide messaging in the operational sense. They may display same-
synthetic-tenant, learner-scoped, fixed plain-text support or teacher-style
notes. The UIs may also accept a synthetic reply preview in a plain-text input
with `maxlength=2000`. The shared validator enforces the same 2,000-character
maximum and plain-string type. The UI may locally demonstrate:

- mark an initially unread thread read;
- close a thread;
- filter open/closed synthetic threads;
- add or cancel a visibly unsent local reply preview.

Those interactions are component-memory presentation state. Closing is terminal
for that demo thread: the thread becomes read-only, the reply input disappears,
and there is no reopen action. Copy may direct the reviewer to use a separate new
thread, but this profile creates no server thread or message. Nothing sends, delivers,
acknowledges, notifies, changes a school record, or tells another person
anything. The reply control must be labeled as a local preview rather than
"Send". The default UI demo has no recipient, attachment, email, SMS, push, webhook,
live read receipt, typing indicator, or two-way backend call.

The controlled `synthetic_integration_test` is also within Phase 1. It may enable
the default-off server actions, transactional message RPCs, outbox, cron/signed
webhook, and exact test-email adapter to prove one complete synthetic
invite→family→two-way-message→test-email→revoke E2E. Every actor, tenant,
learner, message and destination is synthetic; email is limited to the exact
reserved-domain recipient/from identity in the fixed loopback Mailpit sink. The
default UI reply control never calls
this path and never changes meaning when flags change.

The exact local E2E has run successfully as an automated candidate, but no
independent release acceptance exists. The implementation denies invite
create/resend to `authenticated`, `service_role` and `public`, while a dedicated
NOLOGIN/no-table `family_invitation_issuer` may consume a scoped administrator's
90-second one-use attestation through an externally provisioned short-lived
ES256 bearer. The app has no signing private key or `service_role` fallback.
The exact local PostgreSQL/pgTAP run verified the database role/grant/attestation
shape. The exact current 001–018 disposable loopback PostgREST harness then
verified HTTP create/resend plus the anon/authenticated/service-role/wrong-
purpose/wrong-audience/table/cross-RPC denial matrix. Hosted asymmetric-key
behavior, one-use/key-rotation and production provisioning/rotation still
require evidence. The protected local Family messaging E2E passed.

The only Phase 1 recipient policy is non-production
`synthetic-invalid-only`, accepting normalized exact `@helpmath.invalid`
addresses. It is intentionally unable to deliver to an Internet recipient. The
candidate `mailpit-local` transport is a separate loopback-only test sink fixed
to `127.0.0.1:1025`; it rejects production selection and every non-matching
recipient. Messaging/email switches stay off until the custom-role path and the
exact local Mailpit E2E are dynamically proven for the exact artifact. This
local sink is not permission to enable Resend, an external SMTP server, or any
real/non-reserved address. A separately default-off `school-verified-production`
candidate exists behind exact production/Supabase/Resend/retention/live-session
gates; it was tested only with fictional local data and no Internet delivery,
so it does not alter the Phase 1 or release boundary.

The logical modes are:

```text
off                        # fail-closed default
synthetic_ui_demo          # fixed notes + component-memory local interactions; no egress
synthetic_integration_test # protected server/RPC/outbox/test-email E2E; synthetic only
real_live                   # forbidden until successor design and all real gates close
```

These are design labels, not evidence that an environment variable or control
plane is implemented. Any missing, invalid, or ambiguous value behaves as
`off`.

## Assets and harms

Assets:

- learner/guardian relationship and tenant isolation;
- message content and participant identity;
- thread state and ordering;
- school/teacher authority and authenticity;
- notification destinations;
- moderation/support evidence and audit integrity;
- retention, deletion, export, legal hold and backup behavior.

Potential harms in a real system include disclosure of education records,
impersonation of school staff, harassment/grooming, unsafe advice, unmonitored
urgent messages, records-retention failure, notification leakage, malware or
tracking through attachments/links, and model/prompt injection if content is
sent to AI. Phase 1 prevents these paths by not accepting or delivering real
messages.

## Threats and Phase 1 controls

| Threat | Failure mode | Mandatory Phase 1 control |
|---|---|---|
| Cross-tenant disclosure | Guardian reads another tenant's thread | Server session + active relationship + tenant/RLS checks for every thread and message; foreign IDs receive generic denial. |
| Cross-child disclosure | A valid guardian selects an unlinked learner/thread | Active `guardian_links` relationship required; no roster or thread discovery. |
| Impersonation | Synthetic note looks like a real named teacher wrote it | Participant labels limited to `family` and `school_support`; visible `synthetic demo` notice on every thread/message; no names/signatures. |
| False delivery expectation | User thinks mark-read/close or reply preview informs the school | Copy must say local demo/not sent; local action label must not say `Send`; no delivery/read receipt wording; no network write. |
| Hidden/wrong-profile send path | Default UI, non-test configuration or a direct authenticated RPC posts content/outbox state around the app switch | Profile check before parsing/body use; global `FAMILY_MESSAGING_ENABLED` **AND** the exact tenant's default-off `family_messaging_enabled` database mirror; UI preview never calls send; non-test/real recipient paths unreachable; exact route/RPC/outbox/egress tests. The tenant mirror is an implementation layer of the approved Messaging control, not a fifth product flag. |
| PII/free text | Tester enters a real person/record into a preview or integration message | Protected synthetic reviewers only; visible do-not-enter-real-data notice; plain text ≤2,000; default preview memory-only; integration body exact DTO/database/retention; no logs/analytics/model; discovery is an incident. |
| Stored XSS/markup | Note body executes HTML/Markdown/script | Plain text rendering; framework escaping; no `dangerouslySetInnerHTML`; strict CSP; no arbitrary Markdown/HTML. |
| Link/tracking abuse | Remote link/image reveals viewer or loads malware | No remote images, tracking pixels, link previews, attachments, or active links in Phase 1 notes. |
| Attachment/media abuse | File leaks records or carries malware | No upload/download/file picker/camera/microphone/clipboard ingestion. |
| AI leakage/injection | Message sent to Nova/model or summarized by AI | No model call, AI summary, embeddings, moderation provider, or prompt logging from family notes. |
| Notification leakage | Email/test sink reveals or routes to a real person | Default profile has none; integration destination/from identity must match the exact reserved-domain server policy and fixed loopback Mailpit transport; synthetic subject/body only; no arbitrary/Internet address; sink captures inventoried and deleted. |
| Kill-switch race or stale outbox egress | A tenant is disabled after message creation but a pending/leased notification still exits | Turning the tenant Messaging mirror off cancels pending `family_message` outbox rows; service claim cancels rather than returns a disabled-tenant message, and immediate pre-send validation rechecks the mirror. Existing Family history and announcements remain read-only; revocation, relinquishment, redaction, retention and signed delivery-event maintenance remain available. Invitation, account-security and digest kinds retain their separately defined controls. |
| Guessable/correlatable destination digest | A bare email hash can be enumerated, or one credential can reveal/correlate every destination | Normalize and allowlist-check only in a server action; store a versioned keyed HMAC computed with the separate 32-byte base64url `FAMILY_EMAIL_DIGEST_KEY` plus independently encrypted delivery material. Database/browser/logs receive no plaintext or key; never use bare SHA-256. |
| Digest/encryption key exposure | Compromise permits address correlation, invite acceptance abuse, or decryption of queued test destinations | Keep HMAC and outbox-encryption keys separate in the server secret system; use the v2 keyring/active key ID plus purpose-derived token/email subkeys and immutable purpose/tenant/record AAD; legacy-v1 read is separately gated, bounded and never writable. Default-off worker; kill invite/message/email paths, cancel pending outbox, expire synthetic invites and rotate/recreate synthetic fixtures. Static swap/key-selection tests do not replace real provisioning, overlap/retirement, compromise and backup drills. No fallback to old/unkeyed digest. |
| Public-webhook privilege escalation | Webhook route receives `service_role`, accepts a forged writer token, or its writer role can query/mutate tables or call another RPC | Route holds no `service_role`; exact Svix verification first; strict event DTO; short-lived dedicated writer JWT with locally preflighted issuer/audience/`role`/expiry plus publishable key. The exact current 001–018 loopback PostgREST harness verified strict 204, one delivery event/outbox transition, zero table/sequence and exact one-function authority, plus denial for anon/authenticated/`service_role`/wrong-audience/table/cross-RPC attempts. Hosted asymmetric-key validation and production token rotation remain open; local JWT decoding alone is never signature verification. |
| Nested outbox payload smuggling | A forbidden `email`, `token`, body or auth value is hidden below a top-level object/array | Candidate SQL recursively scans objects and arrays, rejects forbidden names at any depth, enforces an exact top-level schema per notification kind, and bounds bytes/depth/node count. The exact local migration/pgTAP run passed. Keep worker strict Zod parsing as an independent boundary; deployed worker/no-egress negative traces remain open, and unknown/invalid payloads always fail closed. |
| Enumeration | Thread/learner existence leaked by error/timing | Opaque IDs, bounded lists from server, generic denials, stable envelopes. |
| Message flood or retry bypass | A participant floods one thread, or changes a request while reusing an idempotency key to avoid accounting | Migration 011 wraps the authoritative message mutation, binds the complete immutable request meaning, serializes exact replays, and charges only a newly inserted message: 20 per fixed 10-minute window and 100 per UTC day for actor+tenant+thread. Exceeding either returns a generic denial. Revoke, relinquish, and redaction remain available for containment. Edge/WAF and authenticated-session aggregate limits are still required. |
| Ordering/replay | Duplicate/reordered notes misrepresent a conversation | Immutable fixture version, stable synthetic timestamp/order, duplicate ID rejection. |
| Redaction metadata or content recovery | A Family DTO exposes the original body, redacting actor/reason, idempotency or retention metadata, or the UI hides the fact that content was removed | Strict workspace DTO returns only bounded message fields plus a boolean redacted state; the UI renders a reviewed tombstone label in the complete admitted history. Original content and internal redaction metadata never cross the RPC/DTO boundary. Administrative redaction requires a two-person, exact-thread, maximum-15-minute support grant and writes an immutable audit event. |
| Stale Teacher announcement scope | A teacher opens an allowed-school composer, then publishes after the class/staff assignment is revoked, or bypasses the preflight by calling the mutation RPC directly | The school-list and preflight DTOs are hints, not capabilities. The publish mutation itself repeats active tenant/school, teacher-role, class and current staff-binding authorization; scoped admin lifecycle is likewise rechecked. Unknown/out-of-scope schools receive non-disclosing denial. |
| Announcement broadcast/private-reply confusion | A family reply becomes a public school announcement comment, or an announcement is mistaken for monitored support | Announcements are bounded plain text for already authorized Family workspaces. The private-reply control creates a separate topic=`other` thread only through an already allowlisted `messageContacts` entry and the normal new-thread authorization. It never mutates the announcement, reveals a roster, or claims monitoring/urgency response. |
| Announcement content injection or retention drift | Staff markup/oversized text executes in Family UI or survives policy | Strict title 1–200/body 1–2,000 NFC/trimmed plain-text schemas plus database control-character/length checks, escaped rendering, idempotency, active retention authority and original maximum-30-day anchor; no HTML, attachment, recipient selector, outbox delivery or link preview. |
| Local-state crossover | Shared browser shows prior synthetic guardian's read/closed state or reply | Keep all Message demo state in component memory; do not persist it; clear on refresh/sign-out/tenant/thread change/expiry; never use it for authorization. |
| Closed-thread mutation | A closed thread is reopened or accepts another reply | Closed is terminal/read-only for the demo thread; remove reply/reopen controls; copy may suggest a separate thread without creating a backend record. |
| Cache leak | Private DTO served to another session | Private/no-store; no shared/CDN cache; vary/session review; clear local demo state. |
| Log/analytics leak | Body, alias, thread ID or learner ID appears in telemetry | Event-code-only logs; no message body/request/response/query in telemetry; test output redaction. |
| Retention drift | Synthetic content persists beyond allowed period | `expires_at`, daily expiry, environment teardown, local-state cleanup, bounded backups; 30-day absolute maximum. |
| Urgent/safety report | User relies on a demo thread for emergency support | Prominent non-operational disclosure and reviewed emergency/support copy; no claim that staff monitor the surface. |

## Synthetic-note content rules

Each default UI-demo note must:

- be generated from a reviewed fixture or localization key;
- contain no real name, contact, school, class, student number, birthday, grade,
  disability, IEP/504, diagnosis, attendance, discipline, exact assessment
  answer, Nova conversation, image, audio, or free-text learner work;
- use only plain text, maximum 1,000 characters;
- identify its author only as `guardian_demo` or `school_support_demo`;
- carry an obvious synthetic/non-delivered notice;
- avoid promises, legal advice, diagnosis, placement, emergency response,
  disciplinary action, or claims that a human reviewed the learner;
- reference progress only through an allowlisted coarse synthetic projection;
- remain immutable within a fixture version.

Each local reply preview must:

- be plain text with client `maxlength=2000` and the same shared schema limit;
- render only through normal escaped text nodes, never HTML/Markdown;
- show `local preview — not sent` adjacent to the input and rendered preview;
- have no recipient selector, send wording, delivery status, attachment, link
  preview, remote asset, notification or provider destination;
- stay in browser memory only and clear on refresh, cancel, sign-out, tenant or
  thread change, expiry, and synthetic-notes/global kill switch;
- never enter a request, log, analytics event, error report, trace, screenshot
  evidence beyond an approved synthetic test string, database, outbox, backup,
  model/AI call or clipboard automation;
- be used only by protected synthetic reviewers instructed not to enter real
  personal, learner, school, credential or education-record data.

## Local interaction rules

Mark-read, terminal close, open/closed filtering, reply drafts/previews, and
Settings demo toggles stay in component/browser memory only. They do not use
`localStorage`, `sessionStorage`, a server action, database, outbox, provider or
analytics event. State clears on refresh, sign-out, tenant/thread change,
fixture version change, synthetic record expiry, or global kill switch. Only the
non-personal theme enum may use the family UI's `localStorage` key space.

Once closed, a demo thread is read-only. The UI removes its reply input and
offers no reopen action. The controlled integration profile may create a distinct
synthetic server thread through its separately labeled request, but it may not
reopen or append to a closed thread.

## Controlled synthetic integration rules

The integration profile is a test harness, not a family communication service.
It must satisfy all of the following:

- `FAMILY_PORTAL_ENABLED`, synthetic mode, global
  `FAMILY_MESSAGING_ENABLED`, the exact tenant's
  `family_messaging_enabled` database mirror, and—only for the controlled email
  step—`FAMILY_EMAIL_NOTIFICATIONS_ENABLED` are independently checked server-
  side; missing/invalid values are off. The global and tenant Messaging layers
  must both be true. The tenant mirror is not a separate product flag;
- synthetic Clerk-development identity maps to app-owned membership/role;
  every thread/message rechecks tenant, active guardian link or teacher-school
  assignment, participant and non-revoked status through service authorization
  and RLS/RPC;
- no administrator has standing message-read authority. A scoped school/district
  administrator may request one known thread; a different district administrator
  must approve it; only the requestor may open that exact case; and the grant
  expires within 15 minutes. Redaction is available only inside that current
  approved case and returns a tombstone, never the original body afterward;
- with the tenant Messaging mirror off, direct message send, mark-read, close,
  Teacher announcement publish, Teacher inbox and preference opt-in deny.
  Guardian workspace/history and existing announcement reads remain available
  as read-only state; preference opt-out, relationship revoke/relinquish,
  redaction and retention remain available for safety/lifecycle work;
- compose/send is visibly labeled as a synthetic integration action and is
  separate from the local `not sent` preview; body is NFC-normalized plain text,
  1–2,000 characters at schema/service/database, escaped on render, and contains
  no real person/school/record;
- Teacher announcement composition uses a strict tenant/school allowlist DTO and
  bounded title/body input. The server action performs a resource-derived
  preflight and tenant/school cross-check, while the publish RPC independently
  repeats the current role/class/staff or scoped-admin authorization. A Family
  announcement private reply uses only the normal new-thread message path and
  an already allowlisted staff contact; it never becomes a public reply or a
  monitored-support promise;
- recipient app user/role and test-email destination are server-derived. The
  client cannot supply an arbitrary email, phone, webhook, tenant or role;
- a server-only action validates the exact development issuer/subject and
  verified synthetic email, normalizes and allowlist-checks it, and computes a
  versioned keyed HMAC with `FAMILY_EMAIL_DIGEST_KEY`. SQL compares only the
  submitted HMAC with stored state. The database holds no email plaintext,
  HMAC key or outbox decryption key; a browser or direct RPC cannot perform or
  bypass this step;
- the current `synthetic-invalid-only` policy may exercise the test-email step
  only through the separately selected non-production `mailpit-local` transport,
  fixed to the loopback Mailpit sink and the exact reserved domain. No operator
  may reinterpret an `@helpmath.invalid` address as an Internet inbox or route it
  through a general SMTP/Resend destination. The transport, local sink,
  provider/from restrictions, test evidence and cleanup require an exact release
  receipt; real or arbitrary addresses remain forbidden;
- outbox events use allowlisted kinds and minimal synthetic payloads, are
  idempotent, bounded, retry-limited and retained under the original ≤30-day
  anchor. Message content never enters operational logs;
- the database-enforced message budget is 20 newly inserted messages per fixed
  10-minute window and 100 per UTC day for the exact actor+tenant+thread. Exact
  idempotent replay rechecks the original new-thread/existing-thread request and
  consumes no second slot; a changed request with the same key denies. Budget
  rows expose no message body and expire within two days. This resource budget
  does not replace edge/WAF or authenticated-session aggregate limits;
- with valid `CRON_SECRET`, the candidate bearer-protected cron remains
  reachable and runs bounded service-only retention before product-flag
  branching. If either portal or email is off, it skips digest enqueue, claim
  and all egress. Only when both are on may the integration branch enqueue a
  weekly synthetic digest, claim a lease, revalidate immediately before send,
  deliver from/to exact reserved-domain identities through fixed loopback
  Mailpit, and complete
  through claim-token CAS. Every tenant retention result must be `succeeded` or
  the worker returns a retryable failure before egress. The signed webhook stays
  reachable after outbound flags turn off, but only an exact valid Svix
  signature over a non-empty body capped at 256 KiB may append a matching
  delivered/bounce/complaint/suppression event
  through `record_family_email_delivery_event_v1`. It uses the short-lived
  `family_webhook_writer` JWT and publishable key, never `service_role`;
  Supabase/PostgREST must verify its signature and assume a NOLOGIN/no-table/
  one-RPC role after local claim-shape preflight. It never sends or directly
  updates outbox state, and unknown provider IDs/events receive generic denial;
- email subject/body visibly say synthetic test, contain no real identifiers or
  urgent/safety promise, and load no tracking pixel, remote image, attachment or
  link preview beyond the exact invite link transport;
- revoke immediately blocks family/thread access and further enqueue/delivery;
  queued work is cancelled or suppressed, then database/outbox/provider copies
  are reconciled and deleted within policy; and
- one evidence receipt binds fixture IDs/digests, flags, the test-destination
  allowlist artifact digest and HMAC key version, RPC/outbox/provider events,
  browser/network trace, revocation denial and deletion counts without storing
  an address, address HMAC, key, token, ciphertext or message content.

## Real messaging remains a separate product

Before changing mode to `live`, a successor ADR and threat model must define and
obtain approval for:

- whether messaging is needed at all and who is an authorized sender/recipient;
- district/school custody of the workflow and staff availability expectations;
- verified guardian relationship and teacher/school assignment;
- age/child-contact policy, acceptable use, harassment/grooming/escalation,
  moderation and emergency disclaimers;
- exact message/metadata/notification/attachment fields and purpose;
- record classification, FERPA/COPPA/state-law treatment, legal hold, export,
  correction, deletion and parent/student rights;
- notification providers, destinations, lock-screen/email content, opt-out,
  bounce/complaint handling and subprocessor terms;
- attachments/links/malware/DLP, if allowed; default should remain none;
- encryption, key access, administrator/support access and immutable audit;
- retention by tenant/contract, deletion propagation, backups and restore
  suppression;
- rate limits, spam/abuse controls, incident response, SLO/support ownership;
- EN/ES/accessibility requirements and exact Privacy/Terms/DPA disclosures.

Real messaging requires written Privacy, legal, DPA/contract, district,
security, support-operations, Owner, and exact-release approval. No synthetic
UI review or local interaction test may be reused as that approval.

## Kill-switch triggers

Set messaging mode to `off` immediately if:

- any send/delivery/provider path is reachable outside the exact controlled
  integration profile, any destination misses the test allowlist, or the local
  reply preview is presented as a real compose/send path;
- a destination uses a bare hash, the HMAC/encryption keys are absent,
  malformed, reused, visible to browser/database/logs, or the exact-issuer
  server-action boundary can be bypassed through a direct RPC;
- a real person, contact, learner record, or communication is found;
- a note lacks the synthetic disclosure or appears attributable to a real staff
  member;
- cross-tenant/cross-child access or cache crossover is suspected;
- a body appears in logs, analytics, AI/model traffic, or unapproved
  screenshots/build artifacts;
- local mark-read/close state changes a canonical record or becomes persisted,
  a closed thread exposes reply/reopen controls, or reply preview text
  leaves browser memory or triggers a request;
- retention/deletion fails or an expired thread reappears after restore;
- unreviewed HTML, Markdown, URL, image, attachment or external request appears.

If scope is uncertain, disable the global family portal as well and follow the
incident/recovery runbook.

## Required Phase 1 verification

Default UI-demo evidence:

- plain-text local reply input is present with `maxlength=2000`, shared schema
  enforcement, adjacent `not sent` disclosure and a non-send action label;
- no recipient, send action, upload, email, SMS, push or notification UI;
- route/API inventory identifies every send action/endpoint/RPC, outbox trigger,
  cron and webhook. It proves message/provider egress unreachable from the
  default profile; the cron requires its bearer and performs retention only,
  while the webhook requires exact Svix verification and can append only
  allowlisted lifecycle events;
- browser network trace shows no write request for local read/close/reply-preview operations;
- no `notification_outbox` insert and no outbound provider call in the default
  profile;
- exact DTO, 0/1/2,000/2,001-character boundary, Unicode/plain-string and
  escaped-text rendering tests;
- cross-tenant, cross-child, guessed-thread, revoked-link and expired-data denial;
- component-state isolation, refresh/cancel/expiry/sign-out/tenant/thread-switch
  and kill-switch cleanup, including reply preview memory; no Message/Settings
  key in `localStorage` or `sessionStorage`;
- closed threads are read-only with no reply/reopen control; new-thread guidance
  creates no server record or network request;
- CSP/remote-resource/attachment/link denial;
- logs/analytics/errors contain no body, alias or record selector;
- fixtures pass synthetic/PII review and 30-day deletion;
- EN/ES copy makes "synthetic, not sent, not monitored" unambiguous;
- keyboard, screen-reader, mobile/reflow and focus-state verification.

Controlled integration evidence:

- exact synthetic Clerk-development users, Supabase-local project/migration/RLS
  digest, flags, reserved-domain recipient/from policy, Mailpit loopback/capture/
  cleanup evidence, HMAC/encryption key versions and local test configuration,
  without recording secret values;
- two-way 0/1/2,000/2,001-character, Unicode/control-character, idempotency,
  ordering, close, wrong-role/tenant/child/thread and rate-limit tests;
- fixed-window boundary and concurrent-last-slot tests for 20/10 minutes and
  100/UTC day per actor+tenant+thread; exact replay is free, changed replay
  conflicts, the losing over-limit transaction persists neither message nor
  outbox work, and revoke/relinquish/redaction remain callable;
- browser→action→RPC/RLS→message→outbox→cron→Mailpit trace for
  the exact reserved-domain destination only, with no unexpected egress; signed
  Resend lifecycle-webhook behavior is evidenced separately because it is an
  inbound maintenance path, not part of local Mailpit delivery;
- selected-gateway proof that a short-lived exact issuer/audience/role/expiry
  writer JWT reaches only the delivery-event RPC and returns strict 204; its
  expired/replaced/wrong-claim variants plus anon/authenticated/service-role
  callers fail, the writer has zero table/other-function authority, and token
  rotation preserves provider retry without enabling outbound email. The
  exact current 001–018 disposable loopback PostgREST harness proved the strict 204,
  exactly-one event/outbox transition, zero-table/zero-sequence/exact-one-RPC
  authority, and denial for anon/authenticated/`service_role`/wrong-audience/
  table/cross-RPC attempts. Hosted
  asymmetric-key configuration, production rotation and
  deployed-provider retry remain open;
- 0/1/256-KiB/over-limit webhook-body tests with and without `Content-Length`,
  chunked overflow cancellation, invalid/valid Svix signatures, strict event
  normalization and no dependency on the outbound Resend API key;
- nested/aliased forbidden outbox fields, excessive depth/bytes and unknown
  per-kind keys are rejected before persistence; worker strict parsing rejects
  any residual invalid row without provider egress;
- non-allowlisted/real-looking address, missing flag, production account,
  arbitrary recipient, wrong/unregistered issuer, unverified-email claim,
  missing/malformed digest key, direct-RPC redemption, replayed event and forged
  webhook all fail closed;
- keyed-HMAC normalization vectors pass; key rotation first disables invite,
  message and email paths, cancels pending delivery, expires/recreates only
  synthetic destination fixtures, and proves old-HMAC redemption/delivery is
  impossible before re-enable;
- revoke cancels/suppresses pending delivery, denies subsequent read/send, and
  deletion/restore tests reconcile database, queue, provider and backup copies;
- exact synthetic receipt contains status IDs/counts/digests only, never token,
  address or message body.

Passing the first group establishes only the exact synthetic local-interaction
behavior. Passing both groups may establish the controlled synthetic E2E only.
Neither approves production provider configuration, real recipients, real live
messaging, or real-family use.
