import React from "react";

export function Ts008HelpNumberLine() {
  return <figure className="course-g04-l03-ts-008-help-axis">
    <svg role="img" aria-label="Number line from negative ten to positive ten. Each tick is one unit. Negative amounts are left of zero; positive amounts are right of zero."
      viewBox="0 0 400 106">
      <text x="108" y="20" textAnchor="middle" fontSize="20" fill="#a32935">Owing money</text>
      <text x="292" y="20" textAnchor="middle" fontSize="20" fill="#176444">Having money</text>
      <path d="M10 48 H200" stroke="#a32935" strokeWidth="3" />
      <path d="M200 48 H390" stroke="#176444" strokeWidth="3" />
      <path d="M16 42 L10 48 L16 54 M384 42 L390 48 L384 54" stroke="#163853" strokeWidth="2" fill="none" />
      {Array.from({length: 21}, (_, i) => i - 10).map(value => <g key={value}
        data-ts008-number-line-value={value} transform={`translate(${200 + value * 17},0)`}>
        <path d={value % 5 === 0 ? "M0 39 V58" : "M0 43 V54"} stroke="#163853" strokeWidth={value === 0 ? 3 : 1.5} />
        {value % 5 === 0 ? <text x="0" y="82" textAnchor="middle" fontSize="22" fill="#163853">
          {value < 0 ? `−${-value}` : value > 0 ? `+${value}` : "0"}
        </text> : null}
      </g>)}
    </svg>
    <figcaption>Each tick is 1 unit. Numbers increase to the right.</figcaption>
  </figure>;
}
