import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const TermsPage = () => {
  const { language } = useLanguage();
  const ru = language === 'ru';

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {ru ? 'Назад' : 'Back'}
        </Link>
        <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>{ru ? 'Условия использования' : 'Terms of use'}</h1>
        <div className="h-px bg-neutral-200 mb-12" />

        <div className="space-y-9 font-serif text-lg leading-relaxed text-neutral-800">
          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '1. Назначение сервиса' : '1. Service purpose'}</h2>
            <p>{ru
              ? 'ONOD Fonts предоставляет интерфейс для поиска, предпросмотра, сравнения и изучения типографики. Сервис не является правообладателем большинства представленных гарнитур и не заменяет официальный источник конкретного шрифта.'
              : 'ONOD Fonts provides an interface for discovering, previewing, comparing, and studying typefaces. The service is not the rights holder for most listed families and does not replace the official source for a specific font.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '2. Точность каталога' : '2. Catalog accuracy'}</h2>
            <p>{ru
              ? 'Мы разделяем подтверждённые и производные метаданные. Записи с META? или «Verify at source» находятся в процессе проверки. Даже для подтверждённых записей первичный источник имеет приоритет, если данные изменились после последней синхронизации.'
              : 'We distinguish verified metadata from derived metadata. Records marked META? or “Verify at source” are still being verified. Even for verified records, the upstream source takes precedence if information changed after the last synchronization.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '3. Лицензирование' : '3. Licensing'}</h2>
            <p>{ru
              ? 'Перед использованием или распространением гарнитуры пользователь должен проверить актуальные условия у правообладателя или исходного провайдера. ONOD Fonts не предоставляет отдельную лицензию на сторонние font-файлы.'
              : 'Before using or redistributing a typeface, the user should verify current terms with the rights holder or originating provider. ONOD Fonts does not issue a separate license for third-party font files.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '4. Внешние ресурсы' : '4. External resources'}</h2>
            <p>{ru
              ? 'Предпросмотр может загружать таблицы стилей и файлы шрифтов с внешних сервисов, а кнопка «Источник» открывает сторонний сайт. Доступность, содержимое и условия таких ресурсов контролируются их владельцами.'
              : 'Previews may load stylesheets and font files from external services, and the Source action opens a third-party site. Availability, content, and terms of those resources are controlled by their respective operators.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '5. Доступность сервиса' : '5. Service availability'}</h2>
            <p>{ru
              ? 'Сервис развивается и может изменяться. Мы не обещаем постоянную доступность каждого внешнего шрифта или провайдера; если загрузка не удалась, интерфейс должен явно показать состояние FALLBACK вместо незаметной подмены.'
              : 'The service is evolving and may change. We do not promise permanent availability of every external font or provider; when loading fails, the interface is designed to show a FALLBACK state rather than silently substituting another font.'}</p>
          </section>

          <div className="pt-12 border-t border-neutral-200 mt-12">
            <p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">ONOD Fonts · {ru ? 'редакция 10 августа 2026' : 'updated August 10, 2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
