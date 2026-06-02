# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the React frontend
RUN npm run build

# Verify build output
RUN ls -la /app/dist && echo "✅ Build complete"

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:20-slim

WORKDIR /app

# Install system dependencies (curl for health checks, python for optional utils)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (no dev dependencies)
RUN npm ci --omit=dev

# Copy built React app from builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server.ts ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Copy configuration files
COPY config/ ./config/

# Copy proposals_db.json (create if not exists)
RUN if [ ! -f proposals_db.json ]; then echo '{"users": [], "proposals": []}' > proposals_db.json; fi
COPY proposals_db.json ./

# Copy source files (for TypeScript execution)
COPY src/ ./src/

# Copy index.html
COPY index.html ./

# Verify React build was copied correctly
RUN ls -la /app/dist && echo "✅ React build present"

# Expose the port (Hugging Face Spaces expects 7860)
EXPOSE 7860

# Set environment variables
ENV PORT=7860
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install tsx for running TypeScript in production
RUN npm install -g tsx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:7860/ || exit 1

# Run the application using tsx (TypeScript executor)
CMD ["tsx", "server.ts"]