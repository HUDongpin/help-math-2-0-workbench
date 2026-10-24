import {G4_L4_ZOG_X_GAME} from './generated/g4-l4-zog-x-game-config';

/** Source doGetRandomQuiz state, separate from feedback/playback clocks.
 * The existing deterministic LCG makes Replay reproducible; it is not a
 * claim about Flash's random-number sequence. Correct-answer actions update
 * correctSelect immediately, then append the question at feedback frame 5.
 */
export interface ZogXQuestionPool {
 readonly seed:number;
 readonly random:number;
 readonly remaining:readonly number[];
 readonly correctQuestions:readonly number[];
 readonly correctSelect:number;
 readonly totalQuizCount:number;
 readonly question:number|null;
 readonly frame:number;
 readonly quizSection:boolean;
 readonly startGame:boolean;
}

export function createZogXQuestionPool(seed=0):ZogXQuestionPool {
 return {seed:seed>>>0,random:seed>>>0,remaining:G4_L4_ZOG_X_GAME.questions.map(q=>q.id),correctQuestions:[],correctSelect:0,totalQuizCount:0,question:null,frame:G4_L4_ZOG_X_GAME.readyFrame,quizSection:true,startGame:false};
}

/** One invocation of the authored function. Refill excludes questions already
 * answered correctly; wrong answers become eligible again on the next cycle.
 * Source resets the displayed question count to 1 when the bag refills.
 * Calling this is a source event, not a generic next-frame operation.
 */
export function drawZogXQuestion(s:ZogXQuestionPool):ZogXQuestionPool {
 let totalQuizCount=s.totalQuizCount+1;
 if(s.correctSelect>=G4_L4_ZOG_X_GAME.requiredCorrect){
  return {...s,totalQuizCount,quizSection:false,startGame:false,frame:G4_L4_ZOG_X_GAME.finalFrame};
 }
 let remaining=[...s.remaining];
 if(!remaining.length){
  totalQuizCount=1;
  remaining=G4_L4_ZOG_X_GAME.questions.map(q=>q.id).filter(id=>!s.correctQuestions.includes(id));
 }
 const random=(Math.imul(s.random,1664525)+1013904223)>>>0;
 const index=Math.floor(random/4294967296*remaining.length);
 const [question]=remaining.splice(index,1);
 if(question===undefined)throw new Error('GS002 source pool has no eligible question before completion');
 const frame=G4_L4_ZOG_X_GAME.questions.find(q=>q.id===question)!.frame;
 return {...s,random,remaining,totalQuizCount,question,frame,quizSection:true,startGame:false};
}
