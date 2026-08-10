import React, { useEffect } from 'react';
import { Font } from '../data/mockFonts';
import { setFontRuntimeStatus } from '../lib/fontRuntime';
import { getEffectiveLanguages, getEffectiveWeights, isEffectivelyVariable } from '../lib/fontTrust';

interface FontLoaderProps {
  fonts: Font[];
}

const NON_GOOGLE_SOURCES = new Set([
  'Fontshare',
  'Velvetyne',
  'Collletttivo',
  'Font Library',
  'iA',
  'GNU',
  'DejaVu',
  'Liberation',
  'GitHub',
  'GitHub Next',
]);

const FONTSHARE_SLUGS: Record<string, string> = {
  'H.H. Samuel': 'hh-samuel',
  'Wotfard FS': 'wotfard',
  'Polaris FS': 'polaris',
  'Bw Seido': 'bw-seido-raw',
};

const globalRequestedIds = new Set<string>();
const globalReadyIds = new Set<string>();

const stylesheetId = (prefix: string, font: Font) => `${prefix}-${font.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const primaryFamily = (font: Font) => {
  const first = font.cssStack.split(',')[0]?.trim();
  return (first || font.name).replace(/^['"]|['"]$/g, '');
};

const fontDescriptor = (font: Font) => {
  const effectiveWeights = getEffectiveWeights(font).map(weight => Number(weight)).filter(weight => Number.isFinite(weight));
  const preferredWeight = effectiveWeights.includes(400) ? 400 : effectiveWeights[0] || 400;
  return `${preferredWeight} 16px "${primaryFamily(font).replace(/"/g, '\\"')}"`;
};

const verifyFontFace = async (font: Font) => {
  if (!document.fonts) {
    setFontRuntimeStatus(font.id, 'ready');
    return;
  }

  try {
    const descriptor = fontDescriptor(font);
    const languages = getEffectiveLanguages(font);
    const sample = languages.includes('Cyrillic') ? 'Hamburgefontsiv Привет' : 'Hamburgefontsiv';
    await document.fonts.load(descriptor, sample);
    const ready = document.fonts.check(descriptor, sample);
    setFontRuntimeStatus(font.id, ready ? 'ready' : 'error', ready ? undefined : 'Font face was not registered; preview is using fallback.');
  } catch (error) {
    setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : 'Font face verification failed.');
  }
};

const googleFontUrl = (font: Font) => {
  const weights = getEffectiveWeights(font).sort((a, b) => Number(a) - Number(b));
  let familySpec = font.name;

  if (isEffectivelyVariable(font) && weights.length >= 2) familySpec += `:wght@${weights[0]}..${weights[weights.length - 1]}`;
  else familySpec += `:wght@${weights.join(';')}`;

  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familySpec).replace(/%20/g, '+')}&display=swap`;
};

export const FontLoader: React.FC<FontLoaderProps> = ({ fonts }) => {
  useEffect(() => {
    if (!fonts?.length) return;

    const addStylesheet = (font: Font, url: string, id: string) => {
      if (globalReadyIds.has(id)) {
        void verifyFontFace(font);
        return;
      }

      const existing = document.getElementById(id) as HTMLLinkElement | null;
      if (existing) {
        setFontRuntimeStatus(font.id, 'loading');
        const verify = () => void verifyFontFace(font);
        existing.addEventListener('load', verify, { once: true });
        existing.addEventListener('error', () => setFontRuntimeStatus(font.id, 'error', `Stylesheet failed to load: ${url}`), { once: true });
        return;
      }

      setFontRuntimeStatus(font.id, 'loading');
      globalRequestedIds.add(id);

      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.fontId = font.id;
      link.onload = () => {
        globalReadyIds.add(id);
        void verifyFontFace(font);
      };
      link.onerror = () => {
        globalRequestedIds.delete(id);
        globalReadyIds.delete(id);
        setFontRuntimeStatus(font.id, 'error', `Stylesheet failed to load: ${url}`);
        link.remove();
      };
      document.head.appendChild(link);
    };

    for (const font of fonts) {
      if (font.customCssUrl) {
        addStylesheet(font, font.customCssUrl, stylesheetId('custom', font));
        continue;
      }

      if (font.source === 'Fontshare') {
        const slug = FONTSHARE_SLUGS[font.name] || font.name.toLowerCase().replace(/\s+/g, '-');
        addStylesheet(font, `https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(slug)}@1&display=swap`, stylesheetId('fontshare', font));
        continue;
      }

      if (!NON_GOOGLE_SOURCES.has(font.source)) {
        addStylesheet(font, googleFontUrl(font), stylesheetId('google', font));
        continue;
      }

      setFontRuntimeStatus(font.id, 'error', `No font loading strategy for source: ${font.source}`);
    }
  }, [fonts]);

  return null;
};
