import asyncio
import io
from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from vercel.blob import AsyncBlobClient
from vercel.blob.errors import BlobError

from app.core.config import settings

MAX_AVATAR_BYTES = 4 * 1024 * 1024


@dataclass(frozen=True, slots=True)
class StoredAvatar:
    url: str
    pathname: str


class BlobStorageError(RuntimeError):
    """Vercel Blob could not complete an avatar operation."""


def _convert_to_webp(content: bytes) -> bytes:
    output = io.BytesIO()
    try:
        with Image.open(io.BytesIO(content)) as image:
            image.load()
            if image.width < 1 or image.height < 1 or image.width > 10_000 or image.height > 10_000:
                raise HTTPException(status_code=422, detail="Недопустимый размер изображения")
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            image.thumbnail((1024, 1024))
            image.save(output, "WEBP", quality=85, method=6)
    except (Image.DecompressionBombError, UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=422, detail="Файл не является корректным изображением"
        ) from exc
    return output.getvalue()


async def prepare_avatar(file: UploadFile) -> bytes:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Поддерживаются JPEG, PNG и WebP")
    content = await file.read(MAX_AVATAR_BYTES + 1)
    await file.close()
    if not content:
        raise HTTPException(status_code=422, detail="Пустой файл")
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Максимальный размер аватара — 4 МБ")
    return await asyncio.to_thread(_convert_to_webp, content)


async def upload_avatar_blob(user_id: UUID, content: bytes) -> StoredAvatar:
    try:
        async with AsyncBlobClient(token=settings.blob_read_write_token) as client:
            uploaded = await client.put(
                f"avatars/{user_id}.webp",
                content,
                access="public",
                content_type="image/webp",
                add_random_suffix=True,
                cache_control_max_age=31_536_000,
            )
    except (BlobError, OSError) as exc:
        raise BlobStorageError("Vercel Blob upload failed") from exc
    return StoredAvatar(url=uploaded.url, pathname=uploaded.pathname)


async def delete_avatar_blob(url_or_pathname: str | None) -> None:
    if not url_or_pathname:
        return
    try:
        async with AsyncBlobClient(token=settings.blob_read_write_token) as client:
            await client.delete(url_or_pathname)
    except (BlobError, OSError) as exc:
        raise BlobStorageError("Vercel Blob delete failed") from exc
