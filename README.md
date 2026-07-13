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
NEXT_PUBLIC_API_BASE=https://your-ngrok-or-backend-url
```

## Deploy (Vercel)

- Root directory: `frontend`
- Установи переменную окружения `NEXT_PUBLIC_API_BASE` на URL бэкенда.

## Notes

- Все данные (авторизация, лоты, заказы, чаты) идут через реальный API.
- Пустые аккаунты: без аватарок, без ID в шапке, без фейковых отзывов.
- После покупки автоматически открывается чат с продавцом.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
