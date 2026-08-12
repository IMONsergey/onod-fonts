import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const KerningModule = React.lazy(() => import("@/components/protocol/KerningModule").then(m => ({ default: m.KerningModule })));
const AnatomyModule = React.lazy(() => import("@/components/protocol/AnatomyModule").then(m => ({ default: m.AnatomyModule })));
const VariableModule = React.lazy(() => import("@/components/protocol/VariableModule").then(m => ({ default: m.VariableModule })));
const GridModule = React.lazy(() => import("@/components/protocol/GridModule").then(m => ({ default: m.GridModule })));
const OpticalModule = React.lazy(() => import("@/components/protocol/OpticalModule").then(m => ({ default: m.OpticalModule })));
const ScaleModule = React.lazy(() => import("@/components/protocol/ScaleModule").then(m => ({ default: m.ScaleModule })));
const WeightModule = React.lazy(() => import("@/components/protocol/WeightModule").then(m => ({ default: m.WeightModule })));
const TrackingModule = React.lazy(() => import("@/components/protocol/TrackingModule").then(m => ({ default: m.TrackingModule })));
const AlignmentModule = React.lazy(() => import("@/components/protocol/AlignmentModule").then(m => ({ default: m.AlignmentModule })));
const GlyphModule = React.lazy(() => import("@/components/protocol/GlyphModule").then(m => ({ default: m.GlyphModule })));
const MixModule = React.lazy(() => import("@/components/protocol/MixModule").then(m => ({ default: m.MixModule })));

const useLazyVisible = (rootMargin = "300px") => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
};

const ModuleSkeleton = () => <div className="w-full min-h-72 border border-neutral-200 bg-neutral-50 p-8 animate-pulse"><div className="h-3 w-36 bg-neutral-200" /><div className="mt-5 h-40 bg-neutral-100" /></div>;

const Section = memo(({ number, title, desc, id, children }: { number: string; title: string; desc: string; id: string; children: React.ReactNode }) => {
  const { ref, visible } = useLazyVisible();
  return (
    <section ref={ref} id={id} className="border-b border-neutral-200 px-6 md:px-10 lg:px-14 py-14 md:py-20 bg-white">
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-[260px_minmax(0,1fr)] gap-8 lg:gap-14">
        <header className="lg:sticky lg:top-28 self-start">
          <div className="font-mono text-[9px] text-neutral-300">{number}</div>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-500">{desc}</p>
        </header>
        <div className="min-w-0">{visible ? <React.Suspense fallback={<ModuleSkeleton />}>{children}</React.Suspense> : <ModuleSkeleton />}</div>
      </div>
    </section>
  );
});

export const ProtocolPage = () => {
  const { t, language } = useLanguage();
  const [activeId, setActiveId] = useState("");
  const modules = useMemo(() => [
    { id: "spacing", number: "01", titleKey: "protocol.spacing.title", descKey: "protocol.spacing.desc", Component: KerningModule },
    { id: "anatomy", number: "02", titleKey: "protocol.anatomy.title", descKey: "protocol.anatomy.desc", Component: AnatomyModule },
    { id: "variable", number: "03", titleKey: "protocol.variable.title", descKey: "protocol.variable.desc", Component: VariableModule },
    { id: "grid", number: "04", titleKey: "protocol.grid.title", descKey: "protocol.grid.desc", Component: GridModule },
    { id: "optical", number: "05", titleKey: "protocol.optical.title", descKey: "protocol.optical.desc", Component: OpticalModule },
    { id: "scale", number: "06", titleKey: "protocol.scale.title", descKey: "protocol.scale.desc", Component: ScaleModule },
    { id: "weight", number: "07", titleKey: "protocol.weight.title", descKey: "protocol.weight.desc", Component: WeightModule },
    { id: "tracking", number: "08", titleKey: "protocol.tracking.title", descKey: "protocol.tracking.desc", Component: TrackingModule },
    { id: "alignment", number: "09", titleKey: "protocol.alignment.title", descKey: "protocol.alignment.desc", Component: AlignmentModule },
    { id: "glyph", number: "10", titleKey: "protocol.glyph.title", descKey: "protocol.glyph.desc", Component: GlyphModule },
    { id: "mix", number: "11", titleKey: "protocol.mix.title", descKey: "protocol.mix.desc", Component: MixModule },
  ], []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActiveId(entry.target.id); }), { rootMargin: "-40% 0px -40% 0px" });
    modules.forEach(module => { const element = document.getElementById(module.id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [modules]);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  return (
    <div className="min-h-screen bg-white text-black">
      <section className="px-6 md:px-10 lg:px-14 py-14 md:py-20 border-b border-neutral-200">
        <div className="max-w-5xl">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">Typography protocol</div>
          <h1 className="mt-5 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.9]">{t("protocol.title")}</h1>
          <p className="mt-7 max-w-2xl text-base md:text-lg leading-relaxed text-neutral-500">{t("protocol.subtitle")}</p>
          <div className="mt-10 font-mono text-[9px] uppercase tracking-widest text-neutral-400">{modules.length} {language === "ru" ? "интерактивных модулей" : "interactive modules"}</div>
        </div>
      </section>

      <nav className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 overflow-x-auto" aria-label="Protocol modules">
        <div className="px-4 md:px-6 h-12 flex items-center gap-1 min-w-max">
          {modules.map(module => <a key={module.id} href={`#${module.id}`} aria-current={activeId === module.id ? "location" : undefined} className={`h-8 px-3 flex items-center font-mono text-[9px] uppercase tracking-widest transition-colors ${activeId === module.id ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-black hover:bg-neutral-50"}`}>{module.number}</a>)}
        </div>
      </nav>

      {modules.map(module => <Section key={module.id} id={module.id} number={module.number} title={t(module.titleKey)} desc={t(module.descKey)}><module.Component /></Section>)}

      <div className="px-6 md:px-10 lg:px-14 py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <p className="text-sm text-neutral-400">{language === "ru" ? "Протокол — справочный раздел. Основная работа со шрифтами происходит в каталоге и Workbench." : "Protocol is a reference section. Primary font work happens in Catalog and Workbench."}</p>
        <button type="button" onClick={scrollToTop} className="inline-flex items-center gap-2 px-5 py-3 border border-neutral-300 text-sm hover:bg-neutral-50 transition-colors">{t("protocol.return")} <ArrowUp className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
