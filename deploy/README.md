# SecureRAG Cloud Deployment Guide (Render + Vercel)

A 100% permanent free-tier deployment architecture for SecureRAG:

```
                  ┌─────────────────────────────────┐
                  │       Vercel (Frontend SPA)     │
                  │  React + Vite (100% Free Forever)│
                  └────────────────┬────────────────┘
                                   │
                                   ▼ HTTPS
                  ┌─────────────────────────────────┐
                  │      Render (Backend API)       │
                  │   Node.js + Express (Port 5000) │
                  └───────┬─────────────────┬───────┘
                          │                 │
                          ▼ Internal        ▼ MongoDB Wire
       ┌──────────────────────────────┐  ┌──────────────────────────────┐
       │   Render (AI Microservice)   │  │   MongoDB Atlas (M0 Tier)    │
       │ Python + FastAPI (Port 8000) │  │     (512MB Free Forever)     │
       └──────────────┬───────────────┘  └──────────────────────────────┘
                      │
                      ▼ HTTPS
       ┌──────────────────────────────┐
       │        Groq Cloud LPU        │
       │   Llama 3.3 / Compound-Mini  │
       │    (Zero Data Retention)     │
       └──────────────────────────────┘
```

---

## 1. Deploying the AI Service on Render

- **Service Name**: `securerag-ai-service`
- **Environment**: Docker (or Python)
- **DockerfilePath**: `ai-service/Dockerfile`
- **Docker Context**: `ai-service`
- **Plan**: Free
- **Environment Variables**:
  - `PORT`: `8000`
  - `LLM_PROVIDER`: `groq`
  - `GROQ_API_KEY`: `gsk_...` (your free Groq API key from https://console.groq.com)
  - `GROQ_CHAT_MODEL`: `groq/compound-mini` (or `llama-3.3-70b-versatile`)
- **Public URL**: `https://securerag-ai-service.onrender.com`

---

## 2. Deploying the Backend API on Render

- **Service Name**: `securerag-backend`
- **Environment**: Node
- **Root Directory**: `backend` (or leave empty)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free
- **Environment Variables**:
  - `PORT`: `5000`
  - `NODE_ENV`: `production`
  - `MONGO_URI`: Your MongoDB Atlas connection string
  - `AI_SERVICE_URL`: `https://securerag-ai-service.onrender.com`
  - `JWT_SECRET`: A secure random secret string
  - `CLIENT_URL`: `*` (or your Vercel frontend domain)
- **Public URL**: e.g., `https://securerag-backend.onrender.com`

---

## 3. Deploying the Frontend on Vercel

1. Import your GitHub repository (`https://github.com/srivastavapk418/SecureRAG.git`) into [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://securerag-backend.onrender.com/api/v1`
   - *(Optional alias)* `VITE_RENDER_API_URL`: `https://securerag-backend.onrender.com/api/v1`
4. Click **Deploy**.
5. Once deployed, open your Vercel URL. You can register your initial admin account or employee account and start querying!

---

## 4. Resume & Architecture Highlights

- **Microservices & Containerization**:
  > *"Architected and containerized full-stack enterprise RAG microservices using multi-stage Docker builds across Node.js/Express, Python/FastAPI, and ChromaDB vector stores."*

- **Permanent Free-Tier High Availability**:
  > *"Engineered production deployment spanning Render and Vercel with resilient client-side cold-start handling and zero-cost cloud architecture across MongoDB Atlas and Groq LPUs."*

- **Enterprise Security & Zero Data Retention**:
  > *"Implemented document-level RBAC and departmental isolation in vector search, paired with Zero Data Retention (ZDR) Groq inference for compliant internal document querying."*
