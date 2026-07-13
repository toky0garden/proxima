'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from './AppContext';

export default function Home() {
  const { listings, favorites, toggleFavorite } = useApp();
  const router = useRouter();

  const categories = [
    { name: 'GTA V', count: '1 245 объявлений', icon: 'fa-gamepad' },
    { name: 'Steam', count: '3 842 объявлений', icon: 'fa-envelope-open' },
    { name: 'Fortnite', count: '987 объявлений', icon: 'fa-person-running' },
    { name: 'Valorant', count: '1 102 объявлений', icon: 'fa-circle-dot' },
    { name: 'CS 2', count: '1 756 объявлений', icon: 'fa-crosshairs' },
  ];

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-10 animate-fadeInUp">
      {/* Hero Banner Section */}
      <section className="relative rounded-3xl overflow-hidden h-[340px] flex items-center bg-brand-card border border-white/5 shadow-glass">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/70 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,57,53,0.15),transparent_45%)]"></div>
        
        <div className="relative z-20 max-w-xl pl-12 pr-6 space-y-6">
          <span className="inline-block bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-glow-red">Игровой маркетплейс</span>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white tracking-wide">
            Покупайте и продавайте игровые ценности безопасно
          </h1>
          <p className="text-sm text-brand-textMuted leading-relaxed">
            Тысячи проверенных продавцов, моментальная доставка данных, гарантия возврата средств при любых форс-мажорах.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="px-6 py-3 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-glow-red">
              Перейти к покупкам
            </Link>
            <Link href="/profile" className="px-6 py-3 bg-transparent hover:bg-white/5 border border-brand-border text-white text-xs font-bold rounded-xl transition-all duration-300">
              Мой профиль
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-white tracking-wide">Популярные категории</h2>
          <Link href="/catalog" className="text-xs font-bold text-brand-red hover:underline uppercase tracking-wider">Все игры</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              href="/catalog"
              className="bg-brand-card rounded-xl p-4 flex items-center justify-between hover:bg-white/5 hover:-translate-y-0.5 transition-all duration-300 border border-white/5 cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-input border border-white/5">
                  <i className={`fa-solid ${c.icon} text-brand-red text-xl`}></i>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-white">{c.name}</h3>
                  <p className="text-xs text-brand-textMuted mt-1">{c.count}</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-brand-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-white tracking-wide">Последние предложения</h2>
          <Link href="/catalog" className="text-xs font-bold text-brand-red hover:underline uppercase tracking-wider">Все лоты</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.slice(0, 4).map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/item/${item.id}`)}
                className="bg-brand-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 hover:shadow-glass hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full relative"
              >
                <div className="relative h-44 bg-brand-input overflow-hidden">
                  <img alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={item.img} />
                  {item.tag && (
                    <div className="absolute top-3 left-3 bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-glow-red">
                      {item.tag}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/95 text-white flex items-center justify-center border border-white/10 transition-colors"
                  >
                    <i className={`fa-heart ${isFav ? 'fa-solid text-brand-red' : 'fa-regular text-white'}`}></i>
                  </button>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-sm mb-1 text-white group-hover:text-brand-red transition-colors line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-brand-textMuted mb-4 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-base font-bold text-brand-red">{item.price} ₽</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-glow-green"></div>
                        <span className="text-[9px] text-brand-textMuted">В наличии · Автовыдача</span>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all">
                      <i className="fa-solid fa-arrow-right text-xs text-brand-textMuted group-hover:text-white"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
