import React, { useEffect } from 'react';
import { Font } from '../data/mockFonts';

interface FontLoaderProps {
  fonts: Font[];
}

// Sources that should NOT be sent to Google Fonts API.
const NON_GOOGLE_SOURCES = new Set([
    "Fontshare",          // Loaded via Fontshare API (individual)
    "Velvetyne",          // Loaded via cdnfonts.com
    "Collletttivo",       // Loaded via cdnfonts.com
    "Font Library",       // Loaded via fontlibrary.org + cdnfonts.com + Google Fonts triple fallback
    "iA",                 // Loaded via customCssUrl (cdnfonts.com)
    "GNU",                // Loaded via customCssUrl (cdnfonts.com)
    "DejaVu",             // Loaded via customCssUrl (cdnfonts.com)
    "Liberation",         // Loaded via customCssUrl (cdnfonts.com)
    "GitHub",             // Uses customCssUrl
    "GitHub Next",        // Monaspace — has customCssUrl
]);

// Fontshare slug exceptions (name → API slug)
const FONTSHARE_SLUGS: Record<string, string> = {
    "H.H. Samuel": "hh-samuel",
    "Wotfard FS": "wotfard",
    "Polaris FS": "polaris",
    "Bw Seido": "bw-seido-raw",
};

// Global set to persist across component instances and re-renders
const globalLoadedIds = new Set<string>();

// --- FontLoader Component ---
// Loads CSS for fonts via 5 CDN strategies:
// 1. Google Fonts API (batches of 15)
// 2. Fontshare API v2 (individual + slug mapping)
// 3. Font Library (dead code — all have customCssUrl now)
// 4. cdnfonts + Google dual (dead code — all have customCssUrl now)
// 5. customCssUrl (jsdelivr/fontsource/cdnfonts/Google Fonts direct links)

export const FontLoader: React.FC<FontLoaderProps> = ({ fonts }) => {
  useEffect(() => {
    if (!fonts || fonts.length === 0) return;

    const addStylesheet = (url: string, id: string) => {
      if (globalLoadedIds.has(id)) return;
      if (document.getElementById(id)) {
        globalLoadedIds.add(id);
        return;
      }
      globalLoadedIds.add(id);
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      link.onerror = () => {
        globalLoadedIds.delete(id);
        link.remove();
      };
      document.head.appendChild(link);
    };

    // Partition fonts by loading strategy
    const googleFonts: Font[] = [];
    const fontshareFonts: Font[] = [];
    const customCssFonts: Font[] = [];

    for (const font of fonts) {
      // Strategy 5: customCssUrl takes priority
      if (font.customCssUrl) {
        customCssFonts.push(font);
        continue;
      }

      // Strategy 2: Fontshare
      if (font.source === 'Fontshare') {
        fontshareFonts.push(font);
        continue;
      }

      // Strategy 1: Everything else goes to Google Fonts
      if (!NON_GOOGLE_SOURCES.has(font.source)) {
        googleFonts.push(font);
        continue;
      }

      // Strategies 3 & 4 are dead code — all remaining non-Google/non-Fontshare fonts 
      // should have customCssUrl by now. If not, skip silently.
    }

    // --- Strategy 1: Google Fonts API (batches of 15) ---
    const BATCH_SIZE = 15;
    for (let i = 0; i < googleFonts.length; i += BATCH_SIZE) {
      const batch = googleFonts.slice(i, i + BATCH_SIZE);
      const families = batch
        .map(f => {
          const name = f.name.replace(/ /g, '+');
          const wghtRange = f.variable ? ':wght@100..900' : '';
          return `family=${name}${wghtRange}`;
        })
        .join('&');
      const url = `https://fonts.googleapis.com/css2?${families}&display=swap`;
      addStylesheet(url, `gf-batch-${i}`);
    }

    // --- Strategy 2: Fontshare API v2 (individual) ---
    for (const font of fontshareFonts) {
      const slug = FONTSHARE_SLUGS[font.name] || font.name.toLowerCase().replace(/\s+/g, '-');
      const url = `https://api.fontshare.com/v2/css?f[]=${slug}@1&display=swap`;
      addStylesheet(url, `fs-${font.id}`);
    }

    // --- Strategy 5: customCssUrl ---
    for (const font of customCssFonts) {
      addStylesheet(font.customCssUrl!, `custom-${font.id}`);
    }
  }, [fonts]);

  return null;
};