import fontData from './font-data/fonts.generated.json';

export interface Font {
  id: string;
  name: string;
  author: string;
  description: string;
  variable: boolean;
  categories: string[];
  languages: string[];
  license: string;
  source: string;
  sourceUrl: string;
  downloadUrl?: string;
  customCssUrl?: string;
  weights: string[];
  styles: string[];
  tags: string[];
  cssStack: string;
}

export const mockFonts: Font[] = fontData as unknown as Font[];
