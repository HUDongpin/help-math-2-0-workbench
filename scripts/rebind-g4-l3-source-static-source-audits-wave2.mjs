#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  link,
  lstat,
  mkdir,
  open,
  readdir,
  readFile,
  realpath,
  rename,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SCRIPT_RELATIVE_PATH =
  "scripts/rebind-g4-l3-source-static-source-audits-wave2.mjs";
const RECEIPT_PATH =
  "reports/g4-l3-source-static-source-audit-rebind-wave2-receipt.json";
const WORK_ROOT =
  "work/g4-l3-source-static-source-audit-rebind-wave2";
const TRANSACTIONS_PATH = `${WORK_ROOT}/transactions`;
const LOCK_PATH = `${WORK_ROOT}/.rebind.lock`;
const RECEIPT_ID =
  "g4-l3-source-static-source-audit-rebind-2026-07-27-wave2-v1";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

const CANDIDATE_GENERATOR = Object.freeze({
  path: "scripts/build-g4-l3-source-static-candidate.mjs",
  bytes: 78_676,
  sha256: "81c3e3908f9ef5908fabc973b2107b0ecbb018dca645f15601504b2772c1059d",
});

const SOURCE_AUDIT_MATERIALIZER = Object.freeze({
  path: "scripts/materialize-g4-l3-workspace-source-audits.mjs",
  bytes: 36_651,
  sha256: "9da52c9d17bfec652a9cf58f90419978dcfc76588fd428e1f371b00661d23630",
});

const PROTECTED_BINDINGS = Object.freeze([
  Object.freeze({
    path: "catalog/completion-ledger.json",
    bytes: 64_286,
    sha256: "8e5f26e1cece647a38182a9d544f509b5c4737df087fc16c34ef9c2a0b774ad0",
  }),
  Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    bytes: 49_048,
    sha256: "e6dc65da3981a7e497c1a9ecacb60b8ba4acbb18ef0fb3963d2ef28b5b8b02e0",
  }),
  Object.freeze({
    path: "catalog/lesson-releases.json",
    bytes: 54_579,
    sha256: "ab0ad5dac373f7bf192b603c4c2b0bc4dae9f73fe770eba3be7507d458bfc375",
  }),
  Object.freeze({
    path: "reports/current-javascript-output-human-approval.json",
    bytes: 3_375_444,
    sha256: "7f291bd72cf2a9c35cdb7d7fcbd3b52c1e3b88ec1e31e66e776b909e9c01cc5c",
  }),
  Object.freeze({
    path: "reports/pilot-owner-review-packet.json",
    bytes: 2_237_959,
    sha256: "79cde06c3447bed8792934c20e7bae2bc86a8ec2345b682fc37b3e3150e2ba62",
  }),
  Object.freeze({
    path: "catalog/source-manifest.sha256",
    bytes: 831_011,
    sha256: "a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e",
  }),
  Object.freeze({
    path: "reports/pilot-strict-acceptance.json",
    bytes: 878_503,
    sha256: "dbd0ddcab28be5faf278c3d6bae7be59e5afa403e6c7dbfb77aaecf946875d39",
  }),
  Object.freeze({
    path: "reports/vb004-semantic-review-packet.json",
    bytes: 23_325,
    sha256: "90cf63d2ee4eaf77c785df17752406b258aa79209f8c4fd18bb8d9719fff32a7",
  }),
  Object.freeze({
    path: ".gitignore",
    bytes: 998,
    sha256: "6370bf2fa40eb4028e0d08cd11b1072b8de87b82ff51672fa5054828b53e3598",
  }),
  Object.freeze({
    path: ".vercelignore",
    bytes: 791,
    sha256: "a74757080ee9cfaeec0ba37691401c7cb0386839c7d3efba51f4ba7fe40cd939",
  }),
]);

const AUTHORITY_BOUNDARY = Object.freeze({
  acceptanceNeutral: true,
  currentJavaScriptCandidateOnly: true,
  originalRuntimeAuthorityCreated: false,
  audioAcceptanceCreated: false,
  visualParityOrRmseCreated: false,
  humanReviewCreated: false,
  ownerAcceptanceCreated: false,
  strictCompletionCreated: false,
  completionLedgerWriteAuthorized: false,
  lessonReleaseWriteAuthorized: false,
  approvalOrPinWriteAuthorized: false,
  publicReleaseAuthorized: false,
  sourceAssetWriteAuthorized: false,
  migrationOrCoverageWriteAuthorized: false,
  strictAcceptanceEffect: "none",
});

const TRANSITION_ROWS = Object.freeze([
  ["course-g04-l03-fq-001", "fq001", 13_605, "4f6ae768957050284d6a167566574253ad23904fb7f1e89e939814fc2cd62c48", "a2a195bb253a030e4a23a2dc0403a841214dbf7307fc7e54d3e6bfb5c08b43db", 5_046, "e64056afd94748e7dd50661d087c824032ac4dd5fae2ec72b5e0da6dd950a62a", 27_069, "56c2fe44832d0093db1cb02607fe69bdc00413436ad7e6e3eadffa820f3d4f5d", 2_331, "3baae3e9d8c6adc64778b963388aabd582e282fb24c53f027afbd4c1cca8ecc7"],
  ["course-g04-l03-fq-002", "fq002", 68_451, "d9b77ac93f601808be704b8c28b0c371bd9556d02f5f0fc46f3cce5301fe38cb", "4648e32010992f57f3f0b10d2fc42d4d5aa709a2a51d2b4a7f8aeb87ec71ab97", 4_835, "ccaa9b49d6085d5d7481b5d7e0178d704a60b5636f0ac8f95ef3da3255a4a62f", 31_494, "d790d05fba7d220831e28d46d9bbd7e55ca9444f2b88970cc642fc5b746e63a4", 1_906, "fa35f155d3a7901725165a291d9f9723a4bf74a3bf55eead1811d838fa2dae13"],
  ["course-g04-l03-gs-002", "gs002", 30_067, "9b96cbaf4d973443a2333e0b894c819e47f0028090d52019d83dd0069311833f", "36e866e27c3350137a755ab71e9d22d8d1d0dc474320e4c2e6cf634ac263446d", 5_427, "bbfa579750a2bdbe083d3266ed5a446298e9ddf5f27a7a4e496c73d1dc2d9dbd", 108_257, "45ed24a106b2ea7058657a7efd25a1a39753e8715c656dbc5f5c5196915a2030", 1_803, "54b63b89f080e14a824b67c723bdd851b80170c9967c55c54a801935ad26ec9b"],
  ["course-g04-l03-in-002", "in002", 12_511, "6af687bfee052f1aac30a32adc752f758b4f334b6a182f7159f05d7df6352fee", "2b0a4b29d2b72dcead339b0d9d28df6d0cfc1a6e33ce22ffb7a5dfc6fd4072be", 4_847, "13a3bdba6411fc5ff0c6f4b53fb14caef0b1c2195df16ca3c8b3e928d6eb37a2", 115_005, "6366f01194503c7d895328667aae12cfedb459207d629a06a33d79bd00a54b54", 2_045, "41b4b652373bb73e1ad34cd9c0aa43d5d1d584bdea286b7d8990370507a20871"],
  ["course-g04-l03-in-006", "in006", 33_770, "39348a46aceb5e7b84d9ca3c918c4e87f2043dbf817be2e9a55f837337acae49", "1ea0068cc7acdbb94a9d82b0b5cc11f2b168a9a92271bedaabbeaa6a63e29bf0", 8_359, "165519ea519fb76ad90f8ca3bad9f2a9cb17bea4cbd77bd1a2fdd0fe4a5827b2", 236_980, "7f2ad0cc0801366f6c1a96067d6372dd4bc7ee390c12753158f0cde04ff1bfb5", 2_979, "46ce3ec7f111832ad65ab80c9bfa7c6a6486216459384c50e6da64456b3eba32"],
  ["course-g04-l03-in-007", "in007", 11_326, "9105125924b7dc08b06f5e898411fd633be4832409bd760af58a3eec326161fa", "07208cb939fe39375ab27890b4369c07414b05c612b16bac086dc60ec1484b93", 4_754, "edabeb9420637e1ac7ee3746eb79373002b0408a9efb98496000f3be26265eae", 127_636, "f4eb9623d7ea11688154cd68711b5b1d9446f607e247f0160fca8a92fa6758bb", 2_012, "44ccd937fb09355813a08f029dfa5a6dcae507a0447bb48a3526c869be472d0e"],
  ["course-g04-l03-in-008", "in008", 19_526, "7035b42ff5f100533c7d57bf375ddb30986bacde522a56834d6156abf1659da1", "478a06c2ef379377f52b9920905e109bd1966b32a21c2696a5efdbbacedff739", 7_493, "d83c7792be118f32a12ac995130ae1f7124394ebb9de6f9712346991dcb41a68", 63_759, "fff55ca3c64eab263573fabcfdf5e211ed3e58b4dd3550966966410c0b7b5c35", 2_822, "3a6331309e4b69da5332acb44ef211befb935d9d65d509442b8e7947f6c6412e"],
  ["course-g04-l03-in-010", "in010", 24_038, "c545aa4826bb446eace004372de0a373950fb1d8488f47b5514ca2dedee6be34", "5bef5f4d944d4071121cb8a6debd970711fa44c438ae8e5a333f42b0e857960f", 7_179, "9be092135460da7d2286193f2b0fddfdb2b2d74eee756cc2543b3c416c078b46", 75_288, "b5f2fa580c227dbee3d4443591f4b9e37a08d5846b019896301468aacd8a73a2", 2_230, "dc2f4dccf7b3bb8534201eb991de66a0fd3a09030de945bc71fbf7838b7a07c9"],
  ["course-g04-l03-in-011", "in011", 9_001, "2a27e4b448d51705c9ed6dc42520d779e4d319592a91872a8897c735e7727197", "78a7a9f3b3563daecf70c82943674ebd5e867dfb5f45d6d54d9783de13fe49a7", 4_453, "cb3494ab8b78b786ec93fd9d546db193ff58812e6cf52bfb8e574ba0ffad837c", 104_131, "5974e65fa4cab1c113fc93b1830f329a80dbbf1512a9cb7c247b83b80f9dc64d", 1_694, "e1b41904f1cd028527fbc5994c84c11e7005c76d3db96c5d5a2f8e96301628ec"],
  ["course-g04-l03-ir-001-341242cc", "ir001-341242cc", 16_465, "64b11e512f7df17c460c048cb0803b1500eb0a73071be1a90c6b210878144941", "c5b373c0f5e98978b2ac5efcba722ecf92f344be128bf7cc59884fa16e346009", 4_721, "a99f6c966355a6a801595fba32f6aca8e3b10ab0e5b5ca731716394af814d155", 44_957, "ee53d6cb4cad90cef846fb1e40ee5014e80ffde6a473e39202ca909c91c95bf4", 1_708, "ab6905326cc17a97d4e00e767ea48dc49096e4dd67aef805444578eca64f01e7"],
  ["course-g04-l03-rw-002", "rw002", 11_478, "fe9d61ff9426571178cd698f76bc6d3e8cbda79bae073d1b0f7109936c1064f2", "7345d811a1b7ecbbda8c07e3465b1e0b9564a0cdc4255c124e383607ed7c52e1", 4_866, "26ada7b79bfc02492098de2eaa47115ccb2d77f19468b7be3bd1045a00883d2f", 277_843, "7ca20a46f3ea424d2ed2f963a46139d9a7121d51959c2e0653f00b025630d950", 2_117, "16eddf6db99aab103c29835c1884c1d9bfb4c54924e4b17553dda1f4edc2f047"],
  ["course-g04-l03-rw-004", "rw004", 13_372, "7077953aafd7f1a44fddefc38860e389177b0134a6f37dc667b1b3676ecd927e", "38aaf14f4b4b1887495c842a8f6aba5e3fb4e341c680af5942a35f1081a5cacf", 5_025, "77ec48ca83a24482561f301df537c4eac0e992d616ed6eb7e22f68b51692980a", 105_478, "988bba84cdc9abd27386538db96695819084f44fc7a76c071cb7a8fbd3269053", 2_273, "2ab0d713c38f20bf0514e96b6caa59d652183789445b5a0d85787ad8424e262e"],
  ["course-g04-l03-ti-005", "ti005", 27_937, "e61f103b0809dbeda6b13bcaef21033d1fdb211930c13f33349faf8999642d13", "94bbf02ae8abb3a9aa43ef3f85986f224c9aeb3a999344c7897b3fecda0def48", 5_495, "c1635c28c59824df0fe75c9f92ae5c11fa63d12ab4e99c4416fa9676b75694a1", 61_297, "3596c08679bd8a77062f9c80f11e85bd3833063c819d24d944ced2b11879a465", 2_126, "75f36900fb8d2a3334b1020d6e828fe673f3759cf138ca784baecdd25df298a2"],
  ["course-g04-l03-ts-002", "ts002", 10_368, "46d4d5f9325bf42052022bbea00fbe1b0864f21a8ef80a754f1f4458e4c75be5", "8cc2a3b44c024c3c711345b54e44f2035917c6651131291028d0010b554c6fa5", 4_933, "3361d36ee0f183449131ecf9c38522d4a47c443db418e54f0e771e39698014ea", 88_497, "4fa80b13c5643be6aa70550507baeced9fc5f739b9b82ed90c3d397b6669bccc", 1_716, "6c17249ab0291217849848bd5c664284f0fdb908248a9e0f09165358d5eb62e9"],
  ["course-g04-l03-ts-003", "ts003", 9_404, "5736f47a62600f04c9294005c9011a4aa107ff0d3d18286d7b378f971bcad531", "02a380a808f2c10e8443a9f7c90c08b2bf09d30035fe8358de3730b86e1d9694", 4_451, "cc7f0e4d1d6f34ba8813c98843f993d419f39799f17332d3770627e7050ce049", 63_902, "3b084ddbe093f89073d1f2134f65a7a1b6873e5eb21f728545ea3e999ed8c9ea", 1_725, "c4f3c79b4968555147732892638a0a610c8d8f2d89586bbf3c26adae3c07d848"],
  ["course-g04-l03-ts-004", "ts004", 14_642, "fc0b0a45fc8753fc2e30cd2b60b6b116e638be5e4e39cd1c571abe5b54c676c4", "9a2b2b56efa92236fa992cd7d56ddc05a88c7058df59249182d812d3b105d9e4", 4_597, "f5194057aa7873aef7e4acc0377e5074da2f61067d18172a3051964ff020970e", 83_198, "b681bcb93e6b0ccc430508853d09a1afb63c0abca941581e8c6a445339e4beea", 1_819, "16e8df2c5eed8c30c195f67b9d348b37bf6c69aab3d4bb458789edb260e5f67c"],
  ["course-g04-l03-ts-005", "ts005", 14_295, "85aae2bc88bd152d3ec8b940816da28c21f5403c8dd88368e9b4e745cd5e5ff4", "ba67ae0347d83dae9f614ad1047ec14c07cfa491ca0da708ed465ea180fa860e", 4_933, "a8bf62be3ecffacf5f7e4d0b64ca20cb2d20c0e51bc087f4930b6773906b2fcd", 72_339, "3a1fd03ca95b67fe8ef4803c988e9f9bce3b334e0b5f6dc05a3d1694c1079ae5", 1_715, "c76c1984b40def19c4775c186cc85d317fc9967e9fb017563521a139503110ea"],
  ["course-g04-l03-vb-002", "vb002", 12_815, "9f44192242032ab31bbf4e34eeebe1824afa8c82c18374d344eaf980b520033e", "bd8fab3d688c5f9154aeda152997fb5583c1f7e5d0b1b7eb2b42a27b95c5e62f", 4_793, "d7219c30e829cf9542c6e94da10b2286e9d9a2ae3bbfb2340bb49e2a3929372d", 55_824, "5523447c62b9fe3ab163508c0b16e554dbdc0b2a8fc3ef6f7204c3c5dd2078e7", 1_701, "dcd6f8152ffd3e7571805e5b478a6b374636cfaae547448597b9506e46f7b574"],
  ["course-g04-l03-vb-004", "vb004", 10_853, "b42dfe3703c164b6675a911e2432e943cc78e939c8266657255f317aa6327482", "f1be0b916434e8204822b92bf8f2affafbb5034229a362c9ea5e1fdc22c96a0c", 4_969, "ae27b74ab8afbebc094b3b7768cb39df212657691d5e1497cbd1a0cbd8ae97e3", 66_555, "ce921de7e3a9c2a4efbdd55bc9de9357397773a13a7c0dc71a8a798b6cbebebd", 1_746, "6fd03870897508531f7422e6f75a7d91b8998d8997b9857fde2475482e6eb16c"],
]);

export const WAVE2_SOURCE_AUDIT_TRANSITIONS = Object.freeze(
  TRANSITION_ROWS.map(([
    animationId,
    slug,
    auditBytes,
    oldAuditSha256,
    currentAuditSha256,
    specBytes,
    specSha256,
    candidateJsonBytes,
    candidateJsonSha256,
    candidateMarkdownBytes,
    candidateMarkdownSha256,
  ]) => Object.freeze({
    animationId,
    specPath:
      `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`,
    reportPath:
      `reports/g4-l3-${slug}-current-javascript-candidate.json`,
    reportMarkdownPath:
      `reports/g4-l3-${slug}-current-javascript-candidate.md`,
    oldAudit: Object.freeze({
      path: `migrations/${animationId}/audit/machine/g4-l3-source-audit.json`,
      bytes: auditBytes,
      sha256: oldAuditSha256,
    }),
    currentAudit: Object.freeze({
      path: `migrations/${animationId}/audit/machine/g4-l3-source-audit.json`,
      bytes: auditBytes,
      sha256: currentAuditSha256,
    }),
    specPreimage: Object.freeze({
      path:
        `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`,
      bytes: specBytes,
      sha256: specSha256,
    }),
    candidatePreimage: Object.freeze({
      path: `reports/g4-l3-${slug}-current-javascript-candidate.json`,
      bytes: candidateJsonBytes,
      sha256: candidateJsonSha256,
    }),
    candidateMarkdownPreimage: Object.freeze({
      path: `reports/g4-l3-${slug}-current-javascript-candidate.md`,
      bytes: candidateMarkdownBytes,
      sha256: candidateMarkdownSha256,
    }),
  })),
);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return sha256(Buffer.from(stableJson(copy)));
}

function validateFingerprint(value, field, label) {
  invariant(
    /^[a-f0-9]{64}$/u.test(value?.[field] ?? "") &&
      value[field] === fingerprint(value, field),
    `${label} fingerprint is stale`,
  );
}

function publicBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
  };
}

function sameBinding(left, right) {
  return left?.path === right?.path &&
    left?.bytes === right?.bytes &&
    left?.sha256 === right?.sha256;
}

function assertBinding(actual, expected, label) {
  invariant(sameBinding(actual, expected), `${label} differs from its pin`);
  return actual;
}

export function safeWave2ProjectRelative(relativePath, label = "path") {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      relativePath !== "." &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.startsWith("../") &&
      !relativePath.includes("/../") &&
      !relativePath.includes("\\") &&
      !relativePath.includes("\0"),
    `${label} is not a normalized project-relative path: ${relativePath}`,
  );
  return relativePath;
}

async function exists(absolutePath) {
  return lstat(absolutePath).then(() => true, (error) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}

async function assertRealDirectoryChain(root, relativeDirectory) {
  const rootReal = await realpath(root);
  if (relativeDirectory === "." || relativeDirectory === "") return rootReal;
  safeWave2ProjectRelative(relativeDirectory, "directory");
  let cursor = rootReal;
  for (const segment of relativeDirectory.split("/")) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    invariant(
      metadata.isDirectory() && !metadata.isSymbolicLink(),
      `directory component must be real: ${relativeDirectory}`,
    );
  }
  return cursor;
}

async function secureReadBinding(
  root,
  relativePath,
  {require0444 = false} = {},
) {
  safeWave2ProjectRelative(relativePath);
  const rootReal = await realpath(root);
  const parent = await assertRealDirectoryChain(
    rootReal,
    path.posix.dirname(relativePath),
  );
  const absolutePath = path.join(parent, path.posix.basename(relativePath));
  const handle = await open(absolutePath, fsConstants.O_RDONLY | NOFOLLOW);
  try {
    const metadata = await handle.stat({bigint: true});
    invariant(metadata.isFile(), `${relativePath} must be a regular file`);
    invariant(metadata.nlink === 1n,
      `${relativePath} must not have multiple hard links`);
    if (require0444) {
      invariant(Number(metadata.mode & 0o777n) === 0o444,
        `${relativePath} must have mode 0444`);
    }
    const contents = await handle.readFile();
    return {
      path: relativePath,
      bytes: contents.length,
      sha256: sha256(contents),
      mode: Number(metadata.mode & 0o777n),
      stat: {
        dev: metadata.dev.toString(),
        ino: metadata.ino.toString(),
        size: metadata.size.toString(),
        mtimeNs: metadata.mtimeNs.toString(),
        ctimeNs: metadata.ctimeNs.toString(),
      },
      contents,
    };
  } finally {
    await handle.close();
  }
}

function sameIdentity(left, right) {
  return sameBinding(left, right) &&
    left?.stat?.dev === right?.stat?.dev &&
    left?.stat?.ino === right?.stat?.ino &&
    left?.stat?.size === right?.stat?.size &&
    left?.stat?.mtimeNs === right?.stat?.mtimeNs &&
    left?.stat?.ctimeNs === right?.stat?.ctimeNs;
}

async function writeNoReplace(
  root,
  relativePath,
  contents,
  {mode = 0o444, createParents = true} = {},
) {
  safeWave2ProjectRelative(relativePath);
  const rootReal = await realpath(root);
  const absolutePath = path.join(rootReal, relativePath);
  if (createParents) await mkdir(path.dirname(absolutePath), {recursive: true});
  await assertRealDirectoryChain(rootReal, path.posix.dirname(relativePath));
  const handle = await open(
    absolutePath,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(contents);
    await handle.sync();
    await handle.chmod(mode);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const observed = await secureReadBinding(rootReal, relativePath, {
    require0444: mode === 0o444,
  });
  invariant(observed.contents.equals(contents),
    `no-replace verification failed: ${relativePath}`);
  return observed;
}

function candidateConsumedProjection(spec, candidate) {
  const boundary = spec.sourceBehaviorBoundary;
  return {
    animationId: spec.animationId,
    sourceSwfSha256: candidate.source.swf.sha256,
    runtime: {
      stage: {
        width: candidate.timeline.stage.width,
        height: candidate.timeline.stage.height,
      },
      fps: candidate.timeline.fps,
      rootFrameCount: candidate.timeline.root.frameCount,
    },
    scripts: {
      random: boundary?.random ?? {occurrences: 0, files: []},
      externalApiCandidateCount:
        boundary?.externalApiCandidateCount ?? 0,
      externalControlEventFiles:
        boundary?.mainFrameDisposition ===
          "source-external-api-confined-to-disabled-control-main-drawing-static-only"
          ? boundary.externalControlEventFiles
          : null,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched: false,
      visualBaselineEstablished: false,
    },
  };
}

function currentSourceAuditProjection(spec, audit) {
  const boundary = spec.sourceBehaviorBoundary;
  const external = audit.machineFindings?.scripts?.externalApiCandidates ?? [];
  const externalControlEventFiles =
    boundary?.mainFrameDisposition ===
      "source-external-api-confined-to-disabled-control-main-drawing-static-only"
      ? external
        .flatMap((candidate) => candidate.files ?? [])
        .sort((left, right) => left.path.localeCompare(right.path, "en"))
      : null;
  return {
    animationId: audit.identity.animationId,
    sourceSwfSha256: audit.provenance.source.swf.sha256,
    runtime: {
      stage: {
        width: audit.machineFindings.runtime.stage.width,
        height: audit.machineFindings.runtime.stage.height,
      },
      fps: audit.machineFindings.runtime.fps,
      rootFrameCount: audit.machineFindings.runtime.rootFrameCount,
    },
    scripts: {
      random: {
        occurrences: audit.machineFindings.scripts.random.occurrences,
        files: audit.machineFindings.scripts.random.files,
      },
      externalApiCandidateCount: external.length,
      externalControlEventFiles,
    },
    evidenceLimits: {
      authoritativeRuntimeLaunched:
        audit.machineFindings.evidenceLimits.authoritativeRuntimeLaunched,
      visualBaselineEstablished:
        audit.machineFindings.evidenceLimits.visualBaselineEstablished,
    },
  };
}

function validateNeutralCandidate(candidate, item) {
  invariant(
    candidate?.schemaVersion === 1 &&
      candidate.reportType === "current-javascript-engineering-candidate" &&
      candidate.animationId === item.animationId,
    `${item.animationId}: candidate identity is invalid`,
  );
  validateFingerprint(candidate, "reportFingerprintSha256",
    `${item.animationId}: candidate`);
  invariant(
    sameBinding(candidate.evidence?.sourceAudit, item.oldAudit),
    `${item.animationId}: candidate does not bind the old audit`,
  );
  invariant(
    candidate.disposition?.currentJavaScriptCandidate === true &&
      candidate.disposition?.strictMigrationComplete === false &&
      candidate.disposition?.publicLibraryAdmitted === false &&
      candidate.disposition?.productionAdmission === false &&
      Object.values(candidate.acceptance ?? {}).every((value) => value === false) &&
      candidate.strictAcceptanceEffect === "none",
    `${item.animationId}: candidate crossed an authority boundary`,
  );
}

function validateCurrentAudit(audit, item) {
  invariant(
    audit?.schemaVersion === 1 &&
      audit.artifactType === "g4-l3-workspace-source-audit" &&
      audit.identity?.animationId === item.animationId,
    `${item.animationId}: current source-audit identity is invalid`,
  );
  validateFingerprint(audit, "artifactFingerprintSha256",
    `${item.animationId}: current source audit`);
  invariant(
    audit.provenance?.materializer?.path ===
      SOURCE_AUDIT_MATERIALIZER.path &&
      audit.provenance.materializer.sha256 ===
        SOURCE_AUDIT_MATERIALIZER.sha256,
    `${item.animationId}: source-audit materializer pin is stale`,
  );
  invariant(
    audit.acceptance?.acceptanceNeutral === true &&
      audit.acceptance?.acceptanceEffect === "none" &&
      audit.acceptance?.migrationStatusChanges === 0 &&
      audit.acceptance?.reviewOrApprovalChanges === 0 &&
      audit.acceptance?.completionLedgerChanges === 0 &&
      audit.acceptance?.lessonPublicationChanges === 0 &&
      audit.acceptance?.originalRuntimeSessions === 0 &&
      Object.values(audit.machineFindings?.evidenceLimits ?? {})
        .every((value) => value === false),
    `${item.animationId}: current source audit is not acceptance-neutral`,
  );
}

async function inspectPhysicalSources(root, item, spec, audit) {
  const result = {};
  for (const kind of ["swf", "fla"]) {
    const specBinding = spec.source?.[kind] ?? null;
    const auditBinding = audit.provenance?.source?.[kind] ?? null;
    if (!specBinding && !auditBinding) {
      result[kind] = null;
      continue;
    }
    invariant(specBinding && auditBinding,
      `${item.animationId}: ${kind} source descriptors disagree`);
    const physical = await secureReadBinding(root, specBinding.path);
    assertBinding(physical, specBinding,
      `${item.animationId}: physical ${kind.toUpperCase()}`);
    invariant(
      sameBinding(auditBinding, specBinding) &&
        auditBinding.physicalHashVerified === true,
      `${item.animationId}: source audit ${kind.toUpperCase()} pin is stale`,
    );
    result[kind] = publicBinding(physical);
  }
  return result;
}

function archivedRelative(transactionId, kind, relativePath) {
  safeWave2ProjectRelative(relativePath);
  return `${TRANSACTIONS_PATH}/${transactionId}/${kind}/${relativePath}`;
}

function transactionIdFor(scriptBinding) {
  return sha256(Buffer.from(stableJson({
    receiptId: RECEIPT_ID,
    writer: publicBinding(scriptBinding),
    candidateGenerator: CANDIDATE_GENERATOR,
    sourceAuditMaterializer: SOURCE_AUDIT_MATERIALIZER,
    protectedBindings: PROTECTED_BINDINGS,
    transitions: WAVE2_SOURCE_AUDIT_TRANSITIONS,
  })));
}

async function inspectPreimage(root, item) {
  const [
    specBinding,
    candidateBinding,
    candidateMarkdownBinding,
    currentAuditBinding,
  ] = await Promise.all([
    secureReadBinding(root, item.specPath),
    secureReadBinding(root, item.reportPath),
    secureReadBinding(root, item.reportMarkdownPath),
    secureReadBinding(root, item.currentAudit.path),
  ]);
  assertBinding(specBinding, item.specPreimage,
    `${item.animationId}: spec preimage`);
  assertBinding(candidateBinding, item.candidatePreimage,
    `${item.animationId}: candidate JSON preimage`);
  assertBinding(candidateMarkdownBinding, item.candidateMarkdownPreimage,
    `${item.animationId}: candidate Markdown preimage`);
  assertBinding(currentAuditBinding, item.currentAudit,
    `${item.animationId}: current source audit`);
  const spec = JSON.parse(specBinding.contents.toString("utf8"));
  const candidate = JSON.parse(candidateBinding.contents.toString("utf8"));
  const audit = JSON.parse(currentAuditBinding.contents.toString("utf8"));
  invariant(
    spec.animationId === item.animationId &&
      sameBinding(spec.evidence?.sourceAudit, item.oldAudit) &&
      !(spec.integrationBindings ?? []).includes(RECEIPT_PATH),
    `${item.animationId}: source-static spec is not at its exact old preimage`,
  );
  invariant(
    spec.outputs?.reportJson === item.reportPath &&
      spec.outputs?.reportMarkdown === item.reportMarkdownPath,
    `${item.animationId}: candidate output paths drifted`,
  );
  validateNeutralCandidate(candidate, item);
  validateCurrentAudit(audit, item);
  const historicalProjection = candidateConsumedProjection(spec, candidate);
  const currentProjection = currentSourceAuditProjection(spec, audit);
  invariant(
    sha256(Buffer.from(stableJson(historicalProjection))) ===
      sha256(Buffer.from(stableJson(currentProjection))),
    `${item.animationId}: candidate-consumed source-audit projection changed`,
  );
  const physicalSources = await inspectPhysicalSources(root, item, spec, audit);
  return {
    item,
    spec,
    specBinding,
    candidate,
    candidateBinding,
    candidateMarkdownBinding,
    audit,
    currentAuditBinding,
    historicalProjection,
    currentProjection,
    physicalSources,
  };
}

function buildReceipt({
  scriptBinding,
  generatorBinding,
  materializerBinding,
  protectedBindings,
  inspections,
}) {
  const transactionId = transactionIdFor(scriptBinding);
  const receipt = {
    schemaVersion: 1,
    receiptType:
      "g4-l3-source-static-source-audit-rebind-wave2-receipt",
    receiptId: RECEIPT_ID,
    transactionId,
    status:
      "verified-acceptance-neutral-second-batch-source-audit-descriptor-rebind",
    scope: {
      memberCount: inspections.length,
      members: inspections.map(({item}) => item.animationId),
      firstBatchV1OrV2ArtifactsMutated: false,
      genericSourceStaticSpecsOnly: true,
      candidateReportsRebuiltByThisTransaction: false,
    },
    rationale:
      "Nineteen generic source-static candidate specs still pinned prior derived workspace source-audit bytes. The exact candidate-consumed semantic projection, physical FLA/SWF identities, and all negative acceptance limits remain unchanged. This transaction changes only the sourceAudit descriptor and adds this receipt binding.",
    candidateGenerator: publicBinding(generatorBinding),
    sourceAuditMaterializer: publicBinding(materializerBinding),
    items: inspections.map((inspection) => ({
      animationId: inspection.item.animationId,
      specPath: inspection.item.specPath,
      transition: {
        from: inspection.item.oldAudit,
        to: inspection.item.currentAudit,
        bytesUnchanged:
          inspection.item.oldAudit.bytes === inspection.item.currentAudit.bytes,
        sha256Changed:
          inspection.item.oldAudit.sha256 !==
            inspection.item.currentAudit.sha256,
      },
      preimages: {
        spec: publicBinding(inspection.specBinding),
        candidateJson: publicBinding(inspection.candidateBinding),
        candidateMarkdown:
          publicBinding(inspection.candidateMarkdownBinding),
        archivedSpecPath: archivedRelative(
          transactionId,
          "spec-preimages",
          inspection.item.specPath,
        ),
        archivedCandidateJsonPath: archivedRelative(
          transactionId,
          "candidate-preimages",
          inspection.item.reportPath,
        ),
        archivedCandidateMarkdownPath: archivedRelative(
          transactionId,
          "candidate-preimages",
          inspection.item.reportMarkdownPath,
        ),
      },
      currentEvidence: {
        sourceAudit: publicBinding(inspection.currentAuditBinding),
        sourceAuditArtifactFingerprintSha256:
          inspection.audit.artifactFingerprintSha256,
        physicalSources: inspection.physicalSources,
      },
      semanticProjection: {
        historical: inspection.historicalProjection,
        current: inspection.currentProjection,
        historicalSha256:
          sha256(Buffer.from(stableJson(inspection.historicalProjection))),
        currentSha256:
          sha256(Buffer.from(stableJson(inspection.currentProjection))),
        equal: true,
      },
    })),
    protectedBefore: protectedBindings.map(publicBinding),
    sourceAssetBoundary: {
      physicalHashesVerified: true,
      sourceAssetWrites: 0,
      sourceAssetsProtectedBy:
        "Exact spec descriptors, current source-audit descriptors, physical-byte reads, and the protected source manifest.",
    },
    specMutationBoundary: {
      allowed:
        "Replace only evidence.sourceAudit with the current descriptor plus this receipt, and append this receipt path exactly once to integrationBindings.",
      receiptDoesNotBindPostSpecWholeFileSha256: true,
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    generatedBy: publicBinding(scriptBinding),
  };
  receipt.receiptFingerprintSha256 =
    fingerprint(receipt, "receiptFingerprintSha256");
  return receipt;
}

export function validateWave2Receipt(receipt) {
  invariant(
    receipt?.schemaVersion === 1 &&
      receipt.receiptType ===
        "g4-l3-source-static-source-audit-rebind-wave2-receipt" &&
      receipt.receiptId === RECEIPT_ID &&
      /^[a-f0-9]{64}$/u.test(receipt.transactionId ?? ""),
    "wave2 receipt identity is invalid",
  );
  validateFingerprint(receipt, "receiptFingerprintSha256", "wave2 receipt");
  invariant(
    receipt.scope?.memberCount === WAVE2_SOURCE_AUDIT_TRANSITIONS.length &&
      receipt.scope?.firstBatchV1OrV2ArtifactsMutated === false &&
      receipt.scope?.genericSourceStaticSpecsOnly === true &&
      receipt.scope?.candidateReportsRebuiltByThisTransaction === false &&
      receipt.items?.length === WAVE2_SOURCE_AUDIT_TRANSITIONS.length,
    "wave2 receipt scope is invalid",
  );
  invariant(
    JSON.stringify(receipt.authorityBoundary) ===
      JSON.stringify(AUTHORITY_BOUNDARY),
    "wave2 receipt crossed an authority boundary",
  );
  invariant(
    sameBinding(receipt.candidateGenerator, CANDIDATE_GENERATOR) &&
      sameBinding(receipt.sourceAuditMaterializer,
        SOURCE_AUDIT_MATERIALIZER),
    "wave2 toolchain binding is stale",
  );
  invariant(
    receipt.protectedBefore?.length === PROTECTED_BINDINGS.length &&
      receipt.protectedBefore.every((binding, index) =>
        sameBinding(binding, PROTECTED_BINDINGS[index])),
    "wave2 protected binding set is stale",
  );
  for (const [index, item] of receipt.items.entries()) {
    const expected = WAVE2_SOURCE_AUDIT_TRANSITIONS[index];
    invariant(
      item.animationId === expected.animationId &&
        item.specPath === expected.specPath &&
        sameBinding(item.transition?.from, expected.oldAudit) &&
        sameBinding(item.transition?.to, expected.currentAudit) &&
        item.transition.bytesUnchanged === true &&
        item.transition.sha256Changed === true &&
        sameBinding(item.preimages?.spec, expected.specPreimage) &&
        sameBinding(item.preimages?.candidateJson,
          expected.candidatePreimage) &&
        sameBinding(item.preimages?.candidateMarkdown,
          expected.candidateMarkdownPreimage) &&
        item.semanticProjection?.equal === true &&
        item.semanticProjection.historicalSha256 ===
          item.semanticProjection.currentSha256 &&
        item.semanticProjection.historicalSha256 ===
          sha256(Buffer.from(stableJson(item.semanticProjection.historical))) &&
        item.semanticProjection.currentSha256 ===
          sha256(Buffer.from(stableJson(item.semanticProjection.current))),
      `${expected.animationId}: wave2 receipt item is invalid`,
    );
  }
  return receipt;
}

function receiptDescriptor(receiptBytes) {
  return {
    path: RECEIPT_PATH,
    bytes: receiptBytes.length,
    sha256: sha256(receiptBytes),
    authority: "acceptance-neutral-source-audit-descriptor-rebind-only",
    strictAcceptanceEffect: "none",
  };
}

function buildPostSpec(spec, item, receiptBinding) {
  const next = structuredClone(spec);
  next.evidence.sourceAudit = {
    ...item.currentAudit,
    rebindReceipt: receiptBinding,
  };
  invariant(!(next.integrationBindings ?? []).includes(RECEIPT_PATH),
    `${item.animationId}: wave2 receipt binding already exists`);
  next.integrationBindings.push(RECEIPT_PATH);
  validateAllowedSpecMutation(spec, next, item, receiptBinding);
  return next;
}

function validateAllowedSpecMutation(before, after, item, receiptBinding) {
  const beforeProjection = structuredClone(before);
  const afterProjection = structuredClone(after);
  delete beforeProjection.evidence.sourceAudit;
  delete afterProjection.evidence.sourceAudit;
  beforeProjection.integrationBindings =
    beforeProjection.integrationBindings.filter((value) =>
      value !== RECEIPT_PATH);
  afterProjection.integrationBindings =
    afterProjection.integrationBindings.filter((value) =>
      value !== RECEIPT_PATH);
  invariant(
    sha256(Buffer.from(stableJson(beforeProjection))) ===
      sha256(Buffer.from(stableJson(afterProjection))),
    `${item.animationId}: spec mutation exceeded the wave2 boundary`,
  );
  invariant(
    sameBinding(after.evidence.sourceAudit, item.currentAudit) &&
      sameBinding(after.evidence.sourceAudit.rebindReceipt, receiptBinding) &&
      after.evidence.sourceAudit.rebindReceipt.authority ===
        receiptBinding.authority &&
      after.evidence.sourceAudit.rebindReceipt.strictAcceptanceEffect ===
        "none" &&
      after.integrationBindings.filter((value) =>
        value === RECEIPT_PATH).length === 1,
    `${item.animationId}: post-spec receipt descriptor is invalid`,
  );
}

async function prepareHistoricalState(root) {
  const [
    scriptBinding,
    generatorBinding,
    materializerBinding,
    ...protectedBindings
  ] = await Promise.all([
    secureReadBinding(root, SCRIPT_RELATIVE_PATH),
    secureReadBinding(root, CANDIDATE_GENERATOR.path),
    secureReadBinding(root, SOURCE_AUDIT_MATERIALIZER.path),
    ...PROTECTED_BINDINGS.map(({path: relativePath}) =>
      secureReadBinding(root, relativePath)),
  ]);
  assertBinding(generatorBinding, CANDIDATE_GENERATOR,
    "current generic candidate generator");
  assertBinding(materializerBinding, SOURCE_AUDIT_MATERIALIZER,
    "current source-audit materializer");
  protectedBindings.forEach((binding, index) =>
    assertBinding(binding, PROTECTED_BINDINGS[index],
      `protected ${PROTECTED_BINDINGS[index].path}`));
  const inspections = [];
  for (const item of WAVE2_SOURCE_AUDIT_TRANSITIONS) {
    inspections.push(await inspectPreimage(root, item));
  }
  const receipt = validateWave2Receipt(buildReceipt({
    scriptBinding,
    generatorBinding,
    materializerBinding,
    protectedBindings,
    inspections,
  }));
  const receiptBytes = Buffer.from(stableJson(receipt));
  const binding = receiptDescriptor(receiptBytes);
  const postSpecs = inspections.map((inspection) => {
    const document = buildPostSpec(
      inspection.spec,
      inspection.item,
      binding,
    );
    return {
      item: inspection.item,
      before: inspection.specBinding,
      document,
      bytes: Buffer.from(stableJson(document)),
    };
  });
  return {
    scriptBinding,
    generatorBinding,
    materializerBinding,
    protectedBindings,
    inspections,
    receipt,
    receiptBytes,
    receiptBinding: binding,
    postSpecs,
  };
}

async function acquireLock(root, transactionId, {recoverStale = false} = {}) {
  const rootReal = await realpath(root);
  const absolute = path.join(rootReal, LOCK_PATH);
  await mkdir(path.dirname(absolute), {recursive: true});
  await assertRealDirectoryChain(rootReal, WORK_ROOT);
  try {
    await mkdir(absolute, {recursive: false});
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!recoverStale) throw new Error("wave2 rebind lock is already held");
    const owner = JSON.parse(
      (await secureReadBinding(rootReal, `${LOCK_PATH}/owner.json`, {
        require0444: true,
      })).contents.toString("utf8"),
    );
    invariant(owner.transactionId === transactionId,
      "foreign wave2 lock transaction ID");
    let alive = true;
    try {
      process.kill(owner.pid, 0);
    } catch (processError) {
      if (processError.code === "ESRCH") alive = false;
      else throw processError;
    }
    invariant(!alive, "wave2 rebind lock owner is still alive");
    await unlink(path.join(absolute, "owner.json"));
    await rmdir(absolute);
    await mkdir(absolute, {recursive: false});
  }
  const owner = await writeNoReplace(
    rootReal,
    `${LOCK_PATH}/owner.json`,
    Buffer.from(stableJson({
      schemaVersion: 1,
      transactionId,
      pid: process.pid,
    })),
    {mode: 0o444, createParents: false},
  );
  return {absolute, transactionId, owner};
}

async function releaseLock(root, lock) {
  if (!lock) return;
  const current = await secureReadBinding(root, `${LOCK_PATH}/owner.json`, {
    require0444: true,
  });
  invariant(sameBinding(current, lock.owner),
    "refusing to release a wave2 lock whose owner changed");
  await unlink(path.join(root, `${LOCK_PATH}/owner.json`));
  await rmdir(lock.absolute);
}

function journalRecord(transactionId, sequence, previousSha256, event, data) {
  const record = {
    schemaVersion: 1,
    transactionId,
    sequence,
    previousRecordSha256: previousSha256,
    event,
    data,
  };
  record.recordFingerprintSha256 =
    fingerprint(record, "recordFingerprintSha256");
  return record;
}

async function appendJournal(root, transactionRoot, state, event, data = {}) {
  const record = journalRecord(
    state.transactionId,
    state.sequence + 1,
    state.previousRecordSha256,
    event,
    data,
  );
  const bytes = Buffer.from(stableJson(record));
  const relativePath =
    `${transactionRoot}/journal/${String(record.sequence).padStart(6, "0")}-${event}.json`;
  const binding = await writeNoReplace(root, relativePath, bytes, {
    mode: 0o444,
  });
  state.sequence = record.sequence;
  state.previousRecordSha256 = binding.sha256;
  return binding;
}

async function readJournal(root, transactionRoot, transactionId) {
  const directory = path.join(root, transactionRoot, "journal");
  if (!await exists(directory)) {
    return {sequence: 0, previousRecordSha256: null, records: []};
  }
  const names = (await readdir(directory)).sort();
  const records = [];
  let previous = null;
  for (const [index, name] of names.entries()) {
    invariant(/^\d{6}-[a-z0-9-]+\.json$/u.test(name),
      `unexpected wave2 journal member: ${name}`);
    const binding = await secureReadBinding(
      root,
      `${transactionRoot}/journal/${name}`,
      {require0444: true},
    );
    const record = JSON.parse(binding.contents.toString("utf8"));
    validateFingerprint(record, "recordFingerprintSha256",
      `wave2 journal ${name}`);
    invariant(
      record.transactionId === transactionId &&
        record.sequence === index + 1 &&
        record.previousRecordSha256 === previous,
      `wave2 journal hash chain is invalid at ${name}`,
    );
    previous = binding.sha256;
    records.push({record, binding});
  }
  return {
    sequence: records.length,
    previousRecordSha256: previous,
    records,
  };
}

async function installSpecCas(root, transactionRoot, postSpec, ordinal) {
  const observed = await secureReadBinding(root, postSpec.item.specPath);
  invariant(sameIdentity(observed, postSpec.before),
    `${postSpec.item.animationId}: spec CAS precondition failed`);
  const temporary =
    `${postSpec.item.specPath}.wave2-rebind-${process.pid}-${ordinal}`;
  await writeNoReplace(root, temporary, postSpec.bytes, {mode: 0o644});
  const quarantine =
    `${transactionRoot}/quarantine/${String(ordinal).padStart(2, "0")}.json`;
  await mkdir(path.dirname(path.join(root, quarantine)), {recursive: true});
  await assertRealDirectoryChain(root, path.posix.dirname(quarantine));
  await rename(
    path.join(root, postSpec.item.specPath),
    path.join(root, quarantine),
  );
  try {
    await link(
      path.join(root, temporary),
      path.join(root, postSpec.item.specPath),
    );
    await unlink(path.join(root, temporary));
    await chmod(path.join(root, quarantine), 0o444);
    const installed = await secureReadBinding(root, postSpec.item.specPath);
    invariant(installed.contents.equals(postSpec.bytes),
      `${postSpec.item.animationId}: installed spec differs`);
    return {quarantine, installed, originalMode: postSpec.before.mode};
  } catch (error) {
    if (await exists(path.join(root, temporary))) {
      await unlink(path.join(root, temporary));
    }
    if (!await exists(path.join(root, postSpec.item.specPath))) {
      await rename(
        path.join(root, quarantine),
        path.join(root, postSpec.item.specPath),
      );
      await chmod(
        path.join(root, postSpec.item.specPath),
        postSpec.before.mode,
      );
    }
    throw error;
  }
}

async function verifyProtected(root, expected = PROTECTED_BINDINGS) {
  for (const binding of expected) {
    assertBinding(
      await secureReadBinding(root, binding.path),
      binding,
      `protected ${binding.path}`,
    );
  }
}

async function rollbackApplied(
  root,
  transactionRoot,
  journal,
  applied,
  receiptBinding,
) {
  const conflicts = [];
  try {
    await appendJournal(root, transactionRoot, journal, "rollback-started", {
      appliedCount: applied.length,
    });
  } catch (error) {
    conflicts.push({path: `${transactionRoot}/journal`, reason: error.message});
  }
  const receiptAbsolute = path.join(root, RECEIPT_PATH);
  if (await exists(receiptAbsolute)) {
    const observed = await secureReadBinding(root, RECEIPT_PATH);
    if (sameBinding(observed, receiptBinding)) {
      const destination = `${transactionRoot}/rollback/canonical-receipt.json`;
      await mkdir(path.dirname(path.join(root, destination)), {recursive: true});
      await rename(receiptAbsolute, path.join(root, destination));
      await chmod(path.join(root, destination), 0o444);
    } else {
      conflicts.push({path: RECEIPT_PATH, reason: "foreign receipt drift"});
    }
  }
  for (const entry of [...applied].reverse()) {
    const target = path.join(root, entry.postSpec.item.specPath);
    const quarantine = path.join(root, entry.quarantine);
    try {
      const current = await secureReadBinding(
        root,
        entry.postSpec.item.specPath,
      );
      if (!current.contents.equals(entry.postSpec.bytes)) {
        conflicts.push({
          path: entry.postSpec.item.specPath,
          reason: "foreign post-spec drift",
        });
        continue;
      }
      const failedPost =
        `${transactionRoot}/rollback/postimages/${entry.postSpec.item.specPath}`;
      await mkdir(path.dirname(path.join(root, failedPost)), {recursive: true});
      await rename(target, path.join(root, failedPost));
      await rename(quarantine, target);
      await chmod(target, entry.originalMode);
      const restored = await secureReadBinding(
        root,
        entry.postSpec.item.specPath,
      );
      invariant(restored.contents.equals(entry.postSpec.before.contents),
        `${entry.postSpec.item.animationId}: rollback verification failed`);
      try {
        await appendJournal(
          root,
          transactionRoot,
          journal,
          "spec-rolled-back",
          {animationId: entry.postSpec.item.animationId},
        );
      } catch (error) {
        conflicts.push({
          path: `${transactionRoot}/journal`,
          reason: error.message,
        });
      }
    } catch (error) {
      conflicts.push({
        path: entry.postSpec.item.specPath,
        reason: error.message,
      });
    }
  }
  if (conflicts.length === 0) {
    await verifyProtected(root);
    await appendJournal(root, transactionRoot, journal, "rollback-complete", {
      restoredCount: applied.length,
    });
    await writeNoReplace(
      root,
      `${transactionRoot}/rollback.json`,
      Buffer.from(stableJson({
        schemaVersion: 1,
        transactionId: journal.transactionId,
        restoredSpecCount: applied.length,
        authorityBoundary: AUTHORITY_BOUNDARY,
      })),
      {mode: 0o444},
    );
  }
  return conflicts;
}

async function verifyPostSpecs(root, receiptBytes) {
  const receiptBinding = receiptDescriptor(receiptBytes);
  for (const item of WAVE2_SOURCE_AUDIT_TRANSITIONS) {
    const spec = JSON.parse(
      (await secureReadBinding(root, item.specPath)).contents.toString("utf8"),
    );
    invariant(
      sameBinding(spec.evidence?.sourceAudit, item.currentAudit) &&
        sameBinding(spec.evidence.sourceAudit.rebindReceipt,
          receiptBinding) &&
        spec.integrationBindings.filter((value) =>
          value === RECEIPT_PATH).length === 1,
      `${item.animationId}: wave2 post-spec receipt binding is stale`,
    );
  }
}

async function validateArchivedPreimages(root, receipt) {
  for (const item of receipt.items) {
    const triples = [
      [item.preimages.archivedSpecPath, item.preimages.spec],
      [item.preimages.archivedCandidateJsonPath,
        item.preimages.candidateJson],
      [item.preimages.archivedCandidateMarkdownPath,
        item.preimages.candidateMarkdown],
    ];
    for (const [archivedPath, expected] of triples) {
      const archived = await secureReadBinding(root, archivedPath, {
        require0444: true,
      });
      assertBinding(
        {...archived, path: expected.path},
        expected,
        `${item.animationId}: archived preimage`,
      );
    }
  }
}

function validateCurrentCandidate(candidate, item, receiptBinding) {
  invariant(
    candidate?.schemaVersion === 1 &&
      candidate.reportType === "current-javascript-engineering-candidate" &&
      candidate.animationId === item.animationId,
    `${item.animationId}: rebuilt candidate identity is invalid`,
  );
  validateFingerprint(candidate, "reportFingerprintSha256",
    `${item.animationId}: rebuilt candidate`);
  invariant(
    sameBinding(candidate.evidence?.sourceAudit, item.currentAudit),
    `${item.animationId}: rebuilt candidate sourceAudit binding is stale`,
  );
  const receiptBindings = candidate.integrationBindings?.filter(
    ({path: bindingPath}) => bindingPath === RECEIPT_PATH,
  ) ?? [];
  const generatorBindings = candidate.integrationBindings?.filter(
    ({path: bindingPath}) => bindingPath === CANDIDATE_GENERATOR.path,
  ) ?? [];
  invariant(
    receiptBindings.length === 1 &&
      sameBinding(receiptBindings[0], receiptBinding) &&
      generatorBindings.length === 1 &&
      sameBinding(generatorBindings[0], CANDIDATE_GENERATOR),
    `${item.animationId}: rebuilt candidate integration binding is stale`,
  );
  invariant(
    candidate.disposition?.currentJavaScriptCandidate === true &&
      candidate.disposition?.strictMigrationComplete === false &&
      candidate.disposition?.publicLibraryAdmitted === false &&
      candidate.disposition?.productionAdmission === false &&
      Object.values(candidate.acceptance ?? {}).every((value) => value === false) &&
      candidate.strictAcceptanceEffect === "none",
    `${item.animationId}: rebuilt candidate crossed an authority boundary`,
  );
}

export async function dryRunWave2SourceAuditRebind({
  root = PROJECT_ROOT,
} = {}) {
  const prepared = await prepareHistoricalState(root);
  return {
    mode: "dry-run",
    itemCount: prepared.inspections.length,
    transactionId: prepared.receipt.transactionId,
    receipt: prepared.receiptBinding,
    protectedCount: prepared.protectedBindings.length,
    physicalSourceBindingCount: prepared.inspections.reduce(
      (sum, item) => sum +
        Number(Boolean(item.physicalSources.swf)) +
        Number(Boolean(item.physicalSources.fla)),
      0,
    ),
    writesPerformed: 0,
    strictAcceptanceEffect: "none",
  };
}

export async function applyWave2SourceAuditRebind({
  root = PROJECT_ROOT,
  hooks = {},
  leaveInterruptedForTest = false,
} = {}) {
  const preview = await prepareHistoricalState(root);
  const transactionId = preview.receipt.transactionId;
  const transactionRoot = `${TRANSACTIONS_PATH}/${transactionId}`;
  invariant(!await exists(path.join(root, transactionRoot)),
    `wave2 transaction replay detected: ${transactionId}`);
  invariant(!await exists(path.join(root, RECEIPT_PATH)),
    "canonical wave2 receipt already exists");
  const lock = await acquireLock(root, transactionId);
  const applied = [];
  let committed = false;
  let journal = {
    transactionId,
    sequence: 0,
    previousRecordSha256: null,
  };
  try {
    const locked = await prepareHistoricalState(root);
    invariant(
      locked.receiptBinding.sha256 === preview.receiptBinding.sha256,
      "wave2 inputs changed between preview and locked preflight",
    );
    await mkdir(path.join(root, TRANSACTIONS_PATH), {recursive: true});
    await assertRealDirectoryChain(root, TRANSACTIONS_PATH);
    await mkdir(path.join(root, transactionRoot), {recursive: false});
    for (const inspection of locked.inspections) {
      const archives = [
        [
          inspection.specBinding,
          archivedRelative(
            transactionId,
            "spec-preimages",
            inspection.item.specPath,
          ),
        ],
        [
          inspection.candidateBinding,
          archivedRelative(
            transactionId,
            "candidate-preimages",
            inspection.item.reportPath,
          ),
        ],
        [
          inspection.candidateMarkdownBinding,
          archivedRelative(
            transactionId,
            "candidate-preimages",
            inspection.item.reportMarkdownPath,
          ),
        ],
      ];
      for (const [source, destination] of archives) {
        await writeNoReplace(root, destination, source.contents, {mode: 0o444});
      }
    }
    const plan = {
      schemaVersion: 1,
      reportType:
        "g4-l3-source-static-source-audit-rebind-wave2-plan",
      transactionId,
      generatedBy: publicBinding(locked.scriptBinding),
      receipt: locked.receiptBinding,
      specPreimages: locked.postSpecs.map(({before}) => ({
        ...publicBinding(before),
        mode: before.mode,
      })),
      specPostimages: locked.postSpecs.map(({item, bytes}) => ({
        path: item.specPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
      })),
      protectedBefore: locked.protectedBindings.map(publicBinding),
      authorityBoundary: AUTHORITY_BOUNDARY,
    };
    plan.planFingerprintSha256 = fingerprint(plan, "planFingerprintSha256");
    await writeNoReplace(
      root,
      `${transactionRoot}/plan.json`,
      Buffer.from(stableJson(plan)),
      {mode: 0o444},
    );
    await appendJournal(root, transactionRoot, journal, "preflight-locked", {
      itemCount: locked.postSpecs.length,
      receipt: locked.receiptBinding,
    });
    for (const [index, postSpec] of locked.postSpecs.entries()) {
      await appendJournal(root, transactionRoot, journal, "spec-cas-intent", {
        animationId: postSpec.item.animationId,
        preimage: publicBinding(postSpec.before),
        postimage: {
          path: postSpec.item.specPath,
          bytes: postSpec.bytes.length,
          sha256: sha256(postSpec.bytes),
        },
      });
      if (hooks.beforeSpecWrite) {
        await hooks.beforeSpecWrite({index, postSpec});
      }
      const installed = await installSpecCas(
        root,
        transactionRoot,
        postSpec,
        index + 1,
      );
      applied.push({...installed, postSpec});
      await appendJournal(root, transactionRoot, journal, "spec-installed", {
        animationId: postSpec.item.animationId,
        installed: publicBinding(installed.installed),
        quarantine: installed.quarantine,
      });
      if (hooks.afterSpecWrite) {
        await hooks.afterSpecWrite({index, postSpec});
      }
    }
    await appendJournal(root, transactionRoot, journal,
      "receipt-publish-intent", {receipt: locked.receiptBinding});
    await writeNoReplace(
      root,
      RECEIPT_PATH,
      locked.receiptBytes,
      {mode: 0o444, createParents: false},
    );
    await appendJournal(root, transactionRoot, journal, "receipt-published", {
      receipt: locked.receiptBinding,
    });
    await verifyProtected(root, locked.protectedBindings);
    await verifyPostSpecs(root, locked.receiptBytes);
    await validateArchivedPreimages(root, locked.receipt);
    await appendJournal(root, transactionRoot, journal,
      "protected-and-postimages-verified", {
        protectedCount: locked.protectedBindings.length,
        itemCount: locked.postSpecs.length,
      });
    const commit = {
      schemaVersion: 1,
      transactionId,
      itemCount: locked.postSpecs.length,
      receipt: locked.receiptBinding,
      finalJournalRecordSha256: journal.previousRecordSha256,
      protectedAfterVerified: true,
      authorityBoundary: AUTHORITY_BOUNDARY,
    };
    commit.commitFingerprintSha256 =
      fingerprint(commit, "commitFingerprintSha256");
    await writeNoReplace(
      root,
      `${transactionRoot}/commit.json`,
      Buffer.from(stableJson(commit)),
      {mode: 0o444},
    );
    committed = true;
    return {
      mode: "apply",
      itemCount: locked.postSpecs.length,
      transactionId,
      receipt: locked.receiptBinding,
      journalRecordCount: journal.sequence,
      candidateReportsRebuilt: 0,
      strictAcceptanceEffect: "none",
    };
  } catch (error) {
    if (leaveInterruptedForTest) throw error;
    const conflicts = await rollbackApplied(
      root,
      transactionRoot,
      journal,
      applied,
      preview.receiptBinding,
    );
    if (conflicts.length > 0) {
      throw new AggregateError(
        [error, ...conflicts.map(({path: conflictPath, reason}) =>
          new Error(`${conflictPath}: ${reason}`))],
        "wave2 source-audit rebind failed and rollback preserved conflicts",
      );
    }
    throw error;
  } finally {
    if (!committed && leaveInterruptedForTest) {
      // Test-only crash simulation intentionally retains lock and journal.
    } else {
      await releaseLock(root, lock);
    }
  }
}

export async function checkWave2SourceAuditRebind({
  root = PROJECT_ROOT,
  requireRebuiltCandidates = true,
} = {}) {
  const [
    receiptFile,
    scriptBinding,
    generatorBinding,
    materializerBinding,
  ] = await Promise.all([
    secureReadBinding(root, RECEIPT_PATH, {require0444: true}),
    secureReadBinding(root, SCRIPT_RELATIVE_PATH),
    secureReadBinding(root, CANDIDATE_GENERATOR.path),
    secureReadBinding(root, SOURCE_AUDIT_MATERIALIZER.path),
  ]);
  assertBinding(generatorBinding, CANDIDATE_GENERATOR,
    "current generic candidate generator");
  assertBinding(materializerBinding, SOURCE_AUDIT_MATERIALIZER,
    "current source-audit materializer");
  const receipt = validateWave2Receipt(
    JSON.parse(receiptFile.contents.toString("utf8")),
  );
  invariant(
    receipt.transactionId === transactionIdFor(scriptBinding) &&
      sameBinding(receipt.generatedBy, scriptBinding),
    "wave2 receipt writer binding is stale",
  );
  const transactionRoot =
    `${TRANSACTIONS_PATH}/${receipt.transactionId}`;
  const [planFile, commitFile] = await Promise.all([
    secureReadBinding(root, `${transactionRoot}/plan.json`, {
      require0444: true,
    }),
    secureReadBinding(root, `${transactionRoot}/commit.json`, {
      require0444: true,
    }),
  ]);
  const plan = JSON.parse(planFile.contents.toString("utf8"));
  const commit = JSON.parse(commitFile.contents.toString("utf8"));
  validateFingerprint(plan, "planFingerprintSha256", "wave2 plan");
  validateFingerprint(commit, "commitFingerprintSha256", "wave2 commit");
  const journal = await readJournal(root, transactionRoot,
    receipt.transactionId);
  invariant(
    plan.transactionId === receipt.transactionId &&
      commit.transactionId === receipt.transactionId &&
      sameBinding(plan.receipt, receiptDescriptor(receiptFile.contents)) &&
      sameBinding(commit.receipt, receiptDescriptor(receiptFile.contents)) &&
      commit.finalJournalRecordSha256 === journal.previousRecordSha256 &&
      commit.protectedAfterVerified === true &&
      JSON.stringify(plan.authorityBoundary) ===
        JSON.stringify(AUTHORITY_BOUNDARY) &&
      JSON.stringify(commit.authorityBoundary) ===
        JSON.stringify(AUTHORITY_BOUNDARY),
    "wave2 plan, journal, or commit binding is stale",
  );
  await verifyProtected(root, receipt.protectedBefore);
  await verifyPostSpecs(root, receiptFile.contents);
  await validateArchivedPreimages(root, receipt);
  const receiptBinding = receiptDescriptor(receiptFile.contents);
  for (const item of WAVE2_SOURCE_AUDIT_TRANSITIONS) {
    const auditBinding = assertBinding(
      await secureReadBinding(root, item.currentAudit.path),
      item.currentAudit,
      `${item.animationId}: current source audit`,
    );
    const audit = JSON.parse(auditBinding.contents.toString("utf8"));
    validateCurrentAudit(audit, item);
    if (requireRebuiltCandidates) {
      const candidate = JSON.parse(
        (await secureReadBinding(root, item.reportPath))
          .contents.toString("utf8"),
      );
      validateCurrentCandidate(candidate, item, receiptBinding);
    }
  }
  return {
    mode: "check",
    itemCount: WAVE2_SOURCE_AUDIT_TRANSITIONS.length,
    transactionId: receipt.transactionId,
    receipt: publicBinding(receiptFile),
    journalRecordCount: journal.sequence,
    rebuiltCandidatesRequired: requireRebuiltCandidates,
    strictAcceptanceEffect: "none",
  };
}

export async function recoverWave2SourceAuditRebind({
  root = PROJECT_ROOT,
  transactionId,
} = {}) {
  invariant(/^[a-f0-9]{64}$/u.test(transactionId ?? ""),
    "--recover requires an exact transaction ID");
  const transactionRoot = `${TRANSACTIONS_PATH}/${transactionId}`;
  invariant(await exists(path.join(root, transactionRoot)),
    "wave2 transaction does not exist");
  invariant(!await exists(path.join(root, `${transactionRoot}/commit.json`)),
    "committed wave2 transaction cannot be recovered");
  invariant(!await exists(path.join(root, `${transactionRoot}/recovered.json`)),
    "recovered wave2 transaction cannot be replayed");
  const lock = await acquireLock(root, transactionId, {recoverStale: true});
  try {
    const planFile = await secureReadBinding(
      root,
      `${transactionRoot}/plan.json`,
      {require0444: true},
    );
    const plan = JSON.parse(planFile.contents.toString("utf8"));
    validateFingerprint(plan, "planFingerprintSha256", "wave2 recovery plan");
    invariant(
      plan.transactionId === transactionId &&
        plan.specPreimages?.length ===
          WAVE2_SOURCE_AUDIT_TRANSITIONS.length &&
        plan.specPostimages?.length ===
          WAVE2_SOURCE_AUDIT_TRANSITIONS.length &&
        plan.protectedBefore?.every((binding, index) =>
          sameBinding(binding, PROTECTED_BINDINGS[index])),
      "wave2 recovery plan scope drifted",
    );
    let journal = await readJournal(root, transactionRoot, transactionId);
    journal = {
      transactionId,
      sequence: journal.sequence,
      previousRecordSha256: journal.previousRecordSha256,
    };
    const analyses = [];
    for (const [index, item] of
      WAVE2_SOURCE_AUDIT_TRANSITIONS.entries()) {
      const preimage = plan.specPreimages[index];
      const postimage = plan.specPostimages[index];
      invariant(
        preimage.path === item.specPath &&
          postimage.path === item.specPath,
        `${item.animationId}: recovery spec scope drifted`,
      );
      const archivedPath = archivedRelative(
        transactionId,
        "spec-preimages",
        item.specPath,
      );
      const archived = await secureReadBinding(root, archivedPath, {
        require0444: true,
      });
      assertBinding({...archived, path: preimage.path}, preimage,
        `${item.animationId}: recovery preimage`);
      const targetAbsolute = path.join(root, item.specPath);
      const target = await exists(targetAbsolute)
        ? await secureReadBinding(root, item.specPath)
        : null;
      const quarantine =
        `${transactionRoot}/quarantine/${String(index + 1).padStart(2, "0")}.json`;
      const quarantineBinding = await exists(path.join(root, quarantine))
        ? await secureReadBinding(root, quarantine, {require0444: true})
        : null;
      const state = target && sameBinding(target, preimage)
        ? "preimage"
        : target && sameBinding(target, postimage)
          ? "postimage"
          : !target && quarantineBinding &&
              sameBinding({...quarantineBinding, path: preimage.path}, preimage)
            ? "missing-target"
            : "foreign";
      invariant(state !== "foreign",
        `${item.animationId}: recovery encountered foreign spec drift`);
      if (state === "postimage") {
        assertBinding(
          {...quarantineBinding, path: preimage.path},
          preimage,
          `${item.animationId}: recovery quarantine`,
        );
      }
      analyses.push({
        item,
        index,
        state,
        preimage,
        target,
        quarantine,
      });
    }
    if (await exists(path.join(root, RECEIPT_PATH))) {
      const receipt = await secureReadBinding(root, RECEIPT_PATH);
      assertBinding(receipt, plan.receipt, "wave2 recovery receipt");
    }
    await verifyProtected(root, plan.protectedBefore);
    await appendJournal(root, transactionRoot, journal, "recovery-started", {
      analyzedSpecCount: analyses.length,
    });
    let restored = 0;
    for (const analysis of analyses.reverse()) {
      if (analysis.state === "preimage") continue;
      const target = path.join(root, analysis.item.specPath);
      const quarantine = path.join(root, analysis.quarantine);
      if (analysis.state === "postimage") {
        const failedPost =
          `${transactionRoot}/recovery/postimages/${analysis.item.specPath}`;
        await mkdir(path.dirname(path.join(root, failedPost)), {
          recursive: true,
        });
        await rename(target, path.join(root, failedPost));
      }
      await rename(quarantine, target);
      await chmod(target, analysis.preimage.mode);
      assertBinding(
        await secureReadBinding(root, analysis.item.specPath),
        analysis.preimage,
        `${analysis.item.animationId}: recovered spec`,
      );
      restored += 1;
      await appendJournal(root, transactionRoot, journal, "spec-recovered", {
        animationId: analysis.item.animationId,
        priorState: analysis.state,
      });
    }
    if (await exists(path.join(root, RECEIPT_PATH))) {
      const destination =
        `${transactionRoot}/recovery/canonical-receipt.json`;
      await mkdir(path.dirname(path.join(root, destination)), {recursive: true});
      await rename(path.join(root, RECEIPT_PATH), path.join(root, destination));
      await chmod(path.join(root, destination), 0o444);
    }
    await verifyProtected(root, plan.protectedBefore);
    await appendJournal(root, transactionRoot, journal, "recovery-complete", {
      restoredSpecCount: restored,
    });
    await writeNoReplace(
      root,
      `${transactionRoot}/recovered.json`,
      Buffer.from(stableJson({
        schemaVersion: 1,
        transactionId,
        restoredSpecCount: restored,
        finalJournalRecordSha256: journal.previousRecordSha256,
        authorityBoundary: AUTHORITY_BOUNDARY,
      })),
      {mode: 0o444},
    );
    return {
      mode: "recover",
      transactionId,
      restoredSpecCount: restored,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await releaseLock(root, lock);
  }
}

export function parseWave2Arguments(argv) {
  const options = {mode: "dry-run", root: PROJECT_ROOT};
  let explicitMode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply", "--check", "--check-specs"]
      .includes(argument)) {
      invariant(!explicitMode, "choose exactly one mode");
      options.mode = argument.slice(2);
      explicitMode = true;
    } else if (argument === "--recover") {
      invariant(!explicitMode, "choose exactly one mode");
      invariant(argv[index + 1], "--recover requires a transaction ID");
      options.mode = "recover";
      options.transactionId = argv[index + 1];
      explicitMode = true;
      index += 1;
    } else if (argument === "--root") {
      invariant(argv[index + 1], "--root requires a value");
      options.root = path.resolve(argv[index + 1]);
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function help() {
  return "Usage: node scripts/rebind-g4-l3-source-static-source-audits-wave2.mjs [--dry-run|--apply|--check-specs|--check|--recover TRANSACTION_ID] [--root PATH]\n";
}

async function main() {
  const options = parseWave2Arguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  let result;
  if (options.mode === "apply") {
    result = await applyWave2SourceAuditRebind(options);
  } else if (options.mode === "check") {
    result = await checkWave2SourceAuditRebind({
      root: options.root,
      requireRebuiltCandidates: true,
    });
  } else if (options.mode === "check-specs") {
    result = await checkWave2SourceAuditRebind({
      root: options.root,
      requireRebuiltCandidates: false,
    });
  } else if (options.mode === "recover") {
    result = await recoverWave2SourceAuditRebind(options);
  } else {
    result = await dryRunWave2SourceAuditRebind(options);
  }
  process.stdout.write(stableJson(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
