import assert from 'node:assert/strict';
import {restoreSourceButtonStates} from './g678-source-button-states-v1.mjs';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P022 display marker:${a}`);return s.replace(a,b);};
/** Source main342, sixteen cards and six target rows; dormant clips remain at their source stops. */
export function projectP022DisplayState(runtime,practice){
 const cards=practice.cards;
 assert.deepEqual(cards.map(c=>[c.id,c.sourceCharacterId,c.targetCharacterId]),[['Scr_1',92,86],['Scr_2',108,87],['Scr_3',106,88],['Scr_4',103,89],['Scr_5',95,90],['Scr_6',107,91],['Scr_7',93,null],['Scr_8',94,null],['Scr_9',96,null],['Scr_10',97,null],['Scr_11',99,null],['Scr_12',100,null],['Scr_13',101,null],['Scr_14',102,null],['Scr_15',104,null],['Scr_16',105,null]]);
 assert.equal(practice.wrongCloseStateMatrixUnits,'source-twips');runtime=restoreSourceButtonStates(runtime,330,practice.wrongCloseStates);
 const defaults=Object.fromEntries(cards.map(c=>[c.id,c.originTwips])),sources=Object.fromEntries(cards.map(c=>[`sprite${c.sourceCharacterId}`,c.id])),targets=Object.fromEntries(cards.filter(c=>c.targetCharacterId!==null).map(c=>[`sprite${c.targetCharacterId}`,c.id]));
 const prelude=`var P022_ACTIVE = null;
var P022_ORIGINS=${JSON.stringify(defaults)},P022_DRAGS=${JSON.stringify(sources)},P022_TARGETS=${JSON.stringify(targets)};
function p022State(input){
 if(input===undefined)return{positions:P022_ORIGINS,locked:[],popup:'none',feedbackFrame:1,rightFrame:1,coachFrame:1,closePressed:false};
 if(!input||!Array.isArray(input.locked)||input.locked.length>6||new Set(input.locked).size!==input.locked.length||input.locked.some(function(id){return ['Scr_1','Scr_2','Scr_3','Scr_4','Scr_5','Scr_6'].indexOf(id)<0;})||['none','wrong'].indexOf(input.popup)<0||!Number.isSafeInteger(input.feedbackFrame)||input.feedbackFrame<1||input.feedbackFrame>15||!Number.isSafeInteger(input.rightFrame)||input.rightFrame<1||input.rightFrame>25||!Number.isSafeInteger(input.coachFrame)||input.coachFrame<1||input.coachFrame>20||typeof input.closePressed!=='boolean'||input.closePressed&&input.popup!=='wrong'||input.rightFrame>1&&input.locked.length!==6)throw new Error('P022_SOURCE_DISPLAY_STATE_INVALID');
 if(!input.positions||Object.keys(input.positions).sort().join()!==Object.keys(P022_ORIGINS).sort().join())throw new Error('P022_SOURCE_POSITION_SET_INVALID');
 Object.keys(P022_ORIGINS).forEach(function(id){var p=input.positions[id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>32000||Math.abs(p.y)>32000)throw new Error('P022_SOURCE_POSITION_INVALID');});return input;
}
var p022SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P022_ACTIVE;if(s){var drag=P022_DRAGS[obj],target=P022_TARGETS[obj];
 if(drag){if(s.locked.indexOf(drag)>=0)return;matrix=matrix.slice();matrix[4]=s.positions[drag].x/20;matrix[5]=s.positions[drag].y/20;}
 if(target){if(s.locked.indexOf(target)<0)return;ctrans=new cxform(ctrans.r_add,ctrans.g_add,ctrans.b_add,ctrans.a_add,ctrans.r_mult,ctrans.g_mult,ctrans.b_mult,256);}
 if(obj==='sprite333'){if(s.popup!=='wrong')return;frame=s.feedbackFrame-1;}
 if(['sprite129','sprite169','sprite210','sprite256','sprite320','sprite339'].indexOf(obj)>=0)frame=0;
 if(obj==='sprite341')frame=s.coachFrame-1;
 if(obj==='sprite337')frame=s.rightFrame-1;
 if(obj==='button330')frame=s.closePressed?2:0;
 }
 return p022SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p022State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P022_ACTIVE;\n    P022_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P022_ACTIVE=previousInteraction;');return runtime;
}
