import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
  isUnambiguousLoopbackHttpUrl,
} from "./implementation-artifact-closure.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function write(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, value);
  return filePath;
}

async function fixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "implementation-closure-"));
  const animationId = "course-fixture";
  const workspace = path.join(projectRoot, "migrations", animationId);
  await mkdir(workspace, {recursive: true});

  await write(
    projectRoot,
    "apps/web/app/[locale]/animations/[animationId]/page.tsx",
    "import {matchPrototype} from '@helpmath/demos/prototype-manifest'; import {Runtime} from '@/components/runtime'; import {findAnimation} from '@/lib/catalog'; export default function Page() { return Runtime({prototype: matchPrototype({animationId: 'course-fixture', sourcePath: findAnimation('course-fixture')?.source.path})}); }\n",
  );
  await write(projectRoot, "apps/web/lib/catalog.ts", "export function findAnimation(id) { return {animationId: id, source: {path: 'COURSES/L1/FIXTURE.swf'}}; }\n");
  await write(projectRoot, "apps/web/app/[locale]/layout.tsx", "import '../globals.css'; export default function Layout({children}) { return children; }\n");
  await write(projectRoot, "apps/web/app/globals.css", "@import './theme.css'; body { color: #123; }\n");
  await write(projectRoot, "apps/web/app/theme.css", ":root { --fixture: 1; }\n");
  await write(projectRoot, "apps/web/app/flash-assets/[...asset]/route.ts", "export const dynamic = 'force-dynamic';\n");
  await write(projectRoot, "apps/web/components/runtime.tsx", "import {frame} from '@helpmath/demos/runtime'; export const Runtime = frame;\n");
  await write(projectRoot, "packages/demos/src/runtime.ts", "export const frame = 1;\n");
  await write(projectRoot, "packages/demos/src/contract.ts", "export type Animation = {frame: number};\n");
  await write(
    projectRoot,
    "packages/demos/src/prototype-manifest.ts",
    [
      "export type PrototypeKey = 'course-fixture' | 'other';",
      "function runtimeMetadata(frameCount) { return Object.freeze({frameCount}); }",
      "export const prototypeManifest = Object.freeze([",
      "  Object.freeze({key: 'course-fixture', preferredAnimationId: 'course-fixture', sourceBasenames: Object.freeze(['fixture.swf']), runtime: runtimeMetadata(10)}),",
      "  Object.freeze({key: 'other', preferredAnimationId: 'other-animation', sourceBasenames: Object.freeze(['other.swf']), runtime: runtimeMetadata(20)})",
      "]);",
      "function basename(value) { return value.replaceAll('\\\\\\\\', '/').split('/').at(-1)?.toLowerCase() ?? ''; }",
      "export function matchPrototype(input) { const animationId = input.animationId?.toLowerCase(); const sourceBasename = basename(input.sourcePath ?? ''); return prototypeManifest.find((entry) => entry.preferredAnimationId === animationId || entry.key === animationId || entry.sourceBasenames.includes(sourceBasename)); }",
      "",
    ].join("\n"),
  );
  await write(projectRoot, "packages/demos/src/animation-registry.ts", "export {animationModuleLoaders} from './registry.generated';\n");
  await write(
    projectRoot,
    "packages/demos/src/registry.generated.ts",
    "import type {Animation} from './contract'; export type RegistryKey = 'course-fixture' | 'other'; export const animationModuleLoaders: Readonly<Record<string, () => Promise<Animation>>> = Object.freeze({'course-fixture': () => import('./modules/course-fixture'), other: () => import('./modules/other')});\n",
  );
  await write(projectRoot, "packages/demos/prototype-registry.json", `${JSON.stringify({
    schemaVersion: 1,
    entries: [
      {key: "course-fixture", module: "./modules/course-fixture", maturity: "legacy-prototype"},
      {key: "other", module: "./modules/other", maturity: "legacy-prototype"},
    ],
  }, null, 2)}\n`);
  await write(projectRoot, "packages/demos/src/modules/other.tsx", "export const unrelated = 'must-not-enter-selected-closure';\n");
  await write(
    projectRoot,
    "packages/demos/src/modules/course-fixture.tsx",
    "import {state} from '../timelines/course-fixture'; export const asset = '/flash-assets/courses/course-fixture/canvas-renderer.js'; export default state;\n",
  );
  await write(projectRoot, "packages/demos/src/timelines/course-fixture.ts", "export const state = {frame: 1};\n");
  await write(projectRoot, "packages/demos/tests/course-fixture.test.ts", "throw new Error('tests must not affect rendered capture bytes');\n");
  await write(projectRoot, "package.json", "{\"private\":true}\n");
  await write(projectRoot, "apps/web/package.json", "{\"name\":\"fixture-web\"}\n");
  await write(projectRoot, "packages/demos/package.json", "{\"name\":\"fixture-demos\"}\n");
  await write(projectRoot, "catalog/animations.json", `${JSON.stringify({
    schemaVersion: 1,
    summary: {animations: 2},
    animations: [
      {
        animationId,
        assetId: "swf-fixture",
        source: {path: "COURSES/L1/FIXTURE.swf", swf: {stage: {width: 800, height: 600}, fps: 12, frameCount: 10}},
        classification: {titleDisplay: "Fixture"},
      },
      {
        animationId: "unrelated-animation",
        assetId: "swf-unrelated",
        source: {path: "COURSES/L2/OTHER.swf", swf: {stage: {width: 800, height: 600}, fps: 12, frameCount: 20}},
        classification: {titleDisplay: "Unrelated"},
      },
    ],
  }, null, 2)}\n`);

  const canvas = "window.renderFixture = () => 1;\n";
  const atlas = "fixture atlas bytes\n";
  await write(projectRoot, "public/flash-assets/courses/course-fixture/canvas-renderer.js", canvas);
  await write(projectRoot, "public/flash-assets/courses/course-fixture/atlas.png", atlas);
  const publicManifest = {
    generatedFiles: {
      "canvas-renderer.js": {bytes: Buffer.byteLength(canvas), sha256: digest(canvas)},
      "atlas.png": {bytes: Buffer.byteLength(atlas), sha256: digest(atlas)},
    },
  };
  const publicManifestText = `${JSON.stringify(publicManifest, null, 2)}\n`;
  await write(projectRoot, "public/flash-assets/courses/course-fixture/manifest.json", publicManifestText);
  await write(
    workspace,
    "asset-inventory.csv",
    [
      "asset_id,exported_file,sha256",
      `fixture-manifest,public/flash-assets/courses/course-fixture/manifest.json,${digest(publicManifestText)}`,
      "",
    ].join("\n"),
  );
  await write(projectRoot, "source-assets/flash/do-not-bind.swf", "owner source bytes\n");
  await write(projectRoot, "reports/current-javascript-output-human-approval.json", "{\"decision\":\"accepted\"}\n");

  const manifest = {
    animationId,
    implementation: {
      component: "packages/demos/src/modules/course-fixture.tsx",
      timelineModule: "packages/demos/src/timelines/course-fixture.ts",
      testFile: "packages/demos/tests/course-fixture.test.ts",
      routeFile: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
      registryModule: "./modules/course-fixture",
    },
    evidence: {
      assetInventory: "asset-inventory.csv",
      currentJavaScriptImplementationCaptureAdoption: {
        path: "evidence/current-javascript-implementation-capture-adoption.json",
      },
    },
  };
  return {projectRoot, workspace, manifest};
}

async function collect(input) {
  return collectImplementationArtifactClosure(input);
}

test("collects the selected module, transitive shared/registry files, route styles, and inventoried public Canvas assets only", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const closure = await collect(input);
  const paths = new Set(closure.artifacts.map((artifact) => artifact.path));
  for (const expected of [
    "packages/demos/src/modules/course-fixture.tsx",
    "packages/demos/src/timelines/course-fixture.ts",
    "packages/demos/src/runtime.ts",
    "apps/web/app/[locale]/animations/[animationId]/page.tsx",
    "apps/web/lib/catalog.ts",
    "apps/web/app/[locale]/layout.tsx",
    "apps/web/app/globals.css",
    "apps/web/app/theme.css",
    "apps/web/app/flash-assets/[...asset]/route.ts",
    "public/flash-assets/courses/course-fixture/canvas-renderer.js",
    "public/flash-assets/courses/course-fixture/manifest.json",
    "public/flash-assets/courses/course-fixture/atlas.png",
  ]) assert.ok(paths.has(expected), expected);
  for (const excluded of [
    "package.json",
    "apps/web/package.json",
    "packages/demos/package.json",
    "packages/demos/src/modules/other.tsx",
    "packages/demos/src/registry.generated.ts",
    "packages/demos/src/prototype-manifest.ts",
    "packages/demos/prototype-registry.json",
    "catalog/animations.json",
    "packages/demos/tests/course-fixture.test.ts",
    "source-assets/flash/do-not-bind.swf",
    "reports/current-javascript-output-human-approval.json",
  ]) assert.equal(paths.has(excluded), false, excluded);
  assert.deepEqual(closure.projections.map((projection) => projection.path), [
    "apps/web/package.json#selected=render-runtime-v1",
    "catalog/animations.json#selected=course-fixture",
    "package.json#selected=render-runtime-v1",
    "packages/demos/package.json#selected=render-runtime-v1",
    "packages/demos/prototype-registry.json#selected=course-fixture",
    "packages/demos/src/prototype-manifest.ts#selected=course-fixture",
    "packages/demos/src/registry.generated.ts#selected=course-fixture",
  ]);
  assert.deepEqual(implementationArtifactClosureErrors(closure), []);
});

test("package command aliases do not stale captures while render runtime package fields do", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const initial = await collect(input);

  await write(input.projectRoot, "package.json", JSON.stringify({
    private: true,
    scripts: {"audit:new": "node scripts/new-audit.mjs"},
  }));
  const auditAliasEdit = await collect(input);
  assert.equal(auditAliasEdit.aggregateSha256, initial.aggregateSha256);
  assert.deepEqual(implementationArtifactClosureErrors(initial, auditAliasEdit), []);

  await write(input.projectRoot, "package.json", JSON.stringify({
    private: true,
    scripts: {dev: "next dev --turbo", "audit:new": "node scripts/new-audit.mjs"},
  }));
  const devScriptEdit = await collect(input);
  assert.notEqual(devScriptEdit.aggregateSha256, auditAliasEdit.aggregateSha256);
  assert.match(implementationArtifactClosureErrors(auditAliasEdit, devScriptEdit).join("\n"), /stale/);

  await write(input.projectRoot, "package.json", JSON.stringify({
    private: true,
    scripts: {dev: "next dev --turbo"},
    dependencies: {next: "99.0.0"},
  }));
  const dependencyEdit = await collect(input);
  assert.notEqual(dependencyEdit.aggregateSha256, devScriptEdit.aggregateSha256);
});

test("direct module, selected registry routing, and shared-runtime edits stale the aggregate binding", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const initial = await collect(input);
  await write(input.projectRoot, "packages/demos/src/modules/course-fixture.tsx", "export const asset = '/flash-assets/courses/course-fixture/canvas-renderer.js'; export default {frame: 2};\n");
  const directEdit = await collect(input);
  assert.notEqual(directEdit.aggregateSha256, initial.aggregateSha256);
  assert.match(implementationArtifactClosureErrors(initial, directEdit).join("\n"), /stale/);

  await write(
    input.projectRoot,
    "packages/demos/src/registry.generated.ts",
    "export const animationModuleLoaders = Object.freeze({'course-fixture': () => import('./modules/course-fixture').then((module) => module.default), other: () => import('./modules/other')});\n",
  );
  const registryEdit = await collect(input);
  assert.notEqual(registryEdit.aggregateSha256, directEdit.aggregateSha256);

  await write(input.projectRoot, "apps/web/app/theme.css", ":root { --fixture: 2; }\n");
  const sharedEdit = await collect(input);
  assert.notEqual(sharedEdit.aggregateSha256, registryEdit.aggregateSha256);
});

test("unrelated registry, prototype, prototype-registry, and catalog entries do not stale the selected projection", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const initial = await collect(input);

  await write(
    input.projectRoot,
    "packages/demos/src/registry.generated.ts",
    "import type {Animation} from './contract'; export type RegistryKey = 'course-fixture' | 'other' | 'third'; export const animationModuleLoaders: Readonly<Record<string, () => Promise<Animation>>> = Object.freeze({'course-fixture': () => import('./modules/course-fixture'), other: () => import('./modules/other').then((module) => module.default), third: () => import('./modules/third')});\n",
  );
  await write(
    input.projectRoot,
    "packages/demos/src/prototype-manifest.ts",
    [
      "export type PrototypeKey = 'course-fixture' | 'other' | 'third';",
      "function runtimeMetadata(frameCount) { return Object.freeze({frameCount}); }",
      "export const prototypeManifest = Object.freeze([",
      "  Object.freeze({key: 'course-fixture', preferredAnimationId: 'course-fixture', sourceBasenames: Object.freeze(['fixture.swf']), runtime: runtimeMetadata(10)}),",
      "  Object.freeze({key: 'other', preferredAnimationId: 'changed-other', sourceBasenames: Object.freeze(['changed.swf']), runtime: runtimeMetadata(99)}),",
      "  Object.freeze({key: 'third', preferredAnimationId: 'third', sourceBasenames: Object.freeze(['third.swf']), runtime: runtimeMetadata(30)})",
      "]);",
      "function basename(value) { return value.replaceAll('\\\\\\\\', '/').split('/').at(-1)?.toLowerCase() ?? ''; }",
      "export function matchPrototype(input) { const animationId = input.animationId?.toLowerCase(); const sourceBasename = basename(input.sourcePath ?? ''); return prototypeManifest.find((entry) => entry.preferredAnimationId === animationId || entry.key === animationId || entry.sourceBasenames.includes(sourceBasename)); }",
      "",
    ].join("\n"),
  );
  await write(input.projectRoot, "packages/demos/prototype-registry.json", `${JSON.stringify({
    schemaVersion: 1,
    entries: [
      {key: "course-fixture", module: "./modules/course-fixture", maturity: "legacy-prototype"},
      {key: "other", module: "./modules/other-v2", maturity: "strict"},
      {key: "third", module: "./modules/third", maturity: "draft"},
    ],
  }, null, 2)}\n`);
  const catalog = JSON.parse(await readFile(path.join(input.projectRoot, "catalog/animations.json"), "utf8"));
  catalog.summary.animations = 3;
  catalog.animations[1].classification.titleDisplay = "Unrelated revised";
  catalog.animations.push({animationId: "third", source: {path: "THIRD.swf"}});
  await write(input.projectRoot, "catalog/animations.json", `${JSON.stringify(catalog, null, 2)}\n`);

  const current = await collect(input);
  assert.equal(current.aggregateSha256, initial.aggregateSha256);
  assert.deepEqual(implementationArtifactClosureErrors(initial, current), []);
});

test("selected registry/prototype/prototype-registry/catalog changes stale or fail closed", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const initial = await collect(input);

  const catalogPath = path.join(input.projectRoot, "catalog/animations.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  catalog.animations[0].source.path = "COURSES/L1/FIXTURE-REVISED.swf";
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  const catalogEdit = await collect(input);
  assert.notEqual(catalogEdit.aggregateSha256, initial.aggregateSha256);
  await writeFile(catalogPath, `${JSON.stringify({...catalog, animations: [{...catalog.animations[0], source: {...catalog.animations[0].source, path: "COURSES/L1/FIXTURE.swf"}}, ...catalog.animations.slice(1)]}, null, 2)}\n`);

  const registryPath = "packages/demos/src/registry.generated.ts";
  await write(input.projectRoot, registryPath, "export const animationModuleLoaders = Object.freeze({'course-fixture': () => import('./modules/other'), other: () => import('./modules/other')});\n");
  await assert.rejects(collect(input), /registry entry course-fixture remaps/);

  await write(input.projectRoot, registryPath, "export const animationModuleLoaders = Object.freeze({other: () => import('./modules/other')});\n");
  await assert.rejects(collect(input), /exactly one registry entry for course-fixture, found 0/);

  await write(input.projectRoot, registryPath, "export const animationModuleLoaders = Object.freeze({'course-fixture': () => import('./modules/course-fixture'), other: () => import('./modules/other')});\n");
  await write(
    input.projectRoot,
    "packages/demos/src/prototype-manifest.ts",
    "function runtimeMetadata(frameCount) { return {frameCount}; } export const prototypeManifest = Object.freeze([Object.freeze({key: 'course-fixture', preferredAnimationId: 'remapped', sourceBasenames: Object.freeze(['fixture.swf']), runtime: runtimeMetadata(10)})]); export function matchPrototype() { return prototypeManifest[0]; }\n",
  );
  await assert.rejects(collect(input), /remaps preferredAnimationId/);

  await write(input.projectRoot, "packages/demos/prototype-registry.json", `${JSON.stringify({schemaVersion: 1, entries: [{key: "course-fixture", module: "./modules/other"}]})}\n`);
  await assert.rejects(collect(input), /entry course-fixture remaps/);
});

test("a public Canvas byte edit stales the closure even when module bytes do not change", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const initial = await collect(input);
  await write(input.projectRoot, "public/flash-assets/courses/course-fixture/canvas-renderer.js", "window.renderFixture = () => 2;\n");
  await assert.rejects(
    collect(input),
    /renderer inventory SHA-256 .* does not match actual/,
  );

  const publicManifestPath = path.join(input.projectRoot, "public/flash-assets/courses/course-fixture/manifest.json");
  const canvas = "window.renderFixture = () => 2;\n";
  const atlas = "fixture atlas bytes\n";
  const publicManifestText = `${JSON.stringify({
    generatedFiles: {
      "canvas-renderer.js": {bytes: Buffer.byteLength(canvas), sha256: digest(canvas)},
      "atlas.png": {bytes: Buffer.byteLength(atlas), sha256: digest(atlas)},
    },
  }, null, 2)}\n`;
  await writeFile(publicManifestPath, publicManifestText);
  await write(
    input.workspace,
    "asset-inventory.csv",
    `asset_id,exported_file,sha256\nfixture-manifest,public/flash-assets/courses/course-fixture/manifest.json,${digest(publicManifestText)}\n`,
  );
  const current = await collect(input);
  assert.notEqual(current.aggregateSha256, initial.aggregateSha256);
});

test("strict capture origins accept only credential-free loopback HTTP", () => {
  for (const value of [
    "http://localhost:3213/animations/demo",
    "http://127.0.0.1:3000/animations/demo",
    "http://[::1]:3000/animations/demo",
  ]) assert.equal(isUnambiguousLoopbackHttpUrl(value), true, value);
  for (const value of [
    "https://localhost/animations/demo",
    "http://example.test/animations/demo",
    "http://user:secret@127.0.0.1:3000/animations/demo",
    "not a URL",
  ]) assert.equal(isUnambiguousLoopbackHttpUrl(value), false, value);
});

test("rejects a symlink in any selected implementation path component", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  await write(input.projectRoot, "outside/module.tsx", "export default true;\n");
  const linkDirectory = path.join(input.projectRoot, "linked");
  await symlink(path.join(input.projectRoot, "outside"), linkDirectory);
  input.manifest.implementation.component = "linked/module.tsx";
  await assert.rejects(collect(input), /symbolic-link component/);
});
