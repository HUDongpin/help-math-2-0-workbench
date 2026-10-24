/** Source IN15 main578, Divide52, New54 and ten named answer timelines. */
export const P026_OPERANDS = Object.freeze([[45,3],[24,12],[24,2],[15,5],[35,7],[35,5],[40,8],[50,10],[36,6],[42,7]] as const);
export const P026_ANSWER_CHARACTERS = Object.freeze([71,59,62,67,96,95,76,81,86,91] as const);
export const P026_ANSWER_FRAMES = Object.freeze([53,14,44,16,23,29,22,27,32,32] as const);
export interface P026DisplayState {readonly questionIndex:number;readonly revealed:boolean;readonly answerFrame:number;}
export function p026Problem(index:number,revealed=false) {
 if(!Number.isSafeInteger(index)||index<0||index>=10)throw Error('P026_INVALID_QUESTION');
 const [left,right]=P026_OPERANDS[index]!,result=left/right;
 return Object.freeze({question:`${left} ÷ ${right} =`,left,right,result,
  answerCharacterId:P026_ANSWER_CHARACTERS[index]!,answerFrameCount:P026_ANSWER_FRAMES[index]!,
  field1:String(left),field2:revealed?`${right} = ${result}`:`${right} = `});
}
export class P026PracticeV1 {
 private index=0;private ordinal=0;private revealed=false;private frame=1;private rng:number;
 constructor(private readonly seed=0){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P026_INVALID_SEED');
  this.rng=seed||0x6d2b79f5;this.newProblem();
 }
 /** Source selection with replacement; deterministic product RNG is not Adobe RNG parity. */
 newProblem(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;this.index=Math.floor(this.rng/4294967296*10);this.ordinal++;this.revealed=false;this.frame=1;}
 divide(){if(this.revealed)return false;this.revealed=true;this.frame=2;return true;}
 setAnswerFrame(frame:number){if(!this.revealed||!Number.isSafeInteger(frame)||frame<2||frame>P026_ANSWER_FRAMES[this.index]!)return false;this.frame=frame;return true;}
 replay(){this.rng=this.seed||0x6d2b79f5;this.ordinal=0;this.newProblem();}
 snapshot(){return Object.freeze({picture:Object.freeze({questionIndex:this.index,revealed:this.revealed,answerFrame:this.frame}),...p026Problem(this.index,this.revealed),questionOrdinal:this.ordinal,divideEnabled:!this.revealed,newProblemEnabled:true,sourceQuizActive:true,lessonCompleted:false as const});}
}
