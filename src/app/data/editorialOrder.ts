// A deliberate sequence for the catalog's opening screens. Preserve each family's catalog identity.
export const editorialFamilies = [
  "Onest",
  "Literata",
  "NT Somic",
  "IBM Plex Mono",
  "Golos Text",
  "Cormorant Garamond",
  "Manrope",
  "PT Serif",
  "Geist",
  "Spectral",
  "IBM Plex Sans",
  "Prata",
  "Geologica",
  "Source Serif 4",
  "Liter",
  "Cascadia Mono",
  "Lora",
  "Inter",
  "Libertinus Serif",
  "Commissioner",
  "Space Grotesk",
  "Bodoni Moda",
  "PT Sans",
  "Alegreya",
  "Finlandica Text",
  "Newsreader",
  "Source Sans 3",
  "Garamonto Code",
  "Fraunces",
  "DM Sans",
  "Old Standard TT",
  "Fira Sans",
  "Instrument Serif",
  "Roboto Flex",
  "Gentium Book Plus",
  "EB Garamond",
  "Satoshi",
  "JetBrains Mono",
  "Piazzolla",
  "Archivo",
  "Ibarra Real Nova",
  "Hanken Grotesk",
  "STIX Two Text",
  "Cabinet Grotesk",
  "Bitter",
  "Kibernetyk Mono",
  "Instrument Sans",
  "Libre Baskerville",
  "Moderustic",
  "Crimson Pro",
  "Work Sans",
  "Ortica",
  "Fira Code",
  "IBM Plex Serif",
  "Literaturnaya Book",
  "Jost",
  "Alegreya Sans",
  "DM Serif Display",
  "Source Code Pro",
  "Figtree",
  "Angine Sans",
  "Bricolage Grotesque",
  "Libertinus Sans",
  "Gelasio",
  "Space Mono",
  "Libre Franklin",
  "Merriweather",
  "Tenor Sans",
  "Brygada 1918",
  "Atkinson Hyperlegible",
  "Avrile Serif",
  "Plus Jakarta Sans",
  "Mazius Display",
  "Rawline",
  "Playfair Display",
  "General Sans",
  "PT Mono",
  "Crimson",
  "Public Sans",
  "Libre Caslon Text",
  "Acari Sans",
  "Barlow",
  "Sora",
  "Pliant",
  "Kelvinch",
  "Urbanist",
  "CMU Serif",
  "Proza Libre",
  "Nunito Sans",
  "Mona Sans",
  "Ysabeau",
  "Sansation",
  "Cardo",
  "Lato",
  "Karla",
  "Coval",
  "Iosevka Charon Mono",
  "Rethink Sans",
  "Vollkorn",
  "Red Hat Display",
] as const;

const editorialRank = new Map<string, number>(editorialFamilies.map((name, index) => [name, index]));
const unlisted = editorialFamilies.length;
const alphabetical = new Intl.Collator("en", { sensitivity: "base" });

export type CatalogSort = "default" | "alpha";

export function orderCatalog<T extends { name: string }>(fonts: readonly T[], sort: CatalogSort, search: string): T[] {
  if (sort === "alpha") {
    return [...fonts].sort((a, b) => alphabetical.compare(a.name, b.name));
  }

  const query = search.trim().toLowerCase();
  return [...fonts].sort((a, b) => {
    if (query) {
      const exact = Number(b.name.toLowerCase() === query) - Number(a.name.toLowerCase() === query);
      if (exact) return exact;
    }
    return (editorialRank.get(a.name) ?? unlisted) - (editorialRank.get(b.name) ?? unlisted);
  });
}
