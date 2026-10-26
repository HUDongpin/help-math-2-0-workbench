/** P056 source-specific DOM admission. Physical pins and registry transactions
 * are independently verified by the generic proof reader. */
import assert from 'node:assert/strict';

export const P056_ADMISSION_ID = "shared-nms002-l02-p056";
export const P056_ADMISSION_CALIBRATION = "g678-nms-l02-p056-conditional-host-current-js-v1";
export const P056_SOURCE_ROOT = "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware";
export const P056_SOURCE = {
  "path": "G6-G8-shared/NMS002/L2/TS/L2TS03.swf",
  "bytes": 100959,
  "sha256": "a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be"
};
export const P056_XML = {
  "path": "G6-G8-shared/NMS002/L2/index.xml",
  "bytes": 12845,
  "sha256": "550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61"
};
export const P056_RUN = {
  "path": "work/g678-shared-page-factory/g678-nms-l02-p056-conditional-host-current-js-v1/run-manifest.json",
  "bytes": 12405,
  "sha256": "122ca0a65c05079506df2532660d6624ba49a26ef06a30ade5be937eaaa099f6"
};
export const P056_MEMBER = {
  "path": "work/g678-shared-page-factory/g678-nms-l02-p056-conditional-host-current-js-v1/members/shared-nms002-l02-p056/member-manifest.json",
  "bytes": 10111,
  "sha256": "138e8a4b10b10e7c2d5637d2c3499a0a418ea30d665c93fc28f0810100cbf09e"
};
export const P056_MAIN_AUDIO = {
  "path": "migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3",
  "bytes": 95290,
  "sha256": "6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811"
};
export const P056_GLOSSARY_CANDIDATE = {
  "path": "output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-l1-host-bank.json",
  "bytes": 8247,
  "sha256": "7e8aa4a172d2fd0052b968735ab6629ad3b5107ca9e60b9c6e73ac9f4d78f747"
};
export const P056_GLOSSARY_PRODUCT = {
  "path": "packages/demos/src/generated/nms-l02-p056-terms-v1.ts",
  "bytes": 3209,
  "sha256": "331a6ff6a22ee637de230d5a951cf8ff77f13f52d225cdfd17be20b4d1640e50"
};
export const P056_PAGE_INPUT_PATHS = [
  "apps/web/components/nms-l02-p056-lesson-runtime-v1.tsx",
  "apps/web/lib/nms-l02-p056-descriptor-extension.ts",
  "apps/web/tests/nms-l02-p056-descriptor-extension.test.ts",
  "apps/web/tests/nms-l02-p056-runtime-config.test.ts",
  "catalog/g678-ts03-family-audit-v1.json",
  "catalog/g678-ts03-l1-keyterm-recovery-v1.json",
  "lib/nms-l02-p056-admission-semantics.mjs",
  "lib/nms-l02-p056-admission-semantics.test.mjs",
  "migrations/shared-nms002-l02-p056/audit/BUTTON_REVEAL_SOURCE_V1.md",
  "migrations/shared-nms002-l02-p056/audit/DISPLAY_LIST_SOURCE_V1.md",
  "migrations/shared-nms002-l02-p056/audit/SOURCE_INTAKE_V1.md",
  "migrations/shared-nms002-l02-p056/audit/STATIC_ART_SOURCE_V1.md",
  "migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3",
  "migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_16/BUTTONCONDACTION on(release).as",
  "migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_17/BUTTONCONDACTION on(release).as",
  "output/nms-l02-p056-product-20260927/native/product-source-receipt.json",
  "output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-glossary-receipt.json",
  "output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-l1-host-bank.json",
  "output/nms-l02-p056-source-intake-20260927/source-intake.json",
  "output/nms-l02-ts-family-20260927/glossary-dependency/HOST_KEYTERM_BINDING_AUDIT_2026-09-27.md",
  "packages/demos/src/generated/nms-l02-p056-audio-blocks-v1.ts",
  "packages/demos/src/generated/nms-l02-p056-display-list-v1.ts",
  "packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts",
  "packages/demos/src/generated/nms-l02-p056-terms-v1.ts",
  "packages/demos/src/modules/shared-nms002-l02-p056.tsx",
  "packages/demos/src/nms-l02-p056-product-controls-v1.ts",
  "packages/demos/src/nms-l02-p056-product-module-v1.tsx",
  "packages/demos/src/nms-l02-p056-product-renderer-v1.tsx",
  "packages/demos/src/nms-l02-p056-product-text-v1.ts",
  "packages/demos/src/nms-l02-p056-semantic-view-v1.css",
  "packages/demos/src/nms-l02-p056-semantic-view-v1.tsx",
  "packages/demos/src/timelines/shared-nms002-l02-p056-display-list.ts",
  "packages/demos/src/timelines/shared-nms002-l02-p056-source-behavior.ts",
  "packages/demos/src/timelines/shared-nms002-l02-p056-svg.ts",
  "packages/demos/src/timelines/shared-nms002-l02-p056.ts",
  "packages/demos/tests/nms-l02-p056-canonical-dom.test.ts",
  "packages/demos/tests/nms-l02-p056-product-v1.test.tsx",
  "scripts/build-nms-l02-p056-audio-blocks-v1.mjs",
  "scripts/build-nms-l02-p056-display-list-v1.mjs",
  "scripts/build-nms-l02-p056-symbol-art-v1.mjs",
  "scripts/generate-nms-l02-p056-conditional-glossary-v1.mjs",
  "scripts/generate-nms-l02-p056-conditional-glossary-v1.test.mjs",
  "scripts/prepare-nms-l02-p056-admission.mjs",
  "scripts/prepare-nms-l02-p056-admission.test.mjs",
  "scripts/prepare-nms-l02-p056-dom-artifacts-v1.mjs",
  "scripts/prepare-nms-l02-p056-dom-artifacts-v1.test.mjs",
  "scripts/prepare-nms-l02-p056-product.mjs",
  "scripts/prepare-nms-l02-p056-product.test.mjs",
  "work/g678-shared-page-factory/g678-nms-l02-p056-conditional-host-current-js-v1/members/shared-nms002-l02-p056/member-manifest.json",
  "work/g678-shared-page-factory/g678-nms-l02-p056-conditional-host-current-js-v1/run-manifest.json"
];
export const P056_EXTERNAL_EXPECTED = [
  {
    "root": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p009-host-source-v1/scripts/scripts",
    "pin": {
      "path": "frame_35/DoAction.as",
      "bytes": 104008,
      "sha256": "380cd6581859d0ba9814833f1102b08282198713cf30b5230ce2da76c3e27a74"
    }
  },
  {
    "root": "/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p009-host-source-v1/scripts/scripts",
    "pin": {
      "path": "frame_50/DoAction.as",
      "bytes": 1622,
      "sha256": "d267b54cf74f3aae4167e8bcbc1f803df3228630869d089dee53abbd3b162483"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware",
    "pin": {
      "path": "G6-G8-shared/NMS002/L2/SA/L2TS03.mp3",
      "bytes": 171024,
      "sha256": "33b5c3c7e630cac092c25718e17a322c90a4a76f3aa31aa1167026847b14eb0a"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware",
    "pin": {
      "path": "G6-G8-shared/NMS002/L2/TS/L2TS03.swf",
      "bytes": 100959,
      "sha256": "a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware",
    "pin": {
      "path": "G6-G8-shared/NMS002/L2/index.xml",
      "bytes": 12845,
      "sha256": "550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI",
    "pin": {
      "path": "L1KTE01.xml",
      "bytes": 345838,
      "sha256": "14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI",
    "pin": {
      "path": "L1KTS01.xml",
      "bytes": 344456,
      "sha256": "3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407"
    }
  },
  {
    "root": "/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1/objects/sha256/27",
    "pin": {
      "path": "275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9",
      "bytes": 689006,
      "sha256": "275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9"
    }
  }
];

export const P056_CANONICAL_MODULE = {
  "path": "packages/demos/src/modules/shared-nms002-l02-p056.tsx",
  "bytes": 1470,
  "sha256": "c1a3dde5ce140a7ecbb05953d7b35b5403b93383ce5185409981a23a2b32dbbf"
};
export const P056_CANONICAL_TIMELINE = {
  "path": "packages/demos/src/timelines/shared-nms002-l02-p056.ts",
  "bytes": 1767,
  "sha256": "0ae42d59fc3c54f61032acb2c090757a42ca986765441ff145c76e38dc01360e"
};

// Exact inputs recorded inside the immutable source run and member manifests.
export const P056_RUN_INPUTS = [
  {
    "path": "migrations/shared-nms002-l02-p056/audit/BUTTON_REVEAL_SOURCE_V1.md",
    "bytes": 2947,
    "sha256": "0e01bbad2eecb5c45270626b622f194b03b67b0d7f24687fa1359162e77e3155"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/DISPLAY_LIST_SOURCE_V1.md",
    "bytes": 2406,
    "sha256": "83edc22ec652e2a646ecf78df646e3c239de0fff9fe168d54600cdbd97202eea"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3",
    "bytes": 95290,
    "sha256": "6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_16/BUTTONCONDACTION on(release).as",
    "bytes": 123,
    "sha256": "3c8d24c6004268559632a1b6e61b7413f050930c7c294770af72f03c630d76ff"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/ffdec-26.2.1/scripts/DefineButton2_17/BUTTONCONDACTION on(release).as",
    "bytes": 126,
    "sha256": "0b1df7b90fc817c04082cc0aa91b1b7e3992aebefc6bee520774ff1471396a4f"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/SOURCE_INTAKE_V1.md",
    "bytes": 5323,
    "sha256": "085f898017961c70c4441abea5c32de654719f3395d74f1950de9fe01957e6fb"
  },
  {
    "path": "migrations/shared-nms002-l02-p056/audit/STATIC_ART_SOURCE_V1.md",
    "bytes": 3875,
    "sha256": "c36c2db72e9859c84ff472c43a9637bb8b034574b924d93c0b4525fd52f180f6"
  },
  {
    "path": "output/nms-l02-p056-product-20260927/native/product-source-receipt.json",
    "bytes": 5527,
    "sha256": "d46134839cb112d329c042f30d2b8340f5ac693513d8ae1af5a001d3010be849"
  },
  {
    "path": "output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-glossary-receipt.json",
    "bytes": 1239,
    "sha256": "5fdce6f4f7cac977ac8a5d466ef1516e33427bb7de201d134523c56a40a71484"
  },
  {
    "path": "output/nms-l02-p056-source-intake-20260927/glossary/p056-conditional-l1-host-bank.json",
    "bytes": 8247,
    "sha256": "7e8aa4a172d2fd0052b968735ab6629ad3b5107ca9e60b9c6e73ac9f4d78f747"
  },
  {
    "path": "output/nms-l02-p056-source-intake-20260927/source-intake.json",
    "bytes": 4276,
    "sha256": "8dcf9aad32083ba741a781c2da82c355e5c622dfb97544ec58005126341acf80"
  },
  {
    "path": "packages/demos/src/generated/nms-l02-p056-audio-blocks-v1.ts",
    "bytes": 1830,
    "sha256": "3fc7f5eeca2f785ca1b3ff259e321e468fa36329c94026aea925dc768a3464cc"
  },
  {
    "path": "packages/demos/src/generated/nms-l02-p056-display-list-v1.ts",
    "bytes": 22706,
    "sha256": "2b61da7bdae96ce18c5a859d18b5255e32ddada3ef28aa5e8552e1fa54cfdb01"
  },
  {
    "path": "packages/demos/src/generated/nms-l02-p056-symbol-art-v1.ts",
    "bytes": 59670,
    "sha256": "edd12577b063e19bfe3b2b6b33d350c870f1de523a50f18655cfb0f94d1dfa40"
  },
  {
    "path": "packages/demos/src/generated/nms-l02-p056-terms-v1.ts",
    "bytes": 3209,
    "sha256": "331a6ff6a22ee637de230d5a951cf8ff77f13f52d225cdfd17be20b4d1640e50"
  },
  {
    "path": "packages/demos/src/modules/shared-nms002-l02-p056.tsx",
    "bytes": 1470,
    "sha256": "c1a3dde5ce140a7ecbb05953d7b35b5403b93383ce5185409981a23a2b32dbbf"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-product-controls-v1.ts",
    "bytes": 1327,
    "sha256": "c78979fd77e5e26f01783b5236cd8baf543b91391a138c595ac720727fcfd124"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-product-module-v1.tsx",
    "bytes": 7810,
    "sha256": "930eb700dedda6f3a5797f3514ed58b6e1e66a70d82fdea2a523f747dd101e50"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-product-renderer-v1.tsx",
    "bytes": 5671,
    "sha256": "35b837ecd60a2ee57e571ca81958c84188348c333816f57c1171f32dfab12c61"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-product-text-v1.ts",
    "bytes": 3290,
    "sha256": "6537ebaca92098e5ef5f9318ba0f5650143508fd6d7e9d9685f16f28fa5273bd"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-semantic-view-v1.css",
    "bytes": 2861,
    "sha256": "a22bedcbdb24ffd7a784300ea3036856ac0c43a2e875cc860a3552d912482585"
  },
  {
    "path": "packages/demos/src/nms-l02-p056-semantic-view-v1.tsx",
    "bytes": 5340,
    "sha256": "f297a9301489d8c8d3c2a66a017930d41b486834bd02b2c01abc2e219072cfe5"
  },
  {
    "path": "packages/demos/src/timelines/shared-nms002-l02-p056-display-list.ts",
    "bytes": 1940,
    "sha256": "1b944508328d8b0673b2be39fcc21a48df2a209540f065936a62b6a9f52c79cd"
  },
  {
    "path": "packages/demos/src/timelines/shared-nms002-l02-p056-source-behavior.ts",
    "bytes": 5289,
    "sha256": "211a4751a2072f88026f545a54f8880d238c294aa4300965d35268a0338624d2"
  },
  {
    "path": "packages/demos/src/timelines/shared-nms002-l02-p056-svg.ts",
    "bytes": 2653,
    "sha256": "e2d99d71f65afb7b141ee75465066589d60b04564f26d91e530e68839542ea71"
  },
  {
    "path": "packages/demos/src/timelines/shared-nms002-l02-p056.ts",
    "bytes": 1767,
    "sha256": "0ae42d59fc3c54f61032acb2c090757a42ca986765441ff145c76e38dc01360e"
  },
  {
    "path": "packages/demos/tests/nms-l02-p056-canonical-dom.test.ts",
    "bytes": 1426,
    "sha256": "3860a72303315694ff66698645dd60bcce5d0694c20627a1c4563a858df9891c"
  },
  {
    "path": "scripts/build-nms-l02-p056-audio-blocks-v1.mjs",
    "bytes": 4535,
    "sha256": "16302661799ef2148b0c3486c0ac438890a36b3446bbc472a0c44b3af6d86e4f"
  },
  {
    "path": "scripts/build-nms-l02-p056-display-list-v1.mjs",
    "bytes": 8011,
    "sha256": "b12b053156480d124bdd56bc6b487d3b6c3698bd15329473c9ec0dbec155e307"
  },
  {
    "path": "scripts/build-nms-l02-p056-symbol-art-v1.mjs",
    "bytes": 6118,
    "sha256": "429080acf68db245e09f0190cfb89d4c8e92aa716a3b26902eeb1540e5fb0e7d"
  },
  {
    "path": "scripts/generate-nms-l02-p056-conditional-glossary-v1.mjs",
    "bytes": 17610,
    "sha256": "496c5e2304593770ff2561708af3f54e41af5a1d41d8b37314409c8eb8f8d17d"
  },
  {
    "path": "scripts/prepare-nms-l02-p056-dom-artifacts-v1.mjs",
    "bytes": 12381,
    "sha256": "016a3f1d65760ed2801a61d1ba12fc5562704ce4f754a3500b3d0339fff9973e"
  },
  {
    "path": "scripts/prepare-nms-l02-p056-dom-artifacts-v1.test.mjs",
    "bytes": 4793,
    "sha256": "6999b59b26f1c36c2d21b27d3be68ef1a5b198759c0da4e4cf125a9df579d5ae"
  },
  {
    "path": "scripts/prepare-nms-l02-p056-product.mjs",
    "bytes": 7894,
    "sha256": "1c8e2eff1fbda02d001c58cf7f3e0a3ee75e12c1bc28ee6dcdab68fb35ce2293"
  }
];

export const P056_ACCEPTANCE_KEYS = Object.freeze([
 'authoritativeOriginalRuntime','fidelityAccepted','audioAccepted','humanVisualAccepted',
 'ownerAccepted','strictComplete','published',
]);
export const P056_RUNTIME = Object.freeze({
 stage:{width:800,height:600},rootFrameCount:10,rootBeginFrame:6,
 frameDomain:'sprite-24',frameCount:234,livePlaybackEndFrame:234,fps:12,
 language:'fixed-en',scenario:'source-static-frame',seed:'0',
 rendererBinding:'maintained-dom-module-v1',sourceChildTerminalStopPresent:false,
 productPlaybackMode:'once',originalRuntimeParityEstablished:false,
});
export const P056_CONTROL_POLICY = Object.freeze({
 sourceFirstPlacedFrame:9,sourceFirstFullyOpaqueFrame:17,modernInteractiveFirstFrame:17,
 lastFrameExclusive:235,historicalHitTestingVerified:false,originalHostLookupVerified:false,
 controls:[
  {id:'sprite-24/depth-16/generation-1',entryId:'organize',sourceKeyAttribute:'Organize',characterId:16},
  {id:'sprite-24/depth-18/generation-1',entryId:'information',sourceKeyAttribute:'Information',characterId:17},
 ],
});
const ID=P056_ADMISSION_ID,CALIBRATION=P056_ADMISSION_CALIBRATION;
const FREEZE=`catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const FRAGMENT=FREEZE.replace(/\.json$/u,'.fragment.json');
const demand=(value,reason)=>assert(value,`NMS_L02_P056_ADMISSION: ${reason}`);
const same=(value,expected,reason)=>assert.deepStrictEqual(value,expected,`NMS_L02_P056_ADMISSION: ${reason}`);
const sorted=values=>[...values].sort((a,b)=>a.localeCompare(b));
function validPin(value,expectedPath){
 demand(value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join(',')==='bytes,path,sha256'&&value.path===expectedPath&&
  Number.isSafeInteger(value.bytes)&&value.bytes>0&&value.bytes<=64*1024*1024&&
  /^[a-f0-9]{64}$/u.test(value.sha256),`bounded pin ${expectedPath}`);
}

/** A maintained DOM page cannot be admitted using the predecessor canvas,
 * source sprite domain, glossary keys, or acceptance claims. */
export function validateP056AdmissionSemantics(packet,registration){
 demand(packet?.schemaVersion===1&&packet.calibrationId===CALIBRATION&&
  packet.sourceRoot===P056_SOURCE_ROOT&&packet.scope==='private-engineering'&&
  packet.deploymentScope==='local-only','exact local P056 identity');
 same(packet.source,P056_SOURCE,'exact SWF'); same(packet.sourceXml,P056_XML,'exact XML');
 demand(packet.selectedPages?.length===1,'single selected placement');
 const page=packet.selectedPages[0];
 same(page,{
  animationId:ID,placementId:ID,assetId:`swf-${P056_SOURCE.sha256}`,
  stableLessonKey:'shared-nms002-l02',sourceSha256:P056_SOURCE.sha256,
  moduleCode:'NMS002',lessonNumber:2,globalPageOrdinal:56,sourceOccurrence:56,
  sectionCode:'TS',sectionPageOrdinal:2,complexityLane:'behavior-heavy',runtime:P056_RUNTIME,
 },'source placement and DOM runtime');
 const entry=packet.entry,artifacts=entry?.artifacts;
 same(Object.keys(entry??{}).sort(),['artifacts','complexityLane','key','maturity','module'],'canonical entry keys');
 demand(entry.key===ID&&entry.module===`./modules/${ID}`&&entry.maturity==='private-current-js'&&
  entry.complexityLane==='behavior-heavy','canonical DOM entry');
 same(Object.keys(artifacts??{}).sort(),['kind','memberManifest','module','sourceRun','timeline'],'DOM artifacts only');
 same(artifacts.kind,'maintained-dom-module-v1','renderer kind');
 validPin(artifacts.module,`packages/demos/src/modules/${ID}.tsx`);
 validPin(artifacts.timeline,`packages/demos/src/timelines/${ID}.ts`);
 same(artifacts.module,P056_CANONICAL_MODULE,'canonical module belongs to the pinned source run/member');
 same(artifacts.timeline,P056_CANONICAL_TIMELINE,'canonical timeline belongs to the pinned source run/member');
 same(artifacts.memberManifest,P056_MEMBER,'prepared truthful member manifest');
 same(artifacts.sourceRun,P056_RUN,'prepared source run');
 same(packet.audio,{
  main:P056_MAIN_AUDIO,productUrl:`/migration-assets/nms-l02-p056/main.mp3?sha256=${P056_MAIN_AUDIO.sha256}`,
  transportConfigured:true,firstFrame:5,lastFrame:234,blockCount:230,
  decodedSamples:422208,sampleRate:22050,channels:1,
  sourceAlignmentAccepted:false,listeningAccepted:false,localeAutoPlayback:false,
  lessonSaSubstituted:false,
 },'one exact embedded stream with separate unaccepted alignment/listening');
 same(packet.glossary,{
  candidate:P056_GLOSSARY_CANDIDATE,candidateSha256:P056_GLOSSARY_CANDIDATE.sha256,
  product:P056_GLOSSARY_PRODUCT,sourceSelection:'identified-indexMI-export-literal-L1-bank-path',
  originalL2XmlResolved:false,historicalHostAssociationEstablished:false,originalRuntimeLookupVerified:false,
  lessonXmlDeclaredBanks:{en:'HELP_KEYTERMS/KT/XML/L2KTE01.xml',es:'HELP_KEYTERMS/KT/XML/L2KTS01.xml'},
  controlPolicy:P056_CONTROL_POLICY,stopPath:'animation_mc.animation',closePolicy:'remain-paused',
 },'qualified two-key glossary and distinct source/modern timing');
 same(packet.acceptanceEffects,Object.fromEntries(P056_ACCEPTANCE_KEYS.map(key=>[key,false])),
  'independent acceptance remains false');
 demand(packet.productCalibrationPassed===false&&packet.scaleOutAuthorized===false,'no acceptance or scale out');
 validPin(packet.freezeManifest,FREEZE);
 same(registration,{
  calibrationId:CALIBRATION,deploymentScope:'local-only',freezeManifest:FREEZE,
  freezeManifestBytes:packet.freezeManifest.bytes,freezeManifestSha256:packet.freezeManifest.sha256,
  entries:[entry],
 },'exact single-entry registration fragment');
 return true;
}

/** Exact finite page-owned inventory; all shared host code is sealed separately. */
export function validateP056ProofClosure(proof){
 demand(proof?.schemaVersion===1&&proof.kind==='nms-l02-page-proof-v1'&&
  proof.hostContract==='nms-l02-source-bound-host-v1'&&proof.animationId===ID,'P056 proof identity');
 const packet=proof.packet,own=packet?.integrity?.files;
 demand(packet?.integrity?.scope==='single-NMS-L02-P056-source-and-implementation'&&
  packet.integrity.completeTransitiveClosure===false&&Array.isArray(own),'finite page-owned integrity');
 same(own.map(pin=>pin.path),sorted(P056_PAGE_INPUT_PATHS),'exact page closure membership');
 for(const pin of own)validPin(pin,pin.path);
 const byPath=new Map(own.map(pin=>[pin.path,pin]));
 for(const pin of P056_RUN_INPUTS)
  same(byPath.get(pin.path),pin,`source run input unchanged: ${pin.path}`);
 for(const pin of [packet.entry?.artifacts?.module,packet.entry?.artifacts?.timeline,
  packet.entry?.artifacts?.memberManifest,packet.entry?.artifacts?.sourceRun,
  packet.audio?.main,packet.glossary?.candidate,packet.glossary?.product]){
  demand(pin&&byPath.has(pin.path),'resource in page closure');
  same(byPath.get(pin.path),pin,`exact own resource ${pin.path}`);
 }
 validPin(proof.freeze,FREEZE);
 demand(Array.isArray(proof.files),'proof files');
 same(proof.files.map(pin=>pin.path),sorted([...P056_PAGE_INPUT_PATHS,FREEZE,FRAGMENT]),'exact proof membership');
 for(const pin of proof.files)validPin(pin,pin.path);
 const files=new Map(proof.files.map(pin=>[pin.path,pin]));
 for(const pin of own)same(files.get(pin.path),pin,`proof retains ${pin.path}`);
 same(files.get(FREEZE),proof.freeze,'proof freeze pin');
 same(proof.external,[...P056_EXTERNAL_EXPECTED].sort((a,b)=>
  a.root.localeCompare(b.root)||a.pin.path.localeCompare(b.pin.path)),'exact physical external sources');
 validateP056AdmissionSemantics({...packet,freezeManifest:proof.freeze},proof.registration);
 return true;
}
