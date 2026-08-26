# G4 L10 Native Helper v2.14 Independent-Review Chunk Plan v1

Status: `FROZEN_BEFORE_TASK_CREATION`; review-input transport only; no review verdict or implementation/runtime authority.

Frozen at: `2026-08-06T18:21:25Z`

## 1. Exact target and native read-only identity snapshot

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
xattr-name-1-hex=01 02 00 22 02 11 CD 1E 32 E5 B0
ACL-entry-count=0
```

This snapshot was obtained with absolute-path macOS-native `shasum`, `wc`, `tr`, `iconv`, `stat`, `xattr`, `ls`, and `sed` observations. It is a review input, not a substitute for each reviewer independently establishing the required before and immediate-final after identity. The `com.apple.provenance` xattr is ambient metadata, not contract authority. Any other xattr, any ACL entry, `com.apple.quarantine`, or drift in the displayed identity must be disclosed and fails the unit unless the contract itself unambiguously requires a different conclusion.

## 2. Mandatory diagnostic-before-evidence boundary

Each reviewer must first label and run the following as `DIAGNOSTIC_ONLY_NOT_EVIDENCE`. A diagnostic failure must be disclosed; it does not become evidence and the reviewer must stop without starting the evidence sequence.

```zsh
for tool in /usr/bin/shasum /usr/bin/wc /usr/bin/iconv /usr/bin/stat /usr/bin/xattr /bin/ls /usr/bin/sed /usr/bin/tr; do [[ -x "$tool" ]] || { print -r -- "MISSING:$tool"; exit 1; }; done
print -r -- 'DIAGNOSTIC_ONLY_NOT_EVIDENCE:macOS-native-tools-available'
```

No reviewer may use Python for filesystem identity or xattr inspection. In particular, `os.listxattr` is forbidden. No heredoc may be used for byte, LF, preimage, output, or HMG4RB4 accounting.

## 3. Terminal-safe chunk contract

The target is partitioned at existing LF boundaries into exactly 21 contiguous chunks. Every source byte occurs exactly once, order is fixed, and every chunk is at most 3,072 bytes. The maximum is 3,037 bytes. A terminal-visible read must contain exactly one listed chunk and no other contract content; a loop or command that emits multiple chunks in one tool result is forbidden. Thus no evidence-bearing terminal result contains the 50,310-byte document or an unbounded aggregate.

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

The aggregate invariants are:

```text
chunk-count=21
first-offset=0
final-end-offset=50310
sum-bytes=50310
sum-LF=173
ordered-concatenation-SHA-256=a86c726ca5e3ae89cfb110c1a3dedb751c3cb2c51d1b737a908a91ddd0bf9510
```

## 4. Predeclared evidence sequence

Each reviewer must use a reviewer-unique directory created by `/usr/bin/mktemp -d` under `/tmp`; it must not write anywhere in the workspace. Before every evidence-bearing command, the reviewer must state the exact claims tested. Any failure, error, ambiguous result, or corrected evidence command permanently invalidates that unit, as required by v2.14 Section 3.

The evidence order is fixed:

1. Establish the complete before identity using the native tools named in Section 2. Use `shasum -a 256`, `wc -c`, `tr -cd '\n' | wc -c`, `iconv -f UTF-8 -t UTF-8` to a reviewer-unique temporary file followed by its byte/SHA comparison, `stat -f`, `xattr`, `xattr -px`, and `ls -ldeO@`. Do not substitute Python, a workspace copy, a Git blob, a task attachment, or memory.
2. For each row in Section 3, in numeric order, use exactly one native `sed -n '<first>,<last>p' "$target" > "$review_tmp/chunk-NNN.bin"` extraction command. Verify that one file with native `wc` and `shasum`. Then display exactly that same single line range with a separate native `sed` command so the reviewer reads every byte from line 1 through line 173 without an aggregate terminal output.
3. Reconstruct with `/bin/cat` and an explicit ordered list of `chunk-001.bin` through `chunk-021.bin` into one reviewer-unique `/tmp` file. No wildcard is allowed. Verify its byte count, LF count, UTF-8 round trip, and SHA-256 against the aggregate invariants. The reconstructed file must never be emitted to the terminal.
4. Perform the scope-specific v2.14 Section 3 review. Any derived ledger/envelope material goes only in the reviewer-unique `/tmp` directory and must be checked with non-heredoc byte accounting.
5. Immediately before the final response, repeat the complete original-target identity sequence as the after snapshot. The original absolute path, not a copy, must be observed. Compare before/after fields explicitly.

The explicit concatenation order is:

```text
chunk-001.bin chunk-002.bin chunk-003.bin chunk-004.bin chunk-005.bin chunk-006.bin chunk-007.bin
chunk-008.bin chunk-009.bin chunk-010.bin chunk-011.bin chunk-012.bin chunk-013.bin chunk-014.bin
chunk-015.bin chunk-016.bin chunk-017.bin chunk-018.bin chunk-019.bin chunk-020.bin chunk-021.bin
```

## 5. Batch and authority boundary

This plan contains no task ID and no HMG4RB4. Those values may exist only after the task system returns exactly three fresh, distinct user-owned task IDs. The HMG4RB4 preimage and scope order remain exactly those in v2.14 Section 3: `schema`, `adversarial`, `whole`. Each task must receive the plan’s exact path and post-freeze SHA-256 together with the contract identity, all three ordered task IDs, and HMG4RB4 before it begins any evidence-bearing command.

The three tasks are review-only. They may not edit the workspace, create or modify a contract, produce or test a helper, inspect or reuse a retired implementation, change V28, install anything, launch an original runtime, apply, recover, accept, promote, integrate, release, or publish. A review result cannot authorize production-helper implementation. Any later implementation requires the separate authenticated post-review authorization described by v2.14 Section 3 and all retained Section 4 gates.
