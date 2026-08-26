# G4 L10 Native Helper v2.10 Security Contract Successor

Status: frozen successor specification; pre-Gate-A independent contract review
only. The live evidence-freeze prerequisite remains false. No companion,
implementation, helper execution, mutation, installation, original-runtime,
acceptance, promotion, integration, release, or publication authority exists.

## 0. Direct lineage and v2.9 failure

This document is the sole direct no-clobber successor to:

`docs/G4_L10_NATIVE_HELPER_V2_9_SECURITY_CONTRACT_SUCCESSOR.md`

The complete direct-predecessor identity is:

```text
SHA-256=d52ad98eb3009f475721692040ebc210059655d0017ed71ac0dcdfbcfe620007
bytes=19312
LF-count=389
mode=0444
```

The root predecessor remains:

```text
docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md
SHA-256=77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All v2.9 and transitive security, wire, canonical schema, S64, authority,
diagnostic, rollback, request transport, loaded-helper self-identity, custody,
xattr, direction-1, journal, recovery, evidence-DAG, resource, Gate-B,
mutation, review-topology, and no-authority rules are incorporated unchanged
except for the three corrections expressly stated here.

The v2.9 contract is immutable failed specification evidence. Its three
pre-Gate-A reviews produced one scoped `0/0/0` result and three unique P1
findings across the other scoped and whole reviews. No v2.9 companion,
generator, verifier, publisher, or implementation was created.

The three canonical finding rows are:

```text
P1 V29-LIVE-FREEZE-PUBLICATION-TOCTOU
P1 V29-COMPANION-PARENT-LOOKUP-TOCTOU
P1 V29-VERIFIER-APPROVAL-GRAMMAR-PROVENANCE-UNDEFINED
```

The scoped-review labels
`V29-PUBLISHER-PARENT-PATH-TOCTOU-UNBOUND` and
`V29-VERIFIER-APPROVAL-RECORD-AND-PRODUCER-CONTINUITY-UNDEFINED` are retained
as reviewer-local aliases of the second and third canonical rows respectively;
they do not add duplicate union rows. The live-freeze publication-interval
finding is separate from both.

The known operational row remains separately open:

```text
P1 V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED
first-confirmed-remediation-sha256=none
```

All 57 selected failed-attempt files still match the dated 553897-byte
path/content snapshot and checksum-set SHA-256
`cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`,
but all remain mode `0644` and the dedicated native root remains `0755`.
Consequently the v2.9 Section 2 live freeze is currently false. This contract
does not authorize its permission transition.

## 1. Exact v2.9 finding texts and required remediation

### 1.1 Publication-interval live-freeze TOCTOU

Exact original text:

```text
V2.9 permits final Gate-A publication after one path-based live-freeze recheck immediately before the companion open, but it retains no file or namespace identity across that check, does not exclude mutation through the write and final re-read, and performs no post-publication Section 2 scan. Because the shared scripts and scripts/native parents remain writable, selected paths can be renamed, replaced, re-permissioned, or changed after the check while a byte-valid companion is still published against a false live prerequisite.
```

Exact required remediation text:

```text
A no-clobber successor must either use a separately owner-authorized dedicated evidence quarantine with a closed verified namespace or bracket verification and publication with stable no-follow scans rooted at retained directory descriptors, bind every selected path to device, inode, type, link count, mode, size, content, and complete directory membership, exclude or detect mutation throughout the publication interval, and require a post-publication live projection byte-identical to the approved prepublication projection before the artifact may be called a companion; any drift or unverifiable interval leaves only failed evidence and Gate A open.
```

### 1.2 Companion-parent lookup TOCTOU

Exact original text:

```text
V2.9 requires the publisher to reconfirm parent-directory identity immediately before opening the companion path, but it does not require retention of the no-follow parent and ancestor descriptors or creation and reopen relative to that retained parent. O_EXCL and O_NOFOLLOW protect the final leaf only, so replacement or rename of docs or an ancestor between the identity check and pathname open can redirect creation, synchronization, and final re-read into an unapproved namespace.
```

Exact required remediation text:

```text
A no-clobber successor must resolve and retain the complete no-symlink ancestor chain and exact companion parent by file descriptors, bind their device, inode, type, mount, and expected path identities, create and reopen the final leaf only with no-follow openat operations relative to the retained approved parent, synchronize that same parent descriptor, and prove after final re-read that the displayed path resolves to the retained parent and created file identities; any mismatch creates only an occupied failed artifact and never a companion.
```

### 1.3 Verifier approval grammar and provenance

Exact original text:

```text
V2.9 calls the verifier approval record canonical but freezes neither an exact byte grammar nor fixed expected verifier and mutation-suite identities, and the publisher accepts a caller-supplied record rather than evidence bound to the actual verifier process. The at-least field list permits incompatible encodings or a fabricated structurally plausible approval to satisfy candidate hash and length comparisons without proving that the independently authored verifier and its required mutation suite accepted those exact bytes.
```

Exact required remediation text:

```text
A no-clobber successor must freeze the approval record magic, version, complete ordered field and type grammar, exact candidate and contract hashes and lengths, fixed reviewed verifier-source and mutation-suite identities, result counts, forbidden extra or trailing bytes, and verifier execution provenance. The publisher must obtain or authenticate that exact approval from the direct independently identified verifier execution over a retained channel or equivalently unforgeable mechanism and must reject any caller-constructed, self-described, mismatched, incomplete, or replayed approval before opening the final path.
```

## 2. Retained-descriptor live-freeze publication bracket

The v2.9 Sections 1 and 2 exact 57-file selection, nine explicit runner names,
excluded Gate-A runner, 48-member native-root set, precheck, owner-authorization
requirement, two post-transition snapshots, expected `0444`/`0555` modes, and
zero-authority boundary remain normative.

After a separately owner-authorized permission transition and fresh final
Gate-A review, the publisher/controller must establish one uninterrupted
publication bracket before it invokes the generator. The bracket remains open
until after companion final re-read, parent durability, and the postpublication
live projection have all completed.

The controller starts at a retained descriptor for the physical workspace root.
It performs a component-by-component no-follow directory walk and retains
descriptors for the workspace root, `scripts`, `scripts/native`, the dedicated
v2.7-attempt native root, and `docs`. Every component must be an ordinary
directory, not a symbolic link, and must remain on the expected physical
workspace/mount. No pathname-only check may substitute for a held descriptor.

For each retained directory, `DirectoryIdentity` contains at least:

```text
absolute expected component path encoded as canonical UTF-8 bytes
st_dev as unsigned 64-bit integer
st_ino as unsigned 64-bit integer
S_IFDIR type
permission and file-flag bits
st_uid and st_gid
st_nlink as unsigned 64-bit integer
st_ctimespec seconds and nanoseconds
statfs filesystem ID
statfs mount-from and mount-on byte hashes
```

The controller opens all 57 selected files read-only and no-follow relative to
the appropriate retained directory descriptor and keeps every file descriptor
open for the complete bracket. Each `SelectedFileIdentity` contains:

```text
exact repository-relative UTF-8 path
st_dev and st_ino
S_IFREG type
st_nlink=1
mode=0444
file flags and extended-ACL presence/status
st_uid and st_gid
st_size
st_mtimespec seconds and nanoseconds
st_ctimespec seconds and nanoseconds
complete-file SHA-256
canonical complete xattr name/value projection SHA-256
```

Every selected descriptor must deny an effective write-access probe under the
review process identity. An extended ACL that grants write, an unreadable ACL
or xattr projection, an unsupported file flag, or any ambiguity fails before
candidate construction. The inherited HMG4Y2 production xattr policy is not
repurposed as this evidence-freeze projection.

The controller encodes the complete prepublication projection as `HMG4LF1`:

```text
8 bytes   magic = 48 4d 47 34 4c 46 31 00  (HMG4LF1 NUL)
U16_BE    version = 1
U16_BE    status = 1
U32_BE    directory-row-count
U32_BE    selected-file-row-count = 57
U32_BE    native-root-member-count = 48
U32_BE    top-level-runner-count = 9
rows      directory rows, then selected-file rows
32 bytes  native-root complete membership SHA-256
32 bytes  selected checksum-set SHA-256
32 bytes  HMG4LF1-prefix SHA-256
```

Every variable-length byte string is preceded by canonical `U32_BE` length;
integers use the exact widths above or their field definitions; directory rows
are ordered by unsigned expected-path bytes; selected rows are ordered by
unsigned repository-relative-path bytes. Unknown, duplicate, missing,
reordered, noncanonical, oversized, truncated, or trailing data is forbidden.
The final digest is SHA-256 of every preceding HMG4LF1 byte and is not included
in its own preimage.

The native-root membership hash covers every immediate directory entry as
`type || U32_BE(name-length) || name-bytes || identity-hash`, in unsigned name
order, and must contain exactly the 48 selected regular files and nothing
else. For the shared `scripts` directory, only the nine explicitly selected
runner leaves and its own retained directory identity are in scope; unrelated
siblings are not freeze members. For `scripts/native`, the dedicated native
root leaf and the retained parent identity are in scope. The complete `scripts`
and `scripts/native` directory timestamps are nevertheless bracket guards:
their device, inode, type, flags, mode, mount, and `st_ctimespec` must not change
during the bracket. This detects a selected-leaf or native-root rename-away-and-
restore event even if the final names are restored.

The controller computes the prepublication HMG4LF1 from the held descriptors
and simultaneously proves that fresh `openat` resolution of every selected
leaf reaches the same device/inode. It records that exact HMG4LF1 SHA-256 in
the verifier request and approval record.

After companion final re-read, but before any PASS result, the controller:

1. re-fstats and completely rehashes all 57 retained file descriptors;
2. recomputes their ACL and xattr projections;
3. re-enumerates the native root through the retained directory descriptor;
4. performs a fresh complete no-follow walk from the physical workspace root;
5. reopens every selected leaf relative to the freshly resolved directories;
6. requires every fresh leaf to equal the retained device/inode identity;
7. rechecks every retained and fresh directory identity and bracket-guard
   timestamp; and
8. constructs a postpublication HMG4LF1 canonical semantic projection.

The postpublication HMG4LF1 must be byte-for-byte identical to the approved
prepublication HMG4LF1. Any content, mode, ACL, xattr, flag, uid/gid, type,
link-count, size, timestamp, device/inode, mount, path, selected-member,
native-membership, shared-parent-bracket, or no-follow resolution drift makes
the published bytes an occupied failed artifact and leaves Gate A open. No
repair, rewrite, unlink, re-freeze, retry, or successor implementation is
authorized.

## 3. Companion namespace and inode continuity

The exact final leaf is the slash-free ASCII byte string:

```text
G4_L10_NATIVE_HELPER_V2_10_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md
```

The controller retains the complete descriptor chain from the physical
filesystem root through every absolute workspace path component and the exact
`docs` parent. Each component is opened with directory and no-follow semantics;
its `DirectoryIdentity`, component name, mount identity, and parent-child
relationship are recorded before candidate generation.

The final leaf must be absent under the retained `docs` descriptor and under a
fresh complete no-follow descriptor walk before generator invocation, before
verifier invocation, and immediately before publication. Any occupied,
ambiguous, linked, or differently resolved leaf fails before final open.

Publication uses only descriptor-relative native operations:

```text
openat(retained_docs_fd,
       fixed_slash_free_leaf,
       O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW,
       0444)
```

There is no pathname `open`, rename, hard-link publication, temporary target,
or fallback. The controller immediately `fstat`s the returned descriptor and
retains the created `FileIdentity`: device, inode, regular type, nlink=1, mode,
flags, uid/gid, and expected leaf. It writes only the verifier-approved bytes,
synchronizes that file descriptor, verifies/fixes no permission through any
path operation, requires descriptor mode `0444`, and synchronizes the same
retained `docs` directory descriptor.

After closing the write descriptor, the controller reopens the same fixed leaf
read-only and no-follow only with `openat` on the same retained `docs`
descriptor. The reopened descriptor must have the exact created device/inode,
regular type, nlink, mode, flags, uid/gid, byte length, and SHA-256. Its complete
bytes must equal the approved candidate byte-for-byte.

The controller then performs a new no-follow absolute descriptor walk and
requires every ancestor and the displayed `docs` path to resolve to the exact
retained device/inode/mount chain. `fstatat`/equivalent no-follow observation of
the fixed leaf under both retained and freshly resolved `docs` descriptors must
equal the created/reopened `FileIdentity`. Only the fixed final leaf may be the
one expected membership addition to `docs`; every other observed docs member
identity must be unchanged from the bracket's prepublication inventory.

Any ancestor, parent, mount, membership, leaf, device/inode, type, link-count,
mode, flag, byte, durability, or displayed-path mismatch after final open
leaves only an occupied failed artifact in the retained namespace. It is never
repaired, truncated, renamed, unlinked, overwritten, relabeled, or called a
companion. A new no-clobber contract version is required.

## 4. Exact Gate-A tool-set and direct producer continuity

The Gate-A generator, independent verifier, mutation suite, publisher/controller,
and exact Node runtime are one reviewed tool set, distinct from the production
helper. Their canonical `HMG4GAT1` manifest contains exactly five rows:

```text
generator source
independent verifier source
mutation-suite source
publisher/controller source
absolute Node executable
```

Each row contains a closed role code, canonical project-relative path except
for the exact absolute Node path, regular single-link type, mode, byte length,
and complete SHA-256; rows are sorted by role code. The manifest has fixed
magic/version, exact row count five, canonical lengths, no extras or trailing
bytes, and a final SHA-256 over every preceding byte. Final reviewers must read
all five objects completely, review the four sources, independently rehash the
Node executable, and bind the exact HMG4GAT1 bytes and SHA-256 in the review
batch and companion candidate.

The publisher/controller source contains literal expected complete SHA-256
values for the generator, verifier, mutation suite, and Node executable. It
accepts no CLI, environment, IPC, config, path, descriptor, module, callback,
or caller override for those identities. The final independent review binds
the publisher source SHA-256 separately, eliminating a self-hash cycle.

Before the publication bracket, the controller opens the four sources and
Node executable read-only and no-follow through retained descriptors, requires
ordinary single-link identities, completely hashes them, and keeps the
descriptors open through publication. It invokes the generator and verifier
only through those pinned identities with `shell=false`, a fixed minimal
environment, a fixed working directory, closed unintended descriptors, and
fixed one-shot anonymous pipes. The caller cannot supply candidate bytes or an
approval record.

The controller directly invokes the pinned generator and receives exactly one
complete candidate byte stream on its private candidate pipe. It validates and
snapshots those bytes with no callback, asynchronous yield, alternate view, or
alternate byte source before verifier invocation.

The controller creates a fresh 32-byte operating-system CSPRNG challenge after
the publication bracket starts. It directly invokes the pinned independent
verifier as one child process. The verifier program and mutation suite are
loaded from their already-held source descriptors; candidate bytes, challenge,
contract identity, HMG4GAT1 identity, prepublication HMG4LF1 identity, and
expected finding counts travel only over fixed fresh anonymous pipes. The
controller records the exact child PID, start/finish times, exit status, pipe
byte counts/hashes, and executable/source identities.

The verifier must completely consume the request and candidate, independently
recompute all identities, execute the exact reviewed mutation suite through the
same verification function used on the candidate, and emit either exactly one
success approval record or no approval bytes. Any error requires nonzero exit,
empty approval output, and diagnostic-only stderr. The controller requires
approval EOF, successful child exit, exact process identity, and exactly one
canonical approval record before it may proceed.

There is no API, path, environment variable, inherited file, replay cache, or
caller object through which an approval can be injected. The fresh challenge,
direct child PID/pipe ownership, held source descriptors, exact tool-set hash,
complete pipe transcript, and successful wait status together constitute the
producer-continuity evidence. A replayed approval cannot match the undisclosed
fresh challenge before verifier execution.

## 5. HMG4GA1 verifier-approval byte grammar

A success approval is exactly 324 bytes in this order:

```text
offset  size  field
0       8     magic = 48 4d 47 34 47 41 31 00  (HMG4GA1 NUL)
8       2     U16_BE version = 1
10      2     U16_BE status = 1
12      4     U32_BE record-length = 324
16      32    fresh publisher challenge
48      32    frozen v2.10 contract SHA-256
80      8     U64_BE frozen v2.10 byte length
88      32    candidate SHA-256
120     8     U64_BE candidate byte length
128     32    independent verifier source SHA-256
160     32    mutation-suite source SHA-256
192     32    HMG4GAT1 tool-set SHA-256
224     32    prepublication HMG4LF1 SHA-256
256     4     U32_BE required-finding-count = 33
260     4     U32_BE new-finding-count
264     4     U32_BE open-P0-count = 0
268     4     U32_BE open-P1-count = 0
272     4     U32_BE open-P2-count = 0
276     4     U32_BE required-mutation-case-count
280     4     U32_BE passed-mutation-case-count
284     4     U32_BE final-review-unit-count = 3
288     4     U32_BE final-review-command-count
292     32    SHA-256 of bytes 0..291
```

All integers are unsigned and minimally fixed-width as stated. SHA-256 fields
are raw 32-byte digests, not text. Counts use checked arithmetic and their
independently recomputed exact expected values. Mutation-pass count must equal
mutation-case count and be nonzero. New-finding count may be zero; every new
finding must nevertheless be present in the companion finding union and
remediated. The record permits no optional, duplicate, unknown, reordered,
variable-width, padded, truncated, oversized, or trailing byte.

The independent verifier constructs HMG4GA1 only after all candidate, command,
topology, source, live-freeze, mutation, finding, count, and byte-hygiene checks
succeed. The controller parses the 324 bytes independently, recomputes the
prefix digest, checks every literal and field against its own held identities,
challenge, candidate snapshot, expected counts, HMG4GAT1, and HMG4LF1, and
rejects any mismatch before final-path open.

Immediately before publication, the controller again completely hashes its
candidate snapshot and requires equality with both HMG4GA1 and the verifier
pipe transcript. The exact same immutable local byte snapshot is the only
source for the descriptor-relative companion write.

## 6. Review topology, finding union, and current closed gate

The v2.9 pre-Gate-A versus fresh final Gate-A distinction and exact
two-scoped-plus-one-whole final topology remain normative. A pre-Gate-A v2.10
contract review may identify specification defects but cannot create any
HMG4GAT1 tool, candidate, approval, companion, or implementation.

The exact future companion path is:

`docs/G4_L10_NATIVE_HELPER_V2_10_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.10 Successor Independent Review
```

The required finding union contains the 30 rows inherited by v2.9 plus the
three canonical v2.9 P1 rows in Section 0, for exactly 33 required historical
rows before any new finding. Reviewer-local aliases are retained in narrative
provenance but do not duplicate canonical finding rows.

`V28-GATE-A-PREPUBLICATION-VERIFIER-BINDING-UNDEFINED` cannot name v2.9 as its
confirmed remediation. It and
`V29-VERIFIER-APPROVAL-GRAMMAR-PROVENANCE-UNDEFINED` may name the frozen v2.10
SHA-256 only after all independent reviewers confirm Sections 4 and 5.
`V29-COMPANION-PARENT-LOOKUP-TOCTOU` may close only after reviewers confirm
Section 3. `V29-LIVE-FREEZE-PUBLICATION-TOCTOU` may close at specification
level only after reviewers confirm Section 2; its operational execution still
depends on the separately authorized live freeze and a fresh final batch.

`V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED` remains open with no
remediation hash while the current selected files are `0644` and the native
root is `0755`. Therefore current Gate A is false and no HMG4GAT1 source,
candidate, approval, companion, implementation, or helper test may be created.

Final PASS later requires all 33 required rows plus every new finding to be
remediated; current two-snapshot live freeze; the complete retained-descriptor
publication bracket; exact pre/post HMG4LF1 equality; exact HMG4GAT1 identity;
direct verifier producer continuity; canonical HMG4GA1; descriptor-relative
companion publication and inode equality; final-path no-follow re-resolution;
strict argv grammar and mutation suite; exact scoped/whole coverage; and final
`open-p0/open-p1/open-p2=0/0/0`.

## 7. Closed implementation and runtime boundary

Before a valid v2.10 companion completes every Section 2 through 6 check, no
v2.10 production-helper implementation directory, source port, dispatcher,
filesystem or journal engine, build artifact, fixture, implementation test, or
implementation-review packet may be created. Gate-A review tooling is also
absent and forbidden while the live freeze remains false.

A future valid v2.10 Gate-A PASS would authorize only the already bounded
workspace-only production-helper implementation and nonprivileged tests. It
would not authorize helper `apply` or `recover`, including fixtures; protected
installation; protected parent, ACL, UID, GID, launcher, system, or volume
mutation; original-runtime launch; acceptance; promotion; integration;
release; or publication.

No contract, review, live snapshot, Gate-A tool, candidate, approval,
companion, source, compilation, or test result has acceptance effect,
original-runtime authority, fidelity effect, audio-acceptance effect,
promotion effect, integration effect, release effect, or publication effect.
