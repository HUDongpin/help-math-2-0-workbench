import {ASFunction} from './avm';
import {ButtonObj,MovieClip,TextFieldObj,Runtime,type DisplayObject} from './display';
import type {HostCall} from './types';
import type {LessonHostRequest} from '../lesson-host-contract';
import {selectHostFeedback,type HostFeedbackSelection} from '../g678-advanced-manual/host-feedback-selector';
import {P009} from './nms-l11-p009-source-binding';

type Choice = typeof P009.choices[number];
type Branch = typeof P009.feedback[number];
type LinkKey = typeof P009.feedbackLinkKeys[number];
export type P009ChoiceIntent = Readonly<{kind:'answer';epoch:number;sourceName:Choice['name'];button:ButtonObj}>;
export type P009CloseIntent = Readonly<{kind:'wrong-close';epoch:number;feedback:MovieClip;popup:MovieClip;button:ButtonObj}>;
export type P009FeedbackLinkIntent = Readonly<{kind:'feedback-html-link';epoch:number;feedback:MovieClip;popup:MovieClip;text:TextFieldObj;sourceFunction:ASFunction;sourceKey:LinkKey;entryId:string;sourceActionSha256:string}>;
export type P009FeedbackToken = Readonly<{kind:'text';text:string}> | Readonly<{kind:'link';text:string;sourceKey:LinkKey;entryId:string;sourceActionSha256:string}>;
type Options = Readonly<{validatedDataSha256:string;seed:number;onRequest?:(request:LessonHostRequest)=>void}>;
const owners=new WeakMap<Runtime,P009PracticeHost>();
function requireSource(value:unknown,code:string):asserts value{if(!value)throw Error('P009_'+code)}
const matrix=(o:DisplayObject)=>[o.m.a,o.m.b,o.m.c,o.m.d,o.m.tx,o.m.ty];
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

/** Exact source tokens only. There is no generic HTML execution or unsafe HTML injection. */
function sourceFeedbackTokens():readonly P009FeedbackToken[]{
  const html=P009.html,pattern=/<A HREF='asfunction:DoHyperLinksTemp,([^']+)'><FONT COLOR='#0000CC'><U><B>([^<]+)<\/B><\/U><\/FONT><\/A>/g;
  const tokens:P009FeedbackToken[]=[];let end=0;const keys:string[]=[];
  for(const m of html.matchAll(pattern)){
    requireSource(m.index!==undefined,'LINK_INDEX');
    if(m.index>end)tokens.push(Object.freeze({kind:'text',text:html.slice(end,m.index)}));
    const key=m[1] as LinkKey;requireSource(P009.feedbackLinkKeys.includes(key),'LINK_KEY');keys.push(key);
    tokens.push(Object.freeze({kind:'link',text:m[2],sourceKey:key,entryId:P009.entries[key],sourceActionSha256:P009.feedbackScriptSha256}));end=m.index+m[0].length;
  }
  if(end<html.length)tokens.push(Object.freeze({kind:'text',text:html.slice(end)}));
  requireSource(equal(keys,P009.feedbackLinkKeys)&&tokens.filter(t=>t.kind==='text').every(t=>!/[<>]/.test(t.text)),'EXACT_SOURCE_HTML');
  return Object.freeze(tokens);
}
export const P009_FEEDBACK_TOKENS=sourceFeedbackTokens();

/**
 * Minimum page-owned implementation of the inspected indexMI host dependency.
 * Source-generated handlers still select right/wrong, stop/restart clips, set
 * WrongFeed/quizSection, close feedback and stop main98. This class has no clock,
 * decoder, replacement frame scripts, two-attempt advance, or synthetic answer.
 * Install once per current HFR Runtime lease before question64. Replay restores
 * the entry globals on the same VM: dispose the old adapter and create a new one.
 * See the independently reviewed lifecycle correction in READY-v2.
 */
export class P009PracticeHost{
  private readonly root:MovieClip;
  private readonly previous:Runtime['hostCb'];
  private readonly callback:(call:HostCall)=>void;
  private readonly issued=new WeakSet<object>();
  private readonly consumed=new WeakSet<object>();
  private disposed=false;
  private epoch=0;
  private attempts=0;
  private solved=false;
  private pendingAnswer=false;
  private active:{clip:MovieClip;binding:Branch;selection:HostFeedbackSelection}|null=null;
  private pendingLink:{intent:P009FeedbackLinkIntent;tick:number;request:LessonHostRequest|null}|null=null;
  readonly handledCalls:HostCall[]=[];
  readonly feedbackSelections:HostFeedbackSelection[]=[];

  constructor(readonly runtime:Runtime,private readonly options:Options){
    const d=runtime.page;
    requireSource(!owners.has(runtime),'RUNTIME_ALREADY_OWNED');
    requireSource(options.validatedDataSha256===P009.data.sha256&&d.placement.animationId===P009.animationId&&d.source.sha256===P009.source.sha256&&d.source.bytes===P009.source.bytes,'SOURCE_BINDING');
    requireSource(Number.isSafeInteger(options.seed)&&options.seed>=0&&options.seed<=0xffffffff,'CAPTURE_SEED');
    requireSource(d.stage.width===800&&d.stage.height===600&&d.stage.fps===12&&d.root.frameCount===10&&d.root.labels.begin===6,'ROOT_DOMAIN');
    requireSource(d.dictionary[221]?.kind==='sprite'&&d.dictionary[221].frameCount===98&&d.dictionary[49]?.frameCount===1,'SOURCE_TIMELINES');
    requireSource(equal(d.root.frames[5],P009.sourceFrames.root6)&&equal(d.dictionary[221].frames[63],P009.sourceFrames.main64)&&equal(d.dictionary[221].frames[64],P009.sourceFrames.main65)&&equal(d.dictionary[221].frames[97],P009.sourceFrames.main98)&&equal(d.dictionary[49].frames[0],P009.sourceFrames.popup1),'SOURCE_ACTION_AND_PLACEMENT_TAGS');
    requireSource(runtime.page_ instanceof MovieClip&&runtime.page_.def===d.root&&!runtime.page_.removed,'LOADED_PAGE_REQUIRED');
    const priorMain=runtime.allObjects().find(o=>o instanceof MovieClip&&o.charId===221) as MovieClip|undefined;
    requireSource(!priorMain||priorMain.frame<64,'FRESH_PREQUESTION_SESSION_REQUIRED');
    this.root=runtime.page_;this.previous=runtime.hostCb;
    this.callback=call=>{if(!this.handle(call))this.previous?.(call)};
    runtime.hostCb=this.callback;owners.set(runtime,this);
  }
  private current():boolean{
    return !this.disposed&&owners.get(this.runtime)===this&&this.runtime.hostCb===this.callback&&this.runtime.page_===this.root&&!this.root.removed&&this.root.def===this.runtime.page.root;
  }
  private main():MovieClip|null{
    if(!this.current()||this.root.frame!==6||this.root.playing)return null;
    const m=this.root.children.get(4);
    return m instanceof MovieClip&&m.name==='animation'&&m.charId===221&&m.def===this.runtime.page.dictionary[221]&&m.parentClip===this.root&&!m.removed&&m.visible&&!m.scriptMoved&&equal(matrix(m),P009.main.matrixTwips)?m:null;
  }
  private answer(m:MovieClip,c:Choice):ButtonObj|null{
    const b=m.children.get(c.depth);
    return b instanceof ButtonObj&&b.charId===c.buttonCharacterId&&b.name===c.name&&b.def===this.runtime.page.dictionary[c.buttonCharacterId]&&b.parentClip===m&&!b.removed&&equal(matrix(b),c.sourcePlacement.m)?b:null;
  }
  private branch(m:MovieClip,spec:Branch):MovieClip|null{
    const c=m.children.get(spec.sourcePlacement.depth),source=spec.sourcePlacement.m;
    return c instanceof MovieClip&&c.charId===spec.characterId&&c.name===spec.name&&c.def===this.runtime.page.dictionary[spec.characterId]&&c.parentClip===m&&!c.removed&&c.totalFrames===spec.frameCount&&matrix(c).every((v,i)=>i===4?(v===source[4]||v===100):v===source[i])?c:null;
  }
  private question(m:MovieClip):boolean{return m.frame===64&&!m.playing&&this.runtime.Global.get('quizSection')===true&&!this.solved}
  private availability(m:MovieClip,enabled:boolean):void{
    const buttons=P009.choices.map(c=>this.answer(m,c));requireSource(buttons.every(Boolean),'EXACT_THREE_SOURCE_ANSWERS');
    for(const button of buttons){button!.set('enabled',enabled);button!.set('_visible',enabled)}
    // Inspected host loops25 names, but this source has exactly3 and no NMHBtn.
    // Nothing is fabricated for absent names.
  }
  private handle(call:HostCall):boolean{
    if(!this.current())return false;
    if(call.kind==='shell.DoHyperLinks'&&this.pendingLink){
      const pending=this.pendingLink;
      requireSource(call.tick===pending.tick&&call.args.length===0&&this.validLink(pending.intent)&&this.runtime.Global.get('KeyAttribute')===pending.intent.sourceKey,'SOURCE_LINK_RELEASE');
      requireSource(!pending.request,'SINGLE_SOURCE_LINK_REQUEST');
      pending.request=Object.freeze({type:'open-glossary',entryId:pending.intent.entryId,sourceAnimationId:P009.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'});
      this.handledCalls.push(call);return true;
    }
    if(!['shell.disableQuizButton','shell.enableQuizButton','shell.showWrongFeed','shell.showRightFeed'].includes(call.kind))return false;
    const m=this.main();requireSource(m&&call.tick===this.runtime.tickCount&&call.args.length===0,'SOURCE_HOST_CONTEXT');
    if(call.kind==='shell.disableQuizButton'){
      if(this.active){
        requireSource(this.active.binding.kind==='right'&&this.branch(m,this.active.binding)===this.active.clip&&this.active.clip.frame===this.active.binding.frameCount&&m.frame===64,'RIGHT_SOURCE_COMPLETION_ONLY');
        this.availability(m,false);this.solved=true;this.active=null;this.epoch++;
      }else{
        requireSource(this.question(m)&&!this.pendingAnswer&&P009.choices.every(c=>{const b=this.answer(m,c);return b&&this.runtime.isClickable(b)}),'UNLOCKED_SOURCE_QUESTION');
        this.availability(m,false);this.pendingAnswer=true;this.epoch++;
      }
    }else if(call.kind==='shell.enableQuizButton'){
      requireSource(this.active?.binding.kind==='wrong'&&this.branch(m,this.active.binding)===this.active.clip&&this.active.clip.frame===30&&this.question(m),'WRONG_SOURCE_COMPLETION_ONLY');
      this.availability(m,true);this.active=null;this.epoch++;
    }else{
      requireSource(this.pendingAnswer&&!this.active&&this.question(m)&&P009.choices.every(c=>{const b=this.answer(m,c);return b&&!b.visible&&!this.runtime.toBool(b.get('enabled'))}),'ANSWER_LOCK_BEFORE_FEEDBACK');
      const kind=call.kind==='shell.showRightFeed'?'right':'wrong',selected=selectHostFeedback(kind,(this.options.seed+this.attempts)>>>0);
      const binding=P009.feedback.find(b=>b.name===selected.instanceName);requireSource(binding?.selectedByInspectedIndexMISnapshot&&binding.kind===kind,'SOURCE_REACHABLE_FEEDBACK_BRANCH');
      const clip=this.branch(m,binding);requireSource(clip&&clip.frame===1&&!clip.playing,'SOURCE_FEEDBACK_ENTRY');
      this.pendingAnswer=false;this.active={clip,binding,selection:selected};this.attempts++;this.feedbackSelections.push(selected);
      clip.set('_visible',true);clip.gotoCmd(2,true);clip.set('_x',5);
      this.runtime.callMethod(this.runtime.Global.get('gSound'),'setVolume',[this.runtime.Global.get('VolLevel')],null);
      this.options.onRequest?.(Object.freeze({type:'record-practice-feedback',interactionId:P009.animationId,outcome:kind==='right'?'correct':'incorrect',branchIndex:selected.branchIndex,branchCount:selected.cardinality}));
    }
    this.handledCalls.push(call);return true;
  }
  choices():readonly P009ChoiceIntent[]{
    const m=this.main();if(!m||!this.question(m)||this.active||this.pendingAnswer)return [];
    return P009.choices.flatMap(c=>{const button=this.answer(m,c);if(!button||!this.runtime.isClickable(button))return [];const intent=Object.freeze({kind:'answer' as const,epoch:this.epoch,sourceName:c.name,button});this.issued.add(intent);return[intent]});
  }
  choose(intent:P009ChoiceIntent):boolean{
    const m=this.main(),c=P009.choices.find(c=>c.name===intent.sourceName);
    if(!m||!this.issued.has(intent)||this.consumed.has(intent)||intent.epoch!==this.epoch||!c||this.answer(m,c)!==intent.button||!this.question(m)||this.active||this.pendingAnswer||!this.runtime.isClickable(intent.button))return false;
    this.consumed.add(intent);this.runtime.click(intent.button);return true;
  }
  private popup(){
    const m=this.main(),active=this.active;if(!m||!active||active.binding.kind!=='wrong'||this.branch(m,active.binding)!==active.clip||active.clip.frame!==22||active.clip.playing||m.frame!==64)return null;
    const popup=active.clip.get('Mc_Feed_Popup');if(!(popup instanceof MovieClip)||popup.charId!==49||popup.parentClip!==active.clip||popup.removed||!this.runtime.allObjects().includes(popup))return null;
    const text=popup.get('txtFeed'),button=popup.get('BtnClose'),fn=popup.get('DoHyperLinksTemp');
    if(!(text instanceof TextFieldObj)||text.charId!==48||text.parentClip!==popup||!text.html||text.htmlValue!==P009.html||this.runtime.Global.get('WrongFeed')!==P009.html||!(button instanceof ButtonObj)||button.charId!==45||button.parentClip!==popup||!(fn instanceof ASFunction))return null;
    return{feedback:active.clip,popup,text,button,fn};
  }
  feedback(){
    const p=this.popup();if(!p)return null;
    const close=Object.freeze({kind:'wrong-close' as const,epoch:this.epoch,feedback:p.feedback,popup:p.popup,button:p.button});this.issued.add(close);
    const links=P009.feedbackLinkKeys.map(sourceKey=>{const intent=Object.freeze({kind:'feedback-html-link' as const,epoch:this.epoch,feedback:p.feedback,popup:p.popup,text:p.text,sourceFunction:p.fn,sourceKey,entryId:P009.entries[sourceKey],sourceActionSha256:P009.feedbackScriptSha256});this.issued.add(intent);return intent});
    return Object.freeze({html:P009.html,tokens:P009_FEEDBACK_TOKENS,close,links:Object.freeze(links)});
  }
  closeWrong(intent:P009CloseIntent):boolean{
    const p=this.popup();if(!p||!this.issued.has(intent)||this.consumed.has(intent)||intent.epoch!==this.epoch||intent.feedback!==p.feedback||intent.popup!==p.popup||intent.button!==p.button||!this.runtime.isClickable(p.button))return false;
    this.consumed.add(intent);this.runtime.click(p.button);return true;
  }
  private validLink(intent:P009FeedbackLinkIntent):boolean{
    const p=this.popup();return Boolean(p&&this.issued.has(intent)&&intent.epoch===this.epoch&&intent.feedback===p.feedback&&intent.popup===p.popup&&intent.text===p.text&&intent.sourceFunction===p.fn&&P009.feedbackLinkKeys.includes(intent.sourceKey)&&intent.entryId===P009.entries[intent.sourceKey]&&intent.sourceActionSha256===P009.feedbackScriptSha256);
  }
  releaseFeedbackLink(intent:P009FeedbackLinkIntent):LessonHostRequest|null{
    if(this.pendingLink||this.consumed.has(intent)||!this.validLink(intent))return null;
    this.consumed.add(intent);const pending={intent,tick:this.runtime.tickCount,request:null as LessonHostRequest|null};this.pendingLink=pending;
    try{
      this.runtime.callFn(intent.sourceFunction,intent.popup,[intent.sourceKey]);this.runtime.runQueue();
      requireSource(pending.request&&this.main()?.playing===false,'SOURCE_HTML_FUNCTION_MUST_STOP_MAIN');
      this.options.onRequest?.(pending.request);return pending.request;
    }finally{this.pendingLink=null}
  }
  /** Modern Play may run transport; it must not invent a main64/98 playCmd. */
  mayResumeMainSource():boolean{const m=this.main();return Boolean(m&&!m.playing&&!this.active&&!this.pendingAnswer&&m.frame!==64&&m.frame!==98)}
  snapshot(){
    const m=this.main(),active=this.active;
    return Object.freeze({current:this.current(),mainFrame:m?.frame??null,mainPlaying:m?.playing??false,attempts:this.attempts,solved:this.solved,answerLocked:!m||!this.question(m)||Boolean(active)||this.pendingAnswer,feedback:active?{kind:active.binding.kind,sourceCharacterId:active.binding.characterId,sourceName:active.binding.name,frame:active.clip.frame,playing:active.clip.playing,branchIndex:active.selection.branchIndex,branchCount:active.selection.cardinality}:null,complete:Boolean(m&&this.solved&&m.frame===98&&!m.playing&&this.runtime.Global.get('quizSection')===false),authoritativeAdobeRandomStateAccepted:false});
  }
  dispose():void{
    if(this.disposed)return;this.disposed=true;this.epoch++;this.pendingLink=null;this.active=null;this.pendingAnswer=false;
    if(this.runtime.hostCb===this.callback)this.runtime.hostCb=this.previous;
    if(owners.get(this.runtime)===this)owners.delete(this.runtime);
    // The existing HFR page/session owns Runtime and AudioContext teardown.
    // This adapter introduces no timer, RAF, audio node or native event listener.
  }
}
