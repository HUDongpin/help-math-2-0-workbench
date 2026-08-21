# HELP Math 2.0 — rich-blue logo review v4

Status: **local owner-review candidate only**. This design is not adopted,
committed, pushed, deployed, or present on `helpmath.ai`.

## Owner-feedback correction

The pale-cyan ImageGen exploration is rejected. Its washed-out field weakened
the orange/gold hierarchy and lost the familiar HELP Math blue/navy weight.
It is not a geometry source, runtime asset, or review recommendation.

Use `helpmath2-logo-high-contrast-review-v4.svg` as the corrected owner-review
candidate. It preserves the exact supplied/current composition and the exact
canonical background treatment. Only the AI helper changes colour:

- field: unchanged `#1768D4` → `#12386B`;
- upper-left radial glow: unchanged;
- AI helper: `#E2FFF7` → `#F0FDFA` → `#FFFFFF`;
- heritage orange wordmark: unchanged;
- learner gold: unchanged;
- white plus: unchanged;
- hand geometry, fingertip nodes, masks, lettering, alignment, rounded square,
  spacing, and size hierarchy: unchanged.

This is the strongest constraint-aligned solution: keep the attractive rich
background and solve recognition through the AI foreground alone.

## Measured result

These are internal small-size legibility diagnostics, not a formal WCAG logo
conformance claim. WCAG exempts logotypes from the ordinary text-contrast
requirement, but the ratios provide a repeatable comparison target.

At the same four clean-pixel locations in the 512px render:

| Location | Current | V4 Sharp | V4 Chromium |
| --- | ---: | ---: | ---: |
| Upper AI finger | 2.863:1 | **4.512:1** | **4.566:1** |
| Right AI fingertip | 3.156:1 | **4.922:1** | **4.919:1** |
| Lower AI wrist | 3.565:1 | **5.928:1** | **6.010:1** |
| Fingertip node | 4.048:1 | **5.069:1** | **5.076:1** |

The weakest clean AI-hand sample now exceeds the 4.5:1 internal target in both
renderers. The margin is narrow in Sharp, so the v4 AI colors should not be
darkened or the field brightened without remeasurement.

At the true 64px cut, representative same-Chromium antialiased edges improve:

| Location | Current | V4 |
| --- | ---: | ---: |
| Upper outline | 1.728:1 | **2.315:1** |
| Right outline | 2.350:1 | **3.386:1** |
| Lower outline | 1.956:1 | **2.709:1** |

Antialiased one-pixel edges blend foreground and background, so they do not
retain the full source-colour ratio. Visual inspection at 64px confirms that
the outlined hand is materially easier to identify.

Because the field, glow, orange, gold, and plus are unchanged, their 64px
appearance remains equal to the current logo: `HELP` 1.878:1, `MATH` 2.942:1,
plus 5.442:1, gold centre 4.469:1, and gold side 4.450:1. A deterministic raster
comparison confines every visual change to the left AI-hand region.

## Review files

- `high-contrast-review-v4.html` — responsive before/after board with 512,
  128, 64, and 32px cuts plus simulated desktop and 320px HELP Math headers;
- `helpmath2-logo-high-contrast-review-v4.svg` — recommended editable vector;
- `help-math-2-logo-current-reference.png` — byte-identical local copy of the
  supplied/current header PNG for controlled comparison;
- `build-logo.mjs` — shared geometry source and fail-closed review generator.

To verify or generate only v4, without rewriting any canonical SVG:

```bash
node design/brand/build-logo.mjs --review-high-contrast-v4
```

Existing review versions are hash-protected: if a same-version file exists
with different bytes, the generator stops and requires a new version rather
than overwriting the prior review artifact.

To view the board locally, serve only this design folder:

```bash
python3 -m http.server 3212 \
  --bind 127.0.0.1 \
  --directory "design/brand"
```

Then open `http://127.0.0.1:3212/high-contrast-review-v4.html`.

## Hash and adoption boundary

- supplied/current PNG SHA-256:
  `936f758b4319041a13ec144f44d80edd65983be7c194aff5bd062fa77f4195bf`;
- current-reference copy SHA-256: the same value;
- v4 SVG SHA-256:
  `13339d555d2ab64e986c20af68b7c08f01abc6dece75307eff80cf6c81c9dd70`.

The review generator exits before the canonical emit sequence. The existing
ten brand SVGs and current app PNG remain byte-identical. The v4 filename has
no runtime references under `apps/web`, `packages`, or `scripts`.

Do not replace the header PNG, footer, favicon, Open Graph image, lesson-player
branding, or any public asset until the owner explicitly approves this design.
