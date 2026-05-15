# Rocha Smart — app web (`web/`)

Frontend **Next.js** (App Router) do monorepo **Rocha Smart** — vitrine no tom **magazine tech & casa inteligente**. Documentação geral, estrutura de pastas, API, MCP e variáveis de ambiente estão no [**README na raiz do repositório**](../README.md).

## Uso rápido

```bash
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Na raiz do monorepo você também pode usar `npm run dev` (delega para este pacote).

## Stack principal

- Next.js, React, TypeScript, Tailwind CSS v4
- Prisma + PostgreSQL (Neon)
- Meta Pixel, GA4, Google Ads (quando configurados)
