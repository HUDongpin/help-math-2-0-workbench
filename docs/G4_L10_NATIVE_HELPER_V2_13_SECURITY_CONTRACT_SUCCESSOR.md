# G4 L10 Native Helper v2.13 Security Contract Successor

Status: frozen successor specification awaiting a user-visible, user-owned
three-task independent review. No review PASS, permission transition,
implementation, helper test or execution, apply, recover, installation,
original-runtime launch, acceptance, promotion, integration, release, or
publication authority exists.

## 0. Direct predecessor, failed v2.12 batch, and retained scope

This document is the sole direct no-clobber successor to:

```text
path=docs/G4_L10_NATIVE_HELPER_V2_12_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256=7874c4dee7f66203f6485bcac73dd8112a962ca258d63eb15e13001dd7d81a4b
bytes=22002
LF-count=435
mode=0444
```

The v2.12 schema, adversarial, and whole-contract units each returned
`P0/P1/P2=0/1/0`. The batch also suffered disclosed read-only diagnostic/tool
errors and was invalid under v2.12 even apart from its findings. Its three
canonical new P1 rows are:

```text
P1 V212-V211-ALIAS-CONSOLIDATION-CROSSWALK-UNBOUND
P1 V212-EXTERNAL-REVIEW-BATCH-PROVENANCE-AND-REPLAY-UNBOUND
P1 V212-CLEAN-ROOM-PRIOR-EXPOSURE-AND-ACCESS-ISOLATION-UNDEFINED
```

V2.13 retains v2.12 Sections 0, 2, 3, 5, and 7 except where this document
explicitly replaces them. In particular:

- the root v2 through v2.6 production-helper contracts remain normative as
  successively amended and must retain the exact hashes recorded by v2.12;
- every repository-local Gate-A generator, verifier, controller, companion,
  approval, receipt, watcher, publisher, PASS file, and retired HMG4 Gate-A
  binary object remains permanently non-authoritative;
- the 57-file v2.7 implementation attempt remains failed evidence, never an
  implementation input, and its operational preservation row remains open;
- no v7/v8 intake, Grade 4 source, SQL/course map, lesson sequence, quiz, Key
  Term, EN/ES/audio binding, missing MP3, migration, renderer, visual/RMSE, or
  runtime-baseline state is changed.

## 1. Exact HMG4GL3 historical ledger extension

The first 52 rows are exactly the 2,526 ASCII HMG4GL2 ledger bytes frozen in
v2.12 Section 1, ledger-only SHA-256
`cb93173865ec7b2e3cf6bbfec02d0e366c6d18117144e6bab72168919dbed54a`.
V2.13 appends exactly these three ASCII rows in this order, with one LF after
every row including the final row:

```text
P1 V212-V211-ALIAS-CONSOLIDATION-CROSSWALK-UNBOUND
P1 V212-EXTERNAL-REVIEW-BATCH-PROVENANCE-AND-REPLAY-UNBOUND
P1 V212-CLEAN-ROOM-PRIOR-EXPOSURE-AND-ACCESS-ISOLATION-UNDEFINED
```

The exact delta and complete ledger identities are:

```text
delta-domain-prefix-hex=48 4d 47 34 47 44 33 0a
delta-row-count=3
delta-bytes=176
delta-only-SHA-256=b228bd682725bffc5e47e05c7db52924a24405d4672d27d65efebadec4ed0783
delta-domain-SHA-256=2ee810d9dfef983ca9e56d8509d1d79eb88831339b8567aa32de40527fe4c4c3

ledger-domain-prefix-hex=48 4d 47 34 47 4c 33 0a
ledger-row-count=55
ledger-bytes=2702
ledger-only-SHA-256=fd12ff9ff134e840558b643c59ea1f14f2a8e669710b508e0c7e3bed81b74828
ledger-domain-SHA-256=d26e7f270d0b32bf629d7bfb400c73f6d3d2e5fca90e7d29501ca57de3a31db5
```

Both domain prefixes are exactly seven displayed ASCII identifier bytes plus
one LF. Reviewers must reconstruct the 55-row preimage from the frozen v2.12
52-row bytes and the displayed three-row delta. Missing predecessor access,
wrong order, duplicate ID, priority drift, wrong length, wrong digest, CRLF,
normalization, non-ASCII, or trailing data fails.

## 2. Exact HMG4AL3 v2.11 alias-consolidation crosswalk

HMG4AL3 freezes the three v2.11 reviewer-local finding manifests and their
many-to-many mapping into the twelve canonical v2.11 rows used by HMG4GL2/3.
Every row is ASCII and has exactly six pipe-delimited fields:

```text
unit | priority | local-id | problem-text-SHA-256 |
remediation-text-SHA-256 | comma-delimited-canonical-ids
```

There is no whitespace around a pipe or comma in the actual preimage. Unit is
exactly `F`, `A`, or `W`; priority is exactly `P1`; each digest is 64 lowercase
hex characters; IDs match `[A-Z0-9_-]+`; canonical IDs are in the displayed
order. Each row has one LF, including the final row. Row order is F1..F10,
A1..A4, W1..W7. The exact 21-row preimage is:

```text
F|P1|V211-SEVEN-BYTE-MAGIC-EIGHT-BYTE-FIELD-CONTRADICTION|1b88144807009f6ff6728160891037f71ec1bad59447fd558543701adb92b9e7|f1c86d3e4b8673e1098b7a7b923da9275602d1fe4f7f772c87d7611887f6ceaa|V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED
F|P1|V211-ACL-XATTR-CANONICAL-STATE-AND-BOUND-CONTRADICTIONS|1ef21043a68ecf6de8e585f5ce9425ce6dd35183629841a8edea3534ed9e458b|d505299e107421660e1b7b6b5bec85c1ab2f358a5f49213cc42aaba403837496|V211-ACL-XATTR-CANONICAL-STATE-AND-BOUND-CONTRADICTIONS
F|P1|V211-HMG4DP2-HEADER-AND-NORMALIZATION-UNDEFINED|d571187d3c4097a779b69b4270176eef2d92b7f50ec9b9d8c950742dfec84023|5f31d1ce0254ac504fe216b64e83768fd73daafd07852fe67d874997dc82b66c|V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT,V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED
F|P1|V211-DOCS-INTERVAL-DRIFT-UNOBSERVED|56c632a77f6b3dd1aa1de95f3201e96cd31c6ddf0d8f9482a166c6bbd4676bb7|84509d07638ac7fc027a2e8bf340f2b2ab5a61ea167ae5653e1c28eebf9af895|V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP
F|P1|V211-HMG4GAT2-PATH-ROW-AND-PIPE-GRAMMAR-INCOMPLETE|0ded5388be46970142e401f80453a2e558e43ab85edea091b049d7e515e9395a|562d4479bbf0133e7a291466f5d4ceba7852515736efa1ca443026b59110ee2f|V211-HMG4GAT2-PATH-ROW-AND-PIPE-GRAMMAR-INCOMPLETE
F|P1|V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED|91dd33c875130d29b74bf711ad3c5209e98dc44dda8f7b7414b66e36daced6ee|1734e862601119f05f9f1cb043b9299b82d480d15de207d931eeeab7dbab0df9|V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED
F|P1|V211-HMG4GA2-CONTRACT-IDENTITY-AMBIGUOUS|af44e75e745095eb152d0b540198ca5d7444d7ac899d488e1fcd278af1d3028c|66c35c9f36ff728eee44e5f312fd8e36af053ae00b323d01c442248ff701ecae|V211-HMG4GA2-CONTRACT-IDENTITY-AMBIGUOUS
F|P1|V211-CONTROLLER-LIVE-EXECUTION-IDENTITY-UNBOUND|e7655024041c76a80f6fda2cadf83c8c54f0fe975e1d84e4fa1b4e2c3184005c|040d688b85a8da67c44f53684e95236f14f792a1f11d8e9ae2fa8ae1cb2d2fac|V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND
F|P1|V211-HISTORICAL-FINDING-LEDGER-HASH-UNBOUND|4859cff6be3fcb3dc1b1f3e82a2edd4c45b0658a9e490c3fb861195678424106|34725d98338734e2b4b7345b5115603c72e227c32f764b4eb90b6ba7e458d7a6|V211-HISTORICAL-FINDING-LEDGER-HASH-UNBOUND
F|P1|V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND|30287000358e01c65421de2137a17681e960ae934d4944c916d39ace23562c1d|4337bd69db21d8239f0bcaf30f55ea2b999b5618cf5ff758fde28b7ecbcc4409|V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND
A|P1|V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED|dcc048d032e3d81d7a54adf99d7961e02afb147ae3f4e93c61c779cc8d7a33fa|33a937c9c557292f11ad45764d8231afb4e3bb3f589c29b07e7ce1903ae2d0cb|V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED
A|P1|V211-HMG4DP2-DIRECTORY-HEADER-AND-INODE-NORMALIZATION-UNDEFINED|394bc22082952547f859dba470eb3050affb58eae843aa8e96cabb962b6ff22b|ed2be5740b372484135bd81a1b5bfec7c3066d845b61b2c0454c0419c60d1520|V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT,V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED
A|P1|V211-CONTROLLER-LIVE-PRODUCER-IDENTITY-UNBOUND|f672831bf430e2afe77a137b4e46fca37cc3b4c2e215e5f4ca7d0c509f390bdc|2ad548968a8a1590e5aecb3f931a310de93cbc63c45afcbf8c07fc0961f467f7|V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND
A|P1|V211-COMPLETION-RECEIPT-TERMINAL-STATE-NOT-DURABLY-BOUND|211f3e4da055dcbb47cbf9c7b8ee5fbb8a4b2fe5e1de3f1a23a3690a6d0c5a40|378cbab396e8ddba924734e91d876468802f007678453ae9c39b9f0534d3d6bd|V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND
W|P1|V211-DIRECTORY-EFFECTIVE-NAMESPACE-ACCESS-PROBE-UNDEFINED|fa83a71ddce18aca6100f5fd1e19b9d400f543ee7308b615491846c32e1c296e|22be1d456f22351dbbb7d0f3a9e598d41cd5115730d398110308fa8ef835e532|V211-DIRECTORY-EFFECTIVE-NAMESPACE-ACCESS-PROBE-UNDEFINED
W|P1|V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP|65a321ebbca607d7ab6e8d801f56873be867eea6f463d37fbc42be38fb3aeeaa|a1f745047e08aac1d2a90980b238e818d10f66d16950bec850d471ede375d51f|V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP
W|P1|V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT|71bf6f2c6967d7c18897e2605f117734263abb257613fa8fe9765000fd1e578e|9dee937a2490b3c6a6077d803b76771d4409d133cf0f9f8a747785a79ca47c70|V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT
W|P1|V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED|8e110d58ed13a49f4c5fed3e161f9632a0189099a43ee731cef87483e4b73b5f|c38a6292e26655b0ccb913dac9c299c11dafdbe0974056f4420e8bbf6d97c600|V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED
W|P1|V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND|c35bb8a0cc71a139e8713b1c49da2752d9e3d12e8cf5564be48dc967d5018f9e|0e1d78bd6ff6c8504cad04b282081acde3f4a4cddbd702f6a89115013d5c8cc9|V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND
W|P1|V211-HMG4GS1-RUNTIME-PROJECTION-GRAMMAR-UNDEFINED|0f2b91d9dbc1388f3111d28e1c282faa88ba07ff660330305284217421c420bf|e57cb620496fcd26caad82a6ad0658e0141b8ef4255d9e7a51d70ee024a7d298|V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED
W|P1|V211-HMG4GC1-SELF-FINALIZATION-AND-INDEPENDENT-VERIFICATION-UNDEFINED|2e78dba4b7a0524bf68efbea00206874bcaf3f056f9ec0de8d7121570330553e|16bf4034784d728781643d73dd934217002264140c98f6357ad3d99db137a545|V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND
```

The three exact source-unit and complete combined identities are:

```text
F-row-count=10; F-bytes=2374
F-SHA-256=ee6028ff0745514cedd3916c2bf8dc374d89b212cee87166ab28ca94cb14456b
A-row-count=4; A-bytes=989
A-SHA-256=3e05a02b688d80576ecaa87752a946e59988e65520aff3e3d125d28409adddc5
W-row-count=7; W-bytes=1701
W-SHA-256=a40b7e0306ac53230547cc530578b38f954964b0346fddd1ba9fbd3b1d798fc7
combined-row-count=21
combined-mapping-edge-count=23
combined-canonical-target-count=12
combined-bytes=5064
combined-SHA-256=2ff22afbae318ee9dad10ed2cad0a28f55479fff4c05ae194febd200473409ad
combined-domain-prefix-hex=48 4d 47 34 41 4c 33 0a
combined-domain-SHA-256=276023765967427a64c110e53ef119a8f557df4409749d866cc3812c1014484e
```

The exact reverse coverage is:

```text
V211-BINARY-MAGIC-OCTET-GRAMMAR-UNDEFINED=F1,A1
V211-ACL-XATTR-CANONICAL-STATE-AND-BOUND-CONTRADICTIONS=F2
V211-DIRECTORY-EFFECTIVE-NAMESPACE-ACCESS-PROBE-UNDEFINED=W1
V211-HMG4DP2-DIRECTORY-HEADER-GRAMMAR-INCONSISTENT=F3,A2,W3
V211-HMG4DP2-NEW-LEAF-INODE-NORMALIZATION-UNDEFINED=F3,A2,W4
V211-DOCS-PUBLICATION-INTERVAL-MUTATION-OBSERVATION-GAP=F4,W2
V211-HMG4GAT2-PATH-ROW-AND-PIPE-GRAMMAR-INCOMPLETE=F5
V211-HMG4GS1-RUNTIME-AND-DESCRIPTOR-PROJECTIONS-UNDEFINED=F6,W6
V211-HMG4GA2-CONTRACT-IDENTITY-AMBIGUOUS=F7
V211-GATE-A-CONTROLLER-TOOLSET-TRUST-ROOT-UNBOUND=F8,A3,W5
V211-HISTORICAL-FINDING-LEDGER-HASH-UNBOUND=F9
V211-HMG4GC1-OWN-PUBLICATION-RESULT-UNBOUND=F10,A4,W7
```

Every local row maps to one or two targets, every canonical target has at least
one contributor, the forward and reverse edge multisets must be identical, and
all counts and hashes above must match. A missing, extra, duplicate, reordered,
reprioritized, rehashed, split, merged, unmapped, unknown-target, reverse-only,
or forward-only row or edge fails. The exact problem/remediation paragraph
bytes remain in the three authenticated historical reviewer outputs; the
digests bind those paragraphs without copying their long text into this
contract. If those outputs are unavailable, their text hashes cannot be
revalidated and the crosswalk status is `unverifiable`, never PASS.

## 3. User-owned review-batch provenance

V2.13 contract review cannot be performed by hidden subagents of this root
task. It requires exactly three user-owned Codex tasks visible in the user's
sidebar, created only after the user explicitly requests their creation for
this exact v2.13 SHA-256. The user may instead create them directly. No task may
be reused from an earlier contract or batch.

The app-generated thread/task ID is the task identity. The three distinct
tasks have exact scopes `schema`, `adversarial`, and `whole`. The parent task
records their three IDs exactly as returned by the task system. A batch ID is
computed only after all three IDs exist:

```text
ASCII HMG4RB3 LF
v2.13 contract SHA-256 lowercase hex LF
schema task ID UTF-8 LF
adversarial task ID UTF-8 LF
whole task ID UTF-8 LF
```

The task order is exactly schema, adversarial, whole; IDs must be nonempty,
distinct, task-system returned values with no CR/LF/NUL. The batch ID is the
lowercase SHA-256 of that exact preimage. A root-selected nonce or display name
is not an identity.

Each task receives the exact contract path, SHA-256, computed batch ID, its
scope, the other two task IDs, the root task ID when the app exposes it, the
HMG4GL3/HMG4AL3 identities, and the no-write/no-execution boundary. Each task's
final output must echo its own task ID, all three ordered IDs, batch ID, scope,
contract before/after identity, P0/P1/P2, every finding or explicit zero,
ledger/crosswalk result, operational-freeze state, command/error disclosure,
and no-authority statement.

The parent must read the original final output from each task with the task
system rather than accept forwarded text. For each output it records:

```text
task-system task ID
task-system final-message or transcript identity when exposed
exact final UTF-8 output byte length
SHA-256 of exact final UTF-8 output bytes
task completion state and completion timestamp when exposed
```

The user must be able to open all three original tasks independently of the
parent consolidation. Missing task access, unavailable exact final bytes,
duplicate IDs, root-authored substitute, stale output, mismatched batch ID,
mixed batch, wrong scope, finding suppression, incomplete task, non-final
output, or task-system ambiguity fails.

The parent consolidation quotes every finding verbatim and lists the ordered
three task IDs and output SHA-256 values. It cannot convert a nonzero unit to
zero. `spec-review-qualified` is transient and true only if the exact three
original user-owned task outputs all target unchanged v2.13 bytes, each is
complete and `0/0/0`, HMG4GL3/HMG4AL3 pass, the new union is empty, and the
consolidation exactly matches them.

After inspecting the three original tasks and consolidation, the user must send
a new authenticated user-role message naming the v2.13 contract SHA-256,
HMG4RB3 batch ID, the three ordered task IDs, all three output SHA-256 values,
the combined `0/0/0`, the exact next action, the V28 disposition, and retained
exclusions. Earlier or less specific authorization is insufficient. If the app
cannot expose stable task IDs and exact original final outputs to the user,
this protocol is unavailable and authority remains false; no local fallback or
PASS file exists.

Exploratory read-only diagnostics are not evidence. Each review task must label
its evidence-bearing commands before running them. A failure, error, ambiguous
output, or correction in an evidence-bearing command invalidates that unit.
An exploratory diagnostic failure must be disclosed, cannot support a claim,
and does not by itself invalidate the unit if the reviewer independently runs
one predeclared, successful, complete evidence command for that claim. No
failed command may be silently omitted.

## 4. Enforceable clean-room implementation boundary

Even after a valid user-owned review batch and post-review user authorization,
implementation remains forbidden until V28 is separately resolved and the user
explicitly authorizes this clean-room procedure.

The implementer must be a new user-owned Codex task created after that
authorization with no forked turns, inherited conversation, summary, memory,
or task context containing any retired v2.7-attempt source. Its task ID is
recorded. Any model/task/agent known to have read or received retired source
bytes, code excerpts, diffs, ASTs, generated indexes, source-bearing summaries,
or implementation-specific behavior is disqualified as implementer. The root
task and every reviewer used through v2.13 are presumptively disqualified.

Implementation occurs only in a separately user-approved disposable offline
workspace or container. It exposes exactly:

- byte-identical read-only copies of the frozen v2 through v2.6 production
  contracts and v2.13 plus the qualified review metadata named by the user;
- an empty new implementation output directory;
- exact allowlisted compiler/runtime/build-system binaries and their hashes;
- no repository checkout, migration workspace, source asset, original runtime,
  network, retired file, alternate copy, cache, index, transcript, or summary
  containing retired implementation knowledge.

The isolation boundary must make all 57 retired files and every alternate copy
technically absent or unreadable, not merely instruct the implementer not to
open them. Its input manifest freezes path, type, link count, mode, size, and
SHA-256 for every exposed file; no directory is exposed without closed
membership. Environment, cwd, mounts, inherited descriptors, package caches,
search paths, test discovery, editor indexing, dependency loading, subprocesses,
and network state are recorded and fail closed on unallowlisted access.

The clean task maintains a complete task transcript and command log. Only
`apply_patch`-style exact-preimage writes may create new implementation files;
no input is overwritten. The allowed pre-runtime tests remain pure parser,
encoder, validator, deterministic in-memory state-machine, malformed-input,
build, and static-inspection tests. They never invoke helper `apply` or
`recover`, including fixtures, and never touch migration or protected data.

After build/tests, two review roles separate from the implementer are required:

1. provenance/access reviewer: verifies clean-task identity, no inherited
   source exposure, isolation manifest, mounts, transcript, commands, access
   surface, dependencies, and absence of unallowlisted input;
2. similarity reviewer: in a separate review environment may read both final
   implementation and retired evidence, runs exact textual/token/AST and
   semantic correspondence checks, and requires every correspondence to be
   explained solely by the production contracts or generic platform idioms.

Neither review may reveal retired source to the implementer. Any prior exposure,
unallowlisted read, missing transcript, isolation gap, unexplained similarity,
or unverifiable provenance makes clean-room status false and requires a new
implementation task and output directory. A later general implementation
security review must still independently reach P0/P1/P2=0/0/0 before helper or
original-runtime execution.

## 5. Operational V28 and no-authority boundary

The exact v2.12 Section 5 preservation rules remain normative. Current state is
still 57 writable `0644` files, 48 native members, nine top-level runners,
553,897 total bytes, checksum-set SHA-256
`cfa98f5fd9a101c35944b4ef59a8b5db36f3a799ee7821ca4e286476acea3200`,
and native-root mode `0755`. This contract does not authorize chmod, ACL,
xattr, flag, copy, move, quarantine, repair, delete, or rollback.

No implementation task may be created until: the user-owned v2.13 review batch
is valid and all three tasks are 0/0/0; the user sends the exact post-review
authorization; the separately authorized V28 transition completes and two
independent full-rehash projections agree; the clean-room isolation pack is
independently approved; and current v2 through v2.6 hashes still match.

No contract, ledger, crosswalk, task, transcript, review, user message,
permission state, isolation pack, source, build, test, or similarity result has
acceptance, fidelity, audio, promotion, integration, release, or publication
effect. Protected installation, helper apply/recover, original-runtime launch,
and migration mutation remain forbidden. Peter Hu's named operator status and
exact `course-g04-l10-vb-003` EN/ES limitation can activate only after every
contract, operational, clean-room, implementation, and launch-receipt gate is
separately satisfied; it is not activated by v2.13.
