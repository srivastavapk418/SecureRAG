from pathlib import Path

import chromadb

from app.core.config import Settings


class VectorStore:
    def __init__(self, settings: Settings) -> None:
        target_path = Path(settings.vector_db_path)
        if not target_path.is_absolute():
            ai_service_dir = Path(__file__).resolve().parents[2]
            candidate = ai_service_dir / settings.vector_db_path
            if candidate.exists() and (candidate / "chroma.sqlite3").exists():
                target_path = candidate
            elif (ai_service_dir / "data" / "chroma" / "chroma.sqlite3").exists():
                target_path = ai_service_dir / "data" / "chroma"

        target_path.mkdir(parents=True, exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(target_path))
        self.collection = self.client.get_or_create_collection(
            name="enterprise_documents",
            metadata={"hnsw:space": "cosine"},
        )

    def replace_document(
        self,
        document_id: str,
        title: str,
        source_name: str,
        chunks: list[dict[str, str | int]],
        embeddings: list[list[float]],
    ) -> None:
        self.collection.delete(where={"document_id": document_id})

        ids: list[str] = []
        metadatas: list[dict[str, str | int]] = []
        documents: list[str] = []

        for chunk in chunks:
            ids.append(f"{document_id}:{chunk['chunk_index']}")
            documents.append(str(chunk["text"]))
            metadata = {
                "document_id": document_id,
                "document_title": title,
                "source_name": source_name,
                "chunk_index": int(chunk["chunk_index"]),
                "section": str(chunk["section"]),
                "locator": str(chunk.get("locator") or chunk["section"]),
                "snippet": str(chunk["snippet"]),
            }

            if chunk.get("page_number"):
                metadata["page_number"] = int(chunk["page_number"])

            metadatas.append(metadata)

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )

    def delete_document(self, document_id: str) -> None:
        self.collection.delete(where={"document_id": document_id})

    def query(
        self,
        embedding: list[float],
        top_k: int,
        allowed_document_ids: list[str] | None = None,
    ) -> list[dict[str, str | int | float]]:
        where_filter = None
        if allowed_document_ids is not None:
            if len(allowed_document_ids) == 0:
                return []
            if len(allowed_document_ids) == 1:
                where_filter = {"document_id": allowed_document_ids[0]}
            else:
                where_filter = {"document_id": {"$in": allowed_document_ids}}

        query_kwargs = {
            "query_embeddings": [embedding],
            "n_results": top_k,
            "include": ["documents", "metadatas", "distances"],
        }
        if where_filter is not None:
            query_kwargs["where"] = where_filter

        results = self.collection.query(**query_kwargs)

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        matches: list[dict[str, str | int | float]] = []

        for document, metadata, distance in zip(documents, metadatas, distances):
            matches.append(
                {
                    "text": document,
                    "document_id": metadata["document_id"],
                    "document_title": metadata["document_title"],
                    "source_name": metadata["source_name"],
                    "chunk_index": metadata["chunk_index"],
                    "section": metadata["section"],
                    "locator": metadata.get("locator") or metadata["section"],
                    "page_number": metadata.get("page_number"),
                    "snippet": metadata["snippet"],
                    "score": max(0.0, 1 - float(distance)),
                }
            )

        return matches
