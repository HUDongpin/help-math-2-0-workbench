import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
/** One source-only mask correction: Adobe masks use fill geometry and ignore line styles. */
export function normalizeP032MaskStroke(runtime,audit){
 const m=audit.masks.find(m=>m.sourceCharacterId===233);
 assert(m&&m.ignoreSourceStroke===true&&m.sourceFunctionSha256==='fdbcb012a5b552a4567ae63294f81ea48d0bd05830cd0322ad7cef167075b0ee');
 assert.equal(createHash('sha256').update(m.sourceFunction).digest('hex'),m.sourceFunctionSha256);
 assert.equal(runtime.split(m.sourceFunction).length,2,'unique exact source233 mask function');
 const boundary=m.sourceFunction.indexOf('\n\tvar pathData=',m.sourceFunction.indexOf('ctx.fill("evenodd");'));
 assert(boundary>0&&m.sourceFunction.slice(boundary).includes('ctx.lineWidth=2.0;'));
 const fillOnly=m.sourceFunction.slice(0,boundary)+'\n}';
 assert(!fillOnly.includes('stroke')&&fillOnly.includes(m.fillPath));
 return runtime.replace(m.sourceFunction,fillOnly);
}
