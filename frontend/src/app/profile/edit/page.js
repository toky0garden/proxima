'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../AppContext';
import * as api from '../../../lib/api';

export default function EditProfile() {
  const { profile, setProfile, uploadAvatarFile, removeAvatar, isAuthenticated, updateProfile, addToast, user } = useApp();
  const router = useRouter();

  const avatarFileRef = useRef(null);
  const bannerFileRef = useRef(null);
  const currentAvatarBlobRef = useRef(null);
  const currentUploadedDataUrlRef = useRef(null);
  const pendingAvatarFileRef = useRef(null);

  // Local Form state (the "source of truth" for saving)
  // Start truly blank for new accounts. User types nick, it only appears in right "Предпросмотр" as they type, persists only on "Сохранить".
  const [form, setForm] = useState({
    name: profile.name || '',
    avatar: api.getFullUrl(profile.avatar) || '',
    banner: profile.banner
  });

  // Separate preview source so we can show local blob immediately without polluting the URL input
  const [avatarPreviewSrc, setAvatarPreviewSrc] = useState(api.getFullUrl(profile.avatar) || '');
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const [formErrors, setFormErrors] = useState({}); // { name: 'error msg' }

  // Keep preview in sync when the saved avatar changes (e.g. after successful upload or preset)
  // But do NOT override a local data/blob preview with a server URL from the input
  useEffect(() => {
    const full = api.getFullUrl(form.avatar);
    const isLocalPreview = avatarPreviewSrc?.startsWith('blob:') || avatarPreviewSrc?.startsWith('data:');
    if (full && full !== avatarPreviewSrc && !isLocalPreview) {
      setAvatarPreviewSrc(full);
    }
    setAvatarLoadError(false);
  }, [form.avatar]);

  // Cleanup any blob URL when leaving the edit page
  useEffect(() => {
    return () => {
      if (currentAvatarBlobRef.current) {
        URL.revokeObjectURL(currentAvatarBlobRef.current);
        currentAvatarBlobRef.current = null;
      }
    };
  }, []);

  // No avatar presets/stubs — users start blank. Only file upload or explicit URL paste allowed for avatars.
  const avatars = [];

  const banners = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBW3dQN7ShGvn4kdU7u7ih6-3dMtaJclbJgnYaQ1hiepanbtpOYBWWEPKZJFlhPEXvYkDCF11-4QSPIglHb5TGZuSc7662S6ernDyNGAFXBBrjk30BQB9ico_geXuiv5lDqlVf8hqNc5OPYnLiE6P0fY-d-WNC7f158tXRW9jfmsSIYR8rLYt9MblisJddns0VROfbWmUK-6urYlUGdoTeQAUWry1WQ1QypS86i1zhNp_J8Dy92cj4piA',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNcZrNp_0IPI89qObaubHetiKhAg_uj3zHuSzju0-1cd_0pPXxO061d55XsNk8Z7TaEUOffO2nUREXrwHvn99BtQvsxFivYWP4R_9S18vSJF5M25dDD9gMnvId9pKlDnel8fyMZ5MR4uv7r38sFh9aAt6oX8SIOxLfFzvs7SiLnE5PfKHvEuKEqhHUNKY8rBLY2BKwSah4LAQo2nI3Cemwml_km79gfd98rN6Oqb39Hu108dqqNWYbQ'
  ];

  const handleAvatarPresetClick = () => {
    // Presets disabled to prevent stub/placeholder images. Use Upload or paste URL only.
    addToast('Для аватара используйте загрузку файла или вставьте URL вручную', 'info');
  };

  const handleBannerPresetClick = () => {
    const currentIndex = banners.indexOf(form.banner);
    const nextIndex = (currentIndex + 1) % banners.length;
    setForm(prev => ({ ...prev, banner: banners[nextIndex] }));
  };

  function validateName(value) {
    if (!value || value.length < 3) return 'Минимум 3 символа';
    if (value.length > 32) return 'Максимум 32 символа';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Только латинские буквы, цифры и _';
    return null;
  }

  // Avatar file select — ONLY local preview, request only on "Сохранить изменения"
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob
    if (currentAvatarBlobRef.current) {
      URL.revokeObjectURL(currentAvatarBlobRef.current);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    currentAvatarBlobRef.current = localPreviewUrl;
    setAvatarPreviewSrc(localPreviewUrl);
    setAvatarLoadError(false);

    // Store file — will upload only on submit
    pendingAvatarFileRef.current = file;

    // Clear previous data URL ref
    currentUploadedDataUrlRef.current = null;

    if (avatarFileRef.current) avatarFileRef.current.value = '';
  };

  // Local banner upload (no backend support yet)
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('Баннер слишком большой (макс 10 МБ)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setForm(prev => ({ ...prev, banner: dataUrl }));
    };
    reader.readAsDataURL(file);

    // Clear input for re-selection
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate before sending
    const nameErr = validateName(form.name);
    if (nameErr) {
      setFormErrors(prev => ({ ...prev, name: nameErr }));
      addToast('Исправьте ошибки в форме', 'error');
      return;
    }

    let finalAvatar = form.avatar;

    try {
      // 1. Upload pending avatar if any (only on save)
      if (pendingAvatarFileRef.current) {
        const file = pendingAvatarFileRef.current;
        const updatedUser = await uploadAvatarFile(file);

        // Prepare data URL for local display
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });

        if (updatedUser?.avatar_url) {
          const serverUrl = api.getFullUrl(updatedUser.avatar_url);
          setForm(prev => ({ ...prev, avatar: serverUrl }));
          currentUploadedDataUrlRef.current = dataUrl;
          finalAvatar = dataUrl;

          // Update global profile with data for immediate visibility
          setProfile(prev => ({
            ...prev,
            avatar: dataUrl,
          }));
        }

        // cleanup
        if (currentAvatarBlobRef.current) {
          URL.revokeObjectURL(currentAvatarBlobRef.current);
          currentAvatarBlobRef.current = null;
        }
        pendingAvatarFileRef.current = null;
      } else {
        finalAvatar = currentUploadedDataUrlRef.current || api.getFullUrl(form.avatar) || form.avatar;
      }

      // 2. Update username on backend (only on save)
      if (form.name) {
        await updateProfile({ username: form.name });
      }

      // 3. Apply all local changes to global profile (preview -> saved)
      const nextProfile = {
        name: form.name,
        avatar: finalAvatar,
        banner: form.banner,
      };
      setProfile(prev => ({
        ...prev,
        ...nextProfile,
      }));

      // Explicitly save to localStorage immediately (defensive for data: URLs and F5)
      if (typeof window !== 'undefined') {
        try {
          const current = JSON.parse(localStorage.getItem('profile') || '{}');
          const toSave = { ...current, ...nextProfile };
          localStorage.setItem('profile', JSON.stringify(toSave));
        } catch {}
      }

      // Clear temp refs
      currentUploadedDataUrlRef.current = null;

      addToast('Профиль успешно обновлен!', 'success');
      router.push('/profile');
    } catch (err) {
      addToast('Ошибка при сохранении профиля: ' + (err.message || err), 'error');
    }
  };

  return (
    <main className="w-full max-w-screen-2xl mx-auto px-6 py-8 space-y-8 flex-1 animate-fadeInUp">
      
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="flex items-center gap-2 text-brand-textMuted hover:text-white transition-colors text-xs font-semibold cursor-pointer">
          <i className="fa-solid fa-arrow-left"></i>
          <span>Назад к профилю</span>
        </Link>
        <span className="text-brand-border">/</span>
        <span className="text-white text-xs font-semibold">Оформление профиля</span>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Title Bar Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Оформление профиля</h1>
            <p className="text-xs text-brand-textMuted mt-1">Настройте внешний вид вашего профиля. Это поможет вам выделиться и привлечь больше покупателей.</p>
          </div>
          <button 
            type="submit" 
            disabled={!!formErrors.name}
            className="py-3 px-6 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl shadow-glow-red transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить изменения
          </button>
        </div>

        {/* Customization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Avatar & Banner Settings Card widgets) */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Avatar Box */}
              <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-6 relative flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Аватар</h3>
                  <button type="button" onClick={handleAvatarPresetClick} className="w-8 h-8 rounded-full bg-brand-input hover:bg-white/5 border border-white/5 flex items-center justify-center text-brand-textMuted hover:text-white transition-colors" title="Пресеты для аватара отключены (во избежание заглушек)">
                    <i className="fa-solid fa-ban text-xs"></i>
                  </button>
                </div>
                
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-24 h-24">
                    {avatarPreviewSrc ? (
                      <img 
                        id="edit-avatar-preview" 
                        src={avatarPreviewSrc} 
                        className="w-24 h-24 rounded-full object-cover border-2 border-brand-red shadow-glow-red"
                        onLoad={() => setAvatarLoadError(false)}
                        onError={() => setAvatarLoadError(true)}
                      />
                    ) : null}
                    {(avatarLoadError && !avatarPreviewSrc?.startsWith('data:') && !avatarPreviewSrc?.startsWith('blob:')) && (
                      <div className="absolute inset-0 rounded-full border-2 border-brand-red bg-brand-input" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider block">Ссылка на аватарку (URL)</label>
                    <input
                      value={form.avatar}
                      onChange={(e) => {
                        const val = e.target.value;
                        const normalized = api.getFullUrl(val) || val;
                        setForm({ ...form, avatar: normalized });
                        // If there was a local upload blob, clean it up since user is overriding with URL
                        if (currentAvatarBlobRef.current) {
                          URL.revokeObjectURL(currentAvatarBlobRef.current);
                          currentAvatarBlobRef.current = null;
                        }
                        currentUploadedDataUrlRef.current = null;
                        // Update preview live when user pastes/types a URL
                        if (!avatarPreviewSrc?.startsWith('blob:')) {
                          setAvatarPreviewSrc(normalized);
                        }
                      }}
                      type="text"
                      className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => avatarFileRef.current?.click()} 
                      className="flex-1 py-2.5 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <i className="fa-solid fa-upload"></i>
                      <span>Загрузить файл</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleAvatarPresetClick} 
                      className="flex-1 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <i className="fa-solid fa-ban"></i>
                      <span>Пресет (выкл)</span>
                    </button>
                  </div>
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="text-center">
                    <button 
                      type="button" 
                      onClick={async () => {
                        try {
                          await removeAvatar();
                          // Clear local form/preview to blank (no stub)
                          setForm(prev => ({ ...prev, avatar: '' }));
                          setAvatarPreviewSrc('');
                          if (currentAvatarBlobRef.current) {
                            URL.revokeObjectURL(currentAvatarBlobRef.current);
                            currentAvatarBlobRef.current = null;
                          }
                          pendingAvatarFileRef.current = null;
                          currentUploadedDataUrlRef.current = null;
                          addToast('Аватар удалён. Сохраните изменения, чтобы применить.', 'success');
                        } catch (e) {
                          addToast('Ошибка удаления: ' + (e.message || e), 'error');
                        }
                      }} 
                      className="text-[10px] text-brand-red hover:underline mt-1"
                    >
                      Удалить аватар
                    </button>
                  </div>
                  <p className="text-[9px] text-brand-textMuted text-center leading-relaxed">Загрузка уходит на сервер. JPG/PNG/WEBP, до 5 МБ.</p>
                </div>
              </div>

              {/* Banner Box */}
              <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-6 relative flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm">Баннер профиля</h3>
                  <button type="button" onClick={handleBannerPresetClick} className="w-8 h-8 rounded-full bg-brand-input hover:bg-white/5 border border-white/5 flex items-center justify-center text-brand-textMuted hover:text-white transition-colors" title="Случайный пресет">
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10 relative bg-brand-input">
                    {form.banner ? (
                      <img id="edit-banner-preview" src={form.banner} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider block">Ссылка на баннер (URL)</label>
                    <input
                      value={form.banner}
                      onChange={(e) => setForm({ ...form, banner: e.target.value })}
                      type="text"
                      className="w-full bg-brand-input border border-brand-border focus:border-brand-red focus:ring-0 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => bannerFileRef.current?.click()} 
                      className="flex-1 py-2.5 bg-brand-red hover:bg-brand-redHover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <i className="fa-solid fa-upload"></i>
                      <span>Загрузить файл</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={handleBannerPresetClick} 
                      className="flex-1 py-2.5 bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <i className="fa-solid fa-random"></i>
                      <span>Пресет</span>
                    </button>
                  </div>
                  <input
                    ref={bannerFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <p className="text-[9px] text-brand-textMuted text-center leading-relaxed">Локальная загрузка (сохраняется в браузере). JPG/PNG/WEBP, до 10 МБ.</p>
                </div>
              </div>

            </div>

            {/* Name Input Form */}
            <div className="bg-brand-card rounded-3xl border border-brand-border p-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider block">Имя пользователя (Никнейм)</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, name: val });
                    const err = validateName(val);
                    setFormErrors(prev => ({ ...prev, name: err }));
                  }}
                  type="text"
                  required
                  className={`w-full bg-brand-input border focus:border-brand-red focus:ring-0 rounded-xl py-3 px-4 text-xs text-white ${formErrors.name ? 'border-red-500' : 'border-brand-border'}`}
                />
                {formErrors.name && <p className="text-[10px] text-red-400 mt-1">{formErrors.name}</p>}
              </div>
            </div>

          </div>

          {/* Right Column: Live preview cards */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-brand-textMuted uppercase tracking-wider block pl-2">Предпросмотр профиля</h3>
            
            <div className="bg-brand-card rounded-3xl border border-brand-border overflow-hidden shadow-glass relative pb-6">
              
              {/* Top Banner image */}
              <div className="h-28 w-full overflow-hidden relative bg-brand-input">
                {form.banner ? (
                  <img id="edit-live-banner-preview" className="w-full h-full object-cover" src={form.banner} />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card/90 to-transparent"></div>
              </div>

              {/* Details Overlay */}
              <div className="px-6 -mt-8 relative space-y-4">
                
                {/* Avatar overlapping */}
                <div className="relative w-20 h-20">
                  <div className="relative w-full h-full">
                    {avatarPreviewSrc ? (
                      <img 
                        id="edit-live-avatar-preview" 
                        className="w-full h-full object-cover rounded-full border-2 border-brand-red shadow-glow-red" 
                        src={avatarPreviewSrc} 
                      />
                    ) : null}
                    {(avatarLoadError && !avatarPreviewSrc?.startsWith('data:') && !avatarPreviewSrc?.startsWith('blob:')) && (
                      <div className="absolute inset-0 rounded-full border-2 border-brand-red bg-brand-input" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-1 block h-4 w-4 rounded-full bg-green-500 ring-2 ring-brand-card shadow-glow-green"></span>
                </div>

                {/* Nickname and Online status */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-lg font-bold text-white"><span id="edit-name-live-text" suppressHydrationWarning>{form.name}</span></h4>
                    <svg className="w-4 h-4 text-brand-red fill-current" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  </div>
                  <span className="text-[10px] font-semibold text-green-500 uppercase tracking-wider block">Онлайн</span>
                </div>

                {/* Star rating info */}
                <div className="flex items-center gap-2.5 text-[11px] text-brand-textMuted border-b border-brand-border/60 pb-4">
                  <div className="flex items-center gap-1 text-white">
                    <i className="fa-solid fa-star text-amber-500"></i>
                    <span className="font-bold">{profile.rating}</span>
                    {profile.reviewsCount > 0 && (
                      <span className="text-brand-textMuted">({profile.reviewsCount} отзывов)</span>
                    )}
                  </div>
                  <span>|</span>
                  <div className="flex items-center gap-1 text-brand-textMuted">
                    <i className="fa-solid fa-shield-halved text-brand-red"></i>
                    <span>Надежный продавец</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div className={`grid ${profile.reviewsCount > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center pt-2`}>
                  <div>
                    <div className="text-sm font-bold text-white">{profile.soldCount}</div>
                    <div className="text-[9px] text-brand-textMuted mt-0.5">Продано</div>
                  </div>
                  {profile.reviewsCount > 0 && (
                    <div>
                      <div className="text-sm font-bold text-white">{profile.reviewsCount}</div>
                      <div className="text-[9px] text-brand-textMuted mt-0.5">Отзыва</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white">{profile.successRate}</div>
                    <div className="text-[9px] text-brand-textMuted mt-0.5">Успешных</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">24/7</div>
                    <div className="text-[9px] text-brand-textMuted mt-0.5">Поддержка</div>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/profile" className="flex-1 py-3 bg-transparent hover:bg-white/5 border border-brand-border text-brand-text text-xs font-bold rounded-xl text-center transition-all">
                Отмена
              </Link>
            </div>
          </div>

        </div>
      </form>
    </main>
  );
}
