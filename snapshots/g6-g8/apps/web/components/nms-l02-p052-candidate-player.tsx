'use client';
import {P052Player} from '../../../packages/demos/src/nms-l02-p052-player-v1';
import {P052CaptureRenderer,type P052CaptureIdentityRequest} from '../../../packages/demos/src/nms-l02-p052-capture-renderer-v1';
import '../../../packages/demos/src/nms-l02-p052-page-view-v1.css';
import './nms-l02-p052-candidate-player.css';
/** Preregistration mounted player probe, not the full My Lesson host. */
export function P052CandidatePlayer({language,capture}:{language:'en'|'es';capture?:P052CaptureIdentityRequest|null}){
 return <section className="p052-candidate" lang={language} data-lesson-presentation="modern-text-v1"
  data-p052-registration="unregistered-engineering-candidate">
  <p>{language==='es'
   ?'Vista local de ingeniería sin registrar. Texto en español; narración fuente en inglés. La revisión y la aceptación están pendientes.'
   :'Unregistered local engineering preview. English teaching text and source narration. Review and acceptance remain pending.'}</p>
  {capture?<P052CaptureRenderer request={capture}/>:<P052Player language={language}/>}
 </section>;
}
