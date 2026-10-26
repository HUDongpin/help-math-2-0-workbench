/** Maintained P053 playback and AVM1-button projection. This is source-static
 * behavior plus an explicit product clock, not an observed Flash execution. */
import {
  closeP053Directions,enterP053SelectLevel,initialP053ControllerState,
  repeatP053Directions,rollOutP053Start,selectP053Level,skipP053Directions,
  startP053,type P053ControllerState,type P053Level,type P053StartIntent,
} from './nms-l02-p053-controller-candidate';
import type {P053SceneOptions} from './nms-l02-p053-source-scene-v1';

export const P053_FPS=12;
export const P053_HELD_FRAME=693;
const FRAME_MS=1000/P053_FPS;
const BUTTONS=['mcRepeat','mcL1','mcL2','mcStart','mcSkip'] as const;
export type P053ButtonName=typeof BUTTONS[number];
export type P053ButtonFrames=Readonly<Record<P053ButtonName,1|2|3>>;
export type P053PlayerClock=Readonly<{
  generation:number;lastNowMs:number|null;remainderMs:number;
}>;
export type P053PlayerState=Readonly<{
  mainFrame:number;playing:boolean;clock:P053PlayerClock;
  controller:P053ControllerState;buttonFrames:P053ButtonFrames;
  startIntent:P053StartIntent|null;
}>;
export type P053PlayerAction=
 | Readonly<{type:'play'|'pause'|'replay'|'repeat'|'skip'|'close-popup'|'start'|'start-roll-out'}>
 | Readonly<{type:'tick';nowMs:number;generation:number}>
 | Readonly<{type:'select-level';level:P053Level}>
 | Readonly<{type:'hover'|'leave';control:P053ButtonName}>;
export type P053AvailableControl=Readonly<{
  sourceName:P053ButtonName;sourceCharacterId:number;
  sourceLabel:'Repeat Directions'|'Skip Directions'|'Level 1'|'Level 2'|'Start';
  action:'repeat'|'skip'|'select-level-1'|'select-level-2'|'start';
  sourceAlpha256:number;sourcePlaced:true;sourceVisualOpacity:number;
  controlsEnabled:boolean;clickabilityInOriginalRuntime:'unestablished';
}>;

const buttonFrames=():P053ButtonFrames=>({mcRepeat:1,mcL1:1,mcL2:1,mcStart:1,mcSkip:1});
function invalid(message:string):never{throw Error(`P053_PLAYER_${message}`);}
function finiteClock(value:number):boolean{return Number.isFinite(value)&&value>=0&&
  Number.isSafeInteger(Math.floor(value));}
function assertState(state:P053PlayerState):void{
 if(!Number.isSafeInteger(state.mainFrame)||state.mainFrame<1||state.mainFrame>P053_HELD_FRAME||
  typeof state.playing!=='boolean'||(state.mainFrame===P053_HELD_FRAME&&state.playing)||
  !Number.isSafeInteger(state.clock.generation)||state.clock.generation<0||
  (state.clock.lastNowMs!==null&&!finiteClock(state.clock.lastNowMs))||
  !Number.isFinite(state.clock.remainderMs)||state.clock.remainderMs<0||
  state.clock.remainderMs>=FRAME_MS||
  (state.mainFrame===P053_HELD_FRAME)!==(state.controller.startSite==='select-level-frame-693')||
  BUTTONS.some(name=>![1,2,3].includes(state.buttonFrames[name])))invalid('INVALID_STATE');
}
function resetClock(state:P053PlayerState,preserveSubframe=false):P053PlayerClock{
 return{generation:state.clock.generation+1,lastNowMs:null,
  remainderMs:preserveSubframe?state.clock.remainderMs:0};
}
/** Frame 693 DoAction stops and hides Mc_Popup. The global level reset and
 * Mc_Msg hide occur at frame 1, so arrival at SelectLevel retains selection
 * and messages from earlier source actions. */
function enterHeld(state:P053PlayerState):P053PlayerState{
 const controller=enterP053SelectLevel(state.controller);
 return{...state,mainFrame:P053_HELD_FRAME,playing:false,clock:resetClock(state),
  controller,buttonFrames:buttonFrames(),startIntent:null};
}
export function initialP053PlayerState():P053PlayerState{
 return{mainFrame:1,playing:false,clock:{generation:0,lastNowMs:null,remainderMs:0},
  controller:initialP053ControllerState(),buttonFrames:buttonFrames(),startIntent:null};
}
/** The source place/alpha map is separate from inferred clickability: an
 * alpha-zero placed button still has a source handler, but its real hit result
 * has not been observed. At frame 7–692 `mcSkip` is character 119; at 693
 * `mcRepeat` is character 186 and opens the directions popup. */
export function p053AvailableControls(state:P053PlayerState):readonly P053AvailableControl[]{
 assertState(state);
 const f=state.mainFrame,alpha=f<=6?[0,51,102,154,205,256][f-1]!:256;
 const make=(sourceName:P053ButtonName,sourceCharacterId:number,
  sourceLabel:P053AvailableControl['sourceLabel'],action:P053AvailableControl['action'],
  sourceAlpha256:number):P053AvailableControl=>({sourceName,sourceCharacterId,
   sourceLabel,action,sourceAlpha256,sourcePlaced:true,
   sourceVisualOpacity:sourceAlpha256/256,
   controlsEnabled:state.controller.controlsEnabled,
   clickabilityInOriginalRuntime:'unestablished'});
 if(f<=6)return[
  make('mcRepeat',119,'Repeat Directions','repeat',alpha),
  make('mcL1',126,'Level 1','select-level-1',alpha),
  make('mcL2',130,'Level 2','select-level-2',alpha),
  make('mcStart',136,'Start','start',alpha)];
 if(f<693)return[make('mcSkip',119,'Skip Directions','skip',256)];
 return[
  make('mcRepeat',186,'Repeat Directions','skip',256),
  make('mcL1',126,'Level 1','select-level-1',256),
  make('mcL2',130,'Level 2','select-level-2',256),
  make('mcStart',136,'Start','start',256)];
}
function available(state:P053PlayerState,name:P053ButtonName):void{
 const found=p053AvailableControls(state).find(item=>item.sourceName===name);
 if(!found||!found.controlsEnabled)invalid(`CONTROL_UNAVAILABLE:${name}`);
}
function button(state:P053PlayerState,name:P053ButtonName,frame:1|2|3):P053ButtonFrames{
 return{...state.buttonFrames,[name]:frame};
}
function selectedButton(level:P053Level):P053ButtonName{return level===1?'mcL1':'mcL2';}

/** Tick consumes a monotonic wall-clock sample for the current generation.
 * No audio duration, original-runtime timing parity, or automatic frame 694
 * is inferred. A stale generation is ignored; a regressing current clock is
 * rejected. Play/pause/jumps invalidate earlier timer callbacks. */
export function reduceP053Player(state:P053PlayerState,action:P053PlayerAction):P053PlayerState{
 assertState(state);
 switch(action.type){
  case 'play':
   if(state.mainFrame===P053_HELD_FRAME)return state;
   if(state.playing)return state;
   return{...state,playing:true,clock:resetClock(state,true)};
  case 'pause':return{...state,playing:false,clock:resetClock(state,true)};
  case 'replay':return{...initialP053PlayerState(),playing:true,
   clock:{generation:state.clock.generation+1,lastNowMs:null,remainderMs:0}};
  case 'tick':{
   if(!finiteClock(action.nowMs)||!Number.isSafeInteger(action.generation)||
    action.generation<0)invalid('INVALID_CLOCK');
   if(action.generation!==state.clock.generation||!state.playing)return state;
   const prior=state.clock.lastNowMs;
   if(prior===null)return{...state,clock:{...state.clock,lastNowMs:action.nowMs}};
   if(action.nowMs<prior)invalid('CLOCK_REGRESSION');
   const duration=state.clock.remainderMs+(action.nowMs-prior);
   const frames=Math.floor((duration+Number.EPSILON)/FRAME_MS);
   if(frames<=0)return{...state,clock:{...state.clock,lastNowMs:action.nowMs,
    remainderMs:duration}};
   if(state.mainFrame+frames>=P053_HELD_FRAME)return enterHeld(state);
   const remainderMs=duration-frames*FRAME_MS;
   return{...state,mainFrame:state.mainFrame+frames,
    clock:{...state.clock,lastNowMs:action.nowMs,remainderMs:Math.max(0,remainderMs)}};
  }
  case 'repeat':{
   available(state,'mcRepeat');
   if(state.mainFrame>=693)invalid('REPEAT_IS_POPUP_AT_HELD_FRAME');
   // Frame 1–5 Repeat uses gotoAndPlay("RepeatDirection") at frame 3.
   // Its release button itself goes to local frame 3.
   const intent=repeatP053Directions(state.controller);
   if(state.mainFrame<=5){
    if(intent.operation!=='gotoAndPlay'||intent.label!=='RepeatDirection')
     invalid('REPEAT_SOURCE_BINDING');
    return{...state,mainFrame:3,playing:true,clock:resetClock(state),
     buttonFrames:button(state,'mcRepeat',3),startIntent:null};
   }
   // The same placed control gets a new handler at frame 6.
   return enterHeld(state);
  }
  case 'skip':{
   if(state.mainFrame>=7&&state.mainFrame<=692){
    available(state,'mcSkip');return enterHeld(state);
   }
   if(state.mainFrame===693){
    available(state,'mcRepeat');
    return{...state,clock:resetClock(state),
     controller:skipP053Directions(state.controller),
     buttonFrames:button(state,'mcRepeat',3),startIntent:null};
   }
   return invalid('SKIP_NOT_PLACED');
  }
  case 'close-popup':{
   if(state.mainFrame!==693)invalid('CLOSE_NOT_AT_SELECT_LEVEL');
   return{...state,clock:resetClock(state),
    controller:closeP053Directions(state.controller),
    buttonFrames:button(state,'mcRepeat',1)};
  }
  case 'select-level':{
   const name=selectedButton(action.level);available(state,name);
   const controller=selectP053Level(state.controller,action.level);
   const other=name==='mcL1'?'mcL2':'mcL1';
   return{...state,controller,startIntent:null,
    buttonFrames:{...state.buttonFrames,[name]:3,[other]:1}};
  }
  case 'start':{
   available(state,'mcStart');const result=startP053(state.controller);
   return{...state,controller:result.state,startIntent:result.intent,
    buttonFrames:result.intent?button(state,'mcStart',3):state.buttonFrames};
  }
  case 'start-roll-out':{
   available(state,'mcStart');
   return{...state,controller:rollOutP053Start(state.controller),
    buttonFrames:button(state,'mcStart',1)};
  }
  case 'hover':{
   available(state,action.control);
   if((action.control==='mcL1'||action.control==='mcL2')&&
    state.buttonFrames[action.control]===3)return state;
   return{...state,buttonFrames:button(state,action.control,2)};
  }
  case 'leave':{
   available(state,action.control);
   if((action.control==='mcL1'||action.control==='mcL2')&&
    state.buttonFrames[action.control]===3)return state;
   return{...state,
    controller:action.control==='mcStart'&&state.mainFrame===693
     ?rollOutP053Start(state.controller):state.controller,
    buttonFrames:button(state,action.control,1)};
  }
  default:return invalid('UNKNOWN_ACTION');
 }
}

/** CloseBtn ends with `this._visible=false`; the receiver's effect on the
 * entire parent popup is unresolved. Requiring an explicit modern policy here
 * prevents a renderer call from silently treating it as hidden. */
export function p053SceneOptions(state:P053PlayerState):P053SceneOptions{
 assertState(state);
 if(state.controller.directionsPopupVisible==='unresolved-after-close')
  invalid('POPUP_VISIBILITY_UNRESOLVED');
 return{frame:state.mainFrame,mode:'playback',buttonFrames:state.buttonFrames,
  levelMessageVisible:state.controller.levelMessageVisible,
  popupVisible:state.controller.directionsPopupVisible};
}
