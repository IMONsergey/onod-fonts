import React from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import sergeiPhoto from "../../assets/about-portrait.webp";

interface AboutPageProps { onNavigateHome?: () => void; }

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome }) => {
  const { language } = useLanguage();
  const ru = language === "ru";

  const principles = ru ? [
    ["Поиск без шума", "Каталог оставляет на первом плане саму гарнитуру: название, автор, категория и живое превью."],
    ["Проверяемые данные", "Источник, лицензия и технические свойства не угадываются. Неподтверждённые поля остаются явно неопределёнными."],
    ["Рабочий инструмент", "Избранное, детальный specimen и Workbench должны помогать принять дизайнерское решение, а не демонстрировать интерфейс ради интерфейса."],
  ] : [
    ["Discovery without noise", "The catalog keeps the typeface itself in focus: family, author, category and a live specimen."],
    ["Verifiable data", "Source, license and technical properties are never guessed. Unverified fields remain explicitly unresolved."],
    ["A working tool", "Favorites, the specimen page and Workbench are meant to support design decisions, not demonstrate UI for its own sake."],
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="px-6 md:px-10 lg:px-14 py-10 md:py-14 border-b border-neutral-200">
        <button type="button" onClick={() => onNavigateHome?.()} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors"><ArrowLeft className="w-4 h-4" />{ru ? "В каталог" : "Back to catalog"}</button>
        <div className="mt-16 md:mt-24 max-w-5xl">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">About ONOD Fonts</div>
          <h1 className="mt-5 text-6xl md:text-8xl lg:text-9xl tracking-tighter leading-[0.85] font-semibold">ONOD<br />Fonts</h1>
          <p className="mt-10 max-w-2xl text-lg md:text-2xl leading-snug text-neutral-500">
            {ru ? "Курируемый индекс типографики для поиска, проверки и практического сравнения гарнитур." : "A curated typography index for discovering, verifying and practically comparing typefaces."}
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-3 border-b border-neutral-200">
        {principles.map(([title, description], index) => (
          <article key={title} className="p-6 md:p-8 lg:p-10 border-b last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 border-neutral-200">
            <div className="font-mono text-[9px] text-neutral-300 mb-8">0{index + 1}</div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">{description}</p>
          </article>
        ))}
      </section>

      <section className="px-6 md:px-10 lg:px-14 py-14 md:py-20 border-b border-neutral-200">
        <div className="max-w-6xl grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-12 lg:gap-20">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">{ru ? "Как устроено" : "How it works"}</div>
            <h2 className="mt-5 text-4xl md:text-6xl tracking-tighter font-semibold">{ru ? "Данные отдельно. Интерфейс отдельно." : "Data and interface stay separate."}</h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-500">
              {ru
                ? "Каталог работает поверх отдельного слоя доказательств: метаданные Google Fonts, Fontshare, независимые источники, лицензии и проверенные font-файлы. Интерфейс может становиться проще, не снижая достоверность данных."
                : "The catalog sits on top of a separate evidence layer: Google Fonts metadata, Fontshare, independent primary sources, licenses and inspected font files. The interface can become simpler without weakening data integrity."}
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-px bg-neutral-200 border border-neutral-200 max-w-2xl">
              {[ru ? "1 346 гарнитур" : "1,346 typefaces", ru ? "Проверяемый provenance" : "Traceable provenance", ru ? "Полевой trust model" : "Field-level trust model", ru ? "Browser-verified previews" : "Browser-verified previews"].map(item => <div key={item} className="bg-white p-4 font-mono text-[10px] uppercase tracking-widest text-neutral-500">{item}</div>)}
            </div>
          </div>

          <aside className="border border-neutral-200 self-start">
            <img src={sergeiPhoto} alt="Sergei Otcheskov" loading="lazy" className="w-full aspect-[4/3] object-cover" />
            <div className="p-5">
              <div className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">{ru ? "Автор проекта" : "Project creator"}</div>
              <div className="mt-2 text-lg font-semibold">Sergei Otcheskov</div>
              <a href="https://t.me/imonsergei" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors">Telegram <ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 md:px-10 lg:px-14 py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <p className="text-sm text-neutral-400">{ru ? "ONOD Fonts развивается как открытый дизайнерский инструмент." : "ONOD Fonts is developed as an open design tool."}</p>
        <button type="button" onClick={() => onNavigateHome?.()} className="px-5 py-3 bg-neutral-900 text-white text-sm hover:bg-neutral-700 transition-colors">{ru ? "Открыть каталог" : "Open catalog"}</button>
      </section>
    </div>
  );
};
