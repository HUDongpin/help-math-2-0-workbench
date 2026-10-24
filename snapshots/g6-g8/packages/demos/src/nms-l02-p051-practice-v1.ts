/** Source main257 stops485; five matches among nine choices; explicit terminal503. */
export const P051_ITEMS=[
 {id:0,decimal:'0.1',fraction:[1,10]}, {id:1,decimal:'0.125',fraction:null},
 {id:2,decimal:'0.2',fraction:[1,5]}, {id:3,decimal:'0.25',fraction:[1,4]},
 {id:4,decimal:'0.3',fraction:null}, {id:5,decimal:'0.75',fraction:[3,4]},
 {id:6,decimal:'0.7',fraction:null}, {id:7,decimal:'0.8',fraction:null},
 {id:8,decimal:'0.875',fraction:[7,8]},
] as const;
export type P051Phase='intro'|'ready'|'wrong-feedback'|'correct-feedback'|'completion-feedback'|'outro'|'complete';
export interface P051State {phase:P051Phase;solved:readonly number[];activeItem:number|null;token:number;replay:number;}
export type P051Event={type:'replay'}|{type:'finish';token:number}|{type:'drop';item:number;target:number|null}|{type:'close-wrong'};
export const p051Initial=():P051State=>({phase:'intro',solved:[],activeItem:null,token:0,replay:0});
export function p051Reduce(state:P051State,event:P051Event):P051State{
 const change=(patch:Partial<P051State>)=>({...state,...patch,token:state.token+1});
 if(event.type==='replay')return {...p051Initial(),replay:state.replay+1,token:state.token+1};
 if(event.type==='close-wrong')return state.phase==='wrong-feedback'?change({phase:'ready',activeItem:null}):state;
 if(event.type==='drop'){
  const item=P051_ITEMS.find(value=>value.id===event.item);
  if(state.phase!=='ready'||!item||state.solved.includes(item.id))return state;
  // Native target identity intentionally excludes the unresolved outer _level0.instance3 alias.
  return item.fraction!==null&&event.target===item.id?change({phase:'correct-feedback',solved:[...state.solved,item.id],activeItem:item.id}):change({phase:'wrong-feedback',activeItem:item.id});
 }
 if(event.token!==state.token)return state;
 switch(state.phase){
  case 'intro':return change({phase:'ready'});
  case 'correct-feedback':return change({phase:state.solved.length===5?'completion-feedback':'ready',activeItem:null});
  case 'completion-feedback':return change({phase:'outro'});
  case 'outro':return change({phase:'complete'});
  default:return state;
 }
}
