import React from 'react';
import { teachingState, sourceShapePaths } from './teaching-state';
export function In006Teaching({ frame }: { frame: number }) {
  const s = teachingState(frame);
  const promptParts = s.prompt?.split(' ');
  const emphasized = (part: string) => part === '4' ? s.promptEmphasis.four : part === '−1' ? s.promptEmphasis.minusOne : part === '10' ? s.promptEmphasis.ten : false;
  return <section className="in006-teaching" aria-label="Negative numbers: worked examples" data-source-frame={s.frame}>
    <style>{`.in006-teaching{container:in006-teaching / inline-size;font-family:var(--lesson-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6;color:#172b43;padding:1rem;background:#fff}.in006-teaching *{box-sizing:border-box}.in006-teaching__prose{font-size:1.25rem;min-height:4.7em;margin:0 0 1rem}.in006-teaching__math{display:flex;gap:1.5rem;flex-wrap:wrap;min-height:3rem;align-items:center}.in006-teaching__math p{font-size:1.5rem;margin:0}.in006-teaching [data-emphasized=true]{color:#9b2c00;font-weight:700;text-decoration:underline;text-underline-offset:.2em}.in006-teaching__scroll{overflow-x:auto;max-width:100%;border:1px solid #b7c7d8;border-radius:.5rem}.in006-teaching__diagram{position:relative;width:94rem;height:20rem}.in006-teaching__diagram svg{position:absolute;inset:0;width:100%;height:100%}.in006-teaching__axis-label{position:absolute;top:48%;transform:translateX(-50%);font-size:max(18px,1.125rem);line-height:1.5;white-space:nowrap;text-align:center;min-width:2.75rem;font-variant-numeric:tabular-nums;background:#fff;padding:.1rem}.in006-teaching__palette,.in006-teaching__controls{display:flex;gap:.75rem;flex-wrap:wrap;justify-content:center;margin:1rem 0 0;font-size:1.125rem}.in006-teaching__palette span,.in006-teaching__controls span{display:inline-flex;align-items:center;justify-content:center;min-width:2.75rem;min-height:2.75rem;border:1px solid #b7c7d8;border-radius:.5rem;padding:.5rem .85rem}.in006-teaching__controls svg{width:2rem;height:1.5rem}@container in006-teaching (max-width:760px){.in006-teaching__prose{font-size:1.125rem}.in006-teaching__math p{font-size:1.25rem}}`}</style>
    <p className="in006-teaching__prose" data-lesson-text-block="instruction">{s.words.join(' ')}</p>
    <div className="in006-teaching__math">
      <p data-lesson-text-block="prompt" aria-label={s.prompt ?? undefined}>{promptParts?.map((part,i)=><React.Fragment key={i}><span data-emphasized={emphasized(part)}>{part}</span>{i < 2 ? ' ' : ''}</React.Fragment>)}</p>
      {s.equation && <p data-lesson-text-block="equation">{s.equation.split(' ').map((part,i)=><React.Fragment key={i}><span data-emphasized={part===s.equationEmphasis}>{part}</span>{' '}</React.Fragment>)}</p>}
    </div>
    <div className="in006-teaching__scroll" tabIndex={0} aria-label="Number line from minus fifteen to fifteen">
      <div className="in006-teaching__diagram">
        <svg viewBox="-7600 -900 15000 4300" preserveAspectRatio="none" role="img" aria-label="Worked-example jumps on a number line">
          <path d="M-7045 876H6771" stroke="currentColor" strokeWidth={20}/>
          {s.axis.map(({value,tickXTwips:x})=><path key={value} d={`M${x} 782v199`} stroke="currentColor" strokeWidth={16}/>)}
          {s.arrows.map((a,i)=><path key={`${a.depth}-${i}`} data-source-shape={a.id} data-source-depth={a.depth} d={sourceShapePaths[String(a.id) as keyof typeof sourceShapePaths]} transform={`matrix(${a.matrix.join(' ')})`} fill="none" stroke="#9b2c00" strokeWidth={35} strokeLinecap="round" strokeLinejoin="round"/>)}
        </svg>
        {s.axis.map(({value,tickXTwips:x})=><span key={value} data-number-label={value} data-lesson-text-block={`tick-${value}`} className="in006-teaching__axis-label" data-emphasized={s.axisEmphasis.includes(value)} style={{left:`${(x+7600)/150}%`}}>{value < 0 ? `−${-value}` : value}</span>)}
      </div>
    </div>
    <div className="in006-teaching__palette" aria-label="Jump sizes demonstrated">{s.palette.map(n=><span key={n} data-lesson-text-block={`palette-${n}`} data-emphasized={s.paletteTarget===n}>{n}</span>)}</div>
    <div className="in006-teaching__controls" aria-label="Controls shown during the demonstration">
      <span data-emphasized={s.demonstrationControl==='new-number'}>New Number</span>
      <span data-emphasized={s.demonstrationControl==='reverse'} aria-label="Reverse the most recent jump"><svg viewBox="0 0 60 40" aria-hidden="true"><path d="M50 32C50 0 10 0 10 30M3 23L10 33L17 23" fill="none" stroke="currentColor" strokeWidth="3"/></svg></span>
      <span>Clear</span>
    </div>
  </section>;
}
