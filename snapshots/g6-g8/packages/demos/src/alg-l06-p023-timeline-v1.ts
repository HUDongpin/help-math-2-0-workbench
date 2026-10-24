/** Source-bound complete-label/full-hit gates; Flash click delivery unobserved.
 * Reproduce with scripts/prepare-alg-l06-p023-native-text-v1.mjs --check. */
export const P023_TIMELINE={
  "animationId": "shared-alg001-l06-p023",
  "sourceSwfSha256": "40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a",
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-38",
  "mainFrameCount": 410,
  "sourceAuditSha256": "720ec2c812dc683546d41e0ddd8d49b69285246de9fb5a51fbb54cbb51f72acd",
  "glossaryInstances": [
    {
      "key": "Domain",
      "buttonId": 8,
      "instanceId": "sprite-38/depth-6/generation-1",
      "sourceActionSha256": "2e9bed10a2d4355dca7b36d0501e52409d06033c6e74a9fd5702b7c9a787e957",
      "sourcePlacementTagSha256": "2f0ff0eb5454925d25c9a2e87c8faf90a517fdb98b7df6db7a1402487870cc34",
      "label": {
        "textId": 6,
        "runText": "domain",
        "segment": "domain",
        "textInstanceId": "sprite-38/depth-5/generation-1"
      },
      "availableSpans": [
        [
          21,
          410
        ]
      ]
    },
    {
      "key": "Function",
      "buttonId": 11,
      "instanceId": "sprite-38/depth-12/generation-1",
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourcePlacementTagSha256": "7b4c18667a69c4958d4feb671cce20549e41d874f47f90b2c7e04ed215a75410",
      "label": {
        "textId": 6,
        "runText": "function",
        "segment": "function",
        "textInstanceId": "sprite-38/depth-5/generation-1"
      },
      "availableSpans": [
        [
          30,
          410
        ]
      ]
    },
    {
      "key": "Set",
      "buttonId": 10,
      "instanceId": "sprite-38/depth-10/generation-1",
      "sourceActionSha256": "698d2f17bf25652e70db17aa33b2ed29dbf1de9f2d1b0339915652b1f03165c9",
      "sourcePlacementTagSha256": "5a08df5297100f985febdf80503cdae085a1f06b9069cebb77e226c24de5d376",
      "label": {
        "textId": 6,
        "runText": "set",
        "segment": "set",
        "textInstanceId": "sprite-38/depth-5/generation-1"
      },
      "availableSpans": [
        [
          47,
          410
        ]
      ]
    },
    {
      "key": "Input",
      "buttonId": 9,
      "instanceId": "sprite-38/depth-8/generation-1",
      "sourceActionSha256": "2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5",
      "sourcePlacementTagSha256": "c3b46cc42da672883a1ba2615e1ccdf6da6a4e70a427b1d35d2c63a749dfc078",
      "label": {
        "textId": 6,
        "runText": "inputs",
        "segment": "inputs",
        "textInstanceId": "sprite-38/depth-5/generation-1"
      },
      "availableSpans": [
        [
          68,
          410
        ]
      ]
    }
  ]
} as const;
export type P023TimelineGlossaryKey=typeof P023_TIMELINE.glossaryInstances[number]['key'];
export function p023TimelineState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P023_TIMELINE.mainFrameCount)
  throw new RangeError('P023_FRAME_OUT_OF_RANGE');
 const glossaryInstances=P023_TIMELINE.glossaryInstances.map(instance=>({...instance,
  available:instance.availableSpans.some(([first,last])=>frame>=first&&frame<=last)}));
 const glossary=Object.fromEntries(P023_TIMELINE.glossaryInstances.map(instance=>[
  instance.key,glossaryInstances.some(candidate=>candidate.key===instance.key&&candidate.available)]));
 return {frame,frameDomain:P023_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P023_TIMELINE.fps,glossaryInstances,glossary};
}
