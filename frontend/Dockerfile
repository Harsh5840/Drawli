FROM node:20-alpine
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages
COPY packages ./packages

# Copy the entire frontend app (including pages/app folder)
COPY apps/drawli-front ./apps/drawli-front

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --workspace-root

# Build all shared packages
RUN pnpm -r --filter "./packages/*" build

# Build the frontend
WORKDIR /app/apps/drawli-front
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
