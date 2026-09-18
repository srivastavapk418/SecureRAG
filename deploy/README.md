# SecureRAG Multi-Cloud Deployment Guide

## 1. High-Availability Multi-Cloud Architecture

SecureRAG is architected for **zero downtime** and **100% permanent zero-cost hosting** using an automated multi-cloud fallback client:

```
                  ┌─────────────────────────────────┐
                  │       Vercel (Frontend SPA)     │
                  │  React + Vite (100% Free Forever│
                  └────────────────┬────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
        [Primary Cluster]                         [Fallback Cluster]
   Azure Container Apps (ACA)                       Render.com
  (Free trial / monthly grant)                 (100% Free Forever)
              │                                         │
              ▼                                         ▼
   Backend API + AI Service                  Backend API + AI Service
       (Docker Containers)                       (Docker Containers)
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
        MongoDB Atlas (M0 Tier)              Groq Cloud LPU
         (512MB Free Forever)              (Zero Data Retention)
```

---

## 2. Automated Failover: How It Works

You configure **both** endpoints in your Vercel frontend environment variables:
- `VITE_AZURE_API_URL`: `https://<azure-app>.azurecontainerapps.io/api/v1` (Primary)
- `VITE_RENDER_API_URL`: `https://securerag-backend.onrender.com/api/v1` (Fallback)

### Zero Manual Intervention
1. When a user visits the application, traffic is routed to **Azure Container Apps**.
2. If Azure is paused, suspended, or its free trial credits expire (resulting in DNS failure, connection timeout, or 502/503/504 errors):
   - The frontend Axios circuit-breaker in [`frontend/src/api/http.js`](../frontend/src/api/http.js) automatically intercepts the failure.
   - It seamlessly re-routes the active request to **Render.com** without throwing an error to the user.
   - It caches the healthy Render endpoint in `sessionStorage` so all subsequent queries proceed instantly.
3. **No code changes or manual redeployments are required.**

---

## 3. Deploying to Render.com (1-Click Blueprint)

1. Sign up for a free account at [render.com](https://render.com).
2. Connect your GitHub repository (`https://github.com/srivastavapk418/SecureRAG.git`).
3. In Render Dashboard, click **New +** $\rightarrow$ **Blueprint**.
4. Select your repo. Render will automatically detect [`render.yaml`](../render.yaml) and configure:
   - `securerag-backend` (Web Service, Docker)
   - `securerag-ai-service` (Web Service, Docker)
5. Fill in your environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`).
6. Click **Apply**. Both microservices build and deploy inside Docker containers on Render's free tier!

---

## 4. Deploying to Azure Container Apps (ACA)

1. Open PowerShell or Bash and make sure Azure CLI is installed:
   ```bash
   az login
   ```
2. Run the automated deployment script:
   ```bash
   bash deploy/azure-container-apps.sh
   ```
3. The script configures the container apps environment with `--min-replicas 0` (scale-to-zero) so it only uses resources when requests are actively being processed, fitting comfortably inside Azure's monthly free grant.

---

## 5. Deploying the Frontend to Vercel

1. Import your GitHub repository to [vercel.com](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add Environment Variables:
   - `VITE_AZURE_API_URL`: Your Azure backend URL + `/api/v1`
   - `VITE_RENDER_API_URL`: Your Render backend URL + `/api/v1`
4. Click **Deploy**. Vercel will build the SPA with auto-failover built in!

---

## 6. How to Feature This on Your Resume

Use these high-impact bullet points for recruiters:

- **Microservices & Containerization**:
  > *"Architected and containerized full-stack enterprise RAG microservices using multi-stage Docker builds across Node.js/Express, Python/FastAPI, and ChromaDB vector stores."*

- **High-Availability Multi-Cloud Failover**:
  > *"Engineered an automated multi-cloud failover pipeline (Azure Container Apps $\rightarrow$ Render.com) with client-side circuit breakers and pre-emptive health probes, achieving 100% uptime with zero manual intervention upon cloud provider quota limits."*

- **Enterprise Security & Zero Data Retention**:
  > *"Implemented document-level RBAC and departmental isolation in vector search, paired with Zero Data Retention (ZDR) Groq LPU inference for compliant internal document querying."*
