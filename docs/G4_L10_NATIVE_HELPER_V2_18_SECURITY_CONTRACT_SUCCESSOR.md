# Grade 4 Lesson 10 native-helper v2.18 no-clobber security successor

Date: 2026-08-09

Status: authoring successor; acceptance-neutral; review authority remains closed

This document is a new no-clobber successor to the preserved v2.17 security
target. It addresses the six findings returned by the fresh v2.17 adversarial
review. It does not rewrite v2.17, inherit any v2.14-v2.17 review result, or
convert a prior machine receipt into a human conclusion.

The only authorized next action after this package passes its authoring checks
is to create one fresh live-control-plane-authenticated, locally
capability-bound independent-review set with exactly three new user-visible
Codex tasks, ordered `schema`, `adversarial`, `whole`. Nothing
in this successor authorizes helper execution, Flash/Animate, an original
runtime, Ruffle, source promotion, acceptance, integration, release,
publication, or public access.

## 1. Frozen lineage and non-inheritance

1. v2.17 remains byte-preserved as a failed/nonqualifying review predecessor.
2. The v2.17 schema and whole units ended without a qualifying verdict.
3. The v2.17 adversarial unit reported `P0=0`, `P1=4`, `P2=2`.
4. No v2.14, v2.15, v2.16, or v2.17 result is carried forward as a v2.18
   result.
5. The v2.18 manifest must bind this target, its companion protocol, verifier,
   focused test, the exact v2.17 quartet, the earlier frozen lineage, and the
   complete history closure.
6. A repository-local PASS, receipt, manifest, capability commitment, or test
   result never supplies a human review conclusion or project authority.

## 2. Exact authorization scope

The user separately authorized a new no-clobber security successor and then a
fresh independent-review set. The permitted review scopes are exactly:

1. `schema`;
2. `adversarial`;
3. `whole`.

Each scope has one new user-visible task-system ID, one reviewer nonce, one
reviewer-unique output parent, two phase capabilities, and four output leaves:

- Phase A preflight success;
- Phase A preflight error;
- Phase B evidence success;
- Phase B evidence error.

Across the set there are exactly three output parents and twelve declared
leaves. No sibling reviewer may use another reviewer's task ID, capability,
nonce, parent, leaf, preflight receipt, or conclusion.

## 3. Threat model and trusted boundary

The local threat model includes an untrusted same-UID process that can:

- read the public manifest and any published receipt;
- choose arbitrary CLI task-ID, scope, nonce, path, or output arguments;
- race leaf creation;
- rename, delete, replace, chmod, or add entries below a reviewer-owned `/tmp`
  output parent;
- replace a pathname after a descriptor has been opened;
- supply hostile Node or Python startup environment variables;
- replay a prior public nonce or unkeyed receipt body;
- observe a phase capability after it appears in a local command/process and
  replay it in another same-UID local invocation.

The trusted boundary is deliberately smaller than “all processes with the same
UID.” It consists of:

1. the user-authorized parent coordinator;
2. the Codex control plane's exact thread/host routing and retained task
   history as observed live by that coordinator, with non-rewrite and complete
   command-history behavior treated explicitly as a TCB assumption rather than
   a portable signed guarantee;
3. the Codex task-system message stream used by that coordinator to deliver a
   phase capability to exactly one newly created user-visible task;
4. the canonical repository root and fixed input bytes bound by the manifest;
5. the Darwin filesystem's device/inode and nanosecond ctime semantics,
   excluding privileged filesystem rollback, kernel compromise, or a hostile
   task system.

The verifier does not claim that Codex supplies a signed task attestation. It
validates possession of a 256-bit phase capability whose commitment binds the
review-set nonce, exact task/host route, reviewer nonce, scope, phase, output
parent, and output leaves, and whose preimage is absent from the manifest,
filesystem artifacts, and sibling task messages. A party that can read or
alter another task's private task-system message stream is inside the trusted
boundary and defeats this capability model; the package must not overstate
that limitation. The local verifier always reports
`taskIdentityAuthenticatedLocally=false`. Qualification requires the
coordinator to observe the exact response routed from the manifest-bound
thread ID and host ID. A local manifest, task-ID string, capability, receipt,
or parent-authored attestation file cannot replace that live observation.

## 4. ADV-01 remediation: routed task identity and locally keyed receipts

The caller-controlled `--reviewer-task-id` is correlation only. It is never
sufficient for authentication.

For every reviewer and phase the coordinator generates a fresh 32-byte random
capability and sends its lowercase 64-hex preimage only to the assigned task.
The manifest stores only a domain-separated SHA-256 commitment over:

```text
G4L10-V218-TASK-CAPABILITY
reviewSetNonce
taskSystemId
taskHostId
reviewerNonce
scope
phase
canonicalJson(outputParent)
successOutput
errorOutput
capabilityPreimage
```

The verifier must receive the exact capability preimage, recompute the
commitment, and compare it in constant time. The manifest hash and review-set
digest then enter the terminal receipt body protected by the same capability's
HMAC. A task ID without the capability, or a capability replayed against a
different task, host, reviewer, scope, phase, output parent, or leaf pair,
cannot enter this local capability-bound state.

This local commitment is deliberately not a signature over the entire
manifest and cannot by itself reject an otherwise self-consistent replacement
manifest. Qualification of the exact manifest additionally requires the
frozen manifest SHA-256 in the one literal command and the exact command/output
history observed on the bound Codex route. A changed manifest or command is
therefore nonqualifying at orchestration level even if a capability holder can
construct internally consistent local artifacts.

This capability state is not Codex task authentication. The coordinator also
knows all six capabilities, and each capability appears in its one frozen
formal command. The HMAC therefore proves integrity under and possession of a
capability; it does not prove reviewer-task authorship, independence, or
one-time use. Every local terminal receipt retains
`taskIdentityAuthenticatedLocally=false` and
`taskTransportAuthenticationRequired=true`.

Task identity is authenticated only at the orchestration layer. The
manifest-bound thread/host pair must receive the exact frozen phase prompt and
must return its result through that same routed task. The task-history event
that delivers a phase prompt is the authoritative one-time attempt record: the
phase is spent at message delivery, before any local command or leaf creation.
Any second phase prompt, corrected command, second invocation, or missing or
unreadable task history permanently makes that unit `NO_VERDICT`.

All terminal receipt identities use HMAC-SHA-256 under the phase capability,
not an unkeyed digest. The capability preimage is never serialized into a
receipt. Phase B receives the Phase A capability separately so it can verify
the complete Phase A receipt MAC.

Phase B must validate the exact recursive schema and canonical bytes of Phase
A and must independently rerun every deterministic Phase A check against the
same retained fixed-input closure. Comparing only a selected Phase A subset is
forbidden.

## 5. ADV-02 remediation: control-plane spend plus manifest-bound parents

Each reviewer manifest row includes an exact output-parent binding with:

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

At manifest freeze the parent must be a direct child of physical `/tmp`, owned
by the current user, mode `0700`, link count two, and empty. The three parents
must have distinct physical paths and distinct device/inode pairs.

Before Phase A consumes anything, a retained parent descriptor, the fresh
pathname, realpath, complete stat binding, and empty inventory must equal the
manifest. The verifier then creates both Phase A leaves descriptor-relatively
with `O_CREAT|O_EXCL|O_NOFOLLOW`, mode `0600`, before the first phase-specific
check can publish a conclusion. The directory is synced. The post-reservation
parent ctime and the two reserved leaf device/inode bindings enter the terminal
receipt.

Before Phase B, the verifier requires the exact Phase A post-reservation parent
binding, exact two-entry inventory, exact Phase A terminal receipt, and exact
unused sibling reservation. It then exclusively creates both Phase B leaves,
syncs the directory, and records the new post-reservation binding.

Deletion, rename, replacement, added entries, or recreation ordinarily changes
the directory ctime and/or device/inode/inventory and is therefore a local
tamper/replay signal. A different replacement directory cannot match the bound
device/inode/birthtime; rename-away-and-restore of the original directory is
not excluded by endpoint fields alone. These local signals do not independently prove
task identity or irreversible spend against every same-UID process. The
authoritative no-retry ledger is the manifest-bound Codex task history. Even if
an attacker deletes both local leaves or recreates a byte-identical parent,
the already-delivered phase prompt remains spent. If that task history cannot
be observed, local files cannot recover qualification and the unit is
`NO_VERDICT`. Privileged control-plane or filesystem rollback is outside this
stated model and is not claimed to be prevented.

Both leaves are locally consumed even when only one carries the terminal receipt. The
unused sibling remains a zero-byte, single-link reservation. Any partial,
foreign, missing, or extra leaf is `NO_VERDICT` and permanently invalidates the
unit. There is no same-review-set retry; this rule is enforced by task history
even when no local reservation was successfully created.

The terminal candidate is written only into its exact pre-reserved inode after
the publication-prestate revalidation. The writer then rereads that inode,
rechecks the selected and sibling bindings, syncs the file and parent, and the
verifier performs the complete publication-poststate revalidation. The
candidate is qualifying only after that postcheck and checked close. If a
later check fails, the opposite reservation receives a mechanical no-verdict
receipt when possible; the earlier candidate is never unlinked or overwritten.
A crash leaves a nonqualifying local state. The attempt was already spent by
the task-system phase-dispatch event.

## 6. ADV-03 remediation: all fixed inputs retained and revalidated

Every manifest, target, protocol, verifier, focused test, predecessor,
production contract, history member, runtime executable, and Phase A receipt
is opened once with `O_NOFOLLOW`, read from a retained descriptor, and bound by
path, realpath, device, inode, mode, link count, byte count, LF count, final LF,
and SHA-256 where applicable.

Immediately before any terminal receipt commit, the verifier must, while all
descriptors remain open:

1. re-fstat every descriptor;
2. reread every byte by positional reads beginning at offset zero;
3. prove exact byte count and no trailing byte;
4. recompute and compare SHA-256;
5. re-lstat every pathname and compare device/inode and stable stat;
6. re-resolve every canonical realpath;
7. revalidate the canonical root descriptor and pathname;
8. revalidate the retained output-parent descriptor, pathname, ctime, and
   exact inventory.

Closing all input descriptors before publication is forbidden. A fixed-input
drift detected after evaluation and before commit is an evidence input mismatch
and cannot publish a success receipt.

## 7. ADV-04 remediation: isolated process startup

Every formal reviewer command begins with `/usr/bin/env -i` and invokes the
manifest-bound absolute Node executable. The verifier requires an exact closed
startup environment, an empty `process.execArgv`, the exact canonical cwd, and
the absence of all `NODE_*`, `DYLD_*`, `LD_*`, `BASH_ENV`, `ENV`, `ZDOTDIR`,
`CDPATH`, npm shell, Git redirection, and coverage preload controls other than
the expressly allowlisted values.

Retained verifier/test modules execute only in fresh Worker isolates inside the
already validated formal Node process, with empty worker `execArgv`, the exact
minimal environment, and `data:` module bytes rather than repository
pathnames. No second Node pathname is executed. The Python descriptor writer
uses exact root-owned `/usr/bin/python3` with `-I -S -E`, an explicit minimal
environment, a non-repository cwd, and no `PYTHONPATH`, `PYTHONHOME`, user site,
or sitecustomize startup. Runtime executables remain descriptor-hashed and
retained through publication.

The focused tests must prove that hostile `NODE_OPTIONS=--require=...`,
`PYTHONPATH/sitecustomize.py`, npm shell, and loader variables cannot create a
marker during isolated Worker/Python execution.

## 8. ADV-05 remediation: delayed local capability-bound state

No local error or success receipt may label Codex task identity authenticated.
The opaque local capability-bound context may be created only after all of the
following have succeeded:

1. canonical manifest bytes, hash, schema, and review-set digest;
2. reviewer task/scope/phase selection;
3. task-delivered phase-capability commitment;
4. canonical-root literal, realpath, retained descriptor, device, and inode;
5. complete initial retained-descriptor snapshot of every fixed input;
6. manifest-bound output-parent identity and required pre-phase inventory;
7. successful exclusive reservation of both phase leaves.

This local state authenticates only the manifest/capability/custody binding.
It never authenticates the Codex task. Any earlier failure has no local
capability context and may expose only explicitly untrusted recovered CLI
values. Root-binding failures therefore cannot masquerade as capability-bound
or task-system-authenticated. The task-history phase-dispatch event remains the
attempt-start boundary even if the local gate is never reached.

## 9. ADV-06 remediation: exact failure taxonomy

The verifier uses distinct exception classes and assertion helpers:

- `UsageFault`: malformed CLI or noncanonical literal arguments;
- `AuthenticationFailure`: manifest/claimed task/capability/root/assigned
  custody has not reached the local capability gate;
- `AttemptStateMismatch`: phase parent state, inventory, or spent-state drift;
- `EvidenceInputMismatch`: frozen input bytes, schema, MAC, history, or
  deterministic semantic checks disagree;
- `MechanicalFailure`: open/read/write/fsync/close, child spawn/exit/signal,
  timeout, writer protocol, resource, or receipt-persistence failure.

Filesystem and child-process failures must never be thrown through a generic
evidence assertion. During Phase B only a genuine `EvidenceInputMismatch`
becomes `EVIDENCE_INPUT_MISMATCH`; mechanical failures become
`MECHANICAL_ERROR_NO_VERDICT_NO_RETRY`. Authentication and spent-state failures
have separate no-verdict statuses. Unknown exceptions fail closed as
mechanical.

## 10. Independent review protocol

After the v2.18 package passes authoring validation, the coordinator must:

1. create three new user-visible tasks in `schema`, `adversarial`, `whole`
   order with HOLD-only bootstrap prompts;
2. obtain and bind each actual task-system ID and host ID from the same trusted
   creation result;
3. create three new empty mode-0700 output parents directly below `/tmp`;
4. declare exactly twelve new leaves;
5. generate one review-set nonce, three reviewer nonces, and six phase
   capabilities from the system CSPRNG;
6. freeze exact parent, root, runtime, and fixed-input bindings;
7. publish one canonical no-clobber manifest containing commitments but no
   capability preimages;
8. send each task only its own exact sanitized Phase A command and capability;
9. after a qualifying Phase A terminal receipt, send that same task only its
   exact Phase B command and the required two capabilities;
10. forbid any correction, equivalent command, suppressed error, retry, or
    sibling-result consultation.

The coordinator must retain and inspect the exact thread/host history for both
phases. It must establish exactly one frozen phase prompt and exactly one
literal verifier-command execution for each dispatched phase, including the
command digest, exit status, selected receipt path, receipt SHA-256/MAC, and
publication metadata returned by that bound task. A phase prompt delivery is
the one-time spend event. A local verifier receipt is never an alternative
task-history ledger. If the control plane cannot establish non-rewrite,
complete history, exact command execution, and exact routed response for this
attempt, the unit is `NO_VERDICT`.

The independent task must read its complete assigned material, execute the
literal commands once, inspect the machine receipts, perform its own human
analysis, and return its own conclusion. A machine `READY` status is never the
human conclusion.

## 11. Closed authority

The v2.18 manifest must carry the exact closed, correlation-only `authority`
string required by the manifest schema. Every v2.18 receipt class must carry
the complete `authorityEffects` object with every effect set to `false`,
including:

- implementation and helper execution;
- Flash/Animate, Ruffle, original-runtime launch or capture;
- current-JavaScript acceptance, fidelity, audio, human, or owner acceptance;
- source promotion, apply, recover, integration, strict completion;
- release, publication, and public access.

Even three independent zero-finding conclusions would authorize only a later
user decision about the reviewed security target. They do not activate the
native helper or any lesson-conversion runtime.

## 12. Qualification rule

A v2.18 review set is qualifying only if all three fresh tasks:

- are bound to this exact manifest and v2.18 fixed-input closure;
- are observed live on the exact manifest-bound thread ID and host ID, with
  exactly one frozen prompt and one literal verifier-command execution per
  dispatched phase, with no correction or retry;
- authenticate their assigned phase capabilities;
- consume the exact parent states and twelve leaves without retry;
- produce mechanically valid Phase A and Phase B receipts;
- independently inspect their complete assigned scope;
- return `P0=0`, `P1=0`, `P2=0` with an affirmative conclusion.

Any command error, ambiguity, correction, retry, missing capability, parent or
leaf drift, unpreserved receipt, incomplete read, or nonzero finding makes that
unit `NO_VERDICT` or nonqualifying. The other units cannot repair it. A new
attempt requires a new successor authorization, three new tasks, new
capabilities/nonces/parents/leaves, and a new manifest.
