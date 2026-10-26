import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P033 display marker: ${a}`);return s.replace(a,b);};
/** Restore four source device captions and project only the host-selected feedback clock. */
export function projectP033DisplayState(runtime,practice){
 assert.deepEqual(practice.choices.map(c=>[c.value,c.correct]),[[84,false],[86,true],[90,false],[94,false]]);
 assert.deepEqual(practice.fields.map(f=>f.sourceCharacterId),[195,209,226,247]);
 const counts=Object.fromEntries(practice.branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`
var P033_ACTIVE=null;
var P033_COUNTS=${JSON.stringify(counts)};
var P033_FEEDBACK={"sprite249": 249, "sprite199": 199, "sprite213": 213, "sprite228": 228, "sprite105": 105, "sprite126": 126, "sprite183": 183, "sprite143": 143, "sprite157": 157};
function p033State(input,mainFrame){
 if(input===undefined)return {wrongAttempts:0,choicesEnabled:false,helpEnabled:false,helpVisible:false,feedbackCharacterId:null,feedbackFrame:1,popupVisible:false};
 if(!input||!Number.isSafeInteger(input.wrongAttempts)||input.wrongAttempts<0||input.wrongAttempts>2||['choicesEnabled','helpEnabled','helpVisible','popupVisible'].some(function(k){return typeof input[k]!=='boolean';})||!Number.isSafeInteger(input.feedbackFrame))throw new Error('P033_SOURCE_DISPLAY_STATE_INVALID');
 if(input.feedbackCharacterId===null?input.feedbackFrame!==1:!Object.prototype.hasOwnProperty.call(P033_COUNTS,input.feedbackCharacterId)||input.feedbackFrame<2||input.feedbackFrame>P033_COUNTS[input.feedbackCharacterId])throw new Error('P033_SOURCE_FEEDBACK_INVALID');
 if((input.feedbackCharacterId!==null||input.helpVisible)&&input.choicesEnabled)throw new Error('P033_SOURCE_INPUT_GUARD');
 var ranges={249:[17,23],199:[16,23],213:[13,20]},range=ranges[input.feedbackCharacterId];
 if(input.popupVisible&&(!range||input.feedbackFrame<range[0]||input.feedbackFrame>range[1]))throw new Error('P033_SOURCE_POPUP_INVALID');
 if((input.choicesEnabled||input.helpVisible||input.feedbackCharacterId!==null)&&mainFrame!==253)throw new Error('P033_SOURCE_MAIN_GUARD');
 return input;
}
function p033DeviceText(ctx,ctrans,id,field){
 var s=P033_ACTIVE,value='';
 if(s&&[249,199,213].indexOf(s.feedbackCharacterId)>=0)value=${JSON.stringify(practice.wrongText)}+(s.wrongAttempts===1?${JSON.stringify(practice.wrongRetrySuffix)}:'');
 if(!value)return;
 ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=(field.sourceBold?'bold ':'')+field.sourceFontHeightTwips+'px Arial, sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign=field.sourceAlign===1?'right':'left';
 var bounds=field.boundsTwips,x=field.sourceAlign===1?bounds.right-40:bounds.left+40,y=field.baselineTwips,maxWidth=bounds.right-bounds.left-80;
 if(field.wordWrap){var words=value.split(' '),line='';for(var i=0;i<words.length;i++){var next=line?line+' '+words[i]:words[i];if(line&&ctx.measureText(next).width>maxWidth){ctx.fillText(line,x,y);line=words[i];y+=field.sourceFontHeightTwips+field.leadingTwips;}else line=next;}if(line)ctx.fillText(line,x,y);}
 else ctx.fillText(value,x,y,maxWidth);
 ctx.restore();
}
var p033SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P033_ACTIVE,id=P033_FEEDBACK[obj];
 if(s){
  if(id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if(obj==='sprite73'){if(!s.helpVisible)return;frame=0;}
 }
 return p033SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 for(const field of practice.fields){
  const name='text'+field.sourceCharacterId,match=runtime.match(new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?\\n\\}`,'u'));assert(match&&!match[0].includes('fillText'));
  runtime=once(runtime,match[0],`function ${name}(ctx,ctrans,frame,ratio,time){p033DeviceText(ctx,ctrans,${field.sourceCharacterId},${JSON.stringify(field)});\n}`);
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p033State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P033_ACTIVE;\n    P033_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P033_ACTIVE=previousInteraction;');
 return runtime;
}
