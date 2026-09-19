from pydantic import BaseModel, Field


class AccessibleDocumentSummary(BaseModel):
    id: str
    title: str
    originalName: str | None = None
    accessLevel: str | None = None


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    session_id: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=10)
    allowed_document_ids: list[str] | None = None
    accessible_documents: list[AccessibleDocumentSummary] | None = None


class Citation(BaseModel):
    document_id: str
    document_title: str
    source_name: str
    locator: str
    snippet: str
    chunk_index: int
    score: float
    page_number: int | None = None


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
