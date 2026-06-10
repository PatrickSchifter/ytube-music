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

## Licença

Projeto pessoal, sem distribuição.
