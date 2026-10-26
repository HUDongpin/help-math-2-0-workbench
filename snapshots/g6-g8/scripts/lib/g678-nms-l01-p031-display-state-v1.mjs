import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P031 display marker: ${a}`);return s.replace(a,b);};
/** Restore nine source device fields and project only the host-selected feedback/coaching clock. */
export function projectP031DisplayState(runtime,practice){
 assert.deepEqual(practice.problems.map(p=>[p.left,p.right,p.result]),[[6,9,15],[12,15,27],[32,49,81],[37,17,54]]);
 assert.deepEqual(practice.fields.map(f=>f.sourceCharacterId),[108,347,360,369,129,145,167,190,373]);
 const counts=Object.fromEntries(practice.branches.map(b=>[b.sourceCharacterId,b.frameCount]));
 const prelude=`
var P031_ACTIVE=null;
var P031_COUNTS=${JSON.stringify(counts)};
var P031_FEEDBACK={sprite169:169,sprite200:200,sprite134:134,sprite149:149,sprite310:310,sprite252:252,sprite217:217,sprite231:231,sprite278:278};
function p031State(input,mainFrame){
 if(input===undefined)return {questionIndex:0,inputText:'',wrongAttempts:0,inputEnabled:false,helpEnabled:false,helpVisible:false,newProblemEnabled:false,feedbackCharacterId:null,feedbackFrame:1,popupVisible:false,nextCharacterId:null,nextFrame:1};
 if(!input||!Number.isSafeInteger(input.questionIndex)||input.questionIndex<0||input.questionIndex>3||typeof input.inputText!=='string'||input.inputText.length>12||!Number.isSafeInteger(input.wrongAttempts)||input.wrongAttempts<0||input.wrongAttempts>2||['inputEnabled','helpEnabled','helpVisible','newProblemEnabled','popupVisible'].some(function(k){return typeof input[k]!=='boolean';})||!Number.isSafeInteger(input.feedbackFrame)||!Number.isSafeInteger(input.nextFrame))throw new Error('P031_SOURCE_DISPLAY_STATE_INVALID');
 if(input.feedbackCharacterId===null?input.feedbackFrame!==1:!Object.prototype.hasOwnProperty.call(P031_COUNTS,input.feedbackCharacterId)||input.feedbackFrame<2||input.feedbackFrame>P031_COUNTS[input.feedbackCharacterId])throw new Error('P031_SOURCE_FEEDBACK_INVALID');
 if(input.nextCharacterId===null?input.nextFrame!==1:[336,349,361,361][input.questionIndex]!==input.nextCharacterId||input.nextFrame<2||input.nextFrame>42)throw new Error('P031_SOURCE_NEXT_INVALID');
 if((input.feedbackCharacterId!==null||input.nextCharacterId!==null||input.helpVisible)&&input.inputEnabled||input.feedbackCharacterId!==null&&input.nextCharacterId!==null)throw new Error('P031_SOURCE_INPUT_GUARD');
 var ranges={169:[17,23],200:[15,22],134:[16,22]},range=ranges[input.feedbackCharacterId];
 if(input.popupVisible&&(!range||input.feedbackFrame<range[0]||input.feedbackFrame>range[1]))throw new Error('P031_SOURCE_POPUP_INVALID');
 if((input.inputEnabled||input.helpVisible||input.feedbackCharacterId!==null||input.nextCharacterId!==null)&&mainFrame!==542+input.questionIndex*2)throw new Error('P031_SOURCE_MAIN_GUARD');
 return input;
}
function p031DeviceText(ctx,ctrans,id,field){
 var s=P031_ACTIVE,value='';
 if(id===373)value='54';
 else if([108,347,360,369].indexOf(id)>=0)value=s?s.inputText:'';
 else if(s&&s.feedbackCharacterId!==null)value=${JSON.stringify(practice.wrongText)}+(s.wrongAttempts===1?${JSON.stringify(practice.wrongRetrySuffix)}:'');
 if(!value)return;
 ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=(field.sourceBold?'bold ':'')+field.sourceFontHeightTwips+'px Arial, sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign=field.sourceAlign===1?'right':'left';
 var bounds=field.boundsTwips,x=field.sourceAlign===1?bounds.right-40:bounds.left+40,y=field.baselineTwips,maxWidth=bounds.right-bounds.left-80;
 if(field.wordWrap){var words=value.split(' '),line='';for(var i=0;i<words.length;i++){var next=line?line+' '+words[i]:words[i];if(line&&ctx.measureText(next).width>maxWidth){ctx.fillText(line,x,y);line=words[i];y+=field.sourceFontHeightTwips+field.leadingTwips;}else line=next;}if(line)ctx.fillText(line,x,y);}
 else ctx.fillText(value,x,y,maxWidth);
 ctx.restore();
}
var p031SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var s=P031_ACTIVE,id=P031_FEEDBACK[obj];
 if(s){
  if(id){if(id!==s.feedbackCharacterId)return;matrix=matrix.slice();matrix[4]=5;frame=s.feedbackFrame-1;}
  if(obj==='sprite334'){if(!s.helpVisible)return;frame=0;}
  if(['sprite336','sprite349','sprite361'].indexOf(obj)>=0)frame=obj==='sprite'+s.nextCharacterId?s.nextFrame-1:0;
 }
 return p031SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 for(const field of practice.fields){
  const name='text'+field.sourceCharacterId,match=runtime.match(new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?\\n\\}`,'u'));assert(match&&!match[0].includes('fillText'));
  runtime=once(runtime,match[0],`function ${name}(ctx,ctrans,frame,ratio,time){p031DeviceText(ctx,ctrans,${field.sourceCharacterId},${JSON.stringify(field)});\n}`);
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p031State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P031_ACTIVE;\n    P031_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P031_ACTIVE=previousInteraction;');
 return runtime;
}
