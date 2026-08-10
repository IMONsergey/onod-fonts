import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

const GRID_SIZE = 5;
type Segment = { start: number; end: number };

// 5x5 vector glyph recipes. Grid indices run left-to-right, top-to-bottom.
const GLYPHS: Record<string, Segment[]> = {
  A: [{ start: 20, end: 10 }, { start: 10, end: 2 }, { start: 2, end: 14 }, { start: 14, end: 24 }, { start: 11, end: 13 }],
  B: [{ start: 0, end: 20 }, { start: 0, end: 2 }, { start: 2, end: 12 }, { start: 12, end: 10 }, { start: 12, end: 14 }, { start: 14, end: 24 }, { start: 24, end: 20 }],
  C: [{ start: 4, end: 0 }, { start: 0, end: 20 }, { start: 20, end: 24 }],
  E: [{ start: 4, end: 0 }, { start: 0, end: 20 }, { start: 20, end: 24 }, { start: 10, end: 13 }],
  F: [{ start: 20, end: 0 }, { start: 0, end: 4 }, { start: 10, end: 13 }],
  H: [{ start: 0, end: 20 }, { start: 4, end: 24 }, { start: 10, end: 14 }],
  I: [{ start: 1, end: 3 }, { start: 2, end: 22 }, { start: 21, end: 23 }],
  K: [{ start: 0, end: 10 }, { start: 10, end: 20 }, { start: 4, end: 11 }, { start: 11, end: 10 }, { start: 10, end: 17 }, { start: 17, end: 24 }],
  L: [{ start: 0, end: 20 }, { start: 20, end: 24 }],
  M: [{ start: 20, end: 0 }, { start: 0, end: 12 }, { start: 12, end: 4 }, { start: 4, end: 24 }],
  N: [{ start: 20, end: 0 }, { start: 0, end: 24 }, { start: 24, end: 4 }],
  O: [{ start: 0, end: 4 }, { start: 4, end: 24 }, { start: 24, end: 20 }, { start: 20, end: 0 }],
  P: [{ start: 20, end: 0 }, { start: 0, end: 4 }, { start: 4, end: 14 }, { start: 14, end: 10 }],
  R: [{ start: 20, end: 0 }, { start: 0, end: 4 }, { start: 4, end: 14 }, { start: 14, end: 10 }, { start: 12, end: 24 }],
  S: [{ start: 4, end: 0 }, { start: 0, end: 10 }, { start: 10, end: 14 }, { start: 14, end: 24 }, { start: 24, end: 20 }],
  T: [{ start: 0, end: 4 }, { start: 2, end: 22 }],
  U: [{ start: 0, end: 20 }, { start: 20, end: 24 }, { start: 24, end: 4 }],
  V: [{ start: 0, end: 22 }, { start: 22, end: 4 }],
  W: [{ start: 0, end: 20 }, { start: 20, end: 12 }, { start: 12, end: 24 }, { start: 24, end: 4 }],
  X: [{ start: 0, end: 24 }, { start: 4, end: 20 }],
  Y: [{ start: 0, end: 12 }, { start: 4, end: 12 }, { start: 12, end: 22 }],
  Z: [{ start: 0, end: 4 }, { start: 4, end: 20 }, { start: 20, end: 24 }],
};

const areSegmentsEqual = (a: Segment, b: Segment) =>
  (a.start === b.start && a.end === b.end) || (a.start === b.end && a.end === b.start);

const MarkBuilder = () => {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [lines, setLines] = useState<Segment[]>([]);
  const [currentGlyph, setCurrentGlyph] = useState('');
  const [dotSpacing, setDotSpacing] = useState(80);
  const [drawingSource, setDrawingSource] = useState<number | null>(null);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimers = useRef<number[]>([]);

  const clearAnimationTimers = () => {
    animationTimers.current.forEach(timer => window.clearTimeout(timer));
    animationTimers.current = [];
  };

  const generateGlyph = (glyphChar?: string) => {
    clearAnimationTimers();
    const keys = Object.keys(GLYPHS);
    let nextKey = glyphChar;

    if (!nextKey) {
      const candidates = keys.length > 1 ? keys.filter(key => key !== currentGlyph) : keys;
      nextKey = candidates[Math.floor(Math.random() * candidates.length)];
    }

    if (!nextKey || !GLYPHS[nextKey]) return;

    setCurrentGlyph(nextKey);
    setLines([]);
    setDrawingSource(null);
    const glyphLines = GLYPHS[nextKey];

    if (prefersReducedMotion) {
      setLines(glyphLines);
      return;
    }

    glyphLines.forEach((line, index) => {
      const timer = window.setTimeout(() => {
        setLines(previous => [...previous, line]);
      }, index * 150);
      animationTimers.current.push(timer);
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 400) setDotSpacing(60);
      else if (window.innerWidth < 640) setDotSpacing(70);
      else setDotSpacing(80);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const initialTimer = window.setTimeout(() => generateGlyph('K'), prefersReducedMotion ? 0 : 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(initialTimer);
      clearAnimationTimers();
    };
    // The initial glyph should run once per mounted builder. Reduced-motion behavior is read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawingSource !== null) {
        setDrawingSource(null);
        setHoveredDot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingSource]);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (drawingSource === null) return;
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dot="true"]')) setDrawingSource(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [drawingSource]);

  const clear = () => {
    clearAnimationTimers();
    setLines([]);
    setCurrentGlyph('');
    setDrawingSource(null);
    setHoveredDot(null);
  };

  const handleDotPress = (index: number) => {
    if (drawingSource === null) {
      setDrawingSource(index);
      return;
    }

    if (drawingSource === index) {
      setDrawingSource(null);
      return;
    }

    const segment = { start: drawingSource, end: index };
    setLines(previous => {
      const existingIndex = previous.findIndex(line => areSegmentsEqual(line, segment));
      if (existingIndex < 0) return [...previous, segment];
      return previous.filter((_, lineIndex) => lineIndex !== existingIndex);
    });
    setDrawingSource(index);
    setCurrentGlyph('');
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const getCoord = (index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return { x: col * dotSpacing, y: row * dotSpacing };
  };

  const getDotLabel = (index: number) => {
    const row = Math.floor(index / GRID_SIZE) + 1;
    const column = (index % GRID_SIZE) + 1;
    if (drawingSource === index) return `Grid point row ${row}, column ${column}; drawing start. Press again to cancel segment.`;
    if (drawingSource !== null) return `Grid point row ${row}, column ${column}; connect from selected point.`;
    return `Grid point row ${row}, column ${column}; start drawing.`;
  };

  const Controls = () => (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full">
      <button
        type="button"
        onClick={event => { event.stopPropagation(); generateGlyph(); }}
        className="h-12 px-8 bg-black text-white flex items-center justify-center gap-3 hover:bg-neutral-800 active:scale-95 transition-all duration-200 group w-full md:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Generate / RND</span>
      </button>

      <button
        type="button"
        onClick={event => { event.stopPropagation(); clear(); }}
        className="h-12 px-8 border border-black bg-white text-black flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 transition-all duration-200 group w-full md:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <Trash2 className="w-3 h-3" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">{t('compare.clear')}</span>
      </button>
    </div>
  );

  const FooterInfo = () => (
    <div className="flex justify-between items-end font-mono text-[9px] text-neutral-400 uppercase tracking-widest" aria-live="polite">
      <div className="flex flex-col gap-1">
        <span>Grid: 5x5 Cartesian</span>
        <span>Mode: {drawingSource !== null ? 'DRAWING' : (lines.length > 0 ? 'ACTIVE' : 'IDLE')}</span>
      </div>
      <div className="flex items-center gap-4">
        {currentGlyph && <span className="text-black font-bold">Symbol: {currentGlyph}</span>}
        <span>Vectors: {lines.length}</span>
      </div>
    </div>
  );

  return (
    <section className="relative bg-white border-b border-black overflow-hidden flex flex-col w-full" aria-labelledby="mark-builder-title">
      <div className="flex flex-col lg:flex-row min-h-[600px] w-full">
        <div className="w-full lg:w-1/2 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-black flex flex-col justify-between bg-white relative z-10">
          <div className="flex flex-col items-start max-w-xl">
            <h2 id="mark-builder-title" className="text-6xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter mb-8 leading-[0.8]">
              {t('compare.construct')}
            </h2>
            <p className="text-neutral-500 text-sm font-mono uppercase tracking-wide leading-relaxed mb-4 max-w-md">
              {t('manifesto.method.s3.desc')}
            </p>
            <p id="mark-builder-instructions" className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mb-12 max-w-md">
              Select one grid point, then another to toggle a vector. Continue from the active point or press Escape to cancel.
            </p>
            <div className="hidden lg:block w-full"><Controls /></div>
          </div>
          <div className="hidden lg:block mt-16 pt-8 border-t border-black/10"><FooterInfo /></div>
        </div>

        <div
          className="w-full lg:w-1/2 min-h-[400px] lg:min-h-auto relative bg-white flex items-center justify-center select-none overflow-hidden border-b border-black lg:border-none"
          onMouseMove={handleMouseMove}
        >
          <div
            className="relative z-10 transition-all duration-300"
            ref={containerRef}
            role="group"
            aria-label="5 by 5 vector drawing grid"
            aria-describedby="mark-builder-instructions"
            style={{ width: (GRID_SIZE - 1) * dotSpacing, height: (GRID_SIZE - 1) * dotSpacing }}
          >
            <svg className="absolute inset-0 overflow-visible pointer-events-none" aria-hidden="true" style={{ zIndex: 0, left: 0, top: 0 }}>
              <AnimatePresence>
                {lines.map((line, index) => {
                  const start = getCoord(line.start);
                  const end = getCoord(line.end);
                  return (
                    <motion.line
                      key={`${line.start}-${line.end}-${index}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="black"
                      strokeWidth="4.5"
                      strokeLinecap="square"
                      initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'circOut' }}
                    />
                  );
                })}
              </AnimatePresence>
              {drawingSource !== null && (
                <line
                  x1={getCoord(drawingSource).x}
                  y1={getCoord(drawingSource).y}
                  x2={hoveredDot !== null ? getCoord(hoveredDot).x : mousePos.x}
                  y2={hoveredDot !== null ? getCoord(hoveredDot).y : mousePos.y}
                  stroke="black"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="opacity-50"
                />
              )}
            </svg>

            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const { x, y } = getCoord(index);
              const isActive = drawingSource === index;
              const isConnected = lines.some(line => line.start === index || line.end === index);
              const isHovered = hoveredDot === index;
              return (
                <button
                  key={index}
                  type="button"
                  data-dot="true"
                  aria-label={getDotLabel(index)}
                  aria-pressed={isActive}
                  onClick={event => { event.stopPropagation(); handleDotPress(index); }}
                  onPointerEnter={() => setHoveredDot(index)}
                  onPointerLeave={() => setHoveredDot(null)}
                  className="absolute flex items-center justify-center group cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  style={{ left: x, top: y, width: 40, height: 40, transform: 'translate(-50%, -50%)' }}
                >
                  <span
                    aria-hidden="true"
                    className={`rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-black w-4 h-4 ring-4 ring-black/10'
                        : (isConnected || isHovered)
                          ? 'bg-black w-3 h-3'
                          : 'bg-neutral-200 w-1.5 h-1.5'
                    }`}
                  />
                  {!isActive && <span aria-hidden="true" className="absolute w-8 h-8 rounded-full border border-black/10 scale-0 group-hover:scale-100 group-focus-visible:scale-100 transition-transform duration-200 pointer-events-none" />}
                </button>
              );
            })}
          </div>

          <div className="absolute top-8 left-8 font-mono text-[9px] text-neutral-300 pointer-events-none" aria-hidden="true">0,0</div>
          <div className="absolute bottom-8 right-8 font-mono text-[9px] text-neutral-300 pointer-events-none" aria-hidden="true">{GRID_SIZE - 1},{GRID_SIZE - 1}</div>
        </div>

        <div className="lg:hidden p-8 bg-white flex flex-col gap-8">
          <Controls />
          <div className="pt-8 border-t border-black/10"><FooterInfo /></div>
        </div>
      </div>
    </section>
  );
};

export default MarkBuilder;
