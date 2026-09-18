# SecureRAG — Enterprise Document Intelligence Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F00?style=flat)](https://trychroma.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy_Ready-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Render-Deploy_Ready-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com/)

An enterprise-grade, three-service document intelligence and retrieval platform engineered with strict role-based access control, document-level security policies, vector search isolation, and zero data retention privacy:

- `frontend/`: React + Vite employee/admin portal (multi-stage Nginx container & Vercel 1-click ready)
- `backend/`: Express + MongoDB API with HTTP-only JWT cookie auth, RBAC, and document access policies
- `ai-service/`: Python FastAPI microservice with persistent ChromaDB and pluggable AI providers (Local Ollama or 100% Free Groq LPU with Zero Data Retention)

The platform is designed for private enterprise knowledge retrieval. Admins upload internal documents with granular access levels (Public, Department-restricted, Admin-only). The AI service parses and chunks them into ChromaDB, and employees query the knowledge base with guaranteed vector-level isolation (unauthorized document chunks are never retrieved or seen by the LLM).

## Core Features

- **Granular Document-Level Access Policies**: Public, Department-Restricted (Engineering, HR, Finance, etc.), and Admin-Only confidentiality tiers.
- **Strict RAG Security & Vector Isolation**: ChromaDB vector retrieval queries are filtered using accessible document IDs, mathematically preventing sensitive document leaks.
- **Enterprise AI Privacy & Zero Data Retention (ZDR)**: Supports offline on-premise Ollama models and cloud deployment on Render via Groq LPU with Zero Data Retention (prompts are never stored or used to train public models).
- **Admin Analytics Dashboard**:
  - Knowledge chunks coverage & storage volume
  - Top Cited Knowledge Assets leaderboard with retrieval confidence scores
  - Access policy governance breakdown
  - Employee query audit trail with department logging
- **Enterprise Authentication & RBAC**:
  - Admin and Employee roles
  - JWT stored in secure HTTP-only cookies
  - Protected-route middleware for all API endpoints and frontend views
- **Citation-Linked Answers**:
  - Grounded answers returning source document citations and direct document viewing links
- **Standardized Docker Containerization**: Multi-stage production frontend, persistent ChromaDB and MongoDB volumes, and standardized `/shared/documents` volume synchronization.

## Recommended Models

- Chat model: `llama3.1:8b`
- Embedding model: `nomic-embed-text`

You can swap these through environment variables without changing the code.

## Project Structure

```text
frontend/
  src/
    api/
    components/
    context/
    hooks/
    pages/
    styles/

backend/
  src/
    config/
    constants/
    controllers/
    middlewares/
    models/
    repositories/
    routes/
    scripts/
    services/
    utils/
    validators/
  storage/documents/

ai-service/
  app/
    api/routes/
    core/
    schemas/
    services/
    utils/
  data/chroma/
```

## Local Setup

### 1. Start MongoDB

Use a local MongoDB instance or Docker.

### 2. Start Ollama and pull models

```powershell
ollama pull llama3.1:8b
ollama pull nomic-embed-text
ollama serve
```

### 3. Configure environment files

Copy these templates and adjust values if needed:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `ai-service/.env.example` -> `ai-service/.env`

### 4. Install dependencies

```powershell
npm install --prefix backend
npm install --prefix frontend
py -m pip install -r ai-service/requirements.txt
```

### 5. Create the first admin

```powershell
$env:ADMIN_EMAIL='admin@company.local'
$env:ADMIN_PASSWORD='Admin@12345'
$env:ADMIN_NAME='Platform Admin'
npm --prefix backend run seed:admin
```

You can also create the first admin from the `/auth` page by opening the `Admin setup`
tab and entering the `ADMIN_BOOTSTRAP_KEY` value from `backend/.env`.

### 6. Run the services

```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
py -m uvicorn app.main:app --reload --app-dir ai-service
```

## Docker Compose

You can also use the root `docker-compose.yml` as the deployment baseline:

```powershell
docker compose up --build
```

## How the RAG Flow Works

1. Admin uploads a PDF, DOCX, or TXT document through the backend.
2. The backend stores the file, writes document metadata to MongoDB, and calls the AI service.
3. The AI service parses the file, chunks it, creates embeddings through Ollama, and stores vectors in ChromaDB.
4. An employee asks a question in chat.
5. The backend forwards the question to the AI service.
6. The AI service embeds the question, retrieves relevant chunks from ChromaDB, and generates a grounded answer through Ollama.
7. The backend saves the conversation and returns the answer with citation links pointing to the source document download endpoint.

## Security Notes

- JWT auth is cookie-based with `httpOnly` cookies
- Admin-only routes guard upload and overview endpoints
- Document download endpoints require authentication
- This implementation is single-tenant by deployment, which fits the "each company owns its own data" requirement from the PPT

## Deployment & Cloud Architecture Documentation

Detailed documentation on zero-cost cloud deployment (Render + Vercel) is available in [deploy/README.md](file:///c:/Users/sarwj/OneDrive/Desktop/SecureRAG/deploy/README.md) and [docs/free_tier_deployment_guide.md](file:///c:/Users/sarwj/OneDrive/Desktop/SecureRAG/docs/free_tier_deployment_guide.md).

## Future Enhancements

- Refresh-token rotation and CSRF protection
- S3 or Cloud Object Storage backed document persistence
- Celery / BullMQ background job queue for asynchronous batch ingestion
- OCR engine for scanned image-only PDFs
- Multi-tenant organization model for SaaS mode

## Reference Docs Used During Implementation

- Ollama chat example: https://ollama.com/eas/openchat
- Chroma persistent client: https://cookbook.chromadb.dev/core/clients/
- Chroma collection/query reference: https://docs.trychroma.com/reference/typescript/collection
