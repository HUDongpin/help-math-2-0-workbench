import {NMS_L02_P004_IR as IR} from './generated/nms-l02-p004-source-ir-v1';
import type {P004FrameState,P004Node} from './nms-l02-p004-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const textCharacters=new Set(IR.texts.map(t=>t.characterId));
export const P004_REPLACED_SHAPES:ReadonlySet<number>=new Set([300,312,316,345,377,378,379,390,391,395,400,407,412,418,427,432,441,448,451,452,453,468,469,474,485,502,503,504,512,517,519,522,528,533,535,540,545,550,554,556]);
export function p004ReplacesNode(n:P004Node):boolean{return textCharacters.has(n.characterId)||P004_REPLACED_SHAPES.has(n.characterId);}
export const P004_KEY_LAYOUT=Object.freeze(['','M+','MRC','C','CE','1','2','3','+','%','4','5','6','-','√','7','8','9','x','=','', '0','','.','/']);
export const P004_TEXT_BINDING:LessonTextBinding=Object.freeze({
 schemaVersion:1,version:'nms-l02-p004-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'complex-figure',
 blocks:Object.freeze([
  {id:'course-title',sourceTextIds:[],sourceShapeIds:[554],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
  {id:'activity-title',sourceTextIds:['character-553/run-1'],sourceShapeIds:[554],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
  {id:'donkey-relationship',sourceTextIds:['character-302','character-307','character-313','character-314','character-315','character-317'],sourceShapeIds:[312,316],role:'label',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
  {id:'division-equation',sourceTextIds:['character-450','character-313','character-315','character-470','character-536'],sourceShapeIds:[451,452,453,468,469,519,535],role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
  {id:'conversion-demonstration',sourceTextIds:['character-499','character-500','character-501'],sourceShapeIds:[502,503,504],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
  {id:'calculator-display',sourceTextIds:[403,409,420,421,423,456,466,467].map(n=>'character-'+n),role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
  {id:'calculator-keys',sourceTextIds:[334,335,337,340,341,342,343,344,346,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362].map(n=>'character-'+n),sourceShapeIds:[345],role:'label',language:'en',readingOrder:6,valueSource:'source-static'},
 ]as const),
});
const alpha=(n:P004Node)=>Math.max(0,Math.min(1,n.color[3]+n.color[7]));
/** Source pointer proximity is visual demonstration emphasis, never a click event. */
function calculatorPointer(s:P004FrameState):string|null {
 const cursor=s.nodes.find(n=>n.domain==='552'&&n.characterId===390&&alpha(n)>0);
 if(!cursor)return null;
 const x=cursor.matrix[4]-11.95*cursor.matrix[0],y=cursor.matrix[5]-14.8*cursor.matrix[3];
 const candidates=s.nodes.filter(n=>n.domain==='552'&&n.depth>=590&&n.depth<=614&&alpha(n)>0).flatMap(n=>{
  const t=IR.texts.find(t=>t.characterId===n.characterId);if(!t||t.runs.length!==1||!P004_KEY_LAYOUT.includes(t.runs[0]!.text))return [];
  // DefineText bounds already include its text matrix. Apply the placement once.
  const b=t.bounds as {left:number;right:number;top:number;bottom:number},bx=(b.left+b.right)/40,by=(b.top+b.bottom)/40,m=n.matrix;
  return[{key:t.runs[0]!.text,distance:Math.hypot(m[0]*bx+m[2]*by+m[4]-x,m[1]*bx+m[3]*by+m[5]-y)}];
 });
 candidates.sort((a,b)=>a.distance-b.distance);return candidates[0]&&candidates[0].distance<=14?candidates[0].key:null;
}
export function p004TeachingState(s:P004FrameState){
 const owns=(n:P004Node)=>n.domain==='552';
 const visible=(id:number,depth?:number)=>s.visibleTexts.filter(t=>t.characterId===id&&(depth===undefined||t.depth===depth)&&t.instancePath.includes('/d1g1c552/sprite-552/')).map(t=>t.runs.map(r=>r.visiblePrefix).join('')).join('');
 const node=(id:number,depth?:number)=>s.nodes.find(n=>owns(n)&&n.characterId===id&&(depth===undefined||n.depth===depth)&&alpha(n)>0);
 const shape=(id:number)=>Boolean(node(id));
 const total=visible(302),packs=visible(307),wordRatio=Boolean(total&&packs&&shape(312));
 const fraction=visible(314,118)==='3'&&visible(313,117)==='5'&&shape(316),fractionResult=visible(317).includes('0.6');
 const dividend=visible(450),divisor=visible(313,124),question=shape(452)||shape(453)||shape(468),answer=shape(469)||visible(470)==='0.4';
 const percent=shape(535)||visible(536)==='%',conversion=Boolean((s.mainFrame??0)>=1067&&answer&&!percent);
 const moving=s.nodes.find(n=>owns(n)&&n.characterId===500&&alpha(n)>0),four=s.nodes.find(n=>owns(n)&&n.characterId===501&&alpha(n)>0);
 const decimalProgress=moving&&four?Math.max(0,Math.min(1,(moving.matrix[4]-four.matrix[4]+5.7)/28.55)):1;
 const workingZeros=s.nodes.filter(n=>owns(n)&&n.characterId===499&&alpha(n)>0).sort((a,b)=>a.depth-b.depth);
 const leadingZero=workingZeros.some(n=>n.depth===127),trailingZero=workingZeros.some(n=>n.depth!==127);
 const arrows=shape(503)||shape(504)?2:shape(502)?1:0;
 const conversionInstruction=conversion&&(arrows===2||decimalProgress>.999)?'Move the decimal point two places to the right.':'Move the decimal point to the right.';
 const digitalIds=new Set([403,409,420,421,423,456,466,467]);
 const digital=s.visibleTexts.filter(t=>digitalIds.has(t.characterId)).map(t=>{
  const n=s.nodes.find(n=>n.instancePath===t.instancePath)!,source=IR.texts.find(x=>x.characterId===t.characterId)!;
  return {text:t.runs.map(r=>r.visiblePrefix).join(''),x:n.matrix[4]+n.matrix[0]*source.matrix[4]+n.matrix[2]*source.matrix[5]};
 }).sort((a,b)=>a.x-b.x).map(x=>x.text).join('');
 return Object.freeze({headingVisible:s.nodes.some(n=>n.characterId===554&&n.domain==='555'&&alpha(n)>0),total,packs,wordRatio,fraction,fractionResult,dividend,divisor,question,answer,percent,conversion,decimalProgress,decimalVisible:Boolean(moving),leadingZero,trailingZero,arrows,conversionInstruction,calculator:shape(377),calculatorDisplay:digital,calculatorKey:calculatorPointer(s)});
}
function instance(n:P004Node){const path:LessonTextInstanceSegment[]=[];for(const m of n.instancePath.matchAll(/(root:\d+|sprite-\d+)\/d(\d+)g(\d+)c(\d+)/gu))path.push(Object.freeze({timelineId:m[1]!.startsWith('root:')?'root':m[1]!,depth:Number(m[2]),generation:Number(m[3]),characterId:Number(m[4])}));return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});}
export function p004TextSnapshot(s:P004FrameState){
 const t=p004TeachingState(s),fraction=(t.wordRatio?`${t.packs} / ${t.total}`:[t.total,t.packs].filter(Boolean).join('; '))+(t.fraction?' = 3/5':'')+(t.fractionResult?' = 0.6':'');
 const division=(t.dividend&&t.divisor?`${t.dividend} ÷ ${t.divisor} = `:'')+(t.answer?'0.4':t.question?'?':'')+(t.percent?' = 40%':'');
 const snap=buildLessonTextSnapshot(P004_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:'source-real-world',lang:s.language,seed:s.seed,replay:s.replay},{
  'course-title':{text:'Fractions, Decimals and Percents Concepts:',visible:t.headingVisible},'activity-title':{text:'Real World Activity',visible:t.headingVisible},
  'donkey-relationship':{text:fraction,visible:Boolean(fraction)},'division-equation':{text:division,visible:Boolean(division)},
  'conversion-demonstration':{text:'Convert 0.4 to a percent. '+t.conversionInstruction,visible:t.conversion},
  'calculator-display':{text:t.calculatorDisplay||'Blank display',visible:t.calculator},'calculator-keys':{text:'Calculator: '+P004_KEY_LAYOUT.filter(Boolean).join(' ')+'; Start Over',visible:t.calculator},
 });return Object.freeze({...snap,suppressedInstances:Object.freeze(snap.status==='ready'?s.nodes.filter(p004ReplacesNode).map(instance):[])});
}
