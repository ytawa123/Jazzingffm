#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "articles"
MANIFEST_FILE = ROOT / "data" / "optimized-images.json"
MAX_LONG_EDGE = 2200
WEBP_QUALITY = 82
SUPPORTED = {".jpg", ".jpeg", ".png"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def web_path(source: Path) -> Path:
    return source.with_suffix(".webp")


def load_manifest() -> dict:
    if not MANIFEST_FILE.exists():
        return {}
    try:
        return json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, TypeError):
        return {}


def collect_sources() -> list[Path]:
    sources: list[Path] = []
    for article_file in sorted(CONTENT_DIR.glob("*.json")):
        article = json.loads(article_file.read_text(encoding="utf-8"))
        for image_path in article.get("images", []):
            source = ROOT / image_path
            if source.suffix.lower() not in SUPPORTED:
                continue
            if not source.exists():
                raise SystemExit(f"Missing article image: {image_path}")
            sources.append(source)
    return sources


def prepare_mode(image: Image.Image) -> Image.Image:
    if image.mode in ("RGBA", "LA"):
        return image.convert("RGBA")
    if image.mode == "P" and "transparency" in image.info:
        return image.convert("RGBA")
    return image.convert("RGB")


def optimize(source: Path, destination: Path) -> tuple[int, int]:
    destination.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        width, height = image.size
        long_edge = max(width, height)

        if long_edge > MAX_LONG_EDGE:
            scale = MAX_LONG_EDGE / long_edge
            target = (
                max(1, round(width * scale)),
                max(1, round(height * scale)),
            )
            image = image.resize(target, Image.Resampling.LANCZOS)

        image = prepare_mode(image)
        width, height = image.size
        image.save(
            destination,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6,
        )

    return width, height


def main() -> None:
    previous = load_manifest()
    current: dict[str, dict] = {}
    referenced_outputs: set[str] = set()

    for source in collect_sources():
        relative_source = source.relative_to(ROOT).as_posix()
        destination = web_path(source)
        relative_output = destination.relative_to(ROOT).as_posix()
        source_hash = sha256(source)
        old = previous.get(relative_source, {})

        if old.get("sha256") == source_hash and destination.exists():
            width = old.get("width")
            height = old.get("height")
            print(f"image already optimized: {relative_source}")
        else:
            width, height = optimize(source, destination)
            print(
                f"optimized {relative_source} -> {relative_output} "
                f"({width}x{height}, aspect ratio preserved)"
            )

        current[relative_source] = {
            "sha256": source_hash,
            "output": relative_output,
            "width": width,
            "height": height,
        }
        referenced_outputs.add(relative_output)

    for item in previous.values():
        old_output = item.get("output")
        if old_output and old_output not in referenced_outputs:
            stale = ROOT / old_output
            if stale.exists() and stale.suffix.lower() == ".webp":
                stale.unlink()
                print(f"removed stale optimized image: {old_output}")

    MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_FILE.write_text(
        json.dumps(current, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
