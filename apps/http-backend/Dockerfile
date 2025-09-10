FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages
COPY packages ./packages

# Copy the entire http-backend app (source + tsconfig)
COPY apps/http-backend ./apps/http-backend

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --workspace-root

# Build all shared packages
RUN pnpm -r --filter "./packages/*" build

# Build http-backend
WORKDIR /app/apps/http-backend
RUN pnpm build

EXPOSE 4000
CMD ["pnpm", "start"]
