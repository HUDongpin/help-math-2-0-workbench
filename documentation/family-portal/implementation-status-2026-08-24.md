# Family Portal implementation status — 2026-08-24

This is an evidence-scoped engineering handoff for the isolated
`codex/parent-portal` worktree. It is not a release receipt, deployment record,
legal determination, district authorization, or approval to process real family
data.

## Outcome

The exact local synthetic product candidate implements the protected Family,
Teacher Messages and Admin Family Access surfaces; school-issued invitations;
verified-adult acceptance; multi-child and explicit multi-tenant selection;
read-only assignments/progress; bounded LearningEventV2 projections; plain-text
two-way messages; school announcements; notification preferences; loopback-only
email; revocation; retention; audit; abuse budgets; and default-off safety
controls. It also implements controlled family rights requests and account
activity, teacher invitation suggestions, a two-person time-limited exact-thread
support workflow, audited message tombstones, and server-side invitation
decline.

The complete local protected journey passed:

```text
administrator sign-in
→ issue synthetic invitation
→ invitation outbox to loopback Mailpit
→ adult sign-up and email verification
→ accept invitation
→ open authorized Family workspace
→ opt into message email
→ guardian opens a thread
→ teacher replies
→ reminder outbox to loopback Mailpit
→ persisted two-way history visible after reload
→ guardian submits a rights request
→ teacher submits a family-access suggestion
→ school administrator reviews both
→ a different district administrator approves 15-minute exact-thread support
→ the requestor redacts one message and the guardian sees only a tombstone
→ administrator revokes relationship
→ former guardian receives 404 for /family
```

Only reserved `@helpmath.invalid` recipients and the fixed non-production
loopback Mailpit sink are enabled in Phase 1. A separate production-shaped
invitation path is implemented behind exact Supabase Auth, Resend, recipient-
policy, approved-retention, tenant and live-session gates. It was exercised
only with fictional data and no Internet delivery. Real recipients, real PII,
real-family access and production deployment remain unapproved and disabled.

## Exact local evidence

- `npm run verify:family:product-e2e`: passed against a fresh isolated stack.
- Migrations: 18/18 applied in lexical order, 001 through 018.
- Fictional synthetic seed: applied.
- pgTAP: `489/489` passed, `0` failed/skip/todo.
- Database catalog: `38/38` public physical tables have RLS enabled; 17 public
  policies.
- Runtime stack: PostgreSQL 16.15, PostgREST 16.2, GoTrue 2.195 and Mailpit 1.31.
- Dedicated invitation-issuer and webhook-writer positive/negative role matrices:
  passed with zero table/sequence authority and exact RPC grants.
- Fictional production-shaped invitation create/resend passed with exact
  `school-verified-production`, approved-retention and dedicated-issuer checks;
  no Internet delivery was attempted.
- Supabase session registry enforcement passed for `local`, `others` and
  `global` logout scopes. Revoked sessions could not read protected RPCs,
  consume an unexpired administrator invitation attestation, or commit a
  production invitation terminal transition. A real local GoTrue refresh grant
  returned a rotated complete session whose access token still resolved the
  exact application authorization context.
- The protected browser flow requested password recovery, captured the exact
  loopback Mailpit recovery link, exchanged the PKCE callback, updated the
  password, denied the old password and re-entered Family with the new one.
  Repeating sign-up for the verified address returned the same generic
  check-email response; the final database still contained exactly one
  `auth.users` row and one active provider identity for that fictional adult.
- Same signed identity in two synthetic tenants: explicit selection and no-merge
  isolation passed.
- One ingest versus one rebuild on two PostgreSQL backends: passed with a
  deterministic watermark.
- Two concurrent ingests on two PostgreSQL backends: passed with deterministic
  projection state.
- Message-gate toggle ordering and preference replay conflict checks: passed
  without deadlock or stale re-enable.
- Tenant teardown ordering: passed for the staffed fictional Maple tenant;
  active class bindings were disabled before their required teacher roles.
- Fail-closed rollback passed locally after the product flow: the production-
  shaped administrator session was globally revoked, the old token was denied,
  Next restarted with provider/cutover/Portal/Messaging/Email all disabled, and
  `/family`, `/sign-in`, `/auth/callback` and `/api/auth/session` all returned
  `404`.
- Local logical backup/no-resurrection drill: one 930,281-byte custom-format
  snapshot restored into two empty databases in approximately 358 ms and 351
  ms after a 134 ms backup. Both restores retained 38/38 RLS, the closed tenant,
  expired/revoked guardian links, zero active roles/open threads, and the
  absence of the retention-deleted governance record. These observed timings
  are local synthetic measurements, not production RPO/RTO commitments.
- Focused Family tests: `56/56` passed.
- Synthetic Family Playwright: `7/7` passed, including EN/ES, governance,
  invitation accept/decline, required responsive widths, keyboard-oriented
  flows, print and automated axe checks. The current accessibility delta also
  measures 44 x 44 phone language targets and runs blocking axe checks on
  Overview, Progress, Assignments, Messages and Settings; rendered light/dark,
  desktop/phone and visible-focus evidence is recorded in the
  [accessibility engineering review](./accessibility-audit-2026-08-24/README.md).
- Signed G4 L3 LearningEventV2 Playwright: `1/1` passed.
- Independent Family release-binding command passed with
  `published=0 production_bindings=0`; it does not modify or replace the
  canonical Lesson release ledger.
- Redacted production-configuration preflight: the current unconfigured
  environment failed closed with `CONFIGURATION_NOT_READY`; the deterministic
  ready-shape unit/CLI fixture passed only as
  `CONFIGURATION_READY_NOT_RELEASE_APPROVED`, with `releaseApproved=false` and
  no credential values in its output. This is a network-free configuration
  shape check, not hosted/provider/deployment evidence.
- Final real-family release-receipt verifier: implemented with all fifteen
  `FP-R00`–`FP-R14` gates, root-contained SHA-256 evidence, Ed25519 signatures,
  five-way accountable reviewer separation, ten production positive/negative
  claims, a ≤30-day lifetime and exact clean-commit binding. Its focused tests
  pass `7/7`. No external receipt, evidence root or trust roots were supplied;
  the current no-argument invocation correctly returns
  `REAL_FAMILY_RELEASE_RECEIPT_INVALID` and does not close a gate.
- External readiness audit: the isolated worktree has no Vercel link, provider
  CLI, provider access token, Supabase/Resend/issuer/encryption/cron/trust-root
  configuration or local release receipt in the bounded inspected surface. One
  dated Vercel link belongs to another checkout and is not current authority.
  The worktree is not a clean release artifact. No provider call, install,
  login, deployment or real-data action was attempted. See the
  [redacted audit](./external-readiness-audit-2026-08-24.md).
- TypeScript typecheck and exact changed-file ESLint: passed.
- Production dependency audit: `0` vulnerabilities. Service-role credential
  access is now isolated in a notification/retention cron-only module; ordinary
  request repositories import a request-only Supabase client module.
- Direct Next production build: passed.
- Repository build wrapper: blocked before Next by the independent missing
  Grade 5 source asset `L5VB12.swf`; no source byte was invented, copied or
  modified to bypass that source-custody gate.
- Runner cleanup: owned processes stopped, temporary root removed, ephemeral
  credentials discarded.

## Frozen local artifact identities

| Artifact | SHA-256 |
|---|---|
| migrations 001–010 | See the complete manifest in `rls-permission-matrix.md` |
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
| `apps/web/lib/family/learning-events-v2-contract.ts` | `fd19212d3ffca229bb47acd4b903bd35c78fc7256ad53cdca732a1a5b4e6217c` |
| `apps/web/tests/family-learning-events-v2.test.ts` | `2407245fe357b96d902fee98dcc46bebadfb778d2d0d45fa3f3406b5c0a76c99` |
| `scripts/check-family-learning-events-v2-release-bindings.mts` | `72a9743b087dcfa55a1142915b69aeb10dac6ff1ff521e74203e36d318414d36` |
| `apps/web/lib/family/production-readiness.ts` | `a6431543be2617ac4e3d50d36a9cb22a2e845ad89f76e8dde3ce6a185a71fa04` |
| `apps/web/tests/family-production-readiness.test.ts` | `9f62ab367f04aaa3bec060902643942e64a7923896f57bf71b170d50fcc33851` |
| `scripts/check-family-production-configuration.mts` | `f15b45879084204a88d47c6c3a5b9844cdd90f2c5ae10274264196a6cd358311` |
| `vercel.family-portal.json` | `e4983587d03d69bdf25d511bd7c0605eca4db1e328f1b487cfa8685ba2f11c32` |
| `scripts/lib/family-real-release-receipt-v1.mjs` | `8a45b5f2e411b316bba8caa246c7cbc58dabab3e40137f12bdfe35f2c536774d` |
| `scripts/verify-family-real-release-receipt.mjs` | `595223752e5c5fead22cd3be2b39680e8b76a81901cf42a218519e3988c5e747` |
| `scripts/family-real-release-receipt-v1.test.mjs` | `d177234543170825b18c797d528ee563dbc3ce39c0908d7a9edb8e4f723677ec` |
| `documentation/family-portal/real-family-release-receipt.md` | `9248211b505782f79f971cfaf5fda7af53adb1b2b35af878ea9989e26284c9dd` |
| `documentation/family-portal/external-readiness-audit-2026-08-24.md` | `247ae8f5e32f34f4ebb16b241940de6c749687b1b76dbdd91a0252605c4d664a` |
| `apps/web/lib/family/supabase-config.server.ts` | `5d5f5a2e809208036e92fc55e658a5e30ad5544a3a06ffe6a4f05dc8ab4e1a4b` |
| `apps/web/lib/family/supabase-service.server.ts` | `3d3f622af9b24596539b64ef0cf24a5c83d9b7633d1051d5e7f0bbebd9a22b98` |
| `apps/web/lib/family/supabase.server.ts` | `28c4202add68d75ca87944b64dfc85e3569dc03b8f54289d780d90ebcf5ba72d` |
| `apps/web/lib/family/notification-service.server.tsx` | `fa918fd5527d35c2491acf0d7aa3325f62e873ebca4e79f189096879fb051447` |
| `apps/web/tests/family-contracts.test.ts` | `486795be9de99c3b7e09003f7834bdb599fd64a82670313ba6ef0a1e48bf0221` |
| `apps/web/components/family/family-portal.module.css` | `95b6518e99bcfa218cdd52078bcb42bb92ce60433150b544a50291f1ad5a628d` |
| `apps/web/e2e/family-portal.spec.ts` | `251967790205c7b11fe4aa705dbd6383ae3e7130de9741637f6aa848863469f0` |
| `apps/web/playwright.config.ts` | `853b2aab65d1f4e07f5cd471a6b8a5c2b5ef3d3b40e253019450a415f1341d65` |

## Required independent status gates

| Gate | Status | Evidence-scoped disposition |
|---|---|---|
| `PLAN_COMPLETE` | PASS | Architecture, threat, DTO, RLS, retention, auth-cutover, operations and release-gate packet exists and is reconciled to the current local evidence. |
| `CODE_COMPLETE` | OPEN | The complete local Family/governance vertical slice is implemented. The only signed LearningEventV2 product caller is a synthetic G4 L3 slice; the canonical Lesson release ledger currently has `0` published releases and `0` strict-complete members, so this is not a production release binding. A negative-drift test requires every future published Lesson to declare a production V2 binding, but implementing and accepting any such non-empty binding remains separate code/evidence work. Signed-provider-identity invitation probes are database-bounded, while anonymous IP/device/network edge-WAF and distributed multi-account controls remain external release dependencies. |
| `SYNTHETIC_E2E_ACCEPTED` | OPEN — automated candidate passed | Exact local UI-demo, learning-event and protected integration flows passed; no named independent synthetic-release acceptance receipt exists. |
| `SECURITY_ACCEPTED` | OPEN | Prior independent review recorded no open P0/P1 code finding for its reviewed predecessor and the exact current local security matrices pass. Migrations 015–018 and their associated app/runner changes still require independent exact-artifact review; hosted configuration and operational/key drills are not accepted. |
| `ACCESSIBILITY_ACCEPTED` | OPEN | Automated axe, responsive, 44-pixel target and rendered keyboard-oriented checks passed for the synthetic candidate; named manual WCAG 2.2 AA, screen-reader, zoom/forced-colors and human accessibility acceptance are not recorded. |
| `PRIVACY_LEGAL_APPROVED` | OPEN | EN/ES candidate copy, data inventory and the implemented human-review request workflow do not substitute for qualified privacy/legal review, DPA or approval. |
| `DISTRICT_AUTHORIZED` | OPEN | No district, school, roster authority or real-family cohort is authorized. |
| `OWNER_ACCEPTED` | OPEN | No Owner acceptance receipt binds this exact Family Portal artifact. |
| `DEPLOYED` | NO | No Vercel project, production alias, hosted Supabase, scheduler, Resend/domain or other deployment was changed or verified. |
| `PRODUCTION_VERIFIED` | NO | No production URL or real invite/access/message/email/revoke/cross-tenant test was run. |

## Remaining boundaries

- The database budgets known invitation/message resources and migration 018
  bounds every non-replay acceptance probe for one signed provider identity at
  20/fixed 10 minutes and 100/UTC day. Anonymous IP/device/network edge-WAF and
  distributed multi-account defenses still require target-environment controls.
- Password recovery/PKCE callback/update, old-password denial, enumeration-safe
  duplicate sign-up and exact-one identity cardinality passed in the disposable
  loopback stack. A refresh grant and disabled-provider rollback also passed in
  that disposable stack. Hosted recovery/session refresh/rollback, key rotation/
  retirement, compromise response, provider outage and hosted backup/restore
  still need target-environment drills. The local logout-scope/session-
  revocation matrix, recovery/refresh flow, rollback and two-restore no-
  resurrection drill are evidence only for those named local behaviors, not the
  hosted target.
- Rights requests, privacy-safe account activity, teacher invite suggestions,
  two-person JIT support and administrative redaction are implemented local
  candidates. Their operating policy, staffing, notices and independent
  acceptance remain open.
- The signed assignment event path is intentionally limited to synthetic G4 L3.
  The current release ledger has no published Lesson. A negative-drift contract
  requires an explicit production V2 binding before any future published
  Lesson can pass the focused Family contract suite; that declaration alone
  cannot replace its database, route, browser, privacy, Owner or release
  evidence and changes no Current-JS, fidelity, audio or Owner gate.
- Hosted Supabase/PostgREST, Vercel Cron, production Resend/webhook/domain,
  monitoring, rollback, incident tabletop and deployed retention teardown are
  unverified.
- Family Portal evidence does not alter Current-JS coverage, modern My Lesson,
  Flash source fidelity, audio, human/Owner migration acceptance, strict
  completion, Lesson release or publication.

The product must not be described as “live for real families” until every
applicable gate above is closed for one exact deployed artifact and tenant.
