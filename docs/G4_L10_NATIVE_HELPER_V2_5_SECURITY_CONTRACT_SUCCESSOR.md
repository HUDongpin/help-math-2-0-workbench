# Grade 4 Lesson 10 native transaction helper v2.5 successor security contract

Status: **design-only successor; not implemented, installed, or executable**
Evidence date: **2026-08-05**
Wire protocol version: **2**
Specification revision: **5**
Acceptance effect: **none**

## 0. Authority, predecessor, and precedence

This file is a non-destructive successor to the frozen v2.4 successor
`docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md`, which remains
byte-for-byte preserved at SHA-256
`28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9`,
979,184 bytes, 15,477 LF bytes, and mode `0444`. The direct predecessor binds:

- frozen v2.3 SHA-256
  `bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320`;
- frozen v2.2 SHA-256
  `d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c`;
- frozen v2.1 SHA-256
  `170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab`;
  and
- frozen original-v2 SHA-256
  `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.

All five predecessors are incorporated by those exact hashes. Their
requirements remain normative unless this successor expressly replaces them.
On conflict, this successor controls. Silence here never weakens a predecessor.
The singular term `predecessor` and every singular
`predecessor_contract_sha256` value mean only the direct v2.4 file and exact
SHA-256 `28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9`.
The v2.3, v2.2, v2.1, and original-v2 hashes are transitive provenance roots,
not alternate values for that singular field.

The frozen v2.4 Gate-A review failed at `P0/P1/P2 = 0/2/0`. No passing v2.4
Gate-A companion was or may be created. The two open findings are:

1. P1 `V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES`: the v2.4
   one-type-per-tag projection reduced `FinalEntry.0503 path` to only its first
   displayed type, making required custody roles 2 through 8 unencodable.
2. P1 `V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS`: the v2.4 line-anchored regular
   expression omitted 38 valid inline, mid-line, backticked, member-prefixed,
   or multiword-label schema tags, making their valid objects unencodable.

The independent reviews reproduced v2.4's claimed 17,012 regex matches, 4,419
unique tags, 152,651-byte stream, and SHA-256
`ef7908aab36cb7a129de0b9dbdaa800be59c72540a7864b8002b05904e81b54e`.
That reproducibility proves only the projection's byte identity; it does not
make the projection authority-complete. This successor therefore withdraws
that projection from every validation, authorization, test, and completeness
claim as specified in Section 1. Frozen v2.4 remains unchanged historical
evidence and is never relabeled as a passing review.

V2.4's `0x11 S64` repair remains normative without change: exact eight-byte
two's-complement big-endian representation, mathematical signed decode,
decode/re-encode identity, signed bounds, exactly six legal sites, dependent
source-type range `0x01..0x11`, and all specified Gate-B vectors. V2.4's
corrected direct-predecessor lineage also remains normative. This successor
changes neither wire protocol version nor any object magic, field tag, field
name, field type, field value rule, custody grammar, diagnostic registry,
rollback registry, request transport, helper self-identity rule, xattr policy,
direction-1 definition, authority DAG, mutation state machine, nor resource
bound outside the exact schema-validation correction below.

After this file is frozen, `protocol_spec_sha256` means SHA-256 of the complete
exact bytes of this successor. That one hash binds this file and, through the
direct predecessor, all five predecessor documents. The successor digest is
computed externally and must never be inserted by editing this file. Any byte
change creates a new specification identity and invalidates prior Gate-A,
policy, build, install, capability, request, journal, receipt, implementation,
and security-review evidence bound to the earlier bytes.

The existing `scripts/native/g4-l10-successor-v2_3` implementation remains
v2.3-bound and non-authoritative. No v2.3 or v2.4 source hash, test, or review
is silently relabeled as v2.5 evidence. A new no-clobber v2.5 implementation
lineage may be created only after this exact successor independently passes
Gate A at `P0/P1/P2 = 0/0/0`.

Before that passing Gate A, authority permits only creation and read-only
review of this successor. A passing Gate A permits workspace-only source
implementation, compilation, codec/unit/fuzz testing, and nonprivileged
test-harness setup or teardown within approved disposable fixture roots under
the user's separate authorization. It does not authorize the production
helper's `apply` or `recover` operation, even against a fixture. Neither phase
authorizes protected installation, protected parent/ACL/UID/launcher/system or
volume changes, original-runtime launch, acceptance, promotion, release, or
publication. Every contract and review artifact has acceptance effect zero.

## 1. Context-qualified canonical authority schemas

This section completely replaces only the v2.4 Section 1 paragraphs beginning
with `The complete authority field registry is a closed global tag-to-type map`
and ending with `wrongly-typed field`. The v2.4 regex, its 17,012/4,419 counts,
its 152,651-byte stream, its
`ef7908aab36cb7a129de0b9dbdaa800be59c72540a7864b8002b05904e81b54e`
digest, its sixteen-token count table, its exactly-4,419-pairs assertion, and
every validation or completeness conclusion derived from them are diagnostic
history only. They are forbidden as runtime authority, build authority,
Gate-B truth, or proof of schema completeness. All other v2.4 Section 1 rules,
including `0x11 S64`, remain normative.

There is no global tag-to-one-type authority registry. Canonical field
authority is context-qualified by the exact effective schema obtained by
applying this successor's precedence to all incorporated contracts. A schema
site is identified by the tuple:

```text
(outer magic or derived-stream magic,
 kind or profile when present,
 enclosing named STRUCT or LIST-member schema,
 exact nesting path from the outer payload,
 field tag,
 already decoded prerequisite branch discriminators)
```

The tuple is an implementation and review concept, not a new wire field or
hash preimage. Two equal 16-bit tags in different enclosing schemas are
different sites. One tag may have more than one allowed type only when the
effective schema explicitly makes that type conditional on a prerequisite
discriminator. An implementation must never infer field authority from global
tag uniqueness, source-line layout, Markdown fencing, backticks, indentation,
field-label token count, or a prose-extraction regular expression.

Every normative schema table and inline member declaration in the incorporated
contracts remains authoritative, including declarations that:

- place more than one field on a physical line;
- follow `member:`, `exactly one member:`, or other introductory prose;
- omit a displayed `0x` prefix while still naming an exact hexadecimal tag;
- use a multiword, hyphenated, or slash-containing human label; or
- continue a conditional type rule on later physical lines.

Formatting is never a completeness boundary. A regex-derived inventory may be
used as an audit diagnostic only and may never admit or reject a field.

Canonical decoding has two distinct layers:

1. The raw TLV/framing layer checks the inherited header, length, ordering,
   duplicate, resource, and reserved-byte rules and recognizes exactly the
   closed wire-type byte set `0x01..0x11`. Type byte `0x12` and every other
   unknown value fail closed. A production predicate for this layer must be
   named and used only as `known_type_byte` or an equivalently unambiguous name;
   it is never a field-site authorization predicate.
2. The enclosing-schema layer selects the exact context-qualified site, checks
   the field's allowed type or conditional type, cardinality, presence,
   ordering, nesting, and value constraints, and rejects every unknown tag or
   wrong known type. A known type byte alone grants no authority. Wrong-type
   rejection occurs before value-specific semantic decoding, hashing,
   signature admission, dispatch, filesystem observation, or mutation.

No raw-TLV iterator, generic rule-definition validator, diagnostic path,
projection builder, evidence-DAG consumer, or dispatcher may consume
`known_type_byte` as proof that a tag/type pair is legal. Every authority path
must reach an exact enclosing-schema validation result first. Rule definitions
are themselves validated against the exact schema site they implement; a
compiled rule assigning a known but wrong type is a build/test failure.

### 1.1 Exact conditional `FinalEntry.0503` rule

The sole conditional multi-wire-type field in the effective predecessor
schemas is `FinalEntry.0503 path`. Its complete rule is reaffirmed and narrowed
to this exact table:

```text
location_role  required wire type at 0x0503  value grammar
1              0x06 POLICY_REL_PATH          exact managed live path
2..7           0x0a SAFE_CUSTODY_LEAF        exact held custody leaf
8              0x0c OBSERVED_CUSTODY_LEAF    exact foreign/unclassified leaf
```

`0x0502 location_role U32` precedes `0x0503` in canonical tag order and must be
fully decoded and range-validated before the decoder selects the `0x0503`
branch. No speculative, fallback, first-match, or coercing branch is allowed.
For each role value 1 through 8, exactly its displayed type is valid; each of
the other sixteen known types fails. A missing or duplicate `0502`, role zero,
role 9 or greater, `0503` before `0502`, a type valid for another role, or any
normalization between the three path grammars fails before path use or custody
classification. The field remains one canonical TLV, not three alternate tags.

Gate B exercises the complete 8-by-17 role/type cross-product, each path
grammar's one-byte and component boundaries, role/type swaps in every request,
plan, journal, stage, preimage, rollback, archive, receipt, retained-ancestor,
and foreign/unclassified custody projection, plus unknown `0x12`. Exactly eight
role/type combinations pass, one for each role; no projection may retype the
field after it has been validated.

### 1.2 Exact inline `XattrRule` schema

The incorporated HMG4Y2 `attributes` LIST contains only `XattrRule` STRUCT
members. Each member contains exactly these fields in strictly increasing tag
order:

```text
0x7101 ordinal U32
0x7102 name    BYTES
0x7103 value   BYTES
```

All incorporated value, length, ordering, uniqueness, aggregate-length,
stream-length, and exact-set rules remain conjunctive. These three tags are
valid only in an `XattrRule` member at the HMG4Y2 `0x7005 attributes` nesting
path. They are not undeclared merely because predecessor prose displayed them
inline without a `0x` prefix. At each of the three sites, every other known
type and unknown type `0x12` fails. Empty HMG4Y2 attributes contain no
`XattrRule`; a nonempty list requires the exact three-field schema per member.

### 1.3 Inline and mid-line incorporated members

The following v2.4 audit result is frozen as regression coverage, not as a new
global registry. Its line-anchored regex omitted exactly these 38 valid schema
tags:

```text
020a 020b
0301 0302 0303
0f17 0f18 0f19 0f1a 0f1b 0f1c
a605 a606
d101 d102
d201 d202 d204 d205
d301 d302 d303 d304 d305 d306 d308 d309 d30a d30c d30d
d401 d402 d403 d404 d405 d406 d407 d408
```

Their exact enclosing schemas, names, types, conditions, ordering, and value
rules are the incorporated declarations, not this regression list. The list
does not authorize a tag outside its enclosing schema and does not replace any
schema table. Gate A checks each listed tag against the effective contract.
Gate B provides at least one positive enclosing-object vector for each listed
site and rejects every other known type plus `0x12` at that same site. It also
checks the previously regex-visible neighboring members in each enclosing
schema so the regression cannot be satisfied by a permissive object parser.

The root HMG4D2 derived kinds 1 through 4 receive explicit complete-object
positive vectors covering `d101/d102`, `d201..d205`, `d301..d30d`, and
`d401..d408`, with their incorporated exact types and value constraints.
HMG4Y2 receives empty and nonempty `XattrRule` vectors. The objects containing
`020a/020b`, `0301..0303`, `0f17..0f1c`, and `a605/a606` each receive the same
positive and wrong-type coverage. A test that only calls the raw TLV iterator
does not satisfy any of these schema vectors.

### 1.4 Implementation schema closure and Gate B

The production implementation must compile an exact, reviewable
context-qualified schema catalog. Each catalog entry identifies the enclosing
schema and nesting path, tag, allowed type mask, cardinality, presence rule,
and named prerequisite-condition evaluator. The catalog is implementation
evidence, not a new protocol object and not authority to change the contract.
Its source is checked by two independently authored Gate-B schema walkers
against the complete effective contract, including every original-v2 and
successor table, inline member, conditional continuation, derived stream, and
nested copy. The walkers must not share a prose regex, parser, field list,
generated source, or implementation catalog.

Gate B requires all of the following:

- both independent walkers produce the same ordered context-qualified site
  inventory and the same positive site/type/condition set;
- every production catalog entry maps to exactly one effective schema site,
  and every effective schema site maps to an entry;
- the complete inventory has no duplicate context-qualified key, ambiguous
  conditional branch, uncovered field, invented field, or unsupported type;
- for every site and every type byte `0x01..0x12`, the production validator and
  both independent decoders agree on permitted versus rejected status under
  every finite branch discriminator value named by that site;
- representative unknown tags in every enclosing schema and all tags at the
  declared 16-bit boundaries fail;
- exact positive complete-object vectors prove that context selection, nested
  LIST/STRUCT parsing, value constraints, canonical hashing, and re-encoding
  agree byte-for-byte; and
- static call-graph and adversarial tests prove that no raw known-type result
  can reach dispatch or authority consumption without enclosing-schema success.

The exhaustive implementation test may contain more than 65,536 in-process
assertions; the predecessor's 65,536 golden-vector case bound applies only to
the separately framed HMG4G2 catalog. Large negative cross-products may be
represented by deterministic generator rules plus boundary exemplars in
HMG4G2, provided both independent decoders execute the full in-process
cross-product and the HMG4E2 kind-6 review binds the generator source, inputs,
counts, and results.

No fixed diagnostic projection count, tag count, legal-pair count, byte count,
or digest is asserted by this successor. The independently reported candidate
4,457-tag/4,459-pair projection is non-authoritative and must not be copied into
policy, code, tests, or review as expected truth. Gate-B agreement is accepted
only after independent semantic enumeration of the complete effective schemas,
not after reproducing a shared textual extractor.

## 2. Gate-A review and successor companion

The v2.4 Section 16 Gate-A format-version-2 grammar remains normative with only
the substitutions and additions in this section. The exact v2.5 companion path
is:

`docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.5 Successor Independent Review
```

In its Frozen identity:

- `successor-sha256` is the externally computed SHA-256 of this complete v2.5
  file from byte 1 through EOF;
- `successor-byte-count` and `successor-lf-line-count` are recomputed from this
  complete v2.5 file;
- `direct-predecessor-sha256` equals both the live SHA-256 of
  `docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md` and fixed
  value `28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9`;
  and
- `root-predecessor-sha256` remains fixed original-v2 SHA-256
  `77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.

The unchanged HMG4GAB2 batch preimage uses those v2.5 successor, direct-v2.4,
and root identities with the v2.5 byte/LF counts and exact unit identities.
Every unit's `before` and `after` equals the frozen v2.5 successor digest.

The scoped tokens `00-preamble,01..16` refer to the complete effective merged
contract: this file's Sections 0 through 2 and every nonreplaced corresponding
section in the incorporated v2.4/v2.3/v2.2/v2.1/original-v2 chain. Each unit
reads this v2.5 file byte 1 through EOF and every incorporated file needed for
its scope. Exactly three or more independently tasked scoped reviewers have
pairwise disjoint token sets whose union is complete; exactly one distinct
reviewer performs the whole-document review. Reviewer, task, and transcript
identities remain unique, and all inherited command-evidence rules apply.

The finding union contains the complete twenty-one-row frozen v2.3 companion
history plus at least these five later findings:

```text
P1 V23-S64-TLV-ENCODING-UNDEFINED
P1 V23-GLOBAL-TAG-TYPE-REGISTRY-NOT-FROZEN
P1 V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES
P1 V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS
P2 V23-DIRECT-PREDECESSOR-TYPE-LINEAGE-STALE
```

The v2.3 companion's twenty-one rows retain their exact priority, code,
original text, remediated text, and earliest confirmed-remediation hash; their
reviewer IDs are re-attributed only to current units that actually recheck
them. The five later rows use exact independently reviewed original and
remediated text. The two v2.4 findings may not be collapsed into one row: their
failure modes and remediation checks are independent. Additional historical or
newly discovered findings are included in the union. Finding count equals the
complete union; omission or side-channel disposition invalidates the report.

For a PASS, every historical row has `disposition=remediated`, all reviewers
confirm the v2.4 S64 and lineage repairs remain intact, all reviewers confirm
this successor has withdrawn the false registry from authority, and the two
v2.4 P1s are separately confirmed remediated. Any disagreement about one
inline site, conditional branch, predecessor hash, schema context, or report
row keeps the relevant finding open. Final `open-p0`, `open-p1`, and `open-p2`
must be zero; otherwise no companion conforming to the passing grammar may be
created and implementation remains unauthorized.

Gate A is document-level, specification-only evidence with acceptance effect
zero and runtime authority zero. It verifies the effective contract, schema
contexts, finite branch rules, Gate-B coverage obligations, inherited
diagnostic/rollback/request-transport/self-identity/custody/xattr/direction-1
definitions, authority graph, resources, and no-authority boundaries. It does
not claim that the v2.5 implementation, production helper, HMG4G2 catalog,
HMG4E2 review, protected install, or runtime evidence exists.

## 3. Unchanged execution boundary

All inherited fail-closed rules remain in force. Review, compilation, and
nonprivileged tests must not dispatch `apply` or `recover`, create a protected
installation, mutate protected parents or target volumes, change ACL/UID/GID,
launch an original runtime, or claim fidelity, audio correctness, human or
owner acceptance, strict completion, course integration, promotion, release,
or publication. A grammar for a future operation is never present authority
to execute it.
