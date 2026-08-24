# Family portal production authentication cutover runbook

Status: **LOCAL SYNTHETIC AND FICTIONAL PRODUCTION-SHAPED AUTH FLOWS VERIFIED / HOSTED PRODUCTION CUTOVER UNVERIFIED / NOT APPROVED FOR REAL FAMILY USE**

This runbook governs a future cutover of the Family portal authentication
authority from the development-only Clerk candidate to Supabase Auth. It does
not authorize the cutover, provision a provider, create a deployment, approve
real personal data, or close any Privacy, Legal, DPA/contract, district,
security, operations, or Owner gate.

Phase 1 remains synthetic-only. A real-family cutover must use a new, exact
release record after every real-family gate in
[the release contract](./release-gates-and-status-template.md#real-family-gates)
has closed.

## Non-negotiable authority model

Authentication providers prove a provider session only. They do not grant a
HELP Math tenant, role, school, learner, guardian relationship, or permission.
The application database remains authoritative for all business identity and
authorization:

- `provider_identities` maps the exact signed `(issuer, subject)` to one
  `app_users.id`;
- `app_users` is the provider-independent HELP Math actor;
- `tenant_identity_issuers` is the exact tenant/environment/data-mode issuer
  allowlist;
- active, time-bounded `role_bindings` establish role scope; and
- active school, class, enrollment, guardian-link, thread, and resource records
  are rechecked by the relevant RPC/RLS path.

Provider email, user metadata, redirect parameters, browser state, cookies, or
client-supplied tenant/role fields must never become business-authorization
authority. An authenticated but unmapped, inactive, wrong-issuer, wrong-
audience, wrong-role, wrong-tenant, or unlinked subject fails closed.

## Exactly one provider mode

`FAMILY_AUTH_PROVIDER` is the authority selector. The permitted values are
`disabled`, `clerk-development`, and `supabase`. There is no automatic fallback
from a requested but incomplete provider to another provider.

| Intended state | Required configuration | Forbidden configuration |
|---|---|---|
| Globally disabled | `FAMILY_AUTH_PROVIDER=disabled`; `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED=false` | Treating a residual Clerk or Supabase cookie as a Family session |
| Development-only Clerk candidate | `FAMILY_AUTH_PROVIDER=clerk-development`; valid loopback/development Clerk configuration; `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED=false` | Production use, a production Clerk issuer, Supabase cutover enabled, or accepting both providers |
| Supabase cutover candidate | `FAMILY_AUTH_PROVIDER=supabase`; `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED=true`; exact Supabase issuer/audience; exact project URL and publishable key; Clerk local auth disabled | Clerk fallback, a second active issuer, wildcard issuer/audience, service-role browser use, or activation before the cutover receipt is approved |

If any required value is missing, malformed, stale, or inconsistent, the
effective Family auth state must be `disabled`. Do not make both providers
reachable during migration, even briefly. Historical provider mappings may be
retained only under the approved lifecycle policy; retention of a mapping is
not permission to accept that provider's session.

## Authoritative Supabase environment contract

The cutover receipt must bind the exact, secret-redacted values and deployment
that uses them:

| Variable | Required contract |
|---|---|
| `FAMILY_AUTH_PROVIDER` | Exactly `supabase` for the cutover; `disabled` for rollback. |
| `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED` | Exactly `true` only during an approved Supabase cutover; `false` before approval and during rollback. |
| `FAMILY_SUPABASE_AUTH_ISSUER` | Exact `https://<project-ref>.supabase.co/auth/v1` issuer for the selected project; same origin as `NEXT_PUBLIC_SUPABASE_URL`; no wildcard, query, fragment, credentials, alternate path, or trailing-path variation. |
| `FAMILY_SUPABASE_AUTH_AUDIENCE` | Exactly `authenticated`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Exact selected HTTPS project origin. Environment/project identity must match the receipt and issuer. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key for that exact project. It is never replaced by the service-role key. |
| `FAMILY_INVITATION_RECIPIENT_POLICY` | `synthetic-invalid-only` only for non-production loopback testing; `school-verified-production` only for an approved production cutover. Missing/unknown disables issuance. |
| `FAMILY_PRODUCTION_INVITATIONS_ENABLED` | Exact `true` only after every production invitation prerequisite is approved; otherwise `false`. |
| `FAMILY_EMAIL_TRANSPORT` | Exact `mailpit-local` for the non-production synthetic profile; exact `resend` for a separately approved production profile. Missing/unknown fails closed. |

Invitation issuance is a separate, narrower capability. In Phase 1 its
authorized admin control may render only when email notifications are enabled,
the short-lived invitation-issuer preflight is current, and
`FAMILY_INVITATION_RECIPIENT_POLICY=synthetic-invalid-only` in a non-production
runtime. The same server action must accept only a normalized dot-atom local
part at the exact `helpmath.invalid` domain. Unknown policy values, production,
subdomains, lookalike suffixes and every real address deny. UI readiness is
only a hint; the mutation must recheck the policy and issuer capability.
The matching `FAMILY_EMAIL_TRANSPORT=mailpit-local` candidate is also rejected
in production and is fixed to `127.0.0.1:1025`. It may close only the isolated
synthetic integration test; it is not a production notification transport,
subprocessor approval, or permission to use Resend/Internet recipients.

The production-shaped candidate is separate from Phase 1. Its administrator
control and Server Action require exact production runtime, Supabase provider
mode, Resend transport, `school-verified-production`,
`FAMILY_PRODUCTION_INVITATIONS_ENABLED=true`, the global/tenant/email gates,
the dedicated issuer configuration and a production tenant with approved
retention for every invitation/identity/link/outbox/audit data class. The
tenant issuer row must set `requires_database_session=true`. Every mapped
request is rechecked against the exact live Supabase `auth.sessions` row;
`local`, `others`, and `global` provider revocation therefore deny protected
database access immediately. Production invitation attestations bind the
administrator session, and `pending→accepted`/`pending→revoked` transitions
also require a live provider session. The disposable loopback harness verified
this shape using only fictional records and no Internet delivery. It did not
test a hosted project, real address, real Resend account/domain or real family.

`SUPABASE_SERVICE_ROLE_KEY`, invitation-issuer credentials, webhook-writer
credentials, HMAC keys, and outbox-encryption keys are separate capabilities.
None may enter the browser authentication path or substitute for the
publishable-key-plus-user-session request path.

### Redacted production-shape preflight

Run this only against the exact candidate environment before requesting any
hosted or production review:

```bash
npm run verify:family:production-config
```

The command is read-only and network-free. It emits check IDs, booleans and
requirements, never environment values. It requires the exact production
provider/feature/recipient/transport selections; a canonical HTTPS HELP Math
origin and Supabase project issuer; a cron-only service credential; fresh
externally signed ES256 invitation-issuer and webhook-writer JWT shapes;
purpose-separated cron, provider, service, HMAC and encryption secrets; the v2
keyring with legacy reads off; the independent LearningEventV2 production-
binding count; and the opt-in five-minute cron manifest.

Exit `0` means only `CONFIGURATION_READY_NOT_RELEASE_APPROVED`. The report fixes
`releaseApproved=false` and lists all remaining hosted-provider, independent
security/accessibility, privacy/legal/DPA, district, Owner, deployment and
production-verification gates. It does not validate a JWT signature or key
custody, contact Supabase/Resend/Vercel, prove a domain/webhook/scheduler, or
authorize a deployment. Exit `1` means `CONFIGURATION_NOT_READY` and must block
promotion. The current unconfigured worktree produces that fail-closed result.

## Required pre-cutover gates

Do not set `FAMILY_AUTH_PROVIDER=supabase` in any deployable environment until
all items below are evidence-bound to the exact candidate:

1. The environment, project reference, region, data mode, deployment, domain,
   callback URLs, provider settings, key inventory, operators, and rollback
   owner are named. No real account or record is used in Phase 1.
2. Supabase email confirmation is required. A Family flow that depends on an
   adult email must additionally obtain the server-verified primary email; a
   mere email string or unverified provider claim is insufficient.
3. PKCE is used for sign-up, callback, sign-in session refresh, recovery, and
   password-update flows. Callback and `next` destinations are same-origin and
   allowlisted; the authorization code/verifier, access token, refresh token,
   and recovery material do not enter application logs, HTML, analytics, or
   query parameters beyond the provider-required bounded callback exchange.
4. The exact issuer and `authenticated` audience are verified from signed
   claims. Anonymous sessions, missing/expired claims, a different project,
   wrong issuer/audience/role, malformed `session_id`, or malformed `sub` deny.
5. Synthetic `app_users` and `provider_identities` rows are created through an
   approved, auditable provisioning path. Their exact issuer is allowlisted for
   the synthetic tenant. No legacy HELP Math account/password/activity record
   is imported or used for matching.
6. Request clients use only the publishable key and the verified user access
   token. Browser and ordinary server-request modules have no service-role,
   webhook-writer, invitation-issuer, HMAC, or decryption capability.
   Any Phase 1 invitation issuer additionally uses the exact non-production
   synthetic-invalid recipient policy above. The distinct production-shaped
   path requires the complete exact configuration and approval set described
   above; local fictional verification does not authorize a real inbox or
   delivery.
7. Recovery is enumeration-safe and is dynamically tested from request through
   callback and password update. Expired, replayed, wrong-origin, and already-
   used recovery material deny without leaking account existence.
8. All three Supabase sign-out scopes are dynamically verified: `local`
   removes the current session, `others` revokes other sessions while retaining
   the current one, and `global` revokes every session. Provider-side state,
   application cookies, cached protected pages, and subsequent RPC access must
   agree. The current disposable loopback stack passed this database-enforced
   matrix, including revoked-session denial of invitation preflight and issuer
   consumption; the named hosted target must repeat it.
9. Negative authorization tests prove: signed-out redirect; unmapped identity
   denial; inactive mapping/actor/role denial; wrong role `403`; absent or
   out-of-scope resource `404`; tenant mismatch denial; revoked guardian link
   denial; and immediate post-revocation denial without a stale cache window.
10. Protected responses and redirects are private/no-store/noindex, contain no
    provider token or identifier, and do not expose a learner before the full
    relationship check succeeds.
11. A rollback deployment, provider-session revocation procedure, operator,
    incident channel, lifecycle-maintenance path, and evidence location are
    ready before cutover begins.

Static unit/type/lint/build results do not close these gates. The tests must run
against the exact Supabase project/PostgREST/auth configuration and exact
candidate deployment named in the receipt.

## Cutover procedure

1. Freeze the exact application, SQL migrations, provider settings, environment
   manifest, callback allowlist, and test identities. Record secret digests or
   secret-manager versions, never secret values.
2. Keep `FAMILY_PORTAL_ENABLED`, `FAMILY_MESSAGING_ENABLED`, and
   `FAMILY_EMAIL_NOTIFICATIONS_ENABLED` off. Confirm the retention worker and
   signed delivery-event lifecycle ingress remain independently operable where
   stored synthetic state already exists.
3. Configure the exact Supabase project, confirmation/recovery templates,
   redirect allowlist, PKCE callbacks, session policy, issuer, audience, and
   synthetic identity mappings. Disable Clerk local auth in this environment.
4. Set the issuer, audience, project URL, and publishable key. Set
   `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED=true`, then set
   `FAMILY_AUTH_PROVIDER=supabase` in one reviewed deployment change. Do not
   enable a parallel Clerk path.
5. Before enabling any Family product flag, execute the full positive and
   negative auth/identity/RPC/RLS matrix from the pre-cutover gates. Verify EN
   and ES sign-in, sign-up/confirmation, recovery/password update, local/other/
   global sign-out, session refresh, expiry, revocation, cache denial, and
   provider/database audit evidence.
6. If any result is missing, ambiguous, environment-mismatched, or stale, run
   the rollback below. A partially working provider is a failed cutover.
7. Only a separately approved release record may enable the Family portal for
   the exact synthetic audience. Enabling real families requires every real-
   family gate and a new Owner-bound deployment receipt.

## Rollback and incident procedure

Rollback is fail-closed; it never switches automatically to Clerk.

1. Disable outbound/product capabilities first:
   `FAMILY_EMAIL_NOTIFICATIONS_ENABLED=false`,
   `FAMILY_MESSAGING_ENABLED=false`, and
   `FAMILY_PORTAL_ENABLED=false`.
2. Set `FAMILY_SUPABASE_AUTH_CUTOVER_ENABLED=false` and
   `FAMILY_AUTH_PROVIDER=disabled`, then deploy the exact rollback artifact.
   Confirm all Family pages and server actions deny or return their documented
   unavailable/not-found behavior.
3. Revoke the affected Supabase sessions and refresh tokens at the provider.
   For suspected account/key/project compromise, revoke all sessions in scope,
   rotate the affected provider credential through the approved secret workflow,
   and keep the portal disabled until a new investigation-bound candidate exists.
4. Clear or invalidate application session cookies and caches through supported
   provider/application mechanisms. Prove that old access and refresh tokens,
   open tabs, cached responses, and direct PostgREST calls cannot regain access.
5. Do not disable required lifecycle closure. The bearer-protected retention
   worker must continue to process expiry/teardown, and the exact-Svix-signed
   delivery-event webhook must remain able to record bounce/complaint/
   suppression/delivery for already-sent work. Both remain least-privilege and
   neither may send new mail while outbound flags are off.
6. Preserve redacted audit and incident evidence. Do not delete provider or app
   identity rows ad hoc, extend retention anchors, restore a backup, or copy
   records into another environment to make the rollback appear clean. Follow
   the approved retention/deletion/no-resurrection process.
7. Verify signed-out, mapped-user, direct-RPC, old-token, wrong-provider,
   recovery-link, and all sign-out-scope cases after rollback. Record observed
   time, deployment ID, provider revocation result, residual state, retention
   status, and operator/reviewer decisions.

A future return to `clerk-development` is a separate, local-development change
with its own exact configuration and evidence. It is not a production rollback
target.

## Cutover/rollback receipt minimum

The immutable, secret-redacted receipt must include:

- exact commit/tree, build and deployment IDs;
- environment/data mode, project reference, issuer, audience, domain and
  callback allowlist digests;
- provider mode and every Family/product/egress switch before and after;
- database migration/schema/seed identity and identity-mapping provenance;
- synthetic account/cohort aliases only, never email, token, subject, or other
  PII/secret values;
- positive and negative test/evidence digests, including PKCE, verified email,
  recovery, session refresh, local/others/global sign-out, RPC/RLS, revoke and
  no-store checks;
- provider session-revocation and rollback/no-resurrection results;
- open findings, exceptions, expiry/teardown date, incident owner, identity/
  security reviewer, release manager, district/Privacy/Legal status, and Owner
  decision.

## Current gate state

The repository contains a candidate Supabase Auth code path and environment
contract. It is locally dynamically verified only for the exact disposable
stack described below; that is not proof of a configured hosted Supabase
project, hosted PKCE callback, recovery, refresh, provider settings, cutover,
rollback, or deployment.

A disposable loopback PostgreSQL 16.15/GoTrue 2.195/PostgREST 16.2/Mailpit 1.31
harness against the exact current 001–018 artifact proved synthetic GoTrue
signup/email verification, mapped business identity, invite acceptance, the
protected Family page and complete local product E2E. The browser flow also
proved recovery request→loopback Mailpit link→PKCE callback→password update,
old-password denial, new-password sign-in, an enumeration-safe duplicate
sign-up response and final cardinality of exactly one `auth.users` row plus one
active provider identity for the fictional adult. It separately proved the
bounded invitation-issuer and webhook-writer custom-role matrices; fictional
production-shaped create/resend; and database-enforced `local`, `others` and
`global` sign-out behavior, including denial of a revoked session and its
unconsumed invitation attestation. A real local refresh grant produced a rotated
complete session that retained the exact mapped authorization context. The
runner then globally revoked the production-shaped administrator session,
confirmed the old token was denied, restarted Next with provider/cutover/Portal/
Messaging/Email disabled and received `404` from all four Family/auth entry
paths. It did not exercise a hosted PKCE callback, hosted recovery/password
update/refresh, real delivery, hosted rollback or provider/account
configuration. It therefore does not authorize a hosted Supabase project or
real family.

Real identity cutover and all Privacy, Legal, DPA/contract, district, security,
operations, production, and Owner approvals remain **OPEN**. Until exact dynamic
evidence and the required approvals exist, keep production Family auth and all
real-family surfaces disabled.
