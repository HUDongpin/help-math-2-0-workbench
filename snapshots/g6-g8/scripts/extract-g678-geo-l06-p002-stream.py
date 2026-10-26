#!/usr/bin/env python3
"""Extract the complete, source-pinned sprite-230 MP3 stream without segmenting it."""

import argparse
import base64
import hashlib
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/GEO001/L6/RW/L6RW02.swf')
XML = ROOT / 'migrations/shared-geo001-l06-p002/audit/movie.xml'
DEFAULT_OUTPUT = ROOT / 'migrations/shared-geo001-l06-p002/audit/sprite-230-source-stream-v1.mp3'
SOURCE_SHA256 = '3f340d0201e0f4eed1c8e73d364641d5de4b625e64c33680059842b523002c44'
XML_SHA256 = '241debfeeb1def99d6eebc5f7b8b3cc2d0a8966ca50fa6dc627b7c0bdd491a73'
MP3_SHA256 = '2109aaa85e801d9a5bddbf2c0f30184e078a9eab75785580f477d51147fe325e'
MP3_BYTES = 496600
BLOCK_COUNT = 1200
SAMPLE_COUNT = 2200320


def pinned_bytes(path: Path, expected: str) -> bytes:
    if path.is_symlink() or not path.is_file() or path.resolve() != path:
        raise ValueError(f'not a physical source file: {path}')
    content = path.read_bytes()
    if hashlib.sha256(content).hexdigest() != expected:
        raise ValueError(f'source hash drift: {path}')
    return content


def extract() -> bytes:
    pinned_bytes(SOURCE, SOURCE_SHA256)
    pinned_bytes(XML, XML_SHA256)
    root = ET.parse(XML).getroot()
    sprites = root.findall('.//DefineSprite[@objectID="230"]')
    if len(sprites) != 1 or sprites[0].get('frames') != '1216':
        raise ValueError('sprite-230 frame-domain drift')
    tags = sprites[0].find('tags')
    if tags is None:
        raise ValueError('sprite-230 tags missing')
    heads = tags.findall('SoundStreamHead')
    if len(heads) != 1 or heads[0].get('compression') != '2' or heads[0].get('soundRate') != '2' or heads[0].get('soundStereo') != '0':
        raise ValueError('sprite-230 MP3 stream format drift')
    blocks = tags.findall('SoundStreamBlock')
    if len(blocks) != BLOCK_COUNT:
        raise ValueError('sprite-230 block count drift')
    sample_count = 0
    chunks = []
    for block in blocks:
        encoded = block.findtext('data')
        if not encoded:
            raise ValueError('empty MP3 stream block')
        raw = base64.b64decode(encoded, validate=True)
        if len(raw) < 4:
            raise ValueError('short MP3 stream block')
        sample_count += int.from_bytes(raw[:2], 'little')
        chunks.append(raw[4:])  # Two-byte sample count and signed seek header.
    mp3 = b''.join(chunks)
    if sample_count != SAMPLE_COUNT or len(mp3) != MP3_BYTES or hashlib.sha256(mp3).hexdigest() != MP3_SHA256:
        raise ValueError('sprite-230 decoded stream identity drift')
    if mp3[:1] != b'\xff' or mp3[1] & 0xe0 != 0xe0:
        raise ValueError('sprite-230 MP3 sync missing')
    return mp3


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--write', action='store_true')
    mode.add_argument('--check', action='store_true')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    content = extract()
    if args.write:
        with args.output.open('xb') as output:
            output.write(content)
    elif args.output.read_bytes() != content:
        raise ValueError('extracted MP3 output drift')
    print(f'PASS sprite-230 source stream: {len(content)} bytes, {BLOCK_COUNT} blocks, SHA-256 {MP3_SHA256}')


if __name__ == '__main__':
    main()
