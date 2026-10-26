import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P037 display marker:${a}`);return s.replace(a,b);};

/** Preserve the source101ticks and ordered plays while keeping separately stopped child635 alive. */
export function projectP037DisplayState(runtime,practice){
 assert.equal(practice.rows.length,14);assert.equal(practice.clickSites.length,101);assert.equal(practice.correctPictures.length,15);
 assert.deepEqual(practice.rows.map(r=>r.answer),[8,-2,28,25,40,47,45,54,43,64,71,78,74,80]);
 const correct=Object.fromEntries(practice.correctPictures.map(c=>['sprite'+c.sourceCharacterId,c.play]));
 const sites=practice.clickSites.map(c=>({index:c.clickIndex,character:c.sourceCharacterId,x:c.sourceX,y:c.sourceY,original:c.origin==='original',depth:c.sourceDrawOrderDepth}));
 const fields=Object.fromEntries(practice.deviceFields.map(c=>[c.sourceCharacterId,c]));
 const wrong=practice.wrong.placement,arrow=practice.arrow.placement;
 const prelude=`var P037_ACTIVE=null;
var P037_ROWS=${JSON.stringify(practice.rows)},P037_CORRECT=${JSON.stringify(correct)},P037_SITES=${JSON.stringify(sites)},P037_FIELDS=${JSON.stringify(fields)};
function p037Index(n){return Number.isSafeInteger(n)&&n>=1&&n<=101;}
function p037State(input,frame){
 if(input===undefined)return {roundIndex:0,solvedCount:0,correctPicture:0,hoverIndex:null,inputEnabled:false,startEnabled:false,skipEnabled:false,nextEnabled:false,wrongVisible:false,wrongFrame:1,arrowFrame:1,counterFrame:1,endChildFrame:Math.max(1,frame-597)};
 if(!input||!Number.isSafeInteger(input.roundIndex)||input.roundIndex<0||input.roundIndex>13||!Number.isSafeInteger(input.solvedCount)||input.solvedCount<0||input.solvedCount>14||!Number.isSafeInteger(input.correctPicture)||input.correctPicture<0||input.correctPicture>14||input.solvedCount>input.correctPicture||
 (input.hoverIndex!==null&&!p037Index(input.hoverIndex))||['inputEnabled','startEnabled','skipEnabled','nextEnabled','wrongVisible'].some(function(k){return typeof input[k]!=='boolean';})||
 !Number.isSafeInteger(input.wrongFrame)||input.wrongFrame<1||input.wrongFrame>15||!Number.isSafeInteger(input.arrowFrame)||input.arrowFrame<1||input.arrowFrame>6||!Number.isSafeInteger(input.counterFrame)||input.counterFrame<1||input.counterFrame>20||!Number.isSafeInteger(input.endChildFrame)||input.endChildFrame<1||input.endChildFrame>111)throw new Error('P037_SOURCE_DISPLAY_STATE_INVALID');
 if(input.startEnabled&&frame!==595||input.skipEnabled&&(frame<82||frame>=595)||input.wrongVisible&&frame!==596||input.inputEnabled&&(frame!==596||input.wrongVisible||input.counterFrame>1||input.correctPicture!==input.roundIndex||input.solvedCount!==input.roundIndex)||input.nextEnabled&&(frame!==596||input.wrongVisible||input.counterFrame>1||input.solvedCount!==input.roundIndex+1||input.solvedCount>=14)||input.hoverIndex!==null&&!input.inputEnabled)throw new Error('P037_SOURCE_PHASE_INVALID');
 return input;
}
function p037Text(ctx,ct,id){
 var s=P037_ACTIVE;if(!s)return;var field=P037_FIELDS[id],row=P037_ROWS[s.roundIndex],value=id===529?row.question:id===530?row.expression+(s.correctPicture===s.roundIndex+1?String(row.answer):'?'):id===568?row.wrongFeedback:String(s.correctPicture?P037_ROWS[s.correctPicture-1].answer:0);
 var b=field.sourceBoundsTwips,height=field.sourceFontHeightTwips,maxWidth=b.right-b.left-80,x=b.left+40,y=b.top+40+height;
 ctx.save();ctx.beginPath();ctx.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);ctx.clip();
 var c=field.color;ctx.fillStyle=tocolor(ct.apply([Number(c.red),Number(c.green),Number(c.blue),Number(c.alpha)/255]));ctx.font=(field.sourceBold?'bold ':'')+height+'px Arial, sans-serif';ctx.textBaseline='alphabetic';ctx.textAlign=field.sourceAlign===2?'center':field.sourceAlign===1?'right':'left';
 if(field.sourceAlign===2)x=(b.left+b.right)/2;else if(field.sourceAlign===1)x=b.right-40;
 if(field.wordWrap){var words=value.split(' '),line='';for(var i=0;i<words.length;i++){var next=line?line+' '+words[i]:words[i];if(line&&ctx.measureText(next).width>maxWidth){ctx.fillText(line,x,y);line=words[i];y+=height+field.leadingTwips;}else line=next;}if(line)ctx.fillText(line,x,y);}
 else ctx.fillText(value,x,y,maxWidth);
 ctx.restore();
}
var p037SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ct,blend,frame,ratio,time){
 var s=P037_ACTIVE;
 if(s){
  if(s.mainFrame===596){
   if(P037_CORRECT[obj]!==undefined&&P037_CORRECT[obj]!==s.correctPicture)return;
   if(obj==='sprite532'||obj==='sprite569')return;
   if(obj==='sprite426'||obj==='sprite429'||obj==='sprite432'){
    var site=P037_SITES.find(function(p){return p.original&&p.character===Number(obj.slice(6))&&Math.abs(p.x-matrix[4])<0.000001&&Math.abs(p.y-matrix[5])<0.000001;});
    if(!site)throw new Error('P037_SOURCE_ORIGINAL_SITE_UNBOUND');frame=site.index===s.hoverIndex?1:0;
   }
   if(obj==='sprite565')frame=s.nextEnabled?1:0;
  }
  if(s.mainFrame===597&&obj==='sprite532')return;
  if(s.mainFrame===597&&(obj==='sprite426'||obj==='sprite429'||obj==='sprite432'||obj==='sprite565'))frame=0;
  if(obj==='sprite573'||obj==='sprite524'||obj==='sprite527')frame=0;
  if(obj==='sprite635')frame=s.endChildFrame-1;
 }
 return p037SourcePlace(obj,canvas,ctx,matrix,ct,blend,frame,ratio,time);
};
function p037Dynamic(ctx,ct,time){
 var s=P037_ACTIVE;if(!s||s.mainFrame!==596)return;
 var layers=P037_SITES.filter(function(p){return !p.original;}).map(function(p){return {depth:p.depth,site:p};});
 layers.push({depth:1280,arrow:true});if(s.wrongVisible)layers.push({depth:1282,wrong:true});layers.sort(function(a,b){return a.depth-b.depth;});
 for(var i=0;i<layers.length;i++){
  var layer=layers[i];
  if(layer.site){var p=layer.site;p037SourcePlace('sprite'+p.character,canvas,ctx,[0.05,0,0,0.05,p.x,p.y],ct,1,p.index===s.hoverIndex?1:0,0,time);}
  else if(layer.arrow){var answerIndex=s.correctPicture?P037_ROWS[s.correctPicture-1].correctClickIndex:21,x=P037_SITES[answerIndex-1].x-(s.correctPicture?1:0);p037SourcePlace('sprite532',canvas,ctx,[0.05,0,0,0.05,x,${Number(arrow.transform.transY)/20}],ct,1,s.arrowFrame-1,0,time);}
  else p037SourcePlace('sprite569',canvas,ctx,[0.05,0,0,0.05,${Number(wrong.transform.transX)/20},${Number(wrong.transform.transY)/20}],ct,1,s.wrongFrame-1,0,time);
 }
}
`;
 for(const field of practice.deviceFields){
  const name='text'+field.sourceCharacterId,match=runtime.match(new RegExp(`function ${name}\\(ctx,ctrans,frame,ratio,time\\)\\{[\\s\\S]*?\\n\\}`,'u'));
  assert(match&&!match[0].includes('fillText'));runtime=once(runtime,match[0],`function ${name}(ctx,ctrans,frame,ratio,time){p037Text(ctx,ctrans,${field.sourceCharacterId});\n}`);
 }
 const a=runtime.indexOf('function sprite636(ctx,ctrans,frame,ratio,time){'),b=runtime.indexOf('\n}',a)+2;assert(a>=0&&b>a);
 const body=runtime.slice(a,b),end=body.lastIndexOf('ctx.restore();');assert(end>=0);
 runtime=runtime.slice(0,a)+body.slice(0,end)+'p037Dynamic(ctx,ctrans,time);\n\t'+body.slice(end)+runtime.slice(b);
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p037State(request && request.interaction,state.localFrame);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P037_ACTIVE;\n    P037_ACTIVE=Object.assign({},interaction,{mainFrame:state.localFrame});\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P037_ACTIVE=previousInteraction;');
 return runtime;
}
