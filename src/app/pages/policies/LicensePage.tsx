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
              ? 'В карточке с подтвержденной лицензией указаны ее название и источник. Для новых поступлений это текст лицензии в оригинальном пакете или условия, опубликованные автором либо дистрибьютором. Кнопка скачивания ведет к архиву ONOD или на сайт источника.'
              : 'Verified entries show the license and its source. For new arrivals, the evidence is the license in the original font package or the terms published by the author or distributor. The download action opens the ONOD archive or the original source.'}</p>
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
              ? 'В карточке выберите ссылку на лицензию семейства. Проверьте условия для своего проекта, особенно при передаче файлов клиенту, размещении веб-шрифтов или встраивании в приложение. Сохраняйте требуемые сведения об авторстве и лицензии вместе с файлами.'
              : 'Open the family license for the terms that apply to your project, particularly when supplying font files to a client, self-hosting webfonts or embedding fonts in an app. Keep any required attribution and license notices with the files.'}</p>
          </section>

          <div className="pt-12 border-t border-neutral-200 mt-12">
            <p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">ONOD Fonts · {ru ? 'редакция 16 ноября 2026' : 'updated November 16, 2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
