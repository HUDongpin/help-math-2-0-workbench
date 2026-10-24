/** P019 maintained source-instance gates. These are conservative static
 * full-blue-ink plus full-hit windows, not observed original-runtime clicks. */
export const P019_TIMELINE={
 animationId:'shared-alg001-l06-p019',
 sourceSwfSha256:'df8be172fd738ec4fca7bca02b0f166c88676f062170e6cee7b3a1081a91adec',
 stage:{width:800,height:600},fps:12,rootEntryFrame:6,
 frameDomain:'sprite-37',mainFrameCount:351,
 sourceAuditSha256:'bfc110b15850c17cb78c874da171c2a0635b4db1ed3c2f27a0a05013cf510dc1',
 glossaryInstances:[
  {key:'Function table',buttonId:8,instanceId:'sprite-37/depth-4/generation-1',
   sourceActionSha256:'fd3c089363c637cc80cecfb8ae7e233a7fd5421b9b42df1b5013c23a0379f0cc',
   sourcePlacementTagSha256:'68dde6ddb9c7c0e57a6504d863b2f03821a35550af69906a2b04d04dc6241169',
   label:{textId:6,runText:'function table',textInstanceId:'sprite-37/depth-3/generation-1'},
   availableSpans:[[22,351]]},
  {key:'Input',buttonId:9,instanceId:'sprite-37/depth-6/generation-1',
   sourceActionSha256:'2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5',
   sourcePlacementTagSha256:'e21b59eeb9a40e811571ec90827fbbbdc0edfa03c9e637aa322c125d090d4904',
   label:{textId:6,runText:'inputs',textInstanceId:'sprite-37/depth-3/generation-1'},
   availableSpans:[[54,351]]},
  {key:'Pair',buttonId:10,instanceId:'sprite-37/depth-8/generation-1',
   sourceActionSha256:'708bba24fc8b1c7c7252dfa59b8e72c16647430a2f0b5c5b9729bc5f821eefec',
   sourcePlacementTagSha256:'4e0f6fb9bc314da0824d8d199b5e5d99fb4f9eef7c7f3359cbe64f8eca8bd1a0',
   label:{textId:6,runText:'pairs',textInstanceId:'sprite-37/depth-3/generation-1'},
   availableSpans:[[47,351]]},
  {key:'Table',buttonId:11,instanceId:'sprite-37/depth-10/generation-1',
   sourceActionSha256:'15ba5ffa905f89dafc929bc0a204cc3521c3e705230819ae6b069f798e19b58d',
   sourcePlacementTagSha256:'922ee775717555afa5841426df801ddb7533c4408d413fc398780dd8a32693e1',
   label:{textId:6,runText:'table',textInstanceId:'sprite-37/depth-3/generation-1'},
   availableSpans:[[29,351]]},
  {key:'Output',buttonId:19,instanceId:'sprite-37/depth-16/generation-1',
   sourceActionSha256:'1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7',
   sourcePlacementTagSha256:'253d7f092895bc979d56c67dd6fce2df98b4d0261a53820cb591584ee2827740',
   label:{textId:18,runText:'outputs',textInstanceId:'sprite-37/depth-15/generation-1'},
   availableSpans:[[63,351]]},
  {key:'Function',buttonId:20,instanceId:'sprite-37/depth-18/generation-1',
   sourceActionSha256:'549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8',
   sourcePlacementTagSha256:'98229d1b25215c628625ccfd59ee6a6e8e5ba1068ac712e693e83c66ff59b22c',
   label:{textId:18,runText:'function',textInstanceId:'sprite-37/depth-15/generation-1'},
   availableSpans:[[74,351]]},
 ],
} as const;
export type P019TimelineGlossaryKey=typeof P019_TIMELINE.glossaryInstances[number]['key'];

export function p019TimelineState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P019_TIMELINE.mainFrameCount)
  throw new RangeError('P019_FRAME_OUT_OF_RANGE');
 const glossaryInstances=P019_TIMELINE.glossaryInstances.map(instance=>({...instance,
  available:instance.availableSpans.some(([first,last])=>frame>=first&&frame<=last)}));
 const glossary=Object.fromEntries(P019_TIMELINE.glossaryInstances.map(instance=>[
  instance.key,glossaryInstances.some(candidate=>candidate.key===instance.key&&candidate.available)]));
 return {frame,frameDomain:P019_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P019_TIMELINE.fps,glossaryInstances,glossary};
}
