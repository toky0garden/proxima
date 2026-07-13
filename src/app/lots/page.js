'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';

export default function AllLots() {
  const { listings, deleteListing } = useApp();
  const router = useRouter();

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-8 flex-1 flex flex-col animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Все лоты в продаже</h1>
          <p className="text-xs text-brand-textMuted mt-1">Подробный список всех доступных предложений на торговой площадке.</p>
        </div>
        <Link href="/profile" className="py-2.5 px-5 bg-white/5 border border-brand-border hover:border-brand-textMuted hover:bg-white/10 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all">
          <i className="fa-solid fa-arrow-left"></i>
          <span>В личный кабинет</span>
        </Link>
      </div>

      {/* Table grid structure in the style of FunPay */}
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-glass flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-dark/40 border-b border-brand-border text-brand-textMuted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Игра</th>
                <th className="py-4 px-6">Описание предложения</th>
                <th className="py-4 px-6 text-center">Наличие</th>
                <th className="py-4 px-6 text-right">Цена</th>
                <th className="py-4 px-6 text-center">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {listings.length > 0 ? (
                listings.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.01] transition-colors cursor-pointer group"
                    onClick={() => router.push(`/item/${item.id}`)}
                  >
                    <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                      <span className="bg-brand-red/10 border border-brand-red/20 text-brand-red py-1 px-2.5 rounded-lg">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white group-hover:text-brand-red transition-colors block">
                          {item.title}
                        </span>
                        <span className="text-brand-textMuted font-light block line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-1 rounded-full text-[10px] font-semibold">
                        <span className="h-1 w-1 rounded-full bg-green-500 shadow-glow-green"></span>
                        <span>Автовыдача</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-white text-sm whitespace-nowrap">
                      {item.price} ₽
                    </td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => deleteListing(item.id)}
                        className="w-8 h-8 rounded-lg hover:bg-brand-red/10 border border-transparent hover:border-brand-red/20 text-brand-textMuted hover:text-brand-red transition-all flex items-center justify-center mx-auto"
                        title="Удалить"
                      >
                        <i className="fa-regular fa-trash-can text-sm"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-brand-textMuted">
                    Нет доступных лотов.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
