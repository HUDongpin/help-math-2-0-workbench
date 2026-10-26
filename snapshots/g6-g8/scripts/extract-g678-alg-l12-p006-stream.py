#!/usr/bin/env python3
"""Extract P006 sprite 53's source-order MP3 bytes; static machine evidence only."""

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT / 'migrations/shared-alg001-l12-p006'
AUDIT = WORKSPACE / 'audit/ffdec-26.2.1'
OUTPUT = WORKSPACE / 'audio-source-v1'
SOURCE = Path('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware')
SWF = SOURCE / 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf'
SA = SOURCE / 'G6-G8-shared/ALG001/L12/SA/L12RW06.mp3'
SWF_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6'
SA_CATALOG_SHA = '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def physical_bytes(path, expected_sha, expected_size=None):
    assert path.is_file() and not path.is_symlink() and path.resolve() == path, f'not a physical file: {path}'
    before = path.stat()
    data = path.read_bytes()
    after = path.stat()
    assert (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) == (
        after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns), f'changed during read: {path}'
    assert sha(data) == expected_sha, f'SHA-256 drift: {path}'
    if expected_size is not None:
        assert len(data) == expected_size, f'byte count drift: {path}'
    return data


def extract(xml_bytes):
    movie = ET.fromstring(xml_bytes)
    assert movie.get('_generator') == 'JPEXS Free Flash Decompiler v.26.2.1'
    assert movie.get('frameCount') == '10'
    sprites = [tag for tag in movie.find('tags') if tag.get('type') == 'DefineSpriteTag'
               and tag.get('spriteId') == '53']
    assert len(sprites) == 1 and sprites[0].get('frameCount') == '342'
    tags = sprites[0].find('subTags')
    heads = [tag for tag in tags if tag.get('type') == 'SoundStreamHeadTag']
    assert len(heads) == 1
    head = heads[0]
    assert head.get('streamSoundCompression') == '2'  # MP3
    assert head.get('streamSoundRate') == '2' and head.get('streamSoundType') == 'false'
    assert head.get('streamSoundSampleCount') == '1837' and head.get('latencySeek') == '1673'
    blocks, payloads = [], []
    payload_offset = 0
    frame = 1
    for tag in tags:
        kind = tag.get('type')
        if kind == 'ShowFrameTag':
            frame += 1
        elif kind == 'SoundStreamBlockTag':
            body = bytes.fromhex(tag.get('streamSoundData'))
            assert len(body) >= 4, f'truncated MP3 block at frame {frame}'
            payload = body[4:]
            blocks.append({
                'index': len(blocks) + 1, 'spriteFrame': frame,
                'sampleCount': int.from_bytes(body[:2], 'little'),
                'signedSeekSamples': int.from_bytes(body[2:4], 'little', signed=True),
                'wrapperHex': body[:4].hex(), 'tagBodyBytes': len(body),
                'tagBodySha256': sha(body), 'payloadOffset': payload_offset,
                'payloadBytes': len(payload), 'payloadSha256': sha(payload),
            })
            payloads.append(payload)
            payload_offset += len(payload)
    assert frame == 343
    assert [block['spriteFrame'] for block in blocks] == list(range(3, 343))
    return head.attrib, blocks, b''.join(payloads)


def machine_probe(payload):
    probe = subprocess.run([
        'ffprobe', '-v', 'error', '-f', 'mp3', '-i', 'pipe:0', '-show_entries',
        'stream=codec_name,sample_rate,channels:format=duration', '-of', 'json',
    ], input=payload, capture_output=True, check=True)
    info = json.loads(probe.stdout)
    assert len(info['streams']) == 1
    stream = info['streams'][0]
    assert stream['codec_name'] == 'mp3' and int(stream['channels']) == 1
    decoded = subprocess.run([
        'ffmpeg', '-v', 'error', '-f', 'mp3', '-i', 'pipe:0', '-map', '0:a:0',
        '-acodec', 'pcm_s16le', '-f', 's16le', 'pipe:1',
    ], input=payload, capture_output=True, check=True)
    assert len(decoded.stdout) % 2 == 0
    return {'codec': 'mp3', 'sampleRateHz': int(stream['sample_rate']),
            'channels': 1, 'decodedPcmSamples': len(decoded.stdout) // 2,
            'decoder': 'ffmpeg pcm_s16le to memory; no playback'}


def build():
    swf = physical_bytes(SWF, SWF_SHA, 708053)
    sa = physical_bytes(SA, SA_CATALOG_SHA, 214704)
    receipt = json.loads((AUDIT / 'extraction-receipt.json').read_text())
    assert receipt['sourceSha256'] == SWF_SHA and receipt['sourceBytes'] == len(swf)
    xml_expected = next(item['sha256'] for item in receipt['files'] if item['path'] == 'movie.xml')
    xml = physical_bytes(AUDIT / 'movie.xml', xml_expected, 9258378)
    head, blocks, payload = extract(xml)
    probe = machine_probe(payload)
    manifest = {
        'schemaVersion': 1, 'animationId': 'shared-alg001-l12-p006',
        'evidence': 'source-bound static extraction and machine decode only',
        'sourceSwf': {'path': str(SWF), 'bytes': len(swf), 'sha256': SWF_SHA},
        'ffdecXml': {'path': 'audit/ffdec-26.2.1/movie.xml', 'bytes': len(xml), 'sha256': sha(xml),
                     'receipt': 'audit/ffdec-26.2.1/extraction-receipt.json'},
        'domain': {'id': 'sprite-53', 'frames': 342, 'rootFrames': 10, 'swfFps': 12},
        'streamHead': {key: int(head[key]) for key in (
            'streamSoundCompression', 'streamSoundRate', 'streamSoundSampleCount', 'latencySeek')},
        'extraction': {'method': 'source-order concatenation of MP3 bytes after each four-byte count/seek wrapper',
                       'file': 'sprite-53-source-stream.mp3', 'bytes': len(payload), 'sha256': sha(payload)},
        'blockCount': len(blocks), 'sumBlockSampleCounts': sum(block['sampleCount'] for block in blocks),
        'blocks': blocks, 'probe': probe,
        'separateSaCandidate': {'path': str(SA), 'bytes': len(sa), 'sha256': sha(sa),
                                'catalogSha256': SA_CATALOG_SHA, 'relationship': 'unverified'},
        'limits': {'originalHostTiming': 'unverified', 'audibleContent': 'unreviewed',
                   'synchronization': 'unverified', 'audioAcceptance': False, 'registered': False},
    }
    return payload, (json.dumps(manifest, indent=2) + '\n').encode(), manifest


def main(mode):
    assert mode in ('--write', '--check')
    payload, manifest_bytes, manifest = build()
    outputs = {'sprite-53-source-stream.mp3': payload, 'stream-source-receipt.json': manifest_bytes}
    assert not OUTPUT.is_symlink() and OUTPUT.resolve() == OUTPUT
    if mode == '--write':
        OUTPUT.mkdir(exist_ok=True)
        assert OUTPUT.is_dir() and not OUTPUT.is_symlink()
        assert all(not (OUTPUT / name).exists() and not (OUTPUT / name).is_symlink()
                   for name in outputs), 'output already exists; use --check'
        for name, data in outputs.items():
            with (OUTPUT / name).open('xb') as handle:
                handle.write(data)
    else:
        for name, data in outputs.items():
            path = OUTPUT / name
            assert path.is_file() and not path.is_symlink() and path.read_bytes() == data, f'output drift: {path}'
    print(json.dumps({'mode': mode[2:], 'blockCount': manifest['blockCount'],
                      'sumBlockSampleCounts': manifest['sumBlockSampleCounts'],
                      'decodedPcmSamples': manifest['probe']['decodedPcmSamples'],
                      'saSha256': manifest['separateSaCandidate']['sha256'],
                      'outputs': [{'path': str(OUTPUT / name), 'bytes': len(data), 'sha256': sha(data)}
                                  for name, data in outputs.items()]}, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in ('--write', '--check'):
        raise SystemExit('Usage: python3 scripts/extract-g678-alg-l12-p006-stream.py --write|--check')
    main(sys.argv[1])
