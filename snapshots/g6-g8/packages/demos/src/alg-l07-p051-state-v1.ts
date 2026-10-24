/** L7GS02 source controller, with explicit unresolved early navigation.
 * Native popup close is a product projection; AVM1 receiver semantics await
 * original-runtime evidence. The early target is never silently replaced. */
export type P051Level=1|2;
export interface P051Intent {readonly serial:number;readonly sourceStem:'L3GS03'|'L7GS03';readonly targetAnimationId:'shared-alg001-l07-p052'|null;readonly level:P051Level;}
export interface P051State {readonly epoch:number;readonly replay:number;readonly frame:number;readonly playing:boolean;
 readonly level:P051Level|null;readonly popup:boolean;readonly message:boolean;readonly unavailable:boolean;
 readonly intent:P051Intent|null;readonly intentSerial:number;readonly left:boolean;readonly lessonCompleted:false;}
export type P051Action={readonly epoch:number}&(
 |{type:'advance';frame:number}
 |{type:'select-level';level:P051Level}
 |{type:'navigation-result';serial:number;accepted:boolean}
 |{type:'play'|'pause'|'repeat'|'skip'|'close-popup'|'start'|'start-roll-out'|'replay'|'leave'}
);
export function p051InitialState(epoch=0,replay=0):P051State{
 if(!Number.isSafeInteger(epoch)||epoch<0||!Number.isSafeInteger(replay)||replay<0)throw new RangeError('P051 invalid identity');
 return{epoch,replay,frame:1,playing:false,level:null,popup:false,message:false,unavailable:false,intent:null,intentSerial:0,left:false,lessonCompleted:false};
}
export function p051Controls(s:P051State){const alpha=s.frame<6?[0,51,102,154,205][s.frame-1]!/256:1;return{alpha,enabled:!s.left&&!s.popup&&alpha>0,skip:s.frame<682,repeatOp:s.frame<682?'rewind':'popup'}as const;}
export function p051Reduce(s:P051State,a:P051Action):P051State{
 if(s.left||a.epoch!==s.epoch)return s;
 const available=p051Controls(s).enabled;
 switch(a.type){
  case'play':return s.frame===682||s.popup||s.playing?s:{...s,playing:true};
  case'pause':return!s.playing?s:{...s,playing:false};
  case'advance':{
   if(!Number.isSafeInteger(a.frame)||a.frame<s.frame||a.frame>683)throw new RangeError('P051 invalid cursor');
   if(!s.playing||s.popup||a.frame===s.frame)return s;const frame=Math.min(682,a.frame);
   return{...s,frame,playing:frame<682,message:frame===682?false:s.message};
  }
  case'select-level':if(a.level!==1&&a.level!==2)throw new RangeError('P051 invalid level');return available?{...s,level:a.level,unavailable:false}:s;
  case'repeat':return !available?s:s.frame===682?{...s,popup:true,playing:false}:{...s,frame:5,playing:true,intent:null,unavailable:false};
  case'skip':return available&&s.frame<682?{...s,frame:682,playing:false,popup:false,message:false,intent:null,unavailable:false}:s;
  case'close-popup':return s.popup?{...s,popup:false}:s;
  case'start':{
   if(!available)return s;
   // The early assignment targets txtRes_Msg, which is absent. Only the
   // terminal handler actually shows Mc_Msg. Keep these branches distinct.
   if(s.level===null)return s.frame===682?{...s,message:true}:s;
   const serial=s.intentSerial+1;return{...s,intentSerial:serial,unavailable:false,intent:{serial,sourceStem:s.frame===682?'L7GS03':'L3GS03',targetAnimationId:s.frame===682?'shared-alg001-l07-p052':null,level:s.level}};
  }
  case'navigation-result':return !s.intent||a.serial!==s.intent.serial?s:{...s,intent:null,unavailable:!a.accepted};
  case'start-roll-out':return s.message?{...s,message:false}:s;
  case'replay':return{...p051InitialState(s.epoch+1,s.replay+1),playing:true};
  case'leave':return{...s,epoch:s.epoch+1,left:true,playing:false,popup:false,message:false,intent:null};
 }
}
