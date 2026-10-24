/** Maintained P021 source gates: complete blue segment and hit region.
 * Static source bounds, not observed original-runtime click acceptance. */
export const P021_TIMELINE={
  "animationId": "shared-alg001-l06-p021",
  "sourceSwfSha256": "4e87aacf4c5f749f559817dc2c0ec8b023fba75652217b9ce2543728e06eb5eb",
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-43",
  "mainFrameCount": 377,
  "sourceAuditSha256": "e171781cdd59278fec34388b7ba8de6ed4594d6d73afb9d9a524a172c1a99c02",
  "glossaryInstances": [
    {
      "key": "Set",
      "buttonId": 8,
      "instanceId": "sprite-43/depth-6/generation-1",
      "sourceActionSha256": "698d2f17bf25652e70db17aa33b2ed29dbf1de9f2d1b0339915652b1f03165c9",
      "sourcePlacementTagSha256": "b54143983cf311df79269c4c7e65843f7d2925f11997df5b790bbbbbdcab2b70",
      "label": {
        "textId": 6,
        "runText": "set",
        "segment": "set",
        "textInstanceId": "sprite-43/depth-5/generation-1"
      },
      "availableSpans": [
        [
          12,
          377
        ]
      ]
    },
    {
      "key": "Input",
      "buttonId": 9,
      "instanceId": "sprite-43/depth-8/generation-1",
      "sourceActionSha256": "2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5",
      "sourcePlacementTagSha256": "c8a8f8e1778e41a43505689fee0ec247d90a728249a181dd4b61178eb396c6a8",
      "label": {
        "textId": 6,
        "runText": "inputs",
        "segment": "inputs",
        "textInstanceId": "sprite-43/depth-5/generation-1"
      },
      "availableSpans": [
        [
          69,
          377
        ]
      ]
    },
    {
      "key": "Ordered pair",
      "buttonId": 10,
      "instanceId": "sprite-43/depth-10/generation-1",
      "sourceActionSha256": "c360a026014197becb888ce1c0ca1105df70799e42613ec2bcb7667c86913c66",
      "sourcePlacementTagSha256": "bf076511dc5a4abfdf6b0b7d98817fe216e016ddb910261c84d5c4d5a63f675b",
      "label": {
        "textId": 6,
        "runText": "ordered pairs",
        "segment": "ordered pairs",
        "textInstanceId": "sprite-43/depth-5/generation-1"
      },
      "availableSpans": [
        [
          62,
          377
        ]
      ]
    },
    {
      "key": "Function",
      "buttonId": 11,
      "instanceId": "sprite-43/depth-12/generation-1",
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourcePlacementTagSha256": "63b612211e0d562cc3528eda441f5266aa0e30b4c1c61580d78875e515c74b57",
      "label": {
        "textId": 6,
        "runText": "function values",
        "segment": "function",
        "textInstanceId": "sprite-43/depth-5/generation-1"
      },
      "availableSpans": [
        [
          20,
          377
        ]
      ]
    },
    {
      "key": "Value",
      "buttonId": 12,
      "instanceId": "sprite-43/depth-14/generation-1",
      "sourceActionSha256": "6983162097c3b32dde6ff032116df2ce6f32a9caf1f901f2527ada4d6481905d",
      "sourcePlacementTagSha256": "b1463c9a890cdaea436c6c0efa85e66b2d78255cd8bec2eff886f72948573017",
      "label": {
        "textId": 6,
        "runText": "function values",
        "segment": "values",
        "textInstanceId": "sprite-43/depth-5/generation-1"
      },
      "availableSpans": [
        [
          25,
          377
        ]
      ]
    },
    {
      "key": "Output",
      "buttonId": 22,
      "instanceId": "sprite-43/depth-20/generation-1",
      "sourceActionSha256": "1262eac21bf8a718d551c8d7b046220855f8f878214783cfdfb7d0c37f5ff5c7",
      "sourcePlacementTagSha256": "d7a5c1073063375422ba282f7d4c893942f69a2d66afce608635a3f1bb410803",
      "label": {
        "textId": 21,
        "runText": "outputs",
        "segment": "outputs",
        "textInstanceId": "sprite-43/depth-19/generation-1"
      },
      "availableSpans": [
        [
          77,
          377
        ]
      ]
    }
  ]
} as const;
export type P021TimelineGlossaryKey=typeof P021_TIMELINE.glossaryInstances[number]['key'];
export function p021TimelineState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P021_TIMELINE.mainFrameCount)
  throw new RangeError('P021_FRAME_OUT_OF_RANGE');
 const glossaryInstances=P021_TIMELINE.glossaryInstances.map(instance=>({...instance,
  available:instance.availableSpans.some(([first,last])=>frame>=first&&frame<=last)}));
 const glossary=Object.fromEntries(P021_TIMELINE.glossaryInstances.map(instance=>[
  instance.key,glossaryInstances.some(candidate=>candidate.key===instance.key&&candidate.available)]));
 return {frame,frameDomain:P021_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P021_TIMELINE.fps,glossaryInstances,glossary};
}
