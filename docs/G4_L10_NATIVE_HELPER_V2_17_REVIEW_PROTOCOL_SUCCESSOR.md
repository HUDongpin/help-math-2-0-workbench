# Grade 4 Lesson 10 native-helper v2.17 independent-review protocol successor

Date: 2026-08-07  
Status: **AUTHORING-ONLY PROTOCOL — NO REVIEW SET CREATED — NO REVIEW VERDICT — NO RUNTIME AUTHORITY**

This is the companion review protocol for the no-clobber v2.17 security
successor. It fixes the v2.16 review findings without changing any v2.14,
v2.15, v2.16, HMG4RB4, V28, source, runtime, or acceptance artifact.
For this v2.17 lineage, v2.12 Section 6 is explicitly retired and v2.13
Section 4 is the sole operative clean-room rule.

The formal review target is:

```text
/Volumes/WestWorld/HELP MATH 2.0/docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256 bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3
```

The verifier and focused test are:

```text
/Volumes/WestWorld/HELP MATH 2.0/scripts/g4-l10-native-helper-v2_17-review-verifier.mjs
/Volumes/WestWorld/HELP MATH 2.0/scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs
```

Their final authoring hashes must be recorded in a later authenticated review
set. This document does not pre-authorize that review set or any reviewer task.

## 0. Fixed authority boundary

The v2.17 package is authoring output only. No machine receipt is a human
review. No review-set manifest is an authorization. No result from v2.14,
v2.15, or v2.16 is inherited as a v2.17 result.

No HMG4RB4 or HMG4RB successor may be created. The v2.14 history remains
`STRICT_BUT_NONQUALIFYING_CLOSED`; its task IDs, nonces, attempts, output
paths, receipts, counts, and conclusions are nonreusable.

Peter Hu's named original-runtime operator status remains inactive. The
sixteen missing MP3s, `Polynomial.swf`, the Key Terms 17 exact-placement
records, and the 299 case-variant records remain outside this protocol.

## 1. Exact canonical JSON domain and physical bytes

### 1.1 Value domain

Canonical JSON values are limited to:

- `null`;
- the booleans `false` and `true`;
- Unicode strings accepted by JavaScript `JSON.stringify`, with unpaired UTF-16
  surrogates rejected;
- safe base-10 integers in `[-9007199254740991, 9007199254740991]`, with
  negative zero rejected;
- arrays of canonical values, retaining their exact order; and
- plain objects whose own enumerable string keys contain no NUL, CR, LF, or
  unpaired surrogate and whose values are canonical.

Floating-point fractions, exponential-only values, `NaN`, infinities,
`undefined`, functions, symbols, big integers, dates, maps, sets, typed arrays,
buffers, accessors, prototypes other than `Object.prototype` or `null`, sparse
arrays, and cycles are outside the domain.

### 1.2 Compact canonical form

`canonicalJson(value)` recursively sorts object keys by JavaScript default
UTF-16 code-unit order, retains array order, and then applies
`JSON.stringify(value)` with no replacer and no spacing. JSON string escaping
is therefore exactly the escaping produced by the bound Node.js runtime.
Booleans and null use their lowercase JSON tokens; integers use the exact
decimal token produced by `JSON.stringify` and never `-0`.

The review-set digest is:

```text
SHA-256(UTF8("G4L10-V217-REVIEW-SET\n" || canonicalJson(body) || "\n"))
```

where `body` is the manifest with the top-level `reviewSetDigest` member
removed and nothing else changed.

Receipt IDs use the same grammar and the kind-specific domain separator
implemented by the exact verifier.

### 1.3 Disk serialization

Every manifest and receipt on disk is exactly the recursively key-sorted value
serialized by `JSON.stringify(sortedValue(value), null, 2)`, encoded as UTF-8,
followed by one LF byte. It contains no BOM and no CR byte. A disk input is
accepted only if strict UTF-8 decoding and JSON parsing succeed, the parsed
value is in the canonical domain, and reserialization is byte-identical.
Consequently duplicate keys, alternate whitespace, alternate key order,
trailing spaces, missing/further final newlines, and noncanonical number tokens
are rejected rather than normalized.

## 2. Exact ordered fixed-input closure

The review-set `fixedInputs` array must contain exactly this ordered core,
followed by the exact unique v2.14 history members in the order declared by the
history closure. The v2.14 target appears once as the direct predecessor and is
not duplicated as a history member.

```text
target|docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md|bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3
protocol|docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md|bound-by-review-set
verifier|scripts/g4-l10-native-helper-v2_17-review-verifier.mjs|bound-by-review-set
focused-test|scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs|bound-by-review-set
v2.16-protocol|docs/G4_L10_NATIVE_HELPER_V2_16_REVIEW_PROTOCOL_SUCCESSOR.md|64077e18264236f10c77414f049c00b585a3d7258a9a3c324ec616c399695736
v2.16-verifier|scripts/g4-l10-native-helper-v2_16-review-verifier.mjs|5ce0a5876ec86ffb9facef5c629c47634bcc43c1bb566a52bf319aee2e4b37a9
v2.16-focused-test|scripts/g4-l10-native-helper-v2_16-review-verifier.test.mjs|194f375333a7f9925349d39b3f268eb1c02297f16fde867389bae53b1376fd35
v2.15-protocol|docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md|2f3161f93209b8ec5ba87d36cd11557fee8790087af60984ca9eefc9923caea7
v2.15-verifier|scripts/g4-l10-native-helper-v2_15-review-verifier.mjs|99e6ec770a74e3a344ddd4138718bc8a04c5032314dc7402b1cd3b937d716b70
v2.15-focused-test|scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs|363783b17bcc04556e7121721f6115b8d87ed196a82e51537be3dd3733faf88b
v2.14-predecessor|docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md|a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
v2.13-predecessor|docs/G4_L10_NATIVE_HELPER_V2_13_SECURITY_CONTRACT_SUCCESSOR.md|e8395f34d83b4a9e12fbe426473a7f97afd1b35dfcb20b613813351c21e0e123
v2.12-ledger-source|docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md|7874c4dee7f66203f6485bcac73dd8112a962ca258d63eb15e13001dd7d81a4b
v2-production|docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md|77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583
v2.1-production|docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR.md|170bd54b031f1f6e693f152aef885a509b2d4328f5032cc620a41dcf49a884ab
v2.2-production|docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md|d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c
v2.3-production|docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md|bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320
v2.4-production|docs/G4_L10_NATIVE_HELPER_V2_4_SECURITY_CONTRACT_SUCCESSOR.md|28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9
v2.5-production|docs/G4_L10_NATIVE_HELPER_V2_5_SECURITY_CONTRACT_SUCCESSOR.md|5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce
v2.6-production|docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md|3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a
history-closure|reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json|67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1
```

Each project-relative path above is joined only to the exact canonical root
`/Volumes/WestWorld/HELP MATH 2.0`. CLI path arguments themselves must already
be canonical absolute path literals; normalizing a relative argument with
`path.resolve` is forbidden.

## 3. New review-set schema

A later explicit user authorization may create one fresh manifest with:

```text
schemaVersion
artifactType = g4-l10-native-helper-v2-17-authenticated-review-set
authority = correlation-only-never-self-authorizing
protocolVersion = v2.17
sourceThreadId
userAuthorizationTurnId
userAuthorizationTextSha256
reviewSetNonce
canonicalRoot = { declared, resolved, dev, ino }
fixedInputs
reviewers
reviewSetDigest
```

`reviewers` contains exactly `schema`, `adversarial`, and `whole` in that
order. Each row contains one distinct task-system ID, one distinct 64-hex
reviewer nonce, and exactly one `preflight` and one `evidence` record. Each
phase record contains `attemptOrdinal: 1`, one success output, and one error
output. All twelve leaves are distinct. Each reviewer's four leaves share one
reviewer-owned physical parent; the three parents are distinct direct children
of physical `/tmp`, current-UID-owned, and mode `0700`.

The manifest is mode `0400` or `0600`, single-link, and supplied with its exact
SHA-256 on every invocation. A reviewer task is valid only for its one bound
scope. Task substitution, reordered tasks, nonce reuse, mixed manifests,
alternate outputs, or old receipts invalidate the attempt.

## 4. Phase A preflight

Phase A is a diagnostic readiness attempt, not evidence and not a review. It
must occur once for the bound reviewer. Before any fixed input is collected,
both bound Phase A output leaves must be absent.

Preflight must:

1. authenticate the review set and task/scope/output binding;
2. retain the canonical-root descriptor and every fixed-input descriptor;
3. verify exact path/descriptor metadata and hardcoded predecessor hashes;
4. parse and assess only retained buffers;
5. syntax-check the retained verifier and test buffers through stdin;
6. execute the retained focused test buffer against the retained verifier
   buffer through the deterministic import substitution defined by the
   verifier;
7. recheck the root, parent custody, all held input descriptors, and all fixed
   input digests before publication; and
8. publish one exclusive mode-`0600` receipt with file and directory durability.

Only `READY_FOR_FORMAL_EVIDENCE` is a Phase A success. Any other state is
diagnostic and carries no verdict. A retry would require a newly authorized
review set with new tasks, nonces, outputs, manifest digest, and attempt
identity.

## 5. Phase B deterministic evidence

Phase B may run only after the exact Phase A success receipt validates against
the same review-set digest, task, nonce, scope, fixed-input set, and declared
Phase A success path. Before Phase B begins, both bound Phase B leaves must be
absent.

The evidence receipt may state
`VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW` only when every deterministic check is
true. It must also state `reviewerMustStillEvaluate: true` and
`qualifyingReviewPass: false`.

The scope assignments are:

- `schema`: canonical JSON/disk grammar, fixed-input grammar, lineage
  precedence, HMG4GL4/HMG4AL3/HMG4PE1/HMG4FR3, receipt schemas, and exact
  denominator/arithmetic checks;
- `adversarial`: review-set ownership, replay, all twelve output leaves,
  relative-path rejection, descriptor snapshots, retained-buffer syntax/test
  execution, parent rename/substitution, descriptor-relative exclusive create,
  durable error handling, and authority escape;
- `whole`: byte 1 through EOF of the v2.17 target and protocol, the direct
  v2.16/v2.15 triplets, v2.14/v2.13/v2.12, v2-v2.6, the complete history, all
  structures and paragraphs, exclusions, and every retained no-authority gate.

There is no same-review-set Phase B retry.

## 6. Failure taxonomy and authenticated error receipts

Only these statuses exist:

```text
READY_FOR_FORMAL_EVIDENCE
PREFLIGHT_RETRYABLE_NOT_EVIDENCE
VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW
EVIDENCE_INPUT_MISMATCH
MECHANICAL_ERROR_NO_VERDICT_NO_RETRY
ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT
```

There is no `USAGE_ERROR` receipt state. A CLI, parsing, input, execution,
close, output collision, or persistence failure is classified by phase. Once
the review set has authenticated, every later error receipt must preserve the
authenticated review binding even if no candidate success receipt was built.

If the intended success receipt cannot be exclusively created, the verifier
may create the separate bound error leaf exactly once. If the error leaf was
already occupied, the parent identity changed, or durability cannot be proven,
the verifier emits `ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT` only to stdout and
exit 74. It never overwrites, removes, truncates, renames, or repairs an
occupant. An error leaf spends the phase and bars later success for that review
set.

## 7. Descriptor-relative receipt creation

The exact verifier retains the validated parent directory descriptor and
passes it as child descriptor 3 to the hash-bound `/usr/bin/python3` writer.
The fixed inline writer consumes the intended receipt bytes on stdin and uses
Python `os.open(leaf, O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW, 0600, dir_fd=3)`.
It writes all bytes, calls `fchmod(0600)`, validates regular-file type, current
UID, link count one, mode `0600`, exact byte count and SHA-256, calls
`fsync(file)`, closes the file, and calls `fsync(3)` on the retained parent.

The Node verifier verifies the system writer identity before use, revalidates
the parent pathname against the held descriptor before and after the child,
and verifies the created pathname against the writer's returned descriptor
identity. A parent rename or substitution can therefore neither redirect the
exclusive create nor be reported as success.

The required current system-writer identity is:

```text
/usr/bin/python3
bytes 118928
mode 0755
uid 0
gid 0
nlink 78
SHA-256 179301dcb41ea78accc3fa0048a7e6f6710d891945a751a34addd622020c1818
```

Any identity drift fails preflight; it is not automatically rebased.

## 8. Retained-buffer syntax and focused-test execution

Syntax checks invoke the bound Node executable as
`node --check --input-type=module -` and supply the retained bytes on stdin.
No fixed-input pathname is passed to the syntax checker.

Focused-test execution takes the exact retained test buffer, requires exactly
one exact relative import of the v2.17 verifier, replaces that specifier in
memory with a base64 `data:text/javascript` URL containing the exact retained
verifier bytes, reports the original and transformed hashes, and invokes
`node --input-type=module -` with the transformed test bytes on stdin. The
test must return zero with no signal and report all required vectors. Zero or
multiple import substitutions fail closed.

## 9. Human conclusion and downstream gate

Each reviewer must independently inspect its assigned scope and record exact
P0/P1/P2 counts. Only one fresh review set with:

```text
schema      0/0/0
adversarial 0/0/0
whole       0/0/0
```

may qualify. Machine readiness, a focused-test pass, or a receipt with zero
deterministic errors is not that conclusion.

Even a qualifying v2.17 review does not itself activate any implementation or
runtime authority. It only permits consideration, under the already-existing
Peter Hu operator authorization, of receipt-gated original-runtime capture for
the exact VB003 EN/ES kits. All Key Terms, missing-source, audio, reconstruction,
promotion, acceptance, integration, release, and publication gates remain
separate and closed.

## 10. Closed effects

Every manifest and every preflight, evidence, error, fixture, and stdout-only
receipt class must carry the same complete `authorityEffects` object with every
value `false`. The verifier contains no apply mode, helper mode, runtime mode,
browser mode, source-recovery mode, reconstruction mode, acceptance mode,
release mode, or publication mode.

This protocol authorizes no current Phase A, Phase B, reviewer task, clean-room
creation, helper action, V28 change, original-runtime capture, or repository
mutation beyond the already-created no-clobber v2.17 authoring package.
