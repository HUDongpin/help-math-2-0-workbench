# G4 L10 Native Helper v2.9 Security Contract Successor

Status: frozen successor specification; pre-Gate-A independent contract review
is permitted, but the live evidence-freeze prerequisite is currently false. No
companion publication, implementation, runtime, mutation, installation,
acceptance, promotion, release, or publication authority is granted.

## 0. Lineage, v2.8 review failure, and exact authority boundary

This document is the sole direct no-clobber successor to:

`docs/G4_L10_NATIVE_HELPER_V2_8_SECURITY_CONTRACT_SUCCESSOR.md`

The complete direct-predecessor identity is:

```text
SHA-256=e23a23e091c6e48c907e47c12d0b803d405055178b9b2e15c4055431b3fa6c2b
bytes=11381
LF-count=258
mode=0444
```

The root predecessor remains:

```text
docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md
SHA-256=77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All v2.8 and transitive-predecessor security, wire, canonical schema,
authority, diagnostic, rollback, request transport, loaded-helper
self-identity, custody grammar, xattr policy, direction-1, journal, recovery,
evidence-DAG, resource, Gate-B, mutation, and no-authority rules are
incorporated unchanged except for the two v2.8 corrections expressly stated
below. The two-scoped-plus-one-whole reviewer topology remains normative.

No v2.8 companion was created. Three independent v2.8 review units returned
one `0/0/0` result and two distinct P1 findings, for a unique-finding union of
`P0/P1/P2=0/2/0`. V2.8 is immutable failed specification evidence and grants
no Gate-A or implementation authority.

The first v2.8 finding is:

```text
P1 V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED
```

Exact original text:

```text
V2.8 described the unauthorized 57-file v2.7 implementation attempt as a frozen read-only inventory boundary and required that it never be edited, but every bound file remained mode 0644 and owner-writable, while the checksum-set grammar bound only content hashes and paths and no Gate-A generator or verifier rule failed on permission drift.
```

Exact required remediation text:

```text
A no-clobber successor must distinguish a dated hash snapshot from a filesystem read-only freeze and must, under separate owner authorization, either bind and independently verify a zero-writable-entry mode/type/path/content freeze in place or create an exclusive content-addressed immutable evidence quarantine; until then the v2.7 attempt remains writable failed evidence and no passing companion or implementation authorization may issue.
```

The second v2.8 finding is:

```text
P1 V28-GATE-A-PREPUBLICATION-VERIFIER-BINDING-UNDEFINED
```

Exact original text:

```text
V2.8 permits the final companion path to be exclusively created immediately after generator-only preflight, while the independent verifier is specified only as an additional check; it neither requires verifier success before final-path creation nor binds the verifier-approved candidate bytes byte-for-byte to the bytes exclusively published.
```

Exact required remediation text:

```text
A successor must freeze a prepublication protocol in which the generator emits a complete candidate without opening the companion path, the independent verifier validates those exact candidate bytes and returns a hash-and-length-bound success, and only then may the publisher exclusively create the final path from the byte-identical approved bytes, followed by a final-path re-read; any verifier or mutation-suite failure must leave the final path absent.
```

Neither finding may be collapsed into the other. The v2.7 false companion and
the unauthorized v2.7 implementation attempt remain separate failed evidence.

## 1. Dated v2.7-attempt snapshot; not a live freeze

The v2.7 companion at:

`docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

remains immutable false-PASS evidence with SHA-256
`cf919fe4478795140157c603348064c17b2c8c65519a2735c842759f59b68826`.
Its displayed `PASS` and `0/0/0` have no authority because of
`V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS`. It must not be rewritten,
deleted, renamed, or cited as passing evidence.

The separate v2.7 implementation-attempt snapshot is:

```text
scripts/native/g4-l10-successor-v2_7                  48 regular files
scripts/g4-l10-native-helper-v2_7-*.test.mjs           9 named non-Gate-A runners
total                                                  57 regular files
total-bytes                                            553897
checksum-manifest-bytes                                7121
checksum-set-SHA-256=cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200
```

The checksum-set preimage is the unsigned byte-sorted list of all 57 relative
paths, each row exactly lowercase complete-file SHA-256, two ASCII spaces,
relative path, and LF. A read-only 2026-08-05 observation reconfirmed all 57
paths, 553897 bytes, and the checksum-set above, but also found:

```text
57 file modes=0644
native directory mode=0755
writable-file-count=57
```

Therefore this is presently only a dated path/content snapshot. It is not a
filesystem read-only freeze, immutable quarantine, Gate-A input, or production
source. The 57 files remain incomplete, non-production, non-authoritative
failed evidence and may not be used by a later implementation.

This contract does not authorize `chmod`, copying, moving, deleting, renaming,
rewriting, or quarantining those files. A separate owner authorization is
required before the live freeze transition in Section 2. Until that transition
is completed and independently verified, every Gate-A companion candidate and
every implementation action is forbidden.

## 2. Exact live evidence-freeze prerequisite

The only permitted in-place freeze target, if separately owner-authorized, is
the exact current preimage from Section 1. Its nine top-level runner paths are:

```text
scripts/g4-l10-native-helper-v2_7-bundle-codec.test.mjs
scripts/g4-l10-native-helper-v2_7-canonical-objects-xattr-policy.test.mjs
scripts/g4-l10-native-helper-v2_7-canonical-tlv.test.mjs
scripts/g4-l10-native-helper-v2_7-contract-core.test.mjs
scripts/g4-l10-native-helper-v2_7-darwin-pipe-transport.test.mjs
scripts/g4-l10-native-helper-v2_7-darwin-startup-fd.test.mjs
scripts/g4-l10-native-helper-v2_7-request-schema.test.mjs
scripts/g4-l10-native-helper-v2_7-request-transport-core.test.mjs
scripts/g4-l10-native-helper-v2_7-response-codec.test.mjs
```

`scripts/g4-l10-native-helper-v2_7-gate-a-review.test.mjs` is explicitly
excluded. The native subtree must contain exactly its current 48 regular-file
paths and no additional directory, symbolic link, hard-linked file, socket,
FIFO, device, or other entry.

Before any permission transition, one transaction-wide read-only precheck must
prove all of the following or perform zero changes:

- the project root and every ancestor component of every selected path resolve
  without a symbolic link;
- the native root is the exact ordinary directory
  `scripts/native/g4-l10-successor-v2_7`;
- all 57 selected entries are ordinary, single-link files;
- the exact unsigned-byte path set, per-file sizes and complete SHA-256 values,
  total 553897 bytes, 7121-byte checksum manifest, and checksum-set SHA-256 are
  identical to Section 1;
- the nine top-level paths are exactly the names above and the native subtree
  contains exactly 48 selected files;
- no permission or content change has started before the entire precheck
  succeeds.

Only after that complete precheck and separate owner authorization may an
external evidence-freeze transaction change the 57 selected file modes to
`0444` and the dedicated native root mode to `0555`. It must not alter file
contents, inodes, link counts, the shared `scripts` directory, the shared
`scripts/native` directory, any migration workspace, or any other path. A
partial transition is a failed transaction and is not Gate-A evidence.

After the transition, two independently initiated, read-only snapshots A and B
must each prove:

```text
selected-file-count=57
selected-file-type-count.regular=57
selected-file-mode-count.0444=57
selected-file-nlink-count.1=57
selected-file-total-bytes=553897
checksum-manifest-bytes=7121
checksum-set-SHA-256=cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200
native-root-type=directory
native-root-mode=0555
native-root-selected-files=48
native-root-unexpected-entries=0
top-level-selected-runners=9
selected-writable-entries=0
missing-selected-entries=0
```

The snapshots must use fresh filesystem reads, record start and finish UTC
times, emit complete hash-bound stdout, and agree byte-for-byte on their
canonical semantic projection. The Gate-A reviewers must independently
recompute the same live projection. The generator, verifier, and publisher in
Section 4 have no permission-changing function and must fail before candidate
construction whenever the live projection is absent or different.

This contract calls the successful result a `dated, verifier-enforced in-place
evidence freeze`. It does not call Unix mode bits irreversible, permanent, or
operating-system immutable. Any later path, type, mode, link-count, size,
content, member-set, or directory drift closes Gate A and requires a new
no-clobber successor; it never authorizes repair or re-freezing in place.

## 3. Canonical Gate-A command grammar

V2.8's corrected command grammar remains exact. For every command row,
`argv-stream-b64u` is canonical unpadded base64url of:

```text
BE32 argument_count
repeat argument_count times:
  BE32 argument_byte_count
  exact argument bytes
```

The decoded stream is the actual argv vector passed directly to the process
creation API. Exact requirements are:

- `argument_count` is 1..256;
- every `argument_byte_count` is 1..4,096;
- checked aggregate argument bytes are at most 1,048,576;
- every argument is canonical fatal UTF-8 and contains no NUL, CR, LF, or tab;
- the stream has no truncation, padding, trailing byte, or unconsumed byte;
- `cwd-b64u` retains the inherited exact workspace identity grammar;
- timestamps, exit status, stdout/stderr byte counts, complete hashes,
  ordering, intervals, and transcript preimages retain the inherited grammar.

The first conforming v2.9 batch may use only direct executable argv vectors
whose executable is `ruby`, `python3`, or `node`. Shells, absolute shell paths,
`-c`, `-lc`, embedded secondary argv, LF, and tab are forbidden. A one-line
interpreter program remains a fully recorded argument and must fit all limits.

The generator constructs every argv stream only from a structured in-memory
array of decoded argument strings. It validates decoded bytes, encodes the
stream itself, independently decodes its own result with a separate cursor,
revalidates every field, and compares the decoded argument bytes byte-for-byte
with the source array. No raw or pre-encoded `argvStreamB64u` input exists.

The independently authored verifier decodes every argv stream itself and uses
the same live verifier function for the report and mutation suite. It must
reject at least: zero or 257 arguments; zero- or 4,097-byte arguments;
aggregate overflow; NUL, CR, LF, tab, invalid UTF-8, noncanonical base64url,
truncated lengths, extent overrun, trailing bytes, shell executables, absolute
shell executables, `-c`, and `-lc`.

At least the first and last command in each final review unit must directly
read the complete frozen v2.9 file and emit its full SHA-256, byte count, LF
count, mode, and byte hygiene to hashed stdout. The whole unit must directly
read v2.8 and the root predecessor and confirm their fixed hashes are present
in v2.9. The live-freeze commands must also directly enumerate and rehash the
Section 2 set; a displayed or generator-supplied summary is insufficient.

## 4. Candidate, independent verifier, and publication protocol

The generator, independently authored verifier, and publisher are three
separate source files. None imports, evaluates, executes, or derives its result
from another. A small orchestrator may invoke all three, but may not alter
candidate bytes, validation results, or final-path policy.

The following order is mandatory:

1. Before constructing candidate bytes, the generator and verifier separately
   confirm the final companion path is absent and the Section 2 live freeze is
   currently true. Neither opens the final path.
2. The generator builds one complete UTF-8 LF candidate in memory, with no
   CR, NUL, tab, trailing whitespace, or missing/surplus final LF. It returns
   the exact candidate byte sequence and a diagnostic identity only; it does
   not open, create, chmod, rename, link, unlink, or write the final path.
3. The independent verifier receives those exact candidate bytes, recomputes
   their SHA-256 and byte length without trusting generator metadata, validates
   the complete report and every Section 3 mutation class, and returns a
   canonical approval record that binds at least the frozen v2.9 SHA-256 and
   byte length, candidate SHA-256 and byte length, verifier-source SHA-256,
   mutation-suite identity, and successful final finding counts.
4. Only a successful verifier approval may be passed to the publisher. The
   publisher takes its own byte-for-byte snapshot of the candidate bytes,
   recomputes SHA-256 and length, and requires exact equality with the approval
   before it opens the final path. No callback, asynchronous yield, mutable
   view, or alternate byte source is permitted between this snapshot and the
   write.
5. Immediately before opening the final path, the publisher independently
   reconfirms the Section 2 live freeze, v2.9 identity, final-path absence,
   parent-directory identity, verifier approval, and candidate hash and length.
6. The publisher exclusively creates the exact final path with a no-replace
   primitive equivalent to `O_CREAT|O_EXCL|O_NOFOLLOW`, initial/final mode
   `0444`, and writes only the approved byte snapshot. It durably synchronizes
   the file and parent directory, closes the write descriptor, then reopens the
   final path read-only with no-follow semantics and completely re-reads it.
7. The final re-read must equal the approved candidate byte-for-byte and match
   its SHA-256 and byte length. It must also reconfirm regular-file type,
   single-link identity, mode `0444`, byte hygiene, and final-path identity.

Any generator, live-freeze, verifier, approval, or mutation-suite failure
occurs before the publisher opens the final path and must leave that path
absent. A post-open I/O, durability, mode, identity, or final-re-read failure
creates only an occupied failed v2.9 artifact: it is never repaired, truncated,
unlinked, overwritten, or called a companion, and a new contract version is
required. Re-running against any occupied final path must fail with `EEXIST` or
its exact platform equivalent and preserve the complete occupant identity.

The verifier also independently recomputes HMG4GAB2, every HMG4GAC1 and
HMG4GAS1, reviewer/task/transcript identities, topology, command intervals,
finding texts and hashes, final counts, byte hygiene, and EOF grammar. A
generator result, verifier approval, publication result, or final-path re-read
alone is insufficient; all must agree on the same exact bytes.

## 5. Pre-Gate-A review, final Gate-A topology, and companion

While the Section 2 live freeze is false, three independent reviewers may
perform a read-only `pre-Gate-A contract review` of v2.9. That review may find
specification defects, but it is not the final Gate-A batch, cannot populate a
companion, cannot confirm the operational freeze remediation, and cannot
authorize implementation.

After separate owner authorization and a successful Section 2 transition, a
fresh final Gate-A batch with new reviewer, task, transcript, command, and
snapshot identities must re-read the complete contract and current live state.
The retained topology is:

```text
unit-count=3
unit 0: scope-class=scoped; sections=00-preamble,01,02,03,04,05,06,07,08
unit 1: scope-class=scoped; sections=09,10,11,12,13,14,15,16
unit 2: scope-class=whole;  sections=whole
```

Reviewer, task, and transcript identities are unique; reviewer groups are
sorted by unsigned decoded reviewer-ID bytes; all reviewers are distinct
non-authors; all units read byte 1 through EOF; and every effective section is
read once by its scoped reviewer and independently again by the whole reviewer.

The exact final companion path is:

`docs/G4_L10_NATIVE_HELPER_V2_9_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.9 Successor Independent Review
```

The required finding union contains the exact 27 v2.7 rows plus these three
separate rows, for 30 required rows before any new finding:

```text
P1 V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS
P1 V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED
P1 V28-GATE-A-PREPUBLICATION-VERIFIER-BINDING-UNDEFINED
```

`V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS` was confirmed remediated at the
specification level by the frozen v2.8 SHA-256 but remains evidence of the
failed v2.7 process. `V28-GATE-A-PREPUBLICATION-VERIFIER-BINDING-UNDEFINED`
may name the frozen v2.9 SHA-256 as its earliest confirmed remediation only if
the independent reviewers confirm Section 4 in full.

`V28-UNAUTHORIZED-IMPLEMENTATION-FREEZE-NOT-ENFORCED` remains open with
`first-confirmed-remediation-sha256=none` while the Section 2 live projection
is false. It may close only in the fresh final Gate-A batch after all reviewers
independently verify the two post-transition snapshots and current live state.
A semantically correct contract cannot substitute for that filesystem fact.

Final PASS requires every one of the 30 required rows plus any new finding to
be remediated; exact scoped and whole coverage; strict Section 3 argv checks;
successful independent mutation suite; current Section 2 live freeze; the
complete Section 4 candidate-to-verifier-to-publisher byte binding; and final
`open-p0/open-p1/open-p2=0/0/0`. Any disagreement, operational prerequisite
failure, invalid command, verifier failure, publication mismatch, or new open
finding prevents companion publication.

## 6. Closed implementation and execution boundary

Before a valid v2.9 companion has completed the Section 4 final-path re-read,
no v2.9 implementation directory, source port, production helper, dispatcher,
filesystem engine, journal engine, test runner, build artifact, fixture, or
implementation-review packet may be created. The preserved v2.7 attempt is
never an implementation antecedent.

A valid v2.9 Gate-A PASS would authorize only the user's already bounded
workspace-only production-helper implementation and nonprivileged tests. It
would not authorize helper `apply` or `recover`, including fixtures; protected
installation; protected parent, ACL, UID, GID, launcher, system, or volume
mutation; original-runtime launch; acceptance; promotion; integration;
release; or publication.

No contract, pre-Gate-A review, final Gate-A review, generator, verifier,
publisher, implementation source, compilation, or test result has acceptance
effect, original-runtime authority, fidelity effect, audio-acceptance effect,
promotion effect, integration effect, release effect, or publication effect.
