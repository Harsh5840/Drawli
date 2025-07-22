FROM node:20-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/ws-backend ./apps/ws-backend

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Generate Prisma client in the db package
WORKDIR /app/packages/db
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate

WORKDIR /app/apps/ws-backend
RUN pnpm build
EXPOSE 6060
CMD ["pnpm", "start"] 