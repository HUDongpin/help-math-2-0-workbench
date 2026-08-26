# G4 L3 TI005 source-local pattern quiz contract

- Animation: `course-g04-l03-ti-005`
- Status: `verified-source-local-pattern-quiz-initial-state-and-post-stop-static-frame`
- Main domain: `sprite-208`, frames 1–210
- Quiz entry: frame 209, with a source `stop()`
- Source questions: 5

Frame 209 initializes five pattern questions locally, chooses one with `random(qLableArray.length)`, removes the selected tuple, populates the question text, and stops. Frame 210 has only a silent audio-stream block plus `ShowFrame`; it is post-stop static inspection only.

The dynamic field requests a device-rendered bold Bauhaus font, but TI005 embeds only a partial subset. The current-JavaScript drawing fills missing digits/minus and comma from two owner-provided subsets only after proving every shared outline and advance equivalent. This does not establish the original device-font runtime. Inputs, checking, New Problem, reset, feedback, audio, natural random execution, parity, human review, owner acceptance, and strict completion remain pending.
