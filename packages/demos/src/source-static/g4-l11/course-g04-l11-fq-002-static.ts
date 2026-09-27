/**
 * Internal FQ002 source-static specification.
 *
 * This file exposes immutable, hash-bound observations only. It does not
 * execute legacy ActionScript, advance a playhead, produce pixels, start
 * sound, or change migration, acceptance, release, or publication state.
 */

export const COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID =
  "course-g04-l11-fq-002" as const;

export interface SourceArtifactBinding {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly uncompressedBytes?: number;
  readonly uncompressedSha256?: string;
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    const record = value as Record<PropertyKey, unknown>;
    for (const key of Reflect.ownKeys(record)) deepFreeze(record[key]);
    Object.freeze(record);
  }
  return value as Readonly<T>;
};

const SOURCE_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ02.swf";
const SAME_STEM_FLA_CANDIDATE_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/FQ/L11FQ02.fla";

export const COURSE_G04_L11_FQ_002_STATIC_ARTIFACTS = deepFreeze({
  sourceSwf: {
    path: SOURCE_SWF_PATH,
    bytes: 57_442,
    sha256: "434577c7a1c3e45f05ca2f789430f1658fb8a3a98c340f18cf3eca735d452f61",
  },
  lessonXml: {
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L11/index.xml",
    bytes: 10_085,
    sha256: "b5e0dddcf9e60124d54ecaf5d57d3254e2e0cea40cef1dd5a044a73c8ba4656a",
  },
  lessonReleases: {
    path: "catalog/lesson-releases.json",
    bytes: 145_216,
    sha256: "92d9c57c84ed3520af2dbcd661090209a30eede576328f816933c2b513cf1511",
  },
  migrationManifest: {
    path: "migrations/course-g04-l11-fq-002/migration.json",
    bytes: 6_877,
    sha256: "b59ef1ce604d6f56bbfcd5a3ad95b7cf1e3b53be01fb7e3711f5c77c2e579415",
  },
  machineReport: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/report.json",
    bytes: 105_009,
    sha256: "25424d504ed6a20ef25cd1851e50ce48e304819f4ad0899f5df05267cd9f0a13",
  },
  ffdecHeader: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/ffdec-header.txt",
    bytes: 188,
    sha256: "f6ae081e89acd7f8fe1d62bc6004bc095bce30df7fb1af97bc427ec3915d1ce4",
  },
  ffdecScriptIndex: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/ffdec-script-index.txt",
    bytes: 14_058,
    sha256: "a2fbef6195539fd8d2071b2b9516f3dcfa89929b68f26347f5449a6450d97f57",
  },
  ffdecScripts: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/ffdec-scripts.txt.gz",
    bytes: 3_923,
    sha256: "8fc410e46750e4ec84323227695b12557031ea68107317f38470f923977b8d13",
    uncompressedBytes: 41_187,
    uncompressedSha256:
      "523dfc07e0ecd320697bed58e37f0ddcb84b79a189f1ee857cab25252f323d75",
  },
  ffdecTags: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/ffdec-tags.txt.gz",
    bytes: 57_401,
    sha256: "17c5804612ea9c1b801d1f34a8282b9cddfff09a9a9593a0637de21263976636",
    uncompressedBytes: 478_607,
    uncompressedSha256:
      "dcc0a514b1126e641f5d8daf1fbe07cb17200adda305eb471f5d271358754b10",
  },
  frameDomainCandidates: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/swf-frame-domain-candidates.json",
    bytes: 70_944,
    sha256: "0e368bab9957cceaee9400f871a56f9181e48eb11b7a313170c57de47667fc23",
  },
  swfmillSummary: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/swfmill-summary.json",
    bytes: 14_566,
    sha256: "7d7436346e4293afe99a89da59649d373efc90750829245b0890fffb38e2596c",
  },
  swfmillXml: {
    path: "migrations/course-g04-l11-fq-002/audit/machine/swfmill.xml.gz",
    bytes: 186_769,
    sha256: "dcd1d6bfffa67bcce12028eb65a3ad98ab7504491f888b12b2d056630f3c79c9",
    uncompressedBytes: 4_425_695,
    uncompressedSha256:
      "5129e8db58e8f11ac0413c980a7b6ec652e5fd10327906c08e8bd29e50140718",
  },
  scenarioInventory: {
    path: "migrations/course-g04-l11-fq-002/audit/scenario-inventory.json",
    bytes: 2_701_511,
    sha256: "ba55fa19aab7a045b89a739d6f2aac6f811cd8a6aad71f4343e633e3741e1077",
  },
  frameDomainDisposition: {
    path: "migrations/course-g04-l11-fq-002/audit/frame-domain-disposition.json",
    bytes: 553_536,
    sha256: "87493564581ae38378f8f1c7f618d3d83ba5b7f22b6fce7dd82c516228bf8594",
  },
  dependencyScope: {
    path: "migrations/course-g04-l11-fq-002/audit/runtime-dependency-scope.json",
    bytes: 2_714,
    sha256: "15d556dc4bd79a4ed2f6676c348d8220c801a25012fc10bebac896e2273faa4a",
  },
  audioEvidence: {
    path: "migrations/course-g04-l11-fq-002/audit/audio-runtime-evidence.json",
    bytes: 485_288,
    sha256: "181fedca7519b084725ba1b29169323da0afc4615d58ca3c377ca9cf816c3d38",
  },
  audioInventory: {
    path: "migrations/course-g04-l11-fq-002/audio-inventory.csv",
    bytes: 154,
    sha256: "bbae8148f1753f228e69c4d86dd415a47d3be7c30f5c49246e58328641ae25d8",
  },
  fullFrameCoverage: {
    path: "migrations/course-g04-l11-fq-002/evidence/full-frame-coverage.json",
    bytes: 2_039,
    sha256: "4b05a0413303c5c8de5ee8a33e3fd6b130d3d7bfde41b0607b794c4baa617c8b",
  },
  strictReadiness: {
    path: "migrations/course-g04-l11-fq-002/audit/strict-readiness.json",
    bytes: 16_666,
    sha256: "d5c53a70e095ffde57afea3a119c969fcf0e35c7029751792e629081f8d0e4f2",
  },
  structuralRootFrames: {
    path: "migrations/course-g04-l11-fq-002/baseline/ffdec-root-frames.json",
    bytes: 3_564,
    sha256: "0549e098a58916ecb3e44583ae4b5de381071c31a56af234c002b3e040749e87",
  },
} as const);

const ROOT_CONTROL_RECORDS = deepFreeze([
  {
    frame: 1,
    reasons: [
      "exported-action-script",
      "initial-one-indexed-frame",
      "script-stop-state",
      "structural-action:DoAction",
    ],
  },
  {
    frame: 6,
    reasons: [
      "exported-action-script",
      "frame-label:Begin",
      "script-stop-state",
      "structural-action:DoAction",
    ],
  },
  {frame: 10, reasons: ["terminal-structural-frame"]},
] as const);

const ROOT_NAMED_PLACEMENT = deepFreeze({
  parentTimelineId: "root",
  childTimelineId: "sprite-910",
  sourceObjectId: "910",
  frame: 6,
  depth: "3",
  instanceName: "animation",
  tag: "PlaceObject2",
  replace: "0",
  hasClipActions: false,
} as const);

export const COURSE_G04_L11_FQ_002_STATIC_ROOT_FRAME_FACTS = deepFreeze(
  Array.from({length: 10}, (_, index) => {
    const frame = index + 1;
    const control = ROOT_CONTROL_RECORDS.find(
      (candidate) => candidate.frame === frame,
    );
    return {
      kind: "source-static-root-frame-fact",
      frameDomainId: "root",
      frame,
      validDeclaredFrame: true,
      controlReasons: control?.reasons ?? [],
      label: frame === 6 ? "Begin" : null,
      namedPlacements: frame === 6 ? [ROOT_NAMED_PLACEMENT] : [],
      legacyScriptSemanticsExecuted: false,
      naturalEntryProven: false,
      visualAuthorityEstablished: false,
    };
  }),
);

export const COURSE_G04_L11_FQ_002_STATIC_DECLARED_ROOT_DOMAIN = deepFreeze({
  kind: "source-static-declared-frame-domain",
  frameDomainId: "root",
  sourceTimelineId: "root",
  firstFrame: 1,
  lastFrame: 10,
  frameCount: 10,
  declaredByManifest: true,
  sourceStaticOnly: true,
  naturalEntryProven: false,
  visualAuthorityEstablished: false,
} as const);

const NESTED_TIMELINE_ROWS = [
  "sprite-16|16|2|proven-named-placement-chain|unresolved|review|true",
  "sprite-52|52|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-56|56|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-60|60|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-63|63|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-87|87|2|proven-named-placement-chain|unresolved|review|true",
  "sprite-88|88|8|proven-named-placement-chain|unresolved|review|true",
  "sprite-94|94|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-96|96|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-98|98|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-100|100|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-106|106|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-108|108|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-109|109|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-111|111|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-117|117|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-119|119|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-122|122|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-125|125|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-141|141|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-143|143|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-145|145|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-146|146|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-152|152|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-154|154|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-156|156|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-159|159|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-168|168|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-171|171|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-174|174|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-177|177|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-185|185|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-188|188|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-191|191|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-193|193|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-201|201|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-204|204|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-207|207|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-210|210|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-219|219|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-222|222|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-225|225|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-227|227|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-235|235|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-238|238|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-240|240|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-243|243|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-251|251|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-254|254|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-257|257|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-260|260|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-268|268|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-271|271|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-274|274|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-276|276|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-283|283|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-286|286|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-288|288|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-289|289|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-296|296|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-299|299|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-301|301|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-303|303|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-309|309|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-311|311|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-313|313|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-315|315|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-321|321|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-323|323|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-325|325|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-326|326|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-331|331|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-332|332|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-333|333|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-335|335|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-344|344|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-347|347|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-350|350|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-352|352|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-362|362|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-365|365|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-368|368|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-370|370|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-378|378|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-381|381|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-384|384|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-386|386|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-396|396|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-399|399|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-401|401|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-404|404|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-412|412|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-414|414|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-417|417|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-419|419|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-427|427|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-430|430|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-432|432|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-435|435|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-443|443|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-446|446|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-448|448|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-450|450|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-458|458|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-461|461|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-464|464|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-466|466|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-471|471|1|structurally-reachable-but-named-root-path-unresolved|unresolved|review|false",
  "sprite-480|480|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-481|481|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-490|490|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-491|491|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-502|502|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-503|503|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-504|504|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-505|505|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-518|518|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-519|519|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-520|520|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-521|521|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-535|535|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-536|536|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-537|537|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-538|538|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-551|551|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-552|552|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-553|553|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-554|554|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-567|567|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-568|568|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-569|569|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-570|570|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-587|587|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-588|588|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-589|589|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-590|590|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-603|603|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-604|604|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-605|605|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-606|606|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-619|619|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-620|620|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-621|621|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-622|622|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-636|636|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-637|637|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-638|638|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-639|639|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-649|649|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-650|650|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-651|651|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-652|652|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-666|666|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-667|667|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-668|668|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-669|669|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-683|683|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-684|684|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-685|685|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-686|686|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-703|703|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-704|704|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-705|705|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-706|706|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-720|720|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-721|721|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-722|722|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-723|723|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-736|736|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-737|737|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-738|738|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-739|739|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-749|749|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-750|750|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-751|751|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-752|752|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-766|766|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-767|767|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-768|768|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-769|769|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-783|783|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-784|784|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-785|785|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-786|786|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-799|799|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-800|800|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-801|801|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-802|802|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-816|816|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-817|817|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-818|818|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-819|819|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-837|837|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-838|838|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-839|839|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-840|840|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-853|853|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-854|854|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-855|855|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-856|856|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-866|866|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-867|867|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-868|868|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-869|869|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-883|883|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-884|884|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-885|885|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-886|886|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-900|900|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-901|901|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-902|902|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-903|903|1|proven-named-placement-chain|unresolved|review|false",
  "sprite-910|910|72|proven-named-placement-chain|unresolved|high|true",
] as const;

export const COURSE_G04_L11_FQ_002_STATIC_NESTED_TIMELINE_DISPOSITIONS =
  deepFreeze(NESTED_TIMELINE_ROWS.map((row) => {
    const [
      timelineId,
      sourceObjectId,
      localFrameCount,
      rootPlacementStatus,
      disposition,
      riskLevel,
      independentFrameDomainCandidate,
    ] = row.split("|");
    return {
      kind: "unresolved-nested-timeline-candidate",
      timelineId,
      sourceObjectId,
      localFrameCount: Number(localFrameCount),
      rootPlacementStatus,
      disposition,
      riskLevel,
      independentFrameDomainCandidate:
        independentFrameDomainCandidate === "true",
      staticallyPlacedFromRoot:
        rootPlacementStatus === "proven-named-placement-chain",
      declaredFrameDomain: false,
      runtimeEntryProven: false,
      runtimeReachabilityProven: false,
      compositeWithRootProven: false,
      independentDomainProven: false,
      nonvisualProven: false,
    };
  }));

const SPRITE_910_LABELS = deepFreeze([
  "FirstSection",
  ...Array.from({length: 26}, (_, index) => "Q" + String(index + 1)),
  "Review",
  ...Array.from({length: 26}, (_, index) => "R" + String(index + 1)),
]);

export const COURSE_G04_L11_FQ_002_STATIC_TIMELINE_SUMMARY = deepFreeze({
  inventoryTimelineCount: 214,
  declaredRootCount: 1,
  reachableNestedCount: 213,
  excludedNotProvenNestedCount: 0,
  unresolvedDispositionCount: 213,
  evidenceBackedCompositeCount: 0,
  independentlyRequiredCount: 0,
  nonvisualCount: 0,
  rootPlacementStatusCounts: {
    provenNamedPlacementChain: 212,
    structurallyReachableButNamedRootPathUnresolved: 1,
  },
  nestedFrameCountHistogram: {
    oneFrame: 209,
    twoFrames: 2,
    eightFrames: 1,
    seventyTwoFrames: 1,
  },
  staticIndependentCandidateFlagCount: 4,
  highRiskIndependentCandidateCount: 1,
  highestRiskCandidate: {
    timelineId: "sprite-910",
    sourceObjectId: "910",
    localFrameCount: 72,
    rootPlacementStatus: "proven-named-placement-chain",
    disposition: "unresolved",
    labels: SPRITE_910_LABELS,
    frameLabelCount: 54,
    staticControlStateCount: 56,
    namedChildPlacementCount: 488,
    staticPlacement: ROOT_NAMED_PLACEMENT,
    runtimeEntryProven: false,
    runtimeReachabilityProven: false,
    independentDomainProven: false,
  },
} as const);

const ACTION_RECORD_ROWS = [
  "script-0001|button-event|DefineButton2_12/BUTTONCONDACTION on(release).as|809|1e5fdc16b14ea1793e584deb7556967e8af5fde1e644329b8531cd72d3986c57|1|17",
  "script-0002|button-event|DefineButton2_497/BUTTONCONDACTION on(release).as|32|447a6baec275a792d12fed54578345d5760625bd3d5c279d1b042cb7caaacd23|19|22",
  "script-0003|button-event|DefineButton2_73/BUTTONCONDACTION on(release).as|169|d2edf13e5399c5fe8aab23fb04f3f891a3fc8624f4f6c608a5a81a4f0293d32d|24|34",
  "script-0004|button-event|DefineButton2_79/BUTTONCONDACTION on(release).as|169|dc32f14a10fa157854f3a6d561ff39c8b951a4645fb69d0fbe7d8ef54d597417|36|46",
  "script-0005|nested-do-action|DefineSprite_16/frame_1/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|48|49",
  "script-0006|nested-do-action|DefineSprite_16/frame_2/DoAction.as|1403|39f6a3e79201cb77ecf820db2dc2a0f6f343f07b45e48c307924ff4556791984|51|82",
  "script-0007|nested-do-action|DefineSprite_87/frame_1/DoAction.as|39|46315a700da35cdbbb86ca708b2ae4dbb2170015aed67ca1c0446fb51b7b462b|84|86",
  "script-0008|nested-do-action|DefineSprite_87/frame_2/DoAction.as|40|b78f4d536d061a89f955d21420d81ea58cfee27be0bca8ce8161872bef23372f|88|90",
  "script-0009|nested-do-action|DefineSprite_88/frame_1/DoAction.as|2828|4faf4d0c62f491688bf435b52b6ed5ac274e7ed60c6482d89a4c81d3241816aa|92|180",
  "script-0010|nested-do-action|DefineSprite_88/frame_5/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|182|183",
  "script-0011|nested-do-action|DefineSprite_88/frame_6/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|185|186",
  "script-0012|nested-do-action|DefineSprite_88/frame_7/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|188|189",
  "script-0013|nested-do-action|DefineSprite_88/frame_8/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|191|192",
  "script-0014|nested-do-action|DefineSprite_910/frame_1/DoAction.as|8853|b71a30e405d797508896d858914dca257c5aaa7d506e213773deb768c11d1b74|194|439",
  "script-0015|clip-event|DefineSprite_910/frame_10/PlaceObject2_201_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|441|446",
  "script-0016|clip-event|DefineSprite_910/frame_10/PlaceObject2_204_57/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|448|453",
  "script-0017|clip-event|DefineSprite_910/frame_10/PlaceObject2_207_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|455|460",
  "script-0018|clip-event|DefineSprite_910/frame_10/PlaceObject2_210_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|462|467",
  "script-0019|clip-event|DefineSprite_910/frame_11/PlaceObject2_219_47/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|469|474",
  "script-0020|clip-event|DefineSprite_910/frame_11/PlaceObject2_222_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|476|481",
  "script-0021|clip-event|DefineSprite_910/frame_11/PlaceObject2_225_69/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|483|488",
  "script-0022|clip-event|DefineSprite_910/frame_11/PlaceObject2_227_80/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|490|495",
  "script-0023|clip-event|DefineSprite_910/frame_12/PlaceObject2_235_46/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|497|502",
  "script-0024|clip-event|DefineSprite_910/frame_12/PlaceObject2_238_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|504|509",
  "script-0025|clip-event|DefineSprite_910/frame_12/PlaceObject2_240_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|511|516",
  "script-0026|clip-event|DefineSprite_910/frame_12/PlaceObject2_243_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|518|523",
  "script-0027|clip-event|DefineSprite_910/frame_13/PlaceObject2_251_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|525|530",
  "script-0028|clip-event|DefineSprite_910/frame_13/PlaceObject2_254_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|532|537",
  "script-0029|clip-event|DefineSprite_910/frame_13/PlaceObject2_257_68/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|539|544",
  "script-0030|clip-event|DefineSprite_910/frame_13/PlaceObject2_260_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|546|551",
  "script-0031|clip-event|DefineSprite_910/frame_14/PlaceObject2_268_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|553|558",
  "script-0032|clip-event|DefineSprite_910/frame_14/PlaceObject2_271_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|560|565",
  "script-0033|clip-event|DefineSprite_910/frame_14/PlaceObject2_274_68/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|567|572",
  "script-0034|clip-event|DefineSprite_910/frame_14/PlaceObject2_276_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|574|579",
  "script-0035|clip-event|DefineSprite_910/frame_15/PlaceObject2_283_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|581|586",
  "script-0036|clip-event|DefineSprite_910/frame_15/PlaceObject2_286_57/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|588|593",
  "script-0037|clip-event|DefineSprite_910/frame_15/PlaceObject2_288_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|595|600",
  "script-0038|clip-event|DefineSprite_910/frame_15/PlaceObject2_289_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|602|607",
  "script-0039|clip-event|DefineSprite_910/frame_16/PlaceObject2_296_46/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|609|614",
  "script-0040|clip-event|DefineSprite_910/frame_16/PlaceObject2_299_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|616|621",
  "script-0041|clip-event|DefineSprite_910/frame_16/PlaceObject2_301_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|623|628",
  "script-0042|clip-event|DefineSprite_910/frame_16/PlaceObject2_303_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|630|635",
  "script-0043|clip-event|DefineSprite_910/frame_17/PlaceObject2_309_46/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|637|642",
  "script-0044|clip-event|DefineSprite_910/frame_17/PlaceObject2_311_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|644|649",
  "script-0045|clip-event|DefineSprite_910/frame_17/PlaceObject2_313_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|651|656",
  "script-0046|clip-event|DefineSprite_910/frame_17/PlaceObject2_315_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|658|663",
  "script-0047|clip-event|DefineSprite_910/frame_18/PlaceObject2_321_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|665|670",
  "script-0048|clip-event|DefineSprite_910/frame_18/PlaceObject2_323_57/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|672|677",
  "script-0049|clip-event|DefineSprite_910/frame_18/PlaceObject2_325_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|679|684",
  "script-0050|clip-event|DefineSprite_910/frame_18/PlaceObject2_326_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|686|691",
  "script-0051|clip-event|DefineSprite_910/frame_19/PlaceObject2_331_46/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|693|698",
  "script-0052|clip-event|DefineSprite_910/frame_19/PlaceObject2_332_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|700|705",
  "script-0053|clip-event|DefineSprite_910/frame_19/PlaceObject2_333_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|707|712",
  "script-0054|clip-event|DefineSprite_910/frame_19/PlaceObject2_335_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|714|719",
  "script-0055|clip-event|DefineSprite_910/frame_2/PlaceObject2_52_58/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|721|726",
  "script-0056|clip-event|DefineSprite_910/frame_2/PlaceObject2_56_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|728|733",
  "script-0057|clip-event|DefineSprite_910/frame_2/PlaceObject2_60_82/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|735|740",
  "script-0058|clip-event|DefineSprite_910/frame_2/PlaceObject2_63_94/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|742|747",
  "script-0059|clip-event|DefineSprite_910/frame_20/PlaceObject2_344_48/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|749|754",
  "script-0060|clip-event|DefineSprite_910/frame_20/PlaceObject2_347_59/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|756|761",
  "script-0061|clip-event|DefineSprite_910/frame_20/PlaceObject2_350_70/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|763|768",
  "script-0062|clip-event|DefineSprite_910/frame_20/PlaceObject2_352_81/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|770|775",
  "script-0063|clip-event|DefineSprite_910/frame_21/PlaceObject2_362_48/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|777|782",
  "script-0064|clip-event|DefineSprite_910/frame_21/PlaceObject2_365_59/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|784|789",
  "script-0065|clip-event|DefineSprite_910/frame_21/PlaceObject2_368_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|791|796",
  "script-0066|clip-event|DefineSprite_910/frame_21/PlaceObject2_370_81/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|798|803",
  "script-0067|clip-event|DefineSprite_910/frame_22/PlaceObject2_378_48/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|805|810",
  "script-0068|clip-event|DefineSprite_910/frame_22/PlaceObject2_381_59/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|812|817",
  "script-0069|clip-event|DefineSprite_910/frame_22/PlaceObject2_384_70/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|819|824",
  "script-0070|clip-event|DefineSprite_910/frame_22/PlaceObject2_386_81/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|826|831",
  "script-0071|clip-event|DefineSprite_910/frame_23/PlaceObject2_396_48/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|833|838",
  "script-0072|clip-event|DefineSprite_910/frame_23/PlaceObject2_399_59/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|840|845",
  "script-0073|clip-event|DefineSprite_910/frame_23/PlaceObject2_401_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|847|852",
  "script-0074|clip-event|DefineSprite_910/frame_23/PlaceObject2_404_81/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|854|859",
  "script-0075|clip-event|DefineSprite_910/frame_24/PlaceObject2_412_47/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|861|866",
  "script-0076|clip-event|DefineSprite_910/frame_24/PlaceObject2_414_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|868|873",
  "script-0077|clip-event|DefineSprite_910/frame_24/PlaceObject2_417_69/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|875|880",
  "script-0078|clip-event|DefineSprite_910/frame_24/PlaceObject2_419_80/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|882|887",
  "script-0079|clip-event|DefineSprite_910/frame_25/PlaceObject2_427_47/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|889|894",
  "script-0080|clip-event|DefineSprite_910/frame_25/PlaceObject2_430_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|896|901",
  "script-0081|clip-event|DefineSprite_910/frame_25/PlaceObject2_432_69/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|903|908",
  "script-0082|clip-event|DefineSprite_910/frame_25/PlaceObject2_435_80/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|910|915",
  "script-0083|clip-event|DefineSprite_910/frame_26/PlaceObject2_443_47/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|917|922",
  "script-0084|clip-event|DefineSprite_910/frame_26/PlaceObject2_446_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|924|929",
  "script-0085|clip-event|DefineSprite_910/frame_26/PlaceObject2_448_69/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|931|936",
  "script-0086|clip-event|DefineSprite_910/frame_26/PlaceObject2_450_80/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|938|943",
  "script-0087|clip-event|DefineSprite_910/frame_27/PlaceObject2_458_47/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|945|950",
  "script-0088|clip-event|DefineSprite_910/frame_27/PlaceObject2_461_58/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|952|957",
  "script-0089|clip-event|DefineSprite_910/frame_27/PlaceObject2_464_69/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|959|964",
  "script-0090|clip-event|DefineSprite_910/frame_27/PlaceObject2_466_80/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|966|971",
  "script-0091|nested-do-action|DefineSprite_910/frame_29/DoAction.as|28|70b687558cb87688f2abb52576857fdb7a866f83112ac7b59b1364392023268e|973|974",
  "script-0092|clip-event|DefineSprite_910/frame_3/PlaceObject2_100_94/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|976|981",
  "script-0093|clip-event|DefineSprite_910/frame_3/PlaceObject2_94_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|983|988",
  "script-0094|clip-event|DefineSprite_910/frame_3/PlaceObject2_96_70/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|990|995",
  "script-0095|clip-event|DefineSprite_910/frame_3/PlaceObject2_98_82/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|997|1002",
  "script-0096|clip-event|DefineSprite_910/frame_4/PlaceObject2_106_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1004|1009",
  "script-0097|clip-event|DefineSprite_910/frame_4/PlaceObject2_108_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1011|1016",
  "script-0098|clip-event|DefineSprite_910/frame_4/PlaceObject2_109_82/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1018|1023",
  "script-0099|clip-event|DefineSprite_910/frame_4/PlaceObject2_111_94/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1025|1030",
  "script-0100|nested-do-action|DefineSprite_910/frame_45/DoAction.as|7|2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db|1032|1033",
  "script-0101|clip-event|DefineSprite_910/frame_45/PlaceObject2_471_13/CLIPACTIONRECORD on(release).as|40|fcec8a7535bd27d2969fbdbcd5552a6acb4a537f9bbb30b9fdcce28036398410|1035|1038",
  "script-0102|clip-event|DefineSprite_910/frame_5/PlaceObject2_117_58/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1040|1045",
  "script-0103|clip-event|DefineSprite_910/frame_5/PlaceObject2_119_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1047|1052",
  "script-0104|clip-event|DefineSprite_910/frame_5/PlaceObject2_122_82/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1054|1059",
  "script-0105|clip-event|DefineSprite_910/frame_5/PlaceObject2_125_94/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1061|1066",
  "script-0106|clip-event|DefineSprite_910/frame_6/PlaceObject2_141_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1068|1073",
  "script-0107|clip-event|DefineSprite_910/frame_6/PlaceObject2_143_70/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1075|1080",
  "script-0108|clip-event|DefineSprite_910/frame_6/PlaceObject2_145_82/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1082|1087",
  "script-0109|clip-event|DefineSprite_910/frame_6/PlaceObject2_146_94/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1089|1094",
  "script-0110|clip-event|DefineSprite_910/frame_7/PlaceObject2_152_58/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1096|1101",
  "script-0111|clip-event|DefineSprite_910/frame_7/PlaceObject2_154_70/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1103|1108",
  "script-0112|clip-event|DefineSprite_910/frame_7/PlaceObject2_156_82/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1110|1115",
  "script-0113|clip-event|DefineSprite_910/frame_7/PlaceObject2_159_94/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1117|1122",
  "script-0114|clip-event|DefineSprite_910/frame_8/PlaceObject2_168_46/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1124|1129",
  "script-0115|clip-event|DefineSprite_910/frame_8/PlaceObject2_171_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1131|1136",
  "script-0116|clip-event|DefineSprite_910/frame_8/PlaceObject2_174_68/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1138|1143",
  "script-0117|clip-event|DefineSprite_910/frame_8/PlaceObject2_177_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1145|1150",
  "script-0118|clip-event|DefineSprite_910/frame_9/PlaceObject2_185_46/CLIPACTIONRECORD on(release).as|141|7db55e9797a6340dc159c76118d215b24b0ecf95935d30a18be1a44c837b92c0|1152|1157",
  "script-0119|clip-event|DefineSprite_910/frame_9/PlaceObject2_188_57/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1159|1164",
  "script-0120|clip-event|DefineSprite_910/frame_9/PlaceObject2_191_68/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1166|1171",
  "script-0121|clip-event|DefineSprite_910/frame_9/PlaceObject2_193_79/CLIPACTIONRECORD on(release).as|139|095897c7a4f23a331e98bdee20e4d010ae07f82056ab343690452c58712e2e5b|1173|1178",
  "script-0122|root-do-action|frame_1/DoAction.as|60|a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3|1180|1182",
  "script-0123|root-do-action|frame_6/DoAction.as|1620|e6082636f4a10e8276be16e1c1b50d4f1b5482ef25ec0cb6d7c636e0a9cf864d|1184|1259",
] as const;

export const COURSE_G04_L11_FQ_002_STATIC_ACTION_RECORDS = deepFreeze(
  ACTION_RECORD_ROWS.map((row) => {
    const [
      id,
      sourceKind,
      sourcePath,
      bodyBytes,
      bodySha256,
      lineStart,
      lineEnd,
    ] = row.split("|");
    return {
      kind: "blocked-source-script-record",
      id,
      sourceKind,
      sourcePath,
      bodyBytes: Number(bodyBytes),
      bodySha256,
      lineStart: Number(lineStart),
      lineEnd: Number(lineEnd),
      policy: "blocked-record-only",
      semanticsExecuted: false,
      behaviorEstablished: false,
      executableCallables: [],
    };
  }),
);

const actionRecord = (sourcePath: string) => {
  const record = COURSE_G04_L11_FQ_002_STATIC_ACTION_RECORDS.find(
    (candidate) => candidate.sourcePath === sourcePath,
  );
  if (!record) throw new Error("missing hash-bound static script: " + sourcePath);
  return record;
};

export const COURSE_G04_L11_FQ_002_STATIC_BLOCKED_BEHAVIOR_RECORDS =
  deepFreeze([
    {
      id: "bookmark-close-or-navigation-candidate",
      category: "blocked-host-or-network-side-effect",
      sourceScript: actionRecord(
        "DefineButton2_12/BUTTONCONDACTION on(release).as",
      ),
      candidateCalls: [
        "_root.setBookMark()",
        "_root.doCloseApp()",
        "getURL(strURL,\"\")",
      ],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "score-result-and-report-candidate",
      category: "blocked-score-and-host-report-behavior",
      sourceScript: actionRecord("DefineSprite_16/frame_2/DoAction.as"),
      scoreThresholds: [
        {minimum: null, maximum: 3, label: "Unsatisfactory"},
        {minimum: 4, maximum: 6, label: "Partially Proficient"},
        {minimum: 7, maximum: 8, label: "Proficient"},
        {minimum: 9, maximum: null, label: "Advanced"},
      ],
      candidateCalls: [
        "stop()",
        "_root.Send_Quiz_Report_Mc.gotoAndPlay(2)",
      ],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "quiz-review-random-and-host-exit-candidate",
      category: "blocked-random-review-and-side-effect-behavior",
      sourceScript: actionRecord("DefineSprite_910/frame_1/DoAction.as"),
      routines: ["doGetRandomQuiz", "doGetReview", "doShowReview"],
      totalQuestionCount: 26,
      staticRandomCallCount: 1,
      candidateCalls: [
        "random(_global.quizLabelArray.length)",
        "_root.animation_mc.unloadMovie()",
        "_root.animation_mc_preload.unloadMovie()",
        "getURL(strURL,\"\")",
      ],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "review-label-state-candidate",
      category: "blocked-review-state-behavior",
      sourceScript: actionRecord("DefineSprite_910/frame_29/DoAction.as"),
      candidateStatements: ["_global.quizSection = false"],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "review-stop-candidate",
      category: "blocked-review-state-behavior",
      sourceScript: actionRecord("DefineSprite_910/frame_45/DoAction.as"),
      candidateCalls: ["stop()"],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "spanish-host-audio-candidate",
      category: "blocked-host-audio-behavior",
      sourceScript: actionRecord(
        "DefineButton2_73/BUTTONCONDACTION on(release).as",
      ),
      candidateCalls: [
        "_root.doPlayFQQuestionAudio(this,\"SP\")",
        "_root.doPlayFQAnswerAudio(this,\"SP\")",
      ],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "english-host-audio-candidate",
      category: "blocked-host-audio-behavior",
      sourceScript: actionRecord(
        "DefineButton2_79/BUTTONCONDACTION on(release).as",
      ),
      candidateCalls: [
        "_root.doPlayFQQuestionAudio(this,\"EN\")",
        "_root.doPlayFQAnswerAudio(this,\"EN\")",
      ],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "root-preloader-candidate",
      category: "blocked-host-preloader-behavior",
      sourceScript: actionRecord("frame_1/DoAction.as"),
      candidateCalls: ["_level0.InternalPreloader.gotoAndPlay(\"jump_check\")"],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
    {
      id: "root-timer-candidate",
      category: "blocked-timer-and-frame-handler-behavior",
      sourceScript: actionRecord("frame_6/DoAction.as"),
      candidateCalls: ["stop()", "getTimer()", "onEnterFrame"],
      policy: "blocked-record-only",
      semanticsExecuted: false,
      executableCallables: [],
    },
  ] as const);

export const COURSE_G04_L11_FQ_002_STATIC_INTERACTION_SUMMARY = deepFreeze({
  exportedScriptFileCount: 123,
  indexedScriptBlockCount: 123,
  handlerCount: 109,
  nonEventScriptCount: 14,
  buttonDefinitionCount: 7,
  editTextCount: 277,
  dragHandlerCount: 0,
  correctHandlerCount: 28,
  wrongHandlerCount: 80,
  replayCandidateCount: 0,
  replayBehaviorProven: false,
  randomCallCount: 1,
  randomBehaviorProven: false,
  externalCallCandidateApiCount: 1,
  getUrlOccurrenceCount: 2,
  conservativeMachineSignalCount: 506,
  sourceActionSemanticsExecuted: false,
} as const);

export const COURSE_G04_L11_FQ_002_STATIC_AUDIO_OBLIGATIONS = deepFreeze({
  kind: "unresolved-static-audio-obligation-set",
  manifestRequiresAudio: true,
  inventoryRowCount: 0,
  inventoryRowSetSha256:
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  lessonGroupCandidateCount: 260,
  lessonGroupCandidateSummary: {
    count: 260,
    languages: {en: 130, es: 130},
    candidateOnly: true,
    cuePromoted: false,
  },
  lessonGroupCandidatesExcludedFromInventory: true,
  catalogExactAssociationCount: 0,
  resolvedCueCount: 0,
  embeddedDefineSoundCount: 0,
  embeddedSoundStreamCount: 0,
  embeddedStartSoundCount: 0,
  embeddedExportedSoundLinkageCount: 0,
  actionScriptAudioOperationCount: 0,
  promotedSourceCount: 0,
  obligations: [
    {
      id: "resolve-exact-original-host-audio-branch",
      status: "unresolved",
      evidenceKind: "static-obligation-only",
      sourcePath: null,
      language: null,
      startFrame: null,
      durationMs: null,
      runtimeReachabilityVerified: false,
      originalRuntimeListeningAccepted: false,
    },
  ],
  exactHostBranchResolved: false,
  cueTriggerResolved: false,
  timingResolved: false,
  durationResolved: false,
  spokenContentResolved: false,
  synchronizationResolved: false,
  silenceEstablished: false,
  acceptanceEstablished: false,
} as const);

export const COURSE_G04_L11_FQ_002_STATIC_ROOT_REQUIREMENTS = deepFreeze([
  {
    requirementId: "req-default-root-en",
    scenario: "default",
    traceId: "default-root-en",
    language: "en",
    seed: "0",
    frameDomainId: "root",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "en"},
    entryStateSha256:
      "bf209e3302a76c14fff3e7e12f6fdc0f9bc01d4934aadd03334b5c3cf61b7cf1",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
  {
    requirementId: "req-default-root-es",
    scenario: "default",
    traceId: "default-root-es",
    language: "es",
    seed: "0",
    frameDomainId: "root",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState: {kind: "initial-load", language: "es"},
    entryStateSha256:
      "4e4bcf0390c6fd9bb1539b0c26a8555d9e4034ef5c591548bdb1f9a506f70067",
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  },
] as const);

export const COURSE_G04_L11_FQ_002_STATIC_EVIDENCE_BOUNDARY = deepFreeze({
  sourceStaticOnly: true,
  migrationStatus: "preserved",
  pairedFlaStatus: "missing",
  authoringInspectionStatus: "missing-source",
  authoringStructureEstablished: false,
  sourceActionSemanticsExecuted: false,
  runtimeEntryEstablished: false,
  runtimeReachabilityEstablished: false,
  naturalTraceEstablished: false,
  branchOrderEstablished: false,
  hitGeometryEstablished: false,
  hostDefaultsEstablished: false,
  terminalBehaviorEstablished: false,
  replayBehaviorEstablished: false,
  currentJavascriptImplemented: false,
  originalRuntimeEvidenceEstablished: false,
  ruffleEvidenceEstablished: false,
  browserEvidenceEstablished: false,
  visualComparisonEstablished: false,
  visualMetricEstablished: false,
  audioAcceptanceEstablished: false,
  humanVisualReviewAccepted: false,
  engineeringReviewAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseAuthorized: false,
  publicationAuthorized: false,
  strictAcceptanceEffect: "none",
} as const);

export const COURSE_G04_L11_FQ_002_STATIC_SOURCE_FACTS = deepFreeze({
  kind: "internal-source-static-specification",
  animationId: COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID,
  assetId:
    "swf-434577c7a1c3e45f05ca2f789430f1658fb8a3a98c340f18cf3eca735d452f61",
  source: {
    swf: {
      ...COURSE_G04_L11_FQ_002_STATIC_ARTIFACTS.sourceSwf,
      physicalBytes: 57_442,
      signature: "CWS",
      compression: "zlib",
      version: 7,
      headerDeclaredUncompressedBytes: 235_509,
      headerDeclaredLengthIsPhysicalFileSize: false,
      actionScriptVersion: "AS1/2",
    },
    fla: {
      manifestPath: "",
      manifestSha256: "",
      sameStemCandidatePath: SAME_STEM_FLA_CANDIDATE_PATH,
      pairedFlaStatus: "missing",
      physicallyPresent: false,
      authoringInspectionStatus: "missing-source",
    },
    lessonXml: {
      ...COURSE_G04_L11_FQ_002_STATIC_ARTIFACTS.lessonXml,
      physicalBytes: 10_085,
      activeXmlOccurrence: 42,
    },
  },
  release: {
    releaseId: "lesson-g04-l11-coordinate-grid",
    publicationMode: "atomic",
    memberCount: 44,
    memberOrdinal: 42,
    releaseRole: "active-xml-referenced-page",
    shardId: "g04-l11-practice-assessment",
    sourcePath: "HELP_COURSES/ELMGR4/L11/FQ/L11FQ02.swf",
  },
  stage: {
    twips: {
      left: 0,
      right: 16_000,
      top: 0,
      bottom: 12_000,
      twipsPerPixel: 20,
    },
    pixels: {width: 800, height: 600},
    captureRaster: {width: 800, height: 600},
    fps: 12,
    rootFrameCount: 10,
    backgroundColor: "#b8d8f7",
  },
  authoringInspection: {
    pairedFlaStatus: "missing",
    machineAuditStatus: "partial",
    perFileFlaAuditStatus: "not-applicable-fla-missing",
    applicationInstalled: true,
    blankDocumentProbeStatus: "passed",
    readinessScope: "tool-and-blank-document-only",
    authoringStructureEstablished: false,
  },
  artifacts: COURSE_G04_L11_FQ_002_STATIC_ARTIFACTS,
  rootDomain: COURSE_G04_L11_FQ_002_STATIC_DECLARED_ROOT_DOMAIN,
  rootFrameFacts: COURSE_G04_L11_FQ_002_STATIC_ROOT_FRAME_FACTS,
  nestedTimelineDispositions:
    COURSE_G04_L11_FQ_002_STATIC_NESTED_TIMELINE_DISPOSITIONS,
  timelineSummary: COURSE_G04_L11_FQ_002_STATIC_TIMELINE_SUMMARY,
  interactionSummary: COURSE_G04_L11_FQ_002_STATIC_INTERACTION_SUMMARY,
  actionRecords: COURSE_G04_L11_FQ_002_STATIC_ACTION_RECORDS,
  blockedBehaviorRecords: COURSE_G04_L11_FQ_002_STATIC_BLOCKED_BEHAVIOR_RECORDS,
  rootRequirements: COURSE_G04_L11_FQ_002_STATIC_ROOT_REQUIREMENTS,
  audioObligations: COURSE_G04_L11_FQ_002_STATIC_AUDIO_OBLIGATIONS,
  evidenceBoundary: COURSE_G04_L11_FQ_002_STATIC_EVIDENCE_BOUNDARY,
} as const);

type Blocker =
  | "invalid-animation-id"
  | "invalid-frame-domain-id"
  | "invalid-timeline-id"
  | "invalid-script-id"
  | "invalid-root-frame";

const requestedScalar = (value: unknown): string | number | null =>
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value))
    ? value
    : null;

const blocked = (
  blocker: Blocker,
  animationId: unknown,
  requestedValue: unknown,
) => deepFreeze({
  kind: "blocked-static-source-query",
  status: "BLOCKED_UNVERIFIED",
  blocker,
  requestedAnimationId:
    typeof animationId === "string" ? animationId : null,
  requestedValue: requestedScalar(requestedValue),
  facts: null,
} as const);

export const getStaticSourceFacts = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_002_STATIC_SOURCE_FACTS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticDeclaredFrameDomain = (
  animationId: unknown,
  frameDomainId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frameDomainId);
  }
  return frameDomainId === "root"
    ? COURSE_G04_L11_FQ_002_STATIC_DECLARED_ROOT_DOMAIN
    : blocked("invalid-frame-domain-id", animationId, frameDomainId);
};

export const getStaticRootFrameFact = (
  animationId: unknown,
  frame: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, frame);
  }
  if (
    !Number.isSafeInteger(frame) ||
    (frame as number) < 1 ||
    (frame as number) > 10
  ) {
    return blocked("invalid-root-frame", animationId, frame);
  }
  return COURSE_G04_L11_FQ_002_STATIC_ROOT_FRAME_FACTS[(frame as number) - 1];
};

export const getStaticTimelineDisposition = (
  animationId: unknown,
  timelineId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, timelineId);
  }
  if (timelineId === "root") {
    return COURSE_G04_L11_FQ_002_STATIC_DECLARED_ROOT_DOMAIN;
  }
  const disposition =
    COURSE_G04_L11_FQ_002_STATIC_NESTED_TIMELINE_DISPOSITIONS.find(
      (candidate) => candidate.timelineId === timelineId,
    );
  return disposition ??
    blocked("invalid-timeline-id", animationId, timelineId);
};

export const getStaticActionRecord = (
  animationId: unknown,
  scriptId: unknown,
) => {
  if (animationId !== COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID) {
    return blocked("invalid-animation-id", animationId, scriptId);
  }
  const record = COURSE_G04_L11_FQ_002_STATIC_ACTION_RECORDS.find(
    (candidate) => candidate.id === scriptId,
  );
  return record ?? blocked("invalid-script-id", animationId, scriptId);
};

export const getStaticAudioObligations = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_002_STATIC_AUDIO_OBLIGATIONS
    : blocked("invalid-animation-id", animationId, null);

export const getStaticBlockedBehaviorRecords = (animationId: unknown) =>
  animationId === COURSE_G04_L11_FQ_002_STATIC_ANIMATION_ID
    ? COURSE_G04_L11_FQ_002_STATIC_BLOCKED_BEHAVIOR_RECORDS
    : blocked("invalid-animation-id", animationId, null);
