# Itajubá News — Frontend

Frontend Next.js independente, com a logo original e paleta vermelho, preto e branco.

Backend: https://github.com/jandersonvb/itajuba-news-backend

## Recursos

Home responsiva, busca e editorias, paginação, página de matéria com metadados, espaços publicitários, formulário comercial e painel de notícias, patrocinadores, campanhas e pedidos. O painel requer a API NestJS, banco configurado e administrador criado no backend.

## Rodar

Node.js 22+ e npm.

```bash
npm ci
npm run setup
npm run dev
```

O setup cria `.env.local`, sem sobrescrever configurações existentes. Configure `API_URL` com a origem da API incluindo `/api` (padrão `http://localhost:4000/api`) e `SITE_URL` com a origem do portal (padrão `http://localhost:3000`). API_URL é usada pelo servidor Next.js, não pelo navegador.

Portal: http://localhost:3000. Painel: http://localhost:3000/admin. Prepare o banco e o administrador seguindo o README do backend.

## Verificar e compilar

```bash
npm run typecheck
npm run build
npm run start
```

A integração usa JWT em cookie HttpOnly, SameSite=Strict, Secure em produção. As mutações validam a origem da requisição. Produção requer HTTPS e SITE_URL correspondente à origem pública. Configure API_URL e SITE_URL no provedor de hospedagem antes de iniciar. Nenhum segredo deve ser colocado no código ou em variáveis NEXT_PUBLIC.

## Estrutura

- `src/app/`: páginas públicas, painel e rotas intermediárias para API.
- `src/components/`: componentes, formulários e painel.
- `src/lib/`: tipos e integração com NestJS.
- `public/logo.png`: logo original.
- `.github/workflows/ci.yml`: TypeScript e build.

## Limites atuais

Base inicial para um portal por instalação; não há cobrança, métricas de banners, newsletter, guia comercial, upload de mídia ou gestão de múltiplos domínios/tenants. Campanhas exibem a ativa mais recente por posição. Não coleta notícias automaticamente. Matérias do seed são demonstrativas, identificadas como exemplo e devem ser excluídas antes do lançamento.

Fotos externas são ilustrativas ou fornecidas pela redação. Matérias usam texto simples, evitando HTML arbitrário. Formulário comercial grava dados no backend com consentimento; não envia e-mail. Dados podem ser excluídos pela equipe no painel.

Build e verificação TypeScript executados. Os testes de API ficam no repositório backend. Não houve inspeção visual em navegador nesta entrega.
