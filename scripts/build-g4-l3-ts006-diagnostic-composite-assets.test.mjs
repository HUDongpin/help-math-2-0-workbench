import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildG4L3Ts006DiagnosticCompositeAssets,
  parseArguments,
} from "./build-g4-l3-ts006-diagnostic-composite-assets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("TS006 diagnostic asset CLI is explicit", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    ffdec: "/opt/homebrew/bin/ffdec",
  });
  assert.equal(parseArguments(["--ffdec", "/tmp/ffdec"]).ffdec, "/tmp/ffdec");
  assert.throws(() => parseArguments(["--unknown"]), /unknown argument/);
});

test("TS006 diagnostic assets reproduce from the hash-bound SWF", async () => {
  const manifest = await buildG4L3Ts006DiagnosticCompositeAssets({check: true});
  assert.equal(manifest.animationId, "course-g04-l03-ts-006");
  assert.equal(manifest.assets.length, 17);
  assert.deepEqual(
    manifest.assets.find(({role}) => role === "embedded-bauhaus-font-subset"),
    {
      role: "embedded-bauhaus-font-subset",
      sourceCharacterId: 5,
      file: "bauhaus-md-bt-source-subset.ttf",
      bytes: 8512,
      sha256: "7ff1652d468918619599e09c46a5f27050d5f1c9ff9d19cda12b609fafa464d2",
      family: "Bauhaus Md BT",
      format: "truetype",
    },
  );
  assert.deepEqual(
    manifest.assets.filter(({role}) => role.startsWith("lesson-shell-"))
      .map(({role, sourceCharacterId}) => [role, sourceCharacterId]),
    [
      ["lesson-shell-rewind-up", 591],
      ["lesson-shell-forward-up", 594],
      ["lesson-shell-key-terms-up", 1037],
      ["lesson-shell-map-up", 1046],
      ["lesson-shell-calculator-up", 1057],
      ["lesson-shell-spanish-page-audio-up", 217],
      ["lesson-shell-replay-up", 252],
      ["lesson-shell-play-up", 256],
      ["lesson-shell-pause-up", 260],
      ["lesson-shell-volume-icon-up", 330],
      ["lesson-shell-volume-muted-icon-up", 333],
      ["lesson-shell-next-neutral-up", 340],
      ["lesson-shell-previous-neutral-up", 342],
      ["lesson-shell-volume-slider-source-static", 185],
    ],
  );
  const spanish = manifest.assets.find(({role}) => role === "lesson-shell-spanish-page-audio-up");
  assert.deepEqual(spanish.sourceCanvas, {width: 134, height: 22});
  assert.deepEqual(spanish.sourceCrop, {x: 0, y: 0, width: 134, height: 22});
  assert.deepEqual(spanish.sourceExport, {
    file: "1_up.png",
    bytes: 4328,
    sha256: "c09c0520145112fb3639b132aaed1d7c98bbf678d669cf283ee02cff7291734e",
  });
  assert.equal(spanish.sha256, "166048633c189ba63c057aa00697f44216aab65d00a1f288af94f8b6a3dc58db");
  assert.equal(spanish.sourcePlacement.path[0].instanceName, "SA");
  assert.equal(spanish.sourcePlacement.sourceAction, "_root.doPlaySpanishAudio()");
  const next = manifest.assets.find(({role}) => role === "lesson-shell-next-neutral-up");
  const previous = manifest.assets.find(({role}) => role === "lesson-shell-previous-neutral-up");
  assert.equal(next.sha256, previous.sha256);
  assert.equal(next.sourcePlacement.path[1].transform.scaleX, 0.79998779296875);
  assert.equal(previous.sourcePlacement.path[1].transform.scaleX, -0.79998779296875);
  const slider = manifest.assets.find(({role}) => role === "lesson-shell-volume-slider-source-static");
  assert.equal(slider.sourceKind, "DefineSprite");
  assert.deepEqual(slider.sourcePlacement.children.map(({sourceCharacterId}) => sourceCharacterId),
    [180, 182, 182, 184]);
  assert.equal(slider.sha256, "e098126899d81da32e8cae04e1d363d7722a29eee2fec9e3b25c39a60e605986");
  assert.equal(manifest.tool.version, "JPEXS Free Flash Decompiler v.26.2.1");
  assert.equal(manifest.tool.launcherSha256,
    "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab");
  assert.equal(manifest.tool.ffdecJarSha256,
    "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f");
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.authority.sourceFrameMappingEstablished, false);
  assert.equal(manifest.authority.structuralPlacementMetadataIncluded, true);
  assert.equal(manifest.strictAcceptanceEffect, "none");
  const checked = JSON.parse(await readFile(path.join(ROOT,
    "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets/manifest.json"), "utf8"));
  assert.deepEqual(checked, manifest);
});
