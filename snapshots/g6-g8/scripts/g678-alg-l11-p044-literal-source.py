"""Static source-symbol evidence for literal prompts and choices, not answers."""
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
root=ET.parse(sys.argv[1]).getroot()
symbols={int(n.get('objectID')):n for n in root.iter() if n.tag.startswith('Define') and n.get('objectID') and n.tag!='DefineFontName'}
selected=json.loads(sys.argv[2])
def digest(node):return hashlib.sha256(ET.tostring(node,encoding='utf-8')).hexdigest()
def evidence(character_id):
    node=symbols[character_id]
    result={'characterId':character_id,'kind':node.tag,'subtreeSha256':digest(node)}
    bounds=node.find('./bounds/Rectangle')
    if bounds is not None:result['boundsTwips']=dict(bounds.attrib)
    if node.tag in ('DefineText','DefineText2'):
        font_id=None;x=0;y=0;height=0;glyphs=[]
        for record in node.iter('TextRecord6'):
            if record.get('isSetup')=='1':
                font_id=int(record.get('objectID',font_id));x=int(record.get('x',x));y=int(record.get('y',y));height=int(record.get('fontHeight',height))
            else:
                for entry in record.iter('TextEntry'):
                    index=int(entry.get('glyph'));glyph=symbols[font_id].find('glyphs')[index];char=chr(int(glyph.get('map')))
                    glyphs.append({'fontId':font_id,'glyphIndex':index,'character':char,'x':x,'y':y,'fontHeight':height,'advance':int(entry.get('advance')),'glyphSha256':digest(glyph)})
                    x+=int(entry.get('advance'))
        result['glyphs']=glyphs;result['text']=''.join(g['character']for g in glyphs)
    if node.tag=='DefineSprite':
        placements=[]
        for child in node.find('tags'):
            if child.tag=='ShowFrame':break
            if child.tag in ('PlaceObject2','PlaceObject3'):
                placements.append({'depth':int(child.get('depth')),'characterId':int(child.get('objectID')),
                                   'transform':dict(child.find('./transform/Transform').attrib)})
        result['firstFramePlacements']=placements
    return result
closure={}
def visit(cid):
    if cid in closure:return
    value=evidence(cid);closure[cid]=value
    for placement in value.get('firstFramePlacements',[]):visit(placement['characterId'])
for cid in selected:visit(cid)
print(json.dumps({'subtreeHashEncoding':'xml.etree.ElementTree.tostring utf-8','symbols':[closure[key]for key in sorted(closure)]},sort_keys=True))
