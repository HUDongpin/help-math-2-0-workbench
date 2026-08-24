# Family Portal real-family release receipt

Status: **Verifier implemented; no real-family receipt, trust roots, approval or production evidence exists**

This contract is the final machine-checkable boundary for the fifteen
`FP-R00` through `FP-R14` real-family gates. It does not generate an approval,
sign for a reviewer, create a deployment or contact an external provider. The
inputs must come from the separately authorized Owner, legal/privacy, district,
security, accessibility, operations and production-verification processes.

## Command

Run from the exact clean candidate checkout:

```bash
npm run verify:family:real-release-receipt -- \
  --receipt /approved/private/family-real-release-receipt.json \
  --evidence-root /approved/private/family-release-evidence \
  --trust-roots /approved/private/family-release-trust-roots.json
```

All three paths are mandatory. The actual receipt, evidence, reviewer
identities and trust roots must remain outside ordinary Git, browser bundles,
Vercel build output and application logs. Missing/unknown arguments, an
unreadable file, malformed JSON, a dirty worktree or any failed gate exits `1`
with `REAL_FAMILY_RELEASE_RECEIPT_INVALID`.

The independently controlled release environment must also inject
`FAMILY_REAL_RELEASE_TRUST_ROOTS_SHA256`, the SHA-256 of the exact trust-root
file bytes. A caller-selected trust-root file without that separate binding is
rejected, even when its self-issued signatures are mathematically valid.

The current worktree has no externally issued receipt or trust-root set and is
not a clean authorized release artifact. The no-argument command therefore
correctly exits `1`. Do not create placeholder signatures merely to make it
green.

## Exact receipt contract

The top-level schema is
`help-math-family-real-release-receipt/v1`. Unknown fields fail closed. It
contains only these sections:

- `receiptId`: opaque UUID.
- `issuedAt` and `expiresAt`: exact ISO timestamps; the receipt may not be
  future-issued and may live no longer than 30 days.
- `environment`: canonical HTTPS HELP Math `siteOrigin`, Supabase project ref,
  Vercel project ID, verified HELP Math Resend domain and opaque tenant UUID.
- `artifact`: exact 40-hex Git commit, migration-manifest SHA-256,
  production-configuration-report SHA-256, deployment ID and the prerequisite
  `CONFIGURATION_READY_NOT_RELEASE_APPROVED` disposition.
- `productionChecks`: the ten exact booleans below, all `true`.
- `evidence`: exactly one root-relative regular-file path and SHA-256 for every
  `FP-R00` through `FP-R14` gate.
- `signatures`: exactly one Ed25519 signature for every gate, over the same
  canonical receipt payload with the signature array excluded.

The verifier also obtains the current commit and worktree state directly from
Git. A matching commit in a dirty checkout is rejected. This prevents a valid
receipt for one reviewed artifact from authorizing unreviewed local edits.
The declared migration-manifest and production-configuration-report digests
must each equal one of the fifteen evidence-file digests; a signed but absent
artifact report is rejected.
The production-configuration evidence is parsed as the exact redacted report
schema: every check must pass, configuration readiness must be true, the
disposition must remain `CONFIGURATION_READY_NOT_RELEASE_APPROVED`, release
approval and secret inclusion must remain false, and `checkedAt` must be no
more than 24 hours before receipt issuance. Fifteen evidence paths and digests
must be unique; one document cannot silently stand in for several gates.

## Required production checks

All checks must be bound to the exact deployment and evidence set:

1. `guardianInviteVerified`
2. `guardianAccessVerified`
3. `twoWayMessageVerified`
4. `notificationEmailVerified`
5. `revokeImmediateVerified`
6. `crossTenantDenied`
7. `crossChildDenied`
8. `retentionDeletionVerified`
9. `restoreNoResurrectionVerified`
10. `rollbackVerified`

These booleans are signed claims, not self-sufficient proof. Each associated
raw report, screenshot, provider receipt, test trace, approval or audit must be
present under the external evidence root and match its recorded SHA-256.

## Evidence and path safety

- The evidence root must resolve to a directory.
- Evidence references are normalized relative paths only. Absolute paths,
  `..`, backslashes, NUL, path escape and normalization aliases are rejected.
- Every evidence object must be a regular non-symlink file no larger than 64
  MiB and remain inside the resolved evidence root.
- Every file is re-read and SHA-256 verified. The verifier never prints its
  path, bytes, identity, signature or key.
- The receipt and trust-root JSON files are bounded to 256 KiB each.

Private legal/DPA/district/personnel material must remain in its approved
restricted store. The verifier consumes only local, explicitly supplied files;
it never copies them into the repository.

## Trust-root and reviewer separation

The trust-root schema is
`help-math-family-real-release-trust-roots/v1`. It contains exactly one bounded
Ed25519 SPKI public key binding for each of the fifteen gates. Key IDs and gate
bindings must be unique.

At minimum these five accountable decisions must use distinct public-key
fingerprints:

- `FP-R00`: Owner real-family scope.
- `FP-R02`: qualified legal basis and child/family terms.
- `FP-R04`: target district authorization.
- `FP-R09`: independent security assurance.
- `FP-R10`: independent accessibility/language/human UAT.

Every other gate still requires its own gate-bound signature; a trust-root
custodian may deliberately assign the same operations authority to more than
one operational gate, but cannot omit a gate or substitute an untrusted key.
Trust-root provisioning, revocation and custody are external security actions
and must themselves be included in the release evidence. The exact file must
match the independently injected `FAMILY_REAL_RELEASE_TRUST_ROOTS_SHA256`.

## Result semantics

`REAL_FAMILY_RELEASE_RECEIPT_VALID` means only that the supplied external
receipt is current, schema-valid, evidence-hash-valid, signature-valid and
bound to the exact clean Git artifact. It is the technical witness for the
already-completed external decisions; the verifier is not the source of those
decisions and does not deploy anything.

`REAL_FAMILY_RELEASE_RECEIPT_INVALID` means no real-family completion or
production claim may be made. The output contains only check IDs, booleans,
requirements, disposition and `secretValuesIncluded=false`.

This Family receipt never sets or reinterprets Flash source custody,
Current-JS registration, My Lesson integration, original-runtime or visual
fidelity, audio, migration human/Owner review, strict completion, Lesson
release or curriculum publication.
