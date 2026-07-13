'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as api from '../lib/api';

const AppContext = createContext(null);

const DEFAULT_PROFILE = {
  name: '',
  avatar: '',
  banner: '',
  joinedDate: '',
  rating: '0.0',
  reviewsCount: 0,
  soldCount: 0,
  successRate: '0%',
  description: ''
};

const DEFAULT_LISTINGS = [
  { id: 1, category: 'GTA V', title: 'GTA V Premium Account', description: 'Полный доступ (Сюжет + Онлайн режим)', price: 799, status: 'В наличии', tag: 'ХИТ', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIPWdst2vh-lEeE8MBDmRoH7ZR-gacKzR-Wx9L0k0n8V_bErIarmzbeLukt4ZrPui2ElF0QjX679A1f6ImqA7khGt2sni3nB2Ln2H0NPvC8ezLef0VQO4Px5dLkdA5_4BvjPBpBoW9XeW4MIJiZr5PKi0_QhjOiOpnKaHtN0-b0xbJnJ7udpxU847-3h1P-QlZ4DjEWrn4wq8OUNIKDdezVOQIEEhOmW0V1HjqWOd_SFX1ptVqa8Mr7Q' },
  { id: 2, category: 'GTA V', title: 'GTA Online аккаунт', description: 'Личный аккаунт (50 ур., 100 млн $)', price: 499, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPsMMGk1uUo_QAd9jw7_kidMZGP0G401e2YzWsllj98ffaKoNbeBneTZqb3hrEN0TbX2xfPXrjUFc3ofNSKao8zJIAq-lFI3tqWLt3SEGlz0ceQAnQtiiNcknqJebsGYAp9izrMJgS-bhD-0uGUJIylIEqmAg2VPCDTddDu5iFmSABpoDR6bLCjkqHC9CakDW10MFxxxLQVd8u4Y6Do32kMKa4QTZJL6YedunQhhw2zcB_lwftzjS-2g' },
  { id: 3, category: 'GTA V', title: 'GTA V (ПК) аккаунт', description: 'Лицензионный чистый аккаунт Epic Games', price: 299, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPsMMGk1uUo_QAd9jw7_kidMZGP0G401e2YzWsllj98ffaKoNbeBneTZqb3hrEN0TbX2xfPXrjUFc3ofNSKao8zJIAq-lFI3tqWLt3SEGlz0ceQAnQtiiNcknqJebsGYAp9izrMJgS-bhD-0uGUJIylIEqmAg2VPCDTddDu5iFmSABpoDR6bLCjkqHC9CakDW10MFxxxLQVd8u4Y6Do32kMKa4QTZJL6YedunQhhw2zcB_lwftzjS-2g' },
  
  { id: 4, category: 'CS 2', title: 'CS 2 Prime Account', description: 'Звание Калаш, 10 уровень faceit', price: 899, status: 'В наличии', tag: 'ПОПУЛЯРНО', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABX4iLh8WGZ9_C-8O7hc5SeroowtzA5RiteLcGRpduf4qSySxUJ2jsx24xytlBpYQyZ8wr3EEJbf7wUbT3ONqUZqmlwTbMhxaK-yMudmqPbEE28lg49xLW2xQNxSVpcmGU4zbKj9apGnsG-wY2ubBmMpa20ssGjKhkTu_kzwxu1aJ8FC0G0VuIhNFsaEQJDRlcbmu1p8vPeE_rb_gUT4nimNRB50GEqlL2cn5ROcdhUcoD_2EEvXreUw' },
  { id: 5, category: 'CS 2', title: 'CS 2 Аккаунт', description: 'Без прайма, калибровка 10 побед', price: 499, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABX4iLh8WGZ9_C-8O7hc5SeroowtzA5RiteLcGRpduf4qSySxUJ2jsx24xytlBpYQyZ8wr3EEJbf7wUbT3ONqUZqmlwTbMhxaK-yMudmqPbEE28lg49xLW2xQNxSVpcmGU4zbKj9apGnsG-wY2ubBmMpa20ssGjKhkTu_kzwxu1aJ8FC0G0VuIhNFsaEQJDRlcbmu1p8vPeE_rb_gUT4nimNRB50GEqlL2cn5ROcdhUcoD_2EEvXreUw' },
  { id: 6, category: 'CS 2', title: 'CS 2 Инвентарь', description: 'Нож и скины на сумму 5000 руб', price: 1299, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABX4iLh8WGZ9_C-8O7hc5SeroowtzA5RiteLcGRpduf4qSySxUJ2jsx24xytlBpYQyZ8wr3EEJbf7wUbT3ONqUZqmlwTbMhxaK-yMudmqPbEE28lg49xLW2xQNxSVpcmGU4zbKj9apGnsG-wY2ubBmMpa20ssGjKhkTu_kzwxu1aJ8FC0G0VuIhNFsaEQJDRlcbmu1p8vPeE_rb_gUT4nimNRB50GEqlL2cn5ROcdhUcoD_2EEvXreUw' },
  
  { id: 7, category: 'Steam', title: 'Steam Аккаунт', description: '15 лет выслуги, личный, 20 уровень профиля', price: 299, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNcZrNp_0IPI89qObaubHetiKhAg_uj3zHuSzju0-1cd_0pPXxO061d55XsNk8Z7TaEUOffO2nUREXrwHvn99BtQvsxFivYWP4R_9S18vSJF5M25dDD9gMnvId9pKlDnel8fyMZ5MR4uv7r38sFh9aAt6oX8SIOxLfFzvs7SiLnE5PfKHvEuKEqhHUNKY8rBLY2BKwSah4LAQo2nI3Cemwml_km79gfd98rN6Oqb39Hu108dqqNWYbQ' },
  { id: 8, category: 'Steam', title: 'Steam (CS2 + другие)', description: '50 игр, Rust, GTA V, Личный аккаунт', price: 499, status: 'В наличии', tag: 'НОВИНКА', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW3dQN7ShGvn4kdU7u7ih6-3dMtaJclbJgnYaQ1hiepanbtpOYBWWEPKZJFlhPEXvYkDCF11-4QSPIglHb5TGZuSc7662S6ernDyNGAFXBBrjk30BQB9ico_geXuiv5lDqlVf8hqNc5OPYnLiE6P0fY-d-WNC7f158tXRW9jfmsSIYR8rLYt9MblisJddns0VROfbWmUK-6urYlUGdoTeQAUWry1WQ1QypS86i1zhNp_J8Dy92cj4piA' },
  { id: 9, category: 'Steam', title: 'Steam Инвентарь', description: 'Коллекционные карточки, фоны, гифты игр', price: 399, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNcZrNp_0IPI89qObaubHetiKhAg_uj3zHuSzju0-1cd_0pPXxO061d55XsNk8Z7TaEUOffO2nUREXrwHvn99BtQvsxFivYWP4R_9S18vSJF5M25dDD9gMnvId9pKlDnel8fyMZ5MR4uv7r38sFh9aAt6oX8SIOxLfFzvs7SiLnE5PfKHvEuKEqhHUNKY8rBLY2BKwSah4LAQo2nI3Cemwml_km79gfd98rN6Oqb39Hu108dqqNWYbQ' },
  
  { id: 10, category: 'Valorant', title: 'Valorant Аккаунт', description: 'Звание Платина 2, 12 донат скинов', price: 1299, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w' },
  { id: 11, category: 'Valorant', title: 'Valorant (Прайм)', description: 'Prime Vandal, нож Керамбит, 120 уровень', price: 799, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w' },
  { id: 12, category: 'Valorant', title: 'Valorant Скины', description: 'Личный инвентарь со скинами, полная смена почты', price: 899, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w' },
  
  { id: 13, category: 'Fortnite', title: 'Fortnite Аккаунт', description: '120 скинов, Travis Scott, 1 сезон', price: 599, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIc8OBnSOW4p61G-llvPlpYoyIfirHbMH5tewwjDDktIwYu8otbk47ynr37lWH675BNKQQ5fc0mgFzFwlWQYh29qkXVHenN0mxcMSZfEvXPadIO1xwhaTFVjWV2enRQcHMcSPG6zsQGPWo4S12bdCuzj-SRXB902vpX4SWgZlUsrVPzxmEuEH45Stjwj2R1IEH7IpYiok_TL5Z6sdmcHWKB3IFDtdJaoL9qHmuifDOl0Cvj06tnAAAHA' },
  { id: 14, category: 'Fortnite', title: 'Fortnite Скины', description: 'Скины MARVEL, эксклюзивная кирка Minty Ax', price: 899, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIc8OBnSOW4p61G-llvPlpYoyIfirHbMH5tewwjDDktIwYu8otbk47ynr37lWH675BNKQQ5fc0mgFzFwlWQYh29qkXVHenN0mxcMSZfEvXPadIO1xwhaTFVjWV2enRQcHMcSPG6zsQGPWo4S12bdCuzj-SRXB902vpX4SWgZlUsrVPzxmEuEH45Stjwj2R1IEH7IpYiok_TL5Z6sdmcHWKB3IFDtdJaoL9qHmuifDOl0Cvj06tnAAAHA' },
  { id: 15, category: 'Fortnite', title: 'Fortnite (Полный доступ)', description: 'Родная почта с чеками, 50 скинов', price: 1499, status: 'В наличии', tag: '', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIc8OBnSOW4p61G-llvPlpYoyIfirHbMH5tewwjDDktIwYu8otbk47ynr37lWH675BNKQQ5fc0mgFzFwlWQYh29qkXVHenN0mxcMSZfEvXPadIO1xwhaTFVjWV2enRQcHMcSPG6zsQGPWo4S12bdCuzj-SRXB902vpX4SWgZlUsrVPzxmEuEH45Stjwj2R1IEH7IpYiok_TL5Z6sdmcHWKB3IFDtdJaoL9qHmuifDOl0Cvj06tnAAAHA' }
];

const DEFAULT_REVIEWS = [
  { id: 1, user: 'PlayerOne', stars: 5, text: 'Отличный продавец! Аккаунт получил мгновенно, всё как в описании. Рекомендую!', date: 'Сегодня, 12:45' },
  { id: 2, user: 'NickPro', stars: 5, text: 'Быстрая доставка, честный продавец. Покупаю не первый раз, всегда всё на высшем уровне.', date: 'Вчера, 18:30' },
  { id: 3, user: 'AlexGaming', stars: 5, text: 'Отличные цены и поддержка 24/7. Помогли с выбором, остался доволен!', date: 'Вчера, 15:20' },
  { id: 4, user: 'GameMaster', stars: 5, text: 'Аккаунт полностью соответствует описанию. Безопасная сделка, рекомендую!', date: '2 дня назад, 20:15' }
];

const DEFAULT_CHATS = [
  {
    id: 1,
    name: 'Продавец GTA V (GameTrader)',
    avatar: '',  // blank by default (no stub images)
    online: true,
    messages: [
      { sender: 'receiver', text: 'Здравствуйте! Аккаунт GTA V ещё в наличии.', time: '12:30' },
      { sender: 'sender', text: 'Да, интересует. Можно больше подробностей?', time: '12:31' },
      { sender: 'receiver', text: 'Да, конечно. Полный доступ с почтой, пройдена кампания и открыты все персонажи в онлайне.', time: '12:33' }
    ]
  },
  {
    id: 2,
    name: 'Steam Аккаунт (Продавец)',
    avatar: '',
    online: false,
    messages: [
      { sender: 'receiver', text: 'Готово, данные аккаунта проверил.', time: '11:30' }
    ]
  }
];

const DEFAULT_NOTIFICATIONS = [
  { id: 1, text: 'Ваша сделка по GTA V подтверждена сервисом.', date: '5 мин. назад', read: false },
  { id: 2, text: 'GameMaster оставил новый отзыв о вас.', date: '2 ч. назад', read: false }
];

// Helper: convert backend ListingResponse to frontend-friendly shape
function normalizeListing(l) {
  const price = Math.round((l.price_minor || 0) / 100);
  // Use category-based placeholder or keep a generic one
  const img = getPlaceholderForCategory(l.category);
  return {
    id: l.id,
    category: l.category,
    title: l.title,
    description: l.description,
    price,
    price_minor: l.price_minor,
    currency: l.currency || 'RUB',
    delivery_days: l.delivery_days || 1,
    status: l.is_active ? 'В наличии' : 'Нет в наличии',
    tag: '',
    seller_id: l.seller_id,
    img,
    created_at: l.created_at,
  };
}

const PLACEHOLDER_IMAGES = {
  'GTA V': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIPWdst2vh-lEeE8MBDmRoH7ZR-gacKzR-Wx9L0k0n8V_bErIarmzbeLukt4ZrPui2ElF0QjX679A1f6ImqA7khGt2sni3nB2Ln2H0NPvC8ezLef0VQO4Px5dLkdA5_4BvjPBpBoW9XeW4MIJiZr5PKi0_QhjOiOpnKaHtN0-b0xbJnJ7udpxU847-3h1P-QlZ4DjEWrn4wq8OUNIKDdezVOQIEEhOmW0V1HjqWOd_SFX1ptVqa8Mr7Q',
  'CS 2': 'https://lh3.googleusercontent.com/aida-public/AB6AXuABX4iLh8WGZ9_C-8O7hc5SeroowtzA5RiteLcGRpduf4qSySxUJ2jsx24xytlBpYQyZ8wr3EEJbf7wUbT3ONqUZqmlwTbMhxaK-yMudmqPbEE28lg49xLW2xQNxSVpcmGU4zbKj9apGnsG-wY2ubBmMpa20ssGjKhkTu_kzwxu1aJ8FC0G0VuIhNFsaEQJDRlcbmu1p8vPeE_rb_gUT4nimNRB50GEqlL2cn5ROcdhUcoD_2EEvXreUw',
  'Steam': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWNcZrNp_0IPI89qObaubHetiKhAg_uj3zHuSzju0-1cd_0pPXxO061d55XsNk8Z7TaEUOffO2nUREXrwHvn99BtQvsxFivYWP4R_9S18vSJF5M25dDD9gMnvId9pKlDnel8fyMZ5MR4uv7r38sFh9aAt6oX8SIOxLfFzvs7SiLnE5PfKHvEuKEqhHUNKY8rBLY2BKwSah4LAQo2nI3Cemwml_km79gfd98rN6Oqb39Hu108dqqNWYbQ',
  'Valorant': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkjihwSLJqBjv1XO9emV8pWzcpE3RDlz0h49Qe173Wr-peiMX8acHRyjD9YFc5GKk46GfLKnHr4q8Ld02qG9bF7jagCKxxY3O70F3mHKHq-RkqHXWxvro8ZZGh1oNQIL3AWO5HhjdctHgCiKBkbDfw5hWu0N3fukAhUQ386ULZ_hU5SkZMmZ2UFubdlVIrMrpfyyYQtpvsPpd2OLnCFLvBLVtpqbgMskHWB2iMJDZ6-zjfX-_8hPfy7w',
  'Fortnite': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIc8OBnSOW4p61G-llvPlpYoyIfirHbMH5tewwjDDktIwYu8otbk47ynr37lWH675BNKQQ5fc0mgFzFwlWQYh29qkXVHenN0mxcMSZfEvXPadIO1xwhaTFVjWV2enRQcHMcSPG6zsQGPWo4S12bdCuzj-SRXB902vpX4SWgZlUsrVPzxmEuEH45Stjwj2R1IEH7IpYiok_TL5Z6sdmcHWKB3IFDtdJaoL9qHmuifDOl0Cvj06tnAAAHA',
};

function getPlaceholderForCategory(cat = '') {
  const key = Object.keys(PLACEHOLDER_IMAGES).find(k => cat.toLowerCase().includes(k.toLowerCase()));
  return PLACEHOLDER_IMAGES[key] || 'https://picsum.photos/id/1015/600/400';
}

export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  // States
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [listings, setListings] = useState(DEFAULT_LISTINGS);
  const [chats, setChats] = useState(DEFAULT_CHATS);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [favorites, setFavorites] = useState([]);
  const [purchasedLots, setPurchasedLots] = useState([]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('all');
  const [profileTab, setProfileTab] = useState('lots');
  const [selectedStars, setSelectedStars] = useState(5);
  const [tempPurchasedItem, setTempPurchasedItem] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Simple toast system (like shadcn/ui)
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load auth + data on mount
  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') return;

      // Load from localStorage on client *after mount* to ensure first render matches server (avoids hydration mismatch on listings/favorites etc.)
      try {
        const savedProfile = localStorage.getItem('profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed && typeof parsed === 'object') setProfile(parsed);
        }
        const savedListings = localStorage.getItem('listings');
        if (savedListings) {
          const parsed = JSON.parse(savedListings);
          if (Array.isArray(parsed) && parsed.length > 0) setListings(parsed);
        }
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
        const savedPurchased = localStorage.getItem('purchasedLots');
        if (savedPurchased) {
          const parsed = JSON.parse(savedPurchased);
          if (Array.isArray(parsed)) setPurchasedLots(parsed);
        }
        const savedReviews = localStorage.getItem('reviews');
        if (savedReviews) {
          const parsed = JSON.parse(savedReviews);
          if (Array.isArray(parsed)) setReviews(parsed);
        }
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications);
          if (Array.isArray(parsed)) setNotifications(parsed);
        }
        const savedChats = localStorage.getItem('chats');
        if (savedChats) {
          const parsed = JSON.parse(savedChats);
          if (Array.isArray(parsed)) setChats(parsed);
        }
      } catch {}

      api.loadTokens();

      // Try restore user
      try {
        const me = await api.fetchMe();
        if (me) {
          setUser(me);
          setIsAuthenticated(true);
          // Sync ONLY name from backend. Avatar is controlled by local profile (LS / preview / explicit save).
          // If local profile.avatar is present (incl. explicitly ''), keep it — prevents pulling backend defaults/stubs on new or cleared accounts.
          setProfile(prev => {
            const hasLocalAvatar = prev.avatar != null;
            // Respect explicit local name/avatar (even empty string for "пустой аккаунт") to avoid pulling backend numeric ID/username or default avatar on reload
            const localName = prev.name != null ? prev.name : (me.username || '');
            return {
              ...prev,
              name: localName,
              avatar: hasLocalAvatar ? prev.avatar : (me.avatar_url ? api.getFullUrl(me.avatar_url) : ''),
            };
          });

          // Load real chats from backend
          try {
            const realChats = await api.listChats();
            const myId = me.id;
            const normalized = await Promise.all((realChats || []).map(async (c) => {
              const otherId = myId === c.participant_one_id ? c.participant_two_id : c.participant_one_id;
              let other = { username: 'Пользователь', avatar_url: '' };
              try {
                other = await api.getPublicUser(otherId);
              } catch {}
              return {
                id: c.id,
                name: other.username || 'Продавец',
                avatar: other.avatar_url || '',
                online: false,
                messages: [],
                order_id: c.order_id,
              };
            }));
            setChats(normalized);
          } catch (e) {
            console.warn('Failed to load real chats', e);
          }
        }
      } catch (e) {
        // no valid session
        api.clearTokens();
      }

      // Load listings from real API (fallback to local if fails)
      try {
        const remoteListings = await api.listListings({ limit: 100 });
        if (Array.isArray(remoteListings) && remoteListings.length > 0) {
          // Normalize backend shape to frontend shape (price_minor -> price, add img placeholder)
          const normalized = remoteListings.map(normalizeListing);
          setListings(normalized);
        }
      } catch (e) {
        // Backend (ngrok) often unreachable in this env — silent fallback is expected.
        if (typeof window !== 'undefined' && !window.__listingsWarned) {
          console.info('Listings: using local data (backend not reachable).');
          window.__listingsWarned = true;
        }
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHydrated(true);
      setAuthLoading(false);
    }
    init();
  }, []);

  // Save states to localStorage when they change
  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('profile', JSON.stringify(profile));
    }
  }, [profile, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('listings', JSON.stringify(listings));
    }
  }, [listings, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('reviews', JSON.stringify(reviews));
    }
  }, [reviews, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, hydrated]);

  useEffect(() => {
    if (hydrated && typeof window !== 'undefined') {
      localStorage.setItem('purchasedLots', JSON.stringify(purchasedLots));
    }
  }, [purchasedLots, hydrated]);

  // Actions
  const addNotification = (text) => {
    const newNotif = {
      id: Date.now(),
      text,
      date: 'Только что',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev => {
      if (prev.includes(itemId)) {
        addNotification(`Лот удален из избранного.`);
        return prev.filter(id => id !== itemId);
      } else {
        addNotification(`Лот добавлен в избранное!`);
        return [...prev, itemId];
      }
    });
  };

  const deleteListing = async (id) => {
    try {
      await api.deleteListing(id);
      setListings(prev => prev.filter(x => x.id !== id));
      addNotification('Объявление успешно удалено.');
    } catch (e) {
      // fallback to local delete
      setListings(prev => prev.filter(x => x.id !== id));
      addNotification('Удалено локально (сервер): ' + e.message);
    }
  };

  const clearChatHistory = (chatId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [] } : c));
    addNotification('История чата очищена.');
  };

  const blockChatUser = (chatId) => {
    addNotification('Собеседник заблокирован.');
  };

  const sendMessage = async (chatId, text) => {
    try {
      await api.sendMessage(chatId, text);
      // Reload messages for this chat
      const msgs = await api.listMessages(chatId);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: msgs } : c));
    } catch (e) {
      addNotification('Ошибка отправки сообщения: ' + e.message);
    }
  };

  // purchaseItem is defined later as async API version

  const submitReview = (stars, comment) => {
    const newReview = {
      id: Date.now(),
      user: 'Вы',
      stars,
      text: comment || 'Без комментария.',
      date: 'Только что'
    };

    setReviews(prev => [newReview, ...prev]);

    // Recalculate average profile rating
    setProfile(prev => {
      const oldRating = parseFloat(prev.rating);
      const oldReviewsCount = prev.reviewsCount;
      const newReviewsCount = oldReviewsCount + 1;
      const newRating = ((oldRating * oldReviewsCount + stars) / newReviewsCount).toFixed(1);
      return {
        ...prev,
        rating: newRating,
        reviewsCount: newReviewsCount
      };
    });

    addNotification('Ваш отзыв успешно опубликован!');
    setTempPurchasedItem(null);
  };

  // === Real API Auth & Data ===
  const login = async (email, password) => {
    const tokens = await api.login({ email, password });
    const me = await api.fetchMe();
    setUser(me);
    setIsAuthenticated(true);
    setProfile(prev => {
      const hasLocalAvatar = prev.avatar != null;
      const localName = prev.name != null ? prev.name : (me.username || '');
      return {
        ...prev,
        name: localName,
        avatar: hasLocalAvatar ? prev.avatar : (me.avatar_url ? api.getFullUrl(me.avatar_url) : ''),
      };
    });
    addNotification(`Добро пожаловать, ${me.username}!`);
    return me;
  };

  const register = async (email, username, password) => {
    await api.register({ email, username, password });
    // Auto-login after register
    const result = await login(email, password);
    // For a brand new account, reset to completely empty (no name/avatar shown until user explicitly saves in edit).
    // This ensures "пустой аккаунт" has zero stubs, no numeric ID, no icons.
    setProfile({
      ...DEFAULT_PROFILE,
      // do not prefill name from register username — user sets desired nick via edit "Сохранить"
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile', JSON.stringify({ ...DEFAULT_PROFILE }));
    }
    return result;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setIsAuthenticated(false);
    addNotification('Вы вышли из аккаунта.');
  };

  const refreshListings = useCallback(async (params = {}) => {
    try {
      const remote = await api.listListings({ limit: 100, ...params });
      const normalized = remote.map(normalizeListing);
      setListings(normalized);
      return normalized;
    } catch (e) {
      addNotification('Не удалось загрузить объявления с сервера.');
      throw e;
    }
  }, [addNotification]);

  const uploadAvatarFile = async (file) => {
    const updatedUser = await api.uploadAvatar(file);
    setUser(updatedUser);

    // Update profile avatar from backend, but keep local data: if we have one
    if (updatedUser.avatar_url) {
      const serverAvatar = api.getFullUrl(updatedUser.avatar_url);
      setProfile(prev => ({
        ...prev,
        avatar: (prev.avatar && prev.avatar.startsWith('data:')) ? prev.avatar : serverAvatar,
      }));
    }
    addNotification('Аватар успешно загружен!');
    return updatedUser;
  };

  const removeAvatar = async () => {
    try {
      await api.deleteAvatar();
    } catch (e) {
      // ignore if already gone
    }
    const me = await api.fetchMe().catch(() => null);
    if (me) setUser(me);
    // Force blank — no stub fallback images. Empty accounts stay blank.
    setProfile(prev => ({
      ...prev,
      avatar: '',
    }));
    addNotification('Аватар удалён.');
  };

  const updateProfile = async (data) => {
    const updatedUser = await api.updateMe(data);
    setUser(updatedUser);
    if (data.username) {
      setProfile(prev => ({
        ...prev,
        name: data.username,
      }));
    }
    return updatedUser;
  };

  const addListing = async (category, title, description, price, deliveryDays = 3) => {
    const price_minor = Math.round(Number(price) * 100);
    const newListing = await api.createListing({
      title,
      description,
      category,
      price_minor,
      delivery_days: Number(deliveryDays) || 3,
      currency: 'RUB',
    });

    const normalized = normalizeListing(newListing);
    setListings(prev => [normalized, ...prev]);
    addNotification(`Вы выставили на продажу новый лот: "${title}"`);
    return normalized;
  };

  const purchaseItem = async (item, requirements = 'Покупка через маркетплейс') => {
    if (!isAuthenticated) {
      addNotification('Сначала войдите в аккаунт, чтобы купить.');
      router.push('/profile');
      return;
    }
    if (user?.id && item.seller_id && item.seller_id === user.id) {
      addNotification('Нельзя заказать собственную услугу');
      return;
    }
    try {
      const order = await api.createOrder({
        listing_id: item.id,
        requirements,
      });
      setTempPurchasedItem(item);
      setPurchasedLots(prev => [item, ...prev]);

      // Update local stats
      setProfile(prev => ({
        ...prev,
        soldCount: Number(prev.soldCount) + 1
      }));

      // Create chat with the seller and open it
      if (item.seller_id) {
        try {
          const chat = await api.createChat({
            recipient_id: item.seller_id,
            order_id: order.id,
          });
          setActiveChatId(chat.id);
          // reload chats to include the new one
          try {
            const realChats = await api.listChats();
            const myId = user?.id;
            const normalized = await Promise.all((realChats || []).map(async (c) => {
              const otherId = myId === c.participant_one_id ? c.participant_two_id : c.participant_one_id;
              let other = { username: 'Пользователь', avatar_url: '' };
              try {
                other = await api.getPublicUser(otherId);
              } catch {}
              return {
                id: c.id,
                name: other.username || 'Продавец',
                avatar: other.avatar_url || '',
                online: false,
                messages: [],
                order_id: c.order_id,
              };
            }));
            setChats(normalized);
          } catch {}
        } catch (e) {
          console.warn('Failed to create chat after purchase', e);
        }
      }

      addNotification(`Заказ создан! ID: ${order.id}. Продавец свяжется с вами.`);
      // Optionally refresh listings
      refreshListings().catch(() => {});
    } catch (e) {
      addNotification('Ошибка создания заказа: ' + e.message);
      throw e;
    }
  };

  return (
    <AppContext.Provider value={{
      hydrated,
      profile, setProfile,
      listings, setListings,
      chats, setChats,
      reviews, setReviews,
      notifications, setNotifications,
      favorites, setFavorites,
      purchasedLots, setPurchasedLots,
      activeChatId, setActiveChatId,
      selectedItem, setSelectedItem,
      searchQuery, setSearchQuery,
      catalogFilter, setCatalogFilter,
      profileTab, setProfileTab,
      selectedStars, setSelectedStars,
      tempPurchasedItem, setTempPurchasedItem,

      // Auth
      user,
      isAuthenticated,
      authLoading,
      login,
      register,
      logout,
      refreshListings,

      // Avatar
      uploadAvatarFile,
      removeAvatar,
      updateProfile,

      // Toast
      addToast,
      toasts,
      removeToast,

      // Actions
      addNotification,
      clearNotifications,
      toggleFavorite,
      deleteListing,
      addListing,
      clearChatHistory,
      blockChatUser,
      sendMessage,
      purchaseItem,
      submitReview
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
