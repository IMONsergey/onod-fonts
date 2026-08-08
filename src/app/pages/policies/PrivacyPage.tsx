import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const PrivacyPage = () => {
  const { language } = useLanguage();
  const backLabel = language === 'ru' ? 'Назад' : 'Back';
  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans"><div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
      <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group"><ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {backLabel}</Link>
      <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>Политика конфиденциальности</h1><div className="h-px bg-neutral-200 mb-12" />
      <div className="space-y-8 font-serif text-lg leading-relaxed text-neutral-800">
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">1. Общие положения</h2><p>Настоящая политика обработки персональных данных составлена в соответствии с требованиями Федерального закона от 27.07.2006. № 152-ФЗ «О персональных данных» (далее — Закон о персональных данных) и определяет порядок обработки персональных данных и меры по обеспечению безопасности персональных данных, предпринимаемые Сергеем Отческовым (далее — Оператор).</p><p className="mt-4">1.1. Оператор ставит своей важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных.</p></section>
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">2. Какие данные мы собираем</h2><p>2.1. Сайт ONOD Fonts является информационным каталогом и не требует обязательной регистрации для просмотра контента.</p><p>2.2. Мы можем собирать обезличенные данные о посетителях (в т.ч. файлы «cookie») с помощью сервисов интернет-статистики.</p></section>
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">3. Цели обработки</h2><p>3.1. Улучшение качества работы сайта, удобства его использования, разработка новых сервисов и услуг.</p><p>3.2. Таргетирование рекламных материалов (при наличии).</p></section>
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">4. Правовые основания</h2><p>Оператор обрабатывает персональные данные Пользователя только в случае их заполнения и/или отправки Пользователем самостоятельно через специальные формы, расположенные на сайте, или автоматического сбора обезличенных данных.</p></section>
        <div className="pt-12 border-t border-neutral-200 mt-12"><p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">Последнее обновление: 29 Ноября 2025</p></div>
      </div>
    </div></div>
  );
};