FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]
