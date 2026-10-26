#!/usr/bin/env python3
"""New, source-bound visual/behavior config for p006/p009/p010 only."""
import hashlib
import importlib.util
import json
import os
import pathlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('vectors',ROOT/'scripts/lib/g678-alg-l11-b-source-vectors.py')
v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
RUN=ROOT/'work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2'
RAW=ROOT/'work/g678-shared-page-factory/g678-alg-l11-tranche-a-instructional-visuals-v2'
BUNDLES=ROOT/'work/g678-shared-page-factory/g678-alg-l11-tranche-a-vector-bundles-v4'
AUDIT=ROOT/'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json'
GLOSSARY=ROOT/'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json'


def sha(data):return hashlib.sha256(data).hexdigest()
def binding(file):
 data=file.read_bytes()
 return {'path':str(file.relative_to(ROOT)) if file.is_relative_to(ROOT) else str(file),'bytes':len(data),'sha256':sha(data)}
def write(file,value):
 with file.open('x') as stream:json.dump(value,stream,ensure_ascii=False,separators=(',',':'));stream.write('\n')
def compose(a,b):return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],*v.transform_point(a,b[4],b[5])]
def polygon(placed,characters,parent):
 b=v.source_bounds(placed['characterId'],characters)
 return [v.transform_point(parent,*v.transform_point(placed['matrix'],x,y)) for x,y in [(b[0],b[1]),(b[2],b[1]),(b[2],b[3]),(b[0],b[3])]]


def source_terms(keys,glossary):
 recovery=pathlib.Path(os.environ['PRIVATE_RECOVERY_CONTAINERS'])
 sources={lang:recovery/b['path'] for lang,b in glossary['keyTermSources'].items()}
 values={}
 for lang,file in sources.items():
  assert binding(file)['sha256']==glossary['keyTermSources'][lang]['sha256']
  # Legacy ~LNG~ element names and &nbsp; are not well-formed XML names;
  # use the same bounded record grammar as the frozen glossary audit.
  entries=[]
  for m in re.finditer(r'<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)</\1\s*>',file.read_text()):
   attrs=dict(re.findall(r'([A-Za-z]+)\s*=\s*"([^"]*)"',m[2]))
   key=attrs.get('ScreenkeyTerm','')
   if key.lower() not in {k.lower() for k in keys}:continue
   english_label=m[1].split('~LNG~')[0].replace('~',' ').strip()
   if english_label.lower()!=key.lower():continue
   definitions=m[3].split('~LNG~');assert len(definitions)==2
   def text(value):
    value=value.replace('&nbsp;',' ').replace('&amp;','&').replace('&quot;','"').replace('&apos;',"'")
    allowed={'003c':'<','003e':'>','2260':'≠','2264':'≤','2265':'≥'}
    def numeric(m):
     assert m[1].lower() in allowed,'Unexpected glossary numeric entity'
     return allowed[m[1].lower()]
    value=re.sub(r'&#x([0-9a-fA-F]{4});',numeric,value).replace('&lt;','<').replace('&gt;','>')
    return re.sub(r'\s+',' ',value).strip()
   entries.append({'id':re.sub('[^a-z0-9]+','-',key.lower()).strip('-'),'key':key,
    'labels':{'en':key,'es':m[1].split('~LNG~')[1].replace('~',' ').strip()},
    'definitions':{'en':text(definitions[0]),'es':text(definitions[1])},'entrySha256':sha(m[0].encode())})
  values[lang]=entries
 result=[]
 for key in sorted(keys):
  en=[e for e in values['en'] if e['key']==key];es=[e for e in values['es'] if e['key']==key]
  assert len(en)==len(es)==1,(key,'ambiguous/missing exact glossary entry')
  assert en[0]['definitions']==es[0]['definitions'],(key,'bilingual source definition disagreement')
  result.append({**en[0],'sourceEntries':{'en':en[0]['entrySha256'],'es':es[0]['entrySha256']}})
 return result


def build():
 assert binding(AUDIT)['sha256']=='45398b11c513b52bac070fd37303376362e2be0e01fe6b0b4710350c86f56578'
 assert binding(GLOSSARY)['sha256']=='1f3eef83660ec8cd554a8954223a3a6f06eda1729c4c14da1541dfc081f9ec9d'
 assert binding(BUNDLES/'manifest.json')['sha256']=='88ab4d6f2d89dde472b17b2a6baa06c1c77fc1e0f06627876391a26eaef03a74'
 audit=json.loads(AUDIT.read_text());glossary=json.loads(GLOSSARY.read_text())
 RUN.mkdir()
 records=[]
 for suffix in ['006','009','010']:
  member=next(m for m in audit['members'] if m['animationId'].endswith('p'+suffix));id=member['animationId']
  destination=RUN/id;destination.mkdir()
  source=pathlib.Path(os.environ['HELP_MATH_G678_SOURCE_ROOT'])/member['source']['path']
  assert source.stat().st_mode&0o222==0 and binding(source)['sha256']==member['source']['sha256']
  extracted=json.loads((RAW/id/'page-extraction.json').read_text());source_xml=RAW/id/'source.xml'
  assert binding(source_xml)['sha256']==next(b['sha256'] for b in extracted['files'] if b['path']=='source.xml')
  root=ET.parse(source_xml).getroot();tags=list(root.find('tags'))
  characters={int(t.get(k)):t for t in tags for k in ['spriteId','shapeId','buttonId','characterID'] if t.get(k)}
  main_id=member['exactMainTimeline']['objectId'];main=characters[main_id]
  displays=v.source_display_frames(main.find('subTags'));assert len(displays)==member['exactMainTimeline']['frameCount']
  root_matrix=next(p['matrix'] for p in v.source_display_frames(tags)[5].values() if p.get('name')=='animation')
  scripts_root=ROOT/member['diagnosticEvidence']['root']/'ffdec-export/scripts'
  scripts=[{'file':file,'text':file.read_text(),'binding':binding(file)} for file in sorted(scripts_root.rglob('*.as'))]
  assert len(scripts)==member['exactScriptInventory']['fileCount']
  glossary_buttons={}
  for s in scripts:
   key=re.search(r'_global\.KeyAttribute = "([^"]+)";',s['text'])
   if key:
    assert '_root.DoHyperLinks();' in s['text'] and '_root.animation_mc.animation.stop();' in s['text']
    cid=int(s['file'].parent.name.removeprefix('DefineButton2_'))
    glossary_buttons[cid]={'sourceKey':key[1],'script':s['binding']}
  terms=source_terms({b['sourceKey'] for b in glossary_buttons.values()},glossary)
  controls=[];grouped={}
  for frame,display in enumerate(displays,1):
   for p in display.values():
    cid=p['characterId']
    if cid not in glossary_buttons:continue
    item={'sourceObjectId':cid,'depth':p['depth'],'polygon':polygon(p,characters,root_matrix),
          'sourceKey':glossary_buttons[cid]['sourceKey'],'entryId':next(t['id'] for t in terms if t['key']==glossary_buttons[cid]['sourceKey']),
          'scriptSha256':glossary_buttons[cid]['script']['sha256']}
    signature=json.dumps(item,sort_keys=True)
    if signature in grouped and grouped[signature]['lastFrame']==frame-1:grouped[signature]['lastFrame']=frame
    else:
     new={**item,'firstFrame':frame,'lastFrame':frame};controls.append(new);grouped[signature]=new
  value={'schemaVersion':1,'animationId':id,'source':member['source'],'mainObjectId':main_id,'frameCount':len(displays),
         'sourceXml':binding(source_xml),'mainVectorBundle':binding(BUNDLES/(id+'.json')),
         'glossaryControls':controls,'glossaryEntries':terms,
         'sourceScripts':[s['binding'] for s in scripts],
         'localParentRuntimeEstablished':False,'audioAccepted':False,'productCalibrationPassed':False}
  if suffix=='006':
   jar=pathlib.Path('/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.jar')
   launcher=pathlib.Path('/Users/peter/Applications/FFDec.app/Contents/Resources/ffdec.sh')
   assert binding(jar)['sha256']=='090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f'
   assert binding(launcher)['sha256']=='1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab'
   argv=['/opt/homebrew/bin/ffdec','-onerror','abort','-timeout','120','-exportTimeout','600','-format','sprite:svg',
    '-select','28:1-20,48:1-20','-selectid','28,48','-export','sprite',str(destination/'raw'),str(source)]
   result=subprocess.run(argv,cwd=ROOT,capture_output=True,text=True,timeout=660)
   with (destination/'stdout.txt').open('x') as f:f.write(result.stdout)
   with (destination/'stderr.txt').open('x') as f:f.write(result.stderr)
   write(destination/'command.json',{'argv':argv,'returncode':result.returncode,'jar':binding(jar),'launcher':binding(launcher)})
   assert result.returncode==0
   display=displays[23];answers=[]
   for depth in [6,24,26]:
    p=display[depth];correct=depth==6
    assert p['characterId']==(22 if correct else 26)
    answers.append({'id':f"{p['name']}-depth-{depth}",'sourceInstanceName':p['name'],'sourceObjectId':p['characterId'],
      'depth':depth,'correct':correct,'label':'x ≥ 5' if correct else ('10y⁵' if depth==24 else 'x + 10 = 15'),
      'polygon':polygon(p,characters,root_matrix)})
   library=v.VectorLibrary();feedback={}
   for kind,name,cid in [('right','RightFeed_mc',28),('wrong','Mc_Feed_Popup1',48)]:
    placed=next(p for p in display.values() if p.get('name')==name)
    transform=compose(root_matrix,placed['matrix']);folder=v.find_sprite(destination/'raw',cid)
    feedback[kind]={'sourceName':name,'sourceObjectId':cid,'startFrame':2,'endFrame':20,
                   'frameBodies':[library.import_svg(folder/f'{f}.svg',transform) for f in range(1,21)]}
    if kind=='wrong':
     popup_display=v.source_display_frames(characters[cid].find('subTags'))[19]
     close=next(p for p in popup_display.values() if p.get('name')=='BtnClose')
     feedback[kind]['closePolygon']=polygon(close,characters,transform)
     feedback[kind]['glossaryControls']=[{'sourceObjectId':p['characterId'],'depth':p['depth'],
       'sourceKey':glossary_buttons[p['characterId']]['sourceKey'],
       'entryId':next(t['id'] for t in terms if t['key']==glossary_buttons[p['characterId']]['sourceKey']),
       'polygon':polygon(p,characters,transform),'scriptSha256':glossary_buttons[p['characterId']]['script']['sha256']}
       for p in popup_display.values() if p['characterId'] in glossary_buttons]
   value.update({'kind':'source-three-hit-inequality-choice','quizFrame':24,'resumeFrame':25,'terminalFrame':53,
     'answers':answers,'feedback':feedback,'definitions':list(library.definitions.values()),
     'sourceSemanticCorrection':{'previousTextOnlyProjection':'x > 5','sourceVectorProjection':'x ≥ 5','equalityUnderlineShapeId':20},
     'audioLabelDomain':{'sourceObjectId':30,'sourceFrameCount':55,'windows':member['sourceContract']['labelWindows'],
       'localStartInvocationCount':sum('Coach_audio_1.gotoAndPlay' in s['text'] for s in scripts),
       'localEntryDisposition':'source-placed-stopped-domain-without-local-trigger; external-host-entry-unresolved','automaticAudioPlaybackEnabled':False},
     'maintainedAdapter':{'wrongClose':'dismiss complete popup and re-enable all three answer placements',
       'sourceCloseAction':'this._visible=false; _parent.Opt_1.enabled=true; _parent.Opt_2.enabled=true;',
       'ambiguousSourceParentBindingPreserved':True,'wrongFeedGlobalTextBound':False,
       'staticSourceWrongFeedback':'An inequality is a mathematical sentence that has the symbols greater than (>), less than (<), greater than or equal to (≥), less than or equal to (≤), or not equal to (≠). Try again.',
       'extraWrongFeedbackInjected':False}})
  else:
   assert len(main.findall('.//item[@type="DoActionTag"]'))==0 and len(main.findall('.//clipActions'))==0
   contract=member['sourceContract'];nested_id=contract['nestedTimeline']['objectId']
   starts=[s for s in scripts if re.search(r'Mc_Wrong_Feed3\.(gotoAndPlay|play)\s*\(',s['text'])]
   nmh=[p for d in displays for p in d.values() if p.get('name')=='NMHBtn']
   assert not starts and not nmh
   value.update({'kind':'source-linear-teaching-with-glossary','interactiveStops':[],
    'dormantFeedbackDisposition':{'sourceObjectId':nested_id,'sourceFrameCount':70,'sourceInitialFrame':1,
      'sourceMainActionCount':0,'sourceMainClipActionCount':0,'localStartInvocationCount':0,'needMoreHelpPlacementCount':0,
      'sourceEntryReachableFromLocalButtons':False,'sourceHostEntryEstablished':False,
      'candidateTwoTryControlsCreated':False,'preservedSourceContract':contract}})
  write(destination/'interaction-config.json',value)
  records.append({'animationId':id,'config':binding(destination/'interaction-config.json'),'kind':value['kind'],
    'mainFrames':value['frameCount'],'glossaryPlacementRanges':len(controls),'glossaryTermCount':len(terms)})
 write(RUN/'manifest.json',{'schemaVersion':1,'runId':RUN.name,'sourceAudit':binding(AUDIT),'glossaryAudit':binding(GLOSSARY),
  'sourceVectorManifest':binding(BUNDLES/'manifest.json'),'builder':binding(pathlib.Path(__file__)),
  'normalizer':binding(ROOT/'scripts/lib/g678-alg-l11-b-source-vectors.py'),'members':records,
  'files':[binding(f) for f in sorted(RUN.rglob('*')) if f.is_file()],
  'acceptanceEffects':{'registered':False,'productCalibrationPassed':False,'browserQa':False,'originalRuntime':False,
   'visualFidelity':False,'audioAccepted':False,'humanReview':False,'ownerAcceptance':False,'strictComplete':False,'released':False}})
 print(json.dumps({'manifest':binding(RUN/'manifest.json'),'members':records}))

if __name__=='__main__':build()
