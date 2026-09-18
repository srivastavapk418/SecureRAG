from fastapi import APIRouter

from app.schemas.query import QueryRequest, QueryResponse
from app.services.rag_service import rag_service

router = APIRouter(tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query_assistant(payload: QueryRequest) -> QueryResponse:
    return await rag_service.answer_query(payload)

