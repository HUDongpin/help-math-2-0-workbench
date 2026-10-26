import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P018 display marker:${a}`);return s.replace(a,b);};
/** Source main78 display list with only source-evidenced visibility/drag/feedback changes. */
export function projectP018DisplayState(runtime,cards){
 assert.deepEqual(cards.map(c=>[c.id,c.sourceCharacterId,c.targetCharacterId]),[['Scr_1',37,null],['Scr_2',38,null],['Scr_3',39,null],['Scr_4',40,null],['Scr_5',41,51],['Scr_6',42,47],['Scr_7',45,50],['Scr_8',43,49],['Scr_9',44,48]]);
 const defaults=Object.fromEntries(cards.map(c=>[c.id,c.originTwips])),sources=Object.fromEntries(cards.map(c=>[`sprite${c.sourceCharacterId}`,c.id])),targets=Object.fromEntries(cards.filter(c=>c.targetCharacterId!==null).map(c=>[`sprite${c.targetCharacterId}`,c.id]));
 const prelude=`var P018_ACTIVE = null;
var P018_ORIGINS = ${JSON.stringify(defaults)};
var P018_DRAGS = ${JSON.stringify(sources)};
var P018_TARGETS = ${JSON.stringify(targets)};
function p018State(input) {
 if (input === undefined) return {positions:P018_ORIGINS,locked:[],popup:'none',feedbackFrame:1,rightFrame:1};
 if (!input || !Array.isArray(input.locked) || input.locked.length >5 || new Set(input.locked).size!==input.locked.length || input.locked.some(function(id){return ['Scr_5','Scr_6','Scr_7','Scr_8','Scr_9'].indexOf(id)<0;}) || ['none','wrong'].indexOf(input.popup)<0 || !Number.isSafeInteger(input.feedbackFrame) || input.feedbackFrame<1 || input.feedbackFrame>15 || !Number.isSafeInteger(input.rightFrame) || input.rightFrame<1 || input.rightFrame>25) throw new Error('P018_SOURCE_DISPLAY_STATE_INVALID');
 Object.keys(P018_ORIGINS).forEach(function(id){var p=input.positions && input.positions[id];if(!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x)>32000 || Math.abs(p.y)>32000)throw new Error('P018_SOURCE_POSITION_INVALID');});
 return input;
}
var p018SourcePlace = place;
place = function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time) {
 var s=P018_ACTIVE;
 if(s){
  var drag=P018_DRAGS[obj],target=P018_TARGETS[obj];
  if(drag){if(s.locked.indexOf(drag)>=0)return;matrix=matrix.slice();matrix[4]=s.positions[drag].x/20;matrix[5]=s.positions[drag].y/20;}
  if(target){if(s.locked.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,ctrans.a_add,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(obj==='sprite69'){if(s.popup!=='wrong')return;frame=s.feedbackFrame-1;}
  if(obj==='sprite77'||obj==='sprite75')return;
  if(obj==='sprite73'){if(s.rightFrame<=1)return;frame=s.rightFrame-1;}
 }
 return p018SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p018State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P018_ACTIVE;\n    P018_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P018_ACTIVE = previousInteraction;');
 return runtime;
}
