import assert from 'node:assert/strict';
/** Correct only the authored invalid equality chain; retain source glyphs and reveal mask. */
export function projectP033Arithmetic(runtime,guard){
 assert.equal(guard.source.sha256,'a8aff21f1b22bc62de728af927e685f82314eb8eced3419fff42766f3d5dcec9');
 assert.equal(guard.sourceQuestionAnswer,86);assert.equal(guard.firstFrame,332);assert.equal(guard.lastFrame,511);
 assert.deepEqual(guard.sourceGroup.map(p=>[Number(p.objectID),Number(p.depth)]),[[250,2],[251,3],[252,4],[253,5],[254,6],[23,7],[255,8],[29,9],[251,10],[256,11]]);
 assert.deepEqual(guard.secondRowTranslationPixels,{x:-100.85,y:50});
 assert.deepEqual(guard.duplicateSourceGlyph,{characterId:23,matrix:[.05,0,0,.05,-62.45,36.65]});
 assert.deepEqual(guard.movedSourceGlyphs,[{characterId:251,matrix:[.05,0,0,.05,27.95,36.65]},{characterId:255,matrix:[.05,0,0,.05,.45,36.65]},{characterId:29,matrix:[.05,0,0,.05,53.4,36.65]},{characterId:256,matrix:[.05,0,0,.05,14.85,24.05]}]);
 assert.equal(guard.sourceMaskCharacterId,250);assert.equal(guard.sourceMaskClipDepth,12);
 assert.equal(guard.rawSourceModified,false);assert.equal(guard.additionalAnswersCreated,0);
 for(const n of ['shape250','text23','text251','text255','text29','shape256'])assert.equal(runtime.split('function '+n+'(ctx,ctrans,frame,ratio,time){').length,2);
 const prelude=`
var p033ArithmeticPlace=place;
place=function(obj,canvas,ctx,matrix,ct,blend,frame,ratio,time){
 function shifted(m){m=m.slice();m[4]-=100.85;m[5]+=50;return m;}
 function same(a,b){return a.length===b.length&&a.every(function(v,i){return v===b[i];});}
 if(obj==='shape250'||(obj==='text23'&&same(matrix,[.05,0,0,.05,-62.45,36.65]))){
  p033ArithmeticPlace(obj,canvas,ctx,matrix,ct,blend,frame,ratio,time);
  return p033ArithmeticPlace(obj,canvas,ctx,shifted(matrix),ct,blend,frame,ratio,time);
 }
 var moved=[['text251',[.05,0,0,.05,27.95,36.65]],['text255',[.05,0,0,.05,.45,36.65]],['text29',[.05,0,0,.05,53.4,36.65]],['shape256',[.05,0,0,.05,14.85,24.05]]];
 if(moved.some(function(row){return row[0]===obj&&same(row[1],matrix);}))matrix=shifted(matrix);
 return p033ArithmeticPlace(obj,canvas,ctx,matrix,ct,blend,frame,ratio,time);
};
`;
 const marker='function render(targetCanvas, request) {';assert.equal(runtime.split(marker).length,2);
 return runtime.replace(marker,prelude+'\n'+marker);
}
