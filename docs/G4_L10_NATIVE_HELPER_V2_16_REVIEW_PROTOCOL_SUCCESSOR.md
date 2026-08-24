# G4 L10 Native Helper v2.16 Independent-Review Protocol Successor

Status: authored review-infrastructure successor awaiting a separate, current, user-authenticated authorization to create any reviewer task or run any Phase A or Phase B command. This file is specification-review infrastructure only. It does not amend the frozen production-helper contract lineage and grants no implementation, helper-test, execution, installation, runtime, migration, acceptance, promotion, integration, release, or publication authority.

## 0. Exact predecessor preimage and no-clobber boundary

This document is a no-clobber successor to the exact v2.15 review-infrastructure set:

```text
protocol-path=docs/G4_L10_NATIVE_HELPER_V2_15_REVIEW_PROTOCOL_SUCCESSOR.md
protocol-SHA-256=2f3161f93209b8ec5ba87d36cd11557fee8790087af60984ca9eefc9923caea7
protocol-bytes=9873

verifier-path=scripts/g4-l10-native-helper-v2_15-review-verifier.mjs
verifier-SHA-256=99e6ec770a74e3a344ddd4138718bc8a04c5032314dc7402b1cd3b937d716b70
verifier-bytes=37369

focused-test-path=scripts/g4-l10-native-helper-v2_15-review-verifier.test.mjs
focused-test-SHA-256=363783b17bcc04556e7121721f6115b8d87ed196a82e51537be3dd3733faf88b
focused-test-bytes=9301
```

The frozen target remains:

```text
absolute-path=/Volumes/WestWorld/HELP MATH 2.0/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256=a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
bytes=50310
LF-count=173
mode=0444
nlink=1
```

The closed v2.14 history remains bound by `reports/g4-l10-native-helper-strict-v2-14-history-closure-v1.json`, SHA-256 `67d10b77decee152a7a6ffeaa13c44708d81d49870dd24bd824afae599d9a6d1`. No v2.14 or v2.15 file may be modified, replaced, relabeled, refreshed, or reused as a qualifying v2.16 result.

No HMG4RB4 or HMG4RB successor may be created. No reviewer task is created by authoring this successor. No Phase A or Phase B command is authorized by authoring or testing it.

## 1. Findings closed by this successor

V2.16 is limited to closing these four v2.15 review-infrastructure findings:

```text
P0 V215-REVIEW-SET-OWNERSHIP-AND-RECEIPT-REPLAY-UNBOUND
P0 V215-PARSED-INPUT-SNAPSHOT-TOCTOU-UNBOUND
P1 V215-CANONICAL-ABSOLUTE-ROOT-IDENTITY-UNBOUND
P1 V215-ERROR-TAXONOMY-AND-FAILED-RECEIPT-PRESERVATION-DIVERGE
```

The v2.15 schema and whole conclusions were individually `0/0/0`; the v2.15 adversarial conclusion was `2/2/0`. The combined v2.15 result remains permanently `NOT SPEC-REVIEW-QUALIFYING`. V2.16 never rewrites or upgrades those results.

## 2. Authenticated review-set manifest

Every future v2.16 review requires a new user-authenticated instruction authorizing exactly three fresh, distinct, user-owned Codex tasks in the fixed order `schema`, `adversarial`, `whole`. After the task system returns all three task IDs, but before a reviewer runs a command, the parent must prepare one exact UTF-8 JSON review-set manifest outside the workspace and deliver its absolute path and SHA-256 to all three tasks.

The manifest is a correlation and anti-replay object only. It is not an authorization token, a PASS, an HMG4RB replacement, or evidence that a task is user-owned. The consolidator must still read each original task directly through the task system and compare the task-system identity with the receipt-bound identity.

The manifest has this closed semantic shape:

```text
schemaVersion=1
artifactType=g4-l10-native-helper-v2-16-authenticated-review-set
authority=correlation-only-never-self-authorizing
protocolVersion=v2.16
sourceThreadId=<nonempty task-system thread ID>
userAuthorizationTurnId=<nonempty task-system turn ID>
userAuthorizationTextSha256=<64 lowercase hex>
reviewSetNonce=<64 lowercase hex freshly supplied in the authenticated start>
canonicalRoot.declared=/Volumes/WestWorld/HELP MATH 2.0
canonicalRoot.resolved=/Volumes/WestWorld/HELP MATH 2.0
canonicalRoot.dev=<canonical unsigned decimal string>
canonicalRoot.ino=<canonical unsigned decimal string>
fixedInputs=<exact ordered bindings required by Section 4>
reviewers=<exactly three ordered reviewer rows>
```

Each reviewer row contains:

```text
scope=<schema|adversarial|whole>
taskSystemId=<nonempty distinct ID without NUL CR LF>
reviewerNonce=<64 lowercase hex unique within the review set>
preflight.attemptOrdinal=1
preflight.successOutput=<absolute reviewer-unique /tmp path>
preflight.errorOutput=<different absolute reviewer-unique /tmp path>
evidence.attemptOrdinal=1
evidence.successOutput=<third absolute reviewer-unique /tmp path>
evidence.errorOutput=<fourth absolute reviewer-unique /tmp path>
```

All four outputs for a reviewer must have one physical mode-`0700`, current-UID-owned, reviewer-unique parent directory under physical `/private/tmp`. No output path may exist before its attempt. No path may be shared across reviewers, scopes, phases, success/error roles, or review sets.

`reviewSetDigest` is SHA-256 of UTF-8 bytes:

```text
G4L10-V216-REVIEW-SET LF
canonical-json(manifest-without-reviewSetDigest) LF
```

The digest and complete manifest SHA-256 enter every authenticated preflight or evidence receipt ID preimage. Each such receipt also binds its exact task ID, assigned scope, reviewer nonce, phase, attempt ordinal, success path, and error path. A receipt from another task, scope, review set, output path, or attempt is invalid even when all contract hashes are unchanged. An error before manifest authentication binds the claimed manifest SHA-256, task, scope, phase and output paths but marks `reviewBindingAuthenticated=false` and keeps the review-set digest and reviewer nonce null. An error after authentication binds the full authenticated review identity and the failed candidate receipt ID when one had already been formed; neither error class can qualify as review evidence.

## 3. Exact canonical root

The only permitted review root is the literal absolute path:

```text
/Volumes/WestWorld/HELP MATH 2.0
```

The verifier must not derive review authority from `import.meta.url`, the current directory, a task worktree, a symlink, an alternate spelling, or a byte-identical clone. It must require all of the following:

1. its own displayed absolute path is exactly `/Volumes/WestWorld/HELP MATH 2.0/scripts/g4-l10-native-helper-v2_16-review-verifier.mjs`;
2. `process.cwd()` is the exact canonical root;
3. `realpath` of the root, verifier, target, protocol, focused test, history closure, predecessors, and every closed-history member equals the fixed absolute path;
4. the retained root descriptor's device/inode identity equals the manifest binding;
5. the pathname's root device/inode still equals the retained root descriptor before and after every input snapshot and before receipt publication; and
6. every input binding and receipt uses an absolute canonical path.

Any task worktree, cloned root, symlink root, renamed root, changed root device/inode, alternate absolute spelling, or relative-only anchor is `EVIDENCE_INPUT_MISMATCH` after formal evidence begins and a non-ready preflight result before it begins.

## 4. One-descriptor, one-buffer input snapshot

Every security-bearing input is opened exactly once for an attempt with `O_RDONLY|O_NOFOLLOW`. The verifier performs `fstat` on that retained descriptor before reading, reads the entire file through the same descriptor, hashes and parses only that exact buffer, performs a second `fstat` on the same descriptor, and keeps the descriptor open until the receipt body is finalized and immediately before its no-clobber publication attempt begins. Publication then uses its own no-clobber descriptor, checked close, and parent-directory sync.

The exact input set is:

1. v2.14 frozen target;
2. v2.16 protocol;
3. v2.16 verifier;
4. v2.16 focused test;
5. v2.13 predecessor;
6. v2.12 ledger source;
7. v2.14 closed-history manifest; and
8. every one of the manifest's seventeen exact allowlisted history artifacts.

The target appears both as a core input and as one history artifact but is opened once and shared by both validations. Duplicate absolute paths or roles fail.

Each `fixedInputs` row binds role, absolute path, resolved path, device, inode, mode, nlink, byte count, LF count, final-LF bit, and SHA-256. Device and inode are canonical unsigned decimal strings. A binding must have `nlink=1`, regular-file type, no symbolic link, expected mode, exact expected bytes and hash, and identical descriptor/path identities before and after the read.

The parser may consume only the stored snapshot buffer. A later pathname `readFile`, `lstat`-then-`readFile`, independent parser reopen, or restored before/after pathname identity cannot support a claim about the first buffer. History discovery is checked before and after snapshot collection against the exact seventeen-member allowlist; all history content is consumed from retained snapshots.

The public Node filesystem API does not expose a true dirfd-relative `openat` traversal. V2.16 therefore does not claim kernel-complete ancestor race closure. It closes the reviewed v2.15 bug by binding the literal root and its descriptor identity, requiring exact manifest device/inode identities, parsing only exact expected-hash descriptor buffers, and rechecking pathname-to-descriptor membership. A future reviewer may still require a separately authorized, minimal, read-only native `openat` inspector. Such an inspector would be review infrastructure only and is neither created nor authorized here; it could never be reused as the production helper.

## 5. Phase A diagnostic preflight

No Phase A run is authorized by authoring v2.16. A later authenticated reviewer instruction must supply the exact manifest path/hash, reviewer task ID, assigned scope, and the two manifest-declared preflight output paths.

The future command grammar is:

```text
node scripts/g4-l10-native-helper-v2_16-review-verifier.mjs preflight --scope <scope> --reviewer-task-id <task-id> --review-set-manifest <absolute-path> --review-set-manifest-sha256 <sha256> --success-output <absolute-path> --error-output <absolute-path>
```

Preflight remains diagnostic and not formal evidence. It checks the exact eight macOS-native tools, Node and focused-test syntax, embedded codec/receipt self-tests, fixed root, complete manifest grammar, exact task/scope row, output custody, and all fixed input snapshots. A ready result is `READY_FOR_FORMAL_EVIDENCE`; it is bound to one task, one scope, one review set, and one exact evidence output pair.

The focused test is also pre-evidence, but it must not invoke the canonical Phase A or Phase B CLI during successor authoring. It uses only exported test seams and isolated `/tmp` fixtures. A passing focused test is not a review result.

## 6. Phase B deterministic evidence

No Phase B run is authorized by authoring v2.16. A later authenticated reviewer may run Phase B exactly once only after its own task/scope-bound current `READY_FOR_FORMAL_EVIDENCE` receipt exists.

The future command grammar is:

```text
node scripts/g4-l10-native-helper-v2_16-review-verifier.mjs evidence --scope <scope> --reviewer-task-id <task-id> --review-set-manifest <absolute-path> --review-set-manifest-sha256 <sha256> --preflight-receipt <manifest-declared-path> --success-output <manifest-declared-path> --error-output <manifest-declared-path>
```

Evidence re-snapshots the complete input set, requires the same manifest/root/input device-inode/content bindings, validates the exact task/scope preflight receipt, and repeats HMG4GL4, HMG4AL3, all 42 HMG4PE1 paragraphs, HMG4FR3, ordered sections, exact history, V28, sixteen missing MP3s, protocol markers, and closed authority.

`VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW` remains a deterministic input status, never a human PASS. Each task independently evaluates its assigned scope without reading sibling conclusions.

## 7. Closed taxonomy and durable error receipts

V2.16 has exactly these outcome states:

- `READY_FOR_FORMAL_EVIDENCE`: successful diagnostic preflight only.
- `PREFLIGHT_RETRYABLE_NOT_EVIDENCE`: a preflight invocation, tool, syntax, manifest, root, snapshot, or output-custody failure; no formal evidence began.
- `VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW`: successful Phase B deterministic input verification only.
- `MECHANICAL_ERROR_NO_VERDICT_NO_RETRY`: Phase B could not complete for an invocation, I/O, resource, output-collision, or internal mechanical reason.
- `EVIDENCE_INPUT_MISMATCH`: Phase B completed enough to determine that a review-set, receipt, root, target, protocol, verifier, test, history, predecessor, grammar, hash, encoding, lineage, or authority input did not match.
- `ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT`: the verifier could not durably create its manifest-declared no-clobber error receipt; stdout is supplemental only and the task cannot conclude.

`USAGE_ERROR` is not a v2.16 status.

Every invocation predeclares distinct `--success-output` and `--error-output` paths. A fully durable success creates only the success receipt. A failure before the success path is created creates only the error receipt when that path is safely recoverable. If success-path publication fails after `O_EXCL` creation, the created candidate is left immutable and the separate error receipt binds its candidate receipt ID and publication failure; the attempt is nonqualifying whenever both declared paths exist. Both publications use `O_CREAT|O_EXCL|O_NOFOLLOW`, mode `0600`, file sync, checked close, and parent-directory sync. Existing foreign occupants and incomplete candidates are never overwritten, truncated, chmodded, moved, or removed.

An error receipt binds the recovered review-set hash if available, task, scope, phase, attempt ordinal, both output paths, command class, exit status, taxonomy, failed candidate receipt ID if formed, authenticated-binding bit, and bounded error details. It never asserts an evidence conclusion.

There is no same-review-set Phase B retry. Any Phase B error or mismatch leaves the reviewer task nonqualifying for that review set. A later retry requires a new current user-authenticated instruction, a fresh manifest nonce and output set, and whatever fresh task set that instruction requires. Earlier attempts remain immutable and disclosed.

## 8. Focused-test boundary and required negative vectors

The v2.16 focused test may import explicitly exported pure/test-seam functions. It must not invoke the canonical `preflight` or `evidence` CLI, create a formal receipt for the canonical root, write inside the workspace, or represent a fixture as user-owned evidence.

Its minimum negative vectors are:

1. cross-scope preflight reuse;
2. reviewer task/scope mismatch;
3. ordered-task-set substitution;
4. different authenticated-start nonce replay;
5. mixed review-set receipts;
6. reused output or attempt path;
7. cloned, symlinked, alternate, or changed canonical root;
8. leaf pathname/descriptor identity substitution;
9. parser-buffer/digest substitution;
10. target, protocol, predecessor, history-manifest, and history-member replacement;
11. usage/taxonomy consistency;
12. durable error receipt on success-output collision;
13. fail-closed behavior when the error receipt cannot be preserved; and
14. closed authority in every receipt class.

The v2.15 expectations that one preflight supports all three scopes and that a repeated Phase B receipt is accepted are explicitly rejected.

## 9. Consolidation and fresh review

V2.16 authoring creates no reviewer tasks. A future review requires a separate current user instruction for the exact frozen v2.16 protocol, verifier, focused-test and v2.14 target identities.

The consolidator must obtain all three original task-system conclusions and verify:

- exactly three fresh distinct user-owned task IDs in schema/adversarial/whole order;
- one exact shared review-set manifest SHA-256 and digest;
- one distinct manifest-bound task/scope/reviewer nonce row per output;
- exact canonical root path and device/inode identity;
- complete matching descriptor-snapshot input set;
- one Phase A and at most one Phase B attempt per task;
- every success or error receipt and no unpreserved attempt;
- no sibling conclusion dependency;
- explicit P0/P1/P2 and complete findings; and
- unchanged frozen target identity.

Only three independent `0/0/0` conclusions with an empty finding union may be called `spec-review-qualified`. That status still has no implementation or runtime authority.

## 10. Retained V28, Grade 4, and closed authority

V28 remains unresolved: operational freeze false; 57 writable files; 48 native members; nine non-Gate-A top-level runners; 553,897 bytes; checksum-set SHA-256 `cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`; native-root mode `0755`. V2.16 authorizes no V28 change.

The sixteen Grade 4 missing MP3s remain unresolved. No v7/v8 intake object is promoted. No source, SQL/course map, 12-lesson order, page, quiz, Key Term, EN/ES binding, audio binding, migration workspace, renderer, behavior test, visual/RMSE evidence, original-runtime baseline, human review, owner acceptance, strict-completion state, whole-course integration, release, or publication state changes.

This protocol, its verifier, its focused test, any review-set manifest, receipt, task, review, or future `spec-review-qualified` conclusion cannot authorize production-helper implementation or test, protected installation, helper execution, apply, recover, original-runtime launch, acceptance, promotion, integration, release, or publication. No repository-local artifact or apparent PASS can self-authorize.

Peter Hu's named original-runtime operator status remains inactive. It can be activated only after every retained contract, V28, clean-room, production-helper implementation, independent implementation-security review, disposable-offline-environment, and per-launch receipt gate is separately satisfied and expressly authorized. Its scope remains limited to the exact EN/ES capture kits for `migrations/course-g04-l10-vb-003`.
