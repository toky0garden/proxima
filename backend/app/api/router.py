from fastapi import APIRouter

from app.api.routes import auth, chats, health, listings, orders, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
