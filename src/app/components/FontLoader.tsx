import React, { useEffect } from 'react';
import { Font } from '../data/mockFonts';
import editorialPreviews from '../data/verified/editorial-previews.json';
import { setFontRuntimeStatus } from '../lib/fontRuntime';
import { getEffectiveFamilyName, getSpecimenFamily, getSpecimenWeights, getEffectiveFontshareSlug, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveWeights, isEffectivelyVariable } from '../lib/fontTrust';
import { getVerifiedHistoricalFontArtifact, getVerifiedOpenFontArtifact, type VerifiedHistoricalFontArtifact, type VerifiedOpenFontArtifact } from '../lib/fontArtifactRuntime';

interface FontLoaderProps {
  fonts: Font[];
}

type RuntimeArtifact = VerifiedOpenFontArtifact | VerifiedHistoricalFontArtifact;

const globalReadyIds = new Set<string>();
const globalLoadPromises = new Map<string, Promise<void>>();
const stylesheetId = (prefix: string, font: Font) => `${prefix}-${font.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
const primaryFamily = (font: Font) => getSpecimenFamily(font);

const fontDescriptor = (font: Font) => {
  const weights = getSpecimenWeights(font).map(Number).filter(Number.isFinite);
  const weight = weights.includes(400) ? 400 : weights[0] || 400;
  return `${weight} 16px ${JSON.stringify(getSpecimenFamily(font, weight))}`;
};

const verifyFontFace = async (font: Font) => {
  if (!document.fonts) return setFontRuntimeStatus(font.id, 'error', 'Font verification is unavailable in this browser.');

  try {
    const descriptor = fontDescriptor(font);
    const sample = font.commercialPackage?.sample || (getEffectiveLanguages(font).includes('Cyrillic') ? 'Hamburgefontsiv Привет' : 'Hamburgefontsiv');
    const faces = await document.fonts.load(descriptor, sample);
    const ready = faces.length > 0 && faces.every(face => face.status === 'loaded');
    setFontRuntimeStatus(font.id, ready ? 'ready' : 'error', ready ? undefined : 'Font face was not registered; preview is using fallback.');
  } catch (error) {
    setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : 'Font face verification failed.');
  }
};

const googleFontUrl = (font: Font) => {
  const weights = getEffectiveWeights(font).sort((a, b) => Number(a) - Number(b));
  let family = getEffectiveFamilyName(font);
  if (isEffectivelyVariable(font) && weights.length > 1) family += `:wght@${weights[0]}..${weights.at(-1)}`;
  else family += `:wght@${weights.join(';')}`;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
};

const artifactWeightDescriptor = (font: Font, artifact: RuntimeArtifact) => {
  const axis = artifact.axes.wght;
  if (axis) return `${axis.min} ${axis.max}`;
  if ('weightClass' in artifact) return String(artifact.weightClass);
  const weights = getEffectiveWeights(font).map(Number).filter(Number.isFinite);
  return String(weights.includes(400) ? 400 : weights[0] || 400);
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

    const addArtifactFace = (font: Font, artifact: RuntimeArtifact, kind: 'current' | 'historical') => {
      const id = stylesheetId(`${kind}-artifact-${artifact.sha256.slice(0, 12)}`, font);
      if (globalReadyIds.has(id)) {
        void verifyFontFace(font);
        return;
      }

      const existingPromise = globalLoadPromises.get(id);
      if (existingPromise) {
        setFontRuntimeStatus(font.id, 'loading');
        void existingPromise.then(() => verifyFontFace(font));
        return;
      }

      if (typeof FontFace === 'undefined' || !document.fonts) {
        setFontRuntimeStatus(font.id, 'error', 'Browser FontFace API is unavailable for verified artifact loading.');
        return;
      }

      setFontRuntimeStatus(font.id, 'loading');
      const promise = (async () => {
        try {
          const face = new FontFace(
            primaryFamily(font),
            `url("${artifact.sourceUrl}")`,
            { weight: artifactWeightDescriptor(font, artifact), style: 'normal', display: 'swap' },
          );
          const loaded = await face.load();
          document.fonts.add(loaded);
          globalReadyIds.add(id);
          await verifyFontFace(font);
        } catch (error) {
          globalReadyIds.delete(id);
          setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : `Verified ${kind} artifact failed to load: ${artifact.sourceUrl}`);
        } finally {
          globalLoadPromises.delete(id);
        }
      })();
      globalLoadPromises.set(id, promise);
    };

    const loadFont = (font: Font) => {
      if (font.commercialPackage) {
        if (font.customCssUrl) addStylesheet(font, font.customCssUrl, stylesheetId('commercial', font));
        return;
      }
      const sourceLabel = getEffectiveSourceLabel(font);
      const fontshareSlug = getEffectiveFontshareSlug(font);
      if (fontshareSlug) {
        addStylesheet(font, `https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(fontshareSlug)}@1&display=swap`, stylesheetId('fontshare', font));
        return;
      }

      const artifact = getVerifiedOpenFontArtifact(font);
      if (artifact) {
        addArtifactFace(font, artifact, 'current');
        return;
      }

      const historicalArtifact = getVerifiedHistoricalFontArtifact(font);
      if (historicalArtifact) {
        addArtifactFace(font, historicalArtifact, 'historical');
        return;
      }

      if (sourceLabel === 'Google Fonts') {
        const localPreview = (editorialPreviews as Record<string, string>)[font.name];
        const weights = getEffectiveWeights(font);
        const url = localPreview && weights.length === 1 && weights[0] === '400'
          ? `${import.meta.env.BASE_URL}assets/editorial/${localPreview}/regular.css`
          : googleFontUrl(font);
        addStylesheet(font, url, stylesheetId('google', font));
        return;
      }

      if (font.customCssUrl && sourceLabel === font.source) {
        addStylesheet(font, font.customCssUrl, stylesheetId('custom', font));
        return;
      }

      setFontRuntimeStatus(font.id, 'error', `No verified font loading strategy for canonical source: ${sourceLabel}`);
    };

    const fontsById = new Map(fonts.map(font => [font.id, font]));
    const cards = new Set<string>();
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).dataset.onodFamily;
        const font = id && fontsById.get(id);
        if (font) loadFont(font);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '500px 0px' });

    if (observer) {
      document.querySelectorAll<HTMLElement>('article[data-onod-family]').forEach(card => {
        const id = card.dataset.onodFamily;
        if (id && fontsById.has(id)) {
          cards.add(id);
          observer.observe(card);
        }
      });
    }

    for (const font of fonts) {
      if (!cards.has(font.id)) loadFont(font);
    }
    return () => observer?.disconnect();
  }, [fonts]);

  return null;
};
