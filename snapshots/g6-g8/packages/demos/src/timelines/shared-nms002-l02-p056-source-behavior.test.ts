import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {lstatSync, mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {
  P056_SOURCE_BEHAVIOR,
  P056_SOURCE_BUTTONS,
  P056_SOURCE_ACTION_ORDER,
  P056_SOURCE_BUTTON_HIT_SHAPE,
  P056_SOURCE_BUTTON_REVEAL,
  p056PlacedSourceButtonAction,
  p056SourceButtonDisplay,
  p056SourceButtonHitRect,
} from "./shared-nms002-l02-p056-source-behavior";

type FamilyRecord = {
  sourceSha256: string;
  structure: {
    mainFrameDomain: string;
    mainFrameCount: number;
    buttonFirstFrame: number;
  };
  behavior: {
    buttons: Array<{
      characterId: number;
      sourceKeyAttribute: string;
      script: {sha256: string};
    }>;
  };
};

test("P056 behavior constants remain bound to the exact TS03 source audit", () => {
  const audit = JSON.parse(readFileSync(new URL(
    "../../../../catalog/g678-ts03-family-audit-v1.json", import.meta.url,
  ), "utf8")) as {records: FamilyRecord[]};
  const record = audit.records.find(({sourceSha256}) =>
    sourceSha256 === P056_SOURCE_BEHAVIOR.swfSha256);
  assert.ok(record);
  assert.equal(record.structure.mainFrameDomain, P056_SOURCE_BEHAVIOR.teachingFrameDomain);
  assert.equal(record.structure.mainFrameCount, P056_SOURCE_BEHAVIOR.teachingFrameCount);
  assert.equal(record.structure.buttonFirstFrame, P056_SOURCE_BEHAVIOR.firstButtonPlacementFrame);
  assert.deepEqual(record.behavior.buttons.map((button) => ({
    characterId: button.characterId,
    sourceKeyAttribute: button.sourceKeyAttribute,
    actionScriptSha256: button.script.sha256,
  })), P056_SOURCE_BUTTONS);
});

test("P056 keeps the root and teaching frame domains separate", () => {
  assert.equal(P056_SOURCE_BEHAVIOR.rootFrameCount, 10);
  assert.equal(P056_SOURCE_BEHAVIOR.teachingFrameDomain, "sprite-24");
  assert.equal(P056_SOURCE_BEHAVIOR.teachingFrameCount, 234);
});

test("P056 source glossary buttons are placed at sprite frame 9", () => {
  for (const button of P056_SOURCE_BUTTONS) {
    assert.equal(p056PlacedSourceButtonAction(8, button.characterId), null);
    assert.equal(p056PlacedSourceButtonAction(9, button.characterId), button);
  }
  assert.deepEqual(P056_SOURCE_BUTTONS.map(({characterId, sourceKeyAttribute}) =>
    [characterId, sourceKeyAttribute]), [[16, "Organize"], [17, "Information"]]);
  assert.deepEqual(P056_SOURCE_ACTION_ORDER, [
    "set _global.KeyAttribute to the button's sourceKeyAttribute",
    "_root.DoHyperLinks()",
    "_root.animation_mc.animation.stop()",
  ]);
});

test("P056 source action lookup rejects invalid frame identity", () => {
  assert.equal(p056PlacedSourceButtonAction(9, 99), null);
  for (const frame of [0, 235, 1.5, Number.NaN]) {
    assert.throws(() => p056PlacedSourceButtonAction(frame, 16), RangeError);
  }
});

test("P056 buttons fade in over sprite frames 9–17 and persist as placed objects", () => {
  assert.equal(p056SourceButtonDisplay(8, 16), null);
  assert.equal(p056SourceButtonDisplay(8, 17), null);
  assert.deepEqual(P056_SOURCE_BUTTON_REVEAL.map(({frame, alpha256}) =>
    [frame, alpha256]), [
    [9, 0], [10, 32], [11, 64], [12, 96], [13, 128],
    [14, 160], [15, 192], [16, 224], [17, 256],
  ]);
  assert.deepEqual(p056SourceButtonDisplay(9, 16), {
    characterId: 16, alpha256: 0, localXTwips: -2677, localYTwips: -3430,
  });
  assert.deepEqual(p056SourceButtonDisplay(13, 17), {
    characterId: 17, alpha256: 128, localXTwips: 129, localYTwips: -3620,
  });
  assert.deepEqual(p056SourceButtonDisplay(17, 16), {
    characterId: 16, alpha256: 256, localXTwips: -2677, localYTwips: -3830,
  });
  assert.deepEqual(p056SourceButtonDisplay(234, 17), {
    characterId: 17, alpha256: 256, localXTwips: 129, localYTwips: -3820,
  });
  assert.equal(p056SourceButtonDisplay(234, 99), null);
  assert.throws(() => p056SourceButtonDisplay(235, 16), RangeError);
});

test("P056 hitTest rectangles follow the exact source transforms through reveal", () => {
  assert.equal(p056SourceButtonHitRect(8, 16), null);
  assert.equal(p056SourceButtonHitRect(234, 99), null);
  const organize = p056SourceButtonHitRect(17, 16);
  const information = p056SourceButtonHitRect(17, 17);
  assert.ok(organize && information);
  assert.equal(organize.sourceKeyAttribute, "Organize");
  assert.equal(information.sourceKeyAttribute, "Information");
  assert.equal(organize.alpha256, 256);
  assert.equal(information.alpha256, 256);
  assert.ok(Math.abs(organize.width - 91.998) < 0.01);
  assert.equal(information.width, 108.45);
  assert.ok(Math.abs(organize.height - 25.4) < 0.01);
  assert.equal(information.height, 22.4);
  assert.ok(organize.left + organize.width < information.left);
  assert.equal(p056SourceButtonHitRect(9, 16)?.alpha256, 0);
  assert.equal(p056SourceButtonHitRect(9, 16)!.top - organize.top, 20);
  assert.deepEqual(p056SourceButtonHitRect(234, 16), organize);
  assert.deepEqual(p056SourceButtonHitRect(234, 17), information);
  assert.throws(() => p056SourceButtonHitRect(235, 16), RangeError);
});

test("P056 reveal table matches the exact source display list when available", (t) => {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  if (!sourceRoot) { t.skip("real G6–G8 source root required"); return; }
  assert.equal(sourceRoot,
    "/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware");
  const rootStat = lstatSync(sourceRoot);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink());
  const swf = join(sourceRoot, "G6-G8-shared/NMS002/L2/TS/L2TS03.swf");
  assert.equal(createHash("sha256").update(readFileSync(swf)).digest("hex"),
    P056_SOURCE_BEHAVIOR.swfSha256);
  const directory = mkdtempSync(join(tmpdir(), "p056-reveal-source-"));
  try {
    const xmlPath = join(directory, "movie.xml");
    execFileSync("swfmill", ["swf2xml", swf, xmlPath]);
    const xml = readFileSync(xmlPath);
    assert.equal(createHash("sha256").update(xml).digest("hex"),
      "622750694506d4498891795b79b22385f45dfe84d7693f27ef78cc977335b3da");
    const sourceXml = xml.toString("utf8");
    assert.match(sourceXml, /<DefineShape objectID="15">\s*<bounds>\s*<Rectangle left="-1085" right="1084" top="-224" bottom="224"\/>/u);
    assert.match(sourceXml, /<DefineButton2 objectID="16"[\s\S]*?<Button hitTest="1"[^>]*objectID="15"[^>]*>[\s\S]*?<Transform scaleX="0\.8483123779296875" scaleY="1\.133926391601562" transX="0" transY="0"\/>/u);
    assert.match(sourceXml, /<DefineButton2 objectID="17"[\s\S]*?<Button hitTest="1"[^>]*objectID="15"[^>]*>[\s\S]*?<Transform transX="0" transY="0"\/>/u);
    assert.deepEqual(P056_SOURCE_BUTTON_HIT_SHAPE, {
      characterId: 15, leftTwips: -1085, rightTwips: 1084,
      topTwips: -224, bottomTwips: 224,
      organizeScaleX: 0.8483123779296875,
      organizeScaleY: 1.133926391601562,
    });
    const sprite = sourceXml.match(
      /<DefineSprite objectID="24" frames="234">\s*<tags>([\s\S]*?)<\/tags>\s*<\/DefineSprite>/u,
    )?.[1];
    assert.ok(sprite);
    let frame = 1;
    const reveal: Array<{frame: number; depth: number; characterId: number | null;
      xTwips: number; yTwips: number; alpha256: number}> = [];
    for (const [tag] of sprite.matchAll(
      /<ShowFrame\/>|<PlaceObject2\b[\s\S]*?<\/PlaceObject2>|<RemoveObject2?\b[^>]*\/>/gu,
    )) {
      if (tag === "<ShowFrame/>") { frame += 1; continue; }
      const depth = Number(tag.match(/depth="(16|18)"/u)?.[1]);
      if (depth !== 16 && depth !== 18) continue;
      assert.match(tag, /^<PlaceObject2\b/u, "button depth is never removed");
      reveal.push({frame, depth,
        characterId: tag.includes("objectID=") ? Number(tag.match(/objectID="(\d+)"/u)?.[1]) : null,
        xTwips: Number(tag.match(/transX="(-?\d+)"/u)?.[1]),
        yTwips: Number(tag.match(/transY="(-?\d+)"/u)?.[1]),
        alpha256: Number(tag.match(/factorAlpha="(\d+)"/u)?.[1] ?? 256),
      });
    }
    assert.equal(frame - 1, P056_SOURCE_BEHAVIOR.teachingFrameCount);
    assert.equal(reveal.length, 18);
    for (const [index, step] of P056_SOURCE_BUTTON_REVEAL.entries()) {
      assert.deepEqual(reveal[2 * index], {
        frame: step.frame, depth: 16, characterId: index === 0 ? 16 : null,
        xTwips: -2677, yTwips: step.organizeYTwips, alpha256: step.alpha256,
      });
      assert.deepEqual(reveal[2 * index + 1], {
        frame: step.frame, depth: 18, characterId: index === 0 ? 17 : null,
        xTwips: 129, yTwips: step.informationYTwips, alpha256: step.alpha256,
      });
    }
  } finally {
    rmSync(directory, {recursive: true});
  }
});
