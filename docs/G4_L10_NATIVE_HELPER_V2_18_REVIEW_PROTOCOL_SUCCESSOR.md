# G4 L10 native-helper v2.18 live-control-plane-authenticated, locally capability-bound independent-review protocol

Date: 2026-08-09

Protocol status: authoring successor; no review conclusion; no runtime authority

Reviewer-task identity is authenticated only by the live Codex control-plane
route observed by the parent coordinator. The local verifier validates
capability possession and evidence bindings but always reports
`taskIdentityAuthenticatedLocally=false`.

This protocol applies only to the exact security target:

```text
/Volumes/WestWorld/HELP MATH 2.0/docs/G4_L10_NATIVE_HELPER_V2_18_SECURITY_CONTRACT_SUCCESSOR.md
bytes 19071
LF count 384
final LF true
SHA-256 9af094ee41340fa15620f3c03c6fe75c5f87bfeda503298b386d9763a01f778a
```

The target, this protocol, the verifier, and the focused test form a new v2.18
authoring package. v2.17 and its review outputs remain preserved evidence and
do not become v2.18 conclusions.

## 1. Frozen files and canonical root

All formal review commands run with this exact cwd and root literal:

```text
/Volumes/WestWorld/HELP MATH 2.0
```

The task may be hosted by a Codex worktree, but no worktree spelling may replace
the canonical root. The manifest binds the canonical root's declared path,
resolved path, device, and inode.

The verifier path is exactly:

```text
/Volumes/WestWorld/HELP MATH 2.0/scripts/g4-l10-native-helper-v2_18-review-verifier.mjs
```

The focused test path is exactly:

```text
/Volumes/WestWorld/HELP MATH 2.0/scripts/g4-l10-native-helper-v2_18-review-verifier.test.mjs
```

## 2. Exact canonical JSON and HMAC domain

Canonical JSON admits only:

- `null`;
- booleans;
- strings without unpaired UTF-16 surrogates;
- safe integers other than negative zero;
- dense arrays;
- plain objects with lexicographically sorted keys.

It rejects floating point values, NaN, infinity, BigInt, undefined, sparse
arrays, cycles, exotic prototypes, and keys containing NUL/CR/LF. Canonical
disk JSON is two-space pretty JSON followed by exactly one LF. All exact-key
schemas reject extra or missing fields recursively.

The public review-set digest is:

```text
SHA-256(UTF8("G4L10-V218-REVIEW-SET\n" || canonicalJson(body) || "\n"))
```

where `body` is the manifest without `reviewSetDigest`.

The task capability commitment is:

```text
SHA-256(UTF8(
  "G4L10-V218-TASK-CAPABILITY\n" ||
  reviewSetNonce || "\n" ||
  taskSystemId || "\n" ||
  taskHostId || "\n" ||
  reviewerNonce || "\n" ||
  scope || "\n" ||
  phase || "\n" ||
  canonicalJson(outputParent) || "\n" ||
  successOutput || "\n" ||
  errorOutput || "\n" ||
  capabilityPreimage || "\n"
))
```

The capability preimage is exactly 64 lowercase hex characters generated from
32 CSPRNG bytes. It is delivered only through the assigned Codex task message
and never appears in the manifest or a receipt.

Every terminal receipt has exact top-level field `receiptMac`. Its value is:

```text
HMAC-SHA-256(
  key = hexDecode(phaseCapabilityPreimage),
  message = UTF8("G4L10-V218-" || kind || "\n" || canonicalJson(body) || "\n")
)
```

where `body` is the exact receipt without `receiptMac` and `kind` is one of
`PREFLIGHT`, `EVIDENCE`, or `ERROR`. Public SHA-256 values are content digests,
not author authentication. The coordinator also knows every capability, and a
capability appears in the literal formal command; the MAC is therefore not a
reviewer-independence proof or persistent one-shot ledger. A HMAC-valid local
receipt is nonqualifying without the exact bound task's live control-plane
history and routed conclusion.

## 3. Exact ordered fixed-input closure

The manifest's first 25 fixed-input rows are exactly:

```text
target|docs/G4_L10_NATIVE_HELPER_V2_18_SECURITY_CONTRACT_SUCCESSOR.md|9af094ee41340fa15620f3c03c6fe75c5f87bfeda503298b386d9763a01f778a
protocol|docs/G4_L10_NATIVE_HELPER_V2_18_REVIEW_PROTOCOL_SUCCESSOR.md|bound-by-review-set
verifier|scripts/g4-l10-native-helper-v2_18-review-verifier.mjs|bound-by-review-set
focused-test|scripts/g4-l10-native-helper-v2_18-review-verifier.test.mjs|bound-by-review-set
v2.17-target|docs/G4_L10_NATIVE_HELPER_V2_17_SECURITY_CONTRACT_SUCCESSOR.md|bbeb9bfb7a436e6144026b18b8c3629af192a0cf035f87bd0de26484bf346ef3
v2.17-protocol|docs/G4_L10_NATIVE_HELPER_V2_17_REVIEW_PROTOCOL_SUCCESSOR.md|7d4fd2861d53f57c1d1ee06b006784fbf1933739a92ec04733c4364723460f44
v2.17-verifier|scripts/g4-l10-native-helper-v2_17-review-verifier.mjs|20bdbd5e481f898d5c64c89b6487bd0c6ad125c547e96ff66ad8c6c6f6723bf0
v2.17-focused-test|scripts/g4-l10-native-helper-v2_17-review-verifier.test.mjs|f25d0b78eff61f9184baddf10da6fee467e69cc53be9b0c63a91b8d4897cf8d1
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

The history closure contributes exactly its 16 sorted, nonduplicate artifact
rows after the core. The total fixed-input count is 41. Every row binds exact
absolute path, resolved path, device, inode, mode, link count, bytes, LF count,
final-LF boolean, and SHA-256.

## 4. Runtime executable closure

The manifest contains exactly three runtime executable rows in this order:

1. `env` for `/usr/bin/env`;
2. `node` for the exact absolute Node executable used by the task command;
3. `python` for `/usr/bin/python3`.

Each row binds exact path, realpath, device, inode, uid, gid, mode, link count,
bytes, and SHA-256. Each executable is opened with `O_NOFOLLOW`, read and hashed
through one retained descriptor, compared with the fresh pathname, and checked
again after every child invocation.

## 5. Exact manifest schema

The manifest has exactly:

```text
schemaVersion
artifactType
authority
protocolVersion
attestationMode
portableTaskSystemSignatureAvailable
localFilesSelfAuthenticateTaskIdentity
qualificationRequiresBoundThreadObservation
attemptLedger
sourceThreadId
userAuthorizationTurnId
userAuthorizationTextSha256
reviewSetNonce
canonicalRoot
runtimeExecutables
fixedInputs
reviewers
reviewSetDigest
```

Required literal values are:

```text
schemaVersion = 2
artifactType = g4-l10-native-helper-v2-18-live-control-plane-bound-review-set
authority = correlation-and-capability-only-never-self-authorizing
protocolVersion = v2.18
attestationMode = live-codex-control-plane
portableTaskSystemSignatureAvailable = false
localFilesSelfAuthenticateTaskIdentity = false
qualificationRequiresBoundThreadObservation = true
attemptLedger = codex-task-history
```

`canonicalRoot` has exactly `declared`, `resolved`, `dev`, `ino`.

Each reviewer row has exactly:

```text
scope
taskSystemId
taskHostId
reviewerNonce
outputParent
preflight
evidence
```

The reviewer order is exactly `schema`, `adversarial`, `whole`. Task IDs,
thread/host pairs, reviewer nonces, output-parent device/inode pairs, and all
output paths are pairwise distinct. Task ID and host ID are correlation fields
on disk; task identity is established only by live control-plane routing.

`outputParent` has exactly:

```text
declaredPath
resolvedPath
dev
ino
uid
gid
mode
nlink
mtimeNs
ctimeNs
birthtimeNs
```

At manifest freeze its literal mode is `0700`, its link count is two, its UID
is the coordinator UID, it is one physical directory directly below physical
`/tmp`, and its inventory is empty.

Each phase has exactly:

```text
attemptOrdinal
phaseCapabilityCommitment
successOutput
errorOutput
```

`attemptOrdinal` is one. The four leaves of one reviewer are direct children of
its declared output parent and have distinct canonical basenames. Across all
reviewers exactly twelve distinct output paths exist.

## 6. Exact sanitized formal invocation

The coordinator substitutes only values already frozen by the manifest and the
assigned private capability. The command prefix is literal:

```text
/usr/bin/env -i \
PATH=/usr/bin:/bin:/usr/sbin:/sbin \
LANG=C \
LC_ALL=C \
TMPDIR=/tmp \
HOME=/var/empty \
__CF_USER_TEXT_ENCODING=0x1F5:0x0:0x0 \
/Users/peter/.local/share/node-v24.18.0-darwin-arm64/bin/node \
/Volumes/WestWorld/HELP\ MATH\ 2.0/scripts/g4-l10-native-helper-v2_18-review-verifier.mjs
```

Phase A appends exactly:

```text
preflight
--scope <assigned-scope>
--reviewer-task-id <assigned-task-system-id>
--phase-capability <private-preflight-capability>
--review-set-manifest <absolute-manifest-path>
--review-set-manifest-sha256 <manifest-sha256>
--success-output <assigned-preflight-success-leaf>
--error-output <assigned-preflight-error-leaf>
```

Phase B appends exactly:

```text
evidence
--scope <assigned-scope>
--reviewer-task-id <assigned-task-system-id>
--phase-capability <private-evidence-capability>
--preflight-capability <private-preflight-capability>
--review-set-manifest <absolute-manifest-path>
--review-set-manifest-sha256 <manifest-sha256>
--preflight-receipt <assigned-preflight-success-leaf>
--success-output <assigned-evidence-success-leaf>
--error-output <assigned-evidence-error-leaf>
```

No shell alias, variable substitution, equivalent command, redirected error,
suppressed exit status, retry, or corrected invocation is admissible.

At startup the verifier requires exact cwd, `process.execPath`, empty
`process.execArgv`, and this exact environment object:

```text
HOME=/var/empty
LANG=C
LC_ALL=C
PATH=/usr/bin:/bin:/usr/sbin:/sbin
TMPDIR=/tmp
__CF_USER_TEXT_ENCODING=0x1F5:0x0:0x0
```

Darwin injects `__CF_USER_TEXT_ENCODING` for UID 501 even after `env -i`; the
literal command supplies and the verifier requires its exact observed value
rather than silently dropping it. Any additional or changed environment key is
an authentication failure. This outer `/usr/bin/env -i` is mandatory because a
verifier cannot undo code already loaded by ambient `NODE_OPTIONS`.

The capability values in the literal commands are one-use phase binders, not
an OS-level secrecy boundary. Same-UID observation or replay can cause denial
of service but cannot create a qualifying reviewer conclusion without the
exact routed result and unique task history of the bound reviewer task.

## 7. Local parent-state and two-leaf reservation; control-plane attempt spend

Phase A prestate is the exact manifest-bound empty output parent. Phase B
prestate is the exact Phase A post-reservation parent binding and two-entry
inventory recorded in the capability-MAC-valid Phase A receipt.

The first frozen phase dispatch retained in the bound Codex task history is
the authoritative attempt-start and spent record. The local parent and leaf
transitions below provide custody and fail-closed drift evidence; they do not
create task identity and are not the sole no-retry ledger.

For either phase, the verifier:

1. opens and retains the manifest, root, parent, runtime, and all fixed-input
   descriptors;
2. validates the phase capability commitment in constant time;
3. validates the required prestate parent binding and exact inventory;
4. descriptor-relatively creates both success and error leaves with
   `O_CREAT|O_EXCL|O_NOFOLLOW` and mode `0600`;
5. syncs both empty files and the parent directory;
6. records both reserved leaf device/inode bindings and the exact new parent
   stat, including ctime;
7. only then enters local capability-bound attempt state;
8. evaluates the phase;
9. writes the selected terminal receipt into its owned zero-byte leaf;
10. leaves the unused sibling as a zero-byte reservation;
11. fsyncs the terminal file and parent and checks all bindings again.

If creating either leaf fails, the local reservation is absent or partial, but
the phase remains spent because its task-system dispatch already occurred. The
verifier never unlinks a reservation. If the first leaf was created and the
second fails, the first remains as additional invalidation evidence.

Parent ctime, device/inode, birthtime, and exact inventory are local
tamper/replay signals. They ordinarily detect deletion, recreation, or a
different-inode parent replacement, but do not prove interval continuity,
exclude rename-away-and-restore by endpoint equality, or independently provide
a same-UID irreversible ledger.
The authoritative spend event is delivery of the one frozen phase prompt in
the manifest-bound Codex task history. A deleted local leaf never reopens that
event. If the exact thread/host history is missing, truncated, ambiguous, or
unavailable, the unit is `NO_VERDICT` even when local files appear valid.

## 8. Descriptor-relative receipt creation

The fixed Python writer runs only as:

```text
/usr/bin/python3 -I -S -E -c <fixed-inline-program>
```

It receives the already-open parent descriptor as fd 3, uses only the two
assigned basenames, opens both pre-reserved leaves with `O_NOFOLLOW`, checks
the selected zero-byte inode and the exact sibling inode/content binding,
writes every candidate byte only to the selected inode, sets mode `0600`,
fsyncs, rereads both leaves, verifies both byte counts and SHA-256 values,
closes, and fsyncs fd 3. It uses this exact child environment and `/var/empty`
cwd:

```text
HOME=/var/empty
LANG=C
LC_ALL=C
PATH=/usr/bin:/bin:/usr/sbin:/sbin
TMPDIR=/tmp
```

The writer executable is hash-checked before and after use. A child error,
nonzero exit, signal, timeout, malformed metadata, short write, fsync failure,
close failure, pathname mismatch, or parent drift is mechanical.

## 9. Retained inputs and publication revalidation

Every input is parsed only from its retained Buffer. Before terminal
publication and again before reporting success, the verifier:

- re-fstats every retained descriptor;
- rereads from offset zero with positional reads;
- proves exact byte count and no extra byte;
- compares the original bytes and SHA-256;
- re-lstats each pathname and compares its device/inode and stable stat;
- rechecks canonical realpaths;
- rescans the exact history discovery set;
- rechecks root and parent descriptors/pathnames;
- rechecks the exact phase inventory.

All descriptors remain open until terminal publication and checked close. If a
post-publication recheck fails, the opposite reserved leaf receives a
capability-MAC-bound mechanical no-verdict receipt when mechanically possible.
That receipt still reports `taskIdentityAuthenticatedLocally=false`. The
presence of both terminal receipts invalidates the unit; a success leaf never
overrides a paired error leaf.

## 10. Isolated retained-buffer execution

The verifier imports retained module bytes through fresh Worker isolates inside
the already validated formal Node process. Workers have empty `execArgv`, the
exact minimal environment, captured stdout/stderr limits, and no repository
pathname import. Verifier syntax/evaluation uses a `data:` module directly.
Focused-test execution substitutes the one exact verifier import with a
`data:` URL containing the retained verifier bytes, imports the transformed
test as a second `data:` module, and waits for the Worker test summary.

This design does not execute a second replaceable Node pathname. Worker error,
timeout, termination, or output overflow is mechanical; a successfully loaded
module with a deterministic syntax/test assertion failure is an input mismatch.
Stable results exclude timing and other ambient data. Phase B reruns all Phase
A deterministic checks; it does not trust a subset of Phase A fields.

## 11. Exact local capability state machine

The local verifier states are:

```text
UNPARSED
MANIFEST_VALIDATED
TASK_CAPABILITY_VALIDATED
ROOT_BOUND
INPUTS_COLLECTED
PARENT_PRESTATE_VALIDATED
LEAVES_RESERVED
CAPABILITY_CONTEXT_BOUND
EVALUATED
PUBLISHED
CLOSED
```

Only the `LEAVES_RESERVED -> CAPABILITY_CONTEXT_BOUND` transition creates the
opaque local capability context. It never authenticates Codex task identity;
every local receipt carries `taskIdentityAuthenticatedLocally=false` and
`taskTransportAuthenticationRequired=true`. Failures in manifest, capability,
parent prestate, root, fixed-input collection, or leaf reservation have no
capability context. Errors after that transition retain the capability binding.

At orchestration level, the coordinator must observe the exact manifest-bound
thread ID and host ID, the single frozen prompt event, exactly one literal
verifier-command execution for each dispatched phase, and the routed response.
It records the exact command digest, exit status, selected receipt path,
receipt SHA-256/MAC, and publication metadata. That live observation alone can set
`taskTransportObserved=true`; no local JSON file or parent-authored statement
may do so. The prompt event permanently spends the phase even when the local
verifier never starts or never publishes a receipt.

`taskTransportObserved` is orchestration-time evaluation state in the live
parent task only. It is not a manifest field, receipt field, portable
attestation, or disk value that a later verifier may trust.

Control-plane history non-rewrite and completeness are explicit TCB
assumptions, not a portable task-system signature guarantee. If the coordinator
cannot establish those assumptions for the exact task/host route and command
history, the unit is `NO_VERDICT`.

Unbound diagnostics may echo CLI values only under fields named
`untrustedRecovered*`. No local state transition sets task identity to
authenticated, and task-system authentication remains required.

## 12. Exact failure taxonomy

The statuses and default exit codes are:

```text
READY_FOR_FORMAL_EVIDENCE|0
VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW|0
PREFLIGHT_INPUT_MISMATCH_NO_VERDICT_NO_RETRY|3
EVIDENCE_INPUT_MISMATCH|3
UNAUTHENTICATED_INVOCATION_NO_VERDICT|77
ATTEMPT_STATE_MISMATCH_NO_VERDICT_NO_RETRY|78
MECHANICAL_ERROR_NO_VERDICT_NO_RETRY|70
ATTEMPT_RECEIPT_UNPRESERVED_NO_VERDICT|74
```

Only `EvidenceInputMismatch` maps to an input-mismatch status. Filesystem,
child, writer, output, fsync, close, timeout, and persistence failures map to
mechanical. Authentication and attempt-state failures retain their own status.
There is no retry in the same review set after any literal command is executed.
This no-retry rule is enforced by the bound Codex task history, not by leaf
presence or ctime alone. The first frozen phase dispatch spends the phase even
when the literal command fails before local leaf reservation.

## 13. Phase A exact result

Phase A validates the assigned capability, binds the complete input and
runtime closure, consumes both leaves, verifies the isolated startup state,
system writer, embedded self-tests, syntax of the retained verifier/test,
retained-buffer focused tests, target/protocol structure, frozen lineage,
history closure, and closed authority.

Only a terminal HMAC-valid receipt with status
`READY_FOR_FORMAL_EVIDENCE`, exact recursive schema, complete stable check set,
and no paired error leaf permits Phase B. Machine readiness is diagnostic and
is not the task's review conclusion.

## 14. Phase B exact result

Phase B first verifies the complete Phase A receipt bytes, recursive schema,
HMAC, reservation bindings, parent transition, fixed-input closure, every
Phase A check, and exact deterministic recomputation. It then consumes both
Phase B leaves and produces one scope-specific deterministic evidence receipt.

The scope focus is:

- `schema`: exact grammar, schemas, HMG structures, lineage, MAC and state
  transitions;
- `adversarial`: all six v2.17 findings, capability substitution, parent/ctime
  replay, two-leaf races, input drift, hostile startup, auth timing, typed
  failures, and authority escape;
- `whole`: byte 1 through EOF of every fixed input, complete lineage and
  exclusions, and no authority expansion.

Only status `VERIFIED_INPUTS_READY_FOR_HUMAN_REVIEW` is a machine evidence
result. The task must still perform an independent human review and report its
own `P0/P1/P2` conclusion.

## 15. Independent task rules

Exactly three fresh user-visible tasks are created in order
`schema -> adversarial -> whole`. Each begins on HOLD. After the manifest is
frozen, each task first receives only its assigned Phase A scope, thread/host
binding, Phase A capability, Phase A leaves, literal Phase A command, and
complete fixed-input directions. Only after a qualifying Phase A routed result
may the coordinator send that same task one Phase B message containing the
evidence capability, the Phase A capability needed for MAC verification, the
Phase B leaves, and the literal Phase B command. Supplying Phase B material
earlier invalidates the unit.

The manifest also binds each task's actual host ID. The coordinator must use
the exact thread/host pair for message delivery and result observation. A
second phase message, corrected command, retry, sibling-routed response, or
unreadable task history permanently invalidates that unit; local capability or
receipt validity cannot repair it.

For each dispatched phase the retained bound-task history must show exactly one
literal verifier-command execution. The task conclusion must report the
command digest, exit status, selected receipt path, receipt SHA-256/MAC, and
final publication metadata. A valid local receipt without that exact routed
execution record is nonqualifying.

The final routed task conclusion has at least these exact semantic fields:

```text
reviewSetDigest
scope
phase
attemptOrdinal
literalCommandSha256
selectedReceiptMac
selectedReceiptSha256
selectedReceiptStatus
publicationBinding
P0
P1
P2
conclusion
```

The coordinator compares those fields with the recorded command stdout and the
current selected leaf. A task that merely echoes, reads, or is shown a receipt
created outside its own bound command history has no qualifying machine
evidence.

The tasks must not:

- read sibling task outputs or conclusions;
- accept a parent-authored PASS;
- run a corrected or equivalent command;
- suppress a nonzero command status;
- rerun either phase;
- launch helper, Flash/Animate, Ruffle, or original runtime;
- mutate source, registries, ledgers, routes, releases, or deployments.

Any ambiguity or command error makes that unit permanently `NO_VERDICT`.

## 16. No authority expansion

The manifest carries only the exact closed, correlation-only `authority`
string required by its schema. Every receipt carries the complete
`authorityEffects` object, including explicit Flash/Animate, Ruffle,
deployment, and public-access effects, with every value `false`. Neither phase
may execute the native helper, launch any Flash-related runtime,
promote sources, accept fidelity/audio/human/owner work, register or integrate a
lesson, mark strict completion, release, publish, deploy, or provide public
access.

Three zero-finding human conclusions would close only this security-review
question. A later explicit user decision is still required for any action
outside the three review scopes.
