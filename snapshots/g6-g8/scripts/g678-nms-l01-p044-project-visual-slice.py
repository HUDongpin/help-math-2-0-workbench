#!/usr/bin/env python3
"""Private source-semantic SVG projection; no source AS execution or acceptance."""
import copy, hashlib, json, pathlib, re, sys, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
SVG='http://www.w3.org/2000/svg';XLINK='http://www.w3.org/1999/xlink';FF='https://www.free-decompiler.com/flash'
for prefix,uri in [('',SVG),('xlink',XLINK),('ffdec',FF)]:ET.register_namespace(prefix,uri)
H=lambda b:hashlib.sha256(b).hexdigest()
def locked(p,sha=None):
    b=(ROOT/p).read_bytes()
    if sha:assert H(b)==sha
    return b
def root_of(b):
    assert b'<!DOCTYPE' not in b and b'<!ENTITY' not in b
    r=ET.fromstring(b)
    for n in r.iter():
        assert n.tag.split('}')[-1] not in ['script','foreignObject','animate','set']
        for k,v in n.attrib.items():
            assert not k.lower().startswith('on')
            if k in ['href','{'+XLINK+'}href']:assert v.startswith('#') or v.startswith('data:image/')
    return r
def ids(r,prefix):
    names=[n.get('id') for n in r.iter() if n.get('id')];assert len(names)==len(set(names))
    mapping={v:prefix+str(i) for i,v in enumerate(names)}
    for n in r.iter():
        for k,v in list(n.attrib.items()):
            if k=='id':n.set(k,mapping[v])
            elif k in ['href','{'+XLINK+'}href'] and v.startswith('#'):
                assert v[1:] in mapping,('missing source SVG ref',v);n.set(k,'#'+mapping[v[1:]])
            elif 'url(#' in v:
                def repl(m):assert m[1] in mapping;return 'url(#'+mapping[m[1]]+')'
                n.set(k,re.sub(r'url\(#([^)]*)\)',repl,v))
    return mapping
def compose(root_bytes,main_bytes,empty_sprite_proved):
    root=root_of(root_bytes);main=root_of(main_bytes)
    existing={n.get('id') for n in main.iter() if n.get('id')}
    missing=[n for n in main.iter() if n.get('{'+XLINK+'}href','').startswith('#') and n.get('{'+XLINK+'}href')[1:] not in existing]
    if missing:
        assert empty_sprite_proved and len(missing)==1 and missing[0].get('{'+FF+'}characterId')=='43' and missing[0].get('{'+XLINK+'}href')=='#sprite0'
        ET.SubElement(main.find('{'+SVG+'}defs'),'{'+SVG+'}g',{'id':'sprite0'})
    ids(root,'root-');ids(main,'main-')
    group=root.find('{'+SVG+'}g');animation=[n for n in group if n.get('{'+FF+'}characterId')=='293'];assert len(animation)==1
    target=animation[0];assert target.get('transform')=='matrix(1.0, 0.0, 0.0, 1.0, 412.35, 282.9)'
    mg=main.find('{'+SVG+'}g');assert mg.get('transform')=='matrix(1.0, 0.0, 0.0, 1.0, 373.25, 669.7)'
    substitute=ET.Element('{'+SVG+'}g',{'transform':target.get('transform'),'{'+FF+'}characterId':'293'})
    for n in mg:substitute.append(copy.deepcopy(n))
    index=list(group).index(target);group.remove(target);group.insert(index,substitute)
    for n in main.find('{'+SVG+'}defs'):root.find('{'+SVG+'}defs').append(copy.deepcopy(n))
    root.set('viewBox','0 0 800 600');root.set('width','800');root.set('height','600')
    return ET.tostring(root,encoding='unicode')
def main():
    raw='work/g678-shared-page-factory/g678-nms-l01-p044-visual-slice-v2'
    run=json.loads(locked(raw+'/run.json','2bbc355ac09eeafd9c427b5ec2d81cd689705c67185dc7e967f66197153934c9'))
    assert run['status']=='selected-raw-visuals-extracted-not-renderer'
    for f in run['outputs']:assert len(locked(f['path'],f['sha256']))==f['bytes']
    xml=ET.fromstring(locked('work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v2/ffdec-source.xml','3a3338eacd66b788cdda556128e0ff4715eb5647f3dfb16d1e5a2e0243d5a1fa'))
    defs={int(n.get('spriteId')):n for n in xml.iter() if n.get('type')=='DefineSpriteTag'}
    morph={int(n.get('characterId')) for n in xml.iter() if n.get('type','').startswith('DefineMorphShape')}
    events={}
    for sid,domain in [('root',xml.find('tags'))]+[(str(i),d.find('subTags')) for i,d in defs.items()]:
        frame=1;rows=[]
        for n in domain:
            t=n.get('type')
            if t=='ShowFrameTag':frame+=1
            elif t in ['PlaceObject2Tag','RemoveObject2Tag']:
                rows.append({'frame':frame,'type':t,'attributes':n.attrib,'matrix':n.find('matrix').attrib if n.find('matrix') is not None else None,'colorTransform':n.find('colorTransform').attrib if n.find('colorTransform') is not None else None})
        events[sid]=rows
    root_bytes=locked(raw+'/root-svg/6.svg')
    assert defs[43].get('frameCount')=='1' and [n.get('type') for n in defs[43].find('subTags')]==['ShowFrameTag']
    images={str(f):compose(root_bytes,locked(raw+f'/main-svg/DefineSprite_293/{f}.svg'),True) for f in [1,20,312]}
    output={'scope':'Selected structural source composition only; source AS visibility/child-clock/controller behavior not applied.',
      'rootMainNativeTranslation':[412.35,282.9],'mainExportInternalOrigin':[373.25,669.7],'canvasStageRenderOffset':[39.1,-386.8],
      'sourceStage':[800,600],'rootFrame':6,'mainDeclaredFrames':759,'sourceRootTitleId':16,'rootOffstageTextId':294,
      'sourceMainVisualEventFramesThrough312':sorted({e['frame'] for e in events['293'] if e['frame']<=312}),
      'morphDefinitions':sorted(morph),'directMorphPlacementCounts':{str(i):sum(int(n.get('characterId','0')) in morph for n in d.find('subTags')) for i,d in defs.items()},
      'events':events,'svgPointProjections':images,'emptySpriteDefinition':{'sourceCharacterId':43,'declaredFrames':1,'sourceTags':['ShowFrameTag'],'projection':'Explicit empty SVG group for exact FFDec-omitted no-ink definition; no invented hit area'},
      'normalization':'Remove only main-export bounding-box origin and apply exact root main placement once; preserve root title/offstage text and namespace source ID references; no path or glyph edits.'}
    print(json.dumps(output,separators=(',',':')))
if __name__=='__main__':main()
