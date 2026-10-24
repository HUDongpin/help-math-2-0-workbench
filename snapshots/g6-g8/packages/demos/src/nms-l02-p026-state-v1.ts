import{P026_GAME_SOURCE as SOURCE}from'./generated/nms-l02-p026-game-source-v1';
export type P026Phase='intro'|'ready'|'moving-first'|'second'|'moving-second'|'returning'|'between'|'outro'|'completed';
export interface P026Card{readonly id:number;readonly pairId:number;readonly kind:'number'|'picture';readonly numerator:number;readonly denominator:number;readonly sourceShape:number;readonly decorativeFrame:number;readonly home:readonly[number,number];readonly removed:boolean;}
export interface P026State{readonly seed:number;readonly replay:number;readonly mainFrame:number;readonly phase:P026Phase;readonly round:0|1|2;readonly cards:readonly P026Card[];readonly first:number|null;readonly second:number|null;readonly answerFrame:number;readonly motionTick:number;readonly matches:number;readonly attempts:number;}
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
function validSeed(seed:number){if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P026_SEED');}
/** Stable native PRNG. It preserves the source swap algorithm, not Flash's random sequence. */
function random(seed:number){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function p026Initial(seed:number,replay=0):P026State{validSeed(seed);if(!Number.isSafeInteger(replay)||replay<0)throw Error('P026_REPLAY');return freeze({seed,replay,mainFrame:1,phase:'intro',round:0,cards:[],first:null,second:null,answerFrame:1,motionTick:0,matches:0,attempts:0});}
function enterRound(s:P026State,round:1|2):P026State{
 const src=SOURCE.rounds[round-1]!,rng=random((s.seed^Math.imul(round,0x9e3779b9))>>>0),slots=Array.from({length:8},(_,i)=>i+1),decorative=slots.map(()=>Math.floor(rng()*12)+1);
 for(let i=0;i<8;i++){const j=Math.floor(rng()*8);[slots[i],slots[j]]=[slots[j]!,slots[i]!];}
 const cards:P026Card[]=[];for(let i=0;i<4;i++){const pair=src.pairs[i]!;for(let side=0;side<2;side++){const id=slots[i*2+side]!,picture=side===1;cards.push({id,pairId:pair.pairId,kind:picture?'picture':'number',numerator:picture?pair.coloredSectors:pair.numerator,denominator:picture?pair.totalSectors:pair.denominator,sourceShape:pair.pictogramShape,decorativeFrame:decorative[id-1]!,home:[215+60*Math.floor((id-1)/4),66*((id-1)%4+1)],removed:false});}}
 cards.sort((a,b)=>a.id-b.id);return freeze({...s,round,mainFrame:src.stopFrame,phase:'ready',cards,first:null,second:null,answerFrame:1,motionTick:0,matches:0});
}
export function p026Choose(s:P026State,id:number):P026State{
 if((s.phase!=='ready'&&s.phase!=='second')||!Number.isSafeInteger(id))return s;
 const card=s.cards.find(c=>c.id===id);if(!card||card.removed||id===s.first)return s;
 return freeze(s.phase==='ready'?{...s,first:id,second:null,phase:'moving-first',motionTick:0}:{...s,second:id,phase:'moving-second',motionTick:0});
}
/** One authored12fps tick; the stopped main playhead and independent board clock never conflate. */
export function p026Tick(s:P026State):P026State{
 if(s.phase==='completed'||s.phase==='ready')return s;
 if(s.phase==='second')return s.answerFrame<21?freeze({...s,answerFrame:s.answerFrame+1}):s;
 if(s.phase==='moving-second'&&s.answerFrame<21)s={...s,answerFrame:s.answerFrame+1};
 if(s.phase==='intro'||s.phase==='between'||s.phase==='outro'){
  if(s.mainFrame===SOURCE.mainFrameCount)return freeze({...s,phase:'completed'});
  const n=s.mainFrame+1;if(n===SOURCE.rounds[0].stopFrame&&s.phase==='intro')return enterRound(s,1);if(n===SOURCE.rounds[1].stopFrame&&s.phase==='between')return enterRound(s,2);return freeze({...s,mainFrame:n});
 }
 const motionTick=s.motionTick+1;if(motionTick<=SOURCE.movementDurationTicks+1)return freeze({...s,motionTick});
 if(s.phase==='moving-first')return freeze({...s,phase:'second',answerFrame:2,motionTick:0});
 if(s.phase==='returning')return freeze({...s,phase:'ready',first:null,second:null,motionTick:0});
 const a=s.cards.find(c=>c.id===s.first)!,b=s.cards.find(c=>c.id===s.second)!,attempts=s.attempts+1;
 if(a.pairId!==b.pairId)return freeze({...s,phase:'returning',answerFrame:1,motionTick:0,attempts});
 const matches=s.matches+1,cards=s.cards.map(c=>c.id===s.first||c.id===s.second?{...c,removed:true}:c);
 return freeze({...s,cards,matches,attempts,answerFrame:1,phase:matches===4?(s.round===1?'between':'outro'):'ready',first:null,second:null,motionTick:0});
}
export function p026Replay(s:P026State):P026State{return p026Initial(s.seed,s.replay+1);}
export function p026CardPosition(s:P026State,id:number):readonly[number,number]{
 const c=s.cards.find(c=>c.id===id);if(!c)throw Error('P026_CARD');const side=id===s.first?0:id===s.second?1:-1;if(side<0||c.removed)return c.home;
 const target:readonly[number,number]=[side===0?190:300,336],moving=(s.phase==='moving-first'&&side===0)||(s.phase==='moving-second'&&side===1),returning=s.phase==='returning';if(!moving&&!returning)return target;
 const t=Math.max(0,Math.min(SOURCE.movementDurationTicks,s.motionTick-1))/SOURCE.movementDurationTicks,ease=t*(2-t),from=returning?target:c.home,to=returning?c.home:target;return Object.freeze([from[0]+(to[0]-from[0])*ease,from[1]+(to[1]-from[1])*ease]);
}
