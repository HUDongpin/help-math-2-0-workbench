# Grade 4 Lesson 10 native-helper v2.17 no-clobber security successor

Date: 2026-08-07  
Status: **AUTHORING-ONLY SECURITY TARGET — NOT INDEPENDENTLY REVIEWED — NO AUTHORITY ACTIVATED**

This file is a new, additive, no-clobber successor. It does not edit, relabel,
repair, or erase v2.14, v2.15, v2.16, any HMG4RB4 history member, or any failed
receipt. Its review target is the exact byte sequence of this file together
with the complete fixed-input closure required by the companion v2.17 review
protocol.

## 0. Precedence and exact predecessor boundary

The direct security predecessor is:

```text
/Volumes/WestWorld/HELP MATH 2.0/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256 a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
```

The direct review predecessors are the exact v2.15 and v2.16 protocol,
verifier, and focused-test triplets. They are evidence inputs only. No prior
review result is carried forward as a v2.17 result.

This successor changes the operative lineage rule as follows:

1. v2.13 Section 4 is the sole operative clean-room rule.
2. v2.12 Section 6 is explicitly retired and non-operative for v2.17.
3. Any v2.14 language that retained v2.12 Section 6 or simultaneously treated
   both v2.12 Section 6 and v2.13 Section 4 as operative is superseded by items
   1 and 2 above.
4. v2.12 Sections 0, 2, 3, 5, and 7 remain historical security inputs only to
   the extent that they do not conflict with this file or v2.13 Section 4.
5. v2.14 Sections 1, 2, 3, and 5 remain review inputs. v2.14 Section 4 is
   retained only for its V28 state and no-authority facts; its clean-room
   incorporation language is superseded by this section.
6. A conflict is resolved in this order: this v2.17 file; v2.13 Section 4;
   non-conflicting v2.14 provisions; non-conflicting retained predecessors.

Nothing in this precedence rule repairs or converts a historical receipt. The
frozen v2.14 history remains `STRICT_BUT_NONQUALIFYING_CLOSED`.

## 1. One clean-room model

The only admissible future native-helper clean room is the disposable,
offline, no-repository clean room defined by v2.13 Section 4. In particular:

- repository-local execution is prohibited;
- a repository clone, linked checkout, worktree, bind mount, or path alias is
  not a clean room;
- the clean room may receive only the exact, independently reviewed export
  explicitly allowed by a later user authorization;
- no repository credentials, network access, package-manager activity,
  browser control, Flash runtime, Ruffle runtime, Adobe runtime, or unrelated
  source tree may enter the clean room;
- a clean-room run cannot authorize itself, the helper, a repository write, a
  runtime capture, or acceptance;
- no current v2.17 action creates that clean room or authorizes an export to
  it.

The older v2.12 workspace-only procedure is not an alternative path. It cannot
be selected by a reviewer, verifier, operator, script, receipt, or later
convenience interpretation.

## 2. Review target and fixed-input closure

The v2.17 independent review must bind every input by canonical absolute path,
retained-descriptor identity, byte count, mode, link count, SHA-256, LF count,
and final-LF state. The exact ordered closure is defined in the companion
review protocol and must include, without omission:

- this v2.17 security target, protocol, verifier, and focused test;
- the exact v2.16 protocol, verifier, and focused test;
- the exact v2.15 protocol, verifier, and focused test;
- v2.14, v2.13, and v2.12;
- every production-security contract from v2 through v2.6;
- the v2.14 history closure and each of its exact unique members.

The verifier must reject an alternate root, a relative CLI path, a symlink,
an unexpected hard link, a path-to-descriptor substitution, an input-set
reordering, an omitted direct predecessor, an omitted production contract, an
extra fixed input, or a byte/metadata mismatch. A manifest that merely binds
modified predecessor bytes is insufficient: predecessor hashes fixed in the
verifier must also match.

All parsing, structural checks, syntax checks, and focused-test execution must
consume retained in-memory buffers. A check must not reopen a fixed input by
pathname after its snapshot. Any controlled import substitution used only to
execute the focused test must be deterministic, digest-reported, and derived
only from the retained verifier and test buffers.

## 3. Authenticated review-set and attempt lifecycle

Exactly three new user-owned reviewer tasks are required for any later formal
v2.17 review set, in this order and with distinct task-system IDs, reviewer
nonces, and reviewer-owned output directories:

```text
schema
adversarial
whole
```

The review-set manifest is correlation-only and never self-authorizing. The
manifest must bind the exact user authorization text hash, source task ID,
authorization-turn ID, review-set nonce, canonical-root device/inode, fixed
inputs, ordered task IDs, scopes, nonces, and the one preflight and one evidence
output pair for each reviewer.

Authentication occurs only after the manifest digest, canonical serialization,
root binding, fixed shape, exact task/scope binding, and reviewer custody have
all validated. After that point, every error receipt must preserve the
authenticated review-set digest, reviewer nonce, task ID, scope, manifest hash,
and output binding even when later collection, parsing, syntax, test, close,
publication, or persistence fails.

For each phase, both the declared success leaf and the declared error leaf must
be absent before the attempt begins. Either pre-existing leaf permanently
spends that phase for the review set. Creation is exclusive and no-clobber.
There is no same-review-set Phase B retry. An evidence error followed by a
later success receipt under the same review-set digest, task, scope, phase, and
attempt ordinal is invalid even if the underlying cause is corrected.

Preflight is diagnostic only. Evidence is deterministic input preparation
only. Neither is a human review conclusion. Machine success cannot populate a
reviewer's P0/P1/P2 counts or substitute for reading the assigned scope.

## 4. Receipt serialization, custody, and durability

All review-set manifests and receipts use the exact canonical JSON and
on-disk serialization grammar defined in the companion v2.17 review protocol.
The verifier must reject duplicate-key spellings, non-domain values,
non-canonical key order, non-canonical whitespace, CR bytes, missing final LF,
or any byte sequence that does not round-trip to the required serialization.

Receipt outputs must be direct children of three distinct physical `/tmp`
directories. Each directory must be owned by the current UID, mode `0700`, and
held open by a retained directory descriptor. Receipt creation must be relative
to that descriptor through an `openat`-equivalent primitive with exclusive
create and no-follow semantics; pathname-only creation is prohibited.

Before and after creation, the declared parent pathname must resolve to the
held directory identity. The created receipt must be a current-UID-owned,
single-link regular file at mode `0600`, with the exact intended byte count and
SHA-256. The file must be flushed before close and the retained parent
descriptor must be flushed before success is reported. A post-create identity,
mode, link, byte, hash, parent, file-sync, or directory-sync failure is a
mechanical failure with no verdict. It never permits overwrite, unlink,
replacement, or retry under the same review set.

## 5. Required focused negative vectors

Before formal evidence can be called ready, the exact retained v2.17 focused
test bytes must execute successfully against the exact retained v2.17 verifier
bytes. At minimum, the test must demonstrate all of these categories:

1. cross-scope task reuse rejection;
2. ordered task substitution rejection;
3. review-set nonce replay rejection;
4. mixed review-set receipts and alternate output paths rejection;
5. reused output or attempt rejection, including error-then-success;
6. clone, symlink, hard-link, root, and pathname-substitution rejection;
7. parser-buffer and retained syntax-buffer binding;
8. target, protocol, direct-predecessor, production-contract, and history
   replacement rejection;
9. failure-taxonomy closure;
10. success-output collision with one separate durable error receipt;
11. preoccupied error output and unpreserved-error fail-closed behavior;
12. authenticated binding preservation after authentication;
13. held-parent rename/substitution detection with descriptor-relative create;
14. closed authority for every receipt class.

A syntax-only pass is insufficient. An unexecuted test file is insufficient.

## 6. Retained operational state and closed authority

This successor preserves the following unresolved state and does not improve
it:

- V28 operational freeze is false.
- V28 retains 57 writable mode-`0644` files, 48 native members, nine
  non-Gate-A top-level runners, 553,897 total bytes, checksum-set SHA-256
  `cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`,
  and native-root mode `0755`.
- The sixteen missing Grade 4 MP3s remain unresolved.
- `Polynomial.swf` remains unresolved.
- The Key Terms 17 exact-placement records and 299 case-variant records remain
  outside this review and require separate explicit placement/receipt review
  authorization.
- The frozen v7/v8 ledger has been exhausted and cannot be used to infer a
  source hash from a filename, case variant, FLA, or adjacent file.

Every v2.17 manifest and receipt class must set every authority effect to
false, including permission transition, helper implementation, helper test,
helper execution, original-runtime capture, runtime acceptance, current-JS
acceptance, Flash fidelity, audio acceptance, human acceptance, owner
acceptance, strict completion, source promotion, integration, release, and
publication.

No repository-local PASS, receipt, controller, companion, publisher, generated
artifact, or reviewer task can self-authorize. This successor does not itself
authorize a permission transition, helper implementation, helper test, helper
execution, original-runtime capture, runtime evaluation, canonical source
promotion, or any acceptance/release action.

## 7. Gate after a future independent review

This authoring package does not satisfy the review gate. A later, explicitly
authorized, fresh v2.17 review set qualifies only if all three independent
reviewers return exact P0/P1/P2 counts of `0/0/0` and all receipts validate as
one authenticated, unspent, durable review set.

Only after that condition may the already-existing Peter Hu operator
authorization be considered for receipt-gated original-runtime capture of the
exact VB003 EN/ES kits. That conditional possibility does not activate the
operator here and does not extend to any other kit, Key Terms placement,
missing MP3, `Polynomial.swf`, reconstruction, discovery, source promotion,
acceptance, release, or publication.

Peter Hu's named original-runtime operator status remains inactive.

