import base64
from pathlib import Path
import tempfile

from fastapi import HTTPException

from app.core.config import get_settings
from app.schemas.ingestion import DocumentIngestionRequest, DocumentIngestionResponse
from app.schemas.query import Citation, QueryRequest, QueryResponse
from app.services.chunker import build_chunks
from app.services.document_parser import parse_document
from app.services.azure_openai_client import AzureOpenAIClient
from app.services.groq_client import GroqClient
from app.services.ollama_client import OllamaClient
from app.services.vector_store import VectorStore


class RagService:
    def __init__(self) -> None:
        self.settings = get_settings()
        provider = self.settings.llm_provider.lower()
        if provider == "azure_openai":
            self.ai_client = AzureOpenAIClient(self.settings)
        elif provider == "groq":
            self.ai_client = GroqClient(self.settings)
        else:
            self.ai_client = OllamaClient(self.settings)
        self.vector_store = VectorStore(self.settings)

    async def ingest_document(
        self, payload: DocumentIngestionRequest
    ) -> DocumentIngestionResponse:
        temp_file_to_clean: Path | None = None
        try:
            if payload.file_content_base64:
                suffix = Path(payload.source_name).suffix or ".pdf"
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(base64.b64decode(payload.file_content_base64))
                    file_path = Path(tmp.name)
                    temp_file_to_clean = file_path
            else:
                file_path = Path(payload.file_path) if payload.file_path else Path("")

                if not file_path.exists():
                    # Check shared volume path if configured
                    if self.settings.shared_upload_dir and file_path.name:
                        candidate = Path(self.settings.shared_upload_dir) / file_path.name
                        if candidate.exists():
                            file_path = candidate

                    # Check relative paths if running in different root working directories
                    if not file_path.exists() and file_path.name:
                        candidate = Path("backend/storage/documents") / file_path.name
                        if candidate.exists():
                            file_path = candidate

                if not file_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Document file path was not found: {payload.file_path}. In distributed cloud deployments, provide file_content_base64.",
                    )

            try:
                sections = parse_document(str(file_path))
            except ValueError as error:
                raise HTTPException(status_code=400, detail=str(error)) from error

            if not sections:
                raise HTTPException(status_code=400, detail="No readable text was found in the document")

            chunks = build_chunks(
                sections=sections,
                chunk_size=self.settings.chunk_size,
                overlap=self.settings.chunk_overlap,
            )

            if not chunks:
                raise HTTPException(status_code=400, detail="No retrievable chunks were created")

            try:
                embeddings = await self.ai_client.embed_texts(
                    [str(chunk["text"]) for chunk in chunks]
                )
            except HTTPException:
                raise
            except Exception as error:  # noqa: BLE001
                raise HTTPException(
                    status_code=502,
                    detail=f"Embedding failed while indexing the document: {error}",
                ) from error

            self.vector_store.replace_document(
                document_id=payload.document_id,
                title=payload.title,
                source_name=payload.source_name,
                chunks=chunks,
                embeddings=embeddings,
            )

            return DocumentIngestionResponse(
                document_id=payload.document_id,
                status="indexed",
                chunk_count=len(chunks),
            )
        finally:
            if temp_file_to_clean and temp_file_to_clean.exists():
                try:
                    temp_file_to_clean.unlink(missing_ok=True)
                except Exception:
                    pass

    async def delete_document(self, document_id: str) -> dict[str, str]:
        self.vector_store.delete_document(document_id)

        return {"document_id": document_id, "status": "deleted"}

    async def answer_query(self, payload: QueryRequest) -> QueryResponse:
        try:
            embeddings = await self.ai_client.embed_texts([payload.question])
        except Exception as error:  # noqa: BLE001
            raise HTTPException(
                status_code=502,
                detail=f"Embedding failed while preparing the query: {error}",
            ) from error

        top_k = payload.top_k or self.settings.retrieval_k
        retrieval_limit = max(top_k, min(top_k * 3, 12))
        matches = self.vector_store.query(
            embeddings[0],
            retrieval_limit,
            allowed_document_ids=payload.allowed_document_ids,
        )

        context_blocks: list[str] = []

        # 1. Build System Catalog context if accessible documents provided
        if payload.accessible_documents:
            accessible_count = len(payload.accessible_documents)
            catalog_lines = [
                f"- {doc.title}"
                + (f" (File: {doc.originalName})" if doc.originalName else "")
                + (f" [Access Policy: {doc.accessLevel}]" if doc.accessLevel else "")
                for doc in payload.accessible_documents
            ]
            catalog_summary = (
                f"[System Catalog - Accessible Knowledge Assets]\n"
                f"The current user has clearance to access {accessible_count} indexed document(s) in this enterprise workspace:\n"
                + "\n".join(catalog_lines)
            )
            context_blocks.append(catalog_summary)
        elif payload.allowed_document_ids is not None and len(payload.allowed_document_ids) == 0:
            context_blocks.append(
                "[System Catalog - Accessible Knowledge Assets]\n"
                "The current user has clearance to access 0 indexed documents in this workspace."
            )

        citations: list[Citation] = []

        # 2. Add retrieved document chunks if matches exist
        if matches:
            primary_document_id = str(matches[0]["document_id"])
            primary_matches = [
                match for match in matches if str(match["document_id"]) == primary_document_id
            ] or [matches[0]]
            context_matches = primary_matches[:3]

            for match in context_matches:
                context_blocks.append(
                    f"[Source: {match['document_title']} | Section: {match['section']} | "
                    f"Chunk: {match['chunk_index']}]\n{match['text']}"
                )

            primary_reference = context_matches[0]
            # Include citation if relevance score is meaningful
            if float(primary_reference["score"]) >= 0.35:
                citations.append(
                    Citation(
                        document_id=str(primary_reference["document_id"]),
                        document_title=str(primary_reference["document_title"]),
                        source_name=str(primary_reference["source_name"]),
                        locator=str(primary_reference.get("locator") or primary_reference["section"]),
                        snippet=str(primary_reference["snippet"]),
                        chunk_index=int(primary_reference["chunk_index"]),
                        score=float(primary_reference["score"]),
                        page_number=int(primary_reference["page_number"])
                        if primary_reference.get("page_number")
                        else None,
                    )
                )

        # 3. Generate answer via AI client
        try:
            answer = await self.ai_client.generate_answer(
                payload.question, context_blocks
            )
        except Exception as error:  # noqa: BLE001
            if context_blocks:
                answer = (
                    "**Enterprise Policy Notice: Direct response synthesized from indexed company assets.**\n\n"
                    + "\n\n".join(context_blocks)
                )
            else:
                answer = (
                    "**Enterprise Notice: The knowledge assistant encountered a temporary connectivity issue.**\n\n"
                    "Please retry your question in a moment."
                )

        return QueryResponse(answer=answer, citations=citations)


rag_service = RagService()
