import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { compile } from 'tailwindcss';
import { buildWorkbenchExport } from '../src/app/lib/workbenchExports.ts';

const config = {version:1,baseSize:20,scaleRatio:1.5,roles:[{
  role:'heading',family:'Inter',stack:'"Inter", sans-serif',fallback:'sans-serif',fontSize:101,
  weight:400,style:'normal',lineHeight:1.2,tracking:0.01,sourceLabel:'Google Fonts',sourceUrl:'https://fonts.google.com/specimen/Inter',sourceCss:'',
},{role:'body',family:'Inter',stack:'"Inter", sans-serif',fallback:'sans-serif',fontSize:30,
  weight:400,style:'normal',lineHeight:1.55,tracking:0.01,sourceLabel:'Google Fonts',sourceUrl:'https://fonts.google.com/specimen/Inter',sourceCss:'',
}]};
test('Tailwind v4 export compiles into actual font, size, spacing and leading utilities',async()=>{
  const source=buildWorkbenchExport('tailwind-v4',config);
  const compiler=await compile(source + '\n@tailwind utilities;');
  const css=compiler.build(['font-heading','text-heading','leading-heading','tracking-heading','font-body','text-body']);
  assert.match(css,/\.font-heading/);assert.match(css,/\.text-heading/);assert.match(css,/\.leading-heading/);
  assert.match(css,/--onod-size-heading: 101px/);assert.match(css,/font-synthesis: none/);
});
test('Legacy v3 config is executable CommonJS with the selected sizes and weights',()=>{
  const context={module:{exports:{}}};
  vm.runInNewContext(buildWorkbenchExport('tailwind-v3',config),context,{timeout:1000});
  assert.equal(context.module.exports.theme.extend.fontSize.heading,'101px');
  assert.equal(context.module.exports.theme.extend.fontWeight.body,'400');
});
test('JSON and CSS export keep the actual scale, sizes, line height and tracking',()=>{
  const json=JSON.parse(buildWorkbenchExport('json',config));
  assert.deepEqual(json.scale,{baseSize:20,ratio:1.5});assert.equal(json.roles.body.fontSize,'30px');
  assert.equal(json.roles.body.lineHeight,1.55);assert.equal(json.roles.heading.tracking,'0.01em');
  assert.match(buildWorkbenchExport('css',config),/font-size: var\(--onod-size-heading\)/);
});
