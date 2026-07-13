'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../AppContext';
import * as api from '../../../lib/api';

export default function ItemDetail({ params }) {
  const { id } = use(params);
  const {
    listings,
    profile,
    user,
    purchaseItem,
    addToast,
  } = useApp();

  const router = useRouter();

  // Find the selected listing (support both string UUID and legacy numeric ids)
  const item = listings.find(x => String(x.id) === String(id));

  const isOwnListing = !!(user?.id && item?.seller_id && item.seller_id === user.id);

  // Local Modal States
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, loading, success

  if (!item) {
    return (
      <main className="w-full max-w-screen-2xl mx-auto px-6 py-16 text-center space-y-4 flex-1 flex flex-col justify-center">
        <i className="fa-solid fa-triangle-exclamation text-brand-red text-4xl animate-bounce"></i>
        <h2 className="text-white font-bold text-lg">Объявление не найдено</h2>
        <p className="text-xs text-brand-textMuted">Похоже, этот лот был удален или никогда не существовал.</p>
        <Link href="/catalog" className="inline-block mt-4 py-2 px-6 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl shadow-glow-red transition-all">
          Вернуться в каталог
        </Link>
      </main>
    );
  }

  const handleStartPurchase = () => {
    setShowPurchaseModal(true);
    setPaymentStatus('idle');
  };

  const handleConfirmPurchase = () => {
    if (isOwnListing) {
      addToast('Нельзя заказать собственную услугу', 'error');
      setShowPurchaseModal(false);
      return;
    }
    setPaymentStatus('loading');
    setTimeout(() => {
      purchaseItem(item);
      setPaymentStatus('success');
      // Auto open chat after success
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPaymentStatus('idle');
        addToast('Чат с продавцом открыт! Продолжайте разговор там.', 'success');
        router.push('/messages');
      }, 800);
    }, 1500);
  };

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-8 animate-fadeInUp">
      {/* Back Navigation */}
      <div className="flex items-center gap-3">
        <Link href="/catalog" className="flex items-center gap-2 text-brand-textMuted hover:text-white transition-colors text-xs font-semibold cursor-pointer">
          <i className="fa-solid fa-arrow-left"></i>
          <span>Назад в каталог</span>
        </Link>
        <span className="text-brand-border">/</span>
        <span className="text-white text-xs font-semibold">{item.title}</span>
      </div>

      {/* Main Container */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-3xl overflow-hidden h-[360px] bg-brand-card border border-brand-border shadow-glass">
            <img className="w-full h-full object-cover" src={item.img} alt={item.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent"></div>
          </div>

          <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">{item.title}</h1>
              <span className="inline-block mt-2 text-xs font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-1 rounded-full shadow-glow-red">{item.category}</span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">Описание лота</h3>
              <p className="text-xs text-brand-textMuted leading-relaxed">{item.description}</p>
            </div>

            <div className="space-y-3 border-t border-brand-border pt-6">
              <h3 className="font-bold text-white text-sm">Гарантии и доставка</h3>
              <ul className="list-none space-y-2 text-xs text-brand-textMuted">
                <li className="flex items-center gap-2">
                  <i className="fa-solid fa-shield text-brand-red"></i>
                  <span>Безопасная сделка: Продавец получит оплату только после вашей проверки товара.</span>
                </li>
                <li className="flex items-center gap-2">
                  <i className="fa-regular fa-clock text-brand-red"></i>
                  <span>Моментальная выдача: Доступ к товару сразу после подтверждения транзакции.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Columns */}
        <div className="space-y-6">
          <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-6">
            <div className="space-y-1">
              <span className="text-xs text-brand-textMuted uppercase font-bold tracking-wider">Цена лота</span>
              <div className="text-3xl font-extrabold text-brand-red drop-shadow-[0_0_8px_rgba(229,57,53,0.3)]">{item.price} ₽</div>
            </div>

            <div className="space-y-3">
              {!isOwnListing ? (
                <button
                  onClick={handleStartPurchase}
                  className="w-full py-3.5 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-glow-red"
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span>Купить лот</span>
                </button>
              ) : (
                <div className="w-full py-3.5 bg-brand-input border border-white/10 text-brand-textMuted text-xs font-bold rounded-xl flex items-center justify-center">
                  Это ваш лот
                </div>
              )}
              <button
                onClick={() => router.push('/messages')}
                className="w-full py-3.5 bg-transparent hover:bg-white/5 border border-brand-border hover:border-brand-textMuted text-brand-text text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
              >
                <i className="fa-regular fa-comment-dots"></i>
                <span>Обсудить с продавцом</span>
              </button>
            </div>

            <div className="pt-4 border-t border-brand-border flex items-center gap-3">
              {profile.avatar ? (
                <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 cursor-pointer block">
                  <img className="w-full h-full object-cover" src={api.getFullUrl(profile.avatar)} alt="Seller" />
                </Link>
              ) : (
                <Link href="/profile" className="w-10 h-10 rounded-full flex-shrink-0 border border-white/10 bg-brand-input cursor-pointer block" />
              )}
              <div>
                <Link href="/profile" className="text-xs font-bold text-white hover:underline cursor-pointer">
                  {profile.name || 'Продавец'}
                </Link>
                <div className="flex items-center gap-1 text-[10px] text-brand-textMuted mt-0.5">
                  <i className="fa-solid fa-star text-amber-500"></i>
                  <span>{profile.rating}</span>
                  {profile.reviewsCount > 0 && (
                    <span>({profile.reviewsCount} отзывов)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Purchase Modal / Checkout Flow Overlay */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 w-full max-w-sm space-y-5">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="font-bold text-white text-base">
                {paymentStatus === 'success' ? 'Покупка завершена' : 'Оплата заказа'}
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-brand-textMuted hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {paymentStatus === 'idle' && (
              <>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-brand-textMuted">
                    <span>Товар</span>
                    <span className="text-white font-medium truncate max-w-[200px]">{item.title}</span>
                  </div>
                  <div className="flex justify-between text-brand-textMuted">
                    <span>Комиссия сервиса</span>
                    <span className="text-white font-medium">0 ₽</span>
                  </div>
                  <div className="flex justify-between border-t border-brand-border pt-2 text-sm font-bold">
                    <span>Итого к оплате</span>
                    <span className="text-brand-red">{item.price} ₽</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Выберите платежную систему</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleConfirmPurchase} className="py-3 px-4 bg-brand-input border border-brand-border hover:border-brand-red rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-white transition-all">
                      <i className="fa-solid fa-mobile-screen-button text-brand-red text-base"></i>
                      <span>СБП</span>
                    </button>
                    <button onClick={handleConfirmPurchase} className="py-3 px-4 bg-brand-input border border-brand-border hover:border-brand-red rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-white transition-all">
                      <i className="fa-regular fa-credit-card text-brand-red text-base"></i>
                      <span>Карта РФ</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {paymentStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-12 h-12 border-4 border-brand-red/30 border-t-brand-red rounded-full animate-spin"></div>
                <p className="text-xs text-white font-medium">Проведение транзакции...</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="text-center space-y-4 py-4">
                <i className="fa-solid fa-circle-check text-green-500 text-3xl"></i>
                <h4 className="text-sm font-bold text-white">Заказ успешно оплачен!</h4>
                <p className="text-[11px] text-brand-textMuted">
                  Чат с продавцом открыт. Продолжайте разговор там.
                </p>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPaymentStatus('idle');
                    addToast('Чат с продавцом открыт! Продолжайте разговор там.', 'success');
                    router.push('/messages');
                  }}
                  className="w-full py-2.5 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl shadow-glow-red transition-all"
                >
                  Открыть чат с продавцом
                </button>
                <p className="text-[10px] text-brand-textMuted">
                  Отзыв можно оставить позже в разделе «Мои покупки»
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}
