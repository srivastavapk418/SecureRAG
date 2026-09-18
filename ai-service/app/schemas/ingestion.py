from pydantic import BaseModel, Field


class DocumentIngestionRequest(BaseModel):
    document_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    source_name: str = Field(..., min_length=1)
    file_path: str = Field(..., min_length=1)
    mime_type: str = Field(..., min_length=1)


class DocumentIngestionResponse(BaseModel):
    document_id: str
    status: str
    chunk_count: int

