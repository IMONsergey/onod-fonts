import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGoogleMetadata,parseTextProto} from '../scripts/font-data/parse-google-metadata.mjs';
const fixture=name=>readFileSync(new URL(`./fixtures/${name}.pb`,import.meta.url),'utf8');
test('Inter exact pinned metadata: indented nested fields, italic and both variable axes',()=>{
  const result=parseGoogleMetadata(fixture('inter'),'ofl/inter/METADATA.pb','2b68e433ea1923f86fa295977274a84e878d65ec');
  assert.deepEqual(result.styles,['italic','normal']);assert.deepEqual(result.axes.wght,{min:100,max:900});assert.deepEqual(result.axes.opsz,{min:14,max:32});assert.equal(result.faces.length,2);assert.equal(result.repositoryUrl,'https://www.github.com/rsms/inter');assert.equal(result.technicalVerified,true);
});
test('A static family remains static, with an explicit regular face',()=>{
  const result=parseGoogleMetadata(fixture('abel'),'ofl/abel/METADATA.pb','fixture');assert.deepEqual(result.axes,{});assert.deepEqual(result.styles,['normal']);assert.deepEqual(result.weights,[400]);
});
test('Malformed and technically incomplete metadata fail closed',()=>{
  assert.throws(()=>parseGoogleMetadata('name: "A" license: "OFL"','x','y'),/No font faces/);
  assert.throws(()=>parseTextProto('fonts { weight: 400'),/Unclosed/);
  assert.throws(()=>parseGoogleMetadata(fixture('inter').replace('weight: 400','weight: 0'),'x','y'),/Invalid font face/);
});
test('Nested names do not shadow root identity; lists, comments, CRLF and escaped strings parse',()=>{
  const parsed=parseTextProto('# comment\r\nname: "Root"\nsource { name: "Child" files { source_file: "a\\n.ttf" } }\nsubsets:["latin", "greek"]');
  assert.deepEqual(parsed.name,['Root']);assert.deepEqual(parsed.subsets,['latin','greek']);assert.equal(parsed.source[0].files[0].source_file[0],'a\n.ttf');
});
test('The complete repaired evidence has no missing technical fields, preserves pinned blobs',()=>{
  const evidence=JSON.parse(readFileSync(new URL('../src/app/data/verified/google-fonts.json',import.meta.url),'utf8'));
  assert.equal(Object.keys(evidence).length,1190);
  for(const [name,record] of Object.entries(evidence)) {assert.equal(record.schemaVersion,2,name);assert.equal(record.technicalVerified,true,name);assert.ok(record.styles.length && record.weights.length && record.faces.length,name);assert.match(record.metadataSha,/^[0-9a-f]{40}$/);}
});
