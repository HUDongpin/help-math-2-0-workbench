# G4 L3 FQ002 source-local quiz contract

- Animation: `course-g04-l03-fq-002`
- Status: `verified-source-local-random-question-contract-static-branch-atlas-only`
- Active domain: `sprite-899`, frames 1–68
- Question labels: Q1–Q25 at frames 2–26
- Review transition: frames 27–43; frame 43 is `stop()`
- Review labels: R1–R25 at frames 44–68
- Natural contract: choose 10 of 25 questions without replacement, retaining each matching review label.

The active SWF initializes the answer, question, review, count, and response arrays inside sprite-899 before calling `doGetRandomQuiz()`. Initial question selection is therefore source-local, not host-initialized. Terminal reporting/close behavior, answer interaction, score state, dynamic feedback, audio, and host navigation remain disabled.

Frames 1–68 may be inspected only as a static source branch atlas. They are not a natural 1→68 playback sequence; live playback is capped at frame 1. This evidence executes no ActionScript and grants no fidelity, parity, human, owner, or strict acceptance.
