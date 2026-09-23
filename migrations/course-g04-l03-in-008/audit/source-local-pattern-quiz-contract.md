# G4 L3 IN008 source-local pattern quiz contract

- Animation: `course-g04-l03-in-008`
- Status: `verified-source-local-pattern-quiz-initial-state-and-post-stop-static-frame`
- Main domain: `sprite-57`, frames 1–217
- Quiz entry: frame 216, with a source `stop()`
- Source questions: 5

Frame 216 initializes five pattern questions locally, chooses one with `random(qLableArray.length)`, removes the selected tuple, populates the question text, and stops. Frame 217 contains a second `stop()` plus an audio-stream block and is post-stop static inspection only.

The IN008 dynamic field declares device-font rendering and its embedded subset omits some required digits. The current-JavaScript drawing therefore supplements only the missing glyphs from the same lesson's IN006 Bauhaus subset after proving all 34 shared glyph outlines and advances equivalent. This is source-derived current-JavaScript evidence, not an authoritative original-runtime baseline. Inputs, checking, New Problem, reset, feedback, audio, hyperlink behavior, natural random execution, parity, human review, owner acceptance, and strict completion remain pending.
