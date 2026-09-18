from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_prefix: str = "/api/v1"
    app_name: str = "Enterprise Knowledge Assistant AI Service"
    client_url: str = "http://localhost:5173"
    vector_db_path: str = "./data/chroma"
    shared_upload_dir: str = ""
    llm_provider: str = "ollama"  # "ollama" | "azure_openai" | "groq"

    # Ollama settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.1:8b"
    ollama_embed_model: str = "nomic-embed-text"
    ollama_timeout_seconds: int = 180

    # Azure OpenAI (Enterprise Zero Data Retention) settings
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_chat_deployment: str = "gpt-4o-mini"
    azure_openai_embed_deployment: str = "text-embedding-3-small"
    azure_openai_api_version: str = "2024-08-01-preview"

    # Groq (100% Permanent Free Tier with Zero Data Retention) settings
    groq_api_key: str = ""
    groq_chat_model: str = "groq/compound-mini"

    chunk_size: int = 1100
    chunk_overlap: int = 200
    retrieval_k: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

