# G4 L10 Native Helper v2.14 Independent-Review Chunk Plan v3

Status: `FROZEN_BEFORE_NEW_TASK_CREATION`; new-batch transport plan only. It creates no task, HMG4RB4, review verdict, contract acceptance, helper implementation/test/execution, runtime, apply/recover, promotion, integration, release, or publication authority.

Frozen at: `2026-08-06T20:15:33Z`

This is a new no-clobber successor to `g4-l10-native-helper-v2-14-independent-review-chunk-plan-v2.md`. It does not revive, reuse, repair, validate, or cure any prior task ID, HMG4RB4, command, output, finding, or review result. The immediately preceding batch `4b098db0605790fa05066d55e3d3da102661be90c9b5a7191b35ec2b7bed1b08` and its three tasks are permanently failed and non-reusable.

## 1. Exact target and frozen native identity

```text
absolute-path=/Volumes/WestWorld/HELP MATH 2.0/docs/G4_L10_NATIVE_HELPER_V2_14_SECURITY_CONTRACT_SUCCESSOR.md
SHA-256=a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
UTF-8-bytes=50310
LF-count=173
final-LF=1
type=Regular File
mode=0444
nlink=1
inode=5914134
device=16777244
uid=501
gid=20
flags=-
mtime-epoch=1786019793
xattr-name-count=1
xattr-name-1=com.apple.provenance
xattr-name-1-bytes=11
ACL-entry-count=0
```

The snapshot uses the original absolute path and macOS-native `shasum`, `wc`, `iconv`, `stat`, `xattr`, `ls`, `sed`, and `tr`. `com.apple.provenance` is ambient metadata with no authority effect. Each reviewer must independently repeat a before snapshot and an immediate-final after snapshot. Drift, an unexpected xattr, quarantine, ACL entry, symlink, wrong type, unavailable observation, or ambiguous output fails that unit.

## 2. Mandatory first action: exact non-evidence diagnostic

Before any evidence-bearing command or target read, each reviewer must label and execute exactly the following command body, byte-for-byte as presented in its authenticated start envelope. It may not replace a path, add or remove a tool, substitute `ls`, wrap the body, or use a functionally similar diagnostic.

```zsh
for tool in /usr/bin/shasum /usr/bin/wc /usr/bin/iconv /usr/bin/stat /usr/bin/xattr /bin/ls /usr/bin/sed /usr/bin/tr; do [[ -x "$tool" ]] || { print -r -- "MISSING:$tool"; exit 1; }; done
print -r -- 'DIAGNOSTIC_ONLY_NOT_EVIDENCE:macOS-native-tools-available'
```

Expected bounded stdout is exactly one LF-terminated line:

```text
DIAGNOSTIC_ONLY_NOT_EVIDENCE:macOS-native-tools-available
```

Any different command body, missing tool, nonzero exit, extra stdout/stderr, ambiguity, or diagnostic correction permanently invalidates that review unit before evidence begins. It must be disclosed in the final output. Python filesystem/xattr inspection is forbidden, including `os.listxattr`. Heredocs are forbidden for byte, LF, identity, chunk, preimage, output, or HMG4RB4 accounting.

## 3. Predeclared terminal-output non-truncation contract

The 50,310-byte contract is partitioned at existing LF boundaries into exactly 21 contiguous chunks. Every target byte occurs exactly once in order. Each chunk is at most 3,072 bytes; the observed maximum is 3,037 bytes. No reviewer may discover or replace these boundaries dynamically.

For every terminal-visible contract-content read:

1. Emit exactly one listed chunk and no other contract content in that tool result.
2. Never use a loop, wildcard, aggregate `cat`, command substitution, multi-range command, or combined stdout that emits more than one chunk.
3. Set the terminal/tool output allowance to at least 12,000 tokens for that one-chunk read. Metadata-only commands must emit at most 120 lines and 8,000 bytes.
4. Treat any `truncated output` warning, omitted-line marker, transport ellipsis, incomplete UTF-8 sequence, missing expected LF, or ambiguous result as permanent unit invalidation. Retry or correction cannot cure it.
5. Extract to a reviewer-unique `/tmp` file first; verify bytes/LF/SHA there; then display exactly the same single predeclared native `sed` range. Never print the reconstructed contract.
6. Reviewer reasoning must cite chunk IDs and locally verified hashes, not terminal scrollback completeness.

Columns are `chunk | first-line | last-line | zero-based-byte-offset | bytes | LF | SHA-256`.

```text
001|1|41|0|3003|41|e5c644a95dc68d8bdd33e9b0283e67aa567464d73cc0a96bfcfc0f46101ca0d2
002|42|84|3003|2886|43|dbfa82045e1b8f864e6273daeee6346ebebc83ea1e58cdd253e15f164814de44
003|85|89|5889|2002|5|184f8988d4e03f1c4dead64a352eb91bb8882a95c03fd7045216e4a39bc489f1
004|90|92|7891|2938|3|e229411dde92919394e59c066d4f04a776805683c2224983982a9aa5668465c6
005|93|95|10829|2261|3|d4fae3b8707294eefcec3b6bd14ed94159093c7fa482a0a7e7c53bcb92ed0306
006|96|97|13090|2070|2|e9626555e02ecf662a888ed8ac41b7f707ecc0b99f588c3aacc255ce6c42659e
007|98|98|15160|1599|1|e106cdbdc7dfe767d586d8767076a5c05ab2f8aa8b1f04592de458aea28621c5
008|99|99|16759|2702|1|e966f00282a96f1a68fec7f45ae321acde5076b18e66a93b1b1a5c26f4510429
009|100|100|19461|2484|1|162d0c01d639a67f80c4844a644c999bb688bec9cf518cea079dcc1301d93387
010|101|101|21945|2969|1|519c93c7c881f4157c669dbb47b131d2498c271fa344407fee1a7ed21fa871f7
011|102|102|24914|2279|1|bb409aaac74610f67653eb768f6c4c9c82cb02b898f951f448639fcc083e4d47
012|103|103|27193|2203|1|b60cc2d1e6ead8429227bbbe216ef30be269e21d1e36f944e225140b7282bd64
013|104|104|29396|1905|1|92b44fb07bab44d5ef7a5b1cd6c6761a40616d1a851a269cb11f4db9342317bf
014|105|105|31301|2015|1|6c858f49a711d6d50945eeab126ed54fa8809167c26a002b78c3a8507ca89c96
015|106|106|33316|2455|1|a0588c3851b69dfe820d483a16e97e174edc48a0fb1d1ed5db91812b1424f086
016|107|107|35771|2111|1|6b7e3c1c462c4793b2259a69c5c197636856463e6ce35316c982ac854bf4131b
017|108|126|37882|2988|19|d4b0379108a8614cca3adbd5e906ee80a0d04cf4b3232422f65b62bc9be4975e
018|127|146|40870|3026|20|857a3939c988178fac9aaa867a09b962feee12dd6df3e800818462560fe070ef
019|147|158|43896|2827|12|1754f09b93d4dec51f1595a068d4492279646407ce9a5ec0d4d013c7337317bb
020|159|172|46723|3037|14|664a91bdcf4efc28e6b7de0c995de6c94b5e1aea142baf17b29544020f28801a
021|173|173|49760|550|1|6c46e5c043d0a6abd22516352411b4eefa8da2a8d312de95edd8c3e7143ce56a
```

Aggregate invariants:

```text
chunk-count=21
first-offset=0
final-end-offset=50310
sum-bytes=50310
sum-LF=173
ordered-concatenation-SHA-256=a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
```

## 4. Fixed evidence sequence

Each reviewer creates one reviewer-unique directory with `/usr/bin/mktemp -d` under `/tmp` and writes nothing in the workspace. Before each evidence-bearing command it states the command label and exact claims tested. A failed, ambiguous, corrected, or truncated evidence command permanently invalidates that unit.

1. Observe the original target before identity using native `shasum -a 256`, `wc -c`, `tr -cd '\n' | wc -c`, `iconv -f UTF-8 -t UTF-8` to the unique temporary directory followed by byte/hash comparison, `stat -f`, `xattr`, `xattr -px`, and `ls -ldeO@`. No Python, Git blob, copy, attachment, memory, prior task, or inherited output may substitute.
2. Process chunks 001 through 021 sequentially. For chunk NNN, extract only `/usr/bin/sed -n '<first>,<last>p' "$target" > "$review_tmp/chunk-NNN.bin"`; verify only that file with native `wc` and `shasum`; then display only the same one `sed` range in a separate command with at least 12,000 output tokens.
3. Reconstruct in `/tmp` with `/bin/cat` and the explicit ordered list below. No wildcard or loop. Verify aggregate bytes, LF, UTF-8 round trip, and SHA-256 without emitting the reconstruction.
4. Perform only the assigned Section 3 scope. Use reviewer-authored, fail-closed commands and reviewer-unique `/tmp` outputs. A command-design failure is a review failure; a later repair is disclosed but cannot cure the unit.
5. Immediately before final output, repeat the complete original-target identity sequence and compare before/after.

Explicit concatenation order:

```text
chunk-001.bin chunk-002.bin chunk-003.bin chunk-004.bin chunk-005.bin chunk-006.bin chunk-007.bin
chunk-008.bin chunk-009.bin chunk-010.bin chunk-011.bin chunk-012.bin chunk-013.bin chunk-014.bin
chunk-015.bin chunk-016.bin chunk-017.bin chunk-018.bin chunk-019.bin chunk-020.bin chunk-021.bin
```

## 5. Fresh-task hold, new HMG4RB4, and start-envelope boundary

This frozen plan contains no new task ID or new HMG4RB4. It must be hashed and made read-only before task creation. Exactly three fresh user-owned tasks are then created in order with scopes `schema`, `adversarial`, `whole`. Their creation prompts are hold-only: no command, file read, memory, review, or evidence action is permitted before the authenticated start envelope.

After all three task-system IDs exist, the parent rejects every prior ID, confirms the new IDs are nonempty/distinct and contain no NUL/CR/LF, and computes HMG4RB4 from exactly these five LF-terminated lines:

```text
HMG4RB4
a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
NEW schema task ID
NEW adversarial task ID
NEW whole task ID
```

The start envelopes bind the same contract path/SHA, this plan path/SHA, new HMG4RB4, all three ordered IDs, HMG4GL4/HMG4AL3/HMG4PE1/HMG4FR3 identities, unresolved V28 state, terminal-output rules, and closed authority. Only `recipient-scope` differs. A task that acts before the envelope, uses a prior ID/batch/plan/output, or receives a mixed envelope is invalid.

Explicitly forbidden prior v2.14 IDs and batches include:

```text
019fd766-c790-7aa3-a4e1-33f63a3309e8
019fd766-c790-7aa3-a4e1-33c1c05b686a
019fd766-c790-7aa3-a4e1-33b453893b9d
019fd882-fa78-75b2-b4bb-f53241717523
019fd883-1dc3-7d43-92cf-fb5b01bdb3d7
019fd883-45e1-7782-9dc0-fbc3deced5f9
fef5cf87efd537f0b9f629d2e31c8b7df4ccd7737ecebfe9a122d80332244db8
4b098db0605790fa05066d55e3d3da102661be90c9b5a7191b35ec2b7bed1b08
```

Each task is one-use. This batch cannot be replayed, mixed, repaired, or reused for any later review or authority transition.

## 6. Section 3 scope and final-output minimum

- `schema`: independently reconstruct HMG4GL4; validate HMG4AL3; decode and hash all 42 HMG4PE1 paragraphs; compare every row/edge/target; audit all inherited production-contract grammar.
- `adversarial`: attack task ownership; replay/mixed-batch/root spoofing; original-output availability; Base64/length/hash aliases; command-failure disclosure; user authentication; V28 preservation; clean-room isolation; and every path to implementation/runtime authority.
- `whole`: read byte 1 through EOF; validate full lineage and retained exclusions; independently repeat structural and all-42 paragraph checks; confirm no authority expansion.

Every final output must echo its own task ID, all ordered IDs, HMG4RB4, scope, contract and plan identities, target before/after identity, P0/P1/P2 with every finding or explicit zero, HMG4GL4, HMG4AL3, all-42 HMG4PE1 result, HMG4FR3 interpretation, unresolved operational-freeze state, complete command/error/truncation disclosure, completion result, and the closed no-authority statement. Any nonzero, omitted, unevaluated, ambiguous, corrected, or invalidated unit is not zero and cannot qualify.

## 7. Closed authority

These tasks perform read-only independent contract review only. They may not edit the workspace; create or alter a contract; implement or test a helper; inspect or reuse retired implementation knowledge; mutate V28; install; launch original runtime; apply; recover; accept; promote; integrate; release; or publish. This batch cannot authorize production-helper implementation even if all three reviews report `P0/P1/P2=0/0/0`. A later implementation step would require the separate authenticated post-review authorization and every retained v2.14 Section 4 gate.
