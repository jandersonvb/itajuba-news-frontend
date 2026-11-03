# Itajubá News — Frontend

Frontend Next.js independente, com a logo original e paleta vermelho, preto e branco.

Backend: https://github.com/jandersonvb/itajuba-news-backend

## Recursos

Home responsiva, busca e editorias, paginação, página de matéria com metadados, espaços publicitários, faixa "Quem apoia" com os patrocinadores ativos, formulário comercial, páginas institucionais (Expediente, Contato, Política de Privacidade e Termos de uso) e painel editorial. O menu de editorias vem da API, na ordem definida no painel. O painel requer a API NestJS e banco configurado.

## SEO e Google Notícias

- **Endereços:** cada editoria tem a sua página (`/editoria/{slug}`, paginação por `?pagina=N`). A busca fica em `/busca?q=...&editoria=...` e não é indexada (`noindex, follow`). As URLs antigas da home (`/?editoria=`, `/?busca=`) redirecionam com 308.
- **Metadados:** canonical em todas as páginas indexáveis, Open Graph e cartão grande do X, link do RSS no `<head>`. As matérias têm `article:published_time`/`modified_time`, e "Atualizado em" aparece quando o texto ou a imagem mudam mais de 1 minuto depois da publicação (`updatedAt` da API).
- **Dados estruturados (JSON-LD):** `WebSite` com caixa de busca e `NewsMediaOrganization` na home; `NewsArticle` e `BreadcrumbList` nas matérias.
- **Arquivos para robôs:** `/sitemap.xml` (páginas fixas, editorias e todas as matérias), `/news-sitemap.xml` (matérias das últimas 48 horas, para o Google Notícias), `/feed.xml` (RSS das 12 mais recentes) e `/robots.txt`. Os três primeiros ficam em cache por até 1 minuto, e publicar no painel os renova na hora.
- **Imagens:** `src/app/opengraph-image.tsx` gera a imagem padrão de compartilhamento (1200×630). Matéria com foto usa a própria foto. `icon.png` e `apple-icon.png` são cópias de `public/logo.png`, e `/favicon.ico` é reescrito para a logo.

O `robots.txt` só libera os robôs quando `SITE_URL` começa com `https://`. Em local e em testes, bloqueia tudo. Como `SITE_URL`, ele é lido no `next build`. Para verificar o domínio no Google Search Console pela meta tag, defina `GOOGLE_SITE_VERIFICATION` com o valor de `content`. Depois, envie `sitemap.xml` e `news-sitemap.xml` no Search Console.

Primeiro acesso: o administrador vem de `ADMIN_EMAIL` no backend, que envia um convite por e-mail. Enquanto ninguém criou senha, o login mostra "Convite enviado" (com "Reenviar convite") ou, se `ADMIN_EMAIL` não estiver definido, como configurá-lo. O link do convite abre `/admin/convite?token=...`, onde a pessoa confirma o nome, cria a senha e já entra no painel.

Abas do painel (`/admin`):

- **Notícias**, **Patrocinadores** e **Campanhas**: cadastro e edição. Os campos de imagem aceitam uma imagem enviada (`/media/...`) ou uma URL `http(s)`; o botão "Enviar imagem" ao lado do campo faz o upload e preenche o endereço.
- **Editorias**: nome, slug e posição no menu (da menor para a maior). A API recusa slug repetido e a exclusão de editoria que ainda tem notícias.
- **Mídia**: envio de JPG, PNG, WebP ou GIF de até 4 MB (o tipo é conferido pelo conteúdo do arquivo), miniaturas, "Copiar URL" e exclusão. Imagem em uso em notícia, patrocinador ou campanha não pode ser excluída.
- **Pedidos comerciais**: leitura e exclusão.
- **Usuários** (só administradores): tabela com nome, e-mail, perfil, status e data de criação; "Convidar usuário" (a pessoa recebe um e-mail e cria a própria senha; a lista mostra convite pendente ou expirado e tem "Reenviar convite"); edição de nome, e-mail, perfil e acesso; "Redefinir senha" em um modal (encerra as sessões daquele usuário); "Desativar/Reativar" no lugar de excluir. Na própria linha, o admin não pode rebaixar o perfil nem se desativar.

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

As leituras públicas (notícias, editorias, patrocinadores, campanhas) ficam em cache por 60 segundos; alterações feitas no painel expiram o cache imediatamente. Em produção, o IP do visitante, que a API usa para limitar tentativas repetidas, vem do cabeçalho definido pelo proxy do provedor. `CLIENT_IP_HEADER` escolhe qual: `x-forwarded-for` (padrão; serve para a Vercel, que o sobrescreve com o IP real), `x-real-ip` (Railway) ou `cf-connecting-ip` (Railway com o proxy do Cloudflare, ou Render). O `cf-connecting-ip` só é aceito quando a conexão veio de um endereço do Cloudflare (`src/lib/cloudflare-ips.ts`); quem contorna o Cloudflare é contado pelo próprio IP. Com o cabeçalho errado, todos os visitantes viram um só (e os logins errados de um bloqueiam todos) ou, se o proxy não define o cabeçalho, o próprio visitante o envia e escolhe o IP com que é contado. Valor que não parece um IP é ignorado, e a requisição segue sem limite por visitante, como quando o cabeçalho falta.

Portal: http://localhost:3000. Painel: http://localhost:3000/admin. Prepare o banco e o administrador seguindo o README do backend.

## Verificar e compilar

```bash
npm run typecheck
npm run build
npm run start
```

O `start` usa a porta de `PORT` (padrão 3000), que o Railway informa. O build avisa quais dados de `src/lib/site.ts` ainda estão como `[PREENCHER: ...]`.

A integração usa JWT em cookie HttpOnly, SameSite=Strict, Secure em produção. As mutações validam a origem da requisição. Produção requer HTTPS e SITE_URL correspondente à origem pública. Configure API_URL e SITE_URL no provedor de hospedagem antes do build e do início. Nenhum segredo deve ser colocado no código ou em variáveis NEXT_PUBLIC.

## Deploy no Railway

O portal, a API e o PostgreSQL ficam num mesmo projeto do Railway, com os serviços `portal`, `api` e `Postgres`. O passo a passo completo está no `GUIA-DEPLOY.md`, na pasta acima dos dois repositórios.

- **Serviço:** o `railway.json` define o start (`npm run start`) e o health check (`/robots.txt`, estático: o deploy do portal não espera a API). Use a mesma região da API (US East).
- **Variáveis do `portal`:**
  - `API_URL=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:${{api.PORT}}/api`: a API só existe na rede privada, sem endereço público.
    - Durante o build a rede privada não responde: o sitemap, o feed e as páginas institucionais saem do build sem dados da API e se refazem em até 1 minuto no ar.
    - O rewrite de `/media` é gravado no build com esse endereço. Se mudar, faça redeploy.
  - `SITE_URL`: domínio HTTPS público, sem barra no fim.
  - `INTERNAL_API_KEY=${{api.INTERNAL_API_KEY}}`: a referência garante o mesmo valor da API, que recusa (403) qualquer chamada sem ela.
  - `CLIENT_IP_HEADER=cf-connecting-ip` com o proxy do Cloudflare; `x-real-ip` sem ele.
  - `NEXT_PUBLIC_GA_ID`: opcional, só em produção. Entra no build: mudou, faça redeploy.
  - `GOOGLE_SITE_VERIFICATION`: opcional.
- **Domínio:** o Railway exige CNAME, e o DNS do registro.br não aceita CNAME no domínio raiz. Por isso o DNS fica no Cloudflare:
  - no Railway, *Custom Domain* com o domínio raiz;
  - no Cloudflare, `CNAME @` com o proxy ligado (nuvem laranja) e o TXT de verificação, e SSL/TLS em **Full**, não *Full (strict)*.
  - **Não** deixe domínio `*.up.railway.app` no portal: ele contorna o Cloudflare.
- **Upload:** até 4 MB por imagem, no painel e na API.
- **Antes de lançar:** preencha os campos `[PREENCHER: ...]` de `src/lib/site.ts` (razão social, CNPJ, endereço, jornalista responsável e e-mails). Eles aparecem no Expediente, no Contato, na Política de Privacidade e nos Termos, e o build lista os que faltam.

**Outros provedores.** Na Vercel, `API_URL` é o endereço **público** da API, o `CLIENT_IP_HEADER` padrão serve, e o plano precisa ser o Pro: o Hobby não permite uso comercial, e anúncios contam como uso comercial. O corpo de uma requisição lá tem no máximo 4,5 MB, o que o limite de 4 MB por imagem já respeita.

## Google Analytics e cookies

- **`NEXT_PUBLIC_GA_ID`** (`G-XXXXXXXXXX`): só nas variáveis de produção. Entra no build: se mudar, faça redeploy. Sem ele, como no ambiente local, não há banner nem nada do Google.
- **Consentimento (LGPD):**
  - nada do Google carrega antes de "Aceitar" no banner;
  - a escolha fica no cookie `consentimento_cookies` (`aceito` ou `recusado`) por 180 dias;
  - "Recusar" depois de aceitar apaga `_ga` e `_ga_*` e recarrega a página sem o GA;
  - "Preferências de cookies", no rodapé, reabre a escolha;
  - o banner fica no rodapé do portal e nunca aparece no painel.
- **Configuração do GA:** Google Signals e personalização de anúncios desligados. As visualizações de página entre rotas vêm da medição otimizada do GA4 (eventos do histórico do navegador).
- **Eventos** (`src/lib/analytics.ts`), sem dados pessoais:
  - `ad_click`: clique no banner de uma campanha ativa, com `campaign_id`, `campaign_name`, `sponsor` e `slot`;
  - `generate_lead`: pedido do `/anuncie` enviado com sucesso, com `interest`.
- **Política de Privacidade:** com o ID configurado, `/privacidade#cookies` mostra os cookies do GA e o Google entre os provedores.

O painel também guarda no `localStorage` uma cópia do texto da matéria em edição até ela ser salva (`src/lib/article-drafts.ts`). Ela protege contra sessão expirada, recarregamento e Esc, vale 7 dias e é apagada ao sair.

## Estilos (Tailwind CSS v4)

O visual é todo feito com classes do Tailwind nos componentes.

- `src/app/globals.css` guarda só:
  - os tokens do design (`@theme`): cores do portal e do painel, fonte, escala de texto, sombras e animações;
  - os estilos-base dos elementos;
  - o utilitário `wrap`, que é a coluna da página.
- As cores do painel usam `light-dark()`, então o tema claro, escuro ou automático só troca o `color-scheme`.
- A escala de texto tem o nome do tamanho em pixels (`text-13`, `text-15`) e não define altura de linha.
- Os breakpoints são os do layout original e quase sempre aparecem como `max-*`:

  | Variante | Largura |
  |---|---|
  | `max-sm` | até 600px |
  | `max-md` | até 760px |
  | `max-lg` | até 960px |
  | `max-xl` | até 1100px |

- `src/lib/styles.ts` tem as classes compartilhadas: botões, campos, rótulos e avisos do portal e do painel.
  - As variantes são escolhidas por argumento, como `button('light')` ou `admButton('primary')`.
  - Não acrescente depois uma classe que conflite com elas: com duas classes da mesma propriedade, vale a ordem do CSS, não a da `className`.

Nenhum controle usa a aparência do sistema operacional:

- **`src/components/Select.tsx`:** o select do portal, da busca e do painel.
  - É uma lista acessível pelo teclado (setas, Home/End, Enter, Esc e busca pelas primeiras letras).
  - Um `<select>` nativo escondido carrega o valor, então `FormData`, `required` e `form.reset()` continuam funcionando.
- **`src/components/admin/DateTimeField.tsx`:** data e hora das campanhas, com calendário e campo `hh:mm`.
  - Envia `AAAA-MM-DDTHH:mm` no horário de Brasília.
- **`src/components/admin/ConfirmDialog.tsx`:** substitui o `window.confirm()` do painel. Abre com o foco em "Cancelar", e Esc cancela.
- **Checkbox, radio e interruptor:** desenhados com `appearance-none`.

## Estrutura

- `src/app/`: páginas públicas, painel e rotas intermediárias para API.
- `src/components/`: componentes, formulários e painel.
- `src/lib/`: tipos, integração com NestJS e as classes compartilhadas (`styles.ts`).
- `public/logo.png`: logo original.
- `.github/workflows/ci.yml`: TypeScript e build.

## Limites atuais

Base inicial para um portal por instalação; não há cobrança, métricas de banners, newsletter, guia comercial, redimensionamento ou recorte de imagens ou gestão de múltiplos domínios/tenants. Campanhas exibem a ativa mais recente por posição. Não coleta notícias automaticamente. Matérias do seed são demonstrativas, identificadas como exemplo e devem ser excluídas antes do lançamento.

Fotos externas são ilustrativas ou fornecidas pela redação. Matérias usam texto simples, evitando HTML arbitrário. Formulário comercial grava dados no backend com consentimento, e a API avisa os administradores por e-mail. Dados podem ser excluídos pela equipe no painel.

Build e verificação TypeScript executados. Os testes de API ficam no repositório backend.

Em 03/11/2026, todos os fluxos foram testados num Chrome real, partindo de um banco vazio:
- configuração inicial, convites, login, senha esquecida e sessão expirada;
- as 7 abas do painel com os perfis Administrador, Editor e Repórter;
- o portal, a busca, o Anuncie, os feeds e os cookies;
- os componentes acima, com mouse e teclado.

A migração para o Tailwind foi comparada pixel a pixel com o CSS anterior, em 64 telas de desktop e celular.
