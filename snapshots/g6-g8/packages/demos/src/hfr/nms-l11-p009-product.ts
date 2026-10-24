import {ButtonObj, MovieClip, type DisplayObject, type Runtime} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {P009PracticeHost} from './nms-l11-p009-practice-host';
import {P009} from './nms-l11-p009-source-binding';
import {P009NativePresentation} from './nms-l11-p009-native';
import type {HfrTextIdentity} from './hfr-native-text';
import {P009_PRODUCT} from './nms-l11-p009-product-binding';

export type P009MainGlossaryIntent=Readonly<{button:ButtonObj;sourceKey:'Rational numbers'|'Integers';entryId:string;sourceActionSha256:string}>;
const presentation=(frame:number)=>P009_PRODUCT.mainPresentation.filter(row=>row.frame<=frame).at(-1);
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const matrix=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const visible=(o:DisplayObject,full=false):boolean=>{
  for(let item:DisplayObject|null=o;item;item=item.parentClip){
    if(!item.visible||item.removed||item.cx[3]<=0||item.cx[7]!==0||(full&&item.cx[3]!==256))return false;
  }
  return true;
};

/** One product instance per active HFR lease. All clocks/audio stay in HfrPlayer;
 * actual source bytecode, not native controls, chooses correct/wrong behavior. */
export class P009Product {
  readonly adapter:P009PracticeHost;
  native:P009NativePresentation|null=null;
  private readonly seed:number;
  private readonly previous:Runtime['hostCb'];
  private readonly callback:(call:HostCall)=>void;
  private readonly issued=new WeakSet<object>();
  private readonly consumed=new WeakSet<object>();
  private pending:{intent:P009MainGlossaryIntent;tick:number;request:LessonHostRequest|null}|null=null;
  private disposed=false;
  constructor(readonly runtime:Runtime,options:Readonly<{validatedDataSha256:string;seed:number;onRequest?:(request:LessonHostRequest)=>void}>){
    this.seed=options.seed;
    this.previous=runtime.hostCb;
    this.callback=call=>{
      const pending=this.pending;
      if(call.kind==='shell.DoHyperLinks'&&pending){
        if(call.tick!==pending.tick||call.args.length!==0||pending.request||!this.validMain(pending.intent)||runtime.Global.get('KeyAttribute')!==pending.intent.sourceKey)throw Error('P009_MAIN_SOURCE_RELEASE_MISMATCH');
        pending.request={type:'open-glossary',entryId:pending.intent.entryId,sourceAnimationId:P009.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'};
      }else this.previous?.(call);
    };
    runtime.hostCb=this.callback;
    let adapter:P009PracticeHost|null=null;
    try{
      this.adapter=adapter=new P009PracticeHost(runtime,{...options,onRequest:request=>{
        // Glossary requests are returned after their source function has stopped
        // main, so the renderer can bind the real focus trigger and host decision.
        if(request.type==='record-practice-feedback')options.onRequest?.(request);
      }});
      if(!equal(runtime.page.dictionary[221].frames[0],P009_PRODUCT.mainFrame1)||P009_PRODUCT.mainTerms.some(t=>!equal(runtime.page.dictionary[t.sourceButtonCharacterId],t.definition)))throw Error('P009_MAIN_GLOSSARY_SOURCE_BINDING');
    }catch(error){adapter?.dispose();if(runtime.hostCb===this.callback)runtime.hostCb=this.previous;throw error;}
  }
  main():MovieClip|null{
    if(this.disposed||!this.adapter.snapshot().current)return null;
    const clip=this.runtime.page_.children.get(4);
    return clip instanceof MovieClip&&clip.charId===221&&clip.def===this.runtime.page.dictionary[221]&&clip.parentClip===this.runtime.page_&&!clip.removed?clip:null;
  }
  private sourceMainButton(term:typeof P009_PRODUCT.mainTerms[number]):ButtonObj|null{
    const m=this.main(),button=m?.children.get(term.placement.depth),expected=m?presentation(m.frame)?.placements[term.placement.depth as 4|6]:undefined;
    return button instanceof ButtonObj&&button.charId===term.sourceButtonCharacterId&&button.def===this.runtime.page.dictionary[term.sourceButtonCharacterId]&&button.parentClip===m&&!button.scriptMoved&&Boolean(expected)&&equal(matrix(button),expected?.m)&&equal(button.cx,expected?.cx)&&this.runtime.isClickable(button)&&visible(button)?button:null;
  }
  mainGlossary():readonly P009MainGlossaryIntent[]{
    if(this.disposed)return [];
    return P009_PRODUCT.mainTerms.flatMap(term=>{
      const button=this.sourceMainButton(term);if(!button)return [];
      const intent=Object.freeze({button,sourceKey:term.sourceKeyAttribute,entryId:term.dictionaryEntryId,sourceActionSha256:term.sourceActionSha256});
      this.issued.add(intent);return[intent];
    });
  }
  private validMain(intent:P009MainGlossaryIntent):boolean{
    const term=P009_PRODUCT.mainTerms.find(t=>t.sourceButtonCharacterId===intent.button.charId);
    return Boolean(!this.disposed&&this.issued.has(intent)&&term&&this.sourceMainButton(term)===intent.button&&intent.sourceKey===term.sourceKeyAttribute&&intent.entryId===term.dictionaryEntryId&&intent.sourceActionSha256===term.sourceActionSha256);
  }
  releaseMainGlossary(intent:P009MainGlossaryIntent,release:()=>void=()=>this.runtime.click(intent.button)){
    const main=this.main();if(!main||!this.validMain(intent)||this.consumed.has(intent)||this.pending)return null;
    this.consumed.add(intent);const wasPlaying=main.playing,errors=this.runtime.errors.length,pending={intent,tick:this.runtime.tickCount,request:null as LessonHostRequest|null};this.pending=pending;
    try{
      release();
      if(this.runtime.errors.length!==errors||!pending.request||this.main()!==main||main.playing)throw Error('P009_MAIN_GLOSSARY_SOURCE_STOP_REQUIRED');
      return{request:pending.request,clip:main,frame:main.frame,resumeSource:wasPlaying&&this.adapter.mayResumeMainSource()};
    }finally{this.pending=null}
  }
  async prepareNative(validatedDataSha256:string){const prepared=await P009NativePresentation.prepare(this.runtime,validatedDataSha256);if(this.adapter.snapshot().current)this.native=prepared;}
  view(identity:HfrTextIdentity={lang:"en",scenario:"hfr",seed:this.seed,replay:0}){
    const state=this.adapter.snapshot(),main=this.main(),prompt=main?.children.get(3);
    const promptVisible=Boolean(prompt&&prompt.charId===7&&prompt.def===this.runtime.page.dictionary[7]&&!prompt.scriptMoved&&visible(prompt,true)&&Boolean(main)&&equal(matrix(prompt),presentation(main!.frame)?.placements[3].m)&&equal(prompt.cx,presentation(main!.frame)?.placements[3].cx));
    return Object.freeze({native:this.native?.capture(this.adapter,identity)??null,state,sourceTitle:P009_PRODUCT.title,prompt:promptVisible?P009.prompt:null,
      mainGlossary:promptVisible?this.mainGlossary():[],choices:this.adapter.choices(),feedback:this.adapter.feedback()});
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.pending=null;this.adapter.dispose();
    if(this.runtime.hostCb===this.callback)this.runtime.hostCb=this.previous;
  }
}
export type P009ProductView=ReturnType<P009Product['view']>;
