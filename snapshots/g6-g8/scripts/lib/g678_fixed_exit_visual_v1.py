"""Source-only helpers for the bounded fixed-exit ALG001 L7 family."""
from pathlib import Path
import json, re, xml.etree.ElementTree as E

def alpha(p):
 return max(0,min(1,p.get('colorTransform',{}).get('multiply',[256]*4)[3]/256+p.get('colorTransform',{}).get('add',[0]*4)[3]/255)) if p else 0

def spans(values):
 out=[]
 for frame,value in enumerate(values,1):
  if out and out[-1]['value']==value:out[-1]['last']=frame
  else:out.append(dict(first=frame,last=frame,value=value))
 return out

def box(bounds,placement):
 a,b,c,d,e,f=placement['matrix'];points=[(a*x+c*y+e,b*x+d*y+f)for x in[bounds['left'],bounds['right']]for y in[bounds['top'],bounds['bottom']]]
 return[min(x for x,y in points),max(x for x,y in points),min(y for x,y in points),max(y for x,y in points)]

def reflow_text(text):
 """Insert the space represented by an authored line break, preserving words."""
 out='';last=None
 for r in text['runs']:
  if last is not None and r['yOffsetTwips']!=last and out and not out[-1].isspace()and r['text']and not r['text'][0].isspace():out+=' '
  out+=r['text'];last=r['yOffsetTwips']
 return out

class SourceVisual:
 def __init__(self,directory):
  self.B=Path(directory);self.m=json.loads((self.B/'native-v1/source-model-v1.json').read_text());self.c=json.loads((self.B/'generator-v1/source-config-v1.json').read_text());self.by={t['timelineId']:t for t in self.m['timelines']};self.main=self.by[f"sprite-{self.c['main']}"];self.texts={t['characterId']:{**t,'text':''.join(r['text']for r in t.get('runs',[]))}for t in self.m['texts']};self.xml=E.parse(self.B/'source-v1/movie.xml').getroot()
  self.bounds={int(t.get('objectID')):{k:int(v)for k,v in t.find('bounds/Rectangle').attrib.items()}for t in self.xml.findall('Header/tags/*')if 'Shape'in t.tag and t.find('bounds/Rectangle')is not None}
  self.glyph_bounds={}
  for font in self.xml.findall('Header/tags/DefineFont2'):
   for i,g in enumerate(font.findall('glyphs/Glyph')):
    x=y=0;points=[]
    for e in g.find('GlyphShape/edges'):
     if e.tag=='ShapeSetup':
      if e.get('x')is not None:x=int(e.get('x'));y=int(e.get('y'));points.append((x,y))
     elif e.tag=='LineTo':x+=int(e.get('x'));y+=int(e.get('y'));points.append((x,y))
     elif e.tag=='CurveTo':
      cx=x+int(e.get('x1'));cy=y+int(e.get('y1'));x=cx+int(e.get('x2'));y=cy+int(e.get('y2'));points.extend([(cx,cy),(x,y)])
     else:raise AssertionError(e.tag)
    self.glyph_bounds[(int(font.get('objectID')),i)]=dict(left=min(x for x,y in points),right=max(x for x,y in points),top=min(y for x,y in points),bottom=max(y for x,y in points))if points else None

 def paths(self,id):
  p=self.B/f'source-v1/ffdec/shapes/{id}.svg';morph=not p.exists()
  if morph:p=self.B/f'source-v1/preflight-v1/morph-svg-v1/{id}.svg'
  nodes=list(E.parse(p).getroot().iter('{http://www.w3.org/2000/svg}path'));assert nodes
  out=[]
  for n in nodes:
   v={k:x for k,x in n.attrib.items()if k in['d','fill','stroke','fill-opacity','stroke-opacity','stroke-width']}
   if morph:
    ends={}
    for a in n:
     key=a.get('attributeName');first,last=a.get('values').split(';');assert key in['d','stroke','stroke-width','fill-opacity'];assert first==v.get(key,'1.0'),(id,key,first,v);ends[key]=last
    assert re.sub(r'-?\d+(?:\.\d+)?','',ends['d'])==re.sub(r'-?\d+(?:\.\d+)?','',v['d']);v['end']=ends
   out.append(v)
  return out

 def prefix(self,row,id,mask_ids):
  p=next((p for p in row if p['characterId']==id),None)
  if not alpha(p):return ''
  t=self.texts[id];assert t['matrix']==[1,0,0,1,0,0]
  masks=[q for q in row if q.get('clipDepth')and q['depth']<p['depth']<=q['clipDepth']];assert len(masks)==1 and masks[0]['characterId']in mask_ids
  clip=box(self.bounds[masks[0]['characterId']],masks[0]);out='';x=y=0;end=False
  for r in t['runs']:
   if r['changed']['xOffset']:x=r['xOffsetTwips']
   if r['changed']['yOffset']:y=r['yOffsetTwips']
   scale=r['fontHeightTwips']/1024
   for g in r['glyphs']:
    nx=x+g['advanceTwips'];gb=self.glyph_bounds[(r['fontId'],g['index'])]
    if gb:
     b=box(dict(left=x+gb['left']*scale,right=x+gb['right']*scale,top=y+gb['top']*scale,bottom=y+gb['bottom']*scale),p)
     if not(b[0]>=clip[0]and b[1]<=clip[1]and b[2]>=clip[2]and b[3]<=clip[3]):end=True;break
    out+=g['unicode'];x=nx
   if end:break
  if out!=t['text']and len(out)<len(t['text'])and t['text'][len(out)].isalnum():out=out.rsplit(' ',1)[0]if' 'in out else''
  return out.rstrip()

 def branches(self):
  c=self.c;quiz=self.main['frames'][c['quiz']-1];root=next(p for p in self.by['root']['frames'][5]if p['characterId']==c['main']);out=[]
  for kind,id in [('right',c['right']),('wrong',c['wrong'])]:
   t=self.by[f'sprite-{id}'];b=dict(spriteId=id,kind=kind,index=4,terminal=t['declaredFrameCount']);ids=sorted({p['characterId']for row in t['frames']for p in row if p['characterId']in self.texts and self.texts[p['characterId']]['text']});titles={self.texts[id]['text']for id in ids};assert len(titles)==1
   if kind=='wrong':
    child=c['dynamicDomains'][-1];close=c['closeButtons'][-1][0];ranges=[[s['first'],s['last']]for s in spans([any(p['characterId']==child for p in row)for row in t['frames']])if s['value']];assert ranges==[[14,21]];assert any(p['characterId']==close for row in self.by[f'sprite-{child}']['frames']for p in row);b.update(child=child,hold=21,close=close,closeJump=22,closeFirst=14,closeRanges=ranges)
   parent=next(p for p in quiz if p['characterId']==id);vis=[]
   for row in t['frames']:
    values=[]
    for p in row:
     if p['characterId']in ids:
      q=box(self.texts[p['characterId']]['boundsTwips'],p)
      for p2 in[parent,root]:q=box(dict(left=q[0],right=q[1],top=q[2],bottom=q[3]),p2)
      if q[1]>0 and q[0]<16000 and q[3]>0 and q[2]<12000:values.append(alpha(p))
    vis.append(max(values,default=0))
   b.update(title=next(iter(titles)),titleIds=ids,titleAlpha=spans(vis),naturallySelected=True);out.append(b)
  return out
