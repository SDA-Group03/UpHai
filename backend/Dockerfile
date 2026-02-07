FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install --production

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "src/index.ts"]