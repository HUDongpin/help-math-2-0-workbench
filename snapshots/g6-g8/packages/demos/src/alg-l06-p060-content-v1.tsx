'use client';
import React from 'react';
import type {P060QuestionData} from './alg-l06-p060-source-v1';


function Formula({value}: {value: NonNullable<P060QuestionData['formula']>}) {
  return <span className="p060-formula" data-source-text-ids={value.sourceTextIds.join(',')}>
    {value.plain ?? <>{value.prefix}<span className="p060-fraction" role="math" aria-label={`${value.numerator} divided by ${value.denominator}`}>
      <span aria-hidden="true">{value.numerator}</span><span aria-hidden="true">{value.denominator}</span>
    </span>{' '}{value.suffix}</>}
  </span>;
}

function Graph({value}: {value: NonNullable<P060QuestionData['graph']>}) {
  const [left, top, width, height] = value.viewBox;
  return <figure className="p060-graph" aria-label={value.semanticKind.replaceAll('-', ' ')} style={{aspectRatio: `${width} / ${height}`}}>
    <svg viewBox={value.viewBox.join(' ')} aria-hidden="true">
      {value.shapes.map(shape => <g key={shape.shapeId} transform={`matrix(${shape.matrix.join(' ')})`} data-source-shape={shape.shapeId}>
        {shape.paths.map((p, index) => <path key={index} d={p.d} fill={p.fill} fillRule={p['fill-rule'] as 'evenodd' | undefined}
          stroke={p.stroke} strokeWidth={p['stroke-width']} strokeLinecap={p['stroke-linecap'] as 'round' | undefined} strokeLinejoin={p['stroke-linejoin'] as 'round' | undefined}/>)}</g>)}
    </svg>
    {value.labels.map((label, index) => <span key={index} data-source-text-id={label.textId} data-label-align={label.align}
      style={{left: `${(label.center[0] - left) / width * 100}%`, top: `${(label.center[1] - top) / height * 100}%`}}>{label.text}</span>)}
  </figure>;
}

/** Native text and tables, with the exact extracted graph paths. Question state,
 * buttons and audio belong to the quiz presentation and session. */
export function P060QuestionContent({question}: {question: P060QuestionData}) {
  return <div className="p060-content" lang="en" data-question-content={question.id}>
    <p className="p060-prompt" data-source-text-id={question.promptTextId}>{question.promptBefore}
      {question.formula?.inline && <Formula value={question.formula}/>}{question.promptAfter}</p>
    {question.formula && !question.formula.inline && <p className="p060-equation"><Formula value={question.formula}/></p>}
    {(question.table || question.graph) && <div className="p060-figures">
      {question.table && <table className="p060-table" aria-label="Function table"><thead><tr>{question.table.headers.map((text, i) =>
        <th key={i} scope="col" data-source-text-id={question.table!.headerTextIds[i]}>{text}</th>)}</tr></thead>
        <tbody>{question.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} data-source-text-id={cell.textId}>{cell.value}</td>)}</tr>)}</tbody></table>}
      {question.graph && <Graph value={question.graph}/>}
    </div>}
  </div>;
}

export const P060_CONTENT_CSS = `
.p060-content{font:400 1rem/1.65 system-ui,sans-serif;color:#142d44;min-width:0}
.p060-prompt{margin:.6rem 0 1rem;overflow-wrap:anywhere}
.p060-equation{text-align:center;margin:1rem 0}
.p060-formula{display:inline-flex;align-items:center;gap:.2em;vertical-align:middle;white-space:nowrap}
.p060-fraction{display:inline-grid;vertical-align:middle;line-height:1.2;text-align:center;min-width:1.3em}
.p060-fraction>span{padding:0 .15em}.p060-fraction>span:first-child{border-bottom:1px solid currentColor;padding-bottom:.12em}.p060-fraction>span:last-child{padding-top:.12em}
.p060-figures{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.5rem;margin:1rem 0}
.p060-table{border-collapse:collapse;font:inherit;min-width:10rem;text-align:center}
.p060-table th,.p060-table td{border:1px solid #5f8995;padding:.35rem 1rem;min-width:3rem}.p060-table th{background:#b8e7e0}.p060-table td{background:#edf8f6}
.p060-graph{position:relative;flex:0 1 24rem;width:100%;max-width:24rem;margin:0;min-width:0}
.p060-graph svg{display:block;width:100%;height:100%;overflow:visible}
.p060-graph>span{position:absolute;transform:translate(-50%,-50%);font:400 1rem/1.1 system-ui,sans-serif;white-space:nowrap;color:#102c42}
.p060-graph>span[data-label-align="y-tick"]{transform:translate(-100%,-50%)}
.p060-graph>span[data-label-align="x-tick"]{transform:translate(-50%,0)}
`;
