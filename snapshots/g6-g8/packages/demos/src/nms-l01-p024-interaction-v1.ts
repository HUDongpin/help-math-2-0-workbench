/** Source IN13 main468, Multiply48, New52 and ten named answer timelines. */
export const P024_OPERANDS = Object.freeze([[3,15],[2,12],[12,2],[5,3],[5,7],[7,5],[8,5],[5,5],[6,6],[10,0]] as const);
export const P024_ANSWER_CHARACTERS = Object.freeze([58,64,63,69,86,102,119,126,131,136] as const);
export const P024_ANSWER_FRAMES = Object.freeze([68,42,42,39,64,67,75,56,60,9] as const);
export interface P024DisplayState {readonly questionIndex:number;readonly revealed:boolean;readonly answerFrame:number;}
export function p024Problem(index:number,revealed=false) {
 if(!Number.isSafeInteger(index)||index<0||index>=10)throw Error('P024_INVALID_QUESTION');
 const [left,right]=P024_OPERANDS[index]!,result=left*right;
 return Object.freeze({question:`${left} × ${right} =`,left,right,result,
  answerCharacterId:P024_ANSWER_CHARACTERS[index]!,answerFrameCount:P024_ANSWER_FRAMES[index]!,
  field1:String(left),field2:revealed?`${right} = ${result}`:`${right} = `});
}
export class P024PracticeV1 {
 private index=0;private ordinal=0;private revealed=false;private frame=1;private rng:number;
 constructor(private readonly seed=0){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P024_INVALID_SEED');
  this.rng=seed||0x6d2b79f5;this.newProblem();
 }
 /** Source selection with replacement; deterministic product RNG is not Adobe RNG parity. */
 newProblem(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;this.index=Math.floor(this.rng/4294967296*10);this.ordinal++;this.revealed=false;this.frame=1;}
 multiply(){if(this.revealed)return false;this.revealed=true;this.frame=2;return true;}
 setAnswerFrame(frame:number){if(!this.revealed||!Number.isSafeInteger(frame)||frame<2||frame>P024_ANSWER_FRAMES[this.index]!)return false;this.frame=frame;return true;}
 replay(){this.rng=this.seed||0x6d2b79f5;this.ordinal=0;this.newProblem();}
 snapshot(){return Object.freeze({picture:Object.freeze({questionIndex:this.index,revealed:this.revealed,answerFrame:this.frame}),...p024Problem(this.index,this.revealed),questionOrdinal:this.ordinal,multiplyEnabled:!this.revealed,newProblemEnabled:true,sourceQuizActive:true,lessonCompleted:false as const});}
}
