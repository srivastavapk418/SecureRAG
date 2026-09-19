import asyncio
import hashlib
import math
from typing import Any

# Cached singleton instance of Chroma DefaultEmbeddingFunction
_default_ef: Any = None


def get_default_embedding_function():
    global _default_ef
    if _default_ef is None:
        try:
            from chromadb.utils import embedding_functions
            _default_ef = embedding_functions.DefaultEmbeddingFunction()
        except Exception:
            _default_ef = False
    return _default_ef if _default_ef is not False else None


def _deterministic_embeddings(texts: list[str]) -> list[list[float]]:
    """Deterministic 384-dimensional normalized vector fallback for extreme edge cases."""
    fallback_embeddings = []
    for text in texts:
        vec = [0.0] * 384
        words = text.lower().split()
        for word in words:
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % 384
            sign = 1.0 if ((h >> 9) & 1) else -1.0
            vec[idx] += sign
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        fallback_embeddings.append([x / norm for x in vec])
    return fallback_embeddings


async def generate_fallback_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate dense embeddings using Chroma's built-in ONNX all-MiniLM-L6-v2 model.
    Falls back deterministically if ONNX runtime fails.
    """
    if not texts:
        return []

    ef = get_default_embedding_function()
    if ef is not None:
        try:
            embeddings = await asyncio.to_thread(ef, texts)
            if embeddings is not None and len(embeddings) == len(texts):
                return [[float(v) for v in vec] for vec in embeddings]
        except Exception:
            pass

    return _deterministic_embeddings(texts)
