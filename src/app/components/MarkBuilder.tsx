import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

const GRID_SIZE = 5;

// Glyphs Database (5x5 Grid)
// 0  1  2  3  4
// 5  6  7  8  9
// 10 11 12 13 14
// 15 16 17 18 19
// 20 21 22 23 24
const GLYPHS: Record<string, { start: number; end: number }[]> = {
    'A': [{start:20,end:10}, {start:10,end:2}, {start:2,end:14}, {start:14,end:24}, {start:11,end:13}],
    'B': [{start:0,end:20}, {start:0,end:2}, {start:2,end:12}, {start:12,end:10}, {start:12,end:14}, {start:14,end:24}, {start:24,end:20}],
    'C': [{start:4,end:0}, {start:0,end:20}, {start:20,end:24}],
    'E': [{start:4,end:0}, {start:0,end:20}, {start:20,end:24}, {start:10,end:13}],
    'F': [{start:20,end:0}, {start:0,end:4}, {start:10,end:13}],
    'H': [{start:0,end:20}, {start:4,end:24}, {start:10,end:14}],
    'I': [{start:1,end:3}, {start:2,end:22}, {start:21,end:23}],
    'K': [{start:0,end:10}, {start:10,end:20}, {start:4,end:11}, {start:11,end:10}, {start:10,end:17}, {start:17,end:24}],
    'L': [{start:0,end:20}, {start:20,end:24}],
    'M': [{start:20,end:0}, {start:0,end:12}, {start:12,end:4}, {start:4,end:24}],
    'N': [{start:20,end:0}, {start:0,end:24}, {start:24,end:4}],
    'O': [{start:0,end:4}, {start:4,end:24}, {start:24,end:20}, {start:20,end:0}],
    'P': [{start:20,end:0}, {start:0,end:4}, {start:4,end:14}, {start:14,end:10}],
    'R': [{start:20,end:0}, {start:0,end:4}, {start:4,end:14}, {start:14,end:10}, {start:12,end:24}],
    'S': [{start:4,end:0}, {start:0,end:10}, {start:10,end:14}, {start:14,end:24}, {start:24,end:20}],
    'T': [{start:0,end:4}, {start:2,end:22}],
    'U': [{start:0,end:20}, {start:20,end:24}, {start:24,end:4}],
    'V': [{start:0,end:22}, {start:22,end:4}],
    'W': [{start:0,end:20}, {start:20,end:12}, {start:12,end:24}, {start:24,end:4}],
    'X': [{start:0,end:24}, {start:4,end:20}],
    'Y': [{start:0,end:12}, {start:4,end:12}, {start:12,end:22}],
    'Z': [{start:0,end:4}, {start:4,end:20}, {start:20,end:24}],
};

// Helper: Check if two segments are the same
const areSegmentsEqual = (s1: { start: number, end: number }, s2: { start: number, end: number }) => {
  return (s1.start === s2.start && s1.end === s2.end) || 
         (s1.start === s2.end && s1.end === s2.start);
};

const MarkBuilder = () => {
  const { t } = useLanguage();
  const [lines, setLines] = useState<{ start: number; end: number }[]>([]);
  const [currentGlyph, setCurrentGlyph] = useState<string>("");
  const [dotSpacing, setDotSpacing] = useState(80);
  
  // Interaction State
  const [drawingSource, setDrawingSource] = useState<number | null>(null);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Logic ---
  const generateGlyph = (glyphChar?: string) => {
    const keys = Object.keys(GLYPHS);
    let newKey = glyphChar;
    
    if (!newKey) {
        newKey = keys[Math.floor(Math.random() * keys.length)];
        // Avoid repeating the same glyph immediately if possible
        if (newKey === currentGlyph && keys.length > 1) {
            const otherKeys = keys.filter(k => k !== currentGlyph);
            newKey = otherKeys[Math.floor(Math.random() * otherKeys.length)];
        }
    }

    if (newKey) {
        setCurrentGlyph(newKey);
        setLines([]);
        // Cancel any active drawing
        setDrawingSource(null);

        // Animate stroke by stroke
        const glyphLines = GLYPHS[newKey];
        let addedLines: { start: number; end: number }[] = [];
        
        glyphLines.forEach((line, index) => {
            setTimeout(() => {
                addedLines = [...addedLines, line];
                setLines([...addedLines]); 
            }, index * 150); // Slower animation for better effect
        });
    }
  };

  // Initial Load and Resize Handler
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 400) {
              setDotSpacing(60);
          } else if (window.innerWidth < 640) {
              setDotSpacing(70);
          } else {
              setDotSpacing(80);
          }
      };
      
      handleResize();
      window.addEventListener('resize', handleResize);

      // Small delay to ensure hydration/render
      setTimeout(() => {
          generateGlyph('K'); // Default to K for Kinetic
      }, 500);
      
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clear = () => {
      setLines([]);
      setCurrentGlyph("");
      setDrawingSource(null);
  };

  // Interaction Handlers
  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (drawingSource === null) {
        // Start drawing
        setDrawingSource(index);
    } else if (drawingSource === index) {
        // Clicked same dot -> Cancel/Finish current segment
        setDrawingSource(null);
    } else {
        // Complete line
        const newLine = { start: drawingSource, end: index };
        
        // Check if exists to toggle
        const existsIndex = lines.findIndex(l => areSegmentsEqual(l, newLine));
        if (existsIndex >= 0) {
            // Remove existing
            const newLines = [...lines];
            newLines.splice(existsIndex, 1);
            setLines(newLines);
        } else {
            // Add new
            setLines([...lines, newLine]);
        }
        
        // Continue drawing from this new point (Polyline mode)
        setDrawingSource(index);
        setCurrentGlyph(""); // Clear glyph name if user modifies it manually
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    }
  };

  // Global click to cancel drawing if clicking outside dots
  useEffect(() => {
      const handleGlobalClick = (e: MouseEvent) => {
          // If clicking outside the container or on empty space in container
          // we might want to cancel drawing
          if (drawingSource !== null) {
               const target = e.target as HTMLElement;
               // If we clicked a dot, handleDotClick takes care of it (due to bubbling or logic)
               // But if we clicked whitespace, let's cancel
               if (!target.closest('[data-dot="true"]')) {
                   setDrawingSource(null);
               }
          }
      };
      
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
  }, [drawingSource]);


  const getCoord = (index: number) => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      return { x: col * dotSpacing, y: row * dotSpacing };
  };

  // --- Render Parts ---
  const Controls = () => (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 w-full">
        <button 
            onClick={(e) => { e.stopPropagation(); generateGlyph(); }}
            className="h-12 px-8 bg-black text-white flex items-center justify-center gap-3 hover:bg-neutral-800 active:scale-95 transition-all duration-200 group w-full md:w-auto"
        >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">Generate / RND</span>
        </button>
        
        <button 
            onClick={(e) => { e.stopPropagation(); clear(); }}
            className="h-12 px-8 border border-black bg-white text-black flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 transition-all duration-200 group w-full md:w-auto"
        >
            <Trash2 className="w-3 h-3" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">{t('compare.clear')}</span>
        </button>
    </div>
  );

  const FooterInfo = () => (
    <div className="flex justify-between items-end font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
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
    <section className="relative bg-white border-b border-black overflow-hidden flex flex-col w-full">
      <div className="flex flex-col lg:flex-row min-h-[600px] w-full">
        
        {/* LEFT COLUMN (Desktop): Interface */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-black flex flex-col justify-between bg-white relative z-10">
            <div className="flex flex-col items-start max-w-xl">
                {/* Title */}
                <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold uppercase tracking-tighter mb-8 leading-[0.8]">
                    {t('compare.construct')}
                </h2>
                
                {/* Description */}
                <p className="text-neutral-500 text-sm font-mono uppercase tracking-wide leading-relaxed mb-12 max-w-md">
                   {t('manifesto.method.s3.desc')}
                </p>
            
                {/* Desktop Only Controls */}
                <div className="hidden lg:block w-full">
                    <Controls />
                </div>
            </div>

            {/* Desktop Only Footer Info */}
            <div className="hidden lg:block mt-16 pt-8 border-t border-black/10">
                 <FooterInfo />
            </div>
        </div>

        {/* RIGHT COLUMN: Canvas */}
        <div 
            className="w-full lg:w-1/2 min-h-[400px] lg:min-h-auto relative bg-white flex items-center justify-center select-none overflow-hidden border-b border-black lg:border-none"
            onMouseMove={handleMouseMove}
        >
            {/* Canvas Container */}
            <div 
                className="relative z-10 transition-all duration-300" 
                ref={containerRef}
                style={{ 
                    width: (GRID_SIZE - 1) * dotSpacing, 
                    height: (GRID_SIZE - 1) * dotSpacing 
                }}
            >
                {/* SVG Layer */}
                <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 0, left: 0, top: 0 }}>
                    <AnimatePresence>
                        {lines.map((line, i) => {
                             const start = getCoord(line.start);
                             const end = getCoord(line.end);
                             return (
                                 <motion.line
                                     key={`${line.start}-${line.end}-${i}`}
                                     x1={start.x}
                                     y1={start.y}
                                     x2={end.x}
                                     y2={end.y}
                                     stroke="black"
                                     strokeWidth="4.5"
                                     strokeLinecap="square"
                                     initial={{ pathLength: 0, opacity: 0 }}
                                     animate={{ pathLength: 1, opacity: 1 }}
                                     exit={{ opacity: 0 }}
                                     transition={{ duration: 0.3, ease: "circOut" }}
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
                {/* Dots Grid */}
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                     const { x, y } = getCoord(i);
                     const isActive = drawingSource === i; 
                     const isConnected = lines.some(l => l.start === i || l.end === i);
                     const isHovered = hoveredDot === i;
                     return (
                         <div
                             key={i}
                             data-dot="true"
                             onClick={(e) => handleDotClick(i, e)}
                             onMouseEnter={() => setHoveredDot(i)}
                             onMouseLeave={() => setHoveredDot(null)}
                             className="absolute flex items-center justify-center group cursor-pointer"
                             style={{ 
                                 left: x, 
                                 top: y,
                                 width: 40, 
                                 height: 40,
                                 transform: 'translate(-50%, -50%)'
                             }}
                         >
                             <div 
                                className={`rounded-full transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-black w-4 h-4 ring-4 ring-black/10' 
                                        : (isConnected || isHovered) 
                                            ? 'bg-black w-3 h-3' 
                                            : 'bg-neutral-200 w-1.5 h-1.5'
                                }`}
                             />
                             {!isActive && (
                                 <div className="absolute w-8 h-8 rounded-full border border-black/10 scale-0 group-hover:scale-100 transition-transform duration-200 pointer-events-none" />
                             )}
                         </div>
                     );
                })}
            </div>
            {/* Coordinate Markers */}
            <div className="absolute top-8 left-8 font-mono text-[9px] text-neutral-300 pointer-events-none">0,0</div>
            <div className="absolute bottom-8 right-8 font-mono text-[9px] text-neutral-300 pointer-events-none">{GRID_SIZE-1},{GRID_SIZE-1}</div>
        </div>
        
        {/* MOBILE ONLY: Controls & Footer (Appears AFTER Canvas) */}
        <div className="lg:hidden p-8 bg-white flex flex-col gap-8">
             <Controls />
             <div className="pt-8 border-t border-black/10">
                <FooterInfo />
             </div>
        </div>

      </div>
    </section>
  );
};

export default MarkBuilder;