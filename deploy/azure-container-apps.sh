#!/usr/bin/env bash
# ==============================================================================
# SecureRAG: Azure Container Apps Automated Free-Tier Deployment Script
#
# Configures serverless microservice containers on Azure Container Apps (ACA)
# with automatic scale-to-zero enabled to maximize the free monthly allowance.
# ==============================================================================

set -e

# Configuration
RESOURCE_GROUP="SecureRAG-RG"
LOCATION="eastus"
ENVIRONMENT="securerag-env"
BACKEND_APP="securerag-backend"
AI_APP="securerag-ai"

echo "=== 1. Checking Azure CLI Login Status ==="
az account show > /dev/null 2>&1 || { echo "Please log in to Azure CLI: az login"; exit 1; }

echo "=== 2. Creating Azure Resource Group ($RESOURCE_GROUP in $LOCATION) ==="
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo "=== 3. Creating Container Apps Environment ==="
az containerapp env create \
  --name "$ENVIRONMENT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

echo "=== 4. Deploying AI Microservice Container (FastAPI + Groq ZDR) ==="
az containerapp create \
  --name "$AI_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENVIRONMENT" \
  --source ./ai-service \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --env-vars \
    LLM_PROVIDER="groq" \
    GROQ_CHAT_MODEL="groq/compound-mini"

AI_URL=$(az containerapp show --name "$AI_APP" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)
echo "AI Service deployed at: https://$AI_URL"

echo "=== 5. Deploying Backend API Container (Node.js Express) ==="
az containerapp create \
  --name "$BACKEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$ENVIRONMENT" \
  --source ./backend \
  --target-port 5000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --env-vars \
    NODE_ENV="production" \
    PORT="5000" \
    AI_SERVICE_URL="https://$AI_URL" \
    CLIENT_URL="*"

BACKEND_URL=$(az containerapp show --name "$BACKEND_APP" --resource-group "$RESOURCE_GROUP" --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "=============================================================================="
echo "🎉 Azure Container Apps Deployment Complete!"
echo "Backend API URL: https://$BACKEND_URL"
echo "AI Service URL:  https://$AI_URL"
echo ""
echo "To link with Frontend on Vercel with Automatic Multi-Cloud Failover:"
echo "Set Environment Variables on Vercel:"
echo "  VITE_AZURE_API_URL  = https://$BACKEND_URL/api/v1"
echo "  VITE_RENDER_API_URL = https://securerag-backend.onrender.com/api/v1"
echo "=============================================================================="
