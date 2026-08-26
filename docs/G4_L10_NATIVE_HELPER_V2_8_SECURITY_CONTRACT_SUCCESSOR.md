# G4 L10 Native Helper v2.8 Security Contract Successor

Status: frozen successor specification; no implementation, runtime, mutation,
installation, acceptance, promotion, release, or publication authority.

## 0. Lineage, failed v2.7 evidence, and exact scope

This document is the sole direct no-clobber successor to:

`docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR.md`

The complete direct-predecessor identity is:

```text
SHA-256=72b28827b7c7baff358abea33c0b919c32953ec9bcb02f4f56a7534a4f78e4cc
bytes=9515
LF-count=194
mode=0444
```

The root predecessor remains:

```text
docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md
SHA-256=77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
```

All v2.7 security, wire, canonical schema, authority, diagnostic, rollback,
request transport, loaded-helper self-identity, custody grammar, xattr policy,
direction-1, journal, recovery, evidence-DAG, resource, Gate-B, mutation, and
no-authority rules are incorporated unchanged except for the Gate-A evidence
corrections expressly stated below. In particular, v2.7's exact two-scoped-
plus-one-whole reviewer topology remains normative.

The frozen v2.7 companion at:

`docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

has this exact identity:

```text
SHA-256=cf919fe4478795140157c603348064c17b2c8c65519a2735c842759f59b68826
bytes=35953
LF-count=63
mode=0444
```

Its displayed `open-p0/open-p1/open-p2=0/0/0` and `verdict=PASS` are false and
have no authority. An independent companion-integrity review found:

```text
P1 V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS
```

The whole-review unit's commands 2.0, 2.1, and 2.2 encoded multiline
`/bin/zsh -lc` command strings containing respectively 19, 20, and 19 LF bytes
inside one argv argument. The inherited canonical command grammar permits each
argument to contain only 1..4,096 bytes and forbids NUL, CR, LF, and tab. The
v2.7 generator accepted pre-encoded argv streams without decoding that grammar;
the v2.7 verifier incorrectly used a 1,048,576-byte per-argument ceiling and
failed to reject LF and tab. Hash self-consistency did not make those commands
canonical. The v2.7 companion remains immutable failed evidence and must not be
rewritten, deleted, renamed, or cited as a passing Gate-A companion.

After that false PASS and before the independent integrity failure arrived, an
implementation attempt was created. Its frozen read-only inventory boundary is:

```text
scripts/native/g4-l10-successor-v2_7                  48 files
scripts/g4-l10-native-helper-v2_7-*.test.mjs           9 non-Gate-A runners
total                                                  57 files
total-bytes                                            553897
checksum-manifest-bytes                                7121
checksum-set-SHA-256=cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200
```

The checksum-set preimage is the unsigned byte-sorted list of all 57 relative
paths, each row exactly lowercase complete-file SHA-256, two ASCII spaces,
relative path, and LF. The attempt was not authorized by a valid Gate-A PASS;
it is incomplete, non-production, non-authoritative, and may not be edited,
rebound, relabeled, copied into a later implementation, or used as Gate-B or
implementation-review evidence. It is retained only to make the sequencing
failure auditable. No helper binary was executed and no `apply`, `recover`,
protected installation, protected mutation, or original runtime occurred.

## 1. Canonical Gate-A argv-stream closure

This section narrows and operationalizes the inherited format-version-2
command grammar. It does not weaken any inherited rule.

For every command row, `argv-stream-b64u` is canonical unpadded base64url of:

```text
BE32 argument_count
repeat argument_count times:
  BE32 argument_byte_count
  exact argument bytes
```

The decoded stream is the actual argv vector passed directly to the process
creation API. It is never a transcript label, display-only shell command, or
container for an unrecorded argv. Exact requirements are:

- `argument_count` is 1..256;
- every `argument_byte_count` is 1..4,096;
- checked aggregate argument bytes are at most 1,048,576;
- every argument is canonical fatal UTF-8 and contains no NUL, CR, LF, or tab;
- the stream has no truncation, padding, trailing byte, or unconsumed byte;
- `cwd-b64u` retains the inherited identity grammar and exact workspace path;
- each command row retains the inherited timestamp, exit, stdout/stderr byte
  count, complete SHA-256, ordering, interval, and transcript-preimage rules.

The first conforming v2.8 review batch may use only direct executable argv
vectors whose executable is `ruby`, `python3`, or `node`. It must not use
`sh`, `zsh`, `bash`, `/bin/sh`, `/bin/zsh`, `/bin/bash`, `-c`, or `-lc`; must
not use an interpreter argument containing LF or tab; and must not hide a
second argv vector in a shell command string. A one-line interpreter program
argument remains an actual, fully recorded argv argument and must independently
fit the 4,096-byte ceiling and forbidden-byte rule.

At least the first and last command in each unit directly read the complete
frozen v2.8 file, recompute its SHA-256, byte count, LF count, and mode, and
emit those values to hashed stdout. The whole unit also directly reads the
direct-v2.7 and root predecessors and checks that both fixed hashes are present
in v2.8. Semantic review conclusions are not delegated to these commands; the
commands are exact review evidence only.

## 2. Generator and verifier prepublication fail-closure

The v2.8 companion generator and verifier are separate source files. Neither
may import, execute, eval, or derive its validation result from the other.

Before any companion path is created, the generator must construct each argv
stream from a structured in-memory array of decoded argument strings. It must
apply every Section 1 rule to those decoded bytes, encode the stream itself,
decode its own result with a separate cursor, reapply the rules, and compare
the decoded argument bytes byte-for-byte with the source array. A raw or
pre-encoded `argvStreamB64u` input path is forbidden. Any error stops before
`open` or `writeFile` of the companion path.

The independently authored verifier must decode every report argv stream and
enforce exact per-argument 4,096-byte, aggregate, count, UTF-8, forbidden-byte,
and exact-consumption rules. It must reject at least these mutation classes in
its own test process:

```text
zero arguments
257 arguments
zero-byte argument
4,097-byte argument
aggregate overflow
embedded NUL
embedded CR
embedded LF
embedded tab
invalid UTF-8
noncanonical base64url
truncated length
extent overrun
trailing byte
shell or absolute-shell executable
-c or -lc argument
```

Those negative tests must exercise the same verifier function used for the
live report. Merely searching displayed base64 text or trusting generator
output is not verification.

After generator preflight succeeds, companion publication uses exact-path
exclusive create with no replacement (`wx` or an equivalent no-replace
primitive), final mode `0444`, UTF-8 LF text, no CR/NUL/tab/trailing whitespace,
and exactly one final LF. Re-running the generator against the existing target
must fail with `EEXIST` or its exact platform equivalent and leave the complete
target hash unchanged. No in-place repair, chmod-to-write, unlink, truncate,
temporary rename over an existing target, or fallback path is permitted.

The verifier additionally recomputes HMG4GAB2, every HMG4GAC1 and HMG4GAS1,
the exact reviewer/task/transcript identities, topology, command intervals,
finding texts and hashes, final counts, byte hygiene, and EOF grammar. A
generator success without independent verifier success is not Gate A.

## 3. v2.8 independent-review topology and companion

The v2.7 topology is retained exactly:

```text
unit-count=3
unit 0: scope-class=scoped; sections=00-preamble,01,02,03,04,05,06,07,08
unit 1: scope-class=scoped; sections=09,10,11,12,13,14,15,16
unit 2: scope-class=whole;  sections=whole
```

Reviewer, task, and transcript identities are each unique; reviewer groups are
sorted by unsigned decoded reviewer-ID bytes; all three reviewers are distinct
non-authors; all units read byte 1 through EOF; and each effective section is
read once by its scoped reviewer and independently again by the whole reviewer.
Every inherited unit, scope, section-set, command, output, finding, sorting,
batch-preimage, and verdict rule remains normative subject to Sections 1 and 2.

The exact companion path is:

`docs/G4_L10_NATIVE_HELPER_V2_8_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md`

Its exact heading is:

```text
# G4 L10 Native Helper v2.8 Successor Independent Review
```

Its Frozen identity binds the externally recomputed complete v2.8 SHA-256,
byte and LF counts, direct-v2.7 SHA-256
`72b28827b7c7baff358abea33c0b919c32953ec9bcb02f4f56a7534a4f78e4cc`,
and root SHA-256
`77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583`.
HMG4GAB2 uses those identities, exact v2.8 byte/LF counts, and three unit
identities.

The finding union contains the exact 27 rows required by v2.7 plus this
separate row:

```text
P1 V27-GATE-A-COMPANION-ARGV-GRAMMAR-BYPASS
```

Its original text records the three multiline `/bin/zsh -lc` argv arguments,
the generator's pre-encoded bypass, and the verifier's incorrect per-argument
ceiling and LF/tab omission. Its remediated text records the structured argv
construction, double decode preflight, direct-executable restriction, strict
independent verifier, mutation suite, and no-clobber re-run proof required by
this successor. The earliest confirmed-remediation hash is the frozen v2.8
SHA-256 after independent reviewers confirm the complete fix. V2.7's false
PASS is process and evidence failure as well as this P1; it does not authorize
or erase any earlier finding.

PASS requires exactly all 28 required rows plus any new findings, every row
remediated, exact two-scoped-plus-one-whole coverage, strict Section 1 argv
validation for every command, successful Section 2 verifier and mutation
suite, and final `open-p0/open-p1/open-p2=0/0/0`. Any disagreement, invalid
command, verifier failure, or new finding prevents companion creation.

## 4. Closed implementation and execution boundary

Before the v2.8 contract independently passes Gate A and its new companion is
created and independently verified, no v2.8 implementation directory, source
port, production helper, dispatcher, filesystem engine, journal engine, test
runner, build artifact, fixture, or implementation-review packet may be
created. The preserved v2.7 attempt remains unusable.

A valid v2.8 Gate-A PASS would authorize only the user's already bounded
workspace-only production-helper implementation and nonprivileged tests. It
would not authorize helper `apply` or `recover`, including fixtures; protected
installation; protected parent, ACL, UID, GID, launcher, system, or volume
mutation; original-runtime launch; acceptance; promotion; integration;
release; or publication. Those prohibitions remain fail closed.

No contract, review, generator, verifier, implementation source, compilation,
or test result has acceptance effect, runtime authority, fidelity effect,
audio-acceptance effect, promotion effect, or publication effect.
