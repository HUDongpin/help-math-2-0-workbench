import assert from "node:assert/strict";
import {
  chmod,
  link,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertValidatedLessonAnimateExecutionCodeClosureStillBound,
  buildLessonAnimateExecutionCodeClosureManifest,
  canonicalLessonAnimateExecutionCodeClosureJson,
  getValidatedLessonAnimateExecutionCodeClosureContext,
  getValidatedLessonAnimateReplayLockHelperDescriptor,
  sha256LessonAnimateExecutionCodeClosure,
  validateLessonAnimateExecutionCodeClosureManifest,
} from "./lesson-animate-execution-code-closure.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
} from "./lesson-animate-production-trust.mjs";

const ENTRYPOINT = "scripts/entry.mjs";

async function put(root, relative, contents, mode = 0o644) {
  const target = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, contents);
  await chmod(target, mode);
  return target;
}

async function fixture(t, entrySource = `
  import "node:fs";
  import {a} from "./lib/a.mjs";
  export {b} from "./lib/b.mjs";
  const decoys = ["import('ignored.mjs')", /require\\("ignored"\\)/u];
  const template = \`sum=\${a + 2}\`;
  export {decoys, template};
`) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "l10-execution-code-closure-"));
  const root = await realpath(temporary);
  t.after(async () => rm(root, {recursive: true, force: true}));
  await put(root, ENTRYPOINT, entrySource);
  await put(root, "scripts/lib/a.mjs", `
    import {c} from "../shared/c.mjs";
    export const a = c + 1;
  `);
  await put(root, "scripts/lib/b.mjs", "export const b = 4;\n");
  await put(root, "scripts/shared/c.mjs", "export const c = 3;\n");
  await put(root, "tools/animate-export.jsfl", "fl.trace('fixture');\n");
  const replayLockHelper = await put(root, "tools/replay-lock-helper.mjs",
    "#!/usr/bin/env node\nprocess.exit(0);\n", 0o755);
  const animateExecutable = await put(root, "tools/fake-animate",
    "#!/bin/sh\nexit 0\n", 0o755);
  return {
    root,
    replayLockHelper,
    animateExecutable,
    toolchain: {
      aclProbe: await realpath("/bin/ls"),
      nodeExecutable: await realpath(process.execPath),
      processProbe: await realpath("/bin/ps"),
      jsfl: "tools/animate-export.jsfl",
      animateExecutable,
      replayLockHelper: "tools/replay-lock-helper.mjs",
    },
  };
}

function build(fix) {
  return buildLessonAnimateExecutionCodeClosureManifest({
    projectRoot: fix.root,
    entrypoint: ENTRYPOINT,
    toolchain: fix.toolchain,
  });
}

test("builds and validates a deterministic nested static-ESM closure", async (t) => {
  const fix = await fixture(t);
  const manifest = await build(fix);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.releaseId, "lesson-g04-l10-perimeter-area");
  assert.equal(manifest.replayLockHelperAuthority, "diagnostic-project-fixture");
  assert.deepEqual(manifest.modules.map(({file}) => file), [
    "scripts/entry.mjs",
    "scripts/lib/a.mjs",
    "scripts/lib/b.mjs",
    "scripts/shared/c.mjs",
  ]);
  assert.deepEqual(manifest.modules[0].imports, ["scripts/lib/a.mjs", "scripts/lib/b.mjs"]);
  assert.deepEqual(manifest.modules[1].imports, ["scripts/shared/c.mjs"]);
  for (const module of manifest.modules) {
    assert.deepEqual(Object.keys(module), ["file", "sha256", "bytes", "mode", "imports"]);
    assert.match(module.sha256, /^[a-f0-9]{64}$/u);
    assert.match(module.mode, /^[0-7]{4}$/u);
  }
  assert.deepEqual(Object.values(manifest.authorityBoundary),
    Array(Object.keys(manifest.authorityBoundary).length).fill(false));
  assert.equal(manifest.toolchain.aclProbe.file, await realpath("/bin/ls"));
  assert.equal(manifest.toolchain.nodeExecutable.file, await realpath(process.execPath));
  assert.equal(manifest.toolchain.processProbe.file, await realpath("/bin/ps"));
  assert.equal(manifest.toolchain.jsfl.file, "tools/animate-export.jsfl");
  assert.equal(manifest.toolchain.animateExecutable.file, fix.animateExecutable);
  assert.equal(manifest.toolchain.replayLockHelper.file, "tools/replay-lock-helper.mjs");

  const canonical = canonicalLessonAnimateExecutionCodeClosureJson(manifest);
  assert.equal(canonical, canonicalLessonAnimateExecutionCodeClosureJson(structuredClone(manifest)));
  assert.match(sha256LessonAnimateExecutionCodeClosure(manifest), /^[a-f0-9]{64}$/u);

  const token = await validateLessonAnimateExecutionCodeClosureManifest({
    projectRoot: fix.root,
    manifest,
  });
  assert.equal(token.ok, true);
  assert.equal(token.moduleCount, 4);
  const context = getValidatedLessonAnimateExecutionCodeClosureContext(token);
  assert.equal(context.projectRoot, fix.root);
  assert.equal(context.productionReplayLockHelperBound, false);
  assert.deepEqual(context.replayLockHelperDescriptor, manifest.toolchain.replayLockHelper);
  assert.deepEqual(getValidatedLessonAnimateReplayLockHelperDescriptor(token),
    manifest.toolchain.replayLockHelper);
  const reboundToken = await assertValidatedLessonAnimateExecutionCodeClosureStillBound(token);
  assert.equal(reboundToken.stillBound, true);
  assert.equal(getValidatedLessonAnimateExecutionCodeClosureContext(reboundToken)
    .productionReplayLockHelperBound, false);
  assert.deepEqual(getValidatedLessonAnimateReplayLockHelperDescriptor(reboundToken),
    manifest.toolchain.replayLockHelper);
  assert.throws(() => getValidatedLessonAnimateExecutionCodeClosureContext({...token}),
    /absent, stale, or forged/u);
});

test("validation rejects a dependency changed after manifest construction", async (t) => {
  const fix = await fixture(t);
  const manifest = await build(fix);
  await put(fix.root, "scripts/shared/c.mjs", "export const c = 9;\n");
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /does not exactly match/u,
  );
});

test("validation rejects a newly reachable dependency absent from the manifest", async (t) => {
  const fix = await fixture(t, "export const initial = true;\n");
  const manifest = await build(fix);
  await put(fix.root, "scripts/new-dependency.mjs", "export const added = true;\n");
  await put(fix.root, ENTRYPOINT, `
    import {added} from "./new-dependency.mjs";
    export const initial = added;
  `);
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /does not exactly match/u,
  );
});

test("rejects dynamic import including inside a template expression", async (t) => {
  const fix = await fixture(t, "export const value = `${import('./lib/a.mjs')}`;\n");
  await assert.rejects(build(fix), /dynamic import\(\)/u);
});

test("does not let division after postfix or template expressions hide dynamic import", async (t) => {
  await t.test("postfix division", async (child) => {
    const fix = await fixture(child, `
      let numerator = 4;
      export const value = numerator++ / 2 + import('./lib/a.mjs') / 3;
    `);
    await assert.rejects(build(fix), /dynamic import\(\)/u);
  });
  await t.test("template division", async (child) => {
    const fix = await fixture(child, `
      export const value = \`4\` / 2 + import('./lib/a.mjs') / 3;
    `);
    await assert.rejects(build(fix), /dynamic import\(\)/u);
  });
});

test("does not let a regex expression after a control header hide dynamic import", async (t) => {
  const fix = await fixture(t, `
    if (true) /allowed-pattern+/.test('allowed-pattern');
    export const value = import('./lib/a.mjs');
  `);
  await assert.rejects(build(fix), /dynamic import\(\)/u);
});

test("rejects URL-percent-encoded static import paths", async (t) => {
  const fix = await fixture(t, "import './%2e%2e/outside.mjs';\n");
  await assert.rejects(build(fix), /must not use URL percent-encoding/u);
});

test("rejects require calls", async (t) => {
  const fix = await fixture(t, "const value = require('./lib/a.mjs'); export {value};\n");
  await assert.rejects(build(fix), /uses require\(\)/u);
});

test("rejects createRequire and Node module-loader escape hatches", async (t) => {
  await t.test("named createRequire", async (child) => {
    const fix = await fixture(child, `
      import {createRequire} from 'node:module';
      const require = createRequire(import.meta.url);
      require('./lib/a.mjs');
    `);
    await assert.rejects(build(fix), /createRequire|outside the execution allowlist/u);
  });
  await t.test("aliased createRequire", async (child) => {
    const fix = await fixture(child, `
      import {createRequire as cr} from 'node:module';
      const localRequire = cr(import.meta.url);
      localRequire('./lib/a.mjs');
    `);
    await assert.rejects(build(fix), /outside the execution allowlist/u);
  });
  await t.test("module.createRequire", async (child) => {
    const fix = await fixture(child, `
      import module from 'node:module';
      const localRequire = module.createRequire(import.meta.url);
      localRequire('./lib/a.mjs');
    `);
    await assert.rejects(build(fix), /createRequire|outside the execution allowlist/u);
  });
  await t.test("process.getBuiltinModule", async (child) => {
    const fix = await fixture(child, `
      const moduleBuiltin = process.getBuiltinModule('module');
      moduleBuiltin.createRequire(import.meta.url)('./lib/a.mjs');
    `);
    await assert.rejects(build(fix), /process\.getBuiltinModule\(\)/u);
  });
  await t.test("module.register", async (child) => {
    const fix = await fixture(child, "module.register('./lib/a.mjs', import.meta.url);\n");
    await assert.rejects(build(fix), /module\.register\(\)/u);
  });
  await t.test("node:vm", async (child) => {
    const fix = await fixture(child, "import vm from 'node:vm'; export {vm};\n");
    await assert.rejects(build(fix), /outside the execution allowlist/u);
  });
  await t.test("node:worker_threads", async (child) => {
    const fix = await fixture(child,
      "import {Worker} from 'node:worker_threads'; export {Worker};\n");
    await assert.rejects(build(fix), /outside the execution allowlist/u);
  });
});

test("rejects bare packages, absolute imports, and local file URLs", async (t) => {
  await t.test("bare package", async (child) => {
    const fix = await fixture(child, "import value from 'left-pad'; export {value};\n");
    await assert.rejects(build(fix), /bare package/u);
  });
  await t.test("absolute path", async (child) => {
    const fix = await fixture(child, "import '/tmp/outside.mjs';\n");
    await assert.rejects(build(fix), /absolute path/u);
  });
  await t.test("local file URL", async (child) => {
    const fix = await fixture(child, "import 'file:///tmp/outside.mjs';\n");
    await assert.rejects(build(fix), /local file URL/u);
  });
});

test("rejects an unresolved project-relative dependency", async (t) => {
  const fix = await fixture(t, "import './missing.mjs';\n");
  await assert.rejects(build(fix), (error) => error?.code === "ENOENT");
});

test("rejects a symlinked module", async (t) => {
  const fix = await fixture(t, "import './linked.mjs';\n");
  await put(fix.root, "scripts/real.mjs", "export const real = true;\n");
  await symlink("real.mjs", path.join(fix.root, "scripts/linked.mjs"));
  await assert.rejects(build(fix), /ordinary file/u);
});

test("rejects a hard-linked module", async (t) => {
  const fix = await fixture(t, "import './linked.mjs';\n");
  const source = await put(fix.root, "scripts/real.mjs", "export const real = true;\n");
  await link(source, path.join(fix.root, "scripts/linked.mjs"));
  await assert.rejects(build(fix), /exactly one physical link/u);
});

test("rejects an import that escapes projectRoot", async (t) => {
  const fix = await fixture(t, "import '../../outside.mjs';\n");
  await assert.rejects(build(fix), /escapes project root/u);
});

test("validation rejects a mismatched Node tool binding", async (t) => {
  const fix = await fixture(t);
  const manifest = structuredClone(await build(fix));
  manifest.toolchain.nodeExecutable.file = fix.animateExecutable;
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /does not identify the running Node.js binary/u,
  );
});

test("validation rejects a mismatched ACL probe binding", async (t) => {
  const fix = await fixture(t);
  const manifest = structuredClone(await build(fix));
  manifest.toolchain.aclProbe.file = fix.animateExecutable;
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /aclProbe must identify \/bin\/ls/u,
  );
});

test("rejects every absolute replay helper except the fixed production path", async (t) => {
  const fix = await fixture(t);
  fix.toolchain.replayLockHelper = fix.animateExecutable;
  await assert.rejects(build(fix), /must be the fixed production helper path/u);
});

test("fixed production replay helper path fails closed while unprovisioned", async (t) => {
  const fix = await fixture(t);
  fix.toolchain.replayLockHelper = LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH;
  await assert.rejects(build(fix), (error) => error?.code === "ENOENT");
});

test("validation rejects replay helper authority profile tampering", async (t) => {
  const fix = await fixture(t);
  const manifest = structuredClone(await build(fix));
  manifest.replayLockHelperAuthority = "fixed-root-owned-production";
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /does not exactly match/u,
  );
});

test("validation rejects any authority escalation", async (t) => {
  const fix = await fixture(t);
  const manifest = structuredClone(await build(fix));
  manifest.authorityBoundary.ownerAcceptance = true;
  await assert.rejects(
    validateLessonAnimateExecutionCodeClosureManifest({projectRoot: fix.root, manifest}),
    /fixed all-false boundary/u,
  );
});

test("still-bound assertion rejects replay helper drift after validation", async (t) => {
  const fix = await fixture(t);
  const manifest = await build(fix);
  const token = await validateLessonAnimateExecutionCodeClosureManifest({
    projectRoot: fix.root,
    manifest,
  });
  await put(fix.root, "tools/replay-lock-helper.mjs",
    "#!/usr/bin/env node\nprocess.exit(7);\n", 0o755);
  await assert.rejects(
    assertValidatedLessonAnimateExecutionCodeClosureStillBound(token),
    /no longer physically bound/u,
  );
});
