# G4 L10 Native Helper v2.12 Security Contract Successor

Status: frozen successor specification for independent read-only contract
review only. No Gate-A pass, evidence-freeze transition, production-helper
implementation, helper test, helper execution, apply, recover, installation,
original-runtime launch, acceptance, promotion, integration, release, or
publication authority exists.

## 0. Direct lineage and scope of replacement

This document is the sole direct no-clobber successor to:

```text
path=docs/G4_L10_NATIVE_HELPER_V2_11_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256=407723a424919f667dc21c9338084dc5a5c9134155eabbb0de1fdfe7d8d7af13
bytes=39389
LF-count=747
mode=0444
```

The v2.11 target was independently reviewed by one schema/field unit, one
adversarial wire/publication unit, and one whole-contract/lineage unit. Their
document-level results were respectively `0/10/0`, `0/4/0`, and `0/7/0`.
Alias consolidation yields the twelve canonical v2.11 rows in Section 2. The
separate operational row
`V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED` remains open and is not a
thirteenth v2.11 specification finding.

The production-helper contract lineage remains rooted in these exact objects:

```text
v2   77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
v2.1 170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab
v2.2 d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c
v2.3 bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320
v2.4 28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9
v2.5 5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce
v2.6 3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a
```

All v2 through v2.6 production rules remain normative as successively amended;
a later explicit replacement controls an earlier conflicting clause. The
retained production surface includes the complete
canonical authority schemas, diagnostic and rollback registries, request
transport, loaded-helper self-identity, custody grammar, production xattr
policy, direction-1, S64 sites and encoding, journal and recovery rules,
resource bounds, evidence DAG, mutation suite, Gate-B, and no-authority rules.
V2.12 changes no production field, tag, type, registry, request, response,
filesystem, journal, rollback, recovery, or installation behavior.

V2.12 instead completely replaces and retires the repository-local Gate-A
generator/verifier/controller/publication mechanisms introduced by v2.7
through v2.11. The retired mechanisms may remain as historical evidence but
cannot authorize implementation. This replacement is intentionally narrower
than repairing HMG4XA1, HMG4ACL1, HMG4LF2, HMG4DP2, HMG4GAT2, HMG4GS1,
HMG4GA2, or HMG4GC1: none of those objects exists in the v2.12 authority path.

## 1. Exact HMG4GL2 historical finding ledger

The v2.12 historical ledger contains exactly 52 unique rows. Its canonical
preimage is exactly the ASCII bytes between the following code fences, not the
fences: each row is `priority`, one ASCII space, canonical ID, and one LF. Row
order is the displayed historical order. There is a final LF, no CR, no blank
row, no trailing space, and no sorting or normalization step.

```text
P1 GATE-A-A1-ABI-BINDING-ROW-COUNT
P1 GATE-A-A2-HELPER-KIND48-COMPLETE-PREIMAGE
P1 GATE-A-A3-PARENT-PIPE-ENDPOINT-CLOSURE
P1 GATE-A-A4-ABI-PROSE-CFDATACREATE
P1 GATE-A-A5-PIPE-ENDPOINT-FIELD-SITE-CLOSURE
P1 GATE-A-A6-CHILD-ONONBLOCK-TYPED-PREIMAGE
P1 GATE-A-B1-INSTALL-PREREQUISITE-PREIMAGES
P1 GATE-A-B2-Q2-PROFILE2-INSTALL-BIRTH-MAPPING
P1 GATE-A-B3-INSTALL-PHASE1-CROSS-OBSERVATION-EQUALITY
P1 GATE-A-B4-INSTALL-INTERVAL-PHASE1-BOUNDARY
P1 GATE-A-C1-TYPE18-FUTURE-INODE-PRECOMMITMENT
P1 GATE-A-C2-RECOVERY-MANUAL-DISPOSITION4-MATRIX
P1 GATE-A-W1-KIND191-CANONICAL-PREIMAGE-FRAMING
P1 GATE-A-W2-MANUAL-CLASSIFICATION-VECTOR-CONSISTENCY
P1 GATE-P1-V22-GATEA-COMPANION-STILL-V21
P1 GATE-P1-V22-PIDLISTFDS-AMENDMENT-NOT-GLOBAL
P1 GATE-P1-V22-PREDECESSOR-SHA-DOMAIN-AMBIGUOUS
P1 GATE-P1-V23-FIXTURE-STABLE-PASS-IMPOSSIBLE
P1 GATE-P1-V23-PIDLISTFDS-RETRY-BUDGET-SPLIT
P1 GATE-P1-V23-RAW-AGGREGATE-SERIALIZATION-CONFLICT
P1 GATE-P1-V23-RETRY-PROJECTION-ORDER-UNDEFINED
P1 V23-S64-TLV-ENCODING-UNDEFINED
P1 V23-GLOBAL-TAG-TYPE-REGISTRY-NOT-FROZEN
P1 V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES
P1 V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS
P2 V23-DIRECT-PREDECESSOR-TYPE-LINEAGE-STALE
P2 V25-REGRESSION-OMISSION-CARDINALITY-EXCLUDES-XATTR
P1 V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS
P1 V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED
P1 V28-GATE-A-PREPUBLICATION-VERIFIER-BINDING-UNDEFINED
P1 V29-LIVE-FREEZE-PUBLICATION-TOCTOU
P1 V29-COMPANION-PARENT-LOOKUP-TOCTOU
P1 V29-VERIFIER-APPROVAL-GRAMMAR-PROVENANCE-UNDEFINED
P1 V210-HMG4LF1-CANONICAL-ROW-GRAMMAR-UNDEFINED
P1 V210-DIRECTORY-ACL-XATTR-WRITE-FREEZE-UNBOUND
P1 V210-DOCS-MEMBERSHIP-CTIME-TRANSITION-CONTRADICTION
P1 V210-TRANSIENT-NAMESPACE-DRIFT-NOT-CONTINUOUSLY-OBSERVED
P1 V210-HMG4GAT1-GRAMMAR-AND-GENERATOR-BOOTSTRAP-UNDEFINED
P1 V210-DIRECT-CHILD-EXECUTION-IDENTITY-UNBOUND
P1 V210-POSTPUBLICATION-PASS-RESULT-NOT-DURABLY-BOUND
P1 V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED
P1 V211-ACL-XATTR-CANONICAL-STATE-AND-BOUND-CONTRADICTIONS
P1 V211-DIRECTORY-EFFECTIVE-NAMESPACE-ACCESS-PROBE-UNDEFINED
P1 V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT
P1 V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED
P1 V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP
P1 V211-HMG4GAT2-PATH-ROW-AND-PIPE-GRAMMAR-INCOMPLETE
P1 V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED
P1 V211-HMG4GA2-CONTRACT-IDENTITY-AMBIGUOUS
P1 V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND
P1 V211-HISTORICAL-FINDING-LEDGER-HASH-UNBOUND
P1 V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND
```

The exact preimage identity is:

```text
domain-prefix-hex=48 4d 47 34 47 4c 32 0a
domain-prefix-semantics=seven ASCII bytes HMG4GL2 followed by one LF
ledger-row-count=52
ledger-bytes=2526
ledger-only-SHA-256=cb93173865ec7b2e3cf6bbfec02d0e366c6d18117144e6bab72168919dbed54a
domain-bound-SHA-256=02e133cd09930ba275d17f6b5f3e480906bbd1d3e5dd09a658e1367a0e99380c
```

The displayed SHA-256 is over the 2526 ledger bytes only. A domain-bound use
must hash the exact eight-byte prefix above followed by those exact ledger bytes.
Reviewers must recompute the row count, uniqueness, byte length, ledger-only
digest, and domain-bound digest directly. A substituted, duplicated, omitted,
reordered, re-prioritized, normalized, CRLF, or non-ASCII row fails.

The ledger records historical accountability, not current open status. Current
disposition is determined only by the frozen contract lineage, the current
review findings, and the operational boundary below. In particular, the V28
evidence-preservation row remains open until a separately authorized and
independently verified transition occurs.

## 2. Canonical v2.11 finding union and v2.12 disposition

The twelve v2.11 rows are canonical. Reviewer-local aliases map to them but do
not add rows.

### 2.1 Binary magics

`V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED` covers every v2.11 seven-character
magic allocated in an eight-byte field, including alternate eighth-octet and
shifted-offset interpretations.

Disposition: HMG4XA1, HMG4LF2, HMG4DP2, HMG4GS1, HMG4GA2, and HMG4GC1 are
retired and forbidden as v2.12 authority objects. V2.12 introduces no binary
Gate-A magic, parser, encoder, offset table, or local approval object. Accepting
any retired object as authority is itself a new P1.

### 2.2 ACL/xattr bounds and effective namespace access

`V211-ACL-XATTR-CANONICAL-STATE-AND-BOUND-CONTRADICTIONS` covers status/count
bijections and the conflicting 16 MiB object, 16 MiB value, and 32 MiB
aggregate limits.

`V211-DIRECTORY-EFFECTIVE-NAMESPACE-ACCESS-PROBE-UNDEFINED` covers the absent
Darwin API, credentials, vnode/ACL right registry, allow/deny evaluation,
flags, errno, and aggregation grammar behind the one-bit access results.

Disposition: no v2.12 review authority depends on a locally encoded ACL, xattr,
or effective-access projection. A future evidence-freeze transition must be
separately owner-authorized and independently observed as Section 5 specifies;
it cannot be performed or approved by a Gate-A program. The production HMG4Y2
xattr policy from v2.5 remains unchanged and is not replaced by this review
rule.

### 2.3 Docs transition, new inodes, and interval continuity

`V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT` covers the inherited row
length, missing docs role, deleted digest, missing mtime, and ambiguous nested
ACL/xattr placement.

`V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED` covers prepublication
hashes that depend on future filesystem-assigned inodes without a literal
sentinel and closed predicate.

`V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP` covers transient docs
mutations hidden between endpoint projections while docs is excluded from the
watcher.

Disposition: v2.12 creates no review leaf, companion, receipt, candidate,
status file, tool manifest, or Gate-A evidence in `docs` or any other workspace
directory. Therefore it has no future-inode projection and no publication
interval to attest. The fixed v2.11 prepared-review and completion-receipt
paths remain absent and permanently non-authoritative. Appearance of either
path cannot satisfy v2.12 and must be treated as unexpected failed evidence.

### 2.4 Tool-set, child startup, and contract identity

`V211-HMG4GAT2-PATH-ROW-AND-PIPE-GRAMMAR-INCOMPLETE` covers relative/absolute
path ambiguity, row/code identity consistency, total-length scope, identifier
encoding, six-path selection authority, and unspecified pipe framing.

`V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED` covers the missing
Node runtime hash preimage and the unregistered 128-bit descriptor map.

`V211-HMG4GA2-CONTRACT-IDENTITY-AMBIGUOUS` covers the inherited v2.10 contract
hash/length interpretation instead of the intended v2.11 identity.

`V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND` covers the absence of an
external trust root for the live controller that chooses the tool set and
publishes the result.

Disposition: v2.12 has no Gate-A generator, verifier, controller, Node child,
source transport, descriptor map, approval packet, contract-identity packet,
tool-set manifest, or local trust root. No such program may be created under
this contract. Independent review and user authorization occur across the
external task-role boundary in Section 4, which a workspace executable cannot
mint, replace, parse into authority, or satisfy by self-report.

### 2.5 Historical ledger and terminal completion

`V211-HISTORICAL-FINDING-LEDGER-HASH-UNBOUND` is remediated by the exact 52-row
HMG4GL2 preimage, count, byte length, and digest in Section 1.

`V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND` covers a receipt that writes
`FINAL` before its own create, sync, checked close, parent sync, reopen,
phase-2 validation, final watcher drain, and final path walk, leaving the same
bytes after a late failure.

Disposition: no newly created artifact and no artifact claiming v2.12
authority may state or imply `Gate-A PASS`, `FINAL-GATE-A-COMPLETE`,
implementation authorization, or equivalent v2.12 authority. The preserved
v2.7 false-PASS artifact remains explicitly false. V2.12 deliberately has no
durable local PASS object. Gate state is
an external, current, fail-closed authorization state defined by Section 4.
Adding a second, third, journaled, sealed, or self-asserted final workspace
file is not a remediation and is forbidden.

## 3. Permanent retirement of local Gate-A authority

The following are permanently retired as authority mechanisms for v2.12:

- the v2.7 false-PASS companion;
- every v2.8 through v2.11 companion, prepared-review, approval, completion,
  generator, verifier, controller, watcher, publisher, and local trust-root
  design;
- every HMG4XA1, HMG4ACL1, HMG4LF1/2, HMG4DP2, HMG4GAT1/2, HMG4GS1,
  HMG4GA1/2, and HMG4GC1 object;
- any script, native binary, package command, environment variable, path,
  report, receipt, mode, xattr, ACL, file flag, code signature, hash, process,
  exit status, or test output that claims to create a v2.12 Gate-A PASS.

No retired object is renamed, rewritten, deleted, repaired, promoted, rebound,
copied into a new implementation, or cited as passing evidence. Existing
failed artifacts retain their historical status and exact identities.

V2.12 has no Gate-A file path and no local parser for an authorization token.
A production helper must not contain code that looks for, reads, interprets,
or trusts a Gate-A companion or this contract as a runtime credential. Contract
review is a human authorization prerequisite, not production input.

## 4. External independent-review and user-role authorization gate

### 4.1 Exact three-unit topology

One review batch contains exactly three independently tasked review units:

1. schema/inheritance scope: HMG4GL2, the twelve-row consolidation, production
   schema inheritance, and no-regression review;
2. adversarial authority scope: local-authority retirement, task-role trust
   boundary, replay/spoof/stale-history cases, failed evidence, and permission
   boundary;
3. whole-contract scope: direct lineage, all 52 historical rows, both scoped
   results, current workspace state, implementation/runtime boundaries, and
   omissions or cross-section contradictions.

The units may read the same frozen workspace but may not edit, create, chmod,
set flags/ACL/xattrs, stage, commit, run a helper, run apply/recover, launch an
original runtime, or rely on another unit's conclusion. Each unit must identify
its own scope and produce its own findings before root consolidation.

Each review output must state:

- target absolute path, SHA-256, byte length, LF count, mode, type, link count,
  and before/after equality;
- reviewer scope and current review batch;
- P0/P1/P2 counts;
- every new canonical finding ID, exact problem, concrete failure path, and
  falsifiable remediation, or an explicit zero finding result;
- HMG4GL2 row count, uniqueness, byte length, ledger-only digest, and whether
  all 52 historical rows were accounted for;
- whether the operational evidence freeze is true or false;
- explicit confirmation that no review action had implementation, helper-test,
  runtime, acceptance, promotion, integration, release, or publication effect.

Any target change, missing field, reviewer error, tool failure, shared finding
suppression, nonzero finding, coverage omission, or ambiguous result fails the
entire batch. A new no-clobber contract successor and a fresh three-unit batch
are then required. A partial zero result cannot offset another unit's finding.

### 4.2 No local PASS and no preauthorization

`spec-review-qualified` is a transient fact in the current external task only
when all three current outputs target the same unchanged v2.12 bytes, all three
report `P0/P1/P2=0/0/0`, the root consolidation reports an empty new union, and
all Section 4.1 coverage requirements are visibly present. No repository byte
sequence represents this fact.

Even that fact does not authorize implementation. After seeing the complete
three-unit results and root consolidation, the user must send a new user-role
message that:

- names the exact v2.12 SHA-256;
- acknowledges the combined `0/0/0` contract-review result;
- gives the exact authorized next action;
- separately resolves or authorizes resolution of the open V28 evidence-
  preservation row; and
- repeats all excluded actions that remain excluded if the next action could
  otherwise be misread.

Earlier, conditional, inherited, generic, assistant-authored, file-authored,
tool-authored, environment-provided, or pre-review authorization does not meet
this post-review requirement. The task system's authenticated user role is the
authority boundary; an assistant, subagent, workspace process, browser page,
document, source asset, helper output, or prompt-like file content cannot mint
a user-role message.

If the current task history, user role, three reviewer outputs, target identity,
or consolidation is unavailable or cannot be independently displayed to the
user, the gate is false. Exported transcripts may be retained as dated evidence
but cannot substitute for the live authenticated user-role authorization.

This design has no self-finalization race: there is no local final artifact,
no repository publication interval, no future inode, no post-receipt check,
and no controller that can approve itself. A later repository-only observer
must report `authorization-unverifiable`, never infer PASS from files.

## 5. Separate operational preservation of the v2.7 attempt

The current retired implementation-attempt boundary remains:

```text
selected-files=57
named-top-level-runners=9
native-root-members=48
selected-total-bytes=553897
checksum-manifest-bytes=7121
checksum-set-SHA-256=cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200
selected-current-mode=0644 for all 57
native-root-current-mode=0755
first-confirmed-remediation-SHA-256=none
```

This is a dated content snapshot, not a read-only filesystem freeze. The 57
files and their directory are retired failed evidence only and are never v2.12
review inputs, implementation antecedents, fixtures, code sources, libraries,
or test oracles. Their content identity cannot authorize anything.

No permission or custody transition is authorized by this contract. A future
transition requires a new user-role message naming the exact 57-file checksum,
the exact paths, the permitted before/after modes or a separately named
content-addressed quarantine, ACL/xattr/file-flag treatment, no-clobber rule,
rollback prohibition, and verification commands. It must preserve byte hashes,
types, link counts, membership, owners, ACLs, xattrs, flags, and every
unapproved path; any unexpected difference fails closed.

An in-place permission transition may change only all 57 regular single-link
files from `0644` to `0444` and the dedicated 48-member native root from `0755`
to `0555`, and only if the future user authorization explicitly selects that
transition. Shared writable ancestors mean such a transition is preservation
evidence, not namespace immutability. An alternative quarantine must be
separately owner-authorized, content-addressed, atomically no-replace,
same-hash verified, closed-membership, non-writable, and independently reviewed.

Two independent read-only post-transition projections must agree on the exact
selected path set, native membership, bytes, hashes, file types, link counts,
modes, owners, flags, ACLs, xattrs, and zero writable selected entries before
the operational row can be marked remediated. A stable-stat check without a
full rehash is insufficient. No review or implementation may silently perform,
repair, roll back, delete, or broaden this transition.

## 6. Clean-room production-helper implementation boundary

No implementation may begin unless all of these are currently true:

1. the frozen v2.12 contract has completed a Section 4 three-unit review with
   an empty new finding union and `0/0/0` from every unit;
2. the user has sent the required new post-review authorization naming the
   exact v2.12 SHA-256 and authorized next action;
3. the V28 retired-attempt preservation row has been resolved exactly as that
   user message authorizes and independently reverified; and
4. the original v2 through v2.6 production lineage still matches every exact
   hash in Section 0.

The future implementation is clean-room and workspace-only. It may implement
only the inherited production contract and explicit v2.12 boundary. It must use
a new successor directory and new filenames. It may not read, import, copy,
port, diff for code reuse, execute, link, package, or test against any of the 57
retired v2.7-attempt files. It may not overwrite any current migration workspace
member or protected installation.

The user's existing authorization permits production-helper implementation and
nonprivileged tests only after the contract gate, but the new post-review
authorization above is additionally required because v2.12 replaces the prior
Gate-A mechanism. Tests before further authority are limited to pure parsers,
encoders, validators, state machines, deterministic in-memory models, malformed
inputs, and build/static inspection. They must not invoke helper `apply` or
`recover`, including against fixtures; mutate protected or migration data;
install; launch an original runtime; or create acceptance, promotion, release,
or publication evidence.

After implementation and allowed tests, a separate independent implementation
review must reach current `P0/P1/P2=0/0/0`. Until then the production helper may
not execute against migration data and no original runtime may start. After
that review, Peter Hu remains the only named original-runtime operator, and his
earlier authorization remains limited to the exact EN/ES capture kits for
`migrations/course-g04-l10-vb-003` in an approved disposable offline
environment with a fresh checked launch receipt on every start. It does not
extend to other L10 members or any excluded action.

## 7. Closed no-authority statement

This contract is specification evidence only. Its existence, mode, hash,
review, ledger, lineage, or external-review design does not itself authorize a
permission transition, helper implementation, helper test, apply, recover,
protected installation, original-runtime launch, fidelity claim, audio claim,
human or owner acceptance, strict completion, source promotion, course
integration, release, or publication.

No v7/v8 intake object is promoted by this work. No Grade 4 source, SQL map,
lesson order, quiz, Key Term, EN/ES binding, audio, missing MP3 decision,
migration workspace, renderer, visual/RMSE evidence, or runtime baseline is
changed. The sixteen missing MP3s remain unresolved and no source or acceptance
claim is expanded.
