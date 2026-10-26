import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {parseEmbeddedAudioPayloads} from '../build-g4-l3-embedded-audio-archive.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');

function tag(code,body){const h=Buffer.alloc(6);h.writeUInt16LE((code<<6)|63);h.writeUInt32LE(body.length,2);return Buffer.concat([h,body]);}
function trace(frame){const s=Buffer.from(`P005_MAIN_FRAME:${frame}\0`),h=Buffer.alloc(3);h[0]=0x96;h.writeUInt16LE(s.length+1,1);return tag(12,Buffer.concat([h,Buffer.from([0]),s,Buffer.from([0x26,0])]));}

/** Explicitly modified forensic input: never promote to a preserved source or original-runtime baseline. */
export function p005ForensicDerivative(source,{entry='jump'}={}){
  assert.ok(['jump','linear'].includes(entry));
  assert.equal(hash(source),'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe');
  assert.equal(source.subarray(0,3).toString(),'CWS');
  const body=inflateSync(source.subarray(8));
  assert.equal(source.readUInt32LE(4),body.length+8);
  const rectBytes=Math.ceil((5+4*(body[0]>>>3))/8),headerBytes=rectBytes+4;
  let rootReplaced=0,traceCount=0,spriteReplaced=0;
  function rewrite(bytes,domain){
    let offset=0,frame=1;const output=[];
    while(offset<bytes.length){
      const start=offset;assert.ok(offset+2<=bytes.length);
      const word=bytes.readUInt16LE(offset);offset+=2;const code=word>>>6;
      let length=word&63;if(length===63){assert.ok(offset+4<=bytes.length);length=bytes.readUInt32LE(offset);offset+=4;}
      assert.ok(offset+length<=bytes.length);const payload=bytes.subarray(offset,offset+length);offset+=length;
      if(domain==='root'&&code===12&&frame===1){
        assert.equal(rootReplaced++,0);
        // ActionGotoFrame uses a zero-based root index; begin is source frame6.
        output.push(tag(12,Buffer.from(entry==='jump'?[0x81,2,0,5,0,0x07,0]:[0x06,0])));
      }else if(domain==='root'&&code===39&&payload.readUInt16LE(0)===391){
        assert.equal(spriteReplaced++,0);assert.equal(payload.readUInt16LE(2),968);
        output.push(tag(39,Buffer.concat([payload.subarray(0,4),rewrite(payload.subarray(4),'main')])));
      }else{
        if(domain==='main'&&code===1){output.push(trace(frame));traceCount++;}
        output.push(bytes.subarray(start,offset));
      }
      if(code===1)frame++;
      if(code===0){assert.equal(offset,bytes.length);break;}
    }
    assert.equal(frame-1,domain==='root'?10:968);
    return Buffer.concat(output);
  }
  const rewritten=Buffer.concat([body.subarray(0,headerBytes),rewrite(body.subarray(headerBytes),'root')]);
  const header=Buffer.from(source.subarray(0,8));header.write('FWS');header.writeUInt32LE(rewritten.length+8,4);
  const swf=Buffer.concat([header,rewritten]);
  assert.equal(rootReplaced,1);assert.equal(spriteReplaced,1);assert.equal(traceCount,968);
  const before=parseEmbeddedAudioPayloads(source),after=parseEmbeddedAudioPayloads(swf);
  assert.equal(after.soundStreams.length,1);
  assert.equal(after.soundStreams[0].payload.sha256,before.soundStreams[0].payload.sha256);
  assert.deepEqual(after.soundStreams[0].blocks.map(b=>[b.localFrame,b.tagBodySha256]),
    before.soundStreams[0].blocks.map(b=>[b.localFrame,b.tagBodySha256]));
  return {swf,receipt:{sourceSha256:hash(source),derivativeSha256:hash(swf),derivativeBytes:swf.length,
    modifiedRootActionCount:rootReplaced,insertedMainTraceCount:traceCount,
    audioBlockBodiesPreserved:true,audioPayloadSha256:after.soundStreams[0].payload.sha256,
    authority:'instrumented-ruffle-diagnostic-only',entryAssumption:entry==='jump'?'jump directly to authored root begin frame6':'play root frames1-6 until authored begin stop',
    originalHostEntryProven:false,originalRuntime:false}};
}
