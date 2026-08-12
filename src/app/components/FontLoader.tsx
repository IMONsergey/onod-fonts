import React, { useEffect } from 'react';
import { Font } from '../data/mockFonts';
import { setFontRuntimeStatus } from '../lib/fontRuntime';
import { getEffectiveFamilyName, getEffectiveFontshareSlug, getEffectiveLanguages, getEffectiveSourceLabel, getEffectiveWeights, isEffectivelyVariable } from '../lib/fontTrust';
import { getVerifiedHistoricalFontArtifact, getVerifiedOpenFontArtifact, type VerifiedHistoricalFontArtifact, type VerifiedOpenFontArtifact } from '../lib/fontArtifactRuntime';

interface FontLoaderProps { fonts: Font[]; }
type RuntimeArtifact = VerifiedOpenFontArtifact | VerifiedHistoricalFontArtifact;
type QueueTask = { run: () => Promise<void>; resolve: () => void; reject: (error: unknown) => void; };

const MAX_CONCURRENT_FONT_LOADS = 4;
const CARD_PRELOAD_MARGIN = '500px 0px';
let activeFontLoads = 0;
const pendingFontLoads: QueueTask[] = [];
const globalReadyIds = new Set<string>();
const globalLoadPromises = new Map<string, Promise<void>>();
const stylesheetId = (prefix: string, font: Font) => `${prefix}-${font.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
const primaryFamily = (font: Font) => getEffectiveFamilyName(font);
const normalizeFamilyName = (value: string) => value.trim().replace(/^['"]|['"]$/g, '').toLowerCase();

const pumpFontLoadQueue = () => {
  while (activeFontLoads < MAX_CONCURRENT_FONT_LOADS && pendingFontLoads.length) {
    const task = pendingFontLoads.shift()!;
    activeFontLoads += 1;
    void task.run().then(task.resolve, task.reject).finally(() => {
      activeFontLoads -= 1;
      pumpFontLoadQueue();
    });
  }
};

const enqueueFontLoad = (run: () => Promise<void>) => new Promise<void>((resolve, reject) => {
  pendingFontLoads.push({ run, resolve, reject });
  pumpFontLoadQueue();
});

const fontDescriptor = (font: Font) => {
  const weights = getEffectiveWeights(font).map(Number).filter(Number.isFinite);
  const weight = weights.includes(400) ? 400 : weights[0] || 400;
  return `${weight} 16px "${primaryFamily(font).replace(/"/g, '\\"')}"`;
};

const hasLoadedRegisteredFace = (font: Font) => {
  if (!document.fonts) return false;
  const expected = normalizeFamilyName(primaryFamily(font));
  return Array.from(document.fonts).some(face => normalizeFamilyName(face.family) === expected && face.status === 'loaded');
};

const verifyFontFace = async (font: Font) => {
  if (!document.fonts) {
    setFontRuntimeStatus(font.id, 'error', 'FontFaceSet API is unavailable; font registration cannot be verified.');
    return;
  }
  try {
    const descriptor = fontDescriptor(font);
    const sample = getEffectiveLanguages(font).includes('Cyrillic') ? 'Hamburgefontsiv Привет' : 'Hamburgefontsiv';
    await document.fonts.load(descriptor, sample);
    const ready = hasLoadedRegisteredFace(font);
    setFontRuntimeStatus(font.id, ready ? 'ready' : 'error', ready ? undefined : `No loaded FontFace registered for ${primaryFamily(font)}; preview is using fallback.`);
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

const waitForStylesheet = (link: HTMLLinkElement, url: string) => new Promise<void>((resolve, reject) => {
  if (link.sheet) return resolve();
  link.addEventListener('load', () => resolve(), { once: true });
  link.addEventListener('error', () => reject(new Error(`Stylesheet failed to load: ${url}`)), { once: true });
});

export const FontLoader: React.FC<FontLoaderProps> = ({ fonts }) => {
  const fontIdsKey = fonts.map(font => font.id).join('|');

  useEffect(() => {
    if (!fonts.length) return;

    const addStylesheet = (font: Font, url: string, id: string) => {
      if (globalReadyIds.has(id)) {
        void verifyFontFace(font);
        return;
      }
      const existingPromise = globalLoadPromises.get(id);
      if (existingPromise) {
        setFontRuntimeStatus(font.id, 'loading');
        void existingPromise.then(() => verifyFontFace(font)).catch(() => {});
        return;
      }

      setFontRuntimeStatus(font.id, 'loading');
      const promise = enqueueFontLoad(async () => {
        let link = document.getElementById(id) as HTMLLinkElement | null;
        let created = false;
        if (!link) {
          link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = url;
          link.dataset.fontId = font.id;
          created = true;
        }
        const ready = waitForStylesheet(link, url);
        if (created) document.head.appendChild(link);
        try {
          await ready;
          globalReadyIds.add(id);
          await verifyFontFace(font);
        } catch (error) {
          globalReadyIds.delete(id);
          setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : `Stylesheet failed to load: ${url}`);
          if (created) link.remove();
          throw error;
        }
      }).finally(() => globalLoadPromises.delete(id));
      globalLoadPromises.set(id, promise);
      void promise.catch(() => {});
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
        void existingPromise.then(() => verifyFontFace(font)).catch(() => {});
        return;
      }
      if (typeof FontFace === 'undefined' || !document.fonts) {
        setFontRuntimeStatus(font.id, 'error', 'Browser FontFace API is unavailable for verified artifact loading.');
        return;
      }

      setFontRuntimeStatus(font.id, 'loading');
      const promise = enqueueFontLoad(async () => {
        try {
          const face = new FontFace(primaryFamily(font), `url("${artifact.sourceUrl}")`, { weight: artifactWeightDescriptor(font, artifact), style: 'normal', display: 'swap' });
          const loaded = await face.load();
          document.fonts.add(loaded);
          globalReadyIds.add(id);
          await verifyFontFace(font);
        } catch (error) {
          globalReadyIds.delete(id);
          setFontRuntimeStatus(font.id, 'error', error instanceof Error ? error.message : `Verified ${kind} artifact failed to load: ${artifact.sourceUrl}`);
          throw error;
        }
      }).finally(() => globalLoadPromises.delete(id));
      globalLoadPromises.set(id, promise);
      void promise.catch(() => {});
    };

    const requestFont = (font: Font) => {
      const sourceLabel = getEffectiveSourceLabel(font);
      const fontshareSlug = getEffectiveFontshareSlug(font);
      if (fontshareSlug) return addStylesheet(font, `https://api.fontshare.com/v2/css?f[]=${encodeURIComponent(fontshareSlug)}@1&display=swap`, stylesheetId('fontshare', font));
      const artifact = getVerifiedOpenFontArtifact(font);
      if (artifact) return addArtifactFace(font, artifact, 'current');
      const historicalArtifact = getVerifiedHistoricalFontArtifact(font);
      if (historicalArtifact) return addArtifactFace(font, historicalArtifact, 'historical');
      if (sourceLabel === 'Google Fonts') return addStylesheet(font, googleFontUrl(font), stylesheetId('google', font));
      if (font.customCssUrl && sourceLabel === font.source) return addStylesheet(font, font.customCssUrl, stylesheetId('custom', font));
      setFontRuntimeStatus(font.id, 'error', `No verified font loading strategy for canonical source: ${sourceLabel}`);
    };

    const observers: IntersectionObserver[] = [];
    for (const font of fonts) {
      const anchor = document.querySelector<HTMLElement>(`[data-font-id="${font.id}"]`);
      if (!anchor || typeof IntersectionObserver === 'undefined') {
        requestFont(font);
        continue;
      }
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        requestFont(font);
      }, { root: null, rootMargin: CARD_PRELOAD_MARGIN, threshold: 0.01 });
      observer.observe(anchor);
      observers.push(observer);
    }

    return () => observers.forEach(observer => observer.disconnect());
    // Font id sequence is the loading contract; preview rerenders must not recreate observers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontIdsKey]);

  return null;
};
