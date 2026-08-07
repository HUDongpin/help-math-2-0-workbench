# Grade 4 Lesson 10 native transaction helper v2.1 successor security contract

Status: **design-only successor; not implemented, installed, or executable**
Evidence date: **2026-08-05**
Wire protocol version: **2**
Specification revision: **1**
Acceptance effect: **none**

## 0. Authority, predecessor, and precedence

This file is a non-destructive successor to
`docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md`. The predecessor remains
byte-for-byte preserved at SHA-256
`77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.
The predecessor is incorporated by that exact hash. Its requirements remain
normative unless this successor expressly replaces them. On conflict, this
successor controls. Silence here never weakens the predecessor.

After this file is frozen, `protocol_spec_sha256` means SHA-256 of the complete
exact bytes of this successor file. This file binds the predecessor hash above,
so one successor hash transitively binds both documents without a self-hash.
The successor SHA-256 is computed externally and must not be inserted into this
file after review. Any byte change creates a new specification identity and
invalidates every prior policy, build, install, capability, quiescence,
authorization, request, journal, receipt, implementation review, and security
review bound to the earlier bytes.

The existing workspace codecs bind only the predecessor hash and remain
non-authoritative. Their unconditional `HMG4V2_CORE_UNFROZEN_AUTHORITY` result
must not be changed merely because this document exists.

The active authorization is ordered. Before a valid Gate-A independent review,
it permits only creation and read-only review of this successor. After Gate A
reaches specification-only `P0/P1/P2 = 0/0/0`, it permits workspace-only
production-helper source implementation, compilation, codec/unit/fuzz tests,
and nonprivileged test-harness setup or teardown solely inside approved
disposable fixture roots. The current authorization does not permit dispatching
the production helper's `apply` or `recover` operation, even against a
disposable fixture; exercising either mutation call graph requires a later
separate authorization. Neither phase permits protected installation, protected
parent/ACL/UID/launcher or system/volume changes, original-runtime launch,
acceptance, promotion, or publication. The contract and every test receipt have
zero acceptance effect; a Gate-A pass does not claim that the helper or Gate-B
evidence already exists.

## 1. Canonical framing, parsing, and fixed resource bounds

All predecessor integer, TLV, STRUCT, LIST, ordering, duplicate, reserved-byte,
and trailing-byte rules remain normative. Every new authority or review object
uses this 56-byte frame:

```text
offset  size  field
0       8     object-specific magic
8       4     protocol version = 2
12      4     object kind or scope enum
16      8     payload length
24      32    SHA-256 of exact payload bytes
56      ...   canonical TLV payload
```

Exact object length is `56 + payload_length`. The object SHA-256 used by other
objects covers the complete header and payload. No padding or trailing byte is
permitted. Unknown magic, kind, tag, type, enum, bit, optional field, reserved
value, count, sentinel, or extension is invalid in revision 1. Future extension
requires a new successor hash, policy, helper build, install receipt,
capability receipts, and quiescence receipt.

```text
magic     object                                      kind/scope   max payload
HMG4P2    production policy                          1            16 MiB
HMG4N2    sealed plan                                1            16 MiB
HMG4K2    capability receipt                         1 target     16 MiB
                                                       2 lock
HMG4F2    disposable-fixture authorization            1 target      4 MiB
                                                       2 lock
HMG4L2    privileged owner authorization              1 fixture     1 MiB
                                                       2 build sign  16 MiB
HMG4C2    protected-birth receipt                      1 fresh tree   8 MiB
                                                       3 ingest
HMG4S2    protected-birth owner authorization          1 fresh tree   2 MiB
                                                       3 ingest
HMG4Q2    quiescence/access-revocation receipt       1             1 GiB
HMG4I2    protected-install receipt                  1            64 MiB
HMG4U2    reproducible-build receipt                 1            64 MiB
HMG4Y2    xattr policy                               1             1 MiB
HMG4W2    single-use apply authorization             1             1 MiB
HMG4Z2    protected-install authorization             1             1 MiB
HMG4E2    canonical review/evidence manifest          1..6         16 MiB
HMG4L3    external-launcher TCB audit                  1            16 MiB
HMG4G2    review-only golden-vector catalog            1           128 MiB
HMG4H2    review-only decoder aggregate                1 codec A     64 MiB
                                                       2 codec B
HMG4M2    review-only outer-resource custody report    1 logical    64 MiB
                                                       2 allocated
```

Each magic is its six ASCII characters followed by two NUL bytes. Exact fixed
bounds are:

```text
request payload (successor-narrowed from predecessor)    1 MiB
response/terminal/operator payload                     16 MiB
ACL entries                                                1,024
xattr rules                                                   64
xattr name bytes                                              127
xattr value bytes                                           4,096
xattr total value bytes                                    65,536
canonical xattr-set stream bytes                          524,288
symlink target bytes                                        1,024
journal records                                              4,096
journal whole-file bytes                                   256 MiB
recovery-chain depth                                            32
custody leaves in one stable scan                            4,096
total custody name bytes in one scan                         1 MiB
material-custody entries                                     1,024
unresolved-namespace entries                                 1,024
violations                                                   1,024
review finding text bytes                                     4,096
reviewed code-region bytes                                  262,144
protected parents                                              256
supplementary groups per credential                            128
principal-resolution members                                8,192
writer-principal closure members                            8,192
access-decision trace members                               8,192
access-decision phase-input bytes                            4 KiB
evidence location roles                                         12
quiescence subjects                                            512
access-denial probe records                                  6,144
protected namespace records                                 65,536
protected-birth parent entries per scan                       1,024
aggregate HMG4C2/HMG4I2 bytes embedded in one Q2            512 MiB
namespace rules                                               1,024
build source units                                           1,024
U2 reviewed build-input members                              2,048
E2 reviewed input or output members                           8,192
undefined-symbol members                                     4,096
linked-library members                                       1,024
unique process executable identities                         1,024
compile arguments                                              256
environment entries                                             64
build commands per reproducible build                            512
build executions per reproducible build                         1,024
build artifact references                                       8,192
build FD records                                                8,192
build stage edges                                               16,384
signing authorization targets                                       2
signer transcripts                                                   2
source-level direct-call occurrences                            65,536
aggregate direct-call expression bytes                          16 MiB
Security/CoreFoundation auxiliary +1 objects                          6
build-signing claim leaves per namespace pass                     4,096
SecKey signature-call observations                                    2
transaction-ID collision attempts                               16
path components per component sequence                           64
bytes per path component                                        255
complete component-sequence bytes                             4,096
designated-requirement external bytes                        65,536
embedded-entitlements blob bytes                             65,536
launcher-configuration bytes                                262,144
process records in one quiescence scan                        16,384
open-FD records in one quiescence scan                       131,072
writable-mapping records in one quiescence scan              131,072
stable inventory passes before blocked                              8
capability attempts per required operation                           3
golden vector cases                                              65,536
golden vector content-addressed blobs                           131,072
golden vector external logical bytes each              68,736,258,049
golden vector external logical bytes total                       256 GiB
golden vector external allocated bytes total                       8 GiB
Gate-B vector-target manifest bytes                              128 MiB
outer-resource scan members per report                             4,096
```

This successor extends the predecessor TLV type registry by exactly four type
bytes. Type `0x0d CAPABILITY_FIXTURE_ROOT_REL_PATH` has 1..128 bytes and is
legal only at HMG4F2 `790a` and HMG4K2 `300b`. Type
`0x0e CAPABILITY_FIXTURE_REL_PATH` has 1..192 bytes and is legal only at
`CapabilityAttempt.7a04` and `DenialNamespaceObservation.7fd3`. Type
`0x0f CAPABILITY_FIXTURE_CLAIM_REL_PATH` has 1..192 bytes and is legal only at
HMG4K2 `3030`, `AccessDenialFixtureObservation.7f39`, and
`FixtureClaimCreationObservation.80c4`. All three are exact ASCII
values matching Section 11. Type `0x10 BUILD_REL_PATH` has 1..1,024 bytes and
is legal only at BuildSourceUnit `6107`, BuildInvocation `6143`,
BuildTreeMember `6152`, BuildArtifactRef `61a4`, and
SigningAuthorizationTarget `8b1a`, plus external-launcher
`LauncherSourceUnit.9302` and `LauncherBuildArtifact.9422`; nested copies in
HMG4L2 kind 2 retain those same schema sites; external-launcher typed path
projections additionally permit `LauncherCommandArtifactBinding.95e9` and
`LauncherBuildRootScanMember.9662`. It is exact ASCII as defined
below. Gate B places an otherwise
valid `0x10` value at every nonlisted HMG4L3/HMG4E2/build/runtime tag and each
listed value, including `95e9` and `9662`, at its neighboring tag; all
forbidden-site cases fail before
semantic parsing.
Gate B likewise exercises `0x0f` at all three legal sites and rejects that
otherwise-valid value at each neighboring and every nonlisted schema site.
These four successor types are distinct from `POLICY_REL_PATH`, `SAFE_CUSTODY_LEAF`,
`APPROVED_EVIDENCE_REL_PATH`, and every other path type. All other type bytes
outside the incorporated predecessor registry `0x01..0x0c` and these four
successor additions are invalid.

This successor also amends the incorporated predecessor bound rule for existing
type `0x05 BYTES`: its default remains 0..4,096 bytes, but an exact field schema
may state a different smaller or larger bound. That explicit field bound replaces
only the 4,096-byte type default for that field and remains conjunctive with the
enclosing STRUCT, LIST, object, request, or journal-payload cap. A field with no
explicit override still has the 4,096-byte default. Thus fields such as
`78d0`, reviewed code/requirement/configuration bytes, and `a027` use their
displayed exact bounds without creating an undeclared TLV type extension.

Every bound is checked before allocation, iteration, hashing, or filesystem
opening. `max + 1`, arithmetic overflow, or inability to represent a declared
length is fail-closed before mutation. Zero SHA-256 is invalid except for the
following closed predecessor contexts: `Entry.0106` for state 0 absent;
`FinalEntry.0507/050d/050e` exactly as the predecessor defines for absent,
directory/other, symlink, or indeterminate observation; journal-header previous-
record hash for sequence zero; request `0022`, RECOVERY_BEGIN `a013`, receipt
`9017`, and authorization `0f07` for a target journal with zero complete records;
and response `8009` only in the predecessor-defined pre-current-set refusal.
HMG4C2 `821d` is all-zero exactly for the ordinal-0 root receipt of each
distinct profile-1 HMG4S2 rooted subgraph (root role 1 or 2) and is a complete
earlier parent-HMG4C2 hash for every other profile-1/3 receipt.
RecoveryAdmissionSnapshot `8926` is all-zero exactly when canonical parsing of
the exact target-journal bytes whose complete-byte hash is `8925` yields zero
complete records; otherwise it equals the parsed last complete record hash.
Destination-absent observations inherit the FinalEntry absence rule. No other
successor SHA field accepts all-zero, and a conditionally inapplicable SHA tag is
forbidden rather than encoded as zero.

Field/list bounds and the enclosing payload bound are conjunctive; the valid
domain is not the Cartesian product of every field simultaneously at maximum.
For conformance vectors, each individual numeric bound is exercised at exact
declared max and max+1 with all unrelated variable-length fields at their
canonical minima, and the complete payload-length bound is separately exercised
the same way. If another mandatory syntactic or semantic constraint makes the
declared max unreachable by a canonical object (for example an incorporated
HMG4B2 canonical table cannot fill its generous framing cap with exactly 114
bounded entries), the catalog carries the largest semantically valid positive
case and a case-kind-8 exact raw input for that exact declared max.
Kind 8 proves only that the selected scalar/envelope guard admits the exact-max
value before the independently registered first later canonical or semantic
failure; it is not represented as a complete canonical object when constructing
one would itself be impossible. The case registers that exact later phase and
diagnostic. It never mislabels an unreachable cap as maximum-valid or omits the
numeric boundary.
The stated K2/Q2/U2/G2 payload limits accommodate every maximum-count list with
minimum-valid members. An otherwise in-range nested field that makes the whole
payload exceed its object cap is invalid at the framing phase.

`mode` and every successor `mode_bits` field mean only `st_mode & 07777`.
Object type is a separate enum and is never serialized inside `mode_bits`.
This replaces the predecessor's inconsistent raw-versus-permission mode usage.

## 2. Request and response transport; exact request-copy preimage

Production revision 1 has exactly one transport profile:

```text
argc = 1; argv[0] is never authority
fd 0 = read end of one inherited anonymous request pipe
fd 1 = write end of a distinct inherited anonymous response pipe
fd 2 = write end of a third distinct anonymous diagnostic pipe; fixed tokens only
fd >= 3 = forbidden; any occurrence causes silent startup failure and exit 64
```

FD 0, FD 1, and FD 2 must be `S_IFIFO` with link count zero and the expected
access direction. For each, `proc_pidinfo(PROC_PIDLISTFDS)` must report Darwin
descriptor type `PROX_FDTYPE_PIPE`, and
`proc_pidfdinfo(PROC_PIDFDPIPEINFO)` must return exactly the frozen
`sizeof(struct pipe_fdinfo)` and yield a complete PipeEndpointObservation. Both
`8128 pipe_handle` and `8129 pipe_peer_handle` are nonzero and unequal within
each endpoint. Across FD 0/1/2, all six own/peer handle values are pairwise
distinct; this rejects a duplicate endpoint and opposite ends of the same pipe,
not merely equal own handles. FD 0 `F_GETFL` is exactly
`O_RDONLY|O_NONBLOCK`; FD 1/2 are exactly `O_WRONLY|O_NONBLOCK`; `F_GETFD` is
exactly zero at exec entry because `FD_CLOEXEC` would have closed an inherited
endpoint. `8123/8126/812b` equal those observations and `812d` equals the
selected SDKIdentity `4f39`. Only `proc_fdinfo.proc_fdtype` is compared with
`PROX_FDTYPE_PIPE`; `8126` retains the unsigned bit pattern of the distinct
signed `pipe_fdinfo.pfi.fi_type` result for diagnostics and never classifies
the descriptor. Every public status, guard, offset, pipe-status, flag,
structure-size, and field-layout value is admitted only by the selected
SDKIdentity's closed kind-116 registry. A vnode FIFO (including an unlinked
named FIFO), socket, regular file, directory, TTY, bidirectional descriptor, or
unclassified descriptor is invalid. CLI fields, environment configuration, JSON, plist,
pathname request selection, and fallback transports are forbidden. Environment
bytes are ignored and may not influence any authority decision.

Before reading a header the helper enumerates its own descriptor table with the
SDK-bound `proc_pidinfo(PROC_PIDLISTFDS)` algorithm. One pass performs a positive
size query, rejects a nonmultiple of frozen `sizeof(struct proc_fdinfo)` or more
than 65,536 records, allocates by checked addition exactly one extra record,
and reads into that larger buffer. A return not divisible by the record size,
equal to the full enlarged capacity, larger than capacity, or containing a
duplicate FD means growth/truncation and restarts the complete size/read pass;
all other error/zero/short ambiguity blocks. At most eight complete passes are
started. Admission requires the first two consecutive successful passes whose
sorted `(proc_fd,proc_fdtype)` lists are byte-identical and contain exactly
FDs 0, 1, and 2 once each with `PROX_FDTYPE_PIPE`; a hidden fourth FD at the
old or enlarged capacity is therefore detected rather than truncated away.

Each of those two passes then classifies all three FDs with `fstat`,
`F_GETFL`, `F_GETFD`, and `PROC_PIDFDPIPEINFO`; the complete normalized
PipeEndpointObservation values must be byte-identical between passes and obey
the six-handle nonalias rule. No diagnostic or response write is attempted
while any pass/FD/peer remains unclassified. Missing/extra FD, wrong type,
direction, link count, flag, pipe layout/status, zero/duplicate/cross-peer
handle, count drift, enumeration error, or exhausted retry cap is an unframed
silent startup failure with exit 64. The names
`HMG4V2_INVALID_REQUEST_FD`, `HMG4V2_INVALID_RESPONSE_FD`,
`HMG4V2_INVALID_DIAGNOSTIC_FD`, and `HMG4V2_UNEXPECTED_INHERITED_FD` are
reserved negative-vector labels and are never wire tokens in revision 1.

The sole permitted FD-2 token is the exact 21 ASCII bytes
`HMG4V2_INVALID_HEADER`, with no NUL, LF, CR, prefix, suffix, or path. Its attempt uses one common
total nonblocking profile. FD 2 must already carry `O_NONBLOCK` in the retained
`F_GETFL` status flags at entry; the helper never uses `F_SETFL` because status
flags belong to the shared open-file description. The protected launcher
configuration requires that before exec the launcher close every duplicate of
the three child endpoints, retain only the three opposite peer endpoints, and
never call `F_SETFL` on any retained peer. The helper rechecks exact `F_GETFL`
immediately before every read/write/poll as a defense-in-depth drift check; that
recheck does not replace the launcher/code/configuration authority. Before any possible token it
installs process-local `SIGPIPE` ignore handling and verifies that operation;
failure means no write and exit 64. It then performs at most one atomic
complete-token write. The token is shorter than the SDK-bound `PIPE_BUF`. A
monotonic 100-millisecond deadline starts before the first call. It retries only
`EINTR` while the deadline has not expired; `EAGAIN`,
`EWOULDBLOCK`, `EPIPE`, any other error, a partial write, or deadline expiry
abandons the token immediately and still exits 64. It never polls beyond that
deadline, restores no descriptor state, and never waits for a reader. Thus an
attacker-selected invalid or full diagnostic endpoint cannot be mutated,
block startup, terminate the helper by signal, or change the fixed exit status;
a bad response FD is never described by a response it cannot safely carry.

Every deadline is an absolute `CLOCK_MONOTONIC` nanosecond value produced by
checked addition. A sample is taken immediately before and after each
read/write/poll. If the pre-call sample is at or beyond the deadline, deadline
expiry wins and the syscall is not made. `poll` timeout is the checked ceiling
of remaining nanoseconds to milliseconds, capped at `INT_MAX`; after `poll`, an
at-or-after-deadline sample wins even when readiness was also returned. Only a
strictly-before-deadline result proceeds. Exact expiry-minus-one and expiry,
readiness-at-expiry, EINTR-at-expiry, and arithmetic-overflow vectors are
mandatory.

Every request/response `poll` uses one zero-initialized `struct pollfd`,
`nfds=1`, the already classified endpoint FD, and exactly one requested event:
`POLLIN` for FD 0 or `POLLOUT` for FD 1. Before each call the helper writes
zero to `revents`; a negative or zero return with nonzero `revents` is an
invalid poll result. Let `known = POLLIN|POLLOUT|POLLERR|POLLHUP|POLLNVAL`.
Any bit outside `known`, or the other endpoint's readiness bit, is
unknown/unrequested and fails closed. The exact post-call decision matrix,
ordered by precedence, is:

```text
row endpoint post-sample  poll return      revents predicate                 decision
0   request  at/after     any              any                               deadline
1   request  before       -1/EINTR         exactly zero                      poll again
2   request  before       0                exactly zero                      poll again
3   request  before       -1/other         exactly zero                      request transport error
4   request  before       greater than 1   any                               request transport error
5   request  before       exactly 1        contains POLLNVAL                 request transport error
6   request  before       exactly 1        contains POLLERR, no POLLNVAL     request transport error
7   request  before       exactly 1        exactly POLLIN                    retry read
8   request  before       exactly 1        exactly POLLHUP                   one EOF-classifying read
9   request  before       exactly 1        exactly POLLIN|POLLHUP            retry/drain read
10  request  before       any remaining    zero/nonzero invalid or unknown   request transport error
11  response at/after     any              any                               deadline
12  response before       -1/EINTR         exactly zero                      poll again
13  response before       0                exactly zero                      poll again
14  response before       -1/other         exactly zero                      response transport error
15  response before       greater than 1   any                               response transport error
16  response before       exactly 1        contains POLLNVAL                 response transport error
17  response before       exactly 1        contains POLLERR, no POLLNVAL     response transport error
18  response before       exactly 1        contains POLLHUP, no NVAL/ERR     response transport error; no write
19  response before       exactly 1        exactly POLLOUT                   retry write
20  response before       any remaining    zero/nonzero invalid or unknown   response transport error
```

Rows 0 and 11 include a `poll` return of zero exactly at the exclusive
deadline: deadline wins. A zero return strictly before the deadline is an
early timeout and only recomputes the checked remaining timeout; it never
manufactures EOF/readiness or extends the original deadline. With `nfds=1`,
the only readiness return is exactly 1; a positive return greater than 1 is an
anomalous transport failure regardless of `revents`. For return exactly 1 the
only admitted request `revents` combinations are therefore
`POLLIN`, `POLLHUP`, and `POLLIN|POLLHUP`. A HUP-only row performs one
nonblocking read, retrying only `EINTR` before the same deadline: zero is the
only EOF proof, positive bytes are consumed and return to the ordinary read
loop, and `EAGAIN/EWOULDBLOCK` or any other error is a request transport error.
For `POLLIN|POLLHUP`, HUP does not itself mean EOF; available bytes are drained
and only a later zero-byte read establishes EOF. The phase of that zero read
still decides invalid/incomplete header, `REQUEST_PAYLOAD_TRUNCATED`, or the
successful one-byte EOF probe. On response, `POLLNVAL` outranks `POLLERR`,
which outranks `POLLHUP`, which outranks `POLLOUT`; consequently
`POLLOUT|POLLHUP` never authorizes a write.

The canonical kind-147 `PollDecisionBinding` registry in the selected
`SDKIdentity` contains these twenty-one rows byte-for-byte and resolves every
named bit through symbol-mapping domain 15. FD 2 has no poll row: after an
invalid header, its fixed token attempt occurs only while the pre-write sample
is before the 100-millisecond deadline; `EINTR` may retry, while
`EAGAIN/EWOULDBLOCK`, partial/zero write, any other error, or a sample at/after
the deadline abandons the token and preserves exit 64. No FD-2 outcome can
replace an earlier request classification. After a valid header, request
transport/deadline decisions are framed; response poll/deadline failure makes
the response non-authoritative and exits 74 without an FD-2 token or a change
to already durable journal/receipt authority. A request-side return greater
than one before a complete valid header follows only the invalid-header token/
exit-64 path; after header validity it is the framed
`REQUEST_TRANSPORT_READ_POLL_OR_CLOCK_ERROR`. A response-side return greater
than one never retries or writes and exits 74.

Gate B has one vector for every matrix row and each precedence overlap,
including `NVAL|ERR|HUP|ready`, `ERR|HUP|ready`, HUP-only read zero/positive/
`EAGAIN`, `POLLIN|POLLHUP` positive-then-zero, response
`POLLOUT|POLLHUP`, return-zero one nanosecond before/at the deadline, EINTR one
nanosecond before/at the deadline, positive readiness at expiry, nonzero
`revents` on nonpositive return, zero `revents` on positive return, the other
endpoint readiness bit, every single unknown bit in the signed 16-bit
`revents` domain, request/response returns 2 and `INT_MAX` with each readiness
mask, and diagnostic-token pre/post-deadline and partial-write
cases. Expected retry/write counts and outward diagnostic/status class are
asserted, not inferred from timing.

Reads retry only `EINTR`, handle short counts, and use a monotonic 30-second
deadline for the complete request. `EAGAIN/EWOULDBLOCK` performs a bounded
`poll(POLLIN)` only for the remaining deadline, then retries the nonblocking
read; readiness never changes the syscall to blocking mode. The helper reads exactly 56 header bytes.
Revision 1 narrows the incorporated predecessor request-payload limit to exactly
1,048,576 bytes; a header declaring a larger payload is invalid even though the
predecessor framing envelope was larger. If
that fixed header cannot be validated, it emits no frame, may write only
`HMG4V2_INVALID_HEADER` to FD 2, and exits 64. After a valid header it reads
exactly the declared bounded payload, then reads one additional byte. EOF is
required. A byte, timeout, error, held-open writer, or second frame is a framed
protocol violation with zero managed mutation. No project, installation,
evidence, lock, or custody object is opened before the EOF decision.
After a valid header, zero bytes before the declared payload completes maps to
`REQUEST_PAYLOAD_TRUNCATED`; deadline expiry (including a held-open writer) maps
to `REQUEST_DEADLINE_EXCEEDED`; a non-`EINTR` `poll`/`read` failure while reading
payload or performing the one-byte EOF probe maps to
`REQUEST_TRANSPORT_READ_POLL_OR_CLOCK_ERROR`; and any successfully read
EOF-probe byte maps to
`REQUEST_TRAILING_OR_SECOND_FRAME`. These classes are disjoint and no errno is
reflected into attacker-visible bytes.

The exact header and payload are retained in immutable private memory. Define:

```text
request_payload_sha256 = SHA256(exact payload)
request_frame_sha256   = SHA256(exact 56-byte header || exact payload)
```

The first durable sequence-zero `BEGIN` or `RECOVERY_BEGIN` record embeds that
exact complete frame as `a027` and its exact length as `a026`; this is the
canonical durable recovery preimage even if the process crashes before a
request-copy artifact is created. The sequence-zero record's payload hash and
whole record hash therefore protect every request byte. When a branch later
creates a request-copy artifact, its bytes are exactly the retained complete
frame; a recovery validator may compare them to `a027`, but neither the initial
helper nor any recovery helper regenerates, normalizes, or rereads them from FD
0. The sequence-zero fields, artifact leaf, `FinalEntry.sha256`, size, later
journal records, and terminal receipt all bind `request_frame_sha256` and
`56 + payload_length`. The 1-MiB request cap leaves the complete sequence-zero
payload within the unchanged 16-MiB journal-record payload cap.

After a valid fixed header, the helper attempts exactly one complete `HMG4R2`
frame on FD 1. FD 1 contains no diagnostic text. Writes retry only `EINTR`,
handle short counts, use the already verified process-wide `SIGPIPE` ignore,
recheck the exact status flags before every syscall, and use a monotonic
30-second deadline under the same boundary-precedence rule.
`EAGAIN/EWOULDBLOCK` performs `poll(POLLOUT)` only for the remaining deadline
and then retries the still-nonblocking write. A competing pipe holder may cause
more readiness transitions but can never extend the fixed deadline or make a
read/write blocking.
Response emission begins only after all filesystem activity stops. A partial or
failed response is non-authoritative and exits 74. After `BEGIN`, the retained
journal/receipt state remains the authority even if no response is delivered.
FD 2 never includes attacker-controlled bytes or paths.

Add top-level request tags:

```text
0x0023 reproducible_build_receipt_sha256 SHA256
0x0024 protected_install_receipt_sha256  SHA256
0x0025 apply_authorization_sha256         SHA256
0x0026 apply_authorization_leaf           APPROVED_EVIDENCE_REL_PATH
0x0027 required_quiescence_subject_count  U32
0x0028 required_quiescence_subject_set_sha256 SHA256
0x002b recovery_admission_snapshot_sha256 SHA256
```

Tags `0023/0024` are required for every operation. Tags `0025/0026` are
required only for `apply` and forbidden for probe, verify, and recover. Tags
`0027/0028` are required for verify, apply, and recover and forbidden for probe.
Tag `002b` and the existing recover operator-authorization tags are required
only for recover and forbidden for probe, verify, and apply. `002b` is copied
from the fully verified embedded HMG4O2 snapshot, not supplied as an independent
caller choice.
Tags `0029/002a` are not request fields and are forbidden for every operation:
the complete request frame must exist before a plan can bind its request-copy
member. These requirements amend the predecessor operation matrices; no other
newly defined tag is implicitly optional.

Add `BEGIN`/`RECOVERY_BEGIN` tags:

```text
0xa01b reproducible_build_receipt_sha256 SHA256
0xa01c protected_install_receipt_sha256  SHA256
0xa01d request_frame_sha256              SHA256
0xa01e apply_authorization_sha256        SHA256
0xa01f apply_authorization_leaf          APPROVED_EVIDENCE_REL_PATH
0xa020 required_quiescence_subject_count U32
0xa021 required_quiescence_subject_set_sha256 SHA256
0xa022 running_code_observation_sha256   SHA256, derived kind 42
0xa023 running_code_observation          STRUCT RunningCodeObservation
0xa024 artifact_plan_sha256              SHA256, derived kind 49
0xa025 artifact_plan_count               U32
0xa026 request_frame_length              U64, exactly 56 + request payload length
0xa027 request_frame_bytes               BYTES, exactly `a026` bytes;
                                               56..1,048,632 bytes
0xa028 recovery_admission_snapshot_sha256 SHA256
```

`BEGIN` requires `a01b..a027`; `RECOVERY_BEGIN` requires
`a01b..a01d,a020..a028` and forbids `a01e/a01f`; `BEGIN` forbids `a028`.
For both record types,
`SHA256(a027) == a01d`, `a026 == length(a027)`, and the embedded frame's
header/payload lengths and hashes are parsed and cross-equal to `a001` and the
request fields copied into the record. Its magic/version are exactly
`HMG4V2`/2; its operation is exactly 3 apply for `BEGIN` and exactly 4 recover
for `RECOVERY_BEGIN`; and the complete corresponding operation-specific request
matrix is revalidated from the embedded payload. No other journal record may
carry `a026/a027`. Add terminal-receipt tags:

```text
0x901c reproducible_build_receipt_sha256 SHA256
0x901d protected_install_receipt_sha256  SHA256
0x901e request_frame_sha256              SHA256
0x901f apply_authorization_sha256        SHA256
0x9020 apply_authorization_leaf          APPROVED_EVIDENCE_REL_PATH
0x9021 required_quiescence_subject_count U32
0x9022 required_quiescence_subject_set_sha256 SHA256
0x9023 running_code_observation_sha256   SHA256, derived kind 42
0x9024 running_code_observation          STRUCT RunningCodeObservation
0x9025 artifact_plan_sha256              SHA256, derived kind 49
0x9026 artifact_plan_count               U32
0x9027 recovery_admission_snapshot_sha256 SHA256
0x9028 final_unresolved_chain_set_sha256 SHA256, derived kind 109
0x9029 final_unresolved_chain_intent_count U32, 0..1
0x902a final_unresolved_chain_intents    LIST UnresolvedChainIntent, exact count
0x902b final_complete_current_state_sha256 SHA256, derived kind 115
```

All receipts require `901c..901e,9021..9026,9028..902b`. Original apply receipts require
`901f/9020` and forbid `9027`; recovery-generated receipts forbid `901f/9020`,
require `9027`, and retain predecessor recovery fields.

## 3. Loaded helper identity and acyclic evidence DAG

The helper embeds only the successor specification hash, release identifier,
the complete canonical `LauncherConfigurationIdentity` bytes and their exact
kind-48 hash, exact designated-requirement external-representation bytes and
their SHA-256, the exact permitted parent-launcher code-identity kind-15 hash,
the exact sibling policy leaf ASCII `g4-l10-policy-v2.bin`, and the offline
policy-root Ed25519 SPKI DER bytes
and SHA-256. It does not embed its own whole-file hash or the
policy hash. Final binary and policy hashes are external authority, avoiding
self-reference. The designated-requirement bytes are therefore available before
policy admission; no untrusted file bootstraps the first self-identity check.
The embedded kind-48 object contains two independent component sequences:
`4b1a` is the installed-helper program sequence used for self bootstrap, while
`4b01` is the launcher-configuration file sequence. Neither sequence is derived
from the other and neither may substitute for the other.

Before trusting a request field, the process must:

1. use `SecCodeCopySelf` and `SecCodeCheckValidityWithErrors` against the exact
   reviewed designated-requirement bytes;
2. obtain the current running code's signing identifier, team identifier, and
   kernel CDHash through the reviewed Security framework API;
   obtain the parent launcher's dynamic code identity through the exact public
   `SecCodeCopyGuestWithAttributes` PID dictionary below; independently obtain
   its public `proc_pidpath` and complete `PROC_PIDREGIONPATHINFO` mapped-vnode
   observation, and require the same parent birth tuple, mapped executable
   vnode, held path vnode, complete static identity, retained dynamic
   `SecCodeRef`, and exact policy launcher identity until response completion;
3. open `/` once, component-walk embedded kind-48 `4b1a`, remove
   only its final helper component to derive the exact retained installation
   parent, and retain that parent and installed helper FD;
4. relative to that retained parent, open only the compiled fixed policy leaf
   read-only/no-follow, perform the bounded complete HMG4P2 read, verify the
   strict policy-root signature under the embedded SPKI before trusting any
   policy-supplied metadata/location/hash, and retain the policy FD;
5. hash and parse the held Mach-O file, requiring a SHA-256 CodeDirectory;
6. require the running CDHash to equal the first 20 bytes of the held file's
   full SHA-256 CodeDirectory hash;
7. require every dynamic SecCode shared static field to equal the held-file and
   build/install identity, and separately require a profile-1
   DynamicCodeStatusObservation; and
8. require the held whole-file SHA-256 to equal policy `1004`, request `0003`,
   build receipt `6007`, and install receipt `5002`; and
9. independently component-walk embedded kind-48 `4b01`, retain and completely
   read the launcher-configuration file, require its held file identity to equal
   embedded `4b02`, its complete HMG4LC2 frame length/hash to equal `4b03/4b04`,
   and every parsed HMG4LC2 payload field to equal the corresponding embedded
   kind-48 field; then validate the embedded audit/code/path dependencies and,
   after policy admission, require the same complete kind-48 object/hash to
   equal policy `103a/102d` and I2 `501b/501c`.

Step 4 is the policy bootstrap and has no locator supplied by the request or by
the not-yet-trusted policy. The exact parent ComponentSequence is derived by
removing the final helper leaf and final edge from embedded `4b1a` and the
step-3 walk; no other
component may change. The helper calls the SDK-bound `openat(retained_parent,
"g4-l10-policy-v2.bin",O_RDONLY|O_NOFOLLOW|O_CLOEXEC)` exactly once. It never
enumerates to choose a candidate, searches another directory, accepts a hash-
named variant, follows a symlink, calls `realpath`, uses an environment/request
path, or retries a missing/changed leaf under another name. `fstat` must show
one ordinary link-count-one file on the same installation mount.

The reader first obtains exactly 56 header bytes, requires HMG4P2 magic,
version 2, kind 1, declared payload 1..16,777,216, checked total length
`56 + payload_length <= 16,777,272`, and the exact payload hash, then streams
the canonical TLV payload through EOF with a fixed 1..1,048,576-byte buffer.
Short header/payload, early EOF, trailing byte, integer overflow, size drift,
unknown/duplicate/noncanonical tag, or file growth/replacement blocks. It parses
the complete frame while treating every field as untrusted. The first trust
decision is strict verification of the complete kind-51 statement `1034` and
Ed25519 `1035/1036` under the helper-embedded root SPKI: `1033` must be the
byte-identical kind-2 bit-0 ActorIdentity, `1001` must equal the embedded
successor hash, and the unsigned-payload construction must be exact. No policy
field, including its own parent/file metadata or helper hash, is authoritative
before that verification succeeds.

Only after the root signature passes does the helper validate the retained
parent/mount/edge identity against the unique signed role-1/subrole-1
ProtectedParent, validate the policy file against its signed metadata role,
and perform two complete byte-identical parent scans containing exactly the
signed helper, fixed policy, and lock leaves. It then resolves the build/install
receipts through the signed evidence DAG while keeping all FDs open. Complete
policy SHA-256/length/file identity must equal request `0004`, I2 `5003/5011/
5012`, this bootstrap observation, and every later request/journal/receipt
copy; helper identity must equal signed `1004`, request `0003`, U2 `6007`, and
I2 `5002/500f`. I2 confirms the already-used fixed leaf and bytes but never
supplies the bootstrap locator or root key.

Kind 168 records this whole sequence. Missing fixed leaf, alternate sibling,
directory enumeration/search result, two candidate policies, wrong case,
symlink/hardlink, mount crossing, pre/post-open replacement, oversized/short/
trailing frame, root SPKI A/signature or actor B, policy A/parent or file B,
request/I2 A/bootstrap B, metadata trusted before signature, early FD close,
or a correct signature over noncanonical/other bytes is a one-sided Gate-B
rejection before any request authority or response.

The held helper, policy, build receipt, install receipt, installation parent,
and lock FDs remain open until response completion. Identity is rechecked before
`BEGIN`/`RECOVERY_BEGIN` and before terminal intent. `argv[0]`, `PATH`, an
environment variable, a copied binary, an alternate path, a hash of some other
file at the approved path, ad-hoc fixture identity, or signing alone is never
sufficient.

Production revision 1 accepts exactly one thin `CPU_TYPE_ARM64` /
`CPU_SUBTYPE_ARM64_ALL` `MH_EXECUTE` slice and exactly one SHA-256 CodeDirectory
selected by the primary CodeDirectory slot. A fat file, alternate architecture,
multiple candidate primary CodeDirectories, non-SHA-256 CodeDirectory, absent or
duplicate signed-entitlements blob, or identifier/team bytes not equal to the
selected CodeDirectory slots is invalid. `kernel_cdhash` is the first 20 bytes
of SHA-256 over that exact selected CodeDirectory blob. Requirement comparison
uses the exact external-representation bytes embedded in the helper and repeated
in the build/install identity; entitlement comparison uses the exact signed
Mach-O blob, never a `CFDictionary` or regenerated plist.

Parent continuity is the complete kind-97 PublicProcessExecutionIdentity
`(boot_session_uuid,pid,parent_pid,start_time_seconds,start_time_microseconds)`,
not PID alone. The exact launcher configuration is opened through embedded
kind-48 `4b01`, independently of the installed-helper sequence `4b1a`, retained,
and validated as `LauncherConfigurationIdentity`; its complete kind-48
hash equals policy `102d`, the compiled parent-launcher hash binding, and the
install receipt. Every `RunningCodeObservation` equality and its kind-98
writer-admission observation are captured once at phase 1 in
BEGIN/RECOVERY_BEGIN and freshly at phase 2 in the terminal receipt.
PID/start reuse, parent exit/replacement, boot-session change, or code/
configuration drift blocks before BEGIN or
forces the post-BEGIN manual-recovery state.

In each RunningCodeObservation, `4a10.80b1/80b2 == 4a01/4a02` and
`4a11.80b1/80b2 == 4a03/4a04`. Both use actor profile 1, both projections are
`0x00000301`, and `4a10.80bb/80bc == 4a11.80bb/80bc`. That shared interval
covers only the phase's already-completed authority observations; serialization
of the resulting STRUCT occurs after its end and it never claims a future
write, payload assembly, or response completion. `4a07/4a08` repeat only
runtime-validated static code identity. Either dynamic status change,
Debugged/Platform bit, or enclosing process mismatch blocks before BEGIN and
becomes manual recovery after BEGIN.

The remaining tag-level equalities are closed. `4a01` and `4a03` are kinds 97
over `4a02` and `4a04`; both boot UUIDs equal the selected Q2 `401c`.
`4a02.8133` equals the one SDK-bound `getpid()` result, `4a04.8133` equals the
one SDK-bound `getppid()` result, and `4a02.8134 == 4a04.8133`; a second sample,
PID-only match, or parent-start mismatch is invalid. `4a05` is byte-identical
to reopened I2 `500f`. `4a06`, `4a07`, I2 `5010`, P2 `103b`, and U2 `6017`
are byte-identical, and kind 15 over each equals P2 `102e`. Kind 15 over `4a08`
equals launcher `4b08`, the unique bit-8 launcher actor `4b0c.6f05`, and kind
15 over policy launcher code `1014.240b`. `4a0b == P2.102d == I2.501c`, and
the corresponding complete `LauncherConfigurationIdentity` is byte-identical.

`4a17` is kind 146 over `4a18`. The nested parent-launcher observation's
execution identity is byte-identical to `4a04`; its two kind-142 path samples,
two kind-143 no-follow walk passes, complete kind-144 mapped-region stream,
kind-145 guest lookup, runtime code identity, and dynamic status all occur
inside the same phase bracket and bind the same one `getppid()`/
`KERN_PROC_PID` birth tuple. Its component sequence/path, edge list, held file,
static code, and external-launcher audit equal respectively
`4b1e/4b1f`, `4b22`, `4b23`, `4b24`, and `4b25/4b26`; its dynamic status is
byte-identical to `4a11` and its runtime identity is byte-identical to `4a08`.

`4a19` is kind 168 over `4a1a`. Its parent ComponentSequence/DirectoryIdentity
is the exact prefix of `4a0d/4a0f` after removing only the final helper edge;
`9576==4a05`, `9579` is the complete held HMG4P2 hash, and
`957a==1001`. `957b/957c`, `957d`, and `957e/957f` equal signed policy
`1033`, `1034`, and `1035/1036`; `9584` precedes and gates `9585`.
`9586` is kind 56 over the two `9588` scans and all scan/parent/file/leaf fields
equal the subsequently admitted P2 and I2. Phase-1 and phase-2
RunningCodeObservation values repeat the same byte-identical bootstrap object
and retained policy FD identity; a later re-open or regenerated observation is
not equivalent.

The parent executable pathname is observed with the public, SDK-bound
`proc_pidpath(parent_pid, buffer, PROC_PIDPATHINFO_MAXSIZE)` twice: once before
and once after the two walks, mapped-region scan, guest lookup, static parsing,
and dynamic validation. The zero-filled buffer has exactly one first NUL within
the fixed capacity; only the nonempty bytes before it are serialized. The
positive return value is retained as an observation but is not guessed to be a
portable byte count: the public declaration is used only as a success/failure
contract, while bounded NUL discovery defines the exact path bytes. Each path
is absolute, contains no NUL, empty component, `.` or `..`, has no trailing
slash, parses to one canonical `ComponentSequence`, and is byte-identical to
the policy/install-bound `4b1f`. The two complete path observations agree after
omitting only ordinal and observation time. A zero/negative return, missing
NUL, relative/overlong/changed path, truncated component, or birth-tuple drift
blocks; `argv[0]`, `SecCodeCopyPath`, `realpath`, `/proc`, a bundle lookup, and
an inferred executable name are not substitutes.

Each of the two independent path walks starts from a separately opened `/` FD,
uses the exact compiled no-follow component grammar, opens every intermediate
component as a directory, and opens the final component read-only and
no-follow as one ordinary file. It records the complete component sequence,
every `ParentChildEdge`, final `ProtectedFileIdentity`, and full parsed
`ExecutableCodeIdentity`. Pass 0's final FD is retained throughout pass 1,
the mapped-region scan, guest lookup, both dynamic validity/status calls, and
the final targeted KERN_PROC sample. Pass 1 uses a different final FD. After
omitting only pass ordinal and times, both passes are byte-identical; both
equal the `4b1d..4b24` launcher authority. Link count must be one, every
directory/file type and device/inode edge must agree, and both complete
Mach-O/static Security parses must independently satisfy the closed
`ExecutableCodeIdentity` grammar. A pathname re-open, single walk, symlink,
hardlink, mount/edge drift, content drift, or hash-only comparison is invalid.

Path text alone does not bind a live process to a vnode. The helper therefore
also performs a complete public
`proc_pidinfo(parent_pid,PROC_PIDREGIONPATHINFO,...)` walk from query address
zero, advancing only by checked `pri_address + pri_size`, with at most 4,096
strictly increasing normalized `ParentExecutableRegionObservation` members.
Termination must be the target-SDK public end-of-scan result; short/oversized
records, zero-sized/nonadvancing/overflowing regions, PID disappearance, or
capacity exhaustion blocks. A selected launcher mapping has
`pri_protection & VM_PROT_EXECUTE`, an ordinary `VREG`, and kernel path bytes
exactly equal to both `proc_pidpath` samples. At least one and at most 64
selected mappings must exist; every selected mapping has one identical
nonzero `(vst_dev,vst_ino)` pair, and that pair equals both held-walk FDs'
`ProtectedFileIdentity`. The complete normalized region list is kind 144; an
implementation may not serialize only matches or omit an inconvenient
mapping. This public mapped-vnode edge, not the pathname, defeats a
byte-identical alternate copy. If the selected target OS/SDK cannot return this
complete public observation, parent authority is unavailable and production
remains blocked; no private API, task port, Mach VM read, EndpointSecurity
exception, or path/code-hash inference is permitted.

The sole dynamic-parent lookup constructs exactly one immutable dictionary.
It converts the already cross-checked nonzero parent PID, which must be at most
`INT32_MAX`, to an `int32_t`; calls
`CFNumberCreate(NULL,kCFNumberSInt32Type,&pid_s32)`; then calls
`CFDictionaryCreate(NULL,keys,values,1,&kCFTypeDictionaryKeyCallBacks,
&kCFTypeDictionaryValueCallBacks)` where `keys[0]` is the exact public
`kSecGuestAttributePid` object and `values[0]` is that sole CFNumber. It calls
`SecCodeCopyGuestWithAttributes(NULL,dictionary,kSecCSDefaultFlags,&guest)`
exactly once with `guest` initialized NULL. The only admitted result is
`errSecSuccess` (signed OSStatus zero) with a nonnull retained guest; any other
signed 32-bit OSStatus and unchanged/null output is private failure evidence,
grants no authority, emits no value or description on any wire, and blocks.
No canonical/hash/audit/Mach-port/architecture key, mutable dictionary,
ambient allocator, numeric type, second member, second lookup, or locally
declared Security symbol is legal.

The CFNumber may be released only after the immutable dictionary has retained
it; the dictionary is released after successful guest lookup; and the guest is
retained through both validity/status calls, static-field extraction, the
second path/walk comparison, and final targeted birth sample before exactly one
release. The complete positive call, exact key/value construction, flags,
OSStatus bits, nonnull result, direct-call rows, and release counts are captured
in kind 145. `SecCodeCopySigningInformation` and validity calls operate on
that same retained `SecCodeRef`, not a second PID lookup, and their complete
shared static fields equal the held kind-4 identity while their process status
equals `4a11`. The source-level kind-131 call graph and SDK ABI/layout probes
must close every call; private Code Signing SPI is forbidden.

`4a12` is byte-identical to the unique policy bit-10 runtime-helper actor's
`6f0c`: its UID/GID/group fields also equal the corresponding
`1014.2402/2403/2404/2405/2406/2407/2408/2409` fields. `4a13` is byte-identical to launcher actor `4b0c.6f0c`. The exact
`4a15.8145` process pass contains one class-1 record whose `4402/4403`,
`4405`, `440d`, and `440e` equal respectively `4a01/4a02`, kind 15 over
`4a06`, the bit-10 actor hash, and `4a12`; it also contains one targeted
launcher record whose execution identity, parent relation, executable hash,
matched bit-8 actor, and credential equal `4a03/4a04`, the observed launcher
parent tuple, kind 15 over `4a08`, kind 34 over `4b0c`, and `4a13`. No second
record may match either actor, PID, birth tuple, executable, or credential.

Phase 1 (`4a16=8150=1`) uses a fresh complete final-writer pass ending no more
than five seconds before creation of sequence-zero BEGIN/RECOVERY_BEGIN. Phase 2
(`4a16=8150=2`) starts after the last authorized mutating syscall and uses a
different fresh complete pass ending no more than five seconds before terminal-
intent creation; the terminal receipt embeds that phase-2 observation. Across
the phases, Q2/policy/rule set, boot, self/parent public birth tuples,
credentials, held/static code, launcher configuration, and approved-writer
projection are byte-identical, while pass bytes/hashes and times are independent
and ordered. Reusing phase-1 bytes as terminal evidence is invalid.

Each phase uses one exact two-pair bracket anchored to the apply/recover
operation's Section-15 `G0`. The start pair is taken immediately before the
first self/parent process, credential, held-vnode, launcher-configuration,
dynamic-code, certificate, or writer-pass observation in that phase. The end
pair is taken immediately after the last such observation and before the
RunningCodeObservation is serialized. `80bb` and `80bc` are respectively the
start/end pairs' checked realtime nanoseconds; `8149..814a` lie within the two
monotonic samples, and `814b` equals the end pair's monotonic nanoseconds.
Every Security validity/status call and every targeted public-process query in
the phase begins no earlier than the start monotonic sample and returns no later
than the end monotonic sample. Phase 1 then takes the separate `now` pair
immediately before journal `O_EXCL`; phase-1 end precedes `now` and their checked
monotonic difference is at most 5,000,000,000 nanoseconds. Phase 2 start is
strictly after the later of durable BEGIN/RECOVERY_BEGIN creation and the
recorded finish of the last authorized mutating syscall; when no post-BEGIN
mutation occurred, durable sequence-zero creation is the selected boundary. Its
end precedes a separate `terminal_now` pair taken immediately before terminal-
intent creation, and that checked monotonic gap is also at most 5,000,000,000
nanoseconds. Both phase brackets, `now`, and `terminal_now` satisfy the common
backward-realtime equation against the same `G0`. The realtime second of each
phase-end and creation pair lies inside every selected signing certificate's
inclusive notBefore/notAfter interval. A phase-1 clock/arithmetic failure uses
`00020012/00020015`; after journal creation a phase-2 or `terminal_now` clock/
arithmetic failure selects in memory `00050011/0005000b` but cannot create a
manual terminal path: the durable journal remains nonterminal, no terminal
intent/receipt/record is serialized, and at most one status-4 HMG4R2 response
is attempted. That response is diagnostic only; response failure exits 74.
Only a later separately authorized recover operation with a fresh valid clock
guard may classify and close the retained nonterminal journal. The failed or
missing `terminal_now` is never used to attest its own failure.
Exact start/end equality, one-nanosecond reversal, five-second equality, five-
second-plus-one, certificate notBefore/notAfter equality, and one-second-outside
vectors are mandatory.

After the terminal receipt is durable, the helper performs in-memory
self/parent/held-FD/dynamic-status/F_GETFL checks immediately before and after
the FD1 response attempt. Those checks can change exit to 74 or leave the
durable manual state, but no already-serialized observation claims their future
result and response delivery is never authority.

`LauncherConfigurationIdentity.4b0d` is kind 34 over `4b0c`; that actor's
`6f03/6f04` equal the launcher UID/GID, `6f05 == 4b08`, and bit 8 is present.
Kind 15 over dynamic parent ExecutableCodeIdentity `4a08` equals the same
`4b08/6f05` hash. `4b0b` is recomputed over `4b0f`; `4b0e` equals the
component count in `4b01`; and those edge members are exactly the held walk of
that component sequence. `4b03 == 4b02.6203`, `4b04 == 4b02.6204`, and every
metadata field in `4b02` equals policy role 18. The final file edge in `4b0f`
has child device/inode equal `4b02.6201/6202` and ordinary-file type; the prior
edges are directories. `4b06` is kind 23 over `4b12`, `4b11` agrees, and
`4b07` is the canonical empty kind-24 stream. `4b10` selects the sole role-1/subrole-2
ProtectedParent; removing the final configuration-file component from `4b01`
and its edge list yields byte-identical component, edge, and DirectoryIdentity
fields for that parent. The launcher configuration is therefore inside a Q2-
covered protected immediate parent, not merely reached through one.

The held configuration file is not opaque. Its bytes are exactly one HMG4LC2
frame with this fixed big-endian layout and no leading or trailing byte:

```text
offset  size  value
0       8     magic = 48 4d 47 34 4c 43 32 00 ("HMG4LC2" + NUL)
8       4     version = 1
12      4     payload kind = 1 LauncherExecutionConfiguration
16      8     payload length, 1..262,088
24      32    SHA-256 of the exact payload bytes
56      n     canonical TLV payload containing exactly the ordered union
              `4ba1..4ba9,8e33..8e36`
```

The payload uses the successor's canonical TLV rules, tag order, primitive
encodings, and no unknown/duplicate tag. Total frame length is exactly
`56 + payload_length == 4b03`, and SHA-256 of the complete frame equals `4b04`.
The helper and launcher both parse these held bytes; neither accepts a plist,
JSON, environment variable, command-line replacement, reconstructed semantic
object, or hash-only substitute. `4b19` is kind 13 over `4b1a`; `4b1a` and
`4ba2` are byte-identical to the compiled installation helper component
sequence and to each RunningCodeObservation `4a0d`, while `4b19 == 4a09`.
`4b1b/4ba3` is deterministically the single ASCII slash byte followed by the
`4b1a.6c03` component bytes in ordinal order separated by one ASCII slash,
with no final slash, escape, normalization, `.`/`..`, symlink interpretation,
or NUL inside the field. Its byte length is at most 1,023. Argument member zero
has `6611=0` and `6612` byte-identical to nonempty `4b1b`; it is the only
argument member and every later argument is forbidden. The one terminating NUL
appended to that C string and the final NULL
argv pointer exist only in the `execve` call representation and are never part
of `6612`, the TLV, or any hash preimage. `4ba6=0` and `4b07` is the canonical
empty kind-24 stream, so the configuration supplies no environment member.

`4b1d` is kind 13 over `4b1e`, `4b20` is kind 35 over `4b22`, and `4b21`
equals the component count in `4b1e`. `4b1f` is derived from `4b1e` by the
same single-leading-slash grammar as `4b1b` and has no relation to `argv[0]`.
Every `4b22` member is the held no-follow authority walk for that sequence;
the final edge's device/inode and ordinary-file type equal `4b23`, and all
prior edges are directories. `4b23.6204 == 4b24.6401`, kind 15 over `4b24`
equals `4b08` and the launcher actor's `6f05`, and the complete file/code
identity equals both live walk passes. `4b25 == 4b26.7d45`; `4b26.7d44` is the
complete HMG4L3 frame length and its held `7954.6203/6204` agrees. These fields
belong to the policy/install-bound kind-48 identity, not to the HMG4LC2 payload;
that one-way edge is required by the acyclic external-launcher audit profile.

`8e33` is kind 140 over byte-identical `8e34` and equals the admitted
`SDKIdentity.4f41/4f42`. `8e35` is kind 141 over `8e36`, and the launcher
serialization is exact: `8e36.8df2 == 8e33`; `8df3 == 4b11 == 4ba4`;
`8df3 == 1`; `8df4` is exactly `4b1b`'s byte length; `8df5 == 1` for its sole
terminating NUL; `8df6 == 4ba6 == 0`; `8df7 == 0`; `8df8 == 3`
(one argv pointer, final argv NULL, final envp NULL); `8df9 == 24`;
`8dfa == 8df4 + 1 + 24 <= 8e34.8de4`; `8dfb` equals the byte length of
`4b1b/4ba3`; `8dfc == 8dfb + 1 <= 8e34.8de3`; `8dfd == 4b06`; and
`8dfe == 4b07`. All additions and multiplications are checked before the
launcher allocates, copies, or constructs either pointer array.

The approved parent launcher source has one execution semantic. It opens `/`,
component-walks the parsed `4ba2` with the same no-follow, directory-edge, and
held-FD rules as the helper's `4a0d/4a0f` walk, requires the final ordinary-file
identity to equal the protected installation helper identity selected by the
same policy/install closure, and keeps that FD plus the held configuration FD
open. Immediately before execution it repeats the complete held path walk and
requires the same device/inode/content/code identity, then calls `execve`
exactly once with pathname bytes `4ba3` plus the syscall-only terminating NUL,
argv exactly `4ba5` plus the required pointer terminators, and an empty envp.
It cannot use `posix_spawn`, `sh`, a shell, `PATH` search, `fchdir`, a relative
path, another executable, or a second exec attempt. The exact approved parent
code identity, its unchanged public birth tuple, both held configuration
parses, the Q2 writer closure over the installation/configuration parents, and
the child's independent equality of running CDHash/static identity to the held
`4a05/4a06` helper reached by `4a0d/4a0f` jointly establish that the running process came from this named
protected helper path. A byte-identical alternate copy fails the parent launch
semantic even though its code signature and whole-file hash match.
Gate B includes independent one-sided vectors for HMG4LC2 magic/version/kind/
length/hash/trailing bytes; each omitted, duplicate, reordered, and unknown
payload tag, including omission or relocation of any noncontiguous `8e33..8e36`
tag; component-sequence/path derivation mismatch; argument-zero/path
mismatch; omitted/empty/NUL-bearing argument zero; embedded NUL at every later
argument insertion attempt and argument counts 0/2/256; nonempty environment;
pre-exec path identity drift; a byte-identical
alternate-copy path; relative path; symlink edge; second exec attempt; and each
forbidden launch API. It also includes `PATH_MAX-1/PATH_MAX`,
`ARG_MAX/ARG_MAX+1`, every individual content/terminator/pointer subtotal
off-by-one, pointer-width mutation, SDK/OS limit-identity mismatch, argv/env
hash mismatch, checked-add/multiply overflow, and a kernel-visible argv/env
serialization byte differing from its hashed member. The positive vector
observes the same held helper
device/inode in both parent walks and in the child's independent `4a05/4a0f`
walk, with the exact parent birth tuple unchanged.

`4b13..4b18` are the closed transport-launch contract: the launcher creates
exactly three distinct anonymous pipes, assigns only their read/write/write ends
to child FDs 0/1/2, retains only the opposite write/read/read peers, closes every
duplicate child endpoint before exec, and never changes a retained peer's shared
open-file-description status flags. The launcher source/build review and running
parent code identity prove that behavior; the helper's two complete startup FD/
pipe-layout passes independently prove its live child endpoints and reject every
own/peer alias. Configuration text without the held protected bytes, approved
launcher code, and live endpoint proof grants no transport authority.

The parent launcher remains an external, pre-existing trusted computing-base
component. This successor does not build, install, replace, launch, or grant
write authority over it. `4b25` is SHA-256 of one complete passing `HMG4L3`
kind-1 external-launcher TCB audit and `4b26` is its complete role-4,
encoding-1, binding-2 `ReviewedObjectMember`; all locator/file bytes are held,
no-clobber, link-count-one, and rehashed before use. The audit's closed inputs
are the successor specification and predecessor contract; the complete exact
launcher source manifest and every source byte; compiler/SDK/tool identities;
the complete external launcher build-command/transcript and resulting raw
launcher binary; the complete launcher `ExecutableCodeIdentity`; and the exact
HMG4LC2 configuration frame. Its closed outputs are an independent
implementation/security report, a single-build source-to-binary provenance report, and
behavior reports for both no-follow walks, exactly one `execve` with exact
argv/empty env, the three-pipe close/retain lifecycle, parent PID/birth and
mapped-vnode observation, and negative alternate-copy, symlink-edge,
extra/aliased/changed-FD, second-exec, PATH/relative-path, and environment
cases. All reports and command transcripts are complete held members.

`HMG4L3` result pass requires `P0/P1/P2 = 0/0/0`, an exact empty kind-53
finding stream, a bit-4 independent reviewer distinct from the launcher
builder actor, and both acceptance and production-authority effect masks
zero. It also carries explicit false values for protected installation,
original-runtime launch, apply, recover, promotion, and publication. Its
signature is over kind-151 `ExternalLauncherTCBAuditStatement` and the complete
unsigned payload; a report filename, prose approval, E2 review of a different
binary, or a hash without held bytes cannot satisfy it.
The seven platform BuildToolIdentity values are exact non-actor build inputs;
they do not acquire a `6f07` authorization mask merely by appearing in HMG4L3.

The audit is deliberately not an `HMG4E2` kind 5: E2 `751d` binds the final
policy, while the helper embeds the complete kind-48 launcher configuration.
Putting that E2 hash into `LauncherConfigurationIdentity` would create the
cycle `helper -> kind48 -> E2 -> policy -> helper`. `HMG4L3` has no helper,
final-policy, build-receipt, install, capability, quiescence, authorization,
request, journal, receipt, or acceptance input. Its HMG4LC2 bytes do not
contain `4b25/4b26`; the audit first binds external launcher sources/build/
binary/config/tests, then kind 48 binds the already complete audit, then the
helper may embed kind 48, and only afterward may policy/build evidence bind the
helper. Gate B performs a transitive graph walk and rejects every added reverse
edge or forbidden future object. This is the sole launcher-review construction
in revision 1.

`SigningProfile.4c03` is kind 27 over `4c0b`, and `4c08` is kind 27 over
`4c0d`; both counts agree. Certificate members contain the complete exact DER
bytes as reviewed objects, in leaf-to-root order. UUID derivation inputs contain
the exact labeled source/object bytes in algorithm order. A certificate subject
name or prose build recipe cannot substitute for either list.

LC_UUID derivation is a total byte function, not a toolchain default. Let `S`
be the complete canonical predecessor HMG4D2 kind-27 stream over the ordered
`4c0d` members, including that stream's magic, version, kind, member count,
member lengths, and exact canonical member bytes. `4c08 == SHA256(S)`. Let
`seed = SHA256(ASCII("HMG4UUID") || BE32(1) || BE64(length(S)) || S)`, where
the domain string is exactly eight bytes, `BE32`/`BE64` are unsigned big-endian
integers, and no delimiter, NUL, text conversion, normalization, or padding is
inserted. The LC_UUID is exactly the first 16 raw bytes of `seed`; no RFC 4122
version or variant bits are set or cleared. `BuildInvocation.6127`,
`ExecutableCodeIdentity.6405`, and the LC_UUID command in each exact signed
Mach-O slice all equal those 16 bytes. Golden vectors cover exact count 11,
wrong counts 10/12, list order, each individual member's minimum/maximum byte
boundary, complete-`S` hash, UUID, and one-sided input
byte/list-order/hash/UUID mutations.

The eleven `4c0d` members are a closed pre-output set in this exact ordinal
order: (0) `lc-uuid/successor-spec`, role 1, encoding 3, binding 2; (1)
`lc-uuid/predecessor-contract`, role 2, encoding 3, binding 2; (2)
`lc-uuid/source-manifest`, role 6, encoding 4, binding 2, equal the complete
kind-21 stream over U2 `600b`; (3) `lc-uuid/compiler-identity`, role 5,
encoding 2, binding 1, equal canonical nested `600c`; (4)
`lc-uuid/sdk-tool-identity`, role 5, encoding 2, binding 1, equal canonical
nested `600d`; (5) `lc-uuid/os-build-identity`, role 4, encoding 2, binding 1,
equal canonical nested `602a`; (6) `lc-uuid/sdk-identity`, role 4, encoding 2,
binding 1, equal canonical nested `602b`; (7) `lc-uuid/toolchain-set`, role 6,
encoding 4, binding 1, equal the complete kind-22 stream over `603b`; (8)
`lc-uuid/argument-set`, role 6, encoding 4, binding 1, equal the complete
kind-23 stream over `600f`; (9) `lc-uuid/environment-set`, role 6, encoding 4,
binding 1, equal the complete kind-24 stream over `6011`; and (10)
`lc-uuid/certificate-chain-set`, role 6, encoding 4, binding 1, equal the
complete kind-27 stream over `4c0b`. Every identifier is the exact ASCII bytes
shown. Each of these eleven complete ReviewedObjectMembers also occurs
byte-identically in U2 `603f` before the one complete SigningProfile member;
no substitute summary member, omitted member, or additional member is legal.

This set is acyclic by construction. It forbids the final helper or any output
byte/hash, LC_UUID, Mach-O output/header, CodeDirectory, CMS/signature bytes,
`4c08`, the complete SigningProfile, `4c0d`/`S` or their hashes, `603d/603f`
or their hashes, either BuildInvocation, fresh build-root state, policy, plan,
bundle, G2, E2, K2, U2, I2, Q2, Z2, W2, O2, authorization, request, journal,
terminal record/receipt, installation identity, time, or randomness. A member
whose bytes transitively contain any forbidden object is equally forbidden.
Certificate DER is admitted only through member 10's already-complete kind-27
stream; it does not import a signature or future output. One-sided golden cases
cover every ordinal identifier/role/encoding/binding/equality and every
forbidden self/output/future edge.

Every `4c0b` certificate member has role 6, encoding 3, binding 1 and contains
one complete exact DER certificate. Its identifier is
`signing/certificate/` followed by the member ordinal encoded as exactly two
lowercase hexadecimal digits `00` through `0f`. Ordinals are contiguous,
leaf-to-root; no certificate may repeat. Each DER length is 1..1,048,576 bytes
and the checked aggregate is at most 16 MiB. The parser consumes every byte and
accepts only shortest-form DER; BER, indefinite/nonminimal length, constructed
primitive, duplicate field, noncanonical SET order, or trailing bytes fail.

SigningProfile profile 1 admits exactly one pinned X.509 profile. Every
Certificate has explicit version `[0] INTEGER 2` (X.509 v3), and both
issuerUniqueID and subjectUniqueID are absent. Every certificate SPKI is
`rsaEncryption` OID `1.2.840.113549.1.1.1` with explicit
NULL parameters, an exactly 3,072-bit positive modulus, and exponent 65,537.
Every inner and outer certificate signature AlgorithmIdentifier is
byte-identical `sha256WithRSAEncryption` OID `1.2.840.113549.1.1.11` with
explicit NULL, and the BIT STRING has zero unused bits and exactly 384
signature bytes. Interpreted as an unsigned big-endian integer the signature is
strictly less than its RSA modulus. Each non-root member at ordinal
`i < 4c0a - 1` verifies strict
RSASSA-PKCS1-v1_5 over SHA-256 of its exact DER `tbsCertificate` under member
`i + 1`'s key; the root verifies under its own key. Issuer and subject link by
byte-identical complete DER Name, never normalized text. The last member is
self-issued, self-signature-valid, and the sole trust anchor; ambient
keychains, alternate paths, AIA, OCSP, CRL fetches, and network access are
forbidden.

The certificate extension grammar is closed. Every member has exactly one
noncritical SubjectKeyIdentifier whose Extension extnValue OCTET STRING
contains exactly one inner primitive OCTET STRING, and one noncritical
AuthorityKeyIdentifier whose extnValue contains exactly one SEQUENCE member,
the `[0]` keyIdentifier; authorityCertIssuer and authorityCertSerialNumber are
absent. The keyIdentifier equals the next member's SubjectKeyIdentifier; the
root's AuthorityKeyIdentifier equals its own SubjectKeyIdentifier. Member 0 has
critical BasicConstraints whose extnValue is the exact empty SEQUENCE:
DEFAULT `cA=FALSE` is omitted and pathLenConstraint is absent. It has critical
KeyUsage with only `digitalSignature`, and critical ExtendedKeyUsage containing
only `id-kp-codeSigning` OID `1.3.6.1.5.5.7.3.3`. Each CA member at ordinal
`i >= 1` has critical BasicConstraints `CA=true` and
`pathLenConstraint == i - 1` (with explicit `cA=TRUE`), and critical KeyUsage with only
`keyCertSign|cRLSign`. No other extension, duplicate extension, name constraint,
certificate policy, policy mapping, or unknown critical/noncritical extension
is legal. Every serial is positive, nonzero, and minimally encoded. Every
validity value is canonical Zulu time with whole seconds and no fractional or
offset form. Years 1950..2049 use UTCTime with the X.509 1950/2050 pivot;
years 2050..9999 use four-digit GeneralizedTime; other encodings fail. Target
K2 `300e`, system-lock K2 `300e`, U2 `6022`, I2 `500b`, Q2 `400d`, W2 `7410`,
O2's incorporated predecessor issued-at field, Z2 `760b`, each request's exact
Section-15 admission `now`, and each BEGIN/terminal identity recheck time must
lie within every member's inclusive notBefore/notAfter interval.
CMS signingTime and timestamp evidence cannot replace current-time validity.
Member-0 subject contains exactly one OU attribute whose AttributeValue is
exactly a shortest-form DER UTF8String containing unescaped printable ASCII;
its exact UTF-8 value octets equal every output
`ExecutableCodeIdentity.640b` team identifier.

The signed Mach-O BlobWrapper payload is exactly one fully consumed
shortest-form DER ContentInfo, 1..33,554,432 bytes. `contentType` is
`id-signedData` OID `1.2.840.113549.1.7.2` and its `[0] EXPLICIT` content is
one SignedData version 1. `digestAlgorithms` is a DER SET containing exactly
one AlgorithmIdentifier `sha256` OID `2.16.840.1.101.3.4.2.1` with explicit
NULL. `encapContentInfo` has `eContentType=id-data` OID
`1.2.840.113549.1.7.1` and absent `eContent`: this is detached CMS.
`certificates` is present and contains exactly the `4c0b` certificate DER
values in DER SET order; `crls` is absent. `signerInfos` is a DER SET containing
exactly one SignerInfo version 1. Its issuerAndSerialNumber SID is byte-identical
to member 0's complete issuer Name and serial INTEGER; its digest algorithm is
the same exact SHA-256 AlgorithmIdentifier; its signature algorithm is
`rsaEncryption` with explicit NULL; and unsignedAttrs is absent.

The one SignerInfo signedAttrs field is present, at most 4,096 bytes, and
contains exactly two Attributes in DER SET order: `contentType` OID
`1.2.840.113549.1.9.3` with the sole SET value `id-data`, and `messageDigest`
OID `1.2.840.113549.1.9.4` with the sole 32-byte OCTET STRING value
`SHA256(exact selected CodeDirectory bytes)`. The stored `[0] IMPLICIT` value
octets are exactly the concatenation of those two sorted complete DER Attribute
TLVs, with no universal SET tag inside the context-specific value. The RSA
signature preimage is exactly `0x31 || DER_shortest_length(value_octet_count)
|| value_octets`, not the stored context-specific tag and not the CodeDirectory
directly. The signature OCTET
STRING is exactly 384 bytes, its unsigned integer is less than the leaf modulus,
and it verifies strict RSASSA-PKCS1-v1_5 with the
exact SHA-256 DigestInfo prefix hex
`3031300d060960864801650304020105000420` followed by
`SHA256(signature_preimage)`. The encoded message is exactly
`00 01 ||` 330 bytes of `ff || 00 || DigestInfo`; no shorter/longer padding,
alternate DigestInfo, or alternate AlgorithmIdentifier spelling is legal.

The CMS certificate set has no extra, missing, duplicate, or alternate
CertificateChoice and relinks byte-for-byte to `4c0b`; its complete kind-27
stream hashes to `4c03`. Both build outputs, held static-code validation,
dynamic-code validation, and every ExecutableCodeIdentity comparison repeat
all predicates above. The Mach-O Code Signing SuperBlob has exactly one
BlobWrapper/CMS slot and it is this fully consumed ContentInfo; an absent or
second CMS candidate is invalid. Any second signer, attribute, digest, certificate, CRL,
encapsulated content, trailing byte, proprietary signed attribute, or alternate
DER spelling is invalid. If the reviewed Apple toolchain emits an additional
attribute or cannot produce this exact deterministic profile, the build is
blocked and requires a new reviewed contract; an implementation may not
silently widen the profile.

The exact hash DAG is:

```text
predecessor + successor specification + source + plan + bundle + xattr policy
  -> unsigned lane targets + pre-sign policy projection
policy-root signature over projection + owner kind-2 HMG4L2
  -> durable workspace-only consumption claim
  -> exact lane-A/lane-B signatures -> production helper
production helper + pre-sign projection
  -> final production policy under the same policy root
production signed policy + successor specification + exact vector inputs
  -> profile-1 HMG4G2 vectors and external byte set
production signed policy + HMG4G2 vectors/external bytes
  -> HMG4E2 kind-6 vector review
helper/policy + distinct fixture authorization
  -> target and system-lock capability receipts
helper/policy + both capability receipts + HMG4G2/vector review
  -> reproducible-build receipt
  -> signed single-use protected-install authorization
  -> protected installation and install receipt
  -> quiescence/access-revocation receipt
  -> single-use apply authorization or recovery operator authorization
  -> request
  -> BEGIN/RECOVERY_BEGIN -> journal -> terminal receipt -> terminal record
```

The root-signed pre-sign projection embeds every output-independent policy TLV,
source/toolchain/target/controller/owner identity, and held Gate-A report but no
final helper or final-policy signature. HMG4L2 binds that projection, never a
future final-policy hash. The later final policy embeds the final helper, plan,
bundle, Entry, xattr-policy, location, and trust rules and reproduces the exact
pre-sign projection. It does not embed its own hash or future receipt/
authorization hashes. Capability receipts bind helper/policy/fixture identities but not the
later build receipt. The build receipt binds both capability receipts. The
install receipt binds the build receipt. Later evidence binds helper, policy,
build, and install hashes. Request, begin, and receipt bind each observed future
object hash. No object contains its own complete hash and no pair contains one
another's final hash.

## 4. Shared successor STRUCT schemas

For successor objects, predecessor `RootIdentity` gains exactly
`0x020a authority_root_slot U32` and
`0x020b parent_child_edge_set_sha256 SHA256, derived kind 35`, plus:

```text
0x020c component_sequence_sha256  SHA256, derived kind 13
0x020d component_sequence         STRUCT ComponentSequence
0x020e parent_child_edge_count    U32, equal component count
0x020f parent_child_edges         LIST ParentChildEdge, exact count
```

Slots are 1 protected installation, 2 approved project, 3 disposable target-
volume fixture, and 4 disposable system-lock fixture. Slots 3/4 are valid only
in policy fields `103d..1040`, HMG4F2, and their embedding HMG4K2; they can
never appear in a production request, policy Entry, production ProtectedParent,
evidence path, custody path, journal, install/build/quiescence receipt, or
authorization.
`020c` is recomputed over `020d`; `020b` is recomputed over `020f`; and the
absolute `0209` path is exactly `/` followed by the slash-joined `020d`
components. Slot 1 is the protected installation root, slot 2 is the approved
project root, slot 3 is the target-volume disposable fixture anchor, and slot 4
is the system-lock disposable fixture anchor. This
expressly replaces the predecessor's one-root interpretation of
`APPROVED_ABS_ROOT_PATH`: each value must byte-equal its slot's compiled exact
absolute component sequence. All four roots, paths, device/inode pairs, and edge
sets are pairwise distinct. A request field cannot select or exchange slots.
Every component sequence from which this contract derives an immediate parent
by removing a final component/edge has count 2..64 before removal. The resulting
parent therefore has count 1..63 and remains a valid `ComponentSequence`; `/`
has no zero-component surrogate. A one-component source sequence is invalid in
every such context rather than producing an unencodable parent.

`DirectoryIdentity` contains exactly:

```text
0x2201 authority_root_slot        U32: 1 installation, 2 project,
                                       3 target fixture, 4 lock fixture
0x2202 component_sequence_sha256  SHA256
0x2203 device                     U64
0x2204 inode                      U64
0x2205 owner_uid                  U32
0x2206 group_gid                  U32
0x2207 mode_bits                  U32
0x2208 flags                      U32
0x2209 acl_sha256                 SHA256
0x220a xattr_set_sha256           SHA256
0x220b filesystem_id              BYTES, exactly 16
0x220c mount_configuration_sha256 SHA256
0x220d object_type                U32, exactly 2 directory
0x220e parent_child_edge_set_sha256 SHA256, derived kind 35
0x220f component_sequence         STRUCT ComponentSequence
0x2210 parent_child_edge_count    U32, equal component count
0x2211 parent_child_edges         LIST ParentChildEdge, exact count
```

`2202` is recomputed over `220f`; `220e` is recomputed over `2211`. Every
`ParentChildEdge` member is byte-identical to the edge observed while walking
that same sequence; neither a pathname string nor an omitted local list can be
used as a hash preimage.

`ProtectedFileIdentity` contains exactly:

```text
0x6201 device                     U64
0x6202 inode                      U64
0x6203 size                       U64
0x6204 content_sha256             SHA256
0x6205 link_count                 U32, exactly 1
0x6206 mode_bits                  U32
0x6207 owner_uid                  U32
0x6208 group_gid                  U32
0x6209 flags                      U32
0x620a acl_sha256                 SHA256
0x620b xattr_set_sha256           SHA256
0x620c object_type                U32, exactly 1 ordinary
```

`ExecutableCodeIdentity` contains exactly:

```text
0x6401 complete_file_sha256       SHA256
0x6402 macho_cpu_type             U32, exactly 0x0100000c CPU_TYPE_ARM64
0x6403 macho_cpu_subtype          U32, exactly 0x00000000 CPU_SUBTYPE_ARM64_ALL
0x6404 macho_file_type            U32, exactly 0x00000002 MH_EXECUTE
0x6405 lc_uuid                    BYTES, exactly 16
0x6406 code_directory_hash_kind   U32, exactly 1 SHA-256
0x6407 code_directory_sha256      SHA256
0x6408 kernel_cdhash              BYTES, exactly 20
0x6409 code_directory_flags       U32, exactly 0x00013b00
0x640a signing_identifier         BYTES, 1..255 ASCII
0x640b team_identifier            BYTES, 1..64 ASCII
0x640c designated_requirement_sha256 SHA256
0x640d entitlements_sha256        SHA256, exact admitted SDK canonical-empty
                                      entitlement-blob hash
0x640e hardened_runtime           BOOL, exactly true
0x640f designated_requirement_external BYTES, 1..65,536 exact bytes returned by
                                      `SecRequirementCopyData`
0x6410 embedded_entitlements_blob BYTES, exact admitted SDK
                                      `EMPTY_ENTITLEMENTS_BLOB`
0x6411 library_validation_required BOOL, exactly true
0x6412 debug_entitlements_absent   BOOL, exactly true and derived from the
                                      successfully parsed empty dictionary
```

`640c` is SHA-256 of `640f`; `640d` is SHA-256 of `6410`. In every admitted
context there is exactly one selected SDKIdentity. `6410` is byte-identical to
that SDKIdentity's `4f2f.7d48` and `640d == 4f2e`; a hash-only equality is not
sufficient. `6410` is parsed as exactly `BE32(0xfade7171)`, then a BE32 total
length equal to the complete field length, then the exact two-line
`EMPTY_ENTITLEMENTS_PAYLOAD` defined below. The payload is strict UTF-8 with no
BOM and parses, with DTD/external-entity/network resolution disabled, as one
`plist` element whose sole child is one empty `dict`. Exact-byte admission is
stricter than semantic plist equivalence: there is no alternate whitespace,
attribute spelling/order, entity/escape, empty-element spelling, line ending,
or second value. `6412` is true only after that exact parse and byte comparison;
it is not a producer assertion.

The allowed entitlement key set is therefore the closed empty set and the
allowed value/type set is also empty. Gate B independently inserts one key with
each plist value family (boolean, integer, real, string, data, date, array, and
dictionary), inserts a debug key, inserts an unknown key, repeats one key,
changes key case, substitutes a semantically empty but byte-different plist,
changes XML declaration/attribute/whitespace/escaping/empty-element spelling,
adds BOM/CR/DOCTYPE/external entity/trailing value, and mutates blob magic,
declared length, payload length, `640d`, or selected SDK `4f2e/4f2f`. Missing,
zero-length, DER, superblob, malformed, noncanonical, nonempty, duplicate-key,
or SDK-A/code-B entitlement evidence is rejected before any journal or response
authority. No entitlement name can be added by labeling it harmless.

The held-file
CodeDirectory, held embedded-entitlements blob, and `SecStaticCode` signing
information obtained from the protected installation URL must agree
field-by-field with this STRUCT. A dynamic SecCodeRef must agree only on these
shared static fields; its process status is separate.
Static-code lookup is bracketed by `fstat` of the retained helper FD and a
no-follow rewalk proving the same device/inode. Static fields returned for a
dynamic SecCodeRef must agree with this identity, but process-specific status
is carried only by DynamicCodeStatusObservation and is never folded into an
executable catalog identity. `6409` is static on-disk state,
never a dynamic process status word. It is byte-identical to the big-endian
CodeDirectory header flags and to public Security.framework
`kSecCodeInfoFlags` from the held `SecStaticCode`. Under the exact target SDK,
the six public `SecCodeSignatureFlags` values ForceHard, ForceKill, Restrict,
Enforcement, LibraryValidation, and Runtime OR to exactly `0x00013b00`; all
other static bits, including Host, Adhoc, ForceExpiration, and LinkerSigned,
are absent. Dynamic Valid/Debugged/Platform state is not
representable in this field. An unknown bit, absent required bit, missing team
identifier, different designated-requirement external representation, or
different/canonically nonempty entitlement blob blocks before journal creation.

`WriterIdentity` contains exactly:

```text
0x2401 profile                    U32, exactly 1 dedicated-nonlogin-service-UID
0x2402 real_uid                   U32
0x2403 effective_uid              U32, equal real_uid
0x2404 saved_uid                  U32, equal real_uid
0x2405 real_gid                   U32
0x2406 effective_gid              U32, equal real_gid
0x2407 saved_gid                  U32, equal real_gid
0x2408 supplementary_group_count U32, policy-fixed
  0x2409 supplementary_groups      LIST U32Member, exact count, strictly
                                         increasing unsigned; duplicate forbidden
0x240a launcher_configuration_sha256 SHA256
0x240b launcher_code_identity     STRUCT ExecutableCodeIdentity
0x240c nonlogin_account           BOOL, exactly true
```

`ProtectedParent` contains exactly:

```text
0x2301 ordinal                    U32, contiguous from zero
0x2302 parent_role                U32, policy registry value
0x2303 component_sequence         STRUCT ComponentSequence
0x2304 identity                   STRUCT DirectoryIdentity
0x2305 namespace_rule_set_sha256  SHA256, derived kind 14
0x2306 authorized_writer_set_sha256 SHA256, derived kind 52
0x2307 untrusted_write_denied     BOOL, exactly true
0x2308 untrusted_metadata_denied  BOOL, exactly true
0x2309 authorized_writer_count    U32, 0..32
0x230a authorized_writers         LIST WriterAuthorityRule, exact count
0x230b namespace_rule_count       U32, 1..1,024
0x230c namespace_rules            LIST NamespaceRuleMember, exact count
0x230d parent_subrole             U32, closed registry below
```

`2305` is recomputed over `230c` and `2306` over `230a`; both counts match.
`2303` is byte-identical to `2304.220f`; its kind-13 hash equals `2202`, and
the parent's complete edge list/hash are `2304.2211/220e`.

`ProtectedParent.parent_role` is exactly 1 installation/launcher parent,
2 protected evidence parent, 3 custody parent, or 4 managed-live/formal-output
parent. Subroles are exact: role 1 has subrole 1 install-and-lock and subrole 2
launcher-configuration, each once; role 2 has subrole 1 evidence root, 2
`plans`, 3 `bundles`, 4 `receipts`, 5 `authorizations`, and 6 `xattr`, each
once; role 3 has subrole 1 once; and role 4 has subrole 1 and may repeat for
distinct component sequences. The permanent lock is an ordinary metadata-role-
15 object inside role-1/subrole-1 beside helper and policy; there is no aliasing
lock parent. No other role/subrole pair is valid.

Namespace-class mask bits are bit 0 exact leaf, 1 evidence template, 2 custody
grammar, and 3 POLICY_REL_PATH; higher bits are zero. Parent role 1/subrole 1
has one phase-2 installer-writer rule (actor bit 12), actions read/exclusive-
create/write-new-held-file/FD-metadata/file-sync/parent-sync, classes exact-leaf,
and `must_be_revoked_before_quiescence=true`. Role 1/subrole 2 has zero writer
rules: the launcher configuration is a pre-existing protected prerequisite and
is never created or modified by HMG4Z2 installation authority. Parent role 2
subrole 1 has zero authorized writers after provisioning and admits only its
five exact directory leaves. Parent role-2 subroles 2..6 have phase-1 evidence-
ingest rules (actor bit 11), actions read/exclusive-create/write-new-held-file/
file-sync/parent-sync, class evidence-template, and revocation false; they have
no overwrite, append, rename, delete, hardlink, or later-metadata authority. A
broker may store a correctly signed post-Q authorization, but cannot change a
held existing object; any new unowned leaf blocks admission. Parent role 3 has
one phase-3 runtime-helper rule (bit
10), actions bits 0..7, class custody. Each parent role 4 has that same helper
with read/no-replace-rename/parent-sync, class POLICY_REL_PATH. Role-3 and
role-4 bit-10 rules have `must_be_revoked_before_quiescence=false`; Q trust
class 1 retains this actor so it can execute the already-authorized transaction
and never counts it in `4029`. Policy `1014` is that runtime-helper service's
credential/launcher WriterIdentity: its `240b` is the pre-existing launcher,
not the future helper code. Final resolution to the bit-10 actor additionally
requires that actor's filled `6f05/6f0b == 102e/103b`; every writer-rule hash
that depends on that final actor is therefore a prospective-transform hole.
All writer rules marked revoke
must be absent from the Q process/FD/map inventories; Q records
`revocation_required_writer_count`, `revocation_proven_writer_count`, and
`still_authorized_required_revocation_count=0` as defined below. UID equality by
itself grants no writer authority.

For the five role-2/subrole-1 directory rules, `NamespaceRuleMember.7b06` is
directory and `7b07` is kind 15 over the exact child ProtectedParent reached by
that leaf. For every ordinary-file template/rule, `7b07` is kind 15 over its
exact authority source as follows. Classes 1 and 2 cite a RoleMetadataPolicy;
class 4 cites its exact Entry. Class 3 is expanded into one nonoverlapping rule
per custody variant and, when indexed, per managed index. Request uses source 1,
role 16; journal and receipt use source 1, role 17; stage and rollback use source
3 and the exact Entry whose index is `7b0a`; archive and preimage use source 2
and that index's held predecessor FinalEntry. `7b07` is kind 15 over that exact
RoleMetadataPolicy, Entry, or FinalEntry. A source-2 rule requires predecessor
state present and the moved/copied inode to equal the held FinalEntry field-for-
field; a source-3 rule requires the Entry's complete HMG4Y2 to be held, parsed,
and equal its xattr binding. `maximum_matching_count` is exactly 4,096 for every
class-3 rule, conjunctive with policy `101d`'s 4,096-leaf total bound. The semantic key
`(parent ordinal, class, custody variant, managed index)` is unique; no two
rules may accept one leaf. These are the only interpretations: a directory rule
can never cite ordinary-file metadata, and a dynamic file rule can never cite
only a parent identity. The same source mapping is byte-identical to the
corresponding ArtifactPlanMember, BirthProtectionRule, intent, resolver, and
terminal-receipt ownership records; no free-standing custody metadata policy
exists. Each concrete matching leaf is additionally unique by its exact parsed
`(variant, TXID, optional index, digest)` and must be owned once by the validated
root/child custody graph. Multiple retained transactions therefore remain
representable without turning the grammar into unbounded authority; an unowned,
multiply owned, or graph-inconsistent leaf blocks admission and is never deleted.
For completeness, `7b08` is exactly one for every class-1 fixed leaf/directory
rule and every per-index class-4 POLICY_REL_PATH rule; it is exactly 65,536 for
each class-2 evidence template, conjunctive with the receipt's 65,536-record
protected-namespace total. Schema-valid signed nonpassing evidence counts toward
that total. No other `7b08` value is canonical.

Bit 11 grants storage-only exclusive creation; it never grants issuer or
operator authority. Each stored object's EvidenceTrustRule, actor role bit,
signature/result, hash-derived leaf, and exact metadata are independently
validated.

`PathComponent.bytes` uses only `%x20-2E / %x30-5B / %x5D-7E`; slash,
backslash, NUL, control bytes, non-ASCII, empty, `.` and `..` are forbidden.
`ComponentSequence.6c04` is recomputed as derived kind 13 over `6c03`.
`DirectoryIdentity.2202` equals that same value. Each derived kind-35 value is
one linear chain from held `/` through every intermediate component of that
one DirectoryIdentity. ProtectedParent, EvidenceLocation, and launcher
configuration fields together contain separate DirectoryIdentity chains for
the `plans`, `bundles`, `receipts`, `authorizations`, `xattr`, custody,
installation/lock, and formal-output parents; an omitted chain/edge or changed
parent device/inode blocks admission. `2305` is not an observed self-referential
directory listing: it is derived kind 14 over the exact allowed namespace
classes. At runtime every enumerated leaf must match exactly one rule and every
required fixed rule must be present; the only admitted dynamic leaves are those
owned by the validated evidence DAG or custody/recovery graph.

These nested schemas are exact and may not be replaced by JSON, free-form
text, SDK structs, or implementation-local serialization:

```text
U32Member
  0x6601 value                       U32

PathComponent
  0x6b01 ordinal                     U32, contiguous from zero
  0x6b02 bytes                       BYTES, 1..255 exact ASCII

ComponentSequence
  0x6c01 authority_root_slot         U32, 1 installation, 2 project,
                                         3 target fixture, 4 lock fixture
  0x6c02 component_count             U32, 1..64
  0x6c03 components                  LIST PathComponent, exact count
  0x6c04 component_sequence_sha256   SHA256, derived kind 13

ParentChildEdge
  0x6d01 ordinal                     U32, contiguous from zero
  0x6d02 parent_device               U64
  0x6d03 parent_inode                U64
  0x6d04 component_bytes             BYTES, 1..255 exact ASCII
  0x6d05 child_device                U64
  0x6d06 child_inode                 U64
  0x6d07 child_object_type           U32, exactly 2 directory except final file edge

ArtifactExpectation
  0x6a01 byte_length                 U64
  0x6a02 content_sha256              SHA256
  0x6a03 link_count                  U32, exactly 1
  0x6a04 mode_bits                   U32
  0x6a05 owner_uid                   U32
  0x6a06 group_gid                   U32
  0x6a07 flags                       U32
  0x6a08 acl_sha256                  SHA256
  0x6a09 xattr_set_sha256            SHA256
  0x6a0a xattr_policy_sha256         SHA256, required request/stage;
                                         forbidden archive
  0x6a0b object_type                 U32, exactly 1 ordinary
  0x6a0c protected_parent_ordinal    U32
  0x6a0d exclusive_no_replace        BOOL, exactly true

QuiescenceSubjectRequirement
  0x6e01 ordinal                     U32, contiguous from zero
  0x6e02 subject_role                U32, exact Section 8.4 role 1..10
  0x6e03 managed_index               U32, 0..113 or 0xffffffff
  0x6e04 protected_parent_ordinal    U32 or 0xffffffff
  0x6e05 authority_binding_sha256    SHA256, derived kind 15
  0x6e06 protection_requirement_sha256 SHA256, derived kind 15
  0x6e07 required_admission_mode     U32, exactly 1 protected-from-birth
  0x6e08 evidence_role               U32, 3, 4, 7, 8, 9, 11, or 12;
                                         required subject role 9, forbidden otherwise
  0x6e09 header_discriminator        U32, exact selected EvidenceLocation set;
                                         required subject role 9, forbidden otherwise
  0x6e0a occurrence_ordinal          U32, contiguous within evidence role/kind;
                                         required subject role 9, forbidden otherwise
  0x6e0b evidence_object_binding     U32: 1 policy-fixed object hash,
                                         2 request/evidence-DAG resolved;
                                         required subject role 9, forbidden otherwise
  0x6e0c fixed_evidence_object_sha256 SHA256, required binding 1,
                                         forbidden binding 2 and non-role-9
  0x6e0d evidence_location_sha256    SHA256, derived kind 15 identity kind 12;
                                         required subject role 9, forbidden otherwise

ActorIdentity
  0x6f01 identity_kind               U32: 1 code process, 2 approval key,
                                         3 build/review tool
  0x6f02 stable_identifier           BYTES, 1..255 exact ASCII
  0x6f03 uid                         U32, required kinds 1 and 3; forbidden kind 2
  0x6f04 gid                         U32, required kinds 1 and 3; forbidden kind 2
  0x6f05 executable_code_identity_sha256 SHA256, required kinds 1 and 3;
                                         forbidden kind 2
  0x6f06 public_key_spki_sha256      SHA256, required kind 2;
                                         forbidden kinds 1 and 3
  0x6f07 authorized_role_mask        U64, no unknown bit
  0x6f08 public_key_spki_der         BYTES, 1..1,024, required kind 2;
                                         forbidden kinds 1 and 3
  0x6f09 supplementary_group_count  U32, 0..128, required kinds 1 and 3;
                                         forbidden kind 2
  0x6f0a supplementary_groups       LIST U32Member, exact count, strictly
                                         increasing unsigned, duplicate-free;
                                         required kinds 1 and 3, forbidden kind 2
  0x6f0b executable_code_identity   STRUCT ExecutableCodeIdentity,
                                         required kinds 1 and 3; forbidden kind 2
  0x6f0c process_credential          STRUCT ProcessCredentialIdentity,
                                         required kinds 1 and 3; forbidden kind 2
  0x6f0d dedicated_nonlogin_account BOOL, exactly true for kind 1;
                                         forbidden kinds 2 and 3
  0x6f0e credential_exclusive       BOOL, exactly true for kind 1;
                                         forbidden kinds 2 and 3

ProcessCredentialIdentity
  0x7851 real_uid                    U32
  0x7852 effective_uid               U32
  0x7853 saved_uid                   U32
  0x7854 real_gid                    U32
  0x7855 effective_gid               U32
  0x7856 saved_gid                   U32
  0x7857 supplementary_group_count  U32, 0..128
  0x7858 supplementary_groups       LIST U32Member, exact count, strictly
                                         increasing unsigned; duplicate forbidden

DenialCredential
  0x7861 credential                  STRUCT ProcessCredentialIdentity
  0x7862 policy_actor_match_count    U32, exactly zero
  0x7863 authorized_writer_rule_match_count U32, exactly zero
  0x7864 role_mask                   U64, exactly zero
  0x7865 differential_evidence_sha256 SHA256, complete HMG4E2 kind 3
  0x7866 selected_fixture_observation_sha256 SHA256, SHA-256 of exact `7867`
  0x7867 selected_fixture_observation STRUCT AccessDenialFixtureObservation,
                                         unique role-14 member of `7865`
  0x7868 selected_attempt_set_sha256 SHA256, equal `7867.7f36`, derived kind 79
  0x7869 observed_bypass_mask        U32, bits 0 superuser, 1 entitlement;
                                         higher bits zero, authority DENY requires zero
  0x786a selected_subject_role       U32, equal `7867.7f22`
  0x786b selected_operation_code     U32, equal `7867.7f23`
  0x786c selected_operation_scenario U32, equal `7867.7f24`
  0x786d empty_entitlements_blob_sha256 SHA256, equal selected SDKIdentity `4f2e`

AccessControlEvaluation
  0x7871 protection_subject_ordinal  U32
  0x7872 subject_identity_sha256     SHA256, derived kind 15
  0x7873 canonical_acl_sha256        SHA256, exact held predecessor ACL stream
  0x7874 mode_bits                   U32
  0x7875 flags                       U32
  0x7876 authorized_writer_set_sha256 SHA256, derived kind 52
  0x7877 unauthorized_allow_ace_count U32, exactly zero
  0x7878 unauthorized_mode_grant_count U32, exactly zero
  0x7879 unknown_or_inherited_rule_count U32, exactly zero
  0x787a result                      U32, exactly 1
  0x787b denial_credential_sha256    SHA256, derived kind 60
  0x787c denial_credential           STRUCT DenialCredential
  0x787d operation_code              U32, exact Section 8.4 registry 1..11
  0x787e rights_profile_version      U32, exactly 1
  0x787f target_set_sha256           SHA256, derived kind 66
  0x7880 target_count                U32, 1..4
  0x7881 targets                     LIST AuthorizationTargetEvaluation, exact count
  0x7882 principal_resolution_set_sha256 SHA256, derived kind 67
  0x7883 principal_resolution_count  U32, 1..8,192
  0x7884 principal_resolutions        LIST PrincipalResolutionMember, exact count
  0x7885 writer_principal_closure_sha256 SHA256, derived kind 68
  0x7886 writer_principal_count       U32, 0..8,192
  0x7887 writer_principals            LIST WriterPrincipalClosureMember, exact count
  0x7888 evaluator_a_source_manifest_sha256 SHA256, derived kind 21
  0x7889 evaluator_a_executable_sha256 SHA256
  0x788a evaluator_b_source_manifest_sha256 SHA256, derived kind 21
  0x788b evaluator_b_executable_sha256 SHA256, different implementation
  0x788c decision_trace_sha256        SHA256, derived kind 69
  0x788d decision_trace_count         U32, 1..8,192
  0x788e decision_trace               LIST AccessDecisionTraceMember, exact count
  0x788f evaluator_a_result           U32, exactly 1 DENY
  0x7890 evaluator_b_result           U32, exactly 1 DENY
  0x7891 byte_identical_trace         BOOL, exactly true
  0x7892 mount_configuration_sha256   SHA256, exact held target
  0x7893 os_build_identity_sha256     SHA256, derived kind 15 identity kind 16
  0x7894 accessx_observed_errno       U32: 13 EACCES, 1 EPERM, or
                                         0xffffffff unsupported/not applicable
  0x7895 accessx_right_mask           U64, exact corroborated subset; may be zero
  0x7896 accessx_result               U32: 1 corroborating deny, 2 unavailable
  0x7897 differential_evidence_sha256 SHA256, exact HMG4E2 kind 3
  0x7898 production_mutation_syscall_attempted BOOL, exactly false
  0x7899 sdk_build_identity_sha256    SHA256, derived kind 15 identity kind 17
  0x789a operation_scenario           U32: 0 non-rename, 1 rename-in, 2 rename-out

AuthorizationTargetEvaluation
  0x78c1 ordinal                     U32, contiguous from zero
  0x78c2 target_role                 U32: 1 subject, 2 source parent,
                                         3 destination parent
  0x78c3 identity_sha256             SHA256, derived kind 15
  0x78c4 identity                    STRUCT CanonicalIdentityMember
  0x78c5 requested_right_mask        U64, exact rights-profile bits
  0x78c6 owner_uid                   U32
  0x78c7 group_gid                   U32
  0x78c8 owner_guid                  BYTES, exactly 16
  0x78c9 group_guid                  BYTES, exactly 16
  0x78ca object_type                 U32: 1 ordinary, 2 directory, 3 symlink,
                                         4 other
  0x78cb mode_bits                   U32
  0x78cc flags                       U32
  0x78cd mount_configuration_sha256 SHA256
  0x78ce canonical_acl_sha256        SHA256
  0x78cf canonical_acl_stream_length U64, 16..1,048,576
  0x78d0 canonical_acl_stream        BYTES, exact `78cf` bytes, 16..1,048,576;
                                         explicit field override of BYTES default,
                                         exact predecessor HMG4A2 stream
  0x78d1 model_result                U32, exactly 1 DENY

PrincipalResolutionMember
  0x78e1 ordinal                     U32, contiguous from zero
  0x78e2 principal_kind              U32: 1 user GUID, 2 group GUID, 3 everyone,
                                         4 owner, 5 owning group
  0x78e3 principal_guid              BYTES, exactly 16
  0x78e4 numeric_id                  U32, UID/GID or 0xffffffff when inapplicable
  0x78e5 is_member                   BOOL
  0x78e6 resolution_source           U32: 1 reviewed membership snapshot,
                                         2 exact owner/group identity, 3 everyone
  0x78e7 resolution_known            BOOL, exactly true

WriterPrincipalClosureMember
  0x78f1 ordinal                     U32, contiguous from zero
  0x78f2 principal_kind              U32: 1 UID, 2 GID, 3 named GUID, 4 everyone
  0x78f3 principal_guid              BYTES, exactly 16
  0x78f4 numeric_id                  U32 or 0xffffffff
  0x78f5 granted_right_mask          U64, nonzero rights-profile bits
  0x78f6 grant_source_mask           U32: bit 0 owner mode, 1 group mode,
                                         2 other mode, 3 ACL, 4 superuser,
                                         5 entitlement; higher bits zero
  0x78f7 matched_actor_count         U32, exactly 1 disposition 1, zero disposition 2
  0x78f8 actor_identity_sha256       SHA256, derived kind 34; required
                                         disposition 1, forbidden disposition 2
  0x78f9 writer_rule_sha256          SHA256, exact WriterAuthorityRule; required
                                         disposition 1, forbidden disposition 2
  0x78fa actor_credential            STRUCT ProcessCredentialIdentity; required
                                         disposition 1, forbidden disposition 2
  0x78fb principal_disposition       U32: 1 protected policy writer,
                                         2 excluded UID0/platform TCB
  0x78fc platform_tcb_profile        U32, exactly policy `1044` disposition 2,
                                         forbidden disposition 1

AccessDecisionTraceMember
  0x7941 ordinal                     U32, contiguous from zero
  0x7942 phase                       U32: 1 immutable/flags, 2 superuser/bypass,
                                         3 ordered ACL, 4 POSIX mode,
                                         5 composite-operation result
  0x7943 target_ordinal              U32, index into `7881`
  0x7944 principal_resolution_ordinal U32 or 0xffffffff
  0x7945 exact_input_sha256          SHA256, complete canonical phase input
  0x7946 decision                    U32: 1 deny, 2 continue
  0x7947 rights_before               U64
  0x7948 rights_after                U64
  0x7949 exact_input_length          U64, 1..4,096
  0x794a exact_input_bytes           BYTES, exact `7949`, 1..4,096;
                                         `7945` is its SHA-256

AccessDecisionPhaseInput
  0x79c1 input_version               U32, exactly 1
  0x79c2 phase                       U32, equal enclosing `7942`
  0x79c3 operation_code              U32, equal enclosing evaluation `787d`
  0x79c4 target_ordinal              U32, equal enclosing `7943`
  0x79c5 requested_right_mask        U64, nonzero and exactly equal target `78c5`
  0x79c6 denial_credential_sha256    SHA256, equal evaluation `787b`
  0x79c7 target_evaluation_sha256    SHA256, SHA-256 of exact canonical nested
                                         AuthorizationTargetEvaluation bytes
  0x79c8 principal_resolution_set_sha256 SHA256, equal evaluation `7882`
  0x79c9 writer_principal_closure_sha256 SHA256, equal evaluation `7885`
  0x79ca mount_configuration_sha256  SHA256, equal target `78cd` and `7892`
  0x79cb os_build_identity_sha256    SHA256, equal evaluation `7893`
  0x79cc rights_before               U64, equal enclosing `7947`
  0x79cd target_flags                U32, required phase 1, equal target `78cc`;
                                         forbidden phases 2..5
  0x79ce immutable_right_mask        U64, exactly zero in rights-profile v1;
                                         required phase 1, forbidden phases 2..5
  0x79cf observed_bypass_mask        U32, bits 0 superuser and 1 entitlement;
                                         authority DENY requires zero; required phase 2,
                                         forbidden phases 1/3/4/5
  0x79d0 acl_entry_ordinal           U32, required phase 3, 0..1,023;
                                         forbidden phases 1/2/4/5
  0x79d1 acl_entry_sha256            SHA256, required phase 3;
                                         forbidden phases 1/2/4/5
  0x79d2 acl_entry_length            U64, exactly 40, required phase 3;
                                         forbidden phases 1/2/4/5
  0x79d3 acl_entry_bytes             BYTES, exactly 40; required phase 3,
                                         forbidden phases 1/2/4/5
  0x79d4 acl_principal_resolution_ordinal U32, index into `7884`, required
                                         phase 3; forbidden phases 1/2/4/5
  0x79d5 mode_class                  U32: 1 owner, 2 owning group, 3 other;
                                         required phase 4, forbidden phases 1/2/3/5
  0x79d6 mode_bits                   U32, required phase 4, equal target `78cb`;
                                         forbidden phases 1/2/3/5
  0x79d7 mode_principal_resolution_ordinal U32, index into `7884`, required
                                         phase 4; forbidden phases 1/2/3/5
  0x79d8 requested_right_bit         U32, 0..15, required phase 5;
                                         forbidden phases 1..4
  0x79d9 mode_granted_right_mask     U64, exact rights-profile-v1 subset;
                                         required phase 4, forbidden phases 1/2/3/5
  0x79da sdk_build_identity_sha256   SHA256, equal evaluation `7899`, common all phases
  0x79db operation_scenario          U32, equal evaluation `789a`, common all phases

FixtureExecutorObservation
  0x7971 execution_identity_sha256  SHA256, derived kind 97
  0x7972 execution_identity         STRUCT PublicProcessExecutionIdentity
  0x7973 credential                  STRUCT ProcessCredentialIdentity
  0x7974 held_fixture_file_identity  STRUCT ProtectedFileIdentity
  0x7975 static_fixture_code_identity STRUCT ExecutableCodeIdentity
  0x7976 runtime_validated_fixture_code_identity STRUCT ExecutableCodeIdentity
  0x7977 actor_identity_sha256       SHA256, derived kind 34
  0x7978 fixture_policy_sha256       SHA256, complete HMG4F2
  0x7979 continuity_start_unix_seconds U64
  0x797a continuity_end_unix_seconds U64
  0x797b result                      U32, exactly 1
  0x797c dynamic_code_status        STRUCT DynamicCodeStatusObservation,
                                         actor profile 1
  0x797f fixture_session_nonce      BYTES, exactly 32, nonzero

InstallerProcessObservation
  0x7981 execution_identity_sha256  SHA256, derived kind 97
  0x7982 execution_identity         STRUCT PublicProcessExecutionIdentity
  0x7983 parent_execution_identity_sha256 SHA256, derived kind 97
  0x7984 parent_execution_identity  STRUCT PublicProcessExecutionIdentity
  0x7985 actor_identity_sha256       SHA256, derived kind 34
  0x7986 credential                  STRUCT ProcessCredentialIdentity
  0x7987 held_installer_file_identity STRUCT ProtectedFileIdentity
  0x7988 observed_executable_identity_sha256 SHA256, derived kind 15 identity kind 11
  0x7989 observed_executable_identity STRUCT CanonicalIdentityMember,
                                         identity kind exactly 11
  0x798a held_static_code_identity   STRUCT ExecutableCodeIdentity
  0x798b runtime_validated_process_code_identity STRUCT ExecutableCodeIdentity
  0x798c continuity_start_unix_seconds U64
  0x798d continuity_end_unix_seconds U64
  0x798e install_authorization_sha256 SHA256, complete HMG4Z2
  0x798f result                      U32, exactly 1
  0x7990 dynamic_code_status        STRUCT DynamicCodeStatusObservation,
                                         actor profile 1

WriterAuthorityRule
  0x4d11 ordinal                     U32, contiguous from zero
  0x4d12 actor_identity_sha256       SHA256, derived kind 34
  0x4d13 required_actor_role_bit     U32: 0..13 phases 1..3;
                                         exactly 19 profile-1 phase 4,
                                         exactly 11 profile-3 phase 4
  0x4d14 phase                       U32: 1 evidence issuance, 2 installation,
                                         3 runtime transaction, 4 birth provisioning
  0x4d15 allowed_action_mask         U32: bit 0 read, 1 exclusive-create,
                                         2 write-new-held-exclusive-file,
                                         3 append-held-journal,
                                         4 no-replace-rename,
                                         5 FD-only metadata,
                                         6 file fsync/F_FULLFSYNC,
                                         7 parent-directory sync
  0x4d16 admitted_namespace_class_mask U32, NamespaceRule leaf-class bits
  0x4d17 must_be_revoked_before_quiescence BOOL

LauncherConfigurationIdentity
  0x4b01 component_sequence           STRUCT ComponentSequence
  0x4b02 protected_file_identity      STRUCT ProtectedFileIdentity
  0x4b03 exact_configuration_byte_length U64, 1..262,144
  0x4b04 exact_configuration_sha256   SHA256
  0x4b05 service_label                BYTES, 1..255 exact ASCII
  0x4b06 program_argument_sequence_sha256 SHA256, derived kind 23
  0x4b07 environment_set_sha256       SHA256, derived kind 24, exact empty
  0x4b08 launcher_executable_identity_sha256 SHA256, derived kind 15
  0x4b09 transport_profile            U32, exactly 1 Section 2 anonymous pipes
  0x4b0a result                       U32, exactly 1
  0x4b0b parent_child_edge_set_sha256 SHA256, derived kind 35 for `4b01`
  0x4b0c launcher_actor               STRUCT ActorIdentity, kind 1 with bit 8
  0x4b0d launcher_actor_sha256        SHA256, derived kind 34
  0x4b0e parent_child_edge_count      U32, equal component count
  0x4b0f parent_child_edges           LIST ParentChildEdge, exact count
  0x4b10 protected_parent_ordinal      U32, role 1/subrole 2
  0x4b11 program_argument_count        U32, exactly 1
  0x4b12 program_arguments             LIST DiagnosticByteString, exactly one;
                                           `6611=0`, `6612==4b1b`, no NUL
  0x4b13 inherited_child_fd_count      U32, exactly 3
  0x4b14 retained_parent_peer_count    U32, exactly 3
  0x4b15 child_endpoint_duplicates_closed_before_exec BOOL, exactly true
  0x4b16 parent_peer_status_flags_immutable BOOL, exactly true
  0x4b17 child_endpoint_profile        U32, exactly 1: read,write,write
  0x4b18 parent_peer_profile           U32, exactly 1: write,read,read
  0x4b19 program_component_sequence_sha256 SHA256, derived kind 13
  0x4b1a program_component_sequence    STRUCT ComponentSequence, authority slot 1
  0x4b1b program_absolute_path         BYTES, 2..1,023 exact ASCII
  0x4b1c configuration_frame_profile   U32, exactly 1 HMG4LC2 below
  0x4b1d launcher_executable_component_sequence_sha256 SHA256, derived kind 13
  0x4b1e launcher_executable_component_sequence STRUCT ComponentSequence,
                                           authority slot 1
  0x4b1f launcher_executable_absolute_path BYTES, 2..4,096 exact ASCII
  0x4b20 launcher_executable_edge_set_sha256 SHA256, derived kind 35
  0x4b21 launcher_executable_edge_count U32, equal `4b1e` component count
  0x4b22 launcher_executable_edges      LIST ParentChildEdge, exact count
  0x4b23 launcher_executable_file_identity STRUCT ProtectedFileIdentity
  0x4b24 launcher_executable_code_identity STRUCT ExecutableCodeIdentity
  0x4b25 external_launcher_tcb_audit_sha256 SHA256, complete HMG4L3 kind 1
  0x4b26 external_launcher_tcb_audit    STRUCT ReviewedObjectMember, role 4,
                                           encoding 1, binding 2
  0x4b27 parent_executable_observation_profile U32, exactly 1 public
                                           proc_pidpath/region/vnode/SecCode

LauncherExecutionConfiguration payload
  0x4ba1 service_label                 BYTES, byte-identical to `4b05`
  0x4ba2 program_component_sequence    STRUCT ComponentSequence,
                                           byte-identical to `4b1a`
  0x4ba3 program_absolute_path         BYTES, byte-identical to `4b1b`
  0x4ba4 program_argument_count        U32, exactly 1, equal `4b11`
  0x4ba5 program_arguments             LIST DiagnosticByteString, exactly one,
                                           byte-identical to `4b12`
  0x4ba6 environment_member_count      U32, exactly zero
  0x4ba7 transport_profile             U32, equal `4b09`
  0x4ba8 child_endpoint_profile        U32, equal `4b17`
  0x4ba9 parent_peer_profile           U32, equal `4b18`
  0x8e33 execve_argument_limit_identity_sha256 SHA256, derived kind 140,
                                           equal admitted SDKIdentity `4f41`
  0x8e34 execve_argument_limit_identity STRUCT ExecveArgumentLimitIdentity,
                                           equal admitted SDKIdentity `4f42`
  0x8e35 execve_serialization_observation_sha256 SHA256, derived kind 141
  0x8e36 execve_serialization_observation STRUCT ExecveSerializationObservation

SigningProfile
  0x4c01 profile_version              U32, exactly 1
  0x4c02 signature_algorithm          U32, exactly 1 RSA-3072 PKCS1-v1_5 SHA-256
  0x4c03 certificate_chain_set_sha256 SHA256, derived kind 27
  0x4c04 timestamp_present            BOOL, exactly false
  0x4c05 cms_signing_time_present     BOOL, exactly false
  0x4c06 code_directory_hash_kind     U32, exactly 1 SHA-256
  0x4c07 macho_slice_profile          U32, exactly 1 thin arm64/MH_EXECUTE
  0x4c08 lc_uuid_derivation_sha256    SHA256, derived kind 27
  0x4c09 deterministic_signature      BOOL, exactly true
  0x4c0a certificate_chain_count      U32, 2..16
  0x4c0b certificate_chain            LIST ReviewedObjectMember, exact count
  0x4c0c lc_uuid_derivation_input_count U32, exactly 11
  0x4c0d lc_uuid_derivation_inputs    LIST ReviewedObjectMember, exact count

ObservedExecutableIdentity
  0x4e01 observed_kind                U32: 1 signed Mach-O, 2 unsigned Mach-O,
                                         3 kernel process
  0x4e02 device                       U64, required kinds 1/2; forbidden kind 3
  0x4e03 inode                        U64, required kinds 1/2; forbidden kind 3
  0x4e04 byte_length                  U64, required kinds 1/2; forbidden kind 3
  0x4e05 content_sha256               SHA256, required kinds 1/2; forbidden kind 3
  0x4e06 code_identity                STRUCT ObservedCodeSignatureIdentity,
                                         required kind 1; forbidden kinds 2/3
  0x4e07 kernel_identifier            BYTES, 1..255 exact kernel bytes,
                                         required kind 3; forbidden kinds 1/2
  0x4e08 inspection_result            U32, exactly 1

ObservedCodeSignatureIdentity
  0x4f01 code_directory_sha256        SHA256
  0x4f02 kernel_cdhash                BYTES, exactly 20
  0x4f03 signing_identifier           BYTES, 0..255 exact bytes
  0x4f04 team_identifier              BYTES, 0..64 exact bytes
  0x4f05 static_code_directory_flags U32, exact `kSecCodeInfoFlags`
  0x4f06 designated_requirement_external BYTES, 0..65,536 exact bytes
  0x4f07 signed_entitlements_blob     BYTES, 0..65,536 exact observed bytes;
                                           byte-identical to `6410` only when
                                           mapped to an ExecutableCodeIdentity
  0x4f08 validity_result              U32, exactly 1 valid

DynamicCodeStatusObservation
  0x80b1 execution_identity_sha256  SHA256, derived kind 97
  0x80b2 execution_identity         STRUCT PublicProcessExecutionIdentity
  0x80b3 status_before               U32, exact first `kSecCodeInfoStatus`
  0x80b4 status_after                U32, exact second `kSecCodeInfoStatus`
  0x80b5 public_status_mask          U32, exactly 0x14000301
  0x80b6 public_projection_before    U32, equal `80b3 & 80b5`
  0x80b7 public_projection_after     U32, equal `80b4 & 80b5`
  0x80b8 actor_status_profile        U32: exactly 1 contract-owned nonplatform actor
  0x80b9 validity_before             U32, exactly 1 valid
  0x80ba validity_after              U32, exactly 1 valid
  0x80bb started_at_unix_nanoseconds U64
  0x80bc finished_at_unix_nanoseconds U64, not less than `80bb`
  0x80bd result                      U32, exactly 1

ParentExecutablePathObservation
  0x8a01 ordinal                     U32, exactly 0 before or 1 after
  0x8a02 parent_execution_identity_sha256 SHA256, derived kind 97
  0x8a03 parent_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x8a04 proc_pidpath_abi_binding_sha256 SHA256, SHA-256 of complete
                                           SDKABIBinding ordinal 63
  0x8a05 buffer_capacity             U32, exact SDK `PROC_PIDPATHINFO_MAXSIZE`
  0x8a06 positive_return_value       U32, 1..INT32_MAX; success discriminator,
                                           never asserted to be a byte count
  0x8a07 exact_path_length           U64, 2..4,095
  0x8a08 exact_path_bytes            BYTES, exact `8a07`, absolute, no NUL
  0x8a09 component_sequence_sha256   SHA256, derived kind 13
  0x8a0a component_sequence          STRUCT ComponentSequence, authority slot 1
  0x8a0b observed_at_unix_nanoseconds U64
  0x8a0c first_nul_offset            U32, equal `8a07`, less than `8a05`
  0x8a0d result                      U32, exactly 1

ParentExecutableWalkPass
  0x8a21 ordinal                     U32, exactly 0 or 1
  0x8a22 parent_execution_identity_sha256 SHA256, derived kind 97
  0x8a23 parent_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x8a24 root_identity               STRUCT RootIdentity, authority slot 1
  0x8a25 component_sequence_sha256   SHA256, derived kind 13
  0x8a26 component_sequence          STRUCT ComponentSequence, authority slot 1
  0x8a27 parent_child_edge_set_sha256 SHA256, derived kind 35
  0x8a28 parent_child_edge_count     U32, equal component count
  0x8a29 parent_child_edges          LIST ParentChildEdge, exact count
  0x8a2a held_final_file_identity    STRUCT ProtectedFileIdentity
  0x8a2b held_static_code_identity   STRUCT ExecutableCodeIdentity
  0x8a2c final_open_profile          U32, exactly 1 read-only/no-follow/ordinary
  0x8a2d final_fd_retained           BOOL, exactly true
  0x8a2e started_at_unix_nanoseconds U64
  0x8a2f finished_at_unix_nanoseconds U64, not less than `8a2e`
  0x8a30 result                      U32, exactly 1

ParentExecutableRegionObservation
  0x8a41 ordinal                     U32, contiguous from zero
  0x8a42 query_address               U64, zero first; then prior checked end
  0x8a43 returned_byte_count         U32, exact SDK
                                           `PROC_PIDREGIONPATHINFO_SIZE`
  0x8a44 region_address              U64
  0x8a45 region_size                 U64, nonzero
  0x8a46 protection                  U32
  0x8a47 maximum_protection          U32
  0x8a48 region_flags                U32
  0x8a49 file_offset                 U64
  0x8a4a share_mode                  U32
  0x8a4b vnode_device                U64, normalized exact `vst_dev`
  0x8a4c vnode_inode                 U64, normalized exact `vst_ino`
  0x8a4d vnode_mode                  U32, normalized exact `vst_mode`
  0x8a4e vnode_link_count            U32, normalized exact `vst_nlink`
  0x8a4f vnode_size                  U64, normalized exact `vst_size`
  0x8a50 vnode_flags                 U32, exact `vst_flags`
  0x8a51 vnode_type                  U32, exact `vi_type`
  0x8a52 path_length                 U64, 0..1,023
  0x8a53 path_bytes                  BYTES, exact `8a52`, no NUL
  0x8a54 path_matches_proc_pidpath   BOOL
  0x8a55 executable_protection       BOOL, exact `8a46 & VM_PROT_EXECUTE != 0`
  0x8a56 selected_launcher_mapping   BOOL, iff `8a54 && 8a55 && vi_type==VREG`
  0x8a57 result                      U32, exactly 1

SecCodeGuestLookupObservation
  0x8a61 observation_version         U32, exactly 1
  0x8a62 parent_execution_identity_sha256 SHA256, derived kind 97
  0x8a63 parent_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x8a64 host_profile                U32, exactly 1 NULL/system root
  0x8a65 dictionary_member_count     U32, exactly 1
  0x8a66 key_profile                 U32, exactly 1 public `kSecGuestAttributePid`
  0x8a67 number_type                 U32, exact SDK `kCFNumberSInt32Type`
  0x8a68 number_value_width_bytes    U32, exactly 4
  0x8a69 number_signed_value_bits    U32, exact positive int32 parent PID bits
  0x8a6a allocator_profile           U32, exactly 1 NULL/default
  0x8a6b dictionary_callback_profile U32, exactly 1 public CFType key/value
  0x8a6c sec_cs_flags                U32, exact `kSecCSDefaultFlags`
  0x8a6d osstatus_result_bits        U32, exact signed `errSecSuccess` bits
  0x8a6e output_guest_nonnull        BOOL, exactly true
  0x8a6f guest_lookup_abi_binding_sha256 SHA256, SHA-256 of SDKABIBinding 66
  0x8a70 cfnumber_create_abi_binding_sha256 SHA256, SDKABIBinding 64
  0x8a71 cfdictionary_create_abi_binding_sha256 SHA256, SDKABIBinding 65
  0x8a72 cfrelease_abi_binding_sha256 SHA256, SDKABIBinding 67
  0x8a73 cfnumber_release_count      U32, exactly 1
  0x8a74 dictionary_release_count    U32, exactly 1
  0x8a75 guest_release_count         U32, exactly 1 after all dependent calls
  0x8a76 guest_retained_through_dynamic_observation BOOL, exactly true
  0x8a77 result                      U32, exactly 1

ParentLauncherExecutableObservation
  0x8a81 observation_version         U32, exactly 1
  0x8a82 parent_execution_identity_sha256 SHA256, derived kind 97
  0x8a83 parent_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x8a84 launcher_configuration_sha256 SHA256, derived kind 48
  0x8a85 expected_component_sequence_sha256 SHA256, equal launcher `4b1d`
  0x8a86 path_observation_set_sha256 SHA256, derived kind 142
  0x8a87 path_observation_count      U32, exactly 2
  0x8a88 path_observations           LIST ParentExecutablePathObservation
  0x8a89 walk_pass_set_sha256        SHA256, derived kind 143
  0x8a8a walk_pass_count             U32, exactly 2
  0x8a8b walk_passes                 LIST ParentExecutableWalkPass
  0x8a8c mapped_region_set_sha256    SHA256, derived kind 144
  0x8a8d mapped_region_count         U32, 1..4,096
  0x8a8e mapped_regions              LIST ParentExecutableRegionObservation
  0x8a8f selected_launcher_mapping_count U32, 1..64
  0x8a90 held_launcher_file_identity STRUCT ProtectedFileIdentity
  0x8a91 held_static_code_identity   STRUCT ExecutableCodeIdentity
  0x8a92 guest_lookup_observation_sha256 SHA256, derived kind 145
  0x8a93 guest_lookup_observation    STRUCT SecCodeGuestLookupObservation
  0x8a94 runtime_validated_code_identity STRUCT ExecutableCodeIdentity
  0x8a95 dynamic_code_status         STRUCT DynamicCodeStatusObservation,
                                           actor profile 1
  0x8a96 started_at_unix_nanoseconds U64
  0x8a97 finished_at_unix_nanoseconds U64, not less than `8a96`
  0x8a98 sdk_identity_sha256         SHA256, equal enclosing admitted SDK
  0x8a99 sdk_layout_binding_set_sha256 SHA256, equal SDKIdentity `4f43`
  0x8a9a result                      U32, exactly 1

ParentLauncherSDKLayoutBinding
  0x8aa1 ordinal                     U32, contiguous 0..31
  0x8aa2 selector                    U32, equal `8aa1`, closed table below
  0x8aa3 canonical_expression_bytes  BYTES, 1..255 exact ASCII SDK spelling
  0x8aa4 byte_offset                 U64; zero for size/type selectors
  0x8aa5 byte_size                   U64, 1..4,096
  0x8aa6 nominal_type_bytes          BYTES, 1..255 exact ASCII SDK spelling
  0x8aa7 signedness                  U32: 1 unsigned, 2 signed, 3 aggregate,
                                           4 opaque pointer, 5 extern object
  0x8aa8 declaring_header_source_ordinal U32, index into `4f2b`
  0x8aa9 compile_probe_line_sha256   SHA256
  0x8aaa compile_probe_line_bytes    BYTES, 1..4,096 exact C17 source line
  0x8aab selector_kind              U32: 1 aggregate size, 2 selected field,
                                           3 scalar/opaque size, 4 extern type

PollDecisionBinding
  0x8ac1 ordinal                     U32, contiguous 0..20, Section-2 row
  0x8ac2 endpoint_profile            U32: 1 request FD 0, 2 response FD 1
  0x8ac3 deadline_relation           U32: 1 strictly before, 2 at/after
  0x8ac4 poll_return_class           U32: 1 any, 2 exactly one, 3 zero,
                                           4 negative-EINTR, 5 negative-other,
                                           6 positive greater than one,
                                           7 remaining invalid
  0x8ac5 revents_predicate           U32: 1 any, 2 exact zero, 3 contains NVAL,
                                           4 contains ERR without NVAL,
                                           5 exact IN, 6 exact HUP,
                                           7 exact IN|HUP, 8 contains HUP
                                           without NVAL/ERR, 9 exact OUT,
                                           10 remaining invalid/unknown
  0x8ac6 exact_revents_mask          U32, required predicates 2/5/6/7/9;
                                           forbidden predicates 1/3/4/8/10
  0x8ac7 decision                    U32: 1 deadline, 2 poll-again,
                                           3 retry-read, 4 one EOF read,
                                           5 drain-read, 6 retry-write,
                                           7 request-transport-error,
                                           8 response-transport-error
  0x8ac8 next_syscall                U32: 0 none, 1 poll, 2 read, 3 write
  0x8ac9 diagnostic_class            U32: 1 deadline, 2 request transport,
                                           3 response transport, 4 none/retry
  0x8aca precedence_rank             U32, exact row's Section-2 precedence
  0x8acb result                      U32, exactly 1

ExternalLauncherTCBAuditStatement
  0x8ae1 statement_version           U32, exactly 1
  0x8ae2 object_magic                BYTES, exactly `HMG4L3` plus two NUL
  0x8ae3 object_kind                 U32, exactly 1
  0x8ae4 unsigned_payload_sha256     SHA256
  0x8ae5 auditor_identity_sha256     SHA256, derived kind 34
  0x8ae6 protocol_spec_sha256        SHA256
  0x8ae7 predecessor_contract_sha256 SHA256
  0x8ae8 launcher_configuration_frame_sha256 SHA256
  0x8ae9 launcher_executable_code_identity_sha256 SHA256, derived kind 15
  0x8aea input_set_sha256            SHA256, derived kind 149
  0x8aeb output_set_sha256           SHA256, derived kind 150
  0x8aec result                      U32, exactly 1
  0x8aed launcher_sdk_toolchain_identity_sha256 SHA256, derived kind 158
  0x8aee builder_code_identity_sha256 SHA256, derived kind 15

LauncherSourceUnit
  0x9301 ordinal                     U32, contiguous from zero
  0x9302 relative_path               BUILD_REL_PATH, no duplicate/case collision
  0x9303 exact_byte_length           U64, 1..16,777,216
  0x9304 content_sha256              SHA256
  0x9305 held_source                 STRUCT ReviewedObjectMember, role 3,
                                           encoding 3, binding 2
  0x9306 language_profile            U32, exactly 1 reviewed C17/Objective-C-free
  0x9307 source_role                 U32, exactly 1 external parent launcher
  0x9308 text_encoding               U32, exactly 1 raw bytes/no normalization
  0x9309 line_ending_conversion      BOOL, exactly false
  0x930a result                      U32, exactly 1

LauncherToolIdentity
  0x9311 ordinal                     U32, contiguous from zero
  0x9312 tool_identifier             BYTES, 1..255 exact ASCII, unique
  0x9313 held_tool_executable        STRUCT ReviewedObjectMember, role 5,
                                           encoding 3, binding 2
  0x9314 held_tool_file_identity     STRUCT ProtectedFileIdentity
  0x9315 build_tool_identity_sha256  SHA256, SHA-256 of complete canonical `9316`
  0x9316 build_tool_identity         STRUCT BuildToolIdentity
  0x9317 observed_executable_identity_sha256 SHA256, equal `9316.611a`
  0x9318 observed_executable_identity STRUCT CanonicalIdentityMember,
                                           identity kind 11, equal `9316.611b`
  0x9319 tool_role                   U32: 1 SDK locator, 2 compiler, 3 linker,
                                           4 signer, 5 source scanner,
                                           6 test harness, 7 transcript encoder
  0x931a result                      U32, exactly 1

LauncherBuildTranscript
  0x9321 transcript_version          U32, exactly 1
  0x9322 launcher_source_set_sha256  SHA256, derived kind 153
  0x9323 launcher_source_count       U32, 1..1,024
  0x9324 launcher_tool_set_sha256    SHA256, derived kind 154
  0x9325 launcher_tool_count         U32, exactly 7
  0x9326 launcher_tools              LIST LauncherToolIdentity, exact count
  0x9327 command_set_sha256          SHA256, derived kind 159
  0x9328 command_count               U32, 7..2,048
  0x9329 commands                    LIST LauncherBuildCommand, exact count
  0x932a consumed_source_count       U32, equal `9323`
  0x932b consumed_source_ordinals    LIST LauncherOrdinalRef, exact 0..`9323-1`
  0x932c consumed_tool_count         U32, equal `9325`
  0x932d consumed_tool_ordinals      LIST LauncherOrdinalRef, exact 0..`9325-1`
  0x932e environment_set_sha256      SHA256, derived kind 24, exact canonical empty
  0x932f exit_status                 U32, exactly zero
  0x9330 produced_file_identity      STRUCT ProtectedFileIdentity
  0x9331 produced_code_identity_sha256 SHA256, derived kind 15
  0x9332 produced_code_identity      STRUCT ExecutableCodeIdentity
  0x9333 started_at_unix_nanoseconds U64
  0x9334 finished_at_unix_nanoseconds U64, not less than `9333`
  0x9335 stdout_byte_length          U64, exactly zero
  0x9336 stdout_sha256               SHA256, exact empty bytes
  0x9337 stderr_byte_length          U64, exactly zero
  0x9338 stderr_sha256               SHA256, exact empty bytes
  0x9339 network_allowed             BOOL, exactly false
  0x933a result                      U32, exactly 1
  0x933b builder_actor_identity_sha256 SHA256, derived kind 34
  0x933c builder_actor_identity      STRUCT ActorIdentity, kind 3
  0x933d held_builder_executable     STRUCT ReviewedObjectMember, role 5,
                                           encoding 3, binding 2
  0x933e builder_file_identity       STRUCT ProtectedFileIdentity
  0x933f builder_code_identity_sha256 SHA256, derived kind 15
  0x9340 builder_code_identity       STRUCT ExecutableCodeIdentity
  0x9371 sdk_toolchain_identity_sha256 SHA256, derived kind 158
  0x9372 build_execution_set_sha256  SHA256, derived kind 161
  0x9373 build_execution_count       U32, equal `9328`
  0x9374 build_executions            LIST LauncherBuildExecution, exact count
  0x9375 build_artifact_set_sha256   SHA256, derived kind 162
  0x9376 build_artifact_count        U32, 1..8,192
  0x9377 build_artifacts             LIST LauncherBuildArtifact, exact count
  0x9378 build_edge_set_sha256       SHA256, derived kind 163
  0x9379 build_edge_count            U32, 1..16,384
  0x937a build_edges                 LIST LauncherBuildEdge, exact count
  0x937b final_artifact_ordinal      U32, 0..8,191, selects sole role 4
  0x937c build_root_nonce            BYTES, exactly 32, nonzero
  0x937d disposable_build_root_identity STRUCT DirectoryIdentity,
                                           authority slot 2
  0x937e disposable_build_parent_identity STRUCT DirectoryIdentity,
                                           authority slot 2
  0x937f root_nofollow_scan_pass_count U32, exactly 4
  0x9380 build_root_exclusive_no_replace BOOL, exactly true
  0x9540 builder_session_observation_sha256 SHA256, derived kind 167
  0x9541 builder_session_observation STRUCT LauncherBuilderSessionObservation
  0x9542 build_root_scan_set_sha256  SHA256, derived kind 169
  0x9543 build_root_scans            LIST LauncherBuildRootScanPass,
                                           exact `937f` count

LauncherTCBTestObservation
  0x9341 ordinal                     U32, contiguous 0..12
  0x9342 test_profile                U32, exactly ordinal plus one
  0x9343 protocol_spec_sha256        SHA256
  0x9344 predecessor_contract_sha256 SHA256
  0x9345 launcher_source_set_sha256  SHA256, derived kind 153
  0x9346 launcher_build_transcript_sha256 SHA256, derived kind 156
  0x9347 launcher_configuration_frame_sha256 SHA256
  0x9348 launcher_file_identity      STRUCT ProtectedFileIdentity
  0x9349 launcher_code_identity_sha256 SHA256, derived kind 15
  0x934a launcher_code_identity      STRUCT ExecutableCodeIdentity
  0x934b command_set_sha256          SHA256, derived kind 159
  0x934c injection_mask              U64, exact profile table below
  0x934d expected_decision           U32: 1 admit, 2 reject
  0x934e observed_decision           U32, equal `934d`
  0x934f observed_nofollow_walk_count U32
  0x9350 observed_execve_call_count  U32
  0x9351 observed_pipe_create_count  U32
  0x9352 observed_child_fd_count     U32
  0x9353 observed_retained_peer_count U32
  0x9354 observed_argv_set_sha256    SHA256, derived kind 23 or canonical empty
  0x9355 observed_environment_set_sha256 SHA256, derived kind 24
  0x9356 mapped_vnode_result         U32: 0 not applicable, 1 equal, 2 unequal
  0x9357 alternate_copy_admitted     BOOL, exactly false
  0x9358 symlink_edge_admitted       BOOL, exactly false
  0x9359 second_execve_admitted      BOOL, exactly false
  0x935a protected_or_runtime_effect_mask U64, exactly zero
  0x935b result                      U32, exactly 1
  0x935c test_vector_catalog_sha256  SHA256, derived kind 160
  0x935d extra_fd_admitted           BOOL, exactly false
  0x935e endpoint_alias_admitted     BOOL, exactly false
  0x935f status_flag_drift_admitted  BOOL, exactly false
  0x9360 relative_path_admitted      BOOL, exactly false
  0x9361 nonempty_environment_admitted BOOL, exactly false
  0x9362 sdk_toolchain_identity_sha256 SHA256, derived kind 158
  0x9363 builder_file_identity       STRUCT ProtectedFileIdentity
  0x9364 builder_code_identity_sha256 SHA256, derived kind 15
  0x9365 builder_code_identity       STRUCT ExecutableCodeIdentity
  0x9366 builder_actor_identity_sha256 SHA256, derived kind 34
  0x9367 injection_plan_sha256       SHA256, SHA-256 of canonical `9368`
  0x9368 injection_plan              STRUCT LauncherInjectionPlan
  0x9369 injection_observation_sha256 SHA256, SHA-256 of canonical `936a`
  0x936a injection_observation       STRUCT LauncherInjectionObservation
  0x936b transport_lifecycle_observation_sha256 SHA256, derived kind 179;
                                           required profiles 2..5 and 8..11,
                                           forbidden profiles 1/6/7/12/13
  0x936c transport_lifecycle_observation STRUCT LauncherTransportLifecycleObservation,
                                           same conditional presence as `936b`
  0x936d observed_child_nonblock_setfl_count U32, 3 when `936b` present,
                                           `0xffffffff` otherwise
  0x936e observed_child_nonblock_getfl_count U32, 6 when `936b` present,
                                           `0xffffffff` otherwise

LauncherSDKToolchainIdentity
  0x9381 identity_version            U32, exactly 1
  0x9382 os_build_identity_sha256    SHA256, derived kind 15 identity kind 16
  0x9383 os_build_identity           STRUCT OSBuildIdentity
  0x9384 sdk_identity_sha256         SHA256, derived kind 15 identity kind 17
  0x9385 sdk_identity                STRUCT SDKIdentity
  0x9386 required_header_manifest_sha256 SHA256, equal `9385.4f26`
  0x9387 sdk_abi_binding_set_sha256  SHA256, equal `9385.4f30`
  0x9388 parent_launcher_sdk_layout_set_sha256 SHA256, equal `9385.4f43`
  0x9389 poll_decision_binding_set_sha256 SHA256, equal `9385.4f47`
  0x938a compile_probe_source_sha256 SHA256, equal `9385.4f34`
  0x938b sdk_settings_sha256         SHA256, equal `9385.4f25`
  0x938c sdk_build_version_output_sha256 SHA256, equal `9385.4f2d.7d45`
  0x938d security_framework_reference_sha256 SHA256, equal `9383.4f16`
  0x938e libc_reference_sha256       SHA256, equal `9383.4f17`
  0x938f sdk_locator_tool_ordinal    U32, exactly 0
  0x9390 compiler_tool_ordinal       U32, exactly 1
  0x9391 linker_tool_ordinal         U32, exactly 2
  0x9392 signer_tool_ordinal         U32, exactly 3
  0x9393 target_architecture         BYTES, exactly ASCII `arm64`
  0x9394 language_standard           BYTES, exactly ASCII `c17`
  0x9395 ambient_sdk_or_tool_lookup_allowed BOOL, exactly false
  0x9396 network_allowed             BOOL, exactly false
  0x9397 result                      U32, exactly 1

LauncherBuildCommand
  0x93b1 ordinal                    U32, contiguous from zero
  0x93b2 sdk_toolchain_identity_sha256 SHA256, derived kind 158
  0x93b3 launcher_source_set_sha256 SHA256, derived kind 153
  0x93b4 launcher_tool_set_sha256   SHA256, derived kind 154
  0x93b5 builder_actor_identity_sha256 SHA256, derived kind 34
  0x93b6 builder_code_identity_sha256 SHA256, derived kind 15
  0x93b7 selected_tool_ordinal      U32, 0..6
  0x93b8 selected_tool_identity_sha256 SHA256, SHA-256 of the complete
                                           canonical selected LauncherToolIdentity
  0x93b9 command_profile            U32, exactly selected tool `9319`
  0x93ba argument_set_sha256        SHA256, derived kind 23
  0x93bb argument_count             U32, 1..256
  0x93bc arguments                  LIST DiagnosticByteString, exact count
  0x93bd environment_set_sha256     SHA256, exact canonical empty kind 24
  0x93be consumed_source_count      U32, 0..1,024
  0x93bf consumed_source_ordinals   LIST LauncherOrdinalRef, exact count, strictly
                                           increasing and duplicate-free
  0x93c0 network_allowed            BOOL, exactly false
  0x93c1 result                     U32, exactly 1
  0x93c2 execve_serialization_observation_sha256 SHA256, derived kind 141
  0x93c3 execve_serialization_observation STRUCT ExecveSerializationObservation
  0x93c8 argument_artifact_binding_set_sha256 SHA256, derived kind 172
  0x93c9 argument_artifact_binding_count U32, 0..256
  0x93ca argument_artifact_bindings LIST LauncherCommandArtifactBinding,
                                           exact count

LauncherOrdinalRef
  0x93c4 value                      U32, 0..1,023 and strictly less than the
                                           enclosing context's declared count

LauncherArtifactOrdinalRef
  0x93c5 value                      U32, 0..8,191 and strictly less than the
                                           enclosing artifact count

LauncherEdgeOrdinalRef
  0x93c6 value                      U32, 0..16,383 and strictly less than the
                                           enclosing edge count

LauncherExecutionOrdinalRef
  0x93c7 value                      U32, 0..2,047 and strictly less than the
                                           enclosing execution count

LauncherTestVector
  0x93d1 ordinal                    U32, contiguous 0..12
  0x93d2 test_profile               U32, exactly ordinal plus one
  0x93d3 protocol_spec_sha256       SHA256
  0x93d4 predecessor_contract_sha256 SHA256
  0x93d5 launcher_source_set_sha256 SHA256, derived kind 153
  0x93d6 sdk_toolchain_identity_sha256 SHA256, derived kind 158
  0x93d7 launcher_build_transcript_sha256 SHA256, derived kind 156
  0x93d8 launcher_configuration_frame_sha256 SHA256
  0x93d9 launcher_file_identity     STRUCT ProtectedFileIdentity
  0x93da launcher_code_identity_sha256 SHA256, derived kind 15
  0x93db builder_code_identity_sha256 SHA256, derived kind 15
  0x93dc command_set_sha256         SHA256, derived kind 159
  0x93dd injection_mask             U64, exact profile table
  0x93de expected_decision          U32: 1 admit, 2 reject
  0x93df expected_nofollow_walk_count U32, exact profile table or `0xffffffff`
  0x93e0 expected_execve_call_count U32, exact profile table or `0xffffffff`
  0x93e1 expected_pipe_create_count U32, exact profile table or `0xffffffff`
  0x93e2 expected_child_fd_count    U32, exact profile table or `0xffffffff`
  0x93e3 expected_retained_peer_count U32, exact profile table or `0xffffffff`
  0x93e4 expected_mapped_vnode_result U32: 0 not applicable, 1 equal, 2 unequal
  0x93e5 expected_argv_set_sha256   SHA256, derived kind 23 or canonical empty
  0x93e6 expected_environment_set_sha256 SHA256, derived kind 24
  0x93e7 expected_extra_fd_admitted BOOL, exactly false
  0x93e8 expected_endpoint_alias_admitted BOOL, exactly false
  0x93e9 expected_status_flag_drift_admitted BOOL, exactly false
  0x93ea expected_second_execve_admitted BOOL, exactly false
  0x93eb expected_relative_path_admitted BOOL, exactly false
  0x93ec expected_nonempty_environment_admitted BOOL, exactly false
  0x93ed expected_protected_or_runtime_effect_mask U64, exactly zero
  0x93ee result                     U32, exactly 1
  0x93ef launcher_code_identity    STRUCT ExecutableCodeIdentity
  0x93f0 builder_code_identity     STRUCT ExecutableCodeIdentity
  0x93f1 builder_file_identity     STRUCT ProtectedFileIdentity
  0x93f2 builder_actor_identity_sha256 SHA256, derived kind 34
  0x93f3 injection_plan_sha256    SHA256, SHA-256 of canonical `93f4`
  0x93f4 injection_plan           STRUCT LauncherInjectionPlan
  0x93f5 expected_transport_lifecycle_profile U32: 0 absent, 1 admitted exact,
                                           2 extra-FD reject, 3 endpoint-alias reject,
                                           4 status-flag-drift reject,
                                           5 second-exec reject
  0x93f6 expected_child_nonblock_setfl_count U32, 3 when `93f5` nonzero,
                                           `0xffffffff` otherwise
  0x93f7 expected_child_nonblock_getfl_count U32, 6 when `93f5` nonzero,
                                           `0xffffffff` otherwise

LauncherBuildArtifact
  0x9421 ordinal                    U32, contiguous from zero
  0x9422 relative_path              BUILD_REL_PATH, unique and file-prefix-free
  0x9423 artifact_role              U32: 1 materialized source, 2 object,
                                           3 linked unsigned, 4 signed final
                                           launcher, 5 audit-only auxiliary
  0x9424 exact_byte_length          U64, 1..1,073,741,824
  0x9425 content_sha256             SHA256
  0x9426 held_file_identity         STRUCT ProtectedFileIdentity
  0x9427 producer_execution_ordinal U32, `0xffffffff` exactly role 1,
                                           otherwise 0..2,047
  0x9428 consumer_count             U32, 0..2,048
  0x9429 consumer_execution_ordinals LIST LauncherExecutionOrdinalRef,
                                           exact count, strictly increasing
  0x942a source_ordinal             U32, 0..1,023 exactly role 1,
                                           `0xffffffff` otherwise
  0x942b retained_through_last_consumer BOOL, exactly true
  0x942c is_unique_final_output     BOOL, true exactly role 4
  0x942d stable_identity_pass_count U32, exactly 2
  0x942e result                     U32, exactly 1

LauncherBuildEdge
  0x9431 ordinal                    U32, contiguous from zero
  0x9432 edge_kind                  U32: 1 source-to-compile, 2 source-to-scan,
                                           3 object-to-link, 4 unsigned-to-sign,
                                           5 artifact-to-test-or-encode
  0x9433 artifact_ordinal           U32, 0..8,191
  0x9434 producer_execution_ordinal U32, `0xffffffff` only source edge,
                                           otherwise 0..2,047
  0x9435 consumer_execution_ordinal U32, 0..2,047
  0x9436 artifact_content_sha256    SHA256
  0x9437 producer_finished_at_unix_nanoseconds U64, zero only source edge
  0x9438 consumer_started_at_unix_nanoseconds U64
  0x9439 ordering_satisfied         BOOL, exactly true
  0x943a result                     U32, exactly 1

LauncherBuildExecution
  0x9441 ordinal                    U32, contiguous from zero, equal command ordinal
  0x9442 command_sha256             SHA256, complete canonical selected
                                           LauncherBuildCommand
  0x9443 command_set_sha256         SHA256, derived kind 159
  0x9444 builder_actor_identity_sha256 SHA256, derived kind 34
  0x9445 builder_execution_identity_sha256 SHA256, derived kind 97
  0x9446 builder_execution_identity STRUCT PublicProcessExecutionIdentity
  0x9447 child_execution_identity_sha256 SHA256, derived kind 97
  0x9448 child_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x9449 started_at_unix_nanoseconds U64
  0x944a finished_at_unix_nanoseconds U64, not less than `9449`
  0x944b selected_tool_ordinal      U32, 0..6, equal command `93b7`
  0x944c selected_launcher_tool_identity_sha256 SHA256, equal command `93b8`
  0x944d observed_executable_identity_sha256 SHA256, equal selected tool `9317`
  0x944e observed_executable_identity STRUCT CanonicalIdentityMember,
                                           identity kind 11, equal selected `9318`
  0x944f held_executable_file_identity STRUCT ProtectedFileIdentity,
                                           equal selected tool `9314`
  0x9450 syscall_observation_sha256 SHA256, derived kind 164
  0x9451 syscall_observation        STRUCT LauncherExecSyscallObservation
  0x9452 exit_status               U32, exactly zero
  0x9453 terminating_signal        U32, exactly zero
  0x9454 stdout_byte_length        U64, 0..67,108,864
  0x9455 stdout_sha256             SHA256
  0x9456 held_stdout               STRUCT ReviewedObjectMember, role 12,
                                           encoding 3, binding 2
  0x9457 stderr_byte_length        U64, 0..67,108,864
  0x9458 stderr_sha256             SHA256
  0x9459 held_stderr               STRUCT ReviewedObjectMember, role 12,
                                           encoding 3, binding 2
  0x945a consumed_artifact_count   U32, 0..8,192
  0x945b consumed_artifact_ordinals LIST LauncherArtifactOrdinalRef, exact count
  0x945c produced_artifact_count   U32, 0..8,192
  0x945d produced_artifact_ordinals LIST LauncherArtifactOrdinalRef, exact count
  0x945e dependency_edge_set_sha256 SHA256, derived kind 163 projection
  0x945f dependency_edge_count     U32, 0..16,384
  0x9460 dependency_edge_ordinals  LIST LauncherEdgeOrdinalRef, exact count
  0x9461 result                    U32, exactly 1

LauncherExecSyscallObservation
  0x9471 observation_version       U32, exactly 1
  0x9472 command_ordinal            U32, 0..2,047
  0x9473 builder_execution_identity_sha256 SHA256, derived kind 97
  0x9474 builder_execution_identity STRUCT PublicProcessExecutionIdentity
  0x9475 child_execution_identity_sha256 SHA256, derived kind 97
  0x9476 child_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x9477 held_tool_file_identity    STRUCT ProtectedFileIdentity
  0x9478 observed_tool_identity_sha256 SHA256, derived kind 15 identity kind 11
  0x9479 observed_tool_identity     STRUCT CanonicalIdentityMember, kind 11
  0x947a fork_call_count            U32, exactly 1
  0x947b fork_return_pid            U32, equal child PID
  0x947c pipe_create_count          U32, exactly 3
  0x947d fchdir_call_count          U32, exactly 1
  0x947e dup2_call_count            U32, exactly 3
  0x947f close_call_count           U32, exact closed-FD inventory result
  0x9480 execve_call_count          U32, exactly 1
  0x9481 execve_path_bytes          BYTES, 1..1,023 exact absolute path
  0x9482 argument_set_sha256        SHA256, derived kind 23
  0x9483 environment_set_sha256     SHA256, exact canonical empty kind 24
  0x9484 waitpid_call_count         U32, exactly 1
  0x9485 waitpid_requested_pid      U32, equal child PID
  0x9486 waitpid_return_pid         U32, equal child PID
  0x9487 exit_status               U32, exactly zero
  0x9488 terminating_signal        U32, exactly zero
  0x9489 posix_spawn_call_count    U32, exactly zero
  0x948a shell_or_popen_call_count U32, exactly zero
  0x948b network_syscall_count     U32, exactly zero
  0x948c child_fd_inventory_pass_set_sha256 SHA256, derived kind 171
  0x948d child_fd_inventory_pass_count U32, exactly 2
  0x948e child_fd_inventory_passes LIST LauncherChildFDInventoryPass, exact count
  0x948f retained_parent_peer_count U32, exactly 3
  0x9491 pipe_creation_set_sha256 SHA256, derived kind 173
  0x9492 pipe_creations           LIST LauncherPipeCreationObservation,
                                           exact `947c` count
  0x9493 fchdir_observation_sha256 SHA256, SHA-256 of canonical `9494`
  0x9494 fchdir_observation       STRUCT LauncherFchdirObservation
  0x9495 dup2_observation_set_sha256 SHA256, derived kind 174
  0x9496 dup2_observations        LIST LauncherDup2Observation,
                                           exact `947e` count
  0x9497 close_observation_set_sha256 SHA256, derived kind 175
  0x9498 close_observations       LIST LauncherCloseObservation,
                                           exact `947f` count
  0x9499 syscall_step_set_sha256  SHA256, derived kind 176
  0x949a syscall_step_count       U32, exactly `947f + 20`
  0x949b syscall_steps            LIST LauncherSyscallStep, exact count
  0x949c fork_started_at_unix_nanoseconds U64
  0x949d fork_finished_at_unix_nanoseconds U64, not less than `949c`
  0x949e fork_child_return_pid     U32, exactly zero
  0x949f execve_started_at_unix_nanoseconds U64
  0x94a0 waitpid_started_at_unix_nanoseconds U64, not less than `949d`
  0x94a1 waitpid_finished_at_unix_nanoseconds U64, not less than `94a0`
  0x94a2 waitpid_options           U32, exactly zero
  0x94a3 execve_returned_to_child  BOOL, exactly false
  0x94af result                    U32, exactly 1
  0x94b0 parent_fd_inventory_pass_set_sha256 SHA256, derived kind 185
  0x94b1 parent_fd_inventory_pass_count U32, exactly 2
  0x94b2 parent_fd_inventory_passes LIST LauncherParentFDInventoryPass,
                                           exact count
  0x94b3 parent_close_observation_set_sha256 SHA256, derived kind 186
  0x94b4 parent_close_observation_count U32, exactly 3
  0x94b5 parent_close_observations LIST LauncherParentCloseObservation,
                                           exact count
  0x94b6 parent_duplicate_close_call_count U32, exactly 3
  0x94b7 child_nonblock_setup_set_sha256 SHA256, derived kind 190
  0x94b8 child_nonblock_setup_count U32, exactly 3
  0x94b9 child_nonblock_setups   LIST LauncherFcntlSetFlagsObservation,
                                           exact count
  0x94ba fcntl_setfl_call_count  U32, exactly 3
  0x94bb setup_fcntl_getfl_call_count U32, exactly 6

LauncherInjectionPlan
  0x9501 ordinal                   U32, contiguous 0..12
  0x9502 test_profile              U32, exactly ordinal plus one
  0x9503 fixture_kind              U32: 0 none, 1 alternate copy, 2 symlink edge,
                                           3 extra FD, 4 endpoint alias,
                                           5 status-flag drift, 6 second exec,
                                           7 relative path, 8 nonempty environment
  0x9504 injection_mask            U64, exact profile table
  0x9505 disposable_workspace_root STRUCT DirectoryIdentity, authority slot 2
  0x9506 intended_primary_object_type U32: 0 absent, 1 ordinary, 3 symlink,
                                           4 other; exact kind table
  0x9507 intended_secondary_object_type U32: 0 absent or 4 other,
                                           exact kind table
  0x9508 injected_path_bytes       BYTES, 0..4,096 exact bytes
  0x9509 injected_target_bytes     BYTES, 0..4,096 exact bytes
  0x950a injected_fd_constraint   U32: 0 none, 1 one unallowlisted FD greater
                                           than 2; kind 3 requires 1
  0x950b status_flags_before      U32, `0xffffffff` unless kind 5
  0x950c status_flags_after       U32, `0xffffffff` unless kind 5
  0x950d descriptor_flags         U32, `0xffffffff` unless kind 3
  0x950e required_pipe_topology   U32: 0 none, 1 deliberately aliased endpoint
                                           claim over distinct peer topology;
                                           kind 4 requires 1
  0x950f required_endpoint_direction_pair U32: 0 none, 1 read/write;
                                           kind 4 requires 1
  0x9510 second_exec_observed_identity STRUCT CanonicalIdentityMember,
                                           identity kind 11, kind 6 only
  0x9511 environment_name_bytes  BYTES, 0..128 exact ASCII, nonempty kind 8 only
  0x9512 environment_value_bytes BYTES, 0..4,096 exact nonsecret bytes,
                                           required kind 8 only
  0x9513 relative_argv0_bytes    BYTES, 0..1,023, nonempty kind 7 only
  0x9514 intended_injected_fd_role U32: `0xffffffff` unless kind 3;
                                           kind 3 requires exact unallowlisted role 8
  0x9515 expected_decision       U32: 1 admit kind 0, 2 reject kinds 1..8
  0x9516 protected_or_runtime_effect_mask U64, exactly zero
  0x9517 plan_frozen_at_unix_nanoseconds U64, strictly before observation setup
  0x9518 plan_profile            U32, exactly 1 immutable pre-execution plan
  0x9519 intended_primary_content_sha256 SHA256, required kinds 1/2,
                                           forbidden every other kind
  0x951a intended_primary_byte_length U64, required kinds 1/2,
                                           forbidden every other kind

LauncherInjectionObservation
  0x9521 ordinal                  U32, contiguous 0..12
  0x9522 test_profile             U32, exactly ordinal plus one
  0x9523 injection_plan_sha256    SHA256, SHA-256 of selected held plan
  0x9524 test_vector_catalog_sha256 SHA256, derived kind 160
  0x9525 injection_plan_set_sha256 SHA256, derived kind 165
  0x9526 actual_primary_artifact_identity STRUCT ObservedArtifactIdentity
  0x9527 actual_secondary_artifact_identity STRUCT ObservedArtifactIdentity
  0x9528 actual_injected_path_bytes BYTES, 0..4,096 exact bytes
  0x9529 actual_injected_target_bytes BYTES, 0..4,096 exact bytes
  0x952a actual_injected_fd_number U32, `0xffffffff` unless selected kind 3
  0x952b actual_status_flags_before U32, `0xffffffff` unless selected kind 5
  0x952c actual_status_flags_after U32, `0xffffffff` unless selected kind 5
  0x952d actual_descriptor_flags U32, `0xffffffff` unless selected kind 3
  0x952e actual_pipe_endpoint_before STRUCT PipeEndpointObservation,
                                           selected kind 4 only
  0x952f actual_pipe_endpoint_after STRUCT PipeEndpointObservation,
                                           selected kind 4 only
  0x9530 actual_second_exec_observed_identity STRUCT CanonicalIdentityMember,
                                           identity kind 11, selected kind 6 only
  0x9531 actual_environment_name_bytes BYTES, 0..128 exact ASCII,
                                           nonempty selected kind 8 only
  0x9532 actual_environment_value_bytes BYTES, 0..4,096 exact nonsecret bytes,
                                           required selected kind 8 only
  0x9533 actual_relative_argv0_bytes BYTES, 0..1,023,
                                           nonempty selected kind 7 only
  0x9534 actual_injected_fd_record STRUCT FixtureChildFDRecord,
                                           selected kind 3 only
  0x9535 setup_started_at_unix_nanoseconds U64, greater than plan `9517`
  0x9536 setup_finished_at_unix_nanoseconds U64, not less than `9535`
  0x9537 test_started_at_unix_nanoseconds U64, not less than `9536`
  0x9538 test_finished_at_unix_nanoseconds U64, not less than `9537`
  0x9539 teardown_finished_at_unix_nanoseconds U64, not less than `9538`
  0x953a observed_decision         U32, equal selected plan `9515`
  0x953b protected_or_runtime_effect_mask U64, exactly zero
  0x953c held_plan_open_before_setup BOOL, exactly true
  0x953d result                    U32, exactly 1
  0x953e actual_pipe_endpoint_before_sha256 SHA256, derived kind 96,
                                           selected kind 4 only
  0x953f actual_pipe_endpoint_after_sha256 SHA256, derived kind 96,
                                           selected kind 4 only

LauncherBuilderSessionObservation
  0x9551 observation_version       U32, exactly 1
  0x9552 builder_actor_identity_sha256 SHA256, derived kind 34
  0x9553 builder_actor_identity    STRUCT ActorIdentity, kind 3 bit 3
  0x9554 builder_credential        STRUCT ProcessCredentialIdentity
  0x9555 held_builder_file_identity STRUCT ProtectedFileIdentity
  0x9556 held_static_code_identity_sha256 SHA256, derived kind 15
  0x9557 held_static_code_identity STRUCT ExecutableCodeIdentity
  0x9558 runtime_validated_code_identity_sha256 SHA256, derived kind 15
  0x9559 runtime_validated_code_identity STRUCT ExecutableCodeIdentity
  0x955a execution_identity_before_sha256 SHA256, derived kind 97
  0x955b execution_identity_before STRUCT PublicProcessExecutionIdentity
  0x955c execution_identity_after_sha256 SHA256, derived kind 97
  0x955d execution_identity_after STRUCT PublicProcessExecutionIdentity
  0x955e session_started_at_unix_nanoseconds U64
  0x955f session_finished_at_unix_nanoseconds U64, not less than `955e`
  0x9560 dynamic_code_status_observation_sha256 SHA256, SHA-256 of `9561`
  0x9561 dynamic_code_status_observation STRUCT DynamicCodeStatusObservation,
                                           actor profile 1
  0x9562 held_builder_fd_through_session BOOL, exactly true
  0x9563 static_lookup_count       U32, exactly 2
  0x9564 dynamic_lookup_count      U32, exactly 2
  0x9565 result                    U32, exactly 1

PolicyBootstrapObservation
  0x9571 observation_version       U32, exactly 1
  0x9572 compiled_policy_leaf      BYTES, exact ASCII `g4-l10-policy-v2.bin`
  0x9573 installation_parent_component_sequence_sha256 SHA256, derived kind 13
  0x9574 installation_parent_component_sequence STRUCT ComponentSequence,
                                           authority slot 1
  0x9575 installation_parent_identity STRUCT DirectoryIdentity,
                                           authority slot 1
  0x9576 held_helper_file_identity STRUCT ProtectedFileIdentity
  0x9577 held_policy_file_identity STRUCT ProtectedFileIdentity
  0x9578 complete_policy_frame_length U64, 56..16,777,272
  0x9579 complete_policy_frame_sha256 SHA256
  0x957a protocol_spec_sha256      SHA256, equal parsed policy `1001`
  0x957b policy_root_identity_sha256 SHA256, derived kind 34
  0x957c policy_root_identity      STRUCT ActorIdentity, kind 2 bit 0
  0x957d policy_statement_sha256   SHA256, derived kind 51
  0x957e signature_algorithm       U32, exactly 1 Ed25519
  0x957f detached_signature       BYTES, exactly 64
  0x9580 streaming_buffer_size     U32, 1..1,048,576
  0x9581 exact_header_byte_count   U32, exactly 56
  0x9582 declared_payload_length   U64, 1..16,777,216
  0x9583 declared_payload_sha256   SHA256
  0x9584 embedded_root_signature_verified BOOL, exactly true
  0x9585 post_signature_metadata_validated BOOL, exactly true
  0x9586 stable_parent_scan_set_sha256 SHA256, derived kind 56
  0x9587 stable_parent_scan_pass_count U32, exactly 2
  0x9588 stable_parent_scan_passes LIST NamespaceScanPass, exact count
  0x9589 helper_parent_policy_fds_retained BOOL, exactly true
  0x958a policy_open_flags         U32, exact SDK-bound
                                           `O_RDONLY|O_NOFOLLOW|O_CLOEXEC`
  0x958b result                    U32, exactly 1

LauncherBuildRootScanPass
  0x9591 ordinal                   U32, contiguous 0..3
  0x9592 scan_phase                U32: 1 pre-materialization ordinals 0/1,
                                           2 final ordinals 2/3
  0x9593 disposable_build_root_identity STRUCT DirectoryIdentity,
                                           authority slot 2
  0x9594 tree_member_count         U32, zero phase 1; 1..16,384 phase 2
  0x9595 tree_members              LIST LauncherBuildRootScanMember, exact count
  0x9596 tree_scan_sha256          SHA256, derived kind 180
  0x9597 started_at_unix_nanoseconds U64
  0x9598 finished_at_unix_nanoseconds U64, not less than `9597`
  0x9599 complete                  BOOL, exactly true
  0x959a result                    U32, exactly 1
  0x959b root_fd_retained          BOOL, exactly true
  0x959c root_identity_after       STRUCT DirectoryIdentity,
                                           byte-identical to `9593`
  0x959d build_tree_projection_sha256 SHA256, derived kind 74 over exact
                                           `9665` BuildTreeMember projection
  0x959e artifact_readback_boundary_unix_nanoseconds U64; zero phase 1,
                                           phase 2 not greater than `9597`

LauncherChildFDInventoryPass
  0x95b1 ordinal                   U32, exactly 0 or 1
  0x95b2 execution_ordinal         U32, 0..2,047
  0x95b3 observation_phase         U32: 1 immediately after fork before
                                           dup2/close, 2 immediately before execve
  0x95b4 fd_record_count           U32, 9..65,536 phase 1, exactly 3 phase 2
  0x95b5 fd_records                LIST LauncherChildFDRecord, exact count,
                                           sorted by FD number and duplicate-free
  0x95b6 fd_record_set_sha256      SHA256, derived kind 170
  0x95b7 complete                  BOOL, exactly true
  0x95b8 result                    U32, exactly 1

LauncherChildFDRecord
  0x95c1 ordinal                   U32, contiguous after FD-number sorting
  0x95c2 fd_number                 U32, 0..65,535, unique within pass
  0x95c3 fd_role                   U32: 1 child stdin pipe, 2 child stdout pipe,
                                           3 child stderr pipe, 4 parent stdin peer,
                                           5 parent stdout peer, 6 parent stderr peer,
                                           7 selected tool executable, 8 build root,
                                           9 registered held input, 10 registered output,
                                           11 inherited non-authority descriptor
  0x95c4 proc_fdtype               U32, exact public `proc_fdinfo.proc_fdtype`
  0x95c5 object_kind               U32: 1 anonymous pipe, 2 ordinary/directory
                                           vnode; every other FD type forbidden
  0x95c6 access_mode               U32: 1 read-only, 2 write-only, 3 read-write
  0x95c7 fcntl_status_flags        U32, exact successful `fcntl(F_GETFL)` value
  0x95c8 descriptor_flags          U32, exact successful `fcntl(F_GETFD)` value
  0x95c9 vnode_identity_sha256     SHA256, derived kind 15; required object kind 2,
                                           forbidden object kind 1
  0x95ca vnode_identity            STRUCT CanonicalIdentityMember, kind 2 or 3;
                                           required object kind 2, forbidden kind 1
  0x95cb pipe_handle               U64, nonzero and required object kind 1,
                                           forbidden object kind 2
  0x95cc pipe_endpoint_observation_sha256 SHA256, derived kind 96;
                                           required object kind 1, forbidden kind 2
  0x95cd pipe_endpoint_observation STRUCT PipeEndpointObservation;
                                           required object kind 1, forbidden kind 2
  0x95ce origin_phase1_fd_number   U32; own FD for phase-1 roles 1..3,
                                           selected source FD for phase-2 roles 1..3,
                                           `0xffffffff` otherwise
  0x95cf retained_by_parent        BOOL, true exactly phase-1 roles 4..6
  0x95d0 survives_exec_open_file_description BOOL, true exactly roles 1..3
  0x95d1 result                    U32, exactly 1

LauncherParentFDRecord
  0x98a1 ordinal                   U32, contiguous after FD-number sorting
  0x98a2 fd_number                 U32, 0..65,535, unique within pass
  0x98a3 transport_role            U32: 0 nontransport, 1 child request-read copy,
                                           2 child response-write copy,
                                           3 child diagnostic-write copy,
                                           4 retained parent request-write,
                                           5 retained parent response-read,
                                           6 retained parent diagnostic-read
  0x98a4 proc_fdtype               U32, exact public `proc_fdinfo.proc_fdtype`
  0x98a5 access_mode               U32: 1 read-only, 2 write-only, 3 read-write
  0x98a6 fcntl_status_flags        U32, exact successful `fcntl(F_GETFL)`
  0x98a7 descriptor_flags          U32, exact successful `fcntl(F_GETFD)`
  0x98a8 pipe_endpoint_sha256      SHA256, derived kind 96; required roles 1..6,
                                           forbidden role 0
  0x98a9 pipe_endpoint             STRUCT PipeEndpointObservation; required roles
                                           1..6, forbidden role 0
  0x98aa pipe_handle               U64, equal `98a9.8128` roles 1..6; zero role 0
  0x98ab pipe_peer_handle          U64, equal `98a9.8129` roles 1..6; zero role 0
  0x98ac configuration_identity_sha256 SHA256, derived kind 48
  0x98ad result                    U32, exactly 1

LauncherParentFDInventoryPass
  0x98c1 ordinal                   U32, exactly 0 or 1
  0x98c2 context_kind              U32: 1 build execution, 2 lifecycle test
  0x98c3 context_ordinal           U32, enclosing execution or test ordinal
  0x98c4 observation_phase         U32: 1 immediately after fork before any
                                           parent close, 2 after exactly three
                                           parent closes and before decision/wait
  0x98c5 fd_record_count           U32, 6..65,536 phase 1; 3..65,536 phase 2
  0x98c6 fd_records                LIST LauncherParentFDRecord, exact count
  0x98c7 fd_record_set_sha256      SHA256, derived kind 184
  0x98c8 parent_execution_identity_sha256 SHA256, derived kind 97
  0x98c9 parent_execution_identity STRUCT PublicProcessExecutionIdentity
  0x98ca complete                  BOOL, exactly true
  0x98cb result                    U32, exactly 1

LauncherParentCloseObservation
  0x98d1 ordinal                   U32, contiguous 0..2 in request/response/
                                           diagnostic slot order
  0x98d2 context_kind              U32: 1 build execution, 2 lifecycle test
  0x98d3 context_ordinal           U32, enclosing execution or test ordinal
  0x98d4 closed_fd                 U32, equal selected phase-1 role 1..3 `98a2`
  0x98d5 phase1_parent_fd_record_sha256 SHA256, SHA-256 of that complete record
  0x98d6 closed_transport_role     U32, exactly ordinal plus one
  0x98d7 closed_endpoint_sha256    SHA256, equal selected record `98a8`
  0x98d8 closed_endpoint           STRUCT PipeEndpointObservation,
                                           byte-identical to selected `98a9`
  0x98d9 return_code_bits          U32, exact successful zero signed-return bits
  0x98da errno_after_success       U32, exactly zero canonicalized by harness
  0x98db started_at_unix_nanoseconds U64
  0x98dc finished_at_unix_nanoseconds U64, not less than `98db`
  0x98dd parent_execution_identity_sha256 SHA256, equal both pass `98c8`
  0x98de result                    U32, exactly 1

LauncherFcntlSetFlagsObservation
  0x98e1 ordinal                   U32, contiguous 0..2 in request/response/
                                           diagnostic slot order
  0x98e2 context_kind              U32: 1 build execution, 2 lifecycle test
  0x98e3 context_ordinal           U32, enclosing execution or test ordinal
  0x98e4 configuration_slot        U32, exactly equal `98e1`
  0x98e5 child_endpoint_role       U32, exactly `98e1 + 1`
  0x98e6 target_child_fd           U32, selected pipe child endpoint, 3..65,535
  0x98e7 reciprocal_parent_peer_fd U32, selected opposite endpoint, 3..65,535
  0x98e8 endpoint_access_mode      U32: 1 ordinal 0, 2 ordinals 1/2
  0x98e9 getfl_before_return_bits  U32, exact access-mode bits with
                                           `O_NONBLOCK` clear and no unknown bit
  0x98ea getfl_before_errno        U32, exactly zero canonicalized by launcher
  0x98eb getfl_before_started_at_unix_nanoseconds U64
  0x98ec getfl_before_finished_at_unix_nanoseconds U64,
                                           not less than `98eb`
  0x98ed requested_status_flags    U32, exactly `98e9 | O_NONBLOCK`
  0x98ee setfl_return_code_bits    U32, exact successful zero signed-return bits
  0x98ef setfl_errno_after_success U32, exactly zero canonicalized by launcher
  0x98f0 setfl_started_at_unix_nanoseconds U64, not less than `98ec`
  0x98f1 setfl_finished_at_unix_nanoseconds U64, not less than `98f0`
  0x98f2 getfl_after_return_bits   U32, exactly equal `98ed`
  0x98f3 getfl_after_errno         U32, exactly zero canonicalized by launcher
  0x98f4 getfl_after_started_at_unix_nanoseconds U64, not less than `98f1`
  0x98f5 getfl_after_finished_at_unix_nanoseconds U64, not less than `98f4`
  0x98f6 phase1_parent_child_copy_record_sha256 SHA256, SHA-256 of exact
                                           context phase-1 role `98e5` record
  0x98f7 target_descriptor_flags  U32, exactly zero and equal post-setter pipe/
                                           phase-1 record `F_GETFD`
  0x98f8 descriptor_flag_mutation_call_count U32, exactly zero
  0x98f9 changed_status_flag_mask U32, exactly SDK-bound `O_NONBLOCK`
  0x98fa reciprocal_peer_setfl_call_count U32, exactly zero
  0x98fb completed_before_fork     BOOL, exactly true
  0x98fc result                    U32, exactly 1

LauncherCommandArtifactBinding
  0x95e1 ordinal                   U32, contiguous within enclosing command
  0x95e2 command_ordinal           U32, equal enclosing command `93b1`
  0x95e3 argument_ordinal          U32, 0..255, selects exactly one `93bc` member
  0x95e4 option_argument_ordinal   U32, 0..255 or `0xffffffff`; when present,
                                           strictly less than `95e3`
  0x95e5 artifact_ordinal          U32, 0..8,191
  0x95e6 direction                 U32: 1 consumed input, 2 produced output
  0x95e7 token_profile             U32: 1 standalone BUILD_REL_PATH,
                                           2 ASCII prefix immediately concatenated,
                                           3 ASCII prefix plus `=` then path
  0x95e8 token_prefix_bytes        BYTES, empty profile 1; 1..64 exact ASCII
                                           profiles 2/3
  0x95e9 artifact_relative_path    BUILD_REL_PATH, byte-identical to selected
                                           LauncherBuildArtifact `9422`
  0x95ea selected_argument_sha256  SHA256, SHA-256 of complete selected
                                           DiagnosticByteString
  0x95eb result                    U32, exactly 1

LauncherPipeCreationObservation
  0x9601 ordinal                   U32, contiguous 0..2
  0x9602 execution_ordinal         U32, 0..2,047
  0x9603 pipe_role                 U32: 1 stdin, 2 stdout, 3 stderr;
                                           exactly ordinal plus one
  0x9604 read_fd                   U32, 3..65,535, unique across all six ends
  0x9605 write_fd                  U32, 3..65,535, unique across all six ends
  0x9606 read_status_flags         U32, final post-kind-190/pre-fork successful
                                           `fcntl(F_GETFL)`
  0x9607 read_descriptor_flags     U32, exact successful `fcntl(F_GETFD)`
  0x9608 read_endpoint_sha256      SHA256, derived kind 96
  0x9609 read_endpoint             STRUCT PipeEndpointObservation, mode 1
  0x960a write_status_flags        U32, final post-kind-190/pre-fork successful
                                           `fcntl(F_GETFL)`
  0x960b write_descriptor_flags    U32, exact successful `fcntl(F_GETFD)`
  0x960c write_endpoint_sha256     SHA256, derived kind 96
  0x960d write_endpoint            STRUCT PipeEndpointObservation, mode 2
  0x960e return_code_bits          U32, exact successful zero signed-return bits
  0x960f errno_after_success       U32, exactly zero canonicalized by harness
  0x9610 started_at_unix_nanoseconds U64
  0x9611 finished_at_unix_nanoseconds U64, not less than `9610`
  0x9612 reciprocal_peer_handles   BOOL, exactly true
  0x9613 phase1_read_record_sha256 SHA256, SHA-256 of exact phase-1 record
  0x9614 phase1_write_record_sha256 SHA256, SHA-256 of exact phase-1 record
  0x9615 result                    U32, exactly 1

LauncherFchdirObservation
  0x9621 execution_ordinal         U32, 0..2,047
  0x9622 requested_fd              U32, 3..65,535
  0x9623 phase1_fd_record_sha256   SHA256, SHA-256 of exact phase-1 role-8 record
  0x9624 requested_root_identity_sha256 SHA256, derived kind 15 identity kind 2
  0x9625 requested_root_identity   STRUCT CanonicalIdentityMember, kind 2
  0x9626 return_code_bits          U32, exact successful zero signed-return bits
  0x9627 errno_after_success       U32, exactly zero canonicalized by harness
  0x9628 cwd_identity_after_sha256 SHA256, equal `9624`
  0x9629 started_at_unix_nanoseconds U64
  0x962a finished_at_unix_nanoseconds U64, not less than `9629`
  0x962b result                    U32, exactly 1

LauncherDup2Observation
  0x9631 ordinal                   U32, contiguous 0..2
  0x9632 execution_ordinal         U32, 0..2,047
  0x9633 source_fd                 U32, 3..65,535, distinct across rows
  0x9634 destination_fd            U32, exactly ordinal, hence 0/1/2
  0x9635 source_phase1_record_sha256 SHA256, exact role `ordinal+1` record
  0x9636 replaced_phase1_record_sha256 SHA256, exact old destination-FD record
  0x9637 source_endpoint_before_sha256 SHA256, derived kind 96
  0x9638 source_endpoint_before    STRUCT PipeEndpointObservation
  0x9639 destination_endpoint_after_sha256 SHA256, derived kind 96
  0x963a destination_endpoint_after STRUCT PipeEndpointObservation
  0x963b return_fd                 U32, equal `9634`
  0x963c errno_after_success       U32, exactly zero canonicalized by harness
  0x963d descriptor_flags_after   U32, `FD_CLOEXEC` clear, unknown bits zero
  0x963e started_at_unix_nanoseconds U64
  0x963f finished_at_unix_nanoseconds U64, not less than `963e`
  0x9640 result                    U32, exactly 1

LauncherCloseObservation
  0x9641 ordinal                   U32, contiguous in actual child close-call order
  0x9642 execution_ordinal         U32, 0..2,047
  0x9643 closed_fd                 U32, 3..65,535, unique
  0x9644 phase1_fd_record_sha256   SHA256, SHA-256 of exact phase-1 record
  0x9645 fd_role                   U32, equal selected phase-1 `95c3`
  0x9646 return_code_bits          U32, exact successful zero signed-return bits
  0x9647 errno_after_success       U32, exactly zero canonicalized by harness
  0x9648 started_at_unix_nanoseconds U64
  0x9649 finished_at_unix_nanoseconds U64, not less than `9648`
  0x964a result                    U32, exactly 1

LauncherSyscallStep
  0x9651 ordinal                   U32, contiguous canonical lifecycle order
  0x9652 execution_ordinal         U32, 0..2,047
  0x9653 process_branch            U32: 1 builder before fork, 2 child,
                                           3 builder after fork
  0x9654 branch_step_ordinal       U32, contiguous within branch
  0x9655 operation_kind            U32: 1 pipe, 2 fork, 3 phase-1 inventory,
                                           4 fchdir, 5 dup2, 6 close,
                                           7 phase-2 inventory, 8 execve, 9 waitpid,
                                           10 parent FD inventory,
                                           11 child nonblocking flag setup
  0x9656 referenced_ordinal        U32: selected pipe/dup2/child-close/
                                           parent-close/pass/child-nonblock-setup
                                           ordinal;
                                           `0xffffffff` kinds 2/4/8/9
  0x9657 started_at_unix_nanoseconds U64
  0x9658 finished_at_unix_nanoseconds U64, not less than `9657`
  0x9659 expected_success_semantics U32: 1 returned zero, 2 returned requested FD,
                                           3 execve did not return, 4 complete inventory,
                                           5 returned exact child PID,
                                           6 two successful F_GETFL reads around one
                                             successful F_SETFL
  0x965a result                    U32, exactly 1

LauncherBuildRootScanMember
  0x9661 ordinal                   U32, contiguous after path sorting
  0x9662 build_relative_path       BUILD_REL_PATH, unique and file-prefix-valid
  0x9663 object_type               U32: 1 ordinary file, 2 directory
  0x9664 build_tree_member_sha256  SHA256, SHA-256 of canonical `9665`
  0x9665 build_tree_member         STRUCT BuildTreeMember, same ordinal/path/type
  0x9666 full_identity_sha256      SHA256, derived kind 15
  0x9667 full_identity             STRUCT CanonicalIdentityMember,
                                           kind 3 file or kind 2 directory
  0x9668 held_fd_retained          BOOL, exactly true
  0x9669 opened_nofollow_from_retained_root BOOL, exactly true
  0x966a first_identity_observed_at_unix_nanoseconds U64
  0x966b readback_finished_at_unix_nanoseconds U64, not less than `966a`
  0x966c second_identity_observed_at_unix_nanoseconds U64,
                                           not less than `966b`
  0x966d content_streamed_from_held_fd BOOL, true file, false directory
  0x966e artifact_ordinal          U32, required file and 0..8,191;
                                           `0xffffffff` directory
  0x966f result                    U32, exactly 1

LauncherTransportEndpointObservation
  0x9681 ordinal                   U32, contiguous 0..5
  0x9682 configuration_slot        U32, 0 request, 1 response, 2 diagnostic
  0x9683 process_side              U32: 1 child, 2 retained parent peer
  0x9684 endpoint_role             U32: 1 child request-read, 2 child response-write,
                                           3 child diagnostic-write, 4 parent request-write,
                                           5 parent response-read, 6 parent diagnostic-read
  0x9685 creation_fd               U32, 3..65,535, unique across six endpoints
  0x9686 decision_fd               U32, child exactly slot 0/1/2; parent equal `9685`
  0x9687 access_mode               U32: 1 read-only, 2 write-only
  0x9688 proc_fdtype               U32, exact SDK-bound `PROX_FDTYPE_PIPE`
  0x9689 status_flags_before       U32, exact successful `fcntl(F_GETFL)`
  0x968a status_flags_after        U32, exact successful `fcntl(F_GETFL)`
  0x968b descriptor_flags_before   U32, exact successful `fcntl(F_GETFD)`
  0x968c descriptor_flags_after    U32, exact successful `fcntl(F_GETFD)`
  0x968d endpoint_before_sha256    SHA256, derived kind 96
  0x968e endpoint_before           STRUCT PipeEndpointObservation
  0x968f endpoint_after_sha256     SHA256, derived kind 96
  0x9690 endpoint_after            STRUCT PipeEndpointObservation
  0x9691 reciprocal_peer_ordinal   U32, 0..5, selects opposite side same slot
  0x9692 duplicate_child_fd_closed_before_exec BOOL, true child, false parent
  0x9693 retained_through_decision BOOL, exactly true
  0x9694 dup2_source_fd            U32, child equal `9685`; parent `0xffffffff`
  0x9695 configuration_identity_sha256 SHA256, derived kind 48
  0x9696 result                    U32, exactly 1
  0x9697 pipe_call_ordinal         U32, equal `9682`
  0x9698 pipe_call_return_code_bits U32, exact successful zero signed-return bits
  0x9699 pipe_call_started_at_unix_nanoseconds U64
  0x969a pipe_call_finished_at_unix_nanoseconds U64, not less than `9699`;
                                           byte-identical within reciprocal pair
  0x969b dup2_return_fd            U32, child equal `9686`; parent `0xffffffff`
  0x969c dup2_errno_after_success  U32, zero child; `0xffffffff` parent
  0x969d dup2_started_at_unix_nanoseconds U64, required child; zero parent
  0x969e dup2_finished_at_unix_nanoseconds U64, not less than `969d` child;
                                           zero parent
  0x969f duplicate_close_return_code_bits U32, zero child; `0xffffffff` parent
  0x9751 duplicate_close_errno_after_success U32, zero child; `0xffffffff` parent
  0x9752 duplicate_close_started_at_unix_nanoseconds U64, required child;
                                           zero parent
  0x9753 duplicate_close_finished_at_unix_nanoseconds U64,
                                           not less than `9752` child; zero parent
  0x9754 endpoint_lifecycle_result U32, exactly 1

LauncherTransportSlotBinding
  0x96a1 ordinal                   U32, contiguous 0..2, equal configuration slot
  0x96a2 required_endpoint_role    U32, exactly ordinal plus one
  0x96a3 required_access_mode      U32, 1 slot 0, 2 slots 1/2
  0x96a4 canonical_endpoint_ordinal U32, exact child endpoint for slot
  0x96a5 presented_endpoint_ordinal U32, 0..5
  0x96a6 presented_fd              U32, equal selected endpoint `9686`
  0x96a7 validation_class          U32: 1 exact, 2 endpoint alias,
                                           3 direction mismatch, 4 status drift
  0x96a8 expected_decision         U32: 1 admit, 2 reject
  0x96a9 configuration_identity_sha256 SHA256, derived kind 48
  0x96aa result                    U32, exactly 1

LauncherTransportLifecycleObservation
  0x96b1 observation_version       U32, exactly 1
  0x96b2 test_profile              U32, exactly enclosing test profile
  0x96b3 lifecycle_profile         U32, equal selected vector `93f5`, nonzero
  0x96b4 launcher_configuration_identity_sha256 SHA256, derived kind 48
  0x96b5 pipe_create_count         U32, exactly 3
  0x96b6 endpoint_set_sha256       SHA256, derived kind 177
  0x96b7 endpoint_count            U32, exactly 6
  0x96b8 endpoints                 LIST LauncherTransportEndpointObservation,
                                           exact count
  0x96b9 slot_binding_set_sha256   SHA256, derived kind 178
  0x96ba slot_binding_count        U32, exactly 3
  0x96bb slot_bindings             LIST LauncherTransportSlotBinding, exact count
  0x96bc child_fd_count            U32, 3 or 4, equal selected vector `93e2`
  0x96bd retained_parent_peer_count U32, exactly 3, equal selected vector `93e3`
  0x96be injected_extra_fd         STRUCT FixtureChildFDRecord,
                                           required lifecycle profile 2 only
  0x96bf expected_decision         U32, equal selected vector `93de`
  0x96c0 observed_decision         U32, equal `96bf`
  0x96c1 protected_or_runtime_effect_mask U64, exactly zero
  0x96c2 result                    U32, exactly 1
  0x96c3 child_transport_fd_inventory_sha256 SHA256, SHA-256 of canonical
                                           child endpoint projection plus optional extra
  0x96c4 parent_peer_fd_inventory_sha256 SHA256, SHA-256 of canonical parent
                                           endpoint projection
  0x96c5 child_transport_fd_inventory_complete BOOL, exactly true
  0x96c6 parent_peer_fd_inventory_complete BOOL, exactly true
  0x96c7 dup2_call_count           U32, exactly 3
  0x96c8 child_duplicate_close_call_count U32, exactly 3
  0x96c9 typed_pipe_call_count     U32, exactly 3
  0x97b1 parent_fd_inventory_pass_set_sha256 SHA256, derived kind 185
  0x97b2 parent_fd_inventory_pass_count U32, exactly 2
  0x97b3 parent_fd_inventory_passes LIST LauncherParentFDInventoryPass,
                                           exact count
  0x97b4 parent_close_observation_set_sha256 SHA256, derived kind 186
  0x97b5 parent_close_observation_count U32, exactly 3
  0x97b6 parent_close_observations LIST LauncherParentCloseObservation,
                                           exact count
  0x97b7 parent_duplicate_close_call_count U32, exactly 3
  0x97b8 child_nonblock_setup_set_sha256 SHA256, derived kind 190
  0x97b9 child_nonblock_setup_count U32, exactly 3
  0x97ba child_nonblock_setups     LIST LauncherFcntlSetFlagsObservation,
                                           exact count
  0x97bb fcntl_setfl_call_count    U32, exactly 3
  0x97bc setup_fcntl_getfl_call_count U32, exactly 6
  0x97bd fork_started_at_unix_nanoseconds U64, strictly greater than every
                                           `97ba.98f5`
  0x97be fork_finished_at_unix_nanoseconds U64, not less than `97bd`
  0x97bf fork_parent_return_pid     U32, nonzero exact observed child PID
  0x97c0 fork_child_return_pid      U32, exactly zero
  0x97c1 fork_call_count            U32, exactly 1
  0x97c2 child_execution_identity_sha256 SHA256, derived kind 97
  0x97c3 child_execution_identity   STRUCT PublicProcessExecutionIdentity

OSBuildIdentity
  0x4f11 product_name_bytes           BYTES, 1..255 exact `kern.ostype`
  0x4f12 product_version_bytes        BYTES, 1..255 exact `kern.osproductversion`
  0x4f13 build_version_bytes          BYTES, 1..255 exact `kern.osversion`
  0x4f14 kernel_release_bytes         BYTES, 1..255 exact `kern.osrelease`
  0x4f15 kernel_version_bytes         BYTES, 1..1,024 exact `kern.version`
  0x4f16 security_framework_sha256    SHA256, non-authoritative held reference artifact
  0x4f17 libc_sha256                  SHA256, non-authoritative held reference artifact
  0x4f18 security_framework_content   STRUCT ReviewedObjectMember, reference only
  0x4f19 libc_content                 STRUCT ReviewedObjectMember, reference only

SDKIdentity
  0x4f21 sdk_name_bytes               BYTES, 1..255 exact ASCII
  0x4f22 sdk_version_bytes            BYTES, 1..255 exact ASCII
  0x4f23 sdk_build_version_bytes      BYTES, 1..255 exact ASCII
  0x4f24 platform_name_bytes          BYTES, exactly `macosx`
  0x4f25 sdk_settings_sha256          SHA256, complete SDKSettings bytes
  0x4f26 required_header_manifest_sha256 SHA256, derived kind 21
  0x4f27 symbol_to_contract_mapping_sha256 SHA256, derived kind 54
  0x4f28 symbol_to_contract_mapping_count U32, 1..1,024
  0x4f29 symbol_to_contract_mappings LIST SymbolMappingMember, exact count
  0x4f2a required_header_source_unit_count U32, 1..1,024
  0x4f2b required_header_source_units LIST BuildSourceUnit, exact count
  0x4f2c sdk_settings_content         STRUCT ReviewedObjectMember
  0x4f2d sdk_build_version_output     STRUCT ReviewedObjectMember
  0x4f2e canonical_empty_entitlements_sha256 SHA256
  0x4f2f canonical_empty_entitlements_content STRUCT ReviewedObjectMember
  0x4f30 sdk_abi_binding_set_sha256 SHA256, derived kind 90
  0x4f31 sdk_abi_binding_count     U32, exactly 71
  0x4f32 sdk_abi_bindings          LIST SDKABIBinding, exact count
  0x4f33 abi_compile_probe_source  STRUCT BuildSourceUnit, role 5
  0x4f34 abi_compile_probe_source_sha256 SHA256, equal `4f33.6104`
  0x4f35 kern_proc_layout_binding_set_sha256 SHA256, derived kind 101
  0x4f36 kern_proc_layout_binding_count U32, exactly 15
  0x4f37 kern_proc_layout_bindings LIST KernProcLayoutBinding, exact count
  0x4f38 kern_proc_compile_probe_source_sha256 SHA256, equal `4f34`
  0x4f39 fd_transport_layout_binding_set_sha256 SHA256, derived kind 116
  0x4f3a fd_transport_layout_binding_count U32, exactly 52
  0x4f3b fd_transport_layout_bindings LIST DarwinFDTransportLayoutBinding,
                                         exact count
  0x4f3c fd_transport_compile_probe_source_sha256 SHA256, equal `4f34`
  0x4f3d acl_native_mapping_set_sha256 SHA256, derived kind 117
  0x4f3e acl_native_mapping_count    U32, exactly 32
  0x4f3f acl_native_mappings         LIST ACLNativeMappingBinding, exact count
  0x4f40 acl_compile_probe_source_sha256 SHA256, equal `4f34`
  0x4f41 execve_argument_limit_identity_sha256 SHA256, derived kind 140
  0x4f42 execve_argument_limit_identity STRUCT ExecveArgumentLimitIdentity
  0x4f43 parent_launcher_sdk_layout_binding_set_sha256 SHA256, derived kind 148
  0x4f44 parent_launcher_sdk_layout_binding_count U32, exactly 32
  0x4f45 parent_launcher_sdk_layout_bindings LIST ParentLauncherSDKLayoutBinding,
                                         exact count
  0x4f46 parent_launcher_compile_probe_source_sha256 SHA256, equal `4f34`
  0x4f47 poll_decision_binding_set_sha256 SHA256, derived kind 147
  0x4f48 poll_decision_binding_count U32, exactly 21
  0x4f49 poll_decision_bindings   LIST PollDecisionBinding, exact count

KernProcLayoutBinding
  0x8401 ordinal                    U32, contiguous 0..14
  0x8402 selector                   U32, exact closed table below
  0x8403 canonical_field_path      BYTES, 1..255 exact ASCII
  0x8404 byte_offset               U64
  0x8405 byte_size                 U64, 1..4,096
  0x8406 nominal_type_bytes        BYTES, 1..255 exact ASCII SDK spelling
  0x8407 signedness                U32: 1 unsigned, 2 signed, 3 aggregate
  0x8408 declaring_header_source_ordinal U32, index into `4f2b`
  0x8409 compile_probe_line_sha256 SHA256
  0x840a compile_probe_line_bytes  BYTES, 1..4,096 exact C17 source line
  0x840b value_kind                U32: 1 size/layout selector, 2 integer constant
  0x840c exact_constant_value      U64, required kind 2, forbidden kind 1

DarwinFDTransportLayoutBinding
  0x8801 ordinal                    U32, contiguous 0..51
  0x8802 selector                   U32, equal `8801`, exact closed table below
  0x8803 canonical_field_path       BYTES, 1..255 exact ASCII
  0x8804 byte_offset                U64; zero for selector kind 1
  0x8805 byte_size                  U64, 1..4,096
  0x8806 nominal_type_bytes         BYTES, 1..255 exact ASCII SDK spelling
  0x8807 signedness                 U32: 1 unsigned, 2 signed, 3 aggregate,
                                         4 function-pointer member
  0x8808 declaring_header_source_ordinal U32, index into `4f2b`
  0x8809 compile_probe_line_sha256 SHA256
  0x880a compile_probe_line_bytes  BYTES, 1..4,096 exact C17 source line
  0x880b selector_kind             U32: 1 type/aggregate size, 2 selected field

ACLNativeMappingBinding
  0x8821 ordinal                    U32, contiguous 0..31
  0x8822 mapping_class              U32: 1 entry tag, 2 entry permission,
                                         3 entry-or-ACL flag, 4 control value
  0x8823 contract_selector          U32: tag enum, contract bit index, or
                                         exact control selector below
  0x8824 target_object_mask         U32, nonzero subset of bit 0 ordinary file
                                         and bit 1 directory
  0x8825 disposition                U32: 1 mapped, 2 valid SDK ACL-level flag
                                         that is forbidden present, 3 control
  0x8826 sdk_symbol_bytes           BYTES, 1..255 exact ASCII
  0x8827 sdk_value_width_bits       U32: exactly 32 or 64
  0x8828 sdk_value_signedness       U32: 1 unsigned, 2 signed
  0x8829 sdk_value_bits             U64, exact width-bounded unsigned bit pattern
  0x882a declaring_header_source_ordinal U32, index into `4f2b`
  0x882b compile_probe_line_sha256 SHA256
  0x882c compile_probe_line_bytes  BYTES, 1..4,096 exact C17 source line
  0x882d result                     U32, exactly 1

NativeACLEntryObservation
  0x8841 ordinal                    U32, contiguous HMG4A2 entry order
  0x8842 source_entry_sha256        SHA256, SHA-256 of exact `8843`
  0x8843 source_entry_bytes         BYTES, exactly 40
  0x8844 contract_tag               U32, exactly 1 or 2 from source entry
  0x8845 expected_sdk_tag_value     U32, exact kind-117 mapping
  0x8846 qualifier_uuid             BYTES, exactly 16, equal source entry
  0x8847 contract_permission_mask   U64, bits 0..13 only, equal source entry
  0x8848 expected_native_permission_mask U64, exact kind-117 projection
  0x8849 observed_native_permission_mask U64, equal `8848`
  0x884a contract_entry_flag_mask   U64, bits 0..4 only, equal source entry
  0x884b expected_native_entry_flag_mask U64, exact kind-117 rows 20..24 projection
  0x884c observed_native_entry_flag_mask U64, equal `884b`
  0x884d construction_step_mask     U64, exactly 0x7f
  0x884e readback_step_mask         U64, exactly 0x1f
  0x884f qualifier_freed            BOOL, exactly true
  0x8850 result                     U32, exactly 1

NativeACLMaterializationObservation
  0x8861 observation_version        U32, exactly 1
  0x8862 source_acl_sha256           SHA256, SHA-256 of exact `8864`
  0x8863 source_acl_length           U64, 16..5,136 and exactly
                                         `16 + 40 * 8865`
  0x8864 source_acl_bytes            BYTES, exact `8863`, canonical HMG4A2
  0x8865 source_entry_count          U32, 0..selected SDK `ACL_MAX_ENTRIES`
  0x8866 target_object_type          U32: 1 ordinary file, 2 directory
  0x8867 sdk_identity_sha256         SHA256, equal enclosing fixture observation `7f27`
  0x8868 sdk_abi_binding_set_sha256 SHA256, equal SDKIdentity `4f30`
  0x8869 acl_native_mapping_set_sha256 SHA256, equal SDKIdentity `4f3d`
  0x886a entry_observation_set_sha256 SHA256, derived kind 118
  0x886b entry_observation_count     U32, equal `8865`
  0x886c entry_observations          LIST NativeACLEntryObservation, exact count
  0x886d reconstructed_acl_sha256   SHA256, equal `8862`
  0x886e reconstructed_acl_length   U64, equal `8863`
  0x886f reconstructed_acl_bytes    BYTES, byte-identical to `8864`
  0x8870 acl_level_flag_mask        U64, rows 25/26 before-and-after OR,
                                         exactly zero
  0x8871 observed_maximal_permission_mask U64, exact SDK result
  0x8872 expected_maximal_permission_mask U64, equal kind-117 permission OR
  0x8873 acl_valid_return_value     U32, exactly zero
  0x8874 acl_set_fd_return_class    U32, exactly 2 failure
  0x8875 acl_set_fd_errno_value     U32, exactly SDK-bound `EPERM`
  0x8876 errno_captured_before_cleanup BOOL, exactly true
  0x8877 qualifier_allocation_count U32, argument-ACL readback only, equal `8865`
  0x8878 qualifier_free_count       U32, argument-ACL readback only, equal `8877`
  0x8879 acl_free_return_value      U32, exactly zero
  0x887a construction_started_at_unix_nanoseconds U64
  0x887b materialization_ready_at_unix_nanoseconds U64, not less than `887a`
  0x887c syscall_started_at_unix_nanoseconds U64, not less than `887b`
  0x887d syscall_finished_at_unix_nanoseconds U64, not less than `887c`
  0x887e cleanup_finished_at_unix_nanoseconds U64, not less than `887d`
  0x887f result                     U32, exactly 1

DiagnosticByteString
  0x6611 ordinal                     U32, contiguous from zero
  0x6612 bytes                       BYTES, 0..4,096 diagnostic-only bytes

TransactionGrammar
  0x6501 entropy_source              U32, exactly 1 getentropy
  0x6502 entropy_byte_count          U32, exactly 32
  0x6503 textual_encoding            U32, exactly 1 lowercase-hex
  0x6504 textual_length              U32, exactly 64
  0x6505 reject_all_zero             BOOL, exactly true
  0x6506 candidate_draw_limit         U32, exactly 16 total candidates,
                                         including the first draw

TimePolicy
  0x6701 maximum_future_skew_seconds U64, exactly 60
  0x6702 capability_max_age_seconds  U64, exactly 86,400
  0x6703 quiescence_max_age_seconds  U64, exactly 300
  0x6704 authorization_max_age_seconds U64, exactly 900
  0x6705 request_deadline_seconds     U64, exactly 30
  0x6706 response_deadline_seconds    U64, exactly 30
  0x6707 expiry_is_exclusive          BOOL, exactly true

EvidenceTrustRule
  0x6801 evidence_role               U32, one exact role
  0x6802 issuer_identity_sha256      SHA256
  0x6803 object_magic                BYTES, exactly 8
  0x6804 header_discriminator_set_sha256 SHA256, derived kind 50
  0x6805 protected_parent_ordinal    U32
  0x6806 path_template               U32, exact role template
  0x6807 maximum_age_seconds         U64
  0x6808 require_pass_result         BOOL
  0x6809 framing_profile             U32: 1 successor 56-byte frame,
                                         2 predecessor bundle 96-byte frame
  0x680a attestation_profile         U32: 1 signed-policy fixed hash,
                                         2 evidence-attestation kind 57,
                                         3 authorization-statement kind 43
  0x680b required_signer_role_bit    U32, 0..13
  0x680c header_discriminator_count  U32, 1..6
  0x680d header_discriminators       LIST HeaderDiscriminatorMember, exact count

RoleMetadataPolicy
  0x6901 object_role                 U32
  0x6902 owner_uid                   U32
  0x6903 group_gid                   U32
  0x6904 mode_bits                   U32
  0x6905 flags                       U32
  0x6906 acl_sha256                  SHA256
  0x6907 xattr_policy_sha256         SHA256
  0x6908 link_count                  U32, 1..65,535; exactly 1 for ordinary-file
                                         policy and exact setup-/source-observed,
                                         stable `st_nlink` for directory policy
  0x6909 object_type                 U32, exact role type

EvidenceLocation
  0x6301 object_role                 U32
  0x6302 protected_parent_ordinal    U32
  0x6303 path_template               U32, exact role template
  0x6304 object_magic                BYTES, exactly 8
  0x6305 header_discriminator_set_sha256 SHA256, derived kind 50
  0x6306 framing_profile             U32: 1 successor 56-byte frame,
                                         2 predecessor bundle 96-byte frame
  0x6307 maximum_age_seconds         U64
  0x6308 issuer_trust_rule           STRUCT EvidenceTrustRule
  0x6309 metadata_policy             STRUCT RoleMetadataPolicy
  0x630a fixed_object_sha256         SHA256, required only roles 1 and 2
  0x630b exclusive_no_replace        BOOL, exactly true
  0x630c hash_derivation             U32, exactly 1 complete-object SHA-256
  0x630d immediate_parent_component_sequence STRUCT ComponentSequence
  0x630e immediate_parent_identity   STRUCT DirectoryIdentity

IndexRef
  0x7201 index                       U32, 0..113

XattrPolicyBinding
  0x7301 xattr_policy_sha256         SHA256
  0x7302 xattr_set_sha256            SHA256
  0x7303 reference_count             U32, 0..114
  0x7304 referenced_indices          LIST IndexRef, same count
  0x7305 binding_purpose             U32: 1 output indices, 2 fixed-role empty
```

EvidenceLocation role 1 requires `630a=policy 1005` and role 2 requires
`630a=policy 1006`; roles 3..12 forbid it because
their objects are created later or, for role 9, because the exact permitted
hashes are enumerated by `XattrPolicyBinding`. Bindings sort by policy hash;
purpose-1 bindings require count 1..114, indices sort numerically, and all
purpose-1 members in policy `1018` partition 0..113 exactly once. The sole
purpose-2 binding is policy `1039`; it has count zero, an exact empty list,
`7301 == 1038`, and `7302` equal the predecessor canonical empty xattr-set
hash. A repeated
EvidenceTrustRule hash covers the complete canonical STRUCT bytes.

`SDKIdentity.4f27` is recomputed as kind 54 over `4f29`, and `4f28` agrees.
`4f26` is kind 21 over `4f2b`, and `4f2a` agrees; those source units are exact
held SDK headers/settings inputs, not build-source aliases.
`4f30` is kind 90 over `4f32`; `4f31 == 71`. This fixed registry closes every
type/layout-critical function used by the request transport, public process/FD
and parent mapped-vnode/path observations, exact CoreFoundation PID-dictionary
guest lookup, native ACL materialization, denial call, and build-controller
launch profile. It is not the complete callable surface of the production
helper; that separate source-level direct-call closure is a build/U2 obligation.
The ABI registry is exactly:

```text
ordinal/profile  symbol             exact public C function-pointer type                       declaring header
0/1              mbr_uid_to_uuid    int (uid_t, uuid_t)                                        membership.h
1/2              mbr_gid_to_uuid    int (gid_t, uuid_t)                                        membership.h
2/3              mbr_uuid_to_id     int (const uuid_t, id_t *, int *)                          membership.h
3/4              setgroups          int (int, const gid_t *)                                   unistd.h
4/5              setgid             int (gid_t)                                                unistd.h
5/6              setuid             int (uid_t)                                                unistd.h
6/7              getuid             uid_t (void)                                               unistd.h
7/8              geteuid            uid_t (void)                                               unistd.h
8/9              getgid             gid_t (void)                                               unistd.h
9/10             getegid            gid_t (void)                                               unistd.h
10/11            getgroups          int (int, gid_t *)                                         unistd.h
11/12            proc_pidinfo       int (int,int,uint64_t,void *,int)                          libproc.h
12/13            sysctl             int (int *,u_int,void *,size_t *,void *,size_t)            sys/sysctl.h
13/14            sysctlbyname       int (const char *,void *,size_t *,void *,size_t)           sys/sysctl.h
14/15            openat             int (int,const char *,int,...)                              fcntl.h
15/16            mkdirat            int (int,const char *,mode_t)                              sys/stat.h
16/17            renameatx_np       int (int,const char *,int,const char *,unsigned int)       sys/stdio.h
17/18            unlinkat           int (int,const char *,int)                                 unistd.h
18/19            linkat             int (int,const char *,int,const char *,int)                unistd.h
19/20            fchmod             int (int,mode_t)                                           sys/stat.h
20/21            fchown             int (int,uid_t,gid_t)                                      unistd.h
21/22            fchflags           int (int,u_int)                                            sys/stat.h
22/23            acl_set_fd         int (int,acl_t)                                            sys/acl.h
23/24            fsetxattr          int (int,const char *,const void *,size_t,u_int32_t,int)   sys/xattr.h
24/25            proc_pidfdinfo     int (int,int,int,void *,int)                               libproc.h
25/26            poll               int (struct pollfd *,nfds_t,int)                           sys/poll.h
26/27            clock_gettime      int (clockid_t,struct timespec *)                          _time.h
27/28            sigaction          int (int,const struct sigaction *,struct sigaction *)      signal.h
28/29            sigemptyset        int (sigset_t *)                                           signal.h
29/30            fcntl              int (int,int,...)                                          sys/fcntl.h
30/31            fstat              int (int,struct stat *)                                    sys/stat.h
31/32            getpid             pid_t (void)                                               unistd.h
32/33            getppid            pid_t (void)                                               unistd.h
33/34            read               ssize_t (int,void *,size_t)                                unistd.h
34/35            write              ssize_t (int,const void *,size_t)                          unistd.h
35/36            close              int (int)                                                  unistd.h
36/37            getentropy         int (void *,size_t)                                        sys/random.h
37/38            flock              int (int,int)                                              sys/fcntl.h
38/39            fork               pid_t (void)                                               unistd.h
39/40            waitpid            pid_t (pid_t,int *,int)                                    sys/wait.h
40/41            _exit              void (int)                                                 unistd.h
41/42            __error            int * (void)                                               sys/errno.h
42/43            acl_init           acl_t (int)                                                sys/acl.h
43/44            acl_free           int (void *)                                               sys/acl.h
44/45            acl_create_entry_np int (acl_t *,acl_entry_t *,int)                           sys/acl.h
45/46            acl_set_tag_type   int (acl_entry_t,acl_tag_t)                                sys/acl.h
46/47            acl_set_qualifier  int (acl_entry_t,const void *)                             sys/acl.h
47/48            acl_set_permset_mask_np int (acl_entry_t,acl_permset_mask_t)                  sys/acl.h
48/49            acl_get_flagset_np int (void *,acl_flagset_t *)                               sys/acl.h
49/50            acl_clear_flags_np int (acl_flagset_t)                                        sys/acl.h
50/51            acl_add_flag_np    int (acl_flagset_t,acl_flag_t)                             sys/acl.h
51/52            acl_valid          int (acl_t)                                                sys/acl.h
52/53            acl_get_entry      int (acl_t,int,acl_entry_t *)                              sys/acl.h
53/54            acl_get_tag_type   int (acl_entry_t,acl_tag_t *)                              sys/acl.h
54/55            acl_get_qualifier  void * (acl_entry_t)                                       sys/acl.h
55/56            acl_get_permset_mask_np int (acl_entry_t,acl_permset_mask_t *)                sys/acl.h
56/57            acl_maximal_permset_mask_np int (acl_permset_mask_t *)                        sys/acl.h
57/58            acl_get_flag_np    int (acl_flagset_t,acl_flag_t)                             sys/acl.h
58/59            acl_get_fd_np      acl_t (int,acl_type_t)                                     sys/acl.h
59/60            pipe               int (int *)                                                unistd.h
60/61            fchdir             int (int)                                                  unistd.h
61/62            dup2               int (int,int)                                              unistd.h
62/63            execve             int (const char *,char *const *,char *const *)             unistd.h
63/64            proc_pidpath       int (int,void *,uint32_t)                                  libproc.h
64/65            CFNumberCreate     CFNumberRef (CFAllocatorRef,CFNumberType,const void *)      CFNumber.h
65/66            CFDictionaryCreate CFDictionaryRef (CFAllocatorRef,const void **,const void **,
                                      CFIndex,const CFDictionaryKeyCallBacks *,
                                      const CFDictionaryValueCallBacks *)                       CFDictionary.h
66/67            SecCodeCopyGuestWithAttributes OSStatus (SecCodeRef,CFDictionaryRef,
                                      SecCSFlags,SecCodeRef *)                                  SecCode.h
67/68            CFRelease          void (CFTypeRef)                                            CFBase.h
68/69            CFGetTypeID        CFTypeID (CFTypeRef)                                        CFBase.h
69/70            SecKeyGetTypeID    CFTypeID (void)                                             SecKey.h
70/71            CFDataCreate       CFDataRef (CFAllocatorRef,const UInt8 *,CFIndex)             CFData.h
```

These are exact nominal SDK typedefs for the type-compatibility probes, not
permission to substitute an equal-width local type. On the fixed arm64 C ABI,
`int` is signed 32 bits; `unsigned int`,
`uid_t`, `gid_t`, `id_t`, `nfds_t`, and `sigset_t` are unsigned 32 bits;
`pid_t`, `clockid_t`, `acl_tag_t`, `acl_type_t`, `acl_flag_t`, and every shown
enum parameter are signed 32 bits; `mode_t` is unsigned 16 bits; `ssize_t` and
`off_t` are signed 64 bits; `size_t`, `acl_permset_mask_t`, and every pointer
are unsigned-width 64 bits; and `uuid_t` is exactly 16 unsigned bytes. `size_t`
is unsigned long and remains nominally distinct from the equal-width
`uint64_t`; `acl_t`, `acl_entry_t`, and `acl_flagset_t` retain their exact SDK
opaque pointer typedefs rather than `void *`.
Array parameters undergo the standard C pointer adjustment shown by the table,
including `pipe(int[2])` to the profile-60 `int *` parameter and the two
NUL-terminated `execve` arrays to the profile-63 pointer types. Profiles 15
(`openat`) and 30 (`fcntl`) are the only variadic profiles. `openat` receives
the signed-32 default argument promotion of one `mode_t` exactly when `O_CREAT`
is set. Each actual `fcntl` command takes exactly the command-specific third
argument or no third argument frozen by this contract; variadic status never
permits an extra, omitted, or differently promoted value. Every other profile
is nonvariadic. Opaque ACL pointers are never serialized or dereferenced as
authority.

Profiles 64..71 are public macOS SDK calls, not local declarations or SPI.
`uint32_t`, `SecCSFlags`, and the normalized success bits are unsigned 32;
`OSStatus` and the PID value passed to `CFNumberCreate` are signed 32;
`CFIndex` and `CFNumberType` are signed 64 and `CFTypeID` is unsigned 64 on the
fixed arm64 target; `CFAllocatorRef`, `CFNumberRef`, `CFDataRef`, `CFDictionaryRef`,
`CFTypeRef`, `SecCodeRef`, `SecKeyRef`, and every pointer
parameter are exact 64-bit opaque pointer typedefs. Nullable and retained-
result annotations do not change C type compatibility but remain mandatory
ownership semantics. The role-5 probe includes the exact public
CoreFoundation/Security headers and proves all eight function pointer types;
`TARGET_OS_OSX` is true for the pinned macOS target so the public guest-lookup
declaration is present. No equal-width integer, `void *` substitute for an
opaque nominal type, private declaration, `dlsym`, or unreviewed availability
fallback is admitted.

For each binding, checked U64 addition proves `8095 + 8096` is within the
selected `4f2b.6106`; `8097` is byte-identical to that exact slice and `8098`
is its SHA-256. Likewise `809c + 809d` is within `4f33.6106`, `809e` is that
exact unique slice, and `8099 == SHA256(809e)`. Each probe line is the
source-generated `_Static_assert(__builtin_types_compatible_p(__typeof__(&SYMBOL),
EXPECTED_POINTER_TYPE), "abi-NN")` for its one row, with the exact symbol,
pointer type, and zero-padded ordinal from the table. The complete `4f33`
source also asserts all scalar sizes/signedness, opaque-pointer widths,
`sizeof(uuid_t)==16`, `KAUTH_GUID_SIZE==16`, `sizeof(guid_t)==16`, exact
`unsigned char[16]` type/extent of `guid_t.g_guid`, `ID_TYPE_UID==0`, and
`ID_TYPE_GID==1`; it occurs byte-identically as a role-5
U2 source unit. E2 kind 4 compiles it with the exact held U2 compiler and SDK,
arm64 target, C17, warnings-as-errors, no precompiled header/module/plugin/
response file, and syntax-only output; result 1 requires exit zero and exact
empty stdout/stderr. No `dlsym`, private declaration, local replacement
prototype, or asserted `809a=true` without that execution evidence is valid.

`4f39` is kind 116 over `4f3b`, `4f3a==52`, and `4f3c==4f34`. The exact
Darwin FD/transport/process layout selector registry is:

```text
selector  canonical_field_path                         exact nominal type
0         sizeof(struct proc_fdinfo)                   struct proc_fdinfo
1         proc_fdinfo.proc_fd                          int32_t
2         proc_fdinfo.proc_fdtype                      uint32_t
3         sizeof(struct pipe_fdinfo)                   struct pipe_fdinfo
4         pipe_fdinfo.pfi.fi_openflags                 uint32_t
5         pipe_fdinfo.pfi.fi_status                    uint32_t
6         pipe_fdinfo.pfi.fi_offset                    off_t
7         pipe_fdinfo.pfi.fi_type                      int32_t
8         pipe_fdinfo.pfi.fi_guardflags                uint32_t
9         pipe_fdinfo.pipeinfo.pipe_handle             uint64_t
10        pipe_fdinfo.pipeinfo.pipe_peerhandle         uint64_t
11        pipe_fdinfo.pipeinfo.pipe_status             int
12        pipe_fdinfo.pipeinfo.rfu_1                   int
13        sizeof(struct pollfd)                        struct pollfd
14        pollfd.fd                                    int
15        pollfd.events                                short
16        pollfd.revents                               short
17        sizeof(struct timespec)                      struct timespec
18        timespec.tv_sec                              time_t
19        timespec.tv_nsec                             long
20        sizeof(struct sigaction)                     struct sigaction
21        sigaction.sa_handler                         void (*)(int)
22        sigaction.sa_mask                            sigset_t
23        sigaction.sa_flags                           int
24        sizeof(sigset_t)                             sigset_t
25        sizeof(struct stat)                          struct stat
26        stat.st_dev                                  dev_t
27        stat.st_ino                                  ino_t
28        stat.st_mode                                 mode_t
29        stat.st_nlink                                nlink_t
30        stat.st_uid                                  uid_t
31        stat.st_gid                                  gid_t
32        stat.st_size                                 off_t
33        stat.st_flags                                uint32_t
34        sizeof(struct proc_bsdinfo)                  struct proc_bsdinfo
35        proc_bsdinfo.pbi_status                      uint32_t
36        proc_bsdinfo.pbi_pid                         uint32_t
37        proc_bsdinfo.pbi_ppid                        uint32_t
38        proc_bsdinfo.pbi_uid                         uid_t
39        proc_bsdinfo.pbi_gid                         gid_t
40        proc_bsdinfo.pbi_ruid                        uid_t
41        proc_bsdinfo.pbi_rgid                        gid_t
42        proc_bsdinfo.pbi_svuid                       uid_t
43        proc_bsdinfo.pbi_svgid                       gid_t
44        proc_bsdinfo.pbi_start_tvsec                 uint64_t
45        proc_bsdinfo.pbi_start_tvusec                uint64_t
46        sizeof(struct vnode_fdinfo)                  struct vnode_fdinfo
47        vnode_fdinfo.pfi.fi_openflags                uint32_t
48        vnode_fdinfo.pfi.fi_status                   uint32_t
49        vnode_fdinfo.pfi.fi_offset                   off_t
50        vnode_fdinfo.pfi.fi_type                     int32_t
51        vnode_fdinfo.pfi.fi_guardflags               uint32_t
```

Selectors 0, 3, 13, 17, 20, 25, 34, and 46 have selector kind 1 and byte
offset zero. Aggregate selectors use signedness 3; selector 24 uses signedness
1 and nominal `sigset_t`. Every other selector has kind 2 and its exact
`offsetof`, selected-expression `sizeof`, nominal type, and signedness.
Selector 21 has signedness 4; its probe proves the exact public function-pointer
member type, but neither the member pointer nor `SIG_IGN` is ever serialized,
hashed, compared numerically, or treated as authority. The source uses the
SDK-bound `SIG_IGN` expression only to install and read back the process-local
SIGPIPE disposition through profile 28. The probe additionally asserts
`PROC_PIDLISTFD_SIZE == sizeof(struct proc_fdinfo)`,
`PROC_PIDFDPIPEINFO_SIZE == sizeof(struct pipe_fdinfo)`,
`PROC_PIDFDVNODEINFO_SIZE == sizeof(struct vnode_fdinfo)`, and
`PROC_PIDTBSDINFO_SIZE == sizeof(struct proc_bsdinfo)`.

Every kernel-output aggregate is fully zeroed before its one SDK call. Runtime
serializes only the selected normalized fields, never raw aggregate bytes,
padding, reserved bytes, function pointers, or unconsumed kernel output.
Selector 12 is retained as an exact diagnostic returned integer and must be
zero; it is never interpreted as a future extension. `proc_fdinfo.proc_fdtype`
selector 2 is the sole descriptor-classification field. In particular,
`pipe_fdinfo.pfi.fi_type` selector 7 is a distinct signed returned field whose
unsigned 32-bit pattern is diagnostic only and is never compared with
`PROX_FDTYPE_PIPE`.

`4f43` is kind 148 over `4f45`, `4f44==32`, and `4f46==4f34`. The exact
parent-launcher public SDK layout/type registry is:

```text
selector canonical expression                                      exact nominal type
0        sizeof(struct proc_regionwithpathinfo)                     struct proc_regionwithpathinfo
1        prp_prinfo.pri_protection                                  uint32_t
2        prp_prinfo.pri_max_protection                              uint32_t
3        prp_prinfo.pri_flags                                       uint32_t
4        prp_prinfo.pri_offset                                      uint64_t
5        prp_prinfo.pri_share_mode                                  uint32_t
6        prp_prinfo.pri_address                                     uint64_t
7        prp_prinfo.pri_size                                        uint64_t
8        prp_vip.vip_vi.vi_stat.vst_dev                             uint32_t
9        prp_vip.vip_vi.vi_stat.vst_mode                            uint16_t
10       prp_vip.vip_vi.vi_stat.vst_nlink                           uint16_t
11       prp_vip.vip_vi.vi_stat.vst_ino                             uint64_t
12       prp_vip.vip_vi.vi_stat.vst_size                            off_t
13       prp_vip.vip_vi.vi_stat.vst_flags                           uint32_t
14       prp_vip.vip_vi.vi_type                                     int
15       prp_vip.vip_path                                           char[MAXPATHLEN]
16       sizeof(pid_t)                                              pid_t
17       sizeof(uint32_t)                                           uint32_t
18       sizeof(OSStatus)                                           OSStatus
19       sizeof(SecCSFlags)                                         SecCSFlags
20       sizeof(CFIndex)                                            CFIndex
21       sizeof(CFNumberType)                                       CFNumberType
22       sizeof(CFNumberRef)                                        CFNumberRef
23       sizeof(CFDictionaryRef)                                    CFDictionaryRef
24       sizeof(SecCodeRef)                                         SecCodeRef
25       sizeof(CFTypeRef)                                          CFTypeRef
26       sizeof(int32_t)                                            int32_t
27       __typeof__(kSecGuestAttributePid)                           const CFStringRef
28       __typeof__(kCFTypeDictionaryKeyCallBacks)                   const CFDictionaryKeyCallBacks
29       __typeof__(kCFTypeDictionaryValueCallBacks)                 const CFDictionaryValueCallBacks
30       sizeof(CFDictionaryKeyCallBacks)                            CFDictionaryKeyCallBacks
31       sizeof(CFDictionaryValueCallBacks)                          CFDictionaryValueCallBacks
```

Selector 0 has kind 1; selectors 1..15 have kind 2 and exact `offsetof`/
selected-expression `sizeof`; selectors 16..26 and 30/31 have kind 3;
selectors 27..29 have kind 4 and a compile-time exact-type assertion rather
than a serialized pointer/address. Pointer selectors 22..25 use signedness 4,
extern objects 27..29 use signedness 5, aggregates 0/15/30/31 use signedness 3,
and all other signedness follows the displayed nominal type. The role-5 probe
also asserts `PROC_PIDREGIONPATHINFO_SIZE ==
sizeof(struct proc_regionwithpathinfo)`, `sizeof(prp_vip.vip_path) ==
MAXPATHLEN`, `sizeof(int32_t)==4`, and the exact arm64 CoreFoundation/Security
types. Runtime serializes no raw aggregate, padding, callback bytes, object
pointer, or unconsumed path-buffer byte.

Symbol-mapping domain 16 contains exactly eight source-bound rows in this
canonical order: `PROC_PIDREGIONPATHINFO`,
`PROC_PIDREGIONPATHINFO_SIZE`, `PROC_PIDPATHINFO_MAXSIZE`,
`VM_PROT_EXECUTE`, `VREG`, `kCFNumberSInt32Type`, `kSecCSDefaultFlags`, and
`errSecSuccess`. `7de5` is respectively 0..7 and `7de3` is each target-SDK
numeric value. Their exact declaring headers are `<sys/proc_info.h>`,
`<mach/vm_prot.h>`, `<sys/vnode.h>`, `<CoreFoundation/CFNumber.h>`,
`<Security/CSCommon.h>`, and `<Security/SecBase.h>` as applicable. The pointer
symbols `kSecGuestAttributePid` and the two CF callback objects are not numeric
rows; selectors 27..29 and the ABI/source probes bind their public nominal
types and exact symbol expressions without serializing an address.

Each region query selects existing SDKABIBinding ordinal 11 `proc_pidinfo`,
uses flavor `PROC_PIDREGIONPATHINFO`, the current checked query address as its
`uint64_t arg`, a fully zeroed exact selector-0 object, and exactly
`PROC_PIDREGIONPATHINFO_SIZE` buffer bytes. A region member requires the return
to equal that exact size and an in-bounds first NUL in `vip_path`; any positive
short/oversized result blocks. Immediately before the terminal query the helper
sets its thread-local public errno slot to zero; only return zero with errno
still zero is end-of-scan. Negative return, nonzero errno, ESRCH, permission
failure, or a zero return before the strictly increasing traversal reaches the
kernel-reported end blocks. Targeted KERN_PROC birth observations immediately
before and after the complete scan must be byte-identical. No partial list is
authoritative merely because an early call returned zero.

`4f47` is kind 147 over exactly the twenty-one `4f49` rows and `4f48==21`.
Their fields reproduce the Section-2 matrix ordinals, endpoint, deadline,
return/revents predicate, decision, next syscall, outward class, and precedence.
For exact-mask rows `8ac6` is resolved through domain-15 symbols; predicate
rows forbid an invented aggregate numeric constant. A row change therefore
requires a new successor/SDK identity rather than a local switch default.

The transport equalities are exact. A PID-list pass divides only by selector-0
size and reads only selectors 1/2. `8122` equals selector-3 size;
`8123..812a` respectively encode selectors 4..11, with signed selectors 6/7/11
converted only to the stated width-preserving unsigned bit patterns, and
`812d==4f39`. Poll buffers use only selectors 13..16; monotonic samples use
17..19; the SIGPIPE disposition uses 20..24; normalized held-FD identity uses
25..33; public process birth/credential observations use 34..45; and vnode FD
classification uses 46..51. No selector from one aggregate is reused merely
because another SDK field has equal width or offset.

A serialized PipeEndpointObservation is legal at exactly these thirteen field
sites and nowhere else: `80df`, `61f0`, `95cd`, `952e`, `952f`, `98a9`,
`98d8`, `9609`, `960d`, `9638`, `963a`, `968e`, and `9690`. Every site's
complete nested bytes hash to its immediately specified kind-96 hash: `80de`,
`61ef`, `95cc`, `953e`, `953f`, `98a8`, `98d7`, `9608`, `960c`, `9637`,
`9639`, `968d`, or `968f`, respectively. `812d==4f39` at every site. A
structurally valid PipeEndpointObservation under a neighboring tag, another
STRUCT field, or a listed site paired with another site's enclosing values is
invalid.

At predecessor site `80df`, `8123==80d6`, `8128==80dd`, and `812b==80d5`;
role 1 stdin requires mode 1, roles 2/3 stdout/stderr require mode 2, and roles
4..8 forbid a pipe. At predecessor site `61f0`, `8123==61f5`; FD role 1
stdin requires `812b=1`, roles 2/3 stdout/stderr require `812b=2`, and roles
4..8 forbid a pipe; `61fb` is false exactly for mode 1 and true exactly for
mode 2. At `95cd`, `8123==95c7`, `8128==95cb`, and `812b==95c6`; roles
1/5/6 require mode 1, roles 2/3/4 require mode 2, roles 7..10 forbid a pipe,
and a role-11 pipe permits only modes 1/2.

Sites `952e/952f` are present only for injection kind 4; `953e/953f` are their
kind-96 hashes. Both complete endpoints are byte-identical to, respectively,
the `968e/9690` endpoints of the kind-177 child endpoint selected by the
profile-3 alias slot binding; the alias changes only which already-distinct
endpoint ordinal is presented to a slot. At `98a9`, roles 1..6 require
`8123==98a6`, `8128==98aa`, `8129==98ab`, and `812b==98a5`; role 0 forbids
the endpoint and every pipe field. Site `98d8` is byte-identical to the exact
phase-1 `98a9` selected by `98d5`, so its status, handles, direction, and SDK
hash are copied rather than reinterpreted.

At `9609/960d`, `8123==9606/960a` and `812b==1/2`; the two endpoints' `8128`
and `8129` values are reciprocal, and exactly the child end selected by the
slot's kind-190 row carries `O_NONBLOCK` after setup while its retained parent
peer remains access-mode-only. Sites `9638/963a` are byte-identical
PipeEndpointObservation values selected from the matching phase-1 child source
record and its post-`dup2` destination; `8123`, `8128/8129`, and `812b` do
not drift. At `968e/9690`, `8123==9689/968a` and `812b==9687`; `8128/8129`
remain byte-identical before/after and reciprocal to the endpoint selected by
`9691`. Profile 4 may change only `8123` by the one reviewed negative-injection
bit; every admitted profile requires exact status stability.

Gate B has one positive vector for every one of the thirteen legal field sites
and independently moves each complete endpoint to its preceding/following tag,
substitutes it at every other STRUCT site, pairs site A with status/mode/handle/
peer/SDK hash B, and mutates each immediately specified kind-96 hash. Every
unlisted position and one-sided cross-site substitution rejects before its
enclosing derived kind is admitted.

`8124` may contain only the four mapped `PROC_FP_*` bits, `8127` only the four
mapped `PROC_FI_GUARD_*` bits, and `812a` only the twelve mapped `PIPE_*` bits.
An unknown bit blocks. `PROC_FP_CLEXEC` cross-agrees with the exact `F_GETFD`
result, `PROC_FP_GUARDED` is set iff a mapped guard bit is present, and exact
profile-1 inherited request/response/diagnostic endpoints require neither bit.

For every selector, `8809==SHA256(880a)` and the exact `880a` C17 assertion
occurs once in `4f33.6106`. Its compile result is the same role-5 E2 kind-4
evidence that closes all 71 ABI rows, ordinals 0..70; a producer cannot validate
the ABI lines while omitting or conditionally compiling a layout line. Gate B
independently omits, duplicates, reorders, changes the prototype of, and
wrongly conditions ordinal 70 `CFDataCreate`; every case fails kind 90.

`4f3d` is kind 117 over `4f3f`, `4f3e==32`, and `4f40==4f34`. For `8829`, a
signed SDK value is represented as its exact two's-complement bit pattern at
`8827` width and then zero-extended to U64. The exact native ACL mapping table
is:

```text
ord class selector object-mask disposition SDK symbol
0   tag   1        3           mapped      ACL_EXTENDED_ALLOW
1   tag   2        3           mapped      ACL_EXTENDED_DENY
2   perm  0        1           mapped      ACL_READ_DATA
3   perm  0        2           mapped      ACL_LIST_DIRECTORY
4   perm  1        1           mapped      ACL_WRITE_DATA
5   perm  1        2           mapped      ACL_ADD_FILE
6   perm  2        1           mapped      ACL_EXECUTE
7   perm  2        2           mapped      ACL_SEARCH
8   perm  3        3           mapped      ACL_DELETE
9   perm  4        1           mapped      ACL_APPEND_DATA
10  perm  4        2           mapped      ACL_ADD_SUBDIRECTORY
11  perm  5        2           mapped      ACL_DELETE_CHILD
12  perm  6        3           mapped      ACL_READ_ATTRIBUTES
13  perm  7        3           mapped      ACL_WRITE_ATTRIBUTES
14  perm  8        3           mapped      ACL_READ_EXTATTRIBUTES
15  perm  9        3           mapped      ACL_WRITE_EXTATTRIBUTES
16  perm  10       3           mapped      ACL_READ_SECURITY
17  perm  11       3           mapped      ACL_WRITE_SECURITY
18  perm  12       3           mapped      ACL_CHANGE_OWNER
19  perm  13       3           mapped      ACL_SYNCHRONIZE
20  flag  0        3           mapped      ACL_ENTRY_FILE_INHERIT
21  flag  1        3           mapped      ACL_ENTRY_DIRECTORY_INHERIT
22  flag  2        3           mapped      ACL_ENTRY_LIMIT_INHERIT
23  flag  3        3           mapped      ACL_ENTRY_ONLY_INHERIT
24  flag  4        3           mapped      ACL_ENTRY_INHERITED
25  flag  5        3           must-absent ACL_FLAG_DEFER_INHERIT
26  flag  6        3           must-absent ACL_FLAG_NO_INHERIT
27  control 1      3           control     ACL_TYPE_EXTENDED
28  control 2      3           control     ACL_MAX_ENTRIES
29  control 3      3           control     ACL_FIRST_ENTRY
30  control 4      3           control     ACL_LAST_ENTRY
31  control 5      3           control     ACL_UNDEFINED_TAG
```

Every row is independently source- and compile-probe-bound to `<sys/acl.h>`.
Exactly, `882b==SHA256(882c)` and each `882c` width, signedness, value, alias,
and nominal-type assertion occurs once in `4f33.6106` and executes in that same
role-5 E2 kind-4 compile.
Aliases in permission rows 2/3, 4/5, 6/7, and 9/10 must have equal native bits
but remain distinct object-specific rows. On the selected SDK the complete
mapped permission OR is `0x00103ffe`, the complete mapped entry-flag OR is
`0x000001f0`, `ACL_FLAG_DEFER_INHERIT` is `0x00000001`,
`ACL_FLAG_NO_INHERIT` is `0x00020000`, `ACL_TYPE_EXTENDED` is `0x00000100`,
`ACL_MAX_ENTRIES` is 128, `ACL_FIRST_ENTRY` is 0, `ACL_LAST_ENTRY` is signed
-2, and `ACL_UNDEFINED_TAG` is 0. Those values are SDKIdentity instance facts,
not ambient host defaults. Flag selectors 5/6 are registry-only ACL-level
selectors and are never legal HMG4A2 entry-flag bits. A mapping value outside
its declared width, alias
inequality, overlap between two distinct contract bits, extra mapped native
bit, nonzero ACL-level flag, observation of either must-absent ACL-level flag,
or any readback tag equal `ACL_UNDEFINED_TAG` blocks.

The operation-10 HMG4A2 payload is admitted only when its complete length is
`16 + 40*n`, `n` equals its header count, `n <= ACL_MAX_ENTRIES`, every tag is
1 or 2 with qualifier length 16, permission bits are within 0..13, entry-flag
bits are within 0..4, and there is no trailing byte. The exact native lifecycle
is closed and has no alternate API path:

Unless a different return is stated below, every integer ACL API must return
zero; every ACL allocation must return non-NULL; and profile 58
`acl_get_flag_np` must return exactly 1 for a required-present mapped flag or 0
for a required-absent flag. A return outside that function's documented set,
ambient errno used after success, or output storage read after failure blocks.

1. Decode and retain the complete signed-F2-bound source bytes and compute `8862`.
2. Resolve all 32 SDK mappings, call profile 57 once, and require the returned
   maximal permission mask to equal the kind-117 mapped-permission OR.
3. Call profile 43 `acl_init(n)` once and require a non-NULL `acl_t`.
4. Obtain the ACL-level flag set with profile 49, read rows 25/26 and require
   both `ACL_FLAG_DEFER_INHERIT` and `ACL_FLAG_NO_INHERIT` absent, clear that
   ACL-level flag set with profile 50, read rows 25/26 again, and require
   `8870==0`. Entry-flag rows 20..24 are not queried on the ACL-level flag set.
5. For each source entry in order call profile 45
   `acl_create_entry_np(...,ACL_LAST_ENTRY)` once.
6. Set the exact mapped allow/deny tag through profile 46.
7. Materialize one source-bound `guid_t` whose `g_guid` is the exact 16-byte
   HMG4A2 qualifier and set it through profile 47; no textual name, `uuid_t`
   reinterpretation, numeric-ID substitution, padding, or alternate union view
   is permitted.
8. For each set contract permission bit select exactly one mapped row whose
   `8824` admits `8866` (thereby choosing file versus directory aliases), OR
   those native values, and set that exact mask through profile 48.
9. Obtain the entry flag set through profile 49, require every entry-flag row
   20..24 initially absent, clear it through profile 50, then call profile 51
   once for each set mapped entry flag in ascending contract-bit order. ACL-level
   rows 25/26 are never queried on an entry flag set. Construction mask
   `884d==0x7f` proves steps 5..9, including both flag acquisition and clearing.
10. Call profile 52 `acl_valid` once and require zero.
11. Read entries by profile 53 at exact indices `i=0..n-1`; index zero is the
    SDK-equal `ACL_FIRST_ENTRY`, and each call must return zero. A final call at
    index `n` (including index zero for an empty ACL) must return -1 with
    immediately captured `EINVAL`. For every
    entry, profiles 54/55/56/49/58 read tag, allocated qualifier, permission
    mask, and exactly entry-flag rows 20..24. A successful profile-55 result is
    non-NULL allocated storage pointing to exactly one SDK `guid_t`; exactly its
    16 `g_guid` bytes are copied to `8846` before free. `884e==0x1f`, the native values
    equal `8845/8849/884c`, and the re-encoded HMG4A2 slice is byte-identical.
    This deliberately uses the selected Darwin public numeric-entry-index
    extension, not portable POSIX cursor semantics; `ACL_NEXT_ENTRY` is
    forbidden. Gate-B vectors execute empty, one-entry, multi-entry, and exact
    `ACL_MAX_ENTRIES` cases, including each terminal-index `EINVAL`.
12. Set `*__error()` to zero through profile 42, record `887c`, and call the
    already-bound profile-23 `acl_set_fd` exactly once on the same live subject
    descriptor and the same constructed `acl_t`.
13. Require return -1 and capture `*__error()==EPERM` into `8875` before any
    cleanup, retry, target readback, diagnostic write, or other call can change
    it.
14. Free every qualifier returned by profile 55 exactly once with profile 44;
    allocation/free counts equal `n` and every `884f` is true.
15. Free the one main `acl_t` exactly once with profile 44 and require zero.
16. Re-read the target through profile 59 `acl_get_fd_np(fd,ACL_TYPE_EXTENDED)`,
    validate, enumerate, map, re-encode, and free it; the result must equal the
    exact canonical target ACL already carried by the byte-identical before/
    after target observations. Every qualifier and the returned target `acl_t`
    is freed exactly once; those target-readback allocations are part of the
    enclosing kind-66 no-effect observation and are not double-counted in
    argument-only `8877/8878`. No set, delete, retry, compensating write, or
    pathname ACL API occurs in this final no-effect readback.

The 16 phases above are the native ACL failure order. The first failure wins;
cleanup phases 14/15 still execute after an allocation, and cleanup failure is
recorded as the terminal blocking result without replacing an earlier captured
syscall errno. `884d` bits 0..6 respectively mean create, tag, qualifier,
permission mask, flag-set acquisition, flag clearing, and all requested flag
adds. `884e` bits 0..4 respectively mean indexed entry selection, tag,
qualifier, permission, and flag readback. Unknown, duplicate, omitted, or
out-of-order native operation blocks rather than being normalized.

`886a` is kind 118 over `886c`; `886b==8865`; each `8842==SHA256(8843)`, and
the ordered 40-byte entries partition `8864[16..8863)` exactly. Re-encoding
those entries with the retained 16-byte header produces byte-identical
`886f`; `886d==8862` and `886e==8863`. `8871==8872==0x00103ffe` for the
selected SDK. The `NativeACLMaterializationObservation` is required exactly
for operation 10 attempts and forbidden for every other operation; it does not
authorize `acl_set_fd`, apply, recovery, or any protected mutation.

`4f35` is kind 101 over `4f37` and `4f36==15`; `4f38==4f34`. The exact
KERN_PROC selector registry is:

```text
selector  canonical_field_path
0         sizeof(struct kinfo_proc)
1         kp_proc.p_pid
2         kp_proc.p_stat
3         kp_proc.p_flag
4         kp_proc.p_starttime.tv_sec
5         kp_proc.p_starttime.tv_usec
6         kp_eproc.e_ppid
7         kp_eproc.e_pcred.p_ruid
8         kp_eproc.e_pcred.p_svuid
9         kp_eproc.e_pcred.p_rgid
10        kp_eproc.e_pcred.p_svgid
11        kp_eproc.e_ucred.cr_uid
12        kp_eproc.e_ucred.cr_ngroups
13        kp_eproc.e_ucred.cr_groups
14        NGROUPS
```

Selector 0 has value kind 1, offset zero, size `sizeof(struct kinfo_proc)`,
signedness 3, nominal type `struct kinfo_proc`, and forbids `840c`. Selector 14
has value kind 2, offset `0xffffffffffffffff`, byte size `sizeof(int)`,
signedness 2, and `840c` is the exact positive SDK value of `NGROUPS`. Every
other row has value kind 1, forbids `840c`, and uses
`offsetof`, `sizeof` of the selected expression, `_Generic` or
`__builtin_types_compatible_p` for the exact nominal type, and a signedness
assertion in its exact `840a` line. The one role-5 probe includes the exact
public `<sys/sysctl.h>`/`<sys/proc.h>` headers and asserts all 15 lines; runtime
serializes only the normalized selected fields, never raw `kinfo_proc` bytes,
padding, pointers, or unconsumed kernel data.

Symbol-mapping domain 14 contains exactly seven rows for `CTL_KERN`,
`KERN_PROC`, `KERN_PROC_ALL`, `KERN_PROC_PID`, `P_TRACED`, `SZOMB`, and `SIDL`,
each bound to its exact target-SDK integer. The complete-snapshot MIB is exactly
`{CTL_KERN,KERN_PROC,KERN_PROC_ALL,0}` with `namelen=4`; the targeted MIB is
exactly `{CTL_KERN,KERN_PROC,KERN_PROC_PID,pid}` with `namelen=4`.
`kern.bootsessionuuid` is obtained by a `sysctlbyname` size/read pair, contains
exactly one terminal NUL after 36 uppercase hexadecimal UUID characters with
hyphens at byte offsets 8, 13, 18, and 23, and is parsed directly to 16 raw
bytes without case normalization; lowercase, mixed case, alternate spelling,
embedded NUL, or trailing byte
blocks.

Symbol-mapping domain 15 contains exactly these 52 source-bound rows in the
displayed order:

```text
PROC_PIDLISTFDS PROC_PIDFDPIPEINFO PROC_PIDFDVNODEINFO PROC_PIDTBSDINFO
PROX_FDTYPE_PIPE
O_RDONLY O_WRONLY O_RDWR O_ACCMODE O_NONBLOCK O_ASYNC
F_GETFD F_SETFD F_GETFL F_SETFL F_FULLFSYNC FD_CLOEXEC
PROC_FP_SHARED PROC_FP_CLEXEC PROC_FP_GUARDED PROC_FP_CLFORK
PROC_FI_GUARD_CLOSE PROC_FI_GUARD_DUP PROC_FI_GUARD_SOCKET_IPC
PROC_FI_GUARD_FILEPORT
POLLIN POLLOUT POLLERR POLLHUP POLLNVAL
CLOCK_MONOTONIC CLOCK_REALTIME SIGPIPE PIPE_BUF S_IFMT S_IFIFO
LOCK_SH LOCK_EX LOCK_NB LOCK_UN
PIPE_ASYNC PIPE_WANTR PIPE_WANTW PIPE_WANT PIPE_EOF PIPE_LOCKFL PIPE_LWANT
PIPE_DIRECTW PIPE_DIRECTOK PIPE_DRAIN PIPE_WSELECT PIPE_DEAD
```

The semantic order above is canonical: `7de5` is exactly the displayed
zero-based ordinal 0..51, so the kind-54 `(domain,contract_value,symbol)` sort
reproduces it. Groups occur exactly as selector/flavor, open/status, fcntl,
proc-file status, guard, poll, time/signal/atomicity/type, flock, and pipe
status. Each member's `7de3` is the exact target-SDK numeric value selected by
that contract ordinal. Required aliases such as `O_RDONLY==0` remain explicit
rows; an absent zero-valued mapping is not inferred. Domain 4
additionally contains exact rows for `EINTR`, `EAGAIN`, `EWOULDBLOCK`, `EPIPE`,
`EINVAL`, `ENOMEM`, and `ESRCH`; `EAGAIN`/`EWOULDBLOCK` remain distinct source symbols even when
their target-SDK numeric values are equal. `SIG_IGN` is intentionally not a
numeric domain-15 row: it remains a source-bound SDK expression whose pointer
representation is never serialized or compared.

The exact definition sources are `<sys/proc_info.h>` for the PROC/PROX rows,
`<sys/fcntl.h>` for O/F/FD/LOCK rows, `<sys/poll.h>` for POLL rows,
`<_time.h>` for `CLOCK_MONOTONIC/CLOCK_REALTIME`, `<sys/signal.h>` for `SIGPIPE`,
`<sys/syslimits.h>` for `PIPE_BUF`, `<sys/stat.h>` for `S_IFMT/S_IFIFO`,
`<sys/pipe.h>` for PIPE status rows, and `<sys/errno.h>` for domain 4. Each is
an exact held `4f2b` header source, and `4f33.6106` contains one unconditional
C17 static value/width/signedness assertion for every displayed mapping. A
transitive host include or runtime lookup cannot replace that source/probe
binding.

Gate-B includes positive rows for both clock selectors plus one-sided missing,
duplicate, numeric-value mutation, and `CLOCK_MONOTONIC`/`CLOCK_REALTIME`
selector-swap cases. It also executes the Section-15 ordered two-call guard and
proves that either call using the other row, an unmapped literal, or a host
default is rejected before any authority result.

One KERN_PROC_ALL pass is a checked size query followed by allocation and read.
`ENOMEM` or size growth permits a complete restart, at most eight times; every
other error blocks. A successful returned length is nonzero, a multiple of the
frozen selector-0 size, and contains at most 16,384 records. PID is unique in
one pass. The full raw count partitions exactly into relevant records,
irrelevant non-UID0 records, and excluded UID0 nonclaim records. A non-UID0
platform process receives no implicit exception and is relevant or irrelevant
solely by the same credential rule. Relevant
means either the process real/effective/saved UID equals a non-UID0 UID of an
actor selected by a WriterAuthorityRule, or its PID is the currently held
runtime helper. A zombie is diagnostic irrelevant and can never be an approved
actor; an initializing writer is class 3; `P_TRACED` on an approved actor
blocks. Targeted KERN_PROC_PID returns exactly one frozen-size record and the
same `(boot,pid,parent pid,start seconds,start microseconds)` or blocks;
ESRCH, zero/multiple record, PID reuse, short bytes, truncation, or drift is not
normalized.

The normalized ProcessCredentialIdentity comes from that same kinfo record:
real/saved UID/GID are `e_pcred.p_ruid/p_svuid/p_rgid/p_svgid`; effective UID
is `e_ucred.cr_uid`; `1 <= cr_ngroups <= NGROUPS`; effective primary GID is
`cr_groups[0]`; supplementary groups are `cr_groups[1..cr_ngroups-1]` sorted
as unsigned GIDs, with duplicates rejected. Approved self processes also
cross-check `getuid/geteuid/getgid/getegid/getgroups`; no raw kernel group order
is misrepresented as the canonical sorted vector. The two Q2 passes are the
first consecutive complete passes with byte-identical relevant projection,
boot UUID, writer-rule set, and zero class 3 within at most eight attempts.
`proc_listallpids`, all-process `proc_pidinfo`, task ports, Mach VM inspection,
EndpointSecurity, and private APIs are forbidden in public Q2 profile 1.

Symbol-mapping domain 12 contains exactly two rows: `ID_TYPE_UID` SDK/contract
value 0 and `ID_TYPE_GID` value 1. Domain 2 contains exactly the six public
static signing flags whose OR is `0x00013b00`; domain 13 contains exactly
Valid `0x1`, Hard `0x100`, Kill `0x200`, Debugged `0x10000000`, and Platform
`0x04000000`, whose OR is `0x14000301`. No other membership-ID, static-signing,
or interpreted dynamic-status mapping is legal. Every `8085` equals SHA-256 of
the complete canonical SDKABIBinding whose `8092 == 8075`; membership calls,
privilege-drop/readback calls, and Q2 `sysctl` each select the table row with
the same exact symbol.

Static and dynamic code observations have disjoint sources. `4f05` and `6409`
come only from the on-disk CodeDirectory header and public static
`kSecCodeInfoFlags`; they are equal for the same held signed file. A
DynamicCodeStatusObservation instead calls `SecCodeCopySigningInformation` on
one retained running `SecCodeRef` with `kSecCSDynamicInformation` and reads only
public `kSecCodeInfoStatus`, bracketing two successful validity checks. Its
`80b1` is kind 97 over `80b2`, and `80b2` is byte-identical to the enclosing
PublicProcessExecutionIdentity;
`80b3 == 80b4`, `80b6 == 80b7`, and `[80bb,80bc]` encloses the entire
authority-sensitive interval in that context. Unmapped status bits are retained
in `80b3/80b4` and must be stable but are never interpreted as a signing flag,
entitlement, bypass, or authority.

Profile 1 is iff a contract-owned launcher/helper/fixture/installer/observer or
dropped denial child: both public projections are exactly `0x00000301`, meaning
Valid, Hard, and Kill set while Debugged and Platform are absent. No profile 2
or 3 exists in this successor: untrusted/UID0 processes gain no trust from a
dynamic code observation and are not inspected through this STRUCT. The complete dynamic observation
belongs to the process-specific record, never the kind-59 executable catalog.

`4f11..4f15` store the sysctl value bytes excluding exactly one terminal NUL.
For each exact name `kern.ostype`, `kern.osproductversion`, `kern.osversion`,
`kern.osrelease`, and `kern.version`, the observer calls `sysctlbyname` once
with a null output to obtain the required length, rejects zero or a value above
the corresponding field maximum plus one, allocates only that checked bound,
then performs the value read. The returned length must equal the first length;
the bytes end in exactly one NUL and contain no earlier NUL. Removing only that
last byte yields the corresponding nonempty `4f11..4f15`. The complete
two-pass procedure is repeated once in the same observation interval and both
raw returned lengths/bytes must be identical. Error, length drift, missing or
double terminal NUL, embedded NUL, truncation, or bound overflow blocks. A C
string including its terminator, a textual command result, or normalized
whitespace is not an OSBuildIdentity field.

The two OS review-artifact hashes are never hash-only assertions. `4f18` and
`4f19` are role-5, encoding-3, binding-2 ReviewedObjectMembers with exact
diagnostic identifiers `os/security-framework-reference` and
`os/libc-reference`, respectively;
`4f18.7d45 == 4f16` and `4f19.7d45 == 4f17`. Their locators name complete
ordinary binary files in the approved slot-2 project review store, and their
`7d44/7d49.7954` lengths, hashes, metadata, link counts, and stable-scan
identities agree. The consumer opens those two locator-bound files from the
held parent FDs, streams every byte through SHA-256, and repeats the stable
identity check before accepting OSBuildIdentity. These two retained files are
explicitly non-authoritative forensic/build references; their names and hashes
do **not** claim that dyld loaded those standalone bytes, and no runtime
authorization conclusion is derived from them. Runtime identity instead binds
the exact five sysctl values, the signed helper/observer executable identities,
the complete SDK symbol mappings, and the observed API/vector results. A
framework version label, system pathname, dynamic-loader name, or digest
without either complete held reference preimage is invalid, but a matching
reference preimage alone never proves loaded-image identity.

SDK settings and SDK build-version evidence are likewise exact preimages.
`4f2c` is a role-6, encoding-3, binding-1 ReviewedObjectMember with diagnostic
identifier `sdk/settings`; its complete embedded bytes have
`4f2c.7d45 == 4f25`. Exactly one `4f2b` BuildSourceUnit has role 5,
`6102 == ASCII("sdk-settings")`, `6107 == ASCII("sdk/SDKSettings.json")`,
and byte-identical `6103/6104/6106` length/hash/content equal to
`4f2c.7d44/7d45/7d48`. The settings bytes are strict UTF-8 JSON with no BOM,
NUL, duplicate object key at any nesting level, non-whitespace prefix/suffix,
or trailing second value. The top level is an object. The values at exact JSON
member paths `/CanonicalName`, `/Version`, and
`/DefaultProperties/PLATFORM_NAME` are strings whose source tokens contain
only unescaped printable ASCII other than quote or reverse-solidus. Their exact
between-quote source bytes equal `4f21`, `4f22`, and `4f24`, respectively;
`4f24` is exactly `macosx`. A decoded-equivalent escaped spelling is invalid.

`4f2d` is a role-11, encoding-3, binding-1 ReviewedObjectMember with exact
diagnostic identifier `sdk/build-version-output`. Its embedded bytes are
exactly `4f23 || 0x0a`: `4f23` is 1..255 printable non-whitespace ASCII bytes,
and CR, NUL, a second line, leading/trailing whitespace, or a missing/additional
LF is invalid. Those bytes are the retained stdout of the reviewed SDK tool
identity under the command-set-defined exact `--sdk macosx
--show-sdk-build-version` argument sequence; exit status is zero and stderr is
empty. The read-only-probe HMG4E2 kind 4 names both complete identities and
reopens/re-hashes `4f18/4f19`, reparses `4f2c`, and re-executes and byte-compares
the `4f2d` output using that exact held tool/configuration.

`4f2f` is a role-6, encoding-3, binding-1 ReviewedObjectMember with exact
identifier `sdk/canonical-empty-entitlements`; `4f2e == 4f2f.7d45`. Define
`EMPTY_ENTITLEMENTS_PAYLOAD` as the exact ASCII bytes
`<?xml version="1.0" encoding="UTF-8"?>` followed by LF, then
`<plist version="1.0"><dict/></plist>` followed by LF. Define
`EMPTY_ENTITLEMENTS_BLOB = BE32(0xfade7171) ||
BE32(8 + length(EMPTY_ENTITLEMENTS_PAYLOAD)) || EMPTY_ENTITLEMENTS_PAYLOAD`.
`4f2f.7d48` is byte-identical to that complete blob, its length/hash are
recomputed, and the parser performs no DTD fetch or network access. This is the
only rights-profile-v1 no-bypass entitlement value. A missing blob, another
well-formed empty-dictionary serialization, any key/value, DER entitlement,
superblob, malformed length/magic/XML, or unrecognized entitlement form is
classified potential-bypass and cannot support authority DENY.

U2 `603f` contains
the complete nested OSBuildIdentity and SDKIdentity byte objects, including all
five preimage members; a digest, live system path, regenerated JSON, or current
tool output without these frozen bytes cannot satisfy K2, U2, E2, or Q2.
Every OS constant referenced by a capability flag, code-signing flag, mount
flag, errno, FD status flag, VM protection, or share mode has one exact mapping
member; an observed numeric value with no mapping or two symbolic mappings to
one contract value is invalid.

`6302` identifies the exact immediate role-2 ProtectedParent: subrole 2 for
`plans`, 3 `bundles`, 4 `receipts`, 5 `authorizations`, or 6 `xattr`.
`630d/630e` are byte-identical to that selected parent's `2303/2304`, including
their full kind-13/kind-35 chains from `/`. The separate role-2/subrole-1
evidence root protects those five exact directory leaves. Locations sharing a
subdirectory carry the same ordinal and byte-identical parent fields. The path
template is a leaf relative to that held immediate parent even though the
human-readable templates below include the subdirectory for clarity. Every one
of these parents is a required Q2 subject; no identity-only, unprotected
intermediate directory exists.

Canonical build nested schemas are:

```text
BuildSourceUnit
  0x6101 ordinal                     U32, contiguous from zero
  0x6102 source_relative_bytes       BYTES, 1..1,024 diagnostic-only ASCII
  0x6103 byte_length                 U64
  0x6104 sha256                      SHA256
  0x6105 role                        U32
  0x6106 content_bytes               BYTES, exact `6103` bytes, 1..16 MiB
  0x6107 build_relative_path         BUILD_REL_PATH
  0x6108 permitted_stage_mask        U64, exact role mask below
  0x6109 production_compiler_input   BOOL, true exactly for role 1
  0x610a source_language_profile     U32, exactly equal role

BuildToolIdentity
  0x6091 predecessor_build_receipt_length U64, required profile 3,
                                         56..67,108,920
  0x6092 predecessor_build_receipt_bytes BYTES, exact `6091`, required profile 3
  0x6093 predecessor_review_length      U64, required profile 3,
                                         56..16,777,272
  0x6094 predecessor_review_bytes       BYTES, exact `6093`, required profile 3
  0x610b provenance_profile          U32: 1 platform Mach-O, 2 held interpreter
                                         plus payloads, 3 independently built tool
  0x610c invocation_payload_set_sha256 SHA256, derived kind 27
  0x610d invocation_payload_count    U32, 0..64
  0x610e invocation_payloads         LIST ReviewedObjectMember, exact count
  0x610f predecessor_build_receipt_sha256 SHA256, required profile 3
  0x6110 predecessor_independent_review_sha256 SHA256, required profile 3
  0x6111 tool_name                   BYTES, 1..128 ASCII
  0x6112 version_bytes               BYTES, 1..1,024 exact output bytes
  0x6113 executable_sha256           SHA256
  0x6114 sdk_or_runtime_sha256       SHA256, derived kind 15
  0x6115 executable_content          STRUCT ReviewedObjectMember
  0x6116 sdk_or_runtime_identity     STRUCT CanonicalIdentityMember,
                                         identity kind exactly 16 or 17
  0x6117 version_argument_set_sha256 SHA256, derived kind 23
  0x6118 version_argument_count      U32, 1..8
  0x6119 version_arguments           LIST DiagnosticByteString, exact count
  0x611a observed_executable_sha256  SHA256, derived kind 15 identity kind 11
  0x611b observed_executable         STRUCT CanonicalIdentityMember,
                                         identity kind exactly 11
  0x611c version_exit_status         U32, exactly zero
  0x611d version_stderr_length       U64, exactly zero
  0x611e version_stderr_bytes        BYTES, exactly zero bytes

BuildEnvironmentEntry
  0x6131 ordinal                     U32, contiguous from zero
  0x6132 name                        BYTES, 1..128 ASCII, no NUL or `=`
  0x6133 value                       BYTES, 0..4,096 exact non-secret bytes,
                                         no NUL

ExecveArgumentLimitIdentity
  0x8de1 identity_version            U32, exactly 1
  0x8de2 target_pointer_width_bytes  U32, exactly 8
  0x8de3 path_max_value              U64, exactly 1,024
  0x8de4 arg_max_value               U64, exactly 1,048,576
  0x8de5 path_max_header             BYTES, exact ASCII `sys/syslimits.h`
  0x8de6 path_max_symbol             BYTES, exact ASCII `PATH_MAX`
  0x8de7 path_max_compile_probe_source_sha256 SHA256, equal role-5
                                         BuildSourceUnit
  0x8de8 path_max_compile_probe_execution_ordinal U32, selected passing stage 12
  0x8de9 arg_max_symbol              BYTES, exact ASCII `_SC_ARG_MAX`
  0x8dea sysconf_direct_call_binding_ordinal U32, selects exact `sysconf`
                                         kind-131 member
  0x8deb arg_max_probe_execution_ordinal U32, selected passing stage 12
  0x8dec arg_max_sysconf_return      S64, exactly 1,048,576
  0x8ded sdk_settings_sha256         SHA256, equal enclosing SDKIdentity `4f25`
  0x8dee os_build_identity_sha256    SHA256, equal enclosing U2 `602c`
  0x8def result                      U32, exactly 1

ExecveSerializationObservation
  0x8df1 observation_version        U32, exactly 1
  0x8df2 execve_argument_limit_identity_sha256 SHA256, derived kind 140
  0x8df3 argument_count             U32, 1..256
  0x8df4 argument_content_bytes     U64, checked sum of exact member bytes
  0x8df5 argument_terminator_bytes  U64, equal `8df3`
  0x8df6 environment_count          U32, 0..64
  0x8df7 environment_content_bytes U64, checked sum of name, `=`, value, NUL
  0x8df8 pointer_count              U64, exactly argc + 1 + envc + 1
  0x8df9 pointer_array_bytes        U64, exactly `8df8 * 8`
  0x8dfa execve_accounted_bytes     U64, exact checked sum of `8df4`, `8df5`,
                                         `8df7`, and `8df9`, at most `8de4`
  0x8dfb executable_path_byte_length U64, 1..1,023
  0x8dfc executable_path_plus_nul_bytes U64, equal `8dfb + 1`, at most `8de3`
  0x8dfd argument_set_sha256        SHA256, derived kind 23
  0x8dfe environment_set_sha256     SHA256, derived kind 24
  0x8dff result                     U32, exactly 1

BuildInvocation
  0x6121 build_root_nonce            BYTES, exactly 32
  0x6122 toolchain_set_sha256        SHA256
  0x6123 argument_set_sha256         SHA256
  0x6124 environment_set_sha256      SHA256
  0x6125 output_size                 U64
  0x6126 output_sha256               SHA256
  0x6127 lc_uuid                     BYTES, exactly 16
  0x6128 code_directory_sha256       SHA256
  0x6129 exit_status                 U32, exactly zero
  0x612a source_manifest_sha256      SHA256, derived kind 21
  0x612b build_input_set_sha256      SHA256, derived kind 27
  0x612c build_root_identity         STRUCT DirectoryIdentity, authority slot 2
  0x612d build_root_parent_identity  STRUCT DirectoryIdentity, authority slot 2
  0x612e pre_materialization_entry_count U32, exactly zero
  0x612f pre_materialization_scan_sha256 SHA256, derived kind 74 exact empty
  0x6140 post_materialization_entry_count U32, 1..8,192
  0x6141 post_materialization_entries LIST BuildTreeMember, exact count
  0x6142 post_materialization_scan_sha256 SHA256, derived kind 74
  0x6143 output_relative_path         BUILD_REL_PATH
  0x6144 stable_scan_pass_count       U32, exactly 2
  0x6145 pre_materialization_scan_passes LIST BuildTreeScanPass, exact count
  0x6146 pre_materialization_pass_set_sha256 SHA256, derived kind 80
  0x6147 post_materialization_scan_passes LIST BuildTreeScanPass, exact count
  0x6148 post_materialization_pass_set_sha256 SHA256, derived kind 80
  0x6149 build_lane                  U32: 1 A, 2 B
  0x614a command_projection_sha256  SHA256, derived kind 120
  0x614b execution_projection_sha256 SHA256, derived kind 121
  0x614c artifact_projection_sha256 SHA256, derived kind 122
  0x614d fd_projection_sha256       SHA256, derived kind 123
  0x614e stage_edge_projection_sha256 SHA256, derived kind 126
  0x614f signing_target_sha256      SHA256, derived kind 182

BuildTreeMember
  0x6151 ordinal                     U32, contiguous from zero
  0x6152 build_relative_path          BUILD_REL_PATH
  0x6153 object_type                 U32: 1 ordinary file, 2 directory
  0x6154 byte_length                 U64, 0..1 GiB; zero for directory
  0x6155 content_sha256              SHA256; SHA-256 of the empty byte string
                                         for directory
  0x6156 mode_bits                  U32
  0x6157 link_count                 U32, exactly 1 file, 1..65,535 directory
  0x6158 acl_sha256                 SHA256, exact canonical empty ACL
  0x6159 xattr_set_sha256           SHA256, exact canonical empty set

BuildTreeScanPass
  0x6161 ordinal                     U32, exactly 0 or 1
  0x6162 root_identity_sha256        SHA256, derived kind 15 identity kind 2
  0x6163 root_identity               STRUCT CanonicalIdentityMember, kind 2
  0x6164 entry_count                 U32, 0..8,192
  0x6165 entries                     LIST BuildTreeMember, exact count
  0x6166 entry_set_sha256            SHA256, derived kind 74
  0x6167 started_at_unix_seconds     U64
  0x6168 finished_at_unix_seconds    U64, not less than `6167`

BuildArtifactRef
  0x61a1 ordinal                    U32, contiguous from zero
  0x61a2 build_lane                 U32: 0 common, 1 A, 2 B
  0x61a3 artifact_role              U32: 1 source, 2 object, 3 unsigned Mach-O,
                                         4 CodeDirectory, 5 signed attributes,
                                         6 raw signature, 7 CMS, 8 final Mach-O,
                                         9 nm output, 10 otool output, 11 log,
                                         12 manifest/configuration
  0x61a4 build_relative_path        BUILD_REL_PATH
  0x61a5 byte_length                U64, 0..1 GiB
  0x61a6 content_sha256             SHA256
  0x61a7 tree_member                STRUCT BuildTreeMember
  0x61a8 producer_command_ordinal   U32 or 0xffffffff for held source input
  0x61a9 consumer_stage_mask        U64, nonzero
  0x61aa first_consumer_command_ordinal U32 or 0xffffffff
  0x61ab final_consumer_command_ordinal U32 or 0xffffffff
  0x61ac held_through_u2            BOOL, exactly true
  0x61ad result                     U32, exactly 1
  0x61ae held_file_identity_sha256 SHA256, derived kind 15 identity kind 3
  0x61af held_file_identity        STRUCT CanonicalIdentityMember, kind 3
  0x61b0 global_registry_ordinal   U32, stable producer/consumer reference

BuildFDRecord
  0x61ed observation_phase          U32: 1 immediately before action/exec,
                                         2 immediately after internal action
  0x61ee object_kind               U32: 1 held vnode, 2 anonymous pipe endpoint
  0x61ef pipe_endpoint_observation_sha256 SHA256, derived kind 96,
                                         required kind 2 only
  0x61f0 pipe_endpoint_observation STRUCT PipeEndpointObservation, kind 2 only
  0x61f1 ordinal                    U32, contiguous from zero within execution/phase
  0x61f2 execution_ordinal          U32
  0x61f3 fd_number                  U32, 0..65,535
  0x61f4 fd_role                    U32: 1 stdin, 2 stdout, 3 stderr,
                                         4 held input artifact, 5 exclusive output,
                                         6 build root/cwd, 7 HMG4L2 authorization,
                                         8 durable build-signing claim
  0x61f5 status_flags               U32, exact SDK-bound `F_GETFL`
  0x61f6 descriptor_flags           U32, exact SDK-bound `F_GETFD`
  0x61f7 object_identity_sha256     SHA256, derived kind 15, required kind 1
  0x61f8 object_identity            STRUCT CanonicalIdentityMember, kind 1/2/3,
                                         required object kind 1 only
  0x61f9 artifact_ref_ordinal       U32 or 0xffffffff; required roles 4/5
  0x61fa inherited_at_exec          BOOL, true only external-child phase 1
  0x61fb writable                   BOOL, true only roles 2,3,5
  0x61fc result                     U32, exactly 1 classified and allowlisted

BuildCommand
  0x6169 working_directory_sha256   SHA256, derived kind 15 identity kind 2
  0x616a working_directory          STRUCT CanonicalIdentityMember, kind 2
  0x616b launch_profile             U32: 1 internal controller action,
                                         2 ordinary fork/fchdir/dup2/close/
                                         execve/waitpid child,
                                         3 retained signing-client launch to
                                         readiness without waitpid,
                                         4 retained signing-client continuation
                                         and terminal waitpid without a new fork
  0x616c controller_toolchain_ordinal U32, exactly zero
  0x616d controller_execution_ordinal U32, exactly zero
  0x6171 ordinal                    U32, contiguous from zero
  0x6172 build_lane                 U32: 0 common, 1 A, 2 B
  0x6173 stage                      U32: 1 materialize, 2 compile, 3 link unsigned,
                                         4 prepare CodeDirectory/attributes,
                                         5 owner authorization admission,
                                         6 private-key sign, 7 assemble signed Mach-O,
                                         8 independent verify, 9 nm, 10 otool,
                                         11 final stable scan, 12 SDK ABI probe,
                                         13 controller session
  0x6174 toolchain_ordinal          U32, 0..7
  0x6175 argument_set_sha256        SHA256, derived kind 23
  0x6176 argument_count             U32, 0..256
  0x6177 arguments                  LIST DiagnosticByteString, exact count
  0x6178 environment_set_sha256     SHA256, derived kind 24
  0x6179 environment_count          U32, 0..64
  0x617a environment               LIST BuildEnvironmentEntry, exact count
  0x617b input_artifact_set_sha256 SHA256, derived kind 122
  0x617c input_artifact_count      U32, 0..8,192
  0x617d input_artifacts           LIST BuildArtifactRef, exact count
  0x617e output_artifact_set_sha256 SHA256, derived kind 122
  0x617f output_artifact_count     U32, 0..8,192
  0x6180 output_artifacts          LIST BuildArtifactRef, exact count
  0x8e31 execve_serialization_observation_sha256 SHA256, derived kind 141,
                                         required launch profiles 2/3 only
  0x8e32 execve_serialization_observation STRUCT ExecveSerializationObservation,
                                         required launch profiles 2/3 only

BuildExecution
  0x6181 ordinal                    U32, contiguous from zero
  0x6182 build_lane                 U32: 0 common, 1 A, 2 B
  0x6183 command_ordinal            U32, exact BuildCommand
  0x6184 toolchain_ordinal          U32, equal selected command
  0x6185 execution_identity_sha256 SHA256, derived kind 97
  0x6186 execution_identity        STRUCT PublicProcessExecutionIdentity
  0x6187 controller_execution_ordinal U32, zero; self only for ordinal zero
  0x6188 started_monotonic_nanoseconds U64
  0x6189 finished_monotonic_nanoseconds U64, not less than `6188`
  0x618a exit_status               U32, exactly zero launch profiles 2/4;
                                         forbidden profiles 1/3
  0x618b terminating_signal        U32, exactly zero launch profiles 2/4;
                                         forbidden profiles 1/3
  0x618c fd_set_sha256             SHA256, derived kind 123
  0x618d fd_count                  U32, 0..8,192
  0x618e fd_records                LIST BuildFDRecord, exact count
  0x618f observed_executable_identity_sha256 SHA256, equal selected tool `611a`
  0x6190 invocation_payload_set_sha256 SHA256, equal selected tool
  0x6191 caller_observed_network_socket_count U32, exactly zero; no provider claim
  0x6192 result                    U32, exactly 1
  0x6193 process_credential_sha256 SHA256, derived kind 129
  0x6194 process_credential        STRUCT ProcessCredentialIdentity
  0x6195 observed_executable_identity STRUCT CanonicalIdentityMember, kind 11,
                                         equal selected tool `611b`
  0x6196 stdout_length             U64, 0..1 MiB
  0x6197 stdout_sha256             SHA256
  0x6198 stdout_bytes              BYTES, exact `6196`, 0..1 MiB
  0x6199 stderr_length             U64, 0..1 MiB
  0x619a stderr_sha256             SHA256
  0x619b stderr_bytes              BYTES, exact `6199`, 0..1 MiB
  0x619c raw_wait_status           U32, exact unsigned wait-status bits;
                                         required launch profiles 2/4 only
  0x619d waitpid_returned_pid      U32, equal `6186` PID; profiles 2/4 only
  0x619e exited_normally           BOOL, exactly true; profiles 2/4 only
  0x619f launch_api_profile        U32, equal command `616b`
  0x8da6 retained_client_predecessor_execution_ordinal U32, required launch
                                         profile 4 and selecting the same-lane
                                         stage-4 execution; forbidden otherwise
  0x8da7 client_process_retained_after_operation BOOL, exactly true launch
                                         profile 3; exactly false otherwise
  0x8da8 terminal_wait_observed    BOOL, exactly true launch profiles 2/4;
                                         exactly false profiles 1/3
  0x8da9 retained_client_readiness_sha256 SHA256, required profiles 3/4;
                                         identical across the pair
  0x8daa retained_client_readiness_length U64, required profiles 3/4,
                                         exactly 64
  0x8dab retained_client_readiness_bytes BYTES, exact `8daa`, profiles 3/4
  0x8dac retained_process_identity_sha256 SHA256, required profiles 3/4,
                                         equal `6185`
  0x8dad retained_process_identity STRUCT PublicProcessExecutionIdentity,
                                         required profiles 3/4, equal `6186`
  0x8dae lifecycle_result          U32, exactly 1
  0x8dd7 durable_consumption_claim_sha256 SHA256, derived kind 135,
                                         required launch profile 4 only
  0x8dd8 selected_key_lookup_observation_sha256 SHA256, derived kind 139,
                                         required launch profile 4 only
  0x8dd9 copy_attributes_observation_sha256 SHA256, derived kind 132,
                                         required launch profile 4 only
  0x8dda external_representation_observation_sha256 SHA256, derived kind 133,
                                         required launch profile 4 only
  0x8ddb signature_call_observation_set_sha256 SHA256, derived kind 134,
                                         required launch profile 4 only
  0x8ddc key_handle_lifetime_observation_sha256 SHA256, derived kind 181,
                                         required launch profile 4 only
  0x8ddd key_handle_lifetime_observation STRUCT SecKeyHandleLifetimeObservation,
                                         required launch profile 4 only
  0x8dde auxiliary_cf_lifetime_set_sha256 SHA256, derived kind 183,
                                         required launch profile 4 only
  0x8ddf auxiliary_cf_lifetime_count U32, exactly 6 launch profile 4 only
  0x8de0 auxiliary_cf_lifetimes LIST SecKeyAuxiliaryCFObjectLifetimeObservation,
                                         exact count, launch profile 4 only

StageEdge
  0x8b01 ordinal                    U32, contiguous from zero
  0x8b02 build_lane                 U32: 1 A, 2 B
  0x8b03 producer_command_ordinal   U32
  0x8b04 artifact_ref_ordinal      U32, required classes 1/4; forbidden 2/3/5
  0x8b05 consumer_command_ordinal   U32
  0x8b06 edge_class                U32: 1 bytes, 2 executable child,
                                         3 authorization, 4 independent observation,
                                         5 durable build-signing claim
  0x8b07 result                    U32, exactly 1
  0x8b08 child_execution_ordinal   U32, required class 2 only
  0x8b09 authorization_frame_length U64, required class 3 only,
                                         56..16,777,272
  0x8b0a authorization_frame_sha256 SHA256, required class 3 only
  0x8b0b authorization_frame_bytes BYTES, exact `8b09`, required class 3 only
  0x8b0c consumption_claim_sha256 SHA256, derived kind 135, required class 5
  0x8b0d consumption_claim_identity_sha256 SHA256, derived kind 15,
                                         required class 5
  0x8b0e consumption_claim_result U32, exactly 1, required class 5

SigningAuthorizationTarget
  0x8b11 ordinal                    U32, exactly 0 lane A or 1 lane B
  0x8b12 build_lane                 U32, exactly ordinal plus one
  0x8b13 unsigned_macho_sha256      SHA256
  0x8b14 code_directory_sha256     SHA256
  0x8b15 signed_attributes_sha256  SHA256
  0x8b16 signing_preimage_sha256   SHA256
  0x8b17 signing_algorithm         U32, exactly 1 RSA-3072 PKCS1-v1_5 SHA-256
  0x8b18 signing_tool_identity_sha256 SHA256, complete BuildToolIdentity bytes
  0x8b19 signing_key_custody_sha256 SHA256, derived kind 124
  0x8b1a output_relative_path      BUILD_REL_PATH
  0x8b1b lane_root_identity_sha256 SHA256, derived kind 15 identity kind 2
  0x8b1c result                    U32, exactly 1 immutable target
  0x8b1d unsigned_macho_artifact   STRUCT BuildArtifactRef, role 3
  0x8b1e code_directory_artifact  STRUCT BuildArtifactRef, role 4
  0x8b1f signed_attributes_artifact STRUCT BuildArtifactRef, role 5
  0x8b20 signing_preimage_length  U64, 1..1 MiB
  0x8b21 signing_preimage_bytes   BYTES, exact `8b20`
  0x8b22 lane_root_identity       STRUCT CanonicalIdentityMember, kind 2

SelectedSigningTargetProjection
  0x9761 projection_version        U32, exactly 1
  0x9762 selected_target_count     U32, exactly 1
  0x9763 selected_target           STRUCT SigningAuthorizationTarget
  0x9764 result                    U32, exactly 1

SigningKeyCustodyIdentity
  0x61b1 stream_version            U32, exactly 1
  0x61b2 security_framework_file_identity_sha256 SHA256, derived kind 15,
                                         identity kind 3
  0x61b3 security_framework_file_identity STRUCT CanonicalIdentityMember,
                                         identity kind exactly 3
  0x61b4 authorized_signing_client_set_sha256 SHA256, derived kind 130
  0x61b5 authorized_signing_client_count U32, exactly 1
  0x61b6 non_bearer_key_attribute_set_sha256 SHA256, derived kind 128;
                                         never a key reference
  0x61b7 key_class                  U32, exactly 1 private
  0x61b8 key_type                   U32, exactly 1 RSA
  0x61b9 key_size_bits              U32, exactly 3,072
  0x61ba nonextractable             BOOL, exactly true
  0x61bb permanent_preexisting_key BOOL, exactly true
  0x61bc canonical_access_policy_statement BYTES, 1..65,536 exact contract
                                         statement, never provider attributes
  0x61bd canonical_access_policy_statement_sha256 SHA256, SHA-256 of `61bc`
  0x61be public_spki_der           BYTES, 1..4,096 exact DER
  0x61bf public_spki_sha256        SHA256, SHA-256 of `61be`
  0x61c0 certificate_chain_bytes  BYTES, 1..1 MiB exact fixed chain
  0x61c1 certificate_chain_sha256 SHA256, SHA-256 of `61c0`
  0x61c2 external_representation_check_required BOOL, exactly true
  0x61c3 expected_external_representation_returned BOOL, exactly false
  0x61c4 expected_external_representation_error_domain BYTES, exact ASCII
                                         `NSOSStatusErrorDomain`
  0x61c5 expected_external_representation_error_code S64, exactly -25316,
                                         SDK `errSecDataNotAvailable`
  0x61c6 authorized_session_private_key_use_count U32, exactly 2
  0x61c7 key_generation_allowed    BOOL, exactly false
  0x61c8 key_import_allowed        BOOL, exactly false
  0x61c9 key_export_allowed        BOOL, exactly false
  0x61ca network_key_provider_allowed BOOL, exactly false
  0x61cb result                    U32, exactly 1
  0x61cc non_bearer_attribute_count U32, exactly 8
  0x61cd non_bearer_attributes    LIST SigningKeyAttributeMember, exact count
  0x61ce provider_transport_profile U32, exactly 1 Apple Security opaque broker;
                                         no provider-process/FD/Mach-port claim
  0x61cf keychain_application_label BYTES, exactly 32, exact independently
                                         provisioned nonsecret lookup bytes
  0x61d0 keychain_application_label_sha256 SHA256, SHA-256 of `61cf`
  0x8e20 authorized_signing_clients LIST SigningClientIdentityMember, exact count

SignerTranscript
  0x61d1 ordinal                    U32, exactly 0 or 1
  0x61d2 build_lane                 U32, exactly ordinal plus one
  0x61d3 owner_authorization_sha256 SHA256, complete HMG4L2 kind 2
  0x61d4 authorization_target_sha256 SHA256, derived kind 182
  0x61d5 signing_key_custody_sha256 SHA256, derived kind 124
  0x61d6 signing_tool_identity_sha256 SHA256, complete canonical nested bytes
  0x61d7 execution_sha256          SHA256, complete BuildExecution bytes
  0x61d8 signing_preimage_sha256  SHA256, equal target `8b16`
  0x61d9 digest_sha256            SHA256, SHA-256 of exact signing preimage
  0x61da raw_signature_bytes      BYTES, exactly 384
  0x61db raw_signature_sha256     SHA256, SHA-256 of `61da`
  0x61dc cms_bytes                BYTES, 1..1 MiB, exact timestamp-free CMS
  0x61dd cms_sha256               SHA256, SHA-256 of `61dc`
  0x61de security_api_use_ordinal U32, exactly ordinal
  0x61df security_api_call_sha256 SHA256, exact application-side call record
  0x61e0 security_api_result_sha256 SHA256, exact application-side result record
  0x61e1 result                   U32, exactly 1
  0x61e2 signed_attributes_length U64, 1..1 MiB
  0x61e3 signed_attributes_bytes BYTES, exact `61e2`
  0x61e4 signing_preimage_length U64, 1..1 MiB
  0x61e5 signing_preimage_bytes BYTES, exact `61e4`
  0x61e6 security_api_call_length U64, 1..1 MiB, non-secret canonical call
  0x61e7 security_api_call_bytes BYTES, exact `61e6`
  0x61e8 security_api_result_length U64, 1..1 MiB, non-secret canonical result
  0x61e9 security_api_result_bytes BYTES, exact `61e8`
  0x61ea started_monotonic_nanoseconds U64
  0x61eb finished_monotonic_nanoseconds U64, not less than `61ea`
  0x61ec leaf_public_spki_sha256 SHA256, equal key custody `61bf`
  0x8e11 certificate_chain_sha256 SHA256, equal key custody `61c1`
  0x8e12 independent_verification_passed BOOL, exactly true
  0x8e13 previous_transcript_sha256 SHA256, forbidden ordinal 0; required
                                         ordinal 1 as complete transcript-0 hash
  0x8db0 consumption_claim_sha256 SHA256, derived kind 135
  0x8db1 consumption_claim_identity_sha256 SHA256, derived kind 15,
                                         equal claim held identity
  0x8db2 stage4_readiness_execution_sha256 SHA256, complete BuildExecution bytes
  0x8db3 stage6_completion_execution_sha256 SHA256, equal `61d7`
  0x8db4 signature_call_observation_sha256 SHA256, complete
                                         SecKeySignatureCallObservation bytes
  0x8db5 signature_call_observation STRUCT SecKeySignatureCallObservation
  0x8db6 opaque_handle_lifetime_ordinal U32, exactly zero
  0x8db7 retained_client_lifecycle_passed BOOL, exactly true
  0x8db8 selected_key_lookup_observation_sha256 SHA256, derived kind 139,
                                         equal U2 `607a`
  0x8db9 copy_attributes_observation_sha256 SHA256, derived kind 132,
                                         equal U2 `606b`
  0x8dba external_representation_observation_sha256 SHA256, derived kind 133,
                                         equal U2 `606d`
  0x8dbc auxiliary_cf_lifetime_set_sha256 SHA256, derived kind 183,
                                         equal U2 `6080`
  0x8dbd input_cfdata_lifetime_ordinal U32, exactly 2 ordinal 0 or 4 ordinal 1
  0x8dbe output_cfdata_lifetime_ordinal U32, exactly 3 ordinal 0 or 5 ordinal 1

SigningKeyAttributeMember
  0x8e01 ordinal                    U32, contiguous 0..7
  0x8e02 attribute_code             U32, exactly ordinal plus one
  0x8e03 value_type                 U32: 1 U32, 2 BOOL, 3 SHA256, 4 ASCII,
                                         5 exact nonsecret bytes
  0x8e04 u32_value                  U32, required codes 1,2,8
  0x8e05 bool_value                 BOOL, required codes 3,4
  0x8e06 sha256_value               SHA256, required code 6
  0x8e07 ascii_value                BYTES, 1..255, required code 7
  0x8e08 bytes_value                BYTES, exactly 32, required code 5

SigningClientIdentityMember
  0x8e21 ordinal                    U32, exactly zero
  0x8e22 build_lane                 U32, exactly zero common client
  0x8e23 execution_identity_sha256 SHA256, derived kind 97
  0x8e24 execution_identity        STRUCT PublicProcessExecutionIdentity
  0x8e25 process_credential_sha256 SHA256, derived kind 129
  0x8e26 process_credential        STRUCT ProcessCredentialIdentity
  0x8e27 executable_identity_sha256 SHA256, derived kind 15 identity kind 11
  0x8e28 executable_identity       STRUCT CanonicalIdentityMember, kind 11
  0x8e29 signing_tool_identity_sha256 SHA256, complete BuildToolIdentity bytes
  0x8e2a result                     U32, exactly 1 ready and retained at target
                                         freeze; makes no future-lifetime claim

SecKeyCopyAttributeMember
  0x8d01 ordinal                    U32, contiguous 0..9
  0x8d02 selector                   U32, exactly ordinal plus one: can-encrypt,
                                         can-decrypt, can-derive, can-sign,
                                         can-verify, key-class, key-type,
                                         key-size-bits, token-id,
                                         application-label
  0x8d03 present                    BOOL; false permitted only selector 9
  0x8d04 value_type                 U32: 1 BOOL selectors 1..5, 2 symbolic
                                         CFString selectors 6/7/9, 3 U32
                                         selector 8, 4 BYTES selector 10
  0x8d05 bool_value                 BOOL, required selectors 1..5
  0x8d06 symbolic_value             BYTES, 1..255 exact ASCII, required present
                                         selectors 6/7/9
  0x8d07 u32_value                  U32, required selector 8
  0x8d08 bytes_value                BYTES, exactly 32, required selector 10

SecKeyCopyAttributesObservation
  0x8d11 observation_version        U32, exactly 1
  0x8d12 signing_client_execution_identity_sha256 SHA256, derived kind 97
  0x8d13 signing_client_execution_identity STRUCT PublicProcessExecutionIdentity
  0x8d14 opaque_handle_lifetime_ordinal U32, exactly zero; pointer bits forbidden
  0x8d15 direct_call_binding_ordinal U32, selects `SecKeyCopyAttributes`
  0x8d16 returned_dictionary_nonnull BOOL, exactly true
  0x8d17 raw_dictionary_key_count   U32, equal count of present `8d1a` members
  0x8d18 unknown_dictionary_key_count U32, exactly zero
  0x8d19 attribute_count            U32, exactly 10
  0x8d1a attributes                 LIST SecKeyCopyAttributeMember, exact count
  0x8d1b attribute_list_sha256      SHA256, SHA-256 of the exact canonical
                                         LIST value over `8d1a`
  0x8d1c application_label_sha256   SHA256, equal custody `61d0`
  0x8d1d started_monotonic_nanoseconds U64
  0x8d1e finished_monotonic_nanoseconds U64, not less than `8d1d`
  0x8d1f result                     U32, exactly 1
  0x8d20 boundary_realtime_seconds  U64, immediate paired sample after `8d1d`

SecKeyExternalRepresentationObservation
  0x8d21 observation_version        U32, exactly 1
  0x8d22 signing_client_execution_identity_sha256 SHA256, equal `8d12`
  0x8d23 opaque_handle_lifetime_ordinal U32, exactly zero
  0x8d24 direct_call_binding_ordinal U32, selects `SecKeyCopyExternalRepresentation`
  0x8d25 returned_cfdata_nonnull     BOOL, exactly false
  0x8d26 returned_byte_length       U64, exactly zero
  0x8d27 error_nonnull              BOOL, exactly true
  0x8d28 cferror_domain             BYTES, exact ASCII `NSOSStatusErrorDomain`
  0x8d29 cferror_code               S64, exactly -25316
  0x8d2a sdk_error_symbol           BYTES, exact ASCII `errSecDataNotAvailable`
  0x8d2b sdk_error_compile_probe_source_sha256 SHA256, equal selected role-5
                                         BuildSourceUnit
  0x8d2c sdk_error_compile_probe_execution_ordinal U32, selected passing stage 12
  0x8d2d started_monotonic_nanoseconds U64, not less than `8d1e`
  0x8d2e finished_monotonic_nanoseconds U64, not less than `8d2d`
  0x8d2f result                     U32, exactly 1 expected nonexportable failure
  0x8d30 boundary_realtime_seconds  U64, immediate paired sample after `8d2d`

SecKeyQueryMember
  0x9741 ordinal                    U32, contiguous 0..7
  0x9742 key_symbol                 BYTES, exact public CFString symbol
  0x9743 value_kind                 U32: 1 extern CFString, 2 extern CFBoolean,
                                         3 created CFNumber, 4 created CFData
  0x9744 value_symbol               BYTES, exact public symbol, kinds 1/2 only
  0x9745 number_type_symbol         BYTES, exact ASCII `kCFNumberSInt32Type`,
                                         kind 3 only
  0x9746 number_s32_value           S64, exactly 3,072 and representable as
                                         signed 32 bits, kind 3 only
  0x9747 data_value                 BYTES, exactly custody `61cf`, kind 4 only
  0x9748 create_direct_call_binding_ordinal U32, distinct `CFNumberCreate` or
                                         `CFDataCreate` occurrence, kinds 3/4 only
  0x9749 creator_plus_one_count     U32, exactly 1 kinds 3/4; zero kinds 1/2
  0x974a dictionary_retain_count    U32, exactly 1
  0x974b explicit_release_direct_call_binding_ordinal U32, distinct `CFRelease`
                                         occurrence, kinds 3/4 only
  0x974c explicit_release_count     U32, exactly 1 kinds 3/4; zero kinds 1/2
  0x974d dictionary_release_count   U32, exactly 1
  0x974e result                     U32, exactly 1

SecKeyLookupObservation
  0x8dc1 observation_version        U32, exactly 1
  0x8dc2 signing_client_execution_identity_sha256 SHA256, equal `8d12`
  0x8dc3 direct_call_binding_ordinal U32, selects `SecItemCopyMatching`
  0x8dc4 query_statement_length     U64, 1..65,536
  0x8dc5 query_statement_sha256     SHA256, SHA-256 of `8dc6`
  0x8dc6 query_statement_bytes      BYTES, exact `8dc4`, canonical query below
  0x8dc7 query_class                U32, exactly 1 `kSecClassKey`
  0x8dc8 query_key_class            U32, exactly 1 private
  0x8dc9 query_key_type             U32, exactly 1 RSA
  0x8dca query_key_size_bits        U32, exactly 3,072
  0x8dcb query_application_label    BYTES, exactly 32, equal custody `61cf`
  0x8dcc query_return_ref           BOOL, exactly true
  0x8dcd query_match_limit_profile U32, exactly 1 public `kSecMatchLimitOne`
  0x8dce query_authentication_ui    U32, exactly 1 `kSecUseAuthenticationUIFail`
  0x8dcf secitem_status             S64, exactly zero `errSecSuccess`
  0x8dd0 returned_reference_count   U32, exactly 1
  0x8dd1 opaque_handle_lifetime_ordinal U32, exactly zero; pointer bits forbidden
  0x8dd2 query_application_label_sha256 SHA256, SHA-256 of `8dcb`,
                                         equal custody `61d0`
  0x8dd3 started_monotonic_nanoseconds U64
  0x8dd4 finished_monotonic_nanoseconds U64, not less than `8dd3`
  0x8dd5 result                     U32, exactly 1 bounded selected-key match
  0x8dd6 boundary_realtime_seconds U64, immediate paired sample after `8dd3`
  0x9701 returned_result_nonnull     BOOL, exactly true
  0x9702 result_cfgettypeid_direct_call_binding_ordinal U32, selects exact
                                         `CFGetTypeID` occurrence
  0x9703 seckey_gettypeid_direct_call_binding_ordinal U32, selects
                                         exact `SecKeyGetTypeID` occurrence
  0x9704 returned_result_type_id     U64, exact `CFGetTypeID` result
  0x9705 expected_seckey_type_id     U64, exact `SecKeyGetTypeID` result
  0x9706 returned_result_is_seckey  BOOL, exactly true iff `9704==9705`
  0x9707 secitem_result_ownership   U32, exactly 1 Copy-rule +1 reference
  0x9708 retained_handle_ready      BOOL, exactly true
  0x9709 query_dictionary_member_count U32, exactly 8
  0x970a query_dictionary_create_direct_call_binding_ordinal U32, selects exact
                                         `CFDictionaryCreate` occurrence
  0x970b query_dictionary_release_direct_call_binding_ordinal U32, selects exact
                                         `CFRelease` occurrence after SecItem call
  0x970c query_dictionary_release_count U32, exactly 1
  0x970d sdk_identity_sha256        SHA256, equal enclosing U2 `602d`
  0x970e query_constant_compile_probe_source_sha256 SHA256, equal selected
                                         SDKIdentity `4f34`
  0x970f unknown_query_member_count U32, exactly zero
  0x9710 query_construction_result  U32, exactly 1
  0x9711 query_member_list_sha256   SHA256, SHA-256 of the exact canonical LIST
                                         value over `9712`
  0x9712 query_members              LIST SecKeyQueryMember, exact count eight
  0x9713 dictionary_key_callbacks_symbol BYTES, exact ASCII
                                         `kCFTypeDictionaryKeyCallBacks`
  0x9714 dictionary_value_callbacks_symbol BYTES, exact ASCII
                                         `kCFTypeDictionaryValueCallBacks`
  0x9715 dictionary_callback_retain_count U32, exactly 16, eight keys/eight values
  0x9716 dictionary_callback_release_count U32, exactly 16
  0x9717 temporary_created_value_count U32, exactly 2
  0x9718 temporary_explicit_release_count U32, exactly 2
  0x9719 value_creation_finished_monotonic_nanoseconds U64, not greater than
                                         `971a`
  0x971a dictionary_creation_finished_monotonic_nanoseconds U64, not greater
                                         than `971b`
  0x971b temporary_releases_finished_monotonic_nanoseconds U64, not greater
                                         than `8dd3`
  0x971c dictionary_release_finished_monotonic_nanoseconds U64, not greater
                                         than `8dd4`
  0x971d native_value_construction_result U32, exactly 1
  0x971e native_value_ownership_result U32, exactly 1
  0x971f secitem_returned_monotonic_nanoseconds U64, not less than `8dd3`
  0x9720 result_type_validation_finished_monotonic_nanoseconds U64, not less
                                         than `971c` and not greater than `8dd4`

SecKeyHandleLifetimeObservation
  0x9721 observation_version         U32, exactly 1
  0x9722 signing_client_execution_identity_sha256 SHA256, equal lookup/calls
  0x9723 selected_key_lookup_observation_sha256 SHA256, derived kind 139
  0x9724 signature_call_observation_set_sha256 SHA256, derived kind 134
  0x9725 opaque_handle_lifetime_ordinal U32, exactly zero
  0x9726 secitem_result_ownership    U32, exactly 1 direct Copy-rule +1 SecKey
  0x9727 key_release_count           U32, exactly 1
  0x9728 key_release_direct_call_binding_ordinal U32, selects exact final
                                         `CFRelease` occurrence
  0x9729 copy_attributes_observation_sha256 SHA256, derived kind 132
  0x972a private_export_denial_observation_sha256 SHA256, derived kind 133
  0x972d retained_through_copy_attributes BOOL, exactly true
  0x972e retained_through_private_export_denial BOOL, exactly true
  0x972f retained_through_signature_call_count U32, exactly 2
  0x9730 second_signature_finished_monotonic_nanoseconds U64,
                                         equal call ordinal 1 finish
  0x9731 key_released_monotonic_nanoseconds U64, not less than `9730`
  0x9732 post_release_key_api_call_count U32, exactly zero
  0x9733 key_double_release_count    U32, exactly zero
  0x9734 key_pointer_bits_serialized BOOL, exactly false
  0x9735 result                       U32, exactly 1
  0x9736 auxiliary_cf_lifetime_set_sha256 SHA256, derived kind 183

SecKeyAuxiliaryCFObjectLifetimeObservation
  0x9771 ordinal                    U32, contiguous 0..5
  0x9772 object_role                U32: 1 attributes dictionary,
                                         2 external-representation CFError,
                                         3 lane-A input CFData,
                                         4 lane-A signature-result CFData,
                                         5 lane-B input CFData,
                                         6 lane-B signature-result CFData;
                                         exactly ordinal plus one
  0x9773 build_lane                 U32, zero roles 1/2, one roles 3/4,
                                         two roles 5/6
  0x9774 cf_type                    U32: 1 CFDictionary role 1, 2 CFError role 2,
                                         3 CFData roles 3..6
  0x9775 source_direct_call_binding_ordinal U32, selects exact kind-131
                                         returning/creating call occurrence
  0x9776 release_direct_call_binding_ordinal U32, selects a distinct exact
                                         final `CFRelease` occurrence
  0x9777 creator_or_copy_plus_one_count U32, exactly 1
  0x9778 content_byte_length        U64, exactly 32 roles 3/5, 384 roles 4/6;
                                         forbidden roles 1/2
  0x9779 content_sha256             SHA256, SHA-256 of copied exact bytes;
                                         required roles 3..6, forbidden roles 1/2
  0x977a source_observation_sha256  SHA256, SHA-256 of complete canonical `9789`
  0x977b object_available_at_monotonic_nanoseconds U64
  0x977c inspection_or_copy_finished_at_monotonic_nanoseconds U64,
                                         not less than `977b`
  0x977d application_public_verification_finished_at_monotonic_nanoseconds U64,
                                         required roles 4/6 and not less than
                                         `977c`; forbidden roles 1/2/3/5
  0x977e released_at_monotonic_nanoseconds U64, not less than `977c` and,
                                         roles 4/6, not less than `977d`
  0x977f retained_through_last_required_use BOOL, exactly true
  0x9780 post_release_read_or_use_count U32, exactly zero
  0x9781 double_release_count       U32, exactly zero
  0x9782 explicit_release_count     U32, exactly 1
  0x9783 inspected_logical_value_count U32, exactly 9 role 1, 2 role 2,
                                         zero roles 3..6
  0x9784 input_is_exact_call_argument BOOL, true roles 3/5, false otherwise
  0x9785 output_is_exact_call_result BOOL, true roles 4/6, false otherwise
  0x9786 result                     U32, exactly 1
  0x9787 inspection_direct_call_binding_count U32, exactly 2
  0x9788 inspection_direct_call_binding_ordinals LIST DirectCallBindingOrdinalRef,
                                         exact count, strictly increasing
  0x9789 source_observation         STRUCT SecKeyAuxiliaryCFSourceObservation

DirectCallBindingOrdinalRef
  0x9791 value                      U32, 0..65,535, selects one complete
                                         enclosing kind-131 member

SecKeyAuxiliaryCFSourceObservation
  0x9792 source_kind                U32: 1 kind-132 attributes, 2 kind-133 export,
                                         3 selected kind-134 signature call
  0x9793 source_observation         STRUCT SecKeyCopyAttributesObservation kind 1,
                                         SecKeyExternalRepresentationObservation
                                         kind 2, SecKeySignatureCallObservation
                                         kind 3
  0x9794 result                     U32, exactly 1

SecKeySignatureCallObservation
  0x8d41 ordinal                    U32, exactly 0 lane A or 1 lane B
  0x8d42 build_lane                 U32, exactly ordinal plus one
  0x8d43 owner_authorization_sha256 SHA256, complete HMG4L2 kind 2
  0x8d44 consumption_claim_sha256   SHA256, derived kind 135
  0x8d45 signing_target_sha256      SHA256, derived kind 182
  0x8d46 signing_client_execution_identity_sha256 SHA256, equal both calls
  0x8d47 opaque_handle_lifetime_ordinal U32, exactly zero
  0x8d48 direct_call_binding_ordinal U32, selects `SecKeyCreateSignature`
  0x8d49 algorithm_symbol           BYTES, exact ASCII
                                         `kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256`
  0x8d4a data_to_sign_length        U64, exactly 32
  0x8d4b data_to_sign_bytes         BYTES, exact `8d4a`, equal transcript digest
  0x8d4c data_to_sign_sha256        SHA256, SHA-256 of `8d4b`
  0x8d4d returned_cfdata_nonnull    BOOL, exactly true
  0x8d4e returned_signature_length  U64, exactly 384
  0x8d4f returned_signature_bytes   BYTES, exact `8d4e`
  0x8d50 returned_signature_sha256  SHA256, SHA-256 of `8d4f`
  0x8d51 error_pointer_result       U32, exactly 1 null CFError
  0x8d52 started_monotonic_nanoseconds U64
  0x8d53 finished_monotonic_nanoseconds U64, not less than `8d52`
  0x8d54 stage4_readiness_execution_sha256 SHA256, complete BuildExecution bytes
  0x8d55 stage6_precall_session_projection_sha256 SHA256, exact HMG4S6P1
                                         projection defined below
  0x8d56 result                     U32, exactly 1
  0x8d57 algorithm_constant_compile_probe_source_sha256 SHA256, equal selected
                                         role-5 BuildSourceUnit
  0x8d58 algorithm_constant_compile_probe_execution_ordinal U32, selected
                                         passing stage-12 execution
  0x8d59 boundary_realtime_seconds U64, immediate paired sample after `8d52`

`8d55` is acyclic. Its exact preimage is eight ASCII bytes `HMG4S6P1`,
big-endian U32 version 1, then these selected values from the sole launch-
profile-4 BuildExecution in this order and encoding: `6181..6184` as four
BE32 values; raw 32-byte `6185`; `6187` as BE32; `6188` as BE64; raw 32-byte
`618c`; `618d` as BE32; raw 32-byte `618f`; raw 32-byte `6190`; `6191` as
BE32; raw 32-byte `6193`; `619f` as BE32; `8da6` as BE32; raw 32-byte `8da9`;
`8daa` as BE64 followed by its exact 64 `8dab` bytes; raw 32-byte `8dac`; and
raw 32-byte `8dd7`, `8dd8`, `8dd9`, and `8dda`. SHA-256 of that complete stream
is the value in both call observations. The projection is frozen immediately
after durable-claim admission, bounded selected-key lookup, attribute read, and export denial
all pass and immediately before call 0 starts.

The projection omits `6189..618e` except the already named `618c/618d`, omits
`6192`, `6194..619e` except `619f`, omits `8da7/8da8/8dae`, and most
importantly omits `8ddb..8de0` and every terminal wait/result/output value that
is not known before call 0. The final BuildExecution is constructed only after
both calls, all six auxiliary releases, final handle release, and terminal
wait; it includes kind 134 at `8ddb`, kind 181 at `8ddc/8ddd`, and kind 183 at
`8dde..8de0`, then recomputes the
same projection from its unchanged selected fields. `8d55` never hashes the
complete final BuildExecution. Both calls require byte-identical projection
hashes, and call 0 must finish before call 1 starts. A selected-field drift,
future-field insertion, complete-execution substitution, call-set inclusion,
profile mismatch, or HMG4S6P1 order/width/endian mutation is a mandatory Gate-B
rejection vector.

BuildSigningClaimNamespacePass
  0x8d61 ordinal                    U32, exactly 0 or 1
  0x8d62 workspace_build_parent_identity_sha256 SHA256, derived kind 15,
                                         identity kind 2
  0x8d63 workspace_build_parent_identity STRUCT CanonicalIdentityMember, kind 2
  0x8d64 target_claim_leaf          BYTES, exact Section-4 PathComponent
  0x8d65 valid_claim_leaf_count     U32, 0..4,096
  0x8d66 valid_claim_leaves         LIST DiagnosticByteString, sorted exact bytes
  0x8d67 valid_claim_leaf_set_sha256 SHA256, derived kind 23
  0x8d68 target_leaf_match_count    U32, exactly zero pre-create, one post-create
  0x8d69 authorization_nonce_match_count U32, exactly zero pre-create, one post-create
  0x8d6a authorization_hash_match_count U32, exactly zero pre-create, one post-create
  0x8d6b started_monotonic_nanoseconds U64
  0x8d6c finished_monotonic_nanoseconds U64, not less than `8d6b`
  0x8d6d result                     U32, exactly 1 complete enumeration
  0x8d6e scan_phase                 U32: 1 pre-create, 2 post-create
  0x8d6f valid_claim_content_set_sha256 SHA256, SHA-256 of BE32 count then each
                                         sorted leaf length/bytes and complete
                                         292-byte claim SHA-256
  0x8d70 parent_identity_stable     BOOL, exactly true

BuildSigningConsumptionClaim
  0x8d71 observation_version        U32, exactly 1
  0x8d72 owner_authorization_sha256 SHA256, SHA-256 of complete `8d74`
  0x8d73 owner_authorization_length U64, 56..16,777,272
  0x8d74 owner_authorization_bytes  BYTES, exact `8d73`, complete HMG4L2 kind 2
  0x8d75 authorization_nonce        BYTES, equal HMG4L2 `8c17`
  0x8d76 claim_template_sha256      SHA256, equal HMG4L2 `8c37`
  0x8d77 signing_target_set_sha256  SHA256, equal HMG4L2 `8c0c`
  0x8d78 signing_key_custody_sha256 SHA256, equal HMG4L2 `8c0f`
  0x8d79 signing_client_set_sha256  SHA256, equal HMG4L2 `8c10.61b4`
  0x8d7a workspace_build_parent_identity_sha256 SHA256, equal HMG4L2 `8c34`
  0x8d7b workspace_build_parent_identity STRUCT CanonicalIdentityMember,
                                         equal HMG4L2 `8c35`
  0x8d7c claim_leaf                 BYTES, equal HMG4L2 `8c36`
  0x8d7d pre_namespace_pass_count   U32, exactly 2
  0x8d7e pre_namespace_passes       LIST BuildSigningClaimNamespacePass,
                                         exact count, pre-create profile
  0x8d7f pre_namespace_pass_set_sha256 SHA256, derived kind 136
  0x8d80 claim_content_length       U64, exactly 292
  0x8d81 claim_content_sha256       SHA256
  0x8d82 claim_content_bytes        BYTES, exact `8d80`
  0x8d83 create_flags               U32, exact SDK-bound
                                         O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW|O_CLOEXEC
  0x8d84 create_mode                U32, exactly 0600
  0x8d85 returned_fd                U32, nonnegative
  0x8d86 held_claim_identity_sha256 SHA256, derived kind 15, identity kind 3
  0x8d87 held_claim_identity        STRUCT CanonicalIdentityMember, kind 3
  0x8d88 write_complete             BOOL, exactly true
  0x8d89 readback_sha256            SHA256, equal `8d81`
  0x8d8a file_fsync_complete        BOOL, exactly true
  0x8d8b file_f_fullfsync_complete  BOOL, exactly true
  0x8d8c parent_fsync_complete      BOOL, exactly true
  0x8d8d post_namespace_pass_count  U32, exactly 2
  0x8d8e post_namespace_passes      LIST BuildSigningClaimNamespacePass,
                                         exact count, post-create profile
  0x8d8f post_namespace_pass_set_sha256 SHA256, derived kind 136
  0x8d90 creation_started_monotonic_nanoseconds U64
  0x8d91 durability_finished_monotonic_nanoseconds U64, not less than `8d90`
  0x8d92 retained_fd_through_both_key_calls_and_u2 BOOL, exactly true
  0x8d93 workspace_only             BOOL, exactly true
  0x8d94 protected_or_runtime_authority_effect_mask U64, exactly zero
  0x8d95 result                     U32, exactly 1 durable consumed
  0x8d96 boot_session_uuid          BYTES, exactly 16, nonzero
  0x8d97 admission_realtime_seconds U64, fresh consumer sample
  0x8d98 admission_monotonic_nanoseconds U64, paired with `8d97`
  0x8d99 not_before_monotonic_nanoseconds U64, checked derivation
  0x8d9a exclusive_expiry_monotonic_nanoseconds U64, checked derivation
  0x8d9b maximum_realtime_backward_tolerance_nanoseconds U64,
                                         equal HMG4L2 `8c2f`
  0x8d9c clock_anchor_result        U32, exactly 1
  0x8d9d post_completion_monotonic_nanoseconds U64, fresh `B1` sample after
                                         both durable post-passes
  0x8d9e post_completion_realtime_seconds U64, paired `B1` realtime second
  0x8d9f timely_durable_claim_admission_result U32, exactly 1

DirectCallBindingMember
  0x8f01 ordinal                    U32, contiguous from zero
  0x8f02 source_unit_ordinal        U32, selects U2 `600b`
  0x8f03 source_unit_role           U32, exactly 1,2,3,5,6,or 7
  0x8f04 source_unit_sha256         SHA256, equal selected `6104`
  0x8f05 callee_token_offset        U64, zero-based within selected `6106`
  0x8f06 callee_token_length        U64, 1..1,024
  0x8f07 callee_token_bytes         BYTES, exact source slice
  0x8f08 call_expression_length     U64, 1..65,536
  0x8f09 call_expression_bytes      BYTES, exact complete source slice
  0x8f0a resolution_profile         U32: 1 public SDK header/prototype probe,
                                         2 compiler intrinsic/runtime profile,
                                         3 held interpreter plus payload
  0x8f0b linkage_class              U32: 1 Mach-O undefined symbol, 2 no
                                         undefined-symbol entry
  0x8f0c nm_symbol_bytes            BYTES, 1..1,024, required class 1 only
  0x8f0d public_header_bytes        BYTES, 1..1,024 exact include spelling,
                                         required profile 1 only
  0x8f0e canonical_prototype_bytes BYTES, 1..4,096 exact public declaration,
                                         required profile 1 only
  0x8f0f compile_probe_source_unit_ordinal U32, required profile 1, role 5
  0x8f10 compile_probe_source_sha256 SHA256, required profile 1
  0x8f11 compile_probe_execution_ordinal U32, required profile 1, stage 12 pass
  0x8f12 resolving_toolchain_ordinal U32, 0..7
  0x8f13 compiler_or_runtime_identity_sha256 SHA256, complete selected
                                         BuildToolIdentity bytes
  0x8f14 invocation_payload_ordinal U32, required profile 3; forbidden otherwise
  0x8f15 compiler_or_runtime_semantic BYTES, 1..255 exact ASCII
  0x8f16 occurrence_sha256          SHA256, SHA-256 of source hash, offsets,
                                         expression bytes, and binding preimage
  0x8f17 result                     U32, exactly 1

PreSignPolicyProjection
  0x8f21 projection_version         U32, exactly 2
  0x8f22 prospective_policy_top_level_count U32, exactly 87
  0x8f23 prospective_transform_length U64, 1..16,777,216
  0x8f24 prospective_transform_bytes BYTES, exact `8f23`, canonical HMG4PST1
  0x8f25 prospective_transform_sha256 SHA256, SHA-256 of `8f24`
  0x8f26 protocol_spec_sha256       SHA256, equal projected P2 `1001`
  0x8f27 predecessor_contract_sha256 SHA256, equal projected P2 `1002`
  0x8f28 plan_sha256                SHA256, equal projected P2 `1005`
  0x8f29 bundle_sha256              SHA256, equal projected P2 `1006`
  0x8f2a xattr_policy_sha256        SHA256, equal projected P2 `1038`
  0x8f2b gate_a_review_report_sha256 SHA256, equal projected P2 `1041`
  0x8f2c gate_a_review_report       STRUCT ReviewedObjectMember, role 9,
                                         binding 2, exact held report
  0x8f2d complete_source_manifest_sha256 SHA256, derived kind 21
  0x8f2e toolchain_set_sha256       SHA256, derived kind 22
  0x8f2f signing_target_set_sha256  SHA256, derived kind 127
  0x8f30 policy_root_identity_sha256 SHA256, derived kind 34
  0x8f31 policy_root_identity       STRUCT ActorIdentity, kind 2 bit 0
  0x8f32 build_controller_actor_sha256 SHA256, derived kind 34
  0x8f33 build_controller_actor     STRUCT ActorIdentity, kind 3 bit 3
  0x8f34 build_signing_owner_identity_sha256 SHA256, derived kind 34
  0x8f35 build_signing_owner_identity STRUCT ActorIdentity, kind 2 bit 20
  0x8f36 acceptance_effect_mask     U64, exactly zero
  0x8f37 production_authority_effect_mask U64, exactly zero
  0x8f38 result                     U32, exactly 1
  0x8f39 signing_key_custody_sha256 SHA256, derived kind 124
  0x8f3a signing_key_custody        STRUCT SigningKeyCustodyIdentity
  0x8f3b output_hole_count          U32, 1..4,096
  0x8f3c output_hole_registry_sha256 SHA256, SHA-256 of canonical `8f3d` LIST
  0x8f3d output_holes               LIST ProspectivePolicyHoleMember, exact
                                         `8f3b` count
  0x8f3e output_dependency_closure_result U32, exactly 1

ProspectivePolicyHoleMember
  0x8fa1 ordinal                    U32, contiguous from zero
  0x8fa2 path_step_count            U32, 1..64
  0x8fa3 path_steps                 LIST ProspectivePolicyPathStep, exact count
  0x8fa4 leaf_source_tag            U32, exact schema tag at the hole
  0x8fa5 leaf_source_type           U32, exact wire type byte `0x01..0x10`
                                         zero-extended to U32
  0x8fa6 dependency_class           U32: 1 final helper complete-file hash,
                                         2 final ExecutableCodeIdentity/hash,
                                         3 transitive bit-10 actor/hash closure,
                                         4 final policy statement/signature
  0x8fa7 derived_hash_kind          U32, zero only for a non-derived output leaf;
                                         otherwise exact Section-4 derived kind
  0x8fa8 result                     U32, exactly 1

ProspectivePolicyPathStep
  0x8fb1 ordinal                    U32, contiguous from zero
  0x8fb2 step_kind                  U32: 1 schema tag, 2 LIST member ordinal
  0x8fb3 step_value                 U32, exact tag or ordinal selected by `8fb2`

PreSignBuildPolicyStatement
  0x8f40 signing_key_custody_sha256 SHA256, equal projection `8f39`
  0x8f41 statement_version          U32, exactly 1
  0x8f42 pre_sign_policy_projection_sha256 SHA256, derived kind 137
  0x8f43 policy_root_identity_sha256 SHA256, equal projection `8f30`
  0x8f44 build_signing_owner_identity_sha256 SHA256, equal projection `8f34`
  0x8f45 build_controller_actor_sha256 SHA256, equal projection `8f32`
  0x8f46 source_manifest_sha256     SHA256, equal projection `8f2d`
  0x8f47 toolchain_set_sha256       SHA256, equal projection `8f2e`
  0x8f48 signing_target_set_sha256  SHA256, equal projection `8f2f`
  0x8f49 gate_a_review_report_sha256 SHA256, equal projection `8f2b`
  0x8f4a acceptance_effect_mask     U64, exactly zero
  0x8f4b production_authority_effect_mask U64, exactly zero
  0x8f4c signature_algorithm        U32, exactly 1 Ed25519
  0x8f4d detached_signature         BYTES, exactly 64
  0x8f4e result                     U32, exactly 1
```

`BuildSourceUnit.role` is exactly 1 production helper source, 2 policy/plan
generator source, 3 fixture-only test source, 4 canonical vector input, 5 build
configuration/ABI probe, 6 build-orchestration script or module, or 7 independent
verification script or module. `610a` equals that role. Only role 1 has
`6109=true` and may enter the production compile command's language input list;
roles 2..7 are forbidden from every production compiler/linker input even when
their bytes are valid source text. Stage-mask bits correspond to BuildCommand
stage minus one. Role 1 has exact mask `0x0000000000000003`; roles 2, 3, and 4
have `0x0000000000000001`; role 5 has `0x0000000000000801` (materialization and
SDK ABI probe); role 6 has `0x00000000000007ff`; and role 7 has
`0x0000000000000781`. Any higher bit is zero. Diagnostic source-relative bytes
are never filesystem authority. `6103` is the exact length of `6106` and `6104`
is SHA-256 of those bytes. The enclosing object cap remains conjunctive; a
source unit too large to embed blocks the receipt rather than becoming a
hash-only member.
`6107` is one or more slash-separated Section-4 PathComponent byte strings,
with no leading/trailing/repeated slash, empty/dot/dot-dot component, backslash,
NUL, non-ASCII, or case-fold collision. It is authority only beneath each fresh
disposable BuildInvocation root. Directories and files are created from held
root FDs without symlinks, every file is exclusive and byte-identical to `6106`,
and no compiler input escapes that layout. All `6107` values are unique and
file-prefix-free: neither an exact path nor its ASCII-case-folded form may equal
another source file followed by `/` and one or more bytes (so `a` and `a/b`
cannot coexist as source files). Shared directory prefixes such as `a/b` and
`a/c` remain valid only when `a` is not itself a source file. All comparisons
are performed over the complete component sequences before materialization, and
both invocations materialize the byte-identical ordinal/path/content set;
`6102` remains only a diagnostic label.

Every DiagnosticByteString used in an actual `execve` argv at `6119`, `6177`,
`600f`, `4b12`, `4ba5`, or `93bc` contains no NUL byte. The list is the complete argv,
not argv-without-argv0: count is at least one, member ordinal zero is nonempty
and byte-identical to the exact absolute held executable path actually passed as
the `execve` pathname, and no later member is omitted even when empty. The C
array is constructed by copying each exact hashed member and appending one
syscall-only NUL; the final NULL pointer and those terminators are not members
and never change a kind-23 hash. Omitted argv0, empty argv0, embedded NUL,
alternate argv0, extra post-hash suffix, or kernel-visible truncation is invalid.

Every BuildEnvironmentEntry name is nonempty ASCII with neither NUL nor `=`;
its value has no NUL. The exact C string is name bytes, one ASCII `=`, value
bytes, and one syscall-only NUL. Kind 24 sorts by complete unsigned name bytes
and rejects duplicates before serialization; the environment pointer array uses
that same order and one final NULL pointer. No inherited variable, ambient
environment, alternate sort, duplicate name, or unrecorded terminator is legal.

`4f41` is kind 140 over `4f42`. The held role-5 compile probe proves target
`PATH_MAX == 1024` and pointer width 8; its stage-12 runtime probe calls
`sysconf(_SC_ARG_MAX)` through the exact kind-131 occurrence and returns
1,048,576. `8ded` equals enclosing `4f25` and `8dee` equals U2 `602c`.
For every launch-profile-2/3 BuildCommand, `8e31` is kind 141 over `8e32`;
profiles 1/4 forbid both fields. `8df3/8dfd` equal `6176/6175`, `8df6/8dfe`
equal `6179/6178`, and `8df2` equals SDK `4f41`. `8df4` is the checked sum of
all argv member lengths, `8df5=argc`, `8df7` sums each name length plus one `=`
plus value length plus one NUL, `8df8=argc+1+envc+1`, `8df9=8df8*8`, and
`8dfa=8df4+8df5+8df7+8df9 <= 1,048,576`. `8dfb` is argv0/path length and
`8dfc=8dfb+1 <= 1024`. All arithmetic is checked before allocation or pointer
construction. Every tool-version query has its own profile-2 BuildCommand whose
argv is byte-identical to `6119`; both build invocations' compile command argv
is byte-identical to `600f`.

Launcher HMG4LC2 `8e33/8e34` repeats the admitted SDK kind-140 identity and
`8e35` is kind 141 over `8e36`; its argc/hash/path equal `4ba4/4ba5/4ba3`, its
environment count/hash are the canonical empty kind-24 set, and the identical
PATH_MAX/ARG_MAX/pointer-width rules apply. No 4,096-byte configuration cap or
source-language array bound substitutes for these kernel-facing limits.

The eight ToolchainMember values are closed exact identities, not hash labels.
Ordinals and roles are one-to-one in the displayed order: build controller, SDK
locator, compiler, linker, signing assembler/key client, independent verifier,
`nm`, and `otool`. The compiler and SDK locator are also copied
at U2 `600c/600d`; every other tool is available only through `603b`. `7d14` is SHA-256 of the exact canonical
nested `7d12` bytes. The stage masks are respectively stages 1, 5, 11, and 13;
12; 2; 3; 4, 6, and 7; 8; 9; and 10. A role swap, missing tool, ninth tool,
unlisted executable child, or stage outside the role mask is invalid.

For every tool, `6117` is kind 23 over `6119`, `6118` agrees, exit status is
zero, stderr is exactly empty, and `6112` is the exact complete stdout with no
normalization. Version/query arguments and expected bytes are frozen in U2 and
re-execution must reproduce them byte-for-byte. Each `6115` has role 5,
encoding 3, binding 2 and a unique diagnostic identifier
`tool/<role-number>/executable`. It names one held ordinary file in the slot-2
review store, is 1..1,073,741,824 bytes, and `6113 == 6115.7d45`; locator length,
ProtectedFileIdentity, stable-pass scan, link count, and streamed complete bytes
all agree. `611a` is kind 15 over `611b`; `611b.7c01 == 11`, its nested
ObservedExecutableIdentity is a signed Mach-O, and its device/inode/length/
content hash equal the retained executable vnode actually passed to `execve`.
The version and build commands launch only that held identity. Pathname-resolved
replacement, shell indirection, environment PATH lookup, wrapper substitution,
or version bytes from another process are invalid.

`6114` is kind 15 over `6116`. The compiler's identity kind is 17 and equals U2
`602b`; the SDK locator's identity kind is 16 and equals U2 `602a`; every other
tool uses the exact applicable held OS/SDK identity selected by its declarations
and probes. No name, version string, bare hash, or host default substitutes for
a complete canonical identity. Provenance profile 1 requires `610d=0`, the
canonical empty kind-27 hash at `610c`, and forbids `610f/6110`. Profile 2
requires 1..64 complete payload members, each bound byte-for-byte to one role-6
or role-7 BuildSourceUnit and passed in the exact BuildCommand argument list;
the executable is only the held interpreter and cannot authorize an omitted
script, module, plug-in, configuration, or imported code byte. Profile 3
requires zero payloads plus a complete earlier passing HMG4U2 at `610f` and its
passing independent HMG4E2 review at `6110`; both are reopened and prove this
exact executable. A tool built in either current A/B lane cannot use profile 3
to authorize itself. The signing tool and independent verifier must have
different executable and payload-set hashes. E2 kinds 1, 2, 4, and 5 reopen and
rehash all eight executable/payload identities and include their complete
BuildToolIdentity bytes as binding-1 inputs.

For profile 3, `610f == SHA256(6092)` and `6092` parses byte 0 through EOF as
one passing earlier HMG4U2 whose final tool artifact bytes/hash equal `6115` and
`6113`. `6110 == SHA256(6094)` and `6094` parses byte 0 through EOF as one
passing HMG4E2 kind 5 whose mandatory inputs contain that exact U2 and complete
tool identity and whose finding counts are zero. The earlier U2 remaining
recursive receipt cap and local `6091` cap are both enforced. Profiles 1/2
forbid `6091..6094/610f/6110`; profile 3 requires them. A passing label,
truncated frame, hash with absent bytes, review of a different tool, or
current-lane self-bootstrap is invalid.

Kind 131 is the source-level external-call authority. A pinned, held parser from
toolchain role 7 scans every role-1/2/3/5/6/7 BuildSourceUnit byte 0 through EOF
under its exact language profile and emits one DirectCallBindingMember for every
syntactic direct external call occurrence. `8f05..8f09` are exact source slices;
offset/length overflow, overlapping alternate tokenization, call-producing
macro expansion without an original-source occurrence, indirect function
pointer call, Objective-C dynamic selector, `dlsym`, inline assembly call,
generic `syscall`, reflection/import by computed name, or unparsed source region
is forbidden. Internal functions are closed by the same parser's definition/
call graph and do not enter kind 131; every edge leaving that graph does.

Resolution profile 1 names one public SDK header and the exact canonical public
prototype. Its selected role-5 probe source includes that header and assigns the
symbol to an exact typed pointer or otherwise causes a compile-time type error on
any return/parameter/calling-convention drift; the selected stage-12 execution
uses the held compiler/SDK and passes. Profile 2 is limited to a compiler
intrinsic or language-runtime operation named by exact compiler identity,
version, target, and `8f15`; it has no header/prototype or invocation payload.
Profile 3 names the held interpreter identity plus one exact `610e` payload
member, and the occurrence resolves only within that payload/runtime profile.
All conditionally forbidden fields are absent, never zero-filled.

Linkage class 1 is used exactly when the production Mach-O has a corresponding
undefined symbol. Its `8f0c` is the exact `nm -u` byte spelling. Linkage class 2
is permitted only for a compiler-resolved intrinsic or held-interpreter call.
The unique-symbol projection of every class-1 member is kind 25 and equals both
U2 positive nm lists; conversely every nm member selects one or more source
occurrences. Repeated calls remain distinct kind-131 members even though the nm
projection deduplicates their identical symbol. The kind-1 source-scan report is
the exact complete kind-131 derived stream, not prose. Security observation
selectors `8dc3`, `8d15`, `8d24`, and `8d48` select the unique registry member
with callee respectively `SecItemCopyMatching`, `SecKeyCopyAttributes`,
`SecKeyCopyExternalRepresentation`, and `SecKeyCreateSignature`; no unbound API
name, late-resolved call, or kind-90 ABI row substitutes for a source occurrence.
Lookup selectors `9702`, `9703`, `970a`, and `970b`, plus lifetime selector
`9728`, select distinct exact kind-131 source occurrences of, respectively,
`CFGetTypeID`, `SecKeyGetTypeID`, query `CFDictionaryCreate`, query-dictionary
`CFRelease`, and final selected-key `CFRelease`. A single call row cannot
satisfy two occurrences merely because its callee token is equal. The public
query members' `9748` select distinct `CFNumberCreate` and `CFDataCreate`
occurrences, and their `974b` select two additional distinct `CFRelease`
occurrences after dictionary construction; none may alias `970b` or `9728`.
Every auxiliary-lifetime `9775` selects its exact source occurrence:
`SecKeyCopyAttributes`, `SecKeyCopyExternalRepresentation`, lane-specific
`CFDataCreate`, or lane-specific `SecKeyCreateSignature`; each `9776` selects
one additional pairwise-distinct `CFRelease` occurrence that aliases none of
`970b`, `9728`, or the query-member releases. Thus all six auxiliary +1
objects have separate source and release authority in the complete kind-131
registry. Each `9788` contains two further distinct source occurrences: role 1
selects `CFDictionaryGetCount` and `CFDictionaryGetKeysAndValues`; role 2
selects `CFErrorGetDomain` and `CFErrorGetCode`; roles 3..6 select
`CFDataGetLength` and `CFDataGetBytes`. These inspection calls finish while the
selected +1 object is live and no returned pointer value is serialized.
The public
`kSecMatchLimitOne` and other query constants are exact SDK-typed extern
objects retained by the query dictionary, not locally constructed or released
objects.
Kind 90 remains limited to type/layout-critical ABI declarations.

Each BuildInvocation root is created beneath the same byte-identical held
slot-2 `612d` parent. Its final PathComponent is exactly ASCII `build-`
followed by lowercase hex of all 32 `6121` bytes; `6121` is nonzero and the two
invocations' nonces differ. `612c.220f` is exactly the parent `612d.220f`
followed by that component, and its edge list is the parent's list followed by
one held directory edge. Both roots' complete component sequences, edge sets,
device/inode pairs, and leaves differ; neither is an authority slot root or a
production ProtectedParent. The parent is a policy-fixed slot-2 workspace build
parent with zero production/evidence/custody/install/transaction authority.
Root creation is exclusive/fail-closed under the separately authorized
workspace-only build procedure; it cannot create or modify any protected
installation or original-runtime object.

Immediately after creation and before any source materialization, two complete
FD-relative scans of each held root yield zero entries; `612e == 0`, `612f`
is the exact empty kind-74 stream, `6144 == 2`, and `6145` contains those two
complete BuildTreeScanPass values. After the tool exits and before U2 assembly,
two more scans yield byte-identical `6141` values and `6142`, and `6147`
contains those two complete pass values. `6146/6148` are kind 80 over
`6145/6147`. In every pass, `6162` is kind 15 over `6163`, `6163.7c02` is
byte-identical to `612c`, and `6166` is kind 74 over `6165`; all counts agree.
Both pre-pass lists are empty and both post-pass lists equal `6141` after
ordinal normalization. Pass 0 finishes no later than pass 1 starts. Any root,
entry, count, hash, or identity difference blocks rather than being collapsed
into the top-level scan hash.
BuildTreeMember values are sorted by unsigned complete `6152` bytes, paths are
unique and ASCII-case-fold unique, directories precede descendants, and no
symlink, hardlink, socket/device, mount crossing, nonempty ACL/xattr, unknown
object, or scan error is legal. The checked sum of file `6154` is at most
16 GiB. Every BuildSourceUnit occurs once as an ordinary-file member with
`6152/6154/6155 == 6107/6103/6104`. Exactly one ordinary member has path
`6143`, length/hash `6125/6126`, and is the final signed helper. Every other
`6143` is distinct and file-prefix-free in both directions from every `6107`
source path, including under ASCII case fold. Every other
compiler intermediate is still enumerated and the complete post-build
BuildTreeMember lists of A and B are byte-identical after ordinal normalization.
Both held roots and their contents remain retained and unchanged through U2 and
Gate-B review; reuse of one root, a dirty pre-scan, omitted temporary/output,
post-scan drift, or arbitrary nonce blocks.

The build registries are complete. Top-level kind 122 assigns
`61a1 == 61b0 ==` global ordinal. A BuildCommand input/output projection selects
global members by `61b0`, orders by that value, and reassigns only `61a1`
contiguously; every other byte remains identical. Producer/consumer fields and
StageEdge `8b04` always use `61b0`. Every ordinary artifact is opened relative
to the held lane root, has one stable link, and `61ae` kind 15 over `61af` equals
the actual retained vnode before and after its consumer. `61af.7c02` is a
ProtectedFileIdentity whose length/hash/metadata equal `61a5/61a6/61a7`; a
path+hash or BuildTreeMember without this held-inode continuity is invalid.
Each command's `617b/617e` are kind 122 over its exact projections; arguments,
environment, cwd, inputs, and outputs are therefore reviewable preimages rather
than a command-line summary.

Toolchain ordinal 0 is the build controller. BuildCommand stage 13 and
BuildExecution ordinal 0 describe its complete session; policy `1054/1055`, U2
`605c/605d`, toolchain member 0, execution code, process credential, and public
birth tuple all cross-equal. Internal stages 1, 5, and 11 use launch profile 1,
tool ordinal 0, the same process/code/credential identity, disjoint monotonic
intervals within the stage-13 session, and no `waitpid` fields. Stages 2, 3,
7..10, and 12 use ordinary launch profile 2 and exactly the selected
noncontroller tool. Stage 4 occurs once with common lane 0 and launch profile 3:
the controller forks/execs the signing assembler/key client, which prepares both
lanes' CodeDirectory/attribute artifacts, emits the exact 64-byte readiness
record, and remains alive without opening a keychain item or invoking any
Security key API. Stage 6 occurs once with common lane 0 and launch profile 4,
only after the dual-signed HMG4L2 and the durable claim's timely `B1` admission:
no new process is created; the same birth tuple, credential, executable,
readiness hash, pipes, and opaque-handle lifetime continue, both lane calls occur
in order, and only then does the controller perform terminal `waitpid`.
The two common commands' input/output projections contain both lanes' selected
global artifact ordinals in ascending order. Stage 4 may produce only the two
CodeDirectory and two signed-attribute artifacts; stage 6 may produce only the
two raw-signature artifacts. A common command never makes either lane root or
artifact common and never changes its `61a2` lane.

For every process creation the controller uses only SDK-bound `fork`, child
`fchdir`, `dup2`, `close`, and `execve`; terminal profiles use parent `waitpid`.
It supplies an exact absolute held executable from `611b`, an exact held cwd,
canonical argv/environment arrays, and no shell, PATH search, wrapper, dynamic
lookup, or transitive child. Child PID/PPID/birth tuple, raw wait bits, normal
exit status zero, and complete stdout/stderr bytes are recorded. `619c..619e`
are forbidden for profiles 1/3 and required for profiles 2/4; profile 4's PID
equals its selected stage-4 predecessor. Profile-3 stdout is exactly the
readiness frame and its stderr is empty; profile 4 records the remaining complete
stream through process exit. `6196/6199` lengths and `6197/619a` hashes are
recomputed even for empty streams. `8da6..8dae` make the stage-4/stage-6 pair a
single process lifecycle; sharing only a pathname, tool hash, or PID without the
public birth tuple is invalid.

The readiness frame is the fixed HMG4RDY1 byte grammar, not an opaque 64-byte
token. Bytes 0..7 are the eight ASCII bytes `HMG4RDY1`; bytes 8..11 are the
big-endian U32 version 1; bytes 12..15 are the big-endian U32 total length 64;
and bytes 16..63 are exactly forty-eight zero bytes. Its complete hex value is
`484d4734524459310000000100000040` followed by 96 zero hex digits, and its
SHA-256 is exactly
`90ba74c6758a7a2dffacd1a640073168d211650d22e7f792154ba9b35ada728b`.
For both launch profiles 3 and 4, `8daa=64`, `8dab` is byte-identical to that
complete grammar, and `8da9` is its recomputed SHA-256; profile-3 stdout
`6196..6198` is the same 64 bytes and hash. The assembler generates the frame
into a fixed 64-byte zero-initialized array by copying the magic and storing
the two integers with explicit big-endian byte operations, then parses and
compares all 64 generated bytes and the recomputed digest before emission.
Native structs, host-endian stores, padding, timestamps, randomness, partial
writes, and hash-only acceptance are forbidden. Gate B includes the positive
frame, length 63/65, little-endian version and length, every one-byte mutation
at each of the 64 offsets, nonzero reserved bytes, generation/readback drift,
and one-sided `8da9/8daa/8dab/6196..6198` mutations.

An external-child pre-exec phase has exactly three BuildFDRecord members: FD 0 read-only
stdin and FD 1/2 write-only stdout/stderr, each a distinct anonymous-pipe endpoint
with descriptor flags zero at exec and the exact SDK status flags. All duplicates
and every FD at least 3 are closed in the child before `execve`; the pre-exec
inventory is emitted by the reviewed controller path and cross-checked against
the parent endpoint plan. The profile-3 signing client retains only those three
endpoints through readiness and profile 4; the controller's complementary peers
remain byte-for-byte the same open-file descriptions and are inventoried before
and after both calls. Internal controller stages have two complete FD inventories.
Each includes its stdio pipes plus every held lane root, input, exclusive output,
and—only for stage 5—complete HMG4L2 and durable-claim file FDs. Kind-1 vnode
records use `61f7/61f8` and forbid `61ef/61f0`; pipe records use `61ef/61f0` and
forbid `61f7/61f8`. Phase-2 differs only by the exact output artifacts authorized
by the command. Missing, extra, duplicate, writable-input, replaced, unclassified,
or unstable FD blocks. The controller's zero caller-observed socket count covers
only its own public FD inventory; it makes no claim about Apple Security's opaque
broker transport.

The closed build DAG is:

```text
controller session + SDK ABI probe
  -> lane A/B exclusive root + materialization
  -> lane A/B role-1-only compile
  -> lane A/B explicit linker -> unsigned thin arm64 Mach-O
  -> one common retained signing client prepares lane A/B CodeDirectory and signed attributes
  -> both complete SigningAuthorizationTarget values frozen and byte-compared
  -> one owner HMG4L2-kind-2 admission
  -> durable workspace-only no-replace consumption claim + timely B1
  -> same live opaque key handle: exactly one lane-A then one lane-B SecKeyCreateSignature call
  -> six auxiliary +1 CF objects inspected/verified and released exactly once
  -> lane A/B signed-Mach-O assembly
  -> distinct-tool independent verification
  -> nm -> otool -> final stable scan
  -> byte-identical complete signed binaries
  -> final P2 projection equality + separate offline policy-root signature
  -> U2
```

Every arrow has exactly one StageEdge. Class 1/4 selects a global artifact;
class 2 selects one child execution and forbids an artifact; class 3 embeds the
complete canonical HMG4L2-kind-2 frame, requires `8b09` equal its exact complete
frame length and `8b0a == SHA256(8b0b)`, and forbids both artifact and child.
Class 5 selects U2 `6069/606a`; `8b0d` equals `606a.8d86`, and class 5 forbids
artifact, child, and authorization-frame fields. The authorization-to-claim
arrow is class 3 and the timely-durable-claim-to-stage-6 arrow is class 5;
class 5 requires `8b0c == 6069` and nested `606a.8d9f == 1`.
No stage may consume an
artifact before its producer, and the graph must be acyclic with both lanes
structurally identical. The two target members have equal unsigned Mach-O,
CodeDirectory, signed-attribute, signing-preimage, algorithm, signer, key, and
relative-output bytes; only ordinal/lane and the necessarily distinct complete
lane-root identity differ. `8b13..8b16` recompute `8b1d..8b21`, `8b1b` is kind
15 over `8b22`, and all three held artifact identities remain open through owner
authorization and both signer transcripts. Owner authorization occurs only
after both targets and common-client readiness are complete; the durable claim
and passing `B1` occur after authorization admission and before any key access.
The HMG4L2 two-use counter covers only the two RSA code-signing calls. It does
not authorize the policy-root Ed25519 signature on either the pre-sign statement
or final P2. Those are two separate offline policy-root ceremonies under an
explicit future owner grant; the latter occurs only after both helper outputs
exist and projection equality passes. Failure or refusal at either ceremony
blocks the build and grants no additional key use.

Signing-key derivation is acyclic and staged. First construct `61bc`, the
nonsecret pre-attribute access-policy statement, as exactly: eight ASCII bytes
`HMG4KAC2`; big-endian U32 version 2; big-endian U32 values `61b7`, `61b8`, and
`61b9`; U8 values `61ba` and `61bb`; two zero reserved bytes; big-endian U32
length of `61be` followed by exact public-SPKI DER `61be`; raw 32-byte
public-SPKI hash `61bf`; raw 32-byte independently provisioned application
label `61cf`; raw 32-byte label hash `61d0`; big-endian U32 length followed by exact ASCII
`apple-security-keychain`; raw 32-byte prospective `8dc5` for the complete
canonical bounded selected-key query statement; raw 32-byte signer-tool
identity hash; raw
32-byte owner bit-20 ActorIdentity hash; big-endian U32 algorithm 1; raw
32-byte `61b4`; big-endian U32 maximum-use count 2; five U8 zero values for
generation/import/export/network/UI; and three zero reserved bytes. It
expressly excludes `61b6`, `61bd`, `8c0c`, `8c0f`, every target, and every
complete-custody hash. `61bd` is SHA-256 of those exact `61bc` bytes.

Only after `61bd` exists are the eight SigningKeyAttributeMember values
constructed: 1 private key class (U32 1), 2 RSA key type (U32 1), 3 extractable
(false), 4 permanent (true), 5 application label (`61cf`), 6 canonical
access-policy SHA-256 (`61bd`), 7 exact ASCII `apple-security-keychain`, and 8
size bits (U32 3072). Kind 128 over the complete `61cd` list then equals
`61b6`; kind 124 over the now-complete custody object is computed last. Thus
neither `61b6 -> 61bd -> 61b6` nor target-set -> custody -> target-set is a
legal dependency. Persistent references, SecKeyRef pointer bits, keychain item
references, tokens, passwords, secrets, and any other bearer attribute are
forbidden. `61cf` is an exact nonsecret owner/provisioning-authority input and
`61d0` is only SHA-256 of those label bytes. It is distinct in meaning and
canonical field identity from public SPKI DER/hash `61be/61bf`; this contract
infers no hash algorithm, derivation, or equality between an Apple application
label and DER SPKI. The sole lookup selector is exact
`kSecAttrApplicationLabel` bytes `61cf`; no application tag, label string,
persistent reference, or ambient default key may select the key.
`61bc` is a contract statement, never a serialized provider dictionary,
access-control object, key reference, or claim about undocumented provider
state. Gate B includes self-reference reintroduction, HMG4KAC1/version-1,
wrong-endian/width/order/reserved-byte, DER A/SPKI-hash B, label A/label-hash B,
label A/SPKI B, code-6 A/policy B, and target-hash-inside-policy negative
vectors.

`61b2` is kind 15 over `61b3`. It identifies the held ordinary Mach-O file at
the exact OS-selected Security.framework executable, with complete content,
metadata, one link, and stable before/after identity. The signing client is
linked to that exact framework through the observed library allowlist and the
direct-call registry. This is the public client API implementation boundary; it
does not identify `securityd`, a keychain daemon, XPC endpoint, Mach service,
provider PID, provider FD, or provider executable.

`607a` is kind 139 over `607b`. Its `9709=8`, `9712` is the complete canonical
query-member list, and `9711` hashes that exact canonical LIST value. Ordinals
0..7 are respectively: `kSecClass` -> `kSecClassKey` (extern CFString);
`kSecAttrKeyClass` -> `kSecAttrKeyClassPrivate` (extern CFString);
`kSecAttrKeyType` -> `kSecAttrKeyTypeRSA` (extern CFString);
`kSecAttrKeySizeInBits` -> `kCFNumberSInt32Type` signed-32 value 3072
(created CFNumber); `kSecAttrApplicationLabel` -> exact 32 bytes `61cf`
(created CFData); `kSecReturnRef` -> `kCFBooleanTrue` (extern CFBoolean);
`kSecMatchLimit` -> `kSecMatchLimitOne` (extern CFString); and
`kSecUseAuthenticationUI` -> `kSecUseAuthenticationUIFail` (extern CFString).
Every key is the exact public extern CFStringRef named by `9742`; kinds 1/2
use the exact extern object named by `9744`. No locally created substitute,
equal-looking string/data, bridged object, or pointer serialization is legal.

The canonical `8dc6` HMG4SKQ1 stream is: eight ASCII bytes `HMG4SKQ1`; BE32
version 1; BE32 member count 8; then every `9712` member in ordinal order as
BE32 ordinal, BE32 key-symbol length and exact ASCII key symbol, U8 value kind,
and three zero reserved bytes. Value kinds 1/2 then encode BE32 value-symbol
length and exact ASCII symbol; kind 3 encodes BE32 number-type-symbol length,
exact ASCII `kCFNumberSInt32Type`, and signed big-endian 32-bit 3072; kind 4
encodes BE32 length 32 and exact label bytes `61cf`. EOF follows the eighth
member. `8dc4/8dc5` are the exact length/hash of those bytes; decoding them
must reproduce `9712/9711` byte-for-byte. Thus kind 139 hash-binds both the
portable HMG4SKQ1 semantics and native-construction/ownership evidence.

Native construction is exact and ordered. A signed `int32_t size_s32=3072` is
passed to the distinct kind-131 `CFNumberCreate(NULL,
kCFNumberSInt32Type,&size_s32)` occurrence selected by ordinal 3 `9748`; the
exact label pointer and `CFIndex(32)` are passed to the distinct kind-131
`CFDataCreate(NULL,label,32)` occurrence selected by ordinal 4 `9748`. Both
returns are nonnull Copy-rule +1 objects. The eight key/value pointers are
placed only in canonical member order, and `970a` selects
`CFDictionaryCreate(NULL,keys,values,8,&kCFTypeDictionaryKeyCallBacks,
&kCFTypeDictionaryValueCallBacks)` with the exact callbacks named by
`9713/9714`. Dictionary creation retains eight keys and eight values. Only
after successful creation, distinct kind-131 `CFRelease` occurrences selected
by the number/data `974b` release each creator-owned +1 exactly once, in that
order; the dictionary still owns its retained references. The SecItem call
then runs. Only after it returns at `971f` does the distinct query-dictionary `CFRelease`
at `970b/970c` run once, causing exactly sixteen callback releases. Required
ordering is `9719 <= 971a <= 971b <= 8dd3 <= 971f <= 971c <= 9720 <= 8dd4`;
the public result-type calls finish by `9720`, before lookup completion;
`9715/9716=16`,
`9717/9718=2`, all member retain/release counts agree, and `971d/971e=1`.
The selected SDK/role-5 probe at `970d/970e` freezes every extern type, both
dictionary callbacks, `kCFNumberSInt32Type`, and the public CFNumberCreate,
CFDataCreate, CFDictionaryCreate, and CFRelease prototypes without treating
pointer bits as canonical data.

One `SecItemCopyMatching` call returns `errSecSuccess` and one nonnull direct
Copy-rule +1 result, bounded by `kSecMatchLimitOne`; it never asks the provider
to materialize an unbounded result array. The result is first treated only as
`CFTypeRef`. Before any cast or key API, the source-bound calls selected by
`9702/9703` prove `CFGetTypeID(result)==SecKeyGetTypeID()`. These calls use
SDKABIBinding profiles 69/70 and exact kind-131 occurrences; runtime type IDs
are compared for equality and are never frozen as portable numeric constants.
Only then does the result become non-bearer lifetime ordinal zero. `8dd4` is
taken after the type and query-dictionary ownership checks.

This is a bounded selected-key lookup, not a uniqueness enumeration. A missing
item or wrong returned type fails before the first signature call. Multiple
provider items sharing a label confer no additional authority: MatchLimitOne
selects at most one; that selected key must still pass the exact attribute map,
private-export denial, and both independent signature verifications under
`61be/61bf`. A wrong duplicate can therefore only cause fail-closed rejection;
neither its existence nor its application label proves acceptance. Kind 181
later proves that the direct +1 SecKey survives all dependent calls and is
released exactly once only after call 1, followed by zero key API calls and
zero double releases. Kind 181 is omitted from the pre-call projection, so the
post-call lifetime proof introduces no future-data cycle.

Kind 183 closes every other +1 Security/CoreFoundation object in the same
continuation. `6080` is kind 183 over `6082`, `6081=6`, and the sole
launch-profile-4 BuildExecution repeats that hash/count/list at `8dde..8de0`.
Kind 181 `9736` and both transcripts `8dbc` equal `6080`; transcript 0 selects
input/output members 2/3 at `8dbd/8dbe`, and transcript 1 selects members 4/5.
Kind 183 depends only on the already complete kind-132/133/134 observations
and never on a transcript or final BuildExecution, so those final objects may
bind it without a cycle and HMG4S6P1 continues to omit it.

Member 0 is the nonnull Copy-rule +1 dictionary returned by
`SecKeyCopyAttributes`. Its nine borrowed key/value pairs are inspected and
copied into the complete `8d1a` logical map while the dictionary remains live;
`9789.9793` is byte-identical to `606c`, `977a` hashes the complete kind-1
wrapper, `9783=9`, and its one final release follows the last copy.
Member 1 is the nonnull +1 CFError returned through the failed
`SecKeyCopyExternalRepresentation` call. Its domain and code are copied while
live and equal `606e.8d28/8d29`; `9789.9793` is byte-identical to `606e`,
`977a` hashes the complete kind-2 wrapper, `9783=2`, and its one final
release follows both reads. There is no returned CFData in that failure path.

Members 2/4 are two distinct nonnull +1 CFData objects created by two distinct
`CFDataCreate(NULL,digest,32)` occurrences immediately before lane A/B calls.
Their copied length/hash/bytes equal the selected call's `8d4a..8d4c`; they
remain live as the exact `SecKeyCreateSignature` data argument through call
return and are then released once. Reusing one input object for both lanes,
constructing different bytes, releasing before return, or retaining either
object is invalid. Members 3/5 are the two distinct nonnull Copy-rule +1
CFData results of those calls. Their copied 384 bytes/hash equal the selected
`8d4e..8d50`. Each remains live through byte extraction and an immediate
application-side verification of those copied bytes under pinned public SPKI
`61be/61bf`; this verification is independent of the opaque provider result but
is performed in the retained signing client. `977d` is no later than the
member's release. The later distinct-tool verification recorded by transcript
`8e12=true` reuses only the copied bytes and may occur after the CFData release.
It is then released once.
For roles 3..6, `9789.9793` is byte-identical to the selected complete `6071`
member, source kind is 3, and `977a` hashes that complete wrapper.
All six `977b..977e` timestamps lie inside stage 6, preserve source/call order,
and precede the selected-key release `607d.9731`; `977f/9782/9786` are one and
`9780/9781` are zero. No pointer bits or borrowed object identity is serialized.

Missing/null result, CFArray/dictionary/data/identity result, any non-SecKey
type, type call after cast/use, `kSecMatchLimitAll`, omitted/default match
limit, returned-reference count other than one, query-dictionary leak/double
release, selected-key early/missing/double release, key use after final release,
auxiliary object NULL source, wrong CF type, input/result substitution,
early/missing/double auxiliary release, auxiliary leak, post-release read/use,
borrowed dictionary/error value read after release, shared lane input/output
CFData, or application public verification after output-CFData release,
application-label A/custody-label B, or label A/pinned-SPKI B with either
signature failing independent verification is a mandatory one-sided Gate-B
rejection. No count assertion or application-label hash substitutes for the
direct public type and pinned-SPKI signature checks.
Gate B also covers every query member omitted/duplicated/reordered, key/value
swap, wrong extern symbol/type, CFNumber type or signed width drift, numeric
3072 endian/value drift, CFData length/label drift, NULL create result, native
array order drift, non-kCFType callback, create/release ordinal alias, release
before dictionary retention, temporary leak/double release, dictionary
leak/double release, callback retain/release count drift, HMG4SKQ1/list/hash
one-sided mismatch, and construction/ownership timestamp inversion.

`606b` is kind 132 over `606c`. Its ten logical selectors are complete even
when token-id is absent. Selectors can-encrypt, can-decrypt, can-derive,
can-sign, and can-verify are respectively false, false, false, true, and false;
key class/type are exact symbols `kSecAttrKeyClassPrivate` and
`kSecAttrKeyTypeRSA`; key size is 3072; token-id is absent; and application
label is exactly the 32 bytes `61cf`, with `8d1c==61d0`. Thus raw dictionary key count is nine and
unknown-key count is zero. This deliberately pins the OS/SDK behavior despite
Apple documenting the returned dictionary as extensible: an added, omitted, or
different key/value blocks and requires a successor rather than being ignored.
`SecKeyCopyAttributes` is called on the exact ordinal-zero handle from `607b`.

`606d` is kind 133 over `606e` and uses that same live handle after the attribute
call. `SecKeyCopyExternalRepresentation` must return NULL and a non-NULL CFError;
`CFErrorGetDomain` must compare equal to `kCFErrorDomainOSStatus`, whose exact
serialized ASCII spelling here is `NSOSStatusErrorDomain`, and
`CFErrorGetCode` must equal the SDK-compiled signed value
`errSecDataNotAvailable == -25316`. The role-5 compile probe and its passing
stage-12 execution bind the signed width/value. A different failure, missing
error, returned byte, or absent same-handle continuity blocks after the durable
claim and before the first signature call; the authorization remains consumed.
`61c2..61c5` are the pre-sign expected outcome that `606e` must match; they are
not themselves an actual API observation.

`61c0` is an unambiguous certificate stream: big-endian U32 count equal
SigningProfile `4c0a`, then for each `4c0b` member in ordinal order a big-endian
U32 DER length and exact DER certificate bytes. Each member's length/hash/bytes
agrees, the leaf SPKI equals `61be/61bf`, and `61c1` hashes the complete stream.
The failed external-representation domain/code is therefore not a free runtime
mapping. A returned byte, absent error, different error, exportable attribute, or
key generation/import attempt blocks before the first signature call; because
the durable claim already exists, the authorization remains consumed. `61c6` is only
this HMG4L2 session's maximum authorized uses; it is not asserted as a global
provider counter or key property. `61b4` is kind 130 over the one complete
common `8e20` client and `61b5=1`. It equals the retained common stage-4
readiness BuildExecution and signer tool. This is the application signing-client
execution, not securityd or another provider process, and it claims readiness
only at target freeze. Final stage-6 execution and both call observations prove
the later lifecycle. No provider PID, FD, XPC, Mach-port, or hidden global-use
claim exists.

Application call bytes are exactly: eight ASCII bytes `HMG4SKR1`, U32 version 1,
complete HMG4L2 SHA-256, complete durable-claim SHA-256, U32 use ordinal, target
kind-182 selected-target projection hash, exact algorithm-symbol length/bytes, U32 data length
32, the exact SHA-256 digest bytes passed as `dataToSign`, and public-SPKI
SHA-256. Application result bytes are exactly: eight ASCII bytes `HMG4SKS1`,
U32 version 1, U32 use ordinal, U32 status zero, BOOL CFError-null true, U32
signature length 384, and the exact signature. These are application-side
`SecKeyCreateSignature` call/result records, not wire transcripts from the
opaque Apple broker, and neither contains a key reference. Transcript hashes/
lengths recompute those complete bytes;
`61e3/61e5` equal target signed attributes/signing preimage; `61d9` is SHA-256 of
`61e5`; `8d4b` is exactly the 32-byte `61d9`, because the selected Security API
algorithm consumes a digest, not the full signed-attributes preimage; and raw
signature/CMS fields are reverified by the distinct verifier.
For each lane, the transcript and its nested call observation close in both
directions, field by field: `61d1/61d2 == 8db5.8d41/8d42`; `61d3 ==
8db5.8d43 == 6051`; `8db0 == 8db5.8d44 == 6069`; `61d4 ==
8db5.8d45` and both equal that lane's kind-182 selected-target projection;
`8db5.8d46 == 6055.8e20[0].8e23`; `8db6 == 8db5.8d47 == 0`; the selected
target has `8b17=1` and `8db5.8d49` is its contract-fixed Security algorithm;
`61d9 == 8db5.8d4b`; `61db/61da == 8db5.8d50/8d4f`; and `61ea/61eb ==
8db5.8d52/8d53`. The exact HMG4SKR1 call stream is independently rebuilt from
the nested `8db5` fields plus the pinned `61ec` SPKI hash in the frozen order
above; `61e6` is its exact length, `61e7` is byte-identical to the rebuilt
stream, and `61df=SHA256(61e7)`. The exact HMG4SKS1 result stream is likewise
rebuilt from `8db5.8d41`, success status zero, `8db5.8d51`, and
`8db5.8d4e/8d4f`; `61e8` is its exact length, `61e9` is byte-identical to the
rebuilt stream, and `61e0=SHA256(61e9)`. Neither a nested observation nor a
transcript may carry an extra fact absent from its peer. Gate B mutates each
equality and each reconstructed call/result field one side at a time, including
client, handle, algorithm, ordinal/lane, target, digest, signature, timestamps,
length, bytes, and hash; every such locally rehashed mismatch rejects.
Both transcripts additionally require `8dbc==6080==8dde`. Transcript 0 has
`8dbd/8dbe=2/3`; transcript 1 has `8dbd/8dbe=4/5`. The selected input member's
content equals `8db5.8d4a..8d4c`, remains live through the call, and releases
after return; the selected output member's content equals `8db5.8d4e..8d50`,
remains live through `977d` application-side public verification, and releases
afterward; the later distinct-tool `8e12` check consumes copied bytes, not the
released CFData object.
Member selection, content, release ordinal, verification time, set hash, count,
and list are all one-sided Gate-B mutation families.
Transcript 0 forbids `8e13`; transcript 1 requires it equal SHA-256 of complete
transcript 0. Kind 125 requires equal preimage, digest, signature, and CMS across
lanes, distinct lane/root/target identity, the same common client execution and
opaque handle, and two use ordinals exactly once. Both calls occur, in ordinal
order, only after the durable claim and a timely passing B1 under the same
boot/process/handle continuation. HMG4L2 expiry is not a post-B1 upper bound
and does not revoke those exact two already-authorized uses; any process,
handle, boot, client, target, order, or use-count change rejects. Each
`8db4/8db5` binds the exact
`SecKeyCreateSignature` call and result; `8db0/8db1` binds the one durable claim.

### 4.0.1 External-launcher TCB audit: `HMG4L3`

`HMG4L3` is the sole acyclic independent audit for the pre-existing parent
launcher. Its kind is exactly 1 and its payload is exactly:

```text
0x9201 protocol_spec_sha256       SHA256
0x9202 predecessor_contract_sha256 SHA256, exact Section 0 value
0x9203 audit_version              U32, exactly 1
0x9204 audit_profile              U32, exactly 1 external launcher TCB
0x9205 input_set_sha256           SHA256, derived kind 149
0x9206 input_count                U32, exactly `9228 + 922b + 14`
0x9207 inputs                     LIST ReviewedObjectMember, exact count
0x9208 output_set_sha256          SHA256, derived kind 150
0x9209 output_count               U32, exactly 16
0x920a outputs                    LIST ReviewedObjectMember, exact count
0x920b command_set_sha256         SHA256, derived kind 159
0x920c command_count              U32, 7..2,048
0x920d commands                   LIST LauncherBuildCommand, exact count
0x920e started_at_unix_seconds    U64
0x920f finished_at_unix_seconds   U64, not less than `920e`
0x9210 result                     U32, exactly 1 pass
0x9211 finding_p0_count           U32, exactly zero
0x9212 finding_p1_count           U32, exactly zero
0x9213 finding_p2_count           U32, exactly zero
0x9214 finding_count              U32, exactly zero
0x9215 finding_set_sha256         SHA256, exact empty kind-53 stream
0x9216 findings                   LIST ReviewFinding, exact empty
0x9217 acceptance_effect_mask     U64, exactly zero
0x9218 production_authority_effect_mask U64, exactly zero
0x9219 protected_install_allowed  BOOL, exactly false
0x921a original_runtime_launch_allowed BOOL, exactly false
0x921b apply_allowed              BOOL, exactly false
0x921c recover_allowed            BOOL, exactly false
0x921d promotion_or_publication_allowed BOOL, exactly false
0x921e auditor_identity_sha256    SHA256, derived kind 34
0x921f auditor_identity           STRUCT ActorIdentity, kind 2 with bit 4
0x9220 audit_statement_sha256     SHA256, derived kind 151
0x9221 signature_algorithm        U32, exactly 1 Ed25519
0x9222 detached_signature         BYTES, exactly 64
0x9223 launcher_configuration_frame_sha256 SHA256, complete HMG4LC2
0x9224 launcher_executable_code_identity_sha256 SHA256, derived kind 15
0x9225 launcher_executable_code_identity STRUCT ExecutableCodeIdentity
0x9226 launcher_executable_file_identity STRUCT ProtectedFileIdentity
0x9227 launcher_source_set_sha256 SHA256, derived kind 153
0x9228 launcher_source_count      U32, 1..1,024
0x9229 launcher_sources           LIST LauncherSourceUnit, exact count
0x922a launcher_tool_set_sha256   SHA256, derived kind 154
0x922b launcher_tool_count        U32, exactly 7
0x922c launcher_tools             LIST LauncherToolIdentity, exact count
0x922d launcher_build_transcript_sha256 SHA256, derived kind 156
0x922e launcher_build_transcript STRUCT LauncherBuildTranscript
0x922f machine_observation_set_sha256 SHA256, derived kind 155
0x9230 machine_observation_count  U32, exactly 13
0x9231 machine_observations       LIST LauncherTCBTestObservation, exact count
0x9232 launcher_test_vector_catalog_sha256 SHA256, derived kind 160
0x9233 builder_actor_identity_sha256 SHA256, derived kind 34
0x9234 builder_actor_identity     STRUCT ActorIdentity, kind 3
0x9235 build_actor_set_sha256     SHA256, derived kind 157
0x9236 build_actor_count          U32, exactly 1
0x9237 build_actors               LIST ActorIdentityBinding, exact count
0x9238 launcher_sdk_toolchain_identity_sha256 SHA256, derived kind 158
0x9239 launcher_sdk_toolchain_identity STRUCT LauncherSDKToolchainIdentity
0x923a launcher_test_vector_count   U32, exactly 13
0x923b launcher_test_vectors        LIST LauncherTestVector, exact count
0x923c injection_plan_set_sha256    SHA256, derived kind 165
0x923d injection_plan_count         U32, exactly 13
0x923e injection_plans              LIST LauncherInjectionPlan, exact count
0x923f injection_observation_set_sha256 SHA256, derived kind 166
0x9240 injection_observation_count  U32, exactly 13
0x9241 injection_observations       LIST LauncherInjectionObservation, exact count
```

`9205` is kind 149 over `9207`, `9208` is kind 150 over `920a`, `920b`
is kind 159 over `920d`, `9227` is kind 153 over `9229`, `922a` is kind 154
over `922c`, `922d` is kind 156 over `922e`, and `922f` is kind 155 over
`9231`; `9235` is kind 157 over `9237`, `9238` is kind 158 over `9239`, and
`9232` is kind 160 over `923b` with `923a == 13`, `923c` is kind 165 over
`923e` with `923d == 13`, and `923f` is kind 166 over `9241` with
`9240 == 13`.
All counts agree, including `9206 == 9228 + 922b + 14`. The kind-149 input
order is exact:
(0) `successor-spec`, role 1; (1) `predecessor-contract`, role 2; (2)
`launcher-source-manifest`, role 7; (3..) every source as
`launcher-source/<eight-lowercase-hex-ordinal>`, role 3, in manifest order;
then exactly seven complete `launcher-tool/<ordinal>` role-5 identities in
build-use/role order; `launcher-build-controller`, role 5;
`launcher-build-controller-file-identity` and
`launcher-build-controller-code-identity`, both role 4;
`launcher-sdk-toolchain-identity`, role 6;
`launcher-command-set-definition`, role 6;
`launcher-test-vector-catalog`, role 7; `launcher-build-transcript`, role 12;
`launcher-configuration-frame`, role 6;
`launcher-executable-file`, role 5; and
`launcher-executable-file-identity` and
`launcher-executable-code-identity`, both role 4. All identifiers are exact
ASCII. The specification/contract, source manifest/raw sources, raw tools, raw
builder, kind-158 SDK/toolchain, command set, test catalog, build transcript,
configuration frame, and raw launcher use the complete encoding stated here
with binding 2. The canonical builder file/code and final launcher file/code
identity members use encoding 2/binding 1 and are byte-identical to their
nested values. The controller and SDK/toolchain identities obey the exact
binding rules below. The source-manifest and command-set members are complete kind-153
and kind-159 streams. A structurally valid kind-21 BuildSourceUnit stream at the
launcher-source-manifest ordinal is an explicit one-sided rejection. `9223`
equals the complete configuration-frame member hash;
`9224` is kind 15 over `9225`; and the held raw executable member's length/hash
equals `9226.6203/6204 == 9225.6401` and the exact single external build
transcript's sole output.

Kind-149 ordinals 0 and 1 are not labels over arbitrary documents.
Ordinal 0 `7d45/7954.6204 == 9201` and its `7d44/7954.6203` and binding-2
held bytes are the complete frozen successor specification from byte zero
through EOF. Ordinal 1 similarly has `7d45/7954.6204 == 9202` and complete
held bytes/length equal the exact incorporated predecessor contract whose hash
is fixed in Section 0. Both are encoding 3/binding 2, link-count-one stable
files; neither may be an excerpt, normalized rendering, hash-only member, or
other file with the expected label. Gate B swaps ordinals/identifiers/held
locators, pairs successor A with field hash B, truncates/appends one byte, and
mutates each length/hash independently; every case fails kind-149/151
admission.

The `launcher-source-manifest` input bytes are exactly the complete kind-153
stream over `9229` and hash to `9227`. Every `LauncherSourceUnit` ordinal/path
is unique; `9303/9304 == 9305.7d44/7d45`, its binding-2 held
`7954.6203/6204`, and the corresponding kind-149
`launcher-source/<ordinal>` member's length/hash/held bytes. Conversely every
such raw source input maps to exactly one `9229` member. No production-helper
`BuildSourceUnit` role is reused or implied. Every `922c` tool ordinal maps to
exactly one kind-149 `launcher-tool/<ordinal>` member: nested `9313` is that
same complete held member, `9314.6203/6204 == 9313.7d44/7d45` and held
`7954.6203/6204`; `9316.6115` is byte-identical to that same complete held
member, `9316.6113 == 9313.7d45`, `9315` is SHA-256 of the complete canonical
BuildToolIdentity `9316`, and `9317/9318 == 9316.611a/611b`. Thus platform
tools use the predecessor's BuildToolIdentity plus ObservedExecutableIdentity
semantics, including complete invocation payloads, SDK/runtime identity,
version command/result, held bytes, and observed signed-object identity. They
are not forced into the production ExecutableCodeIdentity's thin-arm64/fixed-
flags/empty-entitlements/designated-requirement profile. `922b == 7`; tool ordinals are exactly
0..6, `9319 == ordinal + 1`, and the roles are SDK locator, compiler, linker,
signer, source scanner, test harness, and transcript encoder in that order.
`9319` is a command-purpose role, not an ActorIdentity role. All seven are
invoked only by the separately held builder whose `6f07` is exactly bit 3;
`LauncherToolIdentity` contains no `ActorIdentity`, and inserting any generic
kind-3 actor or interpreting a tool role as an additional `6f07` grant is
structurally forbidden. Roles 1..4 require BuildToolIdentity provenance profile
1 platform Mach-O with zero invocation payloads; roles 5..7 require profile 2
held interpreter plus a nonempty complete payload closure. Profile 3 and its
predecessor receipt/review fields are forbidden for every HMG4L3 tool, avoiding
a hidden future build-receipt edge. For roles 1..3, `9316.6116` has identity kind 17 and
is byte-identical to `9239.9385`, with `6114 == 9239.9384`; for roles 4..7 it
has identity kind 16 and is byte-identical to `9239.9383`, with
`6114 == 9239.9382`. This selection is exact and prevents a tool/version record
from naming an unrelated OS or SDK. A role swap, wrong BuildToolIdentity profile, observed
executable mismatch, incomplete interpreter/payload closure, or alternate tool
with the same version output is invalid. Kind 154 rejects a parallel
unconsumed tool registry or a tool object whose observed identity does not
match its held bytes.

The builder is a separately held build controller, never inferred from the
tool list. `922e.933d` is byte-identical to the unique kind-149
`launcher-build-controller` raw role-5/encoding-3/binding-2 member.
`933e.6203/6204 == 933d.7d44/7d45 == 933d.7d49.7954.6203/6204`; those held
raw bytes parse to byte-identical `9340`, `933f` is kind 15 over it, and
`933c.6f0b/6f05 == 9340/933f`. `933b` is kind 34 over `933c` and
`933c.6f07` is exactly bit 3 (`0x8`). The following two kind-149 role-4,
encoding-2/binding-1 members are byte-identical to `933e` and `9340`.
Builder code identity is distinct from every selected tool's complete observed
executable identity; a builder-for-tool substitution, tool-for-builder
substitution, raw builder A/file-or-code B pair, or correct builder code with a
different credential is rejected.

The unique kind-149 `launcher-sdk-toolchain-identity` member is role 6,
encoding 2, binding 2 and contains the complete canonical nested `9239` bytes;
its length is 1..4,194,304, its hash is `9238`, and its retained locator/file
identity is stable across two no-follow passes. `9239.9382` and `9384` are kind
15 over its complete nested OSBuildIdentity and SDKIdentity `9383/9385` using
identity kinds 16/17. Fields `9386..938e` repeat the exact SDK header manifest,
ABI registry, parent-launcher SDK layout registry, poll registry, compile-probe
source, SDK settings, SDK build-version output, and held Security/libc reference
hashes. The audit reopens and hashes every nested binding-2 locator and
byte-compares every embedded BuildSourceUnit, required header slice, ABI/layout
probe line, SDK settings object, build-version output, canonical-entitlement
blob, and compile-probe source. `938f..9392` select tool ordinals 0..3 and their
roles exactly; architecture/language are exact `arm64`/`c17`, and ambient SDK
or tool lookup and network are both false.

This is a closed selected-OS/SDK/tool preimage for one audited build, not a
claim that every unused byte in an SDK sysroot has been archived and not a
two-root reproducibility claim. No ABI or source-to-binary provenance claim may
depend on an ambient header, library, SDK setting, tool path, environment
variable, or regenerated probe. The narrow ExecutableCodeIdentity values for
the launcher and custom builder have `6410 == 9385.4f2f.7d48` and
`640d == 9385.4f2e`; platform tool `4f07` values remain exact observed blobs
inside BuildToolIdentity and confer no runtime/protected authority. Gate B pairs SDK/OS/toolchain A with source, command,
transcript, test output, builder, or launcher B; mutates each `9382..9397`
field; omits/duplicates/reorders one required nested header/probe/tool; or
substitutes an ambient SDK path with the same version label. Each case fails
kind 149/151/158/159 admission.

`9232` is kind 160 over exactly thirteen `923b` LauncherTestVector rows ordered
0..12, and the sole kind-149 `launcher-test-vector-catalog` member is role 7,
encoding 4, binding 2 whose complete held bytes are exactly that kind-160
stream. Its `7d45/7954.6204 == 9232`; `7d44/7954.6203`, every byte, and two
stable no-follow file identities are retained and streamed. Each row repeats
the exact common `9201/9202`, `9227`, `9238`, `922d`, `9223`, `9226`,
`9224/9225`, `922e.933f/9340/933e`, `920b`, and `9233` inputs at `93d3..93dc`
and `93ef..93f2`; `93f3` is SHA-256 of complete nested fixture `93f4` and
equals the matching `923e` member. All hashes are recomputed from their
complete nested values.
Rows 0..12 use profiles 1..13, injection masks, expected decisions, six-count
tuple/sentinel values, argv/environment hashes, negative booleans, and zero
effect mask exactly as the fixed table below. `93ee` is one only after every
field passes.

Each machine observation ordinal selects the same catalog ordinal and
`935c == 9232`. Its input fields equal the selected vector; observed decision,
walk/exec/pipe/FD/peer/mapped-vnode results, argv/environment hashes,
`9357..9361`, and `935a` must equal the corresponding expected vector fields.
The observation cannot supply or reinterpret an expectation. A free-form JSON,
prose test plan, hash-only label, structurally valid wrong kind-17/23 catalog,
wrong-kind-23 command hash at observation `934b`, reordered/missing/duplicate
row, catalog A/observation B pair, expected/observed field swap, sentinel in a
measured slot, same label with different held bytes, or one-bit expected value
mutation is a one-sided Gate-B rejection.

`923c` is kind 165 over exactly thirteen immutable pre-execution
LauncherInjectionPlan rows ordered 0..12. Vector and plan ordinals/profiles are
equal; `923b.93f3/93f4 == SHA256/canonical(923e[ordinal])`. Each plan is part
of the already held kind-160 catalog and its `9517` freeze time precedes any
setup; it contains no future vnode identity, pipe handle, observed FD number,
observed setup/test/teardown time, or result. Profiles 1..5 use plan fixture
kind 0 and injection mask zero: intended object types/topology/FD constraint are
zero, all byte fields are empty, status/descriptor/role fields use their
declared sentinel, every conditional STRUCT/content field is absent, and expected
decision is admit. Profiles 6..13 use kinds 1..8 and masks
`1,2,4,8,0x10,0x20,0x40,0x80`, with expected decision reject:

```text
kind 1 alternate copy    intended ordinary bytes equal launcher; actual vnode/path must differ
kind 2 symlink edge      intended type is symlink; path/target/content relation is exact
kind 3 extra FD          plan requires one role-8 unallowlisted FD > 2; actual record comes later
kind 4 endpoint alias    plan requires alias claim over distinct read/write peer topology
kind 5 status drift      status before/after are present, SDK-valid, and unequal
kind 6 second exec       alternate kind-11 ObservedExecutableIdentity and path are present
kind 7 relative path     only nonempty relative argv0 bytes are present
kind 8 nonempty env      only one valid nonempty name and its exact nonsecret value are present
```

For each nonselected kind every other kind-specific field/STRUCT is absent or
the declared empty/sentinel value. Each plan names a fresh, pairwise-distinct
slot-2 disposable workspace root outside every protected/evidence/custody/
runtime/original-runtime tree and has `9516==0`, but does not claim the setup
occurred.

`923f` is kind 166 over thirteen LauncherInjectionObservation rows ordered
0..12. Observation `i` binds the already-held plan by
`9523 == 923b[i].93f3 == 9231[i].9367`, `9524==9232`, `9525==923c`, and
`9231[i].9369/936a == SHA256/canonical(9241[i])`. Its actual typed fields are
checked against the selected plan's intended type/content/path, FD constraint/
role, pipe topology/direction, status, executable, relative-path, and
environment fields. Actual vnode device/inode, assigned FD number, and pipe
handles occur only in the observation: their relations must satisfy the plan,
but no future value is copied back into or hashed by the plan. For kind 1 the
actual content/length equal `9519/951a` and launcher bytes while vnode/path are
distinct; kind 2 actual symlink content equals the planned target; kind 3
`952a>2` and `9534` is the exact extra record; kind 4 `952e/952f` proves the
planned alias/topology relation. `9535 > plan.9517 <= 9536 <= 9537 <= 9538 <= 9539`; the held catalog
and plan FD are open before setup and through test completion. `953a` is the
actual decision and equals planned `9515`; `953b==0`, and `953d=1` means the
typed setup, test, observation linkage, and teardown all completed, not that a
negative launch was admitted.

An injection mask or boolean without the typed plan and typed actual
artifact/FD/pipe/status/executable/path/env observation is invalid. Wrong
conditional presence, wrong object type, alias A/endpoint B, alternate-copy A/
launcher B, reused root, setup before plan freeze, plan synthesized or changed
after observation, setup after test, teardown before observation, unexpected
effect, plan A/observation B, observation A/machine row B, or a kind-0 plan or
observation carrying injection state is independently rejected. A future
device/inode, assigned FD number, or pipe handle serialized into the plan; an
actual identity/handle that fails the frozen relation; or any setup mutation
after `9536` and before `9538` is also rejected.

Binding-2 logical-byte budgets are closed. Successor/predecessor are each at
most 16 MiB; the kind-153 manifest, command-set definition, and canonical build
transcript are each at most 64 MiB; each raw source is at most 16 MiB and all
raw sources total at most 16 GiB; each tool, the raw builder, and the raw
launcher are at most 1 GiB, with all seven tools totaling at most 7 GiB; the
complete kind-158 SDK/toolchain identity is at most 4 MiB; HMG4LC2 is at most 262,144
bytes; the test-vector catalog and human review are each at most 128 MiB; each
canonical machine observation is at most 1 MiB; and the complete kind-155
stream and each command transcript are at most 64 MiB. Nested per-command
stdout/stderr are each at most 64 MiB and total at most 8 GiB; every build
artifact is at most 1 GiB and their checked logical total is at most 16 GiB.
Commands/executions, artifacts, and edges are bounded at 2,048, 8,192, and
16,384 respectively, and the enclosing HMG4L3 payload still independently
fits its 16-MiB framing cap. Checked U64 addition of
every binding-2 `7d44` across both kind-149 and kind-150 lists is at most
32 GiB. Every held member is streamed from its retained FD with a fixed buffer
of 1..1,048,576 bytes, never allocated at logical length, and its before/after
file identity remains stable. Gate B includes exact per-family zero/minimum/
maximum/maximum-plus-one, source/tool/builder/SDK subtotals at
maximum/plus-one, aggregate
32-GiB equality/plus-one, nested output/artifact total equality/plus-one,
command/execution/artifact/edge count max/max-plus-one, addition overflow,
short read, content drift, and
buffer-size 0/1/1MiB/1MiB-plus-one vectors.

The kind-149 `launcher-command-set-definition` bytes are exactly the complete
kind-159 stream over `920d`; `922e.9327/9328/9329 == 920b/920c/920d`
byte-for-byte. Every LauncherBuildCommand repeats `9238`, `9227`, `922a`,
`9233`, and `922e.933f` at `93b2..93b6`. `93b7` selects exactly one `922c`
ordinal, `93b8` is SHA-256 of that complete canonical LauncherToolIdentity,
and `93b9 == 922c[93b7].9319`. Its complete non-NUL argv is
`93ba/93bb/93bc`: member zero is the exact absolute content-addressed path
derived from the selected tool's held slot-2 parent ComponentSequence and
`7953` leaf and is byte-identical to the `execve` pathname; no `PATH`, shell,
relative path, symlink, alias, interpreter omission, inherited argument, or
post-hash suffix is legal. `93bd` is the exact canonical empty kind-24 stream,
`93c0=false`, and `93c1=1`. `93c2` is kind 141 over `93c3`;
`93c3.8df2 == 9239.9385.4f41`, `8df3/8dfd == 93bb/93ba`,
`8df6==0`, `8dfe==93bd`, and its executable-path/accounting fields are the
exact selected argv0/path and complete 64-bit argv/empty-env serialization.
ARG_MAX/PATH_MAX, pointer-count, NUL, overflow, max/max-plus-one, and hash/list
drift vectors are inherited in full; a command cannot bypass them because this
is an audit-only build profile.

`93c8` is kind 172 over `93ca`, and `93c9` is its exact bounded count. Every
member selects one unique `93bc` argument and one `9377` artifact. The selected
argument's complete DiagnosticByteString hashes to `95ea`; its `6611==95e3`.
For token profile 1 its `6612` is byte-identical to `95e9`. For profile 2 it is
exactly `95e8 || 95e9`; for profile 3 it is exactly
`95e8 || ASCII("=") || 95e9`. `95e9==9377[95e5].9422`. A profile-1 produced
output requires `95e4 == 95e3-1` and the selected option argument is exactly
ASCII `-o`; every consumed input and every profile-2/3 token uses the
`0xffffffff` option sentinel. Binding argument ordinals and
`(direction,artifact)` pairs are unique; bindings sort by
`(command_ordinal,argument_ordinal,direction,artifact_ordinal)`.

The profile grammar is closed. SDK locator commands have zero artifact
bindings. Each compiler command consumes one or more role-1 materialized
sources and produces exactly one role-2 object. Linker commands consume one or
more role-2 objects and produce exactly one role-3 unsigned launcher. The
signer consumes exactly that role-3 artifact and produces the sole role-4
final launcher. Each scanner command consumes one or more role-1 sources and
produces exactly one role-5 audit artifact; the harness consumes the sole
role-4 final launcher and produces exactly one role-5 artifact; the encoder
consumes every designated role-5 transcript input and produces exactly one
role-5 canonical transcript artifact. The complete grammar classifies each
`93bc` ordinal as argv0, one exact frozen nonpath option/value, or exactly one
kind-172 path binding; an unclassified argument or path-bearing token without
a binding is invalid.

For each command, direction-1/2 kind-172 artifacts are exactly the
`945a/945b` consumed and `945c/945d` produced projections, respectively. They
also equal that execution's incoming/outgoing kind-163 edges and the selected
artifacts' producer/consumer fields. Compiler/scanner `93be/93bf` are exactly
the `942a` source ordinals of their consumed role-1 bindings; all other
commands retain the empty source list. Therefore an argv token cannot name
artifact B while the execution/DAG declares artifact A. Gate B independently
mutates token, prefix/profile, option ordinal/`-o`, artifact ordinal/path,
direction, source projection, consumed/produced projection, producer/consumer
edge, duplicate binding, missing path token, or command A/binding B; each fails
kinds 159/161/162/163/172 before HMG4L3 admission.

All seven tool ordinals occur in at least one command. Only compiler-profile 2
and source-scanner-profile 5 commands may have nonzero `93be`; across each of
those two profiles the strictly increasing `93bf` lists partition source
ordinals `0..9228-1` exactly once. Other profiles have zero count and an empty
list. Thus every source is compiled once and scanned once while no command may
name an unregistered source. The SDK locator/compiler/linker/signer command
arguments contain the exact source-bound target SDK selector, `arm64`, and
`c17` tokens required by `9239`; the signer is timestamp-free and consumes the
exact linked output, and no command may replace a selected tool or SDK with an
equivalent version string. Exact argument spellings and ordering are frozen by
the kind-23 subhashes. Command A/SDK B, command A/tool B, argv hash/list drift,
missing/duplicate source coverage, nonempty environment, relative argv0,
unregistered executable, hidden command, or extra tool invocation is a
one-sided rejection.

`922e.9540` is kind 167 over `9541`. `9552/9553 == 9233/9234`,
`9554 == 9234.6f0c`, `9555 == 922e.933e`, and
`9556/9557 == 9558/9559 == 922e.933f/9340`. The two targeted public KERN_PROC
observations `955a..955d` are byte-identical complete kind-97 birth tuples and
bracket `955e..955f`; the retained builder FD, two held/static lookups, and two
dynamic lookups cover that whole interval. `9561.80b1/80b2` equals the same
birth tuple, its before/after public dynamic projections are stable profile 1,
and Debugged, Platform, invalid, or unknown status is never masked into
acceptance. `9562` remains true through the final command wait and artifact
readback. Every execution interval and every execution `9445/9446` uses this
same session birth tuple and lies within `955e..955f`.

PID-equal/birth-different, birth-equal/code-different, held/static/dynamic A/B,
credential A/actor B, actor A/process B, same code under another credential,
builder exit/re-exec, FD replacement, Debugged/Platform/status drift, or a
mid-session KERN_PROC/start-time change independently fails kinds 156/161/167.
A per-command process hash cannot replace this retained session-wide
observation.

`922e.9372` is kind 161 over `9374` and `9373 == 9328`: execution ordinal `i`
maps to command ordinal `i` exactly once. `9442` is SHA-256 of the complete
canonical `9329[i]`, `9443==9327`, `9444==933b`, `944b..944f` equal that
command's selected `922c` tool/held identity, and every interval lies within
`9333..9334`. All executions use the same retained builder birth tuple
`9445/9446`; child `9447/9448` is unique per command, has the same boot UUID,
names that builder PID as parent, and is observed before and after exec/wait
without birth drift. `9450` is kind 164 over `9451`, whose builder/child/tool
identities and command ordinal equal the execution. It proves one `fork`,
three `pipe` calls, three child-end nonblocking setups comprising six typed
`F_GETFL` calls and three typed `F_SETFL` calls, one held-root `fchdir`, three `dup2`, the exact closed-FD
close count, one direct `execve`, one targeted `waitpid`, zero `posix_spawn`,
shell/popen, second-exec, or network calls, exact argv/empty-env hashes, zero
exit/signal, three retained parent peers, and the two complete SDK-bound child
FD inventories plus the two complete SDK-bound parent FD inventories and three
typed parent-duplicate closes below.

The syscall claim is typed, not inferred from counters. `9491` is kind 173
over the three `9492` LauncherPipeCreationObservation rows. Their six returned
FDs are distinct and greater than 2; read/write PipeEndpointObservation values
have reciprocal peer handles, agree with their successful `F_GETFL/F_GETFD`
values, and hash-bind the exact phase-1 child records at `9613/9614`. Pipe
roles 1/2/3 supply, respectively, child role/parent-role pairs 1/4, 5/2, and
6/3. All three creations finish strictly before `949c` fork start.

`94b7` is kind 190 over exactly three `94b9`
LauncherFcntlSetFlagsObservation rows, and `94b8/94ba/94bb` are 3/3/6.
`94ba` is the complete process-wide `F_SETFL` count for the execution, while
`94bb` counts exactly the before/after `F_GETFL` calls inside these setup rows
and does not hide the separately bound endpoint-observation reads. Every row
has `98e2=1` and `98e3==9472==9441`. For
pipe slots 0/1/2, the target child FD is respectively the read/write/write end
from the selected pipe row and the reciprocal parent peer is the opposite end.
The launcher takes one successful `F_GETFL`, requires only the exact access-
mode bits with `O_NONBLOCK` clear, performs exactly one
`fcntl(target_fd,F_SETFL,flags_before|O_NONBLOCK)`, then takes one successful
`F_GETFL` readback equal to that requested value. All three calls and their
return/errno/time fields are typed in the selected kind-190 row; `98f7` is the
exact zero descriptor-flag readback already bound by the pipe/phase-1 record:
it equals the selected `9607/960b`, the `98a7` field of the complete record
whose SHA-256 is `98f6`, and the selected child `95c8`.
`98f8` proves no descriptor-flag mutation call. `98f6` hash-selects the
matching role-1/2/3 record
from parent pass 0, whose FD/status/endpoint equal the post-setter pipe and
child phase-1 records. No setter targets a retained parent peer, no other
status bit changes, and each setup finishes before `949c` fork start. The
complete post-setter `9606..960d` pipe status/endpoint fields equal the selected
kind-190 after-readback for the child end and the unchanged access-mode-only
flags for its peer. In context 1, `98fb=true` is admitted only with
`98f5 < 949c`; a boolean without that exact timestamp edge is invalid.

`9493` hashes complete `9494`: its requested FD selects the unique phase-1
role-8 vnode, `9624/9625` are kind 15 over the exact `937d` disposable build
root, successful `fchdir` returns zero, and the immediate public `stat(".")`
identity is byte-identical to that held root. `9495` is kind 174 over exactly
three `9496` rows. Row ordinal/destination is 0/0, 1/1, or 2/2; its source is
the matching phase-1 role 1/2/3 FD, its replaced-record hash names the old
phase-1 destination FD, returned FD equals destination, and before/after pipe
handle, peer handle, direction, and status flags are byte-identical while the
destination's `FD_CLOEXEC` is clear. `9497` is kind 175 over `9498`: it
contains every phase-1 FD greater than 2 exactly once in actual close-call
order, each hash-selects that complete phase-1 record, and every close returns
zero. Thus `947c/947d/947e/947f` are recomputed from complete call evidence,
not accepted as standalone assertions.

`94b0` is kind 185 over the two complete `94b2` parent passes; `94b3` is kind
186 over exactly three `94b5` parent closes, and `94b1/94b4/94b6` are 2/3/3.
Parent pass 0 occurs immediately after fork and contains the six transport ends
exactly once plus every nontransport parent FD. The three close rows select
roles 1, 2, and 3 in slot order, record the exact successful `close` return,
errno and interval, and bind the same parent execution identity. Parent pass 1
occurs after those closes and before wait/decision; it contains roles 4, 5, and
6 exactly once, contains no role 1..3 or other pipe with any of their handles,
and has a byte-identical nontransport projection. The complete public FD table,
not `948f` alone, proves that no inherited child end or hidden pipe remains.

`9499` is kind 176 over `949b`; `949a == 947f + 20`. This is the canonical
partial-order serialization: builder branch pipe row 0, kind-190 setup row 0,
pipe row 1, setup row 1, pipe row 2, setup row 2, then fork; child
branch phase-1 inventory, fchdir, dup2 rows 0..2, every close in call order,
phase-2 inventory, then nonreturning execve; builder-after-fork branch parent
pass 0, parent-close rows 0..2, parent pass 1, then one targeted waitpid.
`9656` selects the exact typed row/pass where applicable.
For operation kind 11, `9656` selects the kind-190 row, `9653=1`,
`9657/9658 == 98eb/98f5`, and `9659=6`; a step spanning only the `F_SETFL`
subcall or naming a different pipe slot is invalid.
Branch-step ordinals are contiguous, every typed operation appears once, and
no untyped syscall step exists. Builder-pre-fork pipe/setup times and child
times are nonoverlapping in their displayed branch order;
phase 1 follows `949d`, phase 2 precedes `949f`, and `949f` lies within the
execution interval. `94a0 >= 949d`; waitpid may overlap the child branch but
`94a1` follows child termination and returns exactly `9486`. Fork returns
`947b` in the builder and exact zero `949e` in the child; direct execve uses
`9481/9482/9483`, never returns to the child (`94a3=false`), and the selected
tool birth/exit evidence proves the successful image transition. Any missing,
duplicate, reordered, failed, wrong-FD, wrong-root, wrong-endpoint, wrong-PID,
or untyped operation fails kinds 161/164/173/174/175/176/184/185/186/190.

`948c` is kind 171 over exactly two `948e` passes;
each `95b2==9441`, `95b1/95b3` is respectively `0/1` or `1/2`, and `95b6`
is kind 170 over the complete FD-number-sorted `95b5`. Each pass is the exact
successful result of a bounded, complete public
`proc_pidinfo(PROC_PIDLISTFDS)` enumeration in the single-threaded child; a
short result, count/byte remainder, growth beyond 65,536 records, duplicate FD,
enumeration error, or FD-mutating call other than the recorded `dup2`/`close`
sequence between passes blocks.

Phase 1 occurs immediately after `fork` and before `fchdir`, `dup2`, or close.
It contains FDs 0/1/2 exactly once plus exactly one each of transport roles
1..6, so its count is at least nine. All six transport-role FDs are greater
than 2, have object kind 1, and form three disjoint anonymous-pipe pairs:
roles 1/4, 2/5, and 3/6 have reciprocal own/peer handles; all six own handles
are nonzero and pairwise distinct. Roles 1/5/6 are read-only and roles 2/3/4
are write-only. Child roles 1..3 carry exactly access mode plus `O_NONBLOCK`;
retained parent roles 4..6 carry only their access mode and never
`O_NONBLOCK`. A pipe `95c4` is the SDK-bound `PROX_FDTYPE_PIPE`; a vnode is
classified only by an exact successful public `PROC_PIDFDVNODEINFO` result and
has a complete held kind-2/3 canonical identity. Every other public FD type is
forbidden. Roles 7..10 equal, respectively, the selected held tool, disposable
build root, one registered held input, or one registered output; role 11 is a
fully observed non-authority descriptor and may never supply a command,
artifact, cwd, executable, or registry preimage. Every role 7..11 record is
closed before exec.

Phase 2 occurs immediately before `execve` and contains exactly FDs 0, 1, and
2 as roles 1, 2, and 3. Each is the same anonymous-pipe open-file description
as its unique phase-1 source selected by `95ce`, including byte-identical
`95cb..95cd` and status flags; phase-2 FD 0 is read-only, FDs 1/2 are
write-only, and all three have `FD_CLOEXEC` clear with every unknown descriptor
flag bit zero. Phase-1 roles 1..3 have `95ce==95c2`; phase-2 roles 1..3 name
those three distinct phase-1 FDs; every other record uses `0xffffffff`.
`95cf` is true exactly for phase-1 roles 4..6, while `95d0` is true exactly
for roles 1..3 in either phase. The three `dup2` calls map the phase-1 role-1,
role-2, and role-3 FDs to 0, 1, and 2 in that order. The old phase-1 FDs 0/1/2
are replaced only by those calls; every phase-1 FD greater than 2 is closed
exactly once, so `947f == phase1_count - 3`. No FD is opened, duplicated by
another primitive, or renumbered between passes. Thus no source, artifact,
build-root, builder, audit, configuration, authority, selected-tool hold, or
parent peer survives into exec; only child pipe endpoints 0/1/2 do.

Each parent pass uses the same bounded complete `PROC_PIDLISTFDS` algorithm as
the child pass and recomputes kind 184 over FD-number-sorted records. Phase 1
has exactly one transport role 1..6, with FD, direction, flags, endpoint and
reciprocal handles byte-identical to the corresponding pipe-creation/child
phase-1 values. Roles 1..3 carry the exact kind-190 post-setter status;
roles 4..6 retain their access-mode-only status. Phase 2 has exactly roles 4..6; each retains the same numeric FD
and open-file description as phase 1, while roles 1..3 are absent. Every role-0
nontransport record is present in both passes with the same FD/type/access/flags;
role 0 forbids pipe endpoint fields and may not have `PROX_FDTYPE_PIPE`.
No parent FD create, dup, renumber, flag change, or close other than the three
kind-186 rows occurs between the passes. The two parent execution identities
are byte-identical to the enclosing builder identity, and context kind/ordinal
equal the enclosing execution. A close row's FD, role and complete endpoint
select its unique phase-1 record; its FD is absent from phase 2, while the
reciprocal retained peer remains exact.

A hidden or omitted FD, an extra/missing transport role, nonreciprocal or
aliased pipe handles, phase/count swap, phase-2 FD other than 0/1/2, source-FD
mapping drift, vnode A/registry B, unknown FD type, `F_GETFL`/`F_GETFD` drift,
`FD_CLOEXEC` set on phase 2, close-count mismatch, surviving role 4..11,
kind-170 record-set mismatch, kind-171 pass-set mismatch, or pass/execution A/B
pair independently fails kinds 161/164/170/171/184/185/186/190 before HMG4L3
admission.

Each `9456/9459` is a link-count-one role-12/encoding-3/binding-2 held raw
stdout/stderr member whose `7d44/7d45` and locator file identity equal
`9454/9455` or `9457/9458`. Each is at most 64 MiB; their checked total across
all executions is at most 8 GiB and is included in the overall 32-GiB HMG4L3
streaming budget. The audit opens every output from its retained FD, hashes
through EOF with the fixed buffer, and rechecks identity before and after.
`9452/9453` equal the syscall observation and decoded wait status; no summary
exit assertion can replace the held output or child observation.

`922e.9375` is kind 162 over `9377`, `9378` is kind 163 over `937a`, and all
counts agree. `937c` is a fresh nonzero nonce; `937d` is a newly exclusive,
empty disposable child beneath held slot-2 parent `937e`, reached by two
byte-identical pre-materialization no-follow scans. Its final component is
exact ASCII `launcher-build-` followed by 64 lowercase hexadecimal characters
encoding `937c`; parent prefix and final edge in `937d` equal `937e` plus that
one new directory. `9542` is kind 169 over four `9543` passes: ordinals 0/1
are phase-1 empty scans, and ordinals 2/3 are byte-identical phase-2 complete
final scans after omitting only the pass ordinal and observation times; member
ordinals remain part of the equality. Every pass retains
the same no-follow root FD; `9593==959c==937d` before/after, and a root identity
change blocks. Phase-1 `9594==0`; `9595` is empty and both its kind-180
`9596` and kind-74 projection `959d` are canonical empty streams. No build
materialization begins until both empty scans finish.

Each final `9595` member hashes its complete `9665` BuildTreeMember and its
complete kind-2/3 `9667` identity; the identity is observed from the retained
no-follow child FD before and after the readback interval. File members stream
all bytes from that FD, use kind-3 ProtectedFileIdentity, name exactly one
artifact at `966e`, and satisfy
`9662/9665.6152 == 9377[966e].9422`,
`9667.7c02 == 9377[966e].9426`, and all size/content/mode/link/owner/group/
flags/ACL/xattr fields agree. Directory members use complete kind-2
DirectoryIdentity, the sentinel artifact ordinal, and byte-identical
device/inode/uid/gid/mode/flags/ACL/xattr identity across final passes.
`959d` is kind 74 over the exact ordered `9665` projections; `9596` is kind
180 over the stronger full members. `959e` proves all artifact held-FD
readbacks finished before each final scan began, while every member FD and the
root FD remain retained through that pass.

The two final scans contain every ordinary artifact file in `9377` exactly
once and exactly the directory-prefix closure of their BUILD_REL_PATH values,
with complete device/inode/byte/metadata equality to each artifact and no side
file, socket, symlink, special object, unowned directory, or omitted entry.
They are byte-identical in full identity after the stated ordinal/time
normalization. A same-byte inode replacement, root swap, file A/artifact B,
directory identity drift, readback after scan, released/reopened FD, content
mutation between the two identity samples, phase-1 hidden entry, phase-2 side
entry, or BuildTree projection/full-identity mismatch independently fails
kinds 74/156/162/169/180. The build root is distinct from every protected, install,
runtime, evidence, custody, formal-output, source-review, and original-runtime
root and is never retained as authority. Artifact ordinals/paths are unique and
file-prefix-free. Exactly `9228` role-1 artifacts map one-to-one to `9229`:
`942a` is the source ordinal, `9424/9425` equal `9303/9304`, producer is
`0xffffffff`, and its held materialized file was exclusive and byte-identical.
Every role-2/3/4/5 artifact has exactly one producer execution; every declared
consumer exists, is strictly increasing, and appears in exactly one matching
kind-163 edge. Conversely every execution `945b/945d` and `9460` projection
equals the complete artifact/edge rows that name that execution, with no
orphan, duplicate, hidden input/output, or side file.

The edge graph is acyclic and topologically ordered by the exact observed
times: source edges use zero producer time; every other `9437` equals its
producer `944a`; `9438` equals consumer `9449`; and `9437 <= 9438`.
Edge `9436` equals artifact `9425`; producer/consumer ordinals equal the
artifact and execution projections. Every object consumed by the linker has a
compiler producer, the unique unsigned role-3 artifact has the linker as
producer and signer as consumer, and exactly one signed-final role-4 artifact
has the signer as producer. `937b` selects that sole role-4 row; its
`9424/9425/9426` are byte-identical to `9330.6203/6204`, `9331/9332.6401`,
and `9330`, and therefore to `9226/9224/9225` and the held raw launcher input.
Scanner/test/encoder auxiliary edges may observe existing artifacts but cannot
produce or replace the final output. This is the complete final-output
dependency chain, not a compiler command list followed by a producer assertion.

Gate B omits, adds, duplicates, or reorders one execution/artifact/edge; pairs
command A with execution B; changes exec path/tool/child/parent/birth/FD/syscall/
wait/output; substitutes stdout/stderr A under hash B; introduces an undeclared
artifact, consumer, producer, edge, side file, second final, cycle, time
inversion, scan mismatch, post-scan side entry, or hidden source; selects final artifact A with raw launcher B; or
pairs an otherwise valid execution/DAG from another source/SDK/tool/build root.
Each mutation independently fails the applicable kinds
149/151/156/159/161/162/163/164/167/169/170/171/172/173/174/175/176/180
before HMG4L3 result admission.

`922e.9322/9323 == 9227/9228`, and its consumed source ordinal list is exactly
every ordinal once. `922e.9324/9325/9326 == 922a/922b/922c`, and its consumed
tool list is likewise a complete partition. `922e.9371 == 9238`.
`922e.9330` is byte-identical to `9226`, `9331/9332 == 9224/9225`, and the kind-149 held
`launcher-build-transcript` bytes are exactly the canonical nested `922e`
bytes and hash to `922d`. `922e.932e` is the canonical kind-24 zero-member
stream; no environment count/list exists in this profile. An unused
source/tool, hidden input, alternate
command set, SDK/toolchain swap, parallel otherwise-valid transcript, nonempty unreviewed
environment, network use, nonzero exit/output, or produced binary mismatch
blocks. This is one exact build's byte provenance only; HMG4L3 does not claim
independent clean-root reproducibility. Such a claim would require two distinct
held roots/transcripts and byte-identical outputs under a reviewed successor.
Gate B inserts one environment member, substitutes every neighboring nonempty
kind-24 hash, and pairs an otherwise valid transcript from another registry;
all fail before HMG4L3 result admission.

Every `932b`, `932d`, and `93bf` member is the distinct LauncherOrdinalRef
schema `93c4`, never predecessor IndexRef `7201`. Source contexts require
`93c4 < source_count <= 1,024`; tool context requires `93c4 < 7`. Gate B
includes source values 113, 114, 1,023, and 1,024 under boundary-appropriate
counts, tool values 6/7, a `7201` STRUCT substituted for `93c4`, a `93c4`
STRUCT substituted at an XattrPolicyBinding IndexRef site, and count A/ref B
pairs. Only the in-range context-correct cases pass; XattrPolicyBinding keeps
its predecessor 0..113 IndexRef unchanged.

`922e.933b/933c == 9233/9234`, with kind 34 recomputed. `9235` is kind 157
over `9237`: it contains exactly one ordinal-0 ActorIdentityBinding whose actor
is byte-identical to builder `9234`; `9236 == 1`. The builder is kind 3 with
exact `6f07 == 0x8`, and its complete executable/credential fields plus held
file/code are the `933d..9340` closure above. The seven BuildToolIdentity values
are not ActorIdentityBinding members and grant no `6f07` role. Auditor
`921f/921e` is kind 2 and kind-34-distinct from the one builder member. Same
builder executable with changed credential, same stable label with changed
code, omitted/extra actor, generic tool actor insertion, builder substituted
for a tool, or auditor equal to builder are independent negative vectors.

The kind-150 output order and identifiers are exactly: (0)
`launcher-review/implementation-security`, role 9; (1)
`launcher-review/source-to-binary-provenance`, role 10; (2)
`launcher-test/double-nofollow-walk`, role 10; (3)
`launcher-test/single-execve-exact-argv-empty-env`, role 10; (4)
`launcher-test/three-pipe-lifecycle`, role 10; (5)
`launcher-test/parent-mapped-vnode`, role 10; (6)
`launcher-test/negative-alternate-copy`, role 10; (7)
`launcher-test/negative-symlink-edge`, role 10; (8)
`launcher-test/negative-extra-fd`, role 10; (9)
`launcher-test/negative-endpoint-alias`, role 10; (10)
`launcher-test/negative-status-flag-drift`, role 10; (11)
`launcher-test/negative-second-exec`, role 10; (12)
`launcher-test/negative-relative-path`, role 10; (13)
`launcher-test/negative-nonempty-environment`, role 10; (14)
`launcher-command/build`, role 12; and (15) `launcher-command/tests`, role 12.
Every output uses binding 2. Output 0 is encoding 3 raw human-readable bytes;
outputs 1..14 are encoding 2 complete canonical nested STRUCT bytes; output 15
is encoding 4 complete kind-155 derived-stream bytes. The reports include
exact test case IDs, inputs, expected/observed syscall counts, exit/status,
path/edge/vnode and pipe observations, command identities, and zero protected,
runtime, apply/recover, acceptance, promotion, or publication effects. No
summary-only or selectively omitted failing output is admitted.

Output 0 is human-readable supplemental narrative and never establishes pass.
Outputs 1..13 are byte-identical to the canonical nested STRUCT bytes of
`9231` ordinals 0..12; output 14 is byte-identical to canonical `922e`; and
output 15 is the complete kind-155 stream over `9231`. Thus the authoritative
source/build/behavior evidence is machine parsed, not extracted from prose.
Every `9231` member repeats `9201/9202`, `9227`, `922d`, `9223`, `9226`,
`9224/9225`, `920b`, `9238`, `922e.933e/933f/9340`, `9233`, and the exact
held test-vector catalog `9232` at its declared fields. In particular
`9362==9238`, `9363..9365 == 922e.933e..9340`, and `9366==9233`.
`9367/9368` equal the selected vector's `93f3/93f4` and matching kind-165
pre-execution plan, while `9369/936a` equal the matching kind-166 actual
observation; any cross-object mismatch blocks.

Test profiles 1..13 are respectively single-build source-to-binary provenance,
double-no-follow positive, single-execve/argv/env positive, three-pipe positive,
parent-mapped-vnode positive, alternate-copy negative, symlink-edge negative,
extra-FD negative, endpoint-alias negative, status-flag-drift negative,
second-exec negative, relative-path negative, and nonempty-environment
negative. Injection masks are exactly
`0,0,0,0,0,1,2,4,8,0x10,0x20,0x40,0x80`; expected decisions are admit for
profiles 1..5 and reject for 6..13. The exact
`(walk,execve,pipe,child-FD,retained-peer,mapped-vnode)` rows are:

```text
profile 1: (NA,NA,NA,NA,NA,0)
profile 2: (2,1,3,3,3,1)
profile 3: (2,1,3,3,3,1)
profile 4: (2,1,3,3,3,1)
profile 5: (2,1,3,3,3,1)
profile 6: (2,0,NA,NA,NA,0)
profile 7: (0,0,NA,NA,NA,0)
profile 8: (2,0,3,4,3,1)
profile 9: (2,0,3,3,3,1)
profile 10:(2,0,3,3,3,1)
profile 11:(2,1,3,3,3,1)
profile 12:(0,0,0,0,0,0)
profile 13:(0,0,0,0,0,0)
```

`93f5` is zero for profiles 1/6/7/12/13, profile 1 for profiles 2..5,
profile 2 for profile 8, profile 3 for profile 9, profile 4 for profile 10,
and profile 5 for profile 11. `936b/936c` are absent exactly when `93f5==0`;
otherwise `936b` is kind 179 over the one complete `936c`, and
`936c.96b2/96b3/96bf/96c0 == 9342/93f5/934d/934e`.
`936d/936e == 93f6/93f7`; both sides are 3/6 exactly when `93f5` is nonzero
and both are `0xffffffff` otherwise. The parsed complete
HMG4LC2 configuration supplies the kind-48 identity at `96b4`; its
`4b13..4b18` equal `96bc/96bd`, the exact child/peer directions, duplicate-
close facts, and immutable admitted peer flags. A frame hash or count tuple
without this parsed identity and typed topology is invalid.

`96b6` is kind 177 over six complete endpoint rows ordered child slots 0..2,
then parent peers slots 0..2; roles are 1..6, reciprocal peer ordinals are
0/3, 1/4, and 2/5, and all six creation FDs and own pipe handles are nonzero
and pairwise distinct. Every reciprocal pair has byte-identical own/peer handle
cross-links in both before and after PipeEndpointObservation values. Child
decision FDs are exactly 0/1/2 with access read/write/write; their creation
FDs are the three distinct `dup2` sources and their duplicates are closed.
Parent decision FDs remain their distinct creation FDs with access
write/read/read and are retained through decision. Every row's configuration
hash equals `96b4`; public fdtype, direction, status/descriptor flags, handles,
and peer topology are explicit, never inferred from `96b5/96bc/96bd`. The two
rows in each reciprocal pair repeat one successful typed `pipe` call ordinal,
return, and interval at `9697..969a`; the three pair ordinals are 0..2 exactly.
Each child row records `dup2(creation_fd,decision_fd)`, exact returned
destination, zero canonicalized errno, and interval, followed by the successful
close of that creation-FD duplicate at `969f/9751..9753`. Parent rows forbid
those child-branch dup2/close fields because their closes occur in the launcher
parent and are instead the complete kind-186 objects at `97b4..97b6`. Child
dup2 intervals occur in slot order after all pipe
calls; each duplicate close follows its dup2 and precedes decision.

`96c3` hashes the exact ordered child-side kind-177 projection plus the
conditional profile-2 extra record; `96c4` hashes the exact three parent-peer
rows. The complete public transport-FD enumerations at `96c5/96c6` prove those
sets contain every child transport FD and every retained peer, not a sampled
subset. `97b8` is kind 190 over exactly three `97ba` pre-fork child nonblocking
setups, and `97b9/97bb/97bc` are 3/3/6.
`97bb` is the complete process-wide `F_SETFL` count for the lifecycle test;
`97bc` counts exactly the six setup-row reads. Their context kind is 2, context ordinal
equals the enclosing test, slot/child/peer mapping equals the six kind-177
endpoint rows and selected pipe calls, after-readback equals each child row's
stable admitted `9689/968a` status, `98f7` equals its stable zero
`968b/968c`, and `98f6` selects the matching role-1/2/3
record in parent pass 0. For every slot, both reciprocal endpoint rows have
the same pipe-call finish and require `969a < 98eb`,
`98eb <= 98ec <= 98f0 <= 98f1 <= 98f4 <= 98f5`, and `98f5 < 97bd`.
No kind-190 row selects a parent peer. Lifecycle
`97bd..97c1` record exactly one typed fork: every setup `98f5 < 97bd`, the
parent return is the one observed nonzero child PID, and the child return is
zero. `97c2` is kind 97 over `97c3`; `97bf==97c3.8133`, while
`97c3.8134`, boot UUID, and SDK layout equal the common phase-1 parent
execution identity's PID, boot UUID, and layout, and the child's public start
tuple is the unique post-fork tuple for this test. Context-2 `98fb=true` is
valid only with those exact edges; a count or
boolean cannot replace the fork observation. Lifecycle
profile 4's deliberate retained-parent request-peer drift is a separate
pre-frozen negative injection recorded by kinds 165/166 after this valid setup;
it never masquerades as an admitted kind-190 setter. `97b1` is kind 185 over
two complete parent passes and `97b4` is kind
186 over exactly three parent closes. In context kind 2, pass 0 occurs after
fork and contains roles 1..6 plus every nontransport FD; closes 0..2 remove
the parent copies of child roles 1..3 in slot order; pass 1 occurs before the
decision and contains exactly retained transport roles 4..6 plus the
byte-identical nontransport projection. Both pass execution identities equal
the observed launcher parent birth tuple and `98c3` equals the enclosing test
ordinal. No untyped parent FD mutation occurs between them. Each close binds
one phase-1 record and exact endpoint and proves successful return, zero
canonicalized errno, order, absence-after, and continued presence of the
reciprocal peer. Counts `96c7..96c9` are recomputed from the typed endpoint call fields
and equal 3/3/3; the separate setter/read counts are exactly `97bb/97bc=3/6`.
In lifecycle profiles 1/3/4/5 the child projection contains
only decision FDs 0/1/2; profile 2 contains those plus exactly the typed extra
FD. `97b2/97b5/97b7` equal 2/3/3. No count-only summary may substitute for the
child, retained-peer, complete-parent-table, or parent-close preimage.

`96b9` is kind 178 over three configuration-slot bindings. In lifecycle
profile 1 all presented/canonical endpoint ordinals and FDs are exact,
validation class is 1, all six status values are stable, and decision is admit.
Profile 2 retains that exact six-endpoint topology but requires the one
`96be` role-8 extra-FD record to be byte-identical to selected
`936a.9534`, makes `96bc==4`, and rejects before exec. Profile 3 deliberately
presents child endpoint ordinal 1 for both response slot 1 and diagnostic slot
2: slot 2 has class 2, every actual endpoint/peer remains distinct, and the
alias claim is rejected before exec. Profile 4 changes exactly the SDK-bound
`O_NONBLOCK` status bit on retained parent request-peer ordinal 3 between its
before/after observations; slot 0 has class 4 and rejection occurs before
exec. Profile 5 retains an otherwise exact profile-1 lifecycle and rejects the
second exec recorded by the matching injection observation. Conditional
`96be` is forbidden outside lifecycle profile 2. Every lifecycle has zero
protected/runtime effect.

Gate B includes endpoint A/configuration slot B, endpoint A/peer handle B,
child/parent-side swap, read/write swap, creation/decision-FD swap,
duplicate/omitted endpoint, three-count with a hidden fourth FD, duplicate
claim without distinct actual pipes, injected-record A/observation B,
retained-peer flag change under an admitted profile, wrong changed bit,
unclosed child duplicate, released parent peer, wrong lifecycle-profile
presence, missing/extra/unclosed/wrong-end parent duplicate, parent-close
failure or order drift, phase-1/phase-2 parent-table omission/addition, a hidden
parent pipe, nontransport drift, and kind-177/178/179/184/185/186 hash/list
drift. It also omits or duplicates one child setter, targets a retained peer,
changes a bit other than `O_NONBLOCK`, records success after a failed setter,
places a setter at/after fork, changes fork count/return/PID/time, pairs
endpoint A with endpoint B readback, or keeps
the final status while deleting its typed setter preimage. Each independently
fails kinds
150/155/160/165/166/177/178/179/184/185/186/190 before HMG4L3 admission. Profile 4's positive
three-pipe claim and profile 9's endpoint-alias rejection therefore rest on
complete typed lifecycle evidence rather than their count/boolean summaries.

`NA` is encoded only as U32 `0xffffffff`; no measured value may use that
sentinel. Positive argv/environment hashes equal the exact launcher
configuration's kind-23/kind-24 hashes; negative-vector hashes equal the
catalog's exact injected bytes. Every observed decision equals expected,
`9357..9361` remain false, and `935a` is zero. A raw report claiming pass while
any canonical observation, transcript, held member, count, or cross-hash is
missing/different fails.

The unsigned payload is the canonical payload omitting only `9220..9222` while
retaining the complete auditor. Kind 151 is over the one complete
`ExternalLauncherTCBAuditStatement`; its `8ae4` is SHA-256 of those unsigned
bytes and `8ae5..8aeb` equal `921e`, `9201`, `9202`, `9223`, `9224`, `9205`,
and `9208`; `8aed == 9238` and `8aee == 922e.933f`. `9221/9222` verify strict
`HMG4-ED25519-STRICT-1` over the complete kind-151 bytes under `921f.6f08`.
The auditor is distinct by kind-34 identity from the one builder actor named by
the source/build transcript; BuildToolIdentity members are non-actors and grant
no reviewer, builder, runtime, or protected-write role.
The complete passing HMG4L3 is finalized before kind-48, helper, or policy
construction and contains no field or member that can name any of them.

Before a final P2 exists, HMG4L3 is signed, content-addressed provenance only;
its self-carried actor grants no production trust. Final P2 admission requires
exactly one `102a` ActorIdentityBinding whose nested actor is byte-identical to
`921f`, carries kind-2 independent-reviewer bit 4, and hashes to `921e`.
The policy-root signature over final P2 therefore anchors the already complete
audit actor without putting P2 into HMG4L3. No second bit-4 actor, actor with
the same SPKI but different complete identity, audit signed by actor A paired
with policy actor B, or helper-embedded kind-48 bytes/hash without that root-signed
cross-binding is authoritative. Gate-B includes each one-sided mutation plus a
transitive proof that the one-way order is HMG4L3 -> kind48 -> helper -> final
P2, with no reverse hash edge. It also changes embedded `4b01` while retaining
`4b1a`, changes `4b1a` while retaining `4b01`, pairs embedded bytes A with
kind-48 hash B, and pairs embedded kind-48 A with held configuration/P2/I2 B;
each must fail before either component sequence supplies a locator.

`HMG4E2` is the only canonical subordinate review/evidence manifest for the
production helper/build pipeline. Header kind
is 1 source scan, 2 unit/fuzz/analyzer, 3 adversarial suite, 4 read-only probe,
5 independent implementation/security review, or 6 canonical-vector independent
review. Its payload is exactly:

```text
0x7501 protocol_spec_sha256       SHA256
0x7502 evidence_kind              U32, equal header kind
0x7503 producer_identity_sha256   SHA256, derived kind 34
0x7504 input_set_sha256           SHA256, derived kind 27
0x7505 output_set_sha256          SHA256, derived kind 27
0x7506 command_set_sha256         SHA256, derived kind 23
0x7507 started_at_unix_seconds    U64
0x7508 finished_at_unix_seconds   U64
0x7509 result                     U32: 1 pass, 2 fail
0x750a finding_p0_count           U32
0x750b finding_p1_count           U32
0x750c finding_p2_count           U32
0x750d acceptance_effect_mask     U64, exactly zero
0x750e finding_count              U32, 0..1,024
0x750f findings                   LIST ReviewFinding, exact count
0x7510 finding_set_sha256         SHA256, derived kind 53
0x7511 producer_identity          STRUCT ActorIdentity
0x7512 input_count                U32, 1..8,192
0x7513 inputs                     LIST ReviewedObjectMember, exact count
0x7514 output_count               U32, 0..8,192
0x7515 outputs                    LIST ReviewedObjectMember, exact count
0x7516 command_count              U32, 1..256
0x7517 commands                   LIST DiagnosticByteString, exact count
0x7518 signer_identity_sha256     SHA256, derived kind 34
0x7519 signer_identity            STRUCT ActorIdentity, kind 2 with bit 4
0x751a evidence_attestation_statement_sha256 SHA256, derived kind 57
0x751b signature_algorithm        U32, exactly 1 Ed25519
0x751c detached_signature         BYTES, exactly 64
0x751d policy_sha256              SHA256
```

Build receipt `601c..601f/6021/6029` reference respectively kind 1, 2, 3, 4, 5,
and 6 complete `HMG4E2` hashes. `7503` is kind 34 over `7511`; the producer
tool is kind 3 and carries builder bit 3 for kinds 1..4 or independent-reviewer
bit 4 for kinds 5/6. `7504`, `7505`, and `7506` are recomputed over `7513`,
`7515`, and `7517`; the three counts match. `7518` is kind 34 over `7519`,
equals the role-12 EvidenceTrustRule issuer, and carries independent-reviewer
bit 4. Counts `750a..750c` are recomputed from `750f` by priority and
`7510` is recomputed over the complete list. Every `7dd8` is a well-formed,
non-normalized exact UTF-8 byte string with no NUL, and `7dd7` is SHA-256 of
those exact bytes. Result 1 requires zero findings and
the exact empty kind-53 stream; result 2 requires at least one open finding. A
manifest with findings may be retained but cannot satisfy a production build
receipt. Runtime opens every referenced manifest through role-12 content-
addressed EvidenceLocation, parses it, validates its actor/trust/result, and
matches complete hashes; U2 issuer attestation never substitutes for those
bytes. The exact unsigned-payload and signature rule is Section 8.5.

`ReviewedObjectMember.object_role` is closed: 1 successor specification,
2 predecessor contract, 3 source unit, 4 authority object, 5 executable or
tool, 6 build/review configuration, 7 golden catalog, 8 golden blob,
9 analysis or review report, 10 unit/fuzz/analyzer output, 11 read-only probe
output, 12 command transcript, 13 vector-target manifest, and 14 fixture
observation. Inputs and outputs are separate lists, so a member role never
implies direction. Diagnostic identifiers are labels only; complete length and
hash are the evidence.

The HMG4E2 scope matrix is exact and is validated in the context of the U2/K2
object that references it. Every input set begins with identifier
`successor-spec` role 1/hash `7501`, `predecessor-contract` role 2/Section 0
hash, and `command-set-definition` role 6 whose complete-object hash equals
`7506`. Remaining mandatory members and outputs are:

```text
kind  mandatory additional inputs (exact semantic set)          required outputs
1     policy, plan, bundle; every U2 600b source unit;           one role-9 source-scan-report whose bytes
      all eight complete U2 603b tool identities                 are exact complete kind-131 stream
2     kind-1 E2; policy; every 600b/3026 source unit;            role-10 unit/fuzz/analyzer outputs,
      production-helper, fixture-helper, fixture-policy;         at least one of each configured class
      all eight complete U2 603b tool identities
3     kind-1 and kind-2 E2; policy; kind-2 source and binary     role-10 adversarial-suite output and
      set but not its profile-1 fixture-policy input; every      role-10 acl-denial-vector-set plus exactly
      instrumentation delta; exact profile-2 F2                  90 role-14 fixture observations
4     policy, production-helper, OSBuildIdentity, SDKIdentity,   exactly one role-11 read-only-probe output
      target/system capability requirement vectors; complete
      all eight complete U2 603b tool identities
5     kinds 1..4 E2; policy, plan, bundle; every 600b/3020/3026  one role-9 implementation-security-review
      source; production-helper, fixture-helper, fixture-policy; report; zero findings for pass
      every instrumentation delta and production-equivalence;
      all eight complete U2 603b tool identities                 function-byte object
6     policy; exact HMG4G2 including its complete kind-70        one role-9 vector-review report; exactly six
      external-identity/stable-scan commitments; exact
      `vector-target-manifest` role-13 member whose hash/length
      equal G2 `7703/770e`; encoder-A/B source/config/tool;       role-10 outputs; exactly two role-12 command
      both canonical encoder/decoder                             transcripts; the six role-10 outputs are two
                                                                 decoder aggregates followed by
                                                                 four outer-resource reports in the fixed order
                                                                 logical max, logical over, allocated max,
                                                                 allocated over
```

Identifiers are exact ASCII labels above; repeated families append `/` and the
canonical target-list ordinal after target re-ordinalization. No other input or
output member is permitted. All required family members occur once. Kind 5
deliberately excludes K2/U2/I2/Q2 so K2 may bind the completed review without a
cycle; every `ProductionEquivalenceMember.7d65` equals that exact kind-5 hash
and later equals U2 `6021`. Kind 6 excludes U2 and all downstream installation,
quiescence, authorization, journal, and receipt objects. Its producer `7503`
and signer `7518` are different from both G2 encoder actors `770a/770b`; the two
encoders are different from each other as Section 4.1 requires. Kinds 1..5 also
forbid any downstream object not explicitly named by the matrix.

For E2 kinds 1, 2, and 4, the two tool inputs are exact role-5, encoding-2,
binding-1 members `build-tool/compiler` and `build-tool/sdk`, containing the
complete canonical nested U2 `600c` and `600d` bytes in that order. They are
not executable-file substitutes for the nested `6115` preimages.

Kind 3's denial-fixture family is exact. The role-10 member
`acl-denial/vector-set` has encoding 4, binding 1, and contains the complete
HMG4D2 kind-73 stream over all 90 observations. Each observation also occurs
once as a role-14, encoding-2, binding-1 member with identifier
`acl-denial/SS/OO/C`, where `SS` and `OO` are exactly two lowercase hexadecimal
digits for subject role and operation code and `C` is the one ASCII decimal
scenario digit. The member bytes are the complete canonical nested
AccessDenialFixtureObservation. The role-10 stream projection and every
role-14 member are byte-identical after canonical kind-73 re-ordinalization;
wrong identifier case/width, missing/extra row, binding 2, hash-only report, or
summary assertion fails.

Kind 3 additionally has exactly one role-4, encoding-1, binding-1 input with
identifier `denial-fixture-authorization`. Its embedded bytes are one complete
profile-2, scope-1 HMG4F2 frame with `7922=90`; its complete-object SHA-256 is
byte-identical to every observation `7f38` and every nested parent executor
`7fb2.7978`. The frame's nonce and exact claim derivation equal all ninety
`7f39..7f3c` copies. No locator, summary hash, profile-1 F2, second F2, or
per-observation re-encoding is permitted.

The one exception to ordinal-suffixed family labels is a source byte object
selected from `600b`, either K2 `3020`, or either K2 `3026`. It is role 3,
encoding 3, and its exact identifier is `source/` followed by lowercase hex of
its complete content SHA-256. The matrix forms one union keyed by that hash;
byte-identical cross-list occurrences collapse to the same complete member,
while a length, bytes, locator, role, or encoding disagreement for one hash is
invalid. This makes kind-27's no-duplicate role/hash rule deterministic without
dropping any distinct source bytes.

For every kind, `7517` is byte-identical to the parsed kind-23 stream named by
`command-set-definition`; a command not in that stream, an omitted configured
class, an unrelated output, or an otherwise valid signed manifest with the
wrong semantic member set is invalid. The matrix and each identifier/equality
are exact target-manifest obligations and receive one-sided negative vectors.

Kind 6 contains one complete HMG4G2 input member, normally locator-bound under
binding 2. Because that G2 already embeds and hashes every GoldenBlob descriptor,
every GoldenExternalBlobIdentity, and both stable kind-70 scans, E2 must not
repeat up to 131,072 external blobs as separate inputs; doing so would create a
second, potentially divergent projection and exceed the E2 resource model. The
kind-6 review nevertheless opens and streams every G2-referenced external file,
and its required report and decoder-result outputs attest the per-blob results
against the exact G2 commitments. The exact nine output identifiers, roles, and
semantic order are: `vector-review-report` role 9;
`decoder-result/a` role 10; `decoder-result/b` role 10;
`outer-resource/logical-max` role 10;
`outer-resource/logical-over` role 10;
`outer-resource/allocated-max` role 10;
`outer-resource/allocated-over` role 10;
`command-transcript/a` role 12; and `command-transcript/b` role 12. No `/ordinal`
suffix is added to these nine singleton identifiers. The two aggregate decoder
results are complete `HMG4H2` encoding-1 frames and contain one canonical
ordered result for every `7705` case and every referenced external blob; the
four outer-resource outputs are complete
`HMG4M2` encoding-1 frames and obey their exact kind/value order. Per-case files
are forbidden.

The 2,048-member U2 build-input bound accommodates all 1,024 source units plus
the required specifications, SigningProfile, compiler/SDK identities, and
toolchain/argument/environment streams. The 8,192-member E2 input/output bounds
accommodate, at their simultaneous canonical maxima, both K2 common/test source
families, all U2 sources, both instrumentation-delta families, all production-
equivalence function regions, and the fixed kind-5 inputs. Count-bound max and
max-plus-one vectors use minimum-size locator/embedded members so the 16-MiB E2
payload cap remains conjunctively testable; a real manifest whose selected
members exceed that cap is invalid even when its count is in range.

The only production/runtime authority-root slots are protected installation 1
and approved project 2. Fixture-only slots 3/4 exist solely under Section 7.1
and never enter this production rule. Every root is reached by opening `/` and
walking exact components.
Every parent-child edge binds held parent device/inode, exact component bytes,
and held child device/inode. A stable double enumeration and exact-case match
precedes opening; source and destination ancestry edges are rechecked before
and after every mutation and before terminal intent/receipt.

### 4.1 Canonical derived preimages and closed registries

This successor extends the predecessor `HMG4D2` derived-hash registry. It uses
the predecessor's exact header/member framing, integer encoding, nested-STRUCT
encoding, no-padding rule, and full-stream SHA-256. New member schemas are:

```text
NamespaceRuleMember
  0x7b01 ordinal                     U32, contiguous from zero
  0x7b02 protected_parent_role       U32, Section 4 registry 1..4
  0x7b03 leaf_class                  U32: 1 exact leaf, 2 evidence template,
                                         3 custody grammar, 4 POLICY_REL_PATH
  0x7b04 exact_leaf                  BYTES, 0..255; nonempty only class 1
  0x7b05 template_or_entry_index     U32; role/template for class 2,
                                         entry index for class 4,
                                         0xffffffff otherwise
  0x7b06 object_type                 U32, exact allowed type
  0x7b07 required_identity_or_metadata_sha256 SHA256, derived kind 15
  0x7b08 maximum_matching_count      U32
  0x7b09 custody_variant             U32: 1 request, 2 journal, 3 receipt,
                                         4 stage, 5 archive, 6 preimage,
                                         7 rollback; required class 3,
                                         forbidden classes 1, 2, and 4
  0x7b0a custody_managed_index       U32: 0xffffffff variants 1..3,
                                         0..113 variants 4..7; required class 3,
                                         forbidden classes 1, 2, and 4
  0x7b0b custody_identity_source     U32: 1 fixed RoleMetadataPolicy,
                                         2 held predecessor FinalEntry,
                                         3 Entry plus bound HMG4Y2;
                                         required class 3, forbidden otherwise
  0x7b0c custody_fixed_metadata_role U32: 16 request or 17 journal/receipt;
                                         required source 1, forbidden sources 2/3

CanonicalIdentityMember
  0x7c01 identity_kind               U32: 1 RootIdentity, 2 DirectoryIdentity,
                                         3 ProtectedFileIdentity,
                                         4 ExecutableCodeIdentity,
                                         5 WriterIdentity, 6 ActorIdentity,
                                         7 RoleMetadataPolicy, 8 FinalEntry,
                                         9 ProcessInventoryRecord,
                                         10 ProtectionSubject,
                                         11 ObservedExecutableIdentity,
                                         12 EvidenceLocation, 13 Entry,
                                         14 ProtectedParent,
                                         15 XattrPolicyBinding,
                                         16 OSBuildIdentity, 17 SDKIdentity,
                                         18 BundleEntry,
                                         19 LauncherConfigurationIdentity
  0x7c02 identity                    STRUCT, exact schema selected by kind

CapabilityRequirement
  0x7d01 ordinal                     U32, contiguous from zero
  0x7d02 scope                       U32, 1 target or 2 system-lock
  0x7d03 operation_code              U32, exact Section 8.1 registry
  0x7d04 required_attempt_count      U32, exactly 3
  0x7d05 primitive_code              U32, exact closed primitive registry
  0x7d06 contract_flag_mask          U64, exact registry below
  0x7d07 expected_return_class       U32, 1 success or 2 failure
  0x7d08 expected_errno              U32, zero iff success
  0x7d09 parameter_set_sha256        SHA256, derived kind 27
  0x7d0a parameter_count             U32, 1..1,024
  0x7d0b parameters                  LIST ReviewedObjectMember, exact count

EvidenceArtifactObservation
  0x7e01 ordinal                     U32, contiguous from zero
  0x7e02 artifact_role               U32: 1 capability pre-state,
                                         2 capability post-state,
                                         3 capability durability observation,
                                         4 capability retained artifact,
                                         5 journal artifact resolver,
                                         6 journal move-resolver source,
                                         7 journal move-resolver destination,
                                         8 rollback-reason exact pre-state,
                                         9 rollback-reason exact post-state
  0x7e03 diagnostic_relative_bytes   BYTES, 1..1,024; never path authority
  0x7e04 object_type                 U32: 0 absent, 1 ordinary, 2 directory,
                                         3 symlink, 4 other
  0x7e05 byte_length                 U64, required types 1/3; forbidden 0/2/4
  0x7e06 content_sha256              SHA256, required types 1/3; forbidden 0/2/4
  0x7e07 identity_sha256             SHA256, derived kind 58
  0x7e08 identity                    STRUCT ObservedArtifactIdentity

ObservedArtifactIdentity
  0x7811 object_type                 U32: 0 absent, 1 ordinary, 2 directory,
                                         3 symlink, 4 other
  0x7812 device                      U64, required types 1..4; forbidden type 0
  0x7813 inode                       U64, required types 1..4; forbidden type 0
  0x7814 byte_length                 U64, required types 1..4; forbidden type 0
  0x7815 content_sha256              SHA256, required types 1/3;
                                         forbidden types 0/2/4
  0x7816 link_count                  U32, required types 1..4; forbidden type 0
  0x7817 mode_bits                   U32, required types 1..4; forbidden type 0
  0x7818 owner_uid                   U32, required types 1..4; forbidden type 0
  0x7819 group_gid                   U32, required types 1..4; forbidden type 0
  0x781a flags                       U32, required types 1..4; forbidden type 0
  0x781b acl_sha256                  SHA256, required type 1;
                                         forbidden types 0/2/3/4
  0x781c xattr_set_sha256            SHA256, required type 1;
                                         forbidden types 0/2/3/4
  0x781d observation_result          U32, exactly 1 complete

ErrnoEffectAttempt
  0x7f01 ordinal                     U32, contiguous from zero
  0x7f02 operation_code              U32
  0x7f03 attempt_ordinal             U32, 0..2
  0x7f04 return_class                U32: 1 success, 2 failure
  0x7f05 errno_value                 U32, zero iff success
  0x7f06 effect_class                U32: 1 exact expected effect,
                                         2 exact proven no effect,
                                         3 unexpected but completely observed effect
  0x7f07 pre_state_sha256            SHA256, derived kind 15 or 18
  0x7f08 post_state_sha256           SHA256, derived kind 15 or 18

AccessDenialFixtureObservation
  0x7f21 ordinal                     U32, contiguous after kind-73 sorting
  0x7f22 subject_role                U32, exact Section-8.4 role 1..10
  0x7f23 operation_code              U32, exact Section-8.4 operation 1..11
  0x7f24 operation_scenario          U32: 0 non-rename, 1 rename-in, 2 rename-out
  0x7f25 syscall_profile             U32, exact closed registry below
  0x7f26 os_build_identity_sha256    SHA256, equal U2 `602c`
  0x7f27 sdk_identity_sha256         SHA256, equal U2 `602d`
  0x7f28 fixture_root_identity       STRUCT RootIdentity, authority slot 3
  0x7f29 fixture_parent_identity     STRUCT DirectoryIdentity, authority slot 3
  0x7f2a fixture_subject_identity_sha256 SHA256, derived kind 15
  0x7f2b fixture_subject_identity    STRUCT CanonicalIdentityMember,
                                         kind 2 roles 1/2, kind 3 roles 3..10
  0x7f2c containing_parent_identity_sha256 SHA256, derived kind 15 kind 2
  0x7f2d containing_parent_identity STRUCT CanonicalIdentityMember, kind 2
  0x7f2e fixture_credential          STRUCT ProcessCredentialIdentity
  0x7f2f observed_bypass_mask        U32, exactly zero
  0x7f30 target_set_sha256           SHA256, derived kind 66
  0x7f31 target_count                U32, 1..2
  0x7f32 targets                     LIST AuthorizationTargetEvaluation, exact count
  0x7f33 expected_errno              U32, exactly 1 EPERM or 13 EACCES by table
  0x7f34 attempt_count               U32, exactly 6 for operations 1/0, 2/1,
                                         and 9/0,
                                         exactly 3 otherwise
  0x7f35 attempts                    LIST AccessDenialFixtureAttempt, exact count
  0x7f36 attempt_set_sha256          SHA256, derived kind 79
  0x7f37 result                      U32, exactly 1
  0x7f38 fixture_policy_sha256       SHA256, complete profile-2 HMG4F2
  0x7f39 fixture_claim_relative_path CAPABILITY_FIXTURE_CLAIM_REL_PATH
  0x7f3a fixture_claim_identity      STRUCT ProtectedFileIdentity
  0x7f3b fixture_claim_byte_length   U64, exactly 84
  0x7f3c fixture_claim_bytes         BYTES, exactly 84
  0x7f3d claim_creation_observation_sha256 SHA256, derived kind 94
  0x7f3e claim_creation_observation STRUCT FixtureClaimCreationObservation

AccessDenialFixtureAttempt
  0x7f61 ordinal                     U32, contiguous 0..observation `7f34 - 1`
  0x7f62 before_target_set_sha256    SHA256, derived kind 66
  0x7f63 before_target_count         U32, equal observation `7f31`
  0x7f64 before_targets              LIST AuthorizationTargetEvaluation, exact count
  0x7f65 after_target_set_sha256     SHA256, equal `7f62`
  0x7f66 after_target_count          U32, equal `7f63`
  0x7f67 after_targets               LIST AuthorizationTargetEvaluation,
                                         byte-identical to `7f64`
  0x7f68 return_class                U32, exactly 2 failure
  0x7f69 errno_value                 U32, equal observation `7f33`
  0x7f6a effect_class                U32, exactly 2 exact proven no effect
  0x7f6b selected_syscall_argument_profile_sha256 SHA256, SHA-256 of exact
                                         canonical nested `7f6d`
  0x7f6c selected_profile_ordinal    U32, equal `7f61`
  0x7f6d syscall_argument_profile    STRUCT DenialSyscallArgumentProfile,
                                         byte-identical to selected F2 member
  0x7f6e fixture_executor_observation_sha256 SHA256, derived kind 83
  0x7f6f fixture_executor_observation STRUCT DenialAttemptExecutorObservation
  0x7f70 result                      U32, exactly 1
  0x7f71 fixture_variant             U32: 1 ordinary-file form,
                                         2 directory form, 3 ordinary-attribute
                                         flag form, 4 immutable-clear form;
                                         operation 1/0 and 2/1 ordinals 0..2
                                         use 1 and 3..5 use 2; operation 9/0
                                         ordinals 0..2 use 3 and 3..5 use 4;
                                         operation 3/0 uses 2 for directory
                                         subject roles 1/2 and 1 otherwise;
                                         every other row exactly 1
  0x7f72 before_namespace_sha256     SHA256, derived kind 86
  0x7f73 before_namespace_count      U32, 1..8
  0x7f74 before_namespace            LIST DenialNamespaceObservation, exact count
  0x7f75 after_namespace_sha256      SHA256, equal `7f72`
  0x7f76 after_namespace_count       U32, equal `7f73`
  0x7f77 after_namespace             LIST DenialNamespaceObservation,
                                         byte-identical to `7f74`
  0x7f78 before_scan_finished_at_unix_nanoseconds U64
  0x7f79 syscall_started_at_unix_nanoseconds U64, not less than `7f78`
  0x7f7a syscall_finished_at_unix_nanoseconds U64, not less than `7f79`
  0x7f7b after_scan_started_at_unix_nanoseconds U64, not less than `7f7a`
  0x7f7c syscall_fd_argument_set_sha256 SHA256, derived kind 91
  0x7f7d syscall_fd_argument_count  U32, 1..2
  0x7f7e syscall_fd_arguments       LIST SyscallFDArgumentObservation, exact count
  0x7f7f native_acl_materialization_observation_sha256 SHA256, derived kind 119;
                                         required operation 10 only
  0x7f80 native_acl_materialization_observation STRUCT NativeACLMaterializationObservation;
                                         required operation 10 only

AccessDenialFixtureAuthorizationMember
  0x7f81 ordinal                     U32, contiguous after kind-82 sorting
  0x7f82 subject_role                U32, exact 1..10
  0x7f83 operation_code              U32, exact 1..11 matrix row
  0x7f84 operation_scenario          U32, exact 0..2 matrix row
  0x7f85 syscall_profile             U32, equal `7f83`
  0x7f86 required_attempt_count      U32, exact Section-8.4 value 3 or 6
  0x7f87 expected_errno              U32, exact Section-8.4 table value
  0x7f88 denial_credential_sha256    SHA256, SHA-256 of exact nested credential
  0x7f89 denial_credential           STRUCT ProcessCredentialIdentity
  0x7f8a target_rule_set_sha256      SHA256, derived kind 84
  0x7f8b target_rule_count           U32, 1..2
  0x7f8c target_rules                LIST DenialFixtureTargetRule, exact count
  0x7f8d argument_profile_set_sha256 SHA256, derived kind 89
  0x7f8e argument_profile_count      U32, equal `7f86`
  0x7f8f argument_profiles           LIST DenialSyscallArgumentProfile,
                                         exact count
  0x7f90 privilege_drop_profile      U32, exactly 1

DenialFixtureTargetRule
  0x7fa1 ordinal                     U32, contiguous from zero
  0x7fa2 target_role                 U32, exact Section-8.4 matrix
  0x7fa3 object_type                 U32: 1 ordinary or 2 directory
  0x7fa4 requested_right_mask        U64, exact Section-8.4 matrix
  0x7fa5 permitted_variant_mask      U32, exact bits for `7f71` values
  0x7fa6 required_precondition_flags U32, exactly UF_IMMUTABLE for variant 4,
                                         exactly zero otherwise
  0x7fa7 metadata_policy             STRUCT RoleMetadataPolicy,
                                         fixture-only object role 20
  0x7fa8 fixture_leaf_class          U32, exactly 1 hash-derived absent leaf

DenialAttemptExecutorObservation
  0x7fb1 parent_executor_sha256      SHA256, derived kind 71
  0x7fb2 parent_executor             STRUCT FixtureExecutorObservation
  0x7fb3 child_execution_identity_sha256 SHA256, derived kind 97
  0x7fb4 child_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x7fb5 observed_parent_execution_identity_sha256 SHA256,
                                         equal `7fb2.7971`
  0x7fb6 pre_drop_credential         STRUCT ProcessCredentialIdentity,
                                         equal parent actor credential
  0x7fb7 post_drop_credential        STRUCT ProcessCredentialIdentity,
                                         equal observation `7f2e`
  0x7fb8 privilege_drop_step_set_sha256 SHA256, derived kind 87
  0x7fb9 privilege_drop_step_count   U32, exactly 6
  0x7fba privilege_drop_steps        LIST PrivilegeDropStep, exact count
  0x7fbb held_executable_identity    STRUCT ProtectedFileIdentity
  0x7fbc static_code_identity        STRUCT ExecutableCodeIdentity
  0x7fbd dynamic_code_identity       STRUCT ObservedExecutableIdentity
  0x7fbe observed_bypass_mask        U32, exactly zero
  0x7fbf started_at_unix_seconds     U64
  0x7fc0 finished_at_unix_seconds    U64, not less than `7fbf`
  0x7fc1 result                      U32, exactly 1
  0x7fc2 child_dynamic_code_status  STRUCT DynamicCodeStatusObservation,
                                         actor profile 1
  0x7fc3 child_fd_inventory_sha256 SHA256, derived kind 92
  0x7fc4 child_fd_inventory_count  U32, 4..16
  0x7fc5 child_fd_inventory        LIST FixtureChildFDRecord, exact count
  0x7fc6 child_fd_pass_set_sha256  SHA256, derived kind 95
  0x7fc7 child_fd_pass_count       U32, exactly 2
  0x7fc8 child_fd_passes           LIST FixtureChildFDInventoryPass, exact count

DenialNamespaceObservation
  0x7fd1 ordinal                     U32, contiguous from zero
  0x7fd2 namespace_role              U32: 1 subject/source leaf,
                                         2 destination leaf
  0x7fd3 fixture_relative_path       CAPABILITY_FIXTURE_REL_PATH
  0x7fd4 leaf_identity_sha256        SHA256, derived kind 58
  0x7fd5 leaf_identity               STRUCT ObservedArtifactIdentity,
                                         type 0 absent or 1/2 present
  0x7fd6 parent_identity_sha256      SHA256, derived kind 15 identity kind 2
  0x7fd7 parent_identity             STRUCT CanonicalIdentityMember, kind 2
  0x7fd8 parent_entry_set_sha256     SHA256, derived kind 85
  0x7fd9 parent_entry_count          U32, 0..1,024
  0x7fda parent_entries              LIST DenialFixtureNamespaceEntry, exact count
  0x7fdb stable_scan_pass_count      U32, exactly 2
  0x7fdc result                      U32, exactly 1
  0x7fdd stable_scan_pass_set_sha256 SHA256, derived kind 88
  0x7fde stable_scan_passes          LIST DenialFixtureNamespaceScanPass,
                                         exactly 2
  0x7fdf exact_leaf_component        BYTES, 1..255 exact PathComponent bytes
  0x7fe0 syscall_argument_member_sha256 SHA256, SHA-256 of the exact canonical
                                         DenialSyscallArgumentProfile in attempt `7f6d`

PrivilegeDropStep
  0x7fe1 ordinal                     U32, contiguous 0..5
  0x7fe2 syscall_code                U32: 1 setgroups, 2 setgid,
                                         3 setuid, 4 credential readback,
                                         5 UID-0 reacquisition probe,
                                         6 GID-0 reacquisition probe
  0x7fe3 argument_set_sha256         SHA256, derived kind 27
  0x7fe4 argument_count              U32, 1..16
  0x7fe5 arguments                   LIST ReviewedObjectMember, exact count,
                                         binding 1 exact SDK values
  0x7fe6 return_class                U32: 1 success ordinals 0..3,
                                         2 failure ordinals 4/5
  0x7fe7 errno_value                 U32: zero ordinals 0..3,
                                         exactly 1 EPERM ordinals 4/5
  0x7fe8 before_credential           STRUCT ProcessCredentialIdentity
  0x7fe9 after_credential            STRUCT ProcessCredentialIdentity
  0x7fea result                      U32, exactly 1

DenialFixtureNamespaceEntry
  0x8051 ordinal                     U32, contiguous from zero
  0x8052 exact_entry_name            BYTES, 1..255 exact PathComponent bytes
  0x8053 observed_identity_sha256    SHA256, derived kind 58
  0x8054 observed_identity           STRUCT ObservedArtifactIdentity,
                                         type exactly 1 ordinary or 2 directory
  0x8055 result                      U32, exactly 1

DenialFixtureNamespaceScanPass
  0x8061 ordinal                     U32, exactly 0 or 1
  0x8062 parent_identity_sha256      SHA256, derived kind 15 identity kind 2
  0x8063 parent_identity             STRUCT CanonicalIdentityMember, kind 2
  0x8064 entry_count                 U32, 0..1,024
  0x8065 entries                     LIST DenialFixtureNamespaceEntry, exact count
  0x8066 entry_set_sha256            SHA256, derived kind 85
  0x8069 complete                    BOOL, exactly true

DenialSyscallArgumentProfile
  0x8071 ordinal                     U32, contiguous attempt ordinal
  0x8072 operation_code              U32, exact Section-8.4 operation 1..11
  0x8073 operation_scenario          U32, exact 0..2
  0x8074 fixture_variant             U32, exact enclosing `7f71`
  0x8075 syscall_symbol_bytes        BYTES, 1..64 exact ASCII SDK symbol
  0x8076 source_parent_fd_role       U32: 0 absent, 1 attempt parent,
                                         2 retained subject file/directory FD
  0x8077 source_leaf_component       BYTES, 0..255 exact PathComponent bytes;
                                         empty iff operation has no source leaf
  0x8078 destination_parent_fd_role  U32: 0 absent, 1 attempt parent,
                                         2 retained subject directory FD
  0x8079 destination_leaf_component  BYTES, 0..255 exact PathComponent bytes;
                                         empty iff operation has no destination leaf
  0x807a flags_value                 U64, zero when selected syscall has no flags
  0x807b mode_value                  U32, `0xffffffff` when absent
  0x807c uid_value                   U32, `0xffffffff` when absent
  0x807d gid_value                   U32, `0xffffffff` when absent
  0x807e payload_byte_length         U64, 0..65,536
  0x807f payload_bytes               BYTES, exact `807e` bytes, 0..65,536
  0x8080 position_value              U64, `0xffffffffffffffff` when absent
  0x8081 options_value               U32, `0xffffffff` when absent
  0x8082 required_precondition_flags U32, zero except exact UF_IMMUTABLE variant
  0x8083 subject_acquisition_flags   U32, zero when no subject FD acquisition
  0x8084 expected_errno              U32, exactly enclosing `7f33/7f87`
  0x8085 sdk_abi_binding_sha256      SHA256, exact SDK ABI binding for symbol
  0x8086 result                      U32, exactly 1
  0x8087 xattr_name_bytes            BYTES, 0..127 exact ASCII

FixtureClaimCreationObservation
  0x80c1 authorization_profile       U32, exactly 2
  0x80c2 fixture_policy_sha256       SHA256, equal enclosing `7f38`
  0x80c3 fixture_session_nonce       BYTES, exactly F2 `7927`
  0x80c4 claim_relative_path         CAPABILITY_FIXTURE_CLAIM_REL_PATH
  0x80c5 claim_identity              STRUCT ProtectedFileIdentity
  0x80c6 creator_executor_sha256     SHA256, derived kind 71
  0x80c7 creator_executor            STRUCT FixtureExecutorObservation
  0x80c8 creation_started_at_unix_nanoseconds U64
  0x80c9 creation_finished_at_unix_nanoseconds U64, not less than `80c8`
  0x80ca open_exclusive              BOOL, exactly true
  0x80cb metadata_readback_complete  BOOL, exactly true
  0x80cc file_full_sync_complete     BOOL, exactly true
  0x80cd parent_sync_complete        BOOL, exactly true
  0x80ce retained_claim_fd_through_e2 BOOL, exactly true
  0x80cf result                      U32, exactly 1
  0x97a1 fixture_now_monotonic_nanoseconds U64, exact monotonic half of the
                                         final pre-claim pair
  0x97a2 fixture_now_realtime_nanoseconds U64, exact realtime half of that pair,
                                         equal `80c8`
  0x97a3 fixture_now_realtime_seconds U64, equal floor(`97a2 / 1,000,000,000`)
  0x97a4 fixture_now_clock_relation_result U32, exactly 1

FixtureChildFDRecord
  0x80d1 ordinal                     U32, contiguous after fd-number sorting
  0x80d2 fd_number                   U32, unique
  0x80d3 fd_role                     U32: 1 stdin pipe, 2 stdout pipe,
                                         3 stderr pipe, 4 held executable,
                                         5 attempt parent, 6 source directory,
                                         7 destination directory, 8 subject file
  0x80d4 object_kind                 U32: 1 anonymous pipe, 2 vnode
  0x80d5 access_mode                 U32: 1 read-only, 2 write-only, 3 read-write
  0x80d6 fcntl_status_flags          U32, exact observed pattern
  0x80d7 vnode_identity_sha256       SHA256, derived kind 15;
                                         required vnode, forbidden pipe
  0x80d8 vnode_identity              STRUCT CanonicalIdentityMember,
                                         kind 2 directory or 3 ordinary;
                                         required vnode, forbidden pipe
  0x80d9 inherited_from_setup_parent BOOL, exactly true
  0x80da filesystem_write_capable    BOOL, exactly false
  0x80db stable_pass_mask            U32, exactly 3
  0x80dc result                      U32, exactly 1
  0x80dd pipe_handle                 U64, nonzero and required pipe,
                                         forbidden vnode
  0x80de pipe_endpoint_observation_sha256 SHA256, derived kind 96,
                                         required pipe, forbidden vnode
  0x80df pipe_endpoint_observation  STRUCT PipeEndpointObservation,
                                         required pipe, forbidden vnode
  0x80e0 descriptor_flags           U32, exact `fcntl(F_GETFD)` value with
                                         `FD_CLOEXEC` set and all unknown bits zero

PipeEndpointObservation
  0x8121 observation_version        U32, exactly 1
  0x8122 returned_byte_count        U32, exactly SDK `sizeof(struct pipe_fdinfo)`
  0x8123 proc_fileinfo_openflags    U32, equal the exact status-flags field or
                                         selected record in the closed field-site
                                         registry below
  0x8124 proc_fileinfo_status       U32, exact public returned value
  0x8125 proc_fileinfo_offset_bits  U64, exact unsigned bit pattern of `off_t`
  0x8126 proc_fileinfo_type         U32, exact unsigned bit pattern of returned
                                         signed `pipe_fdinfo.pfi.fi_type`;
                                         diagnostic only
  0x8127 proc_fileinfo_guardflags   U32, exact public returned value
  0x8128 pipe_handle                U64, nonzero; equal every enclosing duplicate
                                         handle or selected-record handle named by
                                         the closed field-site registry below
  0x8129 pipe_peer_handle           U64, exact public returned value
  0x812a pipe_status_bits           U32, exact public returned bit pattern
  0x812b endpoint_access_mode       U32: 1 read-only, 2 write-only, 3 read-write;
                                         equal the exact enclosing role/mode or
                                         selected-record mode in the closed
                                         field-site registry below
  0x812c result                     U32, exactly 1
  0x812d fd_transport_layout_binding_set_sha256 SHA256, equal SDKIdentity `4f39`

SyscallFDArgumentObservation
  0x80e1 ordinal                     U32, contiguous syscall argument order
  0x80e2 fd_argument_role            U32: 1 source/subject, 2 destination
  0x80e3 fd_number                   U32
  0x80e4 child_fd_record_sha256      SHA256, SHA-256 of exact canonical
                                         FixtureChildFDRecord in `7fc5`
  0x80e5 profile_fd_role             U32, equal selected `8076` or `8078`
  0x80e6 bound_identity_sha256       SHA256, derived kind 15
  0x80e7 bound_identity              STRUCT CanonicalIdentityMember, kind 2 or 3
  0x80e8 target_ordinal              U32, index into observation `7f32`, or
                                         `0xffffffff` for setup-only attempt parent
  0x80e9 namespace_observation_ordinal U32, index into `7f74/7f77`
  0x80ea fstat_before_sha256         SHA256, derived kind 15
  0x80eb fstat_after_sha256          SHA256, equal `80ea`
  0x80ec result                      U32, exactly 1
  0x80ed semantic_target_identity_sha256 SHA256, required when `80e8` not
                                         `0xffffffff`, forbidden otherwise
  0x80ee semantic_target_identity    STRUCT CanonicalIdentityMember,
                                         required when `80e8` not `0xffffffff`
  0x80ef namespace_leaf_identity_sha256 SHA256, equal selected observation `7fd4`

FixtureChildFDInventoryPass
  0x80f1 ordinal                     U32, exactly 0 or 1
  0x80f2 child_execution_identity_sha256 SHA256, derived kind 97
  0x80f3 child_execution_identity   STRUCT PublicProcessExecutionIdentity
  0x80f4 record_count                U32, 4..16
  0x80f5 records                     LIST FixtureChildFDRecord, exact count
  0x80f6 record_set_sha256           SHA256, derived kind 92
  0x80f7 complete                    BOOL, exactly true

CapabilityAttempt
  0x7a01 ordinal                     U32, contiguous 0..2
  0x7a02 operation_code              U32
  0x7a03 scenario                    U32, equal operation code
  0x7a04 fixture_relative_path       CAPABILITY_FIXTURE_REL_PATH
  0x7a05 pre_state_sha256            SHA256, derived kind 18
  0x7a06 primitive_code              U32, equal requirement
  0x7a07 return_class                U32, 1 success or 2 failure
  0x7a08 errno_value                 U32, zero iff success
  0x7a09 post_state_sha256           SHA256, derived kind 18
  0x7a0a durability_observation_sha256 SHA256, derived kind 18
  0x7a0b retained_artifact_set_sha256 SHA256, derived kind 18
  0x7a0c result                      U32: 1 pass, 2 fail
  0x7a0d contract_flag_mask          U64, equal requirement
  0x7a0e parameter_set_sha256        SHA256, equal requirement
  0x7a0f retained_artifact_count     U32, 0..1,024
  0x7a10 retained_artifacts          LIST EvidenceArtifactObservation, exact count
  0x7a11 pre_state_count             U32, 1..1,024
  0x7a12 pre_state                   LIST EvidenceArtifactObservation, exact count
  0x7a13 post_state_count            U32, 1..1,024
  0x7a14 post_state                  LIST EvidenceArtifactObservation, exact count
  0x7a15 durability_observation_count U32, 1..1,024
  0x7a16 durability_observations     LIST EvidenceArtifactObservation, exact count
  0x7a17 fixture_executor_observation_sha256 SHA256, equal HMG4K2 `3033`
  0x7a18 started_at_unix_seconds     U64
  0x7a19 finished_at_unix_seconds    U64

ToolchainMember
  0x7d11 ordinal                     U32, contiguous from zero
  0x7d12 tool_identity               STRUCT BuildToolIdentity
  0x7d13 tool_role                   U32: 1 build controller, 2 SDK locator,
                                         3 compiler, 4 linker,
                                         5 signing assembler/key client,
                                         6 independent verifier, 7 nm, 8 otool
  0x7d14 tool_identity_sha256        SHA256, exact canonical nested `7d12` bytes
  0x7d15 permitted_stage_mask        U64, exact role-selected mask

SymbolMember
  0x7d21 symbol_bytes                BYTES, 1..1,024 exact tool-output bytes

LibraryMember
  0x7d31 install_name_bytes          BYTES, 1..4,096 exact bytes
  0x7d32 compatibility_version       U32
  0x7d33 current_version             U32

ReviewedObjectMember
  0x7d41 ordinal                     U32, contiguous from zero
  0x7d42 object_role                 U32, exact context registry
  0x7d43 diagnostic_identifier       BYTES, 1..1,024; never path authority
  0x7d44 byte_length                 U64
  0x7d45 complete_object_sha256      SHA256
  0x7d46 content_encoding            U32: 1 complete framed object,
                                         2 canonical nested STRUCT value bytes,
                                         3 exact raw file/tool-output bytes,
                                         4 complete HMG4D2 derived stream
  0x7d47 content_binding             U32: 1 embedded exact bytes,
                                         2 held content-addressed locator
  0x7d48 content_bytes               BYTES, exact `7d44` bytes, 0..16 MiB;
                                         required binding 1, forbidden binding 2
  0x7d49 content_locator             STRUCT ReviewedContentLocator;
                                         required binding 2, forbidden binding 1

ReviewedContentLocator
  0x7951 authority_root_slot         U32, exactly 2 approved project review store
  0x7952 parent_identity             STRUCT DirectoryIdentity, slot 2
  0x7953 content_leaf                BYTES, exactly 64 lowercase hex of content hash
  0x7954 file_identity               STRUCT ProtectedFileIdentity
  0x7955 stable_pass_count           U32, exactly 2
  0x7956 exclusive_no_replace        BOOL, exactly true

InstrumentationDeltaMember
  0x7d51 ordinal                     U32, contiguous from zero
  0x7d52 source_unit_sha256          SHA256
  0x7d53 production_bytes_sha256     SHA256
  0x7d54 fixture_bytes_sha256        SHA256
  0x7d55 exact_delta_sha256          SHA256
  0x7d56 reason_code                 U32: 1 observation only,
                                         2 fault injection only
  0x7d57 production_region           STRUCT CodeRegionIdentity
  0x7d58 fixture_region              STRUCT CodeRegionIdentity
  0x7d59 fixture_source_unit_sha256  SHA256

ProductionEquivalenceMember
  0x7d61 ordinal                     U32, contiguous from zero
  0x7d62 operation_code              U32
  0x7d63 production_function_sha256  SHA256
  0x7d64 fixture_function_sha256     SHA256
  0x7d65 reviewed_evidence_object_sha256 SHA256, complete HMG4E2 kind 5
  0x7d66 production_region           STRUCT CodeRegionIdentity
  0x7d67 fixture_region              STRUCT CodeRegionIdentity
  0x7d68 instrumentation_delta_member_sha256 SHA256, exact canonical
                                         InstrumentationDeltaMember STRUCT bytes

CodeRegionIdentity
  0x78b1 source_unit_content_sha256  SHA256, equal BuildSourceUnit `6104`
  0x78b2 start_byte_offset           U64
  0x78b3 byte_length                 U64, 1..262,144
  0x78b4 exact_bytes                 BYTES, exact `78b3` length
  0x78b5 region_sha256               SHA256, SHA-256 of `78b4`
  0x78b6 diagnostic_label            BYTES, 1..255 exact ASCII; no authority

ActorIdentityBinding
  0x7d71 ordinal                     U32, contiguous from zero
  0x7d72 actor                       STRUCT ActorIdentity

AuthorizationStatementMember
  0x7d81 authorization_magic         BYTES, exactly 8
  0x7d82 authorization_kind          U32
  0x7d83 unsigned_payload_sha256     SHA256
  0x7d84 operator_identity_sha256    SHA256, derived kind 34
  0x7d85 authorization_nonce         BYTES, exactly 32
  0x7d86 issued_at_unix_seconds      U64
  0x7d87 expires_at_unix_seconds     U64

EvidenceAttestationStatement
  0x7831 object_magic                BYTES, exactly 8
  0x7832 header_discriminator        U32
  0x7833 unsigned_payload_sha256     SHA256
  0x7834 signer_identity_sha256      SHA256, derived kind 34
  0x7835 protocol_spec_sha256        SHA256
  0x7836 policy_sha256               SHA256

NamespaceScanPass
  0x7841 ordinal                     U32, contiguous 0..1
  0x7842 entry_count                 U32, 1..65,536
  0x7843 entries                     LIST ProtectedNamespaceRecord, exact count
  0x7844 entry_set_sha256            SHA256, derived kind 40 over `7843`
  0x7845 protected_parent_identity_set_sha256 SHA256, derived kind 65
  0x7846 complete                    BOOL, exactly true
  0x7847 protected_parent_count      U32, 1..256
  0x7848 protected_parents           LIST CanonicalIdentityMember, exact count;
                                         every identity_kind exactly 14

ProcessInventoryPass
  0x7801 ordinal                     U32: 0 or 1 for Q2 stable passes,
                                         exactly 2 for final admission
  0x7802 record_count                U32, 0..16,384
  0x7803 records                     LIST ProcessInventoryRecord, exact count
  0x7804 record_set_sha256           SHA256, derived kind 36 over `7803`
  0x7805 complete                    BOOL, exactly true
  0x7806 kernel_record_count         U32, 1..16,384
  0x7807 irrelevant_non_tcb_count    U32
  0x7808 excluded_uid0_nonclaim_count U32
  0x7809 boot_session_uuid           BYTES, exactly 16
  0x780a source_profile              U32, exactly 1 public KERN_PROC_ALL
  0x780b scan_started_monotonic_nanoseconds U64
  0x780c scan_finished_monotonic_nanoseconds U64, not less than `780b`
  0x780d writer_authority_rule_set_sha256 SHA256, derived kind 52
  0x780e unexpected_writer_count     U32, equal count of class-3 records
  0x780f sdk_layout_binding_sha256   SHA256, exact SDK kinfo-proc layout binding
  0x7810 pass_purpose                U32: 1 Q2 stable projection ordinals 0/1,
                                         2 final admission ordinal 2

VnodeFDInventoryPass
  0x7821 ordinal                     U32, contiguous 0..1
  0x7822 record_count                U32, 0..131,072
  0x7823 records                     LIST VnodeFDRecord, exact count
  0x7824 record_set_sha256           SHA256, derived kind 37 over `7823`
  0x7825 complete                    BOOL, exactly true

WritableMappingInventoryPass
  0x78a1 ordinal                     U32, contiguous 0..1
  0x78a2 record_count                U32, 0..131,072
  0x78a3 records                     LIST WritableFileMappingRecord, exact count
  0x78a4 record_set_sha256           SHA256, derived kind 38 over `78a3`
  0x78a5 complete                    BOOL, exactly true

ArtifactPlanMember
  0x7da1 ordinal                     U32, contiguous from zero
  0x7da2 originating_transaction_id  BYTES, exactly 32
  0x7da3 artifact_role               U32: 1 request, 2 stage, 3 archive
  0x7da4 managed_index               U32, 0..113 or 0xffffffff for request
  0x7da5 custody_leaf                SAFE_CUSTODY_LEAF
  0x7da6 expectation                 STRUCT ArtifactExpectation
  0x7da7 source_binding_sha256       SHA256, complete request frame or derived
                                         kind 15 identity kind 8/18
  0x7da8 creation_disposition        U32: 1 already durably present/adopted, or
                                           sole exact parent-tip type-18 post-state
                                           pending mandatory first type-20 adoption,
                                         2 absent at plan snapshot and authorized
                                           for creation only if this journal's
                                           selected branch reaches the member,
                                         3 stage artifact already consumed/
                                           relocated by a proven direction-2 move
  0x7da9 first_consumption_record_sha256 SHA256, complete direction-2 intent or
                                         resolver proving move authority/effect;
                                         required disposition 3, forbidden 1/2
  0x7daa current_relocation_record_sha256 SHA256, complete latest resolver or
                                         immediate-parent open move intent for
                                         this inode; required disposition 3,
                                         forbidden 1/2
  0x7dab current_location_identity_sha256 SHA256, derived kind 15 identity kind 8;
                                         required disposition 3, forbidden 1/2
  0x7dac current_location             STRUCT FinalEntry, required disposition 3,
                                         forbidden dispositions 1/2
  0x7dad current_relocation_record_kind U32: 1 durable resolver,
                                         2 immediate-parent open intent with
                                           exact observed post-state;
                                         required disposition 3, forbidden 1/2

DurabilityResyncObservation
  0x7ea1 resync_profile              U32: 1 artifact adoption, 2 move adoption
  0x7ea2 held_file_identity_sha256   SHA256, derived kind 15 identity kind 8
  0x7ea3 file_fsync_result           U32, exactly zero
  0x7ea4 file_fullfsync_result       U32, exactly zero
  0x7ea5 parent_count                U32, exactly 1 profile 1; 1..2 profile 2
  0x7ea6 parents                     LIST DurabilityParentSyncMember, exact count
  0x7ea7 post_resync_identity_sha256 SHA256, exactly equal `7ea2`
  0x7ea8 result                      U32, exactly 1

DurabilityParentSyncMember
  0x7eb1 ordinal                     U32, contiguous from zero
  0x7eb2 parent_identity             STRUCT DirectoryIdentity
  0x7eb3 directory_fsync_result      U32, exactly zero

GoldenVectorCase
  0x7731 ordinal                     U32, contiguous from zero
  0x7732 target_selector_sha256      SHA256, SHA-256 of `7741`
  0x7733 case_kind                   U32: 1 minimum-valid,
                                         2 representative-valid,
                                         3 largest-valid under `7747`;
                                           semantically valid only profile 1,
                                         4 maximum-plus-one reject,
                                         5 one-byte grammar mutation reject,
                                         6 tag/type/order/duplicate/unknown reject,
                                         7 one-sided equality reject,
                                         8 exact-declared-max admitted by bound
                                           then rejected by the registered first
                                           later canonical or semantic phase
  0x7734 input_blob_sha256           SHA256, kind-46 member
  0x7735 expected_output_present     BOOL
  0x7736 output_blob_sha256          SHA256, required when `7735=true`;
                                         forbidden when false
  0x7737 expected_result             U32: 1 accept, 2 reject
  0x7738 expected_result_code        U32, exact vector-result registry below
  0x7739 relation_selector_sha256    SHA256, required case kind 7 or 8;
                                         forbidden kinds 1..6
  0x773a mutation_offset             U64; base-byte index for delete/substitute,
                                         base boundary index for insert,
                                         UINT64_MAX unless byte mutation
  0x773b mutation_offset_present     BOOL
  0x773c expected_failure_phase      U32: 0 success,
                                         1 fixed request header,
                                         2 resource-bound guard,
                                         3 canonical grammar/TLV,
                                         4 object schema/semantic,
                                         5 later authority; zero only accept
  0x773d expected_response_form      U32: 0 standalone decoder/no process,
                                         1 framed HMG4R2,
                                         2 unframed fixed diagnostic token
  0x773e expected_process_exit       U32, 0..255 for forms 1/2,
                                         0xffffffff for form 0
  0x773f expected_fixed_token        BYTES, empty for forms 0/1;
                                         exact `HMG4V2_INVALID_HEADER` for form 2
  0x7741 target_selector_bytes       BYTES, 1..1,024 exact ASCII diagnostic label
  0x7742 relation_selector_bytes     BYTES, 1..1,024 exact ASCII diagnostic label;
                                         required kind 7/8, forbidden kinds 1..6;
                                         SHA-256 equals `7739`
  0x7743 comparison_base_blob_sha256 SHA256, required for a byte mutation or
                                         case kind 7; forbidden otherwise
  0x7744 mutation_operation          U32: 1 delete, 2 insert, 3 substitute;
                                         required for a byte mutation,
                                         forbidden otherwise
  0x7745 mutation_original_byte      BYTES, exactly 1; required delete/substitute,
                                         forbidden insert/nonmutation
  0x7746 mutation_new_byte           BYTES, exactly 1; required insert/substitute,
                                         forbidden delete/nonmutation
  0x7747 validation_profile          U32: 1 full semantic vector,
                                         2 cycle-cut standalone schema fixture

GoldenBlob
  0x7721 sha256                      SHA256
  0x7722 byte_length                 U64, 0..68,736,258,049 logical bytes
  0x7723 role_mask                   U32: bit 0 input, bit 1 canonical output;
                                         exactly 1, 2, or 3
  0x7724 content_encoding            U32, exactly 1 raw
  0x7725 content_address             BYTES, exactly 64 lowercase hex equal `7721`

GoldenExternalBlobIdentity
  0x7961 ordinal                     U32, contiguous from zero
  0x7962 blob_sha256                 SHA256
  0x7963 content_leaf                BYTES, exactly 64 lowercase hex of `7962`
  0x7964 file_identity               STRUCT ProtectedFileIdentity

OuterResourceScanMember
  0x7991 ordinal                     U32, contiguous from zero
  0x7992 leaf                        BYTES, exactly 17 ASCII bytes:
                                         `resource-` followed by the ordinal as
                                         eight lowercase hexadecimal digits
  0x7993 device                      U64
  0x7994 inode                       U64
  0x7995 logical_bytes               U64, 1..274,877,906,945
  0x7996 allocated_bytes             U64, 0..17,179,869,184 and a multiple of 512;
                                         exact checked `st_blocks * 512`
  0x7997 link_count                  U32, exactly 1
  0x7998 mode_bits                   U32
  0x7999 owner_uid                   U32
  0x799a group_gid                   U32
  0x799b flags                       U32
  0x799c acl_sha256                  SHA256, exact canonical ACL stream
  0x799d xattr_set_sha256            SHA256, exact canonical xattr-set stream
  0x799e object_type                 U32, exactly 1 ordinary

OuterResourceScanSnapshot
  0x79b1 stream_version              U32, exactly 1
  0x79b2 bound_kind                 U32: 1 logical-total, 2 allocated-total
  0x79b3 fixture_directory_identity STRUCT DirectoryIdentity, authority slot 3
  0x79b4 member_count               U32, 1..4,096
  0x79b5 members                    LIST OuterResourceScanMember, exact count
  0x79b6 observed_logical_bytes     U64, 1..274,877,906,945
  0x79b7 observed_allocated_bytes   U64, 0..17,179,869,184, multiple of 512

DecoderCaseResultMember
  0x7a81 ordinal                     U32, equal GoldenVectorCase `7731`
  0x7a82 case_sha256                 SHA256, exact canonical nested
                                         GoldenVectorCase bytes
  0x7a83 input_blob_sha256           SHA256, equal GoldenVectorCase `7734`
  0x7a84 observed_result             U32: 1 accept, 2 reject
  0x7a85 observed_result_code        U32, exact vector-result registry
  0x7a86 observed_failure_phase      U32, exact `773c`
  0x7a87 observed_response_form      U32, exact `773d`
  0x7a88 observed_process_exit       U32, exact `773e`
  0x7a89 observed_fixed_token        BYTES, exact `773f`
  0x7a8a output_present              BOOL, exact `7735`
  0x7a8b output_blob_sha256          SHA256, required iff `7a8a=true`,
                                         equal conditionally present `7736`
  0x7a8c selected_bound_admitted     BOOL, true exactly for case kind 8
  0x7a8d canonical_reencode_performed BOOL, true exactly for accepted cases
  0x7a8e result                      U32, exactly 1 matched expectation

DecoderExternalResultMember
  0x7a91 ordinal                     U32, equal GoldenExternalBlobIdentity `7961`
  0x7a92 external_identity_sha256    SHA256, exact canonical nested
                                         GoldenExternalBlobIdentity bytes
  0x7a93 blob_sha256                 SHA256, equal `7962` and GoldenBlob `7721`
  0x7a94 expected_logical_bytes      U64, equal GoldenBlob `7722`
  0x7a95 observed_logical_bytes      U64, equal `7a94`
  0x7a96 observed_content_sha256     SHA256, equal `7a93`
  0x7a97 observed_file_identity_sha256 SHA256, SHA-256 of the exact canonical
                                         nested ProtectedFileIdentity in `7964`
  0x7a98 stable_identity_before_after BOOL, exactly true
  0x7a99 streamed_zero_through_eof   BOOL, exactly true
  0x7a9a result                      U32, exactly 1

HeaderDiscriminatorMember
  0x7db1 ordinal                     U32, contiguous from zero
  0x7db2 value                       U32

PolicyStatementMember
  0x7dc1 policy_magic                BYTES, exactly `HMG4P2` plus two NUL
  0x7dc2 policy_kind                 U32, exactly 1
  0x7dc3 unsigned_payload_sha256     SHA256
  0x7dc4 protocol_spec_sha256        SHA256
  0x7dc5 predecessor_contract_sha256 SHA256
  0x7dc6 release_id                  BYTES, exact policy `1023`
  0x7dc7 policy_root_actor_sha256    SHA256, derived kind 34

ReviewFinding
  0x7dd1 ordinal                     U32, contiguous from zero
  0x7dd2 priority                    U32: 0 P0, 1 P1, 2 P2
  0x7dd3 finding_code                U32: 1 schema/framing, 2 authority/equality,
                                         3 cryptography/identity,
                                         4 filesystem/TOCTOU, 5 transport/resource,
                                         6 custody/state-machine, 7 time/replay,
                                         8 review/process
  0x7dd4 finding_target_code         U32, review-local code or 0xffffffff;
                                         diagnostic only, never a schema ID
  0x7dd5 evidence_object_sha256      SHA256, complete reviewed object
  0x7dd6 disposition                 U32: 1 open, 2 remediated
  0x7dd7 finding_text_sha256         SHA256, exact UTF-8 text bytes
  0x7dd8 finding_text_bytes          BYTES, 1..4,096 exact UTF-8

SymbolMappingMember
  0x7de1 ordinal                     U32, contiguous from zero
  0x7de2 sdk_symbol_bytes            BYTES, 1..255 exact ASCII
  0x7de3 sdk_numeric_value           U64
  0x7de4 contract_domain             U32: 1 capability flag,
                                         2 static SecCodeSignatureFlag,
                                         3 mount flag, 4 errno, 5 FD status,
                                         6 VM protection, 7 VM share mode,
                                         8 Mach CPU type, 9 Mach CPU subtype,
                                         10 Mach-O file type, 11 KAUTH vnode right,
                                         12 membership ID type,
                                         13 dynamic SecCodeStatus,
                                         14 public KERN_PROC selector/status,
                                         15 FD/pipe/poll/time/signal/flock transport,
                                         16 parent executable region/path/SecCode lookup
  0x7de5 contract_value              U64

SDKABIBinding
  0x8091 ordinal                     U32, contiguous 0..70
  0x8092 sdk_symbol_bytes            BYTES, 1..64 exact ASCII
  0x8093 abi_profile                 U32, exactly ordinal plus one
  0x8094 declaring_header_source_sha256 SHA256, equal one `4f2b.6104`
  0x8095 declaration_byte_offset     U64, within selected header `6106`
  0x8096 declaration_byte_length     U64, 1..4,096
  0x8097 exact_declaration_bytes     BYTES, exact `8096`, 1..4,096
  0x8098 declaration_sha256          SHA256, SHA-256 of `8097`
  0x8099 compile_probe_line_sha256   SHA256, exact one line in `4f33.6106`
  0x809a compile_time_type_match     BOOL, exactly true
  0x809b public_sdk_symbol_required  BOOL, exactly true
  0x809c compile_probe_line_offset   U64, within `4f33.6106`
  0x809d compile_probe_line_length   U64, 1..4,096
  0x809e compile_probe_line_bytes    BYTES, exact `809d`, 1..4,096

ArtifactPostconditionTemplateMember
  0x9b01 ordinal                     U32, exactly zero
  0x9b02 mutation_ordinal             U32, equal target intent `a111`
  0x9b03 artifact_role                U32, equal `a112`
  0x9b04 managed_index                U32, equal `a113`
  0x9b05 custody_leaf                 SAFE_CUSTODY_LEAF, equal `a114`
  0x9b06 expected_after               STRUCT ArtifactExpectation,
                                           byte-identical to `a115`
  0x9b07 current_set_before_sha256    SHA256, equal `a116`
  0x9b08 destination_expected_absent  STRUCT FinalEntry,
                                           byte-identical to `a117`
  0x9b09 originating_transaction_id   BYTES, exactly 32, equal `a118`
  0x9b0a artifact_plan_ordinal         U32, equal `a119`
  0x9b0b complete_current_state_before_sha256 SHA256, derived kind 115,
                                           equal `a11a`
  0x9b0c result                       U32, exactly 1

RollbackReasonEvidence
  0x7df1 reason_code                 U32, exact Section 14 registry
  0x7df2 triggering_record_sha256    SHA256, complete journal record
  0x7df3 transition_ordinal          U32 or 0xffffffff
  0x7df4 managed_index               U32, 0..113 or 0xffffffff
  0x7df5 exact_prestate_observation_sha256 SHA256, derived kind 18
  0x7df6 exact_poststate_observation_sha256 SHA256, derived kind 18
  0x7df7 current_set_sha256          SHA256
  0x7df8 all_managed_inodes_accounted BOOL, exactly true
  0x7df9 journal_tail_canonical      BOOL, exactly true
  0x7dfa durability_state_certain    BOOL, exactly true
  0x7dfb rollback_vector_sha256      SHA256, predecessor derived kind 11
  0x7dfc rollback_transition_count   U32
  0x7dfd exact_prestate_count        U32, 1..1,024
  0x7dfe exact_prestate_observations LIST EvidenceArtifactObservation, exact count
  0x7dff exact_poststate_count       U32, 1..1,024
  0x7e00 exact_poststate_observations LIST EvidenceArtifactObservation, exact count

CompleteCurrentState
  0x8901 stream_version              U32, exactly 1
  0x8902 root_transaction_id         BYTES, exactly 32, nonzero
  0x8903 current_live_set_sha256      SHA256, predecessor final-live set stream
  0x8904 current_live_entry_count     U32, exactly 114
  0x8905 current_live_entries         LIST FinalEntry, exact count
  0x8906 current_material_set_sha256  SHA256, predecessor material-custody stream
  0x8907 current_material_entry_count U32, 0..1,024
  0x8908 current_material_entries     LIST FinalEntry, exact count
  0x8909 unresolved_namespace_set_sha256 SHA256, predecessor derived kind 9
  0x890a unresolved_namespace_entry_count U32, 0..1,024
  0x890b unresolved_namespace_entries LIST FinalEntry, exact count
  0x890c unresolved_chain_set_sha256  SHA256, derived kind 109
  0x890d unresolved_chain_intent_count U32, 0..1
  0x890e unresolved_chain_intents     LIST UnresolvedChainIntent, exact count
  0x890f legacy_current_set_sha256    SHA256, exact incorporated-predecessor
                                         76-byte compatibility stream over
                                         `8903` then `8906`
  0x8910 result                      U32, exactly 1 complete and canonical

RecoveryAdmissionSnapshot
  0x8921 stream_version              U32, exactly 1
  0x8922 root_apply_transaction_id   BYTES, exactly 32, nonzero
  0x8923 target_transaction_id       BYTES, exactly 32, nonzero
  0x8924 target_journal_leaf         SAFE_CUSTODY_LEAF, journal alternative
  0x8925 target_journal_sha256       SHA256, exact target-journal bytes through tip;
                                         never a record count and never all-zero
  0x8926 target_last_complete_record_sha256 SHA256, zero only when canonical
                                         parsing of the `8925`-hashed exact bytes
                                         yields zero complete records
  0x8927 recovery_depth              U32, 1..32
  0x8928 current_state_sha256        SHA256, derived kind 115
  0x8929 current_state               STRUCT CompleteCurrentState
  0x892a recovery_disposition        U32, exactly 1..4
  0x892b authorized_recovery_vector_sha256 SHA256, predecessor derived kind 12
  0x892c authorized_recovery_transition_count U32, 0..228
  0x892d permitted_terminal_state    U32, exactly 1..4
  0x892e unresolved_chain_set_sha256 SHA256, equal `8929.890c`
  0x892f unresolved_chain_intent_count U32, equal `8929.890d`
  0x8930 violation_set_sha256        SHA256, predecessor derived kind 8
  0x8931 violation_count             U32, 0..1,024
  0x8932 violations                  LIST Violation, exact count
  0x8933 admission_class             U32: 1 automatic branch, 2 manual-only branch
  0x8934 result                      U32, exactly 1 complete and internally equal

UnresolvedChainIntent
  0x8941 stream_version              U32, exactly 1
  0x8942 ordinal                    U32, exactly zero
  0x8943 root_apply_transaction_id  BYTES, exactly 32, nonzero
  0x8944 owner_transaction_id       BYTES, exactly 32, nonzero
  0x8945 owner_journal_leaf         SAFE_CUSTODY_LEAF, journal alternative
  0x8946 owner_journal_sha256       SHA256, exact bytes through the intent
  0x8947 owner_last_record_sha256   SHA256, equal `894b`
  0x8948 relationship_to_target_tip U32: 1 immediate-parent tip, 2 strict ancestor
  0x8949 ancestor_distance          U32, 1..32; exactly 1 iff `8948=1`
  0x894a intent_record_type         U32, exactly 18 or 19
  0x894b intent_record_sha256       SHA256, exact complete journal record
  0x894c intent_payload_sha256      SHA256, exact canonical payload STRUCT bytes
  0x894d artifact_intent            STRUCT exact `a111..a11b`, required type 18
  0x894e move_intent                STRUCT exact `a311..a31a`, required type 19
  0x894f observed_state_class       U32: 1 exact pre-state/effect cancelled,
                                         2 exact post-state/unrecorded effect,
                                         3 exact pre-state/effect required,
                                         4 partial effect, 5 multiple/conflicting
                                         locations, 6 foreign/replacement inode,
                                         7 unreadable or durability-uncertain,
                                         8 exact pre- or post-state retained by
                                           owner-selected manual-only branch
  0x8950 automatic_action           U32: 1 no-effect resolver, 2 adoption resolver,
                                         3 perform WAL-authorized effect, 4 manual
  0x8951 source_current             STRUCT FinalEntry, required type 19 only
  0x8952 destination_current        STRUCT FinalEntry
  0x8953 additional_location_count U32, 0..1,024
  0x8954 additional_locations      LIST FinalEntry, exact count
  0x8955 state_observation_set_sha256 SHA256, derived kind 18
  0x8956 state_observation_count   U32, 1..1,024
  0x8957 state_observations        LIST EvidenceArtifactObservation, exact count
  0x8958 automatic_recovery_permitted BOOL
  0x8959 result                    U32, exactly 1 complete classification
```

Kind 115 is computed over exactly one complete `CompleteCurrentState`. Its live,
material, and unresolved-namespace lists use the incorporated predecessor's
membership and canonical sort rules; `8903`, `8906`, and `8909` are recomputed
from `8905`, `8908`, and `890b`, and their counts agree. `890f` is retained only
as the incorporated predecessor's 76-byte compatibility projection: the exact
eight bytes `48 4d 47 34 43 32 00 00`, big-endian U32 2, `8903`, then `8906`.
It is never accepted in place of kind 115. The framed protected-birth HMG4C2
object and this fixed-length legacy projection are separate, length- and
schema-disjoint preimage classes. `890c` is kind 109 over `890e`; `890d` is zero
or one because the active root/descendant chain can have at most one open type-
18/type-19 mutation intent. Every present `8943` equals `8902`. Zero members use
the nonzero canonical empty kind-109 stream hash, never all-zero SHA-256.

An `UnresolvedChainIntent` is a complete current classification, not a journal
summary. `8946` hashes the exact owner journal prefix ending at `894b`; `8947`
equals that final record hash. `8945` parses as the journal leaf for `8944` and
its digest equals the intended complete sequence-zero record for that owner.
`894d` is required and `894e` forbidden exactly for type 18; the inverse holds
for type 19. `894c` is recomputed from the selected nested payload and every
nested transaction, intent type, record, role, index, leaf, transition, and
state field cross-equals the owner journal and root graph. Distance one means
the sole immediate parent tip named by the prospective RECOVERY_BEGIN; distance
2..32 means a strict ancestor behind one or more complete child
RECOVERY_BEGIN records. No sibling, second open intent, skipped chain edge, or
distance greater than 32 is representable.

Observed-state/branch classification is iff. Class 1 has the exact before state
and selected automatic disposition that cancels the effect; action is 1. Class
2 has the exact complete after state at one location, with the exact intended
inode, bytes, metadata, and roles, and selected automatic adoption; action is
2. Class 3 has exact before state and the selected automatic recovery vector
requires the still-unperformed effect; action is 3. Classes 1..3 are legal only
for admission class 1 and an immediate relationship. They have `8953=0`,
complete ordinary/absent source and destination observations, no foreign inode,
and the exact one-member artifact or two-member move observation projection in
`8957`.

Classes 4..7 use action 4 and retain every observed location/indeterminate
observation rather than collapsing it. Class 8 also uses action 4, but is the
complete exact pre- or post-state observation selected only by admission class
2/disposition 4 for a safely classifiable immediate or exact-state strict-
ancestor intent. It retains the same complete one-/two-member `8957` projection
that automatic classification would inspect, has `8953=0`, and makes no claim
that an empty manual vector cancels, adopts, or requires the effect. `8955` is
kind 18 over `8957`. `8958` is true iff relationship is immediate and state
class is 1..3; classes 4..8 and every strict ancestor require false. A true
`8958` does not itself authorize a syscall; the separately signed automatic
vector/action must still consume it. A false value, conflicting class/action/
admission/disposition, missing observation, or omitted additional location
invalidates the classification.

Kind 110 is computed over exactly one complete `RecoveryAdmissionSnapshot`.
`8928` is kind 115 over `8929`; `8922 == 8929.8902`; `892e/892f ==
8929.890c/890d`; `8930` is predecessor kind 8 over `8932`; and all counts agree.
The journal leaf, transaction, whole-file-through-tip hash, and last complete
record are independently reopened and recomputed immediately before HMG4O2 is
signed. They equal `0f04..0f07`; `8929.890f == 0f08`; and `892a..892d ==
0f09..0f0c`. Terminal state equals disposition (1 committed, 2 rolled back, 3
refused after BEGIN, 4 manual recovery required). Depth is the exact number of
recovery edges from the root apply journal to the new child and never exceeds
32.

Admission class 1 is valid only for dispositions 1..3, an empty violation set,
and either no open mutation intent or one immediate intent with `8958=true` and
an action exactly consumed by the selected vector/terminal branch. Admission
class 2 is valid only for disposition 4, an empty authorized vector/count, and a
terminal-only branch; it retains any unsafe immediate or strict-ancestor intent
and every violation. A safely classifiable immediate or exact-state strict-
ancestor intent selected under class 2 is classified before signing as exact manual class
8/action 4/`8958=false`; its complete state observations do not change. The
Section-13 manual matrix grants no resolver, request-copy, artifact, move, or
formal-output mutation. It proceeds directly from RECOVERY_BEGIN to the manual
terminal branch with that unresolved intent still present. Retaining automatic
class 1..3 under disposition 4, rewriting an unsafe state as class 8, attaching
an automatic vector to disposition 4, or resolving an intent under class 2 is
invalid. No caller may change a snapshot field after signing, substitute only
the legacy current-set hash, or regenerate a snapshot from a later state.

`EvidenceArtifactObservation.7e07` is kind 58 over `7e08`; `7e04` equals
`7e08.7811`, and conditionally present `7e05/7e06` equal `7814/7815`.
For type 0 all identity fields other than `7811/781d` are absent, rather than
zero-filled. This identity is valid for disposable fixture state because it
contains no FinalEntry path or custody/location role. Diagnostic bytes remain
non-authority even when they happen to resemble a path.
Artifact roles are context-closed: CapabilityAttempt `7a12`, `7a14`, `7a16`,
and `7a10` use roles 1, 2, 3, and 4 respectively; all K2 retained-artifact
unions remain role 4. Artifact resolver `a10b` uses exactly role 5, and move
resolver `a30c` uses role 6 then role 7. RollbackReasonEvidence `7dfe/7e00`
uses roles 8/9. Any other role in those contexts, including a locally rehashed
copy with only its role changed, is invalid.
`RollbackReasonEvidence.7df5/7df6` are kind 18 over `7dfe/7e00`; both counts
agree. These lists are the exact held before/after observations referenced by
the triggering journal record and cannot be supplied as hash-only assertions.

Every CodeRegionIdentity byte range is checked against the held source unit:
`start + length` cannot overflow and must be within its `BuildSourceUnit.6103`;
`78b4` is the exact slice, and `78b5` is recomputed. In an
InstrumentationDeltaMember, `7d52/7d59` equal the production/fixture
`78b1`, `7d53/7d54` equal their `78b5`, and `7d55` is SHA-256 of this exact
stream: the unique eight-byte domain separator `HMG4DLT2` (hex
`48 4d 47 34 44 4c 54 32`), U32 version 2, U32 reason code, U64
production length, production bytes, U64 fixture length, fixture bytes. No
compiler symbol extraction, textual diff, or host line-ending conversion is a
preimage. A ProductionEquivalenceMember repeats those exact two regions,
`7d63/7d64` equal their region hashes, and `7d68` equals SHA-256 of the complete
canonical matching delta-member STRUCT. Its `7d65` kind-5 HMG4E2 input set
contains both region STRUCT byte objects and that delta member.

For every ReviewedObjectMember, `7d44/7d45` cover the complete bytes selected
by `7d46`. Encoding 1 begins at byte zero of a complete framed object and ends
at its exact declared object length. Encoding 2 is the canonical nested STRUCT
value from its first inner TLV header through its last value, with no outer
caller tag/length and no padding. Encoding 3 is the exact complete raw file or
tool-output byte sequence. Encoding 4 is the exact complete predecessor HMG4D2
derived stream including its domain/header/member framing. CodeRegionIdentity
and InstrumentationDeltaMember review inputs use encoding 2; source files and
reports use encoding 3; `command-set-definition` uses encoding 4; and top-level
HMG4 frames use encoding 1. Binding 1 embeds those exact bytes in `7d48` and
recomputes both length/hash. Binding 2 opens `7953` relative to the held slot-2
`7952`, whose complete component/edge/mount identity is rechecked before and
after two stable enumerations; `7954.6203/6204` equal `7d44/7d45`, link count is
one, and the leaf is lowercase hex of `7d45`. Binding 2 is permitted only for
the following closed contexts; every context not listed requires binding 1:

- exact `4c0d` ordinals 0..2 and their byte-identical U2 `603f` copies;
- OSBuildIdentity `4f18/4f19`;
- BuildToolIdentity `6115` nested in all eight U2 `603b` tool identities,
  including the byte-identical `600c/600d`, `4c0d`, and `603f` copies;
- U2 `603f` role-3 `source/<sha256>` members, each equal one `600b` source;
- the one held Gate-A role-9 report repeated byte-identically at HMG4L2
  `8c2d`, PreSignPolicyProjection `8f2c`, U2 `6072`, and U2 `603f`;
- HMG4E2 role-1/2 specifications, role-3 source members, role-4/7 complete
  framed authority/catalog objects, role-5 raw executables/tools, role-9/10
  reports or analyzer/decoder/resource outputs, role-11 probe output, role-12
  command transcript, and the sole role-13 vector-target manifest; and
- HMG4L3 kind-149 inputs and kind-150 outputs exactly as Section 4.0.1 allows,
  plus the one complete HMG4L3 role-4/encoding-1 member nested at `4b26`;
  its canonical launcher/builder file/code identity members remain binding 1,
  while the one explicitly bounded role-6/encoding-2 kind-158 SDK/toolchain
  identity is binding 2; and
- the exact HMG4G2-referenced external raw blobs governed by the separate G2
  per-file/logical/allocated budgets, never duplicated as E2 list members.

CapabilityRequirement `7d0b`, certificate `4c0b`, SDK `4f2c/4f2d/4f2f`, E2
role-6 configuration, E2 role-14 fixture observation, and every encoding-2
region/delta/identity member require binding 1. In E2, role-1/2 and role-3
locator bytes are each at most 16 MiB; role-4/7 complete frames are each at
most `56 +` their registry payload cap; role-5 bytes are each at most 1 GiB;
role-9/10 bytes are each at most 128 MiB; role-11/12 bytes are each at most
16 MiB; and role 13 is at most 128 MiB. The checked sum of all binding-2
`7d44` values in one HMG4E2 is at most 64 GiB. In one HMG4U2 it is at most
64 GiB; each U2 role-3 source is at most 16 MiB and the sum of those source
members is at most 16 GiB. Each nested `6115` is at most 1 GiB and their
checked sum is at most 8 GiB. `4c0d` ordinals 0 and 1 are
each at most 16 MiB. Ordinal 2 is at most 17,182,076,948 bytes: the exact
20-byte HMG4D2 header plus 1,024 members, each with its four-byte member length
and the maximum canonical BuildSourceUnit size. Each of `4f18/4f19` is
1..1,073,741,824 bytes and their checked sum is at most 2,147,483,648 bytes.
All per-member and aggregate sums are checked without overflow against `7d44`
and held `7954.6203` values before any locator is opened or read. Locator
content is streamed with one fixed buffer of at most 1 MiB, never mapped or
allocated from the declared length; no OS binary is loaded or executed by this
verification. Exact max/max+1 and aggregate-max/aggregate-max+1 vectors exist
for every listed context. The vector-target manifest uses
encoding 3 and binding 2; its
`7d44/7d45` equal HMG4G2 `770e/7703`, respectively. No pathname string,
diagnostic identifier, hash-only manifest, missing locator, or mutable/replaced
content is a preimage.

The new derived kinds are closed and exact:

```text
13 component sequence
   complete PathComponent members in ordinal order; 1..64; total component
   bytes plus separators <=4,096; no empty, `.`, `..`, slash, backslash, NUL,
   control byte, or non-ASCII byte
14 namespace-rule set
   NamespaceRuleMember sorted ordinal; exact/evidence/custody/formal classes
   cover every allowed parent leaf and overlap nowhere
15 canonical identity
   exactly one CanonicalIdentityMember; its selected STRUCT is complete
16 xattr-policy binding set
   complete purpose-1 XattrPolicyBinding members sorted by policy hash;
   referenced index lists sort and indices 0..113 partition exactly once;
   purpose-2 is forbidden from this set and exists only as policy `1039`
17 capability requirement vector
   target has ordered operations 1..18; system-lock 101..105; count 18 or 5
18 evidence artifact/state set
   complete EvidenceArtifactObservation members sorted by
   (artifact role, unsigned diagnostic bytes); duplicates forbidden
19 errno/effect vector
   complete ErrnoEffectAttempt members in semantic ordinal order
20 capability attempt observation set
   zero through three complete CapabilityAttempt members ordered 0..2; an
   authority-admitted passing CapabilityTest requires exactly three
21 build/source manifest
   complete BuildSourceUnit members in ordinal order; duplicate source hash or
   diagnostic source identifier forbidden
22 toolchain set
   complete ToolchainMember values in ordinal order
23 diagnostic byte-string sequence
   complete DiagnosticByteString members in ordinal order; sequence semantic
24 environment set
   complete BuildEnvironmentEntry members sorted by unsigned name bytes;
   duplicate name forbidden
25 undefined-symbol set
   complete SymbolMember values sorted by unsigned symbol bytes; no duplicate
26 linked-library set
   complete LibraryMember values sorted by unsigned install-name bytes;
   duplicate name forbidden
27 reviewed-object set
   complete ReviewedObjectMember values in ordinal order; duplicate role/hash
   pair forbidden
28 required quiescence-subject set
   complete QuiescenceSubjectRequirement members in ordinal order
29 observed protection-subject set
   complete ProtectionSubject members in ordinal order
30 quiescence-observation set
   exactly two complete QuiescenceObservation members in ordinal order 0..1:
   public authority-relevant process projection and access-denial/model evidence
31 role-metadata set
   complete RoleMetadataPolicy members sorted object_role; duplicate forbidden
32 instrumentation-delta set
   complete InstrumentationDeltaMember members in ordinal order
33 production-equivalence set
   complete ProductionEquivalenceMember members in ordinal order
34 actor identity
   exactly one complete ActorIdentityBinding whose ordinal is zero
35 parent-child edge set
   one linear ComponentSequence's complete ParentChildEdge members in ordinal
   order; every adjacent child identity equals the next parent identity
36 complete process inventory
   complete ProcessInventoryRecord members sorted
   (execution identity pid, start seconds, start microseconds); this is the
   authority-relevant non-TCB projection of one complete public KERN_PROC_ALL
   snapshot, not a claim of all-process FD, VM, or code visibility
37 complete vnode-FD inventory
   unassigned and forbidden in public protected-from-birth profile 1; the
   retained schema is vector-only and grants no Q2 authority
38 complete writable-file-mapping inventory
   unassigned and forbidden in public protected-from-birth profile 1; the
   retained schema is vector-only and grants no Q2 authority
39 access-denial-probe set
   complete AccessDenialProbeRecord members sorted
   (protection_subject_ordinal, operation_code, operation_scenario)
40 protected namespace scan
   complete ProtectedNamespaceRecord members sorted
   (protected_parent_ordinal, unsigned entry-name bytes)
41 protected-from-birth rule set
   exactly five BirthProtectionRule members ordered birth_role 1..5
42 running-code observation
   exactly one complete RunningCodeObservation member, including the retained
   kind-168 root-SPKI policy bootstrap and kind-146 parent launcher observation
43 authorization signing statement
   exactly one AuthorizationStatementMember
44 unassigned in this successor; a review-only vector target manifest is bound
   by its complete-file SHA-256 and is not a derived runtime-authority set
45 golden-vector case set
   complete GoldenVectorCase members in ordinal order
46 golden-vector blob set
   complete GoldenBlob members sorted by SHA-256; exact duplicate collapses
47 actor-identity catalog
   complete ActorIdentityBinding members sorted
   (ActorIdentity.identity_kind, unsigned stable_identifier bytes); 1..32;
   duplicate identity, stable identifier, kind-2 SPKI/SPKI hash, or kind-1/3
   executable-code-identity hash forbidden
48 launcher-configuration identity
   exactly one complete LauncherConfigurationIdentity member
49 artifact plan
   complete ArtifactPlanMember values in semantic ordinal order; request first,
   then each index 0..113 with archive before stage when predecessor-present;
   the sole zero-member stream is disposition-4 profile B's manual sentinel
   for a target root journal with zero valid complete records
50 header-discriminator set
   complete HeaderDiscriminatorMember values sorted numerically; singleton for
   roles 1..5 and 7..11; exactly values 1,2,3,4 for recovery role 6; exactly
   values 1..6 for review-manifest role 12
51 policy signing statement
   exactly one complete PolicyStatementMember
52 authorized-writer set
   complete WriterAuthorityRule members sorted ordinal; duplicate actor/phase/
   namespace tuple forbidden; no unknown action or namespace bit
53 review-finding set
   complete ReviewFinding members sorted (priority, finding_code, ordinal);
   exact duplicate evidence/code pair forbidden
54 SDK-symbol mapping set
   complete SymbolMappingMember values sorted
   (contract_domain, contract_value, unsigned symbol bytes); duplicate mapping
   or one SDK symbol mapped to two contract values is forbidden
55 rollback-reason evidence
   exactly one complete RollbackReasonEvidence member
56 stable namespace-scan pass set
   exactly two complete NamespaceScanPass members ordered 0..1; their complete
   entry lists/kind-40 hashes and protected-parent lists/kind-65 hashes are
   byte-identical
57 evidence-attestation signing statement
   exactly one complete EvidenceAttestationStatement member
58 observed artifact identity
   exactly one complete ObservedArtifactIdentity member; no authority-bearing
   path or FinalEntry location role is present
59 observed executable identity catalog
   complete CanonicalIdentityMember values of identity kind 11 sorted by their
   derived kind-15 hashes; 1..1,024; duplicate identity or hash forbidden
60 denial credential identity
   exactly one complete DenialCredential member; its policy-actor and
   authorized-writer match counts and role mask are zero, and its complete
   held HMG4E2 kind-3 frame selects exactly one role-14 fixture observation
   whose real dropped-child credential/code/empty-entitlements evidence agrees
61 access-control evaluation
   exactly one complete AccessControlEvaluation member; all unauthorized and
   unknown grant counts are zero; both distinct evaluator implementations return
   DENY with one byte-identical kind-69 trace
62 stable process-inventory pass set
   exactly two complete ProcessInventoryPass members ordered 0..1; boot UUID,
   writer-rule set, authority-relevant record lists, kind-36 hashes, and
   unexpected-writer counts are byte-identical; diagnostic irrelevant/UID0
   counts may differ and carry no protection claim
63 stable vnode-FD-inventory pass set
   unassigned and forbidden in public protected-from-birth profile 1
64 stable writable-mapping-inventory pass set
   unassigned and forbidden in public protected-from-birth profile 1
65 protected-parent identity set
   complete CanonicalIdentityMember values of identity kind 14 sorted by
   ProtectedParent ordinal; duplicate ordinal or identity forbidden
66 authorization-target evaluation set
   complete AuthorizationTargetEvaluation members ordered by ordinal; target
   roles/count equal the operation-rights registry; identities and ACL streams
   are complete and duplicate target role is forbidden
67 principal-resolution set
   complete PrincipalResolutionMember values sorted by
   (principal kind, unsigned GUID, numeric ID); every ACL qualifier, owner,
   owning group, and everyone relation occurs exactly once; unknown forbidden
68 writer-principal closure
   complete WriterPrincipalClosureMember values sorted by
   (principal kind, unsigned GUID, numeric ID, granted-right mask); every OS
   non-UID0 principal able to gain any tested right occurs once as disposition
   1 and resolves to one applicable policy WriterAuthorityRule/ActorIdentity;
   exactly one UID0 superuser nonclaim occurs as disposition 2
69 full-credential access-decision trace
   complete AccessDecisionTraceMember values in evaluation order; both
   independently implemented evaluators produce this byte-identical stream
70 golden external-blob identity set
   complete GoldenExternalBlobIdentity members sorted by blob SHA-256; every
   HMG4G2 GoldenBlob occurs once, file length/hash agree, and duplicate identity,
   leaf, inode, or hash is forbidden
71 fixture-executor observation
   exactly one complete FixtureExecutorObservation member; held/static/dynamic
   code, full credential, public process-execution identity, actor, F2, and
   interval agree
72 installer-process observation
   exactly one complete InstallerProcessObservation member; held/static/dynamic
   code, observed executable, full credential, self/parent public process-
   execution identities, actor, install authorization, and continuity agree
73 access-denial fixture-vector set
   complete AccessDenialFixtureObservation members sorted
   (subject role, operation code, scenario); exactly 90 rows: nine for each of
   roles 1/2 and nine for each of roles 3..10 under the Section-8.4 closed
   matrix, with no missing, duplicate, or extra semantic row
74 build-tree scan
   complete BuildTreeMember values sorted by unsigned BUILD_REL_PATH bytes;
   no duplicate or ASCII-case-fold collision; the empty stream is the sole
   pre-materialization value
75 outer-resource stable scan
   exactly one complete OuterResourceScanSnapshot. Its complete member list is
   sorted by unsigned `leaf`; ordinals are reassigned contiguously from zero
   after sorting; every enumerated leaf occurs once, and duplicate leaf or
   `(device,inode)` is forbidden. The predecessor HMG4D2 framing for kind 75,
   including its magic, version, kind, member count, member length, and exact
   EOF, is the domain-separated hash preimage; no ad hoc text or native struct
   is permitted
76 decoder case-result set
   complete DecoderCaseResultMember values ordered by ordinal, one for every
   HMG4G2 GoldenVectorCase; duplicate, omitted, or extra ordinal is forbidden
77 decoder external-result set
   complete DecoderExternalResultMember values ordered by ordinal, one for
   every HMG4G2 GoldenExternalBlobIdentity; duplicate, omitted, or extra
   ordinal is forbidden
78 unassigned and forbidden in this successor
79 access-denial fixture-attempt set
   exactly the enclosing `7f34` count of complete AccessDenialFixtureAttempt
   members ordered 0..count-1;
   each before/after kind-66 target set is byte-identical to the observation
   target set and every attempt returns the observation's one frozen errno
80 stable build-tree scan pass set
   exactly two complete BuildTreeScanPass members ordered 0..1; root identities,
   entry lists, counts, and kind-74 hashes are byte-identical after omitting
   pass ordinal/timestamps
81 unassigned and forbidden in this successor
82 denial-fixture authorization set
   exactly 90 complete AccessDenialFixtureAuthorizationMember values sorted
   (subject role, operation code, scenario); exact Section-8.4 matrix
83 denial-attempt executor observation
   exactly one complete DenialAttemptExecutorObservation; parent setup actor,
   irreversibly dropped child credential/code/process, F2, and interval agree
84 denial-fixture target-rule set
   complete DenialFixtureTargetRule members ordered by ordinal; target
   roles/types/rights/variants equal the selected Section-8.4 row
85 denial-fixture namespace-entry set
   complete DenialFixtureNamespaceEntry members sorted by unsigned exact entry
   name bytes; ordinals are reassigned contiguously, every name occurs once,
   duplicate name, ASCII-case-fold collision, duplicate `(device,inode)`,
   symlink, hardlink, mount crossing, unsupported object, or incomplete identity
   is forbidden
86 denial namespace/object observation set
   complete DenialNamespaceObservation members ordered by ordinal; every
   source/destination leaf and parent scan required by the syscall profile occurs
   once, and pre/post streams must be byte-identical for a no-effect result
87 irreversible privilege-drop step set
   exactly six complete PrivilegeDropStep members ordered 0..5; groups, GIDs,
   UIDs, readback, and failed UID/GID-zero reacquisition form the closed profile
88 denial-fixture stable namespace-scan pass set
   exactly two complete DenialFixtureNamespaceScanPass members ordered 0..1;
   after omitting only pass ordinal, parent identities, complete entry
   lists, counts, and kind-85 hashes are byte-identical
89 denial-syscall argument-profile set
   complete DenialSyscallArgumentProfile members ordered by attempt ordinal;
   the profile-2 authorization contains exactly the row's required attempt count;
   each executed AccessDenialFixtureAttempt embeds the selected member directly
   as a STRUCT and hashes those exact nested bytes, so its original ordinal is
   retained without creating a one-member derived list or re-ordinalization
90 SDK ABI binding set
   exactly 71 complete SDKABIBinding members ordered by ordinal 0..70; this is
   the fixed type/layout-critical ABI registry, not a claim to be the complete
   callable surface; symbol, ABI profile, exact declaring-header byte slice,
   and exact source-bound compile-probe line all agree with the one SDKIdentity;
   duplicate symbol, header-range mismatch, missing public declaration, or
   failed type probe is forbidden
91 denial-syscall FD-argument observation set
   complete SyscallFDArgumentObservation members in actual syscall-argument
   order; count/roles equal the selected symbol profile and every referenced
   child FD record and canonical identity is exact
92 dropped-child closed FD inventory
   complete FixtureChildFDRecord members sorted by numeric FD and re-ordinalized;
   all FD slots from two byte-identical `proc_pidinfo(PROC_PIDLISTFDS)` passes
   occur once, only the closed role set is admitted, and no vnode is writable
93 unassigned in this successor
94 fixture claim-creation observation
   exactly one complete FixtureClaimCreationObservation; creator/session/F2,
   nonce-keyed O_EXCL claim, retained FD, metadata readback, and durability all
   agree
95 dropped-child stable FD-inventory pass set
   exactly two complete FixtureChildFDInventoryPass members ordered 0..1;
   after omitting pass ordinal, child identity, complete FD records/count, and
   kind-92 hashes are byte-identical
96 pipe-endpoint observation
   exactly one complete PipeEndpointObservation; returned byte count, normalized
   public `proc_fileinfo`/`pipe_info` fields, handle, peer handle, endpoint
   direction, one of the thirteen closed legal field sites, enclosing status/
   role/handle equalities, and SDK layout all agree; no raw padding byte is
   serialized or compared and no other STRUCT site is legal
97 public process-execution identity
   exactly one complete PublicProcessExecutionIdentity; boot UUID, PID/parent
   PID, public KERN_PROC start time, SDK layout binding, and result agree
98 phase-bound writer-admission observation
   exactly one complete WriterAdmissionObservation; phase is 1 pre-BEGIN or 2
   post-mutation pre-terminal, and the same Q2/boot/writer-rule set, stable
   approved-writer projection, zero unexpected writer, targeted self/parent
   continuity, and at-most-five-second scan-to-phase gap agree
99 approved-writer process projection
   complete ProcessInventoryRecord members of trust classes 1/2 only, selected
   from kind-36 records, re-ordinalized and sorted by public execution identity;
   all class-3 records are forbidden; no class 4 exists
100 protected-birth evidence set
   exactly one complete ProtectedBirthEvidence per ProtectionSubject, ordered by
   subject ordinal; complete HMG4C2/HMG4I2 bytes, identity, parent, actor,
   execution identity, profile, and creation interval all cross-agree; profile
   2 additionally selects exactly one role-mapped kind-189 I2 observation and
   revalidates the I2/Z2 common kind-187 prerequisite set
101 public KERN_PROC SDK layout set
   exactly 15 complete KernProcLayoutBinding members ordered by selector;
   `struct kinfo_proc` size plus every consumed nested field offset/size/nominal
   type/signedness and NGROUPS constant are source- and compile-probe-bound
102 protected-birth intent set
   complete ProtectedBirthIntent members in topological ordinal order; role,
   index, parent ordinal, path component, type, content, final metadata,
   primitive, and provisioner all agree with one HMG4S2
103 birth-creator observation
   exactly one complete BirthCreatorObservation; S2, public execution identity,
   actor, held/static/observed/dynamic code, credential, and interval agree
104 birth namespace pass set
   exactly two BirthNamespaceScanPass members of one phase ordered 0..1;
   parent, leaf, complete entry set, identity, and phase are byte-identical
   after omitting ordinal and observation times
105 birth primitive observation
   exactly one complete BirthPrimitiveObservation; S2 intent, exact syscall
   args/return, content write/readback, final identity/metadata, durability,
   retained FD, and creator interval all agree
106 policy-signature observation
   exactly one complete PolicySignatureObservation; final held policy bytes,
   policy-root signer, creator identity, retained subject FD, before/after
   subject identity, signature validity, and interval all agree
107 protected-birth reservation-claim creation observation
   exactly one complete BirthClaimCreationObservation; S2/creator, containing
   parent, exact exclusive-open arguments/returned FD, claim bytes/readback,
   metadata, namespace scans, durability, and pre-C2 retention all agree
108 protected-birth namespace-entry set
   complete BirthNamespaceEntry members sorted by unsigned exact entry-name
   bytes and re-ordinalized; every entry has one complete kind-58 identity,
   duplicate/case-colliding name is forbidden, and no fixture-only schema occurs
109 unresolved ancestor-chain intent set
   zero or one complete UnresolvedChainIntent ordered by ordinal; the one member
   is the unique open type-18/type-19 intent in the active root/descendant chain,
   and its owner/root/relationship/distance/current observations are complete;
   no protected-birth or build object may use this kind
110 recovery admission snapshot
   exactly one complete RecoveryAdmissionSnapshot; target journal, current-state
   projection, disposition/vector/terminal state, unresolved intent, violations,
   and admission class all cross-agree; no protected-birth or build object may
   use this kind
111 unassigned and forbidden in this revision
112 protected-birth session set
   exactly one complete ProtectedBirthSessionEvidence per distinct S2 referenced
   by profile-1/3 C2 evidence, sorted by unsigned S2 hash and re-ordinalized;
   every referenced S2/C2/subject is covered once and profile-2 I2 has no member
113 protected-birth intent-to-receipt binding set
   exactly one ProtectedBirthIntentReceiptBinding per S2 intent, sorted by intent
   ordinal; each selects one Q2 subject, ProtectedBirthEvidence, and exact C2,
   with no extra, duplicate, orphan, cross-S2 edge, or omitted intent
114 protected-birth creator Q2-status set
   exactly two BirthCreatorQ2StatusObservation members ordered 0/1; profile 1
   proves the exact prior creator birth tuple absent/different, while profile 3
   proves the exact broker class-2 birth tuple continuously present
115 complete recovery current-state projection
   exactly one complete CompleteCurrentState; versioned root transaction, exact
   live/material/unresolved-namespace/unresolved-chain sets, legacy compatibility
   projection, and result agree; no protected-birth or build object uses it
116 Darwin FD/transport/process layout binding set
   exactly 52 complete DarwinFDTransportLayoutBinding members ordered selector
   0..51; every selected aggregate size/field offset/size/nominal type/header and
   compile assertion agrees with one SDKIdentity
117 Darwin native ACL mapping set
   exactly 32 complete ACLNativeMappingBinding members ordered 0..31; public tag,
   permission, entry/ACL flag, control value, object mask, SDK width/signedness/header, and
   compile assertion agree
118 native ACL entry construction/readback set
   complete NativeACLEntryObservation members in original HMG4A2 entry order,
   re-encoded byte-for-byte with every qualifier freed once
119 native ACL materialization observation
   exactly one complete NativeACLMaterializationObservation; signed-F2-bound HMG4A2,
   SDK ABI/mapping, live acl_t construction/readback, denied acl_set_fd, immediate
   errno capture, cleanup, and no-effect result all agree
120 build-command set
   complete BuildCommand members ordered by global ordinal; every lane/stage,
   held cwd, tool, argument/environment, and exact input/output projection agrees
121 build-execution set
   complete BuildExecution members ordered by global ordinal; command, controller,
   public process/credential/code, stdio transport, transcript, time, wait status,
   and result agree
122 build-artifact reference set
   complete BuildArtifactRef members ordered by global ordinal; lane/path/role,
   bytes, tree member, held vnode, producer/consumer, and retention agree
123 build-FD observation set
   complete BuildFDRecord members sorted by `(execution_ordinal,
   observation_phase, fd_number)` and re-ordinalized within each execution/phase;
   external children have exactly three pre-exec anonymous-pipe stdio endpoints,
   while internal controller actions have complete before/after held-vnode and
   stdio inventories with no omitted descriptor
124 signing-key custody identity
   exactly one complete pre-call SigningKeyCustodyIdentity; held
   Security.framework, non-bearer expected attributes/query policy, public
   key/certificate, ready common caller, required export-failure mapping,
   session authorization, and opaque Apple-Security transport profile agree;
   it contains no live key reference or post-authorization observation
125 signer-transcript set
   exactly two complete SignerTranscript members ordered lane A then B; their
   target/preimage/digest/signature/CMS/key/Security-API result is byte-identical
   where required while lane root/target remain distinct and the retained
   common signing-client/stage-6 execution/opaque handle remain identical
126 build stage-edge set
   complete StageEdge members ordered by ordinal; byte, execution,
   authorization, durable-claim, and independent-observation edges form the
   closed build DAG
127 signing-authorization target set
   exactly two complete SigningAuthorizationTarget members ordered lane A then B;
   complete held unsigned/CodeDirectory/attributes/preimage/key/tool/root inputs
   agree except for required distinct lane/root identity
128 non-bearer signing-key attribute set
   exactly eight complete SigningKeyAttributeMember values ordered code 1..8;
   exact independently provisioned application label is distinct from pinned
   public SPKI; no persistent reference, token object, password, secret, or bearer handle
129 process-credential identity
   exactly one complete ProcessCredentialIdentity; every UID/GID/group field and
   derived kind-32 group set agree
130 authorized signing-client set
   exactly one common-lane SigningClientIdentityMember; public execution birth
   tuple, credential, executable identity, signing tool, and readiness-time
   retention agree; it makes no claim about future key use
131 source-level direct-call binding set
   complete DirectCallBindingMember values ordered by source-unit ordinal,
   callee-token offset, and call-expression length, then re-ordinalized; every
   role-1/2/3/5/6/7 external direct-call occurrence is present exactly once,
   every SDK prototype/compiler/runtime preimage passes, and its class-1 symbol
   projection equals the complete kind-25 nm allowlist/observation
132 SecKeyCopyAttributes observation
   exactly one complete SecKeyCopyAttributesObservation; common client, unique
   non-bearer handle, closed ten-selector logical map, nine returned keys, no
   unknown key, exact provisioned application label, time, and direct-call binding agree
133 SecKey external-representation observation
   exactly one complete SecKeyExternalRepresentationObservation; same client/
   handle, NULL bytes, exact OSStatus error domain/signed code and role-5 compile
   probe, time, and direct-call binding agree
134 SecKey signature-call observation set
   exactly two complete SecKeySignatureCallObservation members ordered lane A
   then B; same client/handle/stage-6 execution and durable claim, distinct
   targets/digests, exact Security algorithm/data/result, time, and signatures
   agree with the two signer transcripts
135 build-signing consumption claim
   exactly one complete BuildSigningConsumptionClaim; complete HMG4L2,
   nonce/template/target/key/client, held workspace parent, two pre/post
   namespace passes, O_EXCL claim inode, content/readback, file fsync,
   F_FULLFSYNC, parent fsync, timely post-completion `B1`, retained FD, and zero
   production authority agree
136 build-signing claim namespace-pass set
   exactly two complete BuildSigningClaimNamespacePass members ordered 0/1;
   parent, sorted bounded valid claim leaves, target/nonce/authorization match
   counts, complete enumeration, and pre-create or post-create profile agree
137 pre-sign policy projection
   exactly one complete PreSignPolicyProjection; its full 87-tag HMG4PST1
   prospective tree, closed output-hole registry, and repeated specification/
   predecessor/plan/bundle/xattr/Gate-A/source/toolchain/targets/expected-key/
   root/controller/owner/zero-effect fields agree
138 pre-sign build-policy statement
   exactly one complete PreSignBuildPolicyStatement; domain-separated strict
   policy-root Ed25519 signature binds kind-137 projection, owner, controller,
   source/toolchain/targets/Gate-A, and zero effects without self-reference
139 bounded selected-SecKey lookup observation
   exactly one complete SecKeyLookupObservation; exact noninteractive
   match-limit-one query uses the independently provisioned application label,
   proves the direct result is a SecKey, owns at most one selected non-bearer
   handle, releases its query dictionary, and binds every exact public direct
   call without claiming uniqueness or treating the label as SPKI proof
140 execve argument-limit identity
   exactly one complete ExecveArgumentLimitIdentity; pinned SDK/OS, 64-bit
   pointer width, compiled PATH_MAX, runtime sysconf(_SC_ARG_MAX), role-5 probe
   executions, direct-call binding, exact values, and result agree
141 execve serialization observation
   exactly one complete ExecveSerializationObservation; non-NUL argv,
   canonical name=value environment entries, both terminating NULL pointers,
   64-bit pointer-array bytes, executable path plus NUL, checked ARG_MAX/PATH_MAX
   totals, argument/environment hashes, and result agree
142 parent executable path-observation set
   exactly two complete ParentExecutablePathObservation members ordered before
   then after; parent birth, public proc_pidpath ABI/capacity, exact bounded
   absolute path/component sequence, and result agree after omitting only
   ordinal and observation time
143 parent executable no-follow walk-pass set
   exactly two complete ParentExecutableWalkPass members ordered 0/1; root,
   component/edge walk, held ordinary vnode, complete static code identity,
   open/retention profile, and result agree after omitting only ordinal/times
144 parent executable mapped-region observation set
   complete ParentExecutableRegionObservation members in strictly increasing
   query/region order, re-ordinalized from zero; every successful public region
   result occurs once, checked next-address arithmetic is exact, at least one
   selected executable-path VREG maps the held launcher device/inode, and no
   returned region is omitted
145 SecCode PID guest-lookup observation
   exactly one complete SecCodeGuestLookupObservation; same parent birth/PID,
   NULL host/allocator, immutable one-member kSecGuestAttributePid dictionary,
   exact SInt32 value/callbacks/default flags, success OSStatus, retained guest,
   ABI bindings, release counts, and result agree
146 parent launcher executable observation
   exactly one complete ParentLauncherExecutableObservation; expected kind-48
   authority, two path samples/walks, complete mapped-region stream, held/static
   vnode/code, one retained PID guest, dynamic identity/status, SDK binding,
   common phase bracket, and result agree
147 poll decision binding set
   exactly twenty-one complete PollDecisionBinding members ordered Section-2 rows
   0..20; endpoint, exclusive-deadline precedence, return/revents predicate,
   retry/read/write/error decision, next syscall, outward class, and SDK-resolved
   exact mask agree; all unmatched combinations fail closed
148 parent launcher SDK layout binding set
   exactly 32 complete ParentLauncherSDKLayoutBinding members ordered selector
   0..31; public region aggregate fields, scalar/opaque widths, extern-object
   types, exact held header slice, and role-5 compile-probe line agree
149 external-launcher TCB audit input set
   complete HMG4L3 ReviewedObjectMember inputs in the exact Section-4.0.1 family
   order; held complete successor/predecessor bytes equal 9201/9202, kind-153
   source manifest/files, seven tools, separately held builder/file/code,
   kind-158 SDK/toolchain, kind-159 command set, build transcript, HMG4LC2
   bytes, raw launcher, and launcher file/code identity occur once
150 external-launcher TCB audit output set
   exactly sixteen complete held HMG4L3 outputs in the fixed Section-4.0.1
   order; independent review, single-build provenance, positive behavior, negative
   alternate/symlink/FD/exec/path cases, and two command transcripts agree
151 external-launcher TCB audit statement
   exactly one complete ExternalLauncherTCBAuditStatement; HMG4L3 magic/kind,
   unsigned-payload, independent auditor, successor/predecessor, exact HMG4LC2,
   launcher code identity, kind-158 SDK/toolchain, separately held builder code,
   kind-149/150 streams, and pass result agree
152 unassigned in this successor
153 external-launcher source-unit set
   complete LauncherSourceUnit members in contiguous source-manifest order;
   unique path, exact held raw bytes/length/hash, external-launcher role,
   language/encoding, and result agree one-to-one with kind-149 raw sources
154 external-launcher tool-input set
   exactly seven complete LauncherToolIdentity members in SDK-locator/compiler/
   linker/signer/scanner/test/encoder order;
   held raw bytes/file identity, complete BuildToolIdentity, and canonical
   ObservedExecutableIdentity agree one-to-one with kind-149 tools; tool roles
   are non-actor command purposes and no parallel unconsumed registry exists
155 external-launcher machine-observation set
   exactly thirteen LauncherTCBTestObservation members ordered profile 1..13;
   common spec/source/build/config/file/code/builder/SDK/command/catalog inputs, exact
   kind-165 immutable plan plus kind-166 typed observation, injection/decision/
   count table including child nonblock setters/reads, conditionally exact
   kind-179 transport lifecycle, zero effects, and
   result agree
156 external-launcher build transcript
   exactly one complete LauncherBuildTranscript; complete source/tool partitions,
   byte-identical kind-159 command set, separately held builder/file/code,
   kind-158 SDK/toolchain, kind-161 executions, kind-162 artifacts, kind-163
   dependency DAG, kind-167 retained builder session, kind-169 pre/final root
   scans, exclusive disposable root, reviewed environment, produced
   file/code, held command outputs, no network, and result agree
157 external-launcher build actor set
   exactly one ActorIdentityBinding for the separately held custom builder;
   it is kind 3 with exact bit-3 role and its executable/credential identity
   equals the held transcript bytes; platform BuildToolIdentity values are not
   actors, and the builder is kind-34-distinct from the HMG4L3 auditor
158 external-launcher SDK/toolchain identity
   exactly one complete LauncherSDKToolchainIdentity; selected OS/SDK canonical
   identities, required held/embedded header-library-settings-probe preimages,
   ABI/layout/poll registries, tool ordinals, arm64/C17 profile, no ambient
   lookup/network, and result agree
159 external-launcher build-command set
   complete LauncherBuildCommand members ordered by ordinal; every command
   binds kind-158 SDK, kind-153 source set, kind-154 tool set, separately held
   builder, selected tool/observed-executable/role, complete argv, exact empty environment,
   kind-141 execve serialization, source partition, no network, and result
160 external-launcher test-vector catalog
   exactly thirteen LauncherTestVector members ordered profile 1..13; every row
   binds the common specification/source/SDK/build/config/launcher/builder/
   command preimages and the closed injection, expected decision/count/hash/
   child-nonblock-setter/negative/effect/transport-lifecycle-profile values consumed one-to-one by
   kind-155 observations
161 external-launcher per-command execution set
   exactly one LauncherBuildExecution per kind-159 command in common ordinal
   order; retained builder/child birth, selected held BuildToolIdentity,
   kind-164 syscall/FD evidence, wait status, held stdout/stderr, artifact/edge
   projections, timing, and result agree
162 external-launcher build-artifact set
   complete LauncherBuildArtifact members in ordinal order; unique file-prefix-
   free paths, source materialization, held identities/bytes, unique producer,
   complete consumers, retention, sole final launcher, and result agree
163 external-launcher build dependency-edge set
   complete LauncherBuildEdge members in ordinal order; source/compiler/scanner/
   linker/signer/test/encoder byte edges, artifact hashes, producer/consumer
   projections, observed temporal order, acyclicity, and result agree
164 external-launcher child/syscall observation
   exactly one LauncherExecSyscallObservation per execution; builder/child/tool,
   three-pipe/three-kind-190-child-nonblock/fork/fchdir/dup2/close/direct-execve/
   waitpid counts, exact path/
   argv/empty env, kind-171 two-phase complete child-FD evidence, kind-185
   complete parent-FD passes and kind-186 parent inherited-end closes, no
   alternate launcher/network, wait status, retained peers, and result agree
165 external-launcher immutable injection-plan set
   exactly thirteen pre-execution LauncherInjectionPlan members ordered profile
   1..13; five typed no-injection positives and eight mutually exclusive typed
   alternate/symlink/FD/alias/status/exec/path/env negatives bind disposable
   roots, exact expected decision, plan-freeze time, and zero effects without
   carrying an observed setup/test/teardown interval or result
166 external-launcher injection-observation set
   exactly thirteen LauncherInjectionObservation members ordered profile 1..13;
   each hash-binds one already-held kind-165 plan and kind-160 catalog before
   setup, then records actual typed injection state, setup/test/teardown interval,
   observed decision, zero protected/runtime effect, and result
167 external-launcher retained builder-session observation
   exactly one LauncherBuilderSessionObservation; builder actor/credential,
   retained held/static/dynamic code, stable public PID/birth tuple, profile-1
   dynamic status, whole-command interval, lookup counts, and result agree
168 fixed-leaf root-signed policy bootstrap observation
   exactly one PolicyBootstrapObservation; compiled fixed sibling leaf, derived
   retained installation parent, bounded no-follow complete HMG4P2 read, first-
   trust embedded-root signature, post-signature metadata/namespace checks,
   retained helper/parent/policy FDs, and result agree
169 external-launcher disposable build-root scan set
   exactly four LauncherBuildRootScanPass members: two byte-identical empty
   pre-materialization scans and two byte-identical complete final scans whose
   kind-180 full-identity tree equals the artifact BUILD_REL_PATH directory/file
   closure with no side entry, symlink, special object, identity swap, or omission
170 external-launcher child FD-record set
   complete LauncherChildFDRecord members sorted by numeric FD and re-ordinalized;
   each record is a public-classified pipe or ordinary/directory vnode with exact
   flags, identity or pipe observation, phase-role constraints, and result
171 external-launcher child FD-inventory pass set
   exactly two LauncherChildFDInventoryPass members: the complete post-fork/
   pre-mutation phase-1 inventory and complete immediate-pre-exec phase-2
   inventory; execution, role, pipe-pair, dup2 source, close, and survivor
   projections agree and no FD is hidden or omitted
172 external-launcher command argument-artifact binding set
   complete LauncherCommandArtifactBinding members sorted by command/argument/
   direction/artifact; each exact argv token and optional `-o` binds one
   BUILD_REL_PATH artifact and the source/execution/DAG projections are complete
173 external-launcher pipe-creation observation set
   exactly three LauncherPipeCreationObservation members ordered stdin/stdout/
   stderr; six distinct returned FDs, post-kind-190 pre-fork flags, reciprocal
   public pipe endpoints, phase-1 FD-record hashes, return values, times, and
   result agree
174 external-launcher dup2 observation set
   exactly three LauncherDup2Observation members ordered destinations 0/1/2;
   source/replaced FD records, before/after endpoints, return values, descriptor
   flags, times, and result agree
175 external-launcher close observation set
   complete LauncherCloseObservation members in actual child call order; every
   phase-1 FD greater than 2 occurs exactly once with successful return and no
   absent, duplicate, or additional close
176 external-launcher syscall-step set
   complete LauncherSyscallStep canonical partial-order serialization of three
   pipe creates, three child nonblocking setups, fork, both child inventories,
   fchdir, three dup2 calls, every
   child close, two parent inventories, three parent closes, direct execve, and
   targeted waitpid; typed references/times/results agree
177 external-launcher behavior transport-endpoint set
   exactly six LauncherTransportEndpointObservation members: three child and
   three retained-parent endpoints forming three distinct reciprocal public
   pipe pairs with exact typed pipe and child-branch dup2/close returns/order,
   FDs, directions, flags, peer handles, child duplicate closure, retained-peer
   identity, and configuration; parent duplicate closes are kind 186 and are
   required by enclosing kind 179
178 external-launcher behavior transport-slot binding set
   exactly three LauncherTransportSlotBinding members ordered request/response/
   diagnostic; required/presented endpoint, FD, direction, classification,
   configuration, expected decision, and result agree
179 external-launcher behavior transport-lifecycle observation
   exactly one complete LauncherTransportLifecycleObservation for each required
   profile; kind-177 endpoints, kind-178 slots, conditional typed extra FD,
   complete child/peer projections, kind-185 complete parent inventories,
   kind-186 parent inherited-end closes, kind-190 typed child nonblocking
   setups, one typed post-setup fork and public child birth, typed call counts, configuration
   directions, expected/observed decision, and zero effect agree
180 external-launcher full build-root scan-member set
   complete LauncherBuildRootScanMember values sorted by BUILD_REL_PATH;
   retained no-follow FDs, full file/directory device/inode/metadata identity,
   streamed bytes, artifact projection, before/after stability, and result agree
181 retained SecKey handle-lifetime observation
   exactly one complete SecKeyHandleLifetimeObservation; kind-139 lookup and
   kind-132 attributes, kind-133 export denial, and kind-134 calls share one
   nonserialized direct +1 handle, one final release, dependent-call
   ordering, zero post-release use/double-release, and result agree
182 selected signing-target binding wrapper
   exactly one complete SelectedSigningTargetProjection; version/result are one,
   selected-target count is exactly one, and its complete target preserves every
   byte, including ordinal, from the selected lane member of the enclosing
   kind-127 two-target set
183 Security/CoreFoundation auxiliary object-lifetime set
   exactly six complete SecKeyAuxiliaryCFObjectLifetimeObservation members
   ordered attributes dictionary, export-error object, lane-A input/result
   CFData, then lane-B input/result CFData; every object has one +1 source, one
   distinct final release, complete copy/inspection/use ordering, and zero
   post-release read/use, leak, or double release
184 external-launcher parent FD-record set
   complete LauncherParentFDRecord members sorted by numeric FD and
   re-ordinalized; transport roles have exact public pipe endpoints and roles,
   nontransport records have no pipe fields, configuration and result agree,
   and duplicate FD or transport role is forbidden
185 external-launcher parent FD-inventory pass set
   exactly two LauncherParentFDInventoryPass members for one context: complete
   post-fork/pre-close and post-three-close/pre-decision public FD tables;
   parent execution identity, context, nontransport projection, retained peers,
   removed child-end copies, kind-184 hashes, completeness, and result agree
186 external-launcher parent inherited-end close set
   exactly three LauncherParentCloseObservation members ordered request,
   response, diagnostic; each selects one phase-1 parent record for roles 1..3,
   binds the exact endpoint and parent execution, and records one successful
   close; the enclosing kind-164/179 conjunction with kind 185 proves that FD
   absent while its reciprocal peer remains in phase 2
187 protected-install prerequisite birth-authority set
   exactly four InstallPrerequisiteBirthAuthority members ordered installation
   parent, receipt parent, launcher parent, launcher configuration; every member
   embeds one complete HMG4C2, its complete HMG4S2, and its kind-107 claim
   creation preimage, with exact profile/subject/parent/policy/creator/primitive/
   interval/signature equalities and current held identity
188 protected-install birth namespace-pass set
   exactly two InstallBirthNamespacePass members for one observation and phase;
   complete retained parent, exact leaf, absent-or-present identity, complete
   entry set, interval, phase, count, and result agree and the two passes are
   byte-identical after the permitted ordinal/time omission
189 protected-install birth-observation set
   exactly three InstallBirthObservation members in helper/policy/lock creation
   order; each binds kind-188 absent-before and present-after passes, exact
   source/metadata/creator/execution, one O_EXCL nofollow primitive, retained FD
   identity, readback, fsync/F_FULLFSYNC/parent-sync, interval, and result
190 external-launcher child nonblocking setup set
   exactly three LauncherFcntlSetFlagsObservation members ordered request,
   response, diagnostic; each binds one child endpoint and its reciprocal
   retained peer, one successful F_GETFL/F_SETFL/F_GETFL sequence before fork,
   adds only SDK-bound O_NONBLOCK, preserves descriptor flags, selects the
   post-fork parent child-copy record, forbids peer setters, and agrees with the
   pipe/child/lifecycle endpoint projections
191 artifact resolver postcondition template
   exactly one complete ArtifactPostconditionTemplateMember under the normal
   HMG4D2 kind-191 header/member framing; its fields are the exact pre-create
   projection of type-18 `a111..a11a`, binding every predictable artifact,
   destination-absence, transaction, plan, and pre-intent-state field while
   excluding any future device/inode, resolver, durability result, or complete
   kind-115 after-state identity
```

Every projection or union in this contract uses one exact ordinal rule. Select
source members by the stated semantic key while ignoring their source-list
ordinal; sort by the target kind's canonical semantic key; collapse two members
only when every nonordinal field is byte-identical; reject a conflicting
duplicate semantic key; then assign fresh target ordinals contiguously from
zero before encoding and hashing. “Byte-identical projection” means equality of
all nonordinal fields plus this deterministic target re-ordinalization. No
source ordinal is copied into a derived projection merely because it happened
to be locally contiguous.
Kind 182 is the sole closed exception: despite the historical STRUCT name, it
is a selected-target binding wrapper rather than a member-set projection.
`9763` preserves the selected kind-127 member byte-for-byte, including lane A
ordinal 0 or lane B ordinal 1; it is never freshly re-ordinalized. Gate B
requires lane B ordinal 1 and rejects rewriting it to 0 even if every other
target byte and the wrapper hash are recomputed.

Every successor field ending in `_sha256` has exactly one preimage class. A
protocol, helper, policy, plan, bundle, xattr-policy, receipt, authorization,
manifest, journal record, terminal receipt, source file, executable, or content
hash covers that complete exact framed object/file/record/content. ACL, xattr-
set, final-set, current-set, mount, transition, violation, and predecessor kinds
retain their predecessor-frozen streams. All remaining set/identity/observation/
configuration fields use the numbered kind stated beside the field or in this
registry; hashing prose, a native SDK struct, dictionary iteration, host-layout
bytes, a path string, or unframed tool output is forbidden.

`HMG4G2` is review-only and grants no runtime authority. Its payload is exactly:

```text
0x7701 protocol_spec_sha256       SHA256
0x7702 catalog_version            U32, exactly 1
0x7703 vector_target_manifest_sha256 SHA256, complete HMG4VC2;
                                      required profile 1, forbidden profile 2
0x7704 case_count                 U32, 1..65,536
0x7705 cases                      LIST GoldenVectorCase, exact count
0x7706 blob_count                 U32, 1..131,072
0x7707 blobs                      LIST GoldenBlob, exact count
0x7708 case_set_sha256            SHA256, derived kind 45
0x7709 blob_set_sha256            SHA256, derived kind 46
0x770a encoder_a_identity_sha256  SHA256, derived kind 34
0x770b encoder_b_identity_sha256  SHA256, derived kind 34, different actor/tool
0x770c result                     U32, exactly 1
0x770d acceptance_effect_mask     U64, exactly zero
0x770e vector_target_manifest_length U64, 88..134,217,728;
                                      required profile 1, forbidden profile 2
0x770f vector_target_manifest_format U32, exactly 1;
                                      required profile 1, forbidden profile 2
0x7710 external_blob_parent_identity STRUCT DirectoryIdentity;
                                      profile 1 authority slot 2,
                                      profile 2 structural fixture only
0x7711 external_blob_identity_set_sha256 SHA256, derived kind 70
0x7712 external_blob_identity_count U32, equal `7706`
0x7713 external_blob_identities   LIST GoldenExternalBlobIdentity, exact count
0x7714 stable_external_scan_a_sha256 SHA256, derived kind 70
0x7715 stable_external_scan_b_sha256 SHA256, derived kind 70
0x7716 catalog_completeness_profile U32: 1 Gate-B root-complete catalog,
                                      2 nested schema-fixture catalog
```

The predecessor and successor complete document bytes—not a vector manifest or
diagnostic selector—are the frozen canonical authority schemas. HMG4G2 is
review evidence only and no longer claims a self-derived schema registry; kind
44 is unassigned. Natural-language Markdown is never extracted, normalized, or
hashed as a per-schema definition.

Both encoders instead consume one identical, later Gate-B static vector-target
manifest. Its exact binary grammar is:

```text
offset  size  field
0       8     magic = 48 4d 47 34 56 43 32 00 ("HMG4VC2" + NUL)
8       4     format version = 1
12      4     flags = 0
16      32    successor specification SHA-256
48      32    incorporated predecessor SHA-256
80      4     GoldenVectorCase record count, 1..65,536
84      4     GoldenBlob record count, 1..131,072
88      ...   cases, then blobs

record = U32 exact byte length, then that many bytes containing exactly one
         canonical nested STRUCT value from its first TLV through its last;
         no outer caller tag, padding, or trailing byte
```

Case records sort by `7731`; blob records sort by `7721`; duplicate sort keys
are invalid. Each record is 1..1,048,576 bytes and the complete file is
88..134,217,728 bytes with no trailing byte. Profile-1
`7703=SHA256(complete file)`, `770e=length(complete file)`, and `770f=1`; its
`7705/7707` are byte-identical to the manifest's two sequences and every
count/set hash is recomputed. Profile 2 forbids `7703/770e/770f`, avoiding a
profile-fixture/source self-cycle.

`7741/7742` are exact ASCII diagnostic labels selected in that manifest;
`7732=SHA256(7741)` and conditionally present `7739=SHA256(7742)`. They help
reviewers locate the tested contract rule but confer no authority and need not
be unique across semantically identical cases. The sole exception is a
profile-2 cut-edge relation: its `7742` is unique within the target and is the
stable mapping key to the accepted comparison-base field and inert raw witness.
Kind 7's relation label names
the one-sided equality under mutation; kind 8's relation label names the field
or envelope and unsigned-decimal declared max. Kinds 1..6 forbid `7739/7742`.

The Gate-B manifest must demonstrate coverage of every required frame,
top-level/nested schema, field, enum, ABNF, state transition,
diagnostic/reason, derived kind, one-sided equality, and numeric bound in the
two complete documents. It is one exact role-13 ReviewedObjectMember input to
HMG4E2 kind 6. Encoder A and independently written encoder B receive those same
held bytes, independently validate all cases/blobs and coverage, and emit
byte-identical profile-1 HMG4G2. Omission, extra/misleading label, incomplete
coverage, or locally altered manifest is a kind-6 finding. The manifest is a
later review artifact with zero runtime authority; Gate A freezes its grammar
and coverage obligation, not one pre-implementation vector-pack hash. U2 binds
the complete HMG4G2 and signed kind-6 review, not a self-describing schema
registry.

Profile 1 is the sole Gate-B/U2/E2 evidence candidate and must satisfy every
root coverage rule in this section for the complete incorporated predecessor
and successor contract. Profile 2 exists only as a finite, bytes-only
input/output fixture for root-profile cases that test the HMG4G2 wire schema
itself. Nesting depth is exactly one: a profile-2 catalog contains no case whose
`7741` diagnostic selector names HMG4G2. Its blob descriptors are inert,
are never dereferenced, and
therefore cannot semantically contain or reference another profile-2 object.

Profile 2 must be structurally canonical: its counts, list hashes, target labels,
blob hashes/lengths, identity-list hashes, and scan-copy equalities all agree as
bytes. Its
`7710..7715` are inert structural fixture fields: no directory is
opened, no file is resolved or allocated, and its nested cases are not executed.
They claim neither live external custody nor transitive resource allocation.
The complete profile-2 object is itself just one exact root-profile GoldenBlob,
so its storage is already charged once to the root profile-1 logical and
allocated totals. A root profile-1 HMG4G2 case for the HMG4G2 schema references
that complete profile-2 blob and exercises its canonical parse/re-encode only.

All executable tests of `GoldenBlob`, `GoldenExternalBlobIdentity`, stable-scan,
sparse-read, logical-length, allocated-block, and external-directory relations
are separate root-profile-1 cases against the sole live `7710` authority-slot-2
directory. They include positive, one-sided mutation, exact-bound, and max+1
coverage. Thus there is one live external blob tree and one global 256-GiB
logical/8-GiB allocated budget for the entire Gate-B catalog, with no transitive
profile-2 directory or allocation fanout. A profile-2 object cannot satisfy U2
`6028`, E2 kind 6, policy, build, Gate B, or any runtime edge, regardless of byte
validity. This closed one-level rule terminates the schema-test graph without
exempting HMG4G2 or its external relation from root coverage.

The vector-result registry is closed. Values `00000000` and every nonzero
Section-14 diagnostic code retain their semantic names, but a Section-14 value
in a form-0 standalone decoder case is review output only and is not claimed to
have been emitted in HMG4R2. Add vector-only values
`f0010001 UNFRAMED_INVALID_HEADER` and
`f0010002 STANDALONE_RESOURCE_BOUND_EXCEEDED`; neither may appear in response
tag `8001` or any production receipt.

GoldenVectorCase conditions are exact. Kinds 1..3 have `expected_result=1`,
`expected_output_present=true`, result code `00000000 SUCCESS`, forbid
`7739/7742`, have no mutation offset, and use `773c=0`. Their output blob is the canonical
re-encoding of the accepted input and may equal the input blob. They also
require `773d=0`, `773e=0xffffffff`, and empty `773f`. Positive process-level
request/response behavior is outside these canonical standalone re-encode
cases and is exercised by separate behavior tests. Kinds 4..7 have
`expected_result=2`, no output blob, and one exact nonzero vector-result code;
kind 7 alone requires `7739/7742` naming the equality under mutation. Kind 5
always has `mutation_offset_present=true`. Kind 6 sets it true only for a
single-byte edit; for a generated missing/extra/duplicate/reorder/wrong-type/
unknown structural case it is false and `773a=UINT64_MAX`. For every true
mutation flag, `7743` resolves to an input-role GoldenBlob used as `7734` by
exactly one accepted kind-1..3 case with the same `7732/7741`; that accepted
case has the same `7747` and is the canonical base under that validation
profile. Delete and substitute require `773a` less than the
base length and `7745` equal its byte at that index. Insert requires `773a` at
a boundary from zero through the base length. The negative `7734` bytes are
exactly base-before-offset plus, by `7744`, deletion of `7745`, insertion of
`7746`, or replacement of `7745` by a different `7746`, plus the unchanged
base suffix. There is no second edit or normalization. Fields `7743/7744` and
the operation-selected `7745/7746` are mandatory in this branch. When
`773b=false`, `7744..7746` are forbidden; `7743` is required only for kind 7
and otherwise forbidden. This makes edit operation, base preimage, original
byte, new byte, and first/middle/last offset mechanically reproducible from the
catalog.

Kind 7 is a relational case. Its `7743` resolves to an input-role GoldenBlob
used as `7734` by exactly one accepted kind-1..3 case with the same
`7732/7741/7747`. The negative `7734` object differs from that comparison base
only on the semantic side named by `7739/7742` plus the minimum enclosing
length/hash/count/signature bytes that the contract mechanically requires to
remain locally canonical; every unrelated byte and field is identical. The
two decoders receive the base, negative object, relation selector, and any
profile-2 raw cut witness, and must identify the same first violated relation.

Kind 8 also has `expected_result=2`, no output,
required `7739/7742` naming the bound, no mutation offset, and exact raw
input bytes whose selected numeric field equals the registered declared max.
The raw input need not be a canonical object when the selected max is
unreachable by any canonical object. Kind 8 requires `773c=3` with result code
`00010003 NONCANONICAL_TLV` or `773c=4` with result code
`00010004 OPERATION_SCHEMA_MISMATCH`. Both decoders must instrument and record
that the selected scalar/envelope resource-bound phase admitted the value, then
return exactly the registered first later phase and diagnostic. Rejecting the
value as over-bound, claiming the raw input is maximum-valid, or skipping the
later parse is a failed vector. Kinds 1..4, 7, and 8 set mutation-offset
presence false and use the sentinel. Kinds 1..4 and 8 forbid `7743..7746`;
kind 7 requires `7743` and forbids `7744..7746`. Every `7734`
resolves to exactly one blob whose role mask has input
bit 0; every present `7736` resolves to exactly one blob whose mask has output
bit 1. One blob may set both bits when canonical input and output bytes are
identical. Every blob is referenced at least once in a permitted role, duplicate
SHA-256 is forbidden, and unused blobs are invalid.

Response form and failure phase are mechanical. A successor request fixed
header declaring payload length above 1 MiB uses form 2, exit 64, exact token
`HMG4V2_INVALID_HEADER`, phase 1, and vector-only code `f0010001`; it has no
HMG4R2 frame or Section-14 diagnostic. A max+1 request-body field reached after
a valid header uses form 1, exit 64, phase 2, and the exact framed operation-
schema diagnostic. A max+1 non-request frame, HMG4B2 table/data bound, nested
field/list bound, or review-only object cap uses form 0, exit sentinel
`0xffffffff`, phase 2, and `f0010002`. A later canonical/schema rejection uses
phase 3/4 and its exact Section-14 semantic code under form 0 unless the tested
path is the production framed request decoder. Every form-1 case fixes its
actual process exit; every form-0 case has empty token and the exit sentinel.
No bound may choose its code or phase ad hoc.

Each aggregate decoder output is one complete review-only `HMG4H2` frame, not
an unspecified text report. Header kind 1 is codec A and kind 2 is codec B. Its
payload contains exactly:

```text
0x7c41 protocol_spec_sha256       SHA256
0x7c42 result_version             U32, exactly 1
0x7c43 golden_catalog_sha256      SHA256, complete profile-1 HMG4G2
0x7c44 vector_target_manifest_sha256 SHA256, equal HMG4G2 `7703`
0x7c45 codec_identity_sha256      SHA256, equal `770a` for kind 1,
                                      `770b` for kind 2
0x7c46 case_result_count          U32, equal HMG4G2 `7704`
0x7c47 case_result_set_sha256     SHA256, derived kind 76 over `7c48`
0x7c48 case_results               LIST DecoderCaseResultMember, exact count
0x7c49 external_result_count      U32, equal HMG4G2 `7712`
0x7c4a external_result_set_sha256 SHA256, derived kind 77 over `7c4b`
0x7c4b external_results           LIST DecoderExternalResultMember, exact count
0x7c4c result                     U32, exactly 1
0x7c4d acceptance_effect_mask     U64, exactly zero
```

For each case ordinal, `7a82` is SHA-256 of the exact canonical nested
GoldenVectorCase bytes present in HMG4G2/VC2, and `7a83..7a8d` equal that
case's expected fields and the actual instrumented result. A rejected case
never claims a re-encode; an accepted case emits and hashes the exact canonical
output blob. `7a8c=true` is mandatory only for kind 8 and proves the selected
declared-max guard admitted before the registered later rejection. Any mismatch
makes `7a8e=1` and aggregate `7c4c=1` impossible.

For each external identity ordinal, `7a92` hashes its complete nested
`7961..7964` encoding, and `7a97` hashes the complete nested
ProtectedFileIdentity encoding inside `7964`, each from its first inner TLV
through its last with no caller tag or padding. The decoder holds and rechecks
that identity, streams the file from byte zero through exact logical EOF,
recomputes length and content SHA-256, and rejects a short read, extra byte,
identity drift, hole-skipping hash, or mismatch. The kind-76 and kind-77 lists
in codec A and codec B must be byte-identical; only the HMG4H2 header kind and
`7c45` differ. HMG4E2 kind 6 carries both complete frames as the
`decoder-result/a` and `decoder-result/b` role-10, encoding-1 outputs. Thus no
decoder claim is hash-only and no per-case output grammar is left implicit.

The 64-MiB HMG4H2 payload cap is constructible at both count ceilings. Using
the eight-byte TLV header and four-byte LIST member-length prefix, a deliberately
conservative DecoderCaseResultMember maximum is 264 bytes and a
DecoderExternalResultMember is 238 bytes. Therefore their simultaneous arrays
occupy at most `65,536 * 264 + 131,072 * 238 = 48,496,640` bytes; the two list
counts and all top-level fields keep the exact payload below 64 MiB. Conditional
field exclusions make the true case maximum smaller. Count max/max+1 and the
64-MiB object bound still receive separate one-sided vectors.

The `65,536` case and `131,072` blob ceilings are independent resource bounds,
not a claim that their Cartesian-product corner is semantically reachable under
the mandatory negative-case and every-blob-reference rules. Root/profile-2
schema vectors apply Section 1: accept the largest constructible canonical
catalog, admit the exact declared count at the count-bound phase and then issue
the registered case-kind-8 first later canonical or semantic rejection when the
count is unreachable, and reject count max+1 before allocation.

The held slot-2 `7710` directory contains one immutable raw ordinary file named
exactly by each `7725`; `7712/7713/7711` are kind 70, and both independent
FD-relative stable enumerations recompute that same value in `7714/7715`. Each
`7964.6203/6204` equals its GoldenBlob `7722/7721`, link count is one, and no
unowned or nonordinary leaf is permitted. `7722` and `6203` are logical file
lengths. Each file is at most 68,736,258,049 logical bytes, their summed logical
length is at most 256 GiB, and the sum of `st_blocks * 512` allocated storage is
at most 8 GiB. A sparse hole is only a storage representation: reads return the
corresponding exact zero bytes, those zeros participate in `7721/6204`, and
neither encoder may skip them in parser state, length accounting, or SHA-256.
Before generation, the review harness proves the held filesystem supports the
required logical offsets, sparse-hole read semantics, and checked `off_t`/U64
arithmetic, and proves sufficient free blocks for the 8-GiB allocation bound;
failure skips nothing and blocks Gate B.

The 256-GiB logical-total and 8-GiB allocated-total values are outer admission
budgets observed from a live directory, not serialized scalar fields inside a
GoldenVectorCase. They are the sole exception to the universal requirement that
max/max+1 reside inside the one passing root catalog: a passing catalog cannot
also contain its own over-budget live tree. Gate B instead uses four separate,
nonprivileged disposable directories, never the root `7710`, and opens only one
at a time: logical total exactly 256 GiB and 256 GiB + 1 byte; allocated total
exactly 8 GiB and the least stable total above 8 GiB produced by the canonical
allocation probe below. Two stable scans recompute every file's logical length,
`st_blocks`, device/inode, and aggregate; exact-max admits and overage rejects
before catalog use. A 512-byte `st_blocks` reporting unit does not assert that
an 8-GiB-plus-512-byte allocation is constructible.

Each run emits one complete `HMG4M2` frame. It is a review-only outer-resource
custody report, never runtime authority. Header kind 1 means logical-total and
kind 2 means allocated-total. Its payload contains exactly:

```text
0x7c21 protocol_spec_sha256       SHA256
0x7c22 report_version             U32, exactly 1
0x7c23 bound_kind                 U32, exactly equal header kind 1 or 2
0x7c24 candidate_bytes            U64, exact boundary value below
0x7c25 expected_result            U32: 1 admit, 2 reject
0x7c26 observed_logical_bytes     U64, 1..274,877,906,945
0x7c27 observed_allocated_bytes   U64, 0..17,179,869,184 and multiple of 512
0x7c28 fixture_directory_identity STRUCT DirectoryIdentity, authority slot 3
0x7c29 scan_a_sha256              SHA256, derived kind 75 over `7c2a`
0x7c2a scan_a                     STRUCT OuterResourceScanSnapshot
0x7c2b scan_b_sha256              SHA256, derived kind 75 over `7c2c`
0x7c2c scan_b                     STRUCT OuterResourceScanSnapshot
0x7c2f result                     U32: 1 admit, 2 reject; equal `7c25`
0x7c30 acceptance_effect_mask     U64, exactly zero
0x7c31 allocation_overage_bytes   U64; zero for kind 1 and kind-2 admit;
                                      512..8,589,934,592, multiple of 512,
                                      for kind-2 reject
```

The four admissible frames are closed. Kind 1 uses candidate
274,877,906,944 with result 1 or candidate 274,877,906,945 with result 2;
`7c26` equals the candidate and `7c27 <= 8,589,934,592`. Kind 2 uses candidate
8,589,934,592 with result 1 and `7c31=0`, or candidate
`8,589,934,592 + 7c31` with result 2; `7c27` equals the candidate and `7c26 <=
274,877,906,944`. The addition is checked. No other combination is valid. All
sums use checked U64 arithmetic; any overflow rejects before report
construction.

The kind-2 reject overage is not guessed from `st_blocks` units. In the
distinct allocated-over directory, starting from the same canonical member
layout and content construction as the admitted 8-GiB fixture, the harness
appends one 512-byte deterministic noncompressible block at a time to the final canonical member,
syncs that file and directory, and performs both complete stable scans after
each append. Attempts whose observed allocation remains exactly 8 GiB are
retained in the command transcript but emit no HMG4M2. The first attempt whose
two scans agree on a total above 8 GiB fixes `7c31` to that exact difference
and emits the sole kind-2 reject frame. A decrease, non-512-multiple, unstable
total, jump above the 8-GiB overage ceiling, inability to construct the exact
8-GiB baseline, or failure to find an overage within that ceiling blocks Gate
B. Before any of the four review-evidence runs, preflight proves the held
filesystem has at least the fixed worst-case 16-GiB outer-fixture allocation
ceiling available, in addition to every already-held Gate-B object and the
builder's fixed recorded safety margin. It never depends on the not-yet-known
`7c31`. This algorithm defines “least” only along this exact
monotone append sequence; it makes no claim about an abstract filesystem
allocation quantum. Appended block ordinal `n` is exactly the concatenation of
the 16 SHA-256 digests `SHA256("HMG4M2-ALLOC-v1" || BE64(n) || BE32(i))` for
`i=0..15`; ordinals start at zero. No compression-ratio claim is made—failure
to obtain the required stable allocation delta is simply blocking evidence.

Both scans are FD-relative stable enumerations of the exact held directory in
`7c28`. They open every child with no-follow semantics, reject a symlink,
nonordinary object, unexpected leaf, duplicate leaf, duplicate inode, link
count other than one, truncation, or unenumerated extra, and recompute its
canonical ACL and xattr-set streams. Members are sorted by unsigned `7992`,
re-ordinalized, and embedded in the complete domain-separated kind-75
snapshots. The two complete snapshots, not just their hashes, are embedded and
must be byte-identical; consequently `7c29 == 7c2b`. Each snapshot's
`79b2/79b3/79b6/79b7` equals report `7c23/7c28/7c26/7c27`, its `79b4` equals
its list count, and its checked `7995` and `7996` sums equal `79b6/79b7`. The
exact kind-75 HMG4D2 stream bytes are re-encoded from each embedded snapshot
before hashing. The directory identity and every child identity are stable
before and after both scans. `OuterResourceScanMember` intentionally has no content hash: this
non-authoritative test exercises only the outer logical/allocated metadata
guards, and cannot substitute for any GoldenBlob custody or content proof.

HMG4E2 kind 6 contains all four complete `HMG4M2` frames as distinct role-10,
encoding-1 ReviewedObjectMember outputs in addition to its two aggregate
decoder outputs. Thus every scan hash has its exact canonical member preimage.
The four frames test only the outer environmental guards; all serialized
per-file, field, count, and object bounds retain ordinary GoldenVectorCase
exact-max/max+1 coverage.

The 68,736,258,049 storage limit is exactly one byte above HMG4B2's arithmetic
framing envelope when its independent declared table and data-region ceilings
are both substituted: `align_up(96 + 16,777,216, 4096) + 68,719,476,736` is
68,736,258,048. That envelope is not mislabeled semantically valid. With
exactly 114 BundleEntry values and the predecessor's TLV/POLICY_REL_PATH bounds,
the canonical table schema envelope is at most 142,276 bytes, so its data start
is at most 143,360 and its semantically valid file envelope is at most
68,719,620,096 bytes (the 114 policy-fixed paths can make the actual maximum
smaller). The exact 16-MiB table-ceiling raw input is therefore case kind 8 with
`773c=3` and `NONCANONICAL_TLV`; it is not called a canonical table. Table
ceiling plus one is kind 4.

Distinct sparse raw blobs use a real canonical 114-entry table to carry the
exact HMG4B2 `data_region_length=64 GiB` positive and `64 GiB + 1` negative
cases, including every logical zero gap and exact trailing-byte rule. Ordinary
raw blobs carry the complete 1-GiB Q2 maximum and maximum-plus-one cases. The
root external-custody verifier and HMG4E2 review stream every complete
GoldenBlob from byte zero through logical EOF exactly once and recompute its
outer `7721/6204` content hash; this proves the fixture is a real exact sparse or
ordinary byte stream rather than a recipe, prefix, or hash midstate.

The inner object decoder is a separate phase. It reads only the bounded header
and selected scalar needed to apply an over-bound guard. A max+1 value is
rejected at that earliest guard before inner body allocation, iteration,
hashing, or parsing, as Section 1 requires. Only an admitted in-range/positive
inner object is then streamed and parsed through its declared EOF and has every
inner hash recomputed. Thus outer custody hashing never authorizes decoder DoS
and inner early rejection never substitutes a metadata assertion for the exact
held vector bytes. Seeking directly to an expected inner rejection offset or
using a diagnostic pathname as authority is forbidden.
Encoder A and independently implemented encoder B must produce byte-identical
catalog, case, output, and blob hashes; both decoders must reject every negative
case. `770a/770b` are kind 34 over two policy-catalog kind-3 bit-4 tool actors
with different stable identifiers, UIDs or isolated build identities, complete
executable-code-identity hashes, source manifests, and implementations. The
production helper, builder actor, and HMG4E2 producer are not either encoder;
sharing a library under review must be disclosed and cannot supply the required
independence. The exact HMG4VC2 target manifest and signed kind-6 review cover
every new top-level frame, nested STRUCT, derived member, amended request/BEGIN/
receipt/journal payload, ABNF type, enum, status/reason registry, and equality
relationship, subject to the closed cycle boundary below. Coverage includes
standalone nested encoding, minimum/representative/largest-valid plus exact
declared max and max+1 for every serialized bound (using case kind 8 when exact
max is canonically or semantically unreachable), missing/extra/duplicate/out-
of-order/wrong-type/reserved/trailing cases, all seven custody variants, every
path template, every intent/resolver pair, every diagnostic/status/reason, and
every one-sided equality mutation with locally valid internal hashes.

Vector validation has exactly two profiles. Profile 1 performs canonical
framing/TLV checks, every local hash and equality, and every required external
object/signature/identity dereference; only profile 1 is a full semantic
positive. Profile 2 performs canonical framing/TLV checks, conditional fields,
all resource bounds, embedded LIST/STRUCT grammar, payload/content/list hashes,
and every equality whose complete preimages are inside the tested blob, but it
does not parse, signature-validate, or grant authority meaning to an external
complete-object, actor, filesystem identity, receipt, or future evidence edge.

Every opaque complete-object SHA-256 cut edge in an accepted validation-profile-2 base
equals `7721` of exactly one distinct input-role GoldenBlob in that same root
catalog whose `7716=1`. Each cut-edge relation selector is unique within its target and maps
to that accepted field/value and witness; aliases of one edge share the mapping.
That blob and its `7961..7964` identity are an inert raw cut witness: where the
schema has a companion length it equals `7722`; the
profile-2 evaluator may resolve it through `7713`, stream all raw bytes, and
recompute only length/SHA-256. It must not parse those bytes as the claimed
G2/E2/U2/receipt/authorization object or use them as signature, actor,
filesystem, or runtime authority. Aliases of one edge use the same witness;
semantically distinct edges use pairwise-distinct witnesses. A cut witness's
edge use counts as an input-role reference under the no-unused-blob rule; it is
forbidden as `7734/7736` unless a separate non-cut case independently names it.
It counts toward the root 256-GiB logical/8-GiB allocated budgets and receives
an ordinary HMG4H2 external-result record. For a profile-2 kind-7 hash-edge
mutation, the raw witness bytes/hash remain fixed while exactly the selected
object-side digest changes; for an opaque scalar/signature/identity side, the
accepted comparison base itself is the frozen relational oracle. The negative
differs only as the kind-7 rule above permits. Thus both decoders can
mechanically reject the one-sided fixture relation without a hash fixed point,
while actual referent parsing, signature validity, and authority equality remain
mandatory only at the named post-G2 gate.

Catalog completeness profile 2 (`HMG4G2.7716=2`) and validation profile 2
(`GoldenVectorCase.7747=2`) are different namespaces. The raw-witness exception
above resolves only root catalog-profile-1 `7713` identities; it never opens or
dereferences a nested catalog-profile-2 `7713` directory or blob.

Contract-required aliases of the same external edge still match; semantically
distinct opaque edge digests are nonzero and pairwise different. Those exact
fixture values are frozen by the input GoldenBlob bytes. A profile-2
kind-1..3 positive uses response form 0; negative request-transport cases retain
their exact Section-4 response form. Profile 2 can only prove standalone
canonical parse/re-encode or the registered local rejection. It is categorically invalid as policy, review,
build, capability, install, quiescence, authorization, request, journal,
receipt, runtime, acceptance, promotion, or publication evidence.

The cycle-bearing target set is closed by the transitive required-equality DAG:

```text
root profile-1 HMG4G2 and its exact HMG4VC2
HMG4H2 kinds 1/2 and HMG4E2 kind 6
HMG4U2
HMG4Z2, HMG4I2, HMG4Q2, HMG4W2, and amended predecessor HMG4O2
every HMG4V2 operation and every successor BEGIN/RECOVERY_BEGIN
every HMG4J2 record whose validity chains to BEGIN/RECOVERY_BEGIN
every HMG4T2 terminal receipt/record
every HMG4R2 form whose validity embeds or equality-binds any object above
```

This list also includes any nested object whose mandatory complete-object
equality transitively reaches profile-1 G2 or E2 kind 6; revision 1 defines no
additional top-level member of that closure. For a target in that set,
kind-1..3 cases and every case whose expected decision requires a cut-edge
dereference have `7747=2`. A negative case has `7747=1` exactly when its
registered first failure is reached strictly before any cut-edge dereference;
this includes the fixed-header and request-body transport/resource cases whose
forms remain exactly 2 and 1. No other profile choice is legal. The root G2
must contain no kind-1..3 profile-1 complete positive frame for the closed set.
The exact root HMG4VC2 named by `7703` and every
actual post-G2 HMG4H2/HMG4E2/HMG4U2/downstream object are forbidden from the
root G2 `7707/7713` blob set. A distinct inert HMG4VC2 grammar fixture may be a
GoldenBlob. The existing HMG4G2 `7716=2` nested schema fixture remains the only
way to test G2's own frame inside root G2; its GoldenVectorCase also uses
`7747=2`.

Every target outside that closure has `7747=1` and receives a full positive
frame/hash plus its negative vectors. The acyclic full-positive set includes
HMG4P2, HMG4N2, HMG4L2, HMG4F2, HMG4K2, HMG4Y2, HMG4M2, HMG4L3,
HMG4E2 kinds 1..5, the
predecessor bundle/ACL/xattr/derived/final-set formats, and any HMG4R2
read-only/error form that has no dependency path into the closed set. Actual
positive cycle-bearing objects are proven only in forward DAG order: profile-1
G2 first; both HMG4H2 outputs and the four HMG4M2 outputs inside passing E2 kind
6; U2 after that review; then Z2/I2/Q2/W2 or O2; then request, journal, terminal
receipt/record, and response behavior. Each actual object enters only its
successor evidence edge and is never fed back into root G2. Omitting its
impossible root-catalog full positive is therefore mandatory acyclicity, not a
coverage waiver. One-sided vectors still cover every cut external equality in
profile 2, while the real equality and signature are covered by the named
post-G2 evidence/behavior gate.

Catalog invalid witnesses are finite. For each closed integer enum they are:
zero when invalid; each explicit reserved/hole singleton; the endpoint nearest
each side of every contiguous invalid range; maximum allowed plus one when
representable; the integer type maximum; each individual unknown bit; and the
all-unknown-bit mask. Duplicate witnesses collapse byte-identically. For each
lexical grammar, let eligible base-byte indices be the increasing sequence
`B`; first, middle, and last mean `B[0]`, `B[floor((|B|-1)/2)]`, and
`B[|B|-1]`. Eligible insertion boundaries are `0..base_length`, with first,
middle, and last `0`, `floor(base_length/2)`, and `base_length`. An unavailable
position emits no row and coincident positions collapse. For each explicit
forbidden singleton or closed byte range, its representative is the smallest
unsigned byte in that singleton/range; for a positive allowed-byte class it is
the smallest unsigned byte outside the class. Catalog mutations are exactly
delete-one at the three selected byte indices; insert and substitute each
rule's representative at the three selected boundaries/indices; duplicate the
first component when a component grammar exists; reorder the first adjacent
pair when at least two components exist; and append the smallest forbidden
trailing byte. Byte edits populate `773a/773b/7743..7746` and must reproduce the
negative bytes exactly; component duplicate/reorder cases use kind 6 with no
byte-mutation fields. If one representative violates multiple overlapping
lexical rules, the same exact edit may satisfy multiple target selectors but
is collapsed only under the full-semantic equality rule below. Arbitrary
integer values and other byte/offset combinations are
exhaustively property/fuzz tested under HMG4E2 kinds 2/3, not misrepresented as
one catalog row per possible value.

The manifest uses one closed 65,536-case budget with no per-rule truncation.
The generator enumerates the complete finite witness algorithm above for every
applicable frozen rule, adds every mandatory positive, one-sided equality,
bound, frame, path, and state witness required by this section, sorts by the
canonical target/rule/edit key, and collapses only byte-identical cases whose
entire expected result semantics also match. It then records pre-dedup count,
exact-duplicate count, and final count by witness class in the Gate-B review
report. If the final mandatory count exceeds 65,536, or if two equal input/edit
keys disagree on expected semantics, Gate B blocks and a successor contract is
required; no witness is sampled, prioritized, or silently omitted. Thus the
wire cap is tested against an actual reproducible enumeration rather than an
undefined “target-rule group” arithmetic assumption. The amended request
matrix includes explicit negative cases for tags `0029` and `002a` under each
of probe, verify, apply, and recover; all eight are rejected as unknown/
forbidden, proving the acyclic post-request plan construction.

## 5. Canonical production policy: `HMG4P2`

The payload contains exactly:

```text
0x1001 protocol_spec_sha256       SHA256
0x1002 predecessor_contract_sha256 SHA256, exact Section 0 value
0x1003 policy_version             U32, exactly 2
0x1004 approved_helper_sha256     SHA256
0x1005 approved_plan_sha256       SHA256
0x1006 approved_bundle_sha256     SHA256
0x1007 expected_root_identity     STRUCT RootIdentity
0x1008 path_allowlist_sha256      SHA256
0x1009 predecessor_set_sha256     SHA256
0x100a desired_set_sha256         SHA256
0x100b acceptance_effect_mask     U64, exactly zero
0x100c entry_count                U32, exactly 114
0x100d entries                    LIST Entry, exactly 114
0x100e forward_vector_sha256      SHA256
0x100f forward_transition_count   U32
0x1010 full_rollback_sha256       SHA256
0x1011 full_rollback_count        U32
0x1012 durability_envelope        U32, exactly 2
0x1013 transaction_grammar        STRUCT TransactionGrammar
0x1014 sole_writer_identity       STRUCT WriterIdentity
0x1015 protected_parents          LIST ProtectedParent, 1..256
0x1016 evidence_locations         LIST EvidenceLocation, exactly 12 roles
0x1017 role_metadata_policies     LIST RoleMetadataPolicy, exactly 18
0x1018 xattr_policy_bindings      LIST XattrPolicyBinding, 1..114
0x1019 maximum_material_entries   U32, exactly 1,024
0x101a maximum_unresolved_entries U32, exactly 1,024
0x101b maximum_acl_entries        U32, exactly 1,024
0x101c maximum_recovery_depth     U32, exactly 32
0x101d maximum_custody_leaves     U32, exactly 4,096
0x101e protected_domain_required  BOOL, exactly true
0x101f no_delete_required         BOOL, exactly true
0x1020 apply_authorization_rule   STRUCT EvidenceTrustRule
0x1021 recovery_authorization_rule STRUCT EvidenceTrustRule
0x1022 time_policy                STRUCT TimePolicy
0x1023 release_id                 BYTES, exactly 44 ASCII bytes:
                                   `g4-l10-nested-parent-downstream-successor-v2`
0x1024 target_capability_requirement_vector_sha256 SHA256, derived kind 17
0x1025 system_lock_capability_requirement_vector_sha256 SHA256, derived kind 17
0x1026 required_quiescence_subject_count U32, 1..512
0x1027 required_quiescence_subject_set_sha256 SHA256, derived kind 28
0x1028 role_metadata_set_sha256 SHA256, derived kind 31 over `1017`
0x1029 actor_identity_count      U32, 1..32
0x102a actor_identities          LIST ActorIdentityBinding, exact count
0x102b actor_identity_set_sha256 SHA256, derived kind 47 over `102a`
0x102c birth_protection_rule_set_sha256 SHA256, derived kind 41
0x102d launcher_configuration_sha256 SHA256, derived kind 48
0x102e approved_executable_code_identity_sha256 SHA256, derived kind 15
0x102f target_capability_requirements LIST CapabilityRequirement, exactly 18
0x1030 system_lock_capability_requirements LIST CapabilityRequirement, exactly 5
0x1031 required_quiescence_subjects LIST QuiescenceSubjectRequirement,
                                      exact `1026` count
0x1032 birth_protection_rules       LIST BirthProtectionRule, exactly 5
0x1033 policy_root_identity          STRUCT ActorIdentity, kind 2 with bit 0
0x1034 policy_statement_sha256       SHA256, derived kind 51
0x1035 policy_signature_algorithm    U32, exactly 1 Ed25519
0x1036 policy_detached_signature     BYTES, exactly 64
0x1037 canonical_empty_acl_sha256    SHA256, predecessor canonical empty ACL
0x1038 fixed_role_empty_xattr_policy_sha256 SHA256, complete HMG4Y2 with
                                      exact empty set
0x1039 fixed_role_empty_xattr_binding STRUCT XattrPolicyBinding, purpose 2
0x103a launcher_configuration       STRUCT LauncherConfigurationIdentity
0x103b approved_executable_code_identity STRUCT ExecutableCodeIdentity
0x103c installation_root_identity   STRUCT RootIdentity, authority slot 1
0x103d target_fixture_root_identity STRUCT RootIdentity, authority slot 3
0x103e target_fixture_parent_identity STRUCT DirectoryIdentity, authority slot 3
0x103f system_lock_fixture_root_identity STRUCT RootIdentity, authority slot 4
0x1040 system_lock_fixture_parent_identity STRUCT DirectoryIdentity, authority slot 4
0x1041 gate_a_review_report_sha256 SHA256, complete frozen companion report
0x1042 fixture_helper_actor_sha256 SHA256, derived kind 34
0x1043 fixture_helper_actor        STRUCT ActorIdentity, kind 3 with bit 14
0x1044 platform_trust_profile      U32, exactly 1 Section 10
0x1045 non_uid0_writer_closure_required BOOL, exactly true
0x1046 workspace_build_parent_identity STRUCT DirectoryIdentity, authority slot 2
0x1047 denial_fixture_setup_actor_sha256 SHA256, derived kind 34
0x1048 denial_fixture_setup_actor  STRUCT ActorIdentity, kind 3 with bit 15
0x1049 profile2_owner_authority_sha256 SHA256, derived kind 34
0x104a profile2_owner_authority    STRUCT ActorIdentity, kind 2 with bit 16
0x104b protected_birth_authority_sha256 SHA256, derived kind 34
0x104c protected_birth_authority  STRUCT ActorIdentity, kind 2 with bit 17
0x104d fresh_tree_creator_actor_sha256 SHA256, derived kind 34
0x104e fresh_tree_creator_actor   STRUCT ActorIdentity, kind 3 with bit 19
0x104f managed_root_writer_rule_set_sha256 SHA256, derived kind 52
0x1050 managed_root_writer_rule_count U32, exactly 1
0x1051 managed_root_writer_rules  LIST WriterAuthorityRule, exact count
0x1052 protected_birth_owner_authority_sha256 SHA256, derived kind 34
0x1053 protected_birth_owner_authority STRUCT ActorIdentity, kind 2 with bit 18
0x1054 build_controller_actor_sha256 SHA256, derived kind 34
0x1055 build_controller_actor       STRUCT ActorIdentity, kind 3 with bit 3
0x1056 build_signing_owner_authority_sha256 SHA256, derived kind 34
0x1057 build_signing_owner_authority STRUCT ActorIdentity, kind 2 with bit 20
```

`1024`, `1025`, `1027`, and `102c` are recomputed over `102f`, `1030`, `1031`,
and `1032` respectively. A receipt cannot supply or replace a missing policy
member list.

`1039.7301 == 1038`; its reference count is zero, referenced-index list is
empty, purpose is 2, and its xattr-set hash is the predecessor canonical empty
set. Every `1018` member has purpose 1.
`102d` is kind 48 over `103a`; `102e` is kind 15 over `103b`; and all copies in
the helper, WriterIdentity, build, installation, running-code observation, and
request-bound evidence agree. Neither policy identity is hash-only.
The nested `103a.4b26` held bytes parse byte zero through EOF as exactly one
HMG4L3 kind-1 pass. Its `9201/9202` equal policy `1001/1002`, `9223` equals
the enclosing configuration's `4b04`, `9225` is byte-identical to `4b24`,
`9224` is kind 15 over both and equals `4b08`, and `9226` is byte-identical to
`4b23`. The raw launcher input member's complete bytes hash/length equal
`4b23.6204/6203 == 4b24.6401`; parsing those same bytes yields `4b24`.
`4b26.7d44/7d45` and held `7954.6203/6204` equal the complete HMG4L3 length/
hash, and its nested `9210` and every canonical machine observation result are
one. The nested kind-158 SDK/toolchain, kind-159 command set, separately held
builder/file/code, and kind-160 thirteen-row catalog satisfy every internal
cross-equality in Section 4.0.1; no hash-only or wrong-kind replacement is
admitted merely because the outer HMG4L3 signature verifies. The unique policy
bit-4 actor in `102a` is byte-identical to
`4b26`'s parsed `921f` and hashes to `921e`. Gate B mutates each spec,
predecessor, config, file, code, raw input, actor, locator, length, hash, kind,
result, and held byte edge independently, including audit A/config-or-launcher
B swaps; every one is rejected before kind-48 admission.
Policy `1007` is authority-slot-2 project RootIdentity and equals plan/request;
`103c` is the distinct authority-slot-1 installation RootIdentity. Every role-1
ProtectedParent chain begins at `103c`, and I2/Z2 installation-root copies equal
it byte-for-byte. `103d/103e` are the target-volume disposable fixture root and
its held creation parent; `103f/1040` are the corresponding system-lock pair.
Within each pair the DirectoryIdentity component sequence has the RootIdentity
component sequence as an exact prefix (equality is allowed), every overlapping
edge and terminal device/inode/mount identity agrees, and the relative fixture
root is resolved only beneath the held parent. The four RootIdentity values in
`1007/103c/103d/103f`, all four absolute paths, and their device/inode/edge-set
identities are pairwise distinct. Fixture roots and parents are not
ProtectedParents and grant no production namespace, custody, evidence, install,
or transaction authority.
`1046` is the held slot-2 workspace build parent used only by the two
BuildInvocation roots. It is distinct from every production ProtectedParent,
fixture parent/root, custody/evidence/formal-output parent, and authority root;
its component/edge/mount/ACL/xattr identity is policy-fixed. It grants no
protected-install, runtime, original-runtime, apply, recover, promotion,
acceptance, or publication authority.
`1047` is kind 34 over `1048`; `1049` is kind 34 over `104a`. The bit-15 setup
tool and bit-16 owner approval key are distinct from each other and from every
other actor, executable identity, SPKI, or role bit. Neither field authorizes an
operation by itself: profile-2 admission requires the exact nested HMG4L2/F2
dual-signature chain in Section 7.
`104b` is kind 34 over `104c`; `104d` is kind 34 over `104e`; and `1052` is
kind 34 over `1053`. They are respectively the C2 attestation key, privileged
offline provisioner code actor, and S2 owner-authorization key, each a unique
`102a` catalog member with only bit 17, 19, or 18 and pairwise-distinct SPKI/
executable identity. `104f` is kind 52 over `1051`, `1050=1`, and the sole
rule names the policy bit-10 runtime helper, phase 3, managed-root exact
namespace, owner-only read/exclusive-create/write-new/append/no-replace-rename/
FD-metadata/file-sync/parent-sync actions, and no delete/overwrite/hardlink.
It is the final managed-root writer rule, not the earlier privileged provisioning
authority. Profile-1 HMG4S2 `8509/850a==104d/104e`, `8513/8514==1052/1053`,
and `851c/851d` equal the bit-10 runtime-helper actor; profile-1 HMG4C2
`820a/820b==104d/104e`. Profile-3 S2/C2 instead select the unique bit-11
evidence-ingest actor and its exact phase-1 rule. C2 `8220/8221==104b/104c`.
No one field authorizes mutation: S2 validity, one-use admission, exact
disposable bootstrap parent, and complete C2 observations are all required.
`1054` is kind 34 over `1055`, and `1056` is kind 34 over `1057`. They are the
workspace build-controller code actor and the distinct owner build-signing key.
Each occurs exactly once in `102a` with only bit 3 or bit 20 respectively; their
executable/SPKI cannot equal any other actor. The controller actor grants only
the slot-2 build procedure. The owner key grants only one exact HMG4L2-kind-2
target set and cannot issue U2, policy, install, runtime, apply/recover, or
acceptance authority.

There are exactly two production filesystem domains, not four independently
substitutable mounts. The target-domain tuple is policy `1007.(0201,0207,0208)`
(`device, filesystem_id, mount_configuration_sha256`); the installation/lock-
domain tuple is `103c.(0201,0207,0208)`. The tuples are different.
`103d.(0201,0207,0208)` and `103e.(2203,220b,220c)` equal the complete target
tuple; `103f.(0201,0207,0208)` and `1040.(2203,220b,220c)` equal the complete
installation/lock tuple. Every policy role-2, role-3, and role-4
ProtectedParent `2304.(2203,220b,220c)` equals the target tuple, and every
role-1 ProtectedParent equals the installation/lock tuple. Every component
walk for those roots and parents remains on its selected device: each
ParentChildEdge parent and child device equals the tuple device. Every present
ordinary-file identity, FinalEntry, custody artifact, evidence leaf, live
managed file, formal output, helper, policy, lock, or launcher configuration
under such a parent has the same selected device. An absent object has no
invented device. A bind mount, mount crossing, clone or rename source on a
different tuple, or a third production tuple is invalid. Thus all direction-1
and direction-2 target renames execute only on the one target mount exercised
by scope-1 K2, and every protected installation/lock operation executes only
on the one mount exercised by scope-2 K2; supporting any additional production
mount requires a different successor contract and one K2 per distinct mount.

Policy bootstrap trust is external to the policy. The helper embeds exact
offline policy-root SPKI DER bytes/hash. `1033` must contain those bytes, have a
kind-34 hash present exactly once in `102a`, and carry bit 0. The unsigned policy
payload is the canonical HMG4P2 payload with tags `1034..1036` omitted but
`1033` included. Kind 51 binds its SHA-256, both contract hashes, release ID,
and root actor. `1034` is the complete kind-51 stream hash and `1036` is Ed25519
over those exact stream bytes using the embedded root key. This check precedes
trust in `102a`, location rules, issuer rules, helper hash, or any other policy
field. A replacement policy cannot introduce its own trust root.

`1008..1011` are recomputed from `100d`; all 114 indices occur once; paths are
unique with no ASCII-case collision; role-1 precedes every role-2 report; all
Entry fields equal plan, request, and bundle fields. Every policy location is
under one of the two retained roots. The policy hash covers the complete frame
and is never contained inside the policy.

`EvidenceLocation` contains role, protected-parent ordinal, one fixed relative
path template, object magic/kind, content-hash derivation rule, maximum age,
issuer trust hash, owner/group/mode/flags/ACL/xattr identity, link count one,
and `exclusive_no_replace=true`. Roles are exactly:

```text
1 plan                      plans/g4-l10-<sha256>.plan
2 bundle                    bundles/g4-l10-<sha256>.bundle
3 target capability         receipts/cap-target-<sha256>.receipt
4 system-lock capability    receipts/cap-system-<sha256>.receipt
5 quiescence                receipts/quiescence-<sha256>.receipt
6 recovery authorization    authorizations/recover-<sha256>.auth
7 reproducible build        receipts/build-<sha256>.receipt
8 protected install         receipts/install-<sha256>.receipt
9 xattr policy              xattr/g4-l10-<sha256>.xattr
10 apply authorization      authorizations/apply-<sha256>.auth
11 install authorization    authorizations/install-<sha256>.auth
12 review/evidence manifest receipts/review-<sha256>.manifest
```

`<sha256>` is exactly 64 lowercase hex of the complete framed object's hash.
No request path selects an object: its claimed path must equal the location
derived from role and observed hash, then byte-match the policy rule.

For evidence roles 1..12, `path_template == object_role == evidence_role`.
There is exactly one `EvidenceLocation`, `EvidenceTrustRule`, and evidence-role
`RoleMetadataPolicy` for each number 1..12, sorted numerically. The framing and
header discriminator registry is: role 1 `HMG4N2`/1/profile 1; role 2
`HMG4B2`/114/profile 2; roles 3 and 4 `HMG4K2`/1 and /2/profile 1; role 5
`HMG4Q2`/1/profile 1; role 6 `HMG4O2` with its disposition discriminator/profile
1; role 7 `HMG4U2`/1/profile 1; role 8 `HMG4I2`/1/profile 1; role 9
`HMG4Y2`/1/profile 1; role 10 `HMG4W2`/1/profile 1; and role 11
`HMG4Z2`/1/profile 1; role 12 `HMG4E2` with discriminator set 1..6/profile 1.
For role 6 the held object's discriminator must equal its
internal disposition and the recover request; the location rule admits exactly
the four predecessor disposition values. `require_pass_result=true` exactly for
receipt roles 3, 4, 5, 7, 8, and 12. It is false for immutable roles 1, 2, 9 and
signed authorization roles 6, 10, 11, whose authenticity is established by
their exact signature rules rather than a nonexistent result tag.

`require_pass_result` governs authority satisfaction, not storage admission.
For roles 3/4/12, the bit-11 broker may exclusive-retain a schema-valid,
strict-signature-valid pass, fail, or blocked object at its content-derived path;
the namespace therefore owns all such signed objects. Only `result=1` may
satisfy K2/U2/request/runtime dependencies. A nonpassing object remains
immutable review/failure evidence, has zero authority effect, is included in
stable scans, and can never be substituted for a passing hash. This same
protected registry is searched for F2 hash/nonce consumption. Unsigned,
malformed, wrong-policy/specification, untrusted-signer, or colliding objects
are unowned blockers rather than admissible failure evidence.

Storage admission is also independent of current age. Every schema/signature/
policy/spec/location/metadata-valid evidence or authorization object remains a
permanently owned immutable leaf after expiry; it continues to count in stable
namespace and replay/nonce-consumption scans but can no longer satisfy a fresh
authority edge. `maximum_age_seconds`, object expiry, and pass-result checks are
applied only while resolving authority, never to erase namespace ownership.
No-delete therefore does not cause old Q2, W2, O2, Z2, K2, or E2 evidence to
become an unowned blocker merely because time passed or its result was nonpass.

Attestation profiles are exact. Roles 1, 2, and 9 use profile 1 and required
signer bit 0 because their complete hashes are fixed by the policy-root-signed
policy. Roles 3/4 use profile 2 bit 1; role 5 profile 2 bit 2; role 7 profile 2
bit 3; role 8 profile 2 bit 13; and role 12 profile 2 bit 4. Roles 6, 10, and 11
use profile 3 with bits 7, 6, and 5 respectively. `6802` is the kind-34 hash of
the exact policy-catalog kind-2 signing actor carrying `680b`; for profile 1 it
is the policy-root actor. Object hash placement, exclusive creation, or a
storage broker is never an issuer attestation.

Within each location, `6301==6801`, `6302==6805`, `6303==6806`,
`6304==6803`, `6305==6804`, `6306==6809`, and `6307==6807`; `6309.object_role`
equals `6301` and the byte-identical sole `1017` member for that role. Policy
`1020` is byte-identical to role-10 `6308`, and `1021` to role-6 `6308`.
Every `6804` is kind 50 over `680d`, and `680c` agrees; `6305` is therefore
recomputed through its embedded trust rule rather than accepted as a bare hash.
Every NamespaceRule, QuiescenceSubjectRequirement, and BirthProtectionRule
metadata hash resolves to exactly that same `1017` list or the explicit
Entry/source exception stated below. No duplicate copy has precedence.

The six additional metadata roles are exactly 13 installed helper, 14 installed
policy, 15 permanent lock, 16 transaction request copy, 17 journal or terminal
receipt, and 18 launcher configuration. Roles 1..18 occur once and sort
numerically. Every role has
object type 1 ordinary, link count one, and xattr-policy hash equal policy
`1038`; no metadata role is implementation-local.
F2-only metadata role 19 is the durable fixture-consumption claim. It is absent
from policy `1017`, valid only as `HMG4F2.791c`, has ordinary type/link count one,
uses the same fixed-empty HMG4Y2/ACL semantics, and grants no production or
evidence-location role.
Metadata role 21 is unassigned and forbidden. S2-only metadata role 22 is the
protected-birth replay claim. It is absent from policy `1017`, valid only at
`HMG4S2.8527`, and has ordinary type, link count one, flags zero, exact empty ACL/
xattr semantics, mode `0440`, owner UID equal the S2 provisioner
`850a.6f0c.7852`, and group GID equal the future Q2 observer
`852b.6f0c.7855`. Owner/group write bits are zero after FD-only metadata
application; the creator retains its already-open O_RDWR FD only through the
creation transcript, while the later Q2 observer can reopen the immutable claim
read-only through the fixed group. `852a` is kind 34 over `852b`, and that actor
must occur exactly once as policy bit 9 and equal both Q2 QuiescenceObservation
tools. Role 22 grants no production transaction, evidence-ingest, install,
runtime-write, apply, recover, acceptance, promotion, or publication role.
Stage metadata comes from its exact Entry/HMG4Y2 binding; archive metadata comes
from the held predecessor FinalEntry and exact observed ACL/xattr bytes. Neither
uses a fictitious singleton transaction-work metadata role. All desired output,
fixed-role, request, journal, and receipt ACL hashes equal recomputed policy
`1037`; no nonempty ACL is synthesized from a hash. An archive may reproduce a
nonempty observed predecessor ACL directly from the held source FD and must
read back the identical canonical ACL stream.
Role-9 evidence admits exactly the distinct hashes in output bindings `1018`
plus the policy object bound by `1039`; every admitted HMG4Y2 object is held and
fully parsed. `1038`
requires `attribute_count=0`, `exact_empty_set=true`, and the predecessor
canonical empty xattr stream hash.

The numeric path-template registry is exactly the twelve displayed role
templates above. The `<sha256>` substitution is lowercase hex of the complete
object SHA-256; no other substitution, prefix, suffix, extension, directory, or
case is accepted. Two derived paths or role/template pairs may not collide.

`ActorIdentity.authorized_role_mask` bits are closed: bit 0 policy issuer,
1 capability issuer, 2 quiescence issuer, 3 builder, 4 independent reviewer,
5 install authorizer, 6 apply operator, 7 recovery operator, 8 launch broker, and
9 observation tool, 10 runtime helper writer, 11 evidence-ingest broker,
12 installer filesystem writer, 13 install-receipt attestor, and 14 disposable
fixture executor, 15 privileged denial-fixture setup/launcher, and 16 privileged
fixture owner authorizer, 17 protected-birth attestor, 18 protected-birth
owner authorizer, 19 privileged offline birth provisioner, and 20 build-signing
owner authorizer. Bits 21..63 are
zero. Kind-2 approval keys have exactly one
bit among 0..7, 13, 16, 17, 18, and 20;
kind-1 code processes have exactly one bit among 8, 10, 11, and 12; and kind-3
build/review/fixture tools have exactly one bit among 3, 4, 9, 14, 15, and 19.
The bit-19 provisioner alone has real/effective/saved UID zero and an exact
owner-authorized root group vector; every other kind-3 actor is nonzero. Thus builder and
independent-reviewer keys/tools, and policy root and reviewer keys, are
cryptographically and executably distinct. The catalog forbids reuse of one
kind-2 SPKI under any second ActorIdentity and reuse of one kind-1/3 executable
code identity under any second actor. For kind 2, `6f06` is SHA-256 of the
exact `6f08` DER SubjectPublicKeyInfo and fields `6f03..6f05,6f09..6f0c` are
absent; kinds 1 and 3 require `6f03..6f05,6f09..6f0c`, forbid `6f06/6f08`, and
recompute `6f05` as kind 15 over `6f0b`. `6f03/6f04`
are effective UID/GID, `6f09/6f0a` equal `6f0c.7857/7858`, and all UID/GID
fields equal the corresponding effective values in `6f0c`. Every kind-1 actor
uses a distinct dedicated nonlogin account and full credential: no two actor
catalog entries may share any real/effective/saved UID, primary GID, or complete
group vector, and no other login/account/process may hold an ACL-equivalent
credential. Q2 enumerates that OS-principal closure and every process possessing
one; code identity remains a separate required layer and is never inferred from
DAC. Every issuer, producer, builder, installer, operator,
launcher, and observation-tool identity hash in any authority object must equal
kind 34 for exactly one policy `102a` member carrying the required bit. A hash
with zero or multiple catalog matches, an absent role bit, or a different actor
STRUCT is invalid.

Every kind-2 SPKI is shortest-form DER `SubjectPublicKeyInfo` whose algorithm is
exact OID `1.3.101.112` (`id-Ed25519`), whose AlgorithmIdentifier parameters are
absent, and whose BIT STRING has unused-bits count zero followed by exactly 32
public-key bytes. Indefinite/nonminimal length, alternate OID, NULL parameters,
unused bits, wrong key length, or trailing bytes is invalid.

Every Ed25519 use in this successor has one profile,
`HMG4-ED25519-STRICT-1`. It is pure RFC 8032 Ed25519 over the exact complete
message bytes stated by the calling schema: `PH` is the identity function,
`dom2` is empty, and the internal hash is SHA-512. Ed25519ctx, Ed25519ph,
caller-side prehashing, context strings, and signing only a SHA-256 summary are
invalid. Integers use RFC 8032 little-endian interpretation; the field prime is
`p = 2^255 - 19` and subgroup order is
`L = 2^252 + 27742317777372353535851937790883648493`.

Before any signature equation, both 32-byte public-key encoding `Aenc` and
signature point encoding `Renc` undergo strict decode: encoded `y < p`; when
decoded `x = 0` the sign bit is zero; the point is on the Edwards25519 curve;
re-encoding is byte-identical; the point is not the identity; `[L]P` is the
identity; and `[8]P` is not the identity. This rejects identity, all small-order
or mixed-torsion points, noncanonical `y`, and noncanonical sign encodings.
Signature scalar `S` is the little-endian integer in bytes 32..63 and must
satisfy `0 <= S < L`. Verification then requires the uncofactored equation
`[S]B = R + [SHA-512(Renc || Aenc || M) mod L]A`. Any failed decode, subgroup
check, scalar check, equation, or arithmetic overflow is invalid.

The production authority decision is made by a reviewed, source-bound strict
verifier implementing the preceding profile. A CryptoKit or Security.framework
success is never sufficient: current platform verifiers may accept the
`A=identity, R=identity, S=0` universal forgery. If platform verification is
retained as defense in depth, it occurs only after strict verification and both
must return true. No undeclared/private Security data symbol, `dlsym`, synthesized
CFString algorithm name, fallback algorithm, or SDK-dependent acceptance rule is
permitted in the production authority path. Gate B vectors include RFC 8032
positive cases and negatives for identity and every low-order `A/R`, mixed
torsion, noncanonical `y`/sign, `S=L`, `S+L` malleation, ctx/ph mismatch, wrong
message/domain, and the identity universal forgery; both independent decoders
and the production verifier must agree.

## 6. Canonical sealed plan: `HMG4N2`

The payload contains exactly:

```text
0x1101 protocol_spec_sha256       SHA256
0x1102 plan_version               U32, exactly 2
0x1103 release_id                 BYTES, exactly equal policy `1023`
0x1104 expected_root_identity     STRUCT RootIdentity
0x1105 approved_bundle_sha256     SHA256
0x1106 path_allowlist_sha256      SHA256
0x1107 predecessor_set_sha256     SHA256
0x1108 desired_set_sha256         SHA256
0x1109 acceptance_effect_mask     U64, exactly zero
0x110a entry_count                U32, exactly 114
0x110b entries                    LIST Entry, exactly 114
0x110c forward_vector_sha256      SHA256
0x110d forward_transition_count   U32
0x110e full_rollback_sha256       SHA256
0x110f full_rollback_count        U32
0x1110 xattr_policy_bindings_sha256 SHA256
0x1118 xattr_policy_binding_count U32, 1..114
0x1119 xattr_policy_bindings      LIST XattrPolicyBinding, exact count;
                                      every member purpose 1
```

The plan is deterministic and contains no timestamp, nonce, host name, or
absolute build path. Summary hashes/counts are independently recomputed. Plan,
policy, request, bundle, and derived-kind fields have no precedence rule: every
copy must agree. HMG4N2 is static authority whose complete hash is transitively
root-authorized only because signed policy `1005` equals it; HMG4N2 itself has
neither a signature nor a policy-hash field. It is not a reproducible-build
receipt and not the output of a runtime-authoritative planner. Tags
`1111..1117` are unassigned and forbidden. If repository tooling
helps an owner construct a candidate plan, that tooling and its logs are
non-authoritative review aids; the independent review inspects the complete
canonical HMG4N2 bytes, and policy `1005` fixes their complete object hash.
No planner executable hash, source manifest, invocation, environment, or
partial input list can bootstrap, replace, or claim reproduction of the plan.
`1110` is kind 16 over `1119`, `1118` agrees, and the list is byte-identical to
policy `1018`.

## 7. Canonical xattr policy: `HMG4Y2`

The payload contains exactly:

```text
0x7001 protocol_spec_sha256       SHA256
0x7002 xattr_policy_version       U32, exactly 2
0x7003 enforcement_mode           U32, exactly 1 exact-set
0x7004 attribute_count            U32, 0..64
0x7005 attributes                 LIST XattrRule, same count
0x7006 canonical_xattr_set_sha256 SHA256
0x7007 maximum_name_length        U32, exactly 127
0x7008 maximum_value_length       U64, exactly 4,096
0x7009 maximum_total_value_length U64, exactly 65,536
0x700a maximum_stream_length      U64, exactly 524,288
0x700b exact_empty_set            BOOL, true iff count zero
0x700c acceptance_effect_mask     U64, exactly zero
```

`XattrRule` contains `7101 ordinal U32`, `7102 name BYTES 1..127`, and
`7103 value BYTES 0..4096`. Rules sort strictly by unsigned name bytes; ordinal
is contiguous; duplicate names, NUL names, normalization, wildcard, prefix,
ignored namespace, merge, overwrite, and volatile exceptions are forbidden.
Before allocation, hashing, comparison, or any fixture mutation, checked U64
arithmetic proves `sum(byte_length(7103)) <= 7009` and
`byte_length(complete canonical HMG4X2 stream) <= 700a`; overflow rejects.
`7006` is recomputed over that exact complete predecessor HMG4X2 stream. The
per-value, aggregate-value, and complete-stream bounds each receive exact-max,
max-plus-one, and one-sided field/payload relationship vectors; an unreachable
declared maximum uses case kind 8 and is never mislabeled semantically valid.
Entry/BundleEntry xattr-policy hashes bind the complete `HMG4Y2` object;
`FinalEntry.xattr_set_sha256` equals `7006`, not the policy-object hash. Finder,
resource-fork, quarantine, and other xattrs are either exact listed values or
unexpected blockers; none is silently ignored.

### 7.0 Privileged fixture owner authorization: `HMG4L2`

HMG4L2 is the only object that can activate profile 2. It is an owner-signed,
single-use authorization for one exact disposable offline fixture ceremony; it
has no protected-install, original-runtime, production apply/recover,
acceptance, promotion, or publication effect. Its payload is exactly:

```text
0x8101 protocol_spec_sha256       SHA256
0x8102 production_policy_sha256   SHA256
0x8103 profile2_f2_unsigned_target_sha256 SHA256, exact projection below
0x8104 fixture_scope              U32, exactly 1 target
0x8105 fixture_nonce              BYTES, exactly 32, nonzero
0x8106 fixture_root_identity      STRUCT RootIdentity, equal policy `103d`
0x8107 fixture_parent_identity    STRUCT DirectoryIdentity, equal policy `103e`
0x8108 setup_actor_sha256         SHA256, equal policy `1047`
0x8109 denial_authorization_set_sha256 SHA256, equal F2 `7921`
0x810a issued_at_unix_seconds     U64
0x810b expires_at_unix_seconds    U64
0x810c disposable_offline_environment BOOL, exactly true
0x810d single_use                 BOOL, exactly true
0x810e production_authority_effect_mask U64, exactly zero
0x810f acceptance_effect_mask     U64, exactly zero
0x8110 owner_identity_sha256      SHA256, derived kind 34
0x8111 owner_identity             STRUCT ActorIdentity, kind 2 with bit 16
0x8112 authorization_statement_sha256 SHA256, derived kind 43
0x8113 signature_algorithm        U32, exactly 1 Ed25519
0x8114 detached_signature         BYTES, exactly 64
0x8115 environment_profile        U32, exactly 1 disposable-offline-no-network
0x8116 original_runtime_launch_allowed BOOL, exactly false
0x8117 protected_install_allowed  BOOL, exactly false
0x8118 production_apply_or_recover_allowed BOOL, exactly false
```

The HMG4L2 target projection is SHA-256 of one canonical profile-2 HMG4F2
payload encoded with its ordinary TLV framing but omitting exactly the F2
attestation/signature tags `7919..791b` and the owner-authorization embedding
tags `7924..7926`. It includes every other F2 field, including policy/helper,
scope, root/parent/mount, nonce, validity, signer/setup actors, complete 90-row
kind-82 denial authorization set, metadata policy, and zero-effect masks. The
projection has no successor object header and no omitted placeholder tags;
changing any included byte changes `8103`. HMG4L2 is issued first, then embedded
byte-for-byte into the final F2, avoiding a hash cycle.

`8110` is kind 34 over `8111` and equals policy `1049/104a`. The unsigned HMG4L2
payload omits `8112..8114`; kind 43 signs its magic, kind 1, unsigned-payload
SHA-256, owner hash, a nonce byte-identical to `8105`, and `810a/810b`.
`810a < 810b`, maximum lifetime is 900 seconds, and every claim/setup/attempt
must finish before `810b`. Checked multiplication by 1,000,000,000 produces
`l2_start_ns` and `l2_end_ns`; overflow blocks, and every recorded claim/setup/
attempt nanosecond lies in the half-open interval `[l2_start_ns,l2_end_ns)`.
The owner signature is verified independently of the
bit-1 F2 issuer; neither key can substitute for the other. Runtime requires
`F2.7924 == SHA256(F2.7926)`, `7925 == length(7926)`, a complete canonical
HMG4L2 with no trailing byte, and exact equalities from `8101..8109` to the F2
and policy. A signed F2 with no HMG4L2, a different owner/SPKI, an expired or
replayed HMG4L2, or any allowed-effect bit is ineligible for execution.

This contract only freezes the HMG4L2 grammar. Under the authority current when
this successor is authored, no HMG4L2 may be generated, signed, or consumed and
no profile-2 process may launch. A later owner grant must name the disposable
offline environment and exact target projection; it does not expand to any
production or original-runtime action.

#### 7.0.1 Build-signing owner authorization: `HMG4L2` kind 2

Header kind 2 is a different owner action from the kind-1 fixture ceremony. It
authorizes exactly two deterministic private-key uses against two already-fixed
workspace lane targets and nothing else. Its canonical payload is:

```text
0x8c01 protocol_spec_sha256       SHA256
0x8c02 pre_sign_policy_projection_sha256 SHA256, derived kind 137; never the
                                      not-yet-constructible final HMG4P2 hash
0x8c03 gate_a_review_report_sha256 SHA256, equal policy `1041`
0x8c04 build_controller_actor_sha256 SHA256, equal policy `1054`
0x8c05 build_controller_actor     STRUCT ActorIdentity, equal policy `1055`
0x8c06 complete_source_manifest_sha256 SHA256, derived kind 21
0x8c07 toolchain_set_sha256       SHA256, derived kind 22, exact eight members
0x8c08 lane_a_root_identity_sha256 SHA256, derived kind 15 identity kind 2
0x8c09 lane_a_root_identity       STRUCT CanonicalIdentityMember, kind 2
0x8c0a lane_b_root_identity_sha256 SHA256, derived kind 15 identity kind 2
0x8c0b lane_b_root_identity       STRUCT CanonicalIdentityMember, kind 2
0x8c0c signing_target_set_sha256  SHA256, derived kind 127
0x8c0d signing_target_count       U32, exactly 2
0x8c0e signing_targets            LIST SigningAuthorizationTarget, exact count
0x8c0f signing_key_custody_sha256 SHA256, derived kind 124
0x8c10 signing_key_custody        STRUCT SigningKeyCustodyIdentity
0x8c11 signing_tool_identity_sha256 SHA256, complete BuildToolIdentity bytes
0x8c12 signing_tool_identity      STRUCT BuildToolIdentity
0x8c13 independent_verifier_identity_sha256 SHA256, complete BuildToolIdentity bytes
0x8c14 independent_verifier_identity STRUCT BuildToolIdentity
0x8c15 signing_profile_sha256     SHA256, exact canonical nested STRUCT bytes
0x8c16 signing_profile            STRUCT SigningProfile
0x8c17 authorization_nonce        BYTES, exactly 32, nonzero
0x8c18 issued_at_unix_seconds     U64
0x8c19 expires_at_unix_seconds    U64
0x8c1a disposable_offline_environment BOOL, exactly true
0x8c1b single_use                 BOOL, exactly true
0x8c1c authorized_private_key_use_count U32, exactly 2
0x8c1d key_generation_allowed     BOOL, exactly false
0x8c1e key_import_allowed         BOOL, exactly false
0x8c1f key_export_allowed         BOOL, exactly false
0x8c20 network_allowed            BOOL, exactly false
0x8c21 protected_install_allowed  BOOL, exactly false
0x8c22 original_runtime_launch_allowed BOOL, exactly false
0x8c23 production_apply_or_recover_allowed BOOL, exactly false
0x8c24 acceptance_effect_mask     U64, exactly zero
0x8c25 owner_identity_sha256      SHA256, derived kind 34, equal policy `1056`
0x8c26 owner_identity             STRUCT ActorIdentity, kind 2 bit 20,
                                         equal policy `1057`
0x8c27 authorization_statement_sha256 SHA256, derived kind 43
0x8c28 signature_algorithm        U32, exactly 1 Ed25519
0x8c29 detached_signature         BYTES, exactly 64
0x8c2a target_execution_order     U32, exactly 1 lane A then lane B
0x8c2b production_authority_effect_mask U64, exactly zero
0x8c2c gate_a_review_report_length U64, 1..16,777,216
0x8c2d gate_a_review_report       STRUCT ReviewedObjectMember, role 9,
                                      binding 2, exact held report
0x8c2e maximum_future_skew_seconds U64, exactly 60
0x8c2f maximum_realtime_backward_tolerance_nanoseconds U64,
                                      exactly 60,000,000,000
0x8c30 fresh_consumer_clock_anchor_required BOOL, exactly true
0x8c31 durable_claim_before_key_access_required BOOL, exactly true
0x8c32 clock_policy_profile       U32, exactly 1 claim-side paired sample
0x8c33 clock_policy_result        U32, exactly 1
0x8c34 consumption_claim_parent_identity_sha256 SHA256, derived kind 15,
                                      identity kind 2, equal policy template
0x8c35 consumption_claim_parent_identity STRUCT CanonicalIdentityMember,
                                      kind 2, equal workspace build parent
0x8c36 consumption_claim_leaf    BYTES, exactly 90, exact Section-4 PathComponent
0x8c37 consumption_claim_template_sha256 SHA256, SHA-256 of `8c39`
0x8c38 consumption_claim_template_length U64, exactly 426
0x8c39 consumption_claim_template_bytes BYTES, exact `8c38`
0x8c3a consumption_claim_binding_profile U32, exactly 1 acyclic prospective
0x8c3b pre_sign_policy_projection STRUCT PreSignPolicyProjection
0x8c3c pre_sign_policy_statement_sha256 SHA256, derived kind 138
0x8c3d pre_sign_policy_statement  STRUCT PreSignBuildPolicyStatement
0x8c3e policy_root_identity_sha256 SHA256, equal projection `8f30`
0x8c3f policy_root_identity       STRUCT ActorIdentity, kind 2 bit 0,
                                      equal projection `8f31`
```

`8c08/8c0a` are kind 15 over `8c09/8c0b`; both roots equal the two
BuildInvocations and are pairwise distinct beneath the held workspace build
parent `8c34/8c35`. Derivation computes `8c0f` first as kind 124 over the
complete acyclic `8c10` custody identity. Each of the two target members then
requires `8b19 == 8c0f`; only after both complete targets exist is `8c0c`
computed as kind 127 over `8c0e`, with `8c0d=2`. Target 0 is lane A/root A and
target 1 lane B/root B. No target hash occurs in `8c10` or its `61bc`
pre-attribute statement. Every complete target preimage, held
artifact identity, retained-client readiness identity, signer, key, profile,
source manifest, toolchain, specification, and Gate-A report is already final
when the owner signs. That custody identity has
exactly one common retained stage-4 signing client which will perform both calls
against one continuously live opaque `SecKeyRef`. Its preauthorization member
proves only readiness and live retention at target freeze; it does not assert
future survival or successful use. `8c11/8c13/8c15` hash the exact canonical
nested `8c12/8c14/8c16` bytes. Signer and verifier executable/payload identities
are different and equal toolchain roles 5 and 6.

Signer and key equalities are all-sided. For both targets and both transcripts,
`8b18 == 8e29 == 61d6 == 8c11 == SHA256(exact canonical 8c12) ==` the complete
BuildToolIdentity hash of toolchain role 5. For both targets and both
transcripts, `8b19 == 61d5 == 8c0f == U2.6054 ==` kind 124 over byte-identical
complete `8c10/U2.6055` custody bytes. U2 `6059/605b` equals `8c0c/8c0e`, and
the actual lookup observation `8dc5/8dc6` equals the prospective canonical
query hash/bytes committed inside `61bc`. A hash label never substitutes for
the held complete tool or custody bytes. Gate B mutates each equality one side
at a time, swaps signer A/key B, and rejects any dependency edge from `8c0c`
back into custody.

`8c02` is kind 137 over complete `8c3b`. Version 2 is a full prospective P2
transform, not a list that silently drops output-dependent containers. Exact
`8f24` begins with the eight ASCII bytes `HMG4PST1`, BE32 version 1, BE32
top-level count 87, and BE32 hole count `8f3b`, followed by exactly 87 root
nodes for P2 tags `1001..1057` in numeric order. A node is encoded as U8 node
kind (1 literal, 2 container, 3 hole), U8 edge kind (1 schema tag, 2 LIST member
ordinal), two zero bytes, BE32 edge value, BE32 source tag (zero only for a
LIST-member wrapper), and BE32 canonical source-type code. That source-type
code is exactly the predecessor/successor one-byte wire type `0x01..0x10`
zero-extended to BE32 (upper 24 bits zero); a LIST-member wrapper uses
source-tag zero and source-type `0x00000007` STRUCT. No separate projection-
local type numbering exists. A literal then has
BE64 byte length and the exact complete canonical TLV or LIST-member STRUCT
bytes. A container has BE32 child count and that many recursively encoded nodes
in canonical tag/member order. A hole has only BE32 hole ordinal. There is no
padding, trailing byte, alternate node form, or unknown kind.

The transform is canonical and preserves every non-output byte and structural
choice. A STRUCT container's children are every nested TLV in increasing tag
order. A LIST container's children are every member in increasing encoded U32
ordinal order; each member wrapper then exposes its nested STRUCT tags in
increasing order. Edge kind, edge value, source tag, and source type must agree
with that parsed position. A subtree with no hole must be one literal node; a
subtree with a hole must be one container whose complete immediate child set is
represented, and a
hole node may replace only one marked scalar/BYTES/STRUCT leaf. Tree depth is
at most 64, total node count at most 262,144, and hole count at most 4,096. Each
hole ordinal occurs once and maps one-to-one to `8f3d`; registry paths start
with a top-level tag step, then use exact nested-tag and LIST-ordinal steps,
are sorted by their canonical step encoding, and are duplicate- and prefix-free.
`8f3c` hashes the complete canonical LIST value, not labels or prose.

The output-dependency marking algorithm is a closed fixed point over the
normative P2 field graph. Direct roots are `1004`; `102e`; complete `103b`;
the unique bit-10 runtime-helper actor's `6f05` and complete `6f0b` inside
`102a`; final policy-statement hash `1034`; and detached signature `1036`.
It then marks every derived-hash leaf whose required preimage directly or
transitively contains a marked value, repeating until no new leaf is found.
The expected top-level hole-bearing set is exactly
`{1004,1015,1027,102a,102b,102e,1031,1034,1036,103b,104f,1051}`; the other
75 top-level nodes are literals. Within those containers the fixed point covers
the bit-10 actor hash, every affected `ProtectedParent` writer-set/child-parent
hash, every affected quiescence authority binding and kind-28 set hash, and the
managed-root writer rule/set hash, while retaining all nondependent fields.
Any thirteenth top-level hole-bearing tag, missing member of this set, new
dependency edge, or unresolved derived preimage requires a successor contract.
The dependency audit traverses all 87 top-level TLVs and every nested normative
hash/equality edge, not only field names. In particular literal plan `1005`,
bundle `1006`, Gate-A report `1041`, launcher `103a`, source/toolchain inputs,
and every reviewed-object locator must be fully fixed before build signing and
must contain no final-helper, final-P2, U2, or derived-output dependency. If
their held bytes introduce one, the exact twelve-tag closure fails closed.

This model deliberately keeps `1014` literal. `WriterIdentity.240b` is the
pre-existing approved launcher code identity, not the future helper
`ExecutableCodeIdentity`; `240a` binds the frozen launcher configuration.
Consequently each `1032.4704` is kind 15 over that output-independent `1014`,
and `102c` over `1032` is also literal. Likewise constant signature algorithm
`1035=1` is literal even though `1034/1036` are holes. Treating `1014`,
`102c/1032`, or `1035` as a helper-output substitute is invalid.

The prospective transform is constructed before either signing call from the
complete policy template plus explicit holes. After the helper exists, the
verifier parses final P2, reruns the same marking/encoding algorithm, and
requires byte-identical `8f24`, `8f25`, and `8f3b..8f3e`. Every filled hole is
then independently checked: `1004` is SHA-256 of U2 helper bytes `6007`;
`103b` is byte-identical to U2 `6017` and `102e` is kind 15 over it; the unique
bit-10 actor's `6f05/6f0b` equal `102e/103b`; every transitive hash is
recomputed from its final canonical preimage; and `1034/1036` are the exact
kind-51 statement hash and strict Ed25519 signature under literal `1033/1035`.
A hole never authorizes an arbitrary fill.

`8f23` has the exact contract cap 16,777,216 bytes. Construction and
verification stream with one fixed buffer of at most 1 MiB and a bounded
64-level traversal stack; they never allocate from a claimed length. This cap
does not promise that every maximum-size P2 can be pre-authorized: the outer
HMG4L2 16-MiB payload cap remains conjunctive, and overflow of either cap blocks
authorization rather than truncating, substituting a hash, or externalizing a
node. Mandatory vectors cover every node/header integer and cap boundary;
literal-byte mutation; missing/extra/reordered node or hole; duplicate/prefix
path; literal-as-hole and hole-as-literal; wrong dependency class/hash kind;
wire-type value, nonzero upper type byte, LIST-wrapper type/tag, child edge
kind, tag order, or LIST ordinal mismatch;
second or absent bit-10 actor; stale transitive hash; wrong direct fill; literal
`1014/102c/1032/1035` mutation; recursion/node/hole limits; and a final P2 whose
recomputed prospective transform differs by one byte.

The pre-sign projection cannot authorize itself. `8c3c` is kind 138 over
`8c3d`; its detached Ed25519 signature is verified by the offline policy-root
SPKI in `8c3f`, which is the same SPKI already embedded in the reviewed helper
source and later in final P2 `1033`. The signed statement binds the projection,
bit-20 owner, build controller, complete source manifest, all eight tool
identities, both targets, held Gate-A report, and zero acceptance/production
effects. The owner signature on HMG4L2 is independent and both signatures must
pass. A bit-20 signature without the policy-root pre-sign statement, or a
policy-root statement without the bit-20 owner signature, grants no key use.
Exact cross-equalities are mandatory: `8c01 == 8c3b.8f26`, `8c03 ==
8c3b.8f2b`, `8c04 == 8c3b.8f32`, `8c05` is byte-identical to `8c3b.8f33`,
`8c06 == 8c3b.8f2d`, `8c07 == 8c3b.8f2e`, `8c0c == 8c3b.8f2f`, `8c0f ==
8c3b.8f39`, `8c10` is byte-identical to `8c3b.8f3a`, `8c25 ==
8c3b.8f34`, `8c26` is byte-identical to `8c3b.8f35`, and `8c3e/8c3f` equal
`8c3b.8f30/8f31`. `8c3d.8f40 == 8c0f`; every `8f42..8f4b` repeats the corresponding projection
value; a one-sided locally valid mutation rejects the whole authorization.

The pre-sign statement signature preimage is exact and noncircular. Let `U` be
the canonical nested STRUCT bytes for tags `8f40..8f4c` in numeric order,
including each TLV header and value and omitting only signature `8f4d` and
post-verification result `8f4e`. The Ed25519 message is the eight ASCII bytes
`HMG4PSA1`, BE32 value 1, BE64 `length(U)`, and exact `U`, with no NUL,
delimiter, normalization, or hash substitution. `8f4d` is strict Ed25519 over
that exact message under `8f43/8c3e`; noncanonical points/scalars, trailing
bytes, alternate domain text, tag reordering, or signing the final kind-138
hash fail. Only after verification is `8f4e=1` encoded. Kind 138 hashes the
complete finished statement including signature/result and is never its own
signature preimage.

`8c2c == 8c2d.7d44`, `8c03 == 8c2d.7d45 == 8c3b.8f2b`, and `8c2d` is the
exact held role-9/binding-2 Gate-A report, not a hash label. Its locator,
ProtectedFileIdentity, complete bytes, and before/after stable scans are
reopened at admission. `8c34` is kind 15 over `8c35`; `8c35` equals the
projection's workspace build parent and later U2 `6041`/final P2 `1046`.
`8c36` is exactly ASCII `build-sign-consumed-` followed by lowercase hex of all
32 `8c17` nonce bytes and `.claim`. `8c39` is the acyclic prospective template:
ASCII `HMG4BCT1`, BE32 version 1, `8c01`, `8c02`, `8c03`, `8c06`, `8c07`,
`8c0c`, `8c0f`, `8c10.61b4`, `8c34`, the length and exact bytes of `8c36`, and
`8c17`, in that order. The `8c36` length is exactly one big-endian U32 before
its 90 bytes; therefore the total is exactly
`8 + 4 + (9 * 32) + 4 + 90 + 32 = 426` bytes. BE64, little-endian, omitted,
duplicated, or mismatching length encodings are invalid and are mandatory
one-byte/width/endian vectors. It intentionally cannot contain the not-yet-known
complete HMG4L2 hash or future claim inode. The later durable claim contains
this template hash and the complete HMG4L2 hash, closing the acyclic edge.

The unsigned payload omits only `8c27..8c29`. Kind 43 signs HMG4L2 magic, header
kind 2, SHA-256 of that complete unsigned payload, owner kind-34 hash, `8c17`, and
`8c18/8c19`. The owner SPKI and strict Ed25519 verification are policy-bound.
Validity is half-open, `issued < expires`, and lifetime is at most 900 seconds.
The owner-signed payload contains only the `8c2e..8c33` clock policy, never a
purported future consumer sample. Immediately after complete read-only
admission, the consumer takes the Section-15 build-sign admission guard's named
pre-claim pair `build_claim_anchor`, abbreviated `B0`, and stores its boot UUID,
realtime-second, and monotonic-nanosecond values in claim observation
`8d96..8d98`. `B0` first passes the common relation against that admission
operation's true initial `G0`; it does not redefine or replace `G0`. Checked
arithmetic derives `8d99 = 8d98 + max(0, 8c18 - 8d97) * 1,000,000,000` and
`8d9a = 8d98 + (8c19 - 8d97) * 1,000,000,000`; `8d97 < 8c19`, `8c18 <=
8d97 + 8c2e`, `8d99 < 8d9a`, and `8d9b == 8c2f` are mandatory. Controller,
retained client, claim parent, all executions, calls, and U2 remain in `8d96`'s
boot session. No Unix-second value is directly compared to a monotonic-
nanosecond value and no owner-signed monotonic value is trusted.

Admission then performs two complete stable namespace passes, creates the one
workspace-only claim with `openat(O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW|O_CLOEXEC,
0600)`, writes and reads back the complete claim bytes, applies file `fsync`,
file `F_FULLFSYNC`, parent-directory `fsync`, and two matching post-passes while
retaining the claim FD. The claim bytes are ASCII `HMG4BCL1`, BE32 version 1,
the complete HMG4L2 hash, `8c17`, `8c37`, `8c0c`, `8c0f`, `8c10.61b4`, and
`8c34`, followed by `8d96`, BE64 `8d97`, BE64 `8d98`, BE64 `8d99`, BE64
`8d9a`, and BE64 `8d9b`, with fixed-width values and no delimiter. The claim becomes consumed
when parent `fsync` and both post-passes pass, before either private-key call.
That durable state consumes the entire authorization even after a crash, zero
calls, error, expiry, or drift; the same nonce/HMG4L2/target/key/client tuple is
never retried. Failure before durable claim creation performs no private-key
call and leaves no authorization use, but an ambiguous create/write/readback/
sync result blocks for manual workspace review and is never retried blindly.

The pre-pass lists contain every syntactically valid `build-sign-consumed-` leaf
in the held parent, bounded at 4,096, sorted by unsigned bytes, and parse every
referenced 292-byte claim. Passes 0/1 are byte-identical and require target-leaf,
nonce, and complete-HMG4L2-hash match counts all zero. Exactly one `openat` is
attempted; neither `EEXIST` nor `EINTR` is retried. After a returned FD, each
positive partial write advances one checked offset; before an interrupted write
is resumed, `lseek`/readback proves the exact already-written prefix and offset.
Any mismatch or error reserves the leaf permanently and blocks. `8d81` hashes
the exact 292 bytes specified above, `8d87` length/hash equal `8d80/8d81`, and
readback consumes byte 0 through EOF with no trailing byte. File `fsync`, file
`F_FULLFSYNC`, and parent `fsync` occur in that order. The two post-passes are
byte-identical to each other and equal the pre-pass set plus exactly `8c36`;
target-leaf, nonce, and HMG4L2-hash match counts are each exactly one. `8d7f`
and `8d8f` are kind 136 over their exact two-pass lists. The claim FD remains
open through both calls and U2 finalization. Nothing in this grammar grants
delete, cleanup, protected-parent, install, original-runtime, apply, or recovery
authority.

Before claim creation the controller may wait using monotonic-only samples
while the value is below `8d99`; a wait sample grants no key authority. Claim
creation requires `8d90 >= 8d99`. Immediately after the second matching
post-pass and before any key lookup, the controller takes the Section-15 named
post-completion pair `build_claim_completion`, abbreviated `B1`, and records
its monotonic/realtime values at `8d9d/8d9e`. `B1` passes the common relation
against the operation's true initial `G0`, remains in boot `8d96`, satisfies
`8d91 <= 8d9d < 8d9a` and `8c18 <= 8d9e < 8c19`, and yields `8d9f=1`.
Clock failure, arithmetic failure, expiry, or identity drift at `B1` leaves the
durable claim consumed and permits zero key lookup, attribute query, export
attempt, or signature call. The claim is never removed or retried.

Once `B1` passes, HMG4L2 expiry no longer revokes that exact consumed
continuation. The same retained client in the same boot and birth tuple must
perform, in order, one bounded selected-key noninteractive lookup, one complete attribute
query, one expected export-denial check, signature use 0 for lane A, independent
verification of transcript 0, and signature use 1 for lane B. The timestamps
in `607b/606c/606e/6071` prove ordering and process continuity only; they are
not a claim that a user-space pre-call sample can prevent scheduler suspension
before the Security API begins. No target/tool/key/root/client/handle change,
repeat, resume, additional lookup, or additional key use is authorized. Any
failure after the durable claim consumes the authorization and blocks; neither
call is repeated or resumed. A fresh authorization requires two fresh build
roots, targets, nonce, retained client, and claim leaf.

Under the authority current when this successor is authored, no kind-2 HMG4L2
may be generated, signed, consumed, or submitted to Apple Security and no real
keychain lookup, `SecKeyCopyAttributes`, export attempt, or private-key
operation may occur. Neither policy-root ceremony may occur under the current
authority. A future explicit owner grant must name this
exact specification/policy/Gate-A/source/toolchain/target/key/controller tuple.
Even then it authorizes only workspace build signing; it does not authorize
protected installation, original runtime, apply, recover, acceptance, promotion,
release, publication, or any profile-1 fixture action.

### 7.1 Disposable-fixture authorization: `HMG4F2`

HMG4F2 is the sole authority for mutation inside one disposable fixture root.
Profile 1 is the nonprivileged capability-test authority; profile 2 authorizes
only privileged fixture setup followed by an irreversibly privilege-dropped
denial child. It is not an EvidenceLocation object and never appears in a
production request. Profile 1 is carried byte-for-byte only inside its
resulting HMG4K2; profile 2 is carried byte-for-byte in every resulting
E2-kind-3 denial observation. Header scope 1 is target volume and scope 2 is
system-lock volume; profile 2 permits only scope 1. Its
payload is exactly:

```text
0x7901 protocol_spec_sha256       SHA256
0x7902 production_policy_sha256   SHA256
0x7903 production_helper_sha256   SHA256
0x7904 fixture_scope              U32, equal header scope
0x7905 fixture_helper_sha256      SHA256, different from production helper
0x7906 fixture_root_identity      STRUCT RootIdentity, slot 3 for scope 1,
                                      slot 4 for scope 2
0x7907 fixture_parent_identity    STRUCT DirectoryIdentity, same selected slot
0x7908 mount_configuration        STRUCT predecessor derived-kind-4 member
0x7909 mount_configuration_sha256 SHA256, predecessor derived kind 4 over `7908`
0x790a fixture_root_relative_path CAPABILITY_FIXTURE_ROOT_REL_PATH
0x790b fixture_nonce              BYTES, exactly 32, nonzero
0x790c requirement_vector_sha256  SHA256, derived kind 17, required profile 1,
                                      forbidden profile 2
0x790d requirement_count          U32, exactly 18 scope 1 or 5 scope 2,
                                      required profile 1, forbidden profile 2
0x790e requirements               LIST CapabilityRequirement, exact count,
                                      required profile 1, forbidden profile 2
0x790f issued_at_unix_seconds     U64
0x7910 expires_at_unix_seconds    U64
0x7911 single_use                 BOOL, exactly true
0x7912 disposable_only            BOOL, exactly true
0x7913 no_delete                  BOOL, exactly true
0x7914 no_path_conversion         BOOL, exactly true
0x7915 production_authority_effect_mask U64, exactly zero
0x7916 acceptance_effect_mask     U64, exactly zero
0x7917 signer_identity_sha256     SHA256, derived kind 34
0x7918 signer_identity            STRUCT ActorIdentity, kind 2 with bit 1
0x7919 evidence_attestation_statement_sha256 SHA256, derived kind 57
0x791a signature_algorithm        U32, exactly 1 Ed25519
0x791b detached_signature         BYTES, exactly 64
0x791c claim_metadata_policy      STRUCT RoleMetadataPolicy, object role 19
0x791d claim_derivation_profile   U32, exactly 1 Section 7.1
0x791e fixture_helper_actor_sha256 SHA256, derived kind 34
0x791f fixture_helper_actor       STRUCT ActorIdentity, kind 3 with bit 14
                                      profile 1 or bit 15 profile 2
0x7920 fixture_authorization_profile U32: 1 capability K2, 2 access-denial E2
0x7921 denial_authorization_set_sha256 SHA256, derived kind 82,
                                      required profile 2, forbidden profile 1
0x7922 denial_authorization_count U32, exactly 90 profile 2, forbidden profile 1
0x7923 denial_authorizations      LIST AccessDenialFixtureAuthorizationMember,
                                      exact count, required profile 2,
                                      forbidden profile 1
0x7924 profile2_owner_authorization_sha256 SHA256, complete HMG4L2,
                                      required profile 2, forbidden profile 1
0x7925 profile2_owner_authorization_length U64, 56..1 MiB plus 56,
                                      required profile 2, forbidden profile 1
0x7926 profile2_owner_authorization_bytes BYTES, exact `7925`, 56..1,048,632;
                                      required profile 2, forbidden profile 1
0x7927 fixture_session_nonce      BYTES, exactly 32 nonzero, required profile 2,
                                      forbidden profile 1
```

Profile 1 is the only profile embeddable in HMG4K2. For profile 1, scope 1
`7906/7907/790c/790e` are byte-identical to policy
`103d/103e/1024/102f`; for scope 2 they equal `103f/1040/1025/1030`, and
`7921..7923` are forbidden. Profile 2 has scope exactly 1,
`7906/7907 == policy 103d/103e`, forbids `790c..790e`, and requires
`7921..7926`; it is consumed only by E2-kind-3 denial-fixture observations and
is never embeddable in K2 or any production request.
For profile 2, `7924 == SHA256(7926)`, `7925 == length(7926)`, and `7926` is
the one complete passing HMG4L2 described in Section 7.0. Its target projection,
nonce, root/parent, setup actor, matrix hash, policy, time, owner identity, and
zero-effect fields all cross-equal this F2. Profile 1 forbids `7924..7926`.
The bit-1 F2 signature and bit-16 owner signature are both mandatory and
cryptographically distinct; neither authorizes the other role.
For profile 2, `7921` is kind 82 over `7923`; `7922 == 90`. The members are the
exact role/operation/scenario matrix in Section 8.4 and sort by that key.
`7f85 == 7f83`; `7f86/7f87` equal the exact attempt-count/errno tables;
`7f88` is SHA-256 of the complete canonical nested `7f89`; and every member
uses one byte-identical nonzero-UID denial credential that matches no policy
actor/writer. `7f8a` is kind 84 over `7f8c`; target roles, types, composite
rights, variant masks, and immutable preconditions equal the Section-8.4 iff
matrix. `7f8d` is kind 89 over `7f8f`; `7f8e == 7f86`, and there is one exact
DenialSyscallArgumentProfile for each attempt ordinal. An executed attempt's
`7f6c == 7f61`; `7f6b` is SHA-256 of the exact canonical nested `7f6d`, and
that STRUCT is byte-identical, including its original ordinal, to the unique
F2 `7f8f` member selected by `7f61`. Thus no one-member kind-89 stream,
diagnostic wrapper, locally rebuilt argv, or producer-selected
flag set can substitute for the signed profile. `7f90 == 1` is the exact
irreversible-drop procedure below.

Every leaf component is deterministic without a self-hash cycle. Let `R` be
one ASCII byte `s` for source/subject or `d` for destination and let `T` be
ASCII `HMG4LEF2`, followed by raw F2 `790b`, then big-endian U32 subject role,
operation, scenario, attempt ordinal, fixture variant, and namespace role. The
exact component is `R`, `-`, and lowercase hex of `SHA256(T)` (66 ASCII bytes
total). It occurs in `8077` or `8079`, the matching
DenialNamespaceObservation `7fdf`, and, for path-based operations 1..6, the
actual FD-relative syscall argument. For FD-only operations 7..11 it instead
names the setup-created subject leaf whose retained FD is bound by the
SyscallFDArgumentObservation; it is not falsely described as an `fchmod`,
`fchown`, `fchflags`, `acl_set_fd`, or `fsetxattr` pathname argument.
All such components are unique across the 90-row F2; a collision blocks the
authorization before signing.

The argument-profile matrix is iff. Fields not named for a row take their one
schema sentinel: absent parent role zero, absent leaf empty, absent mode/UID/
GID/options all-ones, absent position U64 all-ones, and absent payload/name
zero-length. `8082` is zero except operation 9 variant 4. `8084` is the exact
row errno, and `8085` selects the one complete SDK ABI binding for `8075`.

```text
op/scenario variant  8075 symbol       source/destination and exact values
1/0         1        openat            dst retained subject dir 2/leaf; flags O_WRONLY|O_CREAT|O_EXCL; mode 0600
1/0         2        mkdirat           dst retained subject dir 2/leaf; flags 0; mode 0700
2/1         1 or 2   renameatx_np      src attempt parent 1/leaf; dst retained subject dir 2/leaf; RENAME_EXCL
2/2         1        renameatx_np      src retained subject dir 2/leaf; dst attempt parent 1/leaf; RENAME_EXCL
3/0         1 or 2   unlinkat          src parent 1/leaf; flags 0 ordinary, AT_REMOVEDIR directory
4/0         1        linkat            src parent 1/leaf; dst parent 1/leaf; flags 0
5/0         1        openat            src parent 1/leaf; flags O_WRONLY|O_NOFOLLOW
6/0         1        openat            src parent 1/leaf; flags O_WRONLY|O_TRUNC|O_NOFOLLOW
7/0         1        fchmod            subject FD role 2; mode 0600
8/0         1        fchown            subject FD role 2; uid/gid equal denial effective IDs
9/0         3        fchflags          subject FD role 2; target flags UF_NODUMP
9/0         4        fchflags          subject FD role 2; precondition UF_IMMUTABLE; target flags 0
10/0        1        acl_set_fd        subject FD role 2; payload exact replacement HMG4A2 stream
11/0        1        fsetxattr         subject FD role 2; name user.hmg4-denial; payload one byte 00;
                                         position 0; options 0
```

The permitted-variant mask is equally closed: operations 1/0 and 2/1 admit
only variants 1 and 2; 2/2 admits only variant 1; operation 3 admits only
variant 2 for directory roles 1/2 and only variant 1 for file roles 3..10;
operation 9 admits only 3 and 4; every other row admits only 1. `8074`, `7f71`,
and `7fa5` encode that same iff choice. `807b` stores a mode as a zero-extended
unsigned-16 `mode_t`; the openat/O_CREAT call passes its signed-32 default
argument promotion, while mkdirat/fchmod receive nominal `mode_t`.

Operations 7..11 acquire their subject FD during privileged setup with exact
`O_RDONLY|O_NOFOLLOW` in `8083`, then the dropped child receives only that
retained FD; their `8077` still contains the exact setup-created subject leaf
for namespace/FD provenance, while the FD-only syscall itself receives no path.
All other rows have `8083=0`. Operations 5/6 place their actual
open flags in `807a` and must fail before a writable FD exists. For operation
10, `807e/807f` are the exact length/bytes of one canonical predecessor HMG4A2
ACL stream; for operation 11 `8087` is exact ASCII `user.hmg4-denial` and
`807e/807f` are one byte `00`. Every other row has empty `8087`. The SDK-bound
numeric values, ABI widths, pointer constness, and return convention must equal
the same SDKIdentity; ambient host header values or textual flag names are not
arguments.

`7f7c` is kind 91 over `7f7e`, and `7f7d` is one for a one-dirfd or one-file-FD
call and two for rename/link. Every `80e4` hashes the unique complete child FD
record in `7fc5`; `80e3` equals that record's numeric FD. Exactly,
`80e6 == 80ea == 80eb ==` that record's `80d7`, and `80e7` is byte-identical
to its `80d8`. Those fields describe the actual syscall FD and never silently
change meaning to the leaf reached through a dirfd.

For operation 10 only, `7f7f` is derived kind 119 over the complete canonical
`7f80`; every other operation forbids both fields. Exactly,
`8862 == SHA256(7f6d.807f)`, `8863 == 7f6d.807e`, and `8864` is byte-identical
to `7f6d.807f`. `8867 ==` enclosing observation `7f27`; `8868` equals the
kind-90 `4f30` of that exact SDKIdentity, and `8869` equals its kind-117
`4f3d`. `7f6d.8085` hashes the exact ordinal-22/profile-23 `acl_set_fd`
SDKABIBinding in the same `4f32`; no ACL call may select a declaration from a
different SDKIdentity.

The operation-10 `7f7e` has exactly one member. Its role is source/subject,
its profile FD role is 2 retained subject, its `80e3` is the sole numeric FD
passed to `acl_set_fd`, and `80e6/80e7` equal `7f2a/7f2b`; no dirfd, pathname,
duplicate, reopened FD, or different subject is admissible. `8866` is 2 iff
that subject is a DirectoryIdentity and 1 iff it is an ordinary
ProtectedFileIdentity. `8874 == 7f68`, `8875 == 7f69`,
`887c == 7f79`, `887d == 7f7a`, and `887e <= 7f7b`; therefore the native
construction and captured EPERM are inside the one recorded syscall interval,
and all qualifier/main-ACL cleanup finishes before the after-namespace scan.
The byte-identical `7f64/7f67` and `7f74/7f77` remain the authoritative target
and namespace no-effect proof; kind 119 cannot replace or weaken either.

The FD/target relation is closed without equating hashes from different
canonical domains. For every non-sentinel `80e8`, `80ed` equals the selected
AuthorizationTargetEvaluation `78c3` and `80ee` is byte-identical to `78c4`.
Independently, `80e9` selects one DenialNamespaceObservation and `80ef` equals
only that observation's kind-58 `7fd4`; `80ef` never equals the kind-15
`80ed`. The namespace parent `7fd6/7fd7` is kind-15 and is byte-identical to
the actual parent-FD `80e6/80e7` whenever the syscall argument is a dirfd; its
`7fdf` equals the selected `8077` or `8079` leaf component.

Operation 1 binds target-role-3 to the destination namespace parent and requires
the destination leaf type 0 absent. Operation 2/1 binds its source setup parent
and present source leaf without an authorization-target ordinal, while its
target-role-3 is the destination namespace parent and its destination leaf is
absent. Operation 2/2 binds target-role-2 to the source namespace parent and a
present source leaf; its destination setup parent has no target ordinal and its
destination leaf is absent. Operation 3 binds target-role-2 to the actual source
dirfd/namespace parent and target-role-1 to the present source leaf. Operation 4
binds target-role-1 to the present source leaf beneath a setup parent and
target-role-3 to the destination dirfd/namespace parent with absent destination
leaf. Operations 5/6 bind target-role-1 to the present source leaf beneath the
setup-parent dirfd. Operations 7..11 bind target-role-1 to the retained subject
FD and its present namespace leaf. A present leaf target and ObservedArtifactIdentity
do not share encoded bytes: their object type, device, inode, length, link count,
mode, UID, GID, flags, ACL hash, and xattr hash are compared field-by-field to
the corresponding held DirectoryIdentity or ProtectedFileIdentity projection;
content is rehashed where the target type carries it. Running a correct syscall
against a different FD while separately observing the intended target is
invalid.

Profile 2 is operationally privileged and is not authorized merely because its
grammar appears in this contract. Its bit-15 setup actor has real/effective/
saved UID zero and the exact policy-fixed root group vector. Creating its claim,
fixture tree, ownership, ACL, flags, or child process requires a separate,
explicit owner authorization for a disposable offline environment. The present
successor-authoring and workspace-build authority permits parser/encoder,
canonical-vector, unit, fuzz, and nonprivileged mock-fixture tests only; it does
not permit executing profile 2, changing a UID/GID/ACL/flag, or issuing a
passing E2 kind 3. Until that later authorization and resulting real evidence
exist, Gate B and every production HMG4Q2 remain blocked. No test double,
simulated errno, or schema-valid object can lift that block.

The privilege drop is one fork-without-exec sequence. `7fb2` is the bit-15
parent setup process and `7fb6 == 7fb2.7973 == policy 1048.6f0c`; `7fb3/7fb4`
identify its one child and `7fb5 == 7fb2.7972`. The child inherits the same
retained executable inode, so `7fbb == 7fb2.7974`, `7fbc == 7fb2.7975`, and
`7fbd` is the signed-Mach-O ObservedExecutableIdentity for that same inode and
CodeDirectory/entitlements. No `exec`, dynamic library injection, shell,
interpreter, alternate binary, or entitlement-bearing variant is permitted.

`7fb8` is kind 87 over exactly six `7fba` members. Their syscall codes are
exactly 1..6 in ordinal order: `setgroups` to the complete target supplementary
group vector; `setgid(target_gid)`; `setuid(target_uid)`; full child-self
credential readback; `setuid(0)` expected to fail; and `setgid(0)` expected to
fail. The target UID and all target GIDs are nonzero. Successful `setgid` and
`setuid`, called while privileged, set the real/effective/saved GID and UID
triples respectively under the target SDK/OS profile. Step 0 changes only the
supplementary-group vector; step 1 changes only the three GIDs; step 2 changes
only the three UIDs and leaves the already-fixed groups unchanged. The step-2
after credential, both sides of step 3, and every before/after credential for
steps 4/5 are byte-identical to `7fb7 ==` enclosing observation `7f2e`.

Step 3 uses child-self `getuid`, `geteuid`, `getgid`, `getegid`, a size/read
pair of `getgroups`, and `proc_pidinfo(PROC_PIDTBSDINFO)` for the same child to
bind real/effective/saved IDs; every overlapping value must agree. Steps 4/5
return `-1`, set exactly `EPERM`, and leave the complete credential unchanged.
All function declarations, structure layouts, constants, return widths, and
errno values are exact SDK ABI/mapping inputs; the target SDK's absence of any
`setresuid`/`setresgid` API is intentional and those symbols are forbidden.
`7fbe=0`, `7fbf <= 7fc0`, and the child performs every denial syscall only
after step 5 and within that interval. The parent performs setup only and never
performs a denial attempt; the child can neither reacquire privilege nor mutate
outside the held profile-2 subtree.

Before fork, the setup parent closes every FD not required for that one attempt
and sets `FD_CLOEXEC` even though exec is forbidden. The child then enumerates
all of its FD slots twice with the SDK-bound `proc_pidinfo(PROC_PIDLISTFDS)`.
Each returned descriptor type is closed: anonymous pipes are inspected with
`PROC_PIDFDPIPEINFO`, and vnodes are inspected with `PROC_PIDFDVNODEINFO` plus
`fstat`, `fcntl(F_GETFL)`, and `fcntl(F_GETFD)`. Every record's `80e0` has
`FD_CLOEXEC` set and no SDK-unknown bit. A pipe record binds the nonzero kernel pipe handle
in `80dd`, the complete normalized `PipeEndpointObservation` in `80df`, and its
kind-96 hash in `80de`; the read/write endpoint, status flags, peer handle, and
pipe status must agree in both passes. A vnode record binds `80d7/80d8` and
forbids `80dd..80df`. The exact public flavor constants, returned structure sizes,
field offsets, descriptor-type constants, return rules, and retry rules are
SDK ABI/layout inputs. Any unsupported descriptor type, short structure,
inspection error, count drift, duplicate FD, pipe-handle collision, or
identity/status drift blocks before the denial syscall.
`7fc3` is kind 92 over `7fc5`; `7fc6` is kind 95 over the two complete `7fc8`
passes, and every pass has `80f2/80f3 == 7fb3/7fb4`, the same complete record
list/count/hash, and `complete=true`.

The closed child set contains exactly three pairwise-distinct anonymous pipes
at FD 0/1/2 with roles stdin/stdout/stderr, one read-only held executable FD,
and only the read-only directory/subject FDs selected by that attempt's
DenialSyscallArgumentProfile. The claim FD, fixture-root authority FD, project/
evidence/custody/install/runtime FD, network socket, device, kqueue, Mach port,
shared-memory object, write-capable vnode FD, unknown descriptor, or extra
directory is forbidden. Stdout/stderr pipe writability is not filesystem
authority; every vnode record has access mode read-only and
`filesystem_write_capable=false`. The directory FDs are sufficient only as
relative lookup handles; DAC is still evaluated at the syscall.

Every actual FD/dirfd argument is selected through `7f7e` from this closed
inventory. `80e3/80e4/80e6/80e7/80ea/80eb` bind the actual descriptor and its
unchanged vnode. `80e8/80ed/80ee` separately bind the semantic authorization
target selected from `7f32`; `80e9` selects the corresponding
DenialNamespaceObservation and `80ef` equals that observation's exact leaf
identity hash `7fd4`. When a syscall uses a parent dirfd plus a relative leaf,
the actual descriptor identity is the held parent, while the semantic target
is the held leaf beneath that exact parent; they are intentionally different
objects and both bindings are mandatory. No integer copied from a signed
profile without this live binding is an argument observation. The parent
retains the nonce-keyed claim FD and root authority handles; they are never
inherited by a dropped child.

Target-rule metadata role 20 exists only inside profile-2 F2 and is forbidden
from policy `1017`, production Entry/FinalEntry, custody, evidence, install, or
runtime objects. Its owner UID/GID equal the bit-15 setup actor, not the denial
credential; file mode is `0600`, directory mode `0700`, ACL and xattr set are
the canonical empty values, link count is one for files, and a directory's
`6908` is the exact setup-read `st_nlink` value, at least two; object type equals
`7fa3`. A directory's actual link count is carried only in the corresponding
present `ObservedArtifactIdentity.7816`; it equals `7fa7.6908` and remains
byte-stable across both namespace scans and the syscall-bracketing observations.
`DirectoryIdentity.2208` remains flags and is never interpreted as link count.
The denial credential is neither owner nor owning-group member. Base
flags are zero; variant 4 alone requires the setup actor to set and read back
exactly `UF_IMMUTABLE` before the child attempt. `7fa5` contains exactly the
variant bits legal for that row, and `7fa8` permits only hash-derived previously
absent leaves under `790a`. No authorization member names a production path or
pre-existing inode.
`7908/7909`, the selected RootIdentity mount hash, and selected
DirectoryIdentity `220c` are one predecessor kind-4 value. The held parent is
beneath or equal to the selected root as Section 5 defines. `790a` is resolved
from that held parent, contains the selected scope text and lowercase encoding
of `790b`, and identifies the sole subtree in which the fixture helper may use
the exact requirement-vector primitives. The fixture helper may create and
modify only (a) the one profile-1 `3030` or profile-2 `7f39` claim sibling
directly in held `7907` and (b)
previously absent leaves below the nonoverlapping `790a` subtree; it has no
other sibling, rename-out,
hardlink-out, overwrite, deletion, evidence, custody, production
ProtectedParent, install, journal, receipt, authorization, or managed-output
authority. The whole disposable environment is disposed only by the external
environment owner after evidence retention; neither helper has cleanup power.

The claim metadata profile is not issuer-selectable. `791c.6901=19`,
`6902=791f.6f0c.7852`, `6903=791f.6f0c.7855`, `6904=0x00000180` (octal
`0600`), `6905=0`, `6906=policy 1037`, `6907=policy 1038`, `6908=1`, and
`6909=1` ordinary file. Before syncing the claim, the fixture executor applies
this profile through the retained FD only, reads every field back through that
FD, and rejects any mismatch. K2 `302f` is that exact readback:
`6205=791c.6908`, `6206=791c.6904`, `6207=791c.6902`, `6208=791c.6903`,
`6209=791c.6905`, `620a=791c.6906`, `620b=policy 1039.7302`, and `620c=1`.
The claim's xattr-policy object hash is `791c.6907=1038`; its observed canonical
xattr-set hash is the empty-set hash `1039.7302`. No umask-derived mode,
inherited ACL, inherited/ambient xattr, or alternate owner/group may survive
the required pre-sync FD-only application/readback; no metadata change after
that readback is admissible.

`790f < 7910`, the interval is at most 86,400 seconds, and every fixture attempt
begins and finishes within `[790f,7910)`. The signed nonce/policy is single-use.
After full read-only admission, let `fixture_now` be the realtime half of the
final paired realtime/monotonic sample immediately before claim creation;
`790f <= fixture_now < 7910`. An initial admission sample permits
`790f <= sample + 60` only as the common future-skew relation; it grants no
wait. If the final `fixture_now < 790f`, the operation returns `00020012` with
zero mutation and performs no wait, sleep, resample, or automatic retry. A
later independently started operation may retry from a fresh G0. The helper
never creates the claim before `790f`.
For profile 2 this live sample is retained in the claim-creator transcript and
is not a nonexistent K2 field. `97a1/97a2` are the exact monotonic-first/
realtime-second pair, `97a2==80c8`, `97a3=floor(97a2/1,000,000,000)` is
`fixture_now`, and `97a4=1` only after the Section-15 common clock relation
passes. The claim `80c8/80c9`, every privileged setup interval, and every
`7f78..7f7b` bracket are checked against the L2/F2 nanosecond interval;
an exact `end_ns - 1` timestamp is admitted and `end_ns` is rejected.

For profile 1, K2 `300d` equals `fixture_now`. Before any test primitive, the
helper derives the exact `3030/3032` claim leaf/content from the complete F2
hash and nonce, creates it `O_EXCL` in held `7907`, applies/readbacks `791c`,
fully syncs file and parent, and retains the FD. Existing claim means blocked;
a crash after its directory entry appears consumes the authorization forever.
Two stable protected-receipt scans must also find no earlier K2 with the same
F2 hash or nonce. A failed or incomplete test retains one nonpassing K2 and the
claim; retry requires a new F2, nonce, and fixture root.
`7917` is kind 34 over
`7918`, equals the scope-selected role-3/4 capability issuer, and uses Section
8.5's exact kind-57 signature profile with omitted tags `7919..791b`. HMG4F2
grants disposable test authority only; both authority-effect masks are zero.
`791e` is kind 34 over `791f`. Profile 1 equals policy `1042/1043`; profile 2
equals `1047/1048`. `7905 == 791f.6f0b.6401`. This exact fixture executor, and
no signer key or production helper, performs the profile-authorized setup/test
mutations.

K2 `3033` is recomputed as derived kind 71 over the sole complete `3034`.
`3034.7977=791e=policy 1042`, `7978=3006`, and `7973` is byte-identical to
`791f.6f0c`. `7974.6204=7905=3005`; `7975` and `7976` are byte-identical to
`791f.6f0b`, and their complete-file hashes equal `7974.6204`. The retained
fixture-helper FD, static-code identity, dynamic `SecCode` identity, complete
kind-97 public execution identity, and complete credential are sampled before the claim,
before and after every attempted primitive, and after the final observation.
All samples must remain byte-identical. `7971` is kind 97 over `7972`;
`7979=300d`, `797a=300e`, and
`797b=1`; every CapabilityAttempt `7a17=3033` and has
`300d <= 7a18 <= 7a19 <= 300e`, with both attempt times inside
`[790f,7910)`. In receipt test/attempt order, one attempt's finish is not after
the next attempt's start. Process restart, `exec`, public execution-identity
drift, credential/group drift, held-inode replacement,
static/dynamic code disagreement, or a missing bracketing sample blocks and
cannot yield an authority-admitted passing K2. A claim/test producer, signer,
production helper, or hash-only assertion cannot substitute for this observed
fixture-executor process.

`797c.80b1/80b2 == 7971/7972`, has actor profile 1, and its interval encloses
`7979..797a`; both projections are `0x00000301`. `7976` repeats only the
runtime-validated static ExecutableCodeIdentity fields and never carries the
dynamic status word. The same equalities apply to every profile-2 parent
executor nested through `7fb2`; the dropped child's `7fc2.80b1/80b2` equal
`7fb3/7fb4` and its interval encloses the actual denial syscall.

Profile 2 uses the same first-mutation and crash-consumption rule. Its sole
reservation leaf is `fixture-reservation-` plus lowercase hex of all 32 `790b`
bytes and `.claim`. Its exact 84 content
bytes are ASCII `HMG4DEN2`, big-endian U32 version 2, big-endian U32 profile 2,
big-endian U32 scope 1, the 32 raw F2-hash bytes, and the 32 raw nonce bytes.
The bit-15 setup parent creates this sibling with `O_EXCL` before creating or
altering any fixture-root object, applies/readbacks `791c`, syncs the file and
held parent, and retains its FD. A crash after the directory entry appears
consumes the F2 forever. Before creation, two stable read-only scans of the
protected role-12 E2 store and role-3/4 K2 stores must find no complete signed
object whose embedded F2 hash or nonce equals this one, and the held fixture
parent must contain no matching live claim. Any match or scan uncertainty
blocks without mutation.

Every one of the 90 AccessDenialFixtureObservation values has byte-identical
`7f38..7f3e`: `7f38` is SHA-256 of the one fully parsed profile-2 HMG4F2 input,
`7f39` is the exact leaf above, `7f3b=84`, and `7f3c` is the exact 84-byte
content. `7f3a.6203/6204` equal `7f3b/SHA256(7f3c)`; all its other metadata
fields equal the FD readback required by `791c`. Each nested parent executor
has `7fb2.7978 == 7f38`, and every attempt interval begins only after durable
claim creation and required privileged setup. The E2 kind-3 input set embeds
that complete F2 exactly once; a hash-only F2, another nonce, a profile-1 F2,
or ninety divergent local copies is invalid. The one passing or nonpassing
signed E2 kind 3 plus the retained claim is the permanent consumption record;
profile 2 is never consumed through HMG4K2.

`7f3d` is kind 94 over `7f3e`. Its creator `80c7` is the one bit-15 process
that won the nonce-keyed O_EXCL reservation, and `80c6` is kind 71 over that
complete process observation. `80c2/80c3/80c4/80c5` equal
`7f38/F2.7927/7f39/7f3a`; creator `7978/797f` equal `80c2/80c3`; and the
creation interval precedes every setup and attempt. The same creator retains
the claim FD through E2 finalization and sequentially forks every dropped child
without exec. All 90 observations and every nested `7fb2` repeat exactly that
creator's public execution identity, credential, actor, held/static/runtime
code, dynamic-status observation, F2 hash, and session nonce. A second setup
process, aggregation across sessions, continuation after creator exit/crash, or
attempt whose parent differs from `80c7` is invalid. Crash permanently consumes
the authorization and cannot be resumed by another bit-15 process.

## 8. Canonical evidence receipts

### 8.1 Capability receipt: `HMG4K2`

Header scope 1 is target volume; scope 2 is system-lock volume. Payload:

```text
0x3001 protocol_spec_sha256       SHA256
0x3002 production_helper_sha256   SHA256
0x3003 policy_sha256              SHA256
0x3004 capability_scope           U32, equal header scope
0x3005 fixture_test_binary_sha256 SHA256, different from production
0x3006 fixture_policy_sha256      SHA256
0x3007 issuer_identity_sha256     SHA256
0x3008 mount_configuration        STRUCT derived-kind-4 member
0x3009 mount_configuration_sha256 SHA256
0x300a tested_parent_identity     STRUCT DirectoryIdentity
0x300b tested_relative_path       CAPABILITY_FIXTURE_ROOT_REL_PATH
0x300c fixture_nonce              BYTES, exactly 32
0x300d started_at_unix_seconds    U64
0x300e finished_at_unix_seconds   U64
0x300f expires_at_unix_seconds    U64
0x3010 required_test_vector_sha256 SHA256, derived kind 17
0x3011 test_count                 U32
0x3012 tests                      LIST CapabilityTest
0x3013 retained_fixture_set_sha256 SHA256, derived kind 18
0x3014 overall_result             U32, 1 pass, 2 fail, 3 blocked
0x3015 durability_envelope        U32, exactly 2 and equal policy `1012`
0x3016 os_build_identity_sha256   SHA256, derived kind 15 identity kind 16
0x3017 sdk_identity_sha256        SHA256, derived kind 15 identity kind 17
0x3018 test_suite_source_sha256   SHA256, derived kind 21
0x3019 acceptance_effect_mask     U64, exactly zero
0x301a common_source_manifest_sha256 SHA256, derived kind 21
0x301b instrumentation_delta_sha256 SHA256, derived kind 32
0x301c production_equivalence_manifest_sha256 SHA256, derived kind 33
0x301d os_build_identity          STRUCT OSBuildIdentity
0x301e sdk_identity               STRUCT SDKIdentity
0x301f common_source_unit_count   U32, 1..1,024
0x3020 common_source_units        LIST BuildSourceUnit, exact count
0x3021 instrumentation_delta_count U32, 1..1,024
0x3022 instrumentation_deltas     LIST InstrumentationDeltaMember, exact count
0x3023 production_equivalence_count U32, exact test count
0x3024 production_equivalences    LIST ProductionEquivalenceMember, exact count
0x3025 test_source_unit_count     U32, 1..1,024
0x3026 test_source_units          LIST BuildSourceUnit, exact count
0x3027 retained_fixture_count     U32, 1..1,024
0x3028 retained_fixtures          LIST EvidenceArtifactObservation, exact count
0x3029 issuer_identity            STRUCT ActorIdentity, kind 2 with bit 1
0x302a evidence_attestation_statement_sha256 SHA256, derived kind 57
0x302b signature_algorithm        U32, exactly 1 Ed25519
0x302c detached_signature         BYTES, exactly 64
0x302d fixture_policy_byte_length U64, 56..4,194,360
0x302e fixture_policy_bytes       BYTES, exact complete HMG4F2 frame
0x302f fixture_claim_identity     STRUCT ProtectedFileIdentity
0x3030 fixture_claim_relative_path CAPABILITY_FIXTURE_CLAIM_REL_PATH
0x3031 fixture_claim_content_length U64, exactly 80
0x3032 fixture_claim_content      BYTES, exactly 80
0x3033 fixture_executor_observation_sha256 SHA256, derived kind 71
0x3034 fixture_executor_observation STRUCT FixtureExecutorObservation
```

Each `CapabilityTest` contains exactly:

```text
0x3201 ordinal                    U32, contiguous from zero
0x3202 operation_code             U32, exact scope registry
0x3203 result                     U32, 1 pass, 2 fail, 3 blocked
0x3204 attempt_count              U32, 0..3
0x3205 successful_attempt_count   U32, 0..attempt count
0x3206 observation_sha256         SHA256, derived kind 20
0x3207 errno_vector_sha256        SHA256, derived kind 19
0x3208 retained_artifact_set_sha256 SHA256, derived kind 18
0x3209 attempts                    LIST CapabilityAttempt, exact `3204` count
0x320a errno_effect_count          U32, equal `3204`
0x320b errno_effects               LIST ErrnoEffectAttempt, exact count
0x320c retained_artifact_count     U32, 0..1,024
0x320d retained_artifacts          LIST EvidenceArtifactObservation, exact count
```

`301a..301c` prove that the distinct fixture and production binaries derive
from the same reviewed source, with one exact allowlisted instrumentation delta
and an independently reviewed behavioral-equivalence manifest. A distinct hash
without these bindings grants no production capability.

Target requires ordered test codes 1..18 for no-follow/beneath/unique,
no-replace rename, EEXIST/EXDEV, file/full/parent sync, enumeration/case,
FD-only metadata, hardlinks, protected parent/inode denial, and race/crash.
System-lock requires ordered codes 101..105 for exact open/identity, SH/EX
nonblocking flock, two-process exclusion, and crash release. For a retained
nonpassing receipt, test result 2 means at least one executed attempt completed
with an exact mismatch; result 3 means a required attempt could not be executed
or completely observed, and no mismatch was established. Fail takes precedence
over blocked. Test result 1 requires exactly three attempts, three successful
attempts, and every attempt result 1. Overall result 2 means at least one test
failed; otherwise result 3 means at least one test is blocked; otherwise it is
1. Only overall 1, with all three attempts of every test passing, grants
capability authority; scope substitution is invalid. Probe cannot supply it.

The exact target operation registry is:

```text
1 root O_NOFOLLOW_ANY
2 component O_NOFOLLOW/O_NOFOLLOW_ANY/O_RESOLVE_BENEATH
3 ordinary-file no-follow/beneath/O_UNIQUE
4 fstatat no-follow/beneath/unique
5 exclusive create and no-replace
6 renameatx_np RENAME_EXCL/no-follow/beneath
7 destination EEXIST preservation
8 cross-device EXDEV refusal
9 file fsync
10 file F_FULLFSYNC
11 parent-directory sync ordering
12 stable two-pass FD enumeration
13 exact case and ASCII case-collision refusal
14 FD-only owner/mode/flags/ACL/xattr round trip
15 hardlink rejection
16 protected-parent namespace-denial test
17 protected-inode content/metadata-denial test
18 complete crash/race matrix
```

The exact system-lock registry is 101 exact lock open/identity, 102 nonblocking
shared flock, 103 nonblocking exclusive flock, 104 two-process SH/EX exclusion,
and 105 kernel lock release on process exit/crash. Unknown, missing, duplicated,
reordered, failed, or blocked tests grant no capability.

Primitive codes are exactly 1 `openat`, 2 `fstatat`, 3 `renameatx_np`, 4
`fsync`, 5 `fcntl`, 6 FD-relative enumeration, 7 FD-only metadata APIs, 8
`linkat`, 9 `flock`, 10 two-process harness, 11 crash harness, and 12
hardlink-rejection harness. Contract flag
bits are 0 NOFOLLOW, 1 NOFOLLOW_ANY, 2 RESOLVE_BENEATH, 3 UNIQUE, 4 CREATE,
5 EXCL, 6 RENAME_EXCL, 7 FILE_FSYNC, 8 FULLFSYNC, 9 DIRECTORY_SYNC, 10 STABLE_ENUM,
11 EXACT_CASE, 12 FD_METADATA, 13 HARDLINK, 14 PROTECTED_NAMESPACE,
15 PROTECTED_INODE, 16 CRASH_RACE, 17 LOCK_SH, 18 LOCK_EX, 19 LOCK_NB,
20 TWO_PROCESS, 21 CRASH_RELEASE, 22 EXDEV, and 23 EEXIST; bits 24..63 are zero.
The exact requirement tuples `(operation: primitive, mask, return, errno)` are:

```text
1:1,0x000002,success,0       2:1,0x000007,success,0
3:1,0x00000f,success,0       4:2,0x00000d,success,0
5:1,0x00003f,success,0       6:3,0x000047,success,0
7:3,0x800047,failure,EEXIST  8:3,0x400047,failure,EXDEV
9:4,0x000080,success,0       10:5,0x000100,success,0
11:4,0x000200,success,0      12:6,0x000400,success,0
13:6,0x000800,success,0      14:7,0x001000,success,0
15:12,0x002000,success,0     16:1,0x004000,failure,EACCES
17:7,0x008000,failure,EACCES 18:11,0x010000,success,0
101:1,0x000000,success,0     102:9,0x0a0000,success,0
103:9,0x0c0000,success,0     104:10,0x1e0000,failure,EWOULDBLOCK
105:11,0x200000,success,0
```

Symbolic errno values are serialized as Darwin U32 `EPERM=1`, `EACCES=13`,
`EEXIST=17`, `EXDEV=18`, and `EWOULDBLOCK=35`; the tuple above uses only
`EACCES`, `EEXIST`, `EXDEV`, and `EWOULDBLOCK`. `parameter_set_sha256` is kind
27 over the exact SDK numeric mapping, syscall argument bytes, preconditions,
and expected retained-object description for that one operation. The build SDK
identity and the parameter object are both review inputs; a contract-local bit
is never passed directly as an OS flag.
Every requirement's `7d09` is recomputed over `7d0b`, and `7d0a` agrees; each
member is a complete reviewed SDK mapping, argument/precondition object, or
retained-object expectation rather than prose.

Operation 15 is not a claim that raw `linkat` fails. Its fixture-only setup
uses raw `linkat` to create a link-count-two ordinary inode, then invokes the
same reviewed validation function compiled into production. Primitive 12
returns success only when setup succeeds, that validator rejects the inode,
and the intended destination remains absent with no managed mutation. The
production helper has no `linkat` import or call path; the fixture delta and
kind-33 equivalence member bind the shared validator.

`3006` is SHA-256 of all `302d` bytes in `302e`; `302e` is parsed as exactly one
complete HMG4F2 frame with no trailing byte. Its header scope and fields
`7901..7905` equal K2 `3001..3005`; `7908/7909`, `7907`, `790a`, `790b`, and
`790c` equal K2 `3008/3009`, `300a`, `300b`, `300c`, and `3010` respectively.
K2 `300f` equals embedded F2 `7910`.
The selected root/parent and requirement list equal the scope-selected policy
`103d/103e/102f` or `103f/1040/1030`. K2 starts and finishes inside the F2
validity interval. The fixture-policy signature, one-use scan, and zero
authority/acceptance effects are validated before any test primitive executes;
a bare `3006` or a different embedded frame is invalid.

For scope 1, K2 `3008/3009`, `300a.(2203,220b,220c)`, fixture root
`7906.(0201,0207,0208)`, policy root `1007.(0201,0207,0208)`, and every
production role-2/3/4 parent mount tuple are byte-identical projections of the
one target-domain mount. For scope 2 the same fields equal policy
`103c.(0201,0207,0208)` and every production role-1 parent mount tuple. The
fixture path/inode remains distinct from every production path/inode despite
this required same-mount equality. A K2 generated on a different mount cannot
authorize operations on the production tuple.

`3030` is `fixture-reservation-` plus lowercase hex of `300c` and `.claim`.
The exact 80 `3032` bytes are eight ASCII bytes
`HMG4CLM2`, big-endian U32 version 2, big-endian U32 scope, 32 raw bytes `3006`,
and 32 raw bytes `300c`. `302f.6203/6204` equal `3031` and SHA-256 of `3032`;
all other identity fields equal F2 `791c`. This claim is the first fixture
mutation, is retained as the canonical role-4 EvidenceArtifactObservation in
K2 and in every nonempty attempt, and is never deleted, renamed, truncated, or
reused. A second helper
cannot pass `O_EXCL`; scan-then-act without this durable claim is invalid.

That canonical claim observation is uniquely determined. Ignoring only the
contextually reassigned ordinal, it has `7e02=4`, `7e03` equal the exact 16
ASCII bytes `capability-claim`, `7e04=1`, `7e05=3031=80`,
`7e06=SHA-256(3032)=302f.6204`, `7e07` kind 58 over `7e08`, and
`7e08.(7811..781d)` equal respectively `1`, `302f.6201`, `302f.6202`,
`302f.6203`, `302f.6204`, `302f.6205`, `302f.6206`, `302f.6207`,
`302f.6208`, `302f.6209`, `302f.620a`, `302f.620b`, and `1`. There is exactly
one such semantic member; another role, diagnostic byte string, identity,
content, or locally rehashed variant is invalid.

`3010` equals policy `1024` for scope 1 and `1025` for scope 2. `3011/3012`
contain exactly that requirement vector's operation count/order. For each test,
`3206` is kind 20 over `3209`; `3207` is kind 19 over `320b`, whose members are
the exact one-for-one projection of those same attempts. Each projected member
maps `operation_code/attempt_ordinal/return_class/errno/pre_state/post_state`
from `7a02/7a01/7a07/7a08/7a05/7a09`. Effect class is 1 only when the observed
poststate is the requirement's exact expected effect, 2 when complete pre/post
streams prove no effect, and 3 otherwise only when the unexpected effect is
complete; an incomplete effect has no attempt member and blocks the test.
`3205` is exactly the number of `3209` members with `7a0c=1`. `3208` is kind 18
over `320d`, which is the sorted union of all `7a10` lists. A test with zero
attempts has `320c=0` and an empty `320d`; every nonempty `7a10` contains the
one canonical claim observation above. `7a0b` is kind 18
over `7a10`; `7a05`, `7a09`, and `7a0a` are kind 18 over `7a12`, `7a14`, and
`7a16`; all counts match their lists. `3013/3028` are the sorted duplicate-free
union of the mandatory singleton canonical claim observation and every test
`320d`. Consequently a first blocked test with zero attempts still has an
honest top-level claim member and never fabricates an attempt; top-level, test,
and executed-attempt retained evidence otherwise cannot diverge. Every
attempt path is derived from `300b`, operation code, and ordinal. Fixture paths
are confined to the held disposable fixture parent, are created
exclusive-no-replace, are retained until the receipt is finalized, and are
never convertible to an evidence, custody, installation, or formal-output path.
The fixture environment is disposed externally as a whole; neither production
helper nor fixture helper has delete authority.
`3016/3017` are kind 15 over `301d/301e`. Target and lock receipts carry
byte-identical OS/SDK identities; current OS identity is recomputed before BEGIN
and terminal intent. SDK identity equals the build-receipt fields below.
`301a`, `301b`, `301c`, `3018`, and `3013` are recomputed respectively over
`3020`, `3022`, `3024`, `3026`, and `3028`; counts agree and no hash-only
manifest can substitute for its canonical members.
`3007` is kind 34 over `3029`, equals the role-3 or role-4 EvidenceTrustRule
issuer, and carries bit 1. It equals the F2 signer ActorIdentity and hash.
`302a..302c` satisfy Section 8.5.

### 8.2 Reproducible-build receipt: `HMG4U2`

Payload:

```text
0x6001 protocol_spec_sha256       SHA256
0x6002 helper_source_manifest_sha256 SHA256
0x6003 policy_generator_source_sha256 SHA256
0x6004 plan_sha256                SHA256
0x6005 bundle_sha256              SHA256
0x6006 policy_sha256              SHA256
0x6007 final_helper_sha256        SHA256
0x6008 target_capability_sha256   SHA256
0x6009 system_lock_capability_sha256 SHA256
0x600a source_unit_count          U32, 1..1,024
0x600b source_units               LIST BuildSourceUnit
0x600c compiler_identity          STRUCT BuildToolIdentity
0x600d sdk_tool_identity          STRUCT BuildToolIdentity
0x600e compile_argument_count     U32, 1..256
0x600f compile_arguments          LIST DiagnosticByteString
0x6010 environment_entry_count    U32, 0..64
0x6011 environment_entries        LIST BuildEnvironmentEntry
0x6012 build_a_identity           STRUCT BuildInvocation
0x6013 build_b_identity           STRUCT BuildInvocation
0x6014 build_a_helper_sha256      SHA256
0x6015 build_b_helper_sha256      SHA256
0x6016 byte_identical             BOOL, exactly true
0x6017 executable_code_identity   STRUCT ExecutableCodeIdentity
0x6018 nm_allowlist_sha256        SHA256
0x6019 nm_observed_sha256         SHA256
0x601a otool_allowlist_sha256     SHA256
0x601b otool_observed_sha256      SHA256
0x601c source_scan_receipt_sha256 SHA256
0x601d unit_fuzz_analyzer_receipt_sha256 SHA256
0x601e adversarial_suite_receipt_sha256 SHA256
0x601f read_only_probe_result_sha256 SHA256
0x6020 builder_identity_sha256    SHA256
0x6021 independent_review_sha256  SHA256
0x6022 completed_at_unix_seconds  U64
0x6023 result                     U32, exactly 1
0x6024 acceptance_effect_mask     U64, exactly zero
0x6025 signing_profile            STRUCT SigningProfile
0x6026 policy_root_identity_sha256 SHA256, derived kind 34
0x6027 policy_statement_sha256    SHA256, derived kind 51
0x6028 golden_vector_catalog_sha256 SHA256, complete HMG4G2
0x6029 golden_vector_review_sha256 SHA256, complete HMG4E2 kind 6
0x602a os_build_identity          STRUCT OSBuildIdentity
0x602b sdk_identity               STRUCT SDKIdentity
0x602c os_build_identity_sha256   SHA256, derived kind 15 identity kind 16
0x602d sdk_identity_sha256        SHA256, derived kind 15 identity kind 17
0x602e nm_allowlist_count         U32, 0..4,096
0x602f nm_allowlist               LIST SymbolMember, exact count
0x6030 nm_observed_count          U32, 0..4,096
0x6031 nm_observed                LIST SymbolMember, exact count
0x6032 otool_allowlist_count      U32, 1..1,024
0x6033 otool_allowlist            LIST LibraryMember, exact count
0x6034 otool_observed_count       U32, 1..1,024
0x6035 otool_observed             LIST LibraryMember, exact count
0x6036 builder_identity           STRUCT ActorIdentity, kind 2 with bit 3
0x6037 evidence_attestation_statement_sha256 SHA256, derived kind 57
0x6038 signature_algorithm        U32, exactly 1 Ed25519
0x6039 detached_signature         BYTES, exactly 64
0x603a toolchain_count            U32, exactly 8
0x603b toolchain                  LIST ToolchainMember, exact count
0x603c complete_source_manifest_sha256 SHA256, derived kind 21 over `600b`
0x603d build_input_set_sha256     SHA256, derived kind 27 over `603f`
0x603e build_input_count          U32, 1..2,048
0x603f build_inputs               LIST ReviewedObjectMember, exact count
0x6040 gate_a_review_report_sha256 SHA256, equal policy `1041`
0x6041 workspace_build_parent_identity STRUCT DirectoryIdentity, equal policy `1046`
0x6042 build_command_set_sha256  SHA256, derived kind 120
0x6043 build_command_count       U32, 1..512
0x6044 build_commands            LIST BuildCommand, exact count
0x6045 build_execution_set_sha256 SHA256, derived kind 121
0x6046 build_execution_count     U32, 1..1,024
0x6047 build_executions          LIST BuildExecution, exact count
0x6048 build_artifact_set_sha256 SHA256, derived kind 122
0x6049 build_artifact_count      U32, 1..8,192
0x604a build_artifacts           LIST BuildArtifactRef, exact count
0x604b build_fd_set_sha256       SHA256, derived kind 123
0x604c build_fd_count            U32, 1..8,192
0x604d build_fd_records          LIST BuildFDRecord, exact count
0x604e stage_edge_set_sha256     SHA256, derived kind 126
0x604f stage_edge_count          U32, 1..16,384
0x6050 stage_edges               LIST StageEdge, exact count
0x6051 build_signing_authorization_sha256 SHA256, complete HMG4L2 kind 2
0x6052 build_signing_authorization_length U64, 56..16,777,272
0x6053 build_signing_authorization_bytes BYTES, exact `6052`
0x6054 signing_key_custody_sha256 SHA256, derived kind 124
0x6055 signing_key_custody       STRUCT SigningKeyCustodyIdentity
0x6056 signer_transcript_set_sha256 SHA256, derived kind 125
0x6057 signer_transcript_count   U32, exactly 2
0x6058 signer_transcripts        LIST SignerTranscript, exact count
0x6059 signing_target_set_sha256 SHA256, derived kind 127
0x605a signing_target_count      U32, exactly 2
0x605b signing_targets           LIST SigningAuthorizationTarget, exact count
0x605c build_controller_actor_sha256 SHA256, derived kind 34, equal policy `1054`
0x605d build_controller_actor    STRUCT ActorIdentity, equal policy `1055`
0x605e build_controller_tool_sha256 SHA256, complete BuildToolIdentity bytes
0x605f build_controller_tool     STRUCT BuildToolIdentity
0x6060 independent_verifier_tool_sha256 SHA256, complete BuildToolIdentity bytes
0x6061 independent_verifier_tool STRUCT BuildToolIdentity
0x6062 authorized_private_key_use_count U32, exactly 2
0x6063 signing_pipeline_result   U32, exactly 1 complete deterministic closure
0x6064 direct_call_binding_set_sha256 SHA256, derived kind 131
0x6065 direct_call_binding_count U32, 1..65,536
0x6066 direct_call_bindings      LIST DirectCallBindingMember, exact count
0x6067 nm_direct_call_projection_sha256 SHA256, derived kind 25,
                                      equal `6018/6019`
0x6068 source_scan_direct_call_registry_sha256 SHA256, equal `6064`
0x6069 build_signing_consumption_claim_sha256 SHA256, derived kind 135
0x606a build_signing_consumption_claim STRUCT BuildSigningConsumptionClaim
0x606b copy_attributes_observation_sha256 SHA256, derived kind 132
0x606c copy_attributes_observation STRUCT SecKeyCopyAttributesObservation
0x606d external_representation_observation_sha256 SHA256, derived kind 133
0x606e external_representation_observation STRUCT SecKeyExternalRepresentationObservation
0x606f signature_call_observation_set_sha256 SHA256, derived kind 134
0x6070 signature_call_observation_count U32, exactly 2
0x6071 signature_call_observations LIST SecKeySignatureCallObservation,
                                      exact count
0x6072 held_gate_a_review_report  STRUCT ReviewedObjectMember, role 9,
                                      binding 2, exact member also in `603f`
0x6073 completion_sample_realtime_seconds U64, equal `6022`
0x6074 completion_sample_monotonic_nanoseconds U64
0x6075 completion_clock_relation_result U32, exactly 1
0x6076 pre_sign_policy_projection_sha256 SHA256, derived kind 137,
                                      equal HMG4L2 `8c02`
0x6077 pre_sign_policy_projection STRUCT PreSignPolicyProjection,
                                      equal HMG4L2 `8c3b`
0x6078 pre_sign_policy_statement_sha256 SHA256, derived kind 138,
                                      equal HMG4L2 `8c3c`
0x6079 pre_sign_policy_statement STRUCT PreSignBuildPolicyStatement,
                                      equal HMG4L2 `8c3d`
0x607a selected_key_lookup_observation_sha256 SHA256, derived kind 139
0x607b selected_key_lookup_observation STRUCT SecKeyLookupObservation
0x607c key_handle_lifetime_observation_sha256 SHA256, derived kind 181
0x607d key_handle_lifetime_observation STRUCT SecKeyHandleLifetimeObservation
0x607e direct_call_expression_byte_sum U64, checked sum of every `6066[].8f08`
                                      in canonical list order, 1..16,777,216
0x607f direct_call_aggregate_check_result U32, exactly 1
0x6080 auxiliary_cf_lifetime_set_sha256 SHA256, derived kind 183
0x6081 auxiliary_cf_lifetime_count U32, exactly 6
0x6082 auxiliary_cf_lifetimes LIST SecKeyAuxiliaryCFObjectLifetimeObservation,
                                      exact count
```

Two builds use distinct fresh roots and produce exact byte-identical final
signed binaries: `6014 == 6015 == 6007`. Signing is deterministic and
timestamp-free inside the binary. Exact `nm -u` and `otool -L` observations
equal their positive allowlists. Timestamps are receipt fields only.
`6012.6126 == 6014`, `6013.6126 == 6015`, and both `6125` values equal the
actual identical complete output byte length. `6017.6401 == 6007`; both
`6127 == 6017.6405`; and both `6128 == 6017.6407`. Each LC_UUID is recomputed
from SigningProfile `4c0d` and each CodeDirectory from the exact signed Mach-O
slice/profile; a summary hash cannot name a different binary than either
BuildInvocation.

`6002/6003/3018/301a` are kind 21; `6122` is kind 22; `6123` and
compile-argument sequences are kind 23; `6124` and `6011` are kind 24;
`6018/6019` are kind 25 over `602f/6031`; `601a/601b` are kind 26 over
`6033/6035`; every count matches and the allowlist and observation streams are
byte-identical. `6002` is the kind-21 projection of `600b` role 1 and `6003`
the projection of role 2; empty projections are invalid. Both invocations use the exact
`6025` profile: thin arm64, deterministic LC_UUID derivation, RSA-3072
PKCS1-v1_5 SHA-256, fixed certificate-chain bytes, no timestamp, no CMS
signing-time attribute, and byte-identical signed output. If the reviewed
toolchain cannot produce this exact result, production build status is blocked;
the contract does not permit relaxing reproducibility or accepting two merely
equivalent signatures.
`603b` contains exactly eight ToolchainMember values in ordinal/role order:
controller, SDK locator, compiler, linker, signing assembler/key client,
independent verifier, `nm`, and `otool`. `600c` is byte-identical to member
ordinal 2/role 3's `7d12`; `600d` is byte-identical to member ordinal 1/role
2's `7d12`. `6122` in both invocations is kind 22 over all eight members, never
a two-tool projection. Both `6123` values are kind 23 over `600f`, and both
`6124` values are kind 24 over `6011`; all counts agree. A toolchain/argument/
environment hash with no matching local member list is invalid.
`603c` is kind 21 over the complete `600b`, not either role projection.
`603d` is kind 27 over `603f`, and `603e` agrees. The list is a closed ordered
registry, not a reorderable semantic set. Ordinals 0..10 are byte-identical to
the eleven `4c0d` members, including their ordinal fields. For every `600b`
BuildSourceUnit in ascending `6101`, the next member has list ordinal
`11 + 6101`, role 3, exact identifier `source/` followed by lowercase hex of
`6104`, encoding 3, binding 2, and locator length/hash/content byte-identical to
`6103/6104/6106`.

After the source family, the registry appends these exact families in the
displayed order and assigns the next contiguous ordinal to every member: one
`build/signing-profile` role-6/encoding-2/binding-1 member; one
`review/gate-a-report` role-9/encoding-3/binding-2 member equal `6072`; eight
`tool/<role>/identity` role-5/encoding-2/binding-1 members equal the complete
`603b[].7d12` values; one `build/os-identity` and one `build/sdk-identity`
role-6/encoding-2/binding-1 member; then one role-6/encoding-4/binding-1 member
for each complete kind-120 command stream, kind-121 execution stream, kind-122
artifact stream, kind-123 FD stream, kind-126 edge stream, kind-127 target
stream, kind-124 key-custody stream, kind-125 signer-transcript stream, kind-131
direct-call stream, kind-135 durable-claim stream, kind-139 selected-key-lookup
observation, kind-132 attribute
observation, kind-133 export observation, kind-134 signature-call stream,
kind-137 pre-sign projection, kind-138 pre-sign policy statement, and kind-181
key-handle-lifetime observation, followed by the kind-183 auxiliary-CF-lifetime
stream, in that order. Immediately before those derived streams it includes the complete
HMG4L2-kind-2 frame as role 4/encoding 1/binding 1; immediately after the
derived streams it includes the complete final HMG4P2 frame as
`build/final-policy`, role 4/encoding 1/binding 1, whose hash is `6006`. Exact identifiers are the
lowercase names after `build/` in this paragraph with hyphens preserved.

The complete tool-identity members reopen every `610e` invocation payload, so
all eight executable and interpreter/script/module bytes are inputs rather than
hash labels. The complete SDKIdentity member includes every normative SDK
preimage. The argument/environment/toolchain streams already occur
byte-identically in LC_UUID members 7..9 and may not be replaced by alternate
copies. No member is collapsed, reordered, rebound, relabeled, or added even if
two semantic objects share bytes; duplicate source hashes already invalidate
kind 21. `603e` is recomputed from these actual families, not a fixed
`600a + 12` shortcut. This registry therefore closes specifications, every
source byte, all eight tool identities and payloads, OS/SDK, Gate-A bytes,
owner authorization, commands, executions, artifacts, FD/edge/target state,
key custody, bounded selected-key lookup, transcripts, signing calls, consumption claim, certificate/UUID
inputs, and final SigningProfile without admitting an unrelated member.
Both BuildInvocations `612a/612b` equal `603c/603d`. Thus two byte-identical
outputs cannot be paired with a different source or configuration manifest.
Both `6012.612d` and `6013.612d` are byte-identical to `6041`, and `6041` is
byte-identical to policy `1046`. Their `612c` roots and post-build scan evidence
therefore cannot be moved to a producer-selected workspace parent.
`6026` equals kind 34 over policy `1033` and the helper-embedded root SPKI;
`6027` equals policy `1034`. The build independently verifies the policy
signature before recording result 1.
`6028` is one complete HMG4G2 with `7716=1`; a nested profile-2 schema fixture
is categorically ineligible. `6029` is the passing kind-6 independent review of
that exact profile-1 object and its external byte set.
`602c/602d` are kind 15 over `602a/602b`; they equal capability `3016/3017` in
both receipts. `600d` is the exact SDK tool executable identity and is distinct
from, but named by, `602b`.
`6020` is kind 34 over `6036`, equals the role-7 EvidenceTrustRule issuer, and
carries bit 3. `6037..6039` satisfy Section 8.5.

The post-`6041` build/signing fields are complete equalities, not optional
audit attachments. `6042/6045/6048/604b/604e` are respectively kinds
120/121/122/123/126 over `6044/6047/604a/604d/6050`; `6043/6046/6049/604c/
604f` equal their exact list counts. Global ordinals are contiguous and every
command, execution, artifact, FD record, and edge occurs exactly once. For lane
A and B, BuildInvocation `614a..614e` equal the corresponding deterministic
lane projections of those five complete registries. For each lane, construct
one `SelectedSigningTargetProjection` with `9761=9762=9764=1` and `9763`
byte-identical to that lane's selected `605b` member; kind 182 over the complete
projection equals `614f`. Common lane-0 members appear in
both projections only where the schema explicitly names a common controller or
retained signing-client dependency; they are never silently copied or
re-ordinalized differently.

`6051 == SHA256(6053)`, `6052` is its exact complete length, and `6053` parses
as the one HMG4L2 kind-2 object described in Section 7.0.1. Its source,
toolchain, roots, targets, expected key policy, common readiness client,
pre-sign projection/statement, held Gate-A report, `B0/B1` clock evidence, nonce, and
zero-effect fields all equal the corresponding U2 values. `6054` is kind 124
over `6055`; `6056` is kind 125 over the two `6058` transcripts; `6059` is kind
127 over the two `605b` targets. `605c` is kind 34 over `605d` and equals the
policy/projection controller; `605e` hashes complete `605f` and equals
toolchain role 1; `6060` hashes complete `6061` and equals role 6. The verifier
is different from controller and signer. `6062=2` and `6063=1` are legal only
after both exact call observations, both transcript verifications, signed-Mach-O
assembly, independent verification, `nm`, `otool`, and final stable scans pass.
The two kind-182 projections are deterministically rebuilt from `605b[0]` and
`605b[1]`; for lane A/B respectively, `614f == 61d4 == 8d45` equals the
complete kind-182 hash for that selected member. Kind 127 remains only the
two-member set hash at `8c0c/6059/8f2f`. A selected count other than one,
wrong-lane target, target-field drift, one-sided hash copy, or substituting the
kind-127 set hash is a mandatory Gate-B rejection.

`6064` is kind 131 over `6066` and `6065` agrees. The kind-1 source-scan E2's
sole role-9 output bytes are exactly the complete HMG4D2-kind-131 stream, so its
complete-object SHA-256 equals `6068 == 6064`; a prose scan report or hash-only
claim is invalid. Projecting every class-1 `8f0c` value, sorting unsigned bytes,
rejecting duplicates after projection, and encoding kind 25 must equal
`6067 == 6018 == 6019` and byte-identically equal both `602f` and `6031`.
Profiles 2/3 have no nm member and remain represented in the complete registry.
Thus source occurrence scan, SDK prototype/compiler/runtime binding, positive
nm allowlist, and actual `nm -u` observation close in both directions: there is
no source external call without a registry member and no nm symbol without at
least one exact source occurrence.

Before hashing kind 131, semantically iterating its call graph, or allocating
storage sized from `6065` or any `8f08`, the decoder makes one bounded streaming
pass over the complete canonical `6066` LIST. In canonical member order it
adds every exact `8f08` with checked U64 arithmetic, rejects overflow, and
requires the final value to equal `607e` and be at most 16,777,216; only then
may `607f=1`, hashing, semantic iteration, or bounded allocation occur. The
sum includes every member exactly once, including repeated calls and profiles
2/3, and excludes no call-expression byte. Gate B includes an exact maximum
with 256 members of `8f08=65,536`, maximum plus one with those 256 members plus
one member of length 1, a checked-add seam vector with accumulator U64_MAX plus
one, reordered/omitted/duplicated-member sums, and one-sided `6065/6066/607e/
607f/6064/6068` mutations. Wrapped, saturated, truncated, hash-first,
allocate-first, or count-times-average arithmetic is invalid.

`6069` is kind 135 over `606a`. It reopens the complete HMG4L2 at `8d74`, the
policy-held workspace parent, both pre/post pass sets, held claim inode, exact
content/readback, every durability operation, and timely `B1` admission.
`606a.8d72 == 6051`; its
target/key/client/template fields equal HMG4L2 and its retained FD/identity
equal every transcript `8db0/8db1`. `607a` is kind 139 over `607b`, `606b` is
kind 132 over `606c`, and `606d` is kind 133 over `606e`; all three observations
select the same common stage-6 client birth tuple and non-bearer handle lifetime
ordinal zero, occur after passing claim-completion pair `B1` and before call 0, and equal
the expected public key/attribute/export policy in `6055`. `606f` is kind 134
over the two `6071` call observations, `6070=2`, and each equals its matching
SignerTranscript `8db4/8db5`. Every transcript also repeats `607a/606b/606d`
at `8db8/8db9/8dba`, so neither lane can attest a different lookup, attribute
dictionary, or export-denial result while sharing the ordinal-zero handle.
Call 0 finishes before call 1 starts; both use the same handle and byte-identical
HMG4S6P1 stage-6 pre-call session projection but different lane target/digest
fields. Each `8d55` equals that projection hash, never the final BuildExecution
hash.
`607c` is kind 181 over `607d`. Its client/lookup/call-set/handle fields equal
`607b`, `606f/6071`, and lifetime ordinal zero; `607d.9729/972a == 606b/606d`
and therefore hash-bind the exact intervening attribute/export observations.
`607d.9736==6080`; `6080` is kind 183 over the exact six `6082` members and
`6081=6`. The attributes dictionary, export CFError, two input CFData, and two
signature-result CFData each have one distinct +1 source and one distinct
final release. Each `977a` hashes one complete uniform
SecKeyAuxiliaryCFSourceObservation wrapper whose nested observation equals
`606c`, `606e`, or the selected complete `6071` member as Section 4 requires.
It selects the exact final-key
`CFRelease` kind-131 occurrence, proves the direct +1 SecKey remained
live through `606c`, `606e`, and both calls, then records exactly one final
release at or after call 1 finished with zero later key API calls or double
releases. Pointer bits remain absent.
The sole launch-profile-4 BuildExecution `E` repeats
`6069/607a/606b/606d/606f/607c/6080` at `8dd7..8ddc/8dde` respectively,
`E.8ddd==607d`, `E.8ddf=6`, and `E.8de0` is byte-identical to `6082`; every
other execution forbids those fields. For profile 4,
`E.6188` is the fresh monotonic sample at
the start of the post-B1 continuation, and `E.6189` is the fresh monotonic
sample immediately after the terminal `waitpid` result in `619c..619e` has
been captured. Exact ordering is claim durability
`<= 606a.8d9d <= E.6188 <= 607b.8dd3 <= 607b.8dd4 <= 606c.8d1d <=
606c.8d1e <= 606e.8d2d <= 606e.8d2e <= 6071[0].8d52 <= 6071[0].8d53 <=
6071[1].8d52 <= 6071[1].8d53 <= max(6082[].977e) <= 607d.9731 <= E.6189`,
with equality permitted only between
one return and the immediately following boundary sample. `E.6189` cannot be
sampled before the terminal wait returns. Thus the stage-6 execution
itself, not only U2 prose, closes durable claim -> bounded selected-key lookup -> attributes
-> export denial -> frozen acyclic pre-call projection -> call 0 -> call 1 ->
six auxiliary object releases -> final handle release -> terminal wait. Only
after that final execution is complete do `61d7/8db3`
carry its complete hash; neither value is an input to `8d55` or kind 134.

The realtime fields are not free scalars. The five observation-start pairs
`(607b.8dd3,607b.8dd6)`, `(606c.8d1d,606c.8d20)`,
`(606e.8d2d,606e.8d30)`, and `(6071[i].8d52,6071[i].8d59)` for `i=0,1` are
each one exact Section-15 monotonic-first/realtime-second clock pair in the
same boot and operation anchored to claim pair B0 `606a.8d98/8d97`. For each
pair `(m,r)`, checked arithmetic requires `m >= 606a.8d98`, computes
`expected_r = 606a.8d97 + floor((m - 606a.8d98)/1,000,000,000)`, and requires
`r + (606a.8d9b / 1,000,000,000) >= expected_r` using checked addition.
This is the same one-sided backward-realtime tolerance as Section 15; it
introduces no forward-jump ceiling. Overflow, wrong boot, a realtime value from
another monotonic sample, `E.6188` before B1, `E.6189` before call 1 or wait,
and every one-sided start/finish/boundary mutation are mandatory rejections.
Gate B includes backward-tolerance equality and one-unit-beyond rejection plus
a forward jump greater than that tolerance which passes this common guard and
is judged only by the separately applicable object expiry/future relations.

`6072` is byte-identical to the one `review/gate-a-report` member in `603f`;
`6072.7d45 == 6040 ==` final P2 `1041 ==` HMG4L2 `8c03`, and its held locator/
identity is reopened rather than trusting any of those hashes alone. `6076` is
kind 137 over `6077` and equals HMG4L2 `8c02/8c3b`; `6078` is kind 138 over
`6079` and equals `8c3c/8c3d`. The final policy whose complete hash is `6006`
must parse as HMG4P2, reproduce the complete HMG4PST1 prospective transform
and hole registry in `6077`, bind `1004 == 6007`, bind `103b == 6017` with
`102e` equal kind 15 over it, fill the unique bit-10 actor and every transitive
derived hole exactly, and verify `1033..1036` under the same policy-root
identity as `6077/6079`. Final P2 `1014` remains the root-signed literal
launcher/credential WriterIdentity and is never equated to `6007` or `6017`.
This is the acyclic closure: the root-signed
pre-sign projection authorizes only building/signing the two targets; the later
final P2 binds the resulting helper; U2 binds both.

`6073 == 6022`. The controller samples monotonic `6074` then realtime `6073`
as one final pair, after the last transcript/verification/stable-scan monotonic
timestamp and before U2 payload signing. Relative to claim anchor
`B0` at `606a.8d97/8d98`, checked monotonic elapsed time gives expected realtime
`expected_realtime = 8d97 + floor((6074-8d98)/1,000,000,000)` and applies the
exact one-sided check
`6073 + (8d9b/1,000,000,000) >= expected_realtime`; both samples are in claim
boot `8d96`, and
overflow, clock failure, or backward movement beyond that tolerance invalidates
`6075`. Receipt completion and the exact consumed continuation may occur after
HMG4L2 expiry. Timely admission is instead proved by
`606a.8d9d/8d9e/8d9f`: the durable claim and both post-passes completed before
`B1`, `B1` was strictly before `8d9a` and inside `[8c18,8c19)`, and no key
access preceded it. If that check failed, the claim remained consumed and no
U2 or key use was permitted. After a passing `B1`, later lookup/export/signature
timestamps establish only the exact same-boot/process/handle order and two-use
closure; expiry does not revoke or expand that already-consumed continuation.

### 8.3 Protected-install receipt: `HMG4I2`

Payload:

```text
0x5001 protocol_spec_sha256       SHA256
0x5002 helper_sha256              SHA256
0x5003 policy_sha256              SHA256
0x5004 plan_sha256                SHA256
0x5005 bundle_sha256              SHA256
0x5006 reproducible_build_sha256  SHA256
0x5007 target_capability_sha256   SHA256
0x5008 system_lock_capability_sha256 SHA256
0x5009 install_authorization_sha256 SHA256
0x500a installer_identity_sha256  SHA256
0x500b installed_at_unix_seconds  U64
0x500c install_root_identity      STRUCT RootIdentity
0x500d install_parent_identity    STRUCT DirectoryIdentity
0x500e helper_leaf                BYTES, exact
                                   `help-math-g4-l10-successor-v2`
0x500f helper_file_identity       STRUCT ProtectedFileIdentity
0x5010 helper_code_identity       STRUCT ExecutableCodeIdentity
0x5011 policy_leaf                BYTES, exact `g4-l10-policy-v2.bin`
0x5012 policy_file_identity       STRUCT ProtectedFileIdentity
0x5013 lock_leaf                  BYTES, exact `transaction.lock`
0x5014 lock_file_identity         STRUCT ProtectedFileIdentity
0x5015 exact_parent_entry_set_sha256 SHA256, derived kind 40
0x5016 unexpected_parent_entry_count U32, exactly zero
0x5017 stable_parent_scan_sha256  SHA256, derived kind 56
0x5018 receipt_parent_identity    STRUCT DirectoryIdentity
0x5019 result                     U32, exactly 1
0x501a acceptance_effect_mask     U64, exactly zero
0x501b launcher_configuration     STRUCT LauncherConfigurationIdentity
0x501c launcher_configuration_sha256 SHA256, derived kind 48
0x501d install_authorization_nonce BYTES, exactly 32
0x501e install_authorization_statement_sha256 SHA256, derived kind 43
0x501f parent_entry_count         U32, exactly 3
0x5020 parent_entries             LIST ProtectedNamespaceRecord, exact count
0x5021 stable_scan_pass_count     U32, exactly 2
0x5022 stable_scan_passes         LIST NamespaceScanPass, exact count
0x5023 installer_identity         STRUCT ActorIdentity, kind 2 with bit 13
0x5024 evidence_attestation_statement_sha256 SHA256, derived kind 57
0x5025 signature_algorithm        U32, exactly 1 Ed25519
0x5026 detached_signature         BYTES, exactly 64
0x5027 installer_writer_identity_sha256 SHA256, derived kind 34
0x5028 installer_writer_identity  STRUCT ActorIdentity, kind 1 with bit 12
0x5029 launcher_parent_identity    STRUCT DirectoryIdentity, role 1/subrole 2
0x502a launcher_parent_entry_set_sha256 SHA256, derived kind 40
0x502b launcher_parent_entry_count U32, exactly 1
0x502c launcher_parent_entries     LIST ProtectedNamespaceRecord, exact count
0x502d launcher_parent_scan_sha256 SHA256, derived kind 56
0x502e launcher_parent_scan_pass_count U32, exactly 2
0x502f launcher_parent_scan_passes LIST NamespaceScanPass, exact count
0x5030 installer_process_observation_sha256 SHA256, derived kind 72
0x5031 installer_process_observation STRUCT InstallerProcessObservation
0x5032 installation_started_at_unix_seconds U64
0x5033 installation_finished_at_unix_seconds U64, equal `500b`
0x5034 installation_started_at_unix_nanoseconds U64
0x5035 installation_started_at_monotonic_nanoseconds U64
0x5036 installation_finished_at_unix_nanoseconds U64, not less than `5034`
0x5037 installation_finished_at_monotonic_nanoseconds U64, not less than `5035`
0x5038 prerequisite_birth_authority_set_sha256 SHA256, derived kind 187
0x5039 prerequisite_birth_authority_count U32, exactly 4
0x503a prerequisite_birth_authorities LIST InstallPrerequisiteBirthAuthority,
                                      exact count
0x503b install_birth_observation_set_sha256 SHA256, derived kind 189
0x503c install_birth_observation_count U32, exactly 3
0x503d install_birth_observations LIST InstallBirthObservation, exact count
```

The additional canonical install-birth schemas are:

```text
InstallPrerequisiteBirthAuthority
  0x99a1 ordinal                   U32, contiguous 0..3
  0x99a2 prerequisite_role         U32: 1 installation parent,
                                           2 receipt evidence parent,
                                           3 launcher-configuration parent,
                                           4 launcher-configuration file
  0x99a3 protection_subject_role   U32: 2 roles 1..3, 10 role 4
  0x99a4 protected_parent_ordinal  U32, exact selected policy parent
  0x99a5 subject_identity_sha256   SHA256, derived kind 15
  0x99a6 subject_identity          STRUCT CanonicalIdentityMember, kind 2
                                           roles 1..3, kind 3 role 4
  0x99a7 containing_parent_identity_sha256 SHA256, derived kind 15 identity kind 2
  0x99a8 containing_parent_identity STRUCT CanonicalIdentityMember, kind 2
  0x99a9 birth_profile             U32, exactly 1
  0x99aa birth_receipt_sha256      SHA256, complete HMG4C2
  0x99ab birth_receipt_length      U64, 56..8,388,664
  0x99ac birth_receipt_bytes       BYTES, exact `99ab`
  0x99ad birth_authorization_sha256 SHA256, complete HMG4S2
  0x99ae birth_authorization_length U64, 56..2,097,208
  0x99af birth_authorization_bytes BYTES, exact `99ae`
  0x99b0 claim_creation_observation_sha256 SHA256, derived kind 107
  0x99b1 claim_creation_observation STRUCT BirthClaimCreationObservation
  0x99b2 result                    U32, exactly 1

InstallBirthNamespacePass
  0x9a01 ordinal                   U32, exactly 0 or 1
  0x9a02 install_observation_ordinal U32, 0..2
  0x9a03 scan_phase                U32: 1 absent-before, 2 present-after
  0x9a04 parent_identity_sha256    SHA256, derived kind 15 identity kind 2
  0x9a05 parent_identity           STRUCT CanonicalIdentityMember, kind 2
  0x9a06 exact_leaf_component      BYTES, exact selected I2 leaf
  0x9a07 leaf_identity_sha256      SHA256, derived kind 58
  0x9a08 leaf_identity             STRUCT ObservedArtifactIdentity,
                                           type 0 phase 1, type 1 phase 2
  0x9a09 parent_entry_count        U32, 0..3
  0x9a0a parent_entries            LIST ProtectedNamespaceRecord, exact count
  0x9a0b parent_entry_set_sha256   SHA256, derived kind 40
  0x9a0c started_at_unix_nanoseconds U64
  0x9a0d finished_at_unix_nanoseconds U64, not less than `9a0c`
  0x9a0e complete                  BOOL, exactly true
  0x9a0f result                    U32, exactly 1
  0x9a10 started_at_monotonic_nanoseconds U64
  0x9a11 finished_at_monotonic_nanoseconds U64, not less than `9a10`

InstallBirthObservation
  0x9a21 ordinal                   U32, contiguous 0..2 in creation order
  0x9a22 protection_subject_role   U32: 7 helper ordinal 0, 6 policy ordinal 1,
                                           8 permanent lock ordinal 2
  0x9a23 metadata_role             U32: 13 helper, 14 policy, 15 lock
  0x9a24 exact_leaf_component      BYTES, respectively I2 `500e/5011/5013`
  0x9a25 parent_identity_sha256    SHA256, derived kind 15 identity kind 2
  0x9a26 parent_identity           STRUCT CanonicalIdentityMember, kind 2,
                                           projection of I2 `500d`
  0x9a27 content_byte_length       U64, helper/policy exact source length,
                                           zero lock
  0x9a28 content_sha256            SHA256, helper U2 output, complete P2,
                                           or SHA-256(empty) lock
  0x9a29 metadata_policy_sha256    SHA256, derived kind 15 over exact selected
                                           RoleMetadataPolicy
  0x9a2a creator_actor_identity_sha256 SHA256, equal I2 `5027`
  0x9a2b creator_actor_identity    STRUCT ActorIdentity, byte-identical `5028`
  0x9a2c creator_execution_identity_sha256 SHA256, equal I2 `5031.7981`
  0x9a2d creator_execution_identity STRUCT PublicProcessExecutionIdentity,
                                           byte-identical `5031.7982`
  0x9a2e pre_namespace_pass_set_sha256 SHA256, derived kind 188
  0x9a2f pre_namespace_pass_count  U32, exactly 2
  0x9a30 pre_namespace_passes      LIST InstallBirthNamespacePass, phase 1
  0x9a31 open_flags                U32, exact O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW
  0x9a32 creation_mode             U32, exact selected metadata mode
  0x9a33 open_return_fd            U32, retained nonnegative FD
  0x9a34 errno_after_success       U32, exactly zero canonicalized by installer
  0x9a35 creation_started_at_unix_nanoseconds U64, observation 0 equal I2
                                           `5034`; observations 1/2 fresh pairs
  0x9a36 creation_finished_at_unix_nanoseconds U64, not less than `9a35`
  0x9a37 content_bytes_written     U64, equal `9a27`
  0x9a38 content_sha256_written    SHA256, equal `9a28`
  0x9a39 content_readback_sha256   SHA256, equal `9a38`
  0x9a3a retained_f_getfl          U32, exact O_RDWR with no unknown status bit
  0x9a3b retained_file_identity_sha256 SHA256, derived kind 15 identity kind 3
  0x9a3c retained_file_identity    STRUCT CanonicalIdentityMember, kind 3,
                                           exact I2 `500f/5012/5014`
  0x9a3d metadata_readback_sha256  SHA256, equal `9a29`
  0x9a3e file_fsync_result         U32, exactly zero
  0x9a3f file_fullsync_result      U32, exactly zero
  0x9a40 parent_sync_result        U32, exactly zero
  0x9a41 post_namespace_pass_set_sha256 SHA256, derived kind 188
  0x9a42 post_namespace_pass_count U32, exactly 2
  0x9a43 post_namespace_passes     LIST InstallBirthNamespacePass, phase 2
  0x9a44 retained_fd_through_final_scan BOOL, exactly true
  0x9a45 result                    U32, exactly 1
  0x9a46 creation_started_at_monotonic_nanoseconds U64, observation 0 equal
                                           I2 `5035`; observations 1/2 fresh pairs
  0x9a47 creation_finished_at_monotonic_nanoseconds U64,
                                           not less than `9a46`
```

The install receipt is stored under the separate protected evidence parent, so
the exact install-parent entry set has only helper, policy, and lock. It attests
an independently authorized completed install; it never authorizes installation.
After complete K2/U2/Z2/C2 read-only admission, the fresh `install_now` pair is
taken immediately before the first protected-install mutation and its realtime
second/nanosecond and monotonic nanosecond are stored at `5032/5034/5035`.
The exact installer interval begins there. Complete prerequisite admission and
all six kind-188 phase-1 absence passes finish before that interval. Every
subsequent helper/policy/lock exclusive create, write, metadata operation,
readback, file sync, F_FULLFSYNC, parent sync, kind-188 phase-2 scan, launcher-
parent post-install recheck, and final global stable scan occurs within that
interval; `5033==500b` is recorded only after the final readback and the two
global `5022` stable scans. That fresh final pair supplies `5033/5036/5037`, is governed
by the same `G0`, and must be no later than `5032+60`. Only then may the
independent bit-13 attestor assemble and sign the completed HMG4I2 bytes. The
bit-11 evidence-ingest broker, not that attestor or installer, later persists
those already-signed exact bytes under the hash-derived receipt leaf with one
`O_EXCL|O_NOFOLLOW` create. That persistence is verified by the later Q2 and is
not self-attested inside I2. Receipt persistence is not the first install
mutation and cannot serve as the pre-install clock boundary.

`5038` is kind 187 over the exact four `503a` prerequisite authorities and
`5038/5039 ==` the admitted Z2 `7617/7618`. The
members are ordered exactly installation parent, receipt evidence parent,
launcher-configuration parent, launcher-configuration file. Their selected
policy parents are respectively role-1/subrole-1, role-2/subrole-4,
role-1/subrole-2, and role-1/subrole-2; their ProtectionSubject roles are
2,2,2,10. Each member embeds and completely parses one HMG4C2 and its one
HMG4S2 preimage, verifies both strict signatures, and recomputes every S2/C2
intent, parent, subject, creator, metadata, interval, claim, primitive,
readback, sync, policy and receipt equality. `99b0/99b1` supply the complete
kind-107 claim-creation preimage whose hash is only named by C2. Subject and
containing-parent identities equal the selected C2 and current held policy
walks. Birth profile is exactly the C2/S2 common profile 1. Profiles 2/3 are
forbidden: no prior install may bootstrap this installation, and profile 3
cannot create an inode after the already-signed P2 has bound that inode
identity. Different C2/S2
bytes, a hash without bytes, a claim observation from another session, a role
swap, or any missing prerequisite blocks before `install_now`.

The four complete prerequisite members are read and rehashed during the one
install admission operation and remain held through the final pair. Thus the
I2 signature commits to the exact C2/S2/claim set admitted before the first
install mutation; a later Q2 must revalidate this same nested set from I2 and
cannot substitute a different or post-install C2/S2 chain.

`503b` is kind 189 over exactly three `503d` install-birth observations in
actual creation order: helper (subject role 7, metadata role 13), policy
(subject role 6, metadata role 14), then lock (subject role 8, metadata role
15). Before `install_now`, every observation completes two kind-188 phase-1
passes over the retained installation parent. Each pass proves its exact leaf
absent and the complete parent entry set empty. Within each observation, its
two phase-1 passes are byte-identical after omitting only pass ordinal `9a01`
and realtime/monotonic time fields `9a0c/9a0d/9a10/9a11`. Across all six
phase-1 passes, `9a03..9a05`, `9a07..9a0b`, `9a0e`, and `9a0f` agree: the
phase is 1, the retained parent is common, the canonical type-0 absent identity
is common, and the complete parent-entry count/list/kind-40 hash is the same
empty set. `9a02` and `9a06` instead differ exactly by observation, binding
ordinals 0/1/2 and I2 leaves `500e/5011/5013`; their enclosing kind-188 hashes
are not required to agree across observations. No install mutation occurs
until all six absence passes, every prerequisite admission, and the start pair
succeed.

For each observation the installer performs exactly one
`openat(parent_fd,leaf,O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW,mode)` and never retries
it. For observation 0, `9a35/9a46` are the same named `install_now` pair and
equal I2 `5034/5035`; this is one checkpoint and one clock pair, not a reused
or repeated read. Observations 1 and 2 each take their own fresh `9a35/9a46`
pair immediately before their call. The held
returned FD receives the exact helper bytes from U2, the exact
complete P2 bytes, or the zero-byte lock content, in that order. The installer
then applies and reads back the one selected RoleMetadataPolicy, streams exact
content readback, rechecks link count one and the complete kind-3 identity,
calls file `fsync`, file `F_FULLFSYNC`, and parent `fsync`, and completes two
kind-188 phase-2 scans while retaining the FD. Observation timestamps lie in
the closed nanosecond interval `5034..5036` for creation and phase 2, while all
phase-1 absence-pass timestamps are strictly before `5034`; creator actor/execution are
byte-identical to `5027/5028` and `5031.7981/7982`. The phase-2 parent entry
sets contain exactly the created prefix of `500e,5011,5013` with counts 1, 2,
and 3 respectively and no other entry. The two passes of one phase are
byte-identical after omission of pass ordinal and times. The final observation
remains held through the global two scans `5022`. `9a36/9a47` are the fresh
pair immediately after that observation's second phase-2 pass and therefore
enclose its open, write, metadata, readback, durability and post-scan evidence.

An error or ambiguous return is resolved only by complete stable observation;
it never authorizes adoption, overwrite, cleanup, delete, blind retry, or a
locally synthesized success. Missing absence, wrong creation order, role/leaf/
source/metadata/actor/execution/time substitution, failed readback/sync,
foreign inode, second link, incomplete pass, or any extra parent entry blocks
I2. Gate B mutates each one of those edges independently. It also changes one
same-observation phase-1 pass leaf, forces two different observations to share
one leaf, swaps helper/policy/lock leaves, changes one common empty-entry or
absent-identity projection, and places a phase-1 finish immediately before,
exactly at, and immediately after `install_now` by checked one-nanosecond
offsets; only the one-nanosecond-before boundary is admitted.
`5015` is kind 40 over `5020`; `5017` is kind 56 over `5022`; and each scan
pass has the same three complete members as `5020`. Each member embeds its
observed identity. Each pass has one `7848` member, canonical identity kind 14
over the exact policy role-1/subrole-1 ProtectedParent whose `2304 == 500d`;
`7845` is kind 65 over that list. Thus neither hash is an unverifiable scan
label.
`500c` is the exact policy slot-1 installation RootIdentity and equals Z2
`7606`. `500d` is policy role-1/subrole-1 `ProtectedParent.2304` and equals Z2
`7607`. `5018` is byte-identical to the role-8 EvidenceLocation immediate
parent `630e` (role-2/subrole-4 receipts).

Helper identity equalities are `500f.6204 == 5002 == 5010.6401 == U2.6007`,
and every noncontent metadata field equals policy role 13. Policy file
`5012.6204 == 5003` and its metadata equals role 14. Lock `5014` has size zero,
content SHA-256 of the empty byte string, and role-15 metadata. `5020` has names
exactly `500e`, `5011`, and `5013` in that order; each `4806` is canonical
identity kind 3 over respectively `500f`, `5012`, and `5014`. Both `5022`
passes repeat those same nonordinal members. No helper/policy/lock substitution
can satisfy only the scan hash.
Install observation 0 has `9a24=500e`, `9a27 == U2.6012.6125 ==
U2.6013.6125`, `9a28=U2.6007`, and `9a3b/9a3c` equal kind 15 over `500f`;
observation 1 has
`9a24=5011`, `9a27=5012.6203`, `9a28=5003`, and
`9a3b/9a3c` equal kind 15 over `5012`; observation 2 has `9a24=5013`, zero
length, SHA-256 of the empty byte string, and `9a3b/9a3c` equal kind 15 over
`5014`. Their `9a29` values are kind 15 over the corresponding policy
RoleMetadataPolicy 13/14/15, and `9a3d` equals it after full owner/group/mode/
flags/ACL/xattr/type/link readback. `9a2e/9a41` are kind 188 over their exact
pass lists and every count agrees. No bare hash, final-only scan, common
boolean, or one observation reused for a second role satisfies these bindings.
`501b/501c` equal policy `102d` and the held protected launcher configuration.
`5029` is policy role-1/subrole-2 `ProtectedParent.2304`. `502a` is kind 40 over
`502c`, which has the one exact launcher-configuration leaf and identity kind 3
over `501b.4b02`; `502d` is kind 56 over the two `502f` passes. Each pass repeats
that one entry and embeds one identity-kind-14 member for the same ProtectedParent.
Its kind-65 parent hash and all counts agree. Because this parent has no writer
rule, any other leaf, identity drift, or scan disagreement blocks I2; Z2 does not
silently authorize launcher provisioning.
`501d/501e` equal the signed install authorization. Consumption occurs at the
first successful helper-leaf `O_EXCL` in install observation 0. The completed
I2 later attests that already-consumed effect; later durable exclusive
persistence of these exact signed HMG4I2 bytes by the bit-11 broker is evidence,
not the consumption point. There is no second audit object and no claim that
I2 self-attests its own leaf creation. Before installation the installer stably
scans every admitted role-8 receipt and rejects any matching authorization hash
or nonce, and its six absence passes require the install parent empty. A
pre-install failure before that call does not consume the nonce. Any successful
helper-leaf create consumes it even if a later write/readback/metadata/sync/
policy/lock/I2 step fails; the partial install is manual-only and neither this
nor another Z2 may adopt, overwrite, clean up, or continue it. Concurrent
installers contend on that same first helper-leaf `O_EXCL`; only the one exact
effect may continue, and every other contender proves no effect and stops
without retrying or attempting the policy/lock leaves. Any completed matching
HMG4I2 in custody independently makes replay invalid.
`500a` is kind 34 over `5023`, equals the role-8 EvidenceTrustRule issuer, and
carries bit 13. `5027` is kind 34 over `5028`, equals Z2 `7615/7616`, and is the
actor in every role-1 phase-2 WriterAuthorityRule used by this installation.
`5030` is kind 72 over the sole complete `5031`.
`5031.7985=5027`, `7986` is byte-identical to `5028.6f0c`,
`798a=798b=5028.6f0b`, `7987.6204=798a.6401`, and `798e=5009`.
`7988` is kind 15 over `7989`; `7989.7c01=11` and its
ObservedExecutableIdentity `7c02` is kind 1 signed Mach-O. Its
`4e02..4e05` equal held file `7987.6201..6204`; its complete
ObservedCodeSignatureIdentity maps exactly to `798a/798b`: `4f01=6407`,
`4f02=6408`, `4f03=640a`, `4f04=640b`, `4f05=6409`, `4f06=640f`,
`4f07=6410`, and `4f08=1`. Static parsing also rechecks thin arm64/MH_EXECUTE,
LC_UUID, hardened runtime, library validation, and forbidden entitlements from
the complete ExecutableCodeIdentity.

`5031.7990.80b1/80b2 == 7981/7982`; it has actor profile 1, both public
projections `0x00000301`, and an interval enclosing `798c..798d`. `798b`
contains only the runtime-validated static ExecutableCodeIdentity fields. A
dynamic status change, Debugged/Platform bit, audit/process mismatch, or status
sample outside the install interval blocks I2.

`7981` is kind 97 over `7982`, `7983` is kind 97 over `7984`, and self/parent
targeted KERN_PROC_PID samples remain stable. `7982.8132 == 7984.8132`,
`7982.8134 == 7984.8133`, and `7986` equals the normalized self kinfo credential
plus child-self readback. The installer retains its own executable FD and
samples that FD, `SecStaticCode`, dynamic `SecCode`, both public execution
identities, and full credential before the first install mutation,
around every install mutation, and after both protected-parent scans. Every
sample must be byte-identical, `798c=5032`, `798d=5033`, and `798f=1`.
Exactly this one observed process with the dedicated credential performs the
install during `5034..5036`; the Unix-second projections satisfy
`floor(5034/1,000,000,000)=5032`,
`floor(5036/1,000,000,000)=5033`, and Z2 satisfies
`760b <= 5032 <= 5033 == 500b < 760c`. The independent bit-13 attestor binds this complete
observation rather than a declared actor or bare executable hash. Process
restart, `exec`, PID/start/boot replacement, held-inode replacement,
code/credential drift, or missing
bracketing evidence blocks I2. The process exits and every
role-1 bit-12 writer rule is revoked before the later Q2 pass.
The bit-13 attestor, bit-5 Z2 authorizer, and bit-12 installer writer are three
distinct catalog actors; their identity hashes, SPKIs where present, and code
identity hashes are pairwise distinct. `5024..5026` satisfy Section 8.5.

### 8.3.1 Protected-birth owner authorization: `HMG4S2`

HMG4S2 is the sole pre-creation mutation authority for fresh-tree profile 1 or
protected-ingest profile 3. It is owner-signed before any target inode exists,
so it binds exact paths, metadata, content, provisioner code, parent protection,
nonce, and time but deliberately contains no future inode number and no final
HMG4P2 hash. Payload:

```text
0x8501 protocol_spec_sha256       SHA256
0x8502 predecessor_contract_sha256 SHA256, exact Section 0 value
0x8503 authorization_profile      U32, equal header kind 1 or 3
0x8504 bootstrap_parent_identity_sha256 SHA256, derived kind 15 identity kind 2
0x8505 bootstrap_parent_identity STRUCT CanonicalIdentityMember, kind 2
0x8506 subject_intent_set_sha256 SHA256, derived kind 102
0x8507 subject_intent_count      U32, 1..512
0x8508 subject_intents           LIST ProtectedBirthIntent, exact count
0x8509 provisioner_actor_sha256  SHA256, derived kind 34
0x850a provisioner_actor         STRUCT ActorIdentity, kind 3 with bit 19
                                      profile 1 or kind 1 with bit 11 profile 3
0x850b authorization_nonce       BYTES, exactly 32 nonzero
0x850c issued_at_unix_seconds    U64
0x850d expires_at_unix_seconds   U64
0x850e allowed_effect_mask       U64: exact bits 0 exclusive mkdir,
                                      1 exclusive file create, 2 write-new,
                                      3 FD metadata, 4 file sync, 5 parent sync,
                                      6 profile-1 chown; higher bits zero
0x850f no_delete                 BOOL, exactly true
0x8510 no_overwrite              BOOL, exactly true
0x8511 no_hardlink               BOOL, exactly true
0x8512 acceptance_effect_mask    U64, exactly zero
0x8513 owner_authority_sha256    SHA256, derived kind 34
0x8514 owner_authority           STRUCT ActorIdentity, kind 2 with bit 18
0x8515 authorization_statement_sha256 SHA256, derived kind 43
0x8516 signature_algorithm       U32, exactly 1 Ed25519
0x8517 detached_signature        BYTES, exactly 64
0x8518 one_use                   BOOL, exactly true
0x8519 bootstrap_parent_writer_rule_set_sha256 SHA256, derived kind 52
0x851a bootstrap_parent_writer_rule_count U32, exactly 1
0x851b bootstrap_parent_writer_rules LIST WriterAuthorityRule, exact count
0x851c expected_final_runtime_owner_actor_sha256 SHA256, derived kind 34
0x851d expected_final_runtime_owner_actor STRUCT ActorIdentity, kind 1 with bit 10
0x851e result_authority_effect_mask U64, exactly zero
0x851f compiled_owner_root_spki_sha256 SHA256, equal `8514.6f06`
0x8520 compiled_owner_root_spki_der BYTES, equal `8514.6f08`
0x8521 provisioner_code_identity_sha256 SHA256, derived kind 15, equal `850a.6f05`
0x8522 provisioner_code_identity STRUCT ExecutableCodeIdentity,
                                      byte-identical to `850a.6f0b`
0x8523 trust_anchor_code_region  STRUCT CodeRegionIdentity, exact compiled
                                      `8520` bytes in held provisioner source
0x8524 reservation_claim_leaf   BYTES, `birth-reservation-<nonce>.claim`
0x8525 reservation_claim_content_length U64, exactly 80
0x8526 reservation_claim_content BYTES, exactly 80
0x8527 reservation_claim_metadata STRUCT RoleMetadataPolicy, object role 22
0x8528 current_authority_effect_mask U64, exactly zero
0x8529 existing_policy_sha256      SHA256, required profile 3 and equal the
                                      already signed HMG4P2; forbidden profile 1
0x852a future_q2_observer_actor_sha256 SHA256, derived kind 34
0x852b future_q2_observer_actor    STRUCT ActorIdentity, kind 3 with bit 9
```

Each ProtectedBirthIntent contains exactly:

```text
0x8601 ordinal                    U32, contiguous from zero
0x8602 subject_role               U32, exact Q2 role
0x8603 managed_index              U32, 0..113 or 0xffffffff
0x8604 parent_intent_ordinal      U32, `0xffffffff` ordinal-0 managed root and
                                      every profile-3 intent; otherwise earlier ordinal
0x8605 leaf_component             BYTES, 1..255 exact PathComponent
0x8606 object_type                U32: 1 ordinary file, 2 directory
0x8607 content_byte_length        U64, zero directory; bounded expected file length
0x8608 content_sha256             SHA256, required ordinary, forbidden directory
0x8609 final_owner_uid            U32, equal `851d.6f0c.7852` profile 1;
                                      equal `850a.6f0c.7852` profile 3
0x860a final_group_gid            U32, equal `851d.6f0c.7855` profile 1;
                                      equal `850a.6f0c.7855` profile 3
0x860b final_mode_bits            U32, exact owner-only role mode
0x860c final_flags                U32, exact role flags
0x860d final_acl_sha256           SHA256, exact canonical ACL stream
0x860e final_xattr_set_sha256     SHA256, exact canonical xattr set
0x860f creation_primitive        U32: 1 mkdirat, 2 openat
0x8610 creation_flags            U32, zero mkdirat; exact
                                      O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW file
0x8611 creation_mode             U32, zero-extended mode_t
0x8612 final_metadata_role       U32, exact future HMG4P2 role
0x8613 provisioner_actor_sha256 SHA256, equal enclosing `8509`
0x8614 result                    U32, exactly 1 canonical intent
0x8615 content_source_identity_sha256 SHA256, derived kind 15 identity kind 3;
                                      required ordinary, forbidden directory
0x8616 content_source_identity  STRUCT CanonicalIdentityMember, identity kind 3;
                                      required ordinary, forbidden directory
0x8617 content_source_parent_identity_sha256 SHA256, derived kind 15 kind 2;
                                      required ordinary, forbidden directory
0x8618 content_source_parent_identity STRUCT CanonicalIdentityMember, kind 2;
                                      required ordinary, forbidden directory
0x8619 content_source_authority_slot U32, exactly 2 review/source store;
                                      required ordinary, forbidden directory
0x861a content_source_read_only  BOOL, exactly true ordinary, forbidden directory
0x861b content_source_leaf_component BYTES, 1..255 exact PathComponent;
                                      required ordinary, forbidden directory
0x861c content_source_open_flags U32, exact O_RDONLY|O_NOFOLLOW;
                                      required ordinary, forbidden directory
0x861d content_source_two_stable_scans BOOL, exactly true ordinary,
                                      forbidden directory
```

`8506` is kind 102 over `8508`; profiles do not mix. A profile-1 S2 authorizes
one rooted subgraph: ordinal 0 is a root intent (subject role 1 managed root or
role 2 protected parent) beneath exact held `8505`; every later `8604` names an
earlier directory intent, and concatenating exact components yields the future
path. At least one S2 anchors the authority-slot-2 managed/evidence/custody/live
tree and a distinct S2 anchors each disjoint authority-slot-1 install/launcher
tree. Their bootstrap parents, nonces, root paths, and intent keys are distinct;
the union covers every profile-1 Q2 subject exactly once.
Profile 3 contains only plan/bundle/evidence leaves beneath an already-created
profile-1 evidence parent named by `8505`; each has `8604=0xffffffff` but is not
a new managed root. Paths, role/index keys, and ASCII-case folds are unique.
Profile 1 `850e` has bits 0..6 exactly; profile 3 has bits 1..5 exactly and
forbids chown because its final owner is the bit-11 broker. Every file's complete
bytes are fixed by `8607/8608` and the read-only held source
`8615..861d`. `8615` is kind 15 over `8616`; `8617` is kind 15 over `8618`;
the source identity's length/content hash equal `8607/8608`. Two complete
phase-4 scans under the exact source parent bind signed leaf `861b` to that
identity before one `openat` with `861c`; the creator retains and rechecks that
read-only FD while streaming, then rehashes the destination. Different leaf,
parent, inode, ambiguous entry set, nofollow/open drift, or source outside that
signed namespace edge is inadmissible.

The bootstrap parent is an owner-approved protected directory on the target
mount that remains the exact containing ancestor for the managed tree's entire
runtime lifetime; it is not disposed after provisioning. Q2 session evidence
reopens and field-compares it through S2 `8505/8168`, then performs two complete
claim-parent scans. Its complete DirectoryIdentity, ACL/xattr/mode/flags, and sole
phase-specific writer rule are embedded. For profile 1 the one rule names the
bit-19 UID0 provisioner; for profile 3 it names the bit-11 ingest broker. No
other non-UID0 writer grant is legal. The privileged profile-1 provisioner is a
separate workspace-built/signed fixture binary, not the production helper; its
exact code/credential are in `850a`. It may chown only newly created retained
subjects to the future bit-10 service owner named by `851c/851d`. This is an
explicitly owner-authorized UID0/bootstrap-TCB operation outside the later Q2
protection claim, not evidence that public Q2 resists UID0.

`851f/8520` are the immutable owner-root SPKI compiled into the held provisioner
source/binary before S2 is read: `8523.78b4` contains exactly those DER bytes,
its source/hash/offset are build-receipt bound, `8521` is kind 15 over `8522`,
and the running provisioner must match `8522`. S2 cannot select a different
verifier key or verifier binary. `8513/8514` equal `851f/8520` and future policy
`1052/1053`; `8509/850a` equal future policy `104d/104e`; `851c/851d` equal the
future policy bit-10 runtime-helper actor. The unsigned S2 payload omits
`8515..8517`; kind 43 binds magic/discriminator, unsigned payload hash, owner
identity, nonce, and `850c/850d`; `8516/8517` are Ed25519 over that exact
statement. `850c < 850d`, checked lifetime is at most 900 seconds, and every
mutation/metadata/readback/sync in the resulting C2 set lies in the interval.
Profile 1 forbids `8529`; profile 3 requires `8529` to equal the complete held,
root-signature-valid P2 opened before claim creation. `852a` is kind 34 over
`852b`, and that bit-9 observation tool/group is fixed before claim metadata is
applied and must equal the later Q2 tool.
The nonce is consumed by a reservation claim that is the first mutation, before
any subject. `8524` is ASCII `birth-reservation-` plus lowercase hex of all 32
`850b` bytes plus `.claim`. `8526` is eight ASCII bytes `HMG4BIR2`, big-endian
U32 version 2, big-endian U32 profile, the 32 raw `8506` intent-set-hash bytes,
and the 32 raw nonce bytes; `8525=80`. The creator uses
`openat(O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW,0600)`, applies/readbacks `8527`,
syncs file and parent, and retains the claim FD through the complete kind-107
creation observation only. Any existing leaf,
ambiguous return, crash after visibility, or partial subject permanently
consumes S2. Every C2 repeats `8240/8241` and the same kind-107 hash `8242`;
the Q2 session embeds the one complete creation-observation preimage at `816a`,
reopens the claim read-only as `816b..817b`, and performs fresh phase-3 scans.
No future-FD-retention assertion and no scan for a nonexistent standalone C2
file is used.

HMG4S2 grants no install, production runtime, apply, recover, acceptance,
promotion, publication, or cleanup authority. Current authorization forbids
generating, signing, consuming, or executing S2 and forbids the bit-19
provisioner. A future owner authorization must name the disposable offline
environment and exact S2. The bit-19 provisioner exits and loses all UID0
process state before Q2; signed C2 bytes and immutable claim/subject identities,
not a purported still-open provisioner FD, are handed to the independent
nonprivileged verifier/attestor. The two Q2 targeted status observations must
find that exact prior birth tuple absent or replaced; this makes no claim against
other UID0 processes. Merely constructing schema-valid bytes grants
nothing.

### 8.3.2 Protected-birth receipt: `HMG4C2`

HMG4C2 is creation-time evidence, never a permission to create. Header kind 1
means fresh managed-tree provisioning; kind 3 means protected evidence ingest.
Kind 2 is deliberately absent because installation birth is already proven by
the selected complete HMG4I2. Payload:

```text
0x8201 protocol_spec_sha256       SHA256
0x8202 policy_sha256              SHA256, complete held HMG4P2
0x8203 birth_profile              U32, equal header kind 1 or 3
0x8204 subject_role               U32, exact Q2 ProtectionSubject role
0x8205 managed_index              U32, 0..113 or 0xffffffff
0x8206 subject_identity_sha256    SHA256, derived kind 15
0x8207 subject_identity           STRUCT CanonicalIdentityMember, kind 2 or 3
0x8208 containing_parent_identity_sha256 SHA256, derived kind 15 identity kind 2
0x8209 containing_parent_identity STRUCT CanonicalIdentityMember, kind 2
0x820a creator_actor_sha256       SHA256, derived kind 34
0x820b creator_actor              STRUCT ActorIdentity, kind 3 with bit 19
                                      profile 1 or kind 1 with bit 11 profile 3
0x820c creator_execution_identity_sha256 SHA256, derived kind 97
0x820d creator_execution_identity STRUCT PublicProcessExecutionIdentity
0x820e creator_credential         STRUCT ProcessCredentialIdentity,
                                      byte-identical to `820b.6f0c`
0x820f creator_code_identity_sha256 SHA256, derived kind 15, equal `820b.6f05`
0x8210 absent_before_sha256       SHA256, derived kind 58
0x8211 absent_before              STRUCT ObservedArtifactIdentity, type 0
0x8212 exclusive_no_replace       BOOL, exactly true
0x8213 parent_protected_before_visibility BOOL, exactly true
0x8214 metadata_readback_complete BOOL, exactly true
0x8215 acl_readback_sha256        SHA256, exact canonical readback
0x8216 xattr_readback_sha256      SHA256, exact canonical readback
0x8217 link_count_readback        U32, nonzero
0x8218 file_fsync_complete        BOOL, exactly true for ordinary; false directory
0x8219 file_fullfsync_complete    BOOL, exactly true for ordinary; false directory
0x821a parent_sync_complete       BOOL, exactly true
0x821b creation_started_at_unix_nanoseconds U64
0x821c creation_finished_at_unix_nanoseconds U64, not less than `821b`
0x821d preceding_parent_birth_receipt_sha256 SHA256, zero iff selected intent is
                                      ordinal-0 root of this profile-1 S2 (role 1 or 2)
0x821e result                     U32, exactly 1
0x821f acceptance_effect_mask    U64, exactly zero
0x8220 issuer_identity_sha256    SHA256, derived kind 34, equal policy `104b`
0x8221 issuer_identity           STRUCT ActorIdentity, kind 2 with bit 17,
                                      byte-identical to policy `104c`
0x8222 evidence_attestation_statement_sha256 SHA256, derived kind 57
0x8223 signature_algorithm       U32, exactly 1 Ed25519
0x8224 detached_signature        BYTES, exactly 64
0x8225 boot_session_uuid         BYTES, exactly 16, equal `820d.8132`
0x8226 creation_primitive        U32: 1 `mkdirat` exclusive absent leaf,
                                      2 `openat(O_CREAT|O_EXCL|O_NOFOLLOW)`
0x8227 expected_role_metadata_sha256 SHA256, derived kind 15
0x8228 retained_subject_fd_through_receipt BOOL, exactly true
0x8229 subject_file_sync_result  U32, zero ordinary, `0xffffffff` directory
0x822a subject_full_sync_result  U32, zero ordinary, `0xffffffff` directory
0x822b parent_sync_result        U32, exactly zero
0x822c birth_authorization_sha256 SHA256, complete HMG4S2
0x822d birth_authorization_profile U32, equal HMG4S2 header kind 1 or 3
0x822e birth_authorization_intent_set_sha256 SHA256, equal S2 `8506`
0x822f birth_intent_ordinal      U32, index into S2 `8508`
0x8230 creator_observation_sha256 SHA256, derived kind 103
0x8231 creator_observation       STRUCT BirthCreatorObservation
0x8232 pre_namespace_pass_set_sha256 SHA256, derived kind 104
0x8233 pre_namespace_pass_count  U32, exactly 2
0x8234 pre_namespace_passes      LIST BirthNamespaceScanPass, exact count
0x8235 post_namespace_pass_set_sha256 SHA256, derived kind 104
0x8236 post_namespace_pass_count U32, exactly 2
0x8237 post_namespace_passes     LIST BirthNamespaceScanPass, exact count
0x8238 primitive_observation_sha256 SHA256, derived kind 105
0x8239 primitive_observation     STRUCT BirthPrimitiveObservation
0x823a retained_subject_identity_sha256 SHA256, equal `8206`
0x823b retained_subject_identity STRUCT CanonicalIdentityMember,
                                      byte-identical to `8207`
0x823c policy_temporal_profile    U32: 1 final policy signed after profile-1
                                      creation, 2 existing policy verified before profile-3 ingest
0x823d retained_all_subject_fds_until_policy_signature BOOL, exactly true
                                      profile 1; forbidden profile 3
0x823e policy_signature_observation_sha256 SHA256, derived kind 106
0x823f policy_signature_observation STRUCT PolicySignatureObservation
0x8240 reservation_claim_identity_sha256 SHA256, derived kind 15 identity kind 3
0x8241 reservation_claim_identity STRUCT CanonicalIdentityMember, kind 3
0x8242 reservation_claim_creation_sha256 SHA256, derived kind 107
```

`BirthCreatorObservation`, `BirthNamespaceScanPass`, and
`BirthPrimitiveObservation` are canonical STRUCTs:

```text
BirthCreatorObservation
  0x8701 execution_identity_sha256 SHA256, derived kind 97
  0x8702 execution_identity        STRUCT PublicProcessExecutionIdentity
  0x8703 actor_identity_sha256     SHA256, derived kind 34
  0x8704 actor_identity            STRUCT ActorIdentity, exact S2 `850a`
  0x8705 credential                STRUCT ProcessCredentialIdentity,
                                      byte-identical to `8704.6f0c`
  0x8706 held_executable_identity  STRUCT ProtectedFileIdentity
  0x8707 static_code_identity      STRUCT ExecutableCodeIdentity,
                                      byte-identical to `8704.6f0b`
  0x8708 observed_executable_identity_sha256 SHA256, derived kind 15
  0x8709 observed_executable_identity STRUCT CanonicalIdentityMember,
                                      identity kind exactly 11
  0x870a dynamic_code_status       STRUCT DynamicCodeStatusObservation,
                                      actor profile 1
  0x870b birth_authorization_sha256 SHA256, equal C2 `822c`
  0x870c continuity_started_at_unix_nanoseconds U64
  0x870d continuity_finished_at_unix_nanoseconds U64, not less than `870c`
  0x870e result                    U32, exactly 1

BirthNamespaceScanPass
  0x8721 ordinal                   U32, exactly 0 or 1
  0x8722 scan_phase                U32: 1 absent-before, 2 present-after,
                                      3 Q2 claim-present, 4 content-source-present
  0x8723 parent_identity_sha256    SHA256, derived kind 15 identity kind 2
  0x8724 parent_identity           STRUCT CanonicalIdentityMember, kind 2
  0x8725 exact_leaf_component     BYTES, 1..255 exact PathComponent
  0x8726 leaf_identity_sha256     SHA256, derived kind 58
  0x8727 leaf_identity            STRUCT ObservedArtifactIdentity,
                                      type 0 phase 1; type 1/2 phase 2;
                                      type 1 ordinary phase 3/4
  0x8728 parent_entry_count       U32, 0..1,024
  0x8729 parent_entries           LIST BirthNamespaceEntry, exact count
  0x872a parent_entry_set_sha256  SHA256, derived kind 108
  0x872b started_at_unix_nanoseconds U64
  0x872c finished_at_unix_nanoseconds U64, not less than `872b`
  0x872d complete                  BOOL, exactly true

BirthNamespaceEntry
  0x87a1 ordinal                  U32, contiguous from zero
  0x87a2 exact_entry_name         BYTES, 1..255 exact PathComponent bytes
  0x87a3 observed_identity_sha256 SHA256, derived kind 58
  0x87a4 observed_identity        STRUCT ObservedArtifactIdentity,
                                      type exactly 1 ordinary or 2 directory
  0x87a5 result                   U32, exactly 1

BirthPrimitiveObservation
  0x8741 birth_authorization_sha256 SHA256, equal C2 `822c`
  0x8742 birth_intent_sha256       SHA256, SHA-256 of exact `8743`
  0x8743 birth_intent              STRUCT ProtectedBirthIntent
  0x8744 syscall_symbol_bytes      BYTES, exactly `mkdirat` or `openat`
  0x8745 parent_fd_identity_sha256 SHA256, equal C2 `8208`
  0x8746 exact_leaf_component      BYTES, equal `8743.8605`
  0x8747 flags_value               U32, equal `8743.8610`
  0x8748 mode_value                U32, equal `8743.8611`
  0x8749 return_value              S64, nonnegative retained FD ordinary,
                                      zero directory
  0x874a errno_value               U32, exactly zero
  0x874b started_at_unix_nanoseconds U64
  0x874c finished_at_unix_nanoseconds U64, not less than `874b`
  0x874d content_bytes_written     U64, equal intent length
  0x874e content_sha256_written    SHA256, required ordinary, forbidden directory
  0x874f content_readback_sha256   SHA256, equal `874e`, required ordinary
  0x8750 final_subject_identity_sha256 SHA256, equal C2 `8206`
  0x8751 final_subject_identity    STRUCT CanonicalIdentityMember,
                                      byte-identical to C2 `8207`
  0x8752 metadata_readback_sha256 SHA256, derived kind 15 over exact role policy
  0x8753 acl_readback_sha256       SHA256, equal C2 `8215`
  0x8754 xattr_readback_sha256     SHA256, equal C2 `8216`
  0x8755 link_count_readback       U32, equal C2 `8217`
  0x8756 file_fsync_result         U32, equal C2 `8229`
  0x8757 file_fullsync_result      U32, equal C2 `822a`
  0x8758 parent_sync_result        U32, equal C2 `822b`
  0x8759 retained_fd_through_receipt BOOL, exactly true
  0x875a result                    U32, exactly 1
  0x875b retained_open_flags       U32, exact O_RDWR|O_NOFOLLOW ordinary;
                                      O_RDONLY|O_DIRECTORY|O_NOFOLLOW directory
  0x875c retained_open_return_fd   U32, exact retained FD, including the
                                      post-mkdir openat result for a directory
  0x875d source_namespace_pass_set_sha256 SHA256, derived kind 104;
                                      required ordinary, forbidden directory
  0x875e source_namespace_pass_count U32, exactly 2 ordinary, forbidden directory
  0x875f source_namespace_passes  LIST BirthNamespaceScanPass, scan phase 4;
                                      required ordinary, forbidden directory

PolicySignatureObservation
  0x8761 policy_sha256             SHA256, equal C2 `8202`
  0x8762 policy_byte_length        U64, 56..16,777,272, exact complete
                                      HMG4P2 length (`56 + payload_length`)
  0x8763 held_policy_file_identity STRUCT ProtectedFileIdentity,
                                      content length/hash equal `8762/8761`
  0x8764 policy_signer_identity_sha256 SHA256, derived kind 34
  0x8765 policy_signer_identity    STRUCT ActorIdentity, kind 2 with bit 0
  0x8766 creator_execution_identity_sha256 SHA256, equal C2 `820c`
  0x8767 retained_subject_fd_number U32, required temporal profile 1,
                                      forbidden profile 2
  0x8768 subject_identity_before_sha256 SHA256, equal C2 `8206`;
                                      required temporal profile 1, forbidden profile 2
  0x8769 subject_identity_after_sha256 SHA256, equal `8768`;
                                      required temporal profile 1, forbidden profile 2
  0x876a observation_started_at_unix_nanoseconds U64
  0x876b observation_finished_at_unix_nanoseconds U64, not less than `876a`
  0x876c policy_signature_valid    BOOL, exactly true
  0x876d result                    U32, exactly 1
  0x876e temporal_profile          U32: 1 post-creation profile 1,
                                      2 pre-existing profile 3

BirthClaimCreationObservation
  0x8781 birth_authorization_sha256 SHA256, equal C2 `822c`
  0x8782 creator_observation_sha256 SHA256, equal C2 `8230`
  0x8783 claim_leaf                BYTES, equal S2 `8524`
  0x8784 claim_identity_sha256     SHA256, equal C2 `8240`
  0x8785 claim_identity            STRUCT CanonicalIdentityMember,
                                      byte-identical to C2 `8241`
  0x8786 claim_content_length      U64, exactly 80
  0x8787 claim_content             BYTES, byte-identical to S2 `8526`
  0x8788 open_exclusive            BOOL, exactly true
  0x8789 creation_started_at_unix_nanoseconds U64
  0x878a creation_finished_at_unix_nanoseconds U64, not less than `8789`
  0x878b metadata_readback_complete BOOL, exactly true
  0x878c file_fsync_result         U32, exactly zero
  0x878d file_fullsync_result     U32, exactly zero
  0x878e parent_sync_result       U32, exactly zero
  0x878f retained_through_creation_observation BOOL, exactly true
  0x8790 result                   U32, exactly 1
  0x8791 containing_parent_identity_sha256 SHA256, equal S2 `8504`
  0x8792 containing_parent_identity STRUCT CanonicalIdentityMember,
                                      byte-identical to S2 `8505`
  0x8793 open_flags               U32, exact O_RDWR|O_CREAT|O_EXCL|O_NOFOLLOW
  0x8794 creation_mode            U32, exactly 0600 zero-extended mode_t
  0x8795 returned_fd              U32
  0x8796 errno_value              U32, exactly zero
  0x8797 content_bytes_written    U64, exactly 80
  0x8798 content_sha256_written   SHA256, SHA256(`8787`)
  0x8799 content_readback_sha256  SHA256, equal `8798`
  0x879a metadata_policy_sha256   SHA256, derived kind 15 over S2 `8527`
  0x879b retained_f_getfl         U32, exact O_RDWR with no unknown status bit
  0x879c retained_fd_number       U32, equal `8795`
  0x879d pre_namespace_pass_set_sha256 SHA256, derived kind 104
  0x879e pre_namespace_pass_count U32, exactly 2
  0x879f pre_namespace_passes     LIST BirthNamespaceScanPass, scan phase 1
  0x87b1 post_namespace_pass_set_sha256 SHA256, derived kind 104
  0x87b2 post_namespace_pass_count U32, exactly 2
  0x87b3 post_namespace_passes    LIST BirthNamespaceScanPass, scan phase 2
  0x87b4 parent_identity_stable   BOOL, exactly true
```

`822c` is the complete HMG4S2 hash, `822d` equals its header profile, `822e`
equals its kind-102 `8506`, and `822f` selects exactly one S2 intent. C2 does not
duplicate the S2 bytes: the later Q2 session `8164..8166` supplies and fully
validates the sole complete S2 preimage, and all C2 values for that S2 cross-equal
those three fields. The selected intent's role/index/type/leaf/content/metadata/
primitive/creator equal `8203..820b`, `8215..8217`, `8226..8227`, and the
observed parent relation.
The creator first retains and revalidates the exact parent, performs the two
complete kind-104 phase-1 `8234` scans proving the selected leaf absent, and then executes exactly one
profile-selected exclusive primitive. It never follows a symlink, retries an
ambiguous return, overwrites, adopts, links, renames, deletes, or cleans up. The
subject FD remains held while owner/group/mode/flags/ACL/xattr/type/link count
are applied where authorized, read back twice, and compared to the exact policy
role. An ordinary file is `fsync`ed and `F_FULLFSYNC`ed; the held parent is then
synced. A directory has no fictitious file-sync success: `8218/8219=false` and
`8229/822a=0xffffffff`; its parent sync and two complete directory-identity/
namespace readbacks are mandatory. The two phase-2 `8237` scans are complete,
byte-identical after ordinal removal, and contain exactly the newly created
leaf identity plus an otherwise unchanged parent entry set. `8232/8235` are
kind 104 over their lists; `8230` is kind 103 over `8231`; `8238` is kind 105
over `8239`; all counts agree. Their parent/leaf/intent/times and resulting
identity cross-equal. `8206` is recomputed over `8207`, `8208`
over `8209`, `820c` over `820d`, `820a` over `820b`, and every credential/code
field is byte-identical to the S2-selected creator actor and `8231`. Profile 1
uses the exact UID0 bit-19 provisioner and permits only the signed new-subject
create/chown/readback/sync graph; profile 3 uses the nonzero bit-11 ingest
broker. Both carry the SDK canonical empty entitlement blob and profile-1
dynamic code status, and `870c <= 821b <= 821c <= 870d`.

Every boolean/result is derived, not accepted alone. `8210` equals each phase-1
`8726` and type 0 `8727`; `8207/823b/8751` are byte-identical and their kind-15
hash is `8206/823a/8750`; `8215/8216/8217` equal the final retained identity's
ACL/xattr/link readback and exact S2 intent; `8218/8219/8228..822b` equal
`8756..8759`. For an ordinary file, `875d..875f` contain two complete phase-4
source scans; their parent/leaf/identity equal `8617/8618/861b/8615/8616` and
they bracket the exact nofollow read-only source open. `8744..8748` are the
exact SDK-bound primitive and arguments,
`8749/874a` are its one successful return, an ordinary-file write loop handles
short writes/EINTR without crossing the deadline and exact readback equals
`8607/8608`, and every non-EINTR error or ambiguous visible leaf blocks without
retry. The creator's complete execution/code/credential is bracketed before
the first absence scan through the last parent sync.

The policy timing profiles are disjoint. Profile 1 requires
`823c=876e=1`, `823d=true`, and `876a` after every profile-1 creation/readback/
sync. Retained actual identities generate final P2; the bit-0 root signs it;
only then may the independent bit-17 attestor sign C2 with `8202` equal that P2.
Profile 3 requires `823c=876e=2`, forbids `823d` and `8767..8769`, and requires
`8761==S2.8529==8202`: the complete root-signed P2 is opened and verified before
the claim or evidence leaf is created. Profile 3 never regenerates P2 or claims
that policy signing followed ingest.

`8240/8241` are the one claim identity and `8242` is kind 107 over the sole
complete Q2-session `816a`. That observation cross-equals S2/creator/parent/
claim, has the exact exclusive flags/mode/returned FD, writes and reads back all
80 bytes, applies/readbacks exact role 22, syncs file and parent, and contains
two phase-1 and two phase-2 complete parent scans. The phase-1 leaf is absent;
phase 2 contains exactly the new claim with an otherwise unchanged parent set.
`8798=8799=SHA256(8787)`, `879a` hashes S2 `8527`, `879b` is exact post-open
F_GETFL, and all pass-set hashes/counts recompute. A boolean without these
preimages, a different parent/leaf, or a future-Q2 assertion is invalid.

Profile 1 and profile 3 form separate acyclic lifecycles. Profile 1 is
S2 -> claim/subject creation observations -> final root-signed P2 -> C2
attestations -> U2/I2/dynamic evidence -> Q2. Profile 3 begins with an already
signed P2, then S2 bound to that P2 -> claim/evidence ingest -> C2 -> later Q2.
At Q2, kind 112 contains one session per distinct S2, embeds that S2 and claim
preimage once, reopens the unchanged claim under the unchanged bootstrap parent,
maps every intent to exactly one C2/ProtectionSubject, and supplies current
creator/broker status. No C2 asserts anything about future Q2.

Each profile-1 S2 defines one rooted subgraph. Its intent-0 root C2 may have role
1 or 2, has `87d8=0xffffffff`, the sole zero `821d` for that session, and hash
equal session `8182`. Every later binding names its earlier parent intent and
uses that binding's C2 hash in `821d`; cross-S2 parent edges are forbidden.
Each profile-3 intent has `87d8=0xffffffff`, no zero sentinel, and `821d` equals
session `8183`, the already complete profile-1 C2 whose subject equals S2 `8505`.
Across kind 112, S2 hashes/nonces/bootstrap parents/root paths/intent keys are
distinct; every profile-1/3 ProtectionSubject and every S2 intent occurs exactly
once. Extra intent/C2, orphan, cycle, duplicate key/receipt, or a global-single-
root rule is invalid.

For profile 1, kind 114 targeted KERN_PROC_PID observations immediately around
the two Q2 process passes accept only no record or a different birth tuple for
the exact old bit-19 creator; they do not claim protection from other UID0
processes. Profile 3 requires the exact same bit-11 birth tuple, class-2 process
record, credential, and code in both Q2 passes and later final admission. The
Q2 bit-9 observer opens the role-22 claim with exact read-only/nofollow flags,
holds it through Q2 signing, and has the actor/group fixed by S2 `852a/852b`.
The two phase-3 scans, held-FD identity/content/metadata, and kind-107 creation
identity all agree. Aggregate checked bytes in `4058` and the outer 1-GiB frame
cap are both enforced before allocation.

Q2 embeds every complete C2 in `4053.*.8158`, rechecks signatures and every
policy/root/parent/subject/metadata/creator/interval equality, and rejects a
post-hoc snapshot, unsigned log, path-only or inode-only identity, or Q2-issuer
assertion in place of HMG4C2.

HMG4C2 is an embedded-only framed authority preimage. It has no
EvidenceLocation, approved evidence-relative path, standalone protected leaf,
or ProtectionSubject role, and no HMG4C2 ever requires another C2 merely to
store its own bytes. The provisioning/ingest evidence retains each subject,
parent, claim, and receipt transcript until Q2 embeds every complete C2 plus the
one-per-S2 session preimages. An optional diagnostic copy outside
that Q2 is non-authoritative and cannot satisfy any hash, replay, custody,
birth, or runtime edge.

The current successor-authoring/workspace authority does not authorize fresh
tree provisioning, protected ingest, HMG4C2 generation/signing, or any
filesystem mutation represented here. Those actions require a later explicit
owner authorization; until real receipts exist, every dependent Q2 is blocked.
The unsigned payload hash and `8222..8224` follow Section 8.5.

### 8.4 Quiescence/access-revocation receipt: `HMG4Q2`

Payload:

```text
0x4001 protocol_spec_sha256       SHA256
0x4002 helper_sha256              SHA256
0x4003 policy_sha256              SHA256
0x4004 protected_install_receipt_sha256 SHA256
0x4005 reproducible_build_receipt_sha256 SHA256
0x4006 target_capability_sha256   SHA256
0x4007 system_lock_capability_sha256 SHA256
0x4008 issuer_identity_sha256     SHA256
0x4009 sole_writer_identity_sha256 SHA256
0x400a protection_epoch_nonce     BYTES, exactly 32
0x400b root_identity              STRUCT RootIdentity
0x400c custody_parent_identity    STRUCT DirectoryIdentity
0x400d issued_at_unix_seconds     U64
0x400e expires_at_unix_seconds    U64
0x400f quiescence_method          U32: exactly 1 public protected-from-birth
0x4010 subject_count              U32, 1..512
0x4011 subjects                   LIST ProtectionSubject
0x4012 subject_set_sha256         SHA256, derived kind 29
0x4013 observation_count          U32, exactly 2
0x4014 observations               LIST QuiescenceObservation
0x4015 stable_namespace_scan_sha256 SHA256, derived kind 40
0x4016 unexpected_non_tcb_writer_process_count U32, exactly zero;
                                      equal class-3 projection count
0x4019 mutable_managed_inode_count U32, exactly zero
0x401a result                     U32, exactly 1
0x401b acceptance_effect_mask     U64, exactly zero
0x401c boot_session_uuid          BYTES, exactly 16
0x401d scan_epoch_nonce           BYTES, exactly 32, nonzero
0x401e process_inventory_sha256   SHA256, derived kind 36
0x4021 access_denial_probe_set_sha256 SHA256, derived kind 39
0x4022 birth_protection_rule_set_sha256 SHA256, derived kind 41
0x4024 process_snapshot_or_parser_error_count U32, exactly zero
0x4025 stable_pass_count          U32, exactly 2
0x4026 required_subject_count     U32, equal policy/request count
0x4027 required_subject_set_sha256 SHA256, equal policy/request derived kind 28
0x4028 observation_set_sha256     SHA256, derived kind 30 over `4014`
0x402c process_record_count       U32, 0..16,384
0x4032 denial_probe_record_count  U32, 1..6,144
0x4033 denial_probe_records       LIST AccessDenialProbeRecord, exact count
0x4034 namespace_record_count     U32, 1..65,536
0x4036 birth_rule_count           U32, exactly 5
0x4037 birth_rules                LIST BirthProtectionRule, exact count
0x4038 issuer_identity            STRUCT ActorIdentity, kind 2 with bit 2
0x4039 evidence_attestation_statement_sha256 SHA256, derived kind 57
0x403a signature_algorithm        U32, exactly 1 Ed25519
0x403b detached_signature         BYTES, exactly 64
0x403c executable_identity_count  U32, 1..1,024
0x403d executable_identities      LIST CanonicalIdentityMember, exact count;
                                      every identity_kind exactly 11
0x403e executable_identity_catalog_sha256 SHA256, derived kind 59
0x403f process_pass_count         U32, exactly 2
0x4040 process_passes             LIST ProcessInventoryPass, exact count
0x4041 process_pass_set_sha256    SHA256, derived kind 62
0x4048 namespace_pass_count       U32, exactly 2
0x4049 namespace_passes           LIST NamespaceScanPass, exact count
0x404a namespace_pass_set_sha256  SHA256, derived kind 56
0x404b approved_writer_projection_sha256 SHA256, derived kind 99
0x404c approved_writer_projection_count U32, exact count
0x404d approved_writer_projection LIST ProcessInventoryRecord, exact count;
                                      trust classes exactly 1 or 2
0x404e fd_vm_observation_performed BOOL, exactly false
0x404f fd_vm_authority_claim      BOOL, exactly false
0x4050 protection_claim_against_uid0_or_kernel BOOL, exactly false
0x4051 protected_birth_evidence_set_sha256 SHA256, derived kind 100
0x4052 protected_birth_evidence_count U32, equal `4010`
0x4053 protected_birth_evidence   LIST ProtectedBirthEvidence, exact count
0x4054 fresh_managed_tree_only    BOOL, exactly true
0x4055 protected_birth_session_set_sha256 SHA256, derived kind 112
0x4056 protected_birth_session_count U32, exact distinct HMG4S2 count
0x4057 protected_birth_sessions   LIST ProtectedBirthSessionEvidence, exact count
0x4058 embedded_birth_authority_total_bytes U64, checked sum of every unique
                                      S2 plus all `4053.8157`, at most 536,870,912
```

Q2's upstream authority-chain equality table is iff and field-specific:

```text
4001 = this successor specification SHA-256
4002 = policy 1004 = U2 6007 = I2 5002 = target/system K2 3002
4003 = SHA256(complete held HMG4P2) = U2 6006 = I2 5003
       = target/system K2 3003
4004 = SHA256(complete held selected HMG4I2)
4005 = SHA256(complete held selected HMG4U2) = I2 5006
4006 = SHA256(complete held target-scope HMG4K2) = U2 6008 = I2 5007
4007 = SHA256(complete held system-lock-scope HMG4K2) = U2 6009 = I2 5008
```

The two K2 objects are distinct and have scopes 1 and 2 respectively. Q2 opens,
fully frames/parses/signature-validates, and rehashes every object named above;
the equality table accepts no digest without its held preimage. The consuming
request, BEGIN/RECOVERY_BEGIN, terminal receipt, W2/O2, and Section-15 DAG repeat
these same complete object hashes in their named fields. A helper/policy/build/
install/capability value from another chain cannot satisfy one row merely
because its semantic label matches.

`400b` is byte-identical to policy `1007` and to predecessor request `0007` for
the request that consumes this receipt. `400c` is byte-identical to `2304` of
the unique policy ProtectedParent with role 3/subrole 1. Its slot, complete
component/edge chain, target-domain device/filesystem/mount tuple, owner/group/
mode/flags/ACL/xattrs, and inode are all compared, not merely a pathname or
kind-15 hash. Any other project root or custody parent makes the Q2 inapplicable.

The two observations are exactly (ordinal/kind 0/1) the complete public
authority-relevant process projection and (1/2) the access-denial/model
projection. Their `4304` values equal `401e` and `4021`, and `4305` equals
`402c` and `4032`. All process records share `401c`; every observation binds a
reviewed non-UID0 tool, exact public execution identity, retained executable,
canonical result hash/count, `completeness=true`, and zero violations. Q2 makes
no claim of enumerating another process's FDs, VM regions, audit token, task
port, entitlement state, or kernel-private identity: `404e/404f/4050` are all
false, and removed tags `4017`, `4018`, `401f`, `4020`, `4023`, `4029..402b`,
`402e`, `4030`, and `4042..4047` are unknown/forbidden. Only method 1 and real
protected-birth receipts are legal. Receipt lifetime is at most 300 seconds at
admission; expiry after a durable BEGIN does not revoke the transaction already
bound to it.

`4041` and `404a` are kinds 62 and 56 over their two-pass lists. `401e` equals
both process-pass kind-36 hashes; `402c` equals both relevant record counts;
both passes have purpose 1, ordinals 0/1, the same boot UUID and writer-rule
set, zero class-3 records, and a byte-identical authority-relevant projection.
The complete KERN_PROC_ALL count partition is checked independently in each
pass. `4015` equals both namespace-pass kind-40 hashes, and kind 56 additionally
requires both passes' protected-parent lists to equal policy `1015`. `4021` and
`4022` are recomputed over `4033` and `4037`; every count agrees. `404b` is
kind 99 over `404d`, which is the deterministic classes-1/2-only projection of
either stable process pass; `404c` agrees. Observation tools are proven through
the separate `4303/4308/4309/430d/430a` QuiescenceObservation fields and are
intentionally absent from ProcessInventoryRecord and the approved-writer
projection; no trust class 4 exists.

`403e` is kind 59 over `403d`. Every class-1/2 process `4405` names exactly one
complete observed executable in that catalog; class 3 forbids `4405` and
cannot gain trust from a missing code observation. Duplicate identity or hash
is forbidden. `4037` is byte-identical to policy `1032`. Each `4303` is kind 34
over `4308`, resolves uniquely to policy bit 9, and its observation hash/count
equals the corresponding embedded projection. `4309` is kind 97 over `430d`;
`430d.8132==401c`, and targeted KERN_PROC_PID samples bracketing
`430b..430c` repeat the same PID/start/parent/boot fields. `430a` resolves to one
`403d` identity-kind-11 ObservedExecutableIdentity whose held/static/dynamic
code fields equal `4308.6f0b`, whose entitlement blob is the SDK canonical
empty blob, and whose creator credential is `4308.6f0c`. The observation-tool
UID is nonzero and differs from every writer UID. `430b` precedes the first
applicable pass, `430c` follows the second and payload assembly, and
`430b <= 430c <= 400d`. Exit/restart, PID/start reuse, `exec`, code/credential
drift, tracing, nonempty entitlement, or a missing catalog member blocks Q2.

`4008` is kind 34 over `4038`, equals
the role-5 EvidenceTrustRule issuer, and carries bit 2. `4039..403b` satisfy
Section 8.5.

Each `ProtectionSubject` contains exactly:

```text
0x4201 ordinal                    U32, contiguous from zero
0x4202 subject_role               U32
0x4203 managed_index              U32, 0..113 or 0xffffffff
0x4204 location_or_entry_sha256   SHA256
0x4205 expected_identity_sha256   SHA256
0x4206 admission_mode             U32, exactly 1 protected-from-birth
0x4207 protection_metadata_sha256 SHA256
0x4208 birth_evidence_sha256      SHA256, SHA-256 of selected complete
                                      ProtectedBirthEvidence
0x4209 birth_profile              U32: 1 fresh-tree provisioning,
                                      2 protected install, 3 protected ingest
0x420a deny_test_observation_sha256 SHA256, derived kind 39
0x420b result                     U32, exactly 1
0x420c deny_test_count            U32, exact required role-operation count
0x420d deny_test_observations     LIST AccessDenialProbeRecord, exact count
0x420e expected_identity          STRUCT CanonicalIdentityMember
0x420f evidence_role              U32, required subject role 9, forbidden otherwise
0x4210 header_discriminator       U32, required subject role 9, forbidden otherwise
0x4211 occurrence_ordinal         U32, required subject role 9, forbidden otherwise
0x4212 evidence_object_sha256     SHA256, required subject role 9, forbidden otherwise
0x4213 containing_parent_identity_sha256 SHA256, derived kind 15 identity kind 2
0x4214 containing_parent_identity STRUCT CanonicalIdentityMember,
                                      identity kind exactly 2 DirectoryIdentity
0x4215 birth_evidence_ordinal     U32, index into Q2 `4053`
```

`subject_role` is exactly 1 managed runtime root, 2 protected parent, 3 initial
managed live inode, 4 plan, 5 bundle, 6 installed policy, 7 installed helper,
8 permanent lock, 9 protected evidence object, or 10 launcher configuration.
Role/index/location
combinations outside their policy binding are invalid. A not-yet-created
transaction object is never claimed as a pre-BEGIN subject; its creation must
instead satisfy the protected-from-birth intent and post-create checks.
The managed runtime root is a future freshly provisioned runtime tree; the
workspace checkout and its project/review roots are authority anchors only and
can never instantiate role 1. Roles 1/2/3/10 require birth profile 1, roles
6/7/8 require profile 2, and roles 4/5/9 require profile 3. `4215` selects exactly one
`4053` member whose subject ordinal/role/index, identity, containing parent,
profile, and `SHA256(member)==4208` all agree. An adopted current directory,
historical inode, or object lacking this evidence blocks Q2.
`4051` is kind 100 over `4053`, `4052==4010`, and `4058` is the checked U64 sum
of every `8157` plus every distinct session `8165`; the sum is at most
536,870,912 and the complete Q2 payload independently remains at most 1 GiB.
For profiles 1/3, `8156==SHA256(8158)` and `8158` is one complete HMG4C2 whose
header/profile, `8204/8205`, `8206/8207`, `8208/8209`, `820a/820c`, and
`821b/821c` equal `8155`, `8153/8154`, `8159/815a`, `815b/815c`,
`815d/815e`, and `815f/8160`. Profile 2 instead requires
`8156==SHA256(8158)` and parses the one complete HMG4I2 selected by Q2 `4004`.
That I2 must pass its own signature, exact kind-187 prerequisite C2/S2/claim
set, exact equality `I2.5038/5039 == Z2.7617/7618`, and exact kind-189
three-member install-birth observation validation. Q2 reopens and strictly
verifies the complete Z2 selected by I2 `5009`; a bare Z2 hash is insufficient.
The profile-2 field mapping is exhaustive:

```text
Q2 subject role  install observation  leaf  metadata  retained identity
6 policy         503d[1], 9a21=1      5011  14        5012
7 helper         503d[0], 9a21=0      500e  13        500f
8 lock           503d[2], 9a21=2      5013  15        5014
```

For the selected row, `8159/815a == 9a3b/9a3c` and equal the subject
`4205/420e`; `815b/815c == 9a25/9a26` and are the kind-15/canonical projection
of I2 `500d`; `815d == 9a2a == 5027`; `815e == 9a2c == 5031.7981`; and
`815f/8160 == 9a35/9a36`. The row's role, metadata role, leaf, source bytes,
absence passes, exclusive primitive, creator/execution, retained FD/identity,
readback, sync, post passes, and interval must all satisfy Section 8.3.
Profile 2 synthesizes no C2/S2 session because its three subject births are
the exact I2 observations, while the C2/S2 prerequisite parents embedded in
that I2 remain independently parsed and revalidated. Any role swap, locally
rehashed side, final identity without its absence/primitive transcript, or I2
from another Q2 chain is invalid.

The selected I2's four kind-187 prerequisite members also map bijectively to
four profile-1 Q2 subjects/evidence members: the three role-2 subjects selected
by their exact policy parent ordinals and the one role-10 launcher-configuration
subject. For each mapping, `8156/8158 == 99aa/99ac`; the selected kind-112
session has `8164/8166 == 99ad/99af`; and its `8169/816a == 99b0/99b1`.
Subject and containing-parent identities equal `99a5..99a8`. Every one of the
four kind-187 members is used exactly once and no Q2 subject may use an
alternate C2/S2/claim for that same prerequisite. Thus Q2 does not merely
revalidate I2 internally while presenting a different birth chain externally.

`4055` is kind 112 over `4057`; `4056` is the exact distinct S2 count among
profile-1/3 C2 values. In each session, `8164==SHA256(8166)`, the S2 frame has
profile `8163`, `8165==length(8166)`, and every `817e` binding selects exactly
one subject/evidence/C2 whose `822c/822d/822e/822f` equal that S2 hash/profile/
intent-set/intent ordinal. `817c` is kind 113 over `817e`; its count equals every
S2 intent exactly once. Profile-1 root/child and profile-3 external-parent rules
are the per-session topology above.

`8169==SHA256(816a)` under kind 107 and equals every selected C2 `8242`;
`816b/816c`, `816d..8170`, and the creation observation all equal the S2 claim.
Two phase-3 `8173` scans are complete and byte-identical after ordinal/time
omission, use parent `8167/8168`, find leaf `816d` with identity `816b/816c`,
and contain no ambiguous/colliding entry. The exact bit-9 tool at observation 0
opens it once with `8177`, retains `8176`, obtains exact `8178`, and holds a
byte-identical `8179/817a` through Q2 signing; content readback hashes to `817b`
and metadata equals S2 role 22. Both QuiescenceObservation values use the same
`852a/852b` actor and continuous public execution identity for this custody.

`817f` is kind 114 over `8181`. Profile 1 has lifecycle 1 and accepts only
KERN_PROC_PID result 1 or 2 in both members; an observed tuple in result 2 must
differ from the exact prior creator tuple. Profile 3 has lifecycle 2 and requires
result 3 plus the byte-identical class-2 broker record in corresponding Q2 pass.
Queries bracket their selected complete process passes; boot/layout/PID agree.
PID-only, one-pass, UID-only, hash-only, or a claim against every UID0 process is
invalid.
`4205` is kind 15 over `420e`; `420a` is kind 39 over `420d`; and `420d` is
the exact projection of receipt `4033` for that subject ordinal. No denial
subset may be represented by a bare hash.
The observed-identity kinds are closed: roles 1 and 2 `420e` are actual held
DirectoryIdentity kind 2 values, and roles 3..10 are actual held ordinary-file
ProtectedFileIdentity kind 3 values. For role 1, that ACL/xattr-bearing
DirectoryIdentity is the exact observed projection of policy project
RootIdentity `1007`: `2201 == 020a == 2`, `2202 == 020c`,
`2203..2208 == 0201..0206`, `220b == 0207`, `220c == 0208`,
`220e == 020b`, `220f == 020d`, `2210 == 020e`, and `2211 == 020f`;
`2209/220a` are the complete freshly observed ACL/xattr hashes that
RootIdentity intentionally does not carry. The absolute path reconstructed
from `220f` equals `0209`. Code,
Entry, FinalEntry, EvidenceLocation, or policy requirement identities remain
cross-bindings elsewhere but cannot replace the ACL-bearing held target here.
`4213` is kind 15 over `4214` and every `4214` is the actual held immediate
containing DirectoryIdentity: for role 1, remove the final component/edge from
the policy RootIdentity walk; for role 2, remove the final component/edge from
that policy ProtectedParent walk; for role 3, use the unique role-4
ProtectedParent selected by its Entry index; for roles 4, 5, and 9, use the
selected EvidenceLocation `630e`; for roles 6, 7, and 8, use policy
role-1/subrole-1 `2304`; and for role 10, use role-1/subrole-2 `2304`.
Every prefix-derived parent is re-opened from the held authority root and its
complete component/edge/mount/metadata identity must agree; a device/inode-only
prefix or another parent with the same permissions is invalid.

Roles 1 and 2 have exactly nine denial probes ordered `(1,0), (2,1), (2,2),
(3,0), (7,0), (8,0), (9,0), (10,0), (11,0)`. Directory hardlink is not a
permission probe and is therefore forbidden for roles 1/2. Roles 3..10 have exactly
nine, `(3,0)` through `(11,0)`. Those counts equal `420c`; `420d` and global
`4033` preserve the kind-39 subject/operation/scenario sort. Scenario 0 is
required and scenarios 1/2 forbidden outside operation 2; operation 2 requires
one of each for roles 1/2 and is forbidden for roles 3..10. Missing, repeated,
or extra scenario rows invalidate Q2.
For subject role 9, `420f..4211` equal requirement `6e08..6e0a`, `4204` equals
`6e05 == 6e0d`, and the held ordinary file's `ProtectedFileIdentity.6204`
equals actual complete object hash `4212`. Binding 1 requires `4212 == 6e0c`;
binding 2 requires `4212` equal the unique request/evidence-DAG dependency
selected by role/kind/occurrence. The header magic/discriminator and complete parsed object bytes
must match that evidence role; a content hash under the wrong role or location
is invalid.

Each `QuiescenceObservation` contains exactly:

```text
0x4301 ordinal                    U32, exactly 0 or 1
0x4302 observation_kind           U32, exactly ordinal + 1
0x4303 observation_tool_sha256    SHA256
0x4304 canonical_observation_sha256 SHA256
0x4305 record_count               U32
  0x4306 completeness               BOOL, exactly true
  0x4307 violation_count            U32, exactly zero
  0x4308 observation_tool           STRUCT ActorIdentity, kind 3 with bit 9
  0x4309 observation_execution_identity_sha256 SHA256, derived kind 97
  0x430a observation_executable_identity_sha256 SHA256, derived kind 15 identity kind 11
  0x430b continuity_start_unix_seconds U64
  0x430c continuity_end_unix_seconds U64
  0x430d observation_execution_identity STRUCT PublicProcessExecutionIdentity
  0x430e observation_credential     STRUCT ProcessCredentialIdentity,
                                      byte-identical to `4308.6f0c`
  0x430f observation_executable_identity STRUCT CanonicalIdentityMember,
                                      identity kind exactly 11; kind-15 hash `430a`
  0x4310 observation_dynamic_code_status STRUCT DynamicCodeStatusObservation,
                                      actor profile 1
```

The system-visibility records are exact canonical STRUCTs:

```text
PublicProcessExecutionIdentity
  0x8131 identity_version            U32, exactly 1
  0x8132 boot_session_uuid           BYTES, exactly 16, equal enclosing receipt
  0x8133 pid                         U32, nonzero
  0x8134 parent_pid                  U32
  0x8135 start_time_seconds          U64
  0x8136 start_time_microseconds     U32, 0..999,999
  0x8137 source_profile              U32, exactly 1 public KERN_PROC
  0x8138 sdk_layout_binding_sha256   SHA256, equal SDKIdentity `4f35`
  0x8139 result                      U32, exactly 1

RunningCodeObservation
  0x4a01 self_execution_identity_sha256 SHA256, derived kind 97
  0x4a02 self_execution_identity      STRUCT PublicProcessExecutionIdentity
  0x4a03 parent_execution_identity_sha256 SHA256, derived kind 97
  0x4a04 parent_execution_identity    STRUCT PublicProcessExecutionIdentity
  0x4a05 held_helper_file_identity    STRUCT ProtectedFileIdentity
  0x4a06 held_static_code_identity    STRUCT ExecutableCodeIdentity
  0x4a07 runtime_validated_self_code_identity STRUCT ExecutableCodeIdentity
  0x4a08 runtime_validated_parent_code_identity STRUCT ExecutableCodeIdentity
  0x4a09 installation_component_sequence_sha256 SHA256, derived kind 13
  0x4a0a installation_edge_set_sha256 SHA256, derived kind 35
  0x4a0b launcher_configuration_sha256 SHA256, derived kind 48
  0x4a0c result                       U32, exactly 1
  0x4a0d installation_component_sequence STRUCT ComponentSequence
  0x4a0e installation_edge_count     U32, equal component count
  0x4a0f installation_edges          LIST ParentChildEdge, exact count
  0x4a10 self_dynamic_code_status     STRUCT DynamicCodeStatusObservation,
                                         actor profile 1
  0x4a11 parent_dynamic_code_status   STRUCT DynamicCodeStatusObservation,
                                         actor profile 1
  0x4a12 self_credential              STRUCT ProcessCredentialIdentity
  0x4a13 parent_credential            STRUCT ProcessCredentialIdentity
  0x4a14 writer_admission_observation_sha256 SHA256, derived kind 98
  0x4a15 writer_admission_observation STRUCT WriterAdmissionObservation
  0x4a16 observation_phase            U32: 1 pre-BEGIN/RECOVERY_BEGIN admission,
                                         2 post-mutation pre-terminal admission
  0x4a17 parent_launcher_executable_observation_sha256 SHA256, derived kind 146
  0x4a18 parent_launcher_executable_observation STRUCT ParentLauncherExecutableObservation
  0x4a19 policy_bootstrap_observation_sha256 SHA256, derived kind 168
  0x4a1a policy_bootstrap_observation STRUCT PolicyBootstrapObservation

ProcessInventoryRecord
  0x4401 ordinal                     U32, contiguous from zero
  0x4402 execution_identity_sha256  SHA256, derived kind 97
  0x4403 execution_identity         STRUCT PublicProcessExecutionIdentity
  0x4404 parent_execution_identity_sha256 SHA256, derived kind 97
  0x4405 executable_identity_sha256  SHA256, derived kind 15 identity kind 11;
                                         required classes 1/2, forbidden class 3
  0x4406 trust_class                 U32: 1 runtime sole writer,
                                         2 approved non-TCB policy writer,
                                         3 unexpected credential-equivalent writer
  0x4407 authority_match_reason_mask U32: bit 0 actor reference, bit 1 real UID,
                                         bit 2 effective UID, bit 3 saved UID;
                                         at least one bit, higher bits zero
  0x4408 code_observed               BOOL, true classes 1/2, false class 3
  0x4409 record_result               U32, exactly 1
  0x440a reserved_zero               U32, exactly zero
  0x440b inspection_error_count      U32, exactly zero for fields this profile claims
  0x440c stable_pass_mask            U32, exactly 3
  0x440d matched_actor_identity_sha256 SHA256, required trust classes 1/2;
                                         forbidden class 3
  0x440e credential                  STRUCT ProcessCredentialIdentity
  0x440f dynamic_code_status         STRUCT DynamicCodeStatusObservation,
                                         required trust classes 1/2;
                                         forbidden class 3
  0x4410 parent_execution_identity  STRUCT PublicProcessExecutionIdentity
  0x4413 live_non_zombie            BOOL, exactly true
  0x4414 traced                     BOOL, exactly false classes 1/2;
                                         diagnostic class 3 may be true or false

WriterAdmissionObservation
  0x8141 observation_version        U32, exactly 1
  0x8142 quiescence_receipt_sha256  SHA256, complete admitted HMG4Q2
  0x8143 boot_session_uuid          BYTES, exactly 16, equal Q2 `401c`
  0x8144 process_pass_sha256        SHA256, SHA-256 of exact nested `8145`
  0x8145 process_pass               STRUCT ProcessInventoryPass, final admission
  0x8146 writer_authority_rule_set_sha256 SHA256, derived kind 52
  0x8147 q2_writer_projection_sha256 SHA256, derived kind 99, equal Q2 `404b`
  0x8148 unexpected_writer_count    U32, exactly zero
  0x8149 scan_started_monotonic_nanoseconds U64
  0x814a scan_finished_monotonic_nanoseconds U64, not less than `8149`
  0x814b phase_sample_monotonic_nanoseconds U64, not less than `814a`
  0x814c maximum_scan_to_phase_nanoseconds U64, exactly 5,000,000,000
  0x814d self_execution_identity_sha256 SHA256, equal enclosing `4a01`
  0x814e parent_execution_identity_sha256 SHA256, equal enclosing `4a03`
  0x814f result                     U32, exactly 1
  0x8150 observation_phase          U32, equal enclosing `4a16`

VnodeFDRecord
  0x4501 ordinal                     U32, contiguous from zero
  0x4502 process_record_sha256       SHA256, derived kind 15
  0x4503 fd_number                   U32
  0x4504 access_mode                 U32: 1 read, 2 write, 3 read-write
  0x4505 fcntl_status_flags          U32, exact observed bit pattern
  0x4506 device                      U64
  0x4507 inode                       U64
  0x4508 object_type                 U32: 1 ordinary, 2 directory, 3 symlink,
                                         4 socket/device/other; derived only from
                                         held `st_mode & S_IFMT`
  0x4509 protection_subject_ordinal  U32 or 0xffffffff
  0x450a writable                    BOOL
  0x450b violation                   BOOL, exactly false

WritableFileMappingRecord
  0x4511 ordinal                     U32, contiguous from zero
  0x4512 process_record_sha256       SHA256, derived kind 15
  0x4513 region_start                U64
  0x4514 region_end_exclusive        U64, greater than start
  0x4515 current_protection          U32
  0x4516 maximum_protection          U32
  0x4517 share_mode                  U32
  0x4518 device                      U64
  0x4519 inode                       U64
  0x451a file_offset                 U64
  0x451b protection_subject_ordinal  U32 or 0xffffffff
  0x451c violation                   BOOL, exactly false

AccessDenialProbeRecord
  0x4601 ordinal                     U32, contiguous from zero
  0x4602 protection_subject_ordinal  U32
  0x4603 credential_sha256           SHA256, derived kind 60
  0x4604 operation_code              U32, exact registry 1..11
  0x4605 fixture_mutation_expected_errno U32, exactly the unique selected
                                         kind-73 row `7f33` (1 EPERM or 13 EACCES);
                                         never observed against production
  0x4606 accessx_observed_errno      U32: 13 EACCES, 1 EPERM, or
                                         0xffffffff unsupported/not applicable
  0x4607 before_identity_sha256      SHA256, derived kind 15
  0x4608 after_identity_sha256       SHA256, equal before
  0x4609 result                      U32, exactly 1
  0x460a evidence_method             U32, exactly 3 no-effect access query plus
                                         exact ACL/mode/flags evaluation
  0x460b mutation_syscall_attempted  BOOL, exactly false
  0x460c credential                  STRUCT DenialCredential
  0x460d access_control_evaluation_sha256 SHA256, derived kind 61
  0x460e access_control_evaluation   STRUCT AccessControlEvaluation
  0x460f authorization_target_set_sha256 SHA256, equal `460e.787f`
  0x4610 operation_scenario          U32: 0 non-rename, 1 rename-in, 2 rename-out

ProtectedNamespaceRecord
  0x4801 ordinal                     U32, contiguous from zero
  0x4802 protected_parent_ordinal    U32
  0x4803 exact_entry_name            BYTES, 1..255 exact enumerated bytes
  0x4804 observed_identity_sha256    SHA256, derived kind 15
  0x4805 stable_pass_mask            U32, exactly 3
  0x4806 observed_identity            STRUCT CanonicalIdentityMember

BirthProtectionRule
  0x4701 birth_role                  U32: 1 journal, 2 request-copy,
                                         3 archive, 4 stage, 5 terminal-receipt
  0x4702 protected_parent_ordinal    U32
  0x4703 metadata_source             U32: 1 fixed RoleMetadataPolicy,
                                         2 held source FinalEntry,
                                         3 Entry plus HMG4Y2
  0x4704 sole_writer_identity_sha256 SHA256, derived kind 15
  0x4705 exclusive_no_replace        BOOL, exactly true
  0x4706 protected_parent_before_visibility BOOL, exactly true
  0x4707 fd_readback_before_use      BOOL, exactly true
  0x4708 parent_sync_required        BOOL, exactly true
  0x4709 fixed_role_metadata_policy_sha256 SHA256, derived kind 15;
                                         required source 1, forbidden 2/3

ProtectedBirthEvidence
  0x8151 ordinal                     U32, contiguous from zero
  0x8152 protection_subject_ordinal U32, equal selected subject `4201`
  0x8153 subject_role                U32, equal selected subject `4202`
  0x8154 managed_index               U32, equal selected subject `4203`
  0x8155 birth_profile               U32, equal selected subject `4209`
  0x8156 authority_object_sha256    SHA256, complete HMG4C2 profiles 1/3 or
                                         complete HMG4I2 profile 2
  0x8157 authority_object_length    U64, 56..67,108,920
  0x8158 authority_object_bytes     BYTES, exact `8157` bytes, 56..64 MiB plus frame;
                                         explicit field override of BYTES default
  0x8159 subject_identity_sha256    SHA256, equal selected subject `4205`
  0x815a subject_identity           STRUCT CanonicalIdentityMember,
                                         byte-identical to selected `420e`
  0x815b containing_parent_identity_sha256 SHA256, equal selected `4213`
  0x815c containing_parent_identity STRUCT CanonicalIdentityMember,
                                         byte-identical to selected `4214`
  0x815d creator_actor_identity_sha256 SHA256, derived kind 34
  0x815e creator_execution_identity_sha256 SHA256, derived kind 97
  0x815f creation_started_at_unix_nanoseconds U64
  0x8160 creation_finished_at_unix_nanoseconds U64, not less than `815f`
  0x8161 result                      U32, exactly 1

ProtectedBirthSessionEvidence
  0x8162 ordinal                     U32, contiguous after unsigned `8164` sort
  0x8163 birth_profile               U32, exactly 1 or 3
  0x8164 birth_authorization_sha256  SHA256, complete HMG4S2
  0x8165 birth_authorization_length  U64, 56..2,097,208
  0x8166 birth_authorization_bytes   BYTES, exact `8165`; sole occurrence of
                                         this complete S2 in Q2
  0x8167 bootstrap_parent_identity_sha256 SHA256, derived kind 15 identity kind 2
  0x8168 bootstrap_parent_identity  STRUCT CanonicalIdentityMember, kind 2,
                                         byte-identical to S2 `8505`
  0x8169 claim_creation_observation_sha256 SHA256, derived kind 107
  0x816a claim_creation_observation STRUCT BirthClaimCreationObservation;
                                         sole complete preimage for this S2 in Q2
  0x816b claim_identity_sha256      SHA256, derived kind 15 identity kind 3
  0x816c claim_identity             STRUCT CanonicalIdentityMember, kind 3
  0x816d claim_leaf                 BYTES, equal S2 `8524`
  0x816e claim_content_length       U64, exactly 80
  0x816f claim_content              BYTES, byte-identical to S2 `8526`
  0x8170 claim_metadata_policy_sha256 SHA256, derived kind 15 over S2 `8527`
  0x8171 q2_claim_namespace_pass_set_sha256 SHA256, derived kind 104
  0x8172 q2_claim_namespace_pass_count U32, exactly 2
  0x8173 q2_claim_namespace_passes  LIST BirthNamespaceScanPass, scan phase 3
  0x8174 claim_custodian_observation_ordinal U32, exactly 0
  0x8175 claim_custodian_execution_identity_sha256 SHA256, equal selected `4309`
  0x8176 retained_claim_fd_number   U32
  0x8177 q2_claim_acquisition_flags U32, exact O_RDONLY|O_NOFOLLOW
  0x8178 retained_claim_f_getfl     U32, exact O_RDONLY with no unknown status bit
  0x8179 retained_claim_fd_identity_sha256 SHA256, equal `816b`
  0x817a retained_claim_fd_identity STRUCT CanonicalIdentityMember,
                                         byte-identical to `816c`
  0x817b claim_content_readback_sha256 SHA256, SHA256(`816f`)
  0x817c intent_receipt_binding_set_sha256 SHA256, derived kind 113
  0x817d intent_receipt_binding_count U32, equal S2 `8507`
  0x817e intent_receipt_bindings    LIST ProtectedBirthIntentReceiptBinding,
                                         exact count
  0x817f creator_q2_status_set_sha256 SHA256, derived kind 114
  0x8180 creator_q2_status_count    U32, exactly 2
  0x8181 creator_q2_statuses        LIST BirthCreatorQ2StatusObservation,
                                         exact count
  0x8182 profile1_root_c2_sha256    SHA256, required profile 1, forbidden profile 3
  0x8183 profile3_external_parent_c2_sha256 SHA256, required profile 3,
                                         forbidden profile 1
  0x8184 result                     U32, exactly 1
  0x8185 acceptance_effect_mask     U64, exactly zero
  0x8186 current_authority_effect_mask U64, exactly zero

BirthCreatorQ2StatusObservation
  0x87c1 ordinal                    U32, exactly 0 or 1
  0x87c2 lifecycle_profile          U32: 1 prior UID0 creator absent,
                                         2 profile-3 broker continuous
  0x87c3 expected_creator_execution_identity_sha256 SHA256, derived kind 97
  0x87c4 expected_creator_execution_identity STRUCT PublicProcessExecutionIdentity
  0x87c5 source_process_pass_ordinal U32, equal `87c1`
  0x87c6 queried_pid                U32, equal `87c4.8133`
  0x87c7 kern_proc_pid_result       U32: 1 no record, 2 different birth tuple,
                                         3 exact same tuple
  0x87c8 observed_execution_identity_sha256 SHA256, required results 2/3,
                                         forbidden result 1
  0x87c9 observed_execution_identity STRUCT PublicProcessExecutionIdentity,
                                         required results 2/3, forbidden result 1
  0x87ca matching_process_record_sha256 SHA256, required lifecycle 2,
                                         forbidden lifecycle 1
  0x87cb matching_process_record   STRUCT ProcessInventoryRecord, class 2;
                                         required lifecycle 2, forbidden lifecycle 1
  0x87cc query_started_monotonic_nanoseconds U64
  0x87cd query_finished_monotonic_nanoseconds U64, not less than `87cc`
  0x87ce sdk_layout_binding_sha256 SHA256, equal SDKIdentity `4f35`
  0x87cf boot_session_uuid         BYTES, exactly 16, equal Q2 `401c`
  0x87d0 result                    U32, exactly 1

ProtectedBirthIntentReceiptBinding
  0x87d1 ordinal                   U32, contiguous and equal intent ordinal
  0x87d2 intent_ordinal            U32, index S2 `8508`
  0x87d3 protection_subject_ordinal U32, index Q2 `4011`
  0x87d4 protected_birth_evidence_ordinal U32, index Q2 `4053`
  0x87d5 c2_sha256                 SHA256, equal selected `8156` and SHA256(`8158`)
  0x87d6 subject_role              U32, equal intent/subject/C2
  0x87d7 managed_index             U32, equal intent/subject/C2
  0x87d8 parent_binding_ordinal    U32, earlier ordinal profile-1 child;
                                         `0xffffffff` profile-1 root/profile 3
  0x87d9 preceding_parent_c2_sha256 SHA256, exact selected C2 `821d`
  0x87da result                    U32, exactly 1
```

Process identity is kind 97 over one normalized public KERN_PROC birth tuple,
never PID alone. Each ProcessInventoryPass is produced by the exact SDK-bound
size/read/filter algorithm above. `7806 == 7802 + 7807 + 7808`; `7809` equals
Q2 `401c`; `780d` equals kind 52 over the policy WriterAuthorityRules; `780e`
equals the class-3 count; and `780f` equals SDKIdentity `4f35`. `4402` is kind
97 over `4403`; `4404` is kind 97 over `4410`; and
`4403.8134 == 4410.8133`. `440e` is the normalized credential from the same
kinfo record. Raw state/flag values are not serialized into the stable
authority projection; each pass independently requires classes 1/2 to be
neither `SZOMB` nor `SIDL`, to have `4413=true`, `4414=false`, and
profile-1 dynamic code status.

Trust class 1 resolves `440d` uniquely to the bit-10 runtime-helper writer and
requires `440e` byte-identical to its `6f0c`, complete empty entitlements, and
matching held/observed executable identity. Trust class 2 resolves uniquely to
the one non-TCB kind-1 actor named by an applicable WriterAuthorityRule and has
the same credential/code/entitlement equalities. Class 3 is any current process
whose real, effective, or saved UID equals a non-UID0 writer UID but whose exact
actor/code/credential closure fails; it forbids `4405/440d/440f`, has
`4408=false`, increments `4016`, and therefore makes Q2 result 1 impossible.
Observation tools are deliberately not a ProcessInventoryRecord trust class;
their separate complete provenance is in `4303/4308..4310`.

Policy `1044=1` means the public protected-from-birth threat profile. Kernel,
UID0, and platform/admin TCBs able to change credentials or filesystem policy
are outside the protection claim and are counted only in `7808`; Q2 explicitly
sets `4050=false`. Policy `1045=true` means every non-UID0 principal able to
obtain a tested write/metadata right closes to exactly one policy writer actor/
rule. The managed tree is owner-only DAC: owner UID is a dedicated nonzero
writer actor, group/other write or metadata bits are zero, no allow ACL grants
such a right to another principal, and no nonempty/unknown entitlement is
admitted for a non-UID0 writer. If protection against UID0/kernel/platform TCB
is required, this public profile blocks and a separately authorized privileged
or EndpointSecurity successor is required; it never overclaims that assurance.

`4607/4608` both equal kind 15 over the corresponding subject's `420e`; `4804`
is kind 15 over `4806`. `4a09` is kind 13 over `4a0d`, `4a0a` is kind 35 over
`4a0f`, and `4a0e` matches both list and component counts. Each kind-98 phase
pass has purpose 2/ordinal 2, same boot/writer-rule/layout values,
zero class 3, and a classes-1/2 kind-99 projection byte-identical to Q2 `404d`.
`814b-814a <= 814c`; targeted self/parent identities and code are rechecked on
both sides. Phase 1 finishes at most five seconds before the first durable
BEGIN/RECOVERY_BEGIN creation attempt. A distinct phase-2 pass starts after the
last mutation and finishes at most five seconds before terminal-intent creation;
it is the only one embedded in terminal evidence. Its scan start is not earlier
than the last mutation finish, and its phase sample is later than phase 1's.
Any drift before BEGIN blocks; drift after BEGIN enters the existing manual-
recovery state. The Q2 observation tool may exit after `430c` and is not part
of this writer projection.

Denial operations are exactly 1 create-child, 2 rename, 3 unlink,
4 hardlink, 5 content-write, 6 truncate, 7 chmod, 8 chown, 9 flags, 10 ACL, and
11 xattr. Roles 1 and 2 require operations 1..3 and 7..11; roles 3..10 require
operations 3..11. No required pair may be omitted as not applicable. Rights-
profile bits are the predecessor ACL permission bits 0..13 plus bit 14
LINKTARGET and bit 15 NOIMMUTABLE; higher bits are zero. Composite mappings are:

```text
1/0 create-child  destination parent: bits 1 ADD_FILE and 4 ADD_SUBDIRECTORY
2/1 rename-in     destination parent: bits 1 and 4
2/2 rename-out    source parent: bit 5 DELETE_CHILD
3/0 unlink        subject: bit 3; containing/source parent: bit 5
4/0 hardlink      subject: bit 14; destination parent: bit 1
5/0 write         subject: bit 1 WRITE_DATA
6/0 truncate      subject: bit 1 WRITE_DATA
7/0 chmod         subject: bit 11 WRITE_SECURITY
8/0 chown         subject: bit 12 CHANGE_OWNER
9/0 flags         subject: bits 7 WRITE_ATTRIBUTES and 15 NOIMMUTABLE, always
10/0 ACL          subject: bit 11 WRITE_SECURITY
11/0 xattr        subject: bit 9 WRITE_EXTENDED_ATTRIBUTES
```

The fixture syscall-profile registry is exact. Operation 1 uses three
`openat(O_WRONLY|O_CREAT|O_EXCL,0600)` file-form attempts followed by three
`mkdirat(0700)` directory-form attempts. Operation 2/1 uses three ordinary-file
and three directory sources with `renameatx_np(RENAME_EXCL)`; operation 2/2
uses three ordinary child sources with the same primitive. Operation 3 uses
`unlinkat` flags zero for ordinary subjects and exactly `AT_REMOVEDIR` for
directory subjects. Operation 4, legal only for file subject roles 3..10, uses
`linkat` flags zero. Operation 5 is acquisition of the existing subject through
`openat(O_WRONLY|O_NOFOLLOW)` and operation 6 through
`openat(O_WRONLY|O_TRUNC|O_NOFOLLOW)`; both must fail before any writable FD
exists, and `pwrite`/`ftruncate` is never called. Operation 7 is `fchmod(0600)`;
operation 8 is `fchown` to the fixture
credential's effective UID/GID. Operation 9 has three ordinary-attribute
attempts toggling only `UF_NODUMP`, followed by three immutable-clear attempts
whose privileged setup pre-sets exactly `UF_IMMUTABLE` and whose denial child
calls `fchflags` to clear only that bit; the before/after identity must retain
the immutable bit. Operation 10 is
`acl_set_fd` with the exact replacement HMG4A2 ACL encoded in the attempt
arguments; and 11 `fsetxattr` of exact ASCII name `user.hmg4-denial` and one
byte value `00`, position zero, options zero. Each exact Darwin symbol/value,
argument width, byte order, FD role, source/destination leaf, precondition, and
expected retained-object description is frozen in the one signed
DenialSyscallArgumentProfile selected from profile-2 F2. Its `8085` resolves to
the complete SDKABIBinding in the same SDKIdentity; a host default, prose flag
name, diagnostic ReviewedObjectMember, or hash without that ABI preimage is
insufficient.

The expected fixture errno table is closed:

```text
operation/scenario  1/0  2/1  2/2  3/0  4/0  5/0  6/0  7/0  8/0  9/0 10/0 11/0
Darwin errno         13   13   13   13    1   13   13    1    1    1    1   13
symbol            EACCES EACCES EACCES EACCES EPERM EACCES EACCES EPERM EPERM EPERM EPERM EACCES
```

Operation 4's column is forbidden for directory roles 1/2. No operation may
accept both errors. These values are fixture-profile results,
not claims that every arbitrary Darwin setup returns the same errno. A target
OS/SDK for which the exact protected fixture cannot produce its one table value
on all required attempts fails E2 kind 3 and cannot issue Q2; the producer may not
rewrite `7f33`, normalize EPERM/EACCES, or choose a friendlier setup.

The words `and` above mean both bits are set in that target's single `78c5`;
they are not alternatives selected by a producer. Thus create-child proves
denial for both file and subdirectory creation, every rename destination proves
both destination forms, and operation 9 always proves both attribute change and
NOIMMUTABLE. The source object's exact type does not reduce these masks.
Revision 1 has no overwrite-target role; no-replace production moves and the
separate subject/source/destination denial rows are the complete target set.
`789a == 4610`; every phase `79db` repeats it. `79c5 == 78c5`, so no phase
trace may evaluate an easier subset.

The target/identity matrix is iff. For operations 1/0 and 2/1, the sole ordinal-0
target has role 3, `78c4` byte-identical to selected subject `420e`,
`78c3 == 4205 == 7872`, and mask bits 1|4. For 2/2, the sole ordinal-0 target
has role 2, the same `420e/4205/7872` equalities, and mask bit 5. These three
rows are legal only for directory subject roles 1/2. For operation 3/0,
ordinal 0 has role 1, identity `420e`, hash `4205`, and bit 3; ordinal 1 has
role 2, identity byte-identical to `4214`, hash `4213`, and bit 5. For 4/0,
ordinal 0 has role 1 with `420e/4205` and bit 14; ordinal 1 has role 3 with
`4214/4213` and bit 1; this row is legal only for ordinary-file subject roles
3..10. Operations 5/0 and 6/0 have one role-1
`420e/4205` target with bit 1 and are legal only for subject roles 3..10.
Operations 7/0..11/0 each have one role-1 `420e/4205` target and exactly the
displayed mask. No other target count, ordinal, role, scenario, identity kind,
identity bytes, hash, or rights mask is legal.

For every target, `78c3` is recomputed over the exact held object in `78c4`.
For a DirectoryIdentity target, `78c6/78c7/78ca/78cb/78cc/78cd/78ce` equal
`2205/2206/220d/2207/2208/220c/2209`; for a ProtectedFileIdentity target they
equal `6207/6208/620c/6206/6209`, the containing `4214.220c`, and `620a`.
The held file descriptor's `fstatfs` device/filesystem/mount tuple must equal
that containing parent and the selected policy production-domain tuple before
the mount equality is accepted. In both cases `78cf == length(78d0)`,
`SHA256(78d0) == 78ce`, and `78d0` is the complete predecessor HMG4A2 stream
read twice from that same retained inode with identical metadata, length,
bytes, and hash before and after evaluation and again at request admission.
`78c6..78d0` therefore form the canonical access-control snapshot attached to
`78c4`; the fields are not claimed to be physically embedded inside every
identity schema.

Owner/group GUIDs are a closed observation, not producer input. On the exact
OS/SDK identity named by `7893/7899`, the observer calls the SDK-bound
`mbr_uid_to_uuid(78c6)` and `mbr_gid_to_uuid(78c7)` APIs twice each in one
retained-target interval. Both calls must return success and the same nonzero
16 raw bytes; those bytes are exactly `78c8/78c9`. It then calls the exact
SDK-declared `mbr_uuid_to_id(const uuid_t,id_t *,int *)` twice for each value.
The owner result must be the original `78c6` with `id_type == ID_TYPE_UID == 0`;
the group result must be `78c7` with `id_type == ID_TYPE_GID == 1`. Those
numeric constants are the sole domain-12/kind-54 SDK symbol mappings, while
the three public function declarations are SDK ABI-binding profiles 1..3; none
is a locally redefined value or prototype. All three membership routines
return a signed `int` containing either zero on success or a positive errno
value directly. The caller validates `id_type` storage and the expected
`ID_TYPE_UID`/`ID_TYPE_GID` domain before use, reads output storage only after
a zero return, and never converts `-1` plus ambient `errno` into a membership
result. Every named ACL qualifier is
resolved by `mbr_uuid_to_id` and, according to its returned exact type, the
corresponding `mbr_uid_to_uuid` or `mbr_gid_to_uuid`, under the same two-pass
stable rule. Error, zero UUID, user/group ambiguity,
numeric mismatch, different first/second result, unsupported namespace, or
lookup/OS/SDK drift blocks. The unique kind-4/kind-5
PrincipalResolutionMember for each target repeats exactly its
`78c8/78c6` or `78c9/78c7`; kind-1/kind-2 members repeat the same rule for
named ACL qualifiers. The exact containing parent is the frozen `4214`, not a
producer-selected restrictive sibling. Golden relationships swap the subject,
containing parent, scenario, role, identity bytes/hash, ACL bytes/hash,
UID/GID/GUID mapping, mount, and repeat-pass result one side at a time.

The E2-kind-3 fixture projection is mechanical. Roles 1/2 contribute exactly
the nine ordered rows `(1,0),(2,1),(2,2),(3,0),(7,0),(8,0),(9,0),
(10,0),(11,0)`; each of roles 3..10 contributes exactly `(3,0)` through
`(11,0)`, for 90 rows total. In every AccessDenialFixtureObservation,
`7f25 == 7f23`, `7f28/7f29` are byte-identical to policy `103d/103e`,
`7f2a/7f2c` are kind 15 over `7f2b/7f2d`, `7f30` is kind 66 over `7f32`,
and `7f31` agrees. The fixture subject and parent are held beneath `7f29` on
the slot-3 target-domain tuple. Their target roles, target count, identity kind,
object type, requested-right masks, canonical ACL/mode/flags/GUID/mount
snapshot, and order obey the same iff matrix as the corresponding production
row, substituting only the exact fixture identities for `420e/4214`.

`7f2e` is byte-identical to the production row's
`460c.7861` ProcessCredentialIdentity, has nonzero effective UID, and matches no
policy actor or writer rule; `7f2f == 0`. Each `7f35` member has
`7f62/7f64` and `7f65/7f67` equal the observation `7f30/7f32`, so all pre/post
target bytes are identical. `7f68 == 2`, `7f69 == 7f33`, `7f6a == 2`, and the
parameter sets differ only by frozen fixture variant, repetition ordinal, and
unique fixture leaves where the syscall requires them. Operations 1/0 and 2/1
have six attempts: ordinals 0..2 set `7f71=1` and prove the ordinary-file form;
ordinals 3..5 set `7f71=2` and prove the directory form. Operation 9/0 also has
six: ordinals 0..2 set `7f71=3` and exercise WRITE_ATTRIBUTES; ordinals 3..5
set `7f71=4`, begin with exact `UF_IMMUTABLE`, and exercise NOIMMUTABLE by
attempting only its removal. Operation 3/0 has three attempts with `7f71=2`
for directory subject roles 1/2 and `7f71=1` for ordinary-file roles 3..10.
Every other row has three attempts and `7f71=1`.
Thus each composite rights mask is exercised by a discriminating syscall
variant rather than inferred from one failure. `7f6e` is kind 83 over
`7f6f`; every parent executor binds the exact one-use profile-2 HMG4F2 and
policy `1047/1048` bit-15 setup actor, while every actual attempted syscall is
performed only by the recorded irreversibly dropped child. The held/static/
dynamic fixture-helper code, parent and child audit/process identities, complete
pre/post-drop credentials, privilege-drop steps, target root, and attempt
interval all cross-agree as Section 7.1 requires; neither process receives any
production authority. `7f36` is kind
79 over `7f35`; all counts agree and result 1 requires all required attempts to
have the exact table errno and no effect.

The no-effect claim is namespace-complete. `7f72` is kind 86 over `7f74` and
`7f75..7f77` are byte-identical post-attempt state copies. The four nanosecond
fields require `7f78 <= 7f79 <= 7f7a <= 7f7b`; all before scans finish before
the syscall starts and all after scans start only after it returns. Each
`7fd4` is kind 58 over `7fd5`, `7fd6` is kind 15 over `7fd7`, and `7fd8` is
kind 85 over `7fda`; counts agree. `7fdd` is kind 88 over the two complete
`7fde` passes. Each pass repeats `7fd7`, its kind-85 list/hash equals
`7fda/7fd8`, and the two passes are byte-identical except their ordinal. Every
entry's `8053` is kind 58 over `8054`; no fixture parent may reuse the
production-only ProtectedNamespaceRecord schema.

The observation count and roles are exact: create-child has one destination
observation; rename and hardlink each have one source and one destination
observation; unlink/rmdir and operations 5..11 each have one source/subject
observation. Source and destination observations never collapse, including
when their `7fd7` parent identities are byte-identical; in that case both carry
the same complete parent scan but different exact leaf components. `7fd3` is
the selected attempt directory, `7fdf` is one slash-free PathComponent derived
from profile-2 F2 nonce, subject role, operation, scenario, attempt ordinal,
variant, and namespace role, and `7fe0` equals the SHA-256 of the unique
canonical syscall-argument member in `7f6d` that supplies that exact source or
destination component. Thus the observed leaf bytes are the bytes passed to
the syscall, not a diagnostic reconstruction. Parent-entry lists are complete,
not selected-name summaries. The pre/post kind-86 equality therefore
proves leaf presence/absence, content/link/metadata identity, and every affected
directory entry unchanged; a held inode with a removed name, an unexpected
created leaf, a moved source, or a changed parent set fails even if kind-66
authorization targets remain equal.

For each production AccessDenialProbeRecord, `7897` opens and validates the
exact U2 `601e` HMG4E2 kind-3 frame, recomputes its role-10 kind-73 stream, and
selects exactly one role-14 member whose `(7f22,7f23,7f24)` equals the selected
ProtectionSubject role, `4604`, and `4610`. `4605 == 7f33`,
`7893/7899 == 7f26/7f27`, and the production and fixture credential bytes are
equal as above. No bare kind-73 hash, another E2, another OS/SDK, row with the
same errno but different target/mask, or aggregate capability operation 16/17
substitutes for that unique differential row. Production retains
`460b=false` and never invokes the mutating fixture syscall.

The canonical authority is the complete hash-bound FullCredential
AccessControlEvaluation produced by two independently implemented, source-bound
evaluators over the exact DenialCredential, all held subjects/parents, ordered
ACL streams, owner/group/GUID/mode/flags, explicit known principal resolutions,
rights mapping, mount/OS profile, superuser/entitlement/immutability rules, and
writer-principal closure. The evaluators and their traces must agree exactly and
return DENY. Any unresolved principal, unsupported right, opaque filesystem
authorization rule, evaluator disagreement, or OS/mount drift blocks issuance.

`accessx_np` is a non-authoritative, path-based corroborating observation of the
querying process's real credential only. Its UID argument and result never
establish a selected DenialCredential, supplementary groups, effective/saved
IDs, an FD-held inode, LINKTARGET, a composite rename/hardlink decision, or a
closed writer set. If used, a dedicated privilege-dropped observer first reads
back its actual real credential and group vector; path and held-FD identity must
agree. Only the representable rights subset is recorded in `7895` and the exact
observed advisory errno may be EACCES or EPERM. Unsupported/nonapplicable use is
explicitly `0xffffffff`/result 2, never fabricated success.

No production denial check calls rename, unlink, link, open-write, truncate,
chmod, chown, chflags, ACL-set, or xattr-set against an actual protected subject.
`4605` is only the separately proven disposable-fixture expected errno and
`460b/7898` remain false. If model plus differential fixture evidence cannot
close an operation, issuance is blocked. Kind 40
contains every entry of identical A/B FD-relative protected-parent scans.
Each `4603` is kind 60 over `460c`; those complete credentials match no policy
ActorIdentity and no WriterAuthorityRule. Evaluation enumerates the
entire canonical ACL and proves that no allow ACE, group membership, owner
shortcut, mode bit, flag exception, or inherited rule grants the tested action
to this credential or any actor outside the exact authorized-writer set. Testing
one UID cannot stand in for that closed writer-set proof.
Each `460d` is kind 61 over `460e`; `460e.787b/787c/787d/7894/787f` equal
`4603/460c/4604/4606/460f`, and `460e.789a == 4610`. Its subject identity, ACL stream, mode,
flags, and writer-set hash equal the held subject and selected ProtectedParent.
Exactly, `7871 == 4602`; `7872 == 4607 == 4608 ==` selected subject `4205`;
and `7873/7874/7875` equal that subject's canonical ACL, mode bits, and flags.
`7876` is the exact applicable kind-52 writer set: policy `104f` for managed
runtime-root subject role 1;
the selected ProtectedParent `2306` for role 2; the containing role-4 parent for
role 3; the EvidenceLocation immediate parent for roles 4, 5, and 9; role-1/
subrole-1 for roles 6, 7, and 8; and role-1/subrole-2 for role 10. A locally
valid evaluation for another subject or parent is invalid here.
`787f`, `7882`, `7885`, and `788c` are kinds 66..69 over their embedded lists;
all counts agree. Target roles and rights equal the displayed operation mapping;
every `78c3` is kind 15 over `78c4`, `length(78d0) == 78cf`,
`SHA256(78d0) == 78ce`, and
all owner/group/mode/flags/type/mount fields are read from the same held FD or
held parent used by the operation. Each canonical ACL stream is fully decoded
using the predecessor ordered HMG4A2 grammar; every named qualifier has exactly
one known `7884` resolution. `7887` is the complete closure of every OS
principal that the public owner-only profile can grant a tested right, plus the
one explicit UID0 nonclaim. A disposition-1 member has a nonzero UID principal,
grant source exactly owner-mode bit 0, `78f7=1`, forbidden group/other/ACL/
superuser/entitlement source bits, and complete `78f8..78fa` that resolve to
exactly one applicable policy actor/rule with byte-identical credential. Group/
other mutation bits and every allow ACE for a tested right are validation
failures, not additional approved-writer rows. A disposition-2 member is exactly
principal kind 1 UID, numeric ID zero, the stable reviewed UID0 GUID, grant
source exactly superuser bit 4, `78f7=0`, actor/rule/credential fields absent,
and `78fc==policy 1044==1`. Entitlement bit 5 is forbidden in both
dispositions. Kind 68 contains exactly one disposition-2 row after its ordinary
duplicate-collapse rule; it records a threat-model exclusion, never an
authorized writer. `4050=false` repeats that nonclaim. Any non-UID0 granting
principal without one unique disposition-1 actor/rule, duplicate group, unknown
membership, inherited/unsupported ACE, nonempty relevant entitlement, or later
process with a writer-equivalent credential blocks Q2. Filesystem DAC proves
principal closure only; the public process projection and protected launch/code
identity separately prove which non-TCB actors possess those credentials.

The principal-resolution matrix is iff and exhaustive. Kinds 1, 2, 4, and 5
use nonzero 16-byte GUIDs; the all-zero 16-byte value is reserved to kind 3.
Kind 1 is one reviewed user-GUID-to-UID resolution, has source 1, and
`is_member` is true iff its numeric UID equals `7861.7852`. Kind 2 is one
reviewed group-GUID-to-GID resolution, has source 1, and `is_member` is true
iff its numeric GID equals `7861.7855` or occurs in `7861.7858`. Kind 3 is the
single everyone sentinel: all-zero GUID, numeric ID `0xffffffff`, source 3,
and `is_member=true`. Kind 4 repeats an exact target owner GUID/UID relation,
has source 2, and membership is true iff that UID equals `7861.7852`. Kind 5
repeats an exact target owning-group GUID/GID relation, has source 2, and
membership is true iff that GID equals `7861.7855` or occurs in `7861.7858`.
Every member has `resolution_known=true`. Real or saved IDs do not grant
effective access. A UUID that resolves to both user and group, to two numeric
IDs, to no numeric ID, or to a value inconsistent with the same held target or
credential blocks rather than selecting a row. The kind-67 sort/dedup rule
collapses an identical relation shared by multiple targets but requires every
distinct ACL qualifier, owner, owning group, and the one everyone sentinel.

`DenialCredential.7865 == AccessControlEvaluation.7897` and opens the complete
held, signature-valid HMG4E2 kind-3 frame named by U2 `601e`; it is never a
live-process reference. The verifier recomputes the frame's role-10 kind-73
projection and selects exactly one role-14 AccessDenialFixtureObservation whose
`(7f22,7f23,7f24) == (786a,786b,786c)` and whose complete canonical bytes are
`7867`; `7866 == SHA256(7867)` and `7868 == 7867.7f36`. In the enclosing probe,
`786a/786b/786c` also equal the selected ProtectionSubject role, operation, and
scenario. No second matching row, hash-only row, row from another E2/OS/SDK/F2,
or locally reconstructed observation is admissible.

`7861` is byte-identical to `7867.7f2e`, `7869 == 7867.7f2f == 0`, and
`786d ==` the selected SDKIdentity `4f2e`. Every complete attempt in
`7867.7f35` is required, its `7f6e` recomputes over the nested
DenialAttemptExecutorObservation, its post-drop credential `7f6f.7fb7` equals
`7861`, and its child dynamic/static/held executable observations all resolve
to the same signed fixture executable with the SDKIdentity
`4f2f.7d48` canonical EMPTY_ENTITLEMENTS_BLOB and hash `786d`. The child has
nonzero effective UID, completes the recorded irreversible privilege drop,
has `7f6f.7fbe=0`, attempts the exact SDK-bound syscall, receives the sole
expected errno, and leaves both target and complete namespace observations
unchanged. Bit 0 in `7869` would mean an effective UID of zero; bit 1 would mean
any absent, unreadable, malformed, or non-byte-identical entitlements blob.
Authority-admitted DENY requires both bits zero. A synthetic credential,
currently live denial child, Q2 class-3 process, hash-only executable, semantic
empty-plist variant, or unregistered entitlement-name list cannot replace this
complete historical process/code/blob evidence. Q2 therefore requires no live
class-3 denial process; its class-3 count remains exactly zero.

Every `794a` is exactly one canonical nested AccessDecisionPhaseInput value,
from its `79c1` TLV header through its final phase-permitted TLV value, with no
enclosing caller tag, padding, omitted required tag, forbidden tag, duplicate,
or trailing byte. `7949 == length(794a)` and `7945 == SHA256(794a)`.
Common fields `79c1..79cc` and `79da..79db` occur in every phase and cross-equal the
enclosing evaluation/target/trace as declared. Phase-conditional fields occur iff their
schema says required. `7944` is `0xffffffff` in phases 1, 2, and 5; equals
`79d4` in phase 3; and equals `79d7` in phase 4. `79cf == 7869` in phase 2,
thereby binding the exact held E2 kind-3 fixture observation, every nested
dropped-child process/executable/entitlements record, and effective credential
through `79c6` rather than accepting a declared bypass bit.

For a target with `n` HMG4A2 entries, `78cf == 16 + 40*n`. Phase-3 entries
have `79d0=0..n-1` and `79d3` byte-equal the selected 40-byte slice beginning
at `78d0[16 + 40*79d0]`: tag, qualifier-length, exact 16-byte UUID,
permissions, and flags in predecessor order. `79d2=40` and
`79d1=SHA256(79d3)`. `79d4` selects the one kind-1 or kind-2 resolution whose
GUID equals that slice's qualifier. The ordered slices partition all bytes
after the 16-byte HMG4A2 header exactly once; no whole ACL stream, repeated
entry, skipped entry, reordered entry, synthesized name, or post-decoding
re-encoding is a phase input.

The U64 rights state carried by `7947/7948/79cc` has one exact packing:
bits 0..15 are pending rights `P`, bits 16..31 are allowed rights `A`, bits
32..47 are denied rights `D`, and bits 48..63 are zero. `P`, `A`, and `D` are
pairwise disjoint and their union is always the target `78c5`; no other state
is representable. For each target, phase 1 starts with
`P=78c5,A=0,D=0`. Each trace member's `7947` equals its phase input `79cc` and
the preceding member's `7948` for that target; another target never supplies
the state.

The transition function is exact. Rights-profile v1 admits in `78cc/79cd` only
zero or combinations of the SDK-verified Darwin values `UF_IMMUTABLE
0x00000002`, `UF_APPEND 0x00000004`, `SF_IMMUTABLE 0x00020000`, and
`SF_APPEND 0x00040000`; every other set bit blocks the evaluation. Phase 1
records those exact flags but never credits them as denial authority:
`79ce=0`, packed state is preserved, and decision is CONTINUE for every
operation. Operation 9 separately requests both WRITE_ATTRIBUTES and
NOIMMUTABLE, so neither clearing a known flag nor changing attributes is
silently omitted. Phase 2 moves all
remaining `P` to `A` iff `79cf` is nonzero and otherwise preserves state;
authority DENY therefore requires the preserving zero case. Each phase-3 allow
entry whose resolved principal is a member moves `P & permissions` to `A`;
each matching deny entry moves that set to `D`; a nonmember preserves state.
For predecessor flags, bit 4 `inherited` is blocking; bits 2 `limit-inherit`
and 3 `only-inherit` each require bit 0 `file-inherit` or bit 1
`directory-inherit`; and any other unknown or invalid combination is blocking.
Bits 0..2 do not change current-object applicability. Bit 3 makes the entry
inapplicable to the current object and therefore preserving; without bit 3 the
entry is applicable. Only still-pending bits move, which gives the predecessor
ACL order its semantics. Unknown tag, flag, applicability, or permission is
blocking, never a guessed preserving entry.

Phase 4 selects exactly one class: owner/kind 4 when effective UID equals target
owner; otherwise owning-group/kind 5 when effective GID or a supplementary GID
matches; otherwise everyone/kind 3. `79d5` and `79d7` encode that choice and
`79d6 == 78cb`. The selected POSIX triples are exactly owner read/write/execute
`0400/0200/0100`, group `0040/0020/0010`, and other
`0004/0002/0001`; no decimal, SDK-enum, or shifted interpretation is legal.
The frozen conservative mode table sets `79d9` to all pending rights for owner
class; for group/everyone it intersects pending rights with
`{0,6,8,10,14}` when the selected read bit is set, `{1,4,5,7,9}` when the
selected write bit is set, and `{2}` when the selected execute bit is set.
No group/everyone mode bit grants `{3,11,12,13,15}`. Phase 4 moves
`P & 79d9` to `A` and every other pending bit to `D`. This intentionally
over-approximates owner control; if the disposable differential suite observes
any additional non-owner mode grant, E2 kind 3 fails and no Q2 may issue.

Phase 5 occurs once for every set bit of `78c5`, in strictly increasing
`79d8` order. It preserves the packed state. Its decision is DENY iff that bit
is in `D`, otherwise CONTINUE. Phases 1, 3, and 4 use DENY iff their own
transition moves a nonzero set into `D`; phases 2 uses CONTINUE; all other
cases use CONTINUE. Trace order is target ordinal ascending and, within each
target, exactly phase 1, phase 2, all phase-3 entries by ACL ordinal, phase 4,
then the phase-5 requested bits. The final packed state has `P=0`; authority
result 1 requires every requested bit in `D` and therefore every phase-5
decision DENY. Any different count, state, transition, decision, phase order,
or permitted-field matrix invalidates both evaluator outputs.

The three 8,192-member ACL-evidence caps have a closed upper-bound proof. Four
targets with 1,024 ACL entries each contribute at most 4,096 distinct named
qualifiers; eight target owner/owning-group relations and one everyone relation
make at most 4,105 principal resolutions. Writer closure adds at most the 32
policy actors for superuser or entitlement grants, so it has at most 4,137
members. A decision trace has exactly one phase-1, phase-2, and phase-4 member
per target, exactly one phase-3 member per ordered ACL entry (a rights mask is
evaluated in that one member, not duplicated per right), and at most one
phase-5 member for each of 16 requested rights per target: at most
`4,096 + 12 + 64 = 4,172`. There is no unregistered phase or duplicate trace
step. These semantic maxima are below 8,192; the larger wire ceiling leaves
room for max/max+1 vectors without clipping a valid evaluation. The 1-GiB Q2
payload cap and every nested byte bound remain conjunctive, so the count caps
do not authorize a Cartesian product of 8,192 maximum-size trace inputs.

Evaluator A/B source/executable hashes are pairwise different and are mandatory
kind-3 E2 inputs; `7897 == U2.601e`, `7893` equals K2/U2 OSBuildIdentity, and
`7899 == K2.3017 == U2.602d` and therefore names the exact U2 `602b`
SDKIdentity including `4f2e/4f2f`; `7892` equals the evaluated held mount.
Kind-69 traces are byte-identical and
finish with one phase-5 DENY per requested right. Golden relationships mutate
credential, operation, target, ACL order, membership, writer mapping, evaluator,
trace, mount, ACL length, ACL hash, and accessx fields one side at a time.
`4022` equals policy `102c`. The required-subject kind 28 contains exactly one
project root, every production ProtectedParent, every predecessor-present live
inode, the plan, bundle, installed policy/helper/lock, launcher configuration,
and every pre-Q protected evidence object in the request's validated dependency
DAG. The role-9 evidence subset is exact: target and system K2 (evidence roles
3/4, binding 2); U2 (role 7, binding 2); I2 (role 8, binding 2); every distinct
HMG4Y2 selected by policy bindings, including the fixed-empty object (role 9,
binding 1); the Z2 consumed by I2 (role 11, binding 2); and E2 kinds 1..6 (role
12, binding 2). Plan and bundle use subject roles 4/5
instead of duplicate role-9 requirements. Embedded F2 is covered by its K2
ordinary-file content and signature and is not a second namespace object.
`4010/4011/4012` match requirements one-for-one and `4026/4027` equal
policy/request/BEGIN/receipt.

Q2 cannot require its own future role-5 receipt, and W2/O2 roles 10/6 are
created only after Q2. Those three are the only exclusions. Each is instead
held from its exclusive-no-replace role-2 parent, fully parsed and signature-
validated, metadata-read-back, file/parent-synced, and bound by complete hash in
the next authority object/request/BEGIN/receipt. Their bit-11 storage broker has
no issuer/operator role and cannot alter an existing leaf. New transaction
objects are covered only by the exact five birth rules and immediate journaled
post-create observation.

Birth role 1 uses metadata source 1 / fixed metadata role 17; role 2 source 1 /
role 16; role 3 source 2 and reproduces its held predecessor FinalEntry; role 4
source 3 and reproduces the exact Entry plus its HMG4Y2 object; role 5 source 1 /
role 17. Parent ordinals and writer identity equal policy. The parent is already
protected before the exclusive leaf becomes visible; exact metadata/readback
and file/parent durability complete before that inode is used. No rule claims
metadata is set before the O_EXCL directory entry exists.

For each ordinal, requirement `6e05` is kind 15 over a policy-known object, not
a future inode: subject role 1 uses RootIdentity kind 1; role 2 ProtectedParent
kind 14; role 3 Entry kind 13; roles 4 and 5 EvidenceLocation kind 12; every
role-9 evidence object uses its selected EvidenceLocation kind 12; roles 6,7,8 use their installation ProtectedParent kind
14; and role 10 uses policy `103a` as canonical identity kind 19. For role 9,
`6e0d == 6e05`, role/kind are permitted by `6e08/6e09`, and occurrence ordinals
are contiguous within each role/kind. Binding 1 occurs only for role 9 HMG4Y2;
its fixed hash is one of the distinct policy `1018/1038` values, sorted by
unsigned hash. Binding 2 has no future hash in policy; at Q issuance it resolves
uniquely through the exact request K2/U2/I2 hashes, I2's Z2 hash, and U2's E2
hashes. This prevents a policy/receipt hash cycle. ProtectionSubject `4204`
equals it. `6e06/4207` use the same RootIdentity/ProtectedParent/Entry for roles
1..3, the EvidenceLocation metadata policy (kind 7) for roles 4,5,9, and metadata
roles 14,13,15 respectively for installed policy/helper/lock roles 6,7,8, and
metadata role 18 for launcher role 10.
`6e07 == 4206`; and the observed
`4205` is kind 15 over the actual existing RootIdentity, DirectoryIdentity,
ProtectedFileIdentity, ExecutableCodeIdentity, or FinalEntry. Thus policy kind
28 has no future-receipt/file-identity dependency, while Q2 still proves the
actual held object one-to-one.

Kinds 28 and 29 reject duplicate semantic keys
`(subject_role, managed_index, protected_parent_ordinal,
authority_binding_sha256, evidence_role, header_discriminator,
occurrence_ordinal, evidence_object_binding, fixed_evidence_object_sha256)`, omitting the final five values only
for non-role-9 members where their tags are forbidden. Each requirement has
exactly one observed subject and no observed subject satisfies two requirements.
Every role-9 requirement maps to exactly one held pre-Q object in the closed set
above; a missing, extra, duplicated, self-Q, or post-Q authorization member is
invalid.

### 8.5 Dynamic-evidence issuer attestation

`HMG4F2`, `HMG4K2`, `HMG4Q2`, `HMG4U2`, `HMG4I2`, `HMG4E2`, and embedded-only
`HMG4C2` are dynamic authority
evidence and require a persistent cryptographic issuer attestation. For each,
the unsigned payload is the canonical payload with only its kind-57 statement
hash, signature-algorithm, and detached-signature tags omitted; the complete
embedded signer ActorIdentity remains included. The exact omitted tag triples
are `7919..791b`, `302a..302c`, `4039..403b`, `6037..6039`, `5024..5026`,
`751a..751c`, and `8222..8224` respectively.

The single kind-57 member binds the object's exact magic, header discriminator,
SHA-256 of that unsigned payload, kind-34 signer hash, successor specification
hash, and policy hash. Its policy hash equals `7902`, `3003`, `4003`, `6006`,
`5003`, `751d`, or `8202` respectively. The top-level signer hash equals kind 34 over the
embedded kind-2 ActorIdentity and equals the exact EvidenceTrustRule issuer:
F2 `7917/7918` and K2 `3007/3029` bit 1, Q2 `4008/4038` bit 2, U2
`6020/6036` bit 3, I2
`500a/5023` bit 13, and E2 `7518/7519` bit 4. C2 has no EvidenceLocation;
its signer `8220/8221` equals policy `104b/104c` bit 17 directly. The policy
catalog has exactly one matching actor.

The issuer signs the complete kind-57 bytes directly with
`HMG4-ED25519-STRICT-1` using that actor's exact `6f08` SPKI. Verification
includes the strict point/subgroup/scalar/equation rules, shortest-form DER,
algorithm, key length, signature length, object magic/kind, every equality above, and the
complete unsigned payload before `result=1` or any cross-object hash is trusted.
A signature copied between object types, scopes, policies, specifications, or
payloads fails. The evidence-ingest broker with bit 11 may validate and
exclusive-create the exact signed bytes at their derived paths, but cannot sign,
alter, regenerate, or claim issuer identity. Protected placement and a
content-addressed filename are custody evidence only and never replace this
attestation.

## 9. Apply authorization: `HMG4W2`

The predecessor's recovery authorization remains `HMG4O2`. Initial apply now
also requires a protected, single-use authorization. Payload:

```text
0x7401 protocol_spec_sha256       SHA256
0x7402 helper_sha256              SHA256
0x7403 policy_sha256              SHA256
0x7404 plan_sha256                SHA256
0x7405 bundle_sha256              SHA256
0x7406 expected_root_identity     STRUCT RootIdentity
0x7407 path_allowlist_sha256      SHA256
0x7408 predecessor_set_sha256     SHA256
0x7409 desired_set_sha256         SHA256
0x740a forward_vector_sha256      SHA256
0x740b forward_transition_count   U32
0x740c full_rollback_sha256       SHA256
0x740d full_rollback_count        U32
0x740e operator_identity_sha256   SHA256
0x740f authorization_nonce        BYTES, exactly 32
0x7410 issued_at_unix_seconds     U64
0x7411 expires_at_unix_seconds    U64
0x7412 single_use                 BOOL, exactly true
0x7413 acceptance_effect_mask     U64, exactly zero
0x7414 reproducible_build_receipt_sha256 SHA256
0x7415 protected_install_receipt_sha256 SHA256
0x7416 target_capability_receipt_sha256 SHA256
0x7417 system_lock_capability_receipt_sha256 SHA256
0x7418 quiescence_receipt_sha256  SHA256
0x7419 operator_identity           STRUCT ActorIdentity
0x741a authorization_statement_sha256 SHA256, derived kind 43
0x741b signature_algorithm         U32, exactly 1 Ed25519
0x741c detached_signature          BYTES, exactly 64
```

It is valid for at most 900 seconds with at most 60 seconds future skew. Its
full object hash and derived evidence path are request/BEGIN/receipt-bound. The
stable custody graph must contain no earlier `BEGIN` using that authorization
hash or nonce. Consumption is journal evidence, not deletion or mutation of the
authorization object.

Validity is one snapshot immediately before journal creation: all referenced
objects are already held, pass trust/age/result checks, and are rechecked until
durable BEGIN. A pre-BEGIN refusal does not consume the authorization. A durable
BEGIN whose `a01e/a01f` match consumes it even if later response or terminal
receipt delivery fails; any matching hash or nonce anywhere in the stable
custody/recovery graph forbids reuse. `7414..7418` equal request
`0023,0024,0018,001a,0017`, BEGIN `a01b,a01c,a00b,a00c,a00a`, and receipt
`901c,901d,900e,9012,9010` respectively, and all five held framed objects must
cross-bind the same helper/policy/build/install chain.

The predecessor `HMG4O2` recovery authorization is amended to require
`0x0f12 reproducible_build_receipt_sha256` and
`0x0f13 protected_install_receipt_sha256`,
`0x0f14 target_capability_receipt_sha256`,
`0x0f15 system_lock_capability_receipt_sha256`, and
`0x0f16 quiescence_receipt_sha256`, all SHA256, plus
`0x0f17 operator_identity STRUCT ActorIdentity`,
`0x0f18 authorization_statement_sha256 SHA256` (derived kind 43),
`0x0f19 signature_algorithm U32` (exactly 1 Ed25519), and
`0x0f1a detached_signature BYTES` (exactly 64), plus
`0x0f1b recovery_admission_snapshot_sha256 SHA256` (derived kind 110) and
`0x0f1c recovery_admission_snapshot STRUCT RecoveryAdmissionSnapshot`.
Kind 110 over `0f1c` equals `0f1b`; the snapshot is inside the signed HMG4O2
payload and is not a detached advisory attachment. The evidence-chain fields
equal request `0023/0024/0018/001a/0017`, RECOVERY_BEGIN
`a01b/a01c/a00b/a00c/a00a`, and the corresponding recovery terminal-receipt
fields. Snapshot hash `0f1b` equals request `002b`, RECOVERY_BEGIN `a028`, and
recovery terminal receipt `9027`.
Recovery authorization is replay-resistant through its exact target journal
whole-file hash, last-complete-record hash, current-set hash, disposition, and
vector. A resolved child changes the unique chain tip, so the same authorization
cannot validate a later child even though the authorization object is retained.

### 9.1 Protected-install authorization: `HMG4Z2`

This object freezes evidence for a future separately authorized installation;
it does not authorize installation merely by existing. Its payload is exactly:

```text
0x7601 protocol_spec_sha256       SHA256
0x7602 helper_sha256              SHA256
0x7603 policy_sha256              SHA256
0x7604 reproducible_build_sha256  SHA256
0x7605 helper_code_identity       STRUCT ExecutableCodeIdentity
0x7606 intended_install_root      STRUCT RootIdentity
0x7607 intended_parent_identity   STRUCT DirectoryIdentity
0x7608 intended_metadata_set_sha256 SHA256, derived kind 31
0x7609 operator_identity_sha256   SHA256
0x760a authorization_nonce        BYTES, exactly 32
0x760b issued_at_unix_seconds     U64
0x760c expires_at_unix_seconds    U64
0x760d single_use                 BOOL, exactly true
0x760e acceptance_effect_mask     U64, exactly zero
0x760f operator_identity          STRUCT ActorIdentity
0x7610 authorization_statement_sha256 SHA256, derived kind 43
0x7611 signature_algorithm        U32, exactly 1 Ed25519
0x7612 detached_signature         BYTES, exactly 64
0x7613 intended_metadata_count    U32, exactly 3
0x7614 intended_metadata          LIST RoleMetadataPolicy, exact count
0x7615 installer_writer_identity_sha256 SHA256, derived kind 34
0x7616 installer_writer_identity  STRUCT ActorIdentity, kind 1 with bit 12
0x7617 prerequisite_birth_authority_set_sha256 SHA256, derived kind 187
0x7618 prerequisite_birth_authority_count U32, exactly 4
```

Install receipt `5009` equals the complete `HMG4Z2` hash. It is valid for at
most 900 seconds and is consumed exactly by the independently authorized
installer's first successful helper-leaf `O_EXCL`; a completed HMG4I2 later
attests that consumption. Failure before that exact call is nonconsuming;
success followed by any later failure is consuming and leaves a manual-only
partial install. This production helper never consumes or acts on Z2.
`7608` is kind 31 over `7614`; the list contains exactly policy metadata roles
13 helper, 14 policy, and 15 lock in that order, and `7613` agrees. The intended
root/parent identities, these metadata policies, helper code identity, build,
and policy all equal the later install receipt field-for-field.
The later I2 must satisfy exact temporal order
`760b <= 5032 <= 5033 == 500b < 760c`; an installation cannot begin before this
authorization is issued and cannot finish at or after its exclusive expiry.
`7615` is kind 34 over `7616`; it is the exact kind-1 bit-12 process authorized
to perform the installation and later equals I2 `5027/5028`. The kind-2 bit-5
authorizer signs that writer selection and cannot itself satisfy a filesystem
WriterAuthorityRule.
`7617/7618` equal later I2 `5038/5039`. Z2 signs this exact already-complete
four-member kind-187 prerequisite C2/S2/claim set hash and count without
duplicating its bytes; I2 `503a` supplies the sole complete canonical preimage.
The installer opens and rehashes that preimage before `install_now`, and Q2
later reopens the exact Z2 through I2 `5009` and rechecks the same equality. A
Z2 from one prerequisite set paired with I2 or Q2 from another is invalid even
when every parent identity is otherwise equal.

For each `HMG4W2`, `HMG4O2`, or `HMG4Z2`, the unsigned payload is the canonical
payload with its statement-hash, signature-algorithm, and signature tags
omitted, but with the complete operator ActorIdentity included. The exact kind-
43 stream contains the object's magic/header discriminator, SHA-256 of that
unsigned payload, kind-34 operator hash, nonce, issued time, and expiry.
`operator_identity_sha256` equals kind 34 over the embedded ActorIdentity and
must resolve to the policy catalog with respectively bit 6, 7, or 5. Ed25519
verification uses its exact `6f08` SPKI public key and signs the complete kind-43
bytes directly. Any missing/extra signed field, locally rehashed mutation,
signature malleation, actor substitution, or wrong role bit is invalid. The
issuer identity/trust/location is validated independently and is never inferred
from the operator identity.

HMG4S2 uses the same strict kind-43 construction but is embedded/precreation
authority rather than an EvidenceLocation object. Its omitted tags are
`8515..8517`; actor/hash are `8514/8513`, nonce `850b`, and times `850c/850d`.
The actor equals future policy `1053`, its hash equals `1052`, and it carries
only bit 18. The compiled privileged-provisioner trust anchor and the later
policy catalog must contain that same SPKI/ActorIdentity exactly once. No policy
hash is in S2 because final inode-bound P2 is created later; instead the signed
intent fixes successor/predecessor hashes, exact parent, full subject path/
content/metadata plan, provisioner, future runtime owner, and zero acceptance
effect. Any S2/P2/C2 mismatch blocks the later C2/Q2 chain.

## 10. Protected writer profile

Production has exactly one profile: a dedicated non-login service UID/GID,
launched by the exact protected launcher configuration and not shared with an
untrusted process. Real/effective/saved IDs and the exact supplementary group
list equal policy. Every managed parent and inode denies untrusted namespace,
content, link, and metadata authority. Target filesystem ownership must be
enabled; `MNT_UNKNOWNPERMISSIONS` blocks production.

This successor admits no pre-existing production object by a revoke, scan,
`chmod`, or inferred “no known writer” procedure. Every production subject must
use Q2 method 1, carry `4054=true`, and provide the exact profile-1/profile-3
HMG4S2/HMG4C2 or profile-2 HMG4I2 protected-from-birth chain selected by its
ProtectionSubject. A subject without that complete birth/install evidence is
rejected even if a scan currently finds no process. This document performs no
UID, ownership, ACL, launcher, relocation, or volume change; current WestWorld
production mutation remains blocked.

The identity split is exact. Policy `1014.240a == 102d ==` kind 48 over `103a`.
Kind 15 over launcher code `1014.240b` equals `103a.4b08` and launcher actor
`4b0c.6f05` (bit 8). The unique bit-10 runtime-helper actor embeds policy
`103b` in `6f0b`; its effective UID/GID and complete groups equal `1014`, while
its real/saved IDs are proven by Q2 process credential equality. Q2 `4009` and
every BirthProtectionRule `4704` equal kind 15 over the complete policy `1014`.
Launcher code and helper code are distinct identities and cannot be swapped.

The bit-11 evidence-ingest broker and bit-12 installer likewise use distinct
kind-1 actors, dedicated nonlogin credentials, and exact protected code
identities. Q2 admits exactly one already-running bit-11 broker process through
its normalized public KERN_PROC execution identity, complete credential,
held/static/dynamic code identity, and class-2 writer projection. The same
process must remain continuously present and byte-identical through storage of
Q2 and the selected post-Q W2/O2 and until durable BEGIN, with no second
ACL-equivalent process. New launch, process exit/restart, public birth-tuple or
credential/code drift, or broker replacement invalidates Q and blocks. Q2 makes
no audit-token, process-unique-ID, all-process FD, task, or VM claim. I2 records
the exact bit-12 installer process; Q later proves that process absent and its
revocable writer rule unavailable. Filesystem ACL/mode proves only credential-
level closure; these public process/code/continuity checks are separate and
mandatory.

## 11. Exact evidence-path and custody grammars

Authority paths are ASCII exact bytes with no normalization or case folding.
`APPROVED_EVIDENCE_REL_PATH` must match one Section 5 role template derived from
the complete object hash and the policy's held protected parent. It is not a
generic lexical path. `OBSERVED_CUSTODY_LEAF` remains read-only role-8 evidence
and can never be converted into any authority path type.

Normative RFC 5234 plus RFC 7405 case-sensitive ABNF:

```text
DIGIT    = %x30-39
LOWERHEX = DIGIT / %x61-66
HEX64    = 64LOWERHEX
TXID     = HEX64
DIGEST   = HEX64
INDEX    = %x30 %x30 DIGIT / %x30 %x31-39 DIGIT /
           %x31 %x30 DIGIT / %x31 %x31 %x30-33

request  = %s"tx-" TXID %s"-request-" DIGEST %s".bin"
journal  = %s"tx-" TXID %s"-journal-" DIGEST %s".log"
receipt  = %s"tx-" TXID %s"-receipt-" DIGEST %s".receipt"
stage    = %s"tx-" TXID %s"-stage-" INDEX %s"-" DIGEST
archive  = %s"tx-" TXID %s"-archive-" INDEX %s"-" DIGEST
preimage = %s"tx-" TXID %s"-preimage-" INDEX %s"-" DIGEST
rollback = %s"tx-" TXID %s"-rollback-" INDEX %s"-" DIGEST

plan-path       = %s"plans/g4-l10-" HEX64 %s".plan"
bundle-path     = %s"bundles/g4-l10-" HEX64 %s".bundle"
cap-target-path = %s"receipts/cap-target-" HEX64 %s".receipt"
cap-system-path = %s"receipts/cap-system-" HEX64 %s".receipt"
quiescence-path = %s"receipts/quiescence-" HEX64 %s".receipt"
recover-path    = %s"authorizations/recover-" HEX64 %s".auth"
build-path      = %s"receipts/build-" HEX64 %s".receipt"
install-path    = %s"receipts/install-" HEX64 %s".receipt"
xattr-path      = %s"xattr/g4-l10-" HEX64 %s".xattr"
apply-path      = %s"authorizations/apply-" HEX64 %s".auth"
install-auth-path = %s"authorizations/install-" HEX64 %s".auth"
review-path     = %s"receipts/review-" HEX64 %s".manifest"
evidence-path   = plan-path / bundle-path / cap-target-path / cap-system-path /
                  quiescence-path / recover-path / build-path / install-path /
                  xattr-path / apply-path / install-auth-path / review-path

cap-scope       = %s"target" / %s"system-lock"
fixture-root    = %s"capability-fixtures/" cap-scope %s"-" HEX64
fixture-claim   = %s"fixture-reservation-" HEX64 %s".claim"
target-op       = %s"00" %x31-39 / %s"01" %x30-38
system-op       = %s"10" %x31-35
cap-attempt     = %x30-32
denial-op       = %s"0" %x31-39 / %s"10" / %s"11"
denial-scenario = %x30-32
denial-attempt-index = %x30-35
capability-attempt = fixture-root %s"/op-" (target-op / system-op)
                     %s"/attempt-" cap-attempt
denial-attempt  = fixture-root %s"/deny-" denial-op %s"-scenario-"
                  denial-scenario %s"/attempt-" denial-attempt-index
fixture-attempt = capability-attempt / denial-attempt
```

The seven custody alternatives are the complete `SAFE_CUSTODY_LEAF` grammar.
`APPROVED_EVIDENCE_REL_PATH` is exactly `evidence-path`, with its selected
alternative equal to the policy role and its HEX64 equal to the complete object
hash. `CAPABILITY_FIXTURE_ROOT_REL_PATH` is exactly `fixture-root`;
`CAPABILITY_FIXTURE_REL_PATH` is exactly `fixture-attempt`.

The full evidence path to held-immediate-parent projection is iff. Roles
1/2 require exact prefixes `plans/` and `bundles/` and policy role-2 parent
subroles 2/3. Roles 3/4/5/7/8/12 require exact prefix `receipts/` and subrole 4.
Roles 6/10/11 require exact prefix `authorizations/` and subrole 5. Role 9
requires exact prefix `xattr/` and subrole 6. The validator first byte-compares
the one role-selected ASCII prefix, removes exactly those prefix bytes including
the one slash, and performs no decoding, normalization, case folding, or second
separator removal. The remainder must be nonempty, contain no slash, and match
the corresponding role's one leaf production above with the observed complete
object hash. `EvidenceLocation.6302/630e` must be the exact mapped immediate
parent; only that slash-free remainder is passed to `openat` on its retained
FD. A full path passed relative to the immediate parent, a missing/doubled
prefix, another role sharing the same top-level directory, or a leaf containing
another slash is invalid.
`CAPABILITY_FIXTURE_CLAIM_REL_PATH` is exactly `fixture-claim`; its sole HEX64
is the complete F2 nonce. HMG4K2 `3030` and profile-2
AccessDenialFixtureObservation `7f39` use this same nonce-keyed reservation
grammar, while their different fixed claim-content magics bind the complete F2
hash, profile, and scope. Within one held fixture parent, two F2 objects with the
same nonce therefore contend on one `O_EXCL` leaf even when their hashes or
profiles differ; only one can mutate. The one-use domain is the exact tuple
(held fixture-parent identity, scope, nonce). The stable K2/E2 scans are
defense-in-depth and never substitute for this atomic reservation.
For profile-1 CapabilityAttempt paths, only the `capability-attempt` alternative
is legal: scope text and operation range equal the receipt scope, the root
HEX64 is lowercase encoding of nonzero `300c`, and attempt text equals
`CapabilityAttempt.ordinal`. Profile-2 DenialNamespaceObservation `7fd3`
requires only the `denial-attempt` alternative: scope is exactly `target`, root
HEX64 is lowercase F2 `790b`, denial-op/scenario are the zero-padded decimal
forms of enclosing `7f23/7f24`, and attempt index equals `7f61`. Valid pairs are
iff `(1,0),(2,1),(2,2),(3,0)..(11,0)` and ordinals 3..5 are legal iff the row's
required count is six. Thus rename-in and rename-out are injectively distinct.
None of these four path types is implicitly convertible to another.

The digest is respectively the complete request frame, intended complete
sequence-0 record, complete terminal receipt, desired blob, predecessor archive
copy, predecessor inode content, or installed successor content. Transaction ID
is lowercase hex of exactly 32 `getentropy` bytes, rejects all-zero, is caller-
independent, and permits at most 16 total candidates after stable enumeration:
one initial candidate and at most 15 collision retries.
All digests are full length and never absence sentinels.

The complete sequence-0 record is constructed and hashed in memory before the
journal leaf is exclusively created; neither record contains its own leaf. A
crash may leave empty/partial bytes under that intended-hash leaf, which remains
a scanner blocker. The parser returns exact variant, transaction ID, optional
index, and digest; context requires matching artifact role. Periods occur only
in `.bin`, `.log`, and `.receipt`. Every unparseable or unowned name is retained
as role-8 unresolved evidence and blocks apply.

## 12. Artifact lifecycle and transition directions

For every predecessor-present Entry, after durable `BEGIN` the helper creates
one independent archive ordinary inode by exact FD-to-new-FD byte copy and one
stage inode. For every predecessor-absent Entry it creates one stage only. The
request copy is one transaction-scoped artifact. Original `ARTIFACT_CREATED`
permits roles request, archive, and stage only. Preimage is the original live
inode created in custody only by direction 1; rollback is the installed live
inode created in custody only by direction 3. Neither is an `ARTIFACT_CREATED`
copy. Archive is evidence redundancy and never substitutes for the preimage
inode in automatic rollback. Recovery artifact records obey the same role rules
and may additionally adopt, but never recreate, an exact already-effected
preimage/rollback move.

The only direction registry is:

```text
1 LIVE_TO_PREIMAGE_CUSTODY             roles 1 live -> 3 preimage
2 STAGE_CUSTODY_TO_LIVE                roles 2 stage -> 1 live
3 INSTALLED_LIVE_TO_ROLLBACK_CUSTODY   roles 1 live -> 4 rollback
4 PREIMAGE_CUSTODY_TO_LIVE             roles 3 preimage -> 1 live
```

Direction 1 and 4 require predecessor state 1. Direction 2 accepts state 0 or
1. Direction 3 is legal only after direction 2 for the same index. The old
phrase `preimage-to-custody` is invalid and has no alias. Source-before and
destination-after have identical device, inode, ordinary type, size, content,
link count one, mode, owner, group, flags, ACL, and xattr-set hashes; only role
and path change.

### 12.1 Direction 1: exact live-to-preimage operation

Direction 1 is one no-copy, no-replace namespace move of the exact predecessor
ordinary inode from its managed live leaf to its root-transaction preimage leaf.
It is legal iff all of these bindings hold:

1. `a311` is the next mutation ordinal of the recording journal. `a312` is the
   exact next unconsumed Transition in the root forward vector for apply or the
   signed authorized-recovery vector for recover: its direction is 1, predecessor
   state is 1, source role is 1, and destination role is 3. Its scalar managed
   index `a312.0e02` equals `a313.0501 == a314.0501 == a317.0501`; a scalar is
   never compared with a complete FinalEntry STRUCT.
2. `a313` is byte-identical to the held predecessor FinalEntry selected by the
   request predecessor set and Entry at that index. It is ordinary, link count
   one, at the exact managed POLICY_REL_PATH, and its parent, component chain,
   mount, ACL, xattr policy, and protected-from-birth Q2 subject all equal the
   policy. No later live replacement may be substituted.
3. `a318` is the nonzero root apply transaction ID, including when a recovery
   child records the intent. `a314` is the canonical absent FinalEntry at role 3
   and exact leaf `tx-` + lowercase hex(`a318`) + `-preimage-` + the three-digit
   managed index + `-` + lowercase hex(`a313.sha256`). Its parsed variant is
   preimage, its source rule is the unique class-3/custody-variant-6
   NamespaceRuleMember for that held predecessor FinalEntry, and every
   absent-state field follows the incorporated FinalEntry absence grammar.
4. `a317` has that same role-3 path and the exact device, inode, ordinary type,
   logical length, content, link count one, mode, owner, group, flags, ACL, and
   xattr-set values from `a313`. No field other than role/path changes. The
   direction-1 post-state has the live leaf absent, this one preimage leaf
   present, and no third location for the inode.
5. `a319` is kind 115 over the complete pre-intent state and `a315` is its
   `890f` legacy projection. `a31a` is kind 115 over the exact expected state
   after one matching resolver and `a316` is its `890f` projection. Those two
   complete states have identical root, all unrelated live/material members,
   and unresolved-namespace set; the only namespace change is the
   selected live-to-preimage relocation. Both have an empty kind-109 set because
   they are boundary states. The between-intent state used by the resolver has
   the same namespace as the observed pre- or post-state and exactly one kind-
   109 member naming this intent.

The implementation obtains and retains the exact no-follow source and
destination parent FDs before the intent, reconstructs the complete `a319`
preimage from the prior resolved journal boundary, and performs two consecutive
full stable scans. Both scans include the managed live parents, custody parent,
all active-chain custody leaves, every inode location, and all kind-9 members;
their canonical FinalEntry/name streams, parent identities, and kind-115 value
must be byte-identical. It then appends the complete MOVE_INTENT, file-syncs and
F_FULLFSYNCs the journal, syncs the journal parent, and revalidates the retained
parents and the exact pre-state. Any drift occurs before the rename and resolves
the intent only as exact no effect or manual; it cannot select another source,
destination, or transition.

There is exactly one namespace syscall for this intent:
`renameatx_np(source_parent_fd, source_leaf, destination_parent_fd,
destination_leaf, RENAME_EXCL)`. The leaf arguments are the slash-free final
components already bound above. The helper does not call `rename`, `renameat`,
copy/unlink, link, clone, exchange, overwrite, or an unreviewed syscall wrapper.
It never retries `renameatx_np`, including after `EINTR`; the result is resolved
only by complete state observation. A zero return and an exact post-state, or a
nonzero return followed by that same exact post-state, is an effected move. A
nonzero return followed by the byte-identical exact pre-state is no effect. A
zero return with non-post-state, partial relocation, two locations, foreign
inode, replaced parent/FD, unreadable object, or any third state is manual-only.
Raw errno is retained only in the internal registered syscall observation and
never changes these state classes or appears in attacker-selected response text.

For an effected move, the helper retains/reopens the moved ordinary inode from
the held destination parent, rechecks `a317`, calls file `fsync`, file
`F_FULLFSYNC`, source-parent `fsync`, and destination-parent `fsync` in that
order, collapsing the last two to one call iff the complete DirectoryIdentity
bytes are equal. It then performs two byte-identical full post-state scans and
rechecks that no third hardlink/location exists. Only after all calls return zero
may it append the matching type-4 or type-17 resolver; a recovery adoption of an
already exact post-state uses type 21 and its mandatory `a30d` resync. The move
resolver's `a303/a304` equal `a313/a317`, `a301/a302` equal `a312` direction and
index, `a305 == a316`, `a306/a307/a309/a30a` bind the one intent/scope/root, and
`a30e` is the observed kind-115 state with that one open intent. Its `a30f ==
a31a` after the resolver closes the kind-109 member. Exact pre-state/no effect
uses type 22 with `a70d` naming the before-resolver open-intent state and `a70e
== a319` after closure. A durability error after an effected rename never uses
no-effect and never triggers a blind reverse/retry; it remains inode-accounted
and requires the signed rollback or manual recovery branch.

## 13. Fully write-ahead journal amendment

This section expressly replaces the predecessor payload-presence table and
legal-transition families for record types 1..22. Record types are:

```text
1 BEGIN                         2 ARTIFACT_CREATED
3 PREPARED                      4 MOVE_APPLIED
5 COMMIT_INTENT                 6 COMMITTED
7 ROLLBACK_BEGIN                8 ROLLBACK_MOVE_APPLIED
9 ROLLBACK_INTENT              10 ROLLED_BACK
11 REFUSAL_INTENT              12 REFUSED_AFTER_BEGIN
13 MANUAL_RECOVERY_INTENT      14 MANUAL_RECOVERY_REQUIRED
15 RECOVERY_BEGIN              16 RECOVERY_ARTIFACT_CREATED
17 RECOVERY_MOVE_APPLIED
18 ARTIFACT_INTENT
19 MOVE_INTENT
20 RECOVERY_ARTIFACT_ADOPTED
21 RECOVERY_MOVE_ADOPTED
22 INTENT_RESOLVED_NO_EFFECT
```

No post-BEGIN side effect occurs without a preceding durable intent. The
terminal intent is the write-ahead authorization for its one terminal-receipt
exclusive-create; terminal-receipt creation never uses ARTIFACT_INTENT. Every
other create or move uses exactly one intent. The canonical nested
`ArtifactIntentPayload` used by record type 18 and
`UnresolvedChainIntent.894d` is exactly:

```text
0xa111 mutation_ordinal             U32
0xa112 artifact_role                U32
0xa113 managed_index                U32 or 0xffffffff
0xa114 custody_leaf                 SAFE_CUSTODY_LEAF
0xa115 expected_after               STRUCT ArtifactExpectation
0xa116 current_set_before_sha256     SHA256
0xa117 destination_expected_absent   STRUCT FinalEntry
0xa118 originating_transaction_id    BYTES, exactly 32
0xa119 artifact_plan_ordinal          U32
0xa11a complete_current_state_before_sha256 SHA256, derived kind 115
0xa11b artifact_postcondition_template_sha256 SHA256, derived kind 191
```

Kind 191 is a pre-create postcondition template, not a future
`CompleteCurrentState` and not a `FinalEntry` identity. It uses the normal
predecessor HMG4D2 framing with version 2, derived kind 191, member count one,
and one length-prefixed canonical `ArtifactPostconditionTemplateMember`.
Member ordinal is zero and `9b02..9b0b` equal the already-serialized complete
`a111..a11a` fields one-for-one; `9b0c=1`. The template therefore binds mutation
ordinal, role, index, leaf, every predictable `ArtifactExpectation`
content/metadata field, the complete destination-absence observation, root
transaction, plan ordinal, legacy current-set projection, and the exact
kind-115 pre-intent boundary. It contains no device, inode, resolver
record/hash, durability result, or claimed post-create kind-115 digest. `a11b`
is SHA-256 of that one exact HMG4D2 stream and is recomputed from those
already-serialized fields; a second framing, zero/multiple member, or
caller-supplied template preimage is forbidden.

The canonical nested `MoveIntentPayload` used by record type 19 and
`UnresolvedChainIntent.894e` is exactly:

```text
0xa311 mutation_ordinal             U32
0xa312 transition                   STRUCT Transition
0xa313 source_before                STRUCT FinalEntry
0xa314 destination_expected_absent  STRUCT FinalEntry
0xa315 current_set_before_sha256     SHA256
0xa316 current_set_after_sha256      SHA256
0xa317 destination_after             STRUCT FinalEntry
0xa318 originating_transaction_id    BYTES, exactly 32
0xa319 complete_current_state_before_sha256 SHA256, derived kind 115
0xa31a expected_complete_current_state_after_resolver_sha256 SHA256,
                                         derived kind 115
```

Artifact resolver records use exactly:

```text
0xa101 artifact_role                 U32: 1 request, 2 stage, 3 archive
0xa102 managed_index                 U32, 0..113 or 0xffffffff for request
0xa103 custody_leaf                  SAFE_CUSTODY_LEAF
0xa104 observed_entry                STRUCT FinalEntry
0xa105 mutation_ordinal              U32 or 0xffffffff for parent-tip resolver
0xa106 target_intent_record_sha256   SHA256
0xa107 resolver_observation_sha256   SHA256, derived kind 18
0xa108 intent_scope                  U32: 1 same journal, 2 immediate parent tip
0xa109 originating_transaction_id    BYTES, exactly 32
0xa10a resolver_observation_count    U32, exactly 1
0xa10b resolver_observations         LIST EvidenceArtifactObservation, exact count
0xa10c adoption_durability_resync    STRUCT DurabilityResyncObservation,
                                         required type 20, forbidden types 2/16
0xa10d complete_current_state_before_resolver_sha256 SHA256, derived kind 115
0xa10e complete_current_state_after_resolver_sha256 SHA256, derived kind 115
```

Move resolver records use predecessor `a301..a305` plus exactly:

```text
0xa306 mutation_ordinal              U32 or 0xffffffff for parent-tip resolver
0xa307 target_intent_record_sha256   SHA256
0xa308 resolver_observation_sha256   SHA256, derived kind 18
0xa309 intent_scope                  U32: 1 same journal, 2 immediate parent tip
0xa30a originating_transaction_id    BYTES, exactly 32
0xa30b resolver_observation_count    U32, exactly 2
0xa30c resolver_observations         LIST EvidenceArtifactObservation, exact count
0xa30d adoption_durability_resync    STRUCT DurabilityResyncObservation,
                                         required type 21, forbidden types 4/8/17
0xa30e complete_current_state_before_resolver_sha256 SHA256, derived kind 115
0xa30f complete_current_state_after_resolver_sha256 SHA256, derived kind 115
```

For scope 1, the intent is the immediately preceding same-journal record,
ordinal is its ordinal, and the resolver is type 2/4/8/16/17 as appropriate.
For scope 2, ordinal is `0xffffffff`, the target is the sole immediate-parent
tip named by RECOVERY_BEGIN, and only types 16/17/20/21 are legal. Type 16/17
means recovery performed the already-parent-WAL-authorized effect from exact
pre-state; type 20/21 means the exact post-state existed before RECOVERY_BEGIN
and recovery performed no content, metadata, or namespace mutation. Adoption
never manufactures or changes an inode, but it must re-establish durability by
the idempotent held-FD resync below. `resolver_observation_sha256` covers the
complete exact pre/post state.

For type 20 or 21 only, after durable RECOVERY_BEGIN and exact post-state
observation, recovery opens/retains the already-existing ordinary inode from
the held parent, rechecks its complete FinalEntry, calls file `fsync`, then
file `F_FULLFSYNC`, then `fsync` on every affected held parent directory, and
re-observes the byte-identical FinalEntry and parent identities. It appends the
adoption resolver only after every call returns zero. `a10c` has profile 1,
`7ea2/7ea7` equal kind 15 over `a104`, and its sole parent is the exact custody
parent of `a103`. `a30d` has profile 2, `7ea2/7ea7` equal kind 15 over `a304`,
and its parent list is source parent first plus destination parent second,
collapsing to one member iff their complete DirectoryIdentity bytes are equal.
Those parent identities equal the held ancestry used by `a303/a304` and the
open parent type-19 intent. Any syscall error, unsupported F_FULLFSYNC,
identity/metadata drift, incomplete affected-parent list, replaced descriptor,
or failed post-resync observation is manual-close-only and forbids type 20/21.
The resync result STRUCT is part of the resolver record hash and is therefore
durable evidence of this recovery execution; no assertion about unknowable
pre-crash sync return values is used.

If any such blocker occurs after durable `RECOVERY_BEGIN` but before the
mandatory type-20/type-21 resolver, the current child does not rewrite its
signed disposition to 4 and cannot honestly append that resolver. It appends no
artifact, move, terminal intent, terminal receipt, or terminal record and
performs no further mutation; its journal remains nonterminal with the complete
type-15 `RECOVERY_BEGIN` as tip. A stable read-only classification may select
the lowest applicable registered status-4 response code (sync/durability
uncertainty is `00050008`), but that response is non-authoritative and cannot
stand in for a terminal record. If response safety itself is unavailable the
operation exits 74. Only a later, separately authorized disposition-4
grandchild may close this state under the exact terminal-only rule below.

`INTENT_RESOLVED_NO_EFFECT` contains exactly:

```text
0xa701 target_intent_record_sha256   SHA256
0xa702 target_intent_type            U32, exactly 18 or 19
0xa703 target_journal_sha256         SHA256, through the target intent
0xa704 exact_prestate_observation_sha256 SHA256, equal `a705`
0xa705 current_set_sha256            SHA256
0xa706 reason                        U32: 1 artifact-create proven no effect,
                                         2 forward-move proven no effect,
                                         3 rollback-move proven no effect,
                                         4 recovery disposition cancels parent intent
0xa707 result                        U32, exactly 1 exact-prestate/no-effect
0xa708 intent_scope                  U32: 1 same journal, 2 immediate parent tip
0xa709 current_live_entry_count      U32, exactly 114
0xa70a current_live_entries          LIST FinalEntry, exact count
0xa70b current_material_entry_count  U32, 0..1,024
0xa70c current_material_entries      LIST FinalEntry, exact count
0xa70d complete_current_state_before_resolver_sha256 SHA256, derived kind 115
0xa70e complete_current_state_after_resolver_sha256 SHA256, derived kind 115
```

Every terminal-intent payload additionally contains exactly:

```text
0xa407 final_unresolved_chain_set_sha256 SHA256, derived kind 109
0xa408 final_unresolved_chain_intent_count U32, 0..1
0xa409 final_complete_current_state_sha256 SHA256, derived kind 115
```

`a407` is kind 109 over the exact final chain-intent list later embedded at
receipt `902a`, and `a408 == 9029`. `a409 == 902b`. Receipt `9028` is kind 109
over `902a` and equals `a407`. Receipt `902b` is kind 115 over one reconstructed
`CompleteCurrentState`: its root is receipt transaction `9002` for an original
apply and original/root transaction `9013` for a recovery child; live fields
come from `9009/900b`; material fields from `900a/9011`; unresolved namespace
from intent `a406` and receipt `901b`; unresolved chain from `9028..902a`; and
its legacy projection and result are recomputed. The terminal-intent record hash
in `9007` commits to `a407..a409`, so the receipt cannot select a different
final state. Committed, rolled-back, and refused states require an empty kind-
109 set. Manual-recovery-required carries exactly the zero-or-one classified
open ancestor/immediate intent from the frozen admission snapshot when it
remains unresolved; it may be empty only when the manual blocker is represented
entirely by the violation/unresolved-namespace sets.

Scope 1 target is the immediately preceding record. Scope 2 target is the
immediate parent tip. This record performs no mutation. It is the sole legal way
to close a durable intent when exact pre-state proves no effect; partial,
ambiguous, or uncertain state cannot use it.

The reason matrix is iff, not advisory. Reason 1 requires scope 1 and target
type 18 ARTIFACT_INTENT. Reason 2 requires scope 1, target type 19 MOVE_INTENT,
and direction 1 or 2. Reason 3 requires scope 1, target type 19, and direction 3
or 4. Reason 4 requires scope 2 and the immediate parent tip type 18 or 19; the
child RECOVERY_BEGIN/O2 disposition and exact authorized vector must make that
parent side effect absent/forbidden rather than merely deferred. Scope 1 forbids
reason 4; scope 2 requires it. `a702`, target intent payload/transition,
direction, `a708`, parent tip hash, RECOVERY_BEGIN disposition/vector, and the
operator authorization all cross-equal this matrix. A recovery vector that
still contains the target effect must execute/adopt it or remain nonterminal;
it cannot cancel it with a no-effect record.

`a107` and `a308` are kind 18 over `a10b` and `a30c`, and their counts agree.
Artifact resolver observation 0 is the path-free canonical projection of
`a104` with diagnostic bytes exactly `resolver/artifact/0`. Move resolver
observations 0 and 1 are the projections of `a303` and `a304` with diagnostic
bytes exactly `resolver/source/0` and `resolver/destination/1`. Projection
copies type, device, inode, size/content, link/mode/owner/group/flags/ACL/xattr
fields exactly but never converts a FinalEntry path into fixture or authority
path syntax. `a70a/a70c` use the predecessor final-live/material-custody sort,
role, index, and membership rules; their two frozen final-set hashes recompute
the predecessor 76-byte current-set stream. Both `a704` and `a705` equal that
SHA-256. This path/index-bearing stream, not a path-free observation union, is
the no-effect prestate authority.

Every kind-115 hash in an intent or resolver has one reconstructible canonical
preimage; a bare digest with no journal/request/filesystem derivation is
invalid. `a11a/a319` equal the prior resolved boundary. `a11b` is instead kind
191 over the exact type-18 fields `a111..a11a` and deliberately has no future
inode or complete-after-state preimage. `a10d/a30e/a70d` equal
the observation immediately before the resolver and contain exactly the one
kind-109 member for the target open intent; their live/material projection is
the exact observed pre- or post-effect state. `a10e/a30f/a70e` are the boundary
after the resolver record and have an empty kind-109 set. For a performed or
adopted artifact, `a10e` is the first resolved-boundary complete kind-115
after-state identity;
it is never compared to `a11b` as a digest. Instead `a11b` recomputes kind 191,
`a101..a103 == a112..a114`, `a104` uses FinalEntry location role 6/2/5 for
artifact role 1/2/3 respectively, its index/leaf equal `a113/a114`, and all its
predictable ordinary-file fields equal `a115`. The immediately pre-resolver
`a10d` already contains that exact effected/adopted `a104` material-custody
member plus the one open target intent. The complete `a10e` is mechanically
derived from `a10d` only by removing that unresolved-chain member; their entire
live, material, and unresolved-namespace lists are otherwise byte-identical.
Relative to the reconstructible pre-intent boundary whose hash is `a11a`,
`a10e` has exactly the one new matching `a104` material-custody member and no
other live/material change. The ordinary
`a104` device/inode pair is nonzero, absent from the complete pre-intent state,
unique in `a10d/a10e`, and first authority-bound by this resolver. For a
performed or adopted move, `a30f == a31a`; for no effect, `a70e` equals the
target intent's `a11a` or `a319`.
Legacy hashes `a116`, `a315`, `a316`, `a305`, `a704`, and `a705` equal the
corresponding `CompleteCurrentState.890f` projection and cannot validate without
the kind-115 reconstruction. The root transaction, every unrelated member, and
both unresolved sets are byte-identical across a resolver except for the exact
authorized artifact/move effect and removal of the one resolved chain intent.

Gate B independently mutates every one of `a111..a11a` while retaining the old
`a11b`, mutates/duplicates/omits/reorders the sole kind-191 member or changes
its HMG4D2 header/kind/count/member length, locally recomputes `a11b` while
changing the selected plan or resolver,
substitutes an actual kind-115 after-state hash for `a11b`, inserts a proposed
device/inode or resolver field into the kind-191 member, reuses an inode from
the pre-intent state, and pairs endpoint A's template with resolver B's
`a104/a10e`. It also removes/adds the artifact between `a10d` and `a10e`, adds
it twice relative to the `a11a` boundary, or changes an unrelated member across
either comparison; each case fails. Positive vectors cover same-journal performed and
immediate-parent adopted artifacts with different kernel-assigned inode values;
both pass the same template grammar without predicting either inode.

The immediate-parent recovery matrix is total. `admission/disposition` is the
selected `8933/892a`; `class/action` is the already-complete current
branch-specific classification `894f/8950`. It is fixed before HMG4O2 signing
and never rewritten afterward: an automatic branch uses class 1..3, while an
exact-state owner-selected manual branch uses class 8/action 4:

```text
admission/disposition  intent  relationship  class/action  sole first child resolver
1/1..3                 18      immediate     1/1           type 22, reason 4, scope 2
1/1..3                 18      immediate     2/2           type 20, scope 2, with a10c
1/1..3                 18      immediate     3/3           type 16, scope 2
1/1..3                 19      immediate     1/1           type 22, reason 4, scope 2
1/1..3                 19      immediate     2/2           type 21, scope 2, with a30d
1/1..3                 19      immediate     3/3           type 17, scope 2
2/4                    18/19   immediate     8/4           none; exact-state terminal-only manual branch
2/4                    18/19   immediate     4..7/4        none; terminal-only manual branch
2/4                    18/19   strict ancestor 4..8/4      none; terminal-only manual branch
```

For admission class 1, the selected HMG4O2 vector/disposition must consume and
make the displayed action unique. No-effect cannot be used when the vector
still requires the effect; perform cannot be used when it cancels it; adoption
requires the one exact unrecorded post-state. For admission class 2, the vector
and count are empty; exact pre/post state uses class 8/action 4, unsafe state
uses class 4..7/action 4, and no resolver or child mutation is permitted.
The first child record after RECOVERY_BEGIN is the displayed resolver exactly
when one exists; a manual row proceeds directly to `MANUAL_RECOVERY_INTENT`.
A different resolver type, delayed resolver, second resolver, resolver in a
manual row, missing resolver in an automatic row, missing resync,
class/action/admission mismatch, or strict-ancestor resolution is invalid and
blocks all later child mutation.

Gate B holds the same complete safe immediate pre/post state observations fixed
while changing the selected branch. The automatic positive uses class/action
1/1, 2/2, or 3/3 with admission class 1, its nonempty action-selecting vector
where required, and its exact resolver; the manual positive uses class/action
8/4 with admission/disposition 2/4, empty vector, and no resolver. It then
changes only one of class, action, `8958`, admission, disposition, vector, or
resolver to create every automatic/manual cross-pair; none is valid. It also
inserts every resolver type into each manual row, removes or delays the resolver
in each automatic row, adds one artifact/move/request-copy mutation to a manual
row, mislabels an unsafe state as class 8, or uses class 1..3 under disposition
4; every case fails.

The first mutation remains exclusive journal creation followed by durable
sequence-0 `BEGIN`/`RECOVERY_BEGIN`. Thereafter every artifact follows:

```text
durable ARTIFACT_INTENT -> O_EXCL create/write/FD metadata/readback/
file fsync/F_FULLFSYNC/parent fsync -> durable ARTIFACT_CREATED
```

Every move follows:

```text
durable MOVE_INTENT -> stable pre-state/retained source FD/
renameatx_np(RENAME_EXCL...)/stable same-inode post-state/parent sync
-> durable MOVE_APPLIED
```

Per journal, mutation ordinal starts at zero and increments exactly once for
each type-18 or type-19 record; no other record consumes an ordinal. There is at
most one open mutation intent (record type 18 or 19) in the entire active chain.
No next mutation intent is written until
the current one has exactly one durable resolver. A same-journal resolver carries
the matching ordinal; a parent-tip resolver carries the sentinel. An intent may
have only one resolver across all descendants; sibling or replay resolution is
invalid.

Except for disposition-4 profile B's exact zero-member manual sentinel defined
below, every apply or recovery artifact plan count is exactly
`1 + 114 + predecessor_present_count`: request first, then indices 0..113,
archive before stage for each predecessor-present index and stage for every
index. The request deliberately contains no plan hash or count. Only after the
complete request frame is retained can the helper derive kind 49; BEGIN or
RECOVERY_BEGIN `a024/a025` and terminal receipt `9025/9026` are byte-identical
copies of that resulting hash/count, while sequence-zero `a026/a027` durably
embeds the exact request preimage. This ordering is acyclic: the plan's request
member binds the already-complete request, while the request contains neither
the plan nor its hash. On recovery, every ancestor plan is recomputed only from
its own held sequence-zero `a027` plus the plan's other canonical snapshot
inputs; a plan hash without its matching durably embedded frame is invalid and
manual-only. The manual-close exception below either copies a valid durable root
apply plan or uses the exact empty manual sentinel when no valid root
sequence-zero record exists; it never derives a fresh plan from its child
request. An apply plan uses the root transaction ID for
every member and `creation_disposition=2` throughout; every destination is
proved absent at the plan snapshot. Its request expectation and `7da7` bind the
retained complete request frame; archive binds its held live FinalEntry and forbids
`ArtifactExpectation.6a0a`; stage binds BundleEntry/Entry/HMG4Y2. `a117` has the
same role/index/path as the intended object, predecessor absence sentinels, and
object type zero. After create, `a104` matches role/index/path and every
predictable `a115` field; its new nonzero device/inode are stable, unique, and
absent from the before set. No intent predicts a future inode.

A recovery plan for dispositions 1 finish-commit, 2 rollback-to-predecessor, or
3 finish-refusal has the same count/order but replaces member zero with the
child recovery request-copy: its originating transaction ID, request hash/leaf,
and expectation bind the child request/child journal ID; member zero is always
disposition 2 and is absent at the recovery-plan snapshot. Every archive/stage
member 1..N retains the root apply transaction ID and original Entry/FinalEntry
source binding. Considering only that root-artifact subvector 1..N, artifacts
whose create was durably resolved use disposition 1 while still in custody.
At most one additional disposition-1 member is provisionally legal when it is
the sole archive/stage artifact at the exact fully effected post-state of the
immediate-parent open type-18 intent named by RECOVERY_BEGIN and is pending the
mandatory first scope-2 type-20 adoption defined below. Disposition 3 applies
after a stage inode was consumed by a proven direction-2 move; the exact
not-yet-created suffix uses disposition 2. The regular language remains
`(1/3)* 2*`; the provisional 1 occupies its ordinary root-plan ordinal and the
monotonic rule does not compare child member zero with member one. A disposition
3 is valid only for role-2 stage, never request/archive. A 2 followed by 1/3, a
completed artifact marked 2, a custody-present artifact marked 3, an absent
unconsumed artifact marked 1, more than one provisional 1, or any different
root/child ID is invalid. Once PREPARED or any formal move exists, no
disposition-2 root member is legal because the entire artifact sequence had to
complete first.
Child `ARTIFACT_INTENT.a119` begins at plan ordinal zero for its request
when the selected branch reaches request retention, then names only disposition-
2 root-suffix ordinals in increasing plan order; disposition-1 members are
verified/adopted and disposition-3 members are located/accounted, but neither is
recreated. All child request,
RECOVERY_BEGIN, resolver, ARTIFACT_INTENT, terminal receipt, and kind-49 copies
recompute these same bytes.

The provisional disposition-1 exception is iff. The immediate parent tip is
type 18, its `a111..a119` role/index/leaf/expectation/root transaction/plan
ordinal equal that one plan member, and no ancestor or sibling has resolved the
intent. Stable held-FD observation proves one ordinary, link-count-one inode at
exact `a113/a114`; its length/content/mode/owner/group/flags/ACL/xattrs equal
`a115/7da6`. Plan admission asserts no unknowable pre-crash syscall result;
durability is re-established after RECOVERY_BEGIN by the mandatory type-20
resync rather than inferred from the surviving inode.
O2 `0f08`, the recover request, RECOVERY_BEGIN `a012`, and the recomputed held
current-set preimage all include that identical inode/role/index/leaf and no
second location. The member's `7da7` equals the parent intent's frozen source
binding and `a119 == 7da1`. No future type-20 hash is written into the plan.

Before parsing that provisional member as available, consuming it, writing the
child request copy, or performing any other child side effect, the child must
complete the exact idempotent resync and append the mandatory first scope-2
type-20 resolver. Its `a101..a10c` bind the
same parent intent, root transaction, leaf, inode, expectation, stable
post-state observation, current-set preimage, and successful held-file/parent
durability results. Once type 20 is durable the
member is an ordinary resolved disposition 1. Exact pre-state uses type 22 and
cannot classify the member as 1; a partial write, missing metadata/readback,
resync error, different inode/bytes/metadata, two locations, ambiguous state, or
any unsatisfied equality is manual-close-only. Type 20 is forbidden for a
disposition-2 or disposition-3 member.

If the open parent type-18 intent is for that parent's request-copy rather than
an archive/stage root artifact, it is resolved by the same mandatory first
scope-2 type 20 outside the child's new kind-49 members. It is not reintroduced
as a second request member: child plan member zero remains the new child
request, disposition 2 and absent at its plan snapshot. This rule applies
equally when the parent is the root apply journal or an earlier recovery child.

For disposition 3, `7da9` is the first durable direction-2 type-19 MOVE_INTENT
when its exact post-state is awaiting adoption, otherwise the first durable
type-4, type-17, or type-21 resolver in the validated root/child chain that
completed or adopted the exact stage-to-live transition. `7daa` is the latest
record in that same unique chain that accounts for the identical inode. With
`7dad=1` it is the durable direction-2 resolver when the inode remains installed
live, or the later exact direction-3 resolver when the installed inode has moved
to rollback custody. With `7dad=2` it is the sole immediate-parent open type-19
direction-2 or direction-3 intent, its WAL-authorized effect is completely
observed at the exact post-state, and RECOVERY_BEGIN binds that parent-tip hash;
the mandatory first child resolver must complete `a30d`'s profile-2 idempotent
file/affected-parent resync and adopt it as type 21 before the member is used or
any other mutation occurs.
No future resolver hash appears in the plan. `7dab` is kind 15 over `7dac`;
`7dac` is byte-identical to the current live/material-set member at the plan
snapshot and to the resolver destination or open intent's exact destination
post-state, including role/index/path,
device/inode, content, metadata, and link count. The inode/content/metadata also
equal the original stage expectation and Entry. A missing/torn/conflicting
record, direction other than 2 then optional 3, an open intent that is partial/
ambiguous/no-effect, foreign inode, second current location, or current-set
mismatch is manual-only and cannot use disposition 3.

Disposition is a plan-snapshot fact plus conditional mutation authority, not a
promise that every member will be created on every terminal branch. Except for
the one exact post-state/type-20 provisional case above, a disposition-1 object
must already have a durable resolver and be exact at plan admission. In both
cases it must remain exact until the provisional case is adopted and until an
explicitly authorized later move consumes that exact stage inode. A
disposition-2 object must be absent at plan admission and may
appear only after its matching durable ARTIFACT_INTENT if execution reaches
that member. A disposition-3 stage custody leaf is absent, but its exact inode
must remain accounted at `7dac` until an authorized later transition moves it.
Commit/PREPARED paths require the complete applicable artifact
sequence; an earlier refusal, rollback, or manual-close branch may leave an
unreached disposition-2 suffix absent. The terminal receipt records the exact
initial snapshot plan hash/count unchanged; actual completed, resolved, and
unreached members are proved by the journal intent/resolver sequence and the
receipt's complete final-live/material/unresolved sets. Their projection
rejects any un-intented appearance, disappearance, or out-of-order creation.
Disposition 4 manual-close-only is the closed exception because a partial or
ambiguous open move may make any fresh present/absent/relocated classification
untruthful. It has exactly two plan profiles. Profile A applies when the root
apply journal has one valid complete BEGIN: RECOVERY_BEGIN and terminal receipt
copy that BEGIN's exact kind-49 hash/count byte-for-byte, and validation
recomputes the historical plan from root `a027`. That plan is only the root WAL
authority baseline, not an assertion of current artifact presence.

Profile B applies only when the target root journal has zero valid complete
records: empty, partial sequence zero, or complete-length but invalid/corrupt
sequence zero. No root `a027` or plan is trusted or reconstructed. RECOVERY_BEGIN
and terminal receipt instead use `artifact_plan_count=0` and the SHA-256 of the
exact canonical kind-49 HMG4D2 stream with zero members. This nonzero empty-
stream hash is the sole manual sentinel and is forbidden for BEGIN, profiles
1..3, or any valid-root profile A. It does not contain or authorize a request
member; the child request remains durably embedded only in RECOVERY_BEGIN
`a026/a027` for audit.

Both profiles bind the current root/parent journal hashes, unresolved
observations, and complete current live/material/unresolved sets separately.
Neither profile constructs a fresh recovery plan, replaces a root request
member, or executes a child request copy, artifact intent/create, move intent,
resolver, or disposition-2 root member. A wrong profile, a nonempty sentinel,
a plan synthesized from ambiguous current state, or any mutation before the
manual terminal intent is invalid.

Apply journal grammar is exactly:

```text
BEGIN
  -> (ARTIFACT_INTENT -> ARTIFACT_CREATED){exact artifact plan}
  -> PREPARED
  -> (MOVE_INTENT -> MOVE_APPLIED){exact forward vector}
  -> COMMIT_INTENT -> [exclusive terminal receipt] -> COMMITTED

resolved boundary before any formal move
  -> REFUSAL_INTENT -> [receipt] -> REFUSED_AFTER_BEGIN

resolved PREPARED/MOVE_APPLIED/INTENT_RESOLVED_NO_EFFECT boundary
  -> ROLLBACK_BEGIN
  -> (MOVE_INTENT(direction 3/4) -> ROLLBACK_MOVE_APPLIED){exact rollback vector}
  -> ROLLBACK_INTENT -> [receipt] -> ROLLED_BACK

any resolved nonterminal boundary with a proved blocker
  -> MANUAL_RECOVERY_INTENT -> [receipt] -> MANUAL_RECOVERY_REQUIRED
```

After an artifact no-effect resolver only refusal/manual is legal. After a move
no-effect resolver, refusal is legal only if no forward move completed;
otherwise rollback/manual is required. ROLLBACK_BEGIN may be appended only to a
completely parsed journal at a resolved boundary; a torn/uncertain record always
requires a child recovery and can never use any rollback reason in that journal.

Recovery journal grammar is exactly:

```text
RECOVERY_BEGIN
  automatic admission class 1:
    -> [exactly one immediate-parent-tip resolver iff there is one safely
        classifiable open type-18/type-19 parent intent]
    -> ARTIFACT_INTENT(child request-copy) -> RECOVERY_ARTIFACT_CREATED
    -> (ARTIFACT_INTENT -> RECOVERY_ARTIFACT_CREATED){exact remaining artifact suffix}
    -> [PREPARED when a prepared set is required]
    -> (MOVE_INTENT -> RECOVERY_MOVE_APPLIED){exact authorized recovery vector}
    -> exactly one permitted terminal intent -> [receipt] -> matching terminal record
  manual admission class 2 / disposition 4:
    -> MANUAL_RECOVERY_INTENT -> [receipt] -> MANUAL_RECOVERY_REQUIRED
```

The optional bracket is forbidden when the parent has no open type-18/type-19
mutation intent. It is required before any child mutation only for admission
class 1 with one safe immediate intent. Admission class 2/disposition 4 always
uses only the displayed manual branch, keeps its vector empty, forbids every
resolver and child mutation, and proceeds directly to its terminal intent even
when the retained immediate intent has an exact safe namespace state; that
manual snapshot carries class 8/action 4, not class 1..3. An
unmatched COMMIT/ROLLBACK/REFUSAL/MANUAL terminal intent remains a valid
nonterminal parent tip handled solely by its frozen recovery disposition,
receipt, and matching terminal-record branch; it never enters
`a105/a306/a701` and is not an open mutation intent. Exact pre-state uses
performed type 16/17 or no-effect type 22;
exact unrecorded post-state uses adopted type 20/21. A performed parent-tip move
is the first authorized-vector member; adoption is already-effected and not a
new authorized mutation; no-effect is excluded from the vector. After resolving
the parent tip, all new side effects use child intents/ordinals.

There is one deliberately manual-only nonterminal window. It occurs when a
child durably writes `RECOVERY_BEGIN` for an open parent intent and then either
crashes or encounters any mandatory type-20/type-21 resync/classification
blocker before that first scope-2 resolver. A grandchild sees an immediate
parent tip of type 15 rather than type 18/19. It must not carry, proxy, retarget,
or resolve the ancestor intent and must not create a request-copy artifact or
any mutation intent. It may only take disposition 4's terminal-only
`MANUAL_RECOVERY_REQUIRED` branch, with the unresolved ancestor journal/intent
retained as the sole classified member of the complete kind-109 unresolved-
chain set. The kind-9 unresolved-namespace set contains only independently
observed namespace violations and is empty when none exists. This fail-closed rule is the
complete handling for that window; the contract does not claim automatic
continuation through it. A child crash after the scope-2 resolver is handled
from that child's resolved boundary by a new child, with total recovery depth
bounded by 32.

Disposition 4 manual-close-only takes the same terminal-only branch directly
after `RECOVERY_BEGIN` when an open parent intent is partial, ambiguous, or
otherwise unsafe, and also when the separately signed admission class 2
deliberately retains a safely classifiable immediate intent. It writes no
resolver, type-18/type-19 intent, request copy, artifact, or move; records the
parent intent with exact manual class 8/action 4 and its unchanged complete
state observations in the unresolved
kind-109 chain set (and records any separate namespace violations only in the
kind-9 namespace set); and emits only `MANUAL_RECOVERY_INTENT`, its terminal
receipt, and `MANUAL_RECOVERY_REQUIRED`. The terminal intent authorizes only
that receipt. Thus there is never both an unresolved parent mutation intent and
a child mutation intent in the active chain.

Custody ownership is exact. Each apply chain has one root apply transaction ID.
Journal/request/terminal-receipt leaves use their recording journal's ID.
Stage/archive/preimage/rollback leaves use the root apply ID even when a recovery
child creates or moves them; `a118/a318/a109/a30a` carry that root ID. This is
the sole successor exception to the predecessor's journal-header/leaf-ID
equality. A parent-tip resolver uses the exact leaf and root ID already named by
the parent intent; it never substitutes a child leaf.

Record payload presence is exact: type 1 uses predecessor BEGIN fields plus
successor `a01b..a027` and forbids `a028`; type 15 uses predecessor
RECOVERY_BEGIN fields plus `a01b..a01d,a020..a028` and forbids `a01e/a01f`;
types 18 and 19 use only their complete named payload schemas above; types 2 and
16 use exactly `a101..a10b,a10d,a10e` and forbid `a10c`; type 20 uses exactly
`a101..a10e` and requires scope 2; types 4,8,17 use exactly
`a301..a30c,a30e,a30f` and forbid `a30d`; type 21 uses exactly `a301..a30f` and
requires scope 2; type 22 uses exactly `a701..a70e`; type 3 retains exactly
`a201..a207`; type 7 uses `a601..a606`; terminal intent types use exactly
predecessor `a401..a406` plus `a407..a409`; terminal record types retain exactly
predecessor `a501..a504`. Unknown or extra tags are invalid.

Recovery classifies a tip only as exact pre-state, exact post-state unrecorded,
partial, or ambiguous/foreign. Partial or third state is manual-close-only. No
old journal is appended after a child begins, truncated, repaired, deleted, or
guessed. Rename/exclusive-create/metadata/sync errors are never blindly retried;
exact pre/post state is observed first.

## 14. Diagnostic and rollback registries

`0x8001 diagnostic_code` accepts only:

```text
00000000 SUCCESS                                      status 0
00010001 REQUEST_PAYLOAD_TRUNCATED                    status 5
00010002 REQUEST_PAYLOAD_HASH_MISMATCH                status 5
00010003 NONCANONICAL_TLV                             status 5
00010004 OPERATION_SCHEMA_MISMATCH                    status 5
00010005 PROTOCOL_SPEC_MISMATCH                       status 5
00010006 REQUEST_TRANSPORT_READ_POLL_OR_CLOCK_ERROR   status 5
00010008 REQUEST_TRAILING_OR_SECOND_FRAME             status 5
00010009 REQUEST_DEADLINE_EXCEEDED                    status 5
00020001 HELPER_SELF_IDENTITY_MISMATCH                status 1
00020002 POLICY_MISMATCH                              status 1
00020003 PLAN_MISMATCH                                status 1
00020004 BUNDLE_MISMATCH                              status 1
00020005 BUILD_RECEIPT_MISMATCH                       status 1
00020006 INSTALL_RECEIPT_MISMATCH                     status 1
00020007 ROOT_IDENTITY_MISMATCH                       status 1
00020008 PARENT_IDENTITY_MISMATCH                     status 1
00020009 PATH_ALLOWLIST_MISMATCH                      status 1
0002000a PREDECESSOR_SET_MISMATCH                     status 1
0002000b DESIRED_SET_MISMATCH                         status 1
0002000c XATTR_POLICY_MISMATCH                        status 1
0002000d QUIESCENCE_RECEIPT_MISMATCH                  status 1
0002000e COMPLIANT_HELPER_LOCK_BUSY                   status 1
0002000f CUSTODY_NAMESPACE_BLOCKER                    status 1
00020010 CURRENT_SET_MISMATCH                         status 1
00020011 AUTHORIZATION_MISMATCH                       status 1
00020012 EVIDENCE_EXPIRED_OR_CLOCK_INVALID            status 1
00020013 PROTECTED_DOMAIN_PRECONDITION_FAILED         status 1
00020014 ACCEPTANCE_EFFECT_NONZERO                    status 1
00020015 CHECKED_ARITHMETIC_OR_REPRESENTATION_FAILURE status 1
00020016 MEMORY_ALLOCATION_FAILURE                    status 1
00020017 SHA256_ENGINE_FAILURE                        status 1
00020018 AUTHORITY_STREAM_IO_FAILURE                  status 1
00020019 EVIDENCE_OBJECT_OPEN_IO_FAILURE              status 1
0002001a PROTECTED_PARENT_OPEN_IO_FAILURE             status 1
0002001b NAMESPACE_ENUMERATION_IO_FAILURE             status 1
0002001c SYSTEM_LOCK_ACQUIRE_IO_FAILURE               status 1
0002001d TRANSACTION_ENTROPY_IO_FAILURE               status 1
0002001e TRANSACTION_ENTROPY_ALL_ZERO                 status 1
0002001f TRANSACTION_ID_COLLISION_EXHAUSTED           status 1
00020020 JOURNAL_EXCLUSIVE_CREATE_IO_FAILURE          status 1
00030001 COMPILETIME_CAPABILITY_MISSING               status 6
00030002 OS_OR_SDK_CAPABILITY_MISMATCH                status 6
00030003 MOUNT_CAPABILITY_MISMATCH                    status 6
00030004 TARGET_CAPABILITY_RECEIPT_BLOCKED            status 6
00030005 SYSTEM_LOCK_CAPABILITY_RECEIPT_BLOCKED       status 6
00030006 NOFOLLOW_BENEATH_UNIQUE_UNSUPPORTED          status 6
00030007 RENAME_EXCL_UNSUPPORTED                      status 6
00030008 DURABILITY_PRIMITIVE_UNSUPPORTED             status 6
00030009 FD_METADATA_PRIMITIVE_UNSUPPORTED            status 6
0003000a FLOCK_CAPABILITY_UNSUPPORTED                 status 6
0003000b PROTECTED_WRITER_CAPABILITY_UNPROVEN         status 6
00040001 PARTIAL_BEGIN_JOURNAL                        status 3
00040002 TORN_JOURNAL_TAIL                            status 3
00040003 NONTERMINAL_APPLY                            status 3
00040004 NONTERMINAL_RECOVERY                         status 3
00040005 TERMINAL_INTENT_WITHOUT_RECEIPT              status 3
00040006 RECEIPT_WITHOUT_TERMINAL_RECORD              status 3
00040008 ROLLBACK_IN_PROGRESS                         status 3
00040009 JOURNAL_APPEND_IO_FAILURE_PROVEN_NO_EFFECT   status 3
0004000a TERMINAL_RECEIPT_CREATE_IO_FAILURE_PROVEN_NO_EFFECT status 3
00050001 FOREIGN_OR_REPLACEMENT_INODE                 status 4
00050002 UNACCOUNTED_MANAGED_INODE                    status 4
00050003 AMBIGUOUS_RECOVERY_GRAPH                     status 4
00050004 UNRESOLVED_NAMESPACE_SET                     status 4
00050005 TERMINAL_JOURNAL_RECEIPT_MISMATCH            status 4
00050006 PROTECTED_DOMAIN_DRIFT_AFTER_BEGIN           status 4
00050007 CAPABILITY_DRIFT_AFTER_BEGIN                 status 4
00050008 DURABILITY_STATE_UNCERTAIN                   status 4
00050009 QUIESCENCE_DRIFT_AFTER_BEGIN                 status 4
0005000a JOURNAL_INVARIANT_FAILURE_AFTER_BEGIN        status 4
0005000b POST_BEGIN_CHECKED_ARITHMETIC_OR_ALLOCATION_FAILURE status 4
0005000c POST_BEGIN_SHA256_OR_AUTHORITY_STREAM_IO_FAILURE status 4
0005000d POST_BEGIN_EVIDENCE_OBJECT_IO_FAILURE        status 4
0005000e POST_BEGIN_PROTECTED_PARENT_IO_FAILURE       status 4
0005000f POST_BEGIN_NAMESPACE_ENUMERATION_IO_FAILURE  status 4
00050010 TERMINAL_RECEIPT_INSPECTION_IO_FAILURE       status 4
00050011 POST_BEGIN_AUTHORITY_CLOCK_INVALID           status 4
00050012 UNRESOLVED_CHAIN_SET                         status 4
00050013 JOURNAL_EXCLUSIVE_CREATE_EFFECT_UNCERTAIN    status 4
00060001 REFUSED_AFTER_BEGIN_BEFORE_FORMAL_MOVE       status 2
00060002 RECOVERY_FINISH_REFUSAL                      status 2
```

Numbers above are hexadecimal U32 values. Code/status mismatch or unknown code
invalidates a response. `SUCCESS` is the sole status-0 code. Invalid fixed
header still has no response. Status 6 is impossible once a journal leaf exists.
Response failure itself has no frame code and exits 74.

Validation precedence is deterministic and short-circuiting. Startup
FD/pipe-layout/SIGPIPE-bootstrap failure before a valid fixed header is an
unframed exit 64 as Section 2 states. An invalid fixed header is also an
unframed exit 64. Codes `00010007` and `00040007` are permanently unassigned;
an implementation must not emit either value.

After one valid header, the helper first performs, in actual call order, every
checked representation conversion, checked allocation, and SHA-256 engine
initialization needed to receive and authenticate the declared frame. An
internal failure maps respectively to `00020015`, `00020016`, or `00020017`;
it is not mislabeled as attacker-controlled TLV overflow. In that response
`8002` echoes the header-declared payload hash, and `8009` uses the specified
all-zero sentinel when no complete current-state preimage yet exists.

Each request transport step takes a monotonic sample before its one
`poll`/`read`, performs that call, then takes a monotonic sample after it. If
the post-call sample is at or after the exclusive deadline, `00010009` wins
over that call's readiness, EOF, partial result, `EINTR`, or other errno. Only
when the post-call sample is strictly before the deadline does the helper
classify, in actual call order, a non-`EINTR` read/poll/clock error as
`00010006`, payload-phase EOF as `00010001`, or an EOF-probe extra byte as
`00010008`. A checked deadline conversion/addition failure after a valid header
is `00020015`; a `clock_gettime` call failure or invalid `timespec` returned by
the kernel is `00010006`. Positive reads advance by exactly their returned
count; a returned count larger than requested is `00020015`. The completed
payload then short-circuits in this exact order: payload hash `00010002`,
canonical TLV/attacker-controlled length or offset `00010003`, operation schema
`00010004`, and protocol-spec equality `00010005`.

Pre-BEGIN authority evaluation follows the contract's semantic dependency
order, not a guessed absence. For each evidence object, protected parent, or
namespace, open/read/enumerate/identity/ACL/xattr failures, short reads, or the
inability to obtain the required two stable observations use
`00020018..0002001b` as applicable. A semantic mismatch code
`00020001..00020014` is eligible only after the complete required observation
succeeds. Capability failures use `00030001..0003000b`. When more than one
fully observed failure is eligible at the same dependency boundary, the lowest
registered code within that boundary wins.

`00050013` is the sole internal status-4 classification for the boundary where
journal exclusive-create itself did not return success and its effect cannot be
proved absent. After exclusive-create returns success but before a complete
BEGIN exists, sequence-zero write/scan/sync outcomes may instead select the
closed `00040001/00050008/0005000a/0005000f` classifications below. Code
`00050013` is selected only after its special classification and does not
pretend that a journal chain exists.
Because predecessor HMG4R2 requires a complete authoritative journal/current-
state binding, this condition can emit no response frame and exits 74; the code
is observable only to the workspace conformance harness's internal result.

For every diagnostic after a possible filesystem effect, HMG4R2 emission is
conditional on having every predecessor-mandatory response field from one
complete stable classification, including the exact frame binding, candidate
or authoritative transaction identity as applicable, exact current journal
bytes/hash, and complete current-state hash. No new zero or placeholder is
introduced. If any mandatory response binding is unavailable, the helper keeps
the lowest internally selected registered classification, emits no response
byte, and exits 74 after filesystem activity stops. This no-frame fallback is
mandatory and never changes durable custody state.

Once the journal leaf has been exclusively created, the helper first completes
the total read-only state classification. Any manual/foreign/ambiguous/status-4
condition wins and selects the lowest eligible `000500xx` code. Only when no
status-4 condition exists may the lowest eligible recoverable/status-3
`000400xx` code win; only when neither exists may a status-2 refusal be
selected. A journal-phase condition never masks a foreign inode, unaccounted
inode, ambiguous graph, unresolved namespace/chain, protection drift,
durability uncertainty, or an incomplete observation. Status 6 is impossible
after journal creation.

A phase-2 bracket or `terminal_now` clock/relation failure after journal
creation is a special nonterminal status-4 outcome. Code `00050011`, or
`0005000b` for checked arithmetic/allocation, is selected in memory before any
terminal-intent bytes exist. The helper appends no record requiring the invalid
time, creates no terminal receipt/record, and does not relabel the state as a
durable manual terminal. If transport remains safe it may emit one HMG4R2
status-4 diagnostic from the already durable journal/current-state facts; that
frame grants no recovery or terminal authority. Otherwise it exits 74. A later
fresh recover request observes `00040003/00040004` or the then-current higher-
precedence status-4 condition and proceeds only under its own authorization.

Codes `00050004` and `00050012` have closed, disjoint predicates. Code
`00050004` is eligible iff the complete kind-9 unresolved-namespace set is
nonempty. Code `00050012` is eligible iff that kind-9 set is empty and the
complete kind-109 unresolved-chain set is nonempty. If both sets are nonempty,
only `00050004` is eligible; the kind-109 members remain present in the
response-bound complete current state and are not discarded. Empty/empty,
namespace-only, chain-only, and both-nonempty are mandatory response-code
vectors, including the type-15 grandchild window and the safely classified
strict-ancestor-intent case from Section 13.

The status-3 registry is also a closed partition for one response
classification. `00040001` is eligible iff an attempted sequence-zero append
leaves sequence zero absent or partial, including a proved-zero-effect append
that leaves the journal empty;
`00040002` is eligible iff sequence zero is complete and canonical and a later
journal tail is torn. A current-operation, post-sequence-zero proven-no-effect
append or terminal-receipt-create event is classified solely by `00040009` or
`0004000a`, respectively, and temporarily excludes `00040003..00040008` for
that response. Absent such an event, `00040005` is eligible iff the last
complete record is a terminal intent, its exact terminal receipt leaf is
absent, and no matching terminal record exists. `00040006` is eligible iff
that terminal intent and its complete exact expected receipt exist but the
matching terminal record does not. A partial, foreign, mismatching, or
uninspectable receipt is status 4, never either code. `00040008` is eligible
iff a complete `ROLLBACK_BEGIN` exists, rollback has not reached a terminal
intent/receipt branch, and neither `00040001` nor `00040002` applies.
`00040003` is the residual iff the active nonterminal journal is a root apply
journal and none of `00040001/00040002/00040005/00040006/00040008/00040009/
0004000a` applies. `00040004` is the same residual iff the active nonterminal
journal is a recovery child. Root-apply and recovery-child identity are
mutually exclusive. Mandatory vectors cover each singleton predicate and
every adjacent A/B state, especially terminal-intent absent-receipt versus
exact-receipt and root versus recovery residuals.

The response phase never sends a second frame. A response-side SIGPIPE-state
drift, `F_GETFL` drift, clock/poll/write failure, partial atomic diagnostic
write, zero-progress response write, or deadline expiry exits 74 and preserves
all durable journal/receipt authority already created.

Special failure mappings are closed:

- SIGPIPE is unconditionally set to `SIG_IGN` and read back after the six-FD
  proof and before the first header byte. Any failure there is silent exit 64.
  Drift after a valid header cannot safely produce HMG4R2 and exits 74.
- `flock(lock_fd, LOCK_EX|LOCK_NB)` is called once. Only `-1/EWOULDBLOCK`
  with the selected SDK's exact mapping yields `0002000e`; `EINTR`, every other
  errno, or an anomalous return yields `0002001c` and is never retried. Drift
  after BEGIN is `00050007`.
- A transaction ID has at most sixteen total candidate draws, not one draw plus
  sixteen retries. Each candidate is exactly one `getentropy(32)` call.
  Nonzero return or unavailable exact output is `0002001d`; an all-zero result
  is immediately `0002001e` and is not retried. Journal exclusive-create is
  one call per candidate and is never blindly retried. `EEXIST` consumes that
  candidate only after two stable nofollow scans prove the same pre-existing
  collision occupant and unchanged held-parent identity. Sixteen such proved
  collisions yield `0002001f`; an unstable/disappearing occupant or scan error
  selects internal `00050013`, forbids another draw, emits no HMG4R2, and exits
  74.
- A journal exclusive-create error other than `EEXIST` is resolved before any
  diagnostic. Two complete stable nofollow scans proving the candidate leaf
  absent and the held parent unchanged prove no effect and yield `00020020`.
  Any visible candidate leaf, changed parent, incomplete scan, unstable scan,
  or inability to prove exact absence selects internal `00050013` and permits
  no response frame, new transaction-ID draw, cleanup, journal write, or other
  mutation. The process exits 74 after all filesystem activity stops. Such a
  leaf has no authoritative BEGIN and is a manual
  custody blocker, not an automatically recoverable journal. Error-plus-absent,
  error-plus-empty/partial/complete/foreign occupant, changed-parent, and every
  scan/reopen failure are mandatory vectors; the non-absent/unprovable vectors
  expect no response bytes and exit 74. Errno alone never establishes no
  effect.
- After successful journal `O_EXCL`, a failed sequence-zero append is always
  `00040001` when two stable complete classifications prove an empty or partial
  journal and supply every mandatory HMG4R2 binding; it is never `00040009`,
  even when zero effect is proved. A stable complete canonical sequence zero
  whose durability cannot be proved is `00050008`; a stable journal-invariant
  failure is `0005000a`. A namespace scan/reopen failure is `0005000f`.
  Whenever any mandatory response binding is unavailable, that applicable
  status-4 result is internal only under the no-frame/exit-74 rule above. A
  later torn tail is
  `00040002`. Code `00040009` is eligible iff a later journal-record append was
  attempted from a complete canonical sequence-zero/current-tail boundary,
  that append call failed, and two stable rescans prove the journal
  byte-identical to that complete boundary, prove that call had no effect, and
  account for every managed inode. It is never eligible for sequence zero,
  terminal-receipt creation, or another I/O call site. Any unavailable or
  incomplete no-effect/durability proof is
  `00050008`; any journal invariant failure is `0005000a`; an earlier eligible
  lower status-4 code retains precedence. Mandatory sequence-zero vectors cover
  stable empty, every partial length, stable complete-but-unsynced, invariant
  failure, scan/reopen failure, and each missing mandatory response binding.
- Terminal-receipt `O_EXCL/EEXIST` is stably reopened and classified. A
  complete exact expected receipt with no terminal record is `00040006`; a
  partial, foreign, or mismatching occupant is `00050005`; inability to
  open/read/classify it is `00050010`. Code `0004000a` is eligible iff a
  terminal-receipt exclusive-create call returned a non-`EEXIST` error and two
  stable scans prove the leaf still absent, prove that call had no effect, and
  prove the journal/current state exact with every managed inode accounted.
  It is never eligible for journal append or another I/O call site. Otherwise
  the outcome is `00050008` unless an earlier eligible lower status-4 code
  applies.
- Create or rename errno alone never chooses the terminal diagnostic. The
  helper first resolves the durable intent against the exact pre-state,
  exact post-state, or third/ambiguous state. A successfully durably recorded
  refusal, rollback, or manual terminal branch then supplies the authoritative
  diagnostic.

The `00040009` and `0004000a` predicates are mutually exclusive and iff; the
unassigned `00040007` cannot act as a residual alias. Mandatory vectors cover
each proof passing, each proof failing at every scan/reopen/sync/inode-accounting
step, an A/B call-site swap, and simultaneous independently eligible status-4
state proving that the lowest eligible `000500xx` code wins.

`ROLLBACK_BEGIN a601` accepts only:

```text
1 FORWARD_MOVE_RESOLVED_NO_EFFECT_AFTER_PRIOR_EFFECT
2 NEXT_FORWARD_PRECONDITION_FAILED_ALL_INODES_ACCOUNTED
3 FINAL_LIVE_VERIFICATION_FAILED_ALL_INODES_ACCOUNTED
```

Add `0xa605 reason_evidence_sha256 SHA256`, exactly derived kind 55, and
`0xa606 reason_evidence STRUCT RollbackReasonEvidence`;
`ROLLBACK_BEGIN` requires exactly `a601..a606`, with kind 55 over `a606` equal
`a605`, and with outer `a601 == a606.7df1`. The three reasons are mutually
exclusive and iff; an implementation
cannot select a more convenient reason merely because it leads to the same
rollback vector. A mandatory negative vector changes only one side of
`a601 == 7df1` for every unequal reason-code pair and must reject before any
mutation.

Every reason is legal only in a root apply journal, never in a recovery child.
The journal is complete and canonical at a resolved boundary after durable
`PREPARED`; at least one forward transition already has an effected type-4
resolver; there is no open type-18/type-19 intent anywhere in the active chain;
and `7df8..7dfa` are true. `a602 == 7df7` equals the exact kind-115 current state
at that boundary. `a603/a604 == 7dfb/7dfc` and is the unique nonempty rollback
vector mechanically derived from the completed forward prefix in reverse
order. A reason does not choose, trim, reorder, or extend that vector.

Reason-specific admission is exact:

- Reason 1 applies iff the latest record is type 22
  `INTENT_RESOLVED_NO_EFFECT`, with `a702=19`, `a706=2`, `a708=1`, and at least
  one earlier effected forward resolver. `7df2` is that complete type-22 record
  hash; `7df3/7df4` equal its target MOVE_INTENT transition ordinal/index; and
  `7dfe/7e00` are complete equal exact-prestate observations proving the move
  had no effect.
- Reason 2 applies iff Reason 1 does not apply, the latest record is a resolved
  boundary, the forward vector has one unique next unconsumed transition, and
  no intent for it exists. `7df2` is that boundary record; `7df3/7df4` identify
  the next transition; `7dfe` is its complete expected precondition set and
  `7e00` the complete observed set. They differ, but every managed inode is
  accounted and no third/foreign/ambiguous state exists.
- Reason 3 applies iff the forward vector is fully consumed and final-live
  verification fails before any commit intent. `7df2` is the last forward
  resolver; `7df3=7df4=0xffffffff`; `7dfe` is the complete desired final-live
  set; and `7e00` is the complete observed current-live set. They differ, but
  every managed inode is accounted and no third/foreign/ambiguous state exists.

Zero effected forward transitions use the refusal branch and never create a
rollback reason. An open intent, torn or ambiguous journal, foreign or
unaccounted inode, third state, unresolved chain, protection/quiescence drift,
durability uncertainty, parent/namespace observation failure, or any blocker
after final-live has already passed goes directly to manual recovery and has no
rollback reason code. There are no legacy reasons 4 or 5 and no generic commit-
precondition rollback reason.

## 15. Time, equality, and evidence authority rules

Every field explicitly named `_unix_seconds` is an unsigned Unix wall-clock
second. Fields explicitly named `_unix_nanoseconds` and
`_monotonic_nanoseconds` instead use their stated unsigned nanosecond domains;
they are never silently converted to seconds or compared across clock domains.
Every authority admission operation and every evidence/continuity checkpoint
explicitly enumerated below uses one exact common clock guard based on
`CLOCK_REALTIME`; the closed evidence set is K2, C2, build-sign B0/B1,
lookup/attributes/private-export-denial/two signature calls, U2 completion,
and I2 install-now/kind-188/kind-189/final-install checkpoints.
No other checkpoint or placement is conforming;
the phrase "paired sample" anywhere in this contract means the following
ordered two-call operation and no other implementation-defined pairing:

1. call `clock_gettime(CLOCK_MONOTONIC, &m)`;
2. with no intervening syscall, library call, retry, or authority check, call
   `clock_gettime(CLOCK_REALTIME, &r)`; and
3. immediately validate both returned `timespec` values and convert each to
   unsigned nanoseconds by checked `tv_sec * 1,000,000,000 + tv_nsec`.

Both `tv_sec` values must be nonnegative and representable as U64 and both
`tv_nsec` values must lie in `0..999,999,999`. There is no retry of either
clock call. A serialized Unix-seconds field from a pair is exactly `r.tv_sec`;
a serialized Unix-nanoseconds field is exactly the checked realtime result.

The admission operation takes an initial pair `G0=(M0,R0)` before reading the
first byte of its first authority object. Every later named checkpoint takes
one fresh pair `Gi=(Mi,Ri)` in the same order. Pairs are not reused by distinct
admission operations, while every checkpoint in one operation is
anchored to its one `G0`. For each `i>0`, checked arithmetic must establish:

```text
Mi >= M0
elapsed_i = Mi - M0
expected_realtime_i = R0 + elapsed_i
Ri + 60,000,000,000 >= expected_realtime_i
```

Equality in the last relation is accepted; one nanosecond less is rejected.
This is the sole common backward-realtime tolerance. No realtime value is ever
directly subtracted from, added to, or ordered against a monotonic value. Each
object's future-skew, not-before, expiry, and maximum-age relations are then
evaluated against `r.tv_sec` from the named pair using checked seconds
arithmetic; expiry remains exclusive.

The closed admission/evidence-production checkpoint mapping is exact. A
profile-1 fixture-use operation admits F2 and produces K2; a profile-2
fixture-use operation admits F2 plus L2 and never produces K2. In either
profile, the checkpoint immediately after all read-only admission and
immediately before the single-use claim `O_EXCL` is `fixture_now`; for
profile-1 K2, one additional pair after the last bracketing
executor/state/durability observation and immediately before payload signing
supplies `finished`. A protected-birth operation admits S2: its pre-reservation-
claim checkpoint is `birth_now`, and every later S2/C2 authority-bearing action
timestamp is the realtime half of a fresh pair anchored to the same `G0`; the
final C2 attestation pair follows the last immutable-evidence readback and
precedes C2 signing. A build-sign operation admits HMG4L2 kind 2 plus its
complete source/toolchain/target/key/controller/Gate-A projection and takes the
named pre-claim pair `build_claim_anchor` (`B0`) immediately after the last stable
read-only recomputation and immediately before the two pre-claim namespace
passes. `B0` is a fresh `Gi` governed by the operation's initial `G0`; only
after the common relation passes are `B0`'s boot UUID, realtime second, and
monotonic nanoseconds stored at `8d96..8d98` and used to derive `8d99/8d9a`.
After the claim is durable and both post-passes match, the operation takes the
fresh named final pair `build_claim_completion` (`B1`) before any key access.
`B1` is also anchored to the same initial `G0`; its monotonic/realtime values
are `8d9d/8d9e`, and build-sign admission succeeds only when `B1` is within the
derived/signed interval and `8d9f=1`. A late or invalid `B1` leaves the durable
claim consumed and permits zero Security API or private-key use.
After a passing B1, the same build-sign operation and its same `G0` take five
fresh observation-start pairs, in order: lookup
`(607b.8dd3,607b.8dd6)`, attributes `(606c.8d1d,606c.8d20)`, private-key
export denial `(606e.8d2d,606e.8d30)`, call 0
`(6071[0].8d52,6071[0].8d59)`, and call 1
`(6071[1].8d52,6071[1].8d59)`. In each tuple the first field is the monotonic
half and the second the realtime half; Section 8.2's exact ordering and B0
relation are conjunctive with this common guard. After the last transcript,
independent verification, and stable scan, the same operation takes the fresh
U2-completion pair `(6074,6073)`—monotonic first, realtime second—immediately
before U2 payload signing. It is anchored to that same `G0` and B0 relation.
A standalone read-only admission of completed C2, K2, Q2,
or I2 takes its `standalone_now` final pair after the last stable reopen/
recomputation and before returning admission success. An install operation admits
its complete selected K2/U2/Z2 and exact four-member kind-187 C2/S2/claim chain
and takes `install_now` after the last stable read-only check
and immediately before the first protected-install mutation. That pair is
recorded as I2 `5032/5034/5035`. Only after all authorized installation mutations,
complete readbacks, and both stable protected-parent scans finish is
the fresh final pair `5033/5036/5037` recorded with `5033==500b`. Each kind-188
`9a0c/9a0d` pass-start/pass-finish and each kind-189 creation-finish `9a36`
field is the realtime-nanosecond half of its own fresh pair, taken at that
exact boundary and anchored to the same install `G0`. Kind-189 creation-start
`9a35` is also the realtime-nanosecond half of a fresh pair, except observation
0 is the same named `install_now` checkpoint and therefore exactly equals
`5034`; it does not perform a second clock read. Observations 1 and 2 use their
own fresh creation-start pairs.
The corresponding monotonic halves are serialized at `9a10/9a11` and
`9a46/9a47`; the pair fields become usable only after the common relation
succeeds. Within each branch those fresh pairs are monotonic-ordered;
all phase-1 pass pairs precede `install_now`, observation 0 creation-start
`9a35/9a46` equals `5034/5035`, every later mutation/action pair lies between
`5034/5035` and `5036/5037`, and the final pair follows every action and scan.
HMG4I2 bytes are then signed, and their later bit-11 no-replace custody under
the separate protected evidence parent is not a self-attested I2 field. An
apply or recover operation
admits its complete selected I2/C2/Q2/W2-or-O2 chain and takes `now` after the
last phase-1 stable read-only check and immediately before journal `O_EXCL`.
That operation additionally takes the Section-3 phase-1 start/end bracket
before `now`, then the phase-2 start/end bracket and `terminal_now` after the
last mutation and before terminal-intent creation; all six later pairs remain
anchored to the operation's original `G0`. `terminal_now` is required even when
the terminal decision is refusal, rollback, or manual recovery. The `now` pair
may close the pre-journal admission of the enclosing operation and its nested objects; it is not
also counted as a standalone-admission pair. HMG4L2 kind-2 consumption retains
its additional Section 7.0.1 monotonic-window checks; those are conjunctive with
this admission guard. The signed issuer-selected not-before/issued/expiry
scalars in F2 `790f/7910`, S2 `850c/850d`, Q2 `400d` and its expiry, W2
`7410` and its expiry, the incorporated O2 issued/expiry fields, Z2 `760b` and
its expiry, and L2 `8c18/8c19` are not representations of an unstated issuer
clock sample. They are signature-bound scalar authority inputs and become
usable only when the exact consuming admission guard validates them. This
contract neither grants their issuance nor invents a missing issuer sampling
ceremony. No other admission sampling placement or pair reuse is conforming.

If `fixture_now` or `birth_now` precedes the applicable not-before second, the
current operation performs no mutation, discards every sample in that guard,
returns `00020012`, and performs no automatic wait, sleep, resample, or retry.
A later independently started operation may retry the still-unconsumed
authority from a fresh `G0`. At or beyond the exclusive expiry the current
operation likewise rejects. The separately bounded HMG4L2-kind-2 pre-claim
monotonic wait in Section 7.0.1 is the sole exception and does not change this
fixture/birth rule. Before any
journal exists, a clock-call failure, invalid returned `timespec`, monotonic
regression, backward-realtime relation failure, future-skew failure, stale-age
failure, or interval failure is `00020012`; a checked conversion/addition/
subtraction overflow is `00020015`. After journal creation the corresponding
clock/relation failure is `00050011` and the corresponding arithmetic failure
is `0005000b`. At a phase-2 or `terminal_now` boundary those codes are
response-only in-memory classifications: because the named pair/relation did
not validate, no terminal intent, receipt, record, or time-bearing failure
artifact is legal; the existing journal remains nonterminal for a separately
authorized later recovery. At each dependency boundary the order is: initial pair; required
I/O and complete observation; semantic recomputation; named final pair; common
clock relation; object-specific time relations; only then the side effect or
success decision. A failure already observed at an earlier step short-circuits;
an unexecuted later fault cannot win. At a named final-pair boundary the clock
and arithmetic codes above are selected before any otherwise eligible current-
time semantic mismatch. Exact-expiry, tolerance-equality, tolerance-minus-one,
negative/oversize `timespec`, monotonic-regression, and every checked-overflow
case are mandatory vectors.

Let `initial_sample` mean `G0`'s exact `r.tv_sec`; let `standalone_now`, `now`,
`terminal_now`, `install_now`, `fixture_now`, and `birth_now` mean the realtime
seconds from precisely those named pairs. `admission_now` is not another clock
read: it aliases `standalone_now` for standalone admission, `install_now` for
install-chain admission, and `now` for apply/recover pre-journal admission.
Every occurrence of `current_realtime` below means the realtime
seconds from the fresh named checkpoint pair at that action, never an unpaired
read. For profile 1, `fixture_now` is K2 `300d`. For profile 2 it is
`7f3e.97a3`, whose full realtime/monotonic pair and successful common-clock
relation are frozen at `7f3e.97a1..97a4`; every one of the 90 observations
repeats the one byte-identical claim-creation object. Exact per-object rules are:

- HMG4L2 kind 1: `810a < 810b`, `810b - 810a <= 900`, `810a <=
  initial_sample + 60`, and the profile-2 F2 claim, setup, every denial attempt,
  and all 90 denial attempts occur before exclusive `810b` and no earlier than
  `810a`; `810a ==` embedded F2 `790f` and `810b ==` embedded F2
  `7910`. Its `8105` nonce and target-projection hash are one-use across every
  admitted evidence parent. A durable profile-2 claim consumes both L2 and F2
  even if a later step fails. HMG4L2 seconds are converted to nanoseconds by
  checked multiplication; claim, setup, and attempt values are all in the
  half-open interval, with exact expiry-minus-one/expiry boundary vectors.
  E2 kind-3 payload assembly, independent attestation, signing, and protected
  retention may finish after L2 expiry, but they embed only immutable completed
  observations whose maximum mutation timestamp is below expiry and cannot
  start, repeat, or resume an attempt. A historical E2 may be verified after L2
  expiry only by rechecking that complete interval; profile 2 never yields K2;
  an expired L2 can never start or resume setup;
- HMG4L2 kind 2: `8c18 < 8c19`, `8c19 - 8c18 <= 900`, `8c2e == 60`,
  `8c2f == 60,000,000,000`, and both `8c30/8c31` are true. These four fields
  are owner-signed policy, not clock samples or deadlines. After complete
  read-only admission, the consumer takes the one fresh named final pair `B0`
  recorded as claim boot UUID/realtime/monotonic `8d96..8d98`; it requires
  the common clock relation against that operation's earlier true `G0`, then
  `8d97 < 8c19`, `8c18 <= 8d97 + 8c2e`, and the same boot session throughout.
  Checked conversion and addition derive `8d99 = 8d98 +
  max(0,8c18-8d97)*1,000,000,000` and `8d9a = 8d98 +
  (8c19-8d97)*1,000,000,000`, require `8d99 < 8d9a`, and require
  `8d9b == 8c2f`; overflow invalidates the object. No realtime-second value is
  compared numerically to a monotonic-nanosecond value. The durable kind-135
  claim completes before key lookup and consumes the authorization even if no
  private-key call follows.

  Claim creation requires `8d90 >= 8d99`. After all durability and both
  post-passes, the one fresh final pair `B1` is stored at `8d9d/8d9e` and must
  pass the common relation against initial `G0`, stay in boot `8d96`, satisfy
  `8d91 <= 8d9d < 8d9a` and `8c18 <= 8d9e < 8c19`, and set `8d9f=1` before
  any key access. Failure or lateness at `B1` leaves the claim consumed and
  permits zero lookup, attribute query, export attempt, or signature call.
  Once timely durable admission succeeds, expiry does not revoke that exact
  same-boot, same-process, same-handle continuation: it consists only of the
  ordered bounded selected-key lookup, attribute check, export denial, lane-A call and
  verification, and lane-B call, with no retry or extra use. The operation
  timestamps in `607b/606c/606e/6071` are ordering/continuity evidence, not an
  impossible assertion that a user-space pre-call sample prevents suspension
  before kernel/Security.framework execution. `6073/6074` remain a final U2
  evidence pair related to `B0` using `8d9b`; they do not re-authorize a key
  action. Mandatory vectors cover issuer future skew at `8c2e` and `8c2e+1`,
  changed boot UUID, each checked derivation overflow, claim start at
  `8d99-1/8d99`, `B1` at `8d9a-1/8d9a`, `B1` realtime at
  `8c19-1/8c19`, rollback at `8d9b/8d9b+1`, late-claim consumed with zero key
  use, and expiry after passing `B1` not revoking exactly the two ordered uses;
- HMG4S2/HMG4C2: S2 `850c < 850d`, `850d - 850c <= 900`,
  `850c <= initial_sample + 60`, and `birth_now >= 850c` is a pre-mutation
  admission predicate; every later authority-bearing `current_realtime` is
  also `>= 850c` and `< 850d`.
  Checked multiplication converts both seconds to Unix nanoseconds; every
  reservation-claim scan/create/write/metadata/readback/sync, content-source
  scan/open/read, subject scan/create/write/metadata/readback/sync, and
  profile-selected policy verification/signature observation lies in the exact
  half-open interval `[850c*10^9,850d*10^9)`. Every C2 `821b..821c`, creator
  continuity `870c..870d`, primitive `874b..874c`, claim `8789..878a`, all
  kind-104 scan intervals, and applicable `876a..876b` cross-order according to
  Sections 8.3.1/8.3.2 and remain inside that same interval. The reservation
  claim's visible O_EXCL creation consumes S2 even if a later clock sample,
  subject creation, policy signature, or C2 attestation fails. An expired S2
  cannot start, repeat, or resume a mutation. C2 attestation/protected retention
  and later Q2 verification may finish after S2 expiry only by reopening the
  immutable complete S2/C2/claim/subject evidence and rechecking that all
  authority-bearing action timestamps were in-range; they authorize no new
  birth action. A nanosecond conversion overflow, future skew, backward realtime
  movement beyond the common clock rule, timestamp outside the interval, or
  cross-order mismatch blocks the complete S2/C2 session;
- HMG4F2: `issued < expires`, `expires - issued <= 86,400`; profile 2 additionally
  requires `790f/7910 == HMG4L2.810a/810b` and therefore has a maximum lifetime
  of 900 seconds. For profile 1, K2 claim boundary `300d` and every
  `CapabilityAttempt.7a18/7a19` both satisfy `issued <= field < expires`. For
  profile 2, `7f3e.80c8/80c9`, every
  `7f35[].7f6f.80bb/80bc`, every `7f35[].7f78..7f7b`, and each conditionally
  present `7f35[].7f80.887a..887e` all satisfy the same half-open interval after
  checked seconds-to-nanoseconds conversion. No undefined aggregate `time`
  metavariable exists. Initial read-only admission requires
  `issued <= initial_sample + 60`, while `fixture_now >= issued` is a
  pre-mutation admission predicate and `fixture_now < expires`;
- HMG4K2 (profile 1 only): `started=fixture_now <= finished < expires`, K2 `expires` equals
  embedded F2 `expires`, `expires - finished <= 86,400`, `finished <= admission_now + 60`,
  `admission_now < expires`, and the complete embedded F2 interval contains
  `started..finished`; `started` is the exact pre-claim paired sample and
  `finished` the exact paired sample after the last bracketing executor/state/
  durability observation and before final payload signing. The two
  `admission_now` predicates validate admission of an already completed K2;
  they are not part of K2 evidence production;
- HMG4Q2: `issued < expires`, `expires - issued <= 300`,
  `issued <= admission_now + 60`, and `admission_now < expires`. Here
  `admission_now` is `standalone_now` for a standalone read-only Q2 admission
  or `now` for an apply/recover pre-journal chain. Q2 is necessarily issued
  after its selected completed I2 and is never admitted in the earlier
  install-chain `install_now` context;
- HMG4W2/HMG4O2: `issued < expires`, `expires - issued <= 900`,
  `issued <= now + 60`, and `now < expires`;
- HMG4Z2 at installation: `issued < expires`, `expires - issued <= 900`,
  `issued <= install_now + 60`, and exact creation-chain order
  `760b <= install_now == I2.5032 <= I2.5033 == I2.500b < 760c`;
- HMG4E2: `started <= finished`; a pass manifest has no runtime expiry and is
  accepted only through its exact build/review binding;
- HMG4U2: `completed_at == 6073 <= admission_now + 60`; `6073/6074` are one final
  realtime/monotonic pair after every build/signing observation and satisfy the
  kind-2 HMG4L2 anchor relation above. Exact immutable build/helper/policy
  hashes and current capability evidence, not elapsed wall time, govern later
  admission;
- HMG4I2 creation: `5032 == install_now <= 5033 == 500b <= install_now + 60`;
  `5034/5035` are the realtime/monotonic nanoseconds of the install-now pair,
  `5036/5037` are those of the final pair, their Unix-second projections equal
  `5032/5033`, and both pairs satisfy the one common guard. Every kind-188
  phase-1 absence pass finishes before `5034/5035`; observation 0 creation-start
  `9a35/9a46` equals `5034/5035`; every kind-189 primitive/
  readback/sync and kind-188 phase-2 scan time lies within `5034..5036`.
  The signed receipt bytes are assembled only after the completed install/
  readback/stable-scan interval. Later standalone or apply/recover admission instead requires
  `500b <= admission_now + 60`, where `admission_now` is respectively
  `standalone_now` or `now`; no historical or absent `install_now` is reused.
  Exact held installation identity and current capability/quiescence evidence
  govern later transaction admission; and
- HMG4N2/HMG4B2/HMG4Y2/HMG4G2/HMG4H2/HMG4M2 have no time field.

Gate B independently covers Z2 issuance equality, installation start one
second before issuance, start at issuance, finish at expiry minus one, finish
at exact expiry, `5032/5033/500b` one-sided drift, the 60-second install
interval equality/plus-one, and substituting later `standalone_now` or `now`
for creation-time `install_now`. It also swaps each kind-187 prerequisite C2,
S2, claim, parent, subject, profile and role independently; mutates each
`5032/5034/5035` and `5033/5036/5037` projection/guard side; and for every
kind-189 role independently mutates absence, creation order, leaf, source,
metadata, actor, execution, exclusive flags, retained FD/identity, readback,
sync, post-scan, time and Q2 profile-2 mapping. It also changes either side of
the observation-0 `9a35/9a46 == 5034/5035` alias while locally rehashing all
containers. Every such one-sided mutation
is rejected even when all untouched local hashes are recomputed. Separate
vectors cover failure immediately before helper `O_EXCL` as nonconsuming,
successful helper `O_EXCL` followed by failure at every later step as consuming
manual-only, two contenders with exactly one effect, and any attempted retry,
adoption, policy/lock continuation, or cleanup after a consumed partial state.

Gate B includes the same valid Q2 under standalone and apply/recover contexts
with their two distinct `admission_now` aliases, then mutates each alias one
side at a time. A standalone Q2 evaluated against an absent or stale
apply/recover `now`, a nested Q2 evaluated against `standalone_now`, or any Q2
evaluated against pre-I2 `install_now` is invalid even when the substituted
seconds would satisfy the numeric inequalities.

The audit DAG also imposes `every E2.finished <= U2.completed`, both
`K2.finished <= U2.completed`, `U2.completed <= Z2.issued`, every kind-187
C2 `821c` and claim `878a` not greater than `Z2.issued * 1,000,000,000`,
`Z2.issued <= I2.installation_started <= I2.installed < Z2.expires`,
`I2.installed <= Q2.issued`, and
`Q2.issued <= W2/O2.issued` for the selected request. All additions,
subtractions, and seconds-to-nanoseconds multiplications are checked before comparison; a future-skew or overflow on either
side invalidates the complete chain.

EvidenceTrustRule maximum age is exactly 86,400 for roles 3/4, 300 for role 5,
900 for roles 6/10/11, and zero for roles 1/2/7/8/9/12. Zero means immutable
hash-bound/no wall-clock expiry and is forbidden for any other role. Expiry is
exclusive. Role 11's 900-second age is evaluated only when I2 consumes Z2.
After a valid durable I2 exists, later transaction admission reopens and fully
verifies the historical Z2 signature, policy/helper/build/writer bindings,
nonce uniqueness, and the frozen
`issued <= installation_started <= installed < expires` relation, but
does not require current `now < Z2.expires` or reapply role-11 maximum age.
Otherwise every applicable age remains current. The exact common-clock
algorithm, boundary order, equations, error mapping, and vectors above govern
every such check; prose elsewhere cannot introduce a different pair order,
tolerance, retry, or precedence. Once a claim entry appears it consumes the F2
nonce even if a later clock sample fails or drifts. After a
durable BEGIN, later expiry does not revoke the bound transaction; identity,
protection, and capability drift still force the specified post-BEGIN closure.

Every repeated field is independently parsed/recomputed and equal. There is no
precedence rule. At minimum the implementation test matrix mutates each side,
recomputes the locally valid object's internal hash, and requires rejection for:

- policy/plan/request/bundle Entries and every derived set/vector/count;
- helper/policy/plan/bundle/build/install/target/system/quiescence/auth hashes;
- xattr-policy object hash versus actual canonical xattr-set hash;
- request frame versus request-copy artifact;
- request versus BEGIN/RECOVERY_BEGIN versus terminal receipt;
- authorization versus request/begin/receipt;
- artifact role/index/leaf versus `FinalEntry`;
- Transition versus intent/applied/adopted records;
- terminal intent versus receipt versus terminal record;
- journal transaction/sequence/previous/payload/whole-file/last-record hashes;
- custody transaction/index/variant/content digest; and
- running helper versus held binary, build, install, policy, and request.

## 16. No-delete, dispatch, and review gates

The predecessor no-delete rules apply to the production helper executable and
its complete production call graph. That binary forbids `ftruncate`,
`truncate`, `O_TRUNC`, `link`, `linkat`, blind mutation retry, implicit cleanup,
generic `syscall`, dynamic lookup, process creation, shell, network, delete,
overwrite, hardlink, and recursive filesystem capability. Every managed
ordinary source has link count one before and after a move. Its positive
undefined-symbol and linked-library allowlists contain only the reviewed
production primitives plus fixed Security/CoreFoundation code-identity APIs,
anonymous-pipe request transport, monotonic/realtime clocks, SHA-256, and
checked bounded memory operations.

Workspace build-controller, canonical-vector, and disposable-fixture programs
are separate source-unit roles, executables, hashes, call graphs, and positive
allowlists. The build controller may use only the Section-8.2 exact child-launch
profile inside two disposable workspace roots. Fixture binaries may use only
their signed F2/K2/E2 profile and disposable root. No such symbol or source is
linked into the production helper merely because it is allowed in a build or
fixture binary. The current authority does not permit profile-2 fixture setup,
kind-2 HMG4L2 generation/signing/consumption, real private-key use, protected
installation, original-runtime launch, apply, or recover; a grammar for those
profiles is not execution authority.

Dispatch occurs exactly once after full request framing/EOF/schema validation.
Probe and verify have no call-graph path to create/write/metadata/rename/sync/
exclusive-lock/journal/receipt/cleanup. Apply and recover remain read-only until
their exact first journal mutation. Fixture capability testing is a distinct
binary/hash/policy, never a hidden operation.

There are two ordered review gates. Gate A occurs before any production-helper
source implementation. Independent read-only reviewers must rehash this exact
successor before and after a byte-1-through-EOF review and reach document-level,
specification-only `P0/P1/P2 = 0/0/0`. The review report binds the successor and
predecessor hashes, reviewer identities, review intervals, reviewed sections,
commands, and remediated findings. Gate A is deliberately not an HMG4E2 object:
production policy, helper hash, and policy-catalog signing actors do not yet
exist, so requiring them would create a review/implementation dependency cycle.
Gate A authorizes only workspace source implementation and nonprivileged tests
under the user's separate authorization; its acceptance effect is zero.

The Gate-A companion is exactly
`docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`.
It is UTF-8 without BOM, LF-only, contains no CR, NUL, tab, or trailing-space
byte, and ends with exactly one LF. Its complete grammar is the following
sequence; literal punctuation and key order are part of format version 1:

```text
# G4 L10 Native Helper v2.1 Successor Independent Review

## Frozen identity
format-version=1
successor-sha256=<64-lowercase-hex>
predecessor-sha256=<64-lowercase-hex>
successor-byte-count=<canonical-decimal-U64>
successor-lf-line-count=<canonical-decimal-U64>
review-batch-id=<64-lowercase-hex>

## Independent review units
unit-count=<canonical-decimal-U32-4..18>
unit=<ordinal>|reviewer-id=<b64u>|task-id=<b64u>|transcript-id=<b64u>|model-tool=<b64u>|started=<utc>|finished=<utc>|before=<hex>|after=<hex>|range=1..EOF|scope-class=<scoped-or-whole>|sections=<csv>|section-set-sha256=<hex>|command-count=<canonical-decimal-U32-1..256>|command-transcript-sha256=<hex>
command=<unit-ordinal>.<command-ordinal>|argv-stream-b64u=<b64u>|cwd-b64u=<b64u>|started=<utc>|finished=<utc>|exit-status=<canonical-signed-decimal-I32>|stdout-byte-count=<canonical-decimal-U64-0..16777216>|stdout-sha256=<hex>|stderr-byte-count=<canonical-decimal-U64-0..16777216>|stderr-sha256=<hex>

## Findings and remediation
finding-count=<canonical-decimal-U32-0..1024>
finding=<ordinal>|priority=<P0-or-P1-or-P2>|code-b64u=<b64u>|reviewer-id=<b64u>|disposition=remediated|original-text-b64u=<b64u>|original-text-sha256=<hex>|remediated-text-b64u=<b64u>|remediated-text-sha256=<hex>|first-reviewer-confirmed-remediation-sha256=<hex>

## Final verdict
open-p0=0
open-p1=0
open-p2=0
all-finding-count=<canonical-decimal-U32-0..1024>
verdict=PASS

## Authority boundary
specification-only; acceptance-effect=0; runtime-authority=0
```

Angle-bracket forms above are grammar metavariables and never appear in a real
companion. `hex` always means exactly 64 lowercase hexadecimal characters.
`canonical-decimal` has no sign or leading zero except the sole value `0`;
signed I32 uses ASCII `-` only for a negative value and otherwise follows the
same rule. `b64u` is RFC 4648 base64url without padding of exact bytes; its
alphabet is `A-Z a-z 0-9 - _`, it has the unique shortest encoding, and decode
then re-encode must be byte-identical. Reviewer, task, transcript, model/tool,
code, and cwd decoded values are 1..4,096 bytes, valid UTF-8 without NUL, CR,
LF, or tab; they are byte identities and are not Unicode-normalized. Decoded
argv-stream and per-argument bounds are the separate limits below; the generic
4,096-byte identity-field bound never applies to the complete argv stream.
Finding text decoded values are 1..4,096 valid UTF-8 bytes without NUL and may
contain LF only through their base64url representation. UTC is exactly twenty
ASCII bytes `YYYY-MM-DDTHH:MM:SSZ`, is a valid Gregorian UTC instant with no
leap-second value, and `started <= finished`.

Frozen identity is recomputed, not asserted. `successor-sha256` is SHA-256 of
the complete exact bytes of this successor file from byte 1 through EOF.
`successor-byte-count` is that file's exact byte count, and
`successor-lf-line-count` is the exact count of byte `0x0a` in those bytes;
because the successor ends in exactly one LF and contains no other line-ending
encoding, that value is also its line count. `predecessor-sha256` equals both
the live SHA-256 of
`docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md` and the fixed predecessor
identity `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.
Every unit independently computes `before` immediately before its review and
`after` immediately after it from the complete exact successor bytes; both
equal the recomputed frozen successor digest, not merely the report field.

`review-batch-id` is deterministic diagnostic correlation only and grants no
security, replay, acceptance, or runtime authority. Its preimage is eight
ASCII bytes `HMG4GAB1`, big-endian U32 version 1, the raw 32-byte successor
digest, the raw 32-byte predecessor digest, big-endian U64 successor byte
count, big-endian U64 successor LF count, big-endian U32 unit count, then, for
each unit in report order, three consecutive big-endian-U32-length-prefixed
byte strings: the exact decoded reviewer ID, task ID, and transcript ID.
`review-batch-id` is SHA-256 of that complete preimage. A field copied from a
different unit set, order, frozen file, or predecessor is invalid.

The complete companion file is 1..16,777,216 bytes. `unit-count` is 4..18 and
`finding-count == all-finding-count` is 0..1,024. Every unit has 1..256 commands;
the checked total over all units is 1..4,096. Each stdout or stderr stream is
0..16,777,216 bytes, and checked addition over all stdout and stderr byte counts
is at most 268,435,456. These are logical stream bounds even though only their
counts and hashes occur in the companion. Overflow or max-plus-one is invalid.

Unit ordinals are contiguous from zero. A unit row is immediately followed by
exactly its `command-count` command rows, whose command ordinals are contiguous
from zero. Unit groups sort by unsigned decoded reviewer-ID bytes; reviewer ID,
task ID, and transcript ID are each unique across the report. `before` and
`after` both equal `successor-sha256`; every unit reads byte range `1..EOF`.
Every command interval is contained in its enclosing unit interval:
`unit.started <= command.started <= command.finished <= unit.finished`.
Within one unit, command intervals are serialized in ordinal order, with
`command[i].finished <= command[i+1].started`; equality is permitted.
Exactly one unit has `scope-class=whole` and `sections=whole`. At least three
units have `scope-class=scoped`. Their `sections` value is a nonempty,
ASCII-sorted comma-separated subset of the fixed tokens `00-preamble`,
`01`,`02`,`03`,`04`,`05`,`06`,`07`,`08`,`09`,`10`,`11`,`12`,`13`,`14`,`15`,
and `16`; scoped subsets are pairwise disjoint and their union is that exact
complete token set. Additional units are forbidden in version 1, so
`unit-count` equals the scoped-unit count plus one whole unit.

The section-set preimage is eight ASCII bytes `HMG4GAS1`, big-endian U32
version 1, big-endian U32 token count, then for each displayed token in order a
big-endian U32 byte length and its exact ASCII bytes. `section-set-sha256` is
SHA-256 of that stream. For the whole unit the sole token is `whole`.

`argv-stream-b64u` decodes to big-endian U32 argument count followed by, for
each argument in process order, big-endian U32 byte length and exact argument
bytes. The count is 1..256, each argument is 1..4,096 bytes, and checked total
argument bytes are at most 1,048,576; the complete decoded stream is therefore
at most 1,049,604 bytes. Every argument is valid UTF-8 without NUL, CR, LF, or
tab; it is a byte identity and is not Unicode-normalized. The stream is the
executed argv and never a shell command string. Every command
is read-only, runs within the frozen successor review workspace, and its
reported stdout/stderr counts and hashes cover the complete raw byte streams.
The command-transcript preimage is eight ASCII bytes `HMG4GAC1`, big-endian U32
version 1, big-endian U32 command count, then for every command row in ordinal
order a big-endian U32 row-byte length and the exact UTF-8 row bytes excluding
its terminating LF. `command-transcript-sha256` is SHA-256 of that stream; the
empty command stream is forbidden. The report grammar, every individual bound,
the total-command/output/argument bounds, checked overflow, and complete-file
bound each require exact-maximum and maximum-plus-one review vectors before a
companion verifier can be accepted.

Finding ordinals are contiguous after rows are sorted by numeric priority
0/1/2, unsigned decoded code bytes, then unsigned decoded reviewer-ID bytes.
Each finding's two text hashes are SHA-256 of its exact decoded text bytes.
The finding list is the complete union of every finding emitted in every task/
transcript named by the unit rows; omission, code reuse for different text, or
an unbound side-channel finding invalidates the report. Every row is a
historically discovered finding that is now remediated. Its `reviewer-id`
equals exactly one existing unit row's reviewer ID, and that row's unique
task/transcript is the attribution under which the reviewer re-emits and
rechecks the complete finding; a reviewer, task, or transcript absent from the
unit table cannot own a finding row.
`first-reviewer-confirmed-remediation-sha256` is the earliest complete successor
hash for which the row's named reviewer actually rechecked and confirmed that
remediation; it does not claim an unobserved first write and need not equal the
final frozen hash. An open finding is never hidden in this historical list:
`open-p0/open-p1/open-p2` are counts of findings still open against the frozen
identity after all units' final pass, while `finding-count` and
`all-finding-count` both count all historical rows and must be equal. PASS
requires all three open counts zero,
all scoped/whole coverage rules satisfied, and every unit's before/after hash
equal the Frozen identity.

This line-oriented Markdown report is canonical process evidence, not a
cryptographic runtime authorization. Its complete file SHA-256 is later copied
into policy `1041` and U2 `6040`; either mismatch blocks build evidence. At least
three independently tasked reviewers with disjoint primary scopes plus one
whole-document reviewer are required. A contract edit after any review changes
the frozen hash and invalidates every prior review row.

Gate B occurs after implementation but before any `HMG4U2 result=1`, protected
installation authorization, or runtime admission. A profile-1 HMG4G2 catalog for this
exact successor hash must be generated by encoder A, reproduced byte-for-byte
by independently written encoder B, negative-validated by both decoders, and
bound under the then-frozen signed policy by a passing HMG4E2 kind-6 independent
review with zero findings. The production helper's codec may consume but may
not serve as either of the two independent reference encoders. Gate B is
executable specification-conformance evidence only and also has acceptance
effect zero.

Gate A verifies the specification's required vector coverage and every item in
the following review scope; it does not claim that an actual HMG4G2 catalog or
decoder result already exists. Gate B verifies the complete generated vector
catalog/manifest and actual dual-encoder/decoder results. Gate-A review must
verify predecessor no-clobber, schema/tag/enum uniqueness, framing
and resource bounds, authority DAG acyclicity, path/custody grammar, direction
and artifact state machine, diagnostic/reason totality, transport/self identity,
time rules, every one-sided equality family, and the complete vector-coverage
requirements. Gate A is necessary but not sufficient for executing a mutating
fixture: only after Gate A and a later separate authorization for the relevant
workspace-only mutation may the implementation phase execute the predecessor's
complete race/crash fixture matrix and these additions. Under the current
authorization those mutation-dispatch cases remain specified but unexecuted:

- all seven custody variants and every one-byte grammar mutation;
- request truncation, held-open writer, trailing byte, second frame, timeout,
  terminal payload/EOF-probe read error, wrong FD type, response EPIPE/timeout,
  and exact complete-frame request copy;
- running copied/tampered code versus correct installed-file substitution;
- build/install/target/system/quiescence/apply-auth role swaps and one-sided
  locally rehashed mutations;
- exact pre-state, exact unrecorded post-state adoption, partial artifact, two
  unrecorded effects, and ambiguous namespace after each intent;
- rename error with both pre- and post-state outcomes, proving no blind retry;
- retained writable FD/mapping and incomplete system-visibility quiescence;
- every valid/invalid diagnostic status and rollback reason; and
- every numeric bound at exact declared max and max plus one, plus the largest
  valid case and phase-checked kind-8 canonical-or-semantic rejection when max
  is unreachable.

Review of this document or later development evidence never authorizes protected
installation, target-volume permission changes, `apply`, `recover`, an original-
runtime session, fidelity, audio acceptance, human/owner acceptance, strict
completion, integration, promotion, release, or publication. Every acceptance
effect remains zero.
