# Nova Tutor class policy rollout

Status: implementation candidate, 2026-09-24. A successful build does not
authorize a production deployment or any real district use.

## Effective permission

Nova is available only when the site-level `NOVA_TUTOR_ENABLED` switch, the
exact course release allowlist, a reviewed school SSO identity, the school
administrator's teacher-choice setting, and that class's teacher setting all
allow it. New schools and classes start off. A visitor, local development
account, or signed-in user without a reviewed district SSO identity cannot
grant class access. `/api/nova` repeats this check before every provider call.
The lesson interface checks class access when opened, when focused, and every
10 seconds while visible; an API denial closes it sooner. Any already delivered
provider request may complete and appears in the existing content-free request
logs. A browser close cannot retract content already sent to the provider.

## Database and identity setup

1. Create separate Neon Postgres databases for Preview and Production, scoped
   to the `helpmath-web` Vercel project. Set `NOVA_POLICY_DATABASE_URL` as a
   server-only secret in each environment. Do not copy student records from the
   legacy SQL archive.
2. Apply `apps/web/db/001_nova_class_policy.sql` to each isolated database.
   This creates the school lock, class switch, membership, version, and
   content-free change audit tables.
3. Configure a reviewed Clerk production instance with public self-registration
   disabled and district SAML/OIDC connection. Keep
   `CLERK_PRODUCTION_SSO_ENABLED=false` until the real district claims and
   sign-in/out lifecycle are tested. A production key pair and
   `NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true` are also required by the app.
4. Import roster rows only after the district confirms its stable provider
   subject, Clerk enterprise connection ID, school roles, class memberships,
   consent/retention requirements, and teacher assignment. The SSO connection
   ID may serve multiple schools; each school and class membership is explicit.
   Use an audited roster importer or
   reviewed transaction; there is deliberately no browser roster editor.
5. A school administrator may permit teacher choice in `/nova-settings`.
   This does not turn on a class. A listed teacher may then enable only their
   own class. Version conflicts require a page refresh. Disabling the school
   also disables all its classes and records both changes.

## Safe initial deployment

For the first code deployment, leave `CLERK_PRODUCTION_SSO_ENABLED=false` and
leave all school and class switches off. Keep the existing course release,
voice, and frame gates independent. A protected Preview should validate
synthetic admin, teacher, student, wrong-school, unaffiliated, revoked, and
identity/database outage cases using isolated records. Production must be
checked through the real domain for anonymous denial, course continuity in
both languages, `noindex` on settings, and no provider request after a class
denial. The first real district requires a separate SSO/roster/privacy and
teacher acceptance pass. A business switch does not prove compliance with a
state's education or privacy rules.

## Local verification

`npm run test:nova:server --workspace @helpmath/web` covers route and provider
boundaries. With a disposable local Postgres database, set
`NOVA_POLICY_TEST_DATABASE_URL` to a `127.0.0.1` Postgres URL and run
`node --conditions=react-server --import tsx --test apps/web/tests/nova-class-policy.server-test.ts`
from the repository root. The integration test creates and removes only its
synthetic school/class rows. Run web typecheck, lint, and production build
before packaging a candidate.
