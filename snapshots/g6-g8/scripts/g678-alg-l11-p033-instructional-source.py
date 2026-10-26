import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
sprite = root.find('.//DefineSprite[@objectID="116"]')
assert sprite.get('frames') == '606'
display = {}
frames = []
frame = 1
label = None
for tag in sprite.find('tags'):
    if tag.tag == 'FrameLabel':
        label = tag.get('label')
    elif tag.tag in ('PlaceObject2', 'PlaceObject3'):
        depth = int(tag.get('depth'))
        item = dict(display.get(depth, {})) if tag.get('replace') == '1' else {}
        item.update(tag.attrib)
        transform = tag.find('./transform/Transform')
        if transform is not None:
            item['transform'] = dict(transform.attrib)
        display[depth] = item
    elif tag.tag == 'RemoveObject2':
        display.pop(int(tag.get('depth')), None)
    elif tag.tag == 'ShowFrame':
        frames.append({'frame': frame, 'label': label,
                       'placements': [dict(display[depth]) for depth in sorted(display)]})
        frame += 1
        label = None
assert len(frames) == 606
print(json.dumps({'frames': frames, 'frameCount': 606}, sort_keys=True))
