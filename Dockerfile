# Multi-stage build for SvelteKit static app with Podman support

# Stage 1: Build
FROM node:20-alpine AS builder

# Install git (needed for build info) and other build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code and config files
# Note: .git is included for build info (commit hash, branch)
# If building from a tarball without .git, you may want to exclude it in .dockerignore
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production - Serve static files with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

