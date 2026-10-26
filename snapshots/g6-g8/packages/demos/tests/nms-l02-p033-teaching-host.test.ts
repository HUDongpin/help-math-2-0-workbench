import test from 'node:test';
import assert from 'node:assert/strict';
import {p033Teaching,p033QuestionText,p033Highlights} from '../src/nms-l02-p033-teaching-v1';
import {p033Initial,p033Advance,p033Answer,p033OpenHelp,P033_ID} from '../src/nms-l02-p033-state-v1';
import {createP033TermHost,p033SourceTerm} from '../src/nms-l02-p033-term-host-v1';
test('source text, help label and chart appear at distinct audited boundaries',()=>{
 assert.equal(p033QuestionText({mainFrame:27}),'');assert.notEqual(p033QuestionText({mainFrame:50}),'What is the name of this decimal?');assert.equal(p033QuestionText({mainFrame:51}),'What is the name of this decimal?');
 assert.equal(p033Teaching({mainFrame:88}).helpLabelAlpha,0);assert.equal(p033Teaching({mainFrame:89}).helpLabelAlpha,1);
 assert.equal(p033Teaching({mainFrame:256}).chartAlpha,0);assert.equal(p033Teaching({mainFrame:262}).chartAlpha,1);
 assert.deepEqual(p033Teaching({mainFrame:156}).optionAlphas,[0,0,1,0]);
 assert.equal(p033Highlights({mainFrame:215},false).length,0);assert.equal(p033Highlights({mainFrame:215},true)[0].characterId,215);
 assert.equal(p033Highlights({mainFrame:235},true)[0].characterId,216);
});
test('glossary host requires current page, exact playback disposition and visible source context',()=>{
 const host=createP033TermHost(),q=p033Advance(p033Initial(),130),request={type:'open-keyterm' as const,entryId:'decimal',sourceAnimationId:P033_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
 assert.equal(host.dispatch(request,p033Initial()).status,'blocked');assert.equal(host.dispatch(request,q).status,'allowed');host.dispatch({type:'close-keyterm'},q);
 assert.equal(host.dispatch(request,p033Answer(q,2)).status,'blocked');assert.equal(host.dispatch({...request,sourceAnimationId:'shared-nms002-l02-p031'},q).status,'blocked');assert.equal(host.dispatch({...request,entryId:'hundredth'},q).status,'blocked');
 const help=p033OpenHelp(q);for(const id of['decimal','place-value','place-value-chart','ones-group','tenth','hundredth']){assert(p033SourceTerm(id)?.definitions.en);assert(p033SourceTerm(id)?.definitions.es);assert.equal(host.dispatch({...request,entryId:id},help).status,'allowed');host.dispatch({type:'close-keyterm'},help);}
 assert.equal(host.dispatch({...request,entryId:'__proto__'},help).status,'blocked');
});
