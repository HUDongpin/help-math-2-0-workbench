import * as React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {P040Grid} from '../src/nms-l02-p040-grid-v1';
test('source grid keeps100cells40fills, nonuniform sourcewidth and stroke-safe bounds',()=>{
 const html=renderToStaticMarkup(<P040Grid/>);
 assert.equal((html.match(/<rect /g)??[]).length,100);
 assert.equal((html.match(/data-p040-filled="true"/g)??[]).length,40);
 assert.equal((html.match(/width="506"/g)??[]).length,10);
 assert.match(html,/viewBox="-10 -10 5026 5020"/);
 assert.match(html,/40 of 100 squares shaded: 40%\./);
 assert.match(renderToStaticMarkup(<P040Grid language="es"/>),/40 de 100 cuadros sombreados: 40%\./);
});
