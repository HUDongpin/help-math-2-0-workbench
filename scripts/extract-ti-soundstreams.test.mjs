import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {gzipSync} from "node:zlib";

import {extractMp3SoundStreams, parseArguments} from "./extract-ti-soundstreams.mjs";

function block(sampleCount, seekSamples, payload) {
  const header = Buffer.alloc(4);
  header.writeUInt16LE(sampleCount, 0);
  header.writeInt16LE(seekSamples, 2);
  return Buffer.concat([header, payload]).toString("base64");
}

test("removes only the four-byte MP3 SoundStreamBlock headers and preserves payload order", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-math-ti-stream-extract-"));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const xmlPath = path.join(directory, "fixture.xml.gz");
  const first = Buffer.from([0xff, 0xfb, 0x10, 0x20]);
  const second = Buffer.from([0x30, 0x40]);
  const xml = `<swf><tags>
    <DefineSprite objectID="7" frames="2"><tags>
      <SoundStreamHead playbackRate="2" playbackStereo="1" compression="2" soundRate="2" soundStereo="1"/>
      <SoundStreamBlock>
        <data>${block(100, 7, first)}</data>
      </SoundStreamBlock>
      <ShowFrame/>
      <SoundStreamBlock>
        <data>${block(200, -2, second)}</data>
      </SoundStreamBlock>
    </tags>
    </DefineSprite>
  </tags></swf>\n`;
  await writeFile(xmlPath, gzipSync(xml));
  const streams = await extractMp3SoundStreams(xmlPath, [7]);
  const stream = streams.get(7);
  assert.equal(stream.blocks.length, 2);
  assert.equal(stream.totalDecodedSamples, 300);
  assert.deepEqual(stream.seekSamples, [7, -2]);
  assert.deepEqual(stream.mp3, Buffer.concat([first, second]));
});

test("extracts independently named source sprites", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "help-math-ti-stream-extract-"));
  t.after(() => rm(directory, {recursive: true, force: true}));
  const xmlPath = path.join(directory, "fixture.xml.gz");
  const xml = `<swf><tags>
    <DefineSprite objectID="7" frames="1">
      <tags>
        <SoundStreamHead compression="2"/>
        <SoundStreamBlock>
          <data>${block(1, 0, Buffer.from([1]))}</data>
        </SoundStreamBlock>
      </tags>
    </DefineSprite>
    <DefineSprite objectID="8" frames="1">
      <tags>
        <SoundStreamHead compression="2"/>
        <SoundStreamBlock>
          <data>${block(2, 0, Buffer.from([2]))}</data>
        </SoundStreamBlock>
      </tags>
    </DefineSprite>
  </tags></swf>`;
  await writeFile(xmlPath, gzipSync(xml));
  const streams = await extractMp3SoundStreams(xmlPath, [7, 8]);
  assert.deepEqual(streams.get(7).mp3, Buffer.from([1]));
  assert.deepEqual(streams.get(8).mp3, Buffer.from([2]));
});

test("parses check and JSON CLI modes", () => {
  const options = parseArguments(["--check", "--json", "--project-root", "/tmp/project"]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.projectRoot, "/tmp/project");
  assert.throws(() => parseArguments(["--write"]), /Unknown option/);
});
