# Adobe Animate recursive pilot authoring-audit operator card

All eight FLA-backed pilots now have hash-valid, current recursive schema-v2
authoring audits. Confirm that state first with:

```bash
npm run audit:animate:stage-pilots:check
npm run audit:animate:pilot-index:check
```

Do not repeat an Animate run while both checks pass. The procedure below is a
recovery/refresh runbook only, for a pilot whose canonical authoring audit has
been invalidated by an explicit contract or source change.

This procedure does not authorize saving, publishing, exporting a converted
FLA, or treating authoring evidence as original-runtime, audio, human-review,
owner, or strict-acceptance evidence.

## Pinned inputs

The complete working-copy manifest is
`work/animate/read-only-fla-copies/manifest.json`, SHA-256
`43df191f9a2c9ba2e64b56b6771472751e33d29e87da446224509b88e2a53613`.
Every listed copy is mode `0444` and byte-identical to its immutable source FLA.

| Animation | Read-only working copy | SHA-256 | Capture frame |
|---|---|---|---:|
| `formula-elementary-conversion-01-01` | `work/animate/read-only-fla-copies/formula-elementary-conversion-01-01/Conversion_1_1.fla` | `9b369aa2a927e0417a7aef0c94956f609643b6c6737ba824a308d32ba8d928d4` | 94 |
| `formula-elementary-conversion-01-02` | `work/animate/read-only-fla-copies/formula-elementary-conversion-01-02/Conversion_1_2.fla` | `7c59923ebd200f4fb951e1c9a7683861c21af7688d537fa5fca370acf6d9291d` | 109 |
| `formula-elementary-conversion-01-03` | `work/animate/read-only-fla-copies/formula-elementary-conversion-01-03/Conversion_1_3.fla` | `db7e027066f69dffe2337c36b6810182eb50ca8d5e5e020b6c5f43975517233b` | 170 |
| `formula-elementary-conversion-01-04` | `work/animate/read-only-fla-copies/formula-elementary-conversion-01-04/Conversion_1_4.fla` | `d661c776e239fb59c44278c6e4d5fd75812599eb2dc9fa758b1ba37a59251b1c` | 67 |
| `keyterm-elementary-acute-angle` | `work/animate/read-only-fla-copies/keyterm-elementary-acute-angle/acute_angle.fla` | `f129e5a338c2d9c70d004e8473f6cb3ea7f4883f67d28ebe72607057f9ef6837` | 60 |
| `keyterm-elementary-computeghgh` | `work/animate/read-only-fla-copies/keyterm-elementary-computeghgh/computeghgh.fla` | `6307c1d0ceced1527981c40bce6bd7b4015a7f0f5c650546cac2a5c095add722` | 35 |
| `course-g03-l01-vb-004` | `work/animate/read-only-fla-copies/course-g03-l01-vb-004/L1VB04.fla` | `49f1694f1a7ec200d4d3455c1bc29699b83146043b7c0f25165228b32a9e3a1a` | 10 |
| `course-g04-l01-ir-001` | `work/animate/read-only-fla-copies/course-g04-l01-ir-001/L1RW01.fla` | `c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9` | 10 |

Run this exact script through Animate's menu:

`/Users/peter/Desktop/HELP MATH_Flash_To_JS/scripts/animate-audit-current-document.jsfl`

Pinned JSFL SHA-256:

`043188cb940adc1895a8682ca2c5e146faf07e96a03bade11c62073055dda0ae`

The latest blank-document cold-start probe passed with Animate
`MAC 21,0,7,42652`. Its receipt is
`work/animate/jsfl-cli-probes/run-z5AdDW/probe-result.json`, SHA-256
`93bcfaedd4b957bbf4bacc92a761096dc088d4d306f34b7d43a0c5eab55b4e21`.
That probe proves only JSFL availability, not any pilot FLA.

## Run exactly one FLA per fresh Animate process

Preferred assisted command (one animation per invocation):

```bash
npm run audit:animate:assist -- <animation-id>
```

When the conversion warning appears, acknowledge that warning only. The
command then moves to the pinned frame, runs the pinned recursive JSFL, closes
without saving, quits Animate, validates the outputs, and finalizes schema-v2
evidence. It does not record human/owner approval or runtime fidelity. Use the
manual steps below only when the assisted controller cannot resume after the
warning.

For each row, in order:

1. Confirm Adobe Animate is completely closed.
2. Open only the exact read-only working copy in that row. Never open the file
   under `source-assets/` for this session.
3. Acknowledge the legacy ActionScript conversion warning. The conversion is
   in memory only.
4. Move the root timeline playhead to the listed capture frame.
5. Choose **Commands → Run Command…** and select the pinned JSFL file.
6. Wait for Animate to report both the JSON audit and current-frame PNG paths.
7. Close the document and choose **Don't Save**. Do not publish or export.
8. Quit Animate completely before opening the next FLA.

The expected raw files are `work/animate/<FLA-basename>-authoring-audit.json`
and `work/animate/<FLA-basename>-frame-<n>.png`.

## Finalize after closing without saving

Run the finalizer for each completed row:

```bash
npm run audit:animate:stage-pilots:check
npm run audit:animate:finalize -- <animation-id>
```

The schema-v2 finalizer fails unless all of the following remain true:

- the opened path is the exact registered read-only working copy;
- working-copy permissions are read-only and its bytes equal the source FLA;
- the raw audit contains recursive root and library timelines plus an
  `elements[]` inventory at every authoring keyframe;
- stage, FPS, and root frame count agree with the shipped SWF manifest;
- the authoring PNG is a valid native-stage-size PNG;
- the current JSFL file and every evidence byte are SHA-256 bound.

Only after the finalizer passes should the old shallow canonical audit be
replaced. Original SWF bytecode remains authoritative for AS1 scripts removed
by Animate's in-memory conversion.
