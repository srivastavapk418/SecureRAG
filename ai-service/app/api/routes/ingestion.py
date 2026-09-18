from fastapi import APIRouter

from app.schemas.ingestion import DocumentIngestionRequest, DocumentIngestionResponse
from app.services.rag_service import rag_service

router = APIRouter(tags=["ingestion"])


@router.post("/ingestion/documents", response_model=DocumentIngestionResponse)
async def ingest_document(
    payload: DocumentIngestionRequest,
) -> DocumentIngestionResponse:
    return await rag_service.ingest_document(payload)


@router.delete("/ingestion/documents/{document_id}")
async def delete_document(document_id: str) -> dict[str, str]:
    return await rag_service.delete_document(document_id)
