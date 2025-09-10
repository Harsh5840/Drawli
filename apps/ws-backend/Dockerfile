FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages
COPY packages ./packages

# Copy the entire ws-backend app (source + tsconfig)
COPY apps/ws-backend ./apps/ws-backend

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --workspace-root

# Build all shared packages
RUN pnpm -r --filter "./packages/*" build

# Build ws-backend
WORKDIR /app/apps/ws-backend
RUN pnpm build

EXPOSE 6060
CMD ["pnpm", "start"]
