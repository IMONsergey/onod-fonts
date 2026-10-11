import React, { useEffect } from 'react';
import type { Font } from '../data/mockFonts';
import { getFontRuntimeSnapshot, setFontRuntimeStatus } from '../lib/fontRuntime';
import { getEffectiveAxes, getEffectiveFamilyName, getEffectiveFontshareSlug, getEffectiveLanguages, getEffectiveSourceLabel } from '../lib/fontTrust';
import { getVerifiedHistoricalFontArtifact, getVerifiedOpenFontArtifact } from '../lib/fontArtifactRuntime';
import { faceMatches, getDefaultFontWeight, googleStylesheetUrl, pinnedPreviewFaces, type FontPreviewRequest } from '../lib/fontLoadingPlan';

interface FontLoaderProps { fonts: Font[]; requests?: FontPreviewRequest[]; }
const sourcePromises = new Map<string, Promise<void>>();
const activeRequests = new Map<string,string>();
const tasks: Array<() => void> = [];
let running = 0;
const MAX_CONCURRENT = 4;
function enqueue<T>(work: () => Promise<T>): Promise<T> {
  return new Promise((resolve,reject) => {
    tasks.push(() => { running++; work().then(resolve,reject).finally(()=>{running--; tasks.shift()?.();}); });
    if (running < MAX_CONCURRENT) tasks.shift()?.();
  });
}
function timeout<T>(promise: Promise<T>, ms=18000): Promise<T> {
  return new Promise((resolve,reject)=>{
    const timer=window.setTimeout(()=>reject(new Error('Font loading timed out')),ms);
    promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
  });
}
function safeUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS font sources are allowed');
  return parsed.href;
}
function once(key: string, load: () => Promise<void>): Promise<void> {
  const prior=sourcePromises.get(key); if(prior) return prior;
  const promise=load().catch(error=>{sourcePromises.delete(key);throw error});
  sourcePromises.set(key,promise);
  return promise;
}
function stylesheet(url: string): Promise<void> {
  return once(url,()=>new Promise((resolve,reject)=>{
    const link=document.createElement('link');link.rel='stylesheet';link.href=safeUrl(url);link.dataset.onodFontSource='true';
    const timer=window.setTimeout(()=>{link.remove();reject(new Error('Font stylesheet timed out'))},15000);
    link.onload=()=>{clearTimeout(timer);resolve()};
    link.onerror=()=>{clearTimeout(timer);link.remove();reject(new Error('Font stylesheet could not be loaded'))};
    document.head.appendChild(link);
  }));
}
function binary(font: Font, url: string, weight: string, style='normal'): Promise<void> {
  const key=`${font.id}:${url}:${weight}:${style}`;
  return once(key,async()=>{
    const face=new FontFace(getEffectiveFamilyName(font),`url("${safeUrl(url)}")`,{weight,style,display:'swap'});
    const loaded=await timeout(face.load());document.fonts.add(loaded);
  });
}
async function loadSource(font: Font, request: FontPreviewRequest) {
  const pinned=pinnedPreviewFaces[font.id];
  if(pinned) {
    const weight=request.axes?.wght ?? request.weight ?? getDefaultFontWeight(font);
    const matching=pinned.filter(face=>faceMatches({family:getEffectiveFamilyName(font),weight:face.weight,style:face.style},getEffectiveFamilyName(font),weight,request.style || 'normal'));
    if(!matching.length) throw new Error('No verified source for the requested style and weight');
    await Promise.all(matching.map(face=>binary(font,face.url,face.weight,face.style)));return;
  }
  const slug=getEffectiveFontshareSlug(font);
  if(slug) {await stylesheet(`https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(slug)}@1&display=swap`);return;}
  const artifact=getVerifiedOpenFontArtifact(font) || getVerifiedHistoricalFontArtifact(font);
  if(artifact) {
    const axis=artifact.axes.wght;
    const weight=axis ? `${axis.min} ${axis.max}` : 'weightClass' in artifact ? String(artifact.weightClass) : String(getDefaultFontWeight(font));
    await binary(font,artifact.sourceUrl,weight);return;
  }
  const source=getEffectiveSourceLabel(font);
  if(source==='Google Fonts') {await stylesheet(googleStylesheetUrl(font));return;}
  if(font.customCssUrl && source===font.source) {await stylesheet(font.customCssUrl);return;}
  throw new Error('No verified preview source is available for this family');
}
function sampleFor(font: Font): string {
  const languages=getEffectiveLanguages(font);
  const samples: Record<string,string>={Latin:'Hamburgefontsiv',Cyrillic:'Привет',Greek:'Ελληνικά',Arabic:'العربية',Hebrew:'עברית',Japanese:'こんにちは',Korean:'한글',Chinese:'中文',Devanagari:'हिन्दी',Bengali:'বাংলা',Thai:'ไทย',Tamil:'தமிழ்',Telugu:'తెలుగు',Kannada:'ಕನ್ನಡ',Malayalam:'മലയാളം',Khmer:'ខ្មែរ',Gujarati:'ગુજરાતી',Sinhala:'සිංහල'};
  return languages.map(script=>samples[script]).find(Boolean) || 'A';
}
async function verify(font: Font, request: FontPreviewRequest) {
  const style=request.style || 'normal';
  const axis=getEffectiveAxes(font).wght;
  const raw=request.axes?.wght ?? request.weight ?? getDefaultFontWeight(font);
  const weight=axis ? Math.min(axis.max,Math.max(axis.min,raw)) : raw;
  const family=getEffectiveFamilyName(font);
  const faces=await timeout(document.fonts.load(`${style} ${weight} 16px "${family.replace(/"/g,'\\"')}"`,sampleFor(font)));
  if(!faces.some(face=>face.status==='loaded' && faceMatches(face,family,weight,style))) {
    throw new Error(`The requested ${style} ${weight} face was not loaded; the preview may use a fallback`);
  }
}

export const FontLoader: React.FC<FontLoaderProps> = ({ fonts, requests=[] }) => {
  // The request signature, not an unstable array identity, controls revalidation.
  const signature=fonts.map(font=>`${font.id}:${JSON.stringify(requests.find(request=>request.fontId===font.id)||{})}`).join('|');
  useEffect(()=>{
    let mounted=true;
    const run=(font: Font, force=false)=>{
      const request=requests.find(value=>value.fontId===font.id) || {fontId:font.id};
      const key=`${font.id}:${JSON.stringify(request)}`;
      if (!force && activeRequests.get(font.id) === key && getFontRuntimeSnapshot(font.id).status === 'ready') return;
      activeRequests.set(font.id,key);
      setFontRuntimeStatus(font.id,'loading');
      void enqueue(async()=>{
        if(!mounted && !force) return;
        if(typeof FontFace==='undefined' || !document.fonts) throw new Error('This browser cannot verify font faces');
        await loadSource(font,request);await verify(font,request);
        if(activeRequests.get(font.id)===key) setFontRuntimeStatus(font.id,'ready');
      }).catch(error=>{if(activeRequests.get(font.id)===key) setFontRuntimeStatus(font.id,'error',error instanceof Error ? error.message : 'Font loading failed')});
    };
    // Catalog faces are loaded only near the viewport; detail/workbench faces
    // have no catalog card and are requested immediately.
    const observed = new Map<Element, Font>();
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const font = observed.get(entry.target);
        if (font) { run(font); observed.delete(entry.target); observer?.unobserve(entry.target); }
      }
    }, { rootMargin: '240px 0px' });
    fonts.forEach(font => {
      const card = document.querySelector(`[data-font-id="${CSS.escape(font.id)}"]`);
      if (card && observer) { observed.set(card, font); observer.observe(card); }
      else run(font);
    });
    const retry=(event: Event)=>{const fontId=(event as CustomEvent<{fontId:string}>).detail?.fontId;const font=fonts.find(item=>item.id===fontId);if(font) run(font,true)};
    window.addEventListener('onod:font-retry',retry);
    return ()=>{mounted=false;observer?.disconnect();window.removeEventListener('onod:font-retry',retry)};
  }, [signature]);
  return null;
};
