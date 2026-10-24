import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
export {P004_TEXT_OCCURRENCE_PROVENANCE} from './alg-l06-p004-text-occurrences-v2.generated';
export type P004TextOccurrence=(typeof P004_TEXT_OCCURRENCES)[number];
/** Source membership projection, not visible-pixel or semantic-math acceptance.
 * Stable instance identities retain repeated zeros, labels and overlay generations. */
export function p004TextOccurrences(frame:number):readonly P004TextOccurrence[]{
 if(!Number.isSafeInteger(frame)||frame<1||frame>831)throw new RangeError('P004 frame must be an integer in 1..831');
 return Object.freeze(P004_TEXT_OCCURRENCES.filter(row=>row.firstFrame<=frame&&frame<row.lastFrameExclusive));
}
/** Complete applicable source placement event history, including color/alpha
 * updates when present. Consumers must interpret inherited properties before
 * claiming revealed visibility; omission is not a visible-state assertion. */
export function p004TextOccurrencePlacementEvents(occurrence:P004TextOccurrence,frame:number){
 p004TextOccurrences(frame);
 if(frame<occurrence.firstFrame||frame>=occurrence.lastFrameExclusive) return Object.freeze([]);
 const sourceFrame=occurrence.timelineId==='root'?6:frame;
 return Object.freeze(occurrence.placementEvents.filter(event=>event.frame<=sourceFrame));
}
