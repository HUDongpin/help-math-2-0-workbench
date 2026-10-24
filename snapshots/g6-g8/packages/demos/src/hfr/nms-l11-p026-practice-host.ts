import {ButtonObj, MovieClip, type Runtime} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {P026} from './nms-l11-p026-source-binding';

type Term=typeof P026.terms[number];
export type P026GlossaryControl=Readonly<{button:ButtonObj;term:Term}>;
export type P026GlossaryHold=Readonly<{runtime:Runtime;clip:MovieClip;frame:number;resumeSource:boolean;request:LessonHostRequest}>;
const assertSource=(condition:unknown,message:string):void=>{if(!condition)throw Error('P026_'+message);};

/** One source-bound observer per page lease. It does not change source scripts,
 * drag outcomes, enabled flags, popup input policy, clocks, or audio. */
export class P026PracticeHost {
  private readonly root:MovieClip;
  private readonly data:Runtime['page'];
  private readonly issued=new WeakSet<object>();
  private readonly consumed=new WeakSet<object>();
  private readonly holds=new WeakSet<object>();
  private readonly resumed=new WeakSet<object>();
  private disposed=false;
  private releasing=false;
  constructor(readonly runtime:Runtime,private readonly options:Readonly<{validatedDataSha256:string;isCurrent:()=>boolean}>){
    assertSource(options.validatedDataSha256===P026.dataSha256&&runtime.page.source.sha256===P026.sourceSha256&&runtime.page.placement.animationId===P026.animationId,'SOURCE_BINDING');
    this.root=runtime.page_;this.data=runtime.page;
  }
  current():boolean{return !this.disposed&&this.options.isCurrent()&&!this.root.removed&&this.runtime.page_===this.root&&this.runtime.page===this.data;}
  main():MovieClip|null{
    const m=this.current()?this.root.children.get(P026.mainDepth):null;
    return m instanceof MovieClip&&m.charId===P026.mainId&&m.def===this.data.dictionary[P026.mainId]&&m.parentClip===this.root&&!m.removed?m:null;
  }
  private child(parent:MovieClip,name:string,id:number,depth:number):MovieClip|null{
    const o=parent.children.get(depth);
    return o instanceof MovieClip&&o.name===name&&o.charId===id&&o.def===this.data.dictionary[id]&&o.parentClip===parent&&!o.removed?o:null;
  }
  snapshot(){
    const m=this.main(),count=this.runtime.Global.get('quizDragCount'),quizSection=this.runtime.Global.get('quizSection');
    const pairs=m?P026.pairs.map(p=>({pair:p.number,source:this.child(m,p.sourceName,p.sourceId,p.sourceDepth),target:this.child(m,p.targetName,p.targetId,p.targetDepth)})):[];
    const targetsComplete=pairs.length===5&&pairs.every(p=>p.target?.get('_alpha')===100);
    // An ordinary settled frame427 is the exercise entry. Only the source's
    // count5 coach branch, removed cards, and terminal Stop establish completion.
    const complete=Boolean(m&&this.root.frame===P026.rootFrame&&m.frame===P026.terminalFrame&&!m.playing&&count===5&&quizSection===false&&targetsComplete&&pairs.every(p=>p.source===null)&&!this.runtime.drag&&!this.runtime.pressed);
    return Object.freeze({current:this.current(),main:m,frame:m?.frame??null,count,quizSection,pairs,complete});
  }
  private button(term:Term):ButtonObj|null{
    const m=this.main();if(!m)return null;
    const parent=term.parentTimelineId===P026.mainId?m:m.get(P026.popupName);
    if(!(parent instanceof MovieClip)||parent.charId!==term.parentTimelineId||parent.def!==this.data.dictionary[term.parentTimelineId]||!parent.ancestorsVisible())return null;
    const b=parent.children.get(term.depth);
    return b instanceof ButtonObj&&b.charId===term.sourceButtonCharacterId&&b.def===this.data.dictionary[term.sourceButtonCharacterId]&&b.parentClip===parent&&!b.removed&&this.runtime.isClickable(b)?b:null;
  }
  glossaryControls():readonly P026GlossaryControl[]{
    return P026.terms.flatMap(term=>{const button=this.button(term);if(!button)return[];const control=Object.freeze({button,term});this.issued.add(control);return[control];});
  }
  private valid(control:P026GlossaryControl):boolean{return this.issued.has(control)&&P026.terms.includes(control.term)&&this.button(control.term)===control.button;}
  releaseGlossary(control:P026GlossaryControl,releaseSource:()=>void):P026GlossaryHold|null{
    const m=this.main();if(!m||this.releasing||this.consumed.has(control)||!this.valid(control))return null;
    const tick=this.runtime.tickCount,frame=m.frame,wasPlaying=m.playing,errors=this.runtime.errors.length,previous=this.runtime.hostCb;
    const stateBefore=this.snapshot();const targetsBefore=stateBefore.pairs.map(p=>p.target?.get('_alpha'));
    const sourcesBefore=stateBefore.pairs.map(p=>p.source?JSON.stringify([p.source.m,p.source.visible,p.source.get('enabled')]):null);
    let request:LessonHostRequest|null=null;
    const callback=(call:HostCall)=>{
      if(call.kind==='shell.DoHyperLinks'){
        assertSource(call.tick===tick&&call.args.length===0&&!request&&this.valid(control)&&this.runtime.Global.get('KeyAttribute')===control.term.sourceKeyAttribute,'GLOSSARY_SOURCE_CALL');
        request={type:'open-glossary',entryId:control.term.dictionaryEntryId,sourceAnimationId:P026.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'};
      }else previous?.(call);
    };
    this.consumed.add(control);this.releasing=true;this.runtime.hostCb=callback;
    try{
      releaseSource();const stateAfter=this.snapshot();
      assertSource(this.runtime.errors.length===errors&&request&&this.main()===m&&m.frame===frame&&!m.playing&&this.runtime.tickCount===tick,'GLOSSARY_SOURCE_STOP');
      assertSource(stateAfter.count===stateBefore.count&&stateAfter.quizSection===stateBefore.quizSection&&stateAfter.pairs.every((p,i)=>p.source===stateBefore.pairs[i].source&&p.target===stateBefore.pairs[i].target&&p.target?.get('_alpha')===targetsBefore[i]&&(p.source?JSON.stringify([p.source.m,p.source.visible,p.source.get('enabled')]):null)===sourcesBefore[i]),'GLOSSARY_ACTIVITY_PRESERVED');
      const hold=Object.freeze({runtime:this.runtime,clip:m,frame,resumeSource:wasPlaying&&frame!==P026.activityFrame&&frame!==P026.terminalFrame,request:request!});this.holds.add(hold);return hold;
    }finally{if(this.runtime.hostCb===callback)this.runtime.hostCb=previous;this.releasing=false;}
  }
  /** The host decides when an accepted glossary hold closes. Frame427 stays
   * stopped even when the clicked button belongs to the main114. */
  resumeHeldSource(held:P026GlossaryHold):boolean{
    const m=this.main();if(!m||!this.holds.has(held)||this.resumed.has(held)||held.runtime!==this.runtime||held.clip!==m||held.frame!==m.frame||m.playing)return false;
    this.resumed.add(held);if(held.resumeSource&&m.frame!==P026.activityFrame&&m.frame!==P026.terminalFrame)m.playCmd();return true;
  }
  dispose(){this.disposed=true;}
}

/** The three exact main114 source releases retain distinct glossary identities. */
export const P026_GLOSSARY_REQUESTS=Object.freeze(P026.terms.map(term=>Object.freeze({...term})));
