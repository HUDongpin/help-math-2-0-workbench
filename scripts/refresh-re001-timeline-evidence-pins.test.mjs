import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  atomicCasWriteRe001TimelinePlan,
  parseArguments,
  planRe001TimelineEvidencePinRefresh,
  redactRe001TimelineEvidencePins,
  refreshRe001TimelineEvidencePins,
} from "./refresh-re001-timeline-evidence-pins.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const animationId = "course-g03-l08-re-001";
const sourceSwf =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L8/RE/L8RE01.swf";
const sourceSwfSha256 = "e4a6403f6b45a3b4aecb48e0659aa20113acb0644e37b027a19fb51f34417f9b";
const timelinePath = "packages/demos/src/timelines/course-g03-l08-re-001.ts";
const evidencePaths = {
  scenarioInventorySha256: "migrations/course-g03-l08-re-001/audit/scenario-inventory.json",
  strictReadinessSha256: "migrations/course-g03-l08-re-001/audit/strict-readiness.json",
  audioAuditSha256: "migrations/course-g03-l08-re-001/audit/audio-runtime-evidence.json",
};

async function writeProjectFile(root, relative, bytes) {
  const file = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  return file;
}

function timelineText({
  scenario = "1".repeat(64),
  readiness = "2".repeat(64),
  audio = "3".repeat(64),
  extra = "",
} = {}) {
  return `import type { RuntimeContext } from '../contract';\n\n`
    + `export const COURSE_G03_L08_RE_001_SOURCE = Object.freeze({\n`
    + `  swf: '${sourceSwf}',\n`
    + `  swfSha256: '${sourceSwfSha256}',\n`
    + `  scenarioInventorySha256: '${scenario}',\n`
    + `  strictReadinessSha256: '${readiness}',\n`
    + `  audioAuditSha256: '${audio}',\n`
    + `  rootBeginFrame: 51\n`
    + `});\n`
    + `${extra}`
    + `export const COURSE_G03_L08_RE_001_RUNTIME = Object.freeze({frameCount: 55});\n`
    + `export function unchangedSemantics(_context: RuntimeContext) { return 51; }\n`;
}

function documents() {
  return {
    scenarioInventorySha256: {
      schemaVersion: 1,
      animationId,
      inventoryStatus: "static-exhaustive-runtime-unverified",
      source: {swf: sourceSwf, swfSha256: sourceSwfSha256},
    },
    strictReadinessSha256: {
      schemaVersion: 2,
      evidenceKind: "course-shell-strict-readiness",
      animationId,
      generatedBy: {
        script: "scripts/build-course-strict-readiness.mjs",
        deterministic: true,
      },
      source: {
        swf: sourceSwf,
        swfSha256: sourceSwfSha256,
        sourceHashVerified: true,
      },
    },
    audioAuditSha256: {
      schemaVersion: 2,
      animationId,
      generatedBy: "scripts/audit-pilot-audio.mjs",
      source: {
        swf: sourceSwf,
        expectedSha256: sourceSwfSha256,
        observedSha256: sourceSwfSha256,
        hashMatches: true,
      },
    },
  };
}

async function createFixture({timeline = timelineText(), mutateDocument} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "re001-timeline-pins-"));
  const timelineFile = await writeProjectFile(root, timelinePath, timeline);
  const values = documents();
  mutateDocument?.(values);
  const evidence = {};
  for (const [property, document] of Object.entries(values)) {
    const bytes = `${JSON.stringify(document, null, 2)}\n`;
    const file = await writeProjectFile(root, evidencePaths[property], bytes);
    evidence[property] = {file, sha256: hash(bytes)};
  }
  const approvalFile = await writeProjectFile(
    root,
    "reports/current-javascript-output-human-approval.json",
    '{"approval":"must remain unchanged"}\n',
  );
  const contract = {
    animationId,
    sourceSwf,
    sourceSwfSha256,
    timelinePath,
    bindings: [
      {
        property: "scenarioInventorySha256",
        evidencePath: evidencePaths.scenarioInventorySha256,
        schemaVersion: 1,
        evidenceKind: "scenario-inventory",
      },
      {
        property: "strictReadinessSha256",
        evidencePath: evidencePaths.strictReadinessSha256,
        schemaVersion: 2,
        evidenceKind: "course-shell-strict-readiness",
      },
      {
        property: "audioAuditSha256",
        evidencePath: evidencePaths.audioAuditSha256,
        schemaVersion: 2,
        evidenceKind: "pilot-audio-runtime-evidence",
      },
    ],
  };
  return {root, timelineFile, timeline, evidence, approvalFile, contract};
}

test("CLI accepts only check and help", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--id", animationId]), /Unknown option/);
});

test("refreshes exactly three current raw evidence hashes and preserves all other source bytes", async () => {
  const fixture = await createFixture();
  const approvalBefore = await readFile(fixture.approvalFile);
  const before = await readFile(fixture.timelineFile, "utf8");
  const result = await refreshRe001TimelineEvidencePins({
    root: fixture.root,
    contract: fixture.contract,
  });
  assert.equal(result.action, "written");
  assert.deepEqual(
    result.changedProperties,
    ["scenarioInventorySha256", "strictReadinessSha256", "audioAuditSha256"],
  );
  assert.match(result.approvalEffect, /approval remains stale/i);

  const after = await readFile(fixture.timelineFile, "utf8");
  assert.equal(
    redactRe001TimelineEvidencePins(after, fixture.contract),
    redactRe001TimelineEvidencePins(before, fixture.contract),
  );
  for (const [property, evidence] of Object.entries(fixture.evidence)) {
    assert.match(after, new RegExp(`${property}: '${evidence.sha256}'`));
  }
  assert.deepEqual(await readFile(fixture.approvalFile), approvalBefore);

  const checked = await refreshRe001TimelineEvidencePins({
    root: fixture.root,
    contract: fixture.contract,
    check: true,
  });
  assert.equal(checked.action, "verified");
  assert.equal(checked.changed, false);
});

test("check mode reports stale without writing", async () => {
  const fixture = await createFixture();
  const before = await readFile(fixture.timelineFile);
  await assert.rejects(
    refreshRe001TimelineEvidencePins({
      root: fixture.root,
      contract: fixture.contract,
      check: true,
    }),
    /timeline evidence pins are stale/,
  );
  assert.deepEqual(await readFile(fixture.timelineFile), before);
});

test("an already current timeline is unchanged", async () => {
  const fixture = await createFixture();
  const current = timelineText({
    scenario: fixture.evidence.scenarioInventorySha256.sha256,
    readiness: fixture.evidence.strictReadinessSha256.sha256,
    audio: fixture.evidence.audioAuditSha256.sha256,
  });
  await writeFile(fixture.timelineFile, current);
  const result = await refreshRe001TimelineEvidencePins({
    root: fixture.root,
    contract: fixture.contract,
  });
  assert.equal(result.action, "unchanged");
  assert.equal(await readFile(fixture.timelineFile, "utf8"), current);
});

test("CAS refuses to overwrite a timeline changed after preflight", async () => {
  const fixture = await createFixture();
  const plan = await planRe001TimelineEvidencePinRefresh({
    root: fixture.root,
    contract: fixture.contract,
  });
  const concurrent = `${fixture.timeline}// concurrent semantic change\n`;
  await writeFile(fixture.timelineFile, concurrent);
  await assert.rejects(
    atomicCasWriteRe001TimelinePlan(plan),
    /changed after preflight/,
  );
  assert.equal(await readFile(fixture.timelineFile, "utf8"), concurrent);
});

test("CAS refuses evidence changed after preflight", async () => {
  const fixture = await createFixture();
  const plan = await planRe001TimelineEvidencePinRefresh({
    root: fixture.root,
    contract: fixture.contract,
  });
  await writeFile(
    fixture.evidence.audioAuditSha256.file,
    '{"animationId":"mutated-after-preflight"}\n',
  );
  await assert.rejects(
    atomicCasWriteRe001TimelinePlan(plan),
    /evidence changed after preflight/,
  );
  assert.equal(await readFile(fixture.timelineFile, "utf8"), fixture.timeline);
});

test("rejects timeline and evidence symlinks, including path escapes", async (t) => {
  await t.test("timeline symlink", async () => {
    const fixture = await createFixture();
    const realTimeline = `${fixture.timelineFile}.real`;
    await writeFile(realTimeline, fixture.timeline);
    await writeFile(fixture.timelineFile, "");
    await import("node:fs/promises").then(({unlink}) => unlink(fixture.timelineFile));
    await symlink(realTimeline, fixture.timelineFile);
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /symbolic links are forbidden/,
    );
  });

  await t.test("evidence symlink escape", async () => {
    const fixture = await createFixture();
    const target = path.join(await mkdtemp(path.join(os.tmpdir(), "re001-external-")), "scenario.json");
    await writeFile(target, `${JSON.stringify(documents().scenarioInventorySha256)}\n`);
    await import("node:fs/promises").then(({unlink}) =>
      unlink(fixture.evidence.scenarioInventorySha256.file));
    await symlink(target, fixture.evidence.scenarioInventorySha256.file);
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /symbolic links are forbidden/,
    );
  });
});

test("rejects source shape drift and any fourth or duplicate binding", async (t) => {
  await t.test("duplicate binding", async () => {
    const fixture = await createFixture({
      timeline: timelineText({
        extra: `  scenarioInventorySha256: '${"4".repeat(64)}',\n`,
      }),
    });
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /expected exactly one canonical SHA-256 literal/,
    );
  });

  await t.test("noncanonical literal", async () => {
    const fixture = await createFixture({
      timeline: timelineText({scenario: "not-a-hash"}),
    });
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /expected exactly one canonical SHA-256 literal/,
    );
  });

  await t.test("contract contains a fourth binding", async () => {
    const fixture = await createFixture();
    const contract = {
      ...fixture.contract,
      bindings: [...fixture.contract.bindings, fixture.contract.bindings[0]],
    };
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({root: fixture.root, contract}),
      /exactly three bindings/,
    );
  });

  await t.test("contract redirects an allowlisted property", async () => {
    const fixture = await createFixture();
    const contract = {
      ...fixture.contract,
      bindings: fixture.contract.bindings.map((binding, index) =>
        index === 0
          ? {...binding, evidencePath: "migrations/course-g03-l08-re-001/audit/other.json"}
          : binding),
    };
    await assert.rejects(
      planRe001TimelineEvidencePinRefresh({root: fixture.root, contract}),
      /evidence path changed/,
    );
  });
});

test("rejects evidence identity, schema, generator, and source drift", async (t) => {
  const cases = [
    ["animation identity", (values) => {
      values.scenarioInventorySha256.animationId = "other-animation";
    }, /animation identity changed/],
    ["schema", (values) => {
      values.strictReadinessSha256.schemaVersion = 1;
    }, /schema version changed/],
    ["readiness generator", (values) => {
      values.strictReadinessSha256.generatedBy.script = "scripts/other.mjs";
    }, /generator identity changed/],
    ["audio source", (values) => {
      values.audioAuditSha256.source.hashMatches = false;
    }, /source identity changed/],
  ];
  for (const [name, mutation, expected] of cases) {
    await t.test(name, async () => {
      const fixture = await createFixture({mutateDocument: mutation});
      await assert.rejects(
        planRe001TimelineEvidencePinRefresh({
          root: fixture.root,
          contract: fixture.contract,
        }),
        expected,
      );
    });
  }
});
