import React from 'react';
import {fq002Ui} from './g4-l3-fq002-ui';
import {FQ002_NUMBER_LINES} from './generated/g4-l3-fq002-number-lines';

export function Fq002QuizTitle() {
  return <p lang="en" className="fq002-native-quiz-title" data-fq002-source-title
    data-source-text-id={FQ002_NUMBER_LINES.title.sourceTextId}
    data-source-shape-id={FQ002_NUMBER_LINES.title.outlinedShapeId}>
    {FQ002_NUMBER_LINES.title.text}
  </p>;
}

/** Main-question geometry reused in review; not a legacy review-frame claim. */
export function Fq002NumberLine({questionId, spanishUi = false, sourceSwfSha256 = FQ002_NUMBER_LINES.sourceSha256}: {readonly questionId: number; readonly spanishUi?: boolean; readonly sourceSwfSha256?: string}) {
  const ui = fq002Ui(spanishUi);
  const figure = FQ002_NUMBER_LINES.figures.find(item => item.questionId === questionId);
  if (!figure) return null;
  const description = figure.symbols.map(symbol => `${symbol.name} at ${symbol.value}`).join('; ') + '.';
  return <figure lang={ui.language} className="fq002-native-number-line" data-fq002-native-number-line={questionId}
    data-source-frame={figure.sourceFrame} data-source-sha256={sourceSwfSha256} data-source-geometry-donor-sha256={FQ002_NUMBER_LINES.sourceSha256}>
    <figcaption>{ui.numberLine}</figcaption>
    <div className="fq002-native-number-line__viewport" tabIndex={0}
      data-fq002-focus-control="number-line-diagram" role="region" aria-label={ui.diagram}>
      <svg lang="en" viewBox="-6100 -1350 14500 2700" role="img"
        aria-label={`Number line with labels ${figure.labels.map(label => label.text).join(', ')} ${description}`}>
        {figure.shapes.map(shape => <g key={shape.id} data-source-shape-id={shape.id}
          transform={`matrix(${shape.matrix.join(' ')})`}>
          {shape.paths.map((path, index) => <path key={index} d={path.d}
            fill={path.fill} stroke={path.stroke} strokeWidth={path.strokeWidth} />)}
        </g>)}
        {figure.labels.map(label => <text key={label.id} x={label.x} y={label.y}
          textAnchor="middle" dominantBaseline="central" fontSize="400"
          fill="#10213b" data-source-text-id={label.sourceTextId}>{label.text}</text>)}
      </svg>
    </div>
    <details className="fq002-native-number-line__description">
      <summary data-fq002-focus-control="number-line-description">{ui.readPositions}</summary>
      <ul>{figure.symbols.map(symbol => <li key={symbol.name}
        data-source-symbol-shape-id={symbol.shapeId} data-source-symbol-path={symbol.pathIndex}>
        <span lang="en">{symbol.name}</span>: {symbol.value}
      </li>)}</ul>
    </details>
    <style>{`
      .fq002-native-number-line { margin: 0; min-width: 0; max-width: 100%; }
      .fq002-native-number-line figcaption { font: 700 1.125rem/1.6 var(--font-body, system-ui, sans-serif); }
      .fq002-native-number-line__viewport { overflow-x: auto; max-width: 100%; border: 1px solid #758aa6; border-radius: .5rem; background: #fff; }
      .fq002-native-number-line__viewport:focus-visible { outline: 3px solid #174c91; outline-offset: 2px; }
      .fq002-native-number-line__description { font: 400 1.125rem/1.6 var(--font-body, system-ui, sans-serif); }
      .fq002-native-number-line__description summary { cursor: pointer; min-height: 2.75rem; padding-block: .5rem; box-sizing: border-box; }
      .fq002-native-number-line__description summary:focus-visible { outline: 3px solid #174c91; outline-offset: 2px; }
      .fq002-native-number-line__description ul { margin-block: 0 .5rem; padding-inline-start: 1.5rem; }
      .fq002-native-number-line svg { display: block; width: 100%; min-width: 46rem; height: auto; font-family: var(--font-body, system-ui, sans-serif); }
    `}</style>
  </figure>;
}


export function fq002SymbolOption(questionId: number, optionId: string) {
  return FQ002_NUMBER_LINES.figures.find(figure => figure.questionId === questionId)
    ?.options.find(option => option.optionId === optionId);
}

/** Native projection of the exact option shape; the adjacent label names it. */
export function Fq002OptionSymbol({questionId, optionId}: {readonly questionId: number; readonly optionId: string}) {
  const option = fq002SymbolOption(questionId, optionId);
  if (!option) return null;
  return <svg aria-hidden="true" focusable="false" viewBox={option.viewBox}
    data-fq002-native-option={optionId} data-source-option-instance={option.sourceInstance}
    data-source-shape-id={option.shapeId} data-source-tag-sha256={option.sourceTagSha256}
    style={{display: 'block', width: '2.75rem', height: '2.75rem', gridArea: 'symbol', margin: 'auto'}}>
    {option.paths.map((path, index) => <path key={index} d={path.d}
      fill={path.fill} stroke={path.stroke} strokeWidth={path.strokeWidth} />)}
  </svg>;
}
