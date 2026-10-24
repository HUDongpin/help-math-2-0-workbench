from pathlib import Path
import gzip,json,hashlib,xml.etree.ElementTree as E,argparse
import runpy
O=Path(__file__).resolve().parent;closure=runpy.run_path(str(O/'verify-inputs.py'));R=closure['ROOT'];S=closure['INPUTS']
xml=E.fromstring(gzip.open(R/'migrations/course-g04-l03-in-007/audit/machine/swfmill.xml.gz').read());paths={};bounds={};ticks=[]
for n in xml.iter():
 if n.tag.startswith('DefineShape') and int(n.get('objectID','0')) in [9,30,48,81]:
  cid=int(n.get('objectID'));bounds[cid]={k:int(v) for k,v in n.find('./bounds/Rectangle').attrib.items()};xx=yy=0;parts=[];edges=list(n.findall('./shapes/Shape/edges/*'))
  for i,e in enumerate(edges):
   if e.tag=='ShapeSetup' and e.get('x') is not None:
    xx=int(e.get('x'));yy=int(e.get('y'));parts.append(f'M{xx} {yy}')
    if cid==30 and i+1<len(edges) and edges[i+1].tag=='LineTo' and edges[i+1].get('x')=='0' and edges[i+1].get('y')=='440':ticks.append(xx-142)
   elif e.tag=='LineTo':xx+=int(e.get('x'));yy+=int(e.get('y'));parts.append(f'L{xx} {yy}')
   elif e.tag=='CurveTo':cx=xx+int(e.get('x1'));cy=yy+int(e.get('y1'));xx=cx+int(e.get('x2'));yy=cy+int(e.get('y2'));parts.append(f'Q{cx} {cy} {xx} {yy}')
  paths[cid]=' '.join(parts)
cat=json.loads(gzip.open(S/'source-catalog.json.gz').read());textBounds={t['characterId']:t['boundsTwips'] for t in cat['textDefinitions']};assert len(ticks)==25
out={'sourceSha256':cat['sourceSha256'],'paths':paths,'bounds':bounds,'ticks':sorted(ticks),'textBounds':textBounds,'numberLineMatrix':[1,0,0,1,-142,718],'pointMatrix':[1,0,0,1,-142,718]};payload=json.dumps(out,separators=(',',':'))+'\n';parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
if args.check:assert (O/'geometry.generated.json').read_text()==payload;print('PASS deterministic25tick geometry')
else:(O/'geometry.generated.json').write_text(payload);print('ticks',len(ticks))
