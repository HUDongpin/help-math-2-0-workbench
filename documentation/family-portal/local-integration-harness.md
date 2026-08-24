# Family portal local integration harness

The repository includes a fail-closed, loopback-only integration verifier for
the Family Portal database and its local gateway boundary:

```bash
npm run verify:family:local-integration:source
npm run verify:family:local-integration:preflight
npm run verify:family:local-integration
npm run verify:family:product-e2e
```

Current evidence boundary (2026-08-24): product-E2E mode passed against the
exact current 001–018 migration set and synthetic seed. The run applied all 18
migrations, completed the 489/489 pgTAP plan, required RLS on all 38 public
tables, exercised the loopback HTTP, custom-role, Mailpit, dual-tenant and
two-backend concurrency checks described below, ran the protected browser
product journey, and completed owned-resource cleanup. This is local candidate
evidence only; it does not close any hosted or production boundary listed below.

The verifier never downloads a dependency, contacts a hosted Supabase project,
uses Docker, or reads a real credential. It discovers every canonical SQL file
currently present in `supabase/migrations/` in lexicographic order, so a newly
frozen migration is included without changing a hard-coded migration count.

## Modes

| Command | What it verifies | Starts services |
|---|---|---:|
| `npm run verify:family:local-integration:source` | Migration naming/order, required security symbols, fictional synthetic seed boundary, pgTAP plan/finish, local config and gateway inputs | No |
| `npm run verify:family:local-integration:preflight` | Source checks, installed binary/version checks, pgTAP extension availability, and seven unique ephemeral loopback port reservations | No |
| `npm run verify:family:local-integration` | Everything below against a new isolated local stack | Yes |
| `npm run verify:family:product-e2e` | Full local verification plus Next.js and the protected browser invite→verify→Family→two-way-message→Mailpit→governance/support-redaction→revoke/deny flow | Yes |

The source-only mode is a fast contract check. It is not evidence that SQL
parses, migrations apply, pgTAP passes, or an HTTP authorization boundary
works. The preflight mode likewise proves dependency availability, not runtime
behavior.

## Installed prerequisites

The full and preflight modes require these existing local executables:

- Node.js 22 or newer;
- PostgreSQL 16 `initdb`, `pg_ctl`, `pg_config`, `pg_dump`, `pg_restore`, and
  `psql`;
- the pgTAP extension installed in the PostgreSQL 16 shared extension folder;
- PostgREST;
- GoTrue;
- Mailpit.

Run the full mode only on a trusted, single-user development machine. Its
throwaway PostgreSQL cluster uses trust authentication on an undisclosed
ephemeral loopback port, and its Mailpit SMTP listener is likewise a temporary
local test service. Loopback binding is not an isolation boundary against other
processes running as the same local user.

GoTrue is resolved from `FAMILY_LOCAL_GOTRUE_BIN`, then `PATH`, then the
existing repository-local `.cache/gotrue/auth` binary. The override is a binary
path, not a credential. No other Family Portal application secret is consumed
from the caller environment. Missing or incompatible dependencies stop the
run before any local service is started.

For example, when GoTrue is installed outside `PATH`:

```bash
FAMILY_LOCAL_GOTRUE_BIN=/absolute/path/to/gotrue \
  npm run verify:family:local-integration:preflight
```

## Full verification profile

Each full run:

1. creates a mode-restricted directory with `mkdtemp` under the operating
   system temporary directory;
2. reserves fresh loopback ports and initializes a PostgreSQL 16 cluster that
   listens only on `127.0.0.1` plus a socket inside that temporary directory;
3. creates only the local Supabase-compatible roles and `auth` schema needed by
   the migrations;
4. applies all discovered migrations to the empty database, loads
   `supabase/seed.sql`, and requires the complete pgTAP plan to pass;
5. generates one-run HS256 signing material, an in-memory symmetric JWK,
   synthetic API key, SMTP password, signup password, issuer JWTs, and webhook
   writer JWTs;
6. starts fresh loopback PostgREST, GoTrue, Mailpit, and the repository's local
   gateway on the reserved ports;
7. proves a standalone synthetic GoTrue signup reaches Mailpit exactly once;
8. submits 21 unknown invitation-token acceptance probes through real
   PostgREST HTTP under one synthetic signed provider identity, requires all
   responses to retain the same `200`/empty-array shape, and proves the fixed
   20-per-10-minute plus 100-per-day database counters stop at `40` total bucket
   increments without storing the token, email, raw issuer or raw subject;
9. exercises the invitation issuer over real HTTP: authenticated admin
   preflight, dedicated-role create/resend, and anon, authenticated,
   `service_role`, wrong-role, wrong-issuer, wrong-purpose, wrong-audience,
   table, and cross-RPC denials;
10. exercises the webhook writer over real HTTP: one delivery event and outbox
   transition, plus anon, authenticated, `service_role`, wrong-audience, table,
   and cross-RPC denials;
11. queries the PostgreSQL catalog to require zero table/sequence privileges
    and only the intended two issuer functions and one writer function;
12. verifies the same signed app identity can select each of two synthetic
    tenants without merging children, messages, or workspace state;
13. holds the learner row lock from one PostgreSQL backend while issuing one
    HTTP ingest request and one HTTP projection-rebuild request through the
    single local PostgREST instance, observes two distinct active PostgreSQL
    backends coordinated by that same student-row lock, then checks the stored
    event, projection evidence count, stale state, and deterministic event
    watermark;
14. races two distinct HTTP ingest requests on two PostgreSQL backends and
    checks the deterministic projection result;
15. terminalizes the staffed fictional Maple tenant, deletes an expired
    governance record through the service-only retention path, takes one
    mode-`0600` custom-format logical backup, restores it into two empty
    databases, and requires both restored catalogs to retain 38/38 RLS and the
    exact closed/expired/revoked/deleted state. The run records local backup
    bytes and elapsed milliseconds without promoting them to production RPO or
    RTO;
16. in `--product-e2e` mode, starts Next.js with the exact local Supabase-auth,
    dedicated issuer, synthetic-recipient and loopback-Mailpit configuration;
    signs an administrator in, issues an invitation, processes the outbox,
    signs the adult up and verifies the email, accepts the invitation, opens
    the protected Family workspace, signs that adult out, performs the complete
    Mailpit recovery-link→PKCE callback→password-update flow, denies the old
    password, proves duplicate sign-up retains the generic response and exactly
    one authoritative identity, then re-enters Family with the new password;
    enables a message notification, exchanges persisted guardian and teacher
    messages, captures the reminder, submits and reviews a guardian rights
    request and teacher suggestion, completes a two-person 15-minute exact-
    thread support approval and redaction, verifies the guardian tombstone,
    revokes the relationship, and proves the old Family URL returns `404`;
17. refreshes a production-shaped GoTrue session and proves the rotated access
    token still reaches the mapped authorization context; after product E2E,
    globally revokes that session, proves the old token fails at the database
    boundary, stops the product Next process, restarts Next with provider,
    cutover, Portal, Messaging and Email all disabled, and requires `/family`,
    `/sign-in`, `/auth/callback` and `/api/auth/session` to return `404`;
18. stops only the child processes and temporary PostgreSQL cluster created by
    that run, deletes the validated temporary directory, and discards the
    generated secrets.

The runner passes a small allowlist of non-secret environment variables to
children rather than inheriting the application's environment, and starts the
local services from the isolated temporary directory rather than an
application directory that may contain an `.env` file. It does not reuse or
stop any repository `.cache` service and does not bind a fixed project port.
JWTs, signing material, passwords, and email content are not printed. Command
output is bounded and error details are redacted.

`SIGINT` and `SIGTERM` enter the same cleanup path. An uncatchable `SIGKILL` or
machine failure can leave only that run's temporary directory and local child
processes; investigate the unique `hm-fp-*` temporary path and process start
time before performing any manual cleanup. The intentionally short prefix
keeps the PostgreSQL Unix-domain socket below macOS's path-length limit; it
does not weaken the canonical-path, directory-mode, or recursive-delete checks.

## Evidence boundary

A green full run is evidence for the exact local, loopback, synthetic stack and
the repository bytes used by that run. It is not evidence for:

- a hosted Supabase migration or hosted asymmetric/JWKS gateway behavior;
- Vercel environment wiring, scheduler execution, or production rollback;
- production Resend delivery, webhook signing, suppression, or key rotation;
- any real-family tenant, address, learner record, or legal/retention approval;
- a hosted or production Family invite-to-message-to-email-to-revoke journey.

The two logical restores are bounded local recovery evidence for the exact
snapshot and migration bytes. They do not prove Supabase-managed backup
configuration, point-in-time recovery, off-site encryption/key custody,
external provider/cache/log deletion, a production dataset size, or an
operations-approved RPO/RTO.

The default `--full` GoTrue signup-to-Mailpit check proves only local auth SMTP
plumbing. `--product-e2e` additionally runs the Next.js invitation action,
application encryption keyring, email renderer and transport adapter, browser
UI, two-way persisted message flow and revoke denial end to end. That still
proves only the exact isolated synthetic stack; it does not authorize a hosted
provider, an external recipient, real PII or a real-family release.

For the webhook writer, this local profile verifies the HS256 signature and
`aud` at PostgREST and the exact dedicated `role` inside the RPC. The current
RPC has no independent writer-issuer allowlist, so the report does not claim a
separate SQL `iss` check. The invitation issuer is different: its SQL contract
does check the tenant-bound issuer configuration, role, subject, purpose,
audience, lifetime, and one-use `jti`.
