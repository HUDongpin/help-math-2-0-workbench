# Grade 4 Lesson 10 native transaction helper v2.7 successor security contract

Status: **design-only successor; not implemented, installed, or executable**
Evidence date: **2026-08-05**
Wire protocol version: **2**
Specification revision: **7**
Acceptance effect: **none**

## 0. Authority, predecessor, and precedence

This file is a non-destructive successor to the frozen v2.6 successor
`docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md`, which remains
byte-for-byte preserved at SHA-256
`3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a`,
10,413 bytes, 205 LF bytes, and mode `0444`. The direct predecessor binds the
frozen v2.5, v2.4, v2.3, v2.2, v2.1, and original-v2 contracts at these exact
hashes:

```text
v2.5 5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce
v2.4 28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9
v2.3 bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320
v2.2 d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c
v2.1 170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab
root 77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All seven predecessors are incorporated by those exact hashes. Their
requirements remain normative unless this successor expressly replaces them.
On conflict, this successor controls. Silence here never weakens a predecessor.
The singular term `predecessor` and every singular
`predecessor_contract_sha256` value mean only the direct v2.6 file and exact
SHA-256 `3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a`.
Transitive hashes are provenance roots, not alternate values.

Three independent v2.6 scoped reviewers completed disjoint Sections
`00-preamble,01..05`, `06..10`, and `11..16` at
`P0/P1/P2 = 0/0/0`. A distinct fourth whole reviewer could not be created
because the collaboration environment has a hard four-thread tree limit that
includes the root agent and retains completed reviewer threads. No reviewer
was renamed, duplicated, or self-represented to bypass that limit. Therefore
v2.6 Gate A is incomplete, neither PASS nor a document finding, and no v2.6
companion was or may be created.

This successor changes only the Gate-A reviewer topology from three scoped
reviewers plus one whole reviewer to two scoped reviewers plus one distinct
whole reviewer. Each effective section continues to receive exactly two
independent complete readings: one by its assigned scoped reviewer and one by
the whole reviewer. The author is not a reviewer. Reviewer, task, and transcript
identities remain unique. Thus per-section review redundancy, complete scoped
union, and whole-document adversarial review are preserved without inventing a
fourth identity.

No security, wire, schema, authority, diagnostic, rollback, transport,
self-identity, custody, xattr, direction, mutation, evidence-DAG, resource,
Gate-B, or no-execution rule changes. V2.6's 41-member minimum regression set,
context-qualified schema authority, removal of candidate projection counts
from expected truth, and finding history remain normative without change.

After this file is frozen, `protocol_spec_sha256` means SHA-256 of its complete
exact bytes. That hash binds this file and, through the direct predecessor, all
seven predecessor documents. It is computed externally and must not be
inserted by editing this file. Any byte change creates a new specification
identity and invalidates evidence bound to the earlier bytes.

The existing `scripts/native/g4-l10-successor-v2_3` implementation remains
v2.3-bound and non-authoritative. No earlier source hash, test, scoped review,
or incomplete review is relabeled as v2.7 evidence. A new no-clobber v2.7
implementation lineage may be created only after this exact successor
independently passes Gate A at `P0/P1/P2 = 0/0/0`.

Before that passing Gate A, authority permits only creation and read-only
review of this successor. A passing Gate A permits only the separately
authorized workspace implementation and nonprivileged tests. It never
authorizes production-helper `apply` or `recover`, protected installation,
protected parent/ACL/UID/launcher/system/volume mutation, original-runtime
launch, acceptance, promotion, release, or publication.

## 1. Exact three-reviewer Gate-A topology

This section replaces only the effective Gate-A unit-count, scoped-unit-count,
and reviewer-topology rules inherited from v2.6/v2.5/v2.4. All other canonical
format-version-2 companion grammar, identity, command, bound, finding, sorting,
section-token, batch-preimage, byte-hygiene, and verdict rules remain normative.

The report contains exactly three units:

```text
unit-count=3
unit 0: scope-class=scoped
unit 1: scope-class=scoped
unit 2: scope-class=whole; sections=whole
```

The three decoded reviewer IDs, task IDs, and transcript IDs are each unique.
All three reviewers are independently tasked non-authors. Unit groups remain
sorted by unsigned decoded reviewer-ID bytes, so their displayed ordinals are
assigned only after identities are fixed. Each unit reads the frozen v2.7 file
byte 1 through EOF and every incorporated predecessor byte needed to review
the complete effective contract.

The two scoped units have nonempty, ASCII-sorted, pairwise-disjoint subsets of
the fixed tokens `00-preamble,01..16`; their union is the exact complete token
set. The whole unit has only token `whole`. Additional units are forbidden.
Every effective section is therefore reviewed independently by its one scoped
unit and again by the distinct whole unit. No unit may rely on another unit's
semantic conclusion, finding disposition, or recomputed identity.

For the first conforming v2.7 batch, the intended disjoint scoped partition is:

```text
scoped A: 00-preamble,01,02,03,04,05,06,07,08
scoped B: 09,10,11,12,13,14,15,16
whole Z:  whole
```

These labels are planning names only. The report binds exact reviewer/task/
transcript bytes, timestamps, commands, section-set hashes, and frozen before/
after hashes. A substitution, missing token, overlap, or non-whole third unit
invalidates the batch.

The inherited grammar metavariable `unit-count=<canonical-decimal-U32-4..18>`
is replaced by exact canonical decimal `unit-count=3`. Every inherited phrase
requiring `at least three` scoped units is replaced by `exactly two` scoped
units. Every inherited phrase requiring `at least three independently tasked
reviewers with disjoint primary scopes plus one whole-document reviewer` is
replaced by `exactly two independently tasked scoped reviewers with disjoint
complete primary scopes plus one distinct whole-document reviewer`. The
checked total-command and output bounds are unchanged.

## 2. Gate-A companion and finding union

The exact v2.7 companion path is:

`docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.7 Successor Independent Review
```

In its Frozen identity:

- `successor-sha256` is the externally computed SHA-256 of this complete v2.7
  file from byte 1 through EOF;
- its byte and LF counts are recomputed from this exact file;
- `direct-predecessor-sha256` equals both the live v2.6 digest and fixed value
  `3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a`;
  and
- `root-predecessor-sha256` remains fixed value
  `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.

HMG4GAB2 uses those v2.7, direct-v2.6, and root identities with the v2.7
byte/LF counts and exact three unit identities. Every unit's `before` and
`after` equals the frozen v2.7 digest. Scoped tokens cover the complete
effective merged contract, including this topology override and every
nonreplaced incorporated section.

The finding union contains the exact twenty-one-row frozen v2.3 companion
history plus at least these six later findings:

```text
P1 V23-S64-TLV-ENCODING-UNDEFINED
P1 V23-GLOBAL-TAG-TYPE-REGISTRY-NOT-FROZEN
P1 V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES
P1 V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS
P2 V23-DIRECT-PREDECESSOR-TYPE-LINEAGE-STALE
P2 V25-REGRESSION-OMISSION-CARDINALITY-EXCLUDES-XATTR
```

V2.6's incomplete reviewer topology is process history, not a P0/P1/P2
document finding and does not add a finding row. The v2.3 rows retain exact
priority, code, original text, remediated text, and earliest confirmed hash,
with reviewer IDs re-attributed only to current units that actually recheck
them. The six later findings remain separate. Additional findings enter the
union. Omission, collapse, or side-channel disposition invalidates the report.

PASS requires all 27 required historical rows plus any new rows,
`disposition=remediated` for every row, exact two-scoped-plus-one-whole
coverage, and final `open-p0/open-p1/open-p2 = 0/0/0`. Any reviewer disagreement
or new finding prevents companion creation and keeps implementation
unauthorized. Gate A remains specification-only, acceptance-effect-zero, and
runtime-authority-zero.

## 3. Unchanged execution boundary

All inherited fail-closed rules remain in force. Review, compilation, and
nonprivileged tests must not dispatch `apply` or `recover`, create a protected
installation, mutate protected parents or target volumes, change ACL/UID/GID,
launch an original runtime, or claim fidelity, audio correctness, human or
owner acceptance, strict completion, course integration, promotion, release,
or publication. A grammar for a future operation is never present authority
to execute it.
