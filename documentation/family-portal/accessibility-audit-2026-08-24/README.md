# Family Portal accessibility engineering review — 2026-08-24

## Disposition

`AUTOMATED_AND_VISUAL_CANDIDATE_PASS` for the isolated synthetic Family
workspace. This is not `ACCESSIBILITY_ACCEPTED`: no named independent reviewer,
manual screen-reader run, zoom/reflow acceptance, or human WCAG 2.2 AA receipt
exists for this artifact.

## Scope and safety boundary

- Local synthetic Family Portal only; no provider, database, real email, real
  learner or external network destination was connected.
- Family overview and messaging were inspected at `1440 x 1000` and
  `375 x 812` in light and dark themes.
- Keyboard entry, the skip link, responsive navigation, touch targets and the
  main Family task surfaces were checked against the rendered page rather than
  source structure alone.
- Existing automated axe checks now cover Overview, Progress, Assignments,
  Messages and Settings; blocking `serious` or `critical` findings fail the
  browser test.

## Finding resolved in this pass

The compact EN/ES links measured `39 x 34` CSS pixels on the phone layout,
below the product plan's 44-pixel target. Both links now have a minimum rendered
size of `44 x 44`, and the browser regression measures that size at the
375-pixel viewport.

The skip link was initially observed during its 150 ms entrance transition.
After the transition settled it measured about `182 x 49` at `(16, 16)`, was
visibly focused, and activation moved focus to `main#main-content`. No skip-link
code change was required.

## Current evidence

- Family wildcard unit/contract suite: `51/51` passed in this review run.
- Synthetic Family Playwright: `7/7` passed after adding the touch-target and
  axe coverage.
- TypeScript and exact changed-file ESLint: passed.
- Direct Next production build: passed. The repository build wrapper remains
  independently blocked before Next by the missing G5 `L5VB12.swf` source;
  that source was not copied, fabricated or changed for this review.
- The responsive Family navigation remains an intentional horizontally
  scrollable, labelled navigation region at phone widths. The 375-pixel sample
  measured a 343-pixel viewport over 921 pixels of navigation content; all five
  links remain in the accessibility tree. Manual assistive-technology review
  remains required before acceptance.

## Captured rendered evidence

- [Family overview — desktop](./family-overview-desktop.png)
- [Family overview — phone](./family-overview-phone.png)
- [Visible keyboard skip link](./family-keyboard-skip-link.png)
- [Family messages — desktop](./family-messages-desktop.png)
- [Family messages — phone, light](./family-messages-phone-light.png)
- [Family messages — phone, dark](./family-messages-phone-dark.png)

| Image | SHA-256 |
| --- | --- |
| `family-overview-desktop.png` | `fb938611984de2da9bcf14a64e8a9d2457a8eed51e004c425408b159074ebda0` |
| `family-overview-phone.png` | `9a849517867d6033bcfaa1cb9da160cfa2aea0a7e835282e2c62a61ff440f8d3` |
| `family-keyboard-skip-link.png` | `2f731eb57bade538998c016b156b1bed6d9bf73a4419486cd9579e6772a6b544` |
| `family-messages-desktop.png` | `b06a741d52a86a0020d41e8ed0218bd66579ada8a0c1e5e9bedb09da5d205506` |
| `family-messages-phone-light.png` | `827a962e29399418f2a33a4d467575ab36f31e28f97ea0d8422b160669989a59` |
| `family-messages-phone-dark.png` | `f855efa78619d3b52e5be01ec426da8a3c8b5c700e6b850264faf11fc6f7b043` |

## Acceptance work still open

- Named manual WCAG 2.2 AA review of the complete protected flow.
- VoiceOver and at least one second screen-reader/browser combination, including
  announcements, validation errors, thread history and focus restoration.
- Manual 200% and 400% zoom/reflow, text spacing, high-contrast/forced-colors,
  reduced-motion and print review on target operating systems.
- Human EN/ES parity review on phone, tablet and Chromebook-class layouts.
- Independent acceptance receipt bound to the final deployed artifact.
