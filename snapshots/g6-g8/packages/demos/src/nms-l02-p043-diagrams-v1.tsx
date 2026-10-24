import * as React from 'react';
export type P043Picture = 'decimal' | 'fraction' | 'percent' | 'equivalent';
export const P043_DIAGRAM_DESCRIPTIONS = {
  en: { decimal: 'Decimal fraction: 0.25', fraction: 'One of three equal parts and two of six pencils: one third.', percent: 'Seventy-five shaded cells out of one hundred.', equivalent: 'Two of four equal parts and one of two equal parts: both one half.' },
  es: { decimal: 'Fracción decimal: 0.25', fraction: 'Una de tres partes iguales y dos de seis lápices: un tercio.', percent: 'Setenta y cinco celdas sombreadas de cien.', equivalent: 'Dos de cuatro partes iguales y una de dos partes iguales: ambas representan un medio.' },
} as const;
export function p043DiagramCaption(picture: P043Picture, language: 'en' | 'es') {
  return picture === 'decimal' ? '0.25' : picture === 'fraction' ? '1/3 = 2/6'
    : picture === 'percent' ? language === 'es' ? '75% = 75 de 100' : '75% = 75 out of 100'
    : '2/4 = 1/2 = 0.50 = 50%';
}
/** Mathematical drawings traced from source sprites120/126/131; native captions scale with text. */
export function P043Diagram({ picture, language = 'en' }: { picture: P043Picture; language?: 'en' | 'es' }) {
  const label = P043_DIAGRAM_DESCRIPTIONS[language][picture];
  if (picture === 'decimal') return <figure className="p043-diagram" data-picture={picture}><div className="p043-diagram__decimal" role="img" aria-label={label}>0.25</div></figure>;
  return <figure className="p043-diagram" data-picture={picture}>
    {picture === 'fraction' && <svg viewBox="0 0 360 140" role="img" aria-label={label}>
      {[0, 1, 2].map(i => <rect key={i} x={10 + i * 25} y="15" width="25" height="100" fill={i === 0 ? '#245bc3' : '#fff'} stroke="#172c43" data-part={i} data-shaded={i === 0} />)}
      {[0, 1, 2, 3, 4, 5].map(i => <g key={i} transform={`translate(${125 + i * 36} 15)`} data-pencil={i}>
        <rect x="2" y="13" width="18" height="74" rx="2" fill="#258ddd" stroke="#172c43" />
        <path d="M2 87 L11 108 L20 87Z" fill="#e4bd7f" stroke="#172c43" />
        <path d="M8 101 L11 108 L14 101Z" fill="#172c43" />
        <rect x="2" y="0" width="18" height="13" rx="4" fill="#d3a3a0" stroke="#172c43" />
      </g>)}
      <rect x="122" y="9" width="62" height="122" rx="7" fill="none" stroke="#bd2b21" strokeWidth="3" data-selected-pencil-count="2" />
    </svg>}
    {picture === 'percent' && <svg viewBox="0 0 220 220" role="img" aria-label={label}>
      {Array.from({ length: 100 }, (_, index) => {
        const row = Math.floor(index / 10), column = index % 10;
        const shaded = column < 7 || column === 7 && row < 5;
        return <rect key={index} x={10 + column * 20} y={10 + row * 20} width="20" height="20" fill={shaded ? '#245bc3' : '#fff'} stroke="#172c43" data-cell={index} data-shaded={shaded} />;
      })}
    </svg>}
    {picture === 'equivalent' && <svg viewBox="0 0 300 130" role="img" aria-label={label}>
      <circle cx="70" cy="65" r="50" fill="#fff" stroke="#172c43" />
      <path d="M20 65 A50 50 0 0 1 120 65Z" fill="#245bc3" stroke="#172c43" data-shaded-fraction="2/4" />
      <path d="M70 15V115 M20 65H120" fill="none" stroke="#172c43" />
      <circle cx="225" cy="65" r="50" fill="#fff" stroke="#172c43" />
      <path d="M225 15 A50 50 0 0 1 225 115Z" fill="#245bc3" stroke="#172c43" data-shaded-fraction="1/2" />
      <path d="M225 15V115" fill="none" stroke="#172c43" />
    </svg>}
    <figcaption>{p043DiagramCaption(picture, language)}</figcaption>
  </figure>;
}
