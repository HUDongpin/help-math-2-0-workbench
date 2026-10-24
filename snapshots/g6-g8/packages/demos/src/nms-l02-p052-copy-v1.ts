import {p052CanAnswer,type P052State,type P052Term} from './nms-l02-p052-state-v1';
import {P052_GLOSSARY} from './generated/nms-l02-p052-glossary-v1';
export type P052Language='en'|'es';
type P052Copy={title:string;question:string;prompt:string;done:string;reset:string;help:string;close:string;
 retry:string;answer:string;example:string;helpExplanation:string;rowColumnNote:string;slider:string;
 keyboard:string;replay:string;paused:string;glossary:Record<P052Term,{title:string;definition:string}>};
/** Page ES copy is an authored translation; glossary EN/ES is extracted source text. No audio claim. */
export const P052_COPY:Readonly<Record<P052Language,Readonly<P052Copy>>>={
 en:{
  title:'Fractions, Decimals, and Percent Concepts: Try It!',question:'Question 10',
  prompt:'Move the slider to shade 75% of the figure. When you have finished, select Done.',
  done:'Done',reset:'Reset',help:'Need More Help',close:'Close',retry:'Try Again.',
  answer:'The figure is 75% shaded. 75 of the 100 squares are shaded.',example:'Example: 35%',
  helpExplanation:'To shade 75% of the grid, shade 75 of the squares. Count seven full columns by tens: 10, 20, 30, 40, 50, 60, 70. Then count five squares in the next column by ones: 71, 72, 73, 74, 75.',
  rowColumnNote:'The practice grid fills across rows. Counting by columns is another way to count the same 75 squares.',
  slider:'Percentage shaded',keyboard:'Use the arrow keys to change the percentage. Home selects 0%; End selects 100%.',
  replay:'Replay',paused:'Paused',glossary:{
   Square:P052_GLOSSARY.Square.en,
   Column:P052_GLOSSARY.Column.en
  }
 },
 es:{
  title:'Conceptos de fracciones, decimales y porcentajes: ¡Inténtalo!',question:'Pregunta 10',
  prompt:'Mueve el control deslizante para colorear el 75% de la figura. Cuando termines, selecciona Listo.',
  done:'Listo',reset:'Restablecer',help:'Necesito más ayuda',close:'Cerrar',retry:'Inténtalo de nuevo.',
  answer:'El 75% de la figura está coloreado. Están coloreados 75 de los 100 cuadrados.',example:'Ejemplo: 35%',
  helpExplanation:'Para colorear el 75% de la cuadrícula, colorea 75 cuadrados. Cuenta siete columnas completas de diez en diez: 10, 20, 30, 40, 50, 60, 70. Luego cuenta cinco cuadrados de la siguiente columna de uno en uno: 71, 72, 73, 74, 75.',
  rowColumnNote:'La cuadrícula de práctica se colorea por filas. Contar por columnas es otra forma de contar los mismos 75 cuadrados.',
  slider:'Porcentaje coloreado',keyboard:'Usa las flechas para cambiar el porcentaje. Inicio selecciona el 0%; Fin selecciona el 100%.',
  replay:'Repetir',paused:'En pausa',glossary:{
   Square:P052_GLOSSARY.Square.es,
   Column:P052_GLOSSARY.Column.es
  }
 }
};
export const P052_COPY_SOURCE_IDS={title:[154],question:[158],prompt:[157,159],done:[168],reset:[170],
 help:[4,5],close:[312],retry:[321],answer:[330],example:[339],helpExplanation:[340]} as const;
export function p052Copy(language:P052Language):Readonly<P052Copy>{
 if(language!=='en'&&language!=='es')throw Error('P052_LANGUAGE');return P052_COPY[language];
}
export function p052ShadeSummary(percent:number,language:P052Language):string{
 p052Copy(language);if(!Number.isInteger(percent)||percent<0||percent>100)throw Error('P052_PERCENT');
 return language==='en'?`${percent}% shaded: ${percent} of 100 squares.`:`${percent}% coloreado: ${percent} de 100 cuadrados.`;
}
/** Exercise semantics only: authored intro digit/shape animation remains separate. */
export function p052ExerciseSemantics(state:P052State,language:P052Language){
 const copy=p052Copy(language),summary=p052ShadeSummary(state.percent,language);
 return {copy,summary,digits:String(state.percent).padStart(3,'0'),controlsDisabled:!p052CanAnswer(state),
  showControls:state.phase==='practice',feedback:state.phase==='wrong'?copy.retry:state.phase==='right'?copy.answer:null,
  glossary:state.glossary?copy.glossary[state.glossary]:null,
  cells:Array.from({length:100},(_,index)=>({index,row:Math.floor(index/10),column:index%10,shaded:index<state.percent}))};
}
