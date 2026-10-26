import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";
import {G678_ALG_L11_P034_SOURCE_REVEAL as SOURCE} from "../src/generated/g678-alg-l11-p034-source-reveal-v1";
import {algL11P034RevealedTile} from "../src/g678-alg-l11-p034-source-reveal";

test("all 24 card cells reveal their authored tile only after their pair is matched",()=>{
  assert.equal(SOURCE.tiles.length,24);
  assert.equal(new Set(SOURCE.tiles.map(tile=>tile.cardId)).size,24);
  for(const tile of SOURCE.tiles){
    assert.equal(algL11P034RevealedTile(tile.cardId,[]),null);
    assert.equal(algL11P034RevealedTile(tile.cardId,[tile.pairId%6+1]),null);
    const result=algL11P034RevealedTile(tile.cardId,[tile.pairId])!;
    assert.match(result.visual.svg,/<image\b/);
    assert.doesNotMatch(result.visual.svg,/G678_SOURCE_BITMAP_/);
    assert.equal(createHash("sha256").update(result.visual.svg).digest("hex"),result.visual.sha256);
    assert.ok(Math.abs(tile.sourcePosition.x-tile.cardSourcePosition.x)<2);
    assert.ok(Math.abs(tile.sourcePosition.y-tile.cardSourcePosition.y)<2);
  }
  assert.equal(algL11P034RevealedTile("level-1-Mc3_1",[3])?.sourceInstanceName,"Mc3_Img2");
  assert.equal(algL11P034RevealedTile("level-1-Mc3_2",[3])?.sourceInstanceName,"Mc3_Img1");
  assert.throws(()=>algL11P034RevealedTile("unbound-card",[1]));
});
