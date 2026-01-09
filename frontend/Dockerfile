FROM node:20-alpine
WORKDIR /app

# Copy monorepo root package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/drawli-front/package.json ./apps/drawli-front/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy app source
COPY apps/drawli-front ./apps/drawli-front

WORKDIR /app/apps/drawli-front
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"] 