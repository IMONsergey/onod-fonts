import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const LicensePage = () => {
  const { language } = useLanguage();
  const backLabel = language === 'ru' ? 'Назад' : 'Back';

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {backLabel}
        </Link>
        <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>Лицензия</h1>
        <div className="h-px bg-neutral-200 mb-12" />
        <div className="space-y-8 font-serif text-lg leading-relaxed text-neutral-800">
          <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">Open Source Philosophy</h2><p>ONOD Fonts — это агрегатор открытого программного обеспечения. Мы верим в свободный веб. Все шрифты, размещенные в нашем каталоге, распространяются под свободными лицензиями.</p></section>
          <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">Типы Лицензий</h2><ul className="list-disc pl-6 space-y-4"><li><strong>SIL Open Font License (OFL):</strong> Разрешает использование, модификацию и распространение, но запрещает продажу самого файла шрифта.</li><li><strong>Apache License 2.0:</strong> Позволяет использование в коммерческих целях, модификацию и распространение.</li><li><strong>MIT License:</strong> Максимально пермиссивная лицензия. Делайте что хотите, но сохраняйте копирайт.</li></ul></section>
          <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">Правообладатели</h2><p>Все права на шрифты принадлежат их авторам. Имена авторов и ссылки на оригинальные источники указаны в карточке каждого шрифта. ONOD Fonts не присваивает авторство представленных работ.</p></section>
          <div className="pt-12 border-t border-neutral-200 mt-12"><p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">ONOD Fonts</p></div>
        </div>
      </div>
    </div>
  );
};