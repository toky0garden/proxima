# Proxima — Marketplace (monorepo)

Next.js frontend + FastAPI backend.

## Structure

- `frontend/` — Next.js 16 (React 19, Turbopack) приложение
- `backend/` — FastAPI + SQLAlchemy + Alembic
- `legacy_static/` — старые статические версии (для справки)

## Run locally

### Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
# → http://localhost:8080
```

### Backend (FastAPI)

```powershell
cd backend
# (уведись что зависимости установлены, напр. через uv или pip)
uvicorn app.main:app --reload --port 8000
# OpenAPI: http://localhost:8000/docs
```

## Environment

Создай `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE=https://proxima-iota-rosy.vercel.app
```

## Deploy (Vercel)

- Root directory: `frontend`
- Установи переменную окружения `NEXT_PUBLIC_API_BASE` на URL бэкенда.
- Frontend: https://proxima-frontend-sable.vercel.app
- Backend API: https://proxima-iota-rosy.vercel.app
- Swagger: https://proxima-iota-rosy.vercel.app/docs

## Notes

- Все данные (авторизация, лоты, заказы, чаты) идут через реальный API.
- Пустые аккаунты: без аватарок, без ID в шапке, без фейковых отзывов.
- После покупки автоматически открывается чат с продавцом.

