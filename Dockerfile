# Multi-stage Docker build for ReviewLens
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY data/ ./data/

# Build backend and frontend
RUN npm run build --prefix backend
RUN npm run build --prefix frontend

# Production Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy built artifacts and production dependencies
COPY --from=builder /app/backend/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/frontend/dist ./public
COPY --from=builder /app/data ./data

EXPOSE 5000

CMD ["node", "dist/server.js"]

