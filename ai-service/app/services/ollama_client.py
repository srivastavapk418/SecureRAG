import httpx

from app.core.config import Settings

EMBED_BATCH_SIZE = 6


class OllamaClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._resolved_embed_model: str | None = None
        self._resolved_chat_model: str | None = None

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        normalized_texts = [text.strip() for text in texts if text and text.strip()]

        if not normalized_texts:
            return []

        async with httpx.AsyncClient(
            timeout=self.settings.ollama_timeout_seconds
        ) as client:
            installed_models = await self._list_models(client)
            candidates = self._build_candidates(
                installed_models,
                preferred=self.settings.ollama_embed_model,
                fallback=self.settings.ollama_chat_model,
                resolved=self._resolved_embed_model,
                aliases=["nomic-embed-text", "mxbai-embed-large", "all-minilm", "llama3"],
            )

            errors: list[str] = []

            for model_name in candidates:
                try:
                    embeddings: list[list[float]] = []

                    for index in range(0, len(normalized_texts), EMBED_BATCH_SIZE):
                        batch = normalized_texts[index : index + EMBED_BATCH_SIZE]
                        embeddings.extend(await self._embed_batch(client, model_name, batch))

                    self._resolved_embed_model = model_name
                    return embeddings
                except Exception as error:  # noqa: BLE001
                    errors.append(f"{model_name}: {self._format_error(error)}")

            raise ValueError(
                "Unable to create embeddings with the available Ollama models. "
                + " | ".join(errors[:3])
            )

    async def generate_answer(self, question: str, context_blocks: list[str]) -> str:
        context = "\n\n".join(context_blocks)

        system_prompt = (
            "You are a private enterprise knowledge assistant. "
            "Answer only from the provided document context. "
            "If the answer is not present, say that the information was not found in the indexed documents. "
            "Be concise, accurate, and policy-focused. "
            "Do not invent company rules."
        )

        user_prompt = (
            f"Question:\n{question}\n\n"
            f"Retrieved context:\n{context}\n\n"
            "Respond with a helpful answer grounded in the context."
        )

        async with httpx.AsyncClient(
            timeout=self.settings.ollama_timeout_seconds
        ) as client:
            installed_models = await self._list_models(client)
            candidates = self._build_candidates(
                installed_models,
                preferred=self.settings.ollama_chat_model,
                fallback=None,
                resolved=self._resolved_chat_model,
                aliases=["llama3.1", "llama3", "mistral", "qwen"],
            )

            errors: list[str] = []

            for model_name in candidates:
                try:
                    response = await client.post(
                        f"{self.settings.ollama_base_url}/api/chat",
                        json={
                            "model": model_name,
                            "stream": False,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "options": {"temperature": 0.2},
                        },
                    )
                    self._ensure_success(response)
                    payload = response.json()

                    message = payload.get("message", {})
                    content = message.get("content") or payload.get("response") or ""

                    if not content.strip():
                        raise ValueError("Ollama chat response did not contain answer text")

                    self._resolved_chat_model = model_name
                    return content.strip()
                except Exception as error:  # noqa: BLE001
                    errors.append(f"{model_name}: {self._format_error(error)}")

            raise ValueError(
                "Unable to generate an answer with the available Ollama models. "
                + " | ".join(errors[:3])
            )

    async def _list_models(self, client: httpx.AsyncClient) -> list[str]:
        response = await client.get(f"{self.settings.ollama_base_url}/api/tags")
        self._ensure_success(response)
        payload = response.json()

        return [
            model["name"].strip()
            for model in payload.get("models", [])
            if model.get("name")
        ]

    async def _embed_batch(
        self, client: httpx.AsyncClient, model_name: str, texts: list[str]
    ) -> list[list[float]]:
        embed_response = await client.post(
            f"{self.settings.ollama_base_url}/api/embed",
            json={"model": model_name, "input": texts},
        )

        if embed_response.is_success:
            payload = embed_response.json()
            embeddings = payload.get("embeddings")

            if embeddings:
                return embeddings

            if payload.get("embedding"):
                return [payload["embedding"]]

            raise ValueError("Ollama embedding response did not contain embeddings")

        if embed_response.status_code != 404:
            self._ensure_success(embed_response)

        legacy_embeddings: list[list[float]] = []

        for text in texts:
            legacy_response = await client.post(
                f"{self.settings.ollama_base_url}/api/embeddings",
                json={"model": model_name, "prompt": text},
            )
            self._ensure_success(legacy_response)
            payload = legacy_response.json()
            embedding = payload.get("embedding")

            if not embedding:
                raise ValueError("Legacy Ollama embedding response did not contain an embedding")

            legacy_embeddings.append(embedding)

        return legacy_embeddings

    def _build_candidates(
        self,
        installed_models: list[str],
        *,
        preferred: str | None,
        fallback: str | None,
        resolved: str | None,
        aliases: list[str],
    ) -> list[str]:
        candidates: list[str] = []
        seen: set[str] = set()

        def add(model_name: str | None) -> None:
            if model_name and model_name not in seen:
                candidates.append(model_name)
                seen.add(model_name)

        for model_name in [resolved, preferred]:
            add(model_name)
            for installed_name in self._expand_matches(model_name, installed_models):
                add(installed_name)

        for installed_name in self._expand_matches(fallback, installed_models):
            add(installed_name)

        for alias in aliases:
            for installed_name in self._expand_matches(alias, installed_models):
                add(installed_name)

        for installed_name in installed_models:
            add(installed_name)

        if not candidates:
            raise ValueError(
                "No Ollama models are installed. Pull a model first, for example "
                "`ollama pull llama3:latest`."
            )

        return candidates

    def _expand_matches(
        self, requested_name: str | None, installed_models: list[str]
    ) -> list[str]:
        if not requested_name:
            return []

        requested = requested_name.strip().lower()
        family = requested.split(":")[0]
        family_aliases = {family}

        if family.startswith("llama3.1"):
            family_aliases.add("llama3")

        matches: list[str] = []

        for installed_name in installed_models:
            installed = installed_name.lower()

            if installed == requested:
                matches.append(installed_name)
                continue

            if any(installed.startswith(f"{alias}:") or installed == alias for alias in family_aliases):
                matches.append(installed_name)

        return matches

    def _ensure_success(self, response: httpx.Response) -> None:
        if response.is_success:
            return

        detail = self._extract_response_detail(response)
        request = response.request
        raise ValueError(f"{response.status_code} {request.url.path}: {detail}")

    def _extract_response_detail(self, response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return response.text.strip() or "Unknown Ollama error"

        if isinstance(payload, dict):
            return (
                str(payload.get("error"))
                or str(payload.get("detail"))
                or str(payload.get("message"))
                or "Unknown Ollama error"
            )

        return str(payload)

    def _format_error(self, error: Exception) -> str:
        if isinstance(error, ValueError):
            return str(error)

        return str(error) or error.__class__.__name__
