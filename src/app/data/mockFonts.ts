// --- Interfaces ---
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
  customCssUrl?: string; // New field for external CDNs (GitHub, Vercel, etc.)
  weights: string[];
  styles: string[];
  tags: string[];
  cssStack: string;
}

// --- KNOWN CYRILLIC FONTS LIST (Expanded) ---
const CYRILLIC_SUPPORTED = new Set([
  // Standard & Google Fonts
  "PT Sans", "PT Serif", "PT Mono", "PT Sans Caption", "PT Serif Caption", "PT Sans Narrow", "Golos Text",
  "Roboto", "Roboto Slab", "Roboto Mono", "Roboto Condensed", "Open Sans", "Open Sans Condensed",
  "Montserrat", "Montserrat Alternates", "Inter", "Lato", "Ubuntu", "Ubuntu Mono", "Ubuntu Condensed",
  "Merriweather", "Merriweather Sans", "Playfair Display", "Playfair Display SC", "Lora", "Nunito", "Nunito Sans",
  "Fira Sans", "Fira Mono", "Fira Sans Condensed", "Fira Sans Extra Condensed", "Fira Code",
  "Alegreya", "Alegreya Sans", "Alegreya SC", "Alegreya Sans SC", "Cormorant", "Cormorant Garamond",
  "Arimo", "Tinos", "Cousine", "Rubik", "Rubik Mono One", "Exo", "Exo 2", "Comfortaa", "Marmelad",
  "Kelly Slab", "Ruslan Display", "Russo One", "Stalinist One", "Yanone Kaffeesatz", "Jura", "Tenor Sans",
  "Underdog", "Oranienbaum", "Bad Script", "Marck Script", "Neucha", "Pattaya", "Poiret One", "Philosopher",
  "Didact Gothic", "Istok Web", "Ledger", "Scada", "Vollkorn", "Old Standard TT", "Forum", "Cuprum",
  "Alice", "Lobster", "Arvo", "Bebas Neue", "Oswald", "Source Sans Pro", "Source Serif Pro", "Source Code Pro",
  "IBM Plex Sans", "IBM Plex Serif", "IBM Plex Mono", "Manrope", "Jost", "Caveat", "Pacifico", "Amatic SC",
  "Kurale", "Comforter", "Comforter Brush", "Pangolin", "Seymour One", "Knospe", "Stellari", "Press Start 2P",
  "Arsenal", "Asap", "Asap Condensed", "Bitter", "Literata", "Podkova", "Spectral", "Vollkorn SC",
  "El Messiri", "Gabriela", "Kurale", "Lumberjack", "Prosto One", "Rarmaraja", "Rubik Bubbles", "Rubik Glitch",
  "Rubik Microbe", "Rubik Moonrocks", "Rubik Puddles", "Rubik Wet Paint", "Rubik Beastly",
  "Noto Sans", "Noto Serif", "Noto Sans Mono", "JetBrains Mono", "Titillium Web", "Raleway",
  "Play", "Vollkorn", "Ubuntu Condensed", "Cuprum", "Maven Pro", "Poiret One", "Andika",
  "Anonymous Pro", "Bellota", "Bellota Text", "Bona Nova", "Comic Neue", "Cormorant Infant", "Cormorant SC", "Cormorant Unicase",
  "Courier Prime", "EB Garamond", "Kosugi", "Kosugi Maru", "Lemonada", "Murecho", "Noto Sans Display", "Noto Serif Display",
  "Peralta", "Sawarabi Gothic", "Sawarabi Mincho", "Yeseva One",

  // Fontshare (ITF) - Known to support Cyrillic
  "Satoshi", "General Sans", "Clash Display", "Cabinet Grotesk", "Switzer", "Sentient", "Boska", "Pally", "Ranade", "Excon", "Zodiak",

  // New batch — verified Cyrillic support
  "Onest", "Geologica", "Sofia Sans", "Sofia Sans Condensed", "Wix Madefor Display", "Wix Madefor Text",
  "Hanken Grotesk", "Crimson Pro", "Josefin Sans", "Josefin Slab", "Anybody", "Aleo", "Radio Canada", "Genos",

  // Batch 3 — from missing Google Fonts audit
  "Roboto Condensed", "Roboto Slab", "Roboto Flex", "Nunito Sans", "Mulish", "Encode Sans",
  "Pathway Extreme", "Brygada 1918", "Gelasio", "Crete Round", "Libre Bodoni",
  "Nanum Gothic", "Nanum Myeongjo", "Playfair Display SC", "Cinzel Decorative",
  "Cormorant", "Cormorant Infant", "Cormorant SC", "Cormorant Unicase",

  // Batch 4 — full Google Fonts audit (Latin+Cyrillic)
  "Commissioner", "Advent Pro", "Inter Tight", "Ubuntu Sans", "Finlandica", "Glory",
  "Truculenta", "Smooch Sans", "Ysabeau", "Ysabeau Infant", "Ysabeau Office", "Ysabeau SC",
  "Changa", "Labrada", "Kreon", "Volkhov", "Lobster Two", "Sansita", "Sansita Swashed",
  "Caladea", "Marcellus SC", "Overlock", "Overlock SC", "Ruda", "Share",
  "Trispace", "Tourney", "Tomorrow", "K2D", "Niramit", "Marvel",
  "GFS Neohellenic", "Rambla", "Puritan", "Cormorant Upright",
  "Encode Sans Condensed", "Encode Sans Expanded", "Encode Sans Semi Condensed", "Encode Sans Semi Expanded",
  "Inria Sans", "Inria Serif", "Farro", "Gemunu Libre", "Mada",
  "Noticia Text", "Neuton", "Unna", "Expletus Sans", "Bevan",
  "Dongle", "Agdasima", "Heebo", "BioRhyme"
]);

// --- Helper Functions ---
const genWeights = (count: number) => {
  if (count === 1) return ["400"];
  const steps = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
  if (count >= 9) return steps;
  if (count === 2) return ["400", "700"];
  const result = [];
  const stepSize = Math.floor(9 / count);
  for(let i=0; i<count; i++) {
     result.push(steps[Math.min(8, i * stepSize + (i > 0 ? 1 : 0))]);
  }
  return result;
};

const createFont = (name: string, cat: string, authorName: string, sourcePlatform: string, idPrefix: string, index: number, wCount: number = 4, isVar: boolean = false): Font => {
    let url = `https://fonts.google.com/specimen/${name.replace(/ /g, "+")}`;

    // Platform specific URLs
    if (sourcePlatform === "Fontshare") url = `https://www.fontshare.com/fonts/${name.toLowerCase().replace(/ /g, "-")}`;
    if (sourcePlatform === "Velvetyne") url = `https://velvetyne.fr/fonts/${name.toLowerCase().replace(/ /g, "-")}/`;
    if (sourcePlatform === "The League of Moveable Type") url = `https://www.theleagueofmoveabletype.com/${name.toLowerCase().replace(/ /g, "-")}`;
    if (sourcePlatform === "Font Squirrel") url = `https://www.fontsquirrel.com/fonts/${name.toLowerCase().replace(/ /g, "-")}`;
    if (sourcePlatform === "Font Library") url = `https://fontlibrary.org/en/font/${name.toLowerCase().replace(/ /g, "-")}`;
    if (sourcePlatform === "Collletttivo") url = `https://collletttivo.it/`;
    if (sourcePlatform === "Open Foundry") url = `https://open-foundry.com/fonts/${name.toLowerCase().replace(/ /g, "_")}`;
    // (Commercial foundry URLs removed — only OFL/MIT/Apache/GPL fonts remain)

    // Language Logic
    const languages = ["Latin"];
    // Check whitelist or specific authors known for Cyrillic
    if (CYRILLIC_SUPPORTED.has(name) || authorName === "ParaType" || name.startsWith("PT ") || name.includes("Cyrillic")) {
        languages.push("Cyrillic");
    }
    if (sourcePlatform === "Google Fonts / Early Access") {
        if (name.includes("JP")) languages.push("Japanese");
        if (name.includes("KR")) languages.push("Korean");
        if (name.includes("SC") || name.includes("TC")) languages.push("Chinese");
    }

    return {
        id: `${idPrefix}-${index}`,
        name: name,
        author: authorName,
        description: `${name} is a ${cat} typeface by ${authorName}, available on ${sourcePlatform}.`,
        variable: isVar,
        categories: [cat],
        languages: languages,
        license: "Open Source",
        source: sourcePlatform,
        sourceUrl: url,
        weights: genWeights(wCount),
        styles: ["Regular", isVar ? "Variable" : undefined].filter(Boolean) as string[],
        tags: [cat, isVar ? "variable" : "static", sourcePlatform.toLowerCase().replace(/ /g, "-"), authorName.toLowerCase().replace(/ /g, "-")],
        cssStack: `'${name}', ${cat.includes('serif') ? 'serif' : (cat.includes('mono') ? 'monospace' : 'sans-serif')}`,
    };
};

// --- DATASETS ---

// 1. ParaType (Source: Google Fonts)
const paraTypeData = [
    "PT Sans|sans-serif|4|0", "PT Serif|serif|4|0", "PT Mono|monospaced|1|0", "PT Sans Caption|sans-serif|2|0",
    "PT Serif Caption|serif|2|0", "PT Sans Narrow|sans-serif|2|0", "Golos Text|sans-serif|6|1"
];
// 2. Sorkin Type (Source: Google Fonts)
const sorkinData = ["Merriweather Sans|sans-serif|8|1", "Arvo|serif|4|0", "Vast Shadow|display|1|0", "Gudea|sans-serif|3|0", "Kavoon|display|1|0", "Metrophobic|sans-serif|1|0", "Sarina|display|1|0", "Short Stack|handwriting|1|0", "Spinnaker|sans-serif|1|0", "Stalemate|handwriting|1|0", "Supermercado One|display|1|0"];
// 3. Impallari Type (Source: Google Fonts)
const impallariData = ["Lobster|display|1|0", "Cabin|sans-serif|4|1", "Dosis|sans-serif|7|1", "Quattrocento|serif|2|0", "Quattrocento Sans|sans-serif|4|0", "Racing Sans One|display|1|0", "Kaushan Script|handwriting|1|0"];
// 4. Etcetera Type Co (Source: Google Fonts)
const etceteraData = ["Sora|sans-serif|8|1"];
// 5. Omnibus-Type (Source: Google Fonts)
const omnibusData = ["Chivo|sans-serif|9|1", "Chivo Mono|monospaced|9|1", "Archivo Narrow|sans-serif|9|1", "Asap|sans-serif|9|1", "Asap Condensed|sans-serif|9|1", "Faustina|serif|8|1", "Manual|sans-serif|8|1", "Rosario|sans-serif|8|1", "Saira|sans-serif|9|1", "Saira Condensed|sans-serif|9|0", "Saira Extra Condensed|sans-serif|9|0", "MuseoModerno|display|9|1"];
// 6. Huerta Tipográfica (Source: Google Fonts)
const huertaData = ["Alegreya|serif|6|1", "Alegreya Sans|sans-serif|7|1", "Alegreya SC|serif|6|0", "Alegreya Sans SC|sans-serif|7|0", "Bitter|serif|9|1", "Piazzolla|serif|9|1", "Sura|serif|2|0", "Lalezar|display|1|0", "Mirza|display|4|0"];
// 7. Arrow Type (Source: Google Fonts)
const arrowData = ["Recursive|sans-serif|9|1", "Name Sans|sans-serif|9|1", "Shantell Sans|handwriting|9|1"];

// 8. Collletttivo (Independent)
// Not supported by CDN loader currently
// const collletttivoData = ["Ribes|display|1|0", "Gobelet|display|1|0", "Matona|display|1|0", "Mazius|display|3|0", "Spindle|serif|1|0", "Flandre|serif|1|0", "Kessler|display|1|0", "Apfel Grotezk|sans-serif|4|0", "Lucha|display|1|0"];

// 9. Velvetyne (Independent)
// Not supported by CDN loader currently
// const velvetyneData = ["Avara|serif", "BackOut|display", "Basteleur|serif", "Bluu Next|serif", "Boogy Brut|display", "Brassia|serif", "Brenner|sans-serif", "Compagnon|monospaced", "Digestive|display", "Dune Rise|display", "Faune|sans-serif", "Fandango|display", "Fluo|display", "Gnoncents|handwriting", "Good Times|display", "Grotesk|sans-serif", "Happy Times at the IKOB|serif", "Hermes|sans-serif", "Infrarouge|display", "Jachien|display", "Kaerukaeru|display", "Karrik|sans-serif", "Lack|sans-serif", "Le Murmure|serif", "Libertine|serif", "Lineal|sans-serif", "Minipax|serif", "Millimetre|sans-serif", "Mister Pixel|display", "Monowannabe|monospaced", "Mont Blanc|sans-serif", "Ouroboros|display", "Outward|display", "PicNic|display", "Pilowlava|display", "Process|monospaced", "Prophet|sans-serif", "Résistance|display", "Selas|sans-serif", "Solide Mirage|sans-serif", "Sporting Grotesque|sans-serif", "Trickster|display", "Typefesse|display", "Whois Mono|monospaced", "Zai|display", "Zenith|display", "Hyper Scrypt|display", "Terminal Grotesque|monospaced", "Steps Mono|monospaced", "Pixel|display", "Format 1452|sans-serif", "Cactus|display"];

// 10. The League of Moveable Type (Independent)
// Filtered to only include those known to be on Google Fonts
const leagueData = ["League Gothic", "League Spartan", "League Script", "Knewave", "Sniglet", "Raleway", "Orbitron", "Prociono", "Goudy Bookletter 1911", "Sorts Mill Goudy", "Linden Hill", "Fanwood Text", "Alice"];

// 11. Fontshare (Indian Type Foundry) - Exclusives
// Cleaned: removed Pragmatica (commercial ParaType), Besley/Ruwudu (Google Fonts), Metropolis (GitHub indie, has own CDN)
const fontshareData = ["Satoshi", "General Sans", "Clash Display", "Cabinet Grotesk", "Ranade", "Zodiak", "Stardom", "Telma", "Erode", "Melodrama", "Gambetta", "Panchang", "Britney", "Switzer", "Sentient", "Author", "Boska", "Boxing", "Bromine", "Chubbo", "Chillax", "Comico", "Deng", "Dodi", "Duplet", "Excon", "Fokkol", "H.H. Samuel", "Hoover", "Ladi", "Lausanne", "Magro", "Mrow", "New Spirit", "Nippo", "Ozone", "Pally", "Plein", "Rowan", "Saans", "Sudo", "Supreme", "Tabular", "Tanker", "Technor", "Vercetti", "Amulya", "Array", "Aspekta", "Barbara", "Bonny", "Bw Gradual", "Bw Modelica", "Bw Nista", "Bw Seido", "Cal Sans", "Canchal", "Cassandra"];

// 11b. Google Fonts (moved from Fontshare list to fix loading)
const googleMiscData = ["Hind", "Kalam", "Poppins", "Rajdhani", "Yantramanav", "Azeret Mono", "Catamaran", "Cederville Cursive", "Chathura", "Coda", "Darker Grotesque", "Eczar", "Fahkwang", "Frank Ruhl Libre", "Glegoo", "Grenze", "Halant", "Hepta Slab", "Instrument Sans", "Karma", "Kumbh Sans", "Kurale", "Laila", "Lexend", "Martian Mono", "Monda", "Montserrat", "Mukta", "Newsreader", "Plus Jakarta Sans", "Questrial", "Red Hat Display", "Rubik", "Urbanist", "Be Vietnam Pro", "Besley", "Ruwudu"];


// 12. Font Library (OFL)
// Not supported by CDN loader currently
// const fontLibraryData = ["Katahdin Round|display", "Karmilla|sans-serif", "Hanken|sans-serif", "Fantasque Sans Mono|monospaced", "Gnuolane|display", "Commune Nuit|display", "London Between|display"];

// 13. Open Foundry
// Not supported by CDN loader currently
// const openFoundryData = ["Bagnard|serif", "Minotaur|display", "Regle|sans-serif", "Wremena|serif", "Varta|sans-serif"];

// 14. Google Early Access (CJK) - Merged into Google Fonts
const earlyAccessData = ["Noto Sans JP|sans-serif", "Noto Serif JP|serif", "Noto Sans KR|sans-serif", "Noto Serif KR|serif", "Noto Sans TC|sans-serif", "Noto Serif TC|serif"];

// 15. Classic / Google Mix (Filtered)
// Cleaned: removed commercial (Museo, Calluna) and non-Google (Fontin, Diavlo, Audimat, etc.)
const classicData = ["Pacifico", "Source Sans Pro", "Ubuntu", "Oxygen", "Titillium Web", "Inconsolata", "Indie Flower", "Vollkorn", "Signika", "Ubuntu Condensed", "Play", "Cuprum", "Maven Pro", "Poiret One", "Hammersmith One", "Armata", "Nobile", "Molengo", "Pontano Sans", "Jura", "Grand Hotel", "Great Vibes", "Sofia", "Alex Brush", "Tangerine", "Rochester", "Pinyon Script", "Sacramento", "Parisienne", "Cookie", "Allura", "Arizonia", "Bad Script", "Bilbo", "Calligraffitti", "Cedarville Cursive", "Clicker Script", "Coming Soon", "Covered By Your Grace", "Crafty Girls", "Damion", "Dawning of a New Day", "Delius", "Delius Swash Caps", "Delius Unicase", "Devonshire", "Dr Sugiyama", "Eagle Lake", "Engagement", "Euphoria Script", "Felipa", "Fondamento", "Give You Glory", "Gochi Hand", "Grape Nuts", "Handlee", "Herr Von Muellerhoff", "Homemade Apple", "Italianno", "Jim Nightshade", "Julee", "Just Me Again Down Here", "Kalam", "Kristi", "La Belle Aurore", "Leckerli One", "Loved by the King", "Lovers Quarrel", "Marck Script", "Meddon", "Meie Script", "Merienda", "Miss Fajardose", "Mr Bedfort", "Mr Dafoe", "Mr De Haviland", "Mrs Saint Delafield", "Mrs Sheppards", "Neucha", "Niconne", "Nothing You Could Do", "Over the Rainbow", "Petit Formal Script", "Playball", "Quintessential", "Qwigley", "Rancho", "Redressed", "Rouge Script", "Ruthie", "Schoolbell", "Shadows Into Light", "Shadows Into Light Two", "Sirin Stencil", "Sue Ellen Francisco", "Sunshiney", "Swanky and Moo Moo", "The Girl Next Door", "Unkempt", "Vibur", "Waiting for the Sunrise", "Walter Turncoat", "Yellowtail", "Yesteryear", "Zeyada"];

// --- Build the Final Array ---

const fonts: Font[] = [];
const seenNames = new Set<string>();
let globalIndex = 0;

const guessCategory = (name: string, defaultCat: string = "sans-serif"): string => {
    const n = name.toLowerCase();
    if (n.includes("serif") || n.includes("slab") || n.includes("mincho")) return "serif";
    if (n.includes("mono") || n.includes("code") || n.includes("terminal")) return "monospaced";
    if (n.includes("script") || n.includes("hand") || n.includes("brush") || n.includes("cursive")) return "handwriting";
    if (n.includes("display") || n.includes("one") || n.includes("shadow") || n.includes("outline")) return "display";
    return defaultCat;
};

const addFont = (font: Font) => {
    if (!seenNames.has(font.name)) {
        seenNames.add(font.name);
        fonts.push(font);
    }
};

// Add Google Fonts Groups
paraTypeData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "ParaType", "Google Fonts", "pt", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
sorkinData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Sorkin Type", "Google Fonts", "sorkin", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
impallariData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Impallari Type", "Google Fonts", "impallari", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
etceteraData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Etcetera Type Co", "Google Fonts", "etc", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
omnibusData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Omnibus-Type", "Google Fonts", "omnibus", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
huertaData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Huerta Tipográfica", "Google Fonts", "huerta", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
arrowData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Arrow Type", "Google Fonts", "arrow", globalIndex++, parseInt(parts[2]), parts[3] === "1")); });
earlyAccessData.forEach(item => { const parts = item.split("|"); addFont(createFont(parts[0], parts[1], "Google Inc", "Google Fonts", "early", globalIndex++, 4, false)); });
classicData.forEach((item, i) => {
    const cat = guessCategory(item);
    const isVar = i % 10 === 0;
    const weights = i % 3 === 0 ? 1 : 4;
    addFont(createFont(item, cat, "Various Authors", "Google Fonts", "google", globalIndex++, weights, isVar));
});

// Add Independent Platforms
leagueData.forEach(item => { addFont(createFont(item, guessCategory(item), "The League of Moveable Type", "The League of Moveable Type", "league", globalIndex++, 4, false)); });
fontshareData.forEach(item => { addFont(createFont(item, guessCategory(item, "sans-serif"), "Indian Type Foundry", "Fontshare", "itf", globalIndex++, 8, true)); });
googleMiscData.forEach(item => { addFont(createFont(item, guessCategory(item), "Various", "Google Fonts", "g-misc", globalIndex++, 4, true)); });
// fontLibraryData.forEach(item => { const parts = item.split("|"); fonts.push(createFont(parts[0], parts[1], "Various", "Font Library", "fl", globalIndex++, 4, false)); });
// openFoundryData.forEach(item => { const parts = item.split("|"); fonts.push(createFont(parts[0], parts[1], "Various", "Open Foundry", "of", globalIndex++, 4, false)); });


// 16. GitHub Design System
addFont({
    id: "gh-mona",
    name: "Mona Sans",
    author: "GitHub",
    description: "Mona Sans is a strong, versatile variable font used across GitHub's marketing and product. Designed to be expressive and distinct.",
    variable: true,
    categories: ["sans-serif"],
    languages: ["Latin"],
    license: "OFL",
    source: "GitHub",
    sourceUrl: "https://github.com/mona-sans",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@github/mona-sans@1.0.1/dist/index.min.css",
    weights: ["200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Variable"],
    tags: ["sans-serif", "variable", "github", "industrial"],
    cssStack: "'Mona Sans', sans-serif"
});

addFont({
    id: "gh-hubot",
    name: "Hubot Sans",
    author: "GitHub",
    description: "Hubot Sans is a robotic, geometric sans-serif with a technical character. Perfect for data visualization and code interfaces.",
    variable: true,
    categories: ["sans-serif"],
    languages: ["Latin"],
    license: "OFL",
    source: "GitHub",
    sourceUrl: "https://github.com/hubot-sans",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@github/hubot-sans@1.0.1/dist/index.min.css",
    weights: ["200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Variable"],
    tags: ["sans-serif", "variable", "github", "robot"],
    cssStack: "'Hubot Sans', sans-serif"
});

// 17. Vercel Design System (Mock - via CDN fallback or next/font simulation if available, here using a generic geist-like cdn or similar)
// Note: Real Geist is usually loaded via Next.js optimizations. We'll use a JSDelivr mirror if available or skip.
// Actually, let's add IBM Plex via Google Fonts explicitly to ensure it's covered as "System"
addFont(createFont("IBM Plex Sans", "sans-serif", "IBM", "Google Fonts", "ibm", 999, 7, false));
addFont(createFont("IBM Plex Mono", "monospaced", "IBM", "Google Fonts", "ibm", 1000, 7, false));

// 18. Pretendard (Platform: Cactus)
addFont({
    id: "pretendard",
    name: "Pretendard",
    author: "Kil Hyung-jin",
    description: "A system-ui replacement for Apple's San Francisco and Inter. Extremely popular in Korea and modern web apps.",
    variable: true,
    categories: ["sans-serif"],
    languages: ["Latin", "Cyrillic", "Korean"],
    license: "SIL OFL",
    source: "Cactus",
    sourceUrl: "https://github.com/orioncactus/pretendard",
    customCssUrl: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Regular", "Bold"],
    tags: ["sans-serif", "system", "clean", "apple-like"],
    cssStack: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif"
});

// 19. Uncut.wtf / Independent Curated
// Using Google Fonts links for stability but labeling as Independent for the filter if they are known indie darlings
const indieFoundriesData = [
    "Space Grotesk|sans-serif|Florian Karsten",
    "Syne|display|Bonjour Monde",
    "Outfit|sans-serif|Outfit",
    "Epilogue|sans-serif|Etcetera",
    "Fraunces|serif|Undercase",
    "Literata|serif|TypeTogether",
    "Fire Sans|sans-serif|Carrois",
    "Castoro|serif|Tiro Typeworks"
];

indieFoundriesData.forEach(item => {
    const [name, cat, auth] = item.split("|");
    addFont(createFont(name, cat, auth, "Uncut / Indie", "uncut", globalIndex++, 6, true));
});

// 20. US Web Design System (USWDS)
addFont({
    ...createFont("Public Sans", "sans-serif", "USWDS", "USWDS", "uswds", globalIndex++, 9, true),
    description: "A strong, neutral, open source typeface for text and display. Adapted from Libre Franklin.",
    sourceUrl: "https://public-sans.digital.gov/",
});

// 21. Hack (Source Foundry)
addFont({
    id: "hack-font",
    name: "Hack",
    author: "Source Foundry",
    description: "A typeface designed for source code.",
    variable: false,
    categories: ["monospaced"],
    languages: ["Latin", "Cyrillic"],
    license: "MIT",
    source: "Source Foundry",
    sourceUrl: "https://sourcefoundry.org/hack/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/hack-font@3.3.0/build/web/hack.css",
    weights: ["400", "700"],
    styles: ["Regular", "Bold", "Italic"],
    tags: ["code", "mono", "developer"],
    cssStack: "'Hack', monospace"
});

// 22. Microsoft Design
addFont({
    id: "cascadia-code",
    name: "Cascadia Code",
    author: "Microsoft",
    description: "A fun, new monospaced font that includes programming ligatures and is designed to enhance the modern look and feel of the Windows Terminal.",
    variable: true,
    categories: ["monospaced"],
    languages: ["Latin", "Cyrillic"],
    license: "OFL",
    source: "Microsoft",
    sourceUrl: "https://github.com/microsoft/cascadia-code",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@fontsource/cascadia-code@4.2.1/index.min.css",
    weights: ["200", "300", "400", "500", "600", "700"],
    styles: ["Regular", "Italic"],
    tags: ["code", "terminal", "windows", "microsoft"],
    cssStack: "'Cascadia Code', monospace"
});

// 23. Intel Brand
addFont({
    id: "intel-one-mono",
    name: "Intel One Mono",
    author: "Intel",
    description: "An expressive monospaced font family that’s built with clarity, legibility, and the needs of developers in mind.",
    variable: false,
    categories: ["monospaced"],
    languages: ["Latin"],
    license: "OFL",
    source: "Intel",
    sourceUrl: "https://github.com/intel/intel-one-mono",
    customCssUrl: "https://cdn.jsdelivr.net/npm/intel-one-mono@1.3.0/dist/css/intel-one-mono.min.css",
    weights: ["400", "500", "700"],
    styles: ["Regular", "Bold", "Italic"],
    tags: ["code", "hardware", "intel", "industrial"],
    cssStack: "'Intel One Mono', monospace"
});

// 24. Smithsonian Design
addFont({
    id: "cooper-hewitt",
    name: "Cooper Hewitt",
    author: "Chester Jenkins",
    description: "A contemporary sans serif, with characters composed of modified geometric curves and arches. Created for the Cooper Hewitt Smithsonian Design Museum.",
    variable: false,
    categories: ["sans-serif"],
    languages: ["Latin"],
    license: "OFL",
    source: "Smithsonian",
    sourceUrl: "https://www.cooperhewitt.org/open-source-at-cooper-hewitt/cooper-hewitt-the-typeface-by-chester-jenkins/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@fontsource/cooper-hewitt@5.0.3/index.min.css",
    weights: ["100", "300", "400", "500", "600", "700", "800"],
    styles: ["Regular", "Italic"],
    tags: ["museum", "design", "geometric", "art"],
    cssStack: "'Cooper Hewitt', sans-serif"
});

// 25. Community / Cult
addFont({
    id: "iosevka",
    name: "Iosevka",
    author: "Belleve Invis",
    description: "Slender monospace sans-serif and slab-serif typeface inspired by Pragmata Pro, M+ and PF DIN Mono. The ultimate procedural font.",
    variable: false,
    categories: ["monospaced"],
    languages: ["Latin", "Cyrillic", "Japanese", "Chinese"],
    license: "OFL",
    source: "Community",
    sourceUrl: "https://typeof.net/Iosevka/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@fontsource/iosevka@5.0.8/index.min.css",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Regular", "Oblique"],
    tags: ["procedural", "code", "tech", "narrow"],
    cssStack: "'Iosevka', monospace"
});

// 26. Adobe (Open Source)
const adobeData = [
    "Source Sans 3|sans-serif|Paul D. Hunt",
    "Source Serif 4|serif|Frank Grießhammer",
    "Source Code Pro|monospaced|Paul D. Hunt"
];
adobeData.forEach(item => {
    const [name, cat, auth] = item.split("|");
    addFont(createFont(name, cat, auth, "Adobe", "adobe", globalIndex++, 9, true));
});

// 27. Canonical (Ubuntu)
const canonicalData = [
    "Ubuntu|sans-serif|Dalton Maag",
    "Ubuntu Mono|monospaced|Dalton Maag",
    "Ubuntu Condensed|sans-serif|Dalton Maag"
];
canonicalData.forEach(item => {
    const [name, cat, auth] = item.split("|");
    addFont(createFont(name, cat, auth, "Canonical", "canonical", globalIndex++, 4, false));
});

// 28. Mozilla
const mozillaData = [
    "Fira Sans|sans-serif|Carrois Apostrophe",
    "Fira Mono|monospaced|Carrois Apostrophe"
];
mozillaData.forEach(item => {
    const [name, cat, auth] = item.split("|");
    addFont(createFont(name, cat, auth, "Mozilla", "mozilla", globalIndex++, 9, name !== "Fira Mono"));
});

// 29. Red Hat
const redHatData = [
    "Red Hat Mono|monospaced|MCKL"
];
redHatData.forEach(item => {
    const [name, cat, auth] = item.split("|");
    addFont(createFont(name, cat, auth, "Red Hat", "redhat", globalIndex++, 9, true));
});

// 30. Braille Institute
addFont(createFont("Atkinson Hyperlegible", "sans-serif", "Braille Institute", "Braille Institute", "braille", globalIndex++, 4, false));

// 31. Rsms
addFont(createFont("Inter", "sans-serif", "Rasmus Andersson", "Rsms", "rsms", globalIndex++, 9, true));

// 32. Vercel (Geist)
addFont({
    id: "geist-sans",
    name: "Geist Sans",
    author: "Vercel",
    description: "A typeface designed to be invisible. Precision-engineered for the web.",
    variable: true,
    categories: ["sans-serif"],
    languages: ["Latin"],
    license: "OFL",
    source: "Vercel",
    sourceUrl: "https://vercel.com/font",
    customCssUrl: "https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-sans/style.css",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Variable"],
    tags: ["clean", "modern", "vercel", "interface"],
    cssStack: "'Geist Sans', sans-serif"
});
addFont({
    id: "geist-mono",
    name: "Geist Mono",
    author: "Vercel",
    description: "The monospace companion to Geist Sans. Designed for code and technical UIs.",
    variable: true,
    categories: ["monospaced"],
    languages: ["Latin"],
    license: "OFL",
    source: "Vercel",
    sourceUrl: "https://vercel.com/font",
    customCssUrl: "https://cdn.jsdelivr.net/npm/geist@1.3.0/dist/fonts/geist-mono/style.css",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    styles: ["Variable"],
    tags: ["code", "console", "vercel", "mono"],
    cssStack: "'Geist Mono', monospace"
});

// 33. GitHub Next (Monaspace)
const monaspaceFonts = [
    { name: "Monaspace Neon", style: "Neo-grotesque", id: "neon" },
    { name: "Monaspace Argon", style: "Humanist", id: "argon" },
    { name: "Monaspace Xenon", style: "Serif", id: "xenon" },
    { name: "Monaspace Radon", style: "Handwriting", id: "radon" },
    { name: "Monaspace Krypton", style: "Mechanical", id: "krypton" }
];

monaspaceFonts.forEach(font => {
    addFont({
        id: `monaspace-${font.id}`,
        name: font.name,
        author: "GitHub Next",
        description: `Part of the Monaspace supergroup. A ${font.style} monospace font with texture healing.`,
        variable: true,
        categories: ["monospaced"],
        languages: ["Latin"],
        license: "OFL",
        source: "GitHub Next",
        sourceUrl: "https://monaspace.githubnext.com/",
        customCssUrl: "https://cdn.jsdelivr.net/npm/@github/monaspace@1.0.0/css/monaspace.css",
        weights: ["200", "300", "400", "500", "600", "700", "800"],
        styles: ["Variable"],
        tags: ["code", "github", "future", "texture-healing"],
        cssStack: `'${font.name}', monospace`
    });
});

// 34. Go Project (Golang)
addFont({
    id: "go-font",
    name: "Go",
    author: "Bigelow & Holmes",
    description: "The font family for the Go programming language.",
    variable: false,
    categories: ["sans-serif"],
    languages: ["Latin"],
    license: "BSD",
    source: "Go Project",
    sourceUrl: "https://go.dev/blog/go-fonts",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@fontsource/go-sans@5.0.8/index.min.css",
    weights: ["400", "500", "700"],
    styles: ["Regular", "Italic"],
    tags: ["google", "golang", "system", "ui"],
    cssStack: "'Go', sans-serif"
});
addFont({
    id: "go-mono",
    name: "Go Mono",
    author: "Bigelow & Holmes",
    description: "The monospace font family for the Go programming language.",
    variable: false,
    categories: ["monospaced"],
    languages: ["Latin"],
    license: "BSD",
    source: "Go Project",
    sourceUrl: "https://go.dev/blog/go-fonts",
    customCssUrl: "https://cdn.jsdelivr.net/npm/@fontsource/go-mono@5.0.8/index.min.css",
    weights: ["400", "500", "700"],
    styles: ["Regular", "Italic"],
    tags: ["code", "golang", "mono"],
    cssStack: "'Go Mono', monospace"
});

// 35. JetBrains
addFont({
    id: "jetbrains-mono-standalone",
    name: "JetBrains Mono",
    author: "JetBrains",
    description: "A typeface for developers. Created to make reading code easier.",
    variable: true,
    categories: ["monospaced"],
    languages: ["Latin", "Cyrillic"],
    license: "OFL",
    source: "JetBrains",
    sourceUrl: "https://www.jetbrains.com/lp/mono/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/jetbrains-mono@1.0.6/css/jetbrains-mono.min.css",
    weights: ["100", "200", "300", "400", "500", "600", "700", "800"],
    styles: ["Variable", "Italic"],
    tags: ["ide", "code", "developer", "jetbrains"],
    cssStack: "'JetBrains Mono', monospace"
});

// 36. Linux Systems
addFont(createFont("Cantarell", "sans-serif", "Dave Crossland", "GNOME", "gnome", globalIndex++, 4, false));
addFont(createFont("Oxygen", "sans-serif", "Vernon Adams", "KDE", "kde", globalIndex++, 3, false));

// 37. Indie Coding
addFont({
    id: "victor-mono",
    name: "Victor Mono",
    author: "Rubens Boy",
    description: "A monospaced font with semi-connected cursive italics and symbol ligatures.",
    variable: false,
    categories: ["monospaced"],
    languages: ["Latin"],
    license: "MIT",
    source: "Indie Coding",
    sourceUrl: "https://rubjo.github.io/victor-mono/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/victor-mono@1.5.5/dist/index.min.css",
    weights: ["100", "200", "300", "400", "500", "600", "700"],
    styles: ["Regular", "Italic"],
    tags: ["code", "cursive", "ligatures"],
    cssStack: "'Victor Mono', monospace"
});

addFont({
    id: "julia-mono",
    name: "JuliaMono",
    author: "Cormullion",
    description: "A monospaced font for scientific and technical computing, designed for the Julia programming language.",
    variable: true,
    categories: ["monospaced"],
    languages: ["Latin", "Greek", "Cyrillic"],
    license: "OFL",
    source: "Indie Coding",
    sourceUrl: "https://juliamono.netlify.app/",
    customCssUrl: "https://cdn.jsdelivr.net/npm/juliamono@0.0.52/juliamono.css",
    weights: ["400", "500", "700"],
    styles: ["Regular"],
    tags: ["code", "science", "julia", "math"],
    cssStack: "'JuliaMono', monospace"
});

// 38. Academic / Science
addFont(createFont("Gentium Plus", "serif", "SIL", "SIL International", "sil", globalIndex++, 4, false));
addFont(createFont("STIX Two Text", "serif", "STIPub", "Scientific", "stix", globalIndex++, 4, true));

// 39. Retro / Pixel (Google Fonts)
const retroFonts = [];
retroFonts.forEach(name => {
     addFont(createFont(name, "display", "Various", "Retro / Pixel", "retro", globalIndex++, 1, false));
});

// 40. Industrial Standards (DIN Style)
const dinFonts = [];
dinFonts.forEach(name => {
    addFont(createFont(name, "sans-serif", "Jeremy Tribby", "Industrial", "din", globalIndex++, 9, true));
});

// 41. Sci-Fi & Future UI
const scifiFonts = ["Michroma", "Bruno Ace"];
scifiFonts.forEach(name => {
    addFont(createFont(name, "display", "Various", "Sci-Fi / Tech", "scifi", globalIndex++, 4, name === "Exo 2"));
});

// 42. Corporate Open Source
addFont(createFont("Goldman", "sans-serif", "Jaakkola & Goldman Sachs", "Goldman Sachs", "goldman", globalIndex++, 3, false));

// 43. Mozilla Extended
addFont(createFont("Zilla Slab", "serif", "Typotheque", "Mozilla", "mozilla-ext", globalIndex++, 5, false));

// 44. Drafting & Schematics
const draftingFonts = ["Share Tech", "Lekton", "Monda"];
draftingFonts.forEach(name => {
    addFont(createFont(name, name.includes("Mono") ? "monospaced" : "sans-serif", "Various", "Drafting", "draft", globalIndex++, 3, false));
});

// 45. Typewriter Revival
const typewriterFonts = ["Cutive", "Special Elite"];
typewriterFonts.forEach(name => {
    addFont(createFont(name, "monospaced", "Various", "Typewriter", "typewriter", globalIndex++, 2, false));
});

// 46. Dot Matrix / LED
// Removed duplicate (DotGothic16 is in #72)

// 47. DeepMind (DM Series)
const dmFonts = ["DM Serif Display", "DM Serif Text"];
dmFonts.forEach(name => {
    addFont(createFont(name, name.includes("Serif") ? "serif" : (name.includes("Mono") ? "monospaced" : "sans-serif"), "Colophon Foundry", "DeepMind", "dm", globalIndex++, 9, true));
});

// 48. Highway / Transport (Red Hat / Overpass)
const transportFonts = ["Overpass", "Overpass Mono"];
transportFonts.forEach(name => {
    addFont(createFont(name, name.includes("Mono") ? "monospaced" : "sans-serif", "Delve Fonts", "Transport", "transport", globalIndex++, 9, true));
});

// 49. Hyper-Legibility (Fintech)
const lexendFonts = ["Lexend", "Lexend Deca", "Lexend Exa", "Lexend Giga", "Lexend Mega", "Lexend Peta", "Lexend Tera", "Lexend Zetta"];
lexendFonts.forEach(name => {
    addFont(createFont(name, "sans-serif", "Thomas Jockin", "Hyper-Legibility", "lexend", globalIndex++, 9, true));
});

// 50. Constructivist / Brutalist
const brutalFonts = ["Russo One", "Stalinist One", "Plaster", "Koulen"];
brutalFonts.forEach(name => {
    addFont(createFont(name, "display", "Various", "Brutalist", "brutal", globalIndex++, 1, false));
});

// 51. Chrome OS Core (Ascender)
const chromeFonts = ["Arimo", "Tinos"];
chromeFonts.forEach(name => {
    addFont(createFont(name, name === "Cousine" ? "monospaced" : (name === "Tinos" ? "serif" : "sans-serif"), "Steve Matteson", "Chrome OS", "chrome", globalIndex++, 4, false));
});

// 52. Production Type (Screen Smart)
// Removed duplicate

// 53. Coding Classics
// Removed duplicate

// 54. Modern Geometric
const geoFonts = ["Questrial", "Monda", "Syncopate"];
geoFonts.forEach(name => {
    addFont(createFont(name, name === "Syncopate" || name === "Audiowide" ? "display" : "sans-serif", "Various", "Geometric", "geo", globalIndex++, 1, false));
});

// 55. Neo-Pixel (2024 Era)
const neoPixelFonts = ["Jersey 10", "Jersey 15", "Jersey 20", "Jersey 25", "Jacquard 12", "Tiny5", "Micro 5"];
neoPixelFonts.forEach(name => {
    addFont(createFont(name, "display", "Various", "Neo-Pixel", "neopix", globalIndex++, 1, false));
});

// 56. Asian Industrial (Korean Style)
addFont(createFont("Do Hyeon", "sans-serif", "Sandoll", "Asian Industrial", "asia-ind", globalIndex++, 1, false));
addFont(createFont("Gothic A1", "sans-serif", "HanYang I&C", "Asian Industrial", "asia-ind", globalIndex++, 9, false));
addFont(createFont("Nanum Gothic Coding", "monospaced", "Sandoll", "Asian Industrial", "asia-ind", globalIndex++, 2, false));

// 57. Blueprint / Sketch (Handwritten)
const sketchFonts = ["Architects Daughter", "Reenie Beanie", "Gloria Hallelujah"];
sketchFonts.forEach(name => {
    addFont(createFont(name, "handwriting", "Various", "Blueprint", "sketch", globalIndex++, 1, false));
});

// 58. Code Ligatures Standard
// Removed duplicate

// 59. Wireframe / Prototyping (Skeleton)
const flowFonts = ["Flow Circular", "Flow Rounded", "Flow Block", "Balsamiq Sans"];
flowFonts.forEach(name => {
    addFont(createFont(name, name.includes("Balsamiq") ? "handwriting" : "display", "Dan Ross", "Wireframe", "flow", globalIndex++, 1, false));
});

// 60. Expressive Grotesques (Trend 2025)
addFont(createFont("Bricolage Grotesque", "sans-serif", "Mathieu Réguer", "Trending", "bricolage", globalIndex++, 9, true));
addFont(createFont("Schibsted Grotesk", "sans-serif", "Bakken & Bæck", "Scandinavian", "schibsted", globalIndex++, 4, false));
addFont(createFont("Albert Sans", "sans-serif", "Andreas Rasmussen", "Geometric", "albert", globalIndex++, 9, true));

// 61. Heavy Posters (Brutalism)
addFont(createFont("Dela Gothic One", "display", "Artur Schmal", "Poster", "dela", globalIndex++, 1, false));
addFont(createFont("Righteous", "display", "Astigmatic", "Sci-Fi", "righteous", globalIndex++, 1, false));
addFont(createFont("Unica One", "display", "Various", "Retro", "unica", globalIndex++, 1, false));

// 62. Aeronautical (Airbus / Cockpit UI)
addFont(createFont("B612", "sans-serif", "PolarSys & Airbus", "Avionics", "airbus", globalIndex++, 4, false));
addFont(createFont("B612 Mono", "monospaced", "PolarSys & Airbus", "Avionics", "airbus", globalIndex++, 4, false));

// 63. Urban / Street (Chicago Style)
const urbanFonts = ["Big Shoulders Display", "Big Shoulders Text", "Big Shoulders Inline", "Big Shoulders Stencil Display"];
urbanFonts.forEach(name => {
    addFont(createFont(name, "display", "Patric King", "Urban", "urban", globalIndex++, 9, true));
});

// 64. Soft UI (Rounded)
addFont(createFont("Varela Round", "sans-serif", "Joe Prince", "Soft UI", "varela", globalIndex++, 1, false));
addFont(createFont("M PLUS Rounded 1c", "sans-serif", "M+ Fonts", "Soft UI", "mplus", globalIndex++, 7, false));

// 65. Industrial Marker (Grunge Notes)
addFont(createFont("Permanent Marker", "handwriting", "Font Diner", "Marker", "marker", globalIndex++, 1, false));
addFont(createFont("Rock Salt", "handwriting", "Various", "Marker", "marker", globalIndex++, 1, false));

// 66. Tech Editorial (Mozilla Brand)
addFont(createFont("Zilla Slab", "serif", "Typotheque", "Tech Slab", "zilla", globalIndex++, 6, true));
addFont(createFont("Zilla Slab Highlight", "display", "Typotheque", "Tech Slab", "zilla", globalIndex++, 2, false));

// 67. Military / Stencil (Cargo)
addFont(createFont("Black Ops One", "display", "James Grieshaber", "Military", "military", globalIndex++, 1, false));
addFont(createFont("Stardos Stencil", "display", "Vernon Adams", "Military", "military", globalIndex++, 2, false));
addFont(createFont("Quantico", "sans-serif", "MadType", "HUD", "quantico", globalIndex++, 4, true));

// 68. Cyber Glitch & Distortion
addFont(createFont("Rubik Glitch", "display", "Hubert & Fischer", "Glitch", "rubik", globalIndex++, 1, false));
addFont(createFont("Rubik Wet Paint", "display", "Hubert & Fischer", "Liquid", "rubik", globalIndex++, 1, false));

// 69. Ultra Condensed (Dashboard Stats)
addFont(createFont("Antonio", "sans-serif", "Vernon Adams", "Dashboard", "antonio", globalIndex++, 7, false));

// 70. Enterprise Open Source (Linux Giants)
addFont(createFont("Red Hat Display", "sans-serif", "Red Hat", "Enterprise", "redhat", globalIndex++, 9, true));
addFont(createFont("Red Hat Text", "sans-serif", "Red Hat", "Enterprise", "redhat", globalIndex++, 4, true));
addFont(createFont("Ubuntu", "sans-serif", "Dalton Maag", "Humanist", "ubuntu", globalIndex++, 8, true));
addFont(createFont("Ubuntu Mono", "monospaced", "Dalton Maag", "Console", "ubuntu", globalIndex++, 4, false));

// 71. Architectural / Blueprint
addFont(createFont("Architects Daughter", "handwriting", "Kimberly Geswein", "Blueprint", "arch", globalIndex++, 1, false));
addFont(createFont("Gloria Hallelujah", "handwriting", "Kimberly Geswein", "Sketch", "arch", globalIndex++, 1, false));

// 72. Retro Terminal (CRT & Pixel)
addFont(createFont("VT323", "monospaced", "Peter Hull", "CRT", "vt323", globalIndex++, 1, false));
addFont(createFont("Silkscreen", "display", "Jason Kottke", "Pixel", "silkscreen", globalIndex++, 2, false));
addFont(createFont("DotGothic16", "sans-serif", "Fontworks", "Dot Matrix", "dot", globalIndex++, 1, false));

// 73. Art House / Awwwards (Experimental)
addFont(createFont("Syne", "display", "Bonjour Monde", "Art House", "syne", globalIndex++, 5, true));
addFont(createFont("Krona One", "sans-serif", "Yvonne Schüttler", "Low Res", "krona", globalIndex++, 1, false));

// 74. Civic Tech (US Government Standard)
addFont(createFont("Public Sans", "sans-serif", "USWDS", "Civic", "public", globalIndex++, 9, true));
addFont(createFont("Merriweather", "serif", "Sorkin Type", "Editorial", "merriweather", globalIndex++, 8, true));

// 75. Adobe Core (Open Source)
addFont(createFont("Source Sans 3", "sans-serif", "Adobe", "Corporate", "adobe", globalIndex++, 9, true));
addFont(createFont("Source Serif 4", "serif", "Adobe", "Corporate", "adobe", globalIndex++, 6, true));
addFont(createFont("Source Code Pro", "monospaced", "Adobe", "Coding", "adobe", globalIndex++, 7, true));

// 76. Typewriter / Dossier
addFont(createFont("Courier Prime", "monospaced", "Quote", "Typewriter", "courier", globalIndex++, 4, false));
addFont(createFont("Cutive Mono", "monospaced", "Vernon Adams", "Typewriter", "cutive", globalIndex++, 1, false));

// 77. Square Tech (HUD / Industrial)
addFont(createFont("Chakra Petch", "sans-serif", "Cadson Demak", "Square", "chakra", globalIndex++, 7, false));
addFont(createFont("Michroma", "sans-serif", "Vernon Adams", "Square", "michroma", globalIndex++, 1, false));
addFont(createFont("Orbitron", "sans-serif", "Matt McInerney", "Sci-Fi", "orbitron", globalIndex++, 4, true));

// 78. Code & UI Hybrid (Variable)
addFont(createFont("Recursive", "sans-serif", "Arrow Type", "Hybrid", "recursive", globalIndex++, 4, true));

// 79. Industrial DIN (California Style)
addFont(createFont("Barlow", "sans-serif", "Jeremy Tribby", "DIN", "barlow", globalIndex++, 9, true));
addFont(createFont("Barlow Condensed", "sans-serif", "Jeremy Tribby", "DIN", "barlow", globalIndex++, 9, true));
addFont(createFont("Barlow Semi Condensed", "sans-serif", "Jeremy Tribby", "DIN", "barlow", globalIndex++, 9, false));

// 80. Modern Functional (Geometric)
addFont(createFont("Manrope", "sans-serif", "Mikhail Sharanda", "Geometric", "manrope", globalIndex++, 7, true));
addFont(createFont("Jost", "sans-serif", "Indestructible Type", "Geometric", "jost", globalIndex++, 9, true));

// 81. Space Age (Sci-Fi Grotesk)
addFont(createFont("Space Grotesk", "sans-serif", "Florian Karsten", "Space", "space", globalIndex++, 5, true));
addFont(createFont("Audiowide", "display", "Astigmatic", "Techno", "audio", globalIndex++, 1, false));

// 82. 8-Bit / Console (Retro Gaming)
addFont(createFont("Press Start 2P", "display", "CodeMan38", "Pixel", "press", globalIndex++, 1, false));
addFont(createFont("Pixelify Sans", "display", "Stefie Justprince", "Pixel", "pixelify", globalIndex++, 4, true));

// 83. High Editorial (Luxury Contrast)
addFont(createFont("Playfair Display", "serif", "Claus Eggers Sørensen", "Editorial", "playfair", globalIndex++, 6, true));
addFont(createFont("Cinzel", "serif", "Natanael Gama", "Classical", "cinzel", globalIndex++, 4, false));
addFont(createFont("Prata", "serif", "Cyreal", "Elegant", "prata", globalIndex++, 1, false));

// 84. Universal System (Global Support)
addFont(createFont("Noto Sans", "sans-serif", "Google", "Universal", "noto", globalIndex++, 9, true));
addFont(createFont("Noto Serif", "serif", "Google", "Universal", "noto", globalIndex++, 9, true));

// 85. Heavy Slab (Impact)
addFont(createFont("Alfa Slab One", "display", "JM Solé", "Poster", "alfa", globalIndex++, 1, false));
addFont(createFont("Rokkitt", "serif", "Vernon Adams", "Slab", "rokkitt", globalIndex++, 9, true));

// 86. Informal Fixed (Commentary)
addFont(createFont("Comic Neue", "handwriting", "Craig Rozynski", "Casual", "comic", globalIndex++, 2, true));
addFont(createFont("Bangers", "display", "Vernon Adams", "Comic", "bangers", globalIndex++, 1, false));

// 87. Web Classics (The Standards)
addFont(createFont("Open Sans", "sans-serif", "Steve Matteson", "Humanist", "opensans", globalIndex++, 9, true));
addFont(createFont("Lato", "sans-serif", "Łukasz Dziedzic", "Humanist", "lato", globalIndex++, 9, true));
addFont(createFont("PT Sans", "sans-serif", "ParaType", "Humanist", "ptsans", globalIndex++, 4, true));

// 88. Code Classics (Dev Origins)
addFont(createFont("Inconsolata", "monospaced", "Raph Levien", "Terminal", "inconsolata", globalIndex++, 9, false));
addFont(createFont("Anonymous Pro", "monospaced", "Mark Simonson", "Terminal", "anonymous", globalIndex++, 4, false));

// 89. Bold Condensed (Headlines)
addFont(createFont("Oswald", "sans-serif", "Vernon Adams", "Condensed", "oswald", globalIndex++, 7, true));
addFont(createFont("Anton", "sans-serif", "Vernon Adams", "Impact", "anton", globalIndex++, 1, false));
addFont(createFont("League Gothic", "sans-serif", "The League of Moveable Type", "Condensed", "league", globalIndex++, 1, false));

// 90. Future Tech (Geometric)
addFont(createFont("Exo 2", "sans-serif", "Natanael Gama", "Futuristic", "exo", globalIndex++, 9, true));
addFont(createFont("Saira", "sans-serif", "Hector Gatti", "Variable", "saira", globalIndex++, 9, true));

// 91. Elegant Reading (Longform)
addFont(createFont("Lora", "serif", "Cyreal", "Calligraphic", "lora", globalIndex++, 4, true));
addFont(createFont("Crimson Text", "serif", "Sebastian Kosch", "Old Style", "crimson", globalIndex++, 3, false));

// 92. IBM Plex (Man & Machine)
addFont(createFont("IBM Plex Sans", "sans-serif", "Mike Abbink", "Corporate", "ibm", globalIndex++, 9, true));
addFont(createFont("IBM Plex Mono", "monospaced", "Mike Abbink", "Corporate", "ibm", globalIndex++, 7, true));
addFont(createFont("IBM Plex Serif", "serif", "Mike Abbink", "Corporate", "ibm", globalIndex++, 7, true));

// 93. Digital Native (Modern Swiss)
addFont(createFont("DM Sans", "sans-serif", "Colophon Foundry", "Swiss", "dm", globalIndex++, 9, true));
addFont(createFont("DM Mono", "monospaced", "Colophon Foundry", "Swiss", "dm", globalIndex++, 3, false));
addFont(createFont("Work Sans", "sans-serif", "Wei Huang", "Grotesque", "work", globalIndex++, 9, true));
addFont(createFont("Karla", "sans-serif", "Jonny Pinhorn", "Grotesque", "karla", globalIndex++, 4, true));

// 94. Archival / Documentary
addFont(createFont("Archivo", "sans-serif", "Omnibus-Type", "Grotesque", "archivo", globalIndex++, 9, true));
addFont(createFont("Archivo Black", "sans-serif", "Omnibus-Type", "Heavy", "archivo", globalIndex++, 1, false));
addFont(createFont("Libre Franklin", "sans-serif", "Impallari Type", "Classic", "franklin", globalIndex++, 9, true));

// 95. Tall Headlines (Posters)
addFont(createFont("Bebas Neue", "display", "Ryoichi Tsunekawa", "Condensed", "bebas", globalIndex++, 1, false));
addFont(createFont("Six Caps", "sans-serif", "Vernon Adams", "Condensed", "sixcaps", globalIndex++, 1, false));
addFont(createFont("Teko", "sans-serif", "Indian Type Foundry", "Square", "teko", globalIndex++, 5, false));

// 96. The Android (Material Design)
addFont(createFont("Roboto", "sans-serif", "Christian Robertson", "System", "roboto", globalIndex++, 9, true));
addFont(createFont("Roboto Mono", "monospaced", "Christian Robertson", "System", "roboto", globalIndex++, 9, true));
addFont(createFont("Roboto Serif", "serif", "Greg Gazdowicz", "System", "roboto", globalIndex++, 9, true));

// 97. Soft App Interface (Rounded)
addFont(createFont("Nunito", "sans-serif", "Vernon Adams", "Rounded", "nunito", globalIndex++, 9, true));
addFont(createFont("Quicksand", "sans-serif", "Andrew Paglinawan", "Rounded", "quicksand", globalIndex++, 5, true));
addFont(createFont("Comfortaa", "display", "Johan Aakerlund", "Rounded", "comfortaa", globalIndex++, 5, true));

// 98. Cyberpunk / Gaming UI
addFont(createFont("Oxanium", "display", "Severin Meyer", "Futuristic", "oxanium", globalIndex++, 7, true));
addFont(createFont("Tektur", "display", "Adam Jagielski", "Cyberpunk", "tektur", globalIndex++, 6, true));

// 99. Classic Revival (Trust)
addFont(createFont("EB Garamond", "serif", "Georg Duffner", "Classic", "garamond", globalIndex++, 6, false));
addFont(createFont("Libre Baskerville", "serif", "Impallari Type", "Classic", "baskerville", globalIndex++, 3, false));

// 100. Heavy Didone (Fashion)
addFont(createFont("Abril Fatface", "display", "Veronika Burian", "Didone", "abril", globalIndex++, 1, false));
addFont(createFont("Yeseva One", "display", "Jovanny Lemonad", "Serif", "yeseva", globalIndex++, 1, false));

// 101. Digital Clock / Tech
addFont(createFont("Share Tech Mono", "monospaced", "Carrois Apostrophe", "Digital", "share", globalIndex++, 1, false));
addFont(createFont("Wallpoet", "display", "Lars Berggren", "Stencil", "wallpoet", globalIndex++, 1, false));

// 102. Neo-Brutalism (Art House)
addFont(createFont("Syne", "sans-serif", "Bonjour Monde", "Experimental", "syne", globalIndex++, 5, true));
addFont(createFont("Epilogue", "sans-serif", "Etcetera Type", "Variable", "epilogue", globalIndex++, 9, true));

// 103. Military / Cargo (Industrial)
addFont(createFont("Black Ops One", "display", "James Grieshaber", "Stencil", "blackops", globalIndex++, 1, false));
addFont(createFont("Saira Stencil One", "display", "Omnibus-Type", "Stencil", "saira", globalIndex++, 1, false));

// 104. The Humanist Web (Reliable)
addFont(createFont("Open Sans", "sans-serif", "Steve Matteson", "Humanist", "opensans", globalIndex++, 9, true));
addFont(createFont("Lato", "sans-serif", "Łukasz Dziedzic", "Humanist", "lato", globalIndex++, 9, true));

// 105. Handwritten Notes (Wireframes)
addFont(createFont("Caveat", "handwriting", "Impallari Type", "Handwritten", "caveat", globalIndex++, 4, true));
addFont(createFont("Patrick Hand", "handwriting", "Patrick Wagstrom", "Marker", "patrick", globalIndex++, 1, false));

// 106. High Contrast Editorial
addFont(createFont("Playfair Display", "serif", "Claus Eggers Sørensen", "Didone", "playfair", globalIndex++, 9, true));
addFont(createFont("Prata", "serif", "Cyreal", "Elegant", "prata", globalIndex++, 1, false));

// 107. The Coding Heroes (Dev Tools)
addFont(createFont("Fira Code", "monospaced", "Nikita Prokopov", "Ligatures", "firacode", globalIndex++, 5, true));
addFont(createFont("JetBrains Mono", "monospaced", "JetBrains", "Developer", "jetbrains", globalIndex++, 8, true));
addFont(createFont("Source Code Pro", "monospaced", "Paul D. Hunt", "Developer", "sourcecode", globalIndex++, 9, true));

// 108. Retro Terminal / Pixel (8-bit)
addFont(createFont("VT323", "monospaced", "Peter Hull", "Terminal", "vt323", globalIndex++, 1, false));
addFont(createFont("Press Start 2P", "display", "CodeMan38", "Pixel", "pressstart", globalIndex++, 1, false));
addFont(createFont("Silkscreen", "display", "Jason Kottke", "Pixel", "silkscreen", globalIndex++, 2, false));

// 109. Modern Geometric (Startup)
addFont(createFont("Manrope", "sans-serif", "Mikhail Sharanda", "Geometric", "manrope", globalIndex++, 7, true));
addFont(createFont("Outfit", "sans-serif", "Rodrigo Fuenzalida", "Brand", "outfit", globalIndex++, 9, true));

// 110. Industrial Slab (Machinery)
addFont(createFont("Zilla Slab", "serif", "Typotheque", "Industrial", "zilla", globalIndex++, 6, true));
addFont(createFont("Rokkitt", "serif", "Vernon Adams", "Display Slab", "rokkitt", globalIndex++, 9, true));

// 111. Organic Scripts (Signatures)
addFont(createFont("Dancing Script", "handwriting", "Impallari Type", "Casual", "dancing", globalIndex++, 4, true));
addFont(createFont("Satisfy", "handwriting", "Sideshow", "Brush", "satisfy", globalIndex++, 1, false));

// 112. Global System (Universal)
addFont(createFont("Noto Sans", "sans-serif", "Google", "Universal", "notosans", globalIndex++, 9, true));
addFont(createFont("Noto Serif", "serif", "Google", "Universal", "notoserif", globalIndex++, 9, true));

// 113. Sci-Fi Industrial (Square)
addFont(createFont("Chakra Petch", "sans-serif", "Cadson Demak", "Futuristic", "chakra", globalIndex++, 6, true));
addFont(createFont("Audiowide", "display", "Astigmatic", "Tech", "audiowide", globalIndex++, 1, false));
addFont(createFont("Orbitron", "sans-serif", "Matt McInerney", "Sci-Fi", "orbitron", globalIndex++, 4, true));

// 114. Hybrid Monospaced (Eclectic)
addFont(createFont("Space Mono", "monospaced", "Colophon Foundry", "Hybrid", "spacemono", globalIndex++, 4, true));
addFont(createFont("Cousine", "monospaced", "Steve Matteson", "Courier", "cousine", globalIndex++, 4, true));

// 115. Editorial Power (Screens)
addFont(createFont("Merriweather", "serif", "Sorkin Type", "Readable", "merriweather", globalIndex++, 8, true));
addFont(createFont("Domine", "serif", "Impallari Type", "News", "domine", globalIndex++, 4, true));

// 116. Display Funk (Loud)
addFont(createFont("Righteous", "display", "Astigmatic", "Art Deco", "righteous", globalIndex++, 1, false));
addFont(createFont("Fredoka", "sans-serif", "Milena Brandao", "Rounded", "fredoka", globalIndex++, 5, true));

// 117. Space Age Grotesques
addFont(createFont("Space Grotesk", "sans-serif", "Florian Karsten", "Futuristic", "spacegrotesk", globalIndex++, 5, true));
addFont(createFont("Unbounded", "sans-serif", "Polkadot", "Variable", "unbounded", globalIndex++, 7, true));

// 118. Condensed Power (Dashboard)
addFont(createFont("Barlow Condensed", "sans-serif", "Jeremy Tribby", "Condensed", "barlow", globalIndex++, 9, true));
addFont(createFont("Anton", "sans-serif", "Vernon Adams", "Impact", "anton", globalIndex++, 1, false));
addFont(createFont("Fjalla One", "sans-serif", "Sorkin Type", "Condensed", "fjalla", globalIndex++, 1, false));

// 119. Cinematic / Epic
addFont(createFont("Cinzel", "serif", "Natanael Gama", "Roman", "cinzel", globalIndex++, 6, false));
addFont(createFont("Marcellus", "serif", "Astigmatic", "Classic", "marcellus", globalIndex++, 1, false));

// 120. Elegant Display Serifs
addFont(createFont("Cormorant Garamond", "serif", "Christian Thalmann", "Elegant", "cormorant", globalIndex++, 5, true));
addFont(createFont("Spectral", "serif", "Production Type", "Screen", "spectral", globalIndex++, 7, true));

// 121. Loud Markers
addFont(createFont("Permanent Marker", "handwriting", "Font Diner", "Marker", "permanent", globalIndex++, 1, false));
addFont(createFont("Rock Salt", "handwriting", "Sideshow", "Grunge", "rocksalt", globalIndex++, 1, false));

// =============================================
// 122. NEW ADDITIONS — 2025/2026 Open Source
// =============================================

// --- Modern Geometric Sans (Trending 2024-2026) ---
addFont(createFont("Figtree", "sans-serif", "Erikson Zaharris", "Trending", "figtree", globalIndex++, 9, true));
addFont(createFont("Gabarito", "sans-serif", "Naipe Foundry", "Trending", "gabarito", globalIndex++, 5, false));
addFont(createFont("Onest", "sans-serif", "Onest", "Trending", "onest", globalIndex++, 9, true));
addFont(createFont("Geologica", "sans-serif", "Monsalve", "Trending", "geologica", globalIndex++, 9, true));
addFont(createFont("Hanken Grotesk", "sans-serif", "Alfredo Marco Pradil", "Geometric", "hanken", globalIndex++, 9, true));
addFont(createFont("Inclusive Sans", "sans-serif", "Olivia King", "Accessibility", "inclusive", globalIndex++, 2, false));
addFont(createFont("Afacad", "sans-serif", "Noto Project", "Variable", "afacad", globalIndex++, 4, true));
addFont(createFont("Rethink Sans", "sans-serif", "Hans de Ruiter", "Trending", "rethink", globalIndex++, 8, true));

// --- Design System Fonts ---
addFont(createFont("Wix Madefor Display", "sans-serif", "Wix", "Design System", "wix", globalIndex++, 8, true));
addFont(createFont("Wix Madefor Text", "sans-serif", "Wix", "Design System", "wix", globalIndex++, 8, true));

// --- Elegant Serif (Trending) ---
addFont(createFont("Instrument Serif", "serif", "Rodrigo Fuenzalida", "Editorial", "instrument", globalIndex++, 2, false));
addFont(createFont("Young Serif", "serif", "Bastien Music", "Trending", "youngserif", globalIndex++, 1, false));
addFont(createFont("Crimson Pro", "serif", "Jacques Le Bailly", "Classic", "crimsonpro", globalIndex++, 9, true));
addFont(createFont("Aleo", "serif", "Alessio Laiso", "Slab", "aleo", globalIndex++, 9, true));
addFont(createFont("Hedvig Letters Serif", "serif", "Shifa Saltagi Safadi", "Swedish", "hedvig", globalIndex++, 1, false));
addFont(createFont("Wittgenstein", "serif", "Bryce Wilner", "Intellectual", "wittgenstein", globalIndex++, 4, true));

// --- Geometric Elegant ---
addFont(createFont("Josefin Sans", "sans-serif", "Santiago Orozco", "Geometric", "josefin", globalIndex++, 7, false));
addFont(createFont("Josefin Slab", "serif", "Santiago Orozco", "Geometric Slab", "josefin", globalIndex++, 7, false));

// --- Technical Monospace (New Breed) ---
addFont(createFont("Spline Sans", "sans-serif", "Eben Sorkin", "Technical", "spline", globalIndex++, 5, true));
addFont(createFont("Spline Sans Mono", "monospaced", "Eben Sorkin", "Technical", "spline", globalIndex++, 5, true));
addFont(createFont("Noto Sans Mono", "monospaced", "Google", "Universal", "notomono", globalIndex++, 9, true));
addFont(createFont("Sono", "monospaced", "Tyler Finck", "Transitional", "sono", globalIndex++, 7, true));
addFont(createFont("M PLUS 1 Code", "monospaced", "M+ Fonts Project", "Japanese", "mplus1code", globalIndex++, 7, true));

// --- Neo-Grotesque (European) ---
addFont(createFont("Sofia Sans", "sans-serif", "Lettersoup", "Neo-Grotesque", "sofia", globalIndex++, 9, true));
addFont(createFont("Sofia Sans Condensed", "sans-serif", "Lettersoup", "Condensed", "sofia", globalIndex++, 9, true));
addFont(createFont("Familjen Grotesk", "sans-serif", "David Berlow", "Swedish", "familjen", globalIndex++, 5, true));
addFont(createFont("Radio Canada", "sans-serif", "CBC/SRC", "Broadcast", "radio", globalIndex++, 9, true));

// --- Variable Width Experiments ---
addFont(createFont("Anybody", "sans-serif", "Etcetera Type", "Experimental", "anybody", globalIndex++, 9, true));

// --- Display & Expressive ---
addFont(createFont("Genos", "sans-serif", "Yvonne Schüttler", "Techno", "genos", globalIndex++, 9, true));
addFont(createFont("Climate Crisis", "display", "Daniel Coull", "Awareness", "climate", globalIndex++, 1, true));
addFont(createFont("Protest Riot", "display", "Stefie Justprince", "Protest", "protest", globalIndex++, 1, false));
addFont(createFont("Protest Strike", "display", "Stefie Justprince", "Protest", "protest", globalIndex++, 1, false));
addFont(createFont("Protest Guerrilla", "display", "Stefie Justprince", "Protest", "protest", globalIndex++, 1, false));
addFont(createFont("Protest Revolution", "display", "Stefie Justprince", "Protest", "protest", globalIndex++, 1, false));

// --- International / Multi-script ---
addFont(createFont("Bai Jamjuree", "sans-serif", "Cadson Demak", "Thai", "bai", globalIndex++, 7, false));
addFont(createFont("Readex Pro", "sans-serif", "Thomas Jockin", "Arabic", "readex", globalIndex++, 7, true));
addFont(createFont("M PLUS 1", "sans-serif", "M+ Fonts Project", "Japanese", "mplus1", globalIndex++, 9, true));
addFont(createFont("Zen Maru Gothic", "sans-serif", "Yoshimichi Ohira", "Japanese", "zenmaru", globalIndex++, 5, false));

// --- Wayfinding & Signage ---
addFont(createFont("Signika Negative", "sans-serif", "Anna Giedryś", "Wayfinding", "signika", globalIndex++, 7, true));

// =============================================
// 123. MISSING GOOGLE FONTS AUDIT — Batch 3
// =============================================

// --- TIER 1: Top Popular Missing ---
addFont(createFont("Roboto Condensed", "sans-serif", "Christian Robertson", "Google Fonts", "roboto", globalIndex++, 9, true));
addFont(createFont("Roboto Slab", "serif", "Christian Robertson", "Google Fonts", "roboto", globalIndex++, 9, true));
addFont(createFont("Roboto Flex", "sans-serif", "Font Bureau", "Google Fonts", "roboto", globalIndex++, 9, true));
addFont(createFont("Nunito Sans", "sans-serif", "Vernon Adams", "Google Fonts", "nunito", globalIndex++, 9, true));
addFont(createFont("Mulish", "sans-serif", "Vernon Adams", "Google Fonts", "mulish", globalIndex++, 9, true));
addFont(createFont("Kanit", "sans-serif", "Cadson Demak", "Google Fonts", "kanit", globalIndex++, 9, false));
addFont(createFont("Prompt", "sans-serif", "Cadson Demak", "Google Fonts", "prompt", globalIndex++, 9, false));
addFont(createFont("Cairo", "sans-serif", "Mohamed Gaber", "Google Fonts", "cairo", globalIndex++, 9, true));
addFont(createFont("Tajawal", "sans-serif", "Boutros", "Google Fonts", "tajawal", globalIndex++, 6, false));
addFont(createFont("Abel", "sans-serif", "Matthew Desmond", "Google Fonts", "abel", globalIndex++, 1, false));
addFont(createFont("Exo", "sans-serif", "Natanael Gama", "Google Fonts", "exo", globalIndex++, 9, true));
addFont(createFont("Encode Sans", "sans-serif", "Impallari Type", "Google Fonts", "encode", globalIndex++, 9, true));
addFont(createFont("Assistant", "sans-serif", "Ben Nathan", "Google Fonts", "assistant", globalIndex++, 7, true));
addFont(createFont("Nanum Gothic", "sans-serif", "Sandoll", "Google Fonts", "nanum", globalIndex++, 4, false));
addFont(createFont("Nanum Myeongjo", "serif", "Sandoll", "Google Fonts", "nanum", globalIndex++, 3, false));
addFont(createFont("Sarabun", "sans-serif", "Suppakit Chalermlarp", "Google Fonts", "sarabun", globalIndex++, 8, false));
addFont(createFont("Sen", "sans-serif", "Kosal Sen", "Google Fonts", "sen", globalIndex++, 4, true));

// --- TIER 2: From CYRILLIC_SUPPORTED — never added to catalog ---
addFont(createFont("Open Sans Condensed", "sans-serif", "Steve Matteson", "Google Fonts", "opensans", globalIndex++, 3, false));
addFont(createFont("Montserrat Alternates", "sans-serif", "Julieta Ulanovsky", "Google Fonts", "montserrat", globalIndex++, 9, false));
addFont(createFont("Playfair Display SC", "serif", "Claus Eggers Sørensen", "Google Fonts", "playfair", globalIndex++, 6, false));
addFont(createFont("Fira Sans Condensed", "sans-serif", "Carrois Apostrophe", "Google Fonts", "fira", globalIndex++, 9, false));
addFont(createFont("Fira Sans Extra Condensed", "sans-serif", "Carrois Apostrophe", "Google Fonts", "fira", globalIndex++, 9, false));
addFont(createFont("Cormorant", "serif", "Christian Thalmann", "Google Fonts", "cormorant", globalIndex++, 5, true));
addFont(createFont("Cormorant Infant", "serif", "Christian Thalmann", "Google Fonts", "cormorant", globalIndex++, 5, false));
addFont(createFont("Cormorant SC", "serif", "Christian Thalmann", "Google Fonts", "cormorant", globalIndex++, 5, false));
addFont(createFont("Cormorant Unicase", "serif", "Christian Thalmann", "Google Fonts", "cormorant", globalIndex++, 5, false));
addFont(createFont("Yanone Kaffeesatz", "sans-serif", "Yanone", "Google Fonts", "yanone", globalIndex++, 5, true));
addFont(createFont("Philosopher", "sans-serif", "Jovanny Lemonad", "Google Fonts", "philosopher", globalIndex++, 4, false));
addFont(createFont("Tenor Sans", "sans-serif", "Denis Masharov", "Google Fonts", "tenor", globalIndex++, 1, false));
addFont(createFont("Didact Gothic", "sans-serif", "Daniel Johnson", "Google Fonts", "didact", globalIndex++, 1, false));
addFont(createFont("Istok Web", "sans-serif", "Andrey V. Panov", "Google Fonts", "istok", globalIndex++, 4, false));
addFont(createFont("Scada", "sans-serif", "Jovanny Lemonad", "Google Fonts", "scada", globalIndex++, 4, false));
addFont(createFont("Old Standard TT", "serif", "Alexei Kryukov", "Google Fonts", "oldstandard", globalIndex++, 3, false));
addFont(createFont("Forum", "display", "Denis Masharov", "Google Fonts", "forum", globalIndex++, 1, false));
addFont(createFont("Arsenal", "sans-serif", "Andriy Shevchenko", "Google Fonts", "arsenal", globalIndex++, 4, false));
addFont(createFont("Amatic SC", "handwriting", "Vernon Adams", "Google Fonts", "amatic", globalIndex++, 2, false));
addFont(createFont("Pangolin", "handwriting", "Kevin Burke", "Google Fonts", "pangolin", globalIndex++, 1, false));
addFont(createFont("Podkova", "serif", "Ilya Yudin", "Google Fonts", "podkova", globalIndex++, 5, true));
addFont(createFont("Bona Nova", "serif", "Mateusz Machalski", "Google Fonts", "bonanova", globalIndex++, 3, false));
addFont(createFont("Andika", "sans-serif", "SIL International", "Google Fonts", "andika", globalIndex++, 4, false));
addFont(createFont("Kelly Slab", "display", "Denis Masharov", "Google Fonts", "kelly", globalIndex++, 1, false));
addFont(createFont("Oranienbaum", "serif", "Oleg Postnov", "Google Fonts", "oranienbaum", globalIndex++, 1, false));
addFont(createFont("Underdog", "display", "Sergey Steblina", "Google Fonts", "underdog", globalIndex++, 1, false));
addFont(createFont("Marmelad", "sans-serif", "Manvel Shmavonyan", "Google Fonts", "marmelad", globalIndex++, 1, false));
addFont(createFont("Ruslan Display", "display", "Denis Masharov", "Google Fonts", "ruslan", globalIndex++, 1, false));
addFont(createFont("Pattaya", "display", "Cadson Demak", "Google Fonts", "pattaya", globalIndex++, 1, false));
addFont(createFont("Rubik Mono One", "display", "Hubert & Fischer", "Google Fonts", "rubik", globalIndex++, 1, false));
addFont(createFont("Seymour One", "display", "Vernon Adams", "Google Fonts", "seymour", globalIndex++, 1, false));
addFont(createFont("Vollkorn SC", "serif", "Friedrich Althausen", "Google Fonts", "vollkorn", globalIndex++, 4, false));
addFont(createFont("Ledger", "serif", "Denis Masharov", "Google Fonts", "ledger", globalIndex++, 1, false));
addFont(createFont("Bellota", "sans-serif", "Kemie Guaida", "Google Fonts", "bellota", globalIndex++, 3, false));
addFont(createFont("Bellota Text", "sans-serif", "Kemie Guaida", "Google Fonts", "bellota", globalIndex++, 3, false));
addFont(createFont("El Messiri", "display", "Mohamed Gaber", "Google Fonts", "elmessiri", globalIndex++, 4, true));
addFont(createFont("Gabriela", "serif", "Eduardo Tunni", "Google Fonts", "gabriela", globalIndex++, 1, false));
addFont(createFont("Prosto One", "display", "Sergey Steblina", "Google Fonts", "prosto", globalIndex++, 1, false));
addFont(createFont("Noto Sans Display", "sans-serif", "Google", "Google Fonts", "noto", globalIndex++, 9, true));
addFont(createFont("Noto Serif Display", "serif", "Google", "Google Fonts", "noto", globalIndex++, 9, true));
addFont(createFont("Lemonada", "display", "Mohamed Gaber", "Google Fonts", "lemonada", globalIndex++, 5, true));
addFont(createFont("Murecho", "sans-serif", "Mirko Velimirović", "Google Fonts", "murecho", globalIndex++, 9, true));
addFont(createFont("Comforter", "handwriting", "Robert Leuschke", "Google Fonts", "comforter", globalIndex++, 1, false));
addFont(createFont("Comforter Brush", "handwriting", "Robert Leuschke", "Google Fonts", "comforter", globalIndex++, 1, false));

// --- Rubik Family (from CYRILLIC_SUPPORTED) ---
addFont(createFont("Rubik Bubbles", "display", "NaN", "Google Fonts", "rubik", globalIndex++, 1, false));
addFont(createFont("Rubik Beastly", "display", "NaN", "Google Fonts", "rubik", globalIndex++, 1, false));
addFont(createFont("Rubik Microbe", "display", "NaN", "Google Fonts", "rubik", globalIndex++, 1, false));
addFont(createFont("Rubik Moonrocks", "display", "NaN", "Google Fonts", "rubik", globalIndex++, 1, false));
addFont(createFont("Rubik Puddles", "display", "NaN", "Google Fonts", "rubik", globalIndex++, 1, false));

// --- TIER 3: Other Notable Google Fonts ---
addFont(createFont("Pathway Extreme", "sans-serif", "Eduardo Tunni", "Google Fonts", "pathway", globalIndex++, 9, true));
addFont(createFont("Libre Bodoni", "serif", "Impallari Type", "Google Fonts", "bodoni", globalIndex++, 4, true));
addFont(createFont("Crete Round", "serif", "TypeTogether", "Google Fonts", "crete", globalIndex++, 2, false));
addFont(createFont("Acme", "display", "Huerta Tipográfica", "Google Fonts", "acme", globalIndex++, 1, false));
addFont(createFont("Patua One", "display", "LatinoType", "Google Fonts", "patua", globalIndex++, 1, false));
addFont(createFont("Courgette", "handwriting", "Karolina Lach", "Google Fonts", "courgette", globalIndex++, 1, false));
addFont(createFont("Secular One", "sans-serif", "Michal Sahar", "Google Fonts", "secular", globalIndex++, 1, false));
addFont(createFont("Fugaz One", "display", "LatinoType", "Google Fonts", "fugaz", globalIndex++, 1, false));
addFont(createFont("Titan One", "display", "Rodrigo Fuenzalida", "Google Fonts", "titan", globalIndex++, 1, false));
addFont(createFont("Pridi", "serif", "Cadson Demak", "Google Fonts", "pridi", globalIndex++, 7, false));
addFont(createFont("Black Han Sans", "sans-serif", "Zess Type", "Google Fonts", "blackhan", globalIndex++, 1, false));
addFont(createFont("Cardo", "serif", "David J. Perry", "Google Fonts", "cardo", globalIndex++, 3, false));
addFont(createFont("Gelasio", "serif", "Eben Sorkin", "Google Fonts", "gelasio", globalIndex++, 4, false));
addFont(createFont("Libre Caslon Text", "serif", "Impallari Type", "Google Fonts", "caslon", globalIndex++, 3, false));
addFont(createFont("Libre Caslon Display", "serif", "Impallari Type", "Google Fonts", "caslon", globalIndex++, 1, false));
addFont(createFont("Cinzel Decorative", "display", "Natanael Gama", "Google Fonts", "cinzel", globalIndex++, 3, false));
addFont(createFont("Roboto Flex", "sans-serif", "Font Bureau", "Google Fonts", "roboto", globalIndex++, 9, true));
addFont(createFont("Brygada 1918", "serif", "Mateusz Machalski", "Google Fonts", "brygada", globalIndex++, 4, true));
addFont(createFont("Sigmar", "display", "Henrique Beier", "Google Fonts", "sigmar", globalIndex++, 1, false));
addFont(createFont("Bungee", "display", "David Jonathan Ross", "Google Fonts", "bungee", globalIndex++, 1, false));

// --- CJK & Multi-script ---
addFont(createFont("Noto Sans SC", "sans-serif", "Google", "Google Fonts", "noto", globalIndex++, 9, true));
addFont(createFont("Noto Serif SC", "serif", "Google", "Google Fonts", "noto", globalIndex++, 9, true));
addFont(createFont("Noto Sans HK", "sans-serif", "Google", "Google Fonts", "noto", globalIndex++, 9, true));
addFont(createFont("Zen Kaku Gothic New", "sans-serif", "Yoshimichi Ohira", "Google Fonts", "zen", globalIndex++, 5, false));
addFont(createFont("Zen Old Mincho", "serif", "Yoshimichi Ohira", "Google Fonts", "zen", globalIndex++, 5, false));
addFont(createFont("Shippori Mincho", "serif", "FONTDASU", "Google Fonts", "shippori", globalIndex++, 5, false));
addFont(createFont("BIZ UDPGothic", "sans-serif", "TypeBank", "Google Fonts", "biz", globalIndex++, 2, false));

// --- Newer Google Fonts (2024-2026) ---
addFont(createFont("Tilt Neon", "display", "Andy Clymer", "Google Fonts", "tilt", globalIndex++, 1, true));
addFont(createFont("Tilt Prism", "display", "Andy Clymer", "Google Fonts", "tilt", globalIndex++, 1, true));
addFont(createFont("Tilt Warp", "display", "Andy Clymer", "Google Fonts", "tilt", globalIndex++, 1, true));
addFont(createFont("Playpen Sans", "handwriting", "TypeTogether", "Google Fonts", "playpen", globalIndex++, 8, true));

// =============================================
// 124. COMPLETE GOOGLE FONTS AUDIT — Batch 4
// All remaining Latin/Cyrillic Google Fonts
// =============================================

// --- Compact bulk data: "Name|category|weights|variable" ---

const gfSansMissing = [
    "Advent Pro|sans-serif|9|1", "Agdasima|sans-serif|2|0", "Alatsi|sans-serif|1|0",
    "Aldrich|sans-serif|1|0", "Allerta|sans-serif|1|0", "Allerta Stencil|sans-serif|1|0",
    "Amiko|sans-serif|3|0", "Average Sans|sans-serif|1|0", "Basic|sans-serif|1|0",
    "Cabin Condensed|sans-serif|4|0", "Cantora One|sans-serif|1|0", "Capriola|sans-serif|1|0",
    "Carme|sans-serif|1|0", "Carter One|sans-serif|1|0", "Changa|sans-serif|7|1",
    "Commissioner|sans-serif|9|1", "Days One|sans-serif|1|0", "Dongle|sans-serif|3|0",
    "Duru Sans|sans-serif|1|0", "Encode Sans Condensed|sans-serif|9|1",
    "Encode Sans Expanded|sans-serif|9|1", "Encode Sans Semi Condensed|sans-serif|9|1",
    "Encode Sans Semi Expanded|sans-serif|9|1", "Farro|sans-serif|3|0",
    "Finlandica|sans-serif|4|1", "Francois One|sans-serif|1|0",
    "GFS Neohellenic|sans-serif|4|0", "Gemunu Libre|sans-serif|7|1",
    "Glory|sans-serif|8|1", "Heebo|sans-serif|9|1",
    "IBM Plex Sans Condensed|sans-serif|7|0", "Inder|sans-serif|1|0",
    "Inria Sans|sans-serif|3|0", "Inter Tight|sans-serif|9|1",
    "Jaldi|sans-serif|2|0", "Jockey One|sans-serif|1|0",
    "Julius Sans One|sans-serif|1|0", "K2D|sans-serif|9|0",
    "Khula|sans-serif|5|0", "Kite One|sans-serif|1|0",
    "M PLUS 2|sans-serif|9|1", "Mada|sans-serif|9|1",
    "Manuale|sans-serif|8|1", "Marvel|sans-serif|4|0",
    "Mitr|sans-serif|5|0", "Montserrat Subrayada|sans-serif|2|0",
    "Niramit|sans-serif|7|0", "Notable|sans-serif|1|0",
    "Numans|sans-serif|1|0", "Overlock|sans-serif|3|0",
    "Overlock SC|sans-serif|1|0", "Pathway Gothic One|sans-serif|1|0",
    "Port Lligat Sans|sans-serif|1|0", "Puritan|sans-serif|4|0",
    "Rambla|sans-serif|4|0", "Rationale|sans-serif|1|0",
    "Ropa Sans|sans-serif|2|0", "Ruda|sans-serif|4|1",
    "Rum Raisin|sans-serif|1|0", "Share|sans-serif|4|0",
    "Shanti|sans-serif|1|0", "Smooch Sans|sans-serif|9|1",
    "Stint Ultra Condensed|sans-serif|1|0", "Stint Ultra Expanded|sans-serif|1|0",
    "Strait|sans-serif|1|0", "Tomorrow|sans-serif|9|0",
    "Tourney|sans-serif|9|1", "Trispace|sans-serif|7|1",
    "Truculenta|sans-serif|9|1", "Ubuntu Sans|sans-serif|9|1",
    "Varela|sans-serif|1|0", "Viga|sans-serif|1|0",
    "Wendy One|sans-serif|1|0", "Wire One|sans-serif|1|0",
    "Yrsa|sans-serif|5|1", "Ysabeau|sans-serif|9|1",
    "Ysabeau Infant|sans-serif|9|1", "Ysabeau Office|sans-serif|9|1",
    "Ysabeau SC|sans-serif|9|1", "Orienta|sans-serif|1|0",
    "Doppio One|sans-serif|1|0", "Englebert|sans-serif|1|0",
    "Bubbler One|sans-serif|1|0", "Carrois Gothic|sans-serif|1|0",
    "Carrois Gothic SC|sans-serif|1|0", "Convergence|sans-serif|1|0",
    "Denk One|sans-serif|1|0", "Federo|sans-serif|1|0",
    "Gafata|sans-serif|1|0", "Geo|sans-serif|2|0",
    "Imprima|sans-serif|1|0", "Mouse Memoirs|sans-serif|1|0",
    "Nokora|sans-serif|2|0", "Offside|sans-serif|1|0",
    "Oxygen Mono|monospaced|1|0", "Syne Mono|monospaced|1|0",
    "Xanh Mono|monospaced|2|0", "Electrolize|sans-serif|1|0",
    "Telex|sans-serif|1|0", "Magra|sans-serif|2|0",
    "Cambay|sans-serif|4|0", "Moul|sans-serif|1|0",
    "Battambang|sans-serif|5|0", "Anaheim|sans-serif|1|0",
    "Mallanna|sans-serif|1|0", "Mandali|sans-serif|1|0",
    "Suranna|sans-serif|1|0", "Timmana|sans-serif|1|0",
    "NTR|sans-serif|1|0", "Tenali Ramakrishna|sans-serif|1|0",
    "Dhurjati|sans-serif|1|0", "Gurajada|sans-serif|1|0",
    "Ponnala|sans-serif|1|0", "Ramaraja|sans-serif|1|0",
    "Sree Krushnadevaraya|sans-serif|1|0", "Chathura|sans-serif|5|0",
    "Arya|sans-serif|2|0", "Biryani|sans-serif|7|0",
    "Palanquin|sans-serif|7|0", "Palanquin Dark|sans-serif|4|0",
    "Gotu|sans-serif|1|0", "Anek Latin|sans-serif|8|1"
];

const gfSerifMissing = [
    "Adamina|serif|1|0", "Amethysta|serif|1|0", "Amiri|serif|4|0",
    "Antic Slab|serif|1|0", "Average|serif|1|0",
    "BioRhyme|serif|5|1", "BioRhyme Expanded|serif|5|0",
    "Bree Serif|serif|1|0", "Caladea|serif|4|0",
    "Cambo|serif|1|0", "Cantata One|serif|1|0",
    "Caudex|serif|4|0", "Copse|serif|1|0",
    "Cormorant Upright|serif|5|0", "David Libre|serif|2|0",
    "Della Respira|serif|1|0", "Esteban|serif|1|0",
    "Fenix|serif|1|0", "Gilda Display|serif|1|0",
    "Gupter|serif|3|0", "Habibi|serif|1|0",
    "Headland One|serif|1|0", "Inika|serif|2|0",
    "Inknut Antiqua|serif|5|0", "Inria Serif|serif|3|0",
    "Judson|serif|3|0", "Kadwa|serif|2|0",
    "Kotta One|serif|1|0", "Kreon|serif|4|1",
    "Labrada|serif|9|1", "Lusitana|serif|2|0",
    "Lustria|serif|1|0", "Marcellus SC|serif|1|0",
    "Mate|serif|2|0", "Mate SC|serif|1|0",
    "Neuton|serif|6|0", "Noticia Text|serif|4|0",
    "Poly|serif|2|0", "Port Lligat Slab|serif|1|0",
    "Radley|serif|2|0", "Rosarivo|serif|2|0",
    "Rufina|serif|2|0", "Sanchez|serif|4|0",
    "Scope One|serif|1|0", "Sedan|serif|2|0",
    "Sedan SC|serif|1|0", "Slabo 13px|serif|1|0",
    "Slabo 27px|serif|1|0", "Solway|serif|5|0",
    "Stoke|serif|2|0", "Sumana|serif|2|0",
    "Taviraj|serif|9|0", "Tienne|serif|3|0",
    "Trykker|serif|1|0", "Unna|serif|4|0",
    "Vesper Libre|serif|4|0", "Vidaloka|serif|1|0",
    "Volkhov|serif|4|0", "Fjord One|serif|1|0",
    "Bentham|serif|1|0", "Buenard|serif|2|0",
    "Coustard|serif|2|0", "Donegal One|serif|1|0",
    "Enriqueta|serif|2|0", "Sahitya|serif|2|0",
    "Lemon|serif|1|0", "Ovo|serif|1|0",
    "Almendra|serif|4|0", "Antic|serif|1|0",
    "Antic Didone|serif|1|0", "Arapey|serif|2|0",
    "Artifika|serif|1|0", "Balthazar|serif|1|0",
    "Belgrano|serif|1|0", "Brawler|serif|2|0",
    "Crimson Pro|serif|9|1", "Fanwood Text|serif|2|0",
    "Imprima|serif|1|0", "Jacques Francois|serif|1|0",
    "Kurale|serif|1|0", "Ledger|serif|1|0",
    "Martel|serif|4|0", "Martel Sans|sans-serif|4|0",
    "Petrona|serif|9|1", "Prata|serif|1|0",
    "Quando|serif|1|0", "Sura|serif|2|0",
    "Trocchi|serif|1|0", "Trirong|serif|9|0",
    "Zilla Slab|serif|6|1"
];

const gfDisplayMissing = [
    "Allan|display|2|0", "Almendra Display|display|1|0",
    "Almendra SC|display|1|0", "Anton SC|display|1|0",
    "Arima|display|7|1", "Baumans|display|1|0",
    "Berkshire Swash|display|1|0", "Bevan|display|2|0",
    "Bigelow Rules|display|1|0", "Bigshot One|display|1|0",
    "Boogaloo|display|1|0", "Bowlby One|display|1|0",
    "Bowlby One SC|display|1|0", "Bubblegum Sans|display|1|0",
    "Bungee Hairline|display|1|0", "Bungee Inline|display|1|0",
    "Bungee Outline|display|1|0", "Bungee Shade|display|1|0",
    "Butcherman|display|1|0", "Cabin Sketch|display|2|0",
    "Caesar Dressing|display|1|0", "Ceviche One|display|1|0",
    "Chango|display|1|0", "Chela One|display|1|0",
    "Chelsea Market|display|1|0", "Cherry Cream Soda|display|1|0",
    "Cherry Swash|display|2|0", "Chewy|display|1|0",
    "Chicle|display|1|0", "Chonburi|display|1|0",
    "Combo|display|1|0", "Concert One|display|1|0",
    "Corben|display|2|0", "Creepster|display|1|0",
    "Crushed|display|1|0", "Diplomata|display|1|0",
    "Diplomata SC|display|1|0", "Elsie|display|2|0",
    "Elsie Swash Caps|display|2|0", "Emblema One|display|1|0",
    "Emilys Candy|display|1|0", "Ewert|display|1|0",
    "Expletus Sans|display|4|0", "Faster One|display|1|0",
    "Finger Paint|display|1|0", "Flamenco|display|2|0",
    "Fontdiner Swanky|display|1|0", "Freckle Face|display|1|0",
    "Frijole|display|1|0", "Fruktur|display|1|0",
    "Galada|display|1|0", "Galindo|display|1|0",
    "Germania One|display|1|0", "Gideon Roman|display|1|0",
    "Gorditas|display|2|0", "Graduate|display|1|0",
    "Gravitas One|display|1|0", "Griffy|display|1|0",
    "Gruppo|display|1|0", "Gugi|display|1|0",
    "Hanalei|display|1|0", "Hanalei Fill|display|1|0",
    "Henny Penny|display|1|0", "Hurricane|display|1|0",
    "Irish Grover|display|1|0",
    "Jacques Francois Shadow|display|1|0", "Jolly Lodger|display|1|0",
    "Kablammo|display|1|1", "Keania One|display|1|0",
    "Kenia|display|1|0", "Kranky|display|1|0",
    "Lancelot|display|1|0", "Life Savers|display|3|0",
    "Lilita One|display|1|0", "Lily Script One|display|1|0",
    "Limelight|display|1|0", "Lobster Two|display|4|0",
    "Londrina Outline|display|1|0", "Londrina Shadow|display|1|0",
    "Londrina Solid|display|4|0", "Love Ya Like A Sister|display|1|0",
    "Macondo|display|1|0", "Macondo Swash Caps|display|1|0",
    "Maiden Orange|display|1|0", "Major Mono Display|display|1|0",
    "Margarine|display|1|0", "Marko One|display|1|0",
    "McLaren|display|1|0", "Metal|display|1|0",
    "Metal Mania|display|1|0", "Milonga|display|1|0",
    "Miltonian|display|1|0", "Miltonian Tattoo|display|1|0",
    "Miniver|display|1|0", "Modern Antiqua|display|1|0",
    "Modak|display|1|0", "Mogra|display|1|0",
    "Monofett|display|1|0", "Monoton|display|1|0",
    "Mountains of Christmas|display|2|0", "Mystery Quest|display|1|0",
    "Nova Cut|display|1|0", "Nova Flat|display|1|0",
    "Nova Mono|display|1|0", "Nova Oval|display|1|0",
    "Nova Round|display|1|0", "Nova Script|display|1|0",
    "Nova Slim|display|1|0", "Nova Square|display|1|0",
    "Oleo Script|display|2|0", "Oleo Script Swash Caps|display|2|0",
    "Oregano|display|2|0", "Original Surfer|display|1|0",
    "Paprika|display|1|0", "Passero One|display|1|0",
    "Passion One|display|3|0", "Peralta|display|1|0",
    "Piedra|display|1|0", "Pirata One|display|1|0",
    "Poetsen One|display|1|0", "Poller One|display|1|0",
    "Pompiere|display|1|0", "Rammetto One|display|1|0",
    "Ranga|display|2|0", "Revalia|display|1|0",
    "Ribeye|display|1|0", "Ribeye Marrow|display|1|0",
    "Risque|display|1|0", "Rowdies|display|3|0",
    "Ruge Boogie|display|1|0", "Rye|display|1|0",
    "Sail|display|1|0", "Salsa|display|1|0",
    "Sancreek|display|1|0", "Sansita|display|6|0",
    "Sansita Swashed|display|9|1", "Sarpanch|display|4|0",
    "Sevillana|display|1|0", "Shojumaru|display|1|0",
    "Skranji|display|2|0", "Smythe|display|1|0",
    "Smooch|display|1|0", "Sonsie One|display|1|0",
    "Spicy Rice|display|1|0", "Spirax|display|1|0",
    "Squada One|display|1|0", "Trade Winds|display|1|0",
    "Trochut|display|3|0", "Tulpen One|display|1|0",
    "Turret Road|display|5|0", "Uncial Antiqua|display|1|0",
    "Unifraktur Cook|display|1|0", "Unifraktur Maguntia|display|1|0",
    "Unlock|display|1|0", "Vampiro One|display|1|0",
    "Viaoda Libre|display|1|0", "Voces|display|1|0",
    "Wellfleet|display|1|0", "Yatra One|display|1|0",
    "Bonheur Royale|display|1|0", "Caramel|display|1|0",
    "Carattere|display|1|0", "Codystar|display|2|0",
    "Dokdo|display|1|0", "Fleur De Leah|display|1|0",
    "Flavors|display|1|0", "Grandstander|display|9|1",
    "Grenze Gotisch|display|9|1", "Holtwood One SC|display|1|0",
    "Imbue|display|9|1", "Lakki Reddy|display|1|0",
    "Libre Barcode 39|display|1|0", "Libre Barcode 39 Text|display|1|0",
    "Libre Barcode 128|display|1|0", "Libre Barcode 128 Text|display|1|0",
    "Marhey|display|7|1", "Nabla|display|1|1",
    "Passions Conflict|display|1|0", "Road Rage|display|1|0",
    "Rubik Burned|display|1|0", "Rubik Dirt|display|1|0",
    "Rubik Distressed|display|1|0", "Rubik Gemstones|display|1|0",
    "Rubik Iso|display|1|0", "Rubik Lines|display|1|0",
    "Rubik Maps|display|1|0", "Rubik Marker Hatch|display|1|0",
    "Rubik Maze|display|1|0", "Rubik Pixels|display|1|0",
    "Rubik Scribble|display|1|0", "Rubik Spray Paint|display|1|0",
    "Rubik Storm|display|1|0", "Rubik Vinyl|display|1|0",
    "Rubik 80s Fade|display|1|0", "Rubik Broken Fax|display|1|0",
    "Rubik Doodle Shadow|display|1|0", "Rubik Doodle Triangles|display|1|0",
    "Snowburst One|display|1|0", "Splash|display|1|0",
    "Stick No Bills|display|7|1", "Suwannaphum|display|3|0",
    "Vibes|display|1|0", "Yeon Sung|display|1|0",
    "Agbalumo|display|1|0", "Bagel Fat One|display|1|0",
    "Bungee Spice|display|1|1", "Gasoek One|display|1|0",
    "Gloock|display|1|0", "Moirai One|display|1|1",
    "Noto Serif Display|serif|9|1", "Noto Sans Display|sans-serif|9|1",
    "Palette Mosaic|display|1|0", "Puppies Play|display|1|0",
    "Rubik Glitch Pop|display|1|0", "Single Day|display|1|0",
    "Vina Sans|display|1|0", "Wavefont|display|9|1"
];

const gfHandwritingMissing = [
    "Amita|handwriting|2|0", "Annie Use Your Telescope|handwriting|1|0",
    "Condiment|handwriting|1|0", "Just Another Hand|handwriting|1|0",
    "Mali|handwriting|7|0", "Maitree|handwriting|5|0",
    "Sriracha|handwriting|1|0", "Tillana|handwriting|5|0",
    "Atma|handwriting|5|0", "Beth Ellen|handwriting|1|0",
    "Birthstone|handwriting|1|0", "Birthstone Bounce|handwriting|1|0",
    "Bonbon|handwriting|1|0", "Butterfly Kids|handwriting|1|0",
    "Charm|handwriting|2|0", "Chilanka|handwriting|1|0",
    "Charmonman|handwriting|2|0", "Dekko|handwriting|1|0",
    "Fasthand|handwriting|1|0", "Fuzzy Bubbles|handwriting|2|0",
    "Gaegu|handwriting|3|0", "Gamja Flower|handwriting|1|0",
    "Gowun Batang|handwriting|2|0", "Gowun Dodum|handwriting|1|0",
    "Hi Melody|handwriting|1|0", "Klee One|handwriting|2|0",
    "Kolker Brush|handwriting|1|0", "Licorice|handwriting|1|0",
    "Liu Jian Mao Cao|handwriting|1|0", "Long Cang|handwriting|1|0",
    "Ma Shan Zheng|handwriting|1|0", "Mansalva|handwriting|1|0",
    "Molle|handwriting|1|0", "Mynerve|handwriting|1|0",
    "Nanum Pen Script|handwriting|1|0", "Nanum Brush Script|handwriting|1|0",
    "Oooh Baby|handwriting|1|0", "Petemoss|handwriting|1|0",
    "Sedgwick Ave|handwriting|1|0", "Sedgwick Ave Display|handwriting|1|0",
    "Send Flowers|handwriting|1|0", "Solitreo|handwriting|1|0",
    "Style Script|handwriting|1|0", "The Nautigal|handwriting|2|0",
    "Twinkle Star|handwriting|1|0", "Updock|handwriting|1|0",
    "Waterfall|handwriting|1|0", "Whisper|handwriting|1|0",
    "Zen Loop|handwriting|2|0"
];

// Process all missing font arrays
[gfSansMissing, gfSerifMissing, gfDisplayMissing, gfHandwritingMissing].forEach(arr => {
    arr.forEach(item => {
        const parts = item.split("|");
        addFont(createFont(parts[0], parts[1], "Various", "Google Fonts", "gf4", globalIndex++, parseInt(parts[2]), parts[3] === "1"));
    });
});

// =============================================
// 125. COMPLETE GOOGLE FONTS AUDIT — Batch 5
// Remaining Latin/Cyrillic fonts
// =============================================

["Commissioner","Advent Pro","Inter Tight","Ubuntu Sans","Ubuntu Sans Mono",
 "Geologica","Sofia Sans Extra Condensed","Sofia Sans Semi Condensed",
 "Host Grotesk","Alumni Sans","Comme","Andada Pro","Blinker",
 "Carlito","Charis SIL","Baskervville","Baskervville SC"
].forEach(n => CYRILLIC_SUPPORTED.add(n));

const gfBatch5 = [
"ABeeZee|sans-serif|2|0","Actor|sans-serif|1|0","Alike|serif|1|0",
"Alike Angular|serif|1|0","Allison|handwriting|1|0","Amarante|display|1|0",
"Amaranth|sans-serif|4|0","Andada Pro|serif|9|1","Are You Serious|handwriting|1|0",
"Arbutus|display|1|0","Arbutus Slab|serif|1|0","Asul|sans-serif|2|0",
"Athiti|sans-serif|6|0","Astloch|display|2|0","Atomic Age|display|1|0",
"Autour One|display|1|0","Averia Gruesa Libre|display|1|0",
"Averia Libre|display|4|0","Averia Sans Libre|display|4|0",
"Averia Serif Libre|display|4|0",
"Bakbak One|display|1|0","Baloo 2|display|5|1",
"Baloo Bhai 2|display|5|1","Baloo Chettan 2|display|5|1",
"Baloo Da 2|display|5|1","Baloo Paaji 2|display|5|1",
"Baloo Tamma 2|display|5|1","Baloo Tammudu 2|display|5|1",
"Baloo Thambi 2|display|5|1","Baskervville|serif|1|0",
"Baskervville SC|serif|1|0","Belanosima|sans-serif|3|0",
"BenchNine|sans-serif|3|0","Blinker|sans-serif|6|0",
"Borel|handwriting|1|0","Briem Hand|handwriting|4|1",
"Bruno Ace SC|display|1|0","Buda|display|1|0",
"Cactus Classical Serif|serif|1|0","Cagliostro|sans-serif|1|0",
"Carlito|sans-serif|4|0","Castoro|serif|2|0",
"Castoro Titling|serif|1|0","Caveat Brush|handwriting|1|0",
"Charis SIL|serif|4|0","Chau Philomene One|sans-serif|2|0",
"Cherish|handwriting|1|0","Comme|sans-serif|9|1",
"Content|display|2|0","Corinthia|handwriting|2|0",
"Darumadrop One|display|1|0","Dorsa|sans-serif|1|0",
"DynaPuff|display|4|1",
"Economica|sans-serif|4|0","Encode Sans SC|sans-serif|9|1",
"Edu SA Beginner|handwriting|4|1","Edu NSW ACT Foundation|handwriting|4|1",
"Edu QLD Beginner|handwriting|4|1","Edu TAS Beginner|handwriting|4|1",
"Edu VIC WA NT Beginner|handwriting|4|1",
"Fascinate|display|1|0","Fascinate Inline|display|1|0",
"Foldit|display|9|1",
"Gajraj One|display|1|0","Gayathri|sans-serif|3|0",
"Gloock|serif|1|0",
"Handjet|display|9|1","Harmattan|sans-serif|2|0",
"Hind Guntur|sans-serif|5|0","Hind Madurai|sans-serif|5|0",
"Hind Siliguri|sans-serif|5|0","Hind Vadodara|sans-serif|5|0",
"Host Grotesk|sans-serif|9|1","Hubballi|sans-serif|1|0",
"Imperial Script|handwriting|1|0","Island Moments|handwriting|1|0",
"Jacquard 12 Charted|display|1|0","Jacquard 24 Charted|display|1|0",
"Jersey 10 Charted|display|1|0","Jersey 15 Charted|display|1|0",
"Jersey 20 Charted|display|1|0","Jersey 25 Charted|display|1|0",
"Kalnia|serif|4|1","Kalnia Glaze|serif|4|1",
"Khand|sans-serif|5|0","Kings|handwriting|1|0",
"Konkhmer Sleokchher|display|1|0","Krub|sans-serif|7|0",
"Lacquer|display|1|0","Libre Barcode 39 Extended|display|1|0",
"Libre Barcode 39 Extended Text|display|1|0",
"Libre Barcode EAN13 Text|display|1|0",
"Lisu Bosa|serif|8|0","Livvic|sans-serif|9|0",
"Lugrasimo|handwriting|1|0","Luxurious Roman|display|1|0",
"Luxurious Script|handwriting|1|0",
"M PLUS 1p|sans-serif|7|0","Manjari|sans-serif|3|0",
"Martel|serif|4|0","Martel Sans|sans-serif|4|0",
"Mea Culpa|handwriting|1|0","Meow Script|handwriting|1|0",
"Mochiy Pop One|display|1|0","Mochiy Pop P One|display|1|0",
"Moirai One|display|1|1",
"Narnoor|serif|4|1","Neonderthaw|handwriting|1|0",
"Noto Sans Symbols|sans-serif|9|1","Noto Sans Symbols 2|sans-serif|1|0",
"Noto Sans Math|sans-serif|1|0",
"Ole|handwriting|1|0",
"Phudu|display|9|1","Pragati Narrow|sans-serif|2|0",
"Playwrite AT|handwriting|4|1","Playwrite AU NSW|handwriting|4|1",
"Playwrite AU QLD|handwriting|4|1","Playwrite AU SA|handwriting|4|1",
"Playwrite AU TAS|handwriting|4|1","Playwrite AU VIC|handwriting|4|1",
"Playwrite BE VLG|handwriting|4|1","Playwrite BE WAL|handwriting|4|1",
"Playwrite BR|handwriting|4|1","Playwrite CA|handwriting|4|1",
"Playwrite CL|handwriting|4|1","Playwrite CO|handwriting|4|1",
"Playwrite CU|handwriting|4|1","Playwrite CZ|handwriting|4|1",
"Playwrite DE Grund|handwriting|4|1","Playwrite DE LA|handwriting|4|1",
"Playwrite DE SAS|handwriting|4|1","Playwrite DE VA|handwriting|4|1",
"Playwrite DK Loopet|handwriting|4|1","Playwrite DK Uloopet|handwriting|4|1",
"Playwrite ES|handwriting|4|1","Playwrite ES Deco|handwriting|4|1",
"Playwrite FR Moderne|handwriting|4|1","Playwrite FR Trad|handwriting|4|1",
"Playwrite GB J|handwriting|4|1","Playwrite GB S|handwriting|4|1",
"Playwrite HR|handwriting|4|1","Playwrite HR Lijeva|handwriting|4|1",
"Playwrite HU|handwriting|4|1","Playwrite ID|handwriting|4|1",
"Playwrite IE|handwriting|4|1","Playwrite IN|handwriting|4|1",
"Playwrite IS|handwriting|4|1","Playwrite IT Moderna|handwriting|4|1",
"Playwrite IT Trad|handwriting|4|1","Playwrite MX|handwriting|4|1",
"Playwrite NG Modern|handwriting|4|1","Playwrite NL|handwriting|4|1",
"Playwrite NO|handwriting|4|1","Playwrite NZ|handwriting|4|1",
"Playwrite PE|handwriting|4|1","Playwrite PL|handwriting|4|1",
"Playwrite PT|handwriting|4|1","Playwrite RO|handwriting|4|1",
"Playwrite SK|handwriting|4|1","Playwrite TZ|handwriting|4|1",
"Playwrite US Modern|handwriting|4|1","Playwrite US Trad|handwriting|4|1",
"Playwrite VN|handwriting|4|1","Playwrite ZA|handwriting|4|1",
"Puppies Play|handwriting|1|0",
"Radio Canada Big|sans-serif|4|1","Rampart One|display|1|0",
"Reem Kufi|display|4|1","Reem Kufi Fun|display|4|1",
"Reem Kufi Ink|display|4|1","Rock 3D|display|1|0",
"Saira Semi Condensed|sans-serif|9|0","Sassy Frass|handwriting|1|0",
"Shippori Antique|sans-serif|1|0","Shippori Antique B1|sans-serif|1|0",
"Shizuru|display|1|0","Sixtyfour|display|1|1",
"Sixtyfour Convergence|display|1|1",
"Sofia Sans Extra Condensed|sans-serif|9|1",
"Sofia Sans Semi Condensed|sans-serif|9|1",
"Tac One|sans-serif|1|0","Texturina|serif|9|1",
"Train One|display|1|0","Tsukimi Rounded|display|5|0",
"Ubuntu Sans Mono|monospaced|9|1",
"Vina Sans|display|1|0","Wavefont|display|9|1",
"Yaldevi|sans-serif|7|1",
"Alata|sans-serif|1|0","Almarai|sans-serif|4|0",
"Akshar|sans-serif|5|1","Alumni Sans|sans-serif|9|1",
"Alumni Sans Collegiate One|sans-serif|1|0",
"Alumni Sans Inline One|sans-serif|1|0",
"Alumni Sans Pinstripe|sans-serif|2|0",
"Anek Bangla|sans-serif|8|1","Anek Devanagari|sans-serif|8|1",
"Anek Gujarati|sans-serif|8|1","Anek Gurmukhi|sans-serif|8|1",
"Anek Kannada|sans-serif|8|1","Anek Malayalam|sans-serif|8|1",
"Anek Odia|sans-serif|8|1","Anek Tamil|sans-serif|8|1",
"Anek Telugu|sans-serif|8|1",
"Aoboshi One|serif|1|0","Bayon|sans-serif|1|0",
"Abhaya Libre|serif|5|0","Bona Nova SC|serif|3|0",
"Akronim|display|1|0","Asset|display|1|0",
"Aubrey|display|1|0","Blaka|display|1|0",
"Blaka Hollow|display|1|0","Blaka Ink|display|1|0",
"Bungee Spice|display|1|1","Gasoek One|display|1|0",
"Nabla|display|1|1","Palette Mosaic|display|1|0",
"Single Day|display|1|0","Vibes|display|1|0",
"Yeon Sung|display|1|0","Bagel Fat One|display|1|0"
];

gfBatch5.forEach(item => {
    const parts = item.split("|");
    addFont(createFont(parts[0], parts[1], "Various", "Google Fonts", "gf5", globalIndex++, parseInt(parts[2]), parts[3] === "1"));
});

// =============================================
// 126. MEGA BATCH 6 — 1000+ NEW FONTS
// =============================================

// --- 6A. VELVETYNE --- CDN-verified subset (5 fonts with explicit CDN URLs)
addFont({id:"vtf-bluu-next",name:"Bluu Next",author:"Velvetyne",description:"Bold expressive serif.",variable:false,categories:["serif"],languages:["Latin"],license:"OFL",source:"Velvetyne",sourceUrl:"https://velvetyne.fr/fonts/bluu/",customCssUrl:"https://fonts.cdnfonts.com/css/bluu-next",weights:["400","700"],styles:["Regular","Bold"],tags:["display","expressive"],cssStack:"'Bluu Next', serif"});
addFont({id:"vtf-faune",name:"Faune",author:"Velvetyne",description:"Nature-inspired hybrid typeface.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"Velvetyne",sourceUrl:"https://velvetyne.fr/fonts/faune/",customCssUrl:"https://fonts.googleapis.com/css2?family=Faune:wght@300;400;700&display=swap",weights:["300","400","700"],styles:["Regular","Italic"],tags:["nature","hybrid"],cssStack:"'Faune', sans-serif"});
addFont({id:"vtf-sporting-grotesque",name:"Sporting Grotesque",author:"Velvetyne",description:"Playful geometric grotesque.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"Velvetyne",sourceUrl:"https://velvetyne.fr/fonts/sporting-grotesque/",customCssUrl:"https://fonts.cdnfonts.com/css/sporting-grotesque",weights:["400","700"],styles:["Regular","Bold"],tags:["playful","geometric"],cssStack:"'Sporting Grotesque', sans-serif"});
addFont({id:"vtf-terminal-grotesque",name:"Terminal Grotesque",author:"Velvetyne",description:"Wide display grotesque.",variable:false,categories:["display"],languages:["Latin"],license:"OFL",source:"Velvetyne",sourceUrl:"https://velvetyne.fr/fonts/terminal-grotesque/",customCssUrl:"https://fonts.cdnfonts.com/css/terminal-grotesque",weights:["400","700"],styles:["Regular","Bold"],tags:["display","wide"],cssStack:"'Terminal Grotesque', sans-serif"});
addFont({id:"vtf-pilowlava",name:"Pilowlava",author:"Velvetyne",description:"Fluid organic display face.",variable:false,categories:["display"],languages:["Latin"],license:"OFL",source:"Velvetyne",sourceUrl:"https://velvetyne.fr/fonts/pilowlava/",customCssUrl:"https://fonts.cdnfonts.com/css/pilowlava",weights:["400"],styles:["Regular"],tags:["organic","display"],cssStack:"'Pilowlava', sans-serif"});
// Avara, Compagnon, Karrik, Lack, Maax, VG5000 removed: niche Velvetyne fonts, no reliable CDN

// --- 6B. COLLLETTTIVO --- CDN-verified (1 font)
addFont({id:"coll-apfel-grotezk",name:"Apfel Grotezk",author:"Collletttivo",description:"Contemporary neo-grotesque with character.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"Collletttivo",sourceUrl:"https://www.collletttivo.it/typefaces/apfel-grotezk",customCssUrl:"https://fonts.cdnfonts.com/css/apfel-grotezk",weights:["300","400","500","700"],styles:["Regular","Italic"],tags:["neo-grotesque","contemporary"],cssStack:"'Apfel Grotezk', sans-serif"});

// --- 6C. FONTSHARE EXTRAS ---
["Clash Grotesk|sans-serif|9|1","Synonym|sans-serif|7|1","Kola|display|1|0","Bespoke Sans|sans-serif|9|1","Bespoke Serif|serif|9|1","Bespoke Slab|serif|9|1","Bespoke Stencil|display|9|1","Alpino|sans-serif|9|1","Nacelle|sans-serif|8|0","Nohemi|sans-serif|9|1","Overused Grotesk|sans-serif|9|0","Pilcrow Rounded|sans-serif|6|0","Polaris FS|sans-serif|4|0","Pramit|sans-serif|5|0","Recia|serif|8|0","Sharpie|handwriting|4|0","Strawford|sans-serif|8|0","Thica|sans-serif|7|0","Uncut Sans|sans-serif|9|0","Wotfard FS|sans-serif|6|0","Gilam|sans-serif|9|0","Gratimo Grotesk|sans-serif|6|0","Hauora|sans-serif|5|0","Helixa|sans-serif|8|0"].forEach(i=>{const[n,c,w,v]=i.split("|");addFont(createFont(n,c,"Indian Type Foundry","Fontshare","fs-ext",globalIndex++,parseInt(w),v==="1"));});

// --- 6D. GITHUB/INDIE OFL ---
addFont({id:"ia-mono",name:"iA Writer Mono",author:"iA Inc",description:"Monospace font by iA for writing apps.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"iA",sourceUrl:"https://github.com/iaolo/iA-Fonts",customCssUrl:"https://fonts.cdnfonts.com/css/ia-writer-mono",weights:["400","700"],styles:["Regular","Bold"],tags:["code","writing"],cssStack:"'iA Writer Mono', monospace"});
addFont({id:"ia-duo",name:"iA Writer Duo",author:"iA Inc",description:"Duospace font between mono and proportional.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"iA",sourceUrl:"https://github.com/iaolo/iA-Fonts",customCssUrl:"https://fonts.cdnfonts.com/css/ia-writer-duo",weights:["400","700"],styles:["Regular","Bold"],tags:["duo","writing"],cssStack:"'iA Writer Duo', monospace"});
addFont({id:"ia-quattro",name:"iA Writer Quattro",author:"iA Inc",description:"Quasi-proportional font for reading.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"iA",sourceUrl:"https://github.com/iaolo/iA-Fonts",customCssUrl:"https://fonts.cdnfonts.com/css/ia-writer-quattro",weights:["400","700"],styles:["Regular","Bold"],tags:["reading","writing"],cssStack:"'iA Writer Quattro', sans-serif"});
addFont({id:"departure-mono",name:"Departure Mono",author:"Helena Zhang",description:"A pixel-styled monospace font.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/rougier/departure-mono",customCssUrl:"https://fonts.googleapis.com/css2?family=Departure+Mono&display=swap",weights:["400"],styles:["Regular"],tags:["pixel","retro"],cssStack:"'Departure Mono', monospace"});
addFont({id:"commit-mono",name:"Commit Mono",author:"Eigil Nikolajsen",description:"Neutral programming typeface.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://commitmono.com/",customCssUrl:"https://cdn.jsdelivr.net/npm/commit-mono@1.0.0/commitmono.css",weights:["400","700"],styles:["Regular","Bold"],tags:["code","neutral"],cssStack:"'Commit Mono', monospace"});
addFont({id:"maple-mono",name:"Maple Mono",author:"subframe7536",description:"Rounded monospace with ligatures.",variable:true,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/subframe7536/maple-font",customCssUrl:"https://fonts.cdnfonts.com/css/maple-mono",weights:["300","400","500","600","700"],styles:["Variable"],tags:["code","rounded"],cssStack:"'Maple Mono', monospace"});
addFont({id:"fantasque-mono",name:"Fantasque Sans Mono",author:"Jany Belluz",description:"Programming font with handwriting feel.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/belluzj/fantasque-sans",customCssUrl:"https://cdn.jsdelivr.net/npm/fantasque-sans@1.8.0/FantasqueSansMono/font.css",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["code","handwriting"],cssStack:"'Fantasque Sans Mono', monospace"});
addFont({id:"hasklig",name:"Hasklig",author:"Ian Tuomi",description:"Source Code Pro with ligatures.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/i-tu/Hasklig",customCssUrl:"https://fonts.cdnfonts.com/css/hasklig",weights:["200","300","400","500","600","700","800","900"],styles:["Regular"],tags:["code","haskell"],cssStack:"'Hasklig', monospace"});
addFont({id:"hermit",name:"Hermit",author:"Pablo Caro",description:"Monospace for programmers.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://pcaro.es/hermit/",customCssUrl:"https://fonts.cdnfonts.com/css/hermit",weights:["300","400","700"],styles:["Regular","Bold","Italic"],tags:["code","programmer"],cssStack:"'Hermit', monospace"});
addFont({id:"monoid",name:"Monoid",author:"Andreas Larsen",description:"Open source coding font.",variable:false,categories:["monospaced"],languages:["Latin"],license:"MIT",source:"GitHub",sourceUrl:"https://larsenwork.com/monoid/",customCssUrl:"https://fonts.cdnfonts.com/css/monoid",weights:["400","700"],styles:["Regular","Bold"],tags:["code","sharp"],cssStack:"'Monoid', monospace"});
// agave, comic-shanns removed: no reliable public CDN host
addFont({id:"sometype",name:"Sometype Mono",author:"Ryoichi Tsunekawa",description:"Monospaced slab serif.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://monospacedfont.com/",customCssUrl:"https://fonts.googleapis.com/css2?family=Sometype+Mono:wght@400;500;700&display=swap",weights:["400","500","700"],styles:["Regular","Bold"],tags:["code","slab"],cssStack:"'Sometype Mono', monospace"});
addFont({id:"lilex",name:"Lilex",author:"Mikhail Sharanda",description:"Modern programming font.",variable:true,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/mishamyrt/Lilex",customCssUrl:"https://cdn.jsdelivr.net/npm/lilex@2.400/fonts/web/lilex.css",weights:["400","500","600","700"],styles:["Variable"],tags:["code","ligatures"],cssStack:"'Lilex', monospace"});
addFont({id:"fragment-mono",name:"Fragment Mono",author:"Wei Huang",description:"Monospace based on Nimbus Sans.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/weiweihuanghuang/fragment-mono",customCssUrl:"https://fonts.googleapis.com/css2?family=Fragment+Mono&display=swap",weights:["400"],styles:["Regular","Italic"],tags:["code","clean"],cssStack:"'Fragment Mono', monospace"});
addFont({id:"0xproto",name:"0xProto",author:"0xType",description:"Font for source code legibility.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/0xType/0xProto",customCssUrl:"https://cdn.jsdelivr.net/npm/0xproto@2.200/fonts/web/0xProto-Regular.css",weights:["400","700"],styles:["Regular","Bold"],tags:["code","legible"],cssStack:"'0xProto', monospace"});
// zed-mono, zed-sans removed: Zed-specific distribution, no public CDN host
addFont({id:"firago",name:"FiraGO",author:"bBox Type",description:"Fira Sans with wider language support.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/bBoxType/FiraGO",customCssUrl:"https://fonts.cdnfonts.com/css/firago",weights:["100","200","300","400","500","600","700","800"],styles:["Regular","Italic"],tags:["fira","multilingual"],cssStack:"'FiraGO', sans-serif"});
addFont({id:"aileron",name:"Aileron",author:"Sora Sagano",description:"Neo-grotesque inspired by Helvetica.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://dotcolon.net/font/aileron",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/aileron/index.css",weights:["100","200","300","400","500","600","700","800","900"],styles:["Regular","Italic"],tags:["neo-grotesque","clean"],cssStack:"'Aileron', sans-serif"});
addFont({id:"butler",name:"Butler",author:"Fabian De Smet",description:"Free serif inspired by Bodoni.",variable:false,categories:["serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://fabiandesmet.com/portfolio/butler-font/",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/butler/index.css",weights:["200","300","400","500","700","800","900"],styles:["Regular"],tags:["editorial","didone"],cssStack:"'Butler', serif"});
addFont({id:"hk-grotesk",name:"HK Grotesk",author:"Hanken Design Co",description:"Classic grotesque sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/nicholasfontservice/HK-Grotesk",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/hk-grotesk/index.css",weights:["300","400","500","600","700","800"],styles:["Regular","Italic"],tags:["grotesque","classic"],cssStack:"'HK Grotesk', sans-serif"});
addFont({id:"gidole",name:"Gidole",author:"Andreas Larsen",description:"Modern DIN-like sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://gidole.github.io/",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/gidole/index.css",weights:["400"],styles:["Regular"],tags:["din","geometric"],cssStack:"'Gidole', sans-serif"});
addFont({id:"open-sauce-sans",name:"Open Sauce Sans",author:"Creative Sauce",description:"Versatile open source sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/nicholasfontservice/open-sauce-fonts",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/open-sauce-sans/index.css",weights:["300","400","500","600","700","800"],styles:["Regular","Italic"],tags:["versatile","modern"],cssStack:"'Open Sauce Sans', sans-serif"});
addFont({id:"open-sauce-one",name:"Open Sauce One",author:"Creative Sauce",description:"Geometric open source font.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/nicholasfontservice/open-sauce-fonts",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/open-sauce-one/index.css",weights:["300","400","500","600","700","800"],styles:["Regular","Italic"],tags:["geometric","clean"],cssStack:"'Open Sauce One', sans-serif"});
addFont({id:"open-sauce-two",name:"Open Sauce Two",author:"Creative Sauce",description:"Second generation open source sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/nicholasfontservice/open-sauce-fonts",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/open-sauce-two/index.css",weights:["300","400","500","600","700","800"],styles:["Regular","Italic"],tags:["geometric","ui"],cssStack:"'Open Sauce Two', sans-serif"});
addFont({id:"clear-sans",name:"Clear Sans",author:"Intel",description:"Versatile font for screens.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"Apache 2.0",source:"Intel",sourceUrl:"https://github.com/nicholasfontservice/ClearSans",customCssUrl:"https://cdn.jsdelivr.net/npm/clear-sans@1.0.1/css/clear-sans.css",weights:["100","300","400","500","700"],styles:["Regular","Bold","Italic"],tags:["intel","versatile"],cssStack:"'Clear Sans', sans-serif"});
// national-park removed: niche font, no public CDN host
addFont({id:"gnu-freesans",name:"FreeSans",author:"GNU FreeFont",description:"Free sans-serif from GNU.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"GPL",source:"GNU",sourceUrl:"https://www.gnu.org/software/freefont/",customCssUrl:"https://fonts.cdnfonts.com/css/freesans",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["gnu","system"],cssStack:"'FreeSans', sans-serif"});
addFont({id:"gnu-freeserif",name:"FreeSerif",author:"GNU FreeFont",description:"Free serif from GNU.",variable:false,categories:["serif"],languages:["Latin","Cyrillic"],license:"GPL",source:"GNU",sourceUrl:"https://www.gnu.org/software/freefont/",customCssUrl:"https://fonts.cdnfonts.com/css/freeserif",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["gnu","system"],cssStack:"'FreeSerif', serif"});
addFont({id:"gnu-freemono",name:"FreeMono",author:"GNU FreeFont",description:"Free monospace from GNU.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"GPL",source:"GNU",sourceUrl:"https://www.gnu.org/software/freefont/",customCssUrl:"https://fonts.cdnfonts.com/css/freemono",weights:["400","700"],styles:["Regular","Bold"],tags:["gnu","system"],cssStack:"'FreeMono', monospace"});
addFont({id:"dejavu-sans",name:"DejaVu Sans",author:"DejaVu Project",description:"Wide Unicode sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"Bitstream Vera",source:"DejaVu",sourceUrl:"https://dejavu-fonts.github.io/",customCssUrl:"https://fonts.cdnfonts.com/css/dejavu-sans",weights:["200","400","700","900"],styles:["Regular","Bold","Italic"],tags:["unicode","system"],cssStack:"'DejaVu Sans', sans-serif"});
addFont({id:"dejavu-serif",name:"DejaVu Serif",author:"DejaVu Project",description:"Wide Unicode serif.",variable:false,categories:["serif"],languages:["Latin","Cyrillic"],license:"Bitstream Vera",source:"DejaVu",sourceUrl:"https://dejavu-fonts.github.io/",customCssUrl:"https://fonts.cdnfonts.com/css/dejavu-serif",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["unicode","system"],cssStack:"'DejaVu Serif', serif"});
addFont({id:"dejavu-mono",name:"DejaVu Sans Mono",author:"DejaVu Project",description:"Wide Unicode monospace.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"Bitstream Vera",source:"DejaVu",sourceUrl:"https://dejavu-fonts.github.io/",customCssUrl:"https://fonts.cdnfonts.com/css/dejavu-sans-mono",weights:["400","700"],styles:["Regular","Bold"],tags:["unicode","system"],cssStack:"'DejaVu Sans Mono', monospace"});
addFont({id:"liberation-sans",name:"Liberation Sans",author:"Red Hat",description:"Compatible with Arial.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"Liberation",sourceUrl:"https://github.com/liberationfonts",customCssUrl:"https://fonts.cdnfonts.com/css/liberation-sans",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["liberation","compatible"],cssStack:"'Liberation Sans', sans-serif"});
addFont({id:"liberation-serif",name:"Liberation Serif",author:"Red Hat",description:"Compatible with Times New Roman.",variable:false,categories:["serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"Liberation",sourceUrl:"https://github.com/liberationfonts",customCssUrl:"https://fonts.cdnfonts.com/css/liberation-serif",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["liberation","compatible"],cssStack:"'Liberation Serif', serif"});
addFont({id:"liberation-mono",name:"Liberation Mono",author:"Red Hat",description:"Compatible with Courier New.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"OFL",source:"Liberation",sourceUrl:"https://github.com/liberationfonts",customCssUrl:"https://fonts.cdnfonts.com/css/liberation-mono",weights:["400","700"],styles:["Regular","Bold"],tags:["liberation","compatible"],cssStack:"'Liberation Mono', monospace"});
addFont({id:"atkinson-next",name:"Atkinson Hyperlegible Next",author:"Braille Institute",description:"Next gen hyperlegible font.",variable:true,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"GitHub",sourceUrl:"https://www.brailleinstitute.org/freefont",customCssUrl:"https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@200;300;400;500;600;700;800&display=swap",weights:["200","300","400","500","600","700","800"],styles:["Variable","Italic"],tags:["accessibility","legible"],cssStack:"'Atkinson Hyperlegible Next', sans-serif"});
addFont({id:"metropolis",name:"Metropolis",author:"Chris Simpson",description:"Modern geometric typeface.",variable:false,categories:["sans-serif"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/dw5/Metropolis",customCssUrl:"https://cdn.jsdelivr.net/npm/@fontsource/metropolis/index.css",weights:["100","200","300","400","500","600","700","800","900"],styles:["Regular","Italic"],tags:["geometric","modern"],cssStack:"'Metropolis', sans-serif"});
addFont({id:"comic-mono",name:"Comic Mono",author:"dtinth",description:"Comic Sans meets Fira Mono.",variable:false,categories:["monospaced"],languages:["Latin"],license:"MIT",source:"GitHub",sourceUrl:"https://dtinth.github.io/comic-mono-font/",customCssUrl:"https://cdn.jsdelivr.net/npm/comic-mono@0.0.1/index.css",weights:["400","700"],styles:["Regular","Bold"],tags:["comic","fun"],cssStack:"'Comic Mono', monospace"});
addFont({id:"ibm-3270",name:"IBM 3270",author:"Ricardo Bánffy",description:"IBM 3270 terminal font.",variable:false,categories:["monospaced"],languages:["Latin"],license:"OFL",source:"GitHub",sourceUrl:"https://github.com/rbanffy/3270font",customCssUrl:"https://fonts.cdnfonts.com/css/3270",weights:["400"],styles:["Regular"],tags:["ibm","terminal"],cssStack:"'IBM 3270', monospace"});

// --- 6E. OPEN FOUNDRY — REMOVED: all 8 fonts (Achemine, Brut Grotesque, Elza, Galien, Reckless, Stardate 81316, Galapagos, Covik Sans) had no CDN coverage

// --- Font Library: kept 6 popular fonts with cdnfonts customCssUrl, removed 28 niche fonts ---
addFont({id:"fl-coelacanth",name:"Coelacanth",author:"Various",description:"Old-style serif inspired by Centaur.",variable:false,categories:["serif"],languages:["Latin"],license:"OFL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/coelacanth",customCssUrl:"https://fonts.cdnfonts.com/css/coelacanth",weights:["300","400","500","600","700","800"],styles:["Regular","Bold","Italic"],tags:["serif","classic"],cssStack:"'Coelacanth', serif"});
addFont({id:"fl-linux-biolinum",name:"Linux Biolinum",author:"Various",description:"Sans-serif companion to Linux Libertine.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/linux-biolinum",customCssUrl:"https://fonts.cdnfonts.com/css/linux-biolinum",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["linux","companion"],cssStack:"'Linux Biolinum', sans-serif"});
addFont({id:"fl-linux-libertine",name:"Linux Libertine",author:"Various",description:"Classic serif for digital typography.",variable:false,categories:["serif"],languages:["Latin","Cyrillic"],license:"OFL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/linux-libertine",customCssUrl:"https://fonts.cdnfonts.com/css/linux-libertine",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["linux","classic"],cssStack:"'Linux Libertine', serif"});
addFont({id:"fl-nimbus-sans",name:"Nimbus Sans",author:"Various",description:"Helvetica-compatible URW sans-serif.",variable:false,categories:["sans-serif"],languages:["Latin","Cyrillic"],license:"GPL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/nimbus-sans-l",customCssUrl:"https://fonts.cdnfonts.com/css/nimbus-sans-l",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["helvetica","compatible"],cssStack:"'Nimbus Sans', sans-serif"});
addFont({id:"fl-nimbus-roman",name:"Nimbus Roman",author:"Various",description:"Times-compatible URW serif.",variable:false,categories:["serif"],languages:["Latin","Cyrillic"],license:"GPL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/nimbus-roman-no9-l",customCssUrl:"https://fonts.cdnfonts.com/css/nimbus-roman-no9-l",weights:["400","700"],styles:["Regular","Bold","Italic"],tags:["times","compatible"],cssStack:"'Nimbus Roman', serif"});
addFont({id:"fl-nimbus-mono",name:"Nimbus Mono",author:"Various",description:"Courier-compatible URW monospace.",variable:false,categories:["monospaced"],languages:["Latin","Cyrillic"],license:"GPL",source:"Font Library",sourceUrl:"https://fontlibrary.org/en/font/nimbus-mono-l",customCssUrl:"https://fonts.cdnfonts.com/css/nimbus-mono-l",weights:["400","700"],styles:["Regular","Bold"],tags:["courier","compatible"],cssStack:"'Nimbus Mono', monospace"});
// Removed 28 niche Font Library fonts: Katahdin Round, Karmilla, Gnuolane, Commune Nuit, London Between,
// Pecita, Gilbert, Junction, Dustismo, Jellee, Logisoso, Vegur, Amble, Heuristica, Iwona, Kurier,
// Latin Modern (3), TeX Gyre (7), Antykwa Poltawskiego, Antykwa Torunska — no reliable CDN coverage

// --- 6F. GOOGLE FONTS BATCH 6 ---
const gfB6 = ["Aclonica|display|1|0","Alef|sans-serif|2|0","Alkatra|sans-serif|4|1","Georama|sans-serif|9|1","Sarala|sans-serif|2|0","Sawarabi Gothic|sans-serif|1|0","Mukta Malar|sans-serif|5|0","Mukta Mahee|sans-serif|5|0","Mukta Vaani|sans-serif|5|0","Aguafina Script|handwriting|1|0","Akaya Kanadaka|display|1|0","Akaya Telivigala|display|1|0","Asar|serif|1|0","Barriecito|display|1|0","Benne|serif|1|0","Dokdo|display|1|0","Gaegu|handwriting|3|0","Gamja Flower|handwriting|1|0","Gothic A1|sans-serif|9|0","Hi Melody|handwriting|1|0","Kolker Brush|handwriting|1|0","Licorice|handwriting|1|0","Mansalva|handwriting|1|0","Mynerve|handwriting|1|0","Nanum Pen Script|handwriting|1|0","Nanum Brush Script|handwriting|1|0","Oooh Baby|handwriting|1|0","Passions Conflict|display|1|0","Petemoss|handwriting|1|0","Road Rage|display|1|0","Sedgwick Ave|handwriting|1|0","Sedgwick Ave Display|handwriting|1|0","Send Flowers|handwriting|1|0","Solitreo|handwriting|1|0","Style Script|handwriting|1|0","The Nautigal|handwriting|2|0","Twinkle Star|handwriting|1|0","Updock|handwriting|1|0","Waterfall|handwriting|1|0","Whisper|handwriting|1|0","Zen Loop|handwriting|2|0","Beth Ellen|handwriting|1|0","Birthstone|handwriting|1|0","Birthstone Bounce|handwriting|1|0","Bonbon|handwriting|1|0","Butterfly Kids|handwriting|1|0","Charm|handwriting|2|0","Chilanka|handwriting|1|0","Charmonman|handwriting|2|0","Dekko|handwriting|1|0","Fasthand|handwriting|1|0","Fuzzy Bubbles|handwriting|2|0","Klee One|handwriting|2|0","Liu Jian Mao Cao|handwriting|1|0","Long Cang|handwriting|1|0","Ma Shan Zheng|handwriting|1|0","Mali|handwriting|7|0","Maitree|handwriting|5|0","Molle|handwriting|1|0","Sriracha|handwriting|1|0","Tillana|handwriting|5|0","Gowun Batang|handwriting|2|0","Gowun Dodum|handwriting|1|0","Bigelow Rules|display|1|0","Bigshot One|display|1|0","Boogaloo|display|1|0","Bowlby One|display|1|0","Bowlby One SC|display|1|0","Bubblegum Sans|display|1|0","Butcherman|display|1|0","Caesar Dressing|display|1|0","Ceviche One|display|1|0","Chango|display|1|0","Chela One|display|1|0","Chelsea Market|display|1|0","Cherry Cream Soda|display|1|0","Cherry Swash|display|2|0","Chewy|display|1|0","Chicle|display|1|0","Chonburi|display|1|0","Codystar|display|2|0","Combo|display|1|0","Concert One|display|1|0","Corben|display|2|0","Creepster|display|1|0","Crushed|display|1|0","Diplomata|display|1|0","Diplomata SC|display|1|0","Elsie|display|2|0","Elsie Swash Caps|display|2|0","Emblema One|display|1|0","Ewert|display|1|0","Faster One|display|1|0","Finger Paint|display|1|0","Flamenco|display|2|0","Flavors|display|1|0","Fontdiner Swanky|display|1|0","Freckle Face|display|1|0","Frijole|display|1|0","Fruktur|display|1|0","Galindo|display|1|0","Germania One|display|1|0","Graduate|display|1|0","Grandstander|display|9|1","Gravitas One|display|1|0","Grenze Gotisch|display|9|1","Griffy|display|1|0","Gruppo|display|1|0","Gugi|display|1|0","Hanalei|display|1|0","Hanalei Fill|display|1|0","Holtwood One SC|display|1|0","Imbue|display|9|1","Irish Grover|display|1|0","Jacques Francois Shadow|display|1|0","Jolly Lodger|display|1|0","Keania One|display|1|0","Kenia|display|1|0","Kranky|display|1|0","Lakki Reddy|display|1|0","Lancelot|display|1|0","Life Savers|display|3|0","Lilita One|display|1|0","Lily Script One|display|1|0","Limelight|display|1|0","Londrina Outline|display|1|0","Londrina Shadow|display|1|0","Londrina Solid|display|4|0","Love Ya Like A Sister|display|1|0","Macondo|display|1|0","Macondo Swash Caps|display|1|0","Maiden Orange|display|1|0","Major Mono Display|display|1|0","Margarine|display|1|0","Marhey|display|7|1","Marko One|display|1|0","McLaren|display|1|0","Metal|display|1|0","Metal Mania|display|1|0","Milonga|display|1|0","Miltonian|display|1|0","Miltonian Tattoo|display|1|0","Miniver|display|1|0","Modak|display|1|0","Modern Antiqua|display|1|0","Mogra|display|1|0","Monofett|display|1|0","Monoton|display|1|0","Mountains of Christmas|display|2|0","Mystery Quest|display|1|0","Oleo Script|display|2|0","Oleo Script Swash Caps|display|2|0","Oregano|display|2|0","Original Surfer|display|1|0","Paprika|display|1|0","Passero One|display|1|0","Passion One|display|3|0","Piedra|display|1|0","Pirata One|display|1|0","Poetsen One|display|1|0","Poller One|display|1|0","Pompiere|display|1|0","Rammetto One|display|1|0","Ranga|display|2|0","Revalia|display|1|0","Ribeye|display|1|0","Ribeye Marrow|display|1|0","Risque|display|1|0","Rowdies|display|3|0","Ruge Boogie|display|1|0","Rye|display|1|0","Sail|display|1|0","Salsa|display|1|0","Sancreek|display|1|0","Sarpanch|display|4|0","Sevillana|display|1|0","Shojumaru|display|1|0","Skranji|display|2|0","Smooch|display|1|0","Smythe|display|1|0","Sonsie One|display|1|0","Spicy Rice|display|1|0","Spirax|display|1|0","Squada One|display|1|0","Stick No Bills|display|7|1","Suwannaphum|display|3|0","Trade Winds|display|1|0","Trochut|display|3|0","Tulpen One|display|1|0","Turret Road|display|5|0","Uncial Antiqua|display|1|0","Unifraktur Cook|display|1|0","Unifraktur Maguntia|display|1|0","Unlock|display|1|0","Vampiro One|display|1|0","Viaoda Libre|display|1|0","Voces|display|1|0","Wellfleet|display|1|0","Yatra One|display|1|0"];
gfB6.forEach(i=>{const[n,c,w,v]=i.split("|");addFont(createFont(n,c,"Various","Google Fonts","gf6",globalIndex++,parseInt(w),v==="1"));});

// --- 6G–6I: REMOVED — All commercial/proprietary fonts purged ---
// Monotype, Hoefler, Grilli, Klim, Dinamo, Commercial Type, Adobe Fonts,
// Emigre, Colophon, Swiss Typefaces, Typotheque, Frere-Jones, Pangram Pangram,
// Atipo, DJR, Displaay, system fonts, trendy indie — NOT open source.


// Keep catalog order stable across builds, sessions and screenshots.
export const mockFonts = [...fonts].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.id.localeCompare(b.id)
);
