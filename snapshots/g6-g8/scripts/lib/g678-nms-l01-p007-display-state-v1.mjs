import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P007 display marker:${a}`);return s.replace(a,b);};
/** Source main120 display list with only source-evidenced visibility/drag/feedback changes. */
export function projectP007DisplayState(runtime,cards){
 assert.deepEqual(cards.map(c=>[c.id,c.sourceCharacterId,c.targetCharacterId]),[['Scr_1',84,79],['Scr_2',83,77],['Scr_3',82,80],['Scr_4',81,78]]);
 const defaults=Object.fromEntries(cards.map(c=>[c.id,c.originTwips])),sources=Object.fromEntries(cards.map(c=>[`sprite${c.sourceCharacterId}`,c.id])),targets=Object.fromEntries(cards.map(c=>[`sprite${c.targetCharacterId}`,c.id]));
 const prelude=`var P007_ACTIVE = null;
var P007_ORIGINS = ${JSON.stringify(defaults)};
var P007_DRAGS = ${JSON.stringify(sources)};
var P007_TARGETS = ${JSON.stringify(targets)};
function p007State(input) {
 if (input === undefined) return {positions:P007_ORIGINS,locked:[],popup:'none',feedbackFrame:1,rightFrame:1};
 if (!input || !Array.isArray(input.locked) || input.locked.length >4 || new Set(input.locked).size!==input.locked.length || input.locked.some(function(id){return !Object.prototype.hasOwnProperty.call(P007_ORIGINS,id);}) || ['none','help','wrong'].indexOf(input.popup)<0 || !Number.isSafeInteger(input.feedbackFrame) || input.feedbackFrame<1 || input.feedbackFrame>15 || !Number.isSafeInteger(input.rightFrame) || input.rightFrame<1 || input.rightFrame>25) throw new Error('P007_SOURCE_DISPLAY_STATE_INVALID');
 Object.keys(P007_ORIGINS).forEach(function(id){var p=input.positions && input.positions[id];if(!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x)>32000 || Math.abs(p.y)>32000)throw new Error('P007_SOURCE_POSITION_INVALID');});
 return input;
}
var p007SourcePlace = place;
place = function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time) {
 var s=P007_ACTIVE;
 if(s){
  var drag=P007_DRAGS[obj],target=P007_TARGETS[obj];
  if(drag){if(s.locked.indexOf(drag)>=0)return;matrix=matrix.slice();matrix[4]=s.positions[drag].x/20;matrix[5]=s.positions[drag].y/20;}
  if(target){if(s.locked.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,ctrans.a_add,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,255);}
  if(obj==='sprite107' && s.popup!=='help')return;
  if(obj==='sprite111'){if(s.popup!=='wrong')return;frame=s.feedbackFrame-1;}
  if(obj==='sprite113'||obj==='sprite115')return;
  if(obj==='sprite119'){if(s.rightFrame<=1)return;frame=s.rightFrame-1;}
 }
 return p007SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction = p007State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction = P007_ACTIVE;\n    P007_ACTIVE = interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P007_ACTIVE = previousInteraction;');
 return runtime;
}
