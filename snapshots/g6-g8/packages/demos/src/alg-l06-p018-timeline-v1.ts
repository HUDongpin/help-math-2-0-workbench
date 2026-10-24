/** Maintained source-instance gates. Static geometry does not prove original clicks. */
export const P018_TIMELINE={
  "animationId": "shared-alg001-l06-p018",
  "sourceSwfSha256": "400f0cdcb574864c7e9e2208f986e91f26e10f796623b6ea41d80a59310e167a",
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-32",
  "mainFrameCount": 648,
  "sourceAuditSha256": "6a8e289b3f4ce2c635cff61ae8b950596272d6ff835c3fae0ec6a8f1dfd66e79",
  "glossaryInstances": [
    {
      "key": "Evaluate",
      "buttonId": 8,
      "instanceId": "sprite-32/depth-4/generation-1",
      "sourceActionSha256": "a7e02e39a8ff444b4675d4cfb851b73557b5c53083cbbbe506d4ba081d025b64",
      "sourcePlacementTagSha256": "5260da2fd6709c827e619058be80cab3d707397c29c8eb795fed0f190262420f",
      "label": {
        "textId": 6,
        "runText": "evaluate",
        "textInstanceId": "sprite-32/depth-3/generation-1"
      },
      "availableSpans": [
        [
          11,
          648
        ]
      ]
    },
    {
      "key": "Evaluate",
      "buttonId": 8,
      "instanceId": "sprite-32/depth-22/generation-1",
      "sourceActionSha256": "a7e02e39a8ff444b4675d4cfb851b73557b5c53083cbbbe506d4ba081d025b64",
      "sourcePlacementTagSha256": "63a4048b4b0845c2e8106c15c0f3786629177103484e70cbe68405861c5189a3",
      "label": {
        "textId": 27,
        "runText": "Evaluate",
        "textInstanceId": "sprite-32/depth-21/generation-1"
      },
      "availableSpans": [
        [
          324,
          648
        ]
      ]
    },
    {
      "key": "Input variable",
      "buttonId": 9,
      "instanceId": "sprite-32/depth-6/generation-1",
      "sourceActionSha256": "21e104678862baa7b8b6d609bcfb79ad299d455b10e0e964d01397b39b7c954e",
      "sourcePlacementTagSha256": "4c6c1a677c0303cbcc84612a27be0b667ff549d41988179d2dfd4aa1046c38cf",
      "label": {
        "textId": 6,
        "runText": "input variable",
        "textInstanceId": "sprite-32/depth-3/generation-1"
      },
      "availableSpans": [
        [
          65,
          648
        ]
      ]
    },
    {
      "key": "Substitute",
      "buttonId": 10,
      "instanceId": "sprite-32/depth-8/generation-1",
      "sourceActionSha256": "ee6527c288c373b60e404ed24111f80849e669b3c16ab35b18aafae4f9573b45",
      "sourcePlacementTagSha256": "4c58ebb2d8517515b3fd8c7d7c1045761f2157e58f76b6a43f0bcacd130e12fc",
      "label": {
        "textId": 6,
        "runText": "substitute",
        "textInstanceId": "sprite-32/depth-3/generation-1"
      },
      "availableSpans": [
        [
          43,
          648
        ]
      ]
    },
    {
      "key": "Function",
      "buttonId": 11,
      "instanceId": "sprite-32/depth-10/generation-1",
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourcePlacementTagSha256": "2e9f59b8727bb547d48e053a7bc39588e2c9aa5d1ca46d1999d1943612cbd943",
      "label": {
        "textId": 6,
        "runText": "function",
        "textInstanceId": "sprite-32/depth-3/generation-1"
      },
      "availableSpans": [
        [
          18,
          648
        ]
      ]
    },
    {
      "key": "Function",
      "buttonId": 11,
      "instanceId": "sprite-32/depth-24/generation-1",
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourcePlacementTagSha256": "721fb9c3300a25b403fdf151694137809ecd8b0538ccf4a0f8516eb51308848d",
      "label": {
        "textId": 27,
        "runText": "function",
        "textInstanceId": "sprite-32/depth-21/generation-1"
      },
      "availableSpans": [
        [
          333,
          648
        ]
      ]
    },
    {
      "key": "Result",
      "buttonId": 20,
      "instanceId": "sprite-32/depth-16/generation-1",
      "sourceActionSha256": "1ca8d68b17b783241f00347f0c43774c786ba2c52b0b6a914526260563441360",
      "sourcePlacementTagSha256": "4a79fad4b65a306a203843b1f3d27f4970f94a3c1be57a1715eaa7af3aeb02e2",
      "label": {
        "textId": 19,
        "runText": "result",
        "textInstanceId": "sprite-32/depth-15/generation-1"
      },
      "availableSpans": [
        [
          102,
          648
        ]
      ]
    }
  ]
} as const;
export function p018TimelineState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P018_TIMELINE.mainFrameCount)
  throw new RangeError('P018_FRAME_OUT_OF_RANGE');
 const glossaryInstances=P018_TIMELINE.glossaryInstances.map(instance=>({...instance,
  available:instance.availableSpans.some(([first,last])=>frame>=first&&frame<=last)}));
 return {frame,frameDomain:P018_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P018_TIMELINE.fps,glossaryInstances,
  glossary:Object.fromEntries(['Evaluate','Input variable','Substitute','Function','Result']
   .map(key=>[key,glossaryInstances.some(instance=>instance.key===key&&instance.available)]))};
}
