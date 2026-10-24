/** Exact original calibration members admitted to the contiguous stream lane.
 * Source alignment and named audio acceptance remain independent. */
export const FROZEN_CONTINUOUS_SOURCE_MEMBERS=Object.freeze([
  {
    "animationId": "shared-alg001-l01-p001",
    "frameDomain": "sprite-83",
    "sourceSwfSha256": "cd5d73e2aed3214c547dd7758d0201905ce39e7cc0dcfc6d6473ca177d764650",
    "lastFrame": 135,
    "channels": 1,
    "audioFirstFrame": 1,
    "glossary": false
  },
  {
    "animationId": "shared-alg001-l06-p040",
    "frameDomain": "sprite-86",
    "sourceSwfSha256": "cb4b046089166eef2dd0407a921b91c89d33fe6d99071915325de3439b3b2653",
    "lastFrame": 189,
    "channels": 1,
    "audioFirstFrame": 1,
    "glossary": false
  },
  {
    "animationId": "shared-dat001-l01-p001",
    "frameDomain": "sprite-133",
    "sourceSwfSha256": "9cb2f39f0f33fbf7a100f1f306424051864d932c7107b97649e88ae3253203c6",
    "lastFrame": 136,
    "channels": 2,
    "audioFirstFrame": 1,
    "glossary": false
  },
  {
    "animationId": "shared-dat001-l03-p030",
    "frameDomain": "sprite-32",
    "sourceSwfSha256": "5673a39710717ea1c550593e4c30b077be0e496d2f379161e388150eb4cda92f",
    "lastFrame": 383,
    "channels": 1,
    "audioFirstFrame": 1,
    "glossary": true
  },
  {
    "animationId": "shared-dat001-l07-p025",
    "frameDomain": "sprite-83",
    "sourceSwfSha256": "e77b243fe9ce9018cee1f87931487fb64ac21ec055ad36cdf8dbd5a94594fcb0",
    "lastFrame": 562,
    "channels": 1,
    "audioFirstFrame": 9,
    "glossary": true
  },
  {
    "animationId": "shared-geo001-l01-p001",
    "frameDomain": "sprite-142",
    "sourceSwfSha256": "3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226",
    "lastFrame": 127,
    "channels": 1,
    "audioFirstFrame": 1,
    "glossary": false
  },
  {
    "animationId": "shared-geo001-l02-p020",
    "frameDomain": "sprite-22",
    "sourceSwfSha256": "c467be6d21b6aab1eb09523014bfc4aa67b4b8da7dd1a8ad44c33d82a8d7e8c9",
    "lastFrame": 443,
    "channels": 1,
    "audioFirstFrame": 8,
    "glossary": true
  },
  {
    "animationId": "shared-geo001-l07-p040",
    "frameDomain": "sprite-140",
    "sourceSwfSha256": "9fe3b0672c1be385e62f70cb097b69db232960b3e482f8e526f01496a11b18a7",
    "lastFrame": 1524,
    "channels": 1,
    "audioFirstFrame": 2,
    "glossary": true
  },
  {
    "animationId": "shared-nms002-l01-p001",
    "frameDomain": "sprite-113",
    "sourceSwfSha256": "714ecfc1cca2d49766c43c107337c7ef1996122d40073721ee67529cf89f9dd3",
    "lastFrame": 136,
    "channels": 2,
    "audioFirstFrame": 1,
    "glossary": false
  },
  {
    "animationId": "shared-nms002-l02-p020",
    "frameDomain": "sprite-69",
    "sourceSwfSha256": "5aaf739cf2ef1b093564d0f64d3799dcfca2ab5ffa7cc0375f4c0b43dc3364b5",
    "lastFrame": 151,
    "channels": 1,
    "audioFirstFrame": 10,
    "glossary": true
  },
  {
    "animationId": "shared-nms002-l05-p040",
    "frameDomain": "sprite-26",
    "sourceSwfSha256": "c671ad00db12ec2270f25886f2b1b88f68311e411ccc1dee1f7e068a2dddaf16",
    "lastFrame": 351,
    "channels": 1,
    "audioFirstFrame": 5,
    "glossary": true
  }
].map(member=>Object.freeze(member)));
export const frozenContinuousSourceMember=(id:string)=>FROZEN_CONTINUOUS_SOURCE_MEMBERS.find(m=>m.animationId===id);
