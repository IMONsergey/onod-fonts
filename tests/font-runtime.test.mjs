import test from 'node:test';import assert from 'node:assert/strict';
import { faceMatches,googleStylesheetUrl } from '../src/app/lib/fontLoadingPlan.ts';
import {mockFonts} from '../src/app/data/mockFonts.ts';
import {getEffectiveAxes,getEffectiveStyles,getFontTrustReport} from '../src/app/lib/fontTrust.ts';
test('Only a matching real family/style/weight is accepted',()=>{
 assert.equal(faceMatches({family:'"Inter"',style:'normal',weight:'100 900'},'Inter',700,'normal'),true);
 assert.equal(faceMatches({family:'Other',style:'normal',weight:'400'},'Inter',400,'normal'),false);
 assert.equal(faceMatches({family:'Inter',style:'normal',weight:'400'},'Inter',700,'normal'),false);
 assert.equal(faceMatches({family:'Inter',style:'normal',weight:'100 900'},'Inter',400,'italic'),false);
});
test('Inter runtime exposes actual metadata and requests italic, optical size and weight ranges',()=>{
 const inter=mockFonts.find(f=>f.name==='Inter');assert.ok(inter);assert.deepEqual(getEffectiveAxes(inter).wght,{min:100,max:900});assert.ok(getEffectiveStyles(inter).includes('italic'));assert.equal(getFontTrustReport(inter).variableVerified,true);
 const url=new URL(googleStylesheetUrl(inter));assert.equal(url.searchParams.get('family'),'Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900');
});
