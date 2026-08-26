# HELP Math 2.0 — logo

Every file here is generated. Edit `build-logo.mjs`, then:

```bash
node "design/brand/build-logo.mjs"
```

The hand geometry and the letterforms live in one place in that script, so the
app icon, the horizontal lockup and the one-colour versions can never drift
apart. `contact-sheet.html` shows the whole set at real sizes.

## The idea

HELP Math 1.0 was a blue square, orange `HELP` over orange `MATH`, and two
hands: a gold one in front, an outlined one behind it. The outlined hand is the
whole program in one shape — *someone is helping you*.

2.0 keeps all of it and changes exactly one thing: **the helping hand is now
drawn as an outline of light.** Same silhouette, same posture, same size
relationship — a wireframe with a lit node at each fingertip. That is the AI.

The two hands stand clear of each other with the plus in the gap between them,
so the mark reads as a sentence at a glance: helper **+** learner.

Three decisions carry the argument:

- **The learner's hand is larger.** The helper stands to its left and smaller.
  AI supports; it does not lead. If the hands were the same size the logo would
  be saying something we do not mean.
- **They meet at a plus.** *Positive* influence, literally — and the first
  operator any of these students ever learned. It is the brightest thing in the
  mark, and it sits in clear ground between the hands, touching neither.
- **The orange is untouched.** `#f7941e` is the one colour carried over from
  1.0 at full strength. Returning teachers should recognise this instantly.

Everything else has been taken out. No graph paper, no palm mesh, no glow
behind the nodes — at icon sizes each of those cost more than it gave.

## How the hand is drawn

A mitten-round palm, five capsule fingers, and a bulb at each fingertip a
little wider than the finger — so the tips read rounder than the shafts. The
fingers are narrower than four of them would need to be to fill the palm, and
splayed, so the notches between them stay open even after the outline dilates.

Two rules keep it free of seams, and both are easy to break by accident:

- **The gold gradient is `userSpaceOnUse` in hand coordinates.** With the
  default `objectBoundingBox`, a gradient referenced by six shapes restarts on
  each one and you get a visible join at every finger.
- **The helper hand is a mask, not stroked parts.** The mask is the silhouette
  grown by the outline weight, minus the silhouette itself, so what you see is
  the true union contour. Stroking the palm and the fingers separately draws
  every capsule end inside the palm.

## Palette

| Role | Hex | Token |
| --- | --- | --- |
| Field, light stop | `#1768d4` | `--blue` |
| Field, dark stop | `#12386b` | `--navy` |
| Wordmark | `#f7941e` | *heritage HELP orange (new token)* |
| Learner's hand | `#ffd873` → `#f2b02f` | around `--yellow` `#f8cb4b` |
| Helper hand | `#4fc6a6` → `#cdeafa` | `--mint` → `--sky` |
| One-colour ink | `#14213d` | `--ink` |
| One-colour paper | `#fffdf7` | `--paper` |

Only the orange is new. Everything else already exists in
`apps/web/app/globals.css`.

## Files

| File | Use |
| --- | --- |
| `helpmath2-logo-primary.svg` | The logo. Print, decks, splash, anywhere ≥ 64 px. |
| `helpmath2-mark.svg` | App icon, avatars, favicon ≥ 64 px. |
| `helpmath2-mark-small.svg` | 24–64 px. Fingertip nodes dropped. |
| `helpmath2-favicon.svg` | ≤ 24 px. Learner's hand and the plus only. |
| `helpmath2-lockup-horizontal.svg` | Site header, on paper/white. |
| `helpmath2-lockup-horizontal-dark.svg` | Same, on `--ink`. |
| `helpmath2-mark-mono-ink.svg` | One ink on a light background. |
| `helpmath2-mark-mono-knockout.svg` | Reversed out of a dark background. |
| `helpmath2-concept-b-open-palm.svg` | Alternate: "In Your Hand". |
| `helpmath2-concept-c-counting-constellation.svg` | Alternate: "Counting Constellation". |

## Rules

- **Clear space** on all sides is the cap height of `HELP` — 92 units in the
  512 grid, or 20% of the mark's width.
- **Minimum sizes.** Primary lockup: 64 px. Mark: 32 px. Below 24 px use the
  favicon; the two-hand composition turns to mud there.
- **Do not** re-letter the wordmark in a live font. It is drawn as outlines on
  purpose, so it renders identically without Fredoka installed.
- **Do not** recolour the hands to the same hue. The gold/mint split is what
  says which hand is the learner.
- **Do not** put the mark on a busy photo. Give it flat blue, ink, or paper.
- **Do not** add the plus back onto either hand. It belongs in the gap; that
  gap is what makes the mark read as helper **+** learner.

## On "2.0"

The version is deliberately not in the mark — logos outlive release numbers,
and a school district that adopts this will be looking at it for a decade. Use
"HELP Math 2.0" in copy, headers and the `<title>`, and keep the mark clean.

## Wiring it into the app

Nothing under `apps/web/` has been changed. When you want it live:

- `apps/web/app/icon.svg` ← `helpmath2-mark.svg`
- site header ← `helpmath2-lockup-horizontal.svg`
- `apps/web/public/opengraph-image.png` ← re-render from the primary lockup
