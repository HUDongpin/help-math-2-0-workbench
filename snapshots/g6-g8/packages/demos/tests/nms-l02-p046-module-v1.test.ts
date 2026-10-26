import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {isP046RuntimeModule} from '../../../apps/web/lib/nms-l02-p046-runtime-access';
// Product CSS is handled by the web build; elide it only for this Node test.
const built=await build({entryPoints:[fileURLToPath(new URL('../src/modules/g678-nms-l02-native-equivalent-fraction-p046.tsx',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',loader:{'.css':'empty'}});
const exportsObject:{default?:typeof import('../src/modules/g678-nms-l02-native-equivalent-fraction-p046')['default']}={};
const moduleObject={exports:exportsObject};
new Function('require','module','exports',built.outputFiles[0]!.text)(createRequire(import.meta.url),moduleObject,exportsObject);
const animationModule=moduleObject.exports.default!;
test('actual product module passes exact runtime binding with root metadata separate from main domain',()=>{
 assert(isP046RuntimeModule(animationModule));assert.equal(animationModule.movie.frameCount,10);assert.equal(animationModule.runtime?.defaultFrameDomain,'sprite-205');assert.equal(animationModule.textPresentation?.playbackEndFrameByDomain?.['sprite-205'],654);
 const context={frame:706,frameDomain:'sprite-205',scenario:'source-inspection',lang:'en',seed:0} as const;
 const state=animationModule.getFrameState(706,context);assert.equal(state.state.phase,'ready');
 const snapshot=animationModule.textPresentation!.getSnapshot(state,context);assert.equal(snapshot.status,'ready');assert.equal(snapshot.blocks.find(b=>b.id==='complete')!.visible,false);
});
