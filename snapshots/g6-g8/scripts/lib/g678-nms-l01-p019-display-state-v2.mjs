import assert from 'node:assert/strict';
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,`P019 display marker: ${a}`);return s.replace(a,b);};
function functions(source){return new Map([...source.matchAll(/^(function ((?:shape|sprite|morphshape|text|button|font)\d+)\([^\n]*\)\{[\s\S]*?^\})/gmu)].map(m=>[m[2],m[1]]));}
/** Merge only byte-identical shared FFDec definitions and exact named Export linkages. */
export function projectP019DisplayState(runtime,mainHtml,libraries,practice){
 assert.deepEqual(libraries.map(l=>[l.objectId,l.name]),[[11,'roundHandle_3'],[13,'roundHandle_2'],[15,'roundHandle_5'],[16,'roundHandle_4'],[17,'roundHandle_1']]);
 const known=functions(mainHtml.replace(/\r\n?/gu,'\n')),extra=new Map();
 for(const lib of libraries){
  const defs=functions(lib.html.replace(/\r\n?/gu,'\n'));
  for(const[name,raw]of defs){
   if(known.has(name)){assert.equal(known.get(name),raw,`source shared definition ${name}`);continue;}
   known.set(name,raw);let body=raw;
   if(name===`sprite${lib.objectId}`){
    const [x,y]=lib.exportInternalTranslation;
    body=once(body,`\tctx.transform(1,0,0,1,${x},${y});\n`,'');
   }
   extra.set(name,body);
  }
 }
 assert.deepEqual([...extra.keys()].sort(),practice.additionalFunctionNames);
 runtime=once(runtime,'SAFE_OBJECTS = Object.freeze({',[...extra.values()].join('\n\n')+'\n\nSAFE_OBJECTS = Object.freeze({\n'+[...extra.keys()].map(n=>`${JSON.stringify(n)}:${n},`).join('\n'));
 // Top-level sprite71 is drawn in native pixels after its exported translation.
 const main=functions(runtime).get('sprite71');assert(main);
 runtime=once(runtime,main,main.replace(/\tctx.restore\(\);\n\}$/u,'\tif(frame>=552 && P019_ACTIVE) p019Dynamic(ctx,ctrans,time);\n\tctx.restore();\n}'));
 const prelude=`
var P019_ACTIVE=null, P019_HANDLE=null;
var P019_QUESTIONS=${JSON.stringify(practice.questions)};
function p019Value(x){return Math.round(x/30*6/3)+1;}
function p019State(input){
 if(input===undefined)return null;
 if(!input||!Number.isFinite(input.x1)||!Number.isFinite(input.x2)||input.x1< -308||input.x1>282||input.x2< -308||input.x2>282||!Number.isSafeInteger(input.questionIndex)||input.questionIndex<0||input.questionIndex>=10||[null,'h2','h4'].indexOf(input.pressed)<0)throw new Error('P019_SOURCE_DISPLAY_STATE_INVALID');
 return input;
}
function p019Dynamic(ctx,ctrans,time){
 var s=P019_ACTIVE,v1=p019Value(s.x1),v2=p019Value(s.x2);
 var handles=[{id:'h2',sprite:sprite13,x:s.x1,y:-30,v:v1,output:false},{id:'h4',sprite:sprite11,x:s.x2,y:47,v:v2,output:false},{id:'h6',sprite:sprite16,x:s.x1,y:95,v:v1,output:true},{id:'h8',sprite:sprite15,x:s.x1+s.x2+15,y:150,v:v2,output:true}];
 var prior=P019_HANDLE;
 try {handles.forEach(function(h){P019_HANDLE=h;ctx.save();try{ctx.transform(1,0,0,1,h.x,h.y);h.sprite(ctx,ctrans,0,0,time);}finally{ctx.restore();}});}finally{P019_HANDLE=prior;}
 // Source depths1008..1011 follow the attached handles1000..1007.
 [[-15,-30,s.x1,-30,'#0000ff'],[-15,47,s.x2,47,'#ff0000'],[-15,95,s.x1,95,'#0000ff'],[s.x1,150,s.x1+s.x2+15,150,'#ff0000']].forEach(function(l){ctx.save();ctx.beginPath();ctx.lineWidth=2;ctx.strokeStyle=l[4];ctx.lineCap='round';ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();ctx.restore();});
}
var p019SourcePlace=place;
place=function(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){
 var h=P019_HANDLE;
 if(h){
  if(obj==='sprite8'||obj==='sprite10'){
   if(h.v===0)return;
   if(obj==='sprite8'&&h.v<0){matrix=matrix.slice();matrix[0]=-.05;matrix[3]=-.05;matrix[4]=10;}
  }
  if(obj==='button14'&&h.output)return;
  if(obj==='shape1'&&P019_ACTIVE.pressed===h.id)obj='shape2';
 }
 return p019SourcePlace(obj,canvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);
};
`;
 // useOutlines=0: reconstruct dynamic device text; retain original box drawing.
 for(const field of practice.fields){
  const name=`text${field.sourceCharacterId}`,old=functions(runtime).get(name);assert(old);
  const expression=field.name==='txtQuestion'?'P019_QUESTIONS[P019_ACTIVE.questionIndex]':field.name==='txtSum'?'String(p019Value(P019_ACTIVE.x1)+p019Value(P019_ACTIVE.x2))':field.name==='txtTopVal'?'String(p019Value(P019_ACTIVE.x1))':'String(p019Value(P019_ACTIVE.x2))';
  const x=field.sourceAlign===2?(field.boundsTwips.left+field.boundsTwips.right)/2:0;
  const add=`\n if(P019_ACTIVE){ctx.save();ctx.fillStyle=tocolor(ctrans.apply([0,0,0,1]));ctx.font=${JSON.stringify(`${field.sourceFontHeightTwips}px Arial, sans-serif`)};ctx.textAlign=${JSON.stringify(field.sourceAlign===2?'center':'left')};ctx.textBaseline='alphabetic';ctx.fillText(${expression},${x},${field.baselineTwips});ctx.restore();}\n}`;
  runtime=once(runtime,old,old.replace(/\n\}$/u,add));
 }
 runtime=once(runtime,'function render(targetCanvas, request) {',prelude+'\nfunction render(targetCanvas, request) {');
 runtime=once(runtime,'    var state = resolveFrameState(request);','    var state = resolveFrameState(request);\n    var interaction=p019State(request && request.interaction);');
 runtime=once(runtime,'    var previousCanvas = canvas;','    var previousInteraction=P019_ACTIVE;\n    P019_ACTIVE=interaction;\n    var previousCanvas = canvas;');
 runtime=once(runtime,'        canvas = previousCanvas;','        canvas = previousCanvas;\n        P019_ACTIVE=previousInteraction;');
 return runtime;
}
