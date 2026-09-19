import httpx
from fastapi import HTTPException

from app.core.config import Settings
from app.core.prompts import SYSTEM_PROMPT


class AzureOpenAIClient:
    """
    Enterprise-grade Azure OpenAI client providing Zero Data Retention (ZDR)
    and ensuring customer data never leaves the Azure tenant or gets used for model training.
    """

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.endpoint = settings.azure_openai_endpoint.rstrip("/")
        self.api_key = settings.azure_openai_api_key
        self.chat_deployment = settings.azure_openai_chat_deployment
        self.embed_deployment = settings.azure_openai_embed_deployment
        self.api_version = settings.azure_openai_api_version
        self.headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
        }

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        if not self.endpoint or not self.api_key:
            raise HTTPException(
                status_code=500,
                detail="Azure OpenAI endpoint and API key must be configured in environment.",
            )

        url = f"{self.endpoint}/openai/deployments/{self.embed_deployment}/embeddings?api-version={self.api_version}"

        try:
            async with httpx.AsyncClient(timeout=self.settings.ollama_timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json={"input": texts},
                )
                response.raise_for_status()
                data = response.json()
                # Azure OpenAI returns {"data": [{"embedding": [...], "index": 0}, ...]}
                sorted_data = sorted(data.get("data", []), key=lambda item: item.get("index", 0))
                return [item["embedding"] for item in sorted_data]
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=502,
                detail=f"Azure OpenAI embedding request failed: {error.response.text}",
            ) from error
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to Azure OpenAI embedding service: {error}",
            ) from error

    async def generate_answer(self, question: str, context_blocks: list[str]) -> str:
        if not self.endpoint or not self.api_key:
            raise HTTPException(
                status_code=500,
                detail="Azure OpenAI endpoint and API key must be configured in environment.",
            )

        context_text = "\n\n".join(context_blocks) if context_blocks else "No relevant internal company document context found."
        user_content = f"Context:\n{context_text}\n\nQuestion: {question}"

        url = f"{self.endpoint}/openai/deployments/{self.chat_deployment}/chat/completions?api-version={self.api_version}"

        payload = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.ollama_timeout_seconds) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=502,
                detail=f"Azure OpenAI chat request failed: {error.response.text}",
            ) from error
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to Azure OpenAI chat service: {error}",
            ) from error
