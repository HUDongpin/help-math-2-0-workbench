import json
import sys
import xml.etree.ElementTree as ET

root=ET.parse(sys.argv[1]).getroot()
sprite=root.find('.//DefineSprite[@objectID="225"]/tags')
frame=1
result=[]
for tag in sprite:
    if tag.tag=='PlaceObject2' and tag.get('name','').startswith('Mc') and frame in (2,4):
        name=tag.get('name','')
        if '_Img' in name or name[-2:] in ('_1','_2'):
            result.append({'level':1 if frame==2 else 2,'frame':frame,
                           'name':name,'characterId':int(tag.get('objectID')),
                           'depth':int(tag.get('depth')),
                           'transform':dict(tag.find('./transform/Transform').attrib)})
    if tag.tag=='ShowFrame':frame+=1
print(json.dumps(result,sort_keys=True))
