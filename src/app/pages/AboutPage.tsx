import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, useScroll, useTransform, useMotionValue } from "motion/react";
import { Scan, Grid, Layers, Box, Send, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import sergeiPhoto from "../../assets/about-portrait.webp";
import MarkBuilder from "@/components/MarkBuilder";

interface AboutPageProps {
  onNavigateHome?: () => void;
}

// --- HERO KINETIC LETTER (memoized, rAF-throttled) ---
const HeroLetter = memo(({ char, mouseX, mouseY }: { char: string; mouseX: any; mouseY: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [weight, setWeight] = useState(800);

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX.get() - cx, mouseY.get() - cy);
      const radius = 800;
      if (dist < radius) {
        const factor = 1 - dist / radius;
        setWeight(800 - factor * 700);
      } else {
        setWeight(800);
      }
    };

    const throttledUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    const uX = mouseX.on("change", throttledUpdate);
    const uY = mouseY.on("change", throttledUpdate);
    return () => { uX(); uY(); cancelAnimationFrame(rafRef.current); };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className="inline-block select-none text-black"
      style={{
        fontWeight: Math.round(weight),
        fontVariationSettings: `"wght" ${Math.round(weight)}`,
        willChange: "font-variation-settings",
        transition: "font-variation-settings 60ms linear",
      }}
    >
      {char}
    </div>
  );
});

// --- KINETIC LETTER for "SYSTEM" block ---
const KineticLetter = memo(({ char, mouseX, mouseY }: { char: string; mouseX: any; mouseY: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [weight, setWeight] = useState(100);
  const [slant, setSlant] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX.get() - cx, mouseY.get() - cy);
      const radius = 400;
      if (dist < radius) {
        const factor = 1 - dist / radius;
        setWeight(100 + factor * 800);
        setSlant((mouseX.get() - cx) * 0.05);
      } else {
        setWeight(100);
        setSlant(0);
      }
    };

    const throttledUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    const uX = mouseX.on("change", throttledUpdate);
    const uY = mouseY.on("change", throttledUpdate);
    return () => { uX(); uY(); cancelAnimationFrame(rafRef.current); };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className="text-[15vw] leading-none select-none"
      style={{
        fontWeight: Math.round(weight),
        fontVariationSettings: `"wght" ${Math.round(weight)}, "slnt" ${slant.toFixed(1)}`,
        transform: `skewX(${-slant}deg)`,
        willChange: "font-variation-settings, transform",
        transition: "font-variation-settings 60ms linear, transform 60ms linear",
      }}
    >
      {char}
    </div>
  );
});

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigateHome }) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const yHero = useTransform(scrollYProgress, [0, 0.15], [0, 80]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  const handleCtaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) onNavigateHome();
    else window.location.href = "/";
  }, [onNavigateHome]);

  const heroLetters1 = useMemo(() => ["T", "Y", "P", "E"], []);
  const heroLetters2 = useMemo(() => ["I", "S"], []);
  const systemLetters = useMemo(() => ["S", "Y", "S", "T", "E", "M"], []);

  const methodSteps = useMemo(() => [
    { title: t('manifesto.method.s1.title'), desc: t('manifesto.method.s1.desc'), icon: Scan },
    { title: t('manifesto.method.s2.title'), desc: t('manifesto.method.s2.desc'), icon: Grid },
    { title: t('manifesto.method.s3.title'), desc: t('manifesto.method.s3.desc'), icon: Layers },
    { title: t('manifesto.method.s4.title'), desc: t('manifesto.method.s4.desc'), icon: Box },
  ], [t]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-200 overflow-x-hidden relative"
    >
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[80vh] md:min-h-screen flex flex-col overflow-hidden">
        <div className="relative z-10 flex flex-col flex-grow p-6 md:p-12 lg:p-16">
          <motion.div
            style={{ y: yHero, opacity: opacityHero }}
            className="flex-grow flex flex-col justify-center items-start w-full"
          >
            <div className="text-[35vw] md:text-[22vw] leading-[0.75] uppercase tracking-tighter text-black select-none flex flex-col w-full cursor-crosshair">
              <div className="flex justify-start w-full">
                {heroLetters1.map((char, i) => (
                  <HeroLetter key={`h1-${i}`} char={char} mouseX={mouseX} mouseY={mouseY} />
                ))}
              </div>
              <div className="flex justify-start ml-2 md:ml-12 font-serif italic text-[35vw] md:text-[22vw] w-full">
                {heroLetters2.map((char, i) => (
                  <HeroLetter key={`h2-${i}`} char={char} mouseX={mouseX} mouseY={mouseY} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Bottom bar */}
          <div className="w-full mt-12 md:mt-24 relative">
            <div className="w-full md:w-64 h-px bg-neutral-300 mb-4" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 max-w-xs leading-relaxed">
                {t('manifesto.agency.desc').slice(0, 60) || "Индустриальный индекс открытой типографики."}
              </p>
              <div className="md:hidden font-mono text-[10px] text-neutral-300 tracking-widest">
                SCROLL ↓
              </div>
            </div>
          </div>
        </div>

        {/* Soft gradient bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
      </section>

      {/* ═══════════ STATEMENT ═══════════ */}
      <section className="py-20 md:py-32 px-6 md:px-12 lg:px-16">
        <h2 className="text-3xl md:text-[5.5vw] leading-[1.05] tracking-tighter text-neutral-800">
          "{t('manifesto.impact.desc')}"
        </h2>
        <div className="mt-8 md:mt-12 flex justify-end">
          <p className="text-sm md:text-lg text-neutral-400 font-mono tracking-wide">— ONOD Fonts</p>
        </div>
      </section>

      {/* ═══════════ ARCHITECT ═══════════ */}
      <section className="relative w-full bg-neutral-950 text-white overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 lg:min-h-[90vh]">
          {/* Left: Info */}
          <div className="p-6 md:p-12 lg:p-16 flex flex-col justify-between order-2 lg:order-1 min-h-[50vh] lg:min-h-0">
            <div>
              <span className="inline-block px-3 py-1.5 border border-white/20 font-mono text-[10px] uppercase tracking-widest mb-10 text-white/60">
                {t('manifesto.agency.architect_label')}
              </span>
              <h3 className="text-4xl md:text-6xl lg:text-7xl tracking-tighter mb-8 leading-[0.95]" style={{ fontWeight: 700 }}>
                {t('manifesto.agency.headline_1')}<br />
                <span className="text-neutral-500">{t('manifesto.agency.headline_connect')}</span><br />
                {t('manifesto.agency.headline_2')}
              </h3>
              <p className="text-neutral-400 text-sm md:text-base max-w-md leading-relaxed">
                {t('manifesto.agency.desc')}
              </p>
            </div>

            <div className="flex flex-col gap-6 mt-16">
              <a
                href="https://t.me/imonsergei"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between border-b border-white/10 pb-5 hover:border-white/40 transition-colors"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors">
                  {t('manifesto.agency.link_contact')}
                </span>
                <div className="flex items-center gap-3 text-lg group-hover:translate-x-1 transition-transform" style={{ fontWeight: 600 }}>
                  TELEGRAM <Send className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>

          {/* Right: Photo */}
          <div className="relative order-1 lg:order-2 h-[50vh] lg:h-auto overflow-hidden group">
            <div className="absolute inset-0">
              <div className="w-full h-full scale-x-[-1]">
                <img
                  src={sergeiPhoto}
                  alt="Sergei Otcheskov"
                  loading="lazy"
                  className="w-full h-full object-cover grayscale contrast-[1.1] brightness-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                />
              </div>
            </div>

            {/* Overlaid name */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-12 mix-blend-difference pointer-events-none z-20">
              <div className="flex justify-between items-start">
                <Scan className="w-6 h-6 text-white opacity-30" />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Fig. 01</span>
              </div>
              <h2 className="text-white text-[12vw] lg:text-[8vw] leading-[0.8] uppercase tracking-tighter text-right" style={{ fontWeight: 700 }}>
                Sergei<br />Otcheskov
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ METHODOLOGY ═══════════ */}
      <section className="bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {methodSteps.map((step, i) => (
            <div
              key={i}
              className={`relative p-6 md:p-8 border-b sm:border-b-0 ${i !== 3 ? "sm:border-r border-neutral-200" : ""} group hover:bg-neutral-950 hover:text-white transition-colors duration-300 flex flex-col`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-300 group-hover:text-neutral-500 transition-colors">
                  0{i + 1}
                </span>
                <step.icon className="w-5 h-5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
              </div>
              <h3 className="text-lg md:text-xl uppercase mb-3 tracking-tighter" style={{ fontWeight: 700 }}>
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-400 group-hover:text-neutral-500 transition-colors mt-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ KINETIC VARIABLE ═══════════ */}
      <section className="relative h-[50vh] min-h-[400px] md:h-[550px] bg-neutral-50 overflow-hidden flex flex-col items-center justify-center cursor-crosshair group border-t border-neutral-200">
        <div className="flex justify-center items-center gap-1 md:gap-4 w-full overflow-hidden px-2 md:px-4">
          {systemLetters.map((char, i) => (
            <KineticLetter key={i} char={char} mouseX={mouseX} mouseY={mouseY} />
          ))}
        </div>
        <p className="mt-8 md:mt-12 font-mono text-[10px] md:text-xs uppercase tracking-widest text-neutral-300">
          Variable Weight Axis [100 — 900]
        </p>

        {/* Corner marks */}
        <Plus className="absolute top-6 left-6 w-3 h-3 text-neutral-200" />
        <Plus className="absolute top-6 right-6 w-3 h-3 text-neutral-200" />
        <Plus className="absolute bottom-6 left-6 w-3 h-3 text-neutral-200" />
        <Plus className="absolute bottom-6 right-6 w-3 h-3 text-neutral-200" />
      </section>

      {/* ══════════ MARK BUILDER ═══════════ */}
      <MarkBuilder />

      {/* ═══════════ TICKER ═══════════ */}
      <div className="bg-neutral-950 text-white py-4 overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite]">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 font-mono text-xs uppercase tracking-widest mx-8" style={{ fontWeight: 600 }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} className="flex items-center gap-8">
                  <span>Typography is not just reading. It is seeing.</span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full shrink-0" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════ CTA ═══════════ */}
      <section className="bg-white text-neutral-900 relative w-full">
        <button
          onClick={handleCtaClick}
          className="relative w-full py-24 md:py-40 flex flex-col items-center justify-center group overflow-hidden"
          aria-label="Open catalog"
        >
          <div className="absolute inset-0 bg-neutral-950 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-0" />
          <div className="relative z-10 flex flex-col items-center group-hover:text-white transition-colors duration-300">
            <span className="block font-mono text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-8 text-neutral-400 group-hover:text-neutral-500 transition-colors">
              Ready for deployment
            </span>
            <h2 className="text-[15vw] md:text-[12vw] leading-none tracking-tighter" style={{ fontWeight: 700 }}>
              {t('manifesto.cta')}
            </h2>
          </div>
        </button>
      </section>
    </div>
  );
};