# Family portal data fields and DTO allowlist

Status: **Phase 1 contract with candidate-code crosswalk; exact local synthetic product flow verified, hosted/release behavior unverified and not production-approved**

Schema namespace: `family.synthetic.v1`

This document is a positive allowlist. Fields not listed for an exact DTO are
forbidden, even if another HELP Math API, provider object, database row, or
client component contains them. Removing a field is backward-compatible;
adding one requires a schema version, privacy classification, threat review,
tests, and release-gate update.

## Global rules

1. Phase 1 values are synthetic and must carry `dataMode: "synthetic"`.
2. IDs are opaque, non-sequential, environment-scoped identifiers. They must not
   embed a name, email, district student ID, provider subject, or legacy key.
3. The server derives the authenticated actor, authoritative tenant, role, and
   allowed learners. Request DTOs cannot assert them.
4. Responses use no provider user object, raw database row, raw xAPI statement,
   cookie seed, HMAC actor, auth token, or environment configuration.
5. Dates use UTC RFC 3339 timestamps. Calendar dates that could reveal a real
   birthday are not part of Phase 1.
6. Counts and percentages bind to an explicit source watermark and content
   release. They are product projections, not grades or migration acceptance.
7. Localized display text uses an allowlisted message or content key when
   possible. Default UI-demo note bodies are fixed synthetic fixtures. The
   controlled integration profile may accept tester-authored synthetic message
   bodies only through the exact plain-text request DTO below.
8. API errors are non-disclosing and never confirm whether a foreign tenant,
   learner, relationship, thread, or invite exists.

## Candidate-code crosswalk and fail-closed gaps

Several candidate shapes currently coexist in the worktree. Their existence is
not approval, and none may silently widen this positive allowlist:

1. `FamilyPortalUiDto` is the synthetic, presentation-oriented object used by
   the candidate family UI. Its top-level fields are `schemaVersion`, `locale`,
   `demoKind`, `snapshotLabel`, `tenant`, `children`, `selectedChild`,
   `navigation`, and fixed localized `copy`. Under `children`/`selectedChild`,
   the candidate uses only synthetic IDs/labels, initials, grade/program labels,
   greeting/intro copy, display stats, course progress, skill signals, recent
   activity, assignments, and synthetic notes. These are allowed only when
   generated from reviewed fictitious fixtures. The fixed
   `demoKind='synthetic-family-portal'` is the candidate's visible data-mode
   marker; it is not a substitute for a server-enforced synthetic environment.
2. `familyWorkspaceDtoSchema` is a separate candidate server DTO. It contains
   `tenant`, `children`, `selectedChildId`, `assignments`, `lessons`, `skills`,
   `overview`, `threads`, `messageContacts`, and `notificationPreference`. Its nested candidate
   fields include synthetic display labels, release/title/page-count projection
   fields, skill bands/explanations, fixed message bodies, thread metadata,
   announcements, support copy, and two notification-preference booleans.
   Phase 1 permits those values only as synthetic display fixtures. The
   notification booleans are false/non-operational in the default UI demo; the
   controlled integration profile may alter them only for the exact reserved-
   domain local-Mailpit sink/outbox. `messageContacts` contains only the selected
   child's opaque `childId`, `enrollmentId`, `staffUserId`, and a privacy-safe
   `staffDisplayName`; the server re-authorizes every send, and the list contains
   no email, provider subject or destination. No field by itself creates a
   delivery entitlement. Each Family thread admits at most the newest 200
   messages in chronological order; the UI maps the complete admitted history,
   not only the latest row. Each message includes a strict `redacted` boolean so
   the UI can show a tombstone label while the original body and redaction actor/
   reason/idempotency/retention metadata remain unavailable.
3. `TeacherMessagesDemoDto` contains fixed locale/tenant/workspace/disclosure/
   interaction copy plus synthetic `threads`. Each thread is limited to opaque
   thread/child IDs, fictitious guardian/child/grade/subject labels, unread count,
   open/closed state, and synthetic messages with opaque ID, fictitious sender
   label, time label, plain-text body and `mine` boolean. Local replies/read/close
   overlays are component memory and are not DTO additions.
4. `AdminFamilyAccessDemoDto` contains fixed locale/tenant/disclosure/form copy,
   synthetic child options, and local invitations limited to opaque invitation/
   child IDs, fictitious child/grade/guardian labels, a `.invalid` destination
   label, pending/accepted/revoked status, status label and expiry label.
   `FamilyInvitationAcceptDemoDto` contains copy/state labels only; token
   plaintext never enters that DTO or server-rendered HTML.
5. `teacherFamilyInboxDtoSchema` is the production-shaped teacher read DTO. It
   contains one tenant label and at most 500 threads in which the current teacher
   participates. Each thread contains only opaque thread/child IDs, privacy-safe
   guardian/child/grade labels, `topic`, terminal status, bounded unread count,
   and at most the newest 200 plain-text messages in chronological order with
   opaque ID, safe sender label, timestamp and `mine`. It rejects unknown fields,
   email/digest-shaped adult labels, control characters and oversized content.
6. `adminFamilyAccessWorkspaceDtoSchema` is the production-shaped school/
   district administrator read DTO. It contains one tenant label, authorized
   child labels, and invitation rows limited to opaque invitation/child/link IDs,
   child/grade/guardian labels, a masked or generic verified-adult destination
   label, status and expiry. It never admits email plaintext, email/token digest,
   ciphertext, token, provider identity, idempotency material or audit/retention
   metadata. An accepted row requires an opaque active link ID; a lost/revoked
   link is projected by SQL as `revoked` with a null link ID.
7. `teacherAnnouncementSchoolsDtoSchema` is a separate production-shaped
   resource allowlist for the announcement composer. It contains the same one
   tenant ID/label shape and 1–100 unique school entries, each limited to an
   opaque school ID plus safe display label. It rejects duplicates and unknown
   fields, exposes no roster, class, learner, family, destination, provider, or
   retention data, and must match the already authorized Teacher inbox tenant.
8. `familyGovernanceWorkspaceDtoSchema` contains one tenant label, the current
   guardian's bounded rights-request history and at most 50 privacy-safe account
   activity summaries. Activity is limited to opaque audit ID, reviewed entity/
   action labels and timestamp; provider subject, raw audit context, IP and
   message body are forbidden.
9. `teacherInvitationSuggestionWorkspaceDtoSchema` and
   `adminFamilyOperationsWorkspaceDtoSchema` expose only bounded eligible-child,
   suggestion, rights-request and support-request metadata within current role
   scope. No teacher suggestion contains an adult email or grants access; the
   admin workspace contains no message body or unrestricted thread directory.
10. `familySupportCaseDtoSchema` is an exact approved-request projection for one
   thread. It contains the request reason/expiry, safe participant labels and at
   most 200 bounded messages. It never includes recipient destinations, provider
   identity, redaction reason/actor, peer threads or roster data.

For all production-shaped repositories, the request-token client calls only the
exact `family_workspace_for_tenant_v1`, `teacher_family_inbox_v1`,
`teacher_announcement_schools_v1`, `admin_family_access_workspace_v1`,
`family_governance_workspace_v1`, `teacher_invitation_suggestion_workspace_v1`,
`admin_family_operations_workspace_v1`, or `family_support_case_v1` read
RPC. Wrong role maps to `403`, absent or out-of-scope resources to `404`, and an
unavailable RPC, unknown field, invalid bound, tenant-ID mismatch or parse
failure fails closed. Responses are private/no-store. This code path is not
evidence of real identity, real data, hosted PostgREST, RLS verification,
deployment or release approval.

Before `FP-S03` can pass, the exact released response must choose and version a
single schema, or publish an explicit tested mapping between these shapes and
`family.synthetic.v1`. Known fail-closed differences include:

- the candidate shapes do not currently demonstrate the full common envelope
  (`dataMode`, `phase1Profile`, `requestId`, `generatedAt`, `sourceWatermark`);
- candidate fields named `displayName`, `schoolName`, `teacherDisplayName`,
  `senderLabel`, `publisherLabel`, `familyNote`, `description`, `body`, and
  `explanation` are acceptable only as reviewed synthetic fixture copy and
  become prohibited as soon as they contain real or user-authored content;
- `lessonHref` is absent from `family_workspace_for_tenant_v1`, the strict
  Family response DTO/type, and the UI DTO. The internal assignment table may retain its
  release-registry-constrained field for teacher/service workflows, but no
  guardian response or control exposes it; a guardian has no enter/continue-
  My-Lesson action;
- candidate message/invite actions, receipts and notification preferences are
  Phase 1 request contracts only in `synthetic_integration_test`; they remain
  disabled and forbidden in `synthetic_ui_demo` and every non-test/real-data
  configuration; provider-native objects never become product DTOs;
- `authenticated`, `service_role` and `public` still cannot execute the final
  create/resend RPCs. The candidate instead uses a short-lived ES256 custom-
  role bearer plus a one-use, actor/student/email/idempotency-bound database
  attestation. The app performs local preflight, and the exact current 001–018
  disposable loopback PostgREST harness verified HTTP create/resend plus the
  caller/claim/table/cross-RPC denial matrix. Hosted asymmetric-key behavior,
  one-use race and production credential
  rotation remain unverified;
- the candidate v2 encryption envelope uses a versioned keyring, purpose-
  derived token/email subkeys, and immutable purpose/tenant/record AAD. Static
  swap-denial/keyring tests pass, but real key provision, overlap/retirement,
  compromise, backup and deployed worker/invite flows remain unverified. The
  optional legacy-v1 path is read-only, explicitly gated and default off;
- the candidate database outbox validator now recursively rejects forbidden
  keys, bounds depth/node/byte complexity and enforces an exact top-level shape
  per kind. The exact local PostgreSQL/pgTAP run passed; the loopback writer
  path also verified strict 204 and least-authority denials. Deployed scheduler/
  worker negative behavior, hosted gateway and provider/no-egress traces remain
  open;
- every schema must reject unknown keys, enforce the field-specific limits
  below, and remain behind server-enforced synthetic mode.

These differences are release blockers to reconcile, not evidence that the
broader candidate server shape is approved.

## Data classifications

| Code | Class | Phase 1 disposition |
|---|---|---|
| `PUB` | Public product/content metadata | Allowed when already release-authorized for the requesting surface. |
| `SYN` | Clearly fictitious synthetic persona or learning data | Allowed with 30-day maximum retention. |
| `OPS` | Minimal synthetic environment/security metadata | Allowed only when necessary; never returned unless listed. |
| `SYN_LOCAL_INPUT` | Tester's synthetic plain-text reply preview held in browser memory | Allowed only for the unsent local preview; never sent, logged, analyzed or persisted. |
| `SYN_TEST_MESSAGE` | Tester-authored plain text stored/sent inside the controlled synthetic integration profile | Allowed only through exact ≤2,000-character DTO/service/database validation and 30-day deletion; no real content. |
| `SYN_TEST_DESTINATION` | Exact reserved-domain recipient/from identity for the local Mailpit sink | Allowed only as normalized `local-part@helpmath.invalid` through the non-production `mailpit-local` transport fixed to `127.0.0.1:1025`; normalized address becomes a versioned keyed HMAC plus separately application-encrypted delivery value. Never selectable as an arbitrary/real/Internet address or exposed in family response DTOs. Database has neither plaintext nor HMAC/decryption key. |
| `EDU` | Real education record or learner-linked activity | Prohibited in Phase 1. |
| `PII` | Real adult/child direct or linkable identifier | Prohibited in Phase 1. |
| `SEC` | Credential, token, provider subject, secret, internal security detail | Never returned to product UI. |
| `LEGACY` | Historical HELP Math identity/activity/credential material | Prohibited input in every phase unless a separate privacy-safe aggregate use is approved; never identity migration input. |

## Common response envelope

Every successful family DTO response may contain only:

| Field | Type | Class | Rule |
|---|---|---|---|
| `schemaVersion` | literal `1` | `OPS` | Exact contract version. |
| `dataMode` | literal `synthetic` | `SYN` | Required in Phase 1. |
| `phase1Profile` | `synthetic_ui_demo` or `synthetic_integration_test` | `OPS` | Server-derived; determines which request DTOs/egress are permitted. Missing/unknown fails closed. |
| `requestId` | opaque UUID | `OPS` | Server-created trace ID; not a provider/session ID. |
| `generatedAt` | timestamp | `OPS` | Projection/response time. |
| `sourceWatermark` | opaque string | `OPS` | Synthetic fixture/projection version, not an event payload or database cursor. |
| `data` | exact DTO | mixed | Must validate against one of the allowlists below. |

The response must set private/no-store caching unless an exact reviewed server
cache design proves user and tenant isolation. Shared/public caching is denied.

## `FamilySessionDTO`

Purpose: render the synthetic portal frame without exposing provider identity.

| Field | Type | Class | Rule |
|---|---|---|---|
| `role` | literal `guardian` | `SYN` | Application role, server-derived. |
| `guardianAlias` | string, 1–40 | `SYN` | Fictitious display alias; no email or legal name. |
| `tenantLabel` | string, 1–60 | `SYN` | Obvious fictitious school/district label. |
| `locale` | `en` or `es` | `OPS` | Current interface locale. |
| `availableLearnerIds` | array of opaque IDs, max 8 | `SYN` | Server-authorized synthetic learner set. |
| `capabilities` | exact capability object | `OPS` | Default booleans: `viewOverview`, `viewProgress`, `viewSyntheticNotes`, `markSyntheticNoteRead`, `closeSyntheticThreadLocally`. The controlled profile may additionally advertise separately named synthetic invite/message/revoke/test-email capabilities only after server authorization and flags. |
| `disclosureKey` | literal `family.synthetic.disclosure.v1` | `PUB` | Forces visible synthetic notice. |

Unqualified `sendMessage`/`inviteGuardian`, `continueAsLearner`,
`editAssignment`, `exportRecord`, and `purchase` are forbidden. Integration
capabilities must include `Synthetic`/`Test` in their names and never imply real
delivery or family authority.

### Guardian tenant selector DTO

The server-only authorization context may contain up to 100 tenant entries with
`id`, `displayName`, `environmentId`, `dataMode`, `messagingEnabled`, and `roles`
so the BFF can make an exact authorization decision. `messagingEnabled` is the
exact tenant's default-off database safety mirror for the approved global
Messaging control; it is never browser-set authority or a separate product flag.
The browser selector is a deliberate narrower projection: an array of only
`{id, displayName}` for tenants where the current signed identity has the active
`guardian` role. It exposes no role array, messaging state,
environment/data-mode value, provider issuer/subject, membership IDs, school/
student roster, or cross-tenant counts.

`SelectGuardianTenantRequest` contains only a UUID `tenantId` and bounded
`clientMutationId`. The server re-reads its signed role-filtered options; a
foreign/stale tenant returns a generic denial. On success it writes only the
opaque tenant selector to an eight-hour HttpOnly, `SameSite=Lax`, root-path
cookie and clears the selected-child cookie. The cookie never grants authority.
Each workspace RPC is scoped to that exact current tenant and returns
one tenant only; a mismatch is forbidden and no cross-tenant merged DTO exists.

Migration 013 is the current implementation candidate for replacing the old
unscoped default-child request surface with
`family_workspace_for_tenant_v1(tenantId, childId?)`. The predecessor is retained
only as an owner core. The wrapper reauthorizes the signed guardian and selected
tenant, chooses a default child only inside that tenant, and checks the returned
tenant/child receipt; the repository repeats the tenant comparison. The final
001–018 same-identity/two-tenant seed, pgTAP, HTTP, cookie-clear and no-merge
evidence passed locally; hosted behavior remains unverified.

## `FamilyLearnerCardDTO`

Purpose: show one synthetic learner within an already authorized relationship.

| Field | Type | Class | Rule |
|---|---|---|---|
| `learnerId` | opaque ID | `SYN` | Synthetic environment ID only. |
| `learnerAlias` | string, 1–40 | `SYN` | Fictitious alias such as `Student A`; no surname. |
| `gradeBand` | enum `G3`, `G4`, `G5`, `G6_8` | `SYN` | Coarse product label; not imported from a real roster. |
| `relationshipState` | literal `active_synthetic` | `SYN` | Never treated as real legal relationship proof. |
| `currentAssignmentCount` | integer 0–99 | `SYN` | Derived from synthetic projections. |
| `lastLearningActivityAt` | timestamp or `null` | `SYN` | Synthetic time; no device/location detail. |
| `supportBand` | `on_track`, `check_in`, `needs_teacher_context`, or `no_data` | `SYN` | Coarse explanation; not diagnosis, grade, or placement. |

## `FamilyAssignmentSummaryDTO`

Purpose: summarize a synthetic assignment without exposing classroom policy or
other learners.

| Field | Type | Class | Rule |
|---|---|---|---|
| `assignmentId` | opaque ID | `SYN` | Synthetic assignment. |
| `learnerId` | opaque ID | `SYN` | Must be in the authorized response learner set. |
| `contentReleaseId` | opaque/versioned ID | `PUB` | Product registry reference only. |
| `lessonId` | canonical content ID | `PUB` | Does not imply migration acceptance. |
| `titleKey` | allowlisted localization key | `PUB` | No teacher-authored free text. |
| `dueAt` | timestamp or `null` | `SYN` | Synthetic due time. |
| `status` | `not_started`, `in_progress`, `completed`, or `unavailable` | `SYN` | `unavailable` fails closed when release access is absent. |
| `completedUnits` | integer ≥0 | `SYN` | Must not exceed `totalUnits`. |
| `totalUnits` | integer ≥0 | `PUB`/`SYN` | Bound to content release and projection. |
| `progressPercent` | integer 0–100 | `SYN` | Derived; never accepted from the client. |
| `updatedAt` | timestamp | `SYN` | Projection time. |

No assignment DTO may contain a classroom roster, teacher email, answer key,
raw response, exact score, accommodation, internal release ledger, FLA/SWF path,
or fidelity/audio/strict-completion conclusion.

## `FamilyProgressSummaryDTO`

Purpose: show a minimal, explainable synthetic progress projection.

| Field | Type | Class | Rule |
|---|---|---|---|
| `learnerId` | opaque ID | `SYN` | Authorized learner only. |
| `contentReleaseId` | opaque/versioned ID | `PUB` | Exact content identity supplied by registry. |
| `lessonId` | canonical content ID | `PUB` | Display lookup only. |
| `visitedUnits` | integer ≥0 | `SYN` | Projection count. |
| `completedUnits` | integer ≥0 | `SYN` | Projection count. |
| `totalUnits` | integer ≥0 | `PUB`/`SYN` | Exact release denominator for the product view. |
| `progressPercent` | integer 0–100 | `SYN` | Derived with a documented rounding rule. |
| `lastActivityAt` | timestamp or `null` | `SYN` | Synthetic. |
| `skillBands` | array, max 12 | `SYN` | Each item has only `skillKey`, `band`, `evidenceCount`, `updatedAt`. |
| `explanationKey` | allowlisted localization key | `PUB` | Must explain estimate/not-grade and synthetic status. |

Allowed `band` values are `starting`, `developing`, `steady`, and `no_data`.
Exact probabilities, diagnostic labels, placement decisions, or intervention
eligibility are outside Phase 1.

## `FamilySyntheticThreadDTO`

Purpose: render an allowlisted synthetic school-support thread. In the default
UI demo it is fixture copy, not a communications record. In the controlled
integration profile it may represent a server-persisted synthetic test thread.

| Field | Type | Class | Rule |
|---|---|---|---|
| `threadId` | opaque ID | `SYN` | Synthetic fixture ID. |
| `learnerId` | opaque ID | `SYN` | Authorized learner only. |
| `subjectKey` | allowlisted localization key | `SYN` | No entered subject. |
| `participantLabels` | fixed enum array | `SYN` | Only `family` and `school_support`; no person names or addresses. |
| `messages` | array, max 50 | `SYN` | Exact `FamilySyntheticMessageDTO` values. |
| `readState` | `unread` or `read` | `SYN` | Initial synthetic state plus local demo overlay. |
| `threadState` | `open` or `closed_local_demo` | `SYN` | Closing is terminal for that demo thread: read-only with no reopen action. It remains component state and has no server meaning. |
| `updatedAt` | timestamp | `SYN` | Synthetic. |

`FamilySyntheticMessageDTO` is limited to:

- `messageId`: opaque synthetic ID;
- `authorRole`: `guardian_demo` or `school_support_demo`;
- `bodyKey`: an allowlisted fixture/localization key;
- `body`: synthetic plain text, maximum 2,000 characters; fixed fixture copy in
  the UI demo, or validated tester-authored `SYN_TEST_MESSAGE` in the controlled
  integration profile; never copied from a real communication;
- `createdAt`: synthetic timestamp;
- `noticeKey`: literal `family.synthetic.message.v1`.

### `FamilySyntheticReplyPreviewDTO`

Purpose: represent an unsent, browser-local demonstration reply. It is not an
API request and does not become a `family_messages` row.

Allowed fields are:

- `clientReplyId`: browser-created synthetic UUID, scoped to the current page;
- `threadId`: an already authorized synthetic thread ID;
- `authorRole`: literal `guardian_demo`;
- `body`: plain text, 1–2,000 characters after the reviewed length rule; no HTML,
  Markdown, URL preview, attachment or rich-text structure;
- `createdAt`: browser timestamp used only to render the local preview;
- `deliveryState`: literal `local_preview_not_sent`;
- `noticeKey`: literal `family.synthetic.reply-not-sent.v1`.

The UI enforces `maxlength=2000`, and the shared schema/validator enforces the
same limit and plain-string type. Any server rendering/fixture boundary must
apply the same validation before reflecting a value. There is no reply POST from
the default UI-demo control: if its preview content reaches an endpoint, it is
rejected and must not be logged, stored, audited as content, or forwarded. The
controlled integration profile uses a separately labeled
`SendSyntheticFamilyMessageRequest` and never reuses the preview control.

The default UI demo has no send request, recipient, or delivery status other
than the fixed local-preview label. Neither profile allows a client-entered
email/phone destination, attachment, link preview, typing indicator, or remote
asset. Controlled recipients and test destinations are server-derived.

## Allowed Phase 1 request DTOs

Requests are selectors or controlled synthetic test commands, never
authorization claims. The server derives profile, actor, tenant, relationship,
participant and test-destination authority.

| Request | Allowed fields | Server rule |
|---|---|---|
| `SelectGuardianTenantRequest` | opaque `tenantId`, `clientMutationId` | Re-read current signed identity's guardian tenant options; foreign/stale selection denies; set only HttpOnly tenant selector, clear child selector, and require the next RPC to reauthorize the exact tenant. Never merge workspaces. |
| `SelectLearnerRequest` / candidate `selectFamilyChild` | opaque `learnerId` or physical `childId`; candidate mutation also has `clientMutationId` | Re-authorize against active relationship; store only the opaque selection cookie; ignore/reject any role/tenant supplied outside schema. |
| `ListAssignmentsRequest` | `learnerId`, optional allowlisted `status`, opaque cursor, `limit` 1–50 | Stable tenant-scoped pagination; no arbitrary sort or filter expression. |
| `GetProgressRequest` | `learnerId`, optional `contentReleaseId` | Both learner and release access checked server-side. |
| `ListSyntheticThreadsRequest` | `learnerId`, optional `open`/`closed_local_demo` filter | Returns fixture copy only. |

### Companion signed-in learner assignment DTO

This is not a Family workspace response and is never returned to a guardian.
The server RPC envelope includes an exact `tenantId` solely so the BFF can
compare it with the signed authorization context and remove it. The strict
browser launch contains only:

- `assignmentId` (opaque UUID);
- `lessonHref`, bound to the already admitted G4 L3 course route;
- `lessonReleaseId`;
- `totalPages`, exactly `39` for this candidate; and
- `objects`, exactly 39 entries in contiguous source order, each containing only
  `pageOrdinal`, `placementId`, `animationId`, `contentReleaseId`,
  `learningObjectVersionId`, and nullable `skillId`.

The BFF rejects an unknown field, duplicate placement or learning-object
version, non-contiguous ordinal, tenant mismatch, route/release mismatch, or any
placement/animation mismatch with the existing course descriptor. The browser
never receives `tenantId`, `studentId`, `enrollmentId`, provider identity, role,
raw event, projection row, answer, destination, or guardian relationship.

`RecordAssignmentLearningEventsV2Request` uses the existing exact event fields
listed below, but the server fixes `schemaVersion=2`, requires one assignment per
1–50 event batch, and permits only current authorized G4 L3 placement bindings.
The product caller excludes `practice_evaluated`; `page_reviewed` must have
`outcome='completed'`, all other admitted event types use `outcome='none'`, and
events older than 24 hours deny. The exact response is only `inserted` and
`ignored` after a server-only tenant-envelope comparison.

The following Family mutations are permitted only in the controlled
`synthetic_integration_test` profile. The one named
`RecordAssignmentLearningEventsV2Request` is instead reachable only through the
separate non-production signed-in learner assignment bridge described above; it
is never enabled by the cookie-only UI demo:

| Request | Allowed fields | Mandatory server rule |
|---|---|---|
| `CreateSyntheticGuardianInvitationRequest` | `clientMutationId`; synthetic `studentId`; `verifiedAdultEmail` matching exact normalized `local-part@helpmath.invalid` | Server-only action derives admin/tenant/student, enforces the non-production `synthetic-invalid-only` policy, computes a versioned keyed HMAC with `FAMILY_EMAIL_DIGEST_KEY`, and separately encrypts delivery material. Ciphertext must be bound to immutable tenant/record/purpose/key-version context and cannot be swapped with invitation-token ciphertext. Delivery is permitted only to the fixed loopback Mailpit sink when `mailpit-local` is separately selected; reject any other/personal/Internet destination. Plaintext/key/token digest/ciphertext never enters a response/log. Database budget: 5/fixed hour and 20/UTC day per actor+tenant+student; exact idempotent replay is not charged twice. |
| `CreateProductionGuardianInvitationRequest` | Same minimal `clientMutationId`, opaque authorized `studentId`, and normalized adult email; no client tenant/role/policy/transport | The same Server Action is reachable only in exact production with Supabase Auth, Resend, `school-verified-production`, explicit production-invitation opt-in, global/tenant/email gates, complete approved retention and a live database-backed administrator session. The database derives the policy from the attested tenant mode and the dedicated issuer rechecks the bound session. The fictional loopback production-shaped test sends no Internet email; real use remains approval-gated. |
| `ResendSyntheticGuardianInvitationRequest` | `clientMutationId`, synthetic `invitationId` | Re-authorize current manager, rotate token, enforce expiry and immutable idempotency meaning, and preserve the exact verified reserved-domain policy; delivery only through fixed loopback Mailpit. Database budget: 3/fixed hour and 10/UTC day per actor+tenant+invitation; resend does not reset the lifetime acceptance-failure lock. |
| `ResendProductionGuardianInvitationRequest` | `clientMutationId`, opaque authorized `invitationId` | Re-authorize the current scoped administrator, exact production tenant, approved retention and live Supabase session; preserve `school-verified-production`; rotate only the token; consume through the dedicated issuer; never reveal the destination or token in a receipt/log. No real delivery is approved by this DTO. |
| `RevokeSyntheticGuardianInvitationRequest` | `clientMutationId`, synthetic `invitationId`, plain-text synthetic `reason` ≤500 | Re-authorize current manager; terminal revoke; cancel pending invite outbox work; audit without reason/body content. |
| `AcceptGuardianInvitationRequest` | `clientMutationId`, opaque `token` from the fragment/session-key flow | Same-origin server-only POST; validate the exact selected provider session and verified email, compute the same versioned keyed HMAC, then let SQL atomically compare/consume. Production additionally requires the exact tenant issuer and live `auth.sessions` row at `pending→accepted`; synthetic uses its approved development identity. Database sees no email plaintext/key; direct RPC bypass, missing/invalid key or issuer mismatch denies; token never logs or reflects. Known expected failures lock that invitation at 10 lifetime attempts and resend does not reset it. Unknown tokens retain the same empty result and create no token-derived resource counter, while migration 018 charges the current signed-provider-identity aggregate at 20/fixed 10 minutes and 100/UTC day. Anonymous IP/device/network edge-WAF and distributed multi-account protection remain required. |
| `DeclineGuardianInvitationRequest` | `clientMutationId`, opaque `token` from the fragment/session-key flow | Same verified-email HMAC and token-digest boundary as acceptance; returns no invitation detail, terminalizes only an exact pending invite and cancels pending invitation delivery. A production adult must have a current exact-tenant Supabase session but need not accept merely to create an app-user mapping; the terminal row keeps a null actor until an approved mapping exists. Unknown/mismatched probes remain non-enumerating. |
| `SendSyntheticFamilyMessageRequest` | `clientMutationId`, plain-text `body` 1–2,000 after NFC/trim, plus either authorized `threadId` or all synthetic new-thread selectors (`childId`, `enrollmentId`, `staffUserId`, allowlisted `topic`) | Controlled profile plus global and exact-tenant Messaging layers on; server re-authorizes every selector/participant; closed thread denies; no client destination; exact DB limit 2,000. Database budget: 20/fixed 10-minute window and 100/UTC day per actor+tenant+thread, charged only for a newly inserted message after immutable idempotency validation. |
| `MarkSyntheticThreadReadRequest` | `clientMutationId`, authorized `threadId` | Controlled profile plus both Messaging layers on; own read state; no delivery receipt to a real person. |
| `CloseSyntheticThreadRequest` | `clientMutationId`, authorized `threadId`, terminal `status='closed'` | Controlled profile plus both Messaging layers on; close is terminal/read-only; no reopen mutation. |
| `UpdateSyntheticNotificationPreferenceRequest` | `clientMutationId`, `messageEmailEnabled`, `weeklyDigestEnabled` | The browser supplies no tenant or destination. The server derives the selected authorized tenant and passes it to `update_family_notification_preferences_for_tenant_v1`; either opt-in requires the tenant Messaging mirror, but an opt-out remains available. Applies only to the existing reserved-domain local-Mailpit destination; cannot introduce/change an address or enable a non-test/Internet destination. |
| `RevokeSyntheticGuardianLinkRequest` | `clientMutationId`, synthetic `guardianLinkId`, plain-text synthetic `reason` ≤500 | Authorized scoped admin only; immediate deny, audit without body, then retention cleanup. |
| `RelinquishSyntheticGuardianLinkRequest` | `clientMutationId`, own synthetic `guardianLinkId` | Exact linked guardian only; terminal revoke, pending-delivery cancellation, immediate access denial; no client reason/role/tenant. |
| `RecordAssignmentLearningEventsV2Request` | `events` array 1–50; each exact event has `activeDurationMs`, `assignmentId`, `occurredAt`, `attemptNumber`, `clientMutationId`, `clientVersion`, `contentReleaseId`, `eventId`, allowlisted non-practice `eventType`, `idempotencyKey`, `learningObjectVersionId`, `lessonReleaseId`, `locale`, constrained `outcome`, `sessionId`, nullable `skillId`; server fixes `schemaVersion=2` | Exact active synthetic learner binding and one assignment; assignment/enrollment/content/39-placement consistency, unique IDs, current-session clock/duration/length checks and 30-day expiry; no guardian/client-selected learner ID; no direct raw-event read or local/V1 history upload. This is learner-event ingestion for a controlled synthetic fixture, not a family-message action or migration-acceptance signal. |
| `PublishSyntheticSchoolAnnouncementRequest` | `clientMutationId`, opaque authorized `schoolId`, NFC/trimmed plain-text `title` 1–200 and `body` 1–2,000 | Exact Teacher/school-or-district-admin authorization; the server performs the resource-derived school/tenant preflight, compares the returned IDs with request context, then invokes the publish RPC with no client tenant/actor/recipient/expiry authority. Unknown/control-character/oversized content, unavailable allowlist, tenant mismatch, inactive school/class/staff role, idempotency conflict or missing retention authority fails closed. This is synthetic school copy, not a real notice or monitored-support channel. |
| `CreateFamilyRightsRequest` / `ReviewFamilyRightsRequest` | Create: `clientMutationId`, linked `studentId`, allowlisted `kind`, optional plain text ≤1,000. Review: opaque `requestId`, terminal review status and `clientMutationId`. | Create is guardian-only and starts human review; it never directly changes a child record, relationship or deletion state. Review is scoped school/district administration. Free text is excluded from audit context. |
| `CreateFamilyInvitationSuggestion` / `ReviewFamilyInvitationSuggestion` | Create: linked `studentId`, optional plain text ≤500, `clientMutationId`. Review: opaque `suggestionId`, reviewed/dismissed status and `clientMutationId`. | Current teacher/class/enrollment only; no adult email and no direct invitation/link creation. Admin review is an independent workflow state. |
| `CreateFamilySupportAccessRequest` / `DecideFamilySupportAccessRequest` | Exact known `threadId`, reason ≤500 and `clientMutationId`; decision uses opaque `requestId`, boolean approval, optional note ≤500 and `clientMutationId`. | Scoped admin requests; a different district admin decides; approval is exact-thread, requestor-only and expires within 15 minutes. No standing message access or discovery. |
| `RedactFamilyMessageRequest` | opaque `messageId`, reason 1–500, `clientMutationId` | Only the current requestor of an approved unexpired support case for that message's exact thread. Writes an audited tombstone; no edit/delete/recovery response and no original body in audit. |
| `RecordSyntheticEmailDeliveryEventRequest` | Internal normalized fields only: `eventId` 1–255, `providerEmailId` 1–255, `eventType` is `delivered`, `bounced`, `complained`, or `suppressed`; offset-aware `occurredAt` | Never a browser DTO. Route reads at most 256 KiB, verifies the exact Svix signature and strict provider envelope, then forwards only these fields with a short-lived dedicated `family_webhook_writer` JWT plus publishable key. Raw provider object/headers and writer JWT are never passed to SQL/logs/receipts. The exact current 001–018 loopback PostgREST harness verified strict 204, exactly one event/outbox transition, zero table/sequence and exact one-function authority, plus denial for anon/authenticated/`service_role`/wrong-audience/table/cross-RPC attempts; hosted asymmetric-key and production rotation remain open. |

Allowed success receipts contain only opaque synthetic IDs, thread/invitation
IDs, expiry, enqueue/delivery status enums, provider-opaque delivery ID if
needed for reconciliation, and timestamps. They never return token plaintext,
email address, provider object, encrypted contact, message body, or secret.
The `send_family_message_v1` result is parsed through an exact strict receipt
schema before its opaque message/thread IDs become an application result. The
announcement publish receipt is likewise exactly one row containing only
`announcement_id`, `published_at`, and `expires_at` before mapping to the UI
receipt. An unknown, missing or malformed field fails closed rather than being
cast.

`FamilySyntheticReplyPreviewDTO` is deliberately absent from server request
DTOs. It remains in browser memory. Mark-read, terminal close, filters, local
reply preview, and Settings demo toggles are component-memory state, not request
DTOs. They reset rather than entering `localStorage`, `sessionStorage`, a server
action, database, outbox, provider or analytics event. The only family UI value
allowed in `localStorage` is the non-personal theme preference.

Closed threads are read-only in both profiles. There is no reopen DTO or action.
The default demo only shows new-thread guidance; the controlled profile may
create a distinct synthetic thread through the exact request above.
The implemented Family announcement private-reply control does not add an
announcement-specific mutation DTO: it chooses an already allowlisted
`messageContacts` entry for the selected child and uses the new-thread branch of
`SendSyntheticFamilyMessageRequest` with topic `other`. The server re-authorizes
the child, enrollment and staff participant; no announcement body, publisher,
destination or ID becomes authority.

Every mutation uses CSRF/origin protection, idempotency where applicable, a
bounded body, strict unknown-field rejection, rate limiting, and an audit result
without request content.

## Globally prohibited response and log fields

The following are never part of a family UI/API/log in Phase 1:

- real name, initials derived from a real name, real/personal or arbitrary email,
  phone, address, precise
  location, birth date/age, photograph, biometric or voice data;
- district/school student number, SIS/OneRoster sourcedId, classroom roster,
  identity-provider issuer/subject, OAuth token, session ID, password, recovery
  answer, cookie seed, HMAC input/output, or raw IP address. Invite-token
  plaintext is permitted only in the exact controlled accept-request POST body;
  it is forbidden in every response, log, HTML, search parameter, analytics
  event, screenshot and persisted database field. The webhook-writer JWT,
  `service_role`, Resend API key/Svix secret, cron bearer and outbox/HMAC keys are
  likewise never product DTO fields or receipt values;
- disability, diagnosis, IEP/504, accommodations, health, discipline,
  attendance, immigration, language-status designation, or protected notes;
- assessment item, answer, answer key, score detail, free-text response, Nova
  prompt/reply/transcript, raw xAPI statement, device fingerprint, or exact
  behavioral trace;
- teacher/administrator personal contact details, private support notes, other
  learners, aggregate cells that reveal another individual, or hidden roster
  membership;
- FLA/SWF bytes or paths, source hashes not already public, migration evidence,
  strict validator details, private registry state, secrets, or deployment IDs;
- arbitrary HTML/Markdown, attachments, executable links, tracking pixels, or
  unreviewed remote asset URLs. The only free-text exceptions are the visibly
  unsent `SYN_LOCAL_INPUT` preview and controlled `SYN_TEST_MESSAGE`; neither may
  contain real data, and only the latter may traverse the reviewed integration
  request/database/outbox/test-email path.

## Future real-family candidate fields are not active allowlist entries

A later, separately approved real-family schema may require an adult's verified
contact channel, a learner's reviewed display name, relationship provenance,
consent or notice receipts, and additional rights metadata. The current
synthetic governance DTOs contain only the exact allowlisted fields above; they
do not authorize real values, direct record changes, custody adjudication or
historical HELP Math backfill.

## Contract-test minimum

- exact parse succeeds for every allowed DTO and rejects unknown keys;
- recursive forbidden-field scan covers aliases/case/separator variations;
- serialized fixtures contain only synthetic marker namespaces;
- foreign tenant/learner/thread selectors return the same non-disclosing denial;
- client role/tenant/relationship claims are rejected;
- same signed guardian with two tenants sees only role-filtered opaque choices;
  switching clears the child cookie; the next workspace equals the selected
  tenant exactly; foreign/stale tenant/child selectors deny; no response merges
  children, threads, announcements, contacts or projections across tenants;
- responses set private/no-store headers and never include provider objects;
- counts remain internally consistent and bind to an explicit source watermark;
- fixture messages, local preview and integration-test messages enforce plain
  text and the 2,000-character maximum at UI/schema/service/database; the UI-demo
  preview makes no send request;
- local reply preview text produces no request, persistence, analytics, log,
  model call, notification or outbox row and clears on refresh/sign-out;
- message read/close/filter and Settings demo state produce no request or
  persistence; closed threads expose no reopen action and no reply input;
- controlled integration DTOs reject default-profile calls, unknown fields,
  client roles/tenants/destinations, non-allowlisted addresses, real-looking
  fixtures, wrong participants and closed/revoked/expired objects;
- invitation/message budget tests cover every fixed-window boundary, concurrent
  last-slot use, free exact replay, changed-key-meaning conflict, lifetime-ten
  known-invitation lock, no reset on resend, and no partial message/outbox write
  on denial; signed-provider-identity invitation-probe aggregation is covered at
  20/fixed 10 minutes and 100/UTC day, while anonymous IP/device/network edge-WAF
  and distributed multi-account protection remain separate open gates;
- outbox payload validation rejects forbidden plaintext keys recursively (not
  only at the root), exact per-kind unknown/nested structures, and over-size
  payloads before persistence; strict worker parsing is a second boundary;
- encrypted invite-token/email fields reject cross-purpose/record/tenant swaps,
  wrong key version, missing/incorrect AAD, retired key and corrupted GCM data;
- synthetic `LearningEventV2` batches reject unknown keys, duplicates, foreign
  assignment/enrollment/learner/content bindings, invalid clock/duration/event/
  outcome/locale/length values and direct raw-event reads; family responses see
  only the allowlisted projection/aggregate fields;
- the signed-in learner launch rejects any non-G4-L3, non-39-page, route/release/
  placement mismatch, a client/server tenant mismatch, cookie-only demo identity,
  production runtime, disabled tenant/interlock, or unknown assignment. Browser
  events are in-memory/current-session only, exclude `practice_evaluated`, do not
  upload saved local or V1/LRS history, and expose only a strict count receipt;
- invite→family→two-way-message→test-email→revoke E2E records exact synthetic
  IDs/statuses only, sends solely to the fixed loopback Mailpit sink, and proves no
  further access/delivery after revoke;
- no assignment/progress control links into or continues a learner's My Lesson
  session;
- snapshot/golden tests prove EN/ES disclosures remain visible;
- a repository and build-output scan proves no real PII fixture was added.
