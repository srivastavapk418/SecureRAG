FROM node:20-alpine

WORKDIR /app

# Copy files into container
COPY . .

# If built from repository root (contains backend/), promote backend files to /app
RUN if [ -d "backend" ] && [ -f "backend/package.json" ]; then \
      cp -r backend/. ./ && rm -rf backend frontend ai-service docs; \
    fi

# Clean install production dependencies
RUN npm install --omit=dev

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
