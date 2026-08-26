# G4 L10 Native Helper v2.11 Security Contract Successor

Status: frozen successor specification; read-only pre-Gate-A contract review
only. The separately authorized live evidence freeze has not occurred. No
Gate-A tool, prepared review, completion receipt, companion, implementation,
helper execution, mutation, installation, original-runtime, acceptance,
promotion, integration, release, or publication authority exists.

## 0. Lineage, v2.10 failure, and finding union

This document is the sole direct no-clobber successor to:

`docs/G4_L10_NATIVE_HELPER_V2_10_SECURITY_CONTRACT_SUCCESSOR.md`

Its complete identity is:

```text
SHA-256=97b4b0e5acd85116fcedbc86c848a46380307d313d0005aeea273d8f03106694
bytes=24321
LF-count=471
mode=0444
```

The root predecessor remains:

```text
docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md
SHA-256=77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All v2.10 and transitive security, wire, canonical schema, S64, authority,
diagnostic, rollback, request transport, loaded-helper self-identity, custody,
xattr, direction-1, journal, recovery, evidence-DAG, resource, Gate-B,
mutation, review-topology, and no-authority rules remain normative except where
this document explicitly replaces the v2.10 Gate-A evidence publication layer.

The v2.10 pre-Gate-A reviews produced seven unique new P1 rows. Reviewer-local
aliases are retained in provenance but do not duplicate canonical rows:

```text
P1 V210-HMG4LF1-CANONICAL-ROW-GRAMMAR-UNDEFINED
P1 V210-DIRECTORY-ACL-XATTR-WRITE-FREEZE-UNBOUND
P1 V210-DOCS-MEMBERSHIP-CTIME-TRANSITION-CONTRADICTION
P1 V210-TRANSIENT-NAMESPACE-DRIFT-NOT-CONTINUOUSLY-OBSERVED
P1 V210-HMG4GAT1-GRAMMAR-AND-GENERATOR-BOOTSTRAP-UNDEFINED
P1 V210-DIRECT-CHILD-EXECUTION-IDENTITY-UNBOUND
P1 V210-POSTPUBLICATION-PASS-RESULT-NOT-DURABLY-BOUND
```

The inherited 33 rows plus these seven rows produce exactly 40 required
historical rows before any v2.11 finding. The separate operational row remains
open and is already one of those 40 rows:

```text
P1 V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED
first-confirmed-remediation-sha256=none
```

The current 57 selected files still match 553897 bytes and checksum-set
SHA-256 `cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`,
but all are `0644` and the dedicated native root is `0755`; live freeze is
false. This contract does not authorize chmod, ACL, xattr, flag, copy,
quarantine, move, delete, rename, or content mutation.

## 1. Exact v2.10 finding texts

### 1.1 HMG4LF1 row grammar

Original:

```text
V2.10 calls HMG4LF1 canonical but freezes only its outer header and semantic field lists. DirectoryIdentity explicitly contains “at least” the listed fields, while the directory-row and selected-file-row field order and delimitation, widths and signedness for mode, flags, uid/gid, seconds, nanoseconds and statfs values, byte-string bounds, ACL and xattr status encodings, and the native-member identity-hash preimage are not fixed. Two conforming implementations can therefore encode different HMG4LF1 bytes or accept different live projections, so the HMG4LF1 SHA-256 carried into HMG4GA1 does not identify one independently recomputable security object.
```

Required remediation:

```text
A no-clobber successor must freeze HMG4LF1 as one complete closed byte table: exact magic and version bytes; exact directory-row and selected-file-row field order; row framing; primitive widths and signedness; fixed enums for type, mode, flags, ACL and xattr status; canonical path, mount and statfs encodings; every variable-length bound; exact membership identity-hash preimages; sorting, count and checked-overflow rules; and the final prefix-digest preimage. “At least” fields, implementation-selected native stat encodings, implicit row boundaries, and unregistered extensions must be forbidden. Independent encoders, decoders, exact-bound vectors and one-byte mutation vectors must reproduce or reject the same complete bytes.
```

### 1.2 Directory ACL/xattr write freeze

Original:

```text
V2.10 requires complete ACL and xattr observation only for the 57 selected file descriptors. DirectoryIdentity does not require a complete directory ACL or xattr projection, and the effective write-access probe applies only to selected file descriptors. Consequently a dedicated native root with mode 0555 can still permit namespace mutation through an extended ACL, while initial, persistent, or interval ACL/xattr state on the native root and retained ancestor directories is not independently bound even though the contract later claims that any ACL or xattr drift fails.
```

Required remediation:

```text
A no-clobber successor must require, for every retained and freshly resolved directory, a complete canonical ACL projection, complete canonical xattr name/value projection, their exact hashes, and descriptor-relative effective search and namespace-write capability checks under the review process identity. The dedicated native root must deny every unapproved namespace mutation capability in mode, flags, ACL, and applicable filesystem policy; intentionally writable shared parents must be identified as such but still have their complete ACL/xattr baselines bound and continuously guarded. Any unreadable, unsupported, ambiguous, changed, or unexpectedly writable directory state must fail before candidate construction and after publication.
```

### 1.3 Docs transition contradiction

Original:

```text
V2.10 includes the retained docs DirectoryIdentity, including st_ctimespec, in the prepublication HMG4LF1 and then requires the postpublication HMG4LF1 to be byte-for-byte identical. A successful openat(O_CREAT|O_EXCL) publication necessarily changes the same docs directory’s membership and ctime, while Section 3 simultaneously permits exactly that final-leaf addition. The specified success path must therefore either fail after every valid creation, ignore a security-bound directory field, or falsely report byte equality. In addition, Section 3 refers to a bracket prepublication docs inventory, but no complete canonical docs membership projection, hash, bounds, or pre-to-post transition grammar is present in HMG4LF1.
```

Required remediation:

```text
A no-clobber successor must freeze a canonical docs transition object rather than require impossible whole-row equality. Its pre-state must contain the complete unsigned-name-sorted no-follow docs membership and identities under the retained docs descriptor. Its post-state must contain exactly the same rows plus exactly one fixed final leaf whose identity equals the created, reopened and freshly resolved FileIdentity. The schema must distinguish invariant parent fields from the expected ctime and mtime transition caused by that one creation, bind both pre and post parent observations, and reject every other member, timestamp, inode, mount, flag or path change. File sync, checked close, retained-parent sync, descriptor-relative reopen, complete reread, fresh absolute descriptor walk and post-membership verification must all complete before PASS. Any ambiguous durability or transition result must preserve an occupied failed artifact and require a new successor.
```

### 1.4 Publication-interval continuity

Original:

```text
V2.10 leaves the shared scripts and scripts/native parents writable and explicitly omits their complete membership from HMG4LF1, yet claims that endpoint equality of device, inode, and st_ctimespec detects rename-away-and-restore throughout the publication interval. The contract freezes no closed namespace, namespace-mutation exclusion primitive, continuous event record, strictly monotonic mutation counter, event-loss rule, or minimum and unique timestamp-update semantics. A transient namespace substitution restored before the postpublication scan can therefore have the same admitted endpoint projection, so pre/post equality is not proof that no interval mutation occurred.
```

Required remediation:

```text
A no-clobber successor must either place all 57 inputs and their exact parent and member sets in a separately owner-authorized non-writable closed evidence quarantine, or freeze a fail-closed continuous mutation-exclusion or mutation-observation mechanism covering every selected inode and every relevant ancestor directory from the approved preprojection through the completed postprojection. The mechanism must define event setup before the bracket, exact covered events and objects, overflow, loss, unsupported-filesystem, descriptor-revocation, rename, mount, and teardown behavior, and complete pre/post membership binding. Endpoint ctime equality alone must never discharge publication-interval continuity; any observation gap, event, or membership change leaves only failed evidence.
```

### 1.5 HMG4GAT1 grammar and bootstrap

Original:

```text
V2.10 calls HMG4GAT1 canonical but does not freeze its exact magic bytes, version value and encoding, role-code values, row field order, primitive widths, path and mode encoding, row framing and bounds, or complete final-hash preimage. The manifest also includes the generator source hash and the candidate must bind the exact manifest, but no cycle-free descriptor-derived HMG4GAT1 request is frozen for the generator. Embedding the manifest identity in generator source creates a generator self-hash dependency, while accepting an unspecified runtime manifest or digest creates an unregistered controller or caller injection surface. The present text therefore neither defines one independently reproducible HMG4GAT1 byte sequence nor defines how the generator can bind that sequence without a self-identity cycle.
```

Required remediation:

```text
A no-clobber successor must freeze HMG4GAT1 as an exact closed byte grammar with literal magic and version bytes, five literal role codes, complete row field order and primitive encodings, canonical path and mode rules, exact lengths and bounds, sorting, checked arithmetic, forbidden extras, and the final digest preimage. The controller must derive the complete manifest only from the five already-held and independently hashed objects after the publisher source has been finalized; the publisher source must not contain its own hash or the completed manifest hash. The controller must pass the exact complete HMG4GAT1 bytes to the generator over a fresh private, fixed, bounded and length-framed request pipe. The generator must parse and bind those bytes without embedding its own final hash, and the publisher and verifier must independently reconstruct and compare the same bytes and digest. No caller-provided manifest, digest, path, role, descriptor or override is permitted.
```

### 1.6 Direct-child execution identity

Original:

```text
V2.10 requires the controller to open, hash and retain the Node executable and four source descriptors, but it does not freeze the native mechanism that binds those held descriptors to the executable image and source bytes actually consumed by each child. shell=false and an absolute Node pathname do not by themselves prevent replacement between the held-file check and process execution. “Exact process identity” is also not given a canonical observation schema, trusted kernel source, comparison rule, or mandatory time before the challenge and candidate are sent. A substituted Node image or source loader can therefore receive the fresh challenge and fabricate a structurally valid HMG4GA1 while the controller still retains unrelated approved descriptors.
```

Required remediation:

```text
A no-clobber successor must freeze one target-platform-supported descriptor-bound child-launch protocol or an equally strong kernel-authenticated executable-vnode protocol. It must specify the exact executable primitive, argv, environment, cwd, intended descriptor map, close-on-exec policy, source and mutation-suite descriptor mapping, child PID or audit-token binding, executable device/inode/hash and code-identity observation, and child confirmation that the consumed source bytes came from the retained descriptors. The controller must validate the child executable and source continuity before writing the challenge, candidate or expected counts to any child pipe. Path-only exec, proc-path self-reporting, inherited ambient loaders, NODE_OPTIONS-style injection, an unverified PID, or any unverifiable process/source identity must produce empty approval output and leave the final path absent.
```

### 1.7 Durable postpublication result

Original:

```text
V2.10 verifies and fixes candidate bytes, zero open-finding counts, and HMG4GA1 before publication, but the live postprojection, final inode continuity, durability checks, and the decision that the occupied path is a real companion occur only after those bytes are written. HMG4GA1 and the PID and pipe transcript are not bound into any postpublication immutable artifact. If a post-open check fails, the occupied file contains the same apparent PASS report bytes as a successful candidate, so a later observer cannot distinguish an occupied failed artifact from a valid companion without trusting unavailable controller state.
```

Required remediation:

```text
A no-clobber successor must avoid placing a self-asserted final PASS in the prepublication candidate and must define a separate exclusively created postpublication receipt or equivalent immutable completion object. That receipt must bind the final companion path and FileIdentity, exact candidate bytes and SHA-256, HMG4GA1, HMG4GAT1, preprojection, derived expected postprojection, observed postprojection, Node and source identities, challenge, verifier PID and pipe transcript, durability results, final counts, and successful status; Gate A is valid only when the prepared review artifact and its independently verified completion receipt both exist and match. Receipt failure or absence leaves the occupied review file nonpassing without repair or overwrite and avoids a self-hash cycle.
```

## 2. Primitive encodings and bounded projections

All Gate-A binary grammars in this document use these primitives:

```text
U8/U16_BE/U32_BE/U64_BE  unsigned fixed-width big-endian
S64_BE                    eight-byte two's-complement big-endian
SHA256                    raw 32 bytes
CDHASH                    raw 32 bytes; a shorter platform CDHash is right-padded with zero
PATH16                     U16_BE length then 1..4096 canonical UTF-8 bytes
BYTES32                    U32_BE length then bytes
```

PATH16 rejects NUL, CR, LF, tab, empty components, `.`, `..`, repeated slash,
trailing slash, decomposed/non-NFC spelling, and platform case-fold collisions.
The repository root path is the one exception and is encoded as one ASCII dot.
All additions and offsets use checked U64 arithmetic; aggregate object size is
at most 16 MiB unless a smaller bound is stated. Unknown versions, enums,
reserved bits, fields, bytes, padding, duplicate keys, invalid UTF-8, alternate
normalization, truncation, overrun, and trailing bytes fail closed.

`HMG4XA1` is the complete xattr projection:

```text
8 bytes magic = ASCII HMG4XA1
U16_BE version=1
U16_BE status: 0=complete-empty, 1=complete-present
U32_BE entry-count, at most 1024
for each entry sorted by unsigned name bytes:
  U16_BE name-length 1..127; exact name bytes
  U64_BE value-length 0..16777216; exact value bytes
SHA256 of all preceding HMG4XA1 bytes
```

Duplicate names, incomplete reads, list/value races, unreadable values, or more
than 32 MiB aggregate xattr value bytes fail. The controller lists, opens or
reads, relists, and requires the two unsigned name lists and values to agree.

`HMG4ACL1` is the complete macOS extended-ACL projection:

```text
8 bytes magic = ASCII HMG4ACL1
U16_BE version=1
U16_BE status: 0=complete-no-extended-ACL, 1=complete-present
U32_BE entry-count, at most 128
for each ACE in native evaluation order:
  U32_BE zero-based index
  U8 type: 1=allow, 2=deny
  U8 qualifier-kind=1
  U16_BE reserved=0
  16 raw qualifier UUID bytes
  U32_BE raw Darwin permission mask
  U32_BE raw Darwin inheritance/flag mask
SHA256 of all preceding HMG4ACL1 bytes
```

An unsupported ACE type or qualifier, invalid raw mask retrieval, order drift,
unreadable ACL, or ACL read race fails. Raw masks bind every bit; authority
checks additionally use the kernel's descriptor-relative effective access
decision under the exact review credentials.

## 3. Closed HMG4LF2 live-freeze grammar

HMG4LF2 covers exactly four directory roles and 57 file rows:

```text
directory role 01: .
directory role 02: scripts
directory role 03: scripts/native
directory role 04: scripts/native/g4-l10-successor-v2_7
file scope 11: the nine explicitly named non-Gate-A runners
file scope 12: the exact 48 native-root members
```

The exact HMG4LF2 outer byte sequence is:

```text
8 bytes magic = ASCII HMG4LF2
U16_BE version=2
U16_BE status=1
U32_BE total-byte-length
U32_BE directory-count=4
U32_BE selected-file-count=57
U32_BE top-runner-count=9
U32_BE native-member-count=48
U64_BE selected-total-bytes=553897
SHA256 selected checksum-set=cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200
four DirectoryRow values in role order 01..04
57 FileRow values sorted by unsigned repository-relative PATH16 bytes
SHA256 of every preceding HMG4LF2 byte
```

The checksum literal in the byte grammar above is the 32 raw bytes represented
by the displayed lowercase hexadecimal value. `total-byte-length` includes the
final digest and must equal complete consumed bytes.

Each `DirectoryRow` is exactly:

```text
U32_BE row-byte-length including row digest
U8 row-kind=1
U8 role=01..04
PATH16 expected repository-relative path
U64_BE st_dev
U64_BE st_ino
U16_BE permission mode bits 0000..07777
U32_BE file flags
U32_BE st_uid
U32_BE st_gid
U64_BE st_nlink
S64_BE st_ctimespec.seconds
U32_BE st_ctimespec.nanoseconds 0..999999999
S64_BE statfs.f_fsid[0]
S64_BE statfs.f_fsid[1]
PATH16 canonical mount-from bytes
PATH16 canonical mount-on bytes
U8 effective-search: 0=denied, 1=allowed
U8 effective-namespace-write: 0=denied, 1=allowed
U16_BE HMG4ACL1 entry-count
SHA256 complete HMG4ACL1 bytes
U16_BE HMG4XA1 entry-count
U64_BE HMG4XA1 total value bytes
SHA256 complete HMG4XA1 bytes
SHA256 role selection-membership preimage
SHA256 of ASCII HMG4LFD2 followed by every preceding DirectoryRow byte
```

All four roles require effective search allowed. Role 04 requires namespace
write denied, mode `0555`, and no ACL or flag that grants mutation. Roles
01..03 record their actual write decision; roles 02 and 03 may remain writable
only because Section 4 continuously observes them. Every directory ACL and
xattr projection is complete and bound.

Each `FileRow` is exactly:

```text
U32_BE row-byte-length including row digest
U8 row-kind=2
U8 scope=11 or 12
PATH16 exact repository-relative path
U64_BE st_dev
U64_BE st_ino
U16_BE permission mode=0444
U32_BE file flags
U32_BE st_uid
U32_BE st_gid
U64_BE st_nlink=1
U64_BE st_size
S64_BE st_mtimespec.seconds
U32_BE st_mtimespec.nanoseconds 0..999999999
S64_BE st_ctimespec.seconds
U32_BE st_ctimespec.nanoseconds 0..999999999
U8 effective-write=0
U16_BE HMG4ACL1 entry-count
SHA256 complete HMG4ACL1 bytes
U16_BE HMG4XA1 entry-count
U64_BE HMG4XA1 total value bytes
SHA256 complete HMG4XA1 bytes
SHA256 complete file bytes
SHA256 of ASCII HMG4LFF2 followed by every preceding FileRow byte
```

The role-04 selection-membership preimage is ASCII `HMG4LFM2`, U32_BE 48,
then for each immediate entry in unsigned name order: U16_BE name length,
name bytes, U8 type=1 regular, and its complete FileRow digest. It must consume
exactly the 48 scope-12 rows and no other entry. Role 02 uses the same domain
with count nine and the nine scope-11 runner names/digests. Role 03 uses count
one, the exact dedicated-root name, U8 type=2 directory, and the role-04
DirectoryRow digest. Role 01 uses count one, name `scripts`, type=2, and the
role-02 DirectoryRow digest. No hash has a cyclic preimage because FileRow
digests are computed first and DirectoryRow roles are then computed in order
04, 03, 02, 01 before serialized in order 01..04.

Independent implementations must pass exact empty/present ACL and xattr
vectors; four directory roles; first/last runner and native file rows; maximum
path/xattr/ACL bounds; signed seconds; nanosecond edges; and one-byte mutation,
row-length, count, sort, duplicate, membership, digest, and trailing-byte
negatives. These vectors use the same encoders/decoders as live review.

## 4. Continuous macOS mutation observation

Endpoint equality never proves interval continuity. The final Gate-A
controller must use one dedicated macOS `kqueue` watcher before the first
HMG4LF2 read. It opens and retains the four directory descriptors and all 57
file descriptors first, then registers one `EVFILT_VNODE` filter per descriptor
with `EV_ADD|EV_ENABLE|EV_CLEAR` and this complete fflags mask:

```text
NOTE_DELETE|NOTE_WRITE|NOTE_EXTEND|NOTE_ATTRIB|NOTE_LINK|NOTE_RENAME|NOTE_REVOKE
```

The kqueue descriptor is `CLOEXEC`. Registration errors, unsupported filters,
`EV_ERROR`, descriptor revocation, watcher-thread death, cancellation, event
decode error, event-source mismatch, clock error, or teardown before the final
postprojection fails. A dedicated watcher thread blocks in `kevent`; the first
event sets a one-way atomic failure latch containing descriptor role, dev/ino,
fflags, and monotonic timestamp. The latch can never be cleared or masked.

After all registrations are acknowledged, the controller performs a zero-time
drain, builds pre-HMG4LF2, drains again, and requires zero events. It checks the
latched state before and after generator startup, generator completion,
verifier startup, approval receipt, prepared-review creation, every durability
operation, each fresh path walk, post-HMG4LF2, and completion-receipt creation.
The watcher remains active through completion-receipt parent sync and final
receipt reread; then one final drain must be empty before controlled teardown.

`EV_CLEAR` coalescing cannot hide a mutation because any event is fatal and the
first pending event remains a latched failure when drained. No bounded event
count is used as evidence. An observation gap, missing descriptor, changed
filter, queue closure, overflow-like ambiguity, or any fflags value fails. The
pre- and post-HMG4LF2 bytes must also be identical. This event observer covers
shared `scripts` and `scripts/native`; even an unrelated change there fails the
bracket. It does not observe `docs`, whose two expected mutations use Section 5.

## 5. HMG4DP2 two-stage docs transition

`docs` is excluded from HMG4LF2. The controller holds its complete absolute
no-follow descriptor chain and one retained `docs` descriptor as required by
v2.10 Section 3. It builds a complete immediate-membership projection under
that descriptor. Every entry is sorted by unsigned name bytes and encoded as:

```text
PATH16 slash-free name
U8 type: 1=regular, 2=directory
U64_BE st_dev
U64_BE st_ino
U16_BE mode
U32_BE flags
U32_BE uid
U32_BE gid
U64_BE nlink
U64_BE size
S64_BE mtime.seconds; U32_BE mtime.nanoseconds
S64_BE ctime.seconds; U32_BE ctime.nanoseconds
SHA256 complete bytes for regular files, otherwise 32 zero bytes
```

The directory header is the exact DirectoryRow field sequence from Section 3
without its selection-membership and row-digest fields, plus full HMG4ACL1 and
HMG4XA1 bindings. `HMG4DP2` contains magic ASCII `HMG4DP2`, U16_BE version=2,
U16_BE phase, U32_BE total length, the directory header, U32_BE entry count,
all entries, and SHA256 of every preceding byte.

The two fixed new leaves are:

```text
prepared review:
G4_L10_NATIVE_HELPER_V2_11_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md

completion receipt:
G4_L10_NATIVE_HELPER_V2_11_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW_COMPLETION_RECEIPT.bin
```

Before generator execution both leaves must be absent and pre-HMG4DP2 phase 0
binds the exact current docs state. From that state the controller derives a
phase-1 normalized expected projection using this closed transition only:

- every preexisting member row is byte-identical;
- docs device, inode, mode, flags, uid, gid, nlink, mount, ACL, and xattrs are
  byte-identical;
- docs mtime/ctime values use fixed `S64_MIN/U32_MAX` normalization sentinels
  only after observed post values are valid and are not earlier than pre;
- exactly the prepared-review leaf is added as regular, nlink=1, mode `0444`,
  same device as docs, nonzero inode unequal to every preexisting inode, exact
  approved size/SHA-256, and contract-defined normalized time sentinels;
- no other field or member differs.

The normalized expected phase-1 HMG4DP2 SHA-256 is knowable and bound before
publication. After descriptor-relative create, file sync, checked close,
retained-parent sync, same-parent reopen, complete reread, and fresh absolute
no-follow walk, the controller validates actual values against the predicates,
normalizes only the explicitly listed values, and requires exact phase-1 bytes.

After the completion-receipt bytes and hash are known, the controller derives
phase 2 identically from observed phase 1, allowing exactly the fixed receipt
leaf with its known type/mode/size/hash and normalized new inode/time fields.
It exclusively creates, syncs, closes, parent-syncs, reopens, and rereads that
leaf, then requires actual normalized phase-2 HMG4DP2 bytes to equal the derived
expected phase-2 bytes. No implementation-selected mask exists. Any extra,
missing, transiently substituted, linked, timestamp-regressed, ACL/xattr,
mount, parent, member, inode, mode, flag, byte, durability, or path drift leaves
the prepared review nonpassing and the receipt absent or invalid.

## 6. Exact HMG4GAT2 tool-set grammar and cycle-free bootstrap

HMG4GAT2 contains exactly six rows:

```text
role 01 generator self-contained Node source, project-relative path
role 02 verifier self-contained Node source, project-relative path
role 03 mutation-vector data, project-relative path
role 04 controller native source, project-relative path
role 05 controller native executable, project-relative path
role 06 exact Node executable, absolute path
```

Its bytes are:

```text
8 bytes magic = ASCII HMG4GAT2
U16_BE version=2
U16_BE row-count=6
U32_BE total-byte-length
six ToolRow values in role order 01..06
SHA256 of every preceding byte
```

Each ToolRow is:

```text
U32_BE row-byte-length including row digest
U8 role=01..06
U8 path-kind: 1=project-relative PATH16, 2=absolute PATH16
U8 type=1 regular
U8 code-kind: 0=none, 1=Mach-O signed executable
U16_BE mode
U16_BE reserved=0
U32_BE flags
U64_BE st_dev
U64_BE st_ino
U64_BE st_nlink=1
U64_BE byte-length
PATH16 exact path
SHA256 complete bytes
U8 CDHash algorithm: 0=none, 1=SHA-256
CDHASH running/static CodeDirectory identity or 32 zero bytes
U16_BE signing-identifier length 0..255 then bytes
U16_BE team-identifier length 0..255 then bytes
SHA256 of ASCII HMG4GTR2 followed by every preceding ToolRow byte
```

Roles 01..04 require path-kind 1 and code-kind 0. Role 05 requires path-kind 1
and code-kind 1. Role 06 requires path-kind 2 and code-kind 1. Paths are fixed
literal constants in the reviewed controller source except that the controller
source and executable do not contain their own final SHA-256, ToolRow digest,
or HMG4GAT2 digest.

The finalized controller opens and retains all six exact objects, independently
hashes them, obtains static code identities for roles 05/06, and constructs
HMG4GAT2 in memory. It passes the exact complete bytes over fresh, private,
length-framed pipes to generator and verifier. Each independently parses and
rehashes HMG4GAT2 and binds the digest in its output. The generator does not
embed its own final hash and receives no caller manifest; the complete manifest
is therefore descriptor-derived and cycle-free. The caller supplies no paths,
roles, hashes, manifest, digest, descriptor map, or override.

Independent tests cover all six rows, both path kinds, empty/present signing
identifiers, maximum path/identifier bounds, code-kind/CDHash consistency,
role order, duplicate/missing/extra role, length, mode, link, path alias,
reserved, digest, truncation, and one-byte mutations.

## 7. macOS child launch and startup attestation

Roles 01 and 02 are single-file ES modules. They may import only the exact
embedded Node built-ins `node:crypto` and `node:fs`. Static token/AST review and
runtime source guards reject local/package imports, `require`, dynamic import,
preload or alternate loaders, `eval`, `Function`, `vm`, WebAssembly,
`child_process`, workers, native addons, generated code, network, shell, and
filesystem path opens. Role 03 is canonical data, never evaluated. `NODE_PATH`,
`NODE_OPTIONS`, npm, loader, import-map, preload, inspector, coverage, and all
`DYLD_*` environment variables are absent.

The controller executable is a workspace-only Gate-A evidence tool, not the
production helper. Its source, reproducible build receipt, binary bytes,
CodeDirectory identity, signing identity, compiler/linker command, SDK, target,
and undefined/dynamic symbol surface are independently reviewed. It uses fixed
macOS `posix_spawn` with `POSIX_SPAWN_CLOEXEC_DEFAULT`, `shell=false`, exact
absolute Node argv, exact workspace cwd, empty/minimal allowlisted environment,
and fixed file actions. All unintended descriptors are closed.

Each child uses this descriptor map:

```text
fd 0 private source-input pipe
fd 1 /dev/null
fd 2 bounded diagnostic stderr pipe
fd 3 held source
fd 4 held mutation-vector data for verifier, /dev/null for generator
fd 5 HMG4GAT2 input pipe
fd 6 bounded request input pipe
fd 7 candidate input/output pipe by role
fd 8 one-byte startup gate input
fd 9 startup/approval output pipe
```

Exact argv is the retained absolute Node path followed only by
`--input-type=module`; Node therefore consumes the module source only from
standard input. Before spawn, the controller rehashes and fstats every held
descriptor and starts vnode observation on their files and parents. The
controller creates a fresh source pipe, maps only its read end to child fd 0,
retains its write end, and does not write source bytes yet. Node blocks waiting
for source EOF. While no source has been delivered, the controller validates
the live child PID and running Node code identity by the kernel/Security checks
below. A failed or exited child receives no source, challenge, review data,
expected count, or candidate.

After that first live-image validation, the controller rewinds the retained
source descriptor to offset zero and streams exactly its complete bytes to the
private fd-0 pipe while independently hashing and counting every written byte.
It rejects any short read, short write, extra byte, changed stat, hash/length
mismatch against HMG4GAT2, vnode event, or pipe error, then closes the pipe to
provide the only source EOF. No caller byte or path participates. Node executes
only that reviewed ES-module stream. The running module initially reads and
hashes fd 3/4/5, fstats them, parses HMG4GAT2, requires its fd-3 source identity
and hash to equal the manifest, and emits exactly one `HMG4GS1` startup receipt
before it blocks on fd 8. It cannot receive challenge, review data, expected
counts, or candidate bytes before startup validation. Descriptors above fd 9
are closed.

HMG4GS1 is exactly 256 bytes:

```text
0   8   ASCII HMG4GS1
8   2   U16_BE version=1
10  2   U16_BE role=1 generator or 2 verifier
12  4   U32_BE length=256
16  8   U64_BE child PID
24  8   U64_BE expected parent PID
32  32  source SHA-256
64  32  mutation-vector SHA-256 or 32 zero bytes
96  32  HMG4GAT2 SHA-256
128 8   source st_dev
136 8   source st_ino
144 8   source byte length
152 8   mutation st_dev or zero
160 8   mutation st_ino or zero
168 8   mutation byte length or zero
176 32  Node version/platform/arch projection SHA-256
208 16  fixed descriptor-map bitmap and flags
224 32  SHA-256 of bytes 0..223
```

The controller independently parses the receipt and validates PID/PPID,
descriptor identities, bytes, manifest, runtime projection, and the recorded
source-stream byte count and digest. Before writing the fd-8 startup byte it
repeats the child-PID live-image validation using macOS Security framework
`SecCodeCopyGuestWithAttributes` and `SecCodeCopySigningInformation`, plus the
kernel audit token when available, to require the running CodeDirectory CDHash,
signing identifier, team identifier, and validity flags to equal the retained
role-06 static code identity. It also requires a fresh no-follow path walk to
the role-06 device/inode, unchanged vnode events, the exact OS build and dyld
shared-cache UUID from the final environment receipt, and exact executable
bytes from the held descriptor.

Only after both live-image validations and all controller and child observations
agree does the controller send one startup byte and then the fixed request. Any
path-only identity,
proc-path-only self-report, PID mismatch, audit/SecCode error, invalid signature,
CDHash or source mismatch, event, unsupported platform, missing build receipt,
ambient loader, or unverifiable loaded identity kills the child before secret
challenge/candidate delivery, requires empty approval output, and leaves both
final leaves absent.

## 8. HMG4GA2 prepublication approval

HMG4GA2 retains the proven 324-byte HMG4GA1 layout with these exact changes:

```text
magic at 0..7 = ASCII HMG4GA2
version at 8..9 = U16_BE 2
HMG4GAT2 SHA-256 at 192..223
pre-HMG4LF2 SHA-256 at 224..255
required-finding-count at 256..259 = U32_BE 40
```

Every other offset, width, literal, candidate/contract hash and length,
challenge, verifier/mutation identity, count, 292-byte prefix digest preimage,
and total length remains exactly v2.10 HMG4GA1. `status=1` means only
`PREPUBLICATION_VALIDATED`; it never means Gate-A PASS.

The controller directly spawns the attested verifier, supplies the fresh
challenge and exact prepared-review bytes through its private pipes, requires
the reviewed mutation-vector set through the same verifier function, receives
exactly one 324-byte HMG4GA2, independently parses it, waits for successful
child exit, and binds the complete PID/pipe transcript. No caller-supplied or
replayed approval surface exists.

## 9. Nonpassing prepared review and HMG4GC1 completion receipt

The first final leaf is a `prepared review`, not a passing companion. Its exact
heading is:

```text
# G4 L10 Native Helper v2.11 Prepared Independent Review
```

It must contain `publication-state=PREPARED-NONPASSING` and must not contain a
Gate-A `PASS`, implementation authorization, or final completion statement.
It records the 40 historical rows plus every new row, review units, commands,
tool/environment identities, HMG4LF2/HMG4DP2 expectations, and HMG4GA2.

Only after prepared-review creation, phase-1 docs validation, exact post-
HMG4LF2 equality, empty/failure-free vnode watcher, descriptor/inode continuity,
file and parent durability, and fresh path resolution may the controller build
the second leaf. `HMG4GC1` is exactly 640 bytes:

```text
0    8   ASCII HMG4GC1
8    2   U16_BE version=1
10   2   U16_BE status=1 FINAL-GATE-A-COMPLETE
12   4   U32_BE length=640
16   32  frozen v2.11 contract SHA-256
48   8   frozen v2.11 byte length
56   32  prepared-review SHA-256
88   8   prepared-review byte length
96   8   prepared-review st_dev
104  8   prepared-review st_ino
112  4   prepared-review mode=0444
116  4   prepared-review nlink=1
120  32  complete HMG4GA2 SHA-256
152  32  HMG4GAT2 SHA-256
184  32  pre-HMG4LF2 SHA-256
216  32  post-HMG4LF2 SHA-256, equal to pre
248  32  pre phase-0 HMG4DP2 SHA-256
280  32  expected normalized phase-1 HMG4DP2 SHA-256
312  32  observed normalized phase-1 HMG4DP2 SHA-256
344  32  verifier challenge
376  32  verifier source SHA-256
408  32  mutation-vector SHA-256
440  32  Node executable SHA-256
472  8   verifier child PID
480  32  verifier request transcript SHA-256
512  32  verifier approval-pipe transcript SHA-256
544  32  controller executable SHA-256
576  4   durability bitmask; exact required value 0x000001ff
580  4   U32_BE required-finding-count=40
584  4   U32_BE new-finding-count
588  4   U32_BE open-P0-count=0
592  4   U32_BE open-P1-count=0
596  4   U32_BE open-P2-count=0
600  4   U32_BE final-review-unit-count=3
604  4   U32_BE final-review-command-count
608  32  SHA-256 of bytes 0..607
```

The nine durability bits bind: prepared-file sync, prepared checked close,
phase-1 docs parent sync, prepared same-parent reopen/reread, post-HMG4LF2,
vnode watcher empty/healthy, fresh absolute path resolution, HMG4GA2 child
wait/transcript closure, and phase-1 docs equality.

The controller exclusively creates HMG4GC1 as the fixed receipt leaf with the
same retained-docs `openat(O_CREAT|O_EXCL|O_NOFOLLOW,0444)` protocol, syncs,
checked-closes, parent-syncs, same-parent reopens, and completely rereads it.
It then validates normalized phase-2 HMG4DP2, the still-identical HMG4LF2, the
still-empty healthy vnode watcher, and a fresh absolute descriptor walk.

HMG4GC1 does not contain its own file hash, inode, or phase-2 hash, avoiding a
self-cycle. Every later validator derives the fixed phase-2 expectation from
the receipt's externally computed size/SHA-256 and validates its current
regular/single-link/0444 file identity, exact bytes, parent transition, prepared
review, and all receipt bindings. Gate A is valid only when both fixed leaves
exist and all current validations pass. An absent/invalid receipt makes the
prepared review nonpassing; no repair, overwrite, unlink, retry, or in-place
completion is authorized.

## 10. Review gate and closed execution boundary

V2.11 pre-Gate-A review is read-only and cannot create Gate-A tools or either
final leaf. After a separately authorized live permission freeze, a new final
review batch must independently review the complete contract, all six HMG4GAT2
objects, build/environment receipts, LF/ACL/xattr/event/docs grammars, child
launch/attestation, HMG4GA2, prepared review, and completion process.

The required finding union is 40 historical rows plus every v2.11 finding.
PASS requires every row remediated, current operational freeze, exact
two-scoped-plus-one-whole coverage, all canonical/malformed vectors, zero
watcher events/gaps, exact prepared review and HMG4GC1 pair, final
`open-p0/open-p1/open-p2=0/0/0`, and a fresh current pair validation.

Before that pair exists and validates, no production-helper implementation,
source port, dispatcher, filesystem/journal engine, fixture, implementation
test, build, or implementation-review packet may be created. A future valid
pair would authorize only the user's already bounded workspace-only production
helper implementation and nonprivileged tests. It would not authorize helper
`apply` or `recover`, including fixtures; protected installation or mutation;
original-runtime launch; acceptance; promotion; integration; release; or
publication.

No contract, review, Gate-A tool, event observation, prepared review, approval,
completion receipt, implementation source, compilation, or test result has
acceptance effect, original-runtime authority, fidelity effect, audio-
acceptance effect, promotion effect, integration effect, release effect, or
publication effect.
