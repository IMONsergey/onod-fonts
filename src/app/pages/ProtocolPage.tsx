import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUp, ChevronDown, Database } from "lucide-react";
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

const useLazyVisible = (rootMargin = "200px") => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
};

const ModuleSkeleton = () => (
  <div className="w-full border border-neutral-200 bg-neutral-50 p-8 md:p-12 animate-pulse">
    <div className="h-4 w-48 bg-neutral-200 mb-4" />
    <div className="h-8 w-72 bg-neutral-200 mb-8" />
    <div className="h-48 bg-neutral-100" />
  </div>
);

const Section = memo(({ number, title, desc, id, children }: { number: string; title: string; desc: string; id: string; children: React.ReactNode; }) => {
  const { ref, visible } = useLazyVisible("300px");
  return (
    <section ref={ref} id={id} className="border-b border-neutral-200 relative py-16 md:py-24 px-6 md:px-12 lg:px-16 flex flex-col bg-white">
      <div className="sticky top-[130px] z-30 bg-white mb-10 py-5 flex justify-between items-baseline border-b border-neutral-200">
        <h2 className="text-2xl md:text-4xl tracking-tighter uppercase" style={{ fontWeight: 700 }}><span className="text-sm font-mono align-top mr-3 text-neutral-300">{number}</span>{title}</h2>
        <ChevronDown className="w-5 h-5 animate-bounce text-neutral-300 hidden md:block" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-[1920px] mx-auto w-full">
        <div className="lg:col-span-4 space-y-6 font-mono text-sm leading-relaxed text-neutral-500 text-justify lg:sticky lg:top-48 h-fit">
          <p className="uppercase tracking-widest text-neutral-800 text-[10px]" style={{ fontWeight: 700 }}>/// SYSTEM NOTE</p><p>{desc}</p>
        </div>
        <div className="lg:col-span-8 w-full">{visible ? <React.Suspense fallback={<ModuleSkeleton />}>{children}</React.Suspense> : <ModuleSkeleton />}</div>
      </div>
    </section>
  );
});

const TOCNav = memo(({ modules, activeId }: { modules: { id: string; number: string; title: string }[]; activeId: string }) => (
  <nav className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1.5" aria-label="Table of contents">
    {modules.map((m) => (
      <a key={m.id} href={`#${m.id}`} className={`group flex items-center gap-2 transition-all duration-200 ${activeId === m.id ? "opacity-100" : "opacity-30 hover:opacity-70"}`} title={m.title} aria-label={`${m.number} — ${m.title}`} aria-current={activeId === m.id ? "true" : undefined}>
        <span className={`block h-px transition-all duration-200 ${activeId === m.id ? "w-6 bg-neutral-800" : "w-3 bg-neutral-400 group-hover:w-4"}`} />
        <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 hidden group-hover:inline">{m.number}</span>
      </a>
    ))}
  </nav>
));

export const ProtocolPage = () => {
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
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
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveId(entry.target.id); }); }, { rootMargin: "-40% 0px -40% 0px" });
    modules.forEach((m) => { const el = document.getElementById(m.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [modules]);

  const tocModules = useMemo(() => modules.map((m) => ({ id: m.id, number: m.number, title: t(m.titleKey) })), [modules, t]);
  const scrollToTop = useCallback(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans selection:bg-neutral-200 pt-[64px]">
      <motion.div className="fixed top-[64px] left-0 right-0 h-[2px] bg-neutral-800 origin-left z-50" style={{ scaleX }} />
      <TOCNav modules={tocModules} activeId={activeId} />
      <div className="min-h-[55vh] flex flex-col justify-between p-6 md:p-12 lg:p-16 border-b border-neutral-200 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="flex justify-end items-start relative z-10"><div className="hidden md:block text-right font-mono text-[10px] leading-tight text-neutral-300 tracking-widest">{t("protocol.classification")}<br />{t("protocol.encryption")}<br />{t("protocol.auth")}</div></div>
        <div className="max-w-5xl z-10 mt-12 md:mt-0">
          <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-5xl md:text-[7rem] leading-[0.85] tracking-tighter uppercase mb-8 break-words hyphens-auto" style={{ fontWeight: 700 }}>{t("protocol.title")}</motion.h1>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="flex flex-col md:flex-row gap-8 md:items-end border-l-2 border-neutral-300 pl-6"><p className="font-mono text-sm md:text-base max-w-xl uppercase tracking-widest leading-relaxed text-neutral-500">{t("protocol.subtitle")}</p></motion.div>
        </div>
      </div>
      <div className="border-b border-neutral-200 py-12 md:py-20 px-6 md:px-12 lg:px-16 flex flex-col md:flex-row justify-between items-end gap-6 bg-white">
        <div><h2 className="text-4xl md:text-7xl tracking-tighter uppercase leading-none" style={{ fontWeight: 700 }}>{t("protocol.archive.title")}</h2><p className="font-mono text-xs max-w-md uppercase tracking-widest text-neutral-400 mt-4">{t("protocol.archive.desc")} <br />Status: {modules.length} {t("protocol.status.online")}</p></div>
        <div className="flex flex-col items-end gap-2 w-full md:w-auto text-neutral-300"><div className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"><Database className="w-3.5 h-3.5" />{t("protocol.access.readOnly")}</div></div>
      </div>
      <div className="max-w-[100vw] overflow-hidden">{modules.map((m) => <Section key={m.id} id={m.id} number={m.number} title={t(m.titleKey)} desc={t(m.descKey)}><m.Component /></Section>)}</div>
      <div className="p-12 md:p-24 bg-neutral-950 text-white text-center re-invert">
        <h3 className="text-2xl md:text-5xl tracking-tighter uppercase mb-8" style={{ fontWeight: 700 }}>{t("protocol.systemCheck")}</h3>
        <p className="font-mono text-[10px] uppercase tracking-widest mb-12 text-neutral-500">{t("protocol.ready")}</p>
        <button onClick={scrollToTop} className="inline-flex items-center gap-2 border border-white/30 px-8 py-4 hover:bg-white hover:text-black transition-colors uppercase font-mono text-xs tracking-widest">{t("protocol.return")} <ArrowUp className="w-4 h-4" /></button>
      </div>
    </div>
  );
};