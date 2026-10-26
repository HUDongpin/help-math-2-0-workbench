#!/usr/bin/env python3
"""Pin P002's directly placed child timelines to the exact shipped SWF."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/DAT001/L2/RW/L2RW02.swf')
SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16'
XML = ROOT / 'migrations/shared-dat001-l02-p002/audit/movie.xml'
XML_SHA = '1d0d14c87f96f7a501311833a90ee50257f392129bb068fb3c27fb6800cce02a'
OUTPUT = ROOT / 'migrations/shared-dat001-l02-p002/audit/nested-domain-instances-v1.json'
MAIN_ID = 113
CHILD_IDS = (41, 49, 53)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def checked_tree() -> ET.Element:
    if SOURCE.is_symlink() or not SOURCE.is_file() or SOURCE.resolve() != SOURCE:
        raise ValueError('source must be the physical SWF')
    if sha(SOURCE.read_bytes()) != SOURCE_SHA:
        raise ValueError('source SWF drift')
    if XML.is_symlink() or not XML.is_file() or sha(XML.read_bytes()) != XML_SHA:
        raise ValueError('source XML drift')
    regenerated = subprocess.run(
        ['swfmill', '-n', 'swf2xml', str(SOURCE)], check=True, capture_output=True,
    ).stdout
    if sha(regenerated) != XML_SHA or regenerated != XML.read_bytes():
        raise ValueError('SWF and source XML no longer match')
    return ET.fromstring(regenerated)


def frame_events(tags: ET.Element):
    frame = 1
    for tag in tags:
        if tag.tag == 'ShowFrame':
            frame += 1
        else:
            yield frame, tag


def frame_has_stop(tags: ET.Element, frame: int) -> bool:
    return any(number == frame and any(action.tag == 'Stop' for action in tag.iter())
               for number, tag in frame_events(tags) if tag.tag == 'DoAction')


def child_instances(main_tags: ET.Element, child_frames: dict[int, int], main_frames: int):
    active: dict[int, dict] = {}
    finished = []

    def close(depth: int, last_frame: int) -> None:
        if depth not in active:
            return
        instance = active.pop(depth)
        instance['lastParentFrame'] = last_frame
        instance['presentAtParentStop'] = last_frame == main_frames
        instance['synchronousChildFrameAtLastParentFrame'] = (
            (last_frame - instance['firstParentFrame']) %
            child_frames[instance['characterId']] + 1
        )
        finished.append(instance)

    for frame, tag in frame_events(main_tags):
        if tag.tag == 'RemoveObject2':
            close(int(tag.attrib['depth']), frame - 1)
        elif tag.tag == 'PlaceObject2':
            depth = int(tag.attrib['depth'])
            character = tag.attrib.get('objectID')
            if character is None:
                if depth in active:
                    active[depth]['moveOnlyUpdates'] += 1
                continue
            close(depth, frame - 1)
            character_id = int(character)
            if character_id in child_frames:
                active[depth] = {
                    'characterId': character_id,
                    'depth': depth,
                    'firstParentFrame': frame,
                    'sourceChildFrameCount': child_frames[character_id],
                    'moveOnlyUpdates': 0,
                }
    for depth in list(active):
        close(depth, main_frames)
    return sorted(finished, key=lambda item: (item['firstParentFrame'], item['depth']))


def render_packet() -> dict:
    tree = checked_tree()
    root_tags = tree.find('./Header/tags')
    if root_tags is None or tree.find('Header').attrib != {'framerate': '12', 'frames': '10'}:
        raise ValueError('root frame contract drift')
    sprites = {int(tag.attrib['objectID']): tag for tag in root_tags.iter('DefineSprite')}
    main = sprites[MAIN_ID]
    main_frames = int(main.attrib['frames'])
    child_frames = {id: int(sprites[id].attrib['frames']) for id in CHILD_IDS}
    main_tags = main.find('tags')
    if main_tags is None or main_frames != 276 or child_frames != {41: 279, 49: 22, 53: 151}:
        raise ValueError('nested frame domain drift')
    root_entries = [(frame, int(tag.attrib['depth'])) for frame, tag in frame_events(root_tags)
                    if tag.tag == 'PlaceObject2' and tag.attrib.get('objectID') == str(MAIN_ID)]
    if root_entries != [(6, 1)] or not frame_has_stop(root_tags, 6) or not frame_has_stop(main_tags, 276):
        raise ValueError('root or main entry/stop drift')
    if any(list(sprites[id].iter('DoAction')) for id in CHILD_IDS):
        raise ValueError('child script review required')
    instances = child_instances(main_tags, child_frames, main_frames)
    expected = [(41, 108, 1, 42), (49, 199, 1, 42), (53, 240, 1, 42),
                (49, 253, 43, 276), (41, 162, 60, 276), (53, 325, 60, 276)]
    observed = [(i['characterId'], i['depth'], i['firstParentFrame'], i['lastParentFrame'])
                for i in instances]
    if observed != expected:
        raise ValueError(f'child-instance lifetime drift: {observed}')
    sound_frames = [frame for frame, tag in frame_events(main_tags) if tag.tag == 'SoundStreamBlock']
    if sound_frames != list(range(1, main_frames + 1)):
        raise ValueError('main stream-block frame drift')
    return {
        'schemaVersion': 1,
        'kind': 'g678-dat-l02-p002-nested-domain-instances-v1',
        'animationId': 'shared-dat001-l02-p002',
        'sourceSwfSha256': SOURCE_SHA,
        'sourceXmlSha256': XML_SHA,
        'root': {'frames': 10, 'mainCharacterId': MAIN_ID, 'mainEntryFrame': 6,
                 'mainDepth': 1, 'stopFrame': 6},
        'main': {'frames': main_frames, 'stopFrame': 276,
                 'soundStreamBlockFrames': len(sound_frames)},
        'children': [{'characterId': id, 'frames': child_frames[id]} for id in CHILD_IDS],
        'instances': instances,
        'claimBoundary': ('Source display-list lifetimes and synchronous child-frame projections only. '
                          'The original host entry, child playback after parent Stop, visible output, '
                          'audio synchronization and completion require separate runtime evidence.'),
    }


def encoded_packet() -> bytes:
    return (json.dumps(render_packet(), indent=2) + '\n').encode()


def write_new(path: Path, data: bytes) -> None:
    with path.open('xb') as target:
        target.write(data)


def check_existing(path: Path, data: bytes) -> None:
    if path.is_symlink() or path.read_bytes() != data:
        raise ValueError('nested-domain packet drift')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = encoded_packet()
    if args.write:
        write_new(OUTPUT, data)
    else:
        check_existing(OUTPUT, data)
    print(f'PASS DAT001 L2 P002 nested domains: {sha(data)}')


if __name__ == '__main__':
    main()
