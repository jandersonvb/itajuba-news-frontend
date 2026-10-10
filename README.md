# Itajubá News — Frontend

Frontend Next.js independente, com a logo original e paleta vermelho, preto e branco.

Backend: https://github.com/jandersonvb/itajuba-news-backend

## Recursos

Home responsiva, busca e editorias, paginação, página de matéria com metadados, espaços publicitários, faixa "Quem apoia" com os patrocinadores ativos, formulário comercial e painel editorial. O menu de editorias vem da API, na ordem definida no painel. O painel requer a API NestJS, banco configurado e administrador criado no backend.

Abas do painel (`/admin`):

- **Notícias**, **Patrocinadores** e **Campanhas**: cadastro e edição. Os campos de imagem aceitam uma imagem enviada (`/media/...`) ou uma URL `http(s)`; o botão "Enviar imagem" ao lado do campo faz o upload e preenche o endereço.
- **Editorias**: nome, slug e posição no menu (da menor para a maior). A API recusa slug repetido e a exclusão de editoria que ainda tem notícias.
- **Mídia**: envio de JPG, PNG, WebP ou GIF de até 5 MB (o tipo é conferido pelo conteúdo do arquivo), miniaturas, "Copiar URL" e exclusão. Imagem em uso em notícia, patrocinador ou campanha não pode ser excluída.
- **Pedidos comerciais**: leitura e exclusão.
- **Usuários** (só administradores): tabela com nome, e-mail, perfil, status e data de criação; "Novo usuário" (senha inicial de 12+ caracteres); edição de nome, e-mail, perfil e acesso; "Redefinir senha" em um modal (encerra as sessões daquele usuário); "Desativar/Reativar" no lugar de excluir. Na própria linha, o admin não pode rebaixar o perfil nem se desativar.

Cada perfil vê só as abas e ações que a API permite. **Administrador** vê todas; **Editor (redator)** vê Notícias, Editorias e Mídia; **Repórter** vê Notícias (só as próprias, sempre como rascunho; as já publicadas abrem em modo leitura) e Mídia (envio, sem exclusão). Isso é só conveniência: quem garante as permissões é a API, que responde 403, e o painel mostra a mensagem dela sem deslogar.

A aba aberta fica no endereço (`/admin?aba=users`). Uma aba que o perfil não pode abrir redireciona para Notícias.

Sessão: o layout de `src/app/admin/(painel)/` lê o usuário em `GET /auth/me` a cada carregamento, então mudança de perfil ou desativação vale na hora. O cookie HttpOnly expira junto com o token (`expiresIn`). Qualquer 401 (token expirado, usuário desativado, senha redefinida) passa por `/api/auth/session-expired`, que apaga o cookie e abre o login com o aviso de sessão expirada.

## Rodar

Node.js 22+ e npm.

```bash
npm ci
npm run setup
npm run dev
```

O setup cria `.env.local`, sem sobrescrever configurações existentes. Configure `API_URL` com a origem da API incluindo `/api` (padrão `http://localhost:4000/api`) e `SITE_URL` com a origem do portal (padrão `http://localhost:3000`). API_URL é usada pelo servidor Next.js, não pelo navegador. Preencha `INTERNAL_API_KEY` com o mesmo valor do `.env` do backend: com ela a API aplica o limite de requisições ao IP de cada visitante, e não ao IP do servidor Next.js.

As imagens enviadas pelo painel ficam na API e são referenciadas como `/media/<arquivo>`. O `next.config.ts` repassa `/media/*` para `API_URL + /media/*` (rewrite), então elas carregam na mesma origem do portal e o navegador não fala direto com a API. Esse destino é lido no `next build` e gravado no resultado do build (`.next/routes-manifest.json`); o `next start` não o relê. Por isso o build precisa rodar com o `API_URL` de produção, e trocar `API_URL` exige um novo build. No Open Graph, `/media/...` vira URL absoluta pelo `metadataBase` (`SITE_URL`).

As leituras públicas (notícias, editorias, patrocinadores, campanhas) ficam em cache por 60 segundos; alterações feitas no painel expiram o cache imediatamente. Em produção, rode o Next.js atrás de um proxy que defina `X-Forwarded-For` (Vercel, nginx, Cloudflare), pois o IP do visitante é lido desse cabeçalho.

Portal: http://localhost:3000. Painel: http://localhost:3000/admin. Prepare o banco e o administrador seguindo o README do backend.

## Verificar e compilar

```bash
npm run typecheck
npm run build
npm run start
```

A integração usa JWT em cookie HttpOnly, SameSite=Strict, Secure em produção. As mutações validam a origem da requisição. Produção requer HTTPS e SITE_URL correspondente à origem pública. Configure API_URL e SITE_URL no provedor de hospedagem antes do build e do início. Nenhum segredo deve ser colocado no código ou em variáveis NEXT_PUBLIC.

## Estrutura

- `src/app/`: páginas públicas, painel e rotas intermediárias para API.
- `src/components/`: componentes, formulários e painel.
- `src/lib/`: tipos e integração com NestJS.
- `public/logo.png`: logo original.
- `.github/workflows/ci.yml`: TypeScript e build.

## Limites atuais

Base inicial para um portal por instalação; não há cobrança, métricas de banners, newsletter, guia comercial, redimensionamento ou recorte de imagens ou gestão de múltiplos domínios/tenants. Campanhas exibem a ativa mais recente por posição. Não coleta notícias automaticamente. Matérias do seed são demonstrativas, identificadas como exemplo e devem ser excluídas antes do lançamento.

Fotos externas são ilustrativas ou fornecidas pela redação. Matérias usam texto simples, evitando HTML arbitrário. Formulário comercial grava dados no backend com consentimento; não envia e-mail. Dados podem ser excluídos pela equipe no painel.

Build e verificação TypeScript executados. As rotas intermediárias do painel (editorias, mídia, patrocinadores) e o rewrite de `/media` foram conferidos contra a API local. Os testes de API ficam no repositório backend. Não houve inspeção visual em navegador nesta entrega.
