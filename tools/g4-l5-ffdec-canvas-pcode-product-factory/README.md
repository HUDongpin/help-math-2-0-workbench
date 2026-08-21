# G4 L5 FFDec Canvas + P-code product factory candidate

This is the page-only Grade 4 Lesson 5 factory candidate for
**Multiplication**. It binds the exact 53 active lesson-page occurrences in
the source `index.xml` order, excludes the legacy Flash course shell, and
retains the modern HELP Math 2.0 My Lesson host.

The source-backed corpus is unusually clean for a new factory:

- 53/53 active page SWFs are in canonical custody.
- 47 pages have paired FLA and SWF files; six are SWF-only.
- 48 pages have one exact matching-basename external MP3 association.
- The three Final Quiz pages use a catalog audio group instead of an exact
  page-local cue.
- Current-JS registration starts at 0/53.
- No G4 L5 migration workspace or lesson-release definition is inherited.

The six-page calibration set deliberately spans the largest SWF-only Review
page, a large paired vocabulary page, a large paired instruction page, the
largest Try It page, the larger game without an exact external MP3, and a
version-7 Final Quiz wrapper with group-level audio.

The compiler stage records immutable SWF/FLA/MP3 identities, FFDec Canvas
output, P-code classification, nested timeline structure, structural audio
tags, and headless first/middle/last root-frame smoke captures. This stage is
only the front half of the factory.

The factory is not qualified for scale-out until every frozen calibration
member also passes through a compact source-bound IR/config, a generated
candidate, a maintained module or adapter, the official Current-JS registry,
a source-ordered calibration descriptor, a private modern My Lesson host,
Replay/interaction/audio lifecycle checks, and desktop/mobile browser QA.
FFDec-generated structure alone is not Current-JS product completion.

FFDec-generated output has a GPL-3.0 boundary. It must not be copied into a
product bundle without project-specific licensing review.

```bash
node --test scripts/build-g4-l5-ffdec-canvas-pcode-product-factory.test.mjs

node scripts/build-g4-l5-ffdec-canvas-pcode-product-factory.mjs \
  --mode calibrate \
  --output work/g4-l5-ffdec-canvas-pcode-product-factory/calibration-v1

node scripts/build-g4-l5-ffdec-canvas-pcode-product-factory.mjs \
  --mode check \
  --output work/g4-l5-ffdec-canvas-pcode-product-factory/calibration-v1

# Full 53-page structural extension is allowed only after product
# qualification records an explicit scale-out decision.
```
