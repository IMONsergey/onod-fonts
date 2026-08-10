import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const PrivacyPage = () => {
  const { language } = useLanguage();
  const ru = language === 'ru';

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
        <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {ru ? 'Назад' : 'Back'}
        </Link>
        <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>{ru ? 'Конфиденциальность' : 'Privacy'}</h1>
        <div className="h-px bg-neutral-200 mb-12" />

        <div className="space-y-9 font-serif text-lg leading-relaxed text-neutral-800">
          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '1. Локальное приложение' : '1. Local-first application'}</h2>
            <p>{ru
              ? 'Для просмотра ONOD Fonts не требуется регистрация или пользовательский аккаунт. Избранное, список сравнения и выбранный язык сохраняются в localStorage текущего браузера.'
              : 'ONOD Fonts does not require registration or a user account for browsing. Favorites, comparison state, and the selected language are stored in the current browser localStorage.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '2. Аналитика' : '2. Analytics'}</h2>
            <p>{ru
              ? 'Текущая версия приложения не загружает стороннюю систему веб-аналитики, clickmap или session replay. Если аналитика будет возвращена в продукт, политика и механизм согласия должны быть обновлены одновременно с таким изменением.'
              : 'The current application does not load a third-party web analytics, click-map, or session-replay service. If analytics is reintroduced, this policy and the product consent mechanism must be updated together with that change.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '3. Внешняя загрузка шрифтов' : '3. External font loading'}</h2>
            <p>{ru
              ? 'Чтобы показать реальную гарнитуру, браузер может обращаться к внешним источникам CSS и font-файлов, указанным в каталоге. Такие сетевые запросы выполняются напрямую браузером к соответствующему провайдеру и регулируются политикой этого провайдера.'
              : 'To render the actual typeface, the browser may request external CSS and font resources referenced by the catalog. Those network requests are made directly by the browser to the relevant provider and are governed by that provider’s policies.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '4. Ссылки на сторонние сайты' : '4. Third-party links'}</h2>
            <p>{ru
              ? 'Кнопки «Источник» и «Скачать», когда они доступны, открывают внешний ресурс. После перехода действуют правила и политика конфиденциальности соответствующего сайта.'
              : 'Source and Download actions, when available, open external resources. After leaving ONOD Fonts, the privacy policy and terms of the destination site apply.'}</p>
          </section>

          <section>
            <h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">{ru ? '5. Управление локальными данными' : '5. Managing local data'}</h2>
            <p>{ru
              ? 'Локальные сохранения можно удалить средствами браузера, очистив данные сайта. ONOD Fonts не синхронизирует эти локальные списки с серверной учётной записью.'
              : 'Local saved state can be removed through browser site-data controls. ONOD Fonts does not synchronize these local lists to a server-side account.'}</p>
          </section>

          <div className="pt-12 border-t border-neutral-200 mt-12">
            <p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">ONOD Fonts · {ru ? 'редакция 10 августа 2026' : 'updated August 10, 2026'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
