#!/usr/bin/env python3
"""Derive active B10 glossary hit regions and exact bilingual source entries."""
import importlib.util
import json
import os
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('a_special',ROOT/'scripts/build-g678-alg-l11-a-special-instructional-visuals.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
v=a.v
RUN=ROOT/'work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1'
AUDIT=ROOT/'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json'
AUDIT_ROOT=ROOT/'work/g678-shared-page-factory/g678-alg-l11-behavior10-tranche-b-audit-v1'
GLOSSARY=ROOT/'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json'


def controls_for_surface(display_frames,characters,parent,buttons,surface):
 rows=[];grouped={}
 for frame,display in enumerate(display_frames,1):
  for placement in display.values():
   cid=placement['characterId']
   if cid not in buttons:continue
   record={'surface':surface,'sourceObjectId':cid,'depth':placement['depth'],
     'sourceKey':buttons[cid]['key'],'entryId':re.sub('[^a-z0-9]+','-',buttons[cid]['key'].lower()).strip('-'),
     'polygon':a.polygon(placement,characters,parent),'scriptSha256':buttons[cid]['script']['sha256']}
   signature=json.dumps(record,sort_keys=True)
   if signature in grouped and grouped[signature]['lastFrame']==frame-1:grouped[signature]['lastFrame']=frame
   else:
    row={**record,'firstFrame':frame,'lastFrame':frame};rows.append(row);grouped[signature]=row
 return rows


def build():
 assert a.binding(AUDIT)['sha256']=='2b45cee5d1503d9e98521b5ca0518500a29f8bc43a0b1c84145016dccc5289b8'
 assert a.binding(GLOSSARY)['sha256']=='1f3eef83660ec8cd554a8954223a3a6f06eda1729c4c14da1541dfc081f9ec9d'
 audit=json.loads(AUDIT.read_text());glossary=json.loads(GLOSSARY.read_text())
 RUN.mkdir()
 members=[];all_entries={}
 for member in audit['members']:
  id=member['animationId'];source=pathlib.Path(os.environ['HELP_MATH_G678_SOURCE_ROOT'])/member['source']['path']
  assert source.stat().st_mode&0o222==0 and a.binding(source)['sha256']==member['source']['sha256']
  source_xml=AUDIT_ROOT/id/'ffdec-source.xml'
  assert a.binding(source_xml)['sha256']==member['freshFfdecBinaryClosure']['swfXml']['sha256']
  tags=list(ET.parse(source_xml).getroot().find('tags'))
  chars={int(t.get(k)):t for t in tags for k in ['spriteId','shapeId','buttonId','characterID'] if t.get(k)}
  root_matrix=next(p['matrix'] for p in v.source_display_frames(tags)[5].values() if p.get('name')=='animation')
  main_id=member['sourceStateMachine']['mainObjectId'];main=v.source_display_frames(chars[main_id].find('subTags'))
  scripts_root=AUDIT_ROOT/id/'ffdec-export/scripts';buttons={}
  for file in sorted(scripts_root.glob('DefineButton2_*/*.as')):
   text=file.read_text();m=re.search(r'_global\.KeyAttribute\s*=\s*"([^"]+)";',text)
   if not m:continue
   assert '_root.DoHyperLinks();' in text and '_root.animation_mc.animation.stop();' in text
   cid=int(file.parent.name.removeprefix('DefineButton2_'))
   assert cid not in buttons
   buttons[cid]={'key':m[1],'script':a.binding(file)}
  controls=controls_for_surface(main,chars,root_matrix,buttons,'main')
  quiz=main[member['sourceStateMachine']['quizFrame']-1]
  popup=next(p for p in quiz.values() if p.get('name')=='Mc_Popup')
  controls+=controls_for_surface(v.source_display_frames(chars[popup['characterId']].find('subTags')),
    chars,a.compose(root_matrix,popup['matrix']),buttons,'help')
  explanation_binding=None
  if member['sourceStateMachine']['guidedHits']:
   file=ROOT/f'work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/{id}/explanation-bundle.json'
   e=json.loads(file.read_text());assert e['sourceSha256']==member['source']['sha256'];explanation_binding=a.binding(file)
   for branch in e['branches']:
    placed=next(p for p in main[branch['mainFrame']-1].values() if p.get('name')==branch['name'])
    assert placed['characterId']==branch['spriteId']
    controls+=controls_for_surface(v.source_display_frames(chars[branch['spriteId']].find('subTags')),
      chars,a.compose(root_matrix,placed['matrix']),buttons,'explanation-'+branch['name'])
  keys={c['sourceKey'] for c in controls}
  entries=a.source_terms(keys,glossary)
  for entry in entries:
   if entry['id'] in all_entries:assert all_entries[entry['id']]==entry
   all_entries[entry['id']]=entry
  used_ids={c['sourceObjectId'] for c in controls}
  config={'schemaVersion':1,'animationId':id,'sourceSha256':member['source']['sha256'],
    'sourceXml':a.binding(source_xml),'mainFrameCount':len(main),'controls':controls,'entries':entries,
    'sourceScripts':[buttons[i]['script'] for i in sorted(used_ids)],'explanationBundle':explanation_binding,
    'sourceAction':'DoHyperLinks','sourceStopTarget':'_root.animation_mc.animation.stop()',
    'maintainedHostRequest':'open-glossary','hostPauseContract':'descriptor-reversible-support-pause',
    'originalRuntimeStopResumeAccepted':False,'productCalibrationPassed':False}
  file=RUN/(id+'.json');a.write(file,config)
  members.append({'animationId':id,'config':a.binding(file),'controlRanges':len(controls),
    'surfaces':{surface:sum(c['surface']==surface for c in controls) for surface in sorted({c['surface'] for c in controls})},
    'termIds':[e['id'] for e in entries]})
 existing={e['id'] for e in glossary['terms']}
 a.write(RUN/'entries.json',{'schemaVersion':1,'entries':list(all_entries.values()),
   'alreadyInL11SimpleGlossary':sorted(existing&all_entries.keys()),'additionalSourceResolvedIds':sorted(all_entries.keys()-existing)})
 a.write(RUN/'manifest.json',{'schemaVersion':1,'runId':RUN.name,'sourceAudit':a.binding(AUDIT),'glossaryAudit':a.binding(GLOSSARY),
   'builder':a.binding(pathlib.Path(__file__)),'entrypoint':a.binding(ROOT/'scripts/build-g678-alg-l11-b-source-glossary.mjs'),
   'sourceTermResolver':a.binding(ROOT/'scripts/build-g678-alg-l11-a-special-instructional-visuals.py'),
   'vectorGeometry':a.binding(ROOT/'scripts/lib/g678-alg-l11-b-source-vectors.py'),
   'members':members,'entries':a.binding(RUN/'entries.json'),
   'counts':{'pages':10,'controlRanges':sum(m['controlRanges'] for m in members),'uniqueTerms':len(all_entries),
    'alreadyInSimpleGlossary':len(existing&all_entries.keys()),'additionalSourceResolved':len(all_entries.keys()-existing)},
   'acceptanceEffects':{'registered':False,'productCalibrationPassed':False,'originalRuntime':False,'audioAccepted':False,
    'visualFidelity':False,'humanReview':False,'ownerAcceptance':False,'strictComplete':False,'released':False,'published':False}})
 print(json.dumps({'manifest':a.binding(RUN/'manifest.json'),'members':members,'additionalIds':sorted(all_entries.keys()-existing)}))

if __name__=='__main__':build()
