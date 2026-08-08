import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useLanguage } from '@/lib/i18n';

export const TermsPage = () => {
  const { language } = useLanguage();
  const backLabel = language === 'ru' ? 'Назад' : 'Back';
  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans"><div className="max-w-3xl mx-auto px-6 md:px-12 pt-24 pb-16">
      <Link to="/about" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-800 transition-colors mb-12 group"><ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> {backLabel}</Link>
      <h1 className="text-3xl md:text-5xl tracking-tighter mb-3 uppercase leading-none" style={{ fontWeight: 700 }}>Пользовательское соглашение</h1><div className="h-px bg-neutral-200 mb-12" />
      <div className="space-y-8 font-serif text-lg leading-relaxed text-neutral-800">
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">1. Предмет соглашения</h2><p>Настоящее Соглашение регулирует отношения между Администрацией сайта ONOD Fonts (далее — Администрация) и Пользователем данного Сайта.</p></section>
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">2. Статус контента</h2><p>2.1. Весь контент, представленный на сайте (шрифты, изображения, тексты), предоставляется по принципу «как есть» (as is).</p><p>2.2. Шрифты, представленные в каталоге, распространяются на условиях открытых лицензий. Пользователь обязан самостоятельно проверять лицензию конкретного шрифта перед его использованием в коммерческих проектах.</p></section>
        <section><h2 className="font-sans text-xl font-bold uppercase tracking-wide mb-4">3. Ограничение ответственности</h2><p>3.1. Администрация не несет ответственности за любые прямые или косвенные убытки, возникшие в результате использования Сайта или размещенного на нем контента.</p><p>3.2. Администрация не гарантирует бесперебойную работу Сайта.</p></section>
        <div className="pt-12 border-t border-neutral-200 mt-12"><p className="font-mono text-[10px] uppercase text-neutral-400 tracking-widest">Редакция от 29 Ноября 2025<br/>ONOD Fonts</p></div>
      </div>
    </div></div>
  );
};