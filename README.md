# Math Dashboard (Next.js + App Router)

Dashboard full‑stack para ingestão, análise e visualização de questões e tentativas de um app de matemática.
Stack: **Next.js (App Router)**, **PostgreSQL**, **Prisma**, **NextAuth (Credentials)**, **Zod**, **Tailwind**, **ECharts**.
Infra local via **Docker Compose**.

## Recursos
- Login com **NextAuth (Credentials)**: usuário seed `admin@example.com` / `admin123`
- Páginas protegidas (middleware)
- Dashboard com métricas: total de questões, tentativas, acurácia, tempo médio
- Gráficos: evolução (linha), distribuição por tópicos (pizza) e heatmap (tópico × dificuldade)
- Listagem + filtros de questões
- Detalhe da questão com passos de solução e métricas por item
- Feedback de usuários + agregados
- **Endpoint de sincronização** `/api/sync` para receber lote do app (com `externalId` + upsert)
- Tentativas/feedbacks preservam `appUserId`, `studentName` e `createdAt` enviados pelo app offline para exibir a origem do aluno
- Validação com **Zod** e tratamento de erros consistente
- Observabilidade: logs básicos no backend (`lib/logger.ts`) e **toasts** no frontend
- **Docker Compose** com Postgres e app
- **Prisma** com migrações e **seed** de dados

## Setup rápido (dev local)
1. **Clone/extraia** o projeto e crie `.env`:
   ```bash
   cp .env.example .env
   ```
2. **Suba o Postgres e o app** (opcionalmente só o DB, caso rode `pnpm dev` fora do container):
   ```bash
   docker compose up -d db
   # ou (ambos)
   docker compose up -d
   ```
3. **Instale dependências** e gere o client do Prisma:
   ```bash
   pnpm install
   pnpm prisma generate
   ```
4. **Migre e seed**:
   ```bash
   pnpm prisma migrate dev --name init
   pnpm prisma db seed # (usa prisma/seed.ts via ts-node)
   ```
   > Se já existe um banco criado, rode uma nova migração para incluir os campos de sincronização do app móvel:
   > `pnpm prisma migrate dev --name add-app-user-sync`
5. **Rodar**:
   ```bash
   pnpm dev
   # App em http://localhost:3000
   ```

> Login demo: `admin@example.com` / `admin123`

## Arquitetura (visão geral)
- **app/**: App Router (páginas, rotas de API)
  - `app/dashboard`: métricas + gráficos (server components)
  - `app/questions`: listagem e filtros (client component)
  - `app/questions/[id]`: detalhes com passos e métricas
  - `app/feedback`: agregados + formulário
  - `app/sync`: utilitário para testar payloads de sincronização
  - `app/api/**`: route handlers REST
- **lib/**: `prisma.ts`, `auth.ts`, `zodSchemas.ts`, `logger.ts`
- **prisma/**: `schema.prisma` + `seed.ts`
- **components/**: UI (sidebar, cards) e charts com **ECharts**

## Rotas principais (API)
- `POST /api/auth/[...nextauth]` – NextAuth (Credentials)
- `GET/POST /api/questions`
- `GET/PATCH/DELETE /api/questions/:id`
- `GET/POST /api/questions/:id/steps`
- `GET/POST /api/attempts`
- `GET/POST /api/feedback`
- `POST /api/sync` – recebe:
  ```jsonc
  {
    "apiKey": "dev-sync-key",
    "questions": [{ "externalId": "ext-q-42", "title": "...", "content": "...", "topic": "Algebra", "difficulty": "EASY" }],
    "solutionSteps": [{ "externalId": "ext-s-1", "questionExternalId": "ext-q-42", "order": 1, "content": "..." }],
    "attempts": [{ "externalId": "ext-a-1", "questionExternalId": "ext-q-42", "correct": true, "timeMs": 12345, "attempts": 1, "source": "app", "topic": "Algebra", "difficulty": "EASY" }],
    "feedbacks": [{ "externalId": "ext-f-1", "questionExternalId": "ext-q-42", "rating": 5, "comment": "Nice!" }]
  }
  ```
  > Autorização: `x-api-key: <SYNC_API_KEY>` **ou** `apiKey` no payload (se `SYNC_API_KEY` estiver configurada).

### Estratégia de sincronização
- **Upsert por `externalId`** (único por entidade).
- **Vinculação por `questionExternalId`** quando `questionId` não estiver presente.
- Caso precise de resolução de conflitos por `updatedAt`, estenda o payload para enviar `updatedAt` e aplique uma política *last write wins* (não implementado por simplicidade).

## Melhorias sugeridas
- Paginação e ordenação na listagem de questões (hoje filtragem é client‑side).
- Autorização por papéis (**admin**, **analyst**).
- Auditoria (tabelas de log) e correlação (request id) no logger.
- Testes (unitários/integração) e CI.
- Sentry/Logtail para observabilidade.
- Rotina de *retry* no app móvel e marcação de registros sincronizados/pendentes.

## Comandos úteis
```bash
pnpm prisma studio
docker compose logs -f web
docker compose logs -f db
```

## Credenciais/variáveis
- `DATABASE_URL`: apontando para o serviço `db` do Compose
- `NEXTAUTH_URL`: `http://localhost:3000`
- `NEXTAUTH_SECRET`: gere um segredo forte
- `SYNC_API_KEY`: opcional, usada pelo endpoint `/api/sync`
# math-dashboard
