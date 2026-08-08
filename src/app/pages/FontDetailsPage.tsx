import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Code, Download, Heart, Minus, Plus, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Font, mockFonts } from "@/data/mockFonts";
import { FontLoader } from "@/components/FontLoader";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";

interface FontDetailsProps {
  font: Font;
  onBack: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: boolean;
  toggleCompare: (id: string) => void;
  isCompare: boolean;
  testPairing?: (ids: string[]) => void;
  previewText?: string;
}

type Tab = "specimen" | "glyphs" | "about";
type Align = "left" | "center" | "right";

export const FontDetailsPage: React.FC<FontDetailsProps> = ({ font, onBack, toggleFavorite, isFavorite, toggleCompare, isCompare, testPairing, previewText }) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("specimen");
  const [text, setText] = useState(previewText || "The quick brown fox jumps over the lazy dog.");
  const [size, setSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [tracking, setTracking] = useState(0);
  const [align, setAlign] = useState<Align>("left");
  const [weight, setWeight] = useState(font.weights[0] || "400");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setWeight(font.weights[0] || "400"), [font]);

  const pairing = useMemo(() => {
    const target = font.categories.includes("serif") ? "sans-serif" : "serif";
    const candidates = mockFonts.filter(f => f.id !== font.id && f.categories.includes(target));
    const seed = [...font.id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return candidates.length ? candidates[seed % candidates.length] : undefined;
  }, [font]);

  const related = useMemo(() => mockFonts
    .filter(f => f.id !== font.id && f.categories.some(category => font.categories.includes(category)))
    .slice(0, 6), [font]);

  const snippets = useMemo(() => {
    const googleName = font.name.replace(/ /g, "+");
    const cssImport = font.source === "Google Fonts"
      ? `@import url('https://fonts.googleapis.com/css2?family=${googleName}${font.variable ? ":wght@100..900" : ""}&display=swap');`
      : font.customCssUrl ? `@import url('${font.customCssUrl}');` : `/* Load ${font.name} from ${font.source} */`;
    return {
      import: cssImport,
      css: `font-family: ${font.cssStack};`,
      tailwind: `fontFamily: { custom: ['${font.name}', '${font.categories.includes("serif") ? "serif" : font.categories.includes("monospaced") ? "monospace" : "sans-serif"}'] }`,
    };
  }, [font]);

  const copy = async (key: string, value: string) => {
    if (!(await copyToClipboard(value))) return toast.error("Copy failed");
    setCopied(key);
    toast.success(t("card.cssCopied"));
    window.setTimeout(() => setCopied(null), 1400);
  };

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.?";

  return (
    <div className="min-h-screen bg-white text-black">
      <FontLoader fonts={[font, pairing, ...related].filter(Boolean) as Font[]} />

      <div className="sticky top-16 z-50 h-16 bg-white border-b border-neutral-200 flex items-center">
        <button onClick={onBack} className="h-full px-5 md:px-7 border-r border-neutral-200 hover:bg-neutral-50 flex items-center gap-2"><ArrowLeft className="w-4 h-4"/><span className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest">{t("details.back")}</span></button>
        <div className="flex-1 min-w-0 px-4 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400 truncate">{font.name} / {font.categories.join(" + ")}</div>
        <button onClick={() => toggleCompare(font.id)} className="h-full px-5 border-l border-neutral-200 hover:bg-neutral-50" aria-label={t("card.addToCompare")}>{isCompare ? <Minus className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}</button>
        <button onClick={() => toggleFavorite(font.id)} className="h-full px-5 border-l border-neutral-200 hover:bg-neutral-50" aria-label={t("card.addToFavorites")}><Heart className={cn("w-4 h-4", isFavorite && "fill-current")}/></button>
        <button onClick={() => window.open(font.sourceUrl, "_blank", "noopener,noreferrer")} className="h-full px-6 bg-neutral-900 text-white hover:bg-neutral-700 hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"><Download className="w-3.5 h-3.5"/>{t("details.download")}</button>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] border-b border-neutral-200">
        <aside className="p-6 md:p-8 bg-neutral-50 border-b lg:border-b-0 lg:border-r border-neutral-200">
          <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">TYPEFACE / {font.source}</div>
          <h1 className="text-5xl md:text-6xl tracking-tighter leading-[0.88] mb-8" style={{ fontFamily: font.cssStack, fontWeight: weight }}>{font.name}</h1>
          <dl className="font-mono text-[10px] uppercase tracking-wider space-y-3">
            {[[t("details.foundry"), font.author], [t("details.license"), font.license], [t("details.weights"), String(font.weights.length)], [t("details.source"), font.source]].map(([label,value]) => <div key={label} className="flex justify-between gap-4 border-b border-neutral-200 pb-2"><dt className="text-neutral-400">{label}</dt><dd className="text-right">{value}</dd></div>)}
          </dl>
          {pairing && <div className="mt-10 border border-neutral-200 bg-white p-4"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-3">{t("details.pair")}</div><div className="text-2xl mb-1" style={{ fontFamily: pairing.cssStack }}>{pairing.name}</div><div className="font-mono text-[9px] uppercase text-neutral-400 mb-4">{pairing.author}</div>{testPairing && <button onClick={() => testPairing([font.id, pairing.id])} className="w-full border border-neutral-300 py-2 font-mono text-[9px] uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">Open pairing</button>}</div>}
        </aside>

        <div className="min-w-0">
          <nav className="h-14 border-b border-neutral-200 flex overflow-x-auto">
            {(["specimen","glyphs","about"] as Tab[]).map(item => <button key={item} onClick={() => setTab(item)} className={cn("px-6 md:px-9 font-mono text-[10px] uppercase tracking-widest border-r border-neutral-200", tab === item ? "bg-neutral-900 text-white" : "hover:bg-neutral-50")}>{item === "specimen" ? t("details.lab") : item === "glyphs" ? t("details.glyphs") : t("details.about")}</button>)}
          </nav>

          {tab === "specimen" && <div>
            <div className="p-4 border-b border-neutral-200 flex flex-wrap gap-5 items-center bg-neutral-50/50">
              <Control label={t("details.size")} value={size} min={16} max={180} step={1} onChange={setSize}/>
              <Control label={t("details.line")} value={lineHeight} min={0.8} max={2.2} step={0.1} onChange={setLineHeight}/>
              <Control label={t("details.track")} value={tracking} min={-0.1} max={0.4} step={0.01} onChange={setTracking}/>
              <select value={weight} onChange={e => setWeight(e.target.value)} className="h-9 border border-neutral-300 bg-white px-3 font-mono text-[10px] uppercase">{font.weights.map(item => <option key={item} value={item}>{item}</option>)}</select>
              <div className="flex border border-neutral-300 ml-auto"><IconButton active={align === "left"} onClick={() => setAlign("left")}><AlignLeft className="w-3.5 h-3.5"/></IconButton><IconButton active={align === "center"} onClick={() => setAlign("center")}><AlignCenter className="w-3.5 h-3.5"/></IconButton><IconButton active={align === "right"} onClick={() => setAlign("right")}><AlignRight className="w-3.5 h-3.5"/></IconButton></div>
            </div>
            <div className="p-6 md:p-12 min-h-[55vh]"><textarea value={text} onChange={e => setText(e.target.value)} className="w-full min-h-[40vh] resize-none bg-transparent outline-none" style={{ fontFamily: font.cssStack, fontSize: `${size}px`, lineHeight, letterSpacing: `${tracking}em`, textAlign: align, fontWeight: weight }}/></div>
            <div className="border-t border-neutral-200 p-6 md:p-12"><div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-8">{t("details.allWeights")}</div><div className="space-y-8">{font.weights.map(item => <button key={item} onClick={() => setWeight(item)} className="w-full text-left group"><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-2 group-hover:text-black">{item}</div><div className="text-4xl md:text-6xl leading-none break-words" style={{ fontFamily: font.cssStack, fontWeight: item }}>{font.name} {item}</div></button>)}</div></div>
          </div>}

          {tab === "glyphs" && <div className="p-6 md:p-12"><div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 border-l border-t border-neutral-200">{[...chars].map((char,index) => <div key={`${char}-${index}`} className="aspect-square border-r border-b border-neutral-200 flex items-center justify-center text-2xl md:text-3xl hover:bg-neutral-900 hover:text-white transition-colors" style={{ fontFamily: font.cssStack, fontWeight: weight }}>{char === " " ? "·" : char}</div>)}</div></div>}

          {tab === "about" && <div className="p-6 md:p-12 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-12">
            <div><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">001 / DESCRIPTION</div><p className="text-3xl md:text-5xl tracking-tight leading-[1.05] mb-12">{font.description}</p><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">002 / RELATED</div><div className="grid sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200">{related.map(item => <div key={item.id} className="bg-white p-4"><div className="text-2xl" style={{ fontFamily: item.cssStack }}>{item.name}</div><div className="font-mono text-[9px] uppercase text-neutral-400 mt-2">{item.author}</div></div>)}</div></div>
            <div><div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-5">003 / CODE</div><div className="space-y-3">{Object.entries(snippets).map(([key,value]) => <div key={key} className="border border-neutral-200"><div className="flex justify-between items-center px-3 py-2 border-b border-neutral-200 font-mono text-[9px] uppercase"><span>{key}</span><button onClick={() => copy(key,value)}>{copied === key ? <Check className="w-3.5 h-3.5"/> : <Code className="w-3.5 h-3.5"/>}</button></div><pre className="p-3 overflow-auto text-[10px] whitespace-pre-wrap break-all">{value}</pre></div>)}</div><div className="mt-8 p-4 bg-neutral-50 border border-neutral-200 font-mono text-[10px] leading-relaxed">{t("details.licenseDesc").replace("{license}", font.license)}</div></div>
          </div>}
        </div>
      </section>
    </div>
  );
};

const Control = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) => <label className="flex items-center gap-2 font-mono text-[9px] uppercase"><span className="text-neutral-400">{label}</span><input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))} className="w-20 h-px accent-black"/><span className="w-9 text-right">{Number.isInteger(value) ? value : value.toFixed(2)}</span></label>;
const IconButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => <button onClick={onClick} className={cn("p-2 border-r last:border-r-0 border-neutral-300", active && "bg-neutral-900 text-white")}>{children}</button>;
