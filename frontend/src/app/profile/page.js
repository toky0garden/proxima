'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../AppContext';
import * as api from '../../lib/api';

export default function Profile() {
  const {
    profile,
    listings,
    reviews,
    purchasedLots,
    deleteListing,
    addListing,
    profileTab,
    setProfileTab,
    user,
    isAuthenticated,
    authLoading,
    login,
    register,
    logout,
    addToast,
  } = useApp();

  const router = useRouter();

  useEffect(() => {
    if (profileTab === 'reviews' && profile.reviewsCount === 0) {
      setProfileTab('lots');
    }
  }, [profile.reviewsCount, profileTab, setProfileTab]);

  // Auth form state
  const [authMode, setAuthMode] = useState('login'); // login | register
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Create Listing Modal local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    category: 'GTA V',
    title: '',
    description: '',
    price: '',
    delivery_days: '3'
  });

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await login(authForm.email, authForm.password);
      } else {
        if (!authForm.username) throw new Error('Username required for registration');
        await register(authForm.email, authForm.username, authForm.password);
      }
      setAuthForm({ email: '', username: '', password: '' });
    } catch (err) {
      setAuthError(err.message || 'Ошибка авторизации');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const title = (addForm.title || '').trim();
    const description = (addForm.description || '').trim();
    const price = Number(addForm.price);
    const delivery = Number(addForm.delivery_days);

    if (title.length < 3) {
      addToast('Название должно быть минимум 3 символа', 'error');
      return;
    }
    if (description.length < 10) {
      addToast('Описание должно быть минимум 10 символов', 'error');
      return;
    }
    if (!addForm.category || addForm.category.length < 2) {
      addToast('Выберите категорию', 'error');
      return;
    }
    if (isNaN(price) || price < 0) {
      addToast('Цена должна быть положительным числом', 'error');
      return;
    }
    if (isNaN(delivery) || delivery < 1) {
      addToast('Срок доставки минимум 1 день', 'error');
      return;
    }

    try {
      await addListing(
        addForm.category, 
        title, 
        description, 
        price,
        delivery
      );
      setShowAddModal(false);
      setAddForm({ category: 'GTA V', title: '', description: '', price: '', delivery_days: '3' });
      addToast('Объявление успешно опубликовано на сервере!', 'success');
    } catch (err) {
      const msg = err.message || String(err);
      addToast('Ошибка публикации: ' + msg, 'error');
    }
  };

  const getGameImagePlaceholder = (cat) => {
    if (cat === 'GTA V') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIPWdst2vh-lEeE8MBDmRoH7ZR-gacKzR-Wx9L0k0n8V_bErIarmzbeLukt4ZrPui2ElF0QjX679A1f6ImqA7khGt2sni3nB2Ln2H0NPvC8ezLef0VQO4Px5dLkdA5_4BvjPBpBoW9XeW4MIJiZr5PKi0_QhjOiOpnKaHtN0-b0xbJnJ7udpxU847-3h1P-QlZ4DjEWrn4wq8OUNIKDdezVOQIEEhOmW0V1HjqWOd_SFX1ptVqa8Mr7Q';
    if (cat === 'CS 2') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuABX4iLh8WGZ9_C-8O7hc5SeroowtzA5RiteLcGRpduf4qSySxUJ2jsx24xytlBpYQyZ8wr3EEJbf7wUbT3ONqUZqmlwTbMhxaK-yMudmqPbEE28lg49xLW2xQNxSVpcmGU4zbKj9apGnsG-wY2ubBmMpa20ssGjKhkTu_kzwxu1aJ8FC0G0VuIhNFsaEQJDRlcbmu1p8vPeE_rb_gUT4nimNRB50GEqlL2cn5ROcdhUcoD_2EEvXreUw';
    if (cat === 'Steam') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNcZrNp_0IPI89qObaubHetiKhAg_uj3zHuSzju0-1cd_0pPXxO061d55XsNk8Z7TaEUOffO2nUREXrwHvn99BtQvsxFivYWP4R_9S18vSJF5M25dDD9gMnvId9pKlDnel8fyMZ5MR4uv7r38sFh9aAt6oX8SIOxLfFzvs7SiLnE5PfKHvEuKEqhHUNKY8rBLY2BKwSah4LAQo2nI3Cemwml_km79gfd98rN6Oqb39Hu108dqqNWYbQ';
    if (cat === 'Valorant') return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w';
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIc8OBnSOW4p61G-llvPlpYoyIfirHbMH5tewwjDDktIwYu8otbk47ynr37lWH675BNKQQ5fc0mgFzFwlWQYh29qkXVHenN0mxcMSZfEvXPadIO1xwhaTFVjWV2enRQcHMcSPG6zsQGPWo4S12bdCuzj-SRXB902vpX4SWgZlUsrVPzxmEuEH45Stjwj2R1IEH7IpYiok_TL5Z6sdmcHWKB3IFDtdJaoL9qHmuifDOl0Cvj06tnAAAHA';
  };

  const categories = ['GTA V', 'CS 2', 'Steam', 'Valorant', 'Fortnite'];

  if (authLoading) {
    return <main className="p-8 text-center text-sm text-brand-textMuted">Загрузка...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="w-full max-w-screen-md mx-auto px-6 py-12">
        <div className="bg-brand-card border border-brand-border rounded-3xl p-8 space-y-6">
          <h1 className="text-2xl font-bold">Войдите или зарегистрируйтесь</h1>
          <p className="text-xs text-brand-textMuted">Чтобы пользоваться полным функционалом (создание лотов, заказы, чаты) необходимо войти через Proxima API.</p>

          <div className="flex gap-2">
            <button onClick={() => setAuthMode('login')} className={`px-4 py-1 text-xs rounded ${authMode==='login' ? 'bg-brand-red text-white' : 'bg-white/5'}`}>Вход</button>
            <button onClick={() => setAuthMode('register')} className={`px-4 py-1 text-xs rounded ${authMode==='register' ? 'bg-brand-red text-white' : 'bg-white/5'}`}>Регистрация</button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={e => setAuthForm({...authForm, email: e.target.value})}
              className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm"
              required
            />
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Username (a-z0-9_)"
                value={authForm.username}
                onChange={e => setAuthForm({...authForm, username: e.target.value})}
                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm"
                required
              />
            )}
            <input
              type="password"
              placeholder="Пароль"
              value={authForm.password}
              onChange={e => setAuthForm({...authForm, password: e.target.value})}
              className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm"
              required
              minLength={8}
            />
            {authError && (
              <p className="text-red-500 text-xs bg-red-500/10 p-2 rounded">
                {authError}
              </p>
            )}
            <button type="submit" className="w-full py-3 bg-brand-red hover:bg-brand-redHover rounded-xl text-white text-sm font-bold">
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="text-[10px] text-brand-textMuted">
            Демо: demo@proxima.dev / DemoPass123! (уже зарегистрирован)
            <button 
              type="button"
              onClick={() => { setAuthForm({email:'demo@proxima.dev', username:'', password:'DemoPass123!'}); setAuthMode('login'); }}
              className="ml-2 underline"
            >
              Заполнить демо
            </button>
          </div>

          <div className="mt-3 text-[9px] text-brand-textMuted border-t border-brand-border pt-2">
            Если API временно недоступен, обновите страницу и попробуйте снова.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-8 animate-fadeInUp flex-1 flex flex-col">
      {/* Seller Profile Header Details (with cover banner) */}
      <section className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden relative shadow-glass flex flex-col">
        {/* Cover Banner */}
        <div className="h-40 sm:h-48 w-full overflow-hidden relative bg-brand-input">
          {profile.banner ? (
            <img className="w-full h-full object-cover" src={profile.banner} alt="Banner" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent"></div>
        </div>

        {/* Profile Details Body */}
        <div className="px-6 pb-6 -mt-10 sm:-mt-14 relative flex flex-col lg:flex-row justify-between items-start gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar overlapping */}
            {profile.avatar ? (
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-brand-card relative shadow-glass bg-brand-input">
                  <img className="w-full h-full object-cover" src={api.getFullUrl(profile.avatar)} alt="Avatar" />
                </div>
                <span className="absolute bottom-1.5 right-1.5 block h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-green-500 ring-4 ring-brand-card shadow-glow-green"></span>
              </div>
            ) : null}

            {/* Stats description */}
            <div className="flex flex-col gap-4 text-center sm:text-left pt-12 sm:pt-16">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{profile.name}</h1>
                  {profile.name && <svg className="w-5 h-5 text-brand-red fill-current" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                </div>
                {profile.joinedDate && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-brand-textMuted mt-1">
                    <span className="text-green-500 font-semibold">Онлайн</span>
                    <span>·</span>
                    <span>На сайте с {profile.joinedDate}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                  <i className="fa-solid fa-star text-amber-500 text-sm"></i>
                  <span className="font-bold text-white text-sm">{profile.rating}</span>
                  {profile.reviewsCount > 0 && (
                    <span className="text-xs text-brand-textMuted">({profile.reviewsCount} отзывов)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-xs text-brand-textMuted font-medium">
                  <i className="fa-solid fa-shield-halved text-brand-red"></i>
                  <span>Надежный продавец</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className={`grid ${profile.reviewsCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-6 pt-5 border-t border-brand-border mt-1`}>
                <div>
                  <div className="text-base sm:text-lg font-bold text-white">{profile.soldCount}</div>
                  <div className="text-[10px] text-brand-textMuted mt-0.5">Продано</div>
                </div>
                {profile.reviewsCount > 0 && (
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white">{profile.reviewsCount}</div>
                    <div className="text-[10px] text-brand-textMuted mt-0.5">Отзыва</div>
                  </div>
                )}
                <div>
                  <div className="text-base sm:text-lg font-bold text-white">{profile.successRate}</div>
                  <div className="text-[10px] text-brand-textMuted mt-0.5">Успешных сделок</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex flex-col gap-3 w-full lg:w-72 flex-shrink-0 pt-6 lg:pt-16 lg:self-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-glow-red"
            >
              <i className="fa-solid fa-circle-plus"></i>
              <span>Создать объявление</span>
            </button>
            <Link
              href="/profile/edit"
              className="w-full py-3 bg-transparent hover:bg-white/5 border border-brand-border hover:border-brand-textMuted text-brand-text text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
            >
              <i className="fa-solid fa-user-gear"></i>
              <span>Изменить профиль</span>
            </Link>
            <button
              onClick={logout}
              className="w-full py-2 text-xs text-brand-textMuted hover:text-white border border-brand-border/60 rounded-xl"
            >
              Выйти
            </button>
          </div>

        </div>
      </section>

      {/* Tabs list */}
      <section className="space-y-6 flex-1 flex flex-col">
        <div className="flex border-b border-brand-border gap-6 text-sm font-semibold">
          <button
            onClick={() => setProfileTab('lots')}
            className={`pb-3 transition-colors ${
              profileTab === 'lots'
                ? 'text-brand-red border-b-2 border-brand-red font-bold'
                : 'text-brand-textMuted hover:text-white'
            }`}
          >
            Лоты по категориям
          </button>
          {profile.reviewsCount > 0 && (
            <button
              onClick={() => setProfileTab('reviews')}
              className={`pb-3 transition-colors ${
                profileTab === 'reviews'
                  ? 'text-brand-red border-b-2 border-brand-red font-bold'
                  : 'text-brand-textMuted hover:text-white'
              }`}
            >
              Отзывы о продавце
            </button>
          )}
          <button
            onClick={() => setProfileTab('purchases')}
            className={`pb-3 transition-colors ${
              profileTab === 'purchases'
                ? 'text-brand-red border-b-2 border-brand-red font-bold'
                : 'text-brand-textMuted hover:text-white'
            }`}
          >
            Мои покупки ({purchasedLots.length})
          </button>
          <button
            onClick={() => setProfileTab('about')}
            className={`pb-3 transition-colors ${
              profileTab === 'about'
                ? 'text-brand-red border-b-2 border-brand-red font-bold'
                : 'text-brand-textMuted hover:text-white'
            }`}
          >
            О себе
          </button>
        </div>

        {/* Tab content containers */}
        <div className="flex-1">
          {profileTab === 'lots' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Разделы товаров</h2>
                <Link
                  href="/lots"
                  className="text-brand-red text-xs font-semibold hover:underline flex items-center gap-1.5"
                >
                  <span>Смотреть все лоты</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {categories.map((cat) => {
                  const catListings = listings.filter((x) => x.category === cat).slice(0, 3);
                  const banner = getGameImagePlaceholder(cat);

                  return (
                    <div
                      key={cat}
                      className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden flex flex-col h-full hover:border-brand-textMuted/30 transition-all duration-300"
                    >
                      <div className="h-28 w-full overflow-hidden relative">
                        <img className="w-full h-full object-cover" src={banner} alt={cat} />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-card/90 to-transparent"></div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="mb-4">
                          <h3 className="font-bold text-base text-white">{cat}</h3>
                          <span className="text-xs text-brand-textMuted">
                            {listings.filter((x) => x.category === cat).length} лотов
                          </span>
                        </div>
                        <div className="space-y-3.5">
                          {catListings.length > 0 ? (
                            catListings.map((item) => (
                              <div key={item.id} className="flex flex-col gap-0.5 group/item">
                                <div className="flex justify-between items-start gap-2">
                                  <span
                                    onClick={() => router.push(`/item/${item.id}`)}
                                    className="text-xs text-brand-text hover:text-white truncate cursor-pointer flex-1"
                                  >
                                    {item.title}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-brand-red">{item.price} ₽</span>
                                    <button
                                      onClick={() => deleteListing(item.id)}
                                      className="hidden group-hover/item:block text-[10px] text-brand-textMuted hover:text-brand-red transition-colors p-0.5"
                                      title="Удалить лот"
                                    >
                                      <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-brand-textMuted">Нет лотов в категории</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profile.reviewsCount > 0 && profileTab === 'reviews' && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 divide-y divide-brand-border max-w-4xl space-y-4">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-xs">{r.user}</span>
                      <span className="text-[10px] text-brand-textMuted">{r.date}</span>
                    </div>
                    <div className="flex gap-1 text-xs text-amber-500">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>
                    <p className="text-xs text-brand-text leading-relaxed">{r.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brand-textMuted text-center py-6">Отзывов пока нет.</p>
              )}
            </div>
          )}

          {profileTab === 'purchases' && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 divide-y divide-brand-border max-w-4xl space-y-4">
              {purchasedLots.length > 0 ? (
                purchasedLots.map((item, index) => (
                  <div key={index} className="pt-4 first:pt-0 flex justify-between items-center gap-4">
                    <div>
                      <h4 className="font-bold text-white text-xs">{item.title}</h4>
                      <span className="text-[10px] text-brand-red font-semibold uppercase mt-1 block">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white">{item.price} ₽</span>
                      <span className="text-[9px] text-green-500 font-semibold block mt-0.5">Оплачено</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-brand-textMuted text-center py-6">Вы ещё не совершили ни одной покупки.</p>
              )}
            </div>
          )}

          {profileTab === 'about' && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 max-w-2xl text-xs text-brand-text leading-relaxed">
              <p>{profile.description}</p>
            </div>
          )}
        </div>
      </section>

      {/* Add Listing Modal overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Создать объявление</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-brand-textMuted hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-textMuted">Игра / Категория</label>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2.5 px-3 text-xs text-white"
                >
                  <option value="GTA V">GTA V</option>
                  <option value="CS 2">CS 2</option>
                  <option value="Steam">Steam</option>
                  <option value="Valorant">Valorant</option>
                  <option value="Fortnite">Fortnite</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-textMuted">Название лота</label>
                <input
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  type="text"
                  placeholder="Например, CS 2 Личный Прайм"
                  required
                  className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2.5 px-3 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-textMuted">Подробное описание</label>
                <input
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  type="text"
                  placeholder="Уровень, скины, звание..."
                  required
                  className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2.5 px-3 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-textMuted">Цена (в рублях)</label>
                <input
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                  type="number"
                  placeholder="500"
                  required
                  className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2.5 px-3 text-xs text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-textMuted">Срок доставки (дней)</label>
                <input
                  value={addForm.delivery_days}
                  onChange={(e) => setAddForm({ ...addForm, delivery_days: e.target.value })}
                  type="number"
                  placeholder="3"
                  min="1"
                  required
                  className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2.5 px-3 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl shadow-glow-red transition-all duration-300"
              >
                Опубликовать лот
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
