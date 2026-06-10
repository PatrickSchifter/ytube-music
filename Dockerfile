# YTune — imagem única que builda o monorepo e serve API + PWA.
# yt-dlp via pip e ffmpeg via apt → funciona em x86_64 e ARM (Raspberry Pi etc.),
# sem depender de Homebrew nem do host ter qualquer binário instalado.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Dependências de sistema (runtime): ffmpeg + yt-dlp ----
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip tini ca-certificates \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# ---- Build do monorepo ----
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build   # gera apps/web/dist (e typecheck de tudo)

# ---- Imagem final ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    SERVE_WEB=true \
    WEB_DIST=/app/apps/web/dist \
    CACHE_DIR=/data/cache \
    YT_DLP_PATH=yt-dlp

# Copia a árvore já buildada (inclui node_modules e o dist do web).
COPY --from=build /app /app
RUN mkdir -p /data/cache

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini garante limpeza correta dos processos filhos (yt-dlp/ffmpeg).
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pnpm", "--filter=@ytune/api", "start"]
