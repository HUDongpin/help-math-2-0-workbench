# EvidenceReceiptV1

`EvidenceReceiptV1` is the public, hash-only receipt produced by the final
promotion transaction for one HELP Math Lesson release. Its schema is
`schemas/evidence-receipt-v1.schema.json`.

The receipt is an output of the final Owner-promotion transaction. It is not a
substitute for original-runtime evidence, reviewer decisions, Owner acceptance,
or the production promotion bundle. Those artifacts remain private and the
receipt binds only their SHA-256 digests.

## Issuance gate

The repository now contains a fail-closed, write-free structural-preflight
foundation pinned to the current 55-member G5 L4 release definition. It checks
the internal consistency of a caller-supplied snapshot supplied as one exact
canonical-JSON primitive string, with a primitive canonical time value, and
prepares a frozen, hash-only descriptor for an independent external workflow.
Caller-owned objects, accessors, Proxies, Dates, callbacks, and capability
objects are not accepted. The release-authority subject is constrained to an
opaque public identifier and only its SHA-256 digest leaves the parser. It does not prove
that commands ran, authenticate the caller, validate an external trust root,
invoke a callback, load a key, create a payload or signature, issue a receipt,
write a file, change strict completion, or publish a release. The production
issuer remains absent and its write fuse remains closed.

Do not issue a receipt unless all of these statements are true for the exact
release definition and commit:

1. Every declared release member is `strictComplete`.
2. The Lesson release ledger records the exact release as technically eligible
   with `publishedCount = 1`; this is a 55/55 atomic-completeness witness, not
   proof that learner-facing routes are already open.
3. Exact source, renderer registry, completion ledger, release ledger, review,
   Owner decision, and promotion bundle hashes are current.
4. Every recorded validation command exited successfully.
5. The production promotion protocol has authenticated and authorized the
   release authority and checked current revocation state.

For `lesson-g05-l04-number-lines`, this means 55/55 strict members and 1/1 in
the technical Lesson release ledger. No receipt is created while the release is
at 0–54 strict members.

After issuance, learner-facing publication remains a separate fail-closed
decision. The application must validate the current receipt through an
externally anchored trust adapter and confirm accepted Controlled Preview,
Staged, and Owner-promotion decisions before opening any route. The current
application intentionally has no production trust adapter and therefore keeps
all such routes closed.

## Fail-closed bindings

The signed payload binds:

- the Git commit;
- release definition and source manifest;
- renderer registry;
- global completion ledger and Lesson release ledger;
- runner, tool, command, input, and output hashes;
- strict validator, review decision, Owner decision, and production promotion
  bundle;
- an invalidation set covering source, renderer, release definition, ledgers,
  candidate evidence, review, Owner decision, and promotion bundle.

The invalidation policy is `exact-hash-drift-closes-release-v1`. Runtime and CI
must compare the receipt to independently recomputed current hashes. A stored
`published` flag never overrides a mismatch.

## Public-data boundary

The receipt may contain logical identifiers, counts, timestamps, versions,
byte counts, and hashes. It must not contain raw frames, raw audio, workstation
paths, contact information, student data, credentials, tokens, or other
secrets. Commands use normalized public arguments rather than private absolute
paths.

The repository may retain the validated public receipt. Full-frame captures,
audio, runtime host trees, trust-root material, and private review evidence stay
outside Git and deployments.

## Verification

Run the verifier with a caller-pinned Ed25519 public key and independently
computed current hashes:

```bash
node scripts/verify-evidence-receipt-v1.mjs \
  --receipt <receipt.json> \
  --public-key <release-authority-ed25519.pem> \
  --expected-commit <git-sha> \
  --expected-release-definition <sha256> \
  --expected-source-manifest <sha256> \
  --expected-renderer-registry <sha256> \
  --expected-completion-ledger <sha256> \
  --expected-release-ledger <sha256>
```

The verifier checks shape, internal hash relationships, privacy assertions,
expiry, exact current bindings, and Ed25519 integrity. It deliberately does not
decide whether the supplied key is an authorized, unrevoked production release
authority. That decision belongs to the externally anchored promotion trust
protocol.

There is intentionally no receipt-signing CLI in this repository. Tests use
ephemeral fixture keys only. The structural-preflight foundation accepts no
private key, callback, acknowledgement, receipt object, or signature-bearing
material. Production signing and external command/trust verification must
remain inside the reviewed promotion integration after its trust, nonce,
transaction, path-race, recovery, real-candidate, and
independent-security-review gates are closed.
