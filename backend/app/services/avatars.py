import asyncio
import io

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

MAX_AVATAR_BYTES = 5 * 1024 * 1024


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
        raise HTTPException(status_code=413, detail="Максимальный размер аватара — 5 МБ")
    return await asyncio.to_thread(_convert_to_webp, content)
