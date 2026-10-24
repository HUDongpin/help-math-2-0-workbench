/** IN09 frame553: source operands and dynamic drawing coordinates. */
export type P019Handle = 'h2' | 'h4';
export const P019_QUESTIONS = Object.freeze(['3 + 1','1 + 5','5 + 3','6 + 10','10 + 3','12 + 4','15 + 2','4 + 15','3 + 14','2 + 16']);
export const P019_MIN_X = -308, P019_MAX_X = 282;
const clamp = (x:number) => Math.max(P019_MIN_X,Math.min(P019_MAX_X,x));
export const p019ValueAtX = (x:number) => Math.round(x / 30 * 6 / 3) + 1;
export const p019XForValue = (n:number) => clamp(15 * (n - 1));
export interface P019DisplayState {
  readonly x1:number; readonly x2:number;
  readonly questionIndex:number;
  readonly pressed:P019Handle|null;
}
export class P019PracticeV1 {
  private x1=-15; private x2=-15; private index=0; private ordinal=0;
  private rng:number; private drag:{id:P019Handle;origin:number}|null=null;
  constructor(private readonly seed=0) {
    if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P019_INVALID_SEED');
    this.rng=seed||0x6d2b79f5;
    this.newProblem();
  }
  /** Deterministic product RNG; exact source branch set, no Adobe RNG parity claim. */
  newProblem() {
    let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;
    this.index=Math.floor(this.rng/4294967296*P019_QUESTIONS.length);
    this.ordinal++;this.x1=-15;this.x2=-15;this.drag=null;
  }
  replay() {this.rng=this.seed||0x6d2b79f5;this.ordinal=0;this.newProblem();}
  begin(id:P019Handle,x:number) {
    if(this.drag||!['h2','h4'].includes(id)||!Number.isFinite(x))return false;
    this.drag={id,origin:id==='h2'?this.x1:this.x2};return this.move(x);
  }
  move(x:number) {
    if(!this.drag||!Number.isFinite(x))return false;
    if(this.drag.id==='h2')this.x1=clamp(x);else this.x2=clamp(x);return true;
  }
  finish(cancel=false) {
    if(!this.drag)return false;
    if(cancel){if(this.drag.id==='h2')this.x1=this.drag.origin;else this.x2=this.drag.origin;}
    this.drag=null;return true;
  }
  setValue(id:P019Handle,value:number) {
    if(this.drag||!['h2','h4'].includes(id)||!Number.isSafeInteger(value)||value< -20||value>20)return false;
    if(id==='h2')this.x1=p019XForValue(value);else this.x2=p019XForValue(value);return true;
  }
  snapshot() {
    const value1=p019ValueAtX(this.x1),value2=p019ValueAtX(this.x2);
    return Object.freeze({picture:Object.freeze({x1:this.x1,x2:this.x2,questionIndex:this.index,pressed:this.drag?.id??null}),
      value1,value2,sum:value1+value2,question:P019_QUESTIONS[this.index]!,questionOrdinal:this.ordinal,
      outputEndpoint:this.x1+this.x2+15,sourceQuizActive:true,lessonCompleted:false as const});
  }
}
