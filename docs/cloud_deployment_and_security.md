# SecureRAG — Enterprise Security, Zero Data Retention & Azure Deployment Guide

## 1. The Enterprise AI Security Paradox & Zero Data Retention (ZDR)

### The Dilemma
In private enterprise document retrieval (RAG), running models on local servers (like Ollama) guarantees that zero data leaves company premises. However, when deploying to cloud containers on free/low-cost tiers (such as Azure App Service Free F1 or Azure Container Apps Free tier), machines have only 1–4 GB RAM and no GPU. A 8B parameter model like `llama3.1:8b` crashes with Out-Of-Memory (OOM) errors.

At the same time, using public AI APIs risks company document leaks if public AI providers use API prompts to train their models.

### The Enterprise Solution: Azure OpenAI with Enterprise Data Protection (EDP)
SecureRAG implements a modular AI provider architecture (`ai-service/app/services/azure_openai_client.py`):
- **Local Mode (`LLM_PROVIDER=ollama`)**: 100% offline, on-premise execution with zero external network connectivity.
- **Cloud Mode (`LLM_PROVIDER=azure_openai`)**: Enables lightweight cloud deployment on Azure free-tier containers while maintaining enterprise security.

#### Why Azure OpenAI Preserves Enterprise Confidentiality:
1. **No Model Training**: Microsoft's contractual Enterprise Agreement explicitly states that customer prompts, generated completions, and vector embeddings are **never used to train or improve any OpenAI or Microsoft models**.
2. **Tenant Isolation**: Your data remains strictly within your enterprise Azure tenant boundary and virtual network (VNet), encrypted with TLS 1.3 in transit and AES-256 at rest (with optional Customer-Managed Keys / CMK).
3. **Zero Data Retention (ZDR)**: Microsoft allows enterprise accounts to apply for modified abuse monitoring / Zero Data Retention (ZDR). Under ZDR, prompts and completions are processed entirely in-memory and are **not logged or retained** on Microsoft disk storage.

---

## 2. Document-Level Access Policies (Enterprise RBAC)

To guarantee that confidential documents (such as executive salary sheets or legal disputes) never leak to unauthorized employees:

### Multi-Tier Access Levels:
1. `public`: Accessible to all employees and administrators across the company.
2. `department`: Strictly restricted to employees belonging to designated departments (e.g. `Engineering`, `HR`, `Finance`, `Legal`, `Operations`).
3. `admin_only`: Strictly restricted to company administrators.

### Double-Enforced Security Architecture:
- **API Boundary Enforcement**: When an employee requests `/api/v1/documents/:id/download` or `/view`, Express middleware verifies the employee's JWT department against the document's access policy. Unauthorized requests receive an immediate `403 Forbidden`.
- **Mathematical Vector Store Isolation (ChromaDB Filter)**: When an employee submits a chat question, the backend queries MongoDB for the document IDs the employee has clearance to view (`documentService.getAccessibleDocumentIds(user)`). These IDs are forwarded to the AI microservice, which applies an explicit metadata filter:
  ```python
  collection.query(where={"document_id": {"$in": allowed_document_ids}})
  ```
  Chunks from restricted documents are mathematically eliminated from the search space before retrieval or LLM generation.

---

## 3. Azure Free Tier Container Deployment Guide

SecureRAG is structured into 3 Docker services that can be deployed via **Azure Container Apps** or **Azure App Service (Web App for Containers)**.

### Architecture Overview in Docker
```
  [ Browser ]
       │
       ▼ (Port 5173 / 80)
┌──────────────┐      Proxy /api/v1       ┌──────────────┐      REST      ┌──────────────┐
│   frontend   │ ───────────────────────> │   backend    │ ─────────────> │  ai-service  │
│(Nginx + SPA) │                          │(Express/Node)│                │  (FastAPI)   │
└──────────────┘                          └──────┬───────┘                └──────┬───────┘
                                                 │                               │
                                       ┌─────────┴─────────┐           ┌─────────┴─────────┐
                                       │      MongoDB      │           │     ChromaDB      │
                                       │ (CosmosDB / Mongo)│           │ (Persistent Data) │
                                       └───────────────────┘           └───────────────────┘
```

### Steps to Deploy on Azure Container Apps:
1. **Build & Push Images to Azure Container Registry (ACR)**:
   ```bash
   az acr login --name mysecureacr
   docker build -t mysecureacr.azurecr.io/securerag-backend:latest ./backend
   docker build -t mysecureacr.azurecr.io/securerag-frontend:latest ./frontend
   docker build -t mysecureacr.azurecr.io/securerag-ai:latest ./ai-service
   docker push mysecureacr.azurecr.io/securerag-backend:latest
   docker push mysecureacr.azurecr.io/securerag-frontend:latest
   docker push mysecureacr.azurecr.io/securerag-ai:latest
   ```
2. **Provision Free-Tier Cosmos DB (MongoDB vCore Free Tier)**:
   - In Azure Portal, create an Azure Cosmos DB for MongoDB (offers a permanent Free Tier cluster).
   - Set the connection string in `MONGO_URI`.
3. **Deploy Container Apps**:
   - Deploy `ai-service` container (CPU: 0.5, Memory: 1.0 GiB) with environment variables:
     - `LLM_PROVIDER=azure_openai`
     - `AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/`
     - `AZURE_OPENAI_API_KEY=your_key`
     - `AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o-mini`
     - `AZURE_OPENAI_EMBED_DEPLOYMENT=text-embedding-3-small`
   - Deploy `backend` container with `AI_SERVICE_URL` pointing to the internal ingress of `ai-service`.
   - Deploy `frontend` container with external ingress enabled on port 80.
