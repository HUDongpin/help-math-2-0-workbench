/** Static source geometry supports candidate controls, not original-runtime acceptance. */
export const P017_TIMELINE={
  "animationId": "shared-alg001-l06-p017",
  "sourceSwfSha256": "7010ecfee54a80298e3bba09400a712cfed65dad983811d9a470bf017156ffb3",
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-42",
  "mainFrameCount": 721,
  "glossary": {
    "Equation": {
      "buttonId": 7,
      "firstAvailableFrame": 11,
      "firstFullHitFrame": 11,
      "sourceActionSha256": "acec2ddbdec541c53aa048565d1718c6ac9de8c80537fb950d635292318ef1ff",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    },
    "Sentence": {
      "buttonId": 8,
      "firstAvailableFrame": 54,
      "firstFullHitFrame": 54,
      "sourceActionSha256": "44b6bae99467a6644b8211d8653f308fba066faa54081ab79bd4987e14dc0922",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    },
    "Function": {
      "buttonId": 9,
      "firstAvailableFrame": 20,
      "firstFullHitFrame": 20,
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    },
    "Rule": {
      "buttonId": 16,
      "firstAvailableFrame": 68,
      "firstFullHitFrame": 68,
      "sourceActionSha256": "28bc1817d8f4443043d212b45fb6406de98c38bd0ec3bb888b953940bded24ef",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    },
    "Output variable": {
      "buttonId": 19,
      "firstAvailableFrame": 108,
      "firstFullHitFrame": 108,
      "sourceActionSha256": "c0af837ab29e87b917db2ca7322295643aae9617bcc5ad6ae5f638bed49f9f8d",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    },
    "Input variable": {
      "buttonId": 23,
      "firstAvailableFrame": 173,
      "firstFullHitFrame": 173,
      "sourceActionSha256": "21e104678862baa7b8b6d609bcfb79ad299d455b10e0e964d01397b39b7c954e",
      "hitEvidence": "full-source-hit-and-complete-source-blue-glyph-static-candidate"
    }
  }
} as const;
export function p017TimelineState(frame:number){
 if(!Number.isInteger(frame)||frame<1||frame>P017_TIMELINE.mainFrameCount)
  throw new RangeError('P017_FRAME_OUT_OF_RANGE');
 return {frame,frameDomain:P017_TIMELINE.frameDomain,
  elapsedSeconds:(frame-1)/P017_TIMELINE.fps,
  glossary:Object.fromEntries(Object.entries(P017_TIMELINE.glossary)
   .map(([key,value])=>[key,frame>=value.firstAvailableFrame]))};
}
