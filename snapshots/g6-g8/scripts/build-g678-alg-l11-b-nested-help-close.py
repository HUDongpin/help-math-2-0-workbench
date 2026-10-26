#!/usr/bin/env python3
"""Bind TS source help Close buttons inside Mc_Popup, not the main timeline."""
import hashlib,importlib.util,json,pathlib,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parent.parent
s=importlib.util.spec_from_file_location('vectors',ROOT/'scripts/lib/g678-alg-l11-b-source-vectors.py')
v=importlib.util.module_from_spec(s);s.loader.exec_module(v)
def bind(p):
 b=p.read_bytes();return {'path':str(p.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
audit_file=ROOT/'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json'
assert bind(audit_file)['sha256']=='2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8'
audit=json.loads(audit_file.read_text());rows={}
for m in audit['members']:
 if not m['sourceStateMachine']['guidedHits']:continue
 id=m['animationId'];base=ROOT/f'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-audit-v1/{id}'
 xml=base/'ffdec-source.xml';assert bind(xml)['sha256']==m['freshFfdecBinaryClosure']['swfXml']['sha256']
 tags=list(ET.parse(xml).getroot().find('tags'))
 chars={int(t.get(k)):t for t in tags for k in ['spriteId','shapeId','buttonId','characterID'] if t.get(k)}
 root=v.source_display_frames(tags)[5];parent=next(p['matrix'] for p in root.values() if p.get('name')=='animation')
 main=v.source_display_frames(chars[m['sourceStateMachine']['mainObjectId']].find('subTags'))[m['sourceStateMachine']['quizFrame']-1]
 popup=next(p for p in main.values() if p.get('name')=='Mc_Popup');pm=popup['matrix']
 composed=[parent[0]*pm[0]+parent[2]*pm[1],parent[1]*pm[0]+parent[3]*pm[1],parent[0]*pm[2]+parent[2]*pm[3],parent[1]*pm[2]+parent[3]*pm[3],*v.transform_point(parent,pm[4],pm[5])]
 close_id=m['helpPopup']['closeButtonId']
 controls=[p for p in v.source_display_frames(chars[popup['characterId']].find('subTags'))[0].values() if p['characterId']==close_id]
 assert len(controls)==1;control=controls[0];bounds=v.source_bounds(close_id,chars)
 polygon=[v.transform_point(composed,*v.transform_point(control['matrix'],x,y)) for x,y in [(bounds[0],bounds[1]),(bounds[2],bounds[1]),(bounds[2],bounds[3]),(bounds[0],bounds[3])]]
 script=base/'ffdec-export/scripts'/pathlib.Path(m['helpPopup']['closeScript']['path']).relative_to(id)
 assert bind(script)['sha256']==m['helpPopup']['closeScript']['sha256']
 rows[id]={'sourceSha256':m['source']['sha256'],'mainObjectId':m['sourceStateMachine']['mainObjectId'],
  'popupObjectId':popup['characterId'],'sourceCloseButtonId':close_id,'sourceCloseDepth':control['depth'],
  'polygon':polygon,'sourceXml':bind(xml),'sourceCloseScript':bind(script),'registered':False,'productCalibrationPassed':False}
target=ROOT/'packages/demos/src/g678-alg-l11-b-nested-help-close.generated.ts'
content='// Generated from exact source XML/button script; do not hand-edit.\nexport const G678_ALG_L11_B_NESTED_HELP_CLOSE = '+json.dumps(rows,ensure_ascii=False,indent=2)+' as const;\n'
with target.open('x') as f:f.write(content)
receipt={'schemaVersion':1,'sourceAudit':bind(audit_file),'builder':bind(pathlib.Path(__file__)),
 'geometry':bind(ROOT/'scripts/lib/g678-alg-l11-b-source-vectors.py'),'output':bind(target),'rows':rows}
out=ROOT/'catalog/g678-alg-l11-b-nested-help-close-v1.json'
with out.open('x') as f:json.dump(receipt,f,ensure_ascii=False,indent=2);f.write('\n')
print(json.dumps({'receipt':bind(out),'generated':bind(target)}))
