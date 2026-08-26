# G3 L2 FFDec Canvas + P-code factory

This is the bounded, page-only Grade 3 Lesson 2 cross-grade calibration
factory. It selects the exact 70 active lesson-page occurrences in
`index.xml` order, rejects the legacy course shell, and leaves the modern My
Lesson host intact.

The six-page calibration set spans paired and SWF-only sources, Review,
Vocabulary, Instruction, Try It, Game Show, and Final Quiz sections. Five of
the six pages carry an exact matching-basename external MP3 association. The
full corpus has 62 such pages; the catalog records their language as
`und`, so the factory must not label them English or Spanish.

The output records immutable SWF/FLA/MP3 identities, FFDec Canvas output,
P-code classification, nested timeline structure, structural audio tags, and
headless first/middle/last root-frame smoke captures. It does not execute AVM1,
integrate audio, establish runtime reachability or fidelity, register a
Current-JS page, create human/Owner acceptance, release, or publish.

FFDec-generated output has a GPL-3.0 boundary. It must not be copied into a
product bundle without project-specific licensing review.

The first RW002 run also established a real cross-grade difference: the G5
factory's redundant standalone export of every shape, morph, and button was
externally terminated on this Grade 3 asset. This factory therefore exports
the resource-bounded frame/sprite/script/image/sound closure. Frame and sprite
Canvas documents retain their transitive drawing functions; standalone
shape/morph/button viewer pages are not factory outputs.

```bash
npm run test:g3:l2:ffdec-factory
npm run factory:g3:l2:ffdec:calibrate
npm run factory:g3:l2:ffdec:calibrate:check
npm run factory:g3:l2:ffdec:extend
npm run factory:g3:l2:ffdec:extend:check
```
