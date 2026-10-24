/** Source-bound complete-label/full-hit gates; original Flash click delivery unobserved.
 * Reproduce with output/alg-l06-p022-timeline-v1/build.mjs --check. */
export const P022_TIMELINE={
  "animationId": "shared-alg001-l06-p022",
  "sourceSwfSha256": "a5868c68164c6401d2d79a8548f60f0d62401ca14f01f0494ef8ae6fd0e2d7c1",
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-67",
  "mainFrameCount": 422,
  "sourceAuditSha256": "9653e1a21712f98590f35bb9522424c25c391efbca790946ab9177d8fff7d08c",
  "glossaryInstances": [
    {
      "key": "Graph",
      "buttonId": 7,
      "instanceId": "sprite-67/depth-4/generation-1",
      "sourceActionSha256": "a166738a046a0f40c86c2e76c6735cb8e17807531abdc2b1fd133fc45cc07852",
      "sourcePlacementTagSha256": "fdd49cfb71e392fe4d36bbf0efa00b0b08e066b0a1f2177817104f48ddb01a45",
      "label": {
        "textId": 5,
        "runText": "graph",
        "segment": "graph",
        "textInstanceId": "sprite-67/depth-3/generation-1"
      },
      "availableSpans": [
        [
          8,
          422
        ]
      ]
    },
    {
      "key": "Representation",
      "buttonId": 8,
      "instanceId": "sprite-67/depth-6/generation-1",
      "sourceActionSha256": "821025a1aba8696fa6f0e2c21bad86f15396eb153e47903436a28387ee66bb3d",
      "sourcePlacementTagSha256": "3b25851cddf8f3edc1f8cfeab6d7cab873c62c98ea9d5662e2367ac9af59ca81",
      "label": {
        "textId": 5,
        "runText": "representation",
        "segment": "representation",
        "textInstanceId": "sprite-67/depth-3/generation-1"
      },
      "availableSpans": [
        [
          42,
          422
        ]
      ]
    },
    {
      "key": "Function",
      "buttonId": 9,
      "instanceId": "sprite-67/depth-8/generation-1",
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourcePlacementTagSha256": "f56db86ee6b6b35e38f54ba16560a5970345b92ae03b379bb2e6806218178088",
      "label": {
        "textId": 5,
        "runText": "function",
        "segment": "function",
        "textInstanceId": "sprite-67/depth-3/generation-1"
      },
      "availableSpans": [
        [
          17,
          422
        ]
      ]
    },
    {
      "key": "Ordered pair",
      "buttonId": 15,
      "instanceId": "sprite-67/depth-14/generation-1",
      "sourceActionSha256": "c360a026014197becb888ce1c0ca1105df70799e42613ec2bcb7667c86913c66",
      "sourcePlacementTagSha256": "7570c5fa0ce654509be9a4f21b1bb10dd3cb8d9bbf729a9f5433b2cbd71d5662",
      "label": {
        "textId": 14,
        "runText": "ordered pairs",
        "segment": "ordered pairs",
        "textInstanceId": "sprite-67/depth-13/generation-1"
      },
      "availableSpans": [
        [
          85,
          422
        ]
      ]
    },
    {
      "key": "Input",
      "buttonId": 16,
      "instanceId": "sprite-67/depth-16/generation-1",
      "sourceActionSha256": "2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5",
      "sourcePlacementTagSha256": "dc290f02062321e24e240ce04a4b0440cb0a281453981d134239442dc3de2888",
      "label": {
        "textId": 14,
        "runText": "inputs",
        "segment": "inputs",
        "textInstanceId": "sprite-67/depth-13/generation-1"
      },
      "availableSpans": [
        [
          91,
          422
        ]
      ]
    },
    {
      "key": "Output",
      "buttonId": 17,
      "instanceId": "sprite-67/depth-18/generation-1",
      "sourceActionSha256": "1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7",
      "sourcePlacementTagSha256": "8841ee370c485d9918871294e5239dc47daf8fbbf399338cb996dc9be8c5f7fd",
      "label": {
        "textId": 14,
        "runText": "outputs",
        "segment": "outputs",
        "textInstanceId": "sprite-67/depth-13/generation-1"
      },
      "availableSpans": [
        [
          99,
          422
        ]
      ]
    }
  ]
} as const;
export type P022TimelineGlossaryKey=typeof P022_TIMELINE.glossaryInstances[number]['key'];
export function p022TimelineState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P022_TIMELINE.mainFrameCount)
  throw new RangeError('P022_FRAME_OUT_OF_RANGE');
 const glossaryInstances=P022_TIMELINE.glossaryInstances.map(instance=>({...instance,
  available:instance.availableSpans.some(([first,last])=>frame>=first&&frame<=last)}));
 const glossary=Object.fromEntries(P022_TIMELINE.glossaryInstances.map(instance=>[
  instance.key,glossaryInstances.some(candidate=>candidate.key===instance.key&&candidate.available)]));
 return {frame,frameDomain:P022_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P022_TIMELINE.fps,glossaryInstances,glossary};
}
