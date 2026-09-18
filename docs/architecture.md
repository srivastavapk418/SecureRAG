# Architecture Notes

## What was extracted from the PPT

The slides described a private enterprise knowledge assistant with these essential behaviors:

- employees waste time searching internal policy and process documents
- admins upload internal PDFs and DOCX files
- the system parses and stores document knowledge privately
- employees ask questions in a chatbot experience
- the answer must be grounded in internal docs
- role-based access must separate admin and employee usage
- admins need dashboard metrics such as total users and uploaded documents
- answers should include source references so employees can verify correctness
- the solution should run on local/open models and stay enterprise-private

## Implemented Architecture

### Frontend

- React + Vite
- employee chat experience with persistent sessions
- admin dashboard for document ingestion and visibility
- cookie-based authentication with role-aware routing

### Backend

- Express API
- MongoDB stores users, documents, chat sessions, and assistant messages
- JWT authentication via HTTP-only cookies
- RBAC middleware for `admin` and `employee`
- secure document download route used by citation links

### AI Service

- FastAPI microservice
- PDF, DOCX, and TXT parsing
- chunking service for retrieval-ready segments
- Ollama embeddings + chat generation
- Chroma persistent vector database

## Retrieval Lifecycle

1. Upload enters the backend.
2. Backend saves the file and document metadata.
3. Backend calls the AI ingestion endpoint.
4. AI service parses text and builds chunks.
5. AI service generates embeddings with Ollama.
6. Chroma stores chunk vectors and metadata.
7. Query enters chat API.
8. AI service retrieves the most relevant chunks.
9. Ollama generates an answer from retrieved context only.
10. Backend returns the answer plus source document links.

## Design Patterns Used

- service + repository separation in the backend
- controller thinness with validation and middleware boundaries
- dedicated AI service for loose coupling and scaling
- persistent vector store abstraction
- reusable dashboard/chat UI components on the frontend

