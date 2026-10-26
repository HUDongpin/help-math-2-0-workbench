import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chromium} from 'playwright';
import {normalizeSourceClipMasks} from './lib/g678-source-clip-masks-v1.mjs';
const normalizeClipMaskFills=(runtime,masks,xml)=>normalizeSourceClipMasks(runtime,masks.map(({depth,clipDepth,...rest})=>({...rest,placements:[{depth,clipDepth}]})),xml);

const xml = '<PlaceObject2 replace="0" depth="1" objectID="1" clipDepth="26">';
const shape = alpha => `function shape1(ctx,ctrans,frame,ratio,time){
ctx.fillStyle=tocolor(ctrans.apply([0,0,255,${alpha}]));
ctx.beginPath();ctx.rect(3,4,7,8);ctx.fill();
}`;
const mask = alpha => ({characterId:1,depth:1,clipDepth:26,
  rawFill:`ctx.fillStyle=tocolor(ctrans.apply([0,0,255,${alpha}]));`});

test('mask repair rejects a visible placement, a reused character, or a different depth', () => {
  for (const input of [xml.replace(' clipDepth="26"',''), xml + xml, xml.replace('clipDepth="26"','clipDepth="25"')]) {
    assert.throws(() => normalizeClipMaskFills(shape('0.2'),[mask('0.2')],input), /source|placement|mask/);
  }
  assert.throws(() => normalizeClipMaskFills(shape('0.2').replace('ctx.beginPath();','ctx.drawImage(image,0,0);ctx.beginPath();'),[mask('0.2')],xml), /complex mask/);
});

test('source vector clipping retains content opacity and geometry for transparent mask fills', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const alpha of ['0.0','0.2','1.0']) {
      const page = await browser.newPage();
      await page.setContent('<canvas width="20" height="20"></canvas>');
      await page.addScriptTag({content:normalizeClipMaskFills(shape(alpha),[mask(alpha)],xml)});
      const pixels = await page.evaluate(() => {
        const target=document.querySelector('canvas'),ctx=target.getContext('2d');
        const clip=document.createElement('canvas');clip.width=clip.height=20;
        shape1(clip.getContext('2d'),null,0,0,0);
        ctx.fillStyle='rgba(240,40,20,0.5)';ctx.fillRect(0,0,20,20);
        const before=[...ctx.getImageData(5,6,1,1).data];
        ctx.globalCompositeOperation='destination-in';ctx.drawImage(clip,0,0);
        return {before,inside:[...ctx.getImageData(5,6,1,1).data],
          outside:[...ctx.getImageData(1,1,1,1).data],
          right:[...ctx.getImageData(10,6,1,1).data],
          bottom:[...ctx.getImageData(5,12,1,1).data]};
      });
      assert.deepEqual(pixels.inside,pixels.before,'content opacity is independent of vector mask fill alpha');
      for (const key of ['outside','right','bottom']) assert.equal(pixels[key][3],0,'clipping boundary is preserved');
      await page.close();
    }
  } finally {await browser.close();}
});

test('all reused clip placements are bound before shared source geometry is normalized',()=>{
 const second=xml.replace('depth="1"','depth="4"').replace('clipDepth="26"','clipDepth="30"');
 const m={characterId:1,rawFill:mask('0.2').rawFill,placements:[{depth:1,clipDepth:26},{depth:4,clipDepth:30}]};
 const result=normalizeSourceClipMasks(shape('0.2'),[m],xml+second);
 assert(result.includes('ctx.fillStyle="rgba(0,0,0,1)";'));
 for(const tags of [second+xml,xml,xml+second.replace(' clipDepth="30"','')])assert.throws(()=>normalizeSourceClipMasks(shape('0.2'),[m],tags),/placement|mask/);
});
