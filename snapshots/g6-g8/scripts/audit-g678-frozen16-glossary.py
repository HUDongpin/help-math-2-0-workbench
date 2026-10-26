#!/usr/bin/env python3
"""Exact eight-page glossary audit; no Flash execution or source mutation."""
import argparse
import hashlib
import html
import json
import pathlib
import re
import xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parent.parent
EVIDENCE=pathlib.Path('/Volumes/American Dream/hudongpin/helpmath-execution-20260906-01a0747f')
SOURCE=pathlib.Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware')
RECOVERY=pathlib.Path('/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1')
OUT=ROOT/'work/g678-shared-page-factory/frozen16-glossary-audit-v1'
IDS=['shared-alg001-l05-p030','shared-alg001-l08-p025','shared-dat001-l03-p030','shared-dat001-l07-p025',
     'shared-geo001-l02-p020','shared-geo001-l07-p040','shared-geo001-l11-p030','shared-nms002-l05-p040']
SHA_EN='14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'
SHA_ES='3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'
digest=lambda b:hashlib.sha256(b).hexdigest()
inputs={}

def read(p):
    p=pathlib.Path(p);before=p.stat();b=p.read_bytes();after=p.stat()
    assert (before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns)
    inputs[str(p)]={'path':str(p),'bytes':len(b),'sha256':digest(b)}
    return b

def document(p):return json.loads(read(p))
def text(p):return read(p).decode('utf-8-sig').replace('\r\n','\n')

def parse_handler(value):
    match=re.fullmatch(r'on\(release\)\{\n   _global\.KeyAttribute = "([^"\n]+)";\n   _root\.DoHyperLinks\(\);\n   _root\.animation_mc\.animation\.stop\(\);\n\}\n',value)
    assert match,'unsupported glossary action body'
    return match[1]

def normalize(value):
    value=html.unescape(value)
    assert not re.search(r'&[A-Za-z][A-Za-z0-9]*;',value),'unresolved text entity'
    return re.sub(r'\s+',' ',value).strip()

def term_index(xml):
    terms={}
    for match in re.finditer(r'<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)</\1\s*>',xml):
        attrs=dict(re.findall(r'([A-Za-z]+)\s*=\s*"([^"]*)"',match[2]))
        label=attrs.get('ScreenkeyTerm')
        if not label:continue
        defs=match[3].split('~LNG~')
        if len(defs)!=2:continue
        row={'labels':{'en':normalize(label),'es':normalize(match[1].split('~LNG~')[1].replace('~',' '))},
             'definitions':{'en':normalize(defs[0]),'es':normalize(defs[1])},'sourceEntrySha256':digest(match[0].encode()),
             'exampleSwf':attrs.get('ExFileName')}
        terms.setdefault(normalize(label).casefold(),[]).append(row)
    return terms

def button_ranges(main,button_ids):
    """Sample the direct display list at ShowFrame, including authored fades."""
    frame=1;depths={};ranges={n:[] for n in button_ids};active={};alpha_events={n:[] for n in button_ids}
    def sample():
        visible={(depth,s['character']):s for depth,s in depths.items() if s['character'] in button_ids and s['alpha']>0}
        for key,first in list(active.items()):
            if key not in visible:
                depth,character=key;ranges[character].append({'firstFrame':first,'lastFrame':frame-1,'depth':depth});del active[key]
        for key in visible:active.setdefault(key,frame)
    for n in main.find('tags'):
        if n.tag=='ShowFrame':sample();frame+=1
        elif n.tag in ('PlaceObject','PlaceObject2','PlaceObject3'):
            depth=int(n.attrib['depth']);character=n.get('objectID')
            prior=depths.get(depth)
            if character is not None:
                depths[depth]={'character':int(character),'alpha':prior['alpha'] if prior and n.get('replace')=='1' else 256}
            else:assert prior is not None,'moving absent display-list entry'
            state=depths[depth]
            color=n.find('colorTransform/ColorTransform2')
            if color is not None:
                assert int(color.get('offsetAlpha','0'))==0,'additive alpha requires separate disposition'
                state['alpha']=int(color.get('factorAlpha','256'))
            if state['character'] in button_ids:
                assert n.get('clipDepth') is None,'masked glossary button requires its own audit'
                assert n.find('clipActions') is None,'button placement script requires its own audit'
                if character is not None or color is not None:alpha_events[state['character']].append({'frame':frame,'depth':depth,'factorAlpha':state['alpha']})
        elif n.tag in ('RemoveObject','RemoveObject2'):depths.pop(int(n.attrib['depth']),None)
    assert frame-1==int(main.attrib['frames'])
    depths.clear();sample()
    for n in button_ids:assert ranges[n],f'button {n} has no direct main-timeline placement'
    return ranges,alpha_events

def build():
    catalog=document(ROOT/'catalog/g678-shared-catalog.v1.json')
    frozen=document(ROOT/'catalog/product-bridge-calibrations/g678-16-page-product-calibration-v1.registered.json')
    assert sorted(p['animationId'] for p in frozen['selectedPages'] if p['adapterFamily']=='linear-glossary-source-static')==IDS
    pages={p['animationId']:(l,p) for l in catalog['lessons'] for p in l['pages']}
    current=document(ROOT/'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v2.json')
    selections={p['animationId']:p for p in current['selectedPages']}
    structural=document(ROOT/'catalog/g678-pure-linear-structural-inventory-v1.json')
    facts={id:r['classification'] for r in structural['records'] for id in r['placementIds']}
    hostbase=EVIDENCE/'canonical-indexmi-host-audit-v1'
    hostsource=read(hostbase/'source.swf');assert digest(hostsource)=='275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9'
    host=text(hostbase/'scripts/scripts/frame_35/DoAction.as')
    init=text(hostbase/'scripts/scripts/frame_50/DoAction.as')
    assert '_root.doInitKeyTerms();' in init
    assert re.search(r'function doInitKeyTerms\(\)[\s\S]*?_loc2_\.KeyTermVar = _loc2_\.xmlPath \+ "XML/L1KTE01.xml";[\s\S]*?_loc1_\.doCreateGlossaryWord\("Source"\);',host)
    assert 'F_X.load(_loc1_.KeyTermVar);' in host
    assert '_loc2_.KeyTermVar = _loc2_.xmlPath + "XML/L1KTS01.xml";' in host
    assert re.search(r'function DoHyperLinks\(\)[\s\S]*?_loc2_\.Pause = true;[\s\S]*?_loc2_\.Play = false;[\s\S]*?_loc1_\.m_c\.doGetSubLink\(_loc2_\.KeyAttribute\);',host)
    assert '_global.xmlPath = _global.ServerRoot + "/HELP_KEYTERMS/KT/";' in host
    xmls={}
    for lang,sha in [('en',SHA_EN),('es',SHA_ES)]:
        p=RECOVERY/f'objects/sha256/{sha[:2]}/{sha}';b=read(p);assert digest(b)==sha
        xmls[lang]=term_index(b.decode('utf-8-sig'))
    records=[]
    for id in IDS:
        lesson,page=pages[id];source=read(SOURCE/page['viewPath']);assert digest(source)==page['sourceSha256']
        member=ROOT/'work/g678-shared-page-factory/g678-shared-current-js-calibration-13-v1/members'/id
        manifest=document(member/'member-manifest.json');assert manifest['source']['sha256']==page['sourceSha256']
        inventory=manifest['compiler']['canvasInventory']['files'];scripts=[]
        for item in inventory:
            if item['path'].endswith('.as'):
                p=member/'canvas'/item['path'];b=read(p);assert len(b)==item['bytes'] and digest(b)==item['sha256'];scripts.append((item['path'],b.decode().replace('\r\n','\n')))
        handlers={}
        for file,value in scripts:
            match=re.fullmatch(r'scripts/DefineButton2_(\d+)/BUTTONCONDACTION on\(release\)\.as',file)
            if match:handlers[int(match[1])]=parse_handler(value)
            else:
                assert file in ['scripts/frame_1/DoAction.as','scripts/frame_6/DoAction.as'] or re.fullmatch(r'scripts/DefineSprite_\d+/frame_\d+/DoAction.as',file),file
                if file!='scripts/frame_1/DoAction.as':assert value=='stop();\n',file
        xmlfile=EVIDENCE/'frozen16-audio-v1'/id/'source.xml';xmlbytes=read(xmlfile)
        audio=document(EVIDENCE/'frozen16-audio-v1'/id/'audio-timing.json');assert digest(xmlbytes)==audio['xml']['sha256']
        xml=ET.fromstring(xmlbytes);main_id=selections[id]['runtime']['frameDomain'].split('-')[1]
        definitions={int(n.get('objectID')):n for n in xml.iter('DefineButton2')}
        assert len(definitions)==facts[id]['buttonCount']
        non_scripted=sorted(set(definitions)-set(handlers))
        assert non_scripted==([7] if id=='shared-dat001-l07-p025' else []),(id,non_scripted)
        for character in non_scripted:assert definitions[character].findall('./conditions/Condition')==[]
        main=next(n for n in xml.iter('DefineSprite') if n.get('objectID')==main_id)
        ranges,alpha_events=button_ranges(main,set(handlers));buttons=[]
        for char,key in sorted(handlers.items()):
            node=next(n for n in xml.iter('DefineButton2') if n.get('objectID')==str(char))
            conditions=node.findall('./conditions/Condition');assert len(conditions)==1
            condition=conditions[0];assert condition.get('pointerReleaseInside')=='1'
            for k,v in condition.attrib.items():
                if k!='pointerReleaseInside':assert v=='0',(id,char,k,v)
            values=[n.get('value') for n in condition.findall('./actions/Dictionary/strings/String')]
            assert values==['_global','KeyAttribute',key,'_root','DoHyperLinks','animation_mc','animation','stop'],(id,char,values)
            normalized=normalize(key).casefold();left=xmls['en'].get(normalized,[]);right=xmls['es'].get(normalized,[])
            assert len(left)==1 and len(right)==1,(id,key,'ambiguous/missing dictionary entry',len(left),len(right))
            l,r=left[0],right[0]
            buttons.append({'sourceCharacterId':char,'sourceKeyAttribute':key,'entryId':re.sub(r'[^a-z0-9]+','-',normalized).strip('-'),
                'ranges':ranges[char],'alphaEvents':alpha_events[char],'labels':{'en':l['labels']['en'],'es':r['labels']['es']},
                'definitions':{'en':l['definitions']['en'],'es':r['definitions']['es']},
                'sourceEntrySha256':{'en':l['sourceEntrySha256'],'es':r['sourceEntrySha256']},
                'definitionVariants':{'englishXml':l['definitions'],'spanishXml':r['definitions']},
                'dictionary':{'en':{'path':'HELP_KEYTERMS/KT/XML/L1KTE01.xml','sha256':SHA_EN},'es':{'path':'HELP_KEYTERMS/KT/XML/L1KTS01.xml','sha256':SHA_ES}}})
        records.append({'animationId':id,'source':{'path':page['viewPath'],'sha256':page['sourceSha256'],'bytes':page['sourceBytes']},
            'mainFrameDomain':'sprite-'+main_id,'mainFrameCount':int(main.get('frames')),'rootFrame':6,
            'declaredLessonKeyTerms':lesson['keyTerms'],'effectiveDictionaryEvidence':'canonical-indexMI-frame50-doInitKeyTerms-fixed-L1-static-path',
            'buttons':buttons,'runtime':selections[id]['runtime'],'sourceAudioStreamCount':sum(len(d['streams']) for d in audio['domains']),
            'nonScriptedButtonDefinitions':non_scripted,
            'sourceActions':['set KeyAttribute','DoHyperLinks','stop animation'],
            'productCalibrationPassed':False,'remaining':['modern-host-integration-and-browser-calibration','source-audio-lifecycle','original-runtime-fidelity-and-human-review']})
    read(__file__)
    return {'schemaVersion':1,'artifactType':'g678-frozen16-eight-glossary-source-audit-v1','selectedIds':IDS,'records':records,
        'summary':{'pages':len(records),'buttonDefinitions':sum(len(r['buttons']) for r in records),'distinctTerms':len({b['entryId'] for r in records for b in r['buttons']})},
        'hostSource':{'path':'NewHelpProgram/HELP_COURSES/indexMI.swf','sha256':digest(hostsource),'staticReferenceOnly':True},
        'inputBindings':list(inputs.values()),'limitations':['Canonical indexMI source proves its own static initialization and API behavior; no original runtime or deployment association is claimed.','Lesson XML key-term references remain recorded even when this host initialization selects fixed L1 files.','Glossary diagrams, audio and nested sublinks remain independently unimplemented.'],
        'acceptanceEffects':{'productCalibrationPassed':False,'scaleOutAuthorized':False,'originalRuntimeAccepted':False,'audioAccepted':False,'humanAccepted':False,'ownerAccepted':False,'strictComplete':False}}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    report=build();content=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.check:assert (OUT/'audit.json').read_text()==content
    else:
        OUT.mkdir()
        with (OUT/'audit.json').open('x') as f:f.write(content)
    print(json.dumps(report['summary']))
if __name__=='__main__':main()
