import type {CourseG04L03Fq002Grade} from '../timelines/course-g04-l03-fq-002-quiz-interaction';

// Product interface copy only. Source questions, options and source title remain English.
export function fq002Ui(spanish: boolean) {
 return spanish ? {
  sourceLanguageNote:'Las preguntas y las respuestas conservan el texto original en inglés. No hay una traducción verificada al español.',
  language:'es', numberLine:'Recta numérica', readPositions:'Leer las posiciones en la recta numérica',
  diagram:'Diagrama de recta numérica. Desplázate horizontalmente para ver toda la recta numérica.',
  temperatures:'Temperaturas mínimas registradas',
  temperatureScroll:'Tabla de temperaturas. Desplázate horizontalmente para ver todas las columnas.',
  loading:'Cargando la ilustración original antes de habilitar los controles del examen…',
  loadError:'No se pudo cargar la ilustración original. Los controles del examen siguen deshabilitados.',
  blocked:'La ilustración original no está disponible en este contexto. Los controles del examen siguen deshabilitados.',
  quiz:'Examen final', complete:'Examen completado', review:'Revisar respuestas', replay:'Repetir examen',
  previous:'Respuesta anterior', next:'Respuesta siguiente', results:'Volver a los resultados',
  yourAnswer:'Tu respuesta:', correctAnswer:'Respuesta correcta:', correct:'Correcto. ', incorrect:'Incorrecto. ',
  performance:'Nivel de desempeño', choices:'Opciones de respuesta',
  question:(n:number,total:number)=>`Pregunta ${n} de ${total}`,
  reviewPosition:(n:number,total:number)=>`Revisión de respuestas ${n} de ${total}`,
  score:(total:number)=>`de ${total} respuestas correctas`,
  wrong:(n:number)=>`${n} ${n===1?'respuesta incorrecta':'respuestas incorrectas'}.`,
  grade:(grade:CourseG04L03Fq002Grade)=>({Unsatisfactory:'Insatisfactorio','Partially Proficient':'Parcialmente competente',Proficient:'Competente',Advanced:'Avanzado'}[grade]),
 } : {
  sourceLanguageNote:'Questions and answers retain the original English text. No verified Spanish translation is available.',
  language:'en', numberLine:'Number line', readPositions:'Read number line positions',
  diagram:'Number line diagram. Scroll horizontally to see the entire number line.',
  temperatures:'Lowest recorded temperatures',
  temperatureScroll:'Temperature table. Scroll horizontally to see all columns.',
  loading:'Loading the source question drawing before quiz controls are enabled…',
  loadError:'The source question drawing could not load. Quiz controls remain disabled.',
  blocked:'The source question drawing is unavailable for this context. Quiz controls remain disabled.',
  quiz:'Final quiz', complete:'Quiz complete', review:'Review answers', replay:'Replay quiz',
  previous:'Previous answer', next:'Next answer', results:'Return to results',
  yourAnswer:'Your answer:', correctAnswer:'Correct answer:', correct:'Correct. ', incorrect:'Incorrect. ',
  performance:'Performance level', choices:'Answer choices',
  question:(n:number,total:number)=>`Question ${n} of ${total}`,
  reviewPosition:(n:number,total:number)=>`Answer review ${n} of ${total}`,
  score:(total:number)=>`of ${total} correct`,
  wrong:(n:number)=>`${n} incorrect answer${n===1?'':'s'}.`, grade:(grade:CourseG04L03Fq002Grade)=>grade,
 };
}
