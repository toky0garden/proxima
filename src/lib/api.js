// IMPORTANT: Set NEXT_PUBLIC_API_BASE in .env.local to your current ngrok (or other) backend URL.
// Using current ngrok: https://2e6d-167-148-123-70.ngrok-free.app/
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://2e6d-167-148-123-70.ngrok-free.app';

export function getFullUrl(path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return path;
}

let accessToken = null;
let refreshToken = null;

export function setTokens(tokens) {
  accessToken = tokens?.access_token || null;
  refreshToken = tokens?.refresh_token || null;
  if (typeof window !== 'undefined') {
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  }
}

export function loadTokens() {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token');
    refreshToken = localStorage.getItem('refresh_token');
  }
  return { accessToken, refreshToken };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export function getAccessToken() {
  return accessToken;
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // Network / CORS / dead ngrok / DNS error
    throw new Error(
      `Не удалось подключиться к API. ` +
      `Текущий адрес: ${API_BASE}. ` +
      `1) Убедитесь что ваш ngrok (или бэкенд) запущен. ` +
      `2) Создайте/обновите файл .env.local рядом с package.json: NEXT_PUBLIC_API_BASE=https://<ваш-новый-ngrok>.ngrok-free.app ` +
      `3) Перезапустите npm run dev после изменения .env.local.`
    );
  }

  if (res.status === 401 && refreshToken) {
    // Try to refresh once
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.Authorization = `Bearer ${accessToken}`;
      return fetch(url, { ...options, headers });
    } else {
      clearTokens();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      if (Array.isArray(err.detail)) {
        // Validation error (422)
        detail = err.detail.map(e => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : '';
          const msg = e.msg || e.message || '';
          return field ? `${field}: ${msg}` : msg;
        }).join('; ');
      } else if (err.detail && typeof err.detail === 'object') {
        detail = JSON.stringify(err.detail);
      } else if (typeof err.detail === 'string') {
        detail = err.detail;
      } else if (err.detail) {
        detail = String(err.detail);
      } else {
        detail = JSON.stringify(err);
      }
    } catch {
      detail = res.statusText;
    }
    throw new Error(`API error ${res.status}: ${detail}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function tryRefresh() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh?ngrok-skip-browser-warning=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const tokens = await res.json();
    setTokens(tokens);
    return true;
  } catch {
    return false;
  }
}

// === Auth ===
export async function register({ email, username, password }) {
  const user = await apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
  return user;
}

export async function login({ email, password }) {
  const tokens = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(tokens);
  return tokens;
}

export async function logout() {
  try {
    if (refreshToken) {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch {}
  clearTokens();
}

export async function fetchMe() {
  return apiFetch('/api/v1/users/me');
}

export async function getPublicUser(userId) {
  return apiFetch(`/api/v1/users/${userId}`);
}

export async function updateMe(data) {
  return apiFetch('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// === Listings ===
export async function listListings(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.seller_id) query.set('seller_id', params.seller_id);
  if (params.min_price != null) query.set('min_price', params.min_price);
  if (params.max_price != null) query.set('max_price', params.max_price);
  query.set('limit', params.limit || 50);
  query.set('offset', params.offset || 0);

  return apiFetch(`/api/v1/listings?${query.toString()}`);
}

export async function getListing(id) {
  return apiFetch(`/api/v1/listings/${id}`);
}

export async function createListing(data) {
  // data: { title, description, category, price_minor, delivery_days, currency? }
  return apiFetch('/api/v1/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteListing(id) {
  return apiFetch(`/api/v1/listings/${id}`, { method: 'DELETE' });
}

// === Orders (purchase flow) ===
export async function createOrder({ listing_id, requirements }) {
  return apiFetch('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify({ listing_id, requirements }),
  });
}

export async function listOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.status) query.set('status', params.status);
  return apiFetch(`/api/v1/orders?${query.toString()}`);
}

// === Chats (basic) ===
export async function listChats() {
  return apiFetch('/api/v1/chats');
}

export async function createChat({ recipient_id, order_id }) {
  return apiFetch('/api/v1/chats', {
    method: 'POST',
    body: JSON.stringify({ recipient_id, order_id }),
  });
}

export async function getChat(conversationId) {
  return apiFetch(`/api/v1/chats/${conversationId}`);
}

export async function listMessages(conversationId) {
  return apiFetch(`/api/v1/chats/${conversationId}/messages`);
}

export async function sendMessage(conversationId, body) {
  return apiFetch(`/api/v1/chats/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function markChatRead(conversationId) {
  return apiFetch(`/api/v1/chats/${conversationId}/read`, { method: 'POST' });
}

// === Avatar Upload (real backend) ===
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/users/me/avatar?ngrok-skip-browser-warning=true`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {}
    throw new Error(`Не удалось загрузить аватар: ${detail}`);
  }

  return res.json(); // UserResponse with new avatar_url
}

export async function deleteAvatar() {
  const res = await fetch(`${API_BASE}/api/v1/users/me/avatar?ngrok-skip-browser-warning=true`, {
    method: 'DELETE',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('Не удалось удалить аватар');
  }
}
