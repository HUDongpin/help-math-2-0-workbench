# Promotion V2 Native Security Candidate

Status: **diagnostic-only engineering candidate**. This design has no
authoritative-original-runtime, review, strict-completion, receipt, release, or
publication effect.

## 1. Decision and evidence boundary

The candidate uses a small, standalone Darwin helper written in Swift instead
of a Node-API addon.

Reasons:

- The current workstation has Apple Swift 6.3.3 and Clang 21, but this
  repository has no `node-gyp`, CMake, or Rust build contract.
- Swift avoids adding Node ABI and native-addon lifecycle risk to the first
  candidate and provides memory-safe request decoding around the POSIX calls.
- A helper process makes crash injection and recovery testing possible without
  crashing the Node test runner.

The tradeoff is important: macOS has no `fexecve`-style execution-by-open-file
descriptor in the current SDK. A pathname-launched helper cannot by itself
prove production binary identity under adversarial executable replacement.
Therefore no compiled helper is checked into the repository, no production
launcher is provided, and every test binary is compiled into and bound to one
fresh disposable APFS root by a generated Swift configuration file. A future
production integration still needs an owner-controlled, hash-pinned and
independently reviewed installation or broker contract.

This candidate does not modify or reinterpret any existing promotion fuse.
All thirteen production fuses remain `false`; the legacy adopter remains
read-only and no writer is added to it.

## 2. Threat model

### Protected properties

The candidate attempts to preserve these properties inside one disposable
transaction root:

1. Every filesystem lookup and mutation after initial root opening is relative
   to a pinned root or descendant directory descriptor.
2. A relative path cannot escape the pinned root, traverse a symlink, or target
   an empty, dot, parent, absolute, backslash, NUL, or non-normalized component.
3. A canonical immutable object or commit becomes visible only through an
   atomic no-replace operation.
4. A replayed nonce cannot authorize a different plan.
5. Recovery may accept an already-durable byte-identical owned output, but must
   not overwrite or delete foreign drift.
6. A hard-linked canonical input or output is rejected unless a private
   transaction operation explicitly creates and verifies an owned recovery
   link.
7. A crash must leave either no visible final output or a byte-complete,
   verifiable final output plus sufficient immutable journal state for exact
   replay.

### Adversaries and failures covered by tests

- replacement or renaming of an ancestor after its directory descriptor was
  opened;
- symlink insertion in an ancestor or final component;
- an external hard link at an expected canonical target;
- two concurrent writers targeting the same immutable no-replace path;
- replay of an old nonce with a different plan;
- a forged Ed25519 fixture envelope before native execution;
- process termination after each declared durable transition;
- byte or inode drift introduced between crash and recovery;
- malformed or non-canonical relative paths;
- attempts to use a different root from the root compiled into the disposable
  helper.

### Explicitly out of scope

- hostile replacement of a future production helper binary between validation
  and pathname execution;
- a production trust root, private keys, signatures, registry/revocation
  ledger, receipt issuer, or signer transport;
- a real Shell-to-RW02 original-runtime candidate;
- human review, Owner decision, release-custodian action, or independent
  security acceptance;
- writable `source-assets`, repository reports, migration coverage, ledgers, or
  product routes;
- mutable-file compare-and-swap.

## 3. Native boundary

The helper receives exactly one JSON request on standard input and emits one
JSON result on standard output. The test build generates a companion Swift file
containing:

- the exact disposable diagnostic root;
- the exact project root that must remain disjoint from that diagnostic root;
- one ephemeral Ed25519 diagnostic public key;
- `promotionV2ProductionEnabled = false`.

Every diagnostic batch also carries the exact signed plan and signature. The
JavaScript boundary will construct a native request only from an envelope it
verified in the same process, and only when the canonical operation-array hash,
root device/inode, and plan fields match. The native helper independently
verifies the signature against the compiled ephemeral key and recomputes the
canonical operation-array hash before applying ordinal 1. This is a diagnostic
binding only; it is not a production trust root or signer registry.

At startup the helper:

1. requires Darwin and the generated diagnostic-only configuration;
2. resolves the requested root and requires exact equality with the compiled
   root;
3. rejects a root equal to, containing, or contained by the project root;
4. opens the root with `O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY`;
5. validates the caller-bound root device and inode with `fstat`;
6. retains the root descriptor until the request finishes.

For every relative operation, each directory component is opened one at a time
with `openat`, `O_DIRECTORY`, `O_NOFOLLOW_ANY`, and `O_RESOLVE_BENEATH`.
Descriptors remain open until the operation completes. Final identities use
`fstatat` with `AT_SYMLINK_NOFOLLOW_ANY | AT_RESOLVE_BENEATH`.

The primitive operation set is deliberately small:

- `mkdir-no-replace` via `mkdirat`;
- `publish-file-no-replace` via a same-directory `openat(O_CREAT|O_EXCL)`
  staging file, file sync, and `renameatx_np(RENAME_EXCL |
  RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH)`;
- `link-owned-no-replace` via `linkat` after source identity validation, for a
  private recovery link only;
- `unlink-owned` via `unlinkat` after descriptor-relative device/inode
  pre-validation (diagnostic only; see the atomicity limitation below);
- `inspect-file` via descriptor-relative open/read/fstat without mutation.

There is no generic shell command, arbitrary executable hook, callback, or
pathname fallback.

## 4. Immutable coverage and commit protocol

Darwin does not expose a kernel operation that atomically says “replace this
pathname only if it still has these exact bytes and this inode.” A
swap-then-inspect sequence is not CAS because foreign bytes become visible and
rollback can overwrite another writer.

Promotion V2 therefore does not replace coverage in place. The candidate uses:

```text
objects/sha256/<content-sha256>
nonces/<nonce-sha256>.json
transactions/<transaction-id>/journal/<sequence>-<record-sha256>.json
commits/<sequence>-<commit-sha256>.json
```

- Objects, nonce reservations, journal records, and commits are immutable and
  created no-replace.
- A commit binds the prior commit hash, plan hash, nonce hash, object hash, and
  exact intended logical coverage identity.
- Readers must accept only a contiguous, signature-verified commit chain and
  content-addressed object; no mutable `current.json` pointer is authoritative.
- Concurrent writers for the same sequence race on `RENAME_EXCL`; exactly one
  may win. A loser must re-read the winning commit and never overwrite it.
- Recovery replays the same hash-bound plan. Byte-identical existing outputs
  are accepted as already durable; any different bytes, mode, link count, or
  identity are foreign drift and stop recovery.

This is a schema/design candidate only. Existing coverage readers and ledgers
are not changed in this work item.

## 5. Durability contract

For a file publication the helper must:

1. write all bytes to a same-directory exclusive staging file;
2. apply the declared mode;
3. require both `fsync` and `F_FULLFSYNC` on the staging file;
4. publish with `renameatx_np(..., RENAME_EXCL | RENAME_NOFOLLOW_ANY |
   RENAME_RESOLVE_BENEATH)`;
5. open and revalidate the final file as regular, single-link, byte-identical,
   and mode-identical;
6. call `fsync` on the containing directory.

If the exact APFS/runtime combination does not support a required sync or flag,
the helper must fail closed and the limitation must remain an open production
blocker.

Darwin provides no conditional `unlinkat` by expected inode. Therefore a failed
pre-publication operation deliberately retains its random, transaction-owned
staging leaf instead of attempting a pathname cleanup that could delete a
swapped foreign inode. Successful `renameatx_np` publication consumes the leaf.
The retained diagnostic leaf is removed only with the enclosing disposable test
root after that root's realpath, device, inode, type, parent, and prefix are
revalidated.

## 6. Test and promotion boundary

The focused Node test compiles the helper only inside a newly created
`/Volumes/WestWorld/.codex-help-math-promotion-v2-native-tests-*` directory,
executes the adversarial matrix there, and removes that one explicit directory
afterward. Cleanup revalidates the captured directory realpath, device, inode,
type, parent, and prefix before recursive removal. Fixture keys and signatures
are ephemeral and establish no production identity.

Passing tests may establish only that the isolated candidate behaved as
specified on the recorded Darwin/APFS toolchain. It does not permit changing a
production fuse. Before any production writer can exist, the exact source,
compiled binary, build receipt, external trust adapter, real candidate, and
adversarial results require independent security review.

### G5 L4 generic-readiness child binding

The G5 L4 invocation of
`scripts/build-lesson-promotion-security-readiness.mjs` binds this candidate as
an explicit child only. It hashes the JavaScript boundary, Swift source, this
document, and the focused test; runs the 13-test Darwin/APFS group separately
from the 209-test generic promotion foundation; and reports the combined
222-test result. The child appears under both
`sourceBindings.diagnosticCandidates.promotionV2DarwinNativeSecurity` and
`diagnosticCandidates.promotionV2DarwinNativeSecurity`.

That binding is release-scoped to G5 L4. The G5 L5 generic report does not
silently inherit it. The child state remains
`diagnostic-only-engineering-candidate`; its production, executor, write, and
integration flags remain false, and its authority, original-runtime, review,
strict-completion, release, and publication effects remain `none`. A passing
generic report therefore records current candidate bytes and tests only. It
does not install or retain a helper, connect a production executor, open a
promotion fuse, or authorize evidence promotion.

## 7. Observed diagnostic result and unresolved Darwin semantics

On 2026-08-01, the focused test compiled the helper with Apple Swift 6.3.3 for
arm64 macOS 26 and passed 13/13 subtests on a fresh APFS directory. The test
observed successful file `fsync`, `F_FULLFSYNC`, directory `fsync`, and the
declared resolve/no-follow/no-replace flags on that exact host. It removed the
compiled helper and test root afterward. This is local diagnostic evidence,
not an immutable receipt or an independent review.

The following gaps remain production blockers:

1. The current macOS SDK does not provide an `fexecve` equivalent. A helper
   selected by pathname cannot prove its own executable identity against a
   hostile replacement between validation and launch.
2. Darwin does not provide an atomic “unlink this leaf only if its inode still
   equals X” operation. `unlink-owned` pins and validates the parent and checks
   the leaf without following symlinks, but a writer that can mutate that same
   parent can replace the leaf between `fstatat` and `unlinkat`. It is not a
   production-safe conditional delete under hostile concurrent mutation.
3. `mkdirat` does not return the created directory descriptor, and Darwin
   `linkat` has no source-file-descriptor form equivalent to Linux
   `AT_EMPTY_PATH`. Post-validation fails closed on observed drift, but an
   independently authorized hostile writer in the same parent directory can
   still create a leaf race. Production must provide a single-writer broker or
   stronger directory authority, or omit these primitives.
4. The APFS durability observations are specific to the recorded OS,
   filesystem, and hardware. Other Darwin/APFS releases require their own
   compatibility matrix and power-loss testing.
5. The helper's Foundation JSON parser is sufficient for generated diagnostic
   requests but is not a canonical signed-wire parser with duplicate-key
   rejection. A future production boundary must use a hash-bound typed message
   delivered over protected IPC after signature and executable-identity
   verification.
6. The helper verifies one ephemeral, diagnostic signed plan and its exact
   operation-array hash. It does not establish the production signed typed DAG,
   durable nonce authority, trust registry, commit-chain reader, or real
   candidate transaction required by the promotion plan.
