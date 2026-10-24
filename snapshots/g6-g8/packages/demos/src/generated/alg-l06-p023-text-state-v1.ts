/* Generated source state by scripts/prepare-alg-l06-p023-native-text-v1.mjs; do not edit. */
export type P023GlossaryKey='Domain'|'Function'|'Set'|'Input';
type Span=[number,number];
type TextInstance={instanceId:string;sourceTextId:number;text:string;depth:number;
 firstPlacementFrame:number;lastActiveFrame:number;completeInkSpans:Span[];
 runs:Array<{text:string;colorRgba:number[];completeInkSpans:Span[]}>;sourcePlacementTagSha256:string};
type GlossaryControl={key:P023GlossaryKey;sourceButtonId:number;sourceButtonInstanceId:string;
 sourceHitShapeId:number;sourceActionSha256:string;sourceButtonTagSha256:string;
 sourcePlacementTagSha256:string;depth:number;firstPlacementFrame:number;
 firstPartialHitFrame:number|null;firstFullHitFrame:number|null;sourceLabelTextId:number;
 sourceLabelTextInstanceId:string;sourceLabelRunText:string;sourceLabelSegment:string;
 firstCandidateFrame:number;availableSpans:Span[];originalClickObserved:boolean};
type Source={schemaVersion:number;animationId:string;sourceSwfSha256:string;
 source:{path:string;bytes:number;sha256:string};inputs:Array<{path:string;bytes:number;sha256:string}>;
 stage:{width:number;height:number};fps:number;rootEntryFrame:number;frameDomain:string;frameCount:number;
 inventory:{textDefinitions:number;textRuns:number;spritePlacementInstances:number;textInstances:number;glossaryButtonInstances:number};
 textDefinitions:Array<{sourceTextId:number;text:string;definitionTagSha256:string}>;
 textInstances:TextInstance[];reading:{definitionInstanceId:string;tableHeaderInstanceIds:string[];
 tableRows:Array<{inputInstanceId:string;outputInstanceId:string}>;tableFirstCompleteFrame:number;
 setTokenInstanceIds:string[];setAllInkSpans:Span[];setOrderedSpans:Span[];setFirstOrderedFrame:number;
 canvasOnlyRoles:string};glossaryControls:GlossaryControl[];
 policy:{canvasGlyphs:string;nativeRole:string;language:string;definition:string;table:string;
 setNotation:string;glossary:string;originalRuntimeAccepted:boolean;translatedSpanishSourceAbsent:boolean}};
function inSpans(spans:Span[],frame:number){return spans.some(([first,last])=>first<=frame&&frame<=last);}
export function p023TextState(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>P023_TEXT_STATE_SOURCE.frameCount)
  throw new RangeError('P023_TEXT_FRAME_OUT_OF_RANGE');
 const source=P023_TEXT_STATE_SOURCE;
 const visibleText=source.textInstances.map(item=>({...item,
  fullyVisible:inSpans(item.completeInkSpans,frame)})).filter(item=>item.fullyVisible);
 const byId=(id:string)=>visibleText.find(item=>item.instanceId===id);
 const definition=byId(source.reading.definitionInstanceId);
 const definitionSource=source.textInstances.find(item=>item.instanceId===source.reading.definitionInstanceId)!;
 const definitionRuns=definitionSource.runs.map((run,index)=>({...run,index,
  available:inSpans(run.completeInkSpans,frame)}));
 const tableHeaders=source.reading.tableHeaderInstanceIds.map(byId);
 const tableRows=source.reading.tableRows.map(row=>({input:byId(row.inputInstanceId),
  output:byId(row.outputInstanceId)}));
 const tableAvailable=frame>=source.reading.tableFirstCompleteFrame&&
  tableHeaders.every(Boolean)&&tableRows.every(row=>row.input&&row.output);
 const setTokens=source.reading.setTokenInstanceIds.map(byId);
 const setNotation={tokens:setTokens,allInkVisible:inSpans(source.reading.setAllInkSpans,frame),
  available:inSpans(source.reading.setOrderedSpans,frame),
  firstOrderedFrame:source.reading.setFirstOrderedFrame};
 return {animationId:source.animationId,frameDomain:source.frameDomain,frame,visibleText,
  definition,definitionRuns,definitionSource,table:{available:tableAvailable,headers:tableHeaders,rows:tableRows},setNotation,
  glossaryControls:source.glossaryControls.map(control=>({...control,
   available:inSpans(control.availableSpans,frame)}))};
}

export const P023_TEXT_STATE_SOURCE:Source={
  "schemaVersion": 1,
  "animationId": "shared-alg001-l06-p023",
  "sourceSwfSha256": "40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a",
  "source": {
    "path": "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L6/VB/L6VB16.swf",
    "bytes": 137816,
    "sha256": "40388017c66f714bdbda480558669aee11a0d3426ed55c74f0976eb2ca85097a"
  },
  "inputs": [
    {
      "path": "output/alg-l06-p023-source-audit-v1/time-resolved-audit-v1.json",
      "bytes": 239973,
      "sha256": "720ec2c812dc683546d41e0ddd8d49b69285246de9fb5a51fbb54cbb51f72acd"
    },
    {
      "path": "output/alg-l06-p023-source-audit-v1/frame-states-v1.json",
      "bytes": 8389213,
      "sha256": "5fdc10af323a894b27fb91fdf00b6207961fde4872dbd74009c4c270a49671fe"
    }
  ],
  "stage": {
    "width": 800,
    "height": 600
  },
  "fps": 12,
  "rootEntryFrame": 6,
  "frameDomain": "sprite-38",
  "frameCount": 410,
  "inventory": {
    "textDefinitions": 21,
    "textRuns": 29,
    "spritePlacementInstances": 69,
    "textInstances": 56,
    "glossaryButtonInstances": 4
  },
  "textDefinitions": [
    {
      "sourceTextId": 6,
      "text": "The domain of a function is the set of all the function’s inputs.",
      "definitionTagSha256": "a082fe492518d8f7862955380b2123e9c07de5ea13ee99497f3a21ab5a76f441"
    },
    {
      "sourceTextId": 12,
      "text": "domain",
      "definitionTagSha256": "474c288c306070fa08e7e84aebf514753a44ca988b544cd66b05506a31d7736b"
    },
    {
      "sourceTextId": 13,
      "text": "function",
      "definitionTagSha256": "e089eb8c957f6a684c06a81e57af83da25a307fbc0f49644986f9062db0f52c2"
    },
    {
      "sourceTextId": 14,
      "text": "set",
      "definitionTagSha256": "335a813276a9e9d1f2d0750c200e95952e6ec0073de936f919a1c255ecec71f6"
    },
    {
      "sourceTextId": 15,
      "text": "inputs",
      "definitionTagSha256": "3d07c4a0c82117b9a3ee2f22e2421bb6ff13220fdffd1556ad27605da68b7da6"
    },
    {
      "sourceTextId": 16,
      "text": "{   }",
      "definitionTagSha256": "1e3b101613a3932c6466694d59540c25f6362dfa701557dbae860b0d48bdb0fa"
    },
    {
      "sourceTextId": 18,
      "text": "Input",
      "definitionTagSha256": "8c3c45c96e2c2cda0cbfcfd48314848ab93f15cf45fe743627fdc733c17e28f9"
    },
    {
      "sourceTextId": 19,
      "text": "Output",
      "definitionTagSha256": "4a10da82998e5c0c8ba715b31a343a26234fc92dff06c57e907be31c775ff00c"
    },
    {
      "sourceTextId": 20,
      "text": "1",
      "definitionTagSha256": "cabfecea57f458ed776de517e0ad69d90636eb80c2f55871958c87059e8423ad"
    },
    {
      "sourceTextId": 21,
      "text": "10",
      "definitionTagSha256": "1c97b6f903889732cb9ea73d12aeb1522da49a18324fa3d56a8b02ef6a2f8ab9"
    },
    {
      "sourceTextId": 22,
      "text": "100",
      "definitionTagSha256": "9d9b4c645c63384bfb7c97f6c82af4da0d30fb51d866a312e822d0da1bea5c67"
    },
    {
      "sourceTextId": 23,
      "text": "2",
      "definitionTagSha256": "661d231651faf447e03e5993c6f6101908ebf52055c277e0600cfff1e622e0bf"
    },
    {
      "sourceTextId": 24,
      "text": "3",
      "definitionTagSha256": "bb6281b1387eabe7c126ac362326d8748d2d58d268e547614198a5beb4210eee"
    },
    {
      "sourceTextId": 26,
      "text": "1",
      "definitionTagSha256": "a356993c12a23a304f85b053ffc8f78c8a7bea55086ce121c6d9a89a009f5c30"
    },
    {
      "sourceTextId": 27,
      "text": "10",
      "definitionTagSha256": "fe671f4a14bcbafd29c5aeee64f638818f272dd281f8fafb75c428372aeda905"
    },
    {
      "sourceTextId": 28,
      "text": "100",
      "definitionTagSha256": "f839a22bfcb3593e41412c4bdcadb8a7f194779a7b793d5e397e086a31626ba2"
    },
    {
      "sourceTextId": 30,
      "text": "2",
      "definitionTagSha256": "65f6b339d1fb9d566f26a6539b01b9e66797bcd25a67c08a468d2b6c81a1390e"
    },
    {
      "sourceTextId": 31,
      "text": "3",
      "definitionTagSha256": "bae36b39c035b56e39017c1766d0d5e49a25f520b2ad6f347f9c7016bb5e6a36"
    },
    {
      "sourceTextId": 35,
      "text": "}",
      "definitionTagSha256": "d58d6f794bf048313f199b9efb48db4ead5757661b4495418a58829c4e23071c"
    },
    {
      "sourceTextId": 36,
      "text": "{",
      "definitionTagSha256": "62e582835d51f09e16c289be9e43ab605933a63a764b0b6ce7f4bbf95bd2d513"
    },
    {
      "sourceTextId": 37,
      "text": ",",
      "definitionTagSha256": "dc76d5e48899fef6f99cee65596e6758f33b74d828535d0ad261de702a44c43c"
    }
  ],
  "textInstances": [
    {
      "instanceId": "sprite-38/depth-5/generation-1",
      "sourceTextId": 6,
      "text": "The domain of a function is the set of all the function’s inputs.",
      "depth": 5,
      "firstPlacementFrame": 11,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          68,
          410
        ]
      ],
      "runs": [
        {
          "text": "The ",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              14,
              410
            ]
          ]
        },
        {
          "text": "domain",
          "colorRgba": [
            0,
            0,
            204,
            255
          ],
          "completeInkSpans": [
            [
              20,
              410
            ]
          ]
        },
        {
          "text": " of a ",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              24,
              410
            ]
          ]
        },
        {
          "text": "function",
          "colorRgba": [
            0,
            0,
            204,
            255
          ],
          "completeInkSpans": [
            [
              30,
              410
            ]
          ]
        },
        {
          "text": " is the ",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              40,
              410
            ]
          ]
        },
        {
          "text": "set",
          "colorRgba": [
            0,
            0,
            204,
            255
          ],
          "completeInkSpans": [
            [
              42,
              410
            ]
          ]
        },
        {
          "text": " of all the function’s ",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              63,
              410
            ]
          ]
        },
        {
          "text": "inputs",
          "colorRgba": [
            0,
            0,
            204,
            255
          ],
          "completeInkSpans": [
            [
              68,
              410
            ]
          ]
        },
        {
          "text": ".",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              68,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "15e0d8ef454c9cfc4f23c7d5d41a00e4f77f0285f1a023da74e33a63205cce89"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-1",
      "sourceTextId": 12,
      "text": "domain",
      "depth": 15,
      "firstPlacementFrame": 20,
      "lastActiveFrame": 20,
      "completeInkSpans": [
        [
          20,
          20
        ]
      ],
      "runs": [
        {
          "text": "domain",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              20,
              20
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9e0465c91c7a3577d82a45fcda22ff03ab4b8ba7cd27582600d1c80c45226ad5"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-2",
      "sourceTextId": 12,
      "text": "domain",
      "depth": 15,
      "firstPlacementFrame": 22,
      "lastActiveFrame": 22,
      "completeInkSpans": [
        [
          22,
          22
        ]
      ],
      "runs": [
        {
          "text": "domain",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              22,
              22
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9e0465c91c7a3577d82a45fcda22ff03ab4b8ba7cd27582600d1c80c45226ad5"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-3",
      "sourceTextId": 12,
      "text": "domain",
      "depth": 15,
      "firstPlacementFrame": 24,
      "lastActiveFrame": 24,
      "completeInkSpans": [
        [
          24,
          24
        ]
      ],
      "runs": [
        {
          "text": "domain",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              24,
              24
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9e0465c91c7a3577d82a45fcda22ff03ab4b8ba7cd27582600d1c80c45226ad5"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-4",
      "sourceTextId": 13,
      "text": "function",
      "depth": 15,
      "firstPlacementFrame": 30,
      "lastActiveFrame": 30,
      "completeInkSpans": [
        [
          30,
          30
        ]
      ],
      "runs": [
        {
          "text": "function",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              30,
              30
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "413049b307720ca2e13edfbc89de048b7718a1533eba0c9e0cd980987bbc4c81"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-5",
      "sourceTextId": 13,
      "text": "function",
      "depth": 15,
      "firstPlacementFrame": 32,
      "lastActiveFrame": 32,
      "completeInkSpans": [
        [
          32,
          32
        ]
      ],
      "runs": [
        {
          "text": "function",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              32,
              32
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "413049b307720ca2e13edfbc89de048b7718a1533eba0c9e0cd980987bbc4c81"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-6",
      "sourceTextId": 13,
      "text": "function",
      "depth": 15,
      "firstPlacementFrame": 34,
      "lastActiveFrame": 34,
      "completeInkSpans": [
        [
          34,
          34
        ]
      ],
      "runs": [
        {
          "text": "function",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              34,
              34
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "413049b307720ca2e13edfbc89de048b7718a1533eba0c9e0cd980987bbc4c81"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-7",
      "sourceTextId": 14,
      "text": "set",
      "depth": 15,
      "firstPlacementFrame": 42,
      "lastActiveFrame": 42,
      "completeInkSpans": [
        [
          42,
          42
        ]
      ],
      "runs": [
        {
          "text": "set",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              42,
              42
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9ba484bd0411377d275aa76e7725645afddb8937390efa371fa3eb5b5e94697e"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-8",
      "sourceTextId": 14,
      "text": "set",
      "depth": 15,
      "firstPlacementFrame": 44,
      "lastActiveFrame": 44,
      "completeInkSpans": [
        [
          44,
          44
        ]
      ],
      "runs": [
        {
          "text": "set",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              44,
              44
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9ba484bd0411377d275aa76e7725645afddb8937390efa371fa3eb5b5e94697e"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-9",
      "sourceTextId": 14,
      "text": "set",
      "depth": 15,
      "firstPlacementFrame": 46,
      "lastActiveFrame": 46,
      "completeInkSpans": [
        [
          46,
          46
        ]
      ],
      "runs": [
        {
          "text": "set",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              46,
              46
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9ba484bd0411377d275aa76e7725645afddb8937390efa371fa3eb5b5e94697e"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-10",
      "sourceTextId": 15,
      "text": "inputs",
      "depth": 15,
      "firstPlacementFrame": 67,
      "lastActiveFrame": 67,
      "completeInkSpans": [
        [
          67,
          67
        ]
      ],
      "runs": [
        {
          "text": "inputs",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              67,
              67
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9fdf1339e2151dcec4b7c4820d6e6e361f40949e15091e59b0368c954832f926"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-11",
      "sourceTextId": 15,
      "text": "inputs",
      "depth": 15,
      "firstPlacementFrame": 69,
      "lastActiveFrame": 69,
      "completeInkSpans": [
        [
          69,
          69
        ]
      ],
      "runs": [
        {
          "text": "inputs",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              69,
              69
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9fdf1339e2151dcec4b7c4820d6e6e361f40949e15091e59b0368c954832f926"
    },
    {
      "instanceId": "sprite-38/depth-15/generation-12",
      "sourceTextId": 15,
      "text": "inputs",
      "depth": 15,
      "firstPlacementFrame": 71,
      "lastActiveFrame": 71,
      "completeInkSpans": [
        [
          71,
          71
        ]
      ],
      "runs": [
        {
          "text": "inputs",
          "colorRgba": [
            255,
            0,
            255,
            255
          ],
          "completeInkSpans": [
            [
              71,
              71
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9fdf1339e2151dcec4b7c4820d6e6e361f40949e15091e59b0368c954832f926"
    },
    {
      "instanceId": "sprite-38/depth-26/generation-1",
      "sourceTextId": 16,
      "text": "{   }",
      "depth": 26,
      "firstPlacementFrame": 127,
      "lastActiveFrame": 376,
      "completeInkSpans": [
        [
          132,
          376
        ]
      ],
      "runs": [
        {
          "text": "{   }",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              132,
              376
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "a78fe99a874d5885a83ba0d154c0d93e9c6991ea4aa46a2368b3c9f451bd94a6"
    },
    {
      "instanceId": "sprite-38/depth-18/generation-1",
      "sourceTextId": 18,
      "text": "Input",
      "depth": 18,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "Input",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "b28832080ff546ecab36b3d5fc7353b6db342649fbefbd22d0ab4b0b2ffb03dc"
    },
    {
      "instanceId": "sprite-38/depth-19/generation-1",
      "sourceTextId": 19,
      "text": "Output",
      "depth": 19,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "Output",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "a112033af1b9811f9cd10b96c118125a5b7c5dcd9daa40da4172bfea735b4d8e"
    },
    {
      "instanceId": "sprite-38/depth-20/generation-1",
      "sourceTextId": 20,
      "text": "1",
      "depth": 20,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "8d944df48ffd220974c506bd624ba48e5008386ae0091a9df64b789a705e1dd6"
    },
    {
      "instanceId": "sprite-38/depth-21/generation-1",
      "sourceTextId": 21,
      "text": "10",
      "depth": 21,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "453867cc3acc1d1e5857ce8fdf4ed43707ab5c4fbbbe32c98301a9d4e1267473"
    },
    {
      "instanceId": "sprite-38/depth-22/generation-1",
      "sourceTextId": 22,
      "text": "100",
      "depth": 22,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "0c08abb235c906e3f8fb42b8e4533e81f5944a263338b6dcb7024e22cd8a2033"
    },
    {
      "instanceId": "sprite-38/depth-23/generation-1",
      "sourceTextId": 20,
      "text": "1",
      "depth": 23,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "726f57ca4b50ab1046f02a518c8c038a71af53c0b59f94d077e577378811b66e"
    },
    {
      "instanceId": "sprite-38/depth-24/generation-1",
      "sourceTextId": 23,
      "text": "2",
      "depth": 24,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "2",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "37fdbe8563fed92c682695101abad461818e6497d95bd6fe7996642ca6c3015a"
    },
    {
      "instanceId": "sprite-38/depth-25/generation-1",
      "sourceTextId": 24,
      "text": "3",
      "depth": 25,
      "firstPlacementFrame": 169,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          173,
          410
        ]
      ],
      "runs": [
        {
          "text": "3",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              173,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "5112ab94637f38ca625b3f99edd5f70d4ff88cf682a1647d7b31f3901ca370a7"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-1",
      "sourceTextId": 18,
      "text": "Input",
      "depth": 28,
      "firstPlacementFrame": 190,
      "lastActiveFrame": 202,
      "completeInkSpans": [
        [
          190,
          202
        ]
      ],
      "runs": [
        {
          "text": "Input",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              190,
              202
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "d8a7e39d4312cef3f24dd3ae2a942406e3e5a8464a50010e9e7baad71141ab98"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-1",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 191,
      "lastActiveFrame": 191,
      "completeInkSpans": [
        [
          191,
          191
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              191,
              191
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "28df68b19804f5eeff782ce903de2cc8db28d8c7ebb6c87c97afcfa8e9d19283"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-1",
      "sourceTextId": 27,
      "text": "10",
      "depth": 30,
      "firstPlacementFrame": 191,
      "lastActiveFrame": 191,
      "completeInkSpans": [
        [
          191,
          191
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              191,
              191
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "56522951a98be659b78be4a5c75012191c4099606738886763a174434e0ca347"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-1",
      "sourceTextId": 28,
      "text": "100",
      "depth": 31,
      "firstPlacementFrame": 191,
      "lastActiveFrame": 191,
      "completeInkSpans": [
        [
          191,
          191
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              191,
              191
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "561e4c443d04c8e6925edcc29b4d4f3f06bf7b8ba16b88652d7365546974ffac"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-2",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 193,
      "lastActiveFrame": 193,
      "completeInkSpans": [
        [
          193,
          193
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              193,
              193
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "28df68b19804f5eeff782ce903de2cc8db28d8c7ebb6c87c97afcfa8e9d19283"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-2",
      "sourceTextId": 27,
      "text": "10",
      "depth": 30,
      "firstPlacementFrame": 193,
      "lastActiveFrame": 193,
      "completeInkSpans": [
        [
          193,
          193
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              193,
              193
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "56522951a98be659b78be4a5c75012191c4099606738886763a174434e0ca347"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-2",
      "sourceTextId": 28,
      "text": "100",
      "depth": 31,
      "firstPlacementFrame": 193,
      "lastActiveFrame": 193,
      "completeInkSpans": [
        [
          193,
          193
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              193,
              193
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "561e4c443d04c8e6925edcc29b4d4f3f06bf7b8ba16b88652d7365546974ffac"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-3",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 195,
      "lastActiveFrame": 195,
      "completeInkSpans": [
        [
          195,
          195
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              195,
              195
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "28df68b19804f5eeff782ce903de2cc8db28d8c7ebb6c87c97afcfa8e9d19283"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-3",
      "sourceTextId": 27,
      "text": "10",
      "depth": 30,
      "firstPlacementFrame": 195,
      "lastActiveFrame": 195,
      "completeInkSpans": [
        [
          195,
          195
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              195,
              195
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "56522951a98be659b78be4a5c75012191c4099606738886763a174434e0ca347"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-3",
      "sourceTextId": 28,
      "text": "100",
      "depth": 31,
      "firstPlacementFrame": 195,
      "lastActiveFrame": 195,
      "completeInkSpans": [
        [
          195,
          195
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              195,
              195
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "561e4c443d04c8e6925edcc29b4d4f3f06bf7b8ba16b88652d7365546974ffac"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-2",
      "sourceTextId": 19,
      "text": "Output",
      "depth": 28,
      "firstPlacementFrame": 205,
      "lastActiveFrame": 229,
      "completeInkSpans": [
        [
          205,
          229
        ]
      ],
      "runs": [
        {
          "text": "Output",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              205,
              229
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "48c959674410f50fe40db3c6036b13142511e03468dd9cebe67191df81072132"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-4",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 205,
      "lastActiveFrame": 205,
      "completeInkSpans": [
        [
          205,
          205
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              205,
              205
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "6a97ccc57229ab20904e3e4cbd7276008e3d73c2b9e2a1f702ab65da76fdd4a9"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-4",
      "sourceTextId": 30,
      "text": "2",
      "depth": 30,
      "firstPlacementFrame": 205,
      "lastActiveFrame": 205,
      "completeInkSpans": [
        [
          205,
          205
        ]
      ],
      "runs": [
        {
          "text": "2",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              205,
              205
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "397333f0d245bd3a5f1d83dd1df9754ed4b4af4e17773b5977cfa7ce5a9ec685"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-4",
      "sourceTextId": 31,
      "text": "3",
      "depth": 31,
      "firstPlacementFrame": 205,
      "lastActiveFrame": 205,
      "completeInkSpans": [
        [
          205,
          205
        ]
      ],
      "runs": [
        {
          "text": "3",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              205,
              205
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "210dcaa7c58bcc7da711701a782f4d6fa15e730285bd51e1f2353f58fb411e60"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-5",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 207,
      "lastActiveFrame": 207,
      "completeInkSpans": [
        [
          207,
          207
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              207,
              207
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "6a97ccc57229ab20904e3e4cbd7276008e3d73c2b9e2a1f702ab65da76fdd4a9"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-5",
      "sourceTextId": 30,
      "text": "2",
      "depth": 30,
      "firstPlacementFrame": 207,
      "lastActiveFrame": 207,
      "completeInkSpans": [
        [
          207,
          207
        ]
      ],
      "runs": [
        {
          "text": "2",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              207,
              207
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "397333f0d245bd3a5f1d83dd1df9754ed4b4af4e17773b5977cfa7ce5a9ec685"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-5",
      "sourceTextId": 31,
      "text": "3",
      "depth": 31,
      "firstPlacementFrame": 207,
      "lastActiveFrame": 207,
      "completeInkSpans": [
        [
          207,
          207
        ]
      ],
      "runs": [
        {
          "text": "3",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              207,
              207
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "210dcaa7c58bcc7da711701a782f4d6fa15e730285bd51e1f2353f58fb411e60"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-6",
      "sourceTextId": 26,
      "text": "1",
      "depth": 29,
      "firstPlacementFrame": 209,
      "lastActiveFrame": 209,
      "completeInkSpans": [
        [
          209,
          209
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              209,
              209
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "6a97ccc57229ab20904e3e4cbd7276008e3d73c2b9e2a1f702ab65da76fdd4a9"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-6",
      "sourceTextId": 30,
      "text": "2",
      "depth": 30,
      "firstPlacementFrame": 209,
      "lastActiveFrame": 209,
      "completeInkSpans": [
        [
          209,
          209
        ]
      ],
      "runs": [
        {
          "text": "2",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              209,
              209
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "397333f0d245bd3a5f1d83dd1df9754ed4b4af4e17773b5977cfa7ce5a9ec685"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-6",
      "sourceTextId": 31,
      "text": "3",
      "depth": 31,
      "firstPlacementFrame": 209,
      "lastActiveFrame": 209,
      "completeInkSpans": [
        [
          209,
          209
        ]
      ],
      "runs": [
        {
          "text": "3",
          "colorRgba": [
            255,
            255,
            255,
            255
          ],
          "completeInkSpans": [
            [
              209,
              209
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "210dcaa7c58bcc7da711701a782f4d6fa15e730285bd51e1f2353f58fb411e60"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-3",
      "sourceTextId": 20,
      "text": "1",
      "depth": 28,
      "firstPlacementFrame": 295,
      "lastActiveFrame": 307,
      "completeInkSpans": [
        [
          295,
          307
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              295,
              307
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "228266b0ef8e33c4d31b77c5affa9e84980781b1435aba6e966ea1b71b87da12"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-4",
      "sourceTextId": 21,
      "text": "10",
      "depth": 28,
      "firstPlacementFrame": 311,
      "lastActiveFrame": 323,
      "completeInkSpans": [
        [
          311,
          323
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              311,
              323
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "fe60cc63aeca5c6a07f11d01380d24dfe64c7ec40b263b49ad70c177e0ec2e3f"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-5",
      "sourceTextId": 22,
      "text": "100",
      "depth": 28,
      "firstPlacementFrame": 329,
      "lastActiveFrame": 348,
      "completeInkSpans": [
        [
          329,
          348
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              329,
              348
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9b5047ef3898c6b25fe34de6671c4b0d7ba6bef7740120fc71004310717bdb8c"
    },
    {
      "instanceId": "sprite-38/depth-26/generation-2",
      "sourceTextId": 20,
      "text": "1",
      "depth": 26,
      "firstPlacementFrame": 377,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          377,
          410
        ]
      ],
      "runs": [
        {
          "text": "1",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              377,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "a1860f21905e3cc623edc9ab044c1e2beac4a0d2314193d507fb450dfcd8ce87"
    },
    {
      "instanceId": "sprite-38/depth-27/generation-6",
      "sourceTextId": 21,
      "text": "10",
      "depth": 27,
      "firstPlacementFrame": 377,
      "lastActiveFrame": 378,
      "completeInkSpans": [
        [
          377,
          378
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              377,
              378
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "c47e74f86f53e20cb4a20a4995fa0eb1ba43c4d170abc05e83f5cee846d8a660"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-6",
      "sourceTextId": 22,
      "text": "100",
      "depth": 28,
      "firstPlacementFrame": 377,
      "lastActiveFrame": 378,
      "completeInkSpans": [
        [
          377,
          378
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              377,
              378
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "9b5047ef3898c6b25fe34de6671c4b0d7ba6bef7740120fc71004310717bdb8c"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-7",
      "sourceTextId": 35,
      "text": "}",
      "depth": 29,
      "firstPlacementFrame": 377,
      "lastActiveFrame": 378,
      "completeInkSpans": [
        [
          377,
          378
        ]
      ],
      "runs": [
        {
          "text": "}",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              377,
              378
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "df32151032902840df8f41ce239c231dd603e6c625ef2fde5725abfb42ac4957"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-7",
      "sourceTextId": 36,
      "text": "{",
      "depth": 30,
      "firstPlacementFrame": 377,
      "lastActiveFrame": 378,
      "completeInkSpans": [
        [
          377,
          378
        ]
      ],
      "runs": [
        {
          "text": "{",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              377,
              378
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "74e7a715d1c8a2144bea31e8f6763e57833e4fb0f01df64ce3bc7682d7601f1c"
    },
    {
      "instanceId": "sprite-38/depth-28/generation-7",
      "sourceTextId": 21,
      "text": "10",
      "depth": 28,
      "firstPlacementFrame": 379,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          379,
          410
        ]
      ],
      "runs": [
        {
          "text": "10",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              379,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "ab6e2704b7969b414cc677d42d812ff272ff6e4cc585d754aa5f93c0aa009bb6"
    },
    {
      "instanceId": "sprite-38/depth-30/generation-8",
      "sourceTextId": 22,
      "text": "100",
      "depth": 30,
      "firstPlacementFrame": 379,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          379,
          410
        ]
      ],
      "runs": [
        {
          "text": "100",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              379,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "f9cca9dcdf98000537add8ff0a262e58d8e29d9ca18d96450fc202bf2c804fc8"
    },
    {
      "instanceId": "sprite-38/depth-31/generation-7",
      "sourceTextId": 35,
      "text": "}",
      "depth": 31,
      "firstPlacementFrame": 379,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          379,
          410
        ]
      ],
      "runs": [
        {
          "text": "}",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              379,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "56523f5a5e5ac470814fd0e8046d1fe052ad71eac89dfb6ebd187997cf6774a5"
    },
    {
      "instanceId": "sprite-38/depth-32/generation-1",
      "sourceTextId": 36,
      "text": "{",
      "depth": 32,
      "firstPlacementFrame": 379,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          379,
          410
        ]
      ],
      "runs": [
        {
          "text": "{",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              379,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "c2c40a56918a1e2f732d00526627a4a593df6968c99056d999433d273206fbbb"
    },
    {
      "instanceId": "sprite-38/depth-27/generation-7",
      "sourceTextId": 37,
      "text": ",",
      "depth": 27,
      "firstPlacementFrame": 385,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          385,
          410
        ]
      ],
      "runs": [
        {
          "text": ",",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              385,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "cbfdffd2a60b126411edca417493400b0bc901e0f4512ab03a811f9dcf3b7ae1"
    },
    {
      "instanceId": "sprite-38/depth-29/generation-8",
      "sourceTextId": 37,
      "text": ",",
      "depth": 29,
      "firstPlacementFrame": 394,
      "lastActiveFrame": 410,
      "completeInkSpans": [
        [
          394,
          410
        ]
      ],
      "runs": [
        {
          "text": ",",
          "colorRgba": [
            0,
            0,
            0,
            255
          ],
          "completeInkSpans": [
            [
              394,
              410
            ]
          ]
        }
      ],
      "sourcePlacementTagSha256": "fc67a9c2a7a900f44ecb00ae982dff6a21202e401a3948cadd451d8edbef7d54"
    }
  ],
  "reading": {
    "definitionInstanceId": "sprite-38/depth-5/generation-1",
    "tableHeaderInstanceIds": [
      "sprite-38/depth-18/generation-1",
      "sprite-38/depth-19/generation-1"
    ],
    "tableRows": [
      {
        "inputInstanceId": "sprite-38/depth-20/generation-1",
        "outputInstanceId": "sprite-38/depth-23/generation-1"
      },
      {
        "inputInstanceId": "sprite-38/depth-21/generation-1",
        "outputInstanceId": "sprite-38/depth-24/generation-1"
      },
      {
        "inputInstanceId": "sprite-38/depth-22/generation-1",
        "outputInstanceId": "sprite-38/depth-25/generation-1"
      }
    ],
    "tableFirstCompleteFrame": 173,
    "setTokenInstanceIds": [
      "sprite-38/depth-32/generation-1",
      "sprite-38/depth-26/generation-2",
      "sprite-38/depth-27/generation-7",
      "sprite-38/depth-28/generation-7",
      "sprite-38/depth-29/generation-8",
      "sprite-38/depth-30/generation-8",
      "sprite-38/depth-31/generation-7"
    ],
    "setAllInkSpans": [
      [
        394,
        410
      ]
    ],
    "setOrderedSpans": [
      [
        401,
        410
      ]
    ],
    "setFirstOrderedFrame": 401,
    "canvasOnlyRoles": "transient highlighted copies, moving table-to-set numbers, braces and commas before ordered notation"
  },
  "glossaryControls": [
    {
      "key": "Domain",
      "sourceButtonId": 8,
      "sourceButtonInstanceId": "sprite-38/depth-6/generation-1",
      "sourceHitShapeId": 7,
      "sourceActionSha256": "2e9bed10a2d4355dca7b36d0501e52409d06033c6e74a9fd5702b7c9a787e957",
      "sourceButtonTagSha256": "06fba8b83e75abf3ff78f90e69fb209adeab267db339d4e041c15e07d1949e75",
      "sourcePlacementTagSha256": "2f0ff0eb5454925d25c9a2e87c8faf90a517fdb98b7df6db7a1402487870cc34",
      "depth": 6,
      "firstPlacementFrame": 11,
      "firstPartialHitFrame": 15,
      "firstFullHitFrame": 21,
      "sourceLabelTextId": 6,
      "sourceLabelTextInstanceId": "sprite-38/depth-5/generation-1",
      "sourceLabelRunText": "domain",
      "sourceLabelSegment": "domain",
      "firstCandidateFrame": 21,
      "availableSpans": [
        [
          21,
          410
        ]
      ],
      "originalClickObserved": false
    },
    {
      "key": "Function",
      "sourceButtonId": 11,
      "sourceButtonInstanceId": "sprite-38/depth-12/generation-1",
      "sourceHitShapeId": 7,
      "sourceActionSha256": "549555e0e21a60e887e614e7ff3b03592d8a7f577c5ec25e6601f039050f49c8",
      "sourceButtonTagSha256": "2fc07ac9e5138a81ffb1369a93a89cc72db584aebc45e8e619323e101e3f88c6",
      "sourcePlacementTagSha256": "7b4c18667a69c4958d4feb671cce20549e41d874f47f90b2c7e04ed215a75410",
      "depth": 12,
      "firstPlacementFrame": 11,
      "firstPartialHitFrame": 24,
      "firstFullHitFrame": 30,
      "sourceLabelTextId": 6,
      "sourceLabelTextInstanceId": "sprite-38/depth-5/generation-1",
      "sourceLabelRunText": "function",
      "sourceLabelSegment": "function",
      "firstCandidateFrame": 30,
      "availableSpans": [
        [
          30,
          410
        ]
      ],
      "originalClickObserved": false
    },
    {
      "key": "Set",
      "sourceButtonId": 10,
      "sourceButtonInstanceId": "sprite-38/depth-10/generation-1",
      "sourceHitShapeId": 7,
      "sourceActionSha256": "698d2f17bf25652e70db17aa33b2ed29dbf1de9f2d1b0339915652b1f03165c9",
      "sourceButtonTagSha256": "2665ced1d1ce989312c365801d6cddd3d6c7c5df61cd3d85fd7687f7e6aa16ed",
      "sourcePlacementTagSha256": "5a08df5297100f985febdf80503cdae085a1f06b9069cebb77e226c24de5d376",
      "depth": 10,
      "firstPlacementFrame": 11,
      "firstPartialHitFrame": 40,
      "firstFullHitFrame": 47,
      "sourceLabelTextId": 6,
      "sourceLabelTextInstanceId": "sprite-38/depth-5/generation-1",
      "sourceLabelRunText": "set",
      "sourceLabelSegment": "set",
      "firstCandidateFrame": 47,
      "availableSpans": [
        [
          47,
          410
        ]
      ],
      "originalClickObserved": false
    },
    {
      "key": "Input",
      "sourceButtonId": 9,
      "sourceButtonInstanceId": "sprite-38/depth-8/generation-1",
      "sourceHitShapeId": 7,
      "sourceActionSha256": "2f92a394bed054aeca4ae6ed57b238a04f5b3aa261270c980d5f00a82c8f19a5",
      "sourceButtonTagSha256": "ad38f5de6e93abd2e8cc53d485974c5e8e40b67fc71a7cbd34d9fda83622f955",
      "sourcePlacementTagSha256": "c3b46cc42da672883a1ba2615e1ccdf6da6a4e70a427b1d35d2c63a749dfc078",
      "depth": 8,
      "firstPlacementFrame": 11,
      "firstPartialHitFrame": 63,
      "firstFullHitFrame": 68,
      "sourceLabelTextId": 6,
      "sourceLabelTextInstanceId": "sprite-38/depth-5/generation-1",
      "sourceLabelRunText": "inputs",
      "sourceLabelSegment": "inputs",
      "firstCandidateFrame": 68,
      "availableSpans": [
        [
          68,
          410
        ]
      ],
      "originalClickObserved": false
    }
  ],
  "policy": {
    "canvasGlyphs": "preserved",
    "nativeRole": "source-timed-reflow-reading-companion",
    "language": "source-en-fallback",
    "definition": "complete source sentence ink",
    "table": "all source header and row instances fully inked with geometric row pairing",
    "setNotation": "independent source instances; aggregate only after complete ink and geometric reading order",
    "glossary": "per-instance full hit containing own complete blue glyph segment",
    "originalRuntimeAccepted": false,
    "translatedSpanishSourceAbsent": true
  }
};
