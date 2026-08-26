# G5 L4 Missing KeyTerm Recovery Readiness

Release: `lesson-g05-l04-number-lines` — **Number Lines**  
State: **public-safe, hash-bound, fail-closed; no exact recovery candidate**

This acceptance-neutral report binds the complete current source catalog, G5 L4
course XML and shipped shell, shell FFDec export and machine reports, both
preserved grade-wide glossary XML files, the separately authorized 2015
combined-reference intake, the G5 L4 source-gap report, complete
historical technical-source crosswalk and authority catalog, and privacy-safe
SQL catalog/aggregate. It exposes no historical raw path or personal data and
copies or modifies no preserved source.

## Missing targets

| Language | Target basename | Exact candidates | Physically present | Import authorized |
| --- | --- | ---: | --- | --- |
| english | `L4KTE01.xml` | 0 | no | no |
| spanish | `L4KTS01.xml` | 0 | no | no |

Both targets also have **0** normalized historical filename aliases and **0**
privacy-safe SQL catalog or aggregate references.

## Declared source gap versus shipped-shell static routing

- Preserved declaration: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index.xml`
  (11841 bytes; SHA-256
  `b6f1718da8f5e909cb96c883902009887eb965d41e41588318b4bfb36c8f7a36`)
- Shipped shell: `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/index_local.swf`
  (658851 bytes; SHA-256
  `7865195a07666e8123bef33f52aea36e06b7e0a9987fbbea605bc92cbe9b0301`)
- Shell machine report: `migrations/shell-course-g05-l04-index-local/audit/machine/report.json` — SHA-256
  `d2e21b988381b3dae53204f808003aabe0fa118b4dfb4c3d8c4046f85a854b59`
- Shell FFDec script bundle: `migrations/shell-course-g05-l04-index-local/audit/machine/ffdec-scripts.txt.gz` — SHA-256
  `ebf3a470ac5e78ce1da9e3ac0bdfb9c5a33777f370361632fb3697bb4e523706`; expanded SHA-256
  `dc415e19f79adbb64a4e9073c1342532082495f30b124a2cf90ec2325a4586b0`
- Course XML declarations: **L4KTE01.xml 1 / L4KTS01.xml 1**
- Shipped-shell literal references: **L4KTE01.xml 0 / L4KTS01.xml 0**
- Shipped-shell grade-wide targets: **ELKTEG4.xml 2 / ELKTSG4.xml 1**
- Generic `XML.load(KeyTermVar)` calls: **2**

These are two different evidence statements. The lesson-local files remain a
declared and unresolved source gap. The shipped SWF's static ActionScript instead
points to the grade-wide files, but FFDec code cannot prove runtime reachability,
successful loading, interaction causality, or that the XML declarations are
stale. Original-runtime authority remains **false**.

## Authorized combined elementary KeyTerm reference

The Owner relayed Content Manager Venky's direction on **2026-07-30** to use
the combined elementary KeyTerm files as the G5 L4 product reference. That
direction is recorded as **reference use authorized: true**; independent email
header verification remains **false**.

| Language | 2015 intake path | Bytes | SHA-256 | Parsed records | Known unrelated malformed records |
| --- | --- | ---: | --- | ---: | ---: |
| english | `source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTEG4.xml` | 398191 | `d39fab547dde0476c27caa01c8e3e2443d71cc40eb2df725e7a50102d01ab42c` | 814 | 0 |
| spanish | `source-assets/flash/intake/2026-07-30-venky-combined-keyterms/ELM/ELKTSG4.xml` | 396776 | `a3aab5a75cd635f88ba5883a5fc2715ea144f51ac5efedac0341c5801c672c6d` | 812 | 1 |

Both intake files resolve all **7**
statically linked G5 L4 terms exactly once. The one known malformed Spanish
record is unrelated to those seven terms. The intake files are not byte-identical
to the current preserved master pair and are **not** verified runtime byte
variants. The client selection remains the canonical preserved 2008 master;
the 2015 intake is unselected for full import and blocked by the malformed
source record.

This authorization is intentionally narrow: exact lesson-local recovery remains
**0/2**, `L4KTE01.xml` and `L4KTS01.xml` remain missing,
lesson-specific substitution remains **false**, source-gap closure remains
**false**, and no fidelity, strict-completion, or publication gate changes.

## Static lesson term links and illustration availability

The exact 54 activity-member FFDec bundles were scanned and hash-bound to their
machine reports, script-inventory reports, release identities, and source SWFs.
Binding-set SHA-256: `9380d872e378f2f427f398322e069ad5c1b1019a3020b4ee79e091a5e78a169c`.

| Linked member | Link occurrences | FFDec bundle | SHA-256 |
| --- | ---: | --- | --- |
| `course-g05-l04-vb-010` | 4 | `migrations/course-g05-l04-vb-010/audit/machine/ffdec-scripts.txt.gz` | `32971c64df35ce9a98d503a7aa1de8d252ebacd0e85339353f6638a8d2d40e64` |
| `course-g05-l04-vb-011` | 8 | `migrations/course-g05-l04-vb-011/audit/machine/ffdec-scripts.txt.gz` | `ea97e30fbd2e31c2f23adadbff70eb4425ad86b25849d0dc8774ceb7ff19d4d8` |
| `course-g05-l04-in-005` | 4 | `migrations/course-g05-l04-in-005/audit/machine/ffdec-scripts.txt.gz` | `490e0b2a1189aa8f48c73800a931be52cdd5668d4e1c5b302d9c9f21a42f372d` |

| Linked term | Occurrences | EN / ES master record | Illustration SWF | Path | SHA-256 |
| --- | ---: | --- | --- | --- | --- |
| Positive Integers | 1 | yes / yes | missing | `HELP_KEYTERMS/KT/ELEMENTARY/DIG/Positive_integers.swf` | — |
| Integers | 3 | yes / yes | missing | `HELP_KEYTERMS/KT/ELEMENTARY/DIG/integers.swf` | — |
| Greater than | 1 | yes / yes | missing | `HELP_KEYTERMS/KT/ELEMENTARY/DIG/Greater_than.swf` | — |
| Zero | 3 | yes / yes | missing | `HELP_KEYTERMS/KT/ELEMENTARY/DIG/Zero.swf` | — |
| Negative Integers | 2 | yes / yes | missing | `HELP_KEYTERMS/KT/ELEMENTARY/DIG/Negative_integers.swf` | — |
| Less than | 2 | yes / yes | present | `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/less_than.swf` | `74af679f4f90101266e18cdb7880a777571ea344ef7699ea06a499205f8cf374` |
| Decimal | 4 | yes / yes | present | `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/decimal.swf` | `f8a391c6fb12f49893daec95957c85bcb1a58b35c6a55e2e4bf9df961c0ba4d7` |

Static totals: **16** link occurrences,
**7** unique terms, all with one exact
record in each grade-wide master glossary. Referenced illustration SWFs are
physically present for **2**
of **7** unique terms
(**6** of
**16** occurrences); the other
**5** unique illustration SWFs are
missing. This is planning evidence only and authorizes neither XML substitution
nor runtime/fidelity acceptance.

## Different-basename master-glossary lead

- Class: **different-basename master-glossary lead only**
- SHA-256: `c7d92527369fe98f3cba813acc2ea421a1a5de955465a565c2081dcebcdd1adf`
- Bytes: **342317**
- Physical presence: **true**
- Authority: **technical-source-file / high confidence**
- KeyTerm records: **659**
- Exact current source matches: **0**
- Exact target basename references: **0**
- Exact target candidate / substitution / import: **false / false / false**

The lead may inform format and provenance questions only. It must not be
renamed, copied, or substituted for either missing target.

## Recovery and acceptance boundary

- Exact recovered targets: **0/2**
- Combined elementary product-reference use authorized: **true**
- Runtime byte variant verified: **false**
- Source gap closed: **false**
- Implementation or import authorized: **false**
- Strict completion: **0/55**
- Published: **false**

Next action: the owner or designated source custodian should search original
KeyTerm build outputs or deployment backups for the two exact basenames and
hash-bind any recovered file before review. If recovery is exhausted, use a
validator-supported reviewed exception without inventing bilingual content.
