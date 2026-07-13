import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select

from app.api.deps import CurrentUser, DbSession
from app.models.listing import Listing
from app.schemas.listing import ListingCreate, ListingResponse, ListingUpdate

router = APIRouter()


@router.get("", response_model=list[ListingResponse])
async def list_listings(
    db: DbSession,
    q: Annotated[str | None, Query(max_length=100)] = None,
    category: Annotated[str | None, Query(max_length=64)] = None,
    seller_id: uuid.UUID | None = None,
    min_price: Annotated[int | None, Query(ge=0)] = None,
    max_price: Annotated[int | None, Query(ge=0)] = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[Listing]:
    query = select(Listing).where(Listing.is_active.is_(True))
    if q:
        pattern = f"%{q.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Listing.title).like(pattern),
                func.lower(Listing.description).like(pattern),
            )
        )
    if category:
        query = query.where(Listing.category == category.strip().lower())
    if seller_id:
        query = query.where(Listing.seller_id == seller_id)
    if min_price is not None:
        query = query.where(Listing.price_minor >= min_price)
    if max_price is not None:
        query = query.where(Listing.price_minor <= max_price)
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=422, detail="min_price не может быть больше max_price")
    result = await db.scalars(query.order_by(Listing.created_at.desc()).offset(offset).limit(limit))
    return list(result)


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(data: ListingCreate, db: DbSession, current_user: CurrentUser) -> Listing:
    listing = Listing(seller_id=current_user.id, **data.model_dump())
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(listing_id: uuid.UUID, db: DbSession) -> Listing:
    listing = await db.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    return listing


@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: uuid.UUID, data: ListingUpdate, db: DbSession, current_user: CurrentUser
) -> Listing:
    listing = await db.get(Listing, listing_id)
    if listing is None or listing.seller_id != current_user.id:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    changes = data.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Не переданы изменения")
    for field, value in changes.items():
        setattr(listing, field, value)
    await db.commit()
    await db.refresh(listing)
    return listing


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: uuid.UUID, db: DbSession, current_user: CurrentUser
) -> Response:
    listing = await db.get(Listing, listing_id)
    if listing is None or listing.seller_id != current_user.id:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    listing.is_active = False
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
