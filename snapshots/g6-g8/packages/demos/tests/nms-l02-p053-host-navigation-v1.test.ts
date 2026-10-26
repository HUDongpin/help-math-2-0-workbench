import assert from 'node:assert/strict';import {test} from 'node:test';
import {p053StartHostRequest,p053HandoffLevel} from '../src/nms-l02-p053-host-navigation-v1';
import {initialP053ControllerState,selectP053Level,enterP053SelectLevel,startP053}
 from '../src/nms-l02-p053-controller-candidate';
const page='shared-nms002-l02-p053',game='shared-nms002-l02-p054';
test('audited current-L2 early basename miss reloads P053 without cross-lesson navigation',()=>{
 for(const level of [1,2] as const){
  const intent=startP053(selectP053Level(initialP053ControllerState(),level)).intent!;
  assert.deepEqual(p053StartHostRequest(intent,page),{type:'navigate',targetAnimationId:page});
  assert.throws(()=>p053StartHostRequest({...intent,tempSection:6},page),/SOURCE_BRANCH/);
  assert.throws(()=>p053StartHostRequest(intent,game),/CONTEXT/);
 }
});
test('late source branch carries each level only from P053 to P054',()=>{
 for(const level of [1,2] as const){
  const intent=startP053(selectP053Level(enterP053SelectLevel(initialP053ControllerState()),level)).intent!;
  const request=p053StartHostRequest(intent,page);
  assert.equal(request.targetAnimationId,game);
  assert.equal(p053HandoffLevel(request.handoff,game),level);
  assert.throws(()=>p053HandoffLevel(request.handoff,page),/HANDOFF/);
  assert.throws(()=>p053HandoffLevel({...request.handoff!,sourceAnimationId:game},game),/HANDOFF/);
  assert.throws(()=>p053HandoffLevel({...request.handoff!,level:3 as 1},game),/HANDOFF/);
 }
 assert.equal(p053HandoffLevel(null,game),null);
});
