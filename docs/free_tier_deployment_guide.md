# 100% Free-Tier Cloud Deployment Guide (Permanent Zero-Cost)

This guide explains how to deploy **SecureRAG** completely for **$0.00** without credit card traps or expiring subscriptions, suitable for college projects, portfolio showcases, and technical interviews.

---

## The Zero-Cost Architecture Stack

| Component | Free Host | What it provides | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Global CDN for React/Vite SPA | **$0.00 Forever** |
| **Database** | **MongoDB Atlas** | M0 Sandbox Cluster (512MB) | **$0.00 Forever** (No credit card) |
| **Backend** | **Render / Azure F1** | Node.js Express API Web Service | **$0.00 Forever** |
| **AI Microservice**| **Render / Hugging Face**| FastAPI + ChromaDB container | **$0.00 Forever** |
| **AI LLM Inference**| **Groq Cloud API** | Llama 3.1 8B (500+ tok/s, Zero Data Retention) | **$0.00 Forever** |

---

## Step 1: Set Up Free MongoDB Atlas (5 Minutes)

1. Sign up for free at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Click **Create Deployment** and select the **M0 Free** cluster (in any region, e.g. AWS / Azure).
3. Under **Security Quickstart**:
   - Create a database user (e.g. username: `admin`, generate a secure password).
   - Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/securerag?retryWrites=true&w=majority
   ```

---

## Step 2: Get Free Groq API Key for Zero-Cost Llama 3.1

1. Sign up for free at [console.groq.com](https://console.groq.com).
2. Navigate to **API Keys** -> Click **Create API Key**.
3. Copy your key (`gsk_...`).
   - **Privacy Note**: Groq provides contractual Zero Data Retention (ZDR); API prompts are **never** used to train models.

---

## Step 3: Deploy Frontend on Vercel (2 Minutes)

Because SecureRAG includes [frontend/vercel.json](file:///c:/Users/sarwj/OneDrive/Desktop/SecureRAG/frontend/vercel.json) and root [vercel.json](file:///c:/Users/sarwj/OneDrive/Desktop/SecureRAG/vercel.json), deploying to Vercel takes 2 clicks:

1. Sign in to [vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New Project** and select your `SecureRAG` repository.
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (or leave default if using root `vercel.json`)
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api/v1` (your deployed backend URL)
4. Click **Deploy**. Vercel will build and assign you a free HTTPS domain (e.g. `https://securerag.vercel.app`).

---

## Step 4: Deploy Backend & AI Service on Render (Free Tier)

Render provides free web services directly from GitHub repositories:

### A. Deploy AI Service
1. In [render.com](https://render.com), click **New** -> **Web Service**.
2. Connect your `SecureRAG` repository.
3. Set:
   - **Root Directory**: `ai-service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `LLM_PROVIDER`: `groq`
     - `GROQ_API_KEY`: `gsk_your_groq_key`
     - `GROQ_CHAT_MODEL`: `llama-3.1-8b-instant`
     - `CLIENT_URL`: `https://securerag.vercel.app` (your Vercel URL)

### B. Deploy Express Backend
1. Click **New** -> **Web Service**.
2. Connect your `SecureRAG` repository.
3. Set:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `MONGO_URI`: `mongodb+srv://...` (your Atlas URI from Step 1)
     - `AI_SERVICE_URL`: `https://your-ai-service.onrender.com`
     - `CLIENT_URL`: `https://securerag.vercel.app`
     - `APP_URL`: `https://your-backend-service.onrender.com`
     - `JWT_SECRET`: `your_secure_random_string`
     - `ADMIN_BOOTSTRAP_KEY`: `your_chosen_admin_key`

---

## Alternative: Deploy as Docker Containers on Azure

If you prefer Azure:
- **Azure App Service**: Use the **F1 (Free)** tier to run the Docker container.
- **Azure Container Apps**: Offers a permanent free tier grant of **180,000 vCPU-seconds and 360,000 GiB-seconds free every month**.
- Configure the exact same environment variables as above.
