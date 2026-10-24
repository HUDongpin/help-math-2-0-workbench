/** Source IN10 main569, Subtract64, New66 and ten answer clips1/20. */
export const P020_QUESTIONS = Object.freeze(['3 - 15 =','13 - 2 =','12 - 2 =','5 - 3 =','7 - 5 =','3 - 5 =','6 - 8 =','10 - 15 =','6 - 10 =','5 - 5 =']);
export const P020_ANSWERS = Object.freeze(['3~-15','13~-2','12~-2','5~-3','7~-5','3~-5','6~-8','10~-15','6~-10','5~-5']);
export const P020_ANSWER_CHARACTERS = Object.freeze([75,80,83,88,93,96,101,105,109,113]);
export interface P020DisplayState {readonly questionIndex:number;readonly revealed:boolean;readonly answerFrame:number;}
export function p020Problem(index:number,revealed=false) {
 if(!Number.isSafeInteger(index)||index<0||index>=10)throw Error('P020_INVALID_QUESTION');
 const question=P020_QUESTIONS[index]!,[left,right]=question.split('-') as [string,string];
 const [value1,value2]=P020_ANSWERS[index]!.split('~').map(Number) as [number,number];
 const result=value1+value2,negative=revealed&&result<0;
 return Object.freeze({question,value1,value2,result,answerCharacterId:P020_ANSWER_CHARACTERS[index]!,
  field1:left,field2:right+(revealed&&!negative?' '+result:''),field3:negative?String(-result):'',
  minusVisible:negative,minusX:right.length===4?263.7:280.7,resultX:right.length===4?272.5:289.5});
}
export class P020PracticeV1 {
 private index=0;private ordinal=0;private revealed=false;private frame=1;private rng:number;
 constructor(private readonly seed=0){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P020_INVALID_SEED');
  this.rng=seed||0x6d2b79f5;this.newProblem();
 }
 /** Exact source question set with deterministic product RNG; no Adobe RNG parity. */
 newProblem(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;this.index=Math.floor(this.rng/4294967296*10);this.ordinal++;this.revealed=false;this.frame=1;}
 subtract(){if(this.revealed)return false;this.revealed=true;this.frame=2;return true;}
 setAnswerFrame(frame:number){if(!this.revealed||!Number.isSafeInteger(frame)||frame<2||frame>20)return false;this.frame=frame;return true;}
 replay(){this.rng=this.seed||0x6d2b79f5;this.ordinal=0;this.newProblem();}
 snapshot(){return Object.freeze({picture:Object.freeze({questionIndex:this.index,revealed:this.revealed,answerFrame:this.frame}),...p020Problem(this.index,this.revealed),questionOrdinal:this.ordinal,subtractEnabled:!this.revealed,newProblemEnabled:true,sourceQuizActive:true,lessonCompleted:false as const});}
}
