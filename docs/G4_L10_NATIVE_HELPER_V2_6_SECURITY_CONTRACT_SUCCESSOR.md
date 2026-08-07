# Grade 4 Lesson 10 native transaction helper v2.6 successor security contract

Status: **design-only successor; not implemented, installed, or executable**
Evidence date: **2026-08-05**
Wire protocol version: **2**
Specification revision: **6**
Acceptance effect: **none**

## 0. Authority, predecessor, and precedence

This file is a non-destructive successor to the frozen v2.5 successor
`docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR.md`, which remains
byte-for-byte preserved at SHA-256
`5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce`,
19,864 bytes, 374 LF bytes, and mode `0444`. The direct predecessor binds the
frozen v2.4, v2.3, v2.2, v2.1, and original-v2 contracts at these exact hashes:

```text
v2.4 28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9
v2.3 bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320
v2.2 d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c
v2.1 170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab
root 77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All six predecessors are incorporated by those exact hashes. Their
requirements remain normative unless this successor expressly replaces them.
On conflict, this successor controls. Silence here never weakens a predecessor.
The singular term `predecessor` and every singular
`predecessor_contract_sha256` value mean only the direct v2.5 file and exact
SHA-256 `5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce`.
Transitive predecessor hashes are provenance roots, not alternate values.

The frozen v2.5 independent Gate-A review failed at
`P0/P1/P2 = 0/0/1`. No passing v2.5 companion was or may be created. The open
finding is P2 `V25-REGRESSION-OMISSION-CARDINALITY-EXCLUDES-XATTR`: v2.5
correctly specified the three regex-invisible `XattrRule.7101..7103` sites in
Section 1.2, but its separate Section 1.3 called another 38-site list the exact
complete omission set. The known union is three XattrRule sites plus those 38
additional sites, or 41. Its expressly non-authoritative 4,457-tag/4,459-pair
candidate likewise excluded the three XattrRule sites.

That contradiction was documentation-level P2, not an authority P1. V2.5 had
already withdrawn every regex-derived projection from runtime, build, policy,
and Gate-B authority; frozen the exact context-qualified two-stage validation
rule; frozen the `FinalEntry.0503` discriminator matrix; explicitly frozen
`XattrRule.7101..7103`; and required independent semantic schema walkers.
This successor corrects only the historical regression accounting and removes
all candidate cross-schema projection numbers from expected truth. V2.5
remains unchanged historical evidence and is never relabeled as a passing
review.

All v2.5 context-qualified schema rules remain normative. All v2.4 `0x11 S64`
rules remain normative. All inherited canonical authority schemas,
diagnostic/rollback registries, request transport, helper self-identity,
custody grammar, xattr policy, direction-1 definition, evidence DAG, resource
bounds, state machines, and no-authority boundaries remain normative. This
successor changes no wire version, object magic, field tag, field name, field
type, field value, ordering, cardinality, path grammar, signature, hash
preimage, operation, or runtime behavior.

After this file is frozen, `protocol_spec_sha256` means SHA-256 of its complete
exact bytes. That one hash binds this file and, through the direct predecessor,
all six predecessor documents. It is computed externally and must not be
inserted by editing this file. Any byte change creates a new specification
identity and invalidates evidence bound to the earlier bytes.

The existing `scripts/native/g4-l10-successor-v2_3` implementation remains
v2.3-bound and non-authoritative. No earlier source hash, test, or review is
silently relabeled as v2.6 evidence. A new no-clobber v2.6 implementation
lineage may be created only after this exact successor independently passes
Gate A at `P0/P1/P2 = 0/0/0`.

Before that passing Gate A, authority permits only creation and read-only
review of this successor. A passing Gate A permits only the separately
authorized workspace implementation and nonprivileged tests. It never
authorizes production-helper `apply` or `recover`, protected installation,
protected parent/ACL/UID/launcher/system/volume mutation, original-runtime
launch, acceptance, promotion, release, or publication.

## 1. Corrected non-authoritative regression accounting

This section replaces only these v2.5 statements:

1. the Section 0 description that the v2.4 regex omitted 38 total valid tags;
2. the Section 1.3 sentence calling its displayed 38-tag list the exact total
   omission set; and
3. the Section 1.4 paragraph mentioning a candidate 4,457-tag/4,459-pair
   projection.

The effective minimum regression set for the withdrawn v2.4 line-anchored
regex contains these 41 known omitted tags:

```text
7101 7102 7103
020a 020b
0301 0302 0303
0f17 0f18 0f19 0f1a 0f1b 0f1c
a605 a606
d101 d102
d201 d202 d204 d205
d301 d302 d303 d304 d305 d306 d308 d309 d30a d30c d30d
d401 d402 d403 d404 d405 d406 d407 d408
```

`7101..7103` are the three inline, no-displayed-`0x` XattrRule sites frozen by
v2.5 Section 1.2. The remaining 38 are the additional inline, mid-line,
backticked, member-prefixed, or multiword-label sites displayed by v2.5 Section
1.3. The sets are disjoint. Every listed tag was absent from the v2.4 regex
projection and is valid in at least one exact incorporated enclosing schema.

This 41-tag list is mandatory regression coverage, not a complete authority
inventory and not a global admission registry. It neither authorizes a listed
tag outside its enclosing schema nor implies that unlisted sites are invalid.
If a later semantic schema walk identifies another site that a textual audit
projection missed, that site remains authoritative through its enclosing
schema and must be added to test coverage in a new no-clobber successor or
reviewed evidence; absence from this regression list never rejects it.

The v2.5 context-qualified site tuple, two-stage known-type/enclosing-schema
validation, `FinalEntry.0503` role/type table, `XattrRule` schema, independent
semantic walkers, full site/type/condition cross-product, call-graph dominance,
and HMG4E2 kind-6 evidence requirements remain unchanged. Gate A checks every
one of these 41 sites against its effective schema. Gate B provides the v2.5
required positive complete-object and wrong-type vectors, including all three
XattrRule sites and the complete `0503` 8-by-17 role/type matrix.

No global diagnostic projection tag count, allowed-pair count, stream byte
count, or digest is normative. The v2.4 `4,419` projection, v2.5
`4,457/4,459` candidate, independently computed `4,460/4,462` arithmetic, and
every associated stream digest are historical diagnostics only and are
forbidden as expected truth in policy, production code, Gate-B walkers,
decoders, review findings, or completeness claims. Completeness comes only
from independent semantic enumeration of the effective context-qualified
schemas and the required bijection with the production schema catalog.

## 2. Gate-A review and v2.6 companion

The effective v2.5/v2.4 Gate-A format-version-2 grammar remains normative with
the substitutions and additions below. The exact companion path is:

`docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.6 Successor Independent Review
```

In its Frozen identity:

- `successor-sha256` is the externally computed SHA-256 of this complete v2.6
  file from byte 1 through EOF;
- its byte and LF counts are recomputed from this exact file;
- `direct-predecessor-sha256` equals both the live v2.5 digest and fixed value
  `5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce`;
  and
- `root-predecessor-sha256` remains fixed value
  `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.

HMG4GAB2 uses those v2.6, direct-v2.5, and root identities with the v2.6
byte/LF counts and current unit identities. Every unit's `before` and `after`
equals the frozen v2.6 digest. Scoped tokens `00-preamble,01..16` cover the
complete effective merged contract, including this override and every
nonreplaced incorporated section. All inherited reviewer uniqueness, disjoint
scope, whole-review, command, finding, sorting, bound, and byte-hygiene rules
remain unchanged.

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

The v2.3 rows retain their exact priority, code, original text, remediated text,
and earliest confirmed-remediation hash, with reviewer IDs re-attributed only
to current units that actually recheck them. The six later rows retain separate
codes and exact independently reviewed texts; no collapse is allowed. The v2.5
P2 is remediated only if reviewers confirm the three-plus-thirty-eight
partition, the 41-member mandatory regression set, the removal of candidate
projection numbers from authority and expected truth, and the absence of a
new schema-admission contradiction. Additional findings enter the union.

PASS requires the complete finding union, `disposition=remediated` for every
row, exact scoped and whole coverage, and final
`open-p0/open-p1/open-p2 = 0/0/0`. Any reviewer disagreement or newly open
finding prevents companion creation and keeps implementation unauthorized.
Gate A remains specification-only, acceptance-effect-zero, and
runtime-authority-zero.

## 3. Unchanged execution boundary

All inherited fail-closed rules remain in force. Review, compilation, and
nonprivileged tests must not dispatch `apply` or `recover`, create a protected
installation, mutate protected parents or target volumes, change ACL/UID/GID,
launch an original runtime, or claim fidelity, audio correctness, human or
owner acceptance, strict completion, course integration, promotion, release,
or publication. A grammar for a future operation is never present authority
to execute it.
