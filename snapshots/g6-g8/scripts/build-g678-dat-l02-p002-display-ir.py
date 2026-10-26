#!/usr/bin/env python3
"""Freeze P002 root, parent, child display events and source audio blocks."""

import argparse
import base64
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/DAT001/L2/RW/L2RW02.swf')
SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16'
WORK = ROOT / 'migrations/shared-dat001-l02-p002/audit'
XML = WORK / 'movie.xml'
XML_SHA = '1d0d14c87f96f7a501311833a90ee50257f392129bb068fb3c27fb6800cce02a'
INSTANCES = WORK / 'nested-domain-instances-v1.json'
INSTANCES_SHA = '516362a046f6731472de6106b2d1a84f1722d86cf16a62fe4a9f9e03f2512092'
OUTPUTS = (WORK / 'display-ir-v1.json',
           ROOT / 'packages/demos/src/generated/dat001-l02-p002-display-ir-v1.json')
FRAME_DOMAINS = {'root': 10, 'sprite-113': 276, 'sprite-41': 279,
                 'sprite-49': 22, 'sprite-53': 151, 'sprite-116': 1}
EXPECTED_TAGS = {
    'sprite-113': {'PlaceObject2': 1544, 'RemoveObject2': 141, 'ShowFrame': 276,
                   'SoundStreamHead': 1, 'SoundStreamBlock': 276, 'DoAction': 1, 'End': 1},
    'sprite-41': {'PlaceObject2': 988, 'RemoveObject2': 12, 'ShowFrame': 279, 'End': 1},
    'sprite-49': {'PlaceObject2': 6, 'RemoveObject2': 2, 'ShowFrame': 22, 'End': 1},
    'sprite-53': {'PlaceObject2': 456, 'RemoveObject2': 12, 'ShowFrame': 151, 'End': 1},
    'sprite-116': {'PlaceObject2': 1, 'ShowFrame': 1, 'End': 1},
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def pinned(path: Path, expected_sha: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'nonphysical source input: {path}')
    data = path.read_bytes()
    if sha(data) != expected_sha:
        raise ValueError(f'source input drift: {path}')
    return data


def source_tree() -> ET.Element:
    pinned(SOURCE, SOURCE_SHA)
    xml = pinned(XML, XML_SHA)
    regenerated = subprocess.run(
        ['swfmill', '-n', 'swf2xml', str(SOURCE)], check=True, capture_output=True,
    ).stdout
    if regenerated != xml:
        raise ValueError('SWF/XML extraction drift')
    return ET.fromstring(xml)


def timeline(tags: ET.Element, count: int) -> dict:
    frame = 1
    events = []
    sound = []
    actions = []
    census = Counter()
    for tag in tags:
        census[tag.tag] += 1
        if tag.tag == 'ShowFrame':
            frame += 1
        elif tag.tag == 'PlaceObject2':
            if any(child.tag not in ('transform', 'colorTransform') for child in tag):
                raise ValueError('unsupported placement child')
            transform = tag.find('transform/Transform')
            color = tag.find('colorTransform/ColorTransform2')
            events.append({'frame': frame, 'op': 'place', 'attributes': tag.attrib,
                           'transform': transform.attrib if transform is not None else None,
                           'colorTransform': color.attrib if color is not None else None})
        elif tag.tag == 'RemoveObject2':
            events.append({'frame': frame, 'op': 'remove', 'attributes': tag.attrib})
        elif tag.tag == 'SoundStreamBlock':
            raw = base64.b64decode(tag.findtext('data') or '', validate=True)
            if len(raw) < 4:
                raise ValueError('short source audio block')
            sound.append({'frame': frame, 'sampleCount': int.from_bytes(raw[:2], 'little'),
                          'seekSamples': int.from_bytes(raw[2:4], 'little', signed=True),
                          'payloadSha256': sha(raw[4:])})
        elif tag.tag == 'DoAction':
            actions.append({'frame': frame, 'xmlSha256': sha(ET.tostring(tag)),
                            'stopsPlayhead': any(action.tag == 'Stop' for action in tag.iter())})
    if frame != count + 1:
        raise ValueError(f'timeline frame count drift: {frame - 1} != {count}')
    return {'frames': count, 'tagCensus': dict(sorted(census.items())),
            'displayEvents': events, 'soundBlocks': sound, 'actions': actions}


def render() -> bytes:
    tree = source_tree()
    header = tree.find('Header')
    if (tree.attrib != {'version': '6', 'compressed': '1'} or header is None or
        header.attrib != {'framerate': '12', 'frames': '10'} or
        header.find('size/Rectangle').attrib !=
            {'left': '0', 'right': '16000', 'top': '0', 'bottom': '12000'}):
        raise ValueError('SWF header drift')
    root_tags = header.find('tags')
    if root_tags is None:
        raise ValueError('root tags missing')
    definitions = {}
    for tag in root_tags:
        if tag.tag.startswith('Define') and tag.tag != 'DefineFontName' and tag.get('objectID') is not None:
            character_id = int(tag.attrib['objectID'])
            if character_id in definitions:
                raise ValueError('duplicate source character')
            definitions[character_id] = tag.tag
    if len(definitions) != 117:
        raise ValueError(f'definition census drift: {len(definitions)}')
    sprites = {int(tag.attrib['objectID']): tag for tag in root_tags if tag.tag == 'DefineSprite'}
    if set(sprites) != {41, 49, 53, 113, 116}:
        raise ValueError('sprite definition drift')
    domains = {'root': timeline(root_tags, 10)}
    for name, count in FRAME_DOMAINS.items():
        if name == 'root':
            continue
        sprite = sprites[int(name.removeprefix('sprite-'))]
        if int(sprite.attrib['frames']) != count:
            raise ValueError(f'{name} frame count drift')
        item = timeline(sprite.find('tags'), count)
        if item['tagCensus'] != EXPECTED_TAGS[name]:
            raise ValueError(f'{name} tag census drift')
        domains[name] = item
    for domain in domains.values():
        for event in domain['displayEvents']:
            character = event['attributes'].get('objectID')
            if character is not None and int(character) not in definitions:
                raise ValueError(f'undefined source character {character}')
    root_places = [(event['frame'], event['attributes'].get('depth'),
                    event['attributes'].get('objectID'))
                   for event in domains['root']['displayEvents']
                   if event['op'] == 'place' and event['attributes'].get('objectID') == '113']
    if root_places != [(6, '1', '113')]:
        raise ValueError('main root placement drift')
    if ([(a['frame'], a['stopsPlayhead']) for a in domains['root']['actions']] !=
        [(1, True), (6, True)] or
        [(a['frame'], a['stopsPlayhead']) for a in domains['sprite-113']['actions']] !=
        [(276, True)] or
        any(domains[name]['actions'] for name in ('sprite-41', 'sprite-49', 'sprite-53', 'sprite-116'))):
        raise ValueError('source action boundary drift')
    if [block['frame'] for block in domains['sprite-113']['soundBlocks']] != list(range(1, 277)):
        raise ValueError('main audio-block schedule drift')
    instance_data = json.loads(pinned(INSTANCES, INSTANCES_SHA))
    if instance_data['sourceSwfSha256'] != SOURCE_SHA or instance_data['sourceXmlSha256'] != XML_SHA:
        raise ValueError('nested-instance source drift')
    packet = {
        'schemaVersion': 1, 'kind': 'g678-dat-l02-p002-display-ir-v1',
        'animationId': 'shared-dat001-l02-p002', 'sourceSwfSha256': SOURCE_SHA,
        'sourceXmlSha256': XML_SHA, 'nestedInstancesSha256': INSTANCES_SHA,
        'stage': {'width': 800, 'height': 600}, 'fps': 12,
        'definitions': {str(key): value for key, value in sorted(definitions.items())},
        'domains': domains, 'nestedInstances': instance_data['instances'],
        'claimBoundary': ('Static display, morph-ratio and stream-block events for independent frame domains. '
                          'Synchronous child-frame projections are not original-host playback, visual fidelity, '
                          'audio synchronization, or completion evidence.'),
    }
    return (json.dumps(packet, indent=2) + '\n').encode()


def write_outputs(data: bytes, paths: tuple[Path, Path] = OUTPUTS) -> None:
    if any(path.exists() or path.is_symlink() for path in paths):
        raise FileExistsError('source display IR output already exists')
    for path in paths:
        with path.open('xb') as target:
            target.write(data)


def check_outputs(data: bytes, paths: tuple[Path, Path] = OUTPUTS) -> None:
    if any(path.is_symlink() or path.read_bytes() != data for path in paths):
        raise ValueError('source display IR drift')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = render()
    if args.write:
        write_outputs(data)
    else:
        check_outputs(data)
    print(f'PASS DAT001 L2 P002 display IR: {len(data)} bytes, SHA-256 {sha(data)}')


if __name__ == '__main__':
    main()
