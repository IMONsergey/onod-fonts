import type { Font } from '../data/mockFonts';
import { getEffectiveAxes, getEffectiveFamilyName, getEffectiveStyles, getEffectiveWeights, getVerifiedGoogleFont } from './fontTrust.ts';

export interface FontPreviewRequest {
  fontId: string;
  weight?: number;
  style?: 'normal' | 'italic';
  axes?: Record<string, number>;
}
export function getDefaultFontWeight(font: Font): number {
  const values = getEffectiveWeights(font).map(Number).filter(Number.isFinite);
  return values.includes(400) ? 400 : values[0] || 400;
}
export function googleStylesheetUrl(font: Font): string {
  const styles = getEffectiveStyles(font);
  const axes = getEffectiveAxes(font);
  const weights = getEffectiveWeights(font).map(Number).sort((a,b)=>a-b);
  const tags = Object.keys(axes).filter(tag => tag !== 'ital').sort((a,b)=>a.localeCompare(b,'en-US'));
  if (!tags.includes('wght')) tags.push('wght');
  if (styles.includes('italic')) tags.push('ital');
  tags.sort((a,b)=>a.localeCompare(b,'en-US'));
  const axisValues = (style: 'normal' | 'italic', weight: number) => tags.map(tag => {
    if (tag === 'ital') return style === 'italic' ? '1' : '0';
    if (axes[tag]) return axes[tag].min === axes[tag].max ? String(axes[tag].min) : `${axes[tag].min}..${axes[tag].max}`;
    return String(weight);
  }).join(',');
  const upstream = getVerifiedGoogleFont(font) as (ReturnType<typeof getVerifiedGoogleFont> & {upstreamFamily?: string});
  const name = upstream?.upstreamFamily || getEffectiveFamilyName(font);
  const tuples = (styles.includes('italic') ? ['normal','italic'] as const : ['normal'] as const)
    .flatMap(style => (axes.wght ? [weights[0] || 400] : weights).map(weight => axisValues(style,weight)));
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(`${name}:${tags.join(',')}@${tuples.join(';')}`).replace(/%20/g,'+')}&display=swap`;
}

export interface PinnedPreviewFace { url: string; weight: string; style: 'normal' | 'italic'; source: string; commit: string; }
/** Official upstream paths pinned on 2026-10-11. These plans do not upgrade license or glyph claims. */
export const pinnedPreviewFaces: Record<string, PinnedPreviewFace[]> = {
  '0xproto': [{ url:'https://raw.githubusercontent.com/0xType/0xProto/5e8498b4b4a456cfe523a0567b0c084df5e084ba/fonts/0xProto-Regular.woff2',weight:'400',style:'normal',source:'https://github.com/0xType/0xProto',commit:'5e8498b4b4a456cfe523a0567b0c084df5e084ba'}, {url:'https://raw.githubusercontent.com/0xType/0xProto/5e8498b4b4a456cfe523a0567b0c084df5e084ba/fonts/0xProto-Bold.woff2',weight:'700',style:'normal',source:'https://github.com/0xType/0xProto',commit:'5e8498b4b4a456cfe523a0567b0c084df5e084ba'}],
  'geist-sans': [{ url:'https://raw.githubusercontent.com/vercel/geist-font/10dc7658f13c38a474cde201bb09a4617267545b/fonts/Geist/webfonts/Geist%5Bwght%5D.woff2',weight:'100 900',style:'normal',source:'https://github.com/vercel/geist-font',commit:'10dc7658f13c38a474cde201bb09a4617267545b'}],
  'gh-hubot': ['ExtraLight','Light','Regular','Medium','SemiBold','Bold','ExtraBold','Black'].map((name,index) => ({
    url:`https://raw.githubusercontent.com/github/hubot-sans/d4b2f67cd7686f5907296d3f027112bbc4f69f42/fonts/webfonts/HubotSans-${name}.woff2`,
    weight:String(200+index*100), style:'normal' as const, source:'https://github.com/github/hubot-sans',commit:'d4b2f67cd7686f5907296d3f027112bbc4f69f42',
  })),
};

export const normalizeFaceFamily = (family: string) => family.replace(/^['"]|['"]$/g,'').trim().toLowerCase();
export function faceMatches(face: Pick<FontFace,'family'|'weight'|'style'>, family: string, weight: number, style: string): boolean {
  const range = face.weight === 'normal' ? [400] : face.weight === 'bold' ? [700] : face.weight.split(/\s+/).map(Number);
  const lo = range[0], hi = range[1] ?? lo;
  return normalizeFaceFamily(face.family) === normalizeFaceFamily(family) &&
    face.style === style && Number.isFinite(lo) && weight >= lo && weight <= hi;
}
