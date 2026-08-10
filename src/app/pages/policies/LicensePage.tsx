import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const LicensePage = () => {
  const { language } = useLanguage();
  const ru = language === 'ru';

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {ru ? 'Назад' : 'Back'}
        </Link>
        <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>{ru ? 'Лицензии шрифтов' : 'Typeface licensing'}</h1>
        <div className="h-px bg-neutral-200 mb-12" />

        <div className="space-y-9 font-serif text-lg leading-relaxed text-neutral-800">
          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '1. Что делает ONOD Fonts' : '1. What ONOD Fonts does'}</h2>
            <p>{ru
              ? 'ONOD Fonts — каталог и инструмент предпросмотра. Каталог не меняет лицензию гарнитуры и не передаёт пользователю дополнительных прав на шрифт.'
              : 'ONOD Fonts is a catalog and preview tool. The catalog does not change a typeface license or grant additional rights to use the font.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '2. Подтверждённые данные' : '2. Verified metadata'}</h2>
            <p>{ru
              ? 'Если карточка помечена VERIFIED / UPSTREAM VERIFIED, отображаемый идентификатор лицензии и связанные метаданные получены из зафиксированного первичного источника. Ссылка «Источник» ведёт к исходному проекту или провайдеру, когда такой URL доступен.'
              : 'When a card is marked VERIFIED / UPSTREAM VERIFIED, the displayed license identifier and related metadata come from a versioned upstream source. The Source action points to the originating project or provider when that URL is available.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '3. Неподтверждённые данные' : '3. Unverified metadata'}</h2>
            <p>{ru
              ? 'META?, «Verify at source» и общая метка Open Source означают, что конкретные условия ещё не подтверждены в нашей базе. Эти обозначения нельзя трактовать как разрешение на коммерческое использование, модификацию, встраивание или распространение файлов.'
              : 'META?, “Verify at source”, and the generic Open Source label mean that exact terms have not yet been verified in our dataset. These labels must not be treated as permission for commercial use, modification, embedding, or redistribution.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '4. Использование и распространение' : '4. Use and redistribution'}</h2>
            <p>{ru
              ? 'Перед использованием гарнитуры в проекте проверяйте актуальный текст лицензии у правообладателя или исходного провайдера. Особенно отдельно проверяйте право на распространение самих font-файлов: бесплатное использование шрифта и право перераспространять его файлы — не одно и то же.'
              : 'Before using a typeface in a project, verify the current license text with the rights holder or originating provider. Check redistribution rights separately: permission to use a font does not automatically mean permission to redistribute its files.'}</p>
          </section>

          <div className="pt-12 border-t border-neutral-200 mt-12">
            <p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">ONOD Fonts · {ru ? 'редакция 10 августа 2026' : 'updated August 10, 2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
