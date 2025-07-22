FROM node:20-alpine
WORKDIR /app

# Copy monorepo root package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/http-backend ./apps/http-backend

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Generate Prisma client in the db package
WORKDIR /app/packages/db
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate

WORKDIR /app/apps/http-backend
RUN pnpm build
EXPOSE 4000
CMD ["pnpm", "start"] 