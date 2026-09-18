import httpx
from fastapi import HTTPException

from app.core.config import Settings
from app.services.ollama_client import OllamaClient


class GroqClient:
    """
    100% Free Tier AI Client powered by Groq Cloud API with Llama 3.1.
    Provides ultra-fast inference (500+ tokens/sec) and strict Zero Data Retention
    (prompts are never retained or used to train models).
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.api_key = settings.groq_api_key
        self.model = settings.groq_chat_model or "llama-3.1-8b-instant"
        self.base_url = "https://api.groq.com/openai/v1"
        self.ollama_client = OllamaClient(settings)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Embed texts using local Ollama if available, or free HuggingFace feature extraction
        as a zero-cost cloud fallback.
        """
        if not texts:
            return []

        # Try local Ollama embedding first
        try:
            return await self.ollama_client.embed_texts(texts)
        except Exception:
            pass

        # Free Cloud Fallback: Hugging Face public embedding API
        hf_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"
        try:
            async with httpx.AsyncClient(timeout=self.settings.ollama_timeout_seconds) as client:
                response = await client.post(
                    hf_url,
                    json={"inputs": texts, "options": {"wait_for_model": True}},
                )
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        return data
        except Exception:
            pass

        # If external embeddings fail, raise descriptive error
        raise HTTPException(
            status_code=502,
            detail="Embedding generation failed. Please ensure Ollama is running or configure embeddings.",
        )

    async def generate_answer(self, question: str, context_blocks: list[str]) -> str:
        if not self.api_key:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is required for the Groq free-tier provider. Obtain one for free at console.groq.com.",
            )

        context_text = "\n\n".join(context_blocks)
        system_prompt = (
            "You are SecureRAG, an enterprise AI knowledge assistant. Answer the user's question "
            "strictly using the provided company document context below. If the answer cannot "
            "be determined from the context, state that you do not have sufficient information in the indexed documents. "
            "Never invent facts or cite external sources outside the provided context."
        )

        user_content = f"Context:\n{context_text}\n\nQuestion: {question}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.ollama_timeout_seconds) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=502,
                detail=f"Groq API request failed: {error.response.text}",
            ) from error
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to Groq AI service: {error}",
            ) from error
