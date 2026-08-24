# Retention classification and 30-day synthetic-data policy

Status: **Proposed Phase 1 policy; no production retention configuration or legal approval is claimed**

## Policy statement

Phase 1 processes no real adult or learner PII and no real education record.
Every instantiated synthetic record, copy, projection, family demo UI state, log,
audit event, export, test capture, temporary file, queue item, and backup must be
deleted no later than 30 calendar days after the original record was created.

Thirty days is an absolute maximum, not a default promise to retain for 30 days.
Shorter operational periods below apply whenever possible. Copying, reprocessing,
exporting, restoring, or moving a record does not restart the clock. The earliest
source `created_at` follows every derived copy as `retention_anchor_at`.

If the system cannot prove the anchor, expiry, deletion propagation, and backup
aging for a data class, that class and the dependent feature remain disabled.

## Applicability

This policy covers only the Phase 1 synthetic family environment. It does not
set retention for a future real-family service. Real-family retention must be
defined from purpose, Privacy Notice, applicable law, DPA/contract, district
instructions, data rights, legal hold, subprocessors, backups, and Owner/legal
approval before any real record exists.

This policy does not authorize copying historical HELP Math data. Legacy
accounts, credentials, learner activity, organizations and relationships remain
prohibited inputs.

## Classification and schedule

| Class | Examples | Storage allowed in Phase 1 | Target lifetime | Absolute deletion deadline |
|---|---|---:|---:|---:|
| `SYN_FIXTURE_TEMPLATE` | Reviewed generator code, localization key, schema-valid fictitious template with no runtime ID/state | Repository/test package | Versioned as product test asset only while it remains provably fictitious and stateless | Not an instantiated record; remove immediately if any real/linkable value enters it |
| `SYN_IDENTITY` | Synthetic `app_users`, `provider_identities` mapping, `role_bindings`, aliases | Isolated synthetic store | Environment/test need; preferably ≤7 days | 30 days from original creation |
| `SYN_RELATIONSHIP` | Synthetic `schools`, `students`, `guardian_links`, staff role bindings | Isolated synthetic store | Environment/test need; revoke immediately when scenario ends | 30 days from original creation |
| `SYN_INVITE` | Token digest, state, attempts, expiry | Isolated invite store | Plaintext never stored; token valid 30 minutes; terminal metadata preferably ≤7 days | 30 days from invite creation |
| `SYN_LEARNING_PROJECTION` | Assignment, exact synthetic assignment→learning-object binding, progress, skill band, source watermark | Isolated projection store | Rebuildable; preferably ≤7 days after fixture/version replacement | 30 days from earliest source record |
| `SYN_NOTE` | Fixed UI-demo thread/message or tester-authored controlled-integration thread/message | Isolated fixture/message store | Scenario/test lifetime; integration body plain text ≤2,000 | 30 days from original creation |
| `SYN_LOCAL_UI_STATE` | Initial-unread→read overlay, terminal closed/open filter state, Settings demo toggles | Component/browser memory only | Page/session lifetime; reset on reload/sign-out/tenant/fixture change/kill switch | Never persisted or backed up; closed thread has no reopen action |
| `SYN_LOCAL_REPLY_PREVIEW` | Plain-text synthetic reply preview, maximum 2,000 characters | Browser memory only | Clear on refresh, cancel, sign-out, tenant/thread change or kill switch | Page/session lifetime; never backend/backup retention |
| `LOCAL_THEME_PREFERENCE` | Enum-only light/dark product preference with no actor/tenant/learner/thread linkage | `localStorage` | Until changed/cleared by the browser user | Outside the synthetic-record clock only while it remains the exact non-personal enum; any added identifier/state moves it into the 30-day rule |
| `SYN_SESSION` | Synthetic server session and CSRF state | Session/cookie store | Session maximum or 24 hours, whichever is shorter | 24 hours; never 30-day default |
| `OPS_SECURITY_LOG` | Request ID, event/reason code, allow/deny, latency bucket | Approved isolated log sink | 7 days unless an active investigated incident needs a reviewed shorter evidence package | 30 days from event |
| `SYN_AUDIT` | Synthetic role/link/invite/kill-switch action codes and digests | Append-only synthetic audit store | 30 days maximum | 30 days from event |
| `SYN_RETENTION_RECEIPT` | Job ID, scope, row counts, completion time, digest | Synthetic operations store | 30 days | 30 days from job completion, without deleted content |
| `SYN_TEST_ARTIFACT` | Screenshots, traces, network captures, reports containing instantiated IDs/state | Access-controlled test output | Delete after review, preferably ≤7 days | 30 days from capture/source anchor, whichever is earlier |
| `SYN_TEMP_QUEUE` | Retry/outbox/cache/temp/staging record | Controlled integration only for invite/message/test-email; otherwise none | Minutes/hours; bounded retry then terminal cleanup | 7 days or source deadline, whichever is earlier |
| `SYN_ABUSE_BUDGET` | Privacy-minimized actor+tenant+student/invitation/thread fixed-window count; no token/email/message body | Internal database only; no base-table grant or product DTO | One hour, ten minutes, or UTC day as applicable | Candidate hard ceiling is two days from the immutable window start; retention worker deletes expired rows |
| `SYN_GOVERNANCE` | Rights request, teacher suggestion or exact-thread support request containing only fictitious IDs/labels and bounded synthetic text | Isolated synthetic store through strict governance RPCs only | Scenario/test lifetime; approved support access expires within 15 minutes | 30 days from original submission; review/access never restarts the clock |
| `SYN_TEST_DESTINATION` | Exact reserved-domain local-Mailpit recipient/from address, versioned keyed HMAC, separately encrypted delivery value, policy version | Server-side controlled-integration configuration/store only; database has no plaintext, HMAC key or decryption key | Exact active local test window; remove on teardown and recreate on key rotation | 30 days from original registration or earlier source deadline; copying/rotation never restarts clock; plaintext never logged/returned |
| `SYN_PROVIDER_COPY` | Mailpit-captured test email envelope/body and local delivery ID; or a signed external lifecycle event for already-sent candidate work | Exact controlled local sink/lifecycle boundary only | Delete immediately after evidence reconciliation | 30 days from earliest source/message/invite anchor; sink/provider default must not extend it |
| `SYN_BACKUP` | Snapshot containing any instantiated synthetic row | Approved isolated encrypted backup if needed | Short rolling recovery window; fixture regeneration is preferred | No byte may survive the source record's 30-day deadline |
| `REAL_PII_OR_EDU` | Any real adult/child identity, contact, school, relationship, progress, message or record | **No** | Immediate containment/deletion and incident handling | Not permitted; discovery is an incident |
| `SECRET` | Password, token plaintext, private key, provider secret | Dedicated secret system only; never application record/fixture/log/backup | Provider/secret rotation policy | Never governed as synthetic data; exposure is an incident |

## Fixture-template exception is narrow

A static fixture template may remain in version control beyond 30 days only if
all of the following are true:

- it contains no real or plausibly linkable identity/contact/school value;
- it contains no provider subject, legacy identifier, runtime record ID, token,
  cookie, event actor, secret, production URL, or copied communication;
- names/labels are unmistakably fictitious and reviewed for accidental match;
- dates and IDs are generated at runtime in an isolated namespace;
- it contains no state about a person or test run;
- automated forbidden-field and secret/PII scans pass.

An instantiated fixture, snapshot, golden response containing runtime IDs, or
screen capture is a synthetic record and receives the 30-day clock.

The theme exception is equally narrow: the stored value may contain only the
reviewed theme enum and schema key. Messages, Settings toggles, learner choice,
thread/read/closed state, reply text, invite token, locale tied to an identity,
or any record selector may not share that `localStorage` entry.

## Required record metadata

Every synthetic persisted row or object must have, directly or through a
provable immutable parent:

- `data_mode = synthetic`
- `environment_id`
- `schema_version`
- `created_at`
- `retention_anchor_at`
- `expires_at`
- `retention_class`
- `fixture_version` or source watermark
- for encrypted fields, a non-secret `encryption_key_version` plus immutable
  tenant/record/purpose context authenticated as AAD (or an equivalent purpose-
  separated subkey contract)

`expires_at` is computed server-side and cannot be extended beyond
`retention_anchor_at + 30 days`. Client input, tenant settings, restore time,
retry time, last access, or update time cannot extend it.

Adult-email correlation uses a versioned keyed HMAC computed only by the
server action with the separate 32-byte base64url `FAMILY_EMAIL_DIGEST_KEY`.
Bare SHA-256 is prohibited. The database may hold the HMAC and independently
encrypted test destination, but it has no email plaintext, HMAC key or
decryption capability. A key rotation expires and recreates the affected
synthetic destination/invite fixtures under their original anchors; it does not
rehash inside the database, decrypt historic rows broadly, or create a new
30-day clock. The current candidate v2 envelope has an explicit key ID,
purpose-derived token/email subkeys and immutable purpose/tenant/record AAD;
static swap-denial/keyring tests pass. Real key provision, dual-read rotation,
old-key retirement, compromise, backup/no-resurrection and deployed-flow tests
remain open, so controlled integration activation is not authorized.

### Local SQL alignment is verified; deployed lifecycle operation is not

The current candidate migration text constrains
`retention_policies.retention_days` to 1–30 and includes original-anchor/
maximum-30-day checks for progress and skill projections, guardian invitations,
family messages, school announcements, `learning_events_v2`, notification
outbox, email-delivery events, and audit events. The lifecycle extension adds
non-extendable lifecycle anchors/deadlines for the tenant, application contact,
provider identity, role binding, guardian link, family thread/read,
notification-preference, email-suppression and retention-receipt classes. It
also adds terminal tenant shutdown, immediate authority/egress denial, bounded
contact scrub/provider-identity deletion, relationship/thread/preference/
suppression cleanup, and child-before-parent teardown of tenant-linked synthetic
fixtures while retaining the tenant row as a terminal tombstone.

Migration 011 adds `family_abuse_budget_windows` with an immutable window anchor,
a maximum two-day expiry, no browser or service-role base-table grant, and
bounded deletion through the existing service-only retention receipt. Its rows
contain only the actor, tenant, one resource selector, operation, window, count,
and lifecycle metadata—never a token, email, ciphertext, message body, or DTO.
Revoke, relinquish, and redaction remain deliberately outside the budget so
containment cannot be rate-limited. The exact 001–018 local snapshot passed its
named retention and last-slot tests.

Migration 014 adds the three governance workflow tables under the same immutable
30-day lifecycle ceiling. Support approval changes only the bounded access
deadline and never the retention anchor. The service-only retention wrapper
cleans expired rights, suggestion and support rows without exposing their free
text in audit receipts.

Candidate `rebuild_family_projections_v1` and
`enqueue_weekly_family_digests_v1` add service-only replay/enqueue shapes; a
rebuild must preserve each source's original retention anchor, and a digest must
not create a later deadline than its source rows. These are production-shape
contracts only. They do not prove a hosted migration/deployment, scheduled
deletion, complete provider/test-inbox/log/cache cleanup, hosted-backup aging or
an independently approved deletion receipt.

The exact current eighteen migrations and fictional synthetic seed applied cleanly
to a fresh local PostgreSQL 16 database. The final pgTAP plan reported `489/489`
passing, including the named lifecycle/retention contracts; all 38 public tables
had RLS enabled. A disposable loopback PostgREST harness verified named custom-
role and concurrency paths against the exact current 001–018 artifact. The same
runner terminalized the staffed Maple tenant, deleted one expired governance
record, made a mode-`0600` custom-format logical backup, and restored it into two
empty local databases. Both restored catalogs retained 38/38 RLS and the exact
closed/expired/revoked/deleted state. Hosted PostgREST/RLS, deployed scheduler/
worker execution, worker-off cleanup, external-copy deletion, managed-backup
restoration and independent privacy/operations approval must be verified
separately.
Until those results and independent privacy/operations review are recorded,
`FP-S09` remains blocked and the affected persisted profile stays off.
The opt-in Vercel candidate declares one five-minute notification route. Current
candidate proxy/worker code keeps the bearer-protected cron route reachable and
calls `run_family_retention_v1(1000)` before product-flag branching. If either
portal or email is off it skips weekly-digest enqueue, claim and all egress;
only when both are on may enqueue/claim/validate/send/complete proceed. That is
a candidate cadence shape, not evidence that a Vercel cron exists, its secret/
configuration is correct, a run succeeded, alerts fired, or a deletion/no-
resurrection drill passed. The worker now parses the retention result and treats
any tenant `runs[*].status` other than `succeeded` as a retryable request failure;
this prevents a top-level successful RPC envelope from hiding a tenant-level
retention failure, but still needs an exact runtime/alert/retry drill.
`rebuild_family_projections_v1` remains a manual tool with no declared cadence.
It now shares the uniquely resolved student-row lock with real-time ingest. The
exact current 001–018 loopback harness ran one HTTP ingest concurrently with one
HTTP rebuild on two active PostgreSQL backends; both returned 200 after lock
coordination and the final event/projection watermark was consistent. A separate
two-concurrent-ingest race also passed. Hosted/production concurrency, cadence,
monitoring and operations approval remain open.
The retention RPC statically includes worker-independent outbox
terminalization: expired pending rows become cancelled and eligible for purge;
max-attempt pending rows with no valid lease become failed and clear the lease;
an expired orphan lease is released for a later bounded claim. A tenant-level
failure is re-raised. The exact local migration/pgTAP run passed, but that does
not establish a deployed scheduler, a real worker-off cleanup, external-copy
reconciliation or alert/retry behavior. The exact local no-resurrection drill
passed, but `FP-S09` remains open because a local logical backup is not deployed
retention, hosted-backup, external-copy or privacy/operations evidence.

## Deletion propagation

When a synthetic record expires, is revoked, or is deleted:

1. Access fails closed immediately; a delayed physical purge does not preserve
   authorization.
2. Delete dependent links, sessions, projections, threads/messages, local demo
   state on next contact, caches, staging/temporary records and queues.
3. Record a privacy-safe retention receipt with counts/digest, not content.
4. Send deletion tombstone/suppression identifiers to every allowed backup and
   restoration process so a restore cannot resurrect the record.
5. Remove eligible backup bytes before the original 30-day deadline.
6. Verify with source-to-copy reconciliation and a no-resurrection restore test.
7. Escalate any mismatch and keep the dependent feature disabled.

The default UI demo has no message delivery provider or notification outbox. The
controlled integration profile may use only its exact synthetic outbox and
fixed loopback Mailpit sink for reserved-domain recipients; those database,
queue and local-sink copies are part of deletion reconciliation. Phase 1 has no SIS, LRS-family
identity binding, model provider, real contact provider, or arbitrary
destination. Any unexpected copy is an incident rather than a silent addition
to the deletion list.

## Job cadence and failure behavior

- Access-time filter: expired rows are unreadable immediately.
- Primary expiry job: at least daily in an active synthetic environment.
- Local browser cleanup: on app load, sign-out, tenant/fixture change and global
  kill switch.
- Backup aging/suppression: before the original 30-day deadline.
- Reconciliation: daily counts by class/environment plus a weekly synthetic
  deletion drill while the demo is active.

If the daily job misses one run, the service still hides expired rows and pages
the owner. If the next run fails, a copy cannot be located, or the 30-day maximum
is at risk, disable the affected feature or the global family surface and follow
the runbook. Do not extend retention to make a failing job appear compliant.

## Environment teardown

A Phase 1 environment teardown must:

- disable family, invite, projection, notes, synthetic messaging and synthetic
  test-email switches;
- revoke synthetic sessions, memberships, links and invites;
- delete primary and derived synthetic records;
- clear caches/queues/temp objects, cancel/suppress test outbox work, delete
  provider/test-inbox copies where supported, and discard component-memory
  family demo state; do not use the theme key as a family record store;
- age/delete backups within each source's original deadline;
- produce a count/digest receipt with zero retained content;
- verify no real/provider/legacy source was connected;
- retain only reviewed stateless fixture templates and privacy-safe aggregate
  engineering results.

## Incident preservation and legal hold

There is no routine application legal-hold feature in Phase 1. Security incident
evidence should be minimized to event/reason codes, timestamps, configuration
digests and non-reversible identifiers. It may not become a shadow archive of
the data being deleted.

If an authorized legal/security owner determines that evidence must be kept
beyond this policy, the family surface remains off and a written successor
authorization must identify exact evidence, authority, access, duration and
deletion. This synthetic policy cannot be silently overridden by an operator or
tenant setting.

## Verification evidence

At minimum record:

- policy/schema/fixture version and exact artifact digest;
- synthetic environment ID and time window;
- counts by class before/after deletion, never record content;
- oldest `retention_anchor_at`, newest permitted deletion time and actual time;
- primary, cache, queue, object, local-state and backup reconciliation;
- restore/no-resurrection test result;
- unexpected-provider/egress scan;
- reviewer, exceptions and kill-switch disposition.

A passing local cleanup test does not prove production retention, subprocessor
deletion, legal compliance, or real-family readiness.
