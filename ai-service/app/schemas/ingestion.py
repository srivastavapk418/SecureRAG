from pydantic import BaseModel, Field


class DocumentIngestionRequest(BaseModel):
    document_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    source_name: str = Field(..., min_length=1)
    file_path: str = Field(default="", min_length=0)
    mime_type: str = Field(..., min_length=1)
    file_content_base64: str | None = None


class IngestedChunkSummary(BaseModel):
    chunk_index: int
    section: str = ""
    locator: str = ""
    page_number: int | None = None
    text: str
    snippet: str = ""


class DocumentIngestionResponse(BaseModel):
    document_id: str
    status: str
    chunk_count: int
    chunks: list[IngestedChunkSummary] | None = None

