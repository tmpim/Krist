# Build
FROM node:20-alpine AS base

RUN apk add git ca-certificates make g++

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm run docs
RUN cp /app/static/docs.bundle.js /app/static/docs/assets/main.bundle.js

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/static/docs /app/static/docs
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "dist/src/index.js"]
