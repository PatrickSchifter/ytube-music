# YTune 🎧

Monorepo full-stack em Node.js para **buscar vídeos do YouTube, extrair o áudio e reproduzir em streaming** — experiência similar ao Spotify, instalável como PWA. Uso estritamente pessoal / portfólio.

> Implementação baseada na spec _YTune — Audio First (v3)_.

## Arquitetura

```
[ React PWA ]  ──HTTP──►  [ Fastify API ]  ──yt-dlp──►  [ YouTube ]
      ▲                         │
      │◄──── Audio Stream ──────┤  ◄── fluent-ffmpeg → MP3 192kbps
                                │
                      [ Cache em disco ]  (evita re-download)
```

- **Streaming com Range Requests (HTTP 206)** → permite seek real.
- **Pipeline audio-first em cascata**: áudio puro → vídeo mínimo (áudio extraído com `-vn`) → pior formato. Sempre o menor volume de dados.
- **Prefetch**: aos 80% da faixa atual, a próxima já começa a baixar em background.
- **YouTube Mix**: fila automática de relacionados, sem montar a fila à mão.

## Estrutura (Turborepo)

```
apps/
  api/   → Fastify + yt-dlp + fluent-ffmpeg (streaming, cache, prefetch)
  web/   → React 18 + Vite PWA (player, busca, fila, mix, cache)
packages/
  types/ → schemas Zod + tipos compartilhados (@ytune/types)
  ui/    → design system React (@ytune/ui)
  config/→ ESLint + tsconfig base (@ytune/config)
```

## Pré-requisitos

- **Node.js 20+** e **pnpm 9+**
- **ffmpeg** no PATH — `brew install ffmpeg`
- **yt-dlp** no PATH — `brew install yt-dlp` (recomendado; o pacote `yt-dlp-exec` também baixa um binário próprio na instalação)

## Como rodar

```bash
pnpm install        # instala todos os workspaces
pnpm dev            # sobe api (:3001) e web (:5173) em paralelo
```

Filtrando por app:

```bash
pnpm dev --filter=@ytune/api
pnpm dev --filter=@ytune/web
```

Build, lint e typecheck de todo o monorepo:

```bash
pnpm build
pnpm lint
pnpm typecheck
```

## Endpoints da API (`:3001`)

| Método | Rota                          | Descrição                                       |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/search?q=`                  | Busca vídeos no YouTube                          |
| GET    | `/search/mix/:videoId`        | Mix automático (rádio) do YouTube               |
| GET    | `/info/:videoId`              | Metadados + se está em cache                     |
| GET    | `/stream/:videoId`            | Stream de áudio com Range (206)                  |
| POST   | `/download/:videoId`          | Enfileira download (prefetch) — responde 202     |
| GET    | `/download/:videoId/status`   | `idle \| downloading \| done \| error`           |
| GET    | `/cache`                      | Lista o cache em disco                           |
| DELETE | `/cache/:videoId`             | Remove um áudio do cache                         |

## PWA

Em dev o Service Worker fica desativado. Após `pnpm --filter=@ytune/web build && pnpm --filter=@ytune/web preview`, acesse pelo Chrome/Edge e use o ícone de instalação na barra de endereço (no Safari mobile: Compartilhar → Adicionar à Tela de Início).

## Deploy (servidor próprio, ouvir no celular)

A API serve o PWA na **mesma origem** em produção (`SERVE_WEB=true`) — uma URL só, sem CORS. Tudo roda em **um container Docker** que já traz `ffmpeg` e `yt-dlp` (via pip, multi-arch x86/ARM). O host só precisa de Docker.

```bash
docker compose up -d --build      # builda e sobe em http://localhost:3001
```

O cache de áudio fica no volume `ytune-cache` (não re-baixa o que já foi ouvido).

### HTTPS + domínio de graça (Cloudflare Tunnel)

O PWA só **instala no iPhone/Android via HTTPS**. A forma mais simples e gratuita, sem abrir portas no roteador:

1. Em [Cloudflare Zero Trust → Tunnels](https://one.dash.cloudflare.com), crie um tunnel e um hostname público apontando para `http://app:3001`.
2. Copie o token para um arquivo `.env` na raiz: `TUNNEL_TOKEN=...`
3. Suba com o profile do tunnel:

```bash
docker compose --profile tunnel up -d --build
```

Pronto: `https://ytune.seu-dominio.com` acessível de qualquer lugar, com cadeado válido e instalável como app.

### ⚠️ Importante: YouTube x IP de datacenter

O YouTube frequentemente exige verificação anti-bot ("Sign in to confirm you're not a bot") para `yt-dlp` rodando em **IPs de datacenter** (a maioria dos clouds/PaaS gratuitos). Por isso:

- **Mais confiável e grátis:** rodar em **máquina em casa** (Raspberry Pi, mini-PC, notebook velho) — IP residencial que o YouTube confia — exposta via Cloudflare Tunnel.
- Em VPS/cloud, se cair em verificação, exporte cookies do navegador e monte-os no container, passando `--cookies` ao yt-dlp (configurável via flags do downloader).

### Manter o yt-dlp atualizado

O YouTube muda com frequência e quebra o `yt-dlp`. Para atualizar, rebuilde a imagem (`docker compose build --no-cache app`) ou, dentro do container, `pip3 install -U --break-system-packages yt-dlp`.

## Licença

Projeto pessoal, sem distribuição.
