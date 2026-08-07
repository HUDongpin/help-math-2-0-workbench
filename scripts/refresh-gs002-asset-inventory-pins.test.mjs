import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArguments,
  refreshGs002AssetInventoryPins,
  refreshGs002AssetInventoryText,
} from "./refresh-gs002-asset-inventory-pins.mjs";
import {
  GS002_ROOT_STRUCTURAL_PIN_CONTRACT as CONTRACT,
} from "./refresh-gs002-root-structural-inspection-pins.mjs";

const header =
  "asset_id,swf_character_id,library_symbol,type,source_file,source_frame,exported_file,sha256,format,notes";

function fixture(assetSha, dispositionSha) {
  return [
    header,
    `unrelated,,,,,,,${"a".repeat(64)},TXT,unchanged`,
    `ffdec-root-frame-assets,,,,,,,${assetSha},JSON+PNG,root`,
    `root-bilingual-visual-disposition,,,,,,,${dispositionSha},JSON,disposition`,
    "",
  ].join("\n");
}

test("CLI accepts only check/help", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["-h"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown option/);
});

test("refreshes only the paired GS002 CSV SHA cells", () => {
  const prior = fixture(
    CONTRACT.expectedPriorAssetManifestSha256,
    CONTRACT.expectedPriorDispositionSha256,
  );
  const result = refreshGs002AssetInventoryText(prior);
  assert.equal(result.changed, true);
  assert.deepEqual(result.changedAssetIds, [
    "ffdec-root-frame-assets",
    "root-bilingual-visual-disposition",
  ]);
  assert.equal(
    result.updatedText,
    fixture(
      CONTRACT.expectedCurrentAssetManifestSha256,
      CONTRACT.expectedCurrentDispositionSha256,
    ),
  );
  assert.equal(refreshGs002AssetInventoryText(result.updatedText).changed, false);
});

test("rejects split-pair, duplicate-row, and non-target drift", () => {
  assert.throws(
    () => refreshGs002AssetInventoryText(fixture(
      CONTRACT.expectedCurrentAssetManifestSha256,
      CONTRACT.expectedPriorDispositionSha256,
    )),
    /must move as one pair/,
  );
  const duplicate = `${fixture(
    CONTRACT.expectedPriorAssetManifestSha256,
    CONTRACT.expectedPriorDispositionSha256,
  )}ffdec-root-frame-assets,,,,,,,${CONTRACT.expectedPriorAssetManifestSha256},JSON+PNG,duplicate\n`;
  assert.throws(
    () => refreshGs002AssetInventoryText(duplicate),
    /expected exactly one inventory row/,
  );
  assert.throws(
    () => refreshGs002AssetInventoryText(fixture(
      "b".repeat(64),
      CONTRACT.expectedPriorDispositionSha256,
    )),
    /neither the authorized prior value nor the current value/,
  );
});

test("real repository inventory is current and authority validation passes", async () => {
  const result = await refreshGs002AssetInventoryPins({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.changed, false);
});
