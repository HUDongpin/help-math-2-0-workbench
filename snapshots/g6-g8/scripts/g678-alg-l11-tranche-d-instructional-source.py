"""Read the frozen swfmill XML into a small source identity/placement map.

No ActionScript is executed. This is a static display-list and symbol mapper.
"""
import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
symbols = {int(tag.attrib['objectID']): tag for tag in root.iter()
           if tag.tag.startswith('Define') and 'objectID' in tag.attrib}


def text_ids(character_id, stack=()):
    assert character_id not in stack, 'cyclic source symbol'
    tag = symbols[character_id]
    if tag.tag in ('DefineText', 'DefineText2', 'DefineEditText'):
        return [character_id]
    ids = []
    for child in tag.iter():
        if child.tag in ('PlaceObject', 'PlaceObject2', 'PlaceObject3', 'Button'):
            target = child.get('objectID')
            if target and int(target) in symbols:
                ids.extend(text_ids(int(target), stack + (character_id,)))
    return list(dict.fromkeys(ids))


def frames(character_id):
    display = {}
    frame = 1
    label = None
    result = []
    for tag in symbols[character_id].find('tags'):
        if tag.tag == 'FrameLabel':
            label = tag.get('label')
        elif tag.tag in ('PlaceObject', 'PlaceObject2', 'PlaceObject3'):
            depth = int(tag.get('depth'))
            item = dict(display.get(depth, {})) if tag.get('replace') == '1' else {}
            item.update(tag.attrib)
            if tag.find('./transform/Transform') is not None:
                item['transform'] = dict(tag.find('./transform/Transform').attrib)
            display[depth] = item
        elif tag.tag in ('RemoveObject', 'RemoveObject2'):
            display.pop(int(tag.get('depth')), None)
        elif tag.tag == 'ShowFrame':
            result.append({'frame': frame, 'label': label,
                           'placements': [dict(display[depth]) for depth in sorted(display)]})
            frame += 1
            label = None
    return result


if sys.argv[2] == 'p044':
    main = frames(1083)
    questions = []
    for number in range(1, 25):
        frame = next(frame for frame in main if frame['label'] == f'Q{number}')
        review = next(frame for frame in main if frame['label'] == f'R{number}')
        options = [placement for placement in frame['placements']
                   if placement.get('name', '').startswith(f'A{number}Opt')]
        assert sorted(option['name'] for option in options) == [f'A{number}Opt{x}' for x in range(1, 5)]
        for option in options:
            option['textIds'] = text_ids(int(option['objectID']))
        questions.append({'number': number, 'frame': frame['frame'],
                          'reviewFrame': review['frame'], 'label': frame['label'],
                          'placements': frame['placements'], 'options': options})
    print(json.dumps({'questions': questions, 'symbolTextIds':
                     {str(key): text_ids(key) for key in symbols}}, sort_keys=True))
else:
    print(json.dumps({'symbolTextIds': {str(key): text_ids(key) for key in symbols}}, sort_keys=True))
