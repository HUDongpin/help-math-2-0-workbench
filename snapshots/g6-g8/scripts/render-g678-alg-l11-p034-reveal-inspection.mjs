#!/usr/bin/env node
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {G678_ALG_L11_P034_SOURCE_REVEAL as SOURCE} from '../packages/demos/src/generated/g678-alg-l11-p034-source-reveal-v1.ts';
import {algL11P034RevealedTile} from '../packages/demos/src/g678-alg-l11-p034-source-reveal.ts';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'work/g678-shared-page-factory/g678-alg-l11-p034-reveal-inspection-v1');
await mkdir(OUT);const files=[];
for(const level of[1,2]){
  const tiles=SOURCE.tiles.filter(tile=>tile.level===level);const minX=Math.min(...tiles.map(tile=>tile.sourcePosition.x));const minY=Math.min(...tiles.map(tile=>tile.sourcePosition.y));
  const width=Math.ceil(Math.max(...tiles.map(tile=>tile.sourcePosition.x+tile.visual.width))-minX);
  const height=Math.ceil(Math.max(...tiles.map(tile=>tile.sourcePosition.y+tile.visual.height))-minY);
  const layers=[];
  for(const tile of tiles){const visible=algL11P034RevealedTile(tile.cardId,[1,2,3,4,5,6]);
    layers.push({input:await sharp(Buffer.from(visible.visual.svg)).png().toBuffer(),
      left:Math.round(tile.sourcePosition.x-minX),top:Math.round(tile.sourcePosition.y-minY)});}
  const png=await sharp({create:{width:width+1,height:height+1,channels:4,background:'white'}}).composite(layers).png().toBuffer();
  const name=`level-${level}-all-pairs.png`;await writeFile(path.join(OUT,name),png,{flag:'wx'});
  files.push({path:name,bytes:png.length,sha256:createHash('sha256').update(png).digest('hex')});
}
await writeFile(path.join(OUT,'inspection.json'),JSON.stringify({type:'source-tile-composite-inspection',files,
  browserQa:false,originalRuntime:false,visualFidelityAccepted:false,strictComplete:false,published:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output:OUT,files:2}));
