import type {P039State} from './nms-l02-p039-state-v1';
export const P039_COPY={en:{slider:'Shaded squares',done:'Done',reset:'Reset',close:'Close',correct:'Correct!',hint:'To show 25%, shade 25 of the 100 squares.',retry:'Try again.',reveal:'25 of 100 squares are shaded: 25%.',complete:'Activity complete.'},es:{slider:'Cuadros sombreados',done:'Listo',reset:'Restablecer',close:'Cerrar',correct:'¡Correcto!',hint:'Para representar el 25%, sombrea 25 de los 100 cuadros.',retry:'Inténtalo de nuevo.',reveal:'Hay 25 de 100 cuadros sombreados: 25%.',complete:'Actividad completada.'}} as const;
/** Native UI copy and orientation-neutral correction, qualified in the content audit. */
export function p039Feedback(state:P039State,language:'en'|'es'){
 const l=P039_COPY[language];
 if(state.popupVisible)return {kind:'wrong',text:l.hint+(state.tries<2?' '+l.retry:'')} as const;
 if(state.correctFrame!==null&&state.correctFrame>=2)return {kind:'correct',text:l.correct} as const;
 if(state.correctedReveal)return {kind:'reveal',text:l.reveal} as const;
 if(state.mainFrame===579)return {kind:'complete',text:l.complete} as const;
 return {kind:'none',text:''} as const;
}
