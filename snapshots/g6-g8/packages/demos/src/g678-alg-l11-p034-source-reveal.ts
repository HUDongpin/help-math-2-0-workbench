import {G678_ALG_L11_P034_SOURCE_REVEAL as SOURCE} from "./generated/g678-alg-l11-p034-source-reveal-v1";

export function algL11P034RevealedTile(cardId:string,matchedPairIds:readonly number[]){
  const tile=SOURCE.tiles.find(item=>item.cardId===cardId);
  if(!tile)throw new Error("p034 source card has no exact image tile");
  if(!matchedPairIds.includes(tile.pairId))return null;
  const svg=tile.visual.svg.replace(/G678_SOURCE_BITMAP_([a-f0-9]{64})/g,(_all,id:string)=>{
    const bitmap=(SOURCE.bitmaps as Readonly<Record<string,string>>)[id];
    if(!bitmap)throw new Error("p034 source bitmap binding is absent");return bitmap;
  });
  return{...tile,visual:{...tile.visual,svg}};
}
