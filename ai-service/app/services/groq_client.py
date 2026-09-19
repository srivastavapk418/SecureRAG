import httpx
from fastapi import HTTPException

from app.core.config import Settings
from app.core.prompts import SYSTEM_PROMPT
from app.services.embedding_service import generate_fallback_embeddings
from app.services.ollama_client import OllamaClient


class GroqClient:
    """
    100% Free Tier AI Client powered by Groq Cloud API with Llama 3.1.
    Provides ultra-fast inference (500+ tokens/sec) and strict Zero Data Retention
    (prompts are never retained or used to train models).
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.api_key = (settings.groq_api_key or "").strip()
        raw_model = (settings.groq_chat_model or "llama-3.3-70b-versatile").strip()
        if raw_model.startswith("groq/"):
            raw_model = raw_model[len("groq/") :]
        if "compound" in raw_model.lower() or not raw_model:
            raw_model = "llama-3.3-70b-versatile"
        self.model = raw_model
        self.base_url = "https://api.groq.com/openai/v1"
        self.ollama_client = OllamaClient(settings)

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """
        Embed texts using:
        1. Local Ollama if running
        2. Hugging Face Inference API if HF token is configured
        3. Native self-contained Chroma ONNX MiniLM embeddings (100% free, runs locally on CPU)
        """
        if not texts:
            return []

        # 1. Try local Ollama embedding first (if running)
        try:
            return await self.ollama_client.embed_texts(texts)
        except Exception:
            pass

        # 2. Try Hugging Face Inference API if token is configured
        hf_token = getattr(self.settings, "hf_token", None)
        if hf_token:
            hf_url = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2"
            try:
                async with httpx.AsyncClient(timeout=self.settings.ollama_timeout_seconds) as client:
                    response = await client.post(
                        hf_url,
                        headers={"Authorization": f"Bearer {hf_token}"},
                        json={"inputs": texts, "options": {"wait_for_model": True}},
                    )
                    if response.status_code == 200:
                        data = response.json()
                        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                            return data
            except Exception:
                pass

        # 3. Native self-contained Chroma ONNX MiniLM-L6-v2 embeddings
        return await generate_fallback_embeddings(texts)

    async def generate_answer(self, question: str, context_blocks: list[str]) -> str:
        if not self.api_key:
            return (
                "**Enterprise Notice: The AI service configuration requires an active Groq API Key.**\n\n"
                "Please configure `GROQ_API_KEY` in the workspace environment settings to enable real-time inference."
            )

        context_text = "\n\n".join(context_blocks) if context_blocks else "No relevant internal company document context found."
        user_content = f"Context:\n{context_text}\n\nQuestion: {question}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Candidate models to try in order of capability & availability
        candidates = [self.model]
        for fallback in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"]:
            if fallback not in candidates:
                candidates.append(fallback)

        for candidate_model in candidates:
            payload = {
                "model": candidate_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                "temperature": 0.2,
                "max_tokens": 1024,
            }

            try:
                async with httpx.AsyncClient(timeout=min(self.settings.ollama_timeout_seconds, 60)) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        return data["choices"][0]["message"]["content"].strip()
            except Exception:
                continue

        # Fallback response if all inference model attempts fail
        if context_blocks:
            return (
                "**Enterprise Policy Notice: Direct response synthesized from indexed company assets (inference service fallback).**\n\n"
                f"{context_text}"
            )

        return (
            "**Enterprise Notice: The inference provider is temporarily unavailable or experiencing high load.**\n\n"
            "Please retry your question in a moment, or contact your enterprise workspace administrator."
        )
