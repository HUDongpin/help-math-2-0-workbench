# Family portal RLS permission matrix

Status: **Normative Phase 1 contract; exact current local PostgreSQL/pgTAP and bounded loopback gateway checks verified; hosted deployment and approval unverified**

## Local database evidence and frozen artifact identity

Dated evidence (2026-08-24): the exact eighteen ordered migrations and
fictional synthetic seed below applied to a fresh local PostgreSQL 16 database.
The final pgTAP plan was `1..489`, with `489` passed and `0` failed/skip/todo.
Catalog checks found 38 public physical tables with RLS enabled on all 38 and
17 public policies. The
dedicated invitation-issuer and webhook-writer roles had zero table/sequence
privileges and only their exact RPC grants; the local server trap stopped after
the run. This is `CLOSED_DYNAMIC_LOCAL` for those exact checks. A
disposable loopback PostgreSQL 16.15/PostgREST 16.2/GoTrue 2.195/Mailpit 1.31/
gateway harness against the same exact current 001–018 artifacts verified the
custom-role, dual-tenant, concurrency and protected product paths below. Neither result is
a Supabase `db reset`, linked or hosted Supabase project, hosted asymmetric-key
gateway, deployment, configuration approval or real-family authorization.
Artifact-mismatched results cannot close a current release gate.

Frozen artifact identity used by that local run (SHA-256):

| Artifact | SHA-256 |
|---|---|
| `202608230001_parent_portal_core.sql` | `87cb73eaf66aa36374b795153353c14e4674908e7ce75948958c3349b042d610` |
| `202608230002_parent_portal_identity_rls.sql` | `779a68c1b9fde7b866cd48bc166ac51fef2e044f7502a5362b7e74a01da2be4d` |
| `202608230003_parent_portal_audit_outbox.sql` | `12374e5ded7f6bb17c8d4bc7defaf0b2f7cf60c4d2c2a62a6aef2d4ff255a321` |
| `202608230004_parent_portal_workspace_invitations.sql` | `3bc581c01e504802d64f68b07f8f7b8503b0c2a52addf5bba44470ae3e17a6d4` |
| `202608230005_parent_portal_messaging_events.sql` | `653088f9ed9b1e701c233dd831485fa7e99d5bcbd8a48f2946411bdedc72cb00` |
| `202608230006_parent_portal_publish_retention.sql` | `9f3898d63901f86389c214d253efa7ec3097118879e50f7053b15f2f7eb9b214` |
| `202608230007_parent_portal_digest_rebuild.sql` | `d2e6d16926f6fc084b935b9bc47f4bdb5c4e667eecfa516aeb9c4a460600047c` |
| `202608230008_parent_portal_invitation_issuer_crypto.sql` | `b01c41c0aca1458268ed79687cf7c87baab2e67e5189d49a131e4a8f240f1d8d` |
| `202608230009_parent_portal_retention_outbox_rebuild.sql` | `e23c2e2afada1207eb58d80de03cb7e21070fa38691e76d68d45ca2d8d04d083` |
| `202608230010_parent_portal_school_announcements.sql` | `1b6736390a047f0657ff254b35396cb5057a6ac49616b0ecd1b6407207ca25f9` |
| `202608230011_parent_portal_abuse_budgets.sql` | `d3ca4b5f0c09a9d9eb79a6acbdd842b6cbf6aa0ef35ec9eafca7afc80713fe58` |
| `202608230012_parent_portal_learning_assignment_launch.sql` | `96b59e8d551880eb0347d917ff2f84991003804b314a0aaf7f524b31c6bf9bcb` |
| `202608230013_parent_portal_tenant_workspace_messaging_gate.sql` | `450c407df516f293f045a7927a6846d28b594440b4b1b248b126a0e11d8c8722` |
| `202608230014_parent_portal_governance_workflows.sql` | `a12a147cc123f45dabb8548916ef63ce64db1ff293e913944252483ee712ef14` |
| `202608230015_parent_portal_production_invitation_issuer.sql` | `b42d615df9594d5804b58d716b2c9c6e0886a7c5c645d9183623ee67891ac86b` |
| `202608230016_parent_portal_production_session_revocation.sql` | `cd7ae0299889d2e0a825d4626e6360965f6bd82b4ad58dafeb41e5eed1710b06` |
| `202608230017_parent_portal_tenant_teardown_order.sql` | `9b76370c2a82e58ca9c86ec0b70887daadd81adbc1993cf25a9be4e2d71a1678` |
| `202608230018_parent_portal_invitation_probe_budget.sql` | `096d271cc55f7e7d69e8dc381e6dfef242c0783f8fbb3b4d4fcea6357c195462` |
| `supabase/seed.sql` | `13d84089dc5e09e3cd608365f5d0203cbb473c524219d2eb9737000fd24f7a78` |
| `supabase/tests/database/parent_portal_rls_test.sql` | `f4af31a4d56786fa5781d182b8560345a03313953d8b483f4ac32e691f4fde2f` |
| `scripts/verify-family-local-integration.mjs` | `f11aa58e2f0ef068ff0ecb928e71ac355b8c531897cb195019d584ac58a54fcd` |
| `apps/web/e2e/family-portal-integration.spec.ts` | `c4b3670fba9111427b588d5c294423cde40324c10bf2f03e0cf12a8467491181` |
| `apps/web/tests/family-auth-provider.test.ts` | `b92617dd663e88d1ae91c6d3465704f2a5bc97644d618019517567cbb5d34cd6` |

This matrix defines the minimum database authorization behavior expected of a
future tenant-isolated implementation. Service-layer authorization remains
mandatory; RLS is defense in depth, not a replacement for the BFF. Phase 1 is
synthetic-only. Migrations 015–016 add a separately default-off production-
shaped invitation candidate, but do not authorize a production tenant, real
recipient, provider, deployment or family. Migration 017 fixes the service-
only tenant teardown ordering so class staff bindings become inactive before
their required teacher roles. Migration 018 adds a pre-resource invitation-
acceptance probe budget keyed only by a SHA-256 digest of the current signed
provider identity; it stores no token, email, raw issuer or raw subject.
Default UI-demo user interactions make no database mutations; a separately
bearer-authenticated retention-first cron may operate only on the exact isolated
synthetic store when that opt-in runtime is deliberately selected. It remains
reachable when product flags are off so lifecycle cleanup is not disabled with
egress. The
controlled integration profile may exercise only the specifically labeled
synthetic invite/message/read-state/preference/revoke RPC paths below.

## Candidate physical names and conceptual projections

The canonical conceptual relationship `GuardianLearnerRelationship` maps to the
current physical table `guardian_links`. The frozen 001–018 sequence defines 38
public physical tables; all 38 were discovered with RLS enabled in the exact
local run:

- identity and tenancy: `tenants`, `app_users`, `provider_identities`,
  `tenant_identity_issuers`, `role_bindings`, `schools`, `students`, `classes`,
  `enrollments`, and `class_staff_bindings`;
- assignment/projection: `assignments`, `student_assignments`,
  `family_content_release_memberships`, `assignment_learning_object_bindings`
  (migration 012 candidate), `progress_projections_v1`, and
  `skill_projections_v1`;
- family access and communication: `guardian_links`, `guardian_invitations`,
  `family_threads`, `family_messages`, `family_thread_reads`,
  `family_notification_preferences`, `school_announcements`, and the internal
  `family_abuse_budget_windows` counters added by migration 011;
- pre-resource invitation defense: `family_invitation_probe_windows`, a
  security-only signed-provider-identity aggregate with no tenant/resource
  locator because an unknown 256-bit token cannot safely resolve either;
- invitation issuance control: `family_invitation_issuer_configs` and
  `family_invitation_issuance_attestations`;
- governance: `family_rights_requests`, `family_invitation_suggestions`, and
  `family_support_access_requests`;
- controlled events/delivery/operations: `learning_events_v2`,
  `notification_outbox`, `email_delivery_events`, `email_suppressions`,
  `audit_events`, `retention_policies`, and `retention_runs`.

`family_assignment_projection` and `family_progress_projection` remain logical
family-safe DTO contracts. Their candidate physical inputs are
`assignments`/`student_assignments`, `family_content_release_memberships`,
`progress_projections_v1`, and `skill_projections_v1`. The release-membership
table is an internal allowlist joining exact content, Lesson-release and
learning-object versions; it is not a new family authority or a way to promote
Current-JS/My Lesson/Lesson publication status. The candidate
  `family_workspace_for_tenant_v1` RPC also aggregates bounded count/time values from
`learning_events_v2` without granting raw-event table reads to
`authenticated`. The exact current local RLS/RPC suite passed. The bounded exact
current 001–018 loopback harness proved the named invitation-issuer and webhook-
writer role transitions. Those results are not evidence that a hosted runtime
is connected, that its asymmetric signing configuration and claims propagate
identically, or that a provider/use was approved.

Every tenant-scoped business table in the candidate carries `tenant_id`, `environment_id`
and `data_mode`, joined to the same triple on `tenants`. This is useful
production-shape structure. Phase 1 still requires `data_mode='synthetic'`
and an exact test environment/profile at every reachable service/RPC boundary.
Rows that are instantiated synthetic state must also be provably deleted under
the original 30-day anchor. A parent triple alone does not close retention.

## Candidate constraints observed, and still-open gaps

The current text includes several contract-aligned constraints: a
`family_messages.body` database maximum of 2,000 characters; a
`retention_policies.retention_days` range of 1–30; source-anchored maximum-30-day
checks on projections, invitations, messages, announcements, learning events,
outbox rows, delivery events, and audit rows; terminal-state/append-only
triggers; no authenticated table grant or select policy on `learning_events_v2`;
and a learner-scoped `ingest_learning_events_v2` RPC plus aggregate-only family
workspace read. Candidate production-mode message, learning-event, and
announcement writes additionally fail closed without an approved active
`retention_policies` row. The exact local migration/pgTAP run verified the named
database contracts. Hosted gateway behavior, scheduler/worker execution,
provider boundaries, release evidence and approvals remain unverified.

The following candidate-to-contract boundaries remain fail-closed findings or
release caveats:

- **Multi-tenant workspace is dynamically verified locally:** the app
  authorization context enumerates role-filtered tenant options and stores only
  an opaque HttpOnly selector. The frozen
  `family_workspace_for_tenant_v1(tenant, child?)` re-derives the signed guardian,
  exact tenant, active role/link, child, school and current enrollment, chooses a
  default child only within that tenant, and verifies the returned tenant/child
  receipt. The old unscoped function is renamed to an owner-only core with no
  request-role execute. The repository repeats the tenant comparison. Exact
  001–018 same-identity/two-tenant pgTAP, HTTP, cookie-clear and no-merge checks
  passed in the frozen local harness. Hosted behavior remains unverified.

- `parent_portal_data_mode` deliberately has both `synthetic` and `production`
  values. Candidate RLS helpers and public RPCs do not uniformly assert the
  exact Phase 1 profile, `data_mode='synthetic'`, environment allowlist, or every
  transport predicate. Candidate 013 does add `tenants.family_messaging_enabled`
  as the default-off database safety mirror of the approved Messaging control
  and rechecks it in direct authenticated communication RPCs plus message-outbox
  claim/validation. The global environment switch remains the deployment-wide
  app/worker gate. Both layers must be true for messaging; neither is a separate
  invitation, relationship, projection, export or curriculum product flag.
- The candidate now revokes every public/anonymous/authenticated base-table
  privilege and grants none back to `authenticated`. This closes the prior
  full-row/column-minimization exposure at the SQL grant boundary; the row
  policies remain defense in depth. Independent tests must still prove that no
  default privilege, view, helper or executable function reintroduces provider
  issuer/subject, message redaction/retention metadata, free text
  or internal identifiers. Only exact allowlisted DTO RPCs may cross the BFF.
- `assignments.lesson_href` may remain an internal registry-constrained field for
  teacher/service workflows, but `family_workspace_for_tenant_v1` does not return it, the
  strict Family DTO/type does not admit it, and the Family UI exposes no lesson
  URL or enter/continue-learner-session control. Any reintroduction at any one of
  those three boundaries fails closed.
- `family_authorization_context_v1` can return provider issuer/subject plus
  server-only environment/data-mode/role and candidate tenant Messaging state,
  and is executable by `authenticated`; those values are forbidden in a Family
  or browser tenant-selector DTO. Its use must stay server-only and be narrowed
  to `{id, displayName}` before tenant options reach the browser.
- Invite acceptance must be reachable only through the same-origin server-only
  action that validates the exact development issuer/subject and verified
  allowlisted test email, then computes the versioned keyed HMAC using
  `FAMILY_EMAIL_DIGEST_KEY`. The latest candidate removed database HMAC-key/
  plaintext computation: SQL compares the submitted HMAC with the invitation's
  stored HMAC and derives only signed issuer/subject. Closure still requires
  proof that no browser/product DTO/base-table read discloses the HMAC and that
  a direct authenticated RPC cannot bypass the issuer/action capability. Any
  such bypass is a release blocker.
- **Invitation issuer verified locally through both database and gateway
  boundaries:** `authenticated`, `service_role`
  and `public` cannot execute create/resend. A scoped authenticated admin may
  create only a short-lived one-use attestation; the NOLOGIN/no-table
  `family_invitation_issuer` custom role alone consumes it. Candidate app code
  uses an externally provisioned short-lived ES256 bearer and no signing key or
  service-role fallback. The local PostgreSQL/pgTAP run verified role attributes,
  grants and attestation contracts. The exact current 001–018 disposable
  loopback PostgREST gateway accepted the intended create/resend calls and denied anon, ordinary
  authenticated, `service_role`, wrong-purpose, wrong-audience, table and cross-
  RPC attempts. The complete local protected product E2E also passed.
  `FP-S04`/`FP-S05`/`FP-S06` remain blocked on independent review, hosted
  asymmetric-key configuration, credential provisioning/rotation and release-
  environment evidence; local loopback proof cannot be promoted to those claims.
- Candidate v2 encryption uses a keyring/key ID, purpose-derived token/email
  subkeys, immutable purpose/tenant/record AAD and exact-field decrypt APIs.
  Static swap/key-selection tests pass; real provisioning, overlap/retirement,
  compromise, backup and deployed-flow tests remain open. RLS cannot substitute
  for those key-lifecycle controls.
- Candidate `private.assert_safe_outbox_payload_v2` recursively rejects
  forbidden names, bounds payload bytes/depth/nodes and enforces an exact top-
  level schema per notification kind. The exact local PostgreSQL/pgTAP run
  passed; the deployed worker negative trace and provider/no-egress trace remain
  open;
- Candidate lifecycle migrations add original-anchor/non-extension controls and
  bounded purge/scrub branches across identity, provider, role, relationship,
  thread/read/preference, suppression, fixture, outbox/audit and tenant-linked
  state. The exact local migration/pgTAP run and two fresh-database logical
  restores passed: restored catalogs retained 38/38 RLS, the terminal closed
  tenant, expired/revoked links, zero active roles/open threads and the absence
  of the retention-deleted governance record. `FP-S09` remains open until the
  deployed scheduler/worker-off path and complete provider/log/cache/hosted-
  backup teardown, deletion receipts and independent operations review are
  proven for the exact deployed artifact.
- `service_role` retains broad table privileges across most of `public`; the
  final candidate specifically revokes its direct outbox `UPDATE`/`DELETE` so
  lease validation, completion CAS and event RPCs fail closed. It must remain
  unavailable to browsers and ordinary requests, and all remaining worker
  purposes/tables still require exact credential/route inventory and
  least-privilege review.
- Message/invite/event/outbox/email RPCs are controlled Phase 1 integration
  scope but default off. Their SQL `EXECUTE` grants do not constitute profile
  authorization. Non-test configuration, real data, arbitrary recipients, and
  production provider/account paths must remain unreachable.

These findings must be closed in schema/policy/code or explicitly excluded from
the exact protected test surface, then independently tested. This matrix does
not waive them or claim that static SQL review is exhaustive.

## Session claims accepted by RLS

The candidate identity helpers read only the signed JWT `iss` and `sub` to map
an active `(issuer, subject)` row in `provider_identities` to `app_users.id`.
Tenant, application role, school, learner and relationship authority are then
derived from candidate database rows, not from client-supplied IDs or editable
provider role metadata. Candidate `tenant_identity_issuers` rows allow only the
exact active issuer for a tenant/environment/data-mode tuple; they are
service-managed and grant no browser authority.

Invitation acceptance has a stricter boundary. A same-origin server-only
action must validate the exact Clerk-development issuer/subject and verified
synthetic email, normalize and allowlist-check the address, and compute a
versioned keyed HMAC with the separate 32-byte base64url
`FAMILY_EMAIL_DIGEST_KEY`. It submits only the HMAC plus the opaque token digest
and idempotency key. SQL must compare the submitted HMAC with the stored invite
value while deriving tenant/actor authority from mapped issuer/subject; it must
not receive email plaintext or possess the HMAC/decryption key. The server
action—not SQL—checks the provider's verified-primary-email state; neither an
email claim nor a boolean alone is address/relationship proof. Missing or
malformed key material, wrong/unregistered issuer, ambiguous mapping,
unverified email, HMAC mismatch, and direct RPC bypass all deny. Optional
display name and locale are presentation hints only and cannot create identity
or authority.

The database RLS context does **not** by itself carry every authoritative Phase
1 service-profile switch or transport selection. The BFF must establish those
before an integration RPC is reachable, while SQL independently enforces its
tenant/data-mode/resource and dedicated-role boundaries. A client `tenantId`,
role, `dataMode`, environment, email digest, feature flag, or provider metadata
value never creates authority.

Cron/worker functions are granted only to `service_role`; that role and token
are infrastructure credentials, not application roles or client claims. The
request-scoped Supabase module contains no service-role reader or factory; the
credential is isolated in a separate notification/retention cron-only server
module, with a source contract denying that module from ordinary repositories,
actions and the public webhook. The public Resend webhook must never hold it.
The candidate instead defines a
NOLOGIN `family_webhook_writer` role with no table privileges and execution only
on `record_family_email_delivery_event_v1`; only `authenticator` may receive the
role and without admin option. The RPC statically checks the verified JWT
`role` claim again. The route uses a short-lived writer JWT plus the publishable
API key after local issuer/audience/role/expiry preflight. SQL has no separate
issuer/audience allowlist: signature, issuer/audience acceptance and role
transition remain the responsibility of the app/gateway/Supabase/PostgREST. The
exact current 001–018 disposable loopback gateway dynamically verified a strict
`204`, exactly one
delivery-event append with the matching outbox row terminally delivered, and
denial for anon, ordinary authenticated, `service_role`, wrong-audience, table
and cross-RPC attempts. Hosted asymmetric-key configuration, credential
provisioning/rotation and release-environment
behavior remain unverified.
Parsing JWT claims in app code alone is not cryptographic verification.

All policy helper functions must be stable/security-definer only when required,
have a fixed search path, return false on null/error/ambiguity, and be covered by
cross-tenant negative tests. No table may grant broad access to `public`,
`anon`, `authenticated`, or an identity-provider role without the exact
application checks below.

## Role definitions

| Role | Meaning in this matrix |
|---|---|
| `anonymous` | No valid application session. |
| `guardian` | Candidate physical enum value for a synthetic adult with an active tenant role binding plus active `guardian_links` row. Controlled synthetic writes are profile/RPC-gated. |
| `learner` | Candidate physical enum value bound to one `students` row; relevant here only to strict synthetic `ingest_learning_events_v2`, never to family relationship administration. |
| `teacher` | Candidate physical enum value scoped to an exact `schools` row; learner/class/thread access also requires an active bounded `class_staff_bindings` row. Controlled messaging/announcement writes are profile/RPC-gated. |
| `school_admin` | Candidate physical enum value scoped to one school; may manage synthetic invitations/links for that school through exact RPCs. |
| `district_admin` | Candidate physical enum value scoped to a tenant; may manage synthetic invitations/links across that synthetic tenant through exact RPCs. |
| conceptual `tenant_admin` | Product/document shorthand only. It is **not** a candidate SQL enum value; exact code must choose `school_admin` or `district_admin` and preserve scope. |
| `platform_support` | No candidate application role and no standing learner or message access. The implemented support path uses an exact-thread request by a scoped school/district admin, approval by a different district admin, a maximum 15-minute grant, and immutable audit; it does not create standing support authority. |
| `service_role` | Infrastructure role with broad candidate table grants and service-only outbox/suppression/retention RPCs. It must never reach a browser or ordinary app request. |
| `family_webhook_writer` | Candidate NOLOGIN infrastructure role with no table or sequence privileges and execute on the delivery-event RPC only. It is not an app role. Its short-lived JWT and loopback PostgREST role transition/negative matrix passed against the exact current 001–018 artifact; hosted asymmetric-key configuration, provisioning and rotation still require independent evidence. |

`service_role`, the dedicated writer JWT, database owner, migration credentials,
and infrastructure superusers must never be available to browsers or ordinary
app requests. Their existence cannot be used as the production authorization
design.

## Matrix legend

- `S`: select under the stated row predicate
- `I`: insert under exact `WITH CHECK`
- `U`: update only allowlisted columns and rows
- `D`: delete under an explicit workflow
- `—`: denied

Phase 1 user-facing APIs should normally go through server-owned views/functions
rather than direct table access. The matrix nevertheless states the underlying
maximum authority so an implementation cannot silently become broader.

## Candidate direct-table RLS/grant matrix

The observed candidate revokes every public/anonymous/authenticated table
privilege and grants no base-table privilege back to `authenticated`. Therefore
every user role below is `—` for direct table access even where an RLS policy
defines the row predicate that would apply after a future deliberate grant.
All product reads/writes must use an explicitly granted security-definer RPC and
an exact BFF DTO. `service_role` receives broad CRUD on most public tables;
later migration text revokes direct outbox `UPDATE`/`DELETE` in favor of lease/
CAS RPCs. That service-role breadth is an open least-privilege/operations gate.

| Physical table(s) | Guardian | Learner | Teacher | School / district admin | Required predicate and Phase 1 restriction |
|---|---|---|---|---|---|
| `app_users` | — | — | — | — | Server-only profile/contact state. A versioned keyed contact HMAC and separately encrypted test destination never enter a product DTO; the database holds neither email plaintext nor HMAC/decryption key. |
| `provider_identities` | — | — | — | — | Internal issuer+subject mapping only. Candidate self-row policy is defense in depth; provider identifiers are forbidden in product DTOs. |
| `tenant_identity_issuers` | — | — | — | — | Service-only exact issuer allowlist for tenant/environment/data mode. It contains no signing, HMAC or decryption key. |
| `role_bindings` | — | — | — | — | Internal role evaluation only. RPC helpers must enforce active/start/end windows and exact tenant scope; no peer-role listing. |
| `tenants` | — | — | — | — | Internal predicate requires active/enabled tenant and active role. Phase 1 additionally requires the exact synthetic environment/profile before BFF/RPC reachability. Candidate `family_messaging_enabled` defaults false and is the database mirror of the same approved global Messaging control, not a fifth product flag. |
| `schools`, `students` | — | — | — | — | Internal authorization joins only. Family DTO returns the linked learner's minimal reviewed school/child fields, never discovery or a roster. |
| `classes`, `enrollments`, `class_staff_bindings` | — | — | — | — | Internal active enrollment/class/staff lifecycle joins. Revocation/expiry must deny the next RPC; no full rows cross the DTO. |
| `assignments`, `student_assignments` | — | — | — | — | Workspace RPC may return only allowlisted assignment projection fields. `lesson_href`, teacher IDs and free text stay out; guardian has no continue-lesson action. |
| `family_content_release_memberships` | — | — | — | — | Internal active/published content-release tuple for strict event ingestion. It cannot set or infer an independent Lesson/migration gate. |
| `assignment_learning_object_bindings` | — | — | — | — | Migration 012 candidate is synthetic-only, RLS-enabled and has no base-table grant to browser or service roles. It binds one authorized assignment to the exact 39 source-ordered G4 L3 placement/release tuples; only the two strict learner RPCs may consume it. |
| `progress_projections_v1`, `skill_projections_v1` | — | — | — | — | Workspace RPC returns only coarse, non-expired allowlisted projections. No direct stale/full-row access. |
| `guardian_links` | — | — | — | — | Relationship checks are internal to exact workspace/revoke/relinquish RPCs. Guardian cannot create/revive a link; revocation must deny the next request. |
| `guardian_invitations` | — | — | — | — | Token/contact/HMAC/ciphertext/idempotency fields are server-only. Ordinary app roles have no direct create/resend authority; the dedicated custom-role RPC path is separately constrained below. Accept/revoke returns an exact receipt only. |
| `family_invitation_issuer_configs`, `family_invitation_issuance_attestations` | — | — | — | — | RLS enabled with no browser/public/authenticated/service-role/custom-issuer table grant or row policy. Scoped admins can create only one-use attestations through exact authorization RPCs; the custom issuer consumes them through create/resend RPCs, and service-only bounded cleanup removes expired/consumed rows. No table result enters a DTO. |
| `family_abuse_budget_windows` | — | — | — | — | RLS enabled with no base-table grant or row policy. Internal wrappers atomically count only actor+tenant+student/invitation/thread buckets, never token/email/message body. Window rows expire within two days and are removed by service-only retention. |
| `family_invitation_probe_windows` | — | — | — | — | RLS enabled with zero policies or direct grants. This deliberately pre-resource security counter has no tenant/resource locator: it stores only a SHA-256 digest of signed JWT issuer+subject, fixed operation/window/count and ≤2-day retention metadata. Migration 018 charges malformed, unknown, known-failed and first-success acceptance attempts at 20/fixed 10 minutes and 100/UTC day; exact committed immutable replay is free. It is not IP/device/WAF or multi-account protection. |
| `family_rights_requests`, `family_invitation_suggestions`, `family_support_access_requests` | — | — | — | — | RLS enabled with zero direct policies/grants. Browser access is only through strict resource-scoped governance RPCs. Rights/suggestion/support free text is excluded from audit context; support approval requires a different district admin and expires within 15 minutes. |
| `family_threads`, `family_messages` | — | — | — | — | Workspace/message RPCs apply active guardian/teacher participation. Administrative read/redaction requires one approved, unexpired, exact-thread support request; there is no directory or standing message access. Closed is terminal; body is plain text 1–2,000 and immutable except an audited tombstone. Candidate send/read-state/close mutations require the exact tenant Messaging mirror; existing guardian history remains read-only when it is off. |
| `family_thread_reads`, `family_notification_preferences` | — | — | — | — | Exact participant/self RPC only. Read state is not a delivery receipt; preferences contain no destination and cannot expand recipient scope. Candidate preference opt-in requires the exact tenant Messaging mirror, while opt-out remains available. |
| `school_announcements` | — | — | — | — | Workspace RPC may return only authorized, non-expired synthetic copy. Publishing is a separate scoped RPC behind the exact tenant Messaging mirror; existing announcement reads remain available when it is off. |
| `learning_events_v2` | — | — | — | — | Learner may write only through strict ingest RPC; workspace may return bounded aggregates, never raw rows/payloads. Existing anonymous/LRS history is not an input. |
| `notification_outbox`, `email_delivery_events`, `email_suppressions` | — | — | — | — | Service-only maintenance/delivery state. Candidate tenant Messaging disable cancels pending `family_message` rows and claim/pre-send validation recheck the tenant mirror; invitation, account-security and digest kinds retain their separately defined controls. The current controlled destination is exact `@helpmath.invalid` through non-production fixed-loopback Mailpit only; every Internet/real destination remains denied. |
| `audit_events`, `retention_policies`, `retention_runs` | — | — | — | — | Service-only. No audit body/token/message content; status/count receipts only. |

The UI-demo reply and Message/Settings state stay in component memory. The
controlled profile uses separate transactional RPCs and never reuses the local-
preview control. `localStorage` and `sessionStorage` remain forbidden for
Message/Settings state; only the non-personal theme enum may persist locally.
The invitation token's fixed, short-lived session key is the separately modeled
exception.

## Candidate RPC execute matrix

SQL `EXECUTE` privilege is only a necessary database permission. Every
integration RPC below also requires the BFF's exact
`synthetic_integration_test` profile, approved global/tenant controls, and
operation-specific safety predicates; the current SQL grant alone does not
enforce that profile. No extra invitation/relationship/projection product flag
is implied.

| RPC | Candidate SQL grantee / resource rule | Phase 1 additional restriction |
|---|---|---|
| `family_workspace_for_tenant_v1` | `authenticated`; explicit tenant plus optional child are locators; signed guardian, exact tenant, active role/link, child, school and enrollment are rechecked | Return only one reviewed Family DTO: complete admitted history of at most 200 messages per thread, safe redacted tombstones, at most 500 authorized announcements, and privacy-safe `messageContacts`. Internal event aggregation is count/time only; no raw event, redaction actor/reason, or `lesson_href` reaches the UI. The predecessor unscoped core has no request-role execute. Read-only history remains available when Messaging is off. |
| `teacher_family_inbox_v1` | `authenticated`; current active teacher, tenant, school/class assignment, enrollment and exact thread participation are rechecked inside the security-definer RPC | Strict response only: tenant plus at most 500 participating threads, each with `topic`, bounded unread count and the newest at most 200 messages returned in chronological order. Candidate 013 also requires the tenant Messaging mirror, so direct Teacher inbox reads deny while it is off. No foreign thread, guardian email/digest, provider subject, retention/redaction metadata or roster discovery. RPC absence/shape mismatch fails closed; the exact local product path passed, while hosted behavior and independent acceptance remain required. |
| `admin_family_access_workspace_v1` | `authenticated`; exact active school/district admin scope, tenant and student/school authorization rechecked inside the security-definer RPC | Strict response only: authorized child labels plus invitation status. Destination is masked/verified-adult copy only, never plaintext email/digest/ciphertext/token. Accepted invitation without an active link is projected as effectively revoked with null link ID. RPC absence/shape mismatch fails closed; no roster/foreign-invite discovery. |
| `family_governance_workspace_v1` | `authenticated`; current guardian and explicit selected tenant with active/current links | Returns only the guardian's bounded rights-request history and a 50-entry privacy-safe account-activity projection. Provider subject, raw audit context, peer guardian identity and message body are absent. |
| `teacher_invitation_suggestion_workspace_v1`, `create_family_invitation_suggestion_v1` | `authenticated`; current teacher plus active class/staff/enrollment scope | Returns eligible current children and the teacher's own bounded suggestion history; create accepts no adult email and never creates an invitation or guardian link. |
| `admin_family_operations_workspace_v1` | `authenticated`; current school/district admin scope | Returns bounded rights requests, teacher suggestions and support-request metadata for the authorized school/tenant. It contains no message body, recipient destination, provider identifier or unrestricted thread directory. |
| `create_family_rights_request_v1`, `review_family_rights_request_v1` | `authenticated`; linked guardian creates; scoped school/district admin reviews | Human-review workflow only. Create does not directly alter a student record, relationship or retention state; exact immutable idempotency and tenant/resource lifecycle checks apply. |
| `review_family_invitation_suggestion_v1` | `authenticated`; scoped school/district admin | Review/dismiss only. It cannot issue an invitation or grant Family access. |
| `create_family_support_access_request_v1`, `decide_family_support_access_request_v1`, `family_support_case_v1` | `authenticated`; scoped admin requests one known thread; a different district admin decides; only the requestor reads the approved case | Exact-thread only, maximum 15 minutes, current lifecycle rechecked on every access, no self-approval, no standing directory, and immutable audit. |
| `authorize_guardian_invitation_creation_v1`, `authorize_guardian_invitation_resend_v1` | `authenticated`; exact active scoped admin, signed identity/tenant/student and idempotency checks create a 90-second one-use attestation | Synthetic requires the non-production `synthetic-invalid-only` policy and exact `@helpmath.invalid`. Production additionally requires exact Supabase Auth/Resend selection, `school-verified-production`, the explicit production-invitation opt-in, complete approved retention, an exact production tenant/issuer and a live `auth.sessions` row. No ciphertext/token enters preflight; direct calls do not grant issuer capability. Migration 011 charges only a new issue: create 5/hour+20/UTC-day per actor+tenant+student; resend 3/hour+10/UTC-day per actor+tenant+invitation. |
| `create_guardian_invitation_v1`, `resend_guardian_invitation_v1` | Only dedicated `family_invitation_issuer`; no `authenticated`, `service_role`, `anon` or `public`; one-use attestation and exact role/purpose/issuer/audience/JTI/time/config checks | App holds an externally provisioned short-lived ES256 bearer, no signing private key/service-role fallback. The database derives either `synthetic-invalid-only` or `school-verified-production` from the attested tenant mode; callers cannot choose it. Production attestation consumption rechecks the bound administrator session. The exact current 001–018 disposable loopback gateway verified fictional production-shaped and synthetic create/resend plus the recorded caller/claim/table/cross-RPC denial matrix. Hosted asymmetric-key configuration, real Resend/domain and credential rotation remain unverified. |
| `revoke_guardian_invitation_v1` | `authenticated`; scoped school/district admin manages the target student | Invite switch on; exact synthetic tenant; terminal revoke and pending lease/outbox cancellation; no token/digest/ciphertext in response/log. |
| `accept_guardian_invitation_v1` | `authenticated`; SQL locks the invite when found, derives signed issuer+subject, checks the tenant issuer allowlist, and compares the submitted server-derived HMAC | Fragment→fixed session key→same-origin bounded POST. Only the server action can derive the HMAC after validating the exact provider session and verified email with `FAMILY_EMAIL_DIGEST_KEY`. Production `pending→accepted` additionally requires the exact live `auth.sessions` row at the terminal transaction boundary. No email plaintext/key in DB and no bare hash. Known expected failures lock at 10 for the invitation lifetime and are not reset by resend. Migration 018 also charges every non-replay authenticated acceptance probe—including malformed/unknown tokens—to the current signed-provider-identity aggregate at 20/fixed 10 minutes and 100/UTC day; denial retains the same empty result. Anonymous IP/device/network edge-WAF and distributed multi-account protection remain external. |
| `decline_guardian_invitation_v1` | `authenticated`; verified provider email HMAC plus one-use token digest | Non-enumerating terminal decline; unknown/mismatched probes reveal no invitation detail. Production requires the exact tenant issuer and live provider session but does not force a new adult to accept merely to create an app-user mapping; the optional actor remains null until an approved identity bootstrap exists. A successful decline cancels pending invitation outbox work and writes only privacy-safe metadata. |
| `revoke_guardian_link_v1` | `authenticated`; scoped school/district admin | Immediate deny and pending-outbox cancellation; exact synthetic reason only. |
| `relinquish_guardian_link_v1` | `authenticated`; the linked guardian only | Controlled synthetic relationship-write switch; no self-revival. |
| `send_family_message_v1` | `authenticated`; exact linked guardian or assigned teacher | Approved global Messaging switch **AND** exact-tenant mirror; distinct compose; plain text 1–2,000; closed thread denies; recipient server-derived. Migration 011 binds full new/existing-thread idempotency meaning and charges a new message at 20/10 minutes+100/UTC-day per actor+tenant+thread. Revoke/relinquish/redaction are never budget-gated. The wrapper locks/rechecks the tenant mirror in the same transaction, so denial rolls all writes back. Exact 001–018 direct-RPC, two-connection toggle and protected product-flow checks passed locally. |
| `mark_family_thread_read_v1`, `close_family_thread_v1` | `authenticated`; candidate thread-access helper authorizes participant and scoped admins; candidate 013 rechecks the exact tenant Messaging mirror | Own synthetic read state; terminal close/no reopen. Existing Family thread history remains read-only while disabled. Narrow admin behavior if product requirements do not need it. |
| `update_family_notification_preferences_for_tenant_v1` | `authenticated`; explicit selected tenant is independently reauthorized through active guardian role/link | Controlled profile/fixed local-Mailpit sink only; booleans cannot add/change a destination. Either opt-in requires the tenant Messaging mirror; opt-out remains available. The old unscoped preference function has no request-role execute. |
| `learning_assignment_launch_v1` | `authenticated`; exact signed active learner context derived from the opaque assignment UUID | Synthetic/non-production G4 L3 only; global+tenant Portal and internal event interlocks; exactly one learner/student/enrollment/assignment/class/school mapping; strict 39-placement server envelope. BFF compares/strips `tenantId` and cross-binds the existing course descriptor before browser use. No guardian access or generic lesson launch. |
| `record_assignment_learning_events_v2` | `authenticated`; repeats the exact current learner/assignment/placement authorization and lifecycle locks | Strict schema-v2, one-assignment batch ≤50, current-session/no >24-hour backfill, no `practice_evaluated`, exact published G4 L3 bindings and tenant-envelope receipt. It is the only authenticated product write path for candidate events. |
| `ingest_learning_events_v2` | Owner-internal core; migration 012 revokes `authenticated`, `anon`, and `service_role` execute | Preserves the read-committed, exact-one student/enrollment mapping, student-row lock, idempotency and projection transaction behind the assignment-scoped wrapper. It is not directly callable by a Family or learner browser and cannot accept a generic client-selected assignment. |
| `teacher_announcement_schools_v1` | `authenticated`; current active Teacher tenant plus active school/class/staff assignment | Returns only the matching tenant ID/label and 1–100 unique eligible school ID/label entries through a strict DTO. No roster, learner, family, destination, provider or retention field. Missing/multiple tenant context, inactive role/class/staff, tenant mismatch or shape failure disables composition. |
| `authorize_school_announcement_publish_v1` | `authenticated`; resource-derived current teacher, school admin or district admin scope for the selected school | Preflight returns only matching opaque `tenantId` and `schoolId`; the action compares both with its signed context/input. It is not a bearer/capability and cannot replace mutation-side authorization. |
| `publish_school_announcement_v1` | `authenticated`; mutation itself repeats active tenant/school plus current teacher role/class/staff or scoped school/district-admin lifecycle authorization; candidate 013 also rechecks the exact tenant Messaging mirror | Synthetic plain text, idempotency, bounded expiry and applicable retention gate; no real school notice or monitored-support claim. Teacher publishing is implemented and its named 010 database/contract/browser checks passed locally; direct RPC cannot rely on the preflight and repeats authorization. Existing announcement reads remain available while publishing is disabled. It remains default off and is not a hosted or real-school result. |
| `redact_family_message_v1` | `authenticated`; exact requestor of a currently approved, unexpired support request for the message's thread | Controlled reason/idempotency; replaces the immutable body with `[redacted]` and records a privacy-safe audit event without original content. It is not a general edit/delete permission. The protected local product E2E proved two-person approval, exact-case read, redaction and guardian-visible tombstone. |
| `claim_family_notification_outbox_v1`, `validate_family_notification_claim_v1`, `complete_family_notification_outbox_v1`, `suppress_family_email_recipient_v1` | `service_role` only | Bearer-authenticated cron/worker only; exact purpose, test provider/account, allowlist, lease/CAS, retry/deletion and no-browser proof. Candidate claim and immediate validation cancel/reject disabled-tenant `family_message` work; invitation, account-security and digest kinds keep their separately defined controls. The public webhook never holds `service_role`. |
| `cleanup_family_invitation_issuance_attestations_v1` | `service_role` only | Bounded cleanup of expired/consumed one-use issuer attestations. Candidate worker calls it as lifecycle maintenance; exact cadence, failure/retry, residual-count and no-resurrection evidence remain required. |
| `record_family_email_delivery_event_v1` | Candidate `family_webhook_writer` NOLOGIN/NOINHERIT role only; no table/sequence/other-function privileges; only non-admin `authenticator` membership; RPC checks JWT `role` claim exactly | Route first requires exact Svix signature over a ≤256-KiB body and strict event DTO/type, then a short-lived `FAMILY_WEBHOOK_WRITER_JWT` with locally preflighted issuer/audience/role/expiry plus publishable key. The exact current 001–018 disposable loopback gateway verified strict `204`, one authoritative delivery event/outbox transition, and denial for anon/authenticated/`service_role`/wrong-audience/table/cross-RPC attempts. RPC never directly updates outbox. Hosted asymmetric-key configuration, credential rotation and release deployment remain unverified. |
| `enqueue_weekly_family_digests_v1` | `service_role` only | Default off; counts-only synthetic digest to the exact reserved-domain local-Mailpit sink. Requires independent schedule/manual-trigger inventory, preference/relationship/revoke checks, HMAC/ciphertext boundary and sink deletion evidence. |
| `rebuild_family_projections_v1` | `service_role` only | Replay only from strict non-expired synthetic `learning_events_v2` and exact active content-release memberships. It preserves original retention anchors, shares the uniquely resolved student-row transaction lock with real-time ingest, and cannot change any Lesson/migration gate. Against the exact current 001–018 artifact, one loopback HTTP ingest plus one HTTP rebuild passed concurrently on two distinct active PostgreSQL backends with a consistent final watermark; a separate two-ingest race also passed. Hosted/production behavior remains unverified. |
| `run_family_retention_v1` | `service_role` only | Candidate bearer-protected cron calls a bounded batch before product-flag branching and remains reachable when portal/email are off. SQL terminalizes expired pending rows, max-attempt/no-valid-lease rows and expired orphan leases, deletes expired tenant/resource abuse windows and the global signed-identity probe windows, and cleans expired governance workflow rows with per-tenant counts; tenant failure is re-raised. Worker requires every tenant run status to be `succeeded` or returns a retryable failure. The exact local runner now proves one expired governance deletion, terminal tenant teardown and two logical restores without resurrection. No deployed schedule/worker run, legal-hold exercise, worker-off cleanup, monitoring or external-copy/hosted-backup reconciliation is recorded. |

Real-time learning-event ownership and qualifying-count concurrency is
**`CLOSED_DYNAMIC_LOCAL`** for this candidate. The RPC permits
only `read committed`; another isolation level fails with SQLSTATE `25000`.
The qualifying `practice_evaluated` path admits only a single-assignment batch,
and its authorization join must resolve to exactly one eligible
student/enrollment mapping. Zero or multiple rows fail closed with the same
public denial; the candidate then holds `FOR NO KEY UPDATE` on that uniquely
resolved student row for the transaction before counting qualifying attempts.
This provides one stable ownership and lock target for the real-time batch
without arbitrary `LIMIT 1` selection or a multi-skill lock-order dependency.
The final local pgTAP run includes the isolation check, student-row lock and
ambiguous-binding rejection. The exact current loopback harness raced two
concurrent HTTP ingest calls on two active PostgreSQL backends and verified the
deterministic final projection. Hosted/production behavior remains unverified.

This status does **not** close all projection concurrency. The service-role
`rebuild_family_projections_v1` path now takes the same uniquely resolved
student-row lock as real-time ingest. The exact current 001–018 disposable
loopback harness sent exactly one HTTP ingest and one HTTP rebuild concurrently,
observed two distinct
active PostgreSQL backends, received HTTP 200 from both after lock coordination,
and found a consistent final event/projection watermark. This closes only that
exact local pairing; the separate two-ingest pairing also passed locally.
Hosted/production concurrency and independent `FP-S05`/`FP-S07` approval remain
open.

Authenticated helper functions (`family_current_*`, `family_has_role_v1`,
`family_can_access_*`, and `family_authorization_context_v1`) are implementation
building blocks, not product DTOs or feature authorization. Their direct
reachability and returned fields are part of `FP-S04`/`FP-S05` review.

## Core Phase 1 predicate

The following is the normative synthetic overlay expressed with candidate
physical names. It is explanatory, not executable SQL, and is intentionally
stricter than the currently observed helper functions:

```sql
mapped_user_id = family_current_app_user_id_v1()
AND exact_phase1_profile IN ('synthetic_ui_demo', 'synthetic_integration_test')
AND tenant.family_portal_enabled
AND tenant.status = 'active'
AND tenant.data_mode = 'synthetic'
AND tenant.environment_id = approved_test_environment
AND row.tenant_id = tenant.id
AND row.environment_id = tenant.environment_id
AND row.data_mode = tenant.data_mode
AND (row.expires_at IS NULL OR row.expires_at > statement_timestamp())
AND relevant_server_kill_switch = 'on'
```

Guardian learner read additionally requires:

```sql
EXISTS (
  SELECT 1
  FROM role_bindings rb
  WHERE rb.tenant_id = row.tenant_id
    AND rb.app_user_id = mapped_user_id
    AND rb.role = 'guardian'
    AND rb.active
    AND rb.starts_at <= statement_timestamp()
    AND (rb.ends_at IS NULL OR rb.ends_at > statement_timestamp())
)
AND EXISTS (
  SELECT 1
  FROM guardian_links gl
  WHERE gl.tenant_id = row.tenant_id
    AND gl.guardian_user_id = mapped_user_id
    AND gl.student_id = row.student_id
    AND gl.status = 'active'
    AND (gl.expires_at IS NULL OR gl.expires_at > statement_timestamp())
)
```

The nullable candidate link expiry is not permission to retain an instantiated
Phase 1 relationship indefinitely; the 30-day environment/record teardown still
applies. Teacher learner/class/thread reads require both an active school-scoped
`role_bindings` row and active time-bounded `class_staff_bindings` row for the
exact class. School- and district-admin access remains resource-scoped and
purpose-specific; it is not a universal database bypass.

## Revocation and race invariants

- Relationship activation/redemption is atomic and idempotent.
- A revoked/expired membership, teacher assignment, or guardian link denies the
  very next statement; caches must not extend access.
- Concurrent redemption yields at most one active result.
- Changing active tenant invalidates prior tenant-scoped authorization context.
- Projection rows cannot be moved between tenants or learners by update; key
  changes require controlled rebuild.
- Soft deletion is not authorization. Revoked rows are immediately unreadable,
  then physically deleted by the retention workflow.
- Backup restoration honors deletion tombstones/suppression and does not revive
  expired links or invitations.

## Required negative tests

For every selectable/mutable object, test all of the following through both API
and direct policy harness:

1. anonymous and signed-out denial;
2. valid user with no membership;
3. wrong role;
4. same signed guardian in two tenants: each explicit tenant selects only a
   child inside that tenant, changing the HttpOnly tenant selector clears the
   child selector, the old unscoped core is not executable by request roles, and
   no response merges or falls back across tenants;
5. same tenant, unlinked learner;
6. linked learner after relationship revoke/expiry;
7. linked learner with wrong environment/data mode;
8. foreign school and foreign teacher assignment;
9. guessed/sequential/nonexistent IDs with indistinguishable denial;
10. client-supplied tenant/role/guardian/link status ignored or rejected;
11. stale cache/session after revoke;
12. projection/message access through a foreign thread or learner;
13. attempted direct message/outbox insert, wrong-profile RPC, arbitrary test
    destination, unauthorized notification-preference mutation, raw
    `learning_events_v2` read, role self-promotion, guardian full-row invite
    read, and browser/helper retrieval of provider identity fields;
14. service credential absent/wrong purpose;
15. 2,001-character message rejected at UI/schema/service/database boundaries and
    `retention_policies.retention_days` cannot exceed the Phase 1 30-day ceiling;
16. direct authenticated calls cannot bypass the database-enforced resource,
    profile or destination predicates required for invite/message/preference/
    event/outbox/email paths. For messaging, test global-off denial through the
    app/worker and tenant-mirror-off denial through direct RPC; SQL cannot read
    the environment variable, so operations must set and verify both layers.
    With the tenant mirror off, send/read-state/close/Teacher publish/inbox/
    preference opt-in deny, pending `family_message` work is cancelled, and
    claim/pre-send validation does not return it. Invite
    acceptance also denies wrong/unregistered issuer, unverified address,
    missing/malformed HMAC key, bare digest, HMAC mismatch and direct-RPC
    bypass while proving the database has no email plaintext or key;
17. `family_workspace_for_tenant_v1` returns no raw event, provider identity, invite secret,
    `lesson_href`, arbitrary free text, or field outside the exact DTO; and
18. backup/restore cannot revive an expired or deleted record.

No RLS gate is complete until the exact migration/policy text, database version,
test artifact, reviewer, date, and digest are recorded. Local unit tests or this
matrix alone do not prove deployed RLS.
