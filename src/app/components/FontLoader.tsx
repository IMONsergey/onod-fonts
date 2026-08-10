import React, { useEffect } from 'react';
import { Font } from '../data/mockFonts';
import { setFontRuntimeStatus } from '../lib/fontRuntime';
import { getEffectiveLanguages, getEffectiveWeights, isEffectivelyVariable } from '../lib/fontTrust';

interface FontLoaderProps {
  fonts: Font[];
}

const NON_GOOGLE_SOURCES = new Set([
  'Fontshare', 'Velvetyne', 'Collletttivo', 'Font Library', 'iA', 'GNU', 'DejaVu', 'Liberation', 'GitHub', 'GitHub Next',
]);

const FONTSHARE_SLUGS: Record<string, string> = {
  'H.H. Samuel': 'hh-samuel',
  'Wotfard FS': 'wotfard',
  'Polaris FS': 'polaris',
  'Bw Seido': 'bw-seido-raw',
};

const globalReadyIds = new Set<string>();
const stylesheetId = (prefix: string, font: Font) => `${prefix}-${font.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

const primaryFamily = (font: Font) => {
  const first = font.cssStack.split(',')[0]?.trim();
  return (first || font.name).replace(/^['"]|['"]$/g, '');
};

const fontDescriptor = (font: Font) => {
  const weights = getEffectiveWeights(font).map(Number).filter(Number.isFinite);
  const weight = weights.includes(400) ? 400 : weights[0] || 400;
  return `${weight} 16px "${primaryFamily(font).replace(/"/g, '\\"')}"`;
};

const verifyFontFace = async (font: Font) => {
  if (!document.fonts) return setFontRuntimeStatus(font.id, 'ready');

  try {
    const descriptor = fontDescriptor(font);
    const sample = getEffectiveLanguages(font).includes('Cyrillic') ? 'Hamburgefontsiv Привет' : 'Hamburgefontsiv';
    await document.fonts.load(descriptor, sample);
    const ready = document.fonts.check(descriptor, sample);
    setFontRuntimeStatus(font.id, ready ? 'ready' : 'error', ready ? undefined : 'Font face was not registered; preview is using fallback.');
  } catch (error) {
    setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : 'Font face verification failed.');
  }
};

const googleFontUrl = (font: Font) => {
  const weights = getEffectiveWeights(font).sort((a, b) => Number(a) - Number(b));
  let family = font.name;
  if (isEffectivelyVariable(font) && weights.length > 1) family += `:wght@${weights[0]}..${weights.at(-1)}`;
  else family += `:wght@${weights.join(';')}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
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
        if (existing.sheet) {
          globalReadyIds.add(id);
          void verifyFontFace(font);
          return;
        }
        const onLoad = () => {
          globalReadyIds.add(id);
          void verifyFontFace(font);
        };
        const onError = () => setFontRuntimeStatus(font.id, 'error', `Stylesheet failed to load: ${url}`);
        existing.addEventListener('load', onLoad, { once: true });
        existing.addEventListener('error', onError, { once: true });
        return;
      }

      setFontRuntimeStatus(font.id, 'loading');
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
