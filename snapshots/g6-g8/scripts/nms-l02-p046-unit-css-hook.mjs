// Node-only contract tests cannot evaluate CSS. Preserve browser styling unchanged.
// Deliberately allow only this page's stylesheet; all other loads use Node's loader.
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
const stylesheet=new URL('../packages/demos/src/nms-l02-p046-view-v1.css',import.meta.url);
registerHooks({load(url,context,nextLoad){
 if(url!==stylesheet.href)return nextLoad(url,context);
 readFileSync(stylesheet); // Missing assets must still fail; this is not a visual test.
 return {format:'module',source:'export {};',shortCircuit:true};
}});
