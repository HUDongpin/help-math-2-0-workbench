# Adobe Animate keyterm authoring-audit operator card

> Superseded for the current recursive schema-v2 audit contract. Use
> `docs/ANIMATE_PILOT_AUDIT_OPERATOR_CARD.md`, which covers all eight
> FLA-backed pilots and the required current-JSFL refresh of six older shallow
> audits. The keyterm paths and hashes below remain historically correct.

This card covers the two pilot FLAs that still lack a canonical Adobe Animate
authoring audit. It does not authorize saving, publishing, exporting a converted
FLA, or treating authoring evidence as runtime/audio fidelity.

## Pinned inputs

| Animation | Open this read-only working copy | Expected SHA-256 | Terminal frame |
|---|---|---|---:|
| `keyterm-elementary-computeghgh` | `work/animate/read-only-fla-copies/keyterm-elementary-computeghgh/computeghgh.fla` | `6307c1d0ceced1527981c40bce6bd7b4015a7f0f5c650546cac2a5c095add722` | 35 |
| `keyterm-elementary-acute-angle` | `work/animate/read-only-fla-copies/keyterm-elementary-acute-angle/acute_angle.fla` | `f129e5a338c2d9c70d004e8473f6cb3ea7f4883f67d28ebe72607057f9ef6837` | 60 |

Run this audit script through Animate's menu:

`/Users/peter/Desktop/HELP MATH_Flash_To_JS/scripts/animate-audit-current-document.jsfl`

Pinned script SHA-256:

`043188cb940adc1895a8682ca2c5e146faf07e96a03bade11c62073055dda0ae`

The current blank-document cold-start probe passed with Animate
`MAC 21,0,7,42652`. Its receipt is
`work/animate/jsfl-cli-probes/run-xcFC9i/probe-result.json`.

## Run one FLA per fresh Animate process

Perform the following sequence first for `computeghgh`, then repeat from a fresh
process for `acute_angle`:

1. Confirm Adobe Animate is completely closed.
2. Open only the exact working copy listed above. Never open the file under
   `source-assets/` for this session.
3. Acknowledge the legacy ActionScript conversion warning. This conversion is
   in memory only.
4. Move the root timeline playhead to the listed terminal frame.
5. Choose **Commands → Run Command…** and select the pinned JSFL file.
6. Wait for Animate to report both the JSON audit and current-frame PNG paths.
7. Close the document and choose **Don't Save**. Do not publish or export.
8. Quit Animate completely before opening the second FLA.

Expected raw outputs:

- `work/animate/computeghgh.fla-authoring-audit.json`
- `work/animate/computeghgh.fla-frame-35.png`
- `work/animate/acute_angle.fla-authoring-audit.json`
- `work/animate/acute_angle.fla-frame-60.png`

The JSFL recursively inventories root and library keyframes, layer/mask
relationships, instances, depths, matrices, text/font attributes, filters,
color transforms, tweens, and sound placements. Unsupported or converted
legacy properties may remain `null`; SWF bytecode remains authoritative for
runtime scripts and behavior.

## Finalize only after both documents are closed without saving

From the repository root:

```bash
shasum -a 256 \
  work/animate/read-only-fla-copies/keyterm-elementary-computeghgh/computeghgh.fla \
  work/animate/read-only-fla-copies/keyterm-elementary-acute-angle/acute_angle.fla

npm run audit:animate:finalize -- keyterm-elementary-computeghgh
npm run audit:animate:finalize -- keyterm-elementary-acute-angle
```

The finalizer fails closed unless an available working copy is the exact file
recorded by Animate and remains byte-identical to its source FLA. Passing this
step proves authoring structure only. Original runtime traversal, bilingual
audio, all-frame diffs, strict named-human review, and owner acceptance remain
separate gates.
