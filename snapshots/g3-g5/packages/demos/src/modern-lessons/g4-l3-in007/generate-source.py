from pathlib import Path
import json,gzip,hashlib,xml.etree.ElementTree as E,argparse
import runpy
O=Path(__file__).resolve().parent;closure=runpy.run_path(str(O/'verify-inputs.py'));R=closure['ROOT'];S=closure['INPUTS']
EXPECTED_MANIFEST='173998c00850a24ad69181b32754d8ade5ff5113a4c5fefb334ef82245e94f2b'
frames=json.loads(gzip.open(S/'frames.json.gz').read());words=json.load(open(S/'word-reveal.json'));axis=json.load(open(S/'axis-map.json'));terms=json.load(open(S/'keyterms.json'));cat=json.loads(gzip.open(S/'source-catalog.json.gz').read());defs={t['characterId']:t for t in cat['textDefinitions']};xml=E.fromstring(gzip.open(R/'migrations/course-g04-l03-in-007/audit/machine/swfmill.xml.gz').read())
arrow_ids=list(range(49,55))+list(range(56,80))+list(range(82,88))+list(range(90,96));shape_paths={}
for n in xml.iter():
 if n.tag.startswith('DefineShape') and int(n.get('objectID','0')) in arrow_ids:
  xx=yy=0;parts=[]
  for e in n.findall('./shapes/Shape/edges/*'):
   if e.tag=='ShapeSetup' and e.get('x') is not None:xx=int(e.get('x'));yy=int(e.get('y'));parts.append(f'M{xx} {yy}')
   elif e.tag=='LineTo':xx+=int(e.get('x'));yy+=int(e.get('y'));parts.append(f'L{xx} {yy}')
   elif e.tag=='CurveTo':cx=xx+int(e.get('x1'));cy=yy+int(e.get('y1'));xx=cx+int(e.get('x2'));yy=cy+int(e.get('y2'));parts.append(f'Q{cx} {cy} {xx} {yy}')
  shape_paths[n.get('objectID')]=' '.join(parts)
def alpha(s):
 if s is None:return 0
 c=s.get('colorTransform') or {};return max(0,min(1,c.get('multiply',[256]*4)[3]/256+c.get('add',[0]*4)[3]/255))
def group(cid):
 for i,(lo,hi) in enumerate([(49,54),(56,61),(62,67),(68,73),(74,79),(82,87),(90,95)],1):
  if lo<=cid<=hi:return {'jumpCount':i,'from':12-3*(i-1),'to':12-3*i,'lastJumpComplete':cid==hi}
 raise ValueError(cid)
def signed(text,minus):
 assert text and minus and minus['characterId'] in [9,81]
 assert alpha(text)==alpha(minus),'Sign anddigit alpha mismatch'
 return {'value':-int(''.join(r['text'] for r in defs[text['characterId']]['runs'])),'textId':text['characterId'],'minusId':minus['characterId'],'textDepth':text['depth'],'minusDepth':minus['depth'],'textMatrix':text['matrix'],'minusMatrix':minus['matrix'],'alpha':alpha(text),'readable':alpha(text)==1}
prefix_values=[int(v.strip()) for v in ''.join(r['text'] for r in defs[17]['runs']).split(',') if v.strip()]
assert prefix_values==[12,9,6,3,0]
def prefix_emphasis(fr):
 active=[s for s in fr['displayList'] if s['characterId'] in [19,20,21,22]]
 assert len(active)<=1
 if not active:return None
 s=active[0];definition=defs[s['characterId']];text=''.join(r['text'] for r in definition['runs']);matrix=s['matrix'];linear=matrix[:4]
 assert linear in [[1,0,0,1],[-1,0,0,-1]],'Unreviewed prefix emphasis transform'
 if linear==[-1,0,0,-1]:
  assert text=='9' and s['characterId']==20
  value=6 # Source180degree rotated9 overlays the existing prefix6; preserve semantic6.
 else:value=int(text)
 assert not any(q['depth']<s['depth']<=q['clipDepth'] for q in fr['masks'])
 assert all(r['colorRgba']==[255,0,255,255] for r in definition['runs'])
 return {'prefixIndex':prefix_values.index(value),'value':value,'sourceTextId':definition['runs'][0]['sourceTextId'],'sourceTagSha256':definition['sourceTagSha256'],'matrix':matrix,'alpha':alpha(s),'readable':alpha(s)==1}
bank=[];indices=[];seen={}
for fr in frames:
 f=fr['frame'];state={s['depth']:s for s in fr['displayList']};placed=lambda cid:[s for s in fr['displayList'] if s['characterId']==cid];pattern=state.get(18);pattern=pattern if pattern and pattern['characterId']==17 else None
 axes=[]
 for a in axis:
  s=state.get(a['depth']);sign=state.get(a['depth']+1) if a['value']<0 else None
  if s:
   assert s['characterId']==a['sourceTextId']
   if sign:assert sign['characterId']==9 and alpha(sign)==alpha(s)
   assert not any(q['depth']<s['depth']<=q['clipDepth'] for q in fr['masks'])
   axes.append(alpha(s))
 assert len(set(axes))<=1
 arrow=next((s for s in fr['displayList'] if s['characterId'] in arrow_ids),None)
 fills=[]
 for depth,cid in [(104,55),(106,89),(108,97)]:
  s=state.get(depth)
  fills.append(signed(s,state.get(depth+1)) if s and s['characterId']==cid else None)
 moving=[signed(s,state.get(s['depth']+1)) for s in fr['displayList'] if s['characterId']==55 and s['depth']<=100]
 flash=next((s for s in fr['displayList'] if s['characterId'] in [80,88,96]),None);flash=signed(flash,state.get(flash['depth']+1)) if flash else None
 wc=[]
 for row in words:
  text=next((s for s in fr['displayList'] if s['characterId']==row['characterId']),None)
  wc.append(sum(w['wholeWordFrame'] is not None and f>=w['wholeWordFrame'] for w in row['words']) if alpha(text)==1 else 0)
 row={'prefixEmphasis':prefix_emphasis(fr),'wordCounts':wc,'pattern':{'placed':pattern is not None,'alpha':alpha(pattern),'readable':alpha(pattern)==1},'axis':{'placed':bool(axes),'alpha':axes[0] if axes else 0,'readable':bool(axes) and axes[0]==1},'arrow':None if not arrow else {'shapeId':arrow['characterId'],'matrix':arrow['matrix'],'alpha':alpha(arrow),**group(arrow['characterId'])},'movingMinusThree':moving,'signedFlash':flash,'fills':fills,'blankEmphasis':any(s['characterId'] in range(23,29) and alpha(s)>0 for s in fr['displayList'])}
 key=json.dumps(row,separators=(',',':'));idx=seen.get(key)
 if idx is None:idx=len(bank);seen[key]=idx;bank.append(row)
 indices.append(idx)
keys=[]
for word,button,source_id,run,full in [('Pattern',10,8,1,23),('Set',12,8,3,29),('Symbol',11,8,5,57),('Rule',15,14,1,98)]:
 e=next(t for t in terms['entries'] if t['screenKeyTerm']==word);keys.append({'keyAttribute':word,'sourceButtonId':button,'sourceTextId':source_id,'sourceRunIndex':run,'readableFromFrame':full,'entryId':e['id']})
for a in axis:a['digitBoundsTwips']=defs[a['sourceTextId']]['boundsTwips'];a['textMatrix']=defs[a['sourceTextId']]['matrix']
data={'schemaVersion':1,'kind':'in007-native-source-proposal','animationId':'course-g04-l03-in-007','sourceSha256':cat['sourceSha256'],'sourceManifestSha256':EXPECTED_MANIFEST,'frameDomain':'sprite-98','fps':12,'frameCount':555,'wordRows':words,'axisDefinitions':axis,'shapePaths':shape_paths,'stateBank':bank,'frameStateIndices':indices,'keyTerms':{'indexLanguage':'en','sourceAssetId':'ELKTEG4.xml','sourceSha256':'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749','entries':keys},'nativeAdmissionDecision':'Whole signed labels and pattern text remain unreadable until source alpha reaches1. This deliberately delays source partial-opacity states for modern readability; source alpha/placement retained separately.','claims':{'rendererImplemented':False,'productApplied':False,'sourceExactVisibility':False,'originalRuntime':False,'fidelity':False}}
payload=json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n';args=argparse.ArgumentParser();args.add_argument('--check',action='store_true');a=args.parse_args()
if a.check:assert (O/'source.generated.json').read_text()==payload;print('PASS pinned-source deterministic555-state generation')
else:(O/'source.generated.json').write_text(payload);print('states',len(bank),'frames',len(indices),'bytes',len(payload.encode()))
