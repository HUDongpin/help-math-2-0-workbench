import React from 'react';
import {LessonTextBlock} from './lesson-text-presentation';
import {P004_SEMANTIC_TEXT_BINDING,p004SemanticText} from './alg-l06-p004-semantic-text-v1';
import {P004_TEXT_SNAPSHOT_POLICY,type P004TextSnapshot} from './alg-l06-p004-text-snapshot-v1';
/** Actual native companion renderer. Canvas glyphs remain intentionally intact. */
export function P004NativeTextV1({snapshot}:{readonly snapshot:P004TextSnapshot}){
 const binding=P004_SEMANTIC_TEXT_BINDING;
 if(snapshot.status!=='ready'||snapshot.animationId!==binding.animationId||snapshot.bindingVersion!==binding.version||
  snapshot.sourceSwfSha256!==binding.sourceSwfSha256||snapshot.suppressedInstances.length!==0)
  throw Error('P004 native text requires current unsuppressed snapshot');
 const rows=new Map(p004SemanticText(snapshot.identity.frame).map(row=>[row.id,row]));
 return <section className="lesson-text-presentation lesson-text-presentation--explanation"
  data-p004-native-text="true" data-p004-reveal-policy={P004_TEXT_SNAPSHOT_POLICY.reveal}
  data-p004-canvas-suppression="none" data-p004-text-replay={snapshot.identity.replay} data-p004-text-frame={snapshot.identity.frame} data-p004-content-language="en"
  data-p004-language-policy={snapshot.identity.language==='es'?'source-fallback':'source'}
  aria-label={snapshot.identity.language==='es'?'Texto de la lección':'Lesson text'}>
  {snapshot.identity.language==='es'?<p lang="es" className="lesson-text-presentation__block lesson-text-presentation__block--body"
   data-p004-source-fallback="true">El texto de esta animación se conserva en inglés.</p>:null}
  <div className="lesson-text-presentation__layout">
   {snapshot.blocks.filter(block=>block.visible).map(block=>{
    const row=rows.get(block.id),source=binding.blocks.find(item=>item.id===block.id);
    if(!row||!source||row.text!==block.text)throw Error('P004 native text source binding mismatch');
    return <div key={block.id} data-p004-text-block={block.id} data-p004-text-kind={row.kind}
     data-source-shape-ids={row.sourceShapeIds?.join(' ')} data-source-text-ids={row.sourceTextIds.join(' ')} data-source-instance-ids={row.instanceIds.join(' ')}
     data-p004-source-text-ids={JSON.stringify(row.sourceTextIds)} data-p004-instance-ids={JSON.stringify(row.instanceIds)}
     role={row.kind==='semanticMath'?'math':undefined} aria-label={row.math?.ariaLabel} lang="en">
     {row.pair?<dl data-lesson-text-block={block.id} data-p004-semantic-pair={row.pair.kind} style={{margin:0,display:'grid',gap:'0.25rem'}}>
      <dt className="lesson-text-presentation__block lesson-text-presentation__block--label">{row.pair.label}</dt>{' '}
      <dd className="lesson-text-presentation__block lesson-text-presentation__block--label" style={{margin:0}}>{row.pair.value}</dd>
     </dl>:<LessonTextBlock block={block}/>}
    </div>;
   })}
  </div>
 </section>;
}
