# ============================================
# ELECTRICAL PROPOSAL GENERATOR - DOCKERFILE
# ============================================
# Hugging Face Spaces requires:
#   - Port: 7860
#   - Bind to: 0.0.0.0
#   - Health check endpoint: /health
# ============================================

# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
# Using npm install instead of npm ci for compatibility
RUN npm install

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

# Install system dependencies (curl for health checks)
RUN apt-get update && apt-get install -y \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (no dev dependencies)
RUN npm install --omit=dev

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy built React app from builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server.ts ./
COPY tsconfig.json ./

# Copy configuration files
COPY config/ ./config/

# Copy source files (for TypeScript execution)
COPY src/ ./src/

# Copy index.html
COPY index.html ./

# Create proposals_db.json if not exists (will be overwritten if present)
RUN if [ ! -f proposals_db.json ]; then echo '{"users": [], "proposals": []}' > proposals_db.json; fi
COPY proposals_db.json ./

# Copy .env.example as .env (will be overridden by HF secrets)
RUN if [ -f .env.example ]; then cp .env.example .env; else echo "No .env.example found"; fi

# Verify React build was copied correctly
RUN ls -la /app/dist && echo "✅ React build present"

# ============================================
# HUGGING FACE SPACES CONFIGURATION
# ============================================
# Expose the required port (Hugging Face Spaces expects 7860)
EXPOSE 7860

# Set environment variables for production
ENV PORT=7860
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# ============================================
# HEALTH CHECK
# ============================================
# Hugging Face Spaces uses this to verify the app is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

# ============================================
# STARTUP COMMAND
# ============================================
# Run the TypeScript server with tsx
# The server.ts is configured to bind to 0.0.0.0:7860
CMD ["tsx", "server.ts"]