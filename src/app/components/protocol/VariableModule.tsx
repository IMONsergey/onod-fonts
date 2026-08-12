import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export const VariableModule = () => {
  const { t } = useLanguage();
  const [weight, setWeight] = useState(400);
  const [width, setWidth] = useState(100);
  const [slant, setSlant] = useState(0);

  return (
    <div className="w-full border border-neutral-200 p-4 md:p-8 flex flex-col gap-6 md:gap-8 bg-white">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 border-b border-neutral-200 pb-4">
        <div><h3 className="font-mono text-[10px] md:text-xs uppercase tracking-widest mb-2">Module 03 // Fluidity</h3><h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter">Variable Axes</h4></div>
        <div className="font-mono text-[10px] md:text-xs md:text-right"><div>{t('module.variable.axis')}</div><div>{t('module.variable.interpolation')}</div></div>
      </div>

      <div className="min-h-[250px] md:min-h-[300px] flex items-center justify-center border border-neutral-200 bg-neutral-50 overflow-hidden relative">
        <div className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] leading-none text-center mix-blend-darken z-10 transition-transform duration-150" style={{ fontWeight: weight, fontStretch: `${width}%`, fontStyle: slant > 0 ? 'italic' : 'normal', transform: `scaleX(${width / 100}) skewX(-${slant}deg)` }}>Aa</div>
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 pointer-events-none opacity-5">{Array.from({ length: 100 }).map((_, index) => <div key={index} className="border-[0.5px] border-black" />)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 font-mono text-xs">
        <AxisControl id="variable-weight" label={t('module.variable.weight')} value={weight} suffix="" min={100} max={900} onChange={setWeight} />
        <AxisControl id="variable-width" label={t('module.variable.width')} value={width} suffix="%" min={50} max={150} onChange={setWidth} />
        <AxisControl id="variable-slant" label={t('module.variable.slant')} value={slant} suffix="°" min={0} max={20} onChange={setSlant} />
      </div>
    </div>
  );
};

const AxisControl = ({ id, label, value, suffix, min, max, onChange }: { id: string; label: string; value: number; suffix: string; min: number; max: number; onChange: (value: number) => void }) => (
  <div className="space-y-2"><label htmlFor={id} className="flex justify-between uppercase tracking-widest text-[10px] md:text-xs"><span>{label}</span><span>{value}{suffix}</span></label><input id={id} type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} className="w-full h-2 bg-neutral-200 appearance-none cursor-pointer accent-black" /></div>
);
