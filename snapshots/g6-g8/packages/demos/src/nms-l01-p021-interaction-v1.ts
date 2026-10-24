export type P021Point=Readonly<{x:number;y:number}>;
export type P021Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
export interface P021Card {
 readonly id:string;readonly integer:number;readonly sourceCharacterId:number;readonly sourceDepth:number;
 readonly origin:P021Point;readonly reset:P021Point;readonly destination:P021Point|null;
 readonly labels:Readonly<{en:string;es:string}>;readonly role:'first'|'second'|'distractor';
 readonly sourceLocalBoundsTwips:Readonly<{left:number;right:number;top:number;bottom:number}>;readonly sourceBounds:P021Bounds;
}
export interface P021Problem {
 readonly index:number;readonly sourceQuestion:string;readonly firstId:string;readonly secondId:string;
 readonly first:number;readonly second:number;readonly result:number;
 readonly initialQuestion:string;readonly partialQuestion:string;readonly completedQuestion:string;
 readonly cards:readonly P021Card[];readonly feedback:Readonly<{en:string;es:string}>;
}
export type P021Drop='unavailable'|'outside'|'first'|'correct'|'wrong';
export interface P021PracticePicture {readonly questionIndex:number;readonly positions:Readonly<Record<string,P021Point>>;readonly step:0|1|2;readonly popup:'none'|'wrong';}
export function p021PointInTarget(bounds:P021Bounds,p:P021Point|null){return Boolean(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=bounds.x&&p.x<=bounds.x+bounds.width&&p.y>=bounds.y&&p.y<=bounds.y+bounds.height);}
const pairs=[[4,-6],[-4,-6],[-1,5],[-5,-3],[3,4],[-3,4],[-4,-3],[-5,7],[7,-5],[-10,5]] as const;
const validPoint=(p:P021Point)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
/** The actual normal-release source branch is authoritative; documented outside-handler copy errors are repaired. */
export class P021PracticeV1 {
 readonly problems:readonly P021Problem[];
 private rng:number;private index=0;private ordinal=0;private step:0|1|2=0;private status:'question'|'wrong'|'correct'|'answered'='question';
 private positions:Record<string,P021Point>={};private selected:string|null=null;private dragOrigin:P021Point|null=null;private attempts=0;private coachOrdinal=0;
 constructor(problems:readonly P021Problem[],private readonly seed=0){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||problems.length!==10)throw Error('P021_INVALID_SOURCE_PLAN');
  for(let i=0;i<10;i++){
   const p=problems[i]!;if(p.index!==i||p.first!==pairs[i]![0]||p.second!==pairs[i]![1]||p.result!==p.first+p.second||p.cards.length!==4||new Set(p.cards.map(c=>c.id)).size!==4||p.initialQuestion!==`=${p.result}`||p.completedQuestion!==`${p.first} ${p.second>0?'+':'-'} ${Math.abs(p.second)} = ${p.result}`)throw Error('P021_INVALID_SOURCE_PROBLEM');
   for(const c of p.cards){if(!/^Mc_[PN]_\d+$/u.test(c.id)||!validPoint(c.origin)||!validPoint(c.reset)||c.destination!==null&&!validPoint(c.destination)||c.integer!==Number(c.id.split('_')[2])*(c.id.includes('_N_')?-1:1)||!['first','second','distractor'].includes(c.role))throw Error('P021_INVALID_SOURCE_CARD');}
   if(p.cards.find(c=>c.role==='first')?.id!==p.firstId||p.cards.find(c=>c.role==='second')?.id!==p.secondId||p.cards.find(c=>c.id===p.firstId)?.integer!==p.first||p.cards.find(c=>c.id===p.secondId)?.integer!==p.second||!p.cards.find(c=>c.id===p.firstId)?.destination||!p.cards.find(c=>c.id===p.secondId)?.destination)throw Error('P021_SOURCE_ORDER_MISMATCH');
  }
  this.problems=Object.freeze(problems.map(p=>Object.freeze({...p,cards:Object.freeze(p.cards.map(c=>Object.freeze({...c,origin:Object.freeze({...c.origin}),reset:Object.freeze({...c.reset}),destination:c.destination?Object.freeze({...c.destination}):null})))})));this.rng=seed||0x6d2b79f5;this.newProblem();
 }
 private random(n:number){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return Math.floor(this.rng/4294967296*n);}
 private problem(){return this.problems[this.index]!;}
 canChoose(id:string){const p=this.problem();return this.status==='question'&&p.cards.some(c=>c.id===id)&&!(this.step>=1&&id===p.firstId);}
 select(id:string){if(!this.canChoose(id)||this.dragOrigin)return false;this.selected=id;return true;}
 begin(id:string){if(!this.select(id))return false;this.dragOrigin={...this.positions[id]!};return true;}
 move(p:P021Point){if(!this.selected||!this.dragOrigin||!validPoint(p)||this.status!=='question')return false;this.positions[this.selected]=Object.freeze({...p});return true;}
 cancel(){if(!this.selected)return false;if(this.dragOrigin)this.positions[this.selected]=this.dragOrigin;this.selected=null;this.dragOrigin=null;return true;}
 drop(onTarget:boolean):P021Drop {
  const id=this.selected;if(!id||!this.canChoose(id)||typeof onTarget!=='boolean')return 'unavailable';
  const p=this.problem(),card=p.cards.find(c=>c.id===id)!;this.selected=null;this.dragOrigin=null;this.attempts++;
  if(!onTarget){this.positions[id]=card.reset;return 'outside';}
  if(this.step===0&&id===p.firstId){this.positions[id]=card.destination!;this.step=1;return 'first';}
  if(this.step===1&&id===p.secondId){this.positions[id]=card.destination!;this.step=2;this.status='correct';return 'correct';}
  this.positions[id]=card.reset;this.status='wrong';return 'wrong';
 }
 closeWrong(){if(this.status!=='wrong')return false;this.status='question';this.selected=null;return true;}
 correctDone(){if(this.status!=='correct')return false;this.status='answered';return true;}
 nextCoach(){this.coachOrdinal++;return this.random(4);}
 newProblem(){if(this.status==='wrong'||this.status==='correct')return false;this.index=this.random(10);this.ordinal++;this.step=0;this.status='question';this.selected=null;this.dragOrigin=null;this.positions=Object.fromEntries(this.problem().cards.map(c=>[c.id,c.origin]));return true;}
 replay(){this.rng=this.seed||0x6d2b79f5;this.ordinal=0;this.status='question';this.attempts=0;this.coachOrdinal=0;this.newProblem();}
 snapshot(){const p=this.problem(),picture=Object.freeze({questionIndex:this.index,positions:Object.freeze({...this.positions}),step:this.step,popup:this.status==='wrong'?'wrong' as const:'none' as const});return Object.freeze({picture,problem:p,status:this.status,selected:this.selected,dragging:Boolean(this.dragOrigin),questionOrdinal:this.ordinal,coachOrdinal:this.coachOrdinal,attempts:this.attempts,newProblemEnabled:this.status==='question'||this.status==='answered',equation:this.step===0?p.initialQuestion:this.step===1?p.partialQuestion:p.completedQuestion,sourceQuizActive:true,lessonCompleted:false as const});}
}
