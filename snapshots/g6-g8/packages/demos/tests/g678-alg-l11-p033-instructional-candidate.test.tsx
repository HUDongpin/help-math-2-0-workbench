import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {G678_ALG_L11_P033_INSTRUCTIONAL_SEQUENCE as DATA} from "../src/generated/g678-alg-l11-p033-instructional-sequence-v1";
import {ALG_L11_P033_AUTHORED_CONTROLS,AlgL11P033InstructionalRenderer,
  G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE,algL11P033ControlBounds,
  algL11P033FrameSvg,algL11P033SourceFrame} from "../src/g678-alg-l11-p033-instructional-candidate";

test("all 606 main frames remain queryable with separate root and terminal-stop metadata",()=>{
  assert.equal(DATA.frames.length,606);assert.equal(DATA.sourceRootFrameCount,10);
  assert.equal(DATA.frames[10].label,"RepeatDirection");assert.equal(DATA.frames[604].label,"SelectLevel");
  for(let frame=1;frame<=606;frame++)assert.equal(algL11P033SourceFrame(frame).frame,frame);
  assert.throws(()=>algL11P033SourceFrame(0));assert.throws(()=>algL11P033SourceFrame(607));
  assert.equal(G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE.runtime?.frameCount,10);
  assert.equal(G678_ALG_L11_D_INSTRUCTIONAL_P033_MODULE.playbackEndFrameByDomain["sprite-116"],605);
  assert.ok(DATA.definitions.includes("<path"));
  assert.doesNotMatch(algL11P033FrameSvg(300),/\bid="(?:Mc_Msg|Mc_Popup|mcSkip|mcL1|mcL2|mcStart)"/);
});

test("source Repeat and Skip declare only their authored ranges and exact label/frame/playback targets",()=>{
  assert.deepEqual(ALG_L11_P033_AUTHORED_CONTROLS,[
    {id:"alg-l11-p033-repeat-directions",frameDomain:"sprite-116",sourceFrameRanges:[{first:1,last:6}],targetFrame:11,playback:"play",sourceLabel:"RepeatDirection"},
    {id:"alg-l11-p033-skip-directions",frameDomain:"sprite-116",sourceFrameRanges:[{first:7,last:604}],targetFrame:605,playback:"stop",sourceLabel:"SelectLevel"},
  ]);
  assert.deepEqual(DATA.frames[0].controlPlacements.map(p=>p.name),["mcRepeat","mcL1","mcL2","mcStart"]);
  assert.deepEqual(DATA.frames[6].controlPlacements.map(p=>p.name),["mcSkip"]);
  assert.equal(DATA.frames[604].controlPlacements.find(p=>p.name==="mcRepeat")?.characterId,115);
});

test("controller native positioning and stopped nested button art remain separate from main instruction time",()=>{
  for(const frame of[1,7,11,187,300,604,605,606]){
    const html=renderToStaticMarkup(<AlgL11P033InstructionalRenderer frame={frame} frameDomain="sprite-116"
      lang="en" scenario="advanced3-tranche-d-unregistered-engineering-candidate" seed={31} replay={0} paused onReplay={()=>{}}/>);
    assert.match(html,new RegExp(`data-source-main-frame="${frame}"`));
    assert.equal([...html.matchAll(/<button\b/g)].length,[...html.matchAll(/ disabled=""/g)].length);
    const active=DATA.frames[frame-1].controlPlacements;
    for(const placement of active){
      const art=(DATA.controls as Record<number,typeof DATA.controls[39]>)[placement.characterId][0];
      const pos=algL11P033ControlBounds(placement,art);
      assert.ok(pos.x>=0&&pos.y>=0&&pos.x+pos.width<=800&&pos.y+pos.height<=600);
      assert.ok(html.includes(art.sha256));
    }
    assert.equal([...html.matchAll(/data-source-nested-frame="1"/g)].length,active.length);
    assert.match(html,/data-current-javascript-registered="false"/);
  }
});
