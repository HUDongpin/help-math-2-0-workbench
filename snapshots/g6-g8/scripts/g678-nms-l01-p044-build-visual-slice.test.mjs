import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import test from 'node:test';
import sharp from 'sharp';
import {project} from './g678-nms-l01-p044-build-visual-slice.mjs';
const RAW='work/g678-shared-page-factory/g678-nms-l01-p044-visual-slice-v2',OUT='work/g678-shared-page-factory/g678-nms-l01-p044-visual-projection-v1';
test('source-bound projection reproduces retained SVGs and complete sparse geometry IR',async()=>{const p=await project(),{svgPointProjections,...ir}=p;assert.equal(await readFile(`${OUT}/source-projection.json`,'utf8'),`${JSON.stringify(ir)}\n`);for(const[f,s]of Object.entries(svgPointProjections))assert.equal(await readFile(`${OUT}/source-root-main-${f}.svg`,'utf8'),s);assert.equal(p.morphDefinitions.length,49);assert.equal(p.directMorphPlacementCounts['293'],0);assert.deepEqual(p.sourceMainVisualEventFramesThrough312,[1,2,3,4,5,6,7,8,9,10,11,12,70,71,72,73,74,75,76,77,312]);});
test('root6/main1 composite equals actual source root6 decoded pixels',async()=>{const source=await sharp(await readFile(`${RAW}/root-svg/6.svg`)).raw().toBuffer(),derived=await sharp(await readFile(`${OUT}/source-root-main-1.svg`)).raw().toBuffer();assert.ok(source.equals(derived));});
test('XML normalization preserves source paths, root placements and unique complete reference graph',async()=>{const code=`import xml.etree.ElementTree as E,pathlib,collections,re
P=pathlib.Path('${RAW}');Q=pathlib.Path('${OUT}');S='{http://www.w3.org/2000/svg}';K='{http://www.w3.org/1999/xlink}href';F='{https://www.free-decompiler.com/flash}characterId'
def paths(r):return collections.Counter(tuple(sorted(n.attrib.items())) for n in r.iter(S+'path'))
r=E.parse(P/'root-svg/6.svg').getroot()
for f in [1,20,312]:
 m=E.parse(P/f'main-svg/DefineSprite_293/{f}.svg').getroot();o=E.parse(Q/f'source-root-main-{f}.svg').getroot()
 # Reverse only the declared namespace IDs/references, not paths or style values.
 reverse={}
 for prefix,tree in [('root-',r),('main-',m)]:
  for i,n in enumerate([n for n in tree.iter() if n.get('id')]):reverse[prefix+str(i)]=n.get('id')
 actual=[]
 for n in o.iter(S+'path'):
  attrs={k:(reverse[v] if k=='id' else re.sub(r'url\\(#([^)]*)\\)',lambda z:'url(#'+reverse[z[1]]+')',v)) for k,v in n.attrib.items()}
  actual.append(tuple(sorted(attrs.items())))
 assert collections.Counter(actual)==paths(r)+paths(m)
 ids=[n.get('id') for n in o.iter() if n.get('id')];assert len(ids)==len(set(ids))
 for n in o.iter():
  if n.get(K,'').startswith('#'):assert n.get(K)[1:] in ids
 group=o.find(S+'g');a=[n for n in group if n.get(F)=='293'];assert len(a)==1 and a[0].get('transform')=='matrix(1.0, 0.0, 0.0, 1.0, 412.35, 282.9)'
 title=[n for n in group if n.get(F)=='16'];tail=[n for n in group if n.get(F)=='294'];assert len(title)==len(tail)==1;assert tail[0].get('transform')=='matrix(1.0, 0.0, 0.0, 1.0, 406.95, -713.4)'
print('source paths and complete references preserved')`;
  const p=await promisify(execFile)('python3',['-c',code]);assert.equal(p.stderr,'');assert.match(p.stdout,/preserved/);});
test('derived SVG safety and missing-definition rules reject unknown content',async()=>{const code=`import importlib.util\ns=importlib.util.spec_from_file_location('p','scripts/g678-nms-l01-p044-project-visual-slice.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)\nfor bad in [b'<svg><script/></svg>',b'<!DOCTYPE svg><svg/>',b'<svg onload="bad"/>',b'<svg><image href="https://example.com/x"/></svg>']:\n try:m.root_of(bad)\n except AssertionError:continue\n raise AssertionError('unsafe SVG admitted')\nr=m.root_of(b'<svg><use href="#missing"/></svg>')\ntry:m.ids(r,'x-')\nexcept AssertionError:pass\nelse:raise AssertionError('unknown reference admitted')\nprint('negative safety checks passed')`;const p=await promisify(execFile)('python3',['-c',code]);assert.equal(p.stderr,'');assert.match(p.stdout,/passed/);});
