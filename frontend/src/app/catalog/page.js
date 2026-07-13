'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';

export default function Catalog() {
  const {
    listings,
    favorites,
    toggleFavorite,
    searchQuery,
    catalogFilter,
    setCatalogFilter
  } = useApp();

  const router = useRouter();

  const categories = ['all', 'GTA V', 'CS 2', 'Steam', 'Valorant', 'Fortnite', 'favorites'];

  // Filter listings
  let filteredItems = listings;

  if (catalogFilter === 'favorites') {
    filteredItems = filteredItems.filter(x => favorites.includes(x.id));
  } else if (catalogFilter !== 'all') {
    filteredItems = filteredItems.filter(x => x.category === catalogFilter);
  }

  if (searchQuery) {
    filteredItems = filteredItems.filter(x =>
      x.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      x.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-8 flex-1 flex flex-col animate-fadeInUp">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Каталог товаров</h1>
          <p className="text-xs text-brand-textMuted mt-1">Используйте поиск и фильтры по играм для быстрого поиска.</p>
        </div>
        {/* Category Tabs Grid */}
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => {
            let label = cat;
            if (cat === 'all') label = 'Все игры';
            if (cat === 'favorites') label = '♥ Избранное';

            const active = catalogFilter === cat;

            return (
              <button
                key={cat}
                onClick={() => setCatalogFilter(cat)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 border ${
                  active
                    ? 'bg-brand-red text-white border-brand-red shadow-glow-red'
                    : 'bg-brand-card text-brand-textMuted border-brand-border hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isFav = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/item/${item.id}`)}
                className="bg-brand-card rounded-2xl overflow-hidden border border-brand-border hover:border-brand-textMuted/30 hover:shadow-glass hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full relative"
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
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center col-span-full">
            <i className="fa-solid fa-magnifying-glass text-brand-textMuted text-4xl mb-2 animate-pulse"></i>
            <h3 className="text-white font-bold text-base">Объявления не найдены</h3>
            <p className="text-xs text-brand-textMuted max-w-xs">Попробуйте изменить поисковый запрос или выбрать другую категорию.</p>
          </div>
        )}
      </div>

    </main>
  );
}
