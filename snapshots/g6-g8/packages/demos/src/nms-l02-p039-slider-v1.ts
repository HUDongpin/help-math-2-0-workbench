import {P039_SLIDER_SOURCE as SOURCE} from './generated/nms-l02-p039-slider-source-v1';
/** Source press-drag range, separate from the inconsistent source Reset/fallback. */
export function p039PercentAtSourceX(x:number){
 if(!Number.isFinite(x))throw Error('P039_SLIDER_X');
 const bounded=Math.max(SOURCE.range.start,Math.min(SOURCE.range.end,x));
 return Math.round((bounded/50+5)*42/2)+32;
}
export function p039SourceXAtPercent(percent:number){
 if(!Number.isSafeInteger(percent)||percent<0||percent>100)throw Error('P039_PERCENT');
 return SOURCE.percentMapping[percent].representativeX;
}
export function p039GridAtPercent(percent:number){
 p039SourceXAtPercent(percent);
 return Object.freeze(SOURCE.cells.map(c=>Object.freeze({index:c.index,row:c.row,column:c.column,filled:c.index<=percent})));
}
