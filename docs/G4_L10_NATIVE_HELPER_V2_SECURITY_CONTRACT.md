# Grade 4 Lesson 10 native transaction helper v2 security contract

Status: **design-only, not installed, not executable against the live workspace**  
Evidence date: **2026-08-04**  
Scope: the 114-output Lesson 10 nested-parent downstream successor transaction  
Acceptance effect: **none**

This contract defines the minimum security boundary for a future native macOS
helper. The contract itself authorizes no implementation, compilation, fixture
mutation, installation, launch, or apply. Each of those actions requires a
separate active user request at the corresponding boundary. It does not
authorize Adobe Animate, Adobe Flash Player Projector, an original-runtime
session, source promotion, renderer registration, fidelity, audio acceptance,
human review, owner acceptance, strict completion, lesson integration,
whole-course integration, or publication.

The existing v1 transaction remains frozen and forbidden in every mode that can
reach its mutation path:

- generator:
  `scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.mjs`
- generator SHA-256:
  `0d2aeb203281fc350b5e440b9669ca995aa6be17ad8e28784b8956b53436754d`
- tests:
  `scripts/materialize-g4-l10-nested-parent-downstream-successor-v1.test.mjs`
- tests SHA-256:
  `e68d8cf06a984371b17c41364fab54ab464b2a69aa570849915a93b3b96dd928`
- current decision: `DO_NOT_APPLY`
- forbidden until a reviewed successor replaces the unsafe path:
  v1 `--apply`, v1 `--dry-run`, v1 downstream `--check`, and v1 transaction
  tests that exercise those paths

## 1. Security findings that v2 must close

### P0-1: verified custody leaf can be replaced before pathname deletion

V1 verifies the post-rename custody object, then removes a pathname leaf with
`unlinkat(parent_fd, leaf, 0)`. A concurrent process can move the verified inode
and install a foreign inode at the same leaf between the final identity check and
the unlink. The unlink then acts on the object resolved by name at call time, not
on the previously verified held object.

V2 must have no delete operation, no cleanup operation, and no code path that
calls `unlink`, `unlinkat`, `remove`, `rmdir`, or recursive removal. The helper
must not cause last-link loss. Every helper-initiated namespace transition is
recorded in a managed-inode ledger as custody-to-live or live-to-custody. An
external writer can still remove a user-owned leaf; that event is detected and
requires manual recovery rather than an impossible promise that the helper can
recreate a pathname from a held descriptor.

macOS does not expose a rename-by-held-file-descriptor compare-and-swap for this
workflow. `renameatx_np(parent_fd, leaf, ...)` resolves the source leaf when the
system call runs; a preceding `openat`/`fstat` does not bind that later rename to
the inspected inode. `RENAME_EXCL` protects the destination from replacement,
but does not compare the source inode. Therefore the strong production claim
that a foreign source inode is never moved is permitted only when every source
and destination parent is inside a separately authorized protected writer
domain that untrusted processes cannot mutate. That domain must also exclude
write, truncate, writable-`mmap`, link, `chmod`, `chown`, ACL, flag, and xattr
authority over every managed source, stage, preimage, rollback, journal,
receipt, and installed live inode. Production authorization requires evidence
that no untrusted process retained a writable file descriptor or writable
mapping from before the access-control transition. Protecting parent directory
entries alone is insufficient. An unprivileged build is fixture-only: a source-
leaf swap can be moved to a unique destination before post-rename detection,
after which the helper must stop, retain every reachable object, and report
`MANUAL_RECOVERY_REQUIRED`.

### P0-2: ancestry checks are separated from pathname writes

V1 checks ancestors and later creates locks, reports, archives, stages, or
formal outputs through full pathnames. A writable ancestor can be replaced
between those actions. A post-write mismatch can detect the redirection but
cannot undo bytes already written into the wrong tree.

V2 must open the project root once, walk every managed directory one component
at a time, retain the resulting directory descriptors for the whole
transaction, and perform every managed read, creation, and rename relative to
those descriptors.

### P0-3: recursive pathname cleanup occurs before mode dispatch

V1 can create clones or helper build roots and recursively remove them before it
has conclusively dispatched a read-only mode. Consequently, its nominal
`--check` and `--dry-run` paths are not suitable read-only safety probes.

V2 must dispatch its mode before generation or mutation. `verify` is strictly
read-only. Candidate preparation belongs to a separate development planner and
is explicitly a write operation that retains all created artifacts. The
production helper has no `prepare` operation. There is no automatic cleanup in
success, failure, rollback, or recovery.

### P0-4: managed artifacts can precede the first durable journal record

No request copy, archive, stage, preimage, formal output, or receipt may be
created before a transaction journal exists. After read-only preflight and lock
acquisition, the first managed mutation is exclusive creation of the journal,
followed immediately by a synced `BEGIN` record. A crash during or before that
record can leave a partial journal leaf, so startup scans every transaction-
prefixed custody leaf, not only valid journals, and blocks new apply on any
orphan, partial, nonterminal, or terminal-inconsistent transaction.

## 2. Threat model

Within the stated protected-writer preconditions, V2 must fail closed against:

- ancestor or parent rename/replacement between any observation and namespace
  mutation;
- file, directory, symlink, hardlink, or extra-entry injection;
- replacement of a stage, archive, receipt, journal, request, plan, policy,
  lock, helper binary, or custody entry;
- conflicting concurrent transactions;
- process termination, short writes, interrupted system calls, partial sync,
  and a crash at every transaction phase, plus the documented target-specific
  durability envelope for sudden power loss;
- hostile or malformed plan fields, paths, counts, lengths, offsets, modes,
  identities, and SHA-256 values;
- use of the helper as a generic move, write, delete, or filesystem-management
  utility; and
- silent fallback when a required macOS/APFS capability is absent.

Trusted components are limited to the macOS kernel, the protected writer-domain
access-control boundary, held descriptor-to-vnode identity, the reviewed
SHA-256 implementation, a reproducibly built and reviewed helper binary in a
non-user-replaceable installation parent, and the exact approved policy and
plan hashes. Held descriptors prevent ancestor redirection, but do not turn a
leaf-name rename into a source-inode compare-and-swap.

The helper must not claim to defend against an attacker who can modify kernel
state or helper process memory.

### Same-UID custody limit

A normal helper running as the project user cannot make long-term custody
undeletable by another malicious process with the same UID. File modes and
user-owned immutable flags are not a complete defense against the owner of the
object. The unprivileged fixture claim is therefore deliberately narrower:

- the helper itself never deletes;
- it never overwrites or unlinks a foreign or replacement inode, although a
  pathname-based rename can move an unexpected inode to a unique destination;
- it retains and verifies exact descriptors while active;
- every helper-observed transition is hash- and inode-bound in the journal;
- the helper does not cause an unaccounted managed-inode loss, while an
  externally induced loss of addressability is detected but may not be
  repairable without protected custody; and
- protection against deliberate same-UID deletion after helper exit requires a
  separately authorized protected custody domain, root-owned broker, service
  UID, access-controlled destination parents, or a read-only snapshot.

Formal production use requires that protected domain, not merely a root-owned
binary. If an untrusted process can rename entries in any formal, stage,
preimage, rollback, receipt, journal, or custody parent; modify any managed
inode in place; change its ownership, mode, flags, ACL, link set, or xattrs; or
retain a writable descriptor/mapping opened before protection, `apply` is
forbidden. The policy binds the sole writer service identity and the exact
owner, group, mode, flags, ACL hash, and xattr-policy hash for every managed
role. New production inodes should be created inside the protected domain from
birth. Admission of a pre-existing user-writable inode requires a separately
reviewed quiescence and access-revocation receipt; inability to prove absence of
pre-existing writable handles is a hard blocker.

## 3. Helper shape and authority

The proposed production binary is a dedicated, non-setuid, non-networked,
single-process C11 program named:

```text
help-math-g4-l10-successor-v2
```

It must not accept generic filesystem commands. Its only production protocol
operations are:

```text
probe
verify
apply
recover
```

Candidate bundle creation is performed by a separate development-only planner:

```text
development planner
  -> candidate bundle and hashes
  -> independent review
  -> production policy generation
  -> protected binary/policy installation
  -> production probe/verify/apply/recover
```

`apply` and `recover` are constrained by a compiled policy that fixes:

- the exact release ID;
- the transaction-ID format, operating-system entropy source, byte length,
  uniqueness rules, and custody-name grammar, but not a future random value;
- exactly 114 managed output paths;
- the SHA-256 of the canonical derived kind-1 path allowlist;
- the allowed predecessor states and desired blob hashes;
- report-last installation order;
- the pre-provisioned custody anchor and permanent lock;
- exact descriptor-walkable protected parents and relative paths for the plan,
  bundle, target-volume capability receipt, system-lock-volume capability
  receipt, quiescence receipt, and operator-authorization evidence;
- permitted file types, owners, modes, link counts, and device;
- the sole writer service identity, per-role owner/group/mode/flags, ACL hash,
  xattr-policy hash, and quiescence/access-revocation receipt requirements;
- the no-overwrite and no-delete invariants; and
- acceptance effects of `false` for every migration and publication gate.

The production process must retain root, parent, custody, plan, policy, lock,
request, stage, preimage, and journal descriptors until the terminal protocol is
complete. Node must not start one helper process per file.

## 4. Descriptor-relative filesystem contract

All flags below are required capabilities. Read-only `probe` reports compile-
time symbols, OS/SDK identity, mount identity, and policy compatibility. A
separately authorized, mutating `fixture-capability-test` must verify actual
create, rename, sync, crash, and race behavior inside a new disposable fixture
on the exact target volume. Unsupported flags or semantics block production
use; v2 must not silently weaken the contract.

The exact descriptor-relative namespace flag table is:

```text
root open:
  O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY

component openat:
  O_RDONLY | O_DIRECTORY | O_CLOEXEC |
  O_NOFOLLOW | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH

ordinary-file openat:
  O_RDONLY | O_CLOEXEC |
  O_NOFOLLOW | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH | O_UNIQUE

exclusive-create openat:
  O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC |
  O_NOFOLLOW | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH | O_UNIQUE

fstatat:
  AT_SYMLINK_NOFOLLOW | AT_SYMLINK_NOFOLLOW_ANY |
  AT_RESOLVE_BENEATH | AT_UNIQUE

renameatx_np:
  RENAME_EXCL | RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH
```

Any `EINVAL`, `ENOTSUP`, missing compile-time symbol, or behavior mismatch for a
required production capability blocks apply. There is no fallback that removes
a flag or substitutes plain `rename`.

The separately frozen linked-symbol allowlist must contain only reviewed C
runtime, CommonCrypto SHA-256, and these required primitive families: `open`,
`openat`, `close`, `read`, `pread`, `write`, `pwrite`, `fstat`, `fstatat`,
`fstatfs`, `fgetattrlist`, `getdirentries64`, `lseek`, `readlinkat`,
`renameatx_np`, `fsync`, `fcntl` with fixed commands including `F_FULLFSYNC`,
`flock`, `getentropy`, `fchown`, `fchmod`, `fchflags`, FD-based ACL operations,
`flistxattr`, `fgetxattr`, and `fsetxattr`. Exact symbol names, SDK constants,
and linked-library versions are build-receipt inputs. Pathname-based `chmod`,
`chown`, `chflags`,
ACL mutation, xattr mutation, and every dynamic syscall/symbol escape remain
forbidden. The no-delete rule also forbids `fremovexattr`; production objects
are created with an exact allowed xattr set from birth or rejected before
admission.

### Root pinning

The only production use of an absolute managed pathname is the initial opening
of the explicitly approved project root. The helper opens it with the exact root
flags above and immediately verifies type, device, inode, owner, and mode. Once
pinned, managed targets are never resolved from the root pathname again. Owner
and mode are identity/drift evidence only on a volume where filesystem ownership
is disabled; they do not establish a security boundary there.

### Component walk

The compiled policy stores each of the 114 relative paths as one exact byte
string and binds their canonical derived kind-1 allowlist hash. The helper performs no case
folding and no Unicode NFC/NFD conversion. A request path must byte-for-byte
match one policy entry. Absolute paths, empty components, `.`, `..`, embedded
separators inside a component, NUL, and any non-ASCII byte in this v2 release
are rejected; the backslash byte is also forbidden in every authority-bearing
v2 path type. Receipt-only `OBSERVED_CUSTODY_LEAF` preserves exact enumeration
bytes under its separate non-authority rules. A
`POLICY_REL_PATH` may contain zero or more `/` bytes; every slash is used only
as the separator between two nonempty valid components. A leading, trailing,
or repeated slash is forbidden. The initial slash in `APPROVED_ABS_ROOT_PATH`
is a root marker and is
not an empty component. A `SAFE_CUSTODY_LEAF` may contain period bytes in a
reviewed suffix such as `.bin`, but the entire leaf may not equal `.` or `..`.
Each directory component is opened through the held parent descriptor with the
exact component flags above, then checked with `fstat`.

The contract path vectors are normative: `a/b`, `Lesson_10/report.json`, and
`tx-` followed by the policy-defined transaction grammar and `.log` suffix are
accepted in their respective path types. `/a`, `a/`, `a//b`, `a/./b`,
`a/../b`, `a\\b`, a NUL-bearing byte string, a non-ASCII byte string, and a
custody leaf equal to `.` or `..` are rejected. An absolute root such as
`/Volumes/WestWorld/HELP MATH 2.0` is parsed after consuming its one root marker;
every remaining component must be nonempty and pass the same byte rules.

### FD-relative directory enumeration and exact spelling

Every all-`tx-*` scan and every exact-case claim is made from a held directory
descriptor. The helper rewinds that descriptor with `lseek(fd, 0, SEEK_SET)`,
enumerates with `getdirentries64`, validates every returned record length and
name length, and excludes only the exact `.` and `..` entries. `d_type` is a
witness only; `fstatat` with the required no-follow flags determines object
type. Names are retained as exact bytes, sorted by unsigned byte order, and
hashed with the derived-set framing below. Duplicate byte names, invalid UTF-8
assumptions, non-ASCII names in a managed v2 namespace, and two distinct names
whose ASCII-lowercase bytes collide are fail-closed. The helper performs the
same enumeration a second time before authorization and requires the exact
ordered name/type-witness stream and directory identity to match. On a
case-insensitive volume, `openat(parent, requested_name, ...)` is never evidence
of exact spelling by itself; the actual enumerated directory-entry bytes must
equal the policy bytes.

### Existing ordinary files

Managed files are opened relative to a held parent descriptor. They must be
ordinary, non-symlink, same-device files with the expected owner and mode. When
the policy requires a unique inode, `st_nlink` must be exactly 1. The helper
reads and hashes through the held descriptor and verifies the expected byte
count and SHA-256 before use.

### FD-only metadata contract

All owner, group, mode, flags, ACL, and xattr reads and mutations use the same
held ordinary-file descriptor. For a new object the exact order is `fchown`,
`fchmod`, FD ACL set, each `fsetxattr(..., XATTR_CREATE)` in unsigned-name-byte
order, then `fchflags` last. A pre-existing attribute on a supposedly new object
is a refusal, never an overwrite. The helper never reopens or applies metadata
by pathname. It then reads every field back from the same descriptor, compares
canonical hashes, calls `fsync` and `F_FULLFSYNC`, and only then permits a rename
or journal authorization record.

The canonical ACL byte stream is:

```text
8-byte magic "HMG4A2" + 2 NUL
U32 version = 2
U32 ordered entry count
for each ACL entry in policy/semantic order:
  U32 tag enum
  U32 qualifier length, then exact qualifier bytes (zero or 16-byte UUID)
  U64 permission bitmask
  U64 inheritance/entry-flag bitmask
```

ACL entry order is preserved because macOS extended ACL order can be semantic;
it is not sorted by name. Names are never serialized, only fixed numeric tags
and UUID bytes. The empty ACL is the header plus count zero. Unknown tags,
unknown permission/flag bits, duplicate singleton principals, non-UUID named
qualifiers, or trailing bytes are rejected. The ACL SHA-256 covers that complete
stream.

V2 freezes contract-local ACL numbers rather than serializing accidental SDK
enum values. `tag enum` is `1 extended-allow-named-UUID` or
`2 extended-deny-named-UUID`; both require a 16-byte qualifier returned by the
reviewed UUID ACL API. POSIX owner, group, and everyone mode rights are not
invented as zero-qualifier extended ACL entries: they are represented only by
the separately serialized owner UID, group GID, and mode. If the macOS API
returns an owner/group/everyone or other tag that cannot be represented as one
of these two named-UUID forms, production v2 refuses that ACL. The SDK mapping
from `ACL_EXTENDED_ALLOW` and `ACL_EXTENDED_DENY` to local values 1 and 2 is a
build- and fixture-receipt input.

The permission mask uses these contract-local bits, with every other bit
forbidden:

```text
bit 0  read-data / list-directory
bit 1  write-data / add-file
bit 2  execute / search
bit 3  delete
bit 4  append-data / add-subdirectory
bit 5  delete-child
bit 6  read-attributes
bit 7  write-attributes
bit 8  read-extended-attributes
bit 9  write-extended-attributes
bit 10 read-security
bit 11 write-security
bit 12 change-owner
bit 13 synchronize
```

The inheritance/entry-flag mask uses bit 0 `file-inherit`, bit 1
`directory-inherit`, bit 2 `limit-inherit`, bit 3 `only-inherit`, and bit 4
`inherited`; all higher bits are forbidden. The implementation maps the named
macOS ACL permission and flag constants to these local bits one by one and
fails if it observes an unmapped supported-SDK bit.

The following exact vectors are normative (hex is the complete canonical
stream, followed by SHA-256):

```text
empty:
  484d4734413200000000000200000000
  663092dea145f9bee33eb67efabb79e6a6016efe74d8ebaba259186a31c75701

one allow entry, qualifier 00..0f, permission bit 0, flags 0:
  484d47344132000000000002000000010000000100000010000102030405060708090a0b0c0d0e0f00000000000000010000000000000000
  378ca51cd3ef4c63eaa7262b68856bb70bc3748ebccfa8d20b544a71a7b5c406

the preceding entry followed by deny qualifier f0..ff, permissions bits 0/1,
flag bit 0:
  484d47344132000000000002000000020000000100000010000102030405060708090a0b0c0d0e0f000000000000000100000000000000000000000200000010f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00000000000000030000000000000001
  b253324ae5014bf8ea839017a93b0b86df894343ec7a3d668a06e2a9ae9027b0
```

The canonical xattr-set byte stream is:

```text
8-byte magic "HMG4X2" + 2 NUL
U32 version = 2
U32 attribute count
for each attribute sorted by unsigned name bytes:
  U32 name length, exact non-NUL name bytes
  U64 value length, exact value bytes
```

The policy fixes the exact allowed name/value set, per-value and total bounds,
and whether the exact empty set is required. No implicit, volatile, security-
relevant, quarantine, Finder, or resource-fork xattr is ignored. Enumeration is
repeated until two consecutive FD-based reads have the same name set; any drift,
unknown name, duplicate, read truncation, or trailing byte blocks apply. The
xattr SHA-256 covers the complete canonical stream.

### Exclusive creation

Every stage, archive object, request copy, journal, and receipt is created
relative to a held parent descriptor with the exact exclusive-create flags,
mode `0600`, and `umask(077)`. The helper handles short writes and `EINTR`,
hashes while writing, verifies size and hash, and sets the final mode. It then
calls `fsync(file_fd)` and `fcntl(file_fd, F_FULLFSYNC)` for every transaction-
authorizing or recovery-required object: all journal records, request copies,
plans and bundle metadata, every one of the 114 stage blobs before its first
possible live rename, every archive/preimage before its live predecessor moves,
every rollback object before it becomes recovery authority, and every terminal
receipt. It verifies held-FD and namespace-leaf identity and `fsync`s each
affected parent directory. A create or rename record becomes authoritative only
after the corresponding file and parent ordering has completed. There is no
policy option to classify a formal stage or required recovery object as non-
critical. A missing/unsupported capability found before journal-leaf creation
produces `BLOCKED_CAPABILITY_BEFORE_BEGIN` and blocks production use. After the
journal leaf has been created, any capability or I/O failure is transaction-
bearing: it produces `recoverable-nonterminal`, or a status-matched
`manual-recovery-required` terminal sequence when that sequence can itself be
made durable. It may never return the pre-BEGIN status or omit its transaction/
journal identity. The all-`tx-*` scanner treats a failed/partial `BEGIN` as
nonterminal even when no authoritative receipt could be completed. The receipt
records the exact durability-envelope enum and both capability receipts; it
never turns these operations into an absolute hardware power-loss guarantee. An
identity mismatch is retained for recovery; it is not cleaned up.

### No-replace rename

The only managed namespace move is a descriptor-relative macOS no-replace
rename using `renameatx_np` with `RENAME_EXCL` and the required no-follow and
resolve-beneath capabilities. Source and destination are single leaf names.

- The source is opened and identity-checked before the rename.
- This check is not a source-inode CAS. Production rename is allowed only when
  access control prevents untrusted mutation of both parents.
- Destination absence checks are diagnostic only; `RENAME_EXCL` is the atomic
  authorization point.
- `EEXIST`, `EXDEV`, unsupported capability, or identity drift fails closed.
- The destination is checked against the held source after the rename. In an
  unprivileged fixture, a mismatch means the unexpected inode may already have
  moved; it is not deleted or overwritten and the result is manual recovery.
- Both parent directories are `fsync`ed after each rename, followed by the
  journal record and its required `fsync`/`F_FULLFSYNC` before the next rename.
- Plain overwriting `rename` and `RENAME_SWAP` are forbidden.

### Directory provisioning

Production `apply` must not depend on creating a new directory hierarchy and
then racing to open it. The custody anchor, permanent lock parent, and all
formal output parents must be provisioned, reviewed, and non-writable by
untrusted processes before apply. Every managed inode must likewise be
non-writable and metadata-protected from untrusted processes; parent protection
alone is insufficient. The quiescence receipt must prove that no untrusted
process retained a writable descriptor or mapping across the protection
transition. Custody uses a flat namespace of unique, transaction-bound,
content-addressed leaves.

## 5. No-delete invariant

The source and linked binary must contain no delete or recursive-cleanup
capability:

- no `delete` or `cleanup` protocol command;
- no call or imported symbol for `unlink`, `unlinkat`, `remove`, `rmdir`,
  `system`, `popen`, `nftw`, or `fts`;
- no `syscall`, `dlopen`, `dlsym`, `exec*`, `posix_spawn*`, `fork`, or `vfork`
  path that can bypass the reviewed call graph;
- no shell command execution;
- no Node or shell recursive removal in the development planner;
- no overwriting rename; and
- no retention or space-reclamation operation.

A rename removes one namespace name, but the same inode should remain reachable
at its no-replace destination. In this contract, no-delete means that the helper
does not request unlink, overwrite, or last-link loss and records every expected
custody-to-live or live-to-custody state transition. An external actor can still
remove a user-owned leaf; the managed-inode ledger must report that as an
unaccounted external loss and require manual recovery. The helper does not claim
it can restore a pathname from a held descriptor after the last namespace link
has disappeared.

Static proof must include source scanning, an exact frozen `nm -u` undefined-
symbol allowlist, and an exact `otool -L` library allowlist for the reviewed
binary. A denylist alone is insufficient. Dynamic fixture proof must show that
the helper never unlinks or overwrites foreign sentinels, that after a helper-
initiated unexpected rename the helper itself preserves the unique destination
leaf and does not cause last-link loss, and that the managed-inode ledger has no
helper-caused unaccounted loss across success, refusal, crash, rollback, and
recovery. A subsequent externally induced leaf loss must be detected and
reported, but is not claimed preventable in an unprivileged fixture.

## 6. Persistent custody model

The helper generates a fresh transaction ID with operating-system entropy; the
caller cannot choose it. The flat pre-provisioned custody namespace uses unique
leaves such as:

```text
tx-<id>-request-<sha>.bin
tx-<id>-journal-<begin-sha-prefix>.log
tx-<id>-receipt-<terminal-sha-prefix>.receipt
tx-<id>-stage-000-<sha>
tx-<id>-preimage-000-<sha>
tx-<id>-rollback-000-<sha>
```

Lifecycle rules:

- an uninstalled stage remains in custody;
- an installed stage is the same inode renamed to its live leaf, so the prior
  stage custody-leaf count legitimately decreases while the managed-inode
  ledger records a custody-to-live transition;
- a predecessor is archived and renamed to unique preimage custody before the
  successor is installed;
- committed preimages remain retained;
- rollback moves the exact installed successor to rollback custody and restores
  the exact preimage through no-replace rename;
- absent-only rollback moves the exact installed successor to rollback custody;
- in the required protected production domain, an untrusted writer cannot
  replace a live source leaf; if post-rename identity nevertheless differs, the
  helper stops and produces `MANUAL_RECOVERY_REQUIRED`;
- in an unprivileged fixture, a source-leaf replacement may be moved because
  macOS has no rename-by-held-FD CAS; the helper must not unlink or overwrite
  that inode, and must retain the unique destination for manual recovery;
- the permanent lock is acquired with `flock` and released only by closing its
  descriptor; its namespace leaf is never removed; `flock` excludes only
  compliant helpers and is not protection against a raw or malicious writer;
  and
- build, clone, failed, and intermediate artifacts are retained with receipts.

Any later retention or cleanup is a new, separately authorized transaction and
must not reuse this helper.

## 7. Transaction protocol

### `probe`

Read-only. It reports compile-time flags, OS/SDK identity, filesystem and mount
identity, compiler/runtime identity, and policy compatibility. It cannot prove
actual create, rename, sync, race, or crash semantics. It creates no managed
output and grants no authority.

### Development `fixture-capability-test`

This is not a production helper operation. When separately authorized, it is
explicitly mutating and runs only in a newly created disposable fixture on the
exact target volume. It proves actual required syscall/flag, sync, race, crash,
and protected-parent behavior and emits a hash-bound capability receipt.

### `verify`

Strictly read-only and dispatched before any generation. It opens and hashes a
sealed plan/receipt and verifies the exact live/custody state. It opens the
permanent lock read-only and acquires `flock(LOCK_SH | LOCK_NB)`; inability to
acquire the shared lock is a refusal, not a wait followed by a potentially stale
verdict. `apply` and `recover` use `LOCK_EX | LOCK_NB`. After hashing the whole
set, `verify` rechecks root, custody, policy, allowlist, parent, and managed-inode
identities before releasing the shared lock. It does not acquire an exclusive
or mutating lock, compile, clone, stage, write, rename, or clean up. Advisory
locking coordinates compliant helpers only; the protected writer domain
excludes raw writers.

### Development planner

The separate planner, when separately authorized, creates and retains a sealed
candidate bundle containing 114 desired blobs, offsets, sizes, hashes, modes,
path allowlist, and predecessor contract. Independent review happens before a
production policy fixes those exact hashes. The planner cannot invoke the
production helper and has no formal-output authority.

### `apply`

A malformed request, policy mismatch, protected-domain failure, or other refusal
found during read-only preflight occurs before `BEGIN`. It creates no journal or
receipt and has no authoritative transaction status; its framed response and
exit code are diagnostic evidence only. Once durable `BEGIN` exists, every
refusal, rollback, or manual-recovery state must be journal- and receipt-bound.

1. Pin root, custody, formal parents, policy, plan, request, and permanent lock.
2. Acquire advisory `flock(LOCK_EX | LOCK_NB)`; reject a concurrent compliant
   helper without waiting.
3. Scan every `tx-*` custody leaf. Refuse a new apply on an orphan artifact,
   partial or invalid journal not uniquely resolved by the recovery graph, an
   unresolved chain tip, missing terminal receipt, terminal journal/receipt
   mismatch, manual terminal with unresolved entries, or foreign leaf.
4. Verify policy, plan, exact 114-path byte allowlist, predecessor set, desired
   set, report-last ordering, and the protected writer-domain precondition.
5. Open all current live files and verify the preimage set.
6. Generate the random transaction ID. The first managed mutation is exclusive
   creation of its journal leaf. Immediately write and durably sync a `BEGIN`
   record binding helper, policy, request, plan, root/custody identities,
   transaction ID, exact 114 allowlist hash, predecessor-set hash, and desired-
   set hash, plus the derived forward/full-rollback vector hashes and counts. A
   crash-created empty or partial journal is an orphan that blocks the next
   apply until it is uniquely resolved by the recovery graph below.
7. Create the request copy, archive copies, and 114 stages only after durable
   `BEGIN`. After each artifact is verified and synced, append and sync one
   hash-chained journal record before creating the next artifact.
8. After all required artifacts exist, append and sync `PREPARED`, binding the
   complete artifact/stage/preimage hashes and repeating both vector hashes and
   counts from `BEGIN`.
9. Recheck live leaves against held preimage descriptors.
10. Execute the exact forward transition vector: for each predecessor-present
    entry, move live to unique preimage custody and then stage to live; for each
    predecessor-absent entry, move stage to live only. Use protected-parent,
    no-replace rename; verify and append a synced hash-chained journal record
    after every namespace transition.
11. Install append-only reports last, then append and sync `COMMIT_INTENT`.
12. Reverify the protected-domain/quiescence bindings, every live inode's
    content and protected metadata, and the complete live set. Create and sync
    the terminal receipt, then sync its parent directory. Because no untrusted
    writable descriptor or mapping may exist, the access-control boundary—not
    a final hash alone—closes the post-verification content-write window.
13. Append and sync `COMMITTED`, binding the terminal receipt SHA-256. A crash
    after receipt creation but before this record remains a recoverable,
    nonterminal state; `COMMITTED` without its exact receipt is invalid.
14. Close the lock descriptor without removing any artifact.

### Rollback before commit

Rollback proceeds by the mechanically derived reverse vector. In the protected
production domain it first appends and syncs `ROLLBACK_BEGIN`, binding that
exact vector hash and count, then verifies the installed successor and preimage
before each ordered no-replace transition and records each
`ROLLBACK_MOVE_APPLIED`. After the final rollback verification it appends
and syncs `ROLLBACK_INTENT`, creates/syncs a receipt whose status is
`rolled-back`, and appends/syncs `ROLLED_BACK` binding that receipt SHA-256. Any
identity mismatch stops automatic rollback and uses the manual-recovery
terminal sequence below. In an unprivileged fixture, an unexpected source inode
may already move at the syscall boundary; it must remain reachable at its unique
destination and no further install occurs. Every unused stage and all journals
remain retained.

### Terminal authority by status

Every transaction that reached durable `BEGIN` or `RECOVERY_BEGIN` uses exactly
one status-matched terminal sequence:

```text
COMMIT_INTENT
  -> receipt(status=committed)
  -> COMMITTED(receipt_sha256)

ROLLBACK_INTENT
  -> receipt(status=rolled-back)
  -> ROLLED_BACK(receipt_sha256)

REFUSAL_INTENT
  -> receipt(status=refused-after-BEGIN)
  -> REFUSED_AFTER_BEGIN(receipt_sha256)

MANUAL_RECOVERY_INTENT
  -> receipt(status=manual-recovery)
  -> MANUAL_RECOVERY_REQUIRED(receipt_sha256)
```

The receipt binds the journal hash through the exact status-matched terminal-
intent record. Terminal authority exists only when receipt header status,
receipt payload status, terminal-intent type, final journal-record type, and
the receipt SHA-256 in that final record all match. Startup rejects every cross-
state combination. `COMMITTED` never authenticates rolled-back, refused, or
manual-recovery receipts.

### Crash recovery

A crash releases `flock` through the kernel but does not make the transaction
complete. The next run scans all `tx-*` leaves read-only and constructs the
recovery-supersession graph below. An artifact without a graph-owned journal,
invalid journal, ambiguous receipt, invalid edge, unresolved chain, or terminal
journal/receipt mismatch blocks apply. `recover` requires the exact unresolved
chain-tip journal leaf, whole-file SHA-256, and last-complete-record SHA-256
chosen by an authorized operator.

Before any formal-output move, recover's first mutation is exclusive creation
of a distinct recovery journal followed by a synced `RECOVERY_BEGIN` record
binding the target journal/transaction identities, operator authorization,
helper, policy, request, root/custody identity, exact chain-local current set,
disposition, and authorized vector. A partial recovery journal is covered by
the all-`tx-*` startup scan. Recovery acts only on uniquely verified inode/hash
states in the protected writer domain. It ends with one status-matched intent/
receipt/final-record sequence; its receipt repeats the target, authorization,
disposition, and vector bindings. It never rewrites an ancestor journal,
guesses, truncates, deletes, or silently ignores an orphan receipt.

#### Recovery-supersession graph

Each parsed journal is one node. A recovery journal has exactly one directed
edge to the immediate target named in its first complete `RECOVERY_BEGIN`.
Apply journals have no parent. The scanner rejects self-edges, missing targets,
hash/transaction/last-record mismatch, cycles, a parent with two children, a
child with two parents, a recovery whose target was already bypassed, and any
receipt not owned by exactly one journal intent. Creation of a recovery child
is permitted only when its target existed in the first stable enumeration and
had no child in either stable enumeration. If a recovery itself crashes, the
next recovery must target that unresolved child—the current chain tip—rather
than fork from an ancestor.

A node is `direct-terminal` only when its matching intent, receipt, final
record, and all cross-field equalities validate. A nonterminal node is
`resolved-by-recovery` only when it has exactly one child and the unique child
chain recursively ends in a direct-terminal descendant. Each recovery receipt
binds its immediate parent edge, recursive validation binds the complete chain,
and the terminal descendant binds the final current set and an empty unresolved-
namespace set. The descendant terminal state may be committed, rolled-back, or
refused-after-BEGIN. It may also be manual-recovery-required only when
disposition is `manual-close-only`, the authorized vector and unresolved-
namespace set are both empty, no formal-output mutation occurred, and the
complete stable scan contains no foreign or orphan leaf. A manual terminal with
a nonempty unresolved set never admits a new apply. The scanner
may therefore stop a retained nonterminal ancestor from being a blocker only
through this unique, fully validated chain. It never edits the ancestor.

A receipt created after an intent but before its final record is non-authority
and remains retained. At most one such receipt may match that intent; a recovery
child must include it in the chain-local material-custody set. An unmatched or
second receipt is an orphan blocker. New apply is admitted only when every
`tx-*` leaf belongs to exactly one direct-terminal transaction or one uniquely
resolved recovery chain, every non-manual terminal chain has an empty unresolved
set, and no foreign/orphan leaf remains.

#### Canonical operator authorization

The protected operator-authorization object uses the 56-byte frame from the
request protocol with magic `48 4d 47 34 4f 32 00 00` (`"HMG4O2" + 2 NUL`),
version 2, the recovery-disposition enum in the operation slot, and exactly this
canonical payload:

```text
0x0f01 protocol_spec_sha256          SHA256
0x0f02 helper_sha256                 SHA256
0x0f03 policy_sha256                 SHA256
0x0f04 target_transaction_id         BYTES, exactly 32
0x0f05 target_journal_leaf           SAFE_CUSTODY_LEAF
0x0f06 target_journal_sha256         SHA256
0x0f07 target_last_complete_record_sha256 SHA256
0x0f08 expected_current_set_sha256   SHA256
0x0f09 recovery_disposition          U32
0x0f0a authorized_recovery_vector_sha256 SHA256
0x0f0b authorized_recovery_transition_count U32
0x0f0c permitted_terminal_state      U32
0x0f0d operator_identity_sha256      SHA256
0x0f0e authorization_nonce           BYTES, exactly 32
0x0f0f issued_at_unix_seconds        U64
0x0f10 expires_at_unix_seconds       U64
0x0f11 acceptance_effect_mask        U64, exactly zero
```

The protected-location issuer/trust rule in policy validates who may create the
object; its hash is then bound by the recover request and journal. Expiry is
checked before recovery-journal creation and does not revoke an already begun
transaction. The disposition-to-terminal mapping and zero-record restriction
are the state-machine rules below, not caller discretion.

## 8. Atomicity statement

The 114 formal outputs cannot be changed by one filesystem syscall. V2 may
provide atomic no-replace movement per entry, a durable write-ahead journal,
deterministic rollback, crash recovery, and persistent preimages. It must not
claim a single-syscall 114-file atomic commit.

The requested 12-lesson whole-course atomic integration must ultimately use a
single content-addressed version or release-pointer/trust-adapter switch after
all 12 lessons are admitted. It must not be represented as 114 or thousands of
scattered files changing simultaneously.

## 9. Request, response, and receipt boundary

The helper accepts one bounded canonical binary protocol; JSON, plist, command-
line field injection, and environment-variable configuration are forbidden.
All integers are unsigned big-endian. The 56-byte request header is:

```text
offset  size  field
0       8     magic = 48 4d 47 34 56 32 00 00 ("HMG4V2" + 2 NUL)
8       4     protocol version = 2
12      4     operation enum: 1 probe, 2 verify, 3 apply, 4 recover
16      8     payload length, maximum 16,777,216 bytes
24      32    SHA-256 of the exact payload bytes
```

The payload is canonical TLV: `u16 tag`, `u8 type`, one reserved zero byte,
`u32 length`, then exactly `length` bytes. Tags are strictly increasing and
occur exactly once when required by the operation schema. Nested lists carry an
explicit count and use the same ordering rule. Unknown tags/types, duplicate or
out-of-order tags, a payload above 16 MiB, more than 114 entries, a path above
its type bound, a non-ASCII byte in any request-authority path type, count
mismatch, integer or offset/length
overflow, unsafe path components, hash mismatch, short payload, and trailing
bytes are rejected. Desired content is not embedded in the request; it is read
from the separately hash-bound bundle. The receipt-only
`OBSERVED_CUSTODY_LEAF` exception preserves raw enumeration bytes and never
grants request or mutation authority.

Responses use the same header layout with magic
`48 4d 47 34 52 32 00 00` (`"HMG4R2"` + 2 NUL), the operation field replaced
by a response-status enum, and a canonical TLV payload. Stdout and stderr are
diagnostic only and never authoritative. Process exit codes are fixed:

If the complete fixed 56-byte request header cannot be read and validated for
magic, version, operation enum, and bounded payload length, the helper emits no
framed response and no request-bound field; it may write only the fixed stderr
diagnostic `HMG4V2_INVALID_HEADER` and exits 64. Once that fixed header is valid,
any payload truncation, hash mismatch, TLV error, or operation-schema error
returns framed status 5; response tag `8002` echoes the payload SHA-256 declared
by the validated header and does not pretend malformed payload bytes were valid.

```text
0   verified success or receipt-bound terminal success
20  fail-closed read-only refusal, or receipt-bound refusal after BEGIN
30  recoverable nonterminal transaction detected
40  manual recovery required
64  malformed request or protocol violation
70  capability failure detected before journal-leaf creation
```

A duplicate transaction ID, receipt leaf, or journal leaf is a refusal, never
an overwrite or resume-by-guessing operation. A request fixes:

- protocol and policy version;
- operation;
- approved helper, policy, plan, bundle, predecessor-set, desired-set, target-
  volume and system-lock-volume capability-receipt, and quiescence-receipt
  hashes;
- expected root device/inode/owner/mode;
- exact 114 entries and order;
- each current state, desired bundle range, size, hash, mode, and role; and
- acceptance boundaries, all false.

The request identity is the payload SHA-256 in the header. The payload does not
contain a request-hash field, so no self-reference exists.

### Frozen TLV type and tag registry

Production policy and the compiled helper both bind the SHA-256 of the reviewed
protocol specification containing this registry. Numeric type values are:

```text
0x01 U32          exactly 4 bytes
0x02 U64          exactly 8 bytes
0x03 BOOL         exactly 1 byte, 0x00 or 0x01
0x04 SHA256       exactly 32 bytes
0x05 BYTES        0..4,096 bytes unless a field below gives a smaller bound
0x06 POLICY_REL_PATH          1..1,024 bytes
0x07 STRUCT                   canonical nested TLVs
0x08 LIST                     U32 count, then count repetitions of
                              U32 length + STRUCT
0x09 APPROVED_ABS_ROOT_PATH   1..1,024 bytes
0x0a SAFE_CUSTODY_LEAF        1..255 bytes
0x0b APPROVED_EVIDENCE_REL_PATH 1..1,024 bytes
0x0c OBSERVED_CUSTODY_LEAF    1..255 exact directory-entry bytes
```

`POLICY_REL_PATH` must byte-match one of the 114 compiled-policy relative paths
and pass the component rules in Section 4. `APPROVED_ABS_ROOT_PATH` must byte-
match the one compiled absolute root, begin with `/`, and contain no empty,
dot, dot-dot, NUL, or non-ASCII component after the initial root marker.
`SAFE_CUSTODY_LEAF` is exactly one component, contains no slash or NUL, is not
exactly `.` or `..`, permits period bytes only where the compiled custody
grammar permits them, and matches the compiled lowercase transaction/content
grammar rooted in a 64-hex-character transaction ID.
`APPROVED_EVIDENCE_REL_PATH` must byte-match a separate compiled allowlist under
a held protected evidence parent; it is never accepted as a managed output
path. `OBSERVED_CUSTODY_LEAF` is the exact 1..255-byte name returned by stable
FD-relative enumeration; it contains no slash or NUL, is not exactly `.` or
`..`, need not match the transaction grammar, and may contain non-ASCII or
otherwise uninterpreted bytes. It is legal only in a role-8 unresolved
observation. It may be used with no-follow `fstatat` and bounded `readlinkat`
from the already held enumerated parent for read-only observation, but never as
an `openat` target, rename source/destination, creation name, cleanup target, or
other mutation authority. No path type is implicitly convertible to another.

The complete top-level request tag registry is:

```text
0x0001 protocol_spec_sha256          SHA256
0x0002 policy_version                U32, exactly 2
0x0003 approved_helper_sha256        SHA256
0x0004 approved_policy_sha256        SHA256
0x0005 approved_plan_sha256          SHA256
0x0006 approved_bundle_sha256        SHA256
0x0007 expected_root_identity        STRUCT RootIdentity
0x0008 path_allowlist_sha256         SHA256
0x0009 predecessor_set_sha256        SHA256
0x000a desired_set_sha256            SHA256
0x000b acceptance_effect_mask        U64, exactly zero
0x000c entry_count                   U32, exactly 114
0x000d entries                       LIST Entry, exactly 114
0x000e verify_target                 U32: 1 live-set, 2 terminal-receipt
0x000f terminal_receipt_leaf         SAFE_CUSTODY_LEAF
0x0010 terminal_receipt_sha256       SHA256
0x0011 original_transaction_id       BYTES, exactly 32 random bytes
0x0012 original_journal_leaf         SAFE_CUSTODY_LEAF
0x0013 original_journal_sha256       SHA256
0x0014 operator_authorization_leaf   APPROVED_EVIDENCE_REL_PATH
0x0015 operator_authorization_sha256 SHA256
0x0016 expected_current_set_sha256   SHA256
0x0017 quiescence_receipt_sha256     SHA256
0x0018 target_capability_receipt_sha256 SHA256
0x0019 durability_envelope           U32: 1 crash-consistent, 2 target-fullsync
0x001a system_lock_capability_sha256 SHA256
0x001b forward_transition_vector_sha256 SHA256
0x001c forward_transition_count      U32
0x001d full_rollback_vector_sha256   SHA256
0x001e full_rollback_count           U32
0x001f recovery_disposition          U32: 1 finish-commit,
                                      2 rollback-to-predecessor,
                                      3 finish-refusal,
                                      4 manual-close-only
0x0020 authorized_recovery_vector_sha256 SHA256
0x0021 authorized_recovery_transition_count U32
0x0022 original_last_complete_record_sha256 SHA256
```

`RootIdentity` contains exactly these tags:

```text
0x0201 device                        U64
0x0202 inode                         U64
0x0203 owner_uid                     U32
0x0204 group_gid                     U32
0x0205 mode                          U32
0x0206 flags                         U32
0x0207 filesystem_id                 BYTES, exactly 16 bytes
0x0208 mount_configuration_sha256    SHA256
0x0209 approved_root_path            APPROVED_ABS_ROOT_PATH
```

Each `Entry` contains exactly these tags:

```text
0x0101 index                         U32, 0..113
0x0102 role                          U32: 1 ordinary, 2 report-last
0x0103 path                          POLICY_REL_PATH
0x0104 predecessor_state             U32: 0 absent, 1 expected-ordinary
0x0105 predecessor_size              U64, zero when absent
0x0106 predecessor_sha256            SHA256, all-zero when absent
0x0107 desired_bundle_offset         U64
0x0108 desired_size                  U64
0x0109 desired_sha256                SHA256
0x010a installed_mode                U32
0x010b installed_owner_uid           U32
0x010c installed_group_gid           U32
0x010d installed_flags               U32
0x010e installed_acl_sha256          SHA256
0x010f installed_xattr_policy_sha256 SHA256
0x0110 expected_link_count           U32, exactly 1
```

Operation field requirements are exact; a tag not listed for that operation is
unknown and rejected:

```text
probe:
  required 0001,0002,0003,0004,0007

verify live-set:
  required 0001..000e,0016..001a
  000e must equal 1; forbidden 000f..0015

verify terminal-receipt:
  required 0001..000e,000f,0010,0016..001a
  000e must equal 2; forbidden 0011..0015

apply:
  required 0001..000d,0016..001e
  forbidden 000e..0015,001f..0022

recover:
  required 0001..000d,0011..0022
  forbidden 000e,000f,0010
```

For contiguous notation above, `0001..000d` means every numeric tag in that
closed interval exactly once. The helper recomputes the entry list, allowlist,
predecessor set, desired set, forward vector, full rollback vector, authorized
recovery vector, and current-set canonical hashes rather than trusting supplied
summary hashes. For apply, the forward vector and full rollback vector are
derived from the 114 Entries. For recover, the same two hashes still describe
the original approved contract, while `0020/0021` describe the exact moves
authorized for this recovery and `001f` describes their disposition.

The request intentionally carries hashes, not caller-selected object paths.
The compiled policy binds each plan, bundle, capability, quiescence, and
operator-authorization object to an exact path type, protected parent identity,
and component sequence. Before `BEGIN`, the helper walks each location from its
held parent using the Section 4 no-follow/beneath rules, retains the descriptor,
hashes the held bytes, and compares the request/policy hash. The protected
installation receipt binds the same location rules. CLI arguments, environment
variables, symlinks, filename searches, and request-provided generic paths can
never select one of these objects.

Production `apply` and `recover` accept `durability_envelope=2` only, and the
compiled policy fixes that value. Enum 1 is limited to read-only probe/verify
descriptions or explicitly non-production fixture evidence; a request can never
downgrade production durability.

### Authority-evidence dependency DAG

The hash dependency is acyclic and normative:

```text
protocol source + helper source + plan + desired bundle
  -> reviewed policy bytes and helper binary
  -> exact policy/helper hashes
  -> capability and quiescence receipts bound to those hashes
  -> optional later operator authorization bound to those hashes, the target
     journal/current set, disposition, and authorized transition vector
  -> request payload binding all observed evidence hashes
  -> BEGIN/RECOVERY_BEGIN -> journal -> terminal receipt -> terminal record
```

The policy embeds the final plan and bundle hashes. For capability, quiescence,
and operator-authorization evidence it embeds only the protected location,
issuer identity/trust rule, schema version, permitted age, and validation rule;
it does **not** embed the future evidence object's content hash. Each such
evidence object binds the already-final full policy hash, and the later request,
begin record, and receipt bind the observed evidence-object hash. “Compare the
request/policy hash” means compare a request hash to the held object's hash and
then validate that object's policy binding; it never means that the full policy
and a future evidence object recursively contain each other's final hash.

### Frozen derived-hash registry

Every authority-bearing derived hash not given a more specific frame uses this
exact stream:

```text
offset  size  field
0       8     magic = 48 4d 47 34 44 32 00 00 ("HMG4D2" + 2 NUL)
8       4     version = 2
12      4     derived kind
16      4     member count
20      ...   for each member: U32 byte length followed by the exact canonical
               nested-TLV STRUCT value bytes
```

All integers are unsigned big-endian. A nested-TLV STRUCT value contains each
complete TLV header and value, with strictly increasing tags. The member length
does not include any outer TLV. There is no padding or trailing byte. A kind's
number is its cryptographic domain separator; a stream from one kind is never
accepted for another. Unless a kind below expressly preserves sequence,
members are sorted by the stated unsigned-byte/numeric key and duplicate keys
or duplicate complete members are forbidden. Empty is represented only by the
correct header/kind and count zero. The registry is:

```text
kind 1 path allowlist
  member: 0xd101 index U32, 0xd102 path POLICY_REL_PATH
  count exactly 114; sort/index 0..113; duplicate paths forbidden

kind 2 predecessor set
  member: 0xd201 index U32, 0xd202 path POLICY_REL_PATH,
          0xd203 state U32, 0xd204 size U64, 0xd205 sha256 SHA256
  count exactly 114; sort/index 0..113; state 0 requires zero size and the
  all-zero hash, state 1 requires the exact expected ordinary-file values

kind 3 desired set
  member: 0xd301 index U32, 0xd302 role U32, 0xd303 path POLICY_REL_PATH,
          0xd304 bundle offset U64, 0xd305 size U64, 0xd306 sha256 SHA256,
          0xd307 mode U32, 0xd308 owner U32, 0xd309 group U32, 0xd30a flags U32,
          0xd30b ACL SHA256, 0xd30c xattr-policy SHA256, 0xd30d link count U32
  count exactly 114; sort/index 0..113; every field equals its request Entry

kind 4 mount configuration
  exactly one member: 0xd401 volume UUID BYTES exactly 16,
          0xd402 filesystem type BYTES 1..15 ASCII bytes,
          0xd403 statfs fsid BYTES exactly 8,
          0xd404 raw statfs mount flags U64,
          0xd405 semantic mount flags U64,
          0xd406 volume capability/valid words BYTES exactly 32,
          0xd407 root device U64,
          0xd408 mount point BYTES 1..1,024 ASCII bytes

kind 5 complete artifact observations
  members are canonical FinalEntry STRUCT values for the transaction/recovery
  chain's request copy, archives, and stages present at PREPARED; sort by
  (managed index, location role, path bytes); every expected artifact present

kind 6 complete stage observations
  exactly 114 ordinary FinalEntry STRUCT values with location role 2;
  sort/index 0..113

kind 7 complete preimage observations
  exactly 114 live-path FinalEntry STRUCT values observed immediately before
  PREPARED; sort/index 0..113; expected-absent uses object type 0 and expected-
  ordinary uses object type 1

kind 8 violation list
  members are canonical Violation STRUCT values; sort by
  (code, entry index, evidence SHA-256); exact duplicate members forbidden

kind 9 unresolved namespace set
  members are nonordinary FinalEntry STRUCT values from the managed live set or
  active recovery-chain custody/stage/preimage/rollback/request namespaces,
  plus every foreign/unclassified custody leaf regardless of object type;
  sort by (managed index, location role, exact unsigned path bytes); role-8
  members retain the raw OBSERVED_CUSTODY_LEAF bytes; duplicates forbidden

kind 10 forward transition vector
kind 11 full rollback transition vector
kind 12 authorized recovery transition vector
  members are canonical Transition STRUCT values in increasing ordinal;
  sequence order is semantic and must not be re-sorted
```

For kind 4, `fstatfs` supplies the filesystem type, raw fsid, raw `f_flags`, and
root device; `fgetattrlist` with `ATTR_VOL_UUID` and `ATTR_VOL_CAPABILITIES`
supplies the 16-byte UUID and four capability plus four valid U32 words, each
word normalized to big-endian in interface order. The two signed 32-bit
`statfs.f_fsid` words are serialized as their exact unsigned bit patterns in
big-endian order. The mount-point bytes begin with one root marker and pass the
absolute-path component rules, but need not equal the deeper approved project
root. `semantic mount flags` uses
contract-local bit 0 read-only, 1 local, 2 noexec, 3 nodev, 4 nosuid,
5 ownership-disabled (`MNT_UNKNOWNPERMISSIONS`), 6 case-sensitive, and 7
case-preserving; all higher bits are zero. The exact SDK-symbol-to-local-bit
mapping is in the build receipt. The raw flags remain in the preimage, so an
unmapped mount-flag drift cannot be silently erased.

A `Transition` contains exactly:

```text
0x0e01 ordinal                       U32, contiguous from zero
0x0e02 managed_index                 U32, 0..113
0x0e03 direction                     U32, journal direction enum 1..4
0x0e04 source_location_role          U32
0x0e05 destination_location_role     U32
0x0e06 predecessor_state             U32, 0 absent or 1 expected-ordinary
```

The forward vector follows Entry order with all role-1 entries before every
role-2 report-last entry. For each index, predecessor state 1 contributes
direction 1 (`live -> preimage`) followed by direction 2 (`stage -> live`);
state 0 contributes direction 2 only. Its exact count is therefore
`114 + count(predecessor_state == 1)`. The full rollback vector traverses the
fully installed indexes in reverse forward installation order, contributing
direction 3 (`installed live -> rollback`) and, only for predecessor state 1,
direction 4 (`preimage -> live`). Its count is the same. For a forward-prefix
rollback, the actual vector is mechanically derived from completed records in
reverse: a completed direction 2 contributes direction 3; a completed
direction 1 contributes direction 4 after the same index's direction 3 when
direction 2 completed, or alone when it did not. No caller chooses or reorders
these vectors.

### Bundle framing

The sealed desired-content bundle has a 96-byte header:

```text
offset  size  field
0       8     magic = 48 4d 47 34 42 32 00 00 ("HMG4B2" + 2 NUL)
8       4     bundle version = 2
12      4     entry count = 114
16      8     canonical table length, maximum 16 MiB
24      8     data-region length, maximum 64 GiB
32      32    SHA-256 of canonical table bytes
64      32    SHA-256 of exact data-region bytes including zero padding
```

The table is a `LIST BundleEntry`; each `BundleEntry` contains exactly:

```text
0x0401 index                         U32, 0..113
0x0402 path                          POLICY_REL_PATH
0x0403 offset                        U64
0x0404 size                          U64
0x0405 sha256                        SHA256
0x0406 installed_mode                U32
0x0407 installed_owner_uid           U32
0x0408 installed_group_gid           U32
0x0409 installed_flags               U32
0x040a installed_acl_sha256          SHA256
0x040b installed_xattr_policy_sha256 SHA256
```

Let `data_start = align_up(96 + table_length, 4096)`. Bytes from the end of the
table through `data_start - 1` are mandatory zero pre-data padding; they are
covered by the whole-file bundle SHA-256 but not by the header's data-region
SHA-256. `BundleEntry.offset` and request `desired_bundle_offset` are both
unsigned offsets relative to `data_start`, never file-relative. Every offset is
4,096-byte aligned; ranges are strictly increasing and non-overlapping; every
byte in the data region outside a blob range is zero, including leading,
inter-blob, and trailing gaps; each blob size is 1 byte through 4 GiB; and each
range matches its entry size and SHA-256. Zero-size bundle entries are forbidden,
so they cannot create an ambiguous interval or ordering. Exact file length is
`data_start + data_region_length`; trailing bytes are forbidden. The data-region
SHA-256 covers exactly those `data_region_length` bytes, including inter-blob
and leading/trailing zero gaps. The bundle SHA-256 covers the entire exact file and is fixed in the
request and policy. Unsupported lengths or alignment fail closed.

### Journal framing and state machine

The journal is a concatenation of canonical records with no file header,
padding, separator, or trailing bytes. Every record begins with this exact
128-byte header:

```text
offset  size  field
0       8     magic = 48 4d 47 34 4a 32 00 00 ("HMG4J2" + 2 NUL)
8       4     journal version = 2
12      4     record type enum
16      32    transaction ID
48      8     sequence number
56      8     payload length, maximum 16 MiB
64      32    previous complete record SHA-256; all-zero for sequence 0
96      32    SHA-256 of exact payload bytes
```

The record SHA-256 covers the exact 128-byte header followed by its exact
payload. Sequence starts at zero and increments by one. All records in one file
carry the same transaction ID. The first apply record is `BEGIN`; the first
separate recovery-journal record is `RECOVERY_BEGIN`. Any bad magic/version,
wrong transaction ID, skip, duplicate, reorder, wrong previous hash, payload
hash/length failure, unknown tag/type, illegal transition, bytes after a terminal
record, or nonzero trailing byte fails closed. EOF inside a final header or
payload is a torn nonterminal tail; it never authenticates that record and the
all-`tx-*` scanner blocks new apply. A torn record followed by any bytes is
invalid rather than recoverable-by-guessing.

`journal_sha256` in requests/responses is SHA-256 of every exact byte currently
present in the journal file, including a retained torn tail. The last-complete-
record SHA-256 is a distinct hash-chain identity used for transition validation
and receipt tag `9007`. Recovery binds both the whole-file hash from its request
and the parsed last-complete-record hash in `RECOVERY_BEGIN`; it never truncates
or repairs the old file.

Request tag `0022`, `RECOVERY_BEGIN` tag `a013`, and recovery-receipt tag `9017`
use the all-zero SHA-256 value as one narrowly scoped absence sentinel **only**
when strict parsing proves that the target journal contains zero complete
records. If one or more complete records exist, all three fields equal the
actual last complete record hash and may not be zero. In either case,
`original_journal_sha256` covers every exact target-journal byte, including an
empty file or a partial sequence-0 `BEGIN`. A zero-complete-record target admits
only disposition `manual-close-only`, an empty authorized recovery vector, and
a manual-recovery terminal receipt; it cannot authorize any read, copy, rename,
metadata change, or other mutation of the 114 formal outputs.

Record type enum values are:

```text
1  BEGIN
2  ARTIFACT_CREATED
3  PREPARED
4  MOVE_APPLIED
5  COMMIT_INTENT
6  COMMITTED
7  ROLLBACK_BEGIN
8  ROLLBACK_MOVE_APPLIED
9  ROLLBACK_INTENT
10 ROLLED_BACK
11 REFUSAL_INTENT
12 REFUSED_AFTER_BEGIN
13 MANUAL_RECOVERY_INTENT
14 MANUAL_RECOVERY_REQUIRED
15 RECOVERY_BEGIN
16 RECOVERY_ARTIFACT_CREATED
17 RECOVERY_MOVE_APPLIED
```

Journal payloads use the same canonical TLV encoding. Exact payload tags are:

```text
BEGIN / RECOVERY_BEGIN identity tags
0xa001 request_payload_sha256        SHA256
0xa002 helper_sha256                 SHA256
0xa003 policy_sha256                 SHA256
0xa004 plan_sha256                   SHA256
0xa005 bundle_sha256                 SHA256
0xa006 root_identity                 STRUCT RootIdentity
0xa007 allowlist_sha256              SHA256
0xa008 predecessor_set_sha256        SHA256
0xa009 desired_set_sha256            SHA256
0xa00a quiescence_receipt_sha256     SHA256
0xa00b target_capability_sha256      SHA256
0xa00c system_lock_capability_sha256 SHA256
0xa00d acceptance_effect_mask        U64, exactly zero
0xa00e original_transaction_id       BYTES, exactly 32
0xa00f original_journal_leaf         SAFE_CUSTODY_LEAF
0xa010 original_journal_sha256       SHA256
0xa011 operator_authorization_sha256 SHA256
0xa012 expected_current_set_sha256   SHA256
0xa013 original_last_complete_record_sha256 SHA256
0xa014 forward_transition_vector_sha256 SHA256
0xa015 forward_transition_count      U32
0xa016 full_rollback_vector_sha256   SHA256
0xa017 full_rollback_count           U32
0xa018 recovery_disposition          U32
0xa019 authorized_recovery_vector_sha256 SHA256
0xa01a authorized_recovery_transition_count U32

artifact tags
0xa101 artifact_role                 U32: 1 request, 2 stage, 3 archive,
                                      4 preimage, 5 rollback
0xa102 managed_index                 U32: 0..113 or 0xffffffff for request
0xa103 custody_leaf                  SAFE_CUSTODY_LEAF
0xa104 observed_entry                STRUCT FinalEntry

prepared tags
0xa201 complete_artifact_set_sha256  SHA256
0xa202 complete_stage_set_sha256     SHA256
0xa203 complete_preimage_set_sha256  SHA256
0xa204 forward_transition_vector_sha256 SHA256
0xa205 forward_transition_count      U32
0xa206 full_rollback_vector_sha256   SHA256
0xa207 full_rollback_count           U32

move tags
0xa301 direction                     U32: 1 preimage-to-custody,
                                      2 stage-to-live,
                                      3 installed-to-rollback,
                                      4 preimage-to-live
0xa302 managed_index                 U32, 0..113
0xa303 source_before                 STRUCT FinalEntry
0xa304 destination_after             STRUCT FinalEntry
0xa305 current_set_sha256            SHA256

rollback-begin tags
0xa601 reason_code                   U32
0xa602 current_set_sha256            SHA256
0xa603 actual_rollback_vector_sha256 SHA256
0xa604 actual_rollback_transition_count U32

terminal-intent tags
0xa401 terminal_state                U32: 1 committed, 2 rolled-back,
                                      3 refused-after-BEGIN,
                                      4 manual-recovery-required
0xa402 final_live_set_sha256         SHA256
0xa403 final_material_custody_sha256 SHA256
0xa404 violation_list_sha256         SHA256
0xa405 durability_envelope           U32, exactly 2 in production
0xa406 unresolved_namespace_set_sha256 SHA256

terminal-record tags
0xa501 terminal_state                U32, same value as its intent
0xa502 terminal_receipt_leaf         SAFE_CUSTODY_LEAF
0xa503 terminal_receipt_sha256       SHA256
0xa504 terminal_intent_record_sha256 SHA256
```

`BEGIN` requires exactly `a001..a00d,a014..a017`. `RECOVERY_BEGIN` requires
exactly `a001..a01a`. `ARTIFACT_CREATED` and `RECOVERY_ARTIFACT_CREATED` require exactly
`a101..a104`. `PREPARED` requires exactly `a201..a207`. `MOVE_APPLIED` and
`RECOVERY_MOVE_APPLIED` require exactly `a301..a305`; the former permits forward
directions 1/2 only. `PREPARED` vector fields must repeat the corresponding
`BEGIN` fields. `ROLLBACK_BEGIN`
requires exactly `a601..a604`.
`ROLLBACK_MOVE_APPLIED` requires exactly `a301..a305` with direction 3/4. Each
terminal-intent type requires exactly `a401..a406` with its matching state. Each
terminal-record type requires exactly `a501..a504` with its matching state and
intent-record hash.

Legal transition families are:

```text
BEGIN -> ARTIFACT_CREATED* -> PREPARED
PREPARED -> MOVE_APPLIED* -> COMMIT_INTENT -> COMMITTED
BEGIN|ARTIFACT_CREATED|PREPARED (before first MOVE_APPLIED)
  -> REFUSAL_INTENT -> REFUSED_AFTER_BEGIN
PREPARED|MOVE_APPLIED -> ROLLBACK_BEGIN -> ROLLBACK_MOVE_APPLIED*
  -> ROLLBACK_INTENT -> ROLLED_BACK
BEGIN|ARTIFACT_CREATED|PREPARED|MOVE_APPLIED|ROLLBACK_BEGIN|
ROLLBACK_MOVE_APPLIED (pre-intent states only)
  -> MANUAL_RECOVERY_INTENT -> MANUAL_RECOVERY_REQUIRED

RECOVERY_BEGIN -> RECOVERY_ARTIFACT_CREATED* -> RECOVERY_MOVE_APPLIED*
  -> exactly one matching terminal intent -> its matching terminal record
```

The policy fixes exact artifact counts and the derived ordered transition
vectors; asterisks do not permit missing, duplicate, extra, or reordered
required work.
`COMMIT_INTENT` is legal only after all forward moves and final verification;
`ROLLBACK_INTENT` only after the required reverse moves and rollback
verification; `REFUSAL_INTENT` only before any formal move; manual recovery may
terminate a state only when its receipt records the unresolved set. The last
complete record hash is the hash-chain identity. Receipt tag `9007` must equal
the exact matching terminal-intent record hash, and the subsequent terminal
record must bind the receipt hash. No generic terminal record can authenticate
a different state.

Writing any one of `COMMIT_INTENT`, `ROLLBACK_INTENT`, `REFUSAL_INTENT`, or
`MANUAL_RECOVERY_INTENT` closes that journal to every record type except its one
matching terminal record. A receipt-write, parent-sync, or terminal-record
failure never permits a second intent in that journal; it leaves a nonterminal
chain tip that can be handled only through a distinct recovery journal.

Recovery disposition is frozen by the request, operator authorization, and
`RECOVERY_BEGIN`:

- `finish-commit` is allowed for a strictly valid forward-vector prefix or an
  unmatched `COMMIT_INTENT`; its authorized vector is the exact remaining
  forward suffix (empty after the intent), and its only terminal state is
  committed.
- `rollback-to-predecessor` is allowed for a valid pre-intent forward/rollback
  state or unmatched `ROLLBACK_INTENT`; its vector is the exact remaining
  rollback vector derived from completed forward and rollback records, and its
  only terminal state is rolled-back.
- `finish-refusal` is allowed only before the first formal move or after an
  unmatched `REFUSAL_INTENT`; its vector is empty and its only terminal state is
  refused-after-BEGIN.
- `manual-close-only` has an empty vector, performs no formal-output mutation,
  records the complete violation and unresolved namespace sets, and has only
  the manual-recovery terminal state. It is the sole disposition for a target
  with zero complete records or an unmatched `MANUAL_RECOVERY_INTENT`.

An operator authorization names exactly one chain-tip journal, its whole-file
and last-complete-record hashes, the observed current-set hash, one disposition,
one transition-vector hash/count, and one permitted terminal state. A completed
manual-recovery terminal journal is terminal, remains an admission blocker while
its unresolved set is nonempty, and is not a source for this recover operation;
any later repair or retention action requires a separately reviewed contract.

### Response and terminal-receipt registry

Response status enum values in the header are:

```text
0 success
1 read-only-refusal-before-BEGIN
2 receipt-bound-refusal-after-BEGIN
3 recoverable-nonterminal
4 manual-recovery-required
5 protocol-violation
6 blocked-capability-before-BEGIN
```

Response payload tags are:

```text
0x8001 diagnostic_code               U32, required
0x8002 request_payload_sha256        SHA256, required when framing parsed
0x8003 transaction_id                BYTES, exactly 32
0x8004 journal_leaf                  SAFE_CUSTODY_LEAF
0x8005 journal_sha256                SHA256
0x8006 terminal_receipt_leaf         SAFE_CUSTODY_LEAF
0x8007 terminal_receipt_sha256       SHA256
0x8008 terminal_state                U32: 1 committed, 2 rolled-back,
                                      3 refused-after-BEGIN, 4 manual-recovery
0x8009 observed_current_set_sha256   SHA256
0x800a capability_state              U32: 1 supported, 2 blocked
```

Presence rules are exact:

```text
all parseable responses:              8001,8002
probe status 0/1/6:                   add 800a
verify status 0/1/3/4/6:              add 8009; add 800a only for status 6
apply/recover pre-BEGIN status 1/6:   add 8009; add 800a only for status 6
apply/recover status 0/2/3/4:         add 8003,8004,8005,8009
apply/recover terminal status 0/2/4:  additionally add 8006,8007,8008
any operation status 5:               only 8001 and, if header parsed, 8002
```

Status 6 is forbidden after journal-leaf creation; later capability/I/O failure
must use transaction-bearing status 3 or 4. For status 1 or 6 before a complete
current-set hash is available, `8009` is the
all-zero SHA sentinel; a success or transaction-bearing response may never use
that sentinel. No response field outside the matching row is permitted. Exit
code mapping is status 0 -> 0, status 1 or 2 -> 20, status 3 -> 30, status 4 ->
40, status 5 -> 64, and status 6 -> 70.

A terminal receipt is a separate framed binary with magic
`48 4d 47 34 54 32 00 00` (`"HMG4T2"` + 2 NUL), protocol version 2, terminal-
state enum in the header operation slot, the same length/SHA rules, and exactly
these payload tags:

```text
0x9001 request_payload_sha256        SHA256
0x9002 transaction_id                BYTES, exactly 32
0x9003 helper_sha256                 SHA256
0x9004 policy_sha256                 SHA256
0x9005 plan_sha256                   SHA256
0x9006 bundle_sha256                 SHA256
0x9007 terminal_intent_record_sha256 SHA256
0x9008 terminal_state                U32, same value as header
0x9009 final_live_set_sha256         SHA256
0x900a final_material_custody_sha256 SHA256
0x900b final_live_entries            LIST FinalEntry, exactly 114
0x900c violations                    LIST Violation, 0..1,024
0x900d durability_envelope           U32
0x900e target_capability_receipt_sha256 SHA256
0x900f acceptance_effect_mask        U64, exactly zero
0x9010 quiescence_receipt_sha256     SHA256
0x9011 final_material_custody_entries LIST FinalEntry, policy-bounded maximum
0x9012 system_lock_capability_sha256 SHA256
0x9013 original_transaction_id       BYTES, exactly 32
0x9014 original_journal_leaf         SAFE_CUSTODY_LEAF
0x9015 original_journal_sha256       SHA256
0x9016 operator_authorization_sha256 SHA256
0x9017 original_last_complete_record_sha256 SHA256
0x9018 recovery_disposition          U32
0x9019 authorized_recovery_vector_sha256 SHA256
0x901a authorized_recovery_transition_count U32
0x901b unresolved_namespace_entries LIST FinalEntry, policy-bounded maximum
```

Tags `9013..901a` are required exactly for recovery-generated receipts and
forbidden for original apply receipts; all other receipt tags, including the
possibly empty `901b` list, are always
required. This makes the recovery receipt's original-journal and human-
authorization binding mechanical rather than narrative.

### Normative cross-field equality matrix

Repeated data is redundancy for detection, never an alternative authority.
The helper/scanner recomputes every side of these equalities; any mismatch makes
the request, journal, receipt, or recovery edge invalid, with no precedence
rule that selects one copy:

- Request Entries and BundleEntries are one-to-one by index. Path, offset,
  size, content hash, mode, owner, group, flags, ACL hash, and xattr-policy hash
  are byte/numerically equal. Desired-set members equal the same fields;
  allowlist and predecessor members equal their corresponding Entry fields.
- `BEGIN/RECOVERY_BEGIN a001` equals the request payload hash; `a002..a005`
  equal request `0003..0006`; `a006` equals request `0007`; `a007..a009` equal
  request `0008..000a`; `a00a` equals `0017`; `a00b` equals `0018`; `a00c`
  equals `001a`; and `a00d` equals `000b` and is zero. `a014..a017` equal
  request `001b..001e` and their independently derived vectors.
- In recovery, `a00e..a010` equal request `0011..0013`; `a011` equals request
  `0015` and the held operator-authorization-object hash; `a012` equals request
  `0016` and authorization `0f08`; `a013` equals request `0022` and
  authorization `0f07`; and `a018..a01a` equal request `001f..0021` and
  authorization `0f09..0f0b`. Authorization `0f04..0f06` equal request
  `0011..0013`, and `0f0c` equals the sole terminal state allowed by the
  disposition.
- `PREPARED a201/a202/a203` equal independently recomputed derived kinds 5/6/7.
  `a204..a207` equal the same begin/request vector hashes and counts.
  `ROLLBACK_BEGIN a603/a604` equal the actual derived rollback vector/count
  consumed one-for-one by subsequent rollback move records.
- Artifact role maps mechanically to `a104 FinalEntry.location_role`:
  request `1 -> 6`, stage `2 -> 2`, archive `3 -> 5`, preimage `4 -> 3`, and
  rollback `5 -> 4`. `a102` equals the FinalEntry index (`0xffffffff` only for
  request); `a103` equals its exact custody path; incompatible role/index/path
  combinations are invalid.
- Every move has `a302 == source_before.index == destination_after.index`.
  Direction 1 maps roles `live 1 -> preimage 3`; direction 2 maps
  `stage 2 -> live 1`; direction 3 maps `live 1 -> rollback 4`; direction 4
  maps `preimage 3 -> live 1`. Source and destination device, inode, size,
  content hash, link count, mode, owner, group, flags, ACL hash, xattr hash, and
  object type are identical; only the policy-derived namespace role/path may
  change. The observed record must equal the next Transition member.
- Terminal intent `a401` equals receipt header state and `9008`; `a402` equals
  `9009` and the final-live set hash recomputed over `900b`; `a403` equals
  `900a` and the material-custody set hash recomputed over `9011`; `a404` equals derived kind 8 over `900c`;
  `a405` equals `900d`; and `a406` equals derived kind 9 over `901b`. Receipt
  `9001` equals request payload hash; `9003..9006` equal request
  `0003..0006`; `900e`, `9010`, and `9012` equal request `0018`, `0017`, and
  `001a` and the held evidence hashes; `900f` equals request `000b` and zero.
- Recovery receipt `9013,9014,9015,9016,9017` equal respectively
  `RECOVERY_BEGIN a00e,a00f,a010,a011,a013` and request
  `0011,0012,0013,0015,0022`; `9018..901a` equal begin `a018..a01a`, request
  `001f..0021`, and authorization `0f09..0f0b`.
- A terminal record's header `previous complete record SHA-256`, `a504`,
  receipt `9007`, and the independently hashed matching terminal-intent record
  are identical. `a501` equals the same terminal state; `a502` is the actual
  receipt leaf; and `a503` is SHA-256 of the complete receipt bytes at that
  leaf.

Custody leaf transaction IDs equal the journal header transaction ID. The
policy fixes every lowercase-hex prefix length. A journal leaf's begin prefix
equals the first policy-sized hex characters of the complete sequence-0 record
hash; a receipt leaf's terminal prefix equals the corresponding complete
receipt SHA-256 prefix; and request/stage/preimage/rollback/archive content
suffixes equal the specified full hash or policy-sized prefix for the complete
held bytes. The full hashes remain present in records/receipts; a matching
prefix alone is never authority.

A `FinalEntry` has exactly:

```text
0x0501 managed_index                 U32: 0..113 for per-entry roles;
                                      0xffffffff for transaction-scoped roles
0x0502 location_role                 U32: 1 live, 2 stage, 3 preimage,
                                      4 rollback, 5 archive, 6 request-copy,
                                      7 retained ancestor orphan-receipt,
                                      8 foreign/unclassified custody leaf
0x0503 path                          POLICY_REL_PATH when location_role=1;
                                      SAFE_CUSTODY_LEAF for roles 2..7;
                                      OBSERVED_CUSTODY_LEAF for role 8
0x0504 device                        U64
0x0505 inode                         U64
0x0506 size                          U64
0x0507 sha256                        SHA256
0x0508 link_count                    U32
0x0509 mode                          U32
0x050a owner_uid                     U32
0x050b group_gid                     U32
0x050c flags                         U32
0x050d acl_sha256                    SHA256
0x050e xattr_set_sha256              SHA256
0x050f object_type                   U32: 0 absent, 1 ordinary,
                                      2 directory, 3 symlink, 4 other,
                                      5 indeterminate observation
```

For an absent final live entry, device, inode, size, link count, mode, owner,
group, and flags are zero and the content/ACL/xattr hashes are all-zero
sentinels. An ordinary entry uses the held-FD content, ACL, and xattr hashes. A
directory or other nonordinary entry uses no-follow stat device/inode/size/link/
mode/owner/group/flags and all-zero content/ACL/xattr hashes. A symlink uses the
same no-follow stat fields and puts in `sha256` the hash of this exact stream:
8-byte `48 4d 47 34 4c 32 00 00`, U32 version 2, U32 target-byte length, then the
exact bytes returned by bounded `readlinkat`; truncation, NUL interpretation,
or a second-read mismatch fails closed. ACL/xattr hashes remain zero because no
foreign nonordinary leaf is opened as an ordinary file. Material-custody entries
must always have object type 1. Object type is an observation only; policy
comparison and violation fields determine whether it was expected. This keeps
the terminal live list at exactly 114 without inventing an inode for an absent-
only rollback result and without misreporting an injected object as absent.

Object type 5 is legal only for location role 8 when stable enumeration supplied
the exact name but a bounded no-follow observation could not obtain a complete
identity. Device, inode, size, link count, mode, owner, group, flags, and all
three hashes are then zero; the receipt also carries violation code 3 or 4 with
evidence bound to the enumeration stream. The exact observed name remains in
the kind-9 set and cannot be omitted or converted to a safe custody name.

The material-custody list intentionally excludes the journal and terminal
receipt to avoid self-reference: tag `9007` is the SHA-256 of the exact complete
terminal-intent **record** (its 128-byte header plus payload), not a SHA-256 of
the whole journal or a journal-prefix byte stream. The later status-matched terminal record
binds the externally hashed receipt, and response tags bind both final leaves/
hashes. Roles 1 through 5 require index 0..113; transaction-wide request-copy
role 6, retained ancestor orphan-receipt role 7, and foreign/unclassified role 8
require `0xffffffff`. Role 7
can name only a non-authoritative receipt that is owned by an ancestor intent;
it can never name the current terminal receipt. The policy fixes the maximum
material-custody-entry count and canonical sort order `(managed_index,
location_role, path bytes)`, with the transaction-scoped sentinel after all
per-entry indices. A
`Violation` has exactly
`0x0301 code U32`, `0x0302 entry_index U32` (all ones when not entry-specific),
and `0x0303 evidence_sha256 SHA256`. Terminal receipt bytes contain no receipt-
self-hash. The externally computed receipt SHA-256 is bound by the following
status-matched synced terminal journal record and returned in the response. The
production helper rejects a policy unless the policy's protocol-spec SHA-256 equals the
constant compiled into the reviewed binary.

Violation codes are contract-local: 1 policy/evidence hash mismatch, 2 root or
parent identity drift, 3 directory-enumeration drift, 4 unexpected object type,
5 content/size mismatch, 6 protected-metadata mismatch, 7 link-count mismatch,
8 foreign namespace leaf, 9 move inode/role mismatch, 10 durability failure,
11 current-set mismatch, 12 journal/receipt mismatch, 13 capability drift,
14 quiescence/access-revocation drift, 15 ambiguous recovery graph,
16 incomplete artifact set, 17 transition-vector mismatch, 18 operator-
authorization mismatch, 19 protocol invariant violation, and 20 unaccounted
managed-inode custody risk. No other value is valid in v2. Entry index is
`0xffffffff` only for a transaction-wide violation. `evidence_sha256` hashes the
smallest complete canonical framed object that proves the observation (request,
FinalEntry, enumeration kind, journal record, receipt, or capability object),
never diagnostic text. Derived kind 8 supplies the unique sort, duplicate, empty,
and byte-range rules.

Receipt `901b` enumerates every chain-local nonordinary namespace observation,
including nonordinary live entries and nonordinary leaves at transaction-owned
custody/stage/preimage/rollback/request locations, plus every foreign or
unclassified custody leaf regardless of object type using role 8. Its derived kind-9 hash must
equal terminal-intent `a406`. A nonempty list is legal only for
manual-recovery-required and prevents new apply; committed, rolled-back, and
refused-after-BEGIN receipts require the exact empty kind-9 set. Free-form
violation text can never substitute for this enumerable set.

Final-set hashes use one frozen serialization:

```text
8-byte magic "HMG4S2" + 2 NUL
U32 version = 2
U32 set kind: 1 final-live, 2 material-custody
U32 entry count
for each entry:
  U32 canonical FinalEntry STRUCT byte length
  exact canonical FinalEntry STRUCT bytes
```

Final-live entries sort by `managed_index` 0..113 and require location role 1.
Material-custody entries use the sort/sentinel rule above. Object-type sentinels,
roles, indices, path type bytes, and all metadata fields are inside each framed
entry and therefore inside the hash. The exact empty custody set is header plus
count zero. There is no padding or trailing byte. `expected_current_set_sha256`
hashes exactly 76 bytes: magic `48 4d 47 34 43 32 00 00`, big-endian U32 version
2, the 32-byte current-live set hash, and the 32-byte current material-custody
set hash in that order.

Set membership is recovery-chain-local, not custody-anchor-global. The live set
is always the exact 114 managed project paths at the observation point. The
material-custody set is every currently present ordinary request-copy, stage,
preimage, rollback, archive, and retained ancestor orphan-receipt leaf owned by
the apply journal plus its unique recovery descendants/ancestors in the active
chain. A stage renamed live is no longer a custody member. Journals and the
current terminal receipt are excluded to avoid self-reference. Nonordinary
chain leaves are excluded from material custody and instead appear in the kind-
9 unresolved namespace set. Objects from unrelated historical terminal chains
are excluded from this hash but remain independently mandatory inputs to the
global all-`tx-*` scanner. Apply preflight before creating its journal uses an
empty candidate-chain custody set; recover uses the full target chain. Request,
journal, receipt, recovery graph, and scanner all use this same membership rule.

The helper generates the transaction ID and custody leaves. The authoritative
result is a synced receipt that binds the helper binary, policy, request, plan,
transaction, terminal phase, journal hash chain, every custody/live inode and
content hash, and every violation; terminal authority additionally requires the
exact receipt hash in the synced status-matched terminal journal record.

Expected terminal statuses are:

```text
committed
rolled-back
refused-after-begin-before-formal-mutation
manual-recovery-required
```

A pre-`BEGIN` read-only refusal is intentionally absent from this terminal list:
it has no transaction ID, journal, or authoritative receipt.

No receipt can express Flash fidelity, original-runtime authority, audio
acceptance, human review, owner acceptance, strict completion, integration, or
publication as true.

## 10. Reproducible build and protected installation

Before a real apply, the production source and policy must pass independent
review and a reproducible build record must bind compiler, SDK, flags, source
hashes, binary hash, exact linked-library and undefined-symbol allowlists, code
signature identity, read-only probe result, and separately authorized mutating
fixture-capability receipts from both the exact target volume and the exact
system-volume lock path. Each receipt binds device/mount identity, tested path,
test time, helper/policy hashes, and exact operations; success on one volume is
never inferred for the other.

The proposed local trust layout is a root-owned, non-user-replaceable parent:

```text
/Library/Application Support/HELP Math Native Helper/
  help-math-g4-l10-successor-v2
  g4-l10-policy-v2.bin
  transaction.lock
```

Minimum properties:

- installation parent `root:wheel`, mode `0755`;
- helper `root:wheel`, mode `0555`;
- policy `root:wheel`, mode `0444`;
- permanent lock leaf in the protected parent, bound by device, inode, owner,
  group, mode, and installation receipt; its contents are ignored;
- permanent lock `root:wheel`, mode `0444`, zero bytes, `st_nlink == 1`, opened
  with `O_RDONLY | O_CLOEXEC | O_NOFOLLOW_ANY`; the distinct system-lock-volume
  capability receipt must prove this exact descriptor/path supports nonblocking
  shared/exclusive `flock` on the deployed macOS version;
- helper not setuid; the exact root-broker or dedicated-service-UID execution
  architecture remains a separately reviewed and authorized decision;
- no network entitlement or network behavior; and
- exact binary/policy hashes approved before execution.

A user-writable, runtime-compiled, ad-hoc helper is limited to disposable
fixtures. It is not an authority for live workspace mutation. Developer ID
signing may strengthen external distribution, but signing does not substitute
for a non-replaceable installation parent or protected formal/custody parents.

The current WestWorld mount was independently observed on 2026-08-04 as APFS
with filesystem ownership disabled, encryption disabled, and sealing disabled.
On that mount, `st_uid`, `st_gid`, and mode remain useful identity/drift fields,
but do not isolate the formal or custody namespace from another process running
as the project user. Protecting only the binary and policy under `/Library` does
not close the source-leaf rename or in-place content-write windows on WestWorld.
Production apply is therefore blocked until a separately reviewed architecture
makes every source/destination parent and every managed inode non-writable and
metadata-protected from untrusted processes and proves that no earlier writable
descriptor/mapping remains. Enabling filesystem ownership alone does not create
that domain; it is at most a prerequisite for assigning parents and inodes to a
distinct broker/service identity with enforced ACLs and no retained project-
user write handles. Enabling volume ownership, changing ACLs/ownership,
introducing a root broker/service UID, quiescing writers, or relocating formal/
custody objects are system/workspace changes that each require explicit user
authorization; this contract performs and authorizes none of them.

## 11. Adversarial fixture gate

All mutation tests run only inside a newly created disposable fixture. Test
barriers use inherited anonymous pipes or socket pairs, not replaceable path
semaphores. A test-only binary has a distinct hash and policy and must never be
installed as production.

The reviewed suite must cover at least:

1. the v1 post-verify/pre-unlink replacement exploit model;
2. root replacement before initial open;
3. ancestor replacement after parent descriptor pinning;
4. exclusive-create and no-replace `EEXIST` injection with file, directory, and
   symlink targets;
5. hardlink rejection;
6. stage, archive, request, journal, receipt, custody, lock, and formal-parent
   races;
7. preimage-to-custody destination injection;
8. absent-only stage-to-live destination injection;
9. installed-successor replacement before rollback;
10. two-process lock exclusion and crash lock release;
11. a crash matrix before journal creation, during partial `BEGIN`, and before
    and after every durable phase and per-entry install;
12. all-`tx-*` orphan scanning, foreign sentinel preservation, expected
    custody-to-live transitions, and no helper-caused unaccounted managed-inode
    loss;
13. malformed/oversized/overflow/path-traversal protocol fuzz cases;
14. exact 114 count, allowlist hash, predecessor hash, desired hash, and
    report-order mutations;
15. APFS capability behavior for required no-follow, beneath, unique-inode,
    no-replace rename, `fsync`, and `F_FULLFSYNC` operations, plus explicit proof
    that untrusted writers cannot mutate protected production parents; target-
    volume and system-lock-volume receipts are separate and neither substitutes
    for the other; and
16. static and linked-symbol proof that production has no delete, shell, or
    recursive-cleanup capability;
17. opening a writable FD and writable mapping before a proposed protection
    transition, then attempting in-place write/truncate/mmap mutation during
    final verification and receipt creation; the production architecture must
    prove such handles cannot exist rather than relying only on parent modes;
18. untrusted attempts to change managed owner/group/mode/flags, ACLs, xattrs,
    hardlinks, and content after protected-domain admission; and
19. shared-verify versus exclusive-apply/recover lock exclusion and final
    whole-set identity recheck;
20. all four terminal intent/receipt/final-record combinations, every cross-
    state mismatch, and crash points between intent, receipt, and terminal
    record;
21. journal sequence/hash-chain/state-transition fuzzing, including torn tails,
    duplicated records, skips, bytes after terminal, and cross-transaction
    splice attempts;
22. strict rejection of path-type confusion among managed relative paths,
    approved absolute root, custody leaves, and evidence paths;
23. fixed policy-location opening and hash checks for plan, bundle, both
    capability receipts, quiescence receipt, and operator authorization;
24. FD-only metadata setup/readback plus pathname-replacement attempts during
    owner/mode/flags/ACL/xattr operations and canonical-hash test vectors; and
25. capability/I/O failures before journal creation versus during partial
    `BEGIN`, artifact creation, rename, parent sync, receipt, and every terminal
    record, proving status 6 is never returned after a transaction leaf exists;
26. recovery-graph chains of depth one and greater, crash-at-each-recovery-
    phase continuation from the unique tip, and rejection of branches, cycles,
    self-edges, ancestor bypass, duplicate child, ambiguous/orphan receipt, and
    manual-terminal admission;
27. all recovery-disposition/state combinations, including mid-forward commit
    versus rollback, every unmatched intent, zero-complete-record manual-only,
    vector mutation, and operator-authorization expiry/mismatch;
28. exact canonical preimages for every derived kind, including ambiguous-
    concatenation attacks, duplicate/sort/count/trailing-byte mutations, empty
    sets, mount-API normalization, and transaction-local versus unrelated-
    historical custody membership;
29. every normative request/bundle/journal/receipt equality with one-sided
    mutation, every artifact-role mapping, every move role/inode mapping, and
    custody transaction/hash-prefix mismatch;
30. post-BEGIN directory, symlink, and other-object injection, exact no-follow
    identity/readlink hashing, unresolved-set enumeration, and proof that no
    such object is reported as absent or ordinary;
31. the three exact ACL vectors above plus unknown tag/permission/flag,
    owner/group/everyone API-tag refusal, duplicate UUID, and order mutation;
32. predecessor-present/absent forward-vector counts, report-last sequencing,
    every crash prefix's mechanically derived rollback vector, and rejection of
    missing/duplicate/reordered transition records; and
33. two-pass FD-relative enumeration, exact-case spelling on case-insensitive
    APFS, case-collision/name drift, bundle leading/inter/trailing gaps, zero-
    size rejection, and an acyclic policy/evidence hash-DAG fixture.

Any unsupported production capability, unexpected namespace mutation,
helper-caused unaccounted managed-inode loss, ambiguous recovery state, flaky
race result, unprotected formal/custody parent, or unreviewed binary drift blocks
installation and live apply.

## 12. Actions requiring separate active authorization

This contract itself authorizes none of the following actions. They are
technically separable from protected installation and live apply, but may be
performed only when an active user request explicitly authorizes the indicated
implementation or fixture mutation:

- review and amend this design contract;
- write C source, strict protocol parser, compiled-policy generator, and
  fixture-only tests;
- compile a development/test binary in a disposable build directory;
- exercise required system calls only inside disposable fixtures;
- run unit, fuzz, race, crash, source-scan, `nm`, `otool`, and reproducible-build
  checks against test artifacts;
- implement a strictly read-only verifier;
- create a development-only sealed bundle/plan with no live-output effect; and
- independently review exact source, policy, tests, build receipt, binary, and
  adversarial evidence.

Authorization for one listed development action does not authorize another,
protected installation, system/volume permission changes, or live mutation.

## 13. Explicit authorization still required

Before any live transaction, the project owner must explicitly approve:

1. the helper trust model and whether administrator installation is allowed;
2. the exact reviewed helper binary SHA-256 and policy SHA-256;
3. the exact approved 114-output plan SHA-256;
4. the protected writer-domain architecture, including any root broker/service
   UID and formal/custody-parent access control;
5. any WestWorld ownership/ACL change or object relocation;
6. the protected helper/policy/lock installation;
7. the custody location, estimated capacity, retention period, and no-automatic-
   deletion policy;
8. the first live `apply` against the exact project identity; and
9. any later recovery or retention transaction as a separate action.

After a safe transaction succeeds, Lesson 10 still requires the ordered
Flash-to-JavaScript gates: static/authoring audit, named authorized
original-runtime capture, stable specification, formal renderer, behavior and
product tests, complete visual comparison/RMSE, original-runtime audio
listening, immutable human review, owner acceptance, strict validation, and
atomic lesson/course release. This helper can establish only the integrity and
custody of one filesystem transaction.
