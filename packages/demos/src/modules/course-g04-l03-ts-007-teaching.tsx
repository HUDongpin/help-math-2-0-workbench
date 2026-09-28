import React from "react";

import {
  COURSE_G04_L03_TS_007_CHOICES,
  type CourseG04L03Ts007InteractionState,
} from "../timelines/course-g04-l03-ts-007-practice-question-interaction";

// Copy follows source text 50, 91–96 and 117–130. The separate vector minus
// signs are explicit characters here. The four reveal boundaries remain in
// the source-bound state machine; this readable view does not change them.
export const COURSE_G04_L03_TS_007_TEACHING_STEPS = Object.freeze([
  Object.freeze({
    heading: "1. Restate the question",
    lines: Object.freeze(["Where is −2?"]),
  }),
  Object.freeze({
    heading: "2. Organize the information",
    lines: Object.freeze([
      "Information given: a number line with symbols.",
      "Information needed: where is −2?",
    ]),
  }),
  Object.freeze({
    heading: "3. Solve the problem",
    lines: Object.freeze([
      "Use the strategy: draw a picture.",
      "Label the number line to see where −2 is.",
      "The correct answer choice is B.",
    ]),
  }),
  Object.freeze({
    heading: "4. Check your answer",
    lines: Object.freeze([
      "Use the strategy: guess and check.",
      "Where is each symbol located?",
      "The correct answer choice is B.",
    ]),
  }),
]);

export function getCourseG04L3Ts007RevealedSteps(
  interaction: Pick<CourseG04L03Ts007InteractionState, "phase" | "walkthroughGate">,
) {
  return interaction.phase === "walkthrough"
    ? interaction.walkthroughGate ?? 0 : 4;
}

export function Ts007WalkthroughReading({
  interaction,
}: {
  interaction: CourseG04L03Ts007InteractionState;
}) {
  const revealed = getCourseG04L3Ts007RevealedSteps(interaction);
  return (
    <section aria-label="Four-step solution" className="course-g04-l03-ts-007-reading"
      data-ts007-revealed-steps={revealed}>
      {revealed === 0 ? <p>
        Use the four-step plan to solve the question. Start by restating the question in your own words.
      </p> : <ol>
        {COURSE_G04_L03_TS_007_TEACHING_STEPS.slice(0, revealed).map(step => (
          <li key={step.heading}>
            <h3>{step.heading}</h3>
            {step.lines.map(line => <p key={line}>{line}</p>)}
          </li>
        ))}
      </ol>}
    </section>
  );
}

export function Ts007Symbol({id}: {id: "A" | "B" | "C" | "D"}) {
  return <svg aria-hidden="true" viewBox="-16 -16 32 32" width="32" height="32">
    {id === "A" ? <circle r="12" fill="#36b719" stroke="#1b6e12" strokeWidth="1.5" />
      : id === "B" ? <path d="M0 13 C-26 -5 -10 -22 0 -9 C10 -22 26 -5 0 13Z" fill="#ed6430" stroke="#ac2e1d" strokeWidth="1.5" />
      : id === "C" ? <rect x="-11" y="-11" width="22" height="22" fill="#ed4b99" stroke="#a22762" strokeWidth="1.5" />
      : <path d="M0 -13 L13 12 H-13Z" fill="#29bac1" stroke="#177279" strokeWidth="1.5" />}
  </svg>;
}

export function Ts007NumberLine() {
  return <figure className="course-g04-l03-ts-007-number-line">
    <svg role="img" aria-label="Number line: green circle at negative four, heart at negative two, pink square at two, cyan triangle at four. Each tick is one unit."
      viewBox="0 0 350 100">
      <path d="M16 53 H334 M22 47 L16 53 L22 59 M328 47 L334 53 L328 59" fill="none" stroke="#18395b" strokeWidth="2" />
      {Array.from({length: 11}, (_, i) => i - 5).map(value => (
        <g key={value} data-number-line-value={value} transform={`translate(${175 + value * 28}, 0)`}>
          <path d="M0 47 V59" stroke="#18395b" strokeWidth="2" />
          <text x="0" y="82" fontSize="15" textAnchor="middle" fill="#18395b">{value < 0 ? `−${-value}` : value}</text>
        </g>
      ))}
      {COURSE_G04_L03_TS_007_CHOICES.map(choice => (
        <svg key={choice.id} x={175 + choice.numberLineLocation * 28 - 16} y="6" width="32" height="32"
          data-number-line-symbol={choice.id} data-number-line-location={choice.numberLineLocation}>
          <Ts007Symbol id={choice.id} />
        </svg>
      ))}
    </svg>
    <figcaption>Each tick is 1 unit. Negative numbers are to the left of 0.</figcaption>
  </figure>;
}
