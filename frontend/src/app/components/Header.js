'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../AppContext';
import * as api from '../../lib/api';

export default function Header() {
  const {
    profile,
    notifications,
    clearNotifications,
    searchQuery,
    setSearchQuery,
    setCatalogFilter,
    user,
    isAuthenticated,
    hydrated,
  } = useApp();

  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      setCatalogFilter('all');
      router.push('/catalog');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-md border-b border-white/5 py-4 px-6">
      <div className="flex items-center justify-between w-full max-w-screen-2xl mx-auto gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0 cursor-pointer">
          <svg fill="none" height="42" viewBox="0 0 40 46" width="37" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0L39.0526 11V33L20 44L0.947441 33V11L20 0Z" stroke="#E53935" strokeWidth="2"></path>
            <path d="M28.5 22.5C28.5 24.9853 26.4853 27 24 27C21.5147 27 19.5 24.9853 19.5 22.5C19.5 20.0147 21.5147 18 24 18C26.4853 18 28.5 20.0147 28.5 22.5Z" fill="#E53935"></path>
            <path d="M16 22.5C16 24.9853 13.9853 27 11.5 27C9.01472 27 7 24.9853 7 22.5C7 20.0147 9.01472 18 11.5 18C13.9853 18 16 20.0147 16 22.5Z" fill="#E53935"></path>
            <rect fill="#0A0A0A" height="7" width="2" x="23" y="19"></rect>
            <rect fill="#0A0A0A" height="2" width="7" x="20.5" y="21.5"></rect>
            <circle cx="10" cy="22.5" fill="#0A0A0A" r="1.5"></circle>
            <circle cx="13" cy="22.5" fill="#0A0A0A" r="1.5"></circle>
            <path d="M12.5 13L16 16.5M27.5 13L24 16.5" stroke="#E53935" strokeLinecap="round" strokeWidth="2"></path>
          </svg>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link href="/" className={`transition-all py-1.5 px-3 rounded-lg ${pathname === '/' ? 'text-white bg-white/5 active-nav-glow' : 'text-brand-text hover:text-white'}`}>
            Главная
          </Link>
          <Link href="/catalog" className={`transition-all py-1.5 px-3 rounded-lg ${pathname === '/catalog' ? 'text-white bg-white/5 active-nav-glow' : 'text-brand-textMuted hover:text-white'}`}>
            Категории
          </Link>
          {isAuthenticated && (
            <Link href="/messages" className={`transition-all py-1.5 px-3 rounded-lg flex items-center gap-1.5 ${pathname === '/messages' ? 'text-white bg-white/5 active-nav-glow' : 'text-brand-textMuted hover:text-white'}`}>
              Чаты <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-ping"></span>
            </Link>
          )}
          <Link href="/profile" className={`transition-all py-1.5 px-3 rounded-lg ${pathname.startsWith('/profile') ? 'text-white bg-white/5 active-nav-glow' : 'text-brand-textMuted hover:text-white'}`}>
            Профиль
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-brand-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="block w-full pl-9 pr-3 py-2 border border-transparent rounded-lg bg-brand-input text-white placeholder-brand-textMuted focus:outline-none focus:bg-white/5 focus:border-brand-red/50 sm:text-xs transition-colors"
              placeholder="Поиск по играм, категориям, объявлениям..."
              type="text"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0 relative">
          {/* Categories Icon */}
          <Link href="/catalog" className="text-brand-textMuted hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5" title="Категории">
            <i className="fa-solid fa-layer-group text-lg"></i>
          </Link>

          {/* Favorites Icon */}
          <Link href="/catalog" onClick={() => setCatalogFilter('favorites')} className="text-brand-textMuted hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5" title="Избранное">
            <i className="fa-regular fa-heart text-lg"></i>
          </Link>

          {/* Notifications Icon */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-brand-textMuted hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5 relative"
            title="Уведомления"
          >
            <i className="fa-regular fa-bell text-lg"></i>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-brand-red shadow-glow-red animate-pulse"></span>
            )}
          </button>

          {/* Chats Shortcut */}
          {isAuthenticated && (
            <Link href="/messages" className="text-brand-textMuted hover:text-white transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white/5" title="Сообщения">
              <i className="fa-regular fa-comments text-lg"></i>
            </Link>
          )}

          {/* User Avatar / Auth */}
          {/* 
            Render the exact same content on server + first client render to prevent hydration mismatch.
            Server always sees !isAuthenticated + no avatar (DEFAULT_PROFILE).
            We show "Войти" on initial render (before hydrated), then switch to real user info after mount + LS/auth sync.
            This eliminates the +div / -span error seen in dev logs.
          */}
          <Link href="/profile" className="flex items-center gap-2 text-xs" title="Профиль" suppressHydrationWarning>
            {(!hydrated || !isAuthenticated) && (
              <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded bg-brand-red/10 text-brand-red">Войти</span>
            )}
            {hydrated && isAuthenticated && profile.avatar && (
              <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 hover:border-brand-red flex-shrink-0 cursor-pointer block transition-all bg-brand-input">
                <img alt="User Avatar" className="h-full w-full object-cover" src={api.getFullUrl(profile.avatar)} />
              </div>
            )}
            {hydrated && isAuthenticated && profile.name && (
              <span className="hidden md:inline text-brand-textMuted hover:text-white font-medium">{profile.name}</span>
            )}
          </Link>

          {/* Notifications Dropdown Box */}
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-brand-card border border-brand-border w-80 rounded-2xl p-4 shadow-glass z-50 space-y-3">
              <div className="flex justify-between items-center border-b border-brand-border pb-2">
                <h4 className="text-xs font-bold text-white">Уведомления</h4>
                <button onClick={() => { clearNotifications(); setShowNotifications(false); }} className="text-[10px] text-brand-red hover:underline font-semibold">Очистить все</button>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} className="text-xs border-b border-brand-border/40 pb-2 last:border-0 last:pb-0">
                      <p className="text-white font-medium leading-snug">{n.text}</p>
                      <span className="text-[9px] text-brand-textMuted mt-1 block">{n.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-brand-textMuted text-center py-4">Нет новых уведомлений</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
