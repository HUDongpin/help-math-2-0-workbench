import {P016_IR as IR} from './generated/nms-l02-p016-source-ir-v1';
import type {P016State} from './nms-l02-p016-state-v1';
import type {P016Pose} from './nms-l02-p016-source-contract-v1';
export function p016LocalPoses(domain:string,frame:number):readonly P016Pose[]{
 const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;
 if(!d||!Number.isInteger(frame)||frame<1||frame>d.frameCount)throw Error('P016_BAD_DOMAIN_FRAME');
 return Object.freeze(d.frames[frame-1]!.map(i=>IR.poses[i]!));
}
/** Measured source glyph visibility, independent of native font metrics. */
export function p016Teaching(s:P016State){
 const poses=p016LocalPoses('194',s.mainFrame),runs=IR.visibilityStates[IR.visibilityFrames[s.mainFrame-1]!]!;
 const run=(id:number,index=0)=>runs.find(r=>r.sourceTextId===`character-${id}/run-${index}`);
 const alpha=(id:number)=>{const p=poses.find(p=>p.characterId===id);return p?Math.max(0,Math.min(1,p.color[3]!+p.color[7]!)):0;};
 const thumb=poses.find(p=>p.characterId===116),pointer=poses.find(p=>p.characterId===127&&p.color[3]!>0),press=poses.find(p=>p.characterId===146);
 const demoTarget=press?'done':pointer?pointer.matrix[4]<0?'slider':pointer.matrix[4]<130?'tens':pointer.matrix[4]<210?'ones':null:null;
 return Object.freeze({runs,run,poses,gridAlpha:alpha(114),demo:s.mainFrame<176,final:s.mainFrame>=177,
  demoArt:poses.filter(p=>p.characterId>=128&&p.characterId<=135),demoDigits:[run(141)?.visibleText??'',run(142)?.visibleText??'']as const,
  demoThumb:thumb?Math.max(0,Math.min(1,(thumb.matrix[4]+333)/240)):0,demoTarget,
  decimalComplete:s.mainFrame>=63&&s.mainFrame<=176,gridComplete:s.mainFrame>=66,
  representComplete:s.mainFrame>=77&&s.mainFrame<=176,
  numerator:run(139)?.visibleText??'',denominator:run(140)?.visibleText??'',
  prompt1:[run(125)?.visibleText??'',run(125,1)?.visibleText??'',run(125,2)?.visibleText??''],
  prompt2:[run(137)?.visibleText??'',run(137,1)?.visibleText??''],prompt3:run(144)?.visibleText??'',
  finalText:[0,1,2].map(i=>run(191,i)?.visibleText??'').join('')});
}
