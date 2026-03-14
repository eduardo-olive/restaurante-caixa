# Restaurante Caixa — Guia para Claude CLI

Sistema de controle financeiro para restaurante. Fullstack com React + Node.js + PostgreSQL.

## Estrutura do projeto

```
C:\Dev\
├── restaurante-caixa/        ← Frontend (React + Vite)
└── rc-backend/               ← Backend (Node.js + Express + PostgreSQL)
```

## Como rodar localmente

```bash
# Terminal 1 — Backend
cd C:\Dev\rc-backend
npm run dev                   # porta 3001

# Terminal 2 — Frontend
cd C:\Dev\restaurante-caixa
npm run dev                   # porta 5173
```

O frontend já tem proxy configurado no `vite.config.js` — em dev as chamadas
`/auth`, `/orders`, etc. são redirecionadas automaticamente para `localhost:3001`.

## Deploy

| Serviço   | Plataforma | URL                                              |
|-----------|------------|--------------------------------------------------|
| Frontend  | Vercel     | https://restaurante-caixa.vercel.app             |
| Backend   | Railway    | https://web-production-e7b55.up.railway.app      |
| Banco     | Railway    | PostgreSQL (interno no Railway)                  |

Cada `git push` faz deploy automático (Vercel e Railway têm CI/CD ativo).

## Logins padrão

| Usuário | Senha     | Role   | Acesso                        |
|---------|-----------|--------|-------------------------------|
| admin   | admin123  | admin  | Tudo                          |
| maria   | 123456    | caixa  | Tudo exceto usuários          |
| joao    | 123456    | garcom | Somente comandas e dashboard  |

## Frontend — restaurante-caixa/

### Stack
- React 18 + Vite 5
- Sem biblioteca de UI externa — tudo CSS-in-JS com inline styles
- Autenticação via JWT armazenado em `localStorage`

### Estrutura de pastas

```
src/
├── App.jsx                   ← Estado global + roteamento (switch/case)
├── lib/
│   ├── api.js                ← Cliente REST (fetch + JWT) — substitui window.storage
│   ├── helpers.js            ← uid(), fmt(), fmtDate(), groupBy()
│   └── seeds.js              ← Dados iniciais (não usado em produção)
├── theme/
│   ├── index.js              ← Paleta de cores T.*
│   └── GlobalStyle.jsx       ← CSS global injetado no DOM
├── components/
│   ├── Ic.jsx                ← Ícones SVG (PATHS + componente <Ic n="nome" />)
│   ├── Btn.jsx               ← Botão com variantes: primary|ghost|danger|success|outline
│   ├── Badge.jsx             ← Badge colorida
│   ├── Modal.jsx             ← Modal genérico
│   ├── Toast.jsx             ← Notificação temporária
│   └── Sidebar.jsx           ← Menu lateral com badges de contagem
└── screens/
    ├── LoginScreen.jsx       ← Login async via API
    ├── Dashboard.jsx         ← KPIs + saldo por conta + últimas vendas
    ├── NovaComanda.jsx       ← Criar/editar comanda + validação de mesa duplicada
    ├── ComandasAbertas.jsx   ← Listar abertas + fechar + adicionar itens
    ├── Contas.jsx            ← Saldo por conta + histórico de saídas
    ├── Historico.jsx         ← Vendas filtradas por conta/data
    ├── Estoque.jsx           ← CRUD estoque + ajuste de quantidade
    ├── ListaCompras.jsx      ← Lista automática (qty < minQty) + extras manuais
    ├── EntradaNota.jsx       ← Entrada de NF: produtos + custo + preço venda
    ├── Relatorios.jsx        ← Gera 3 PDFs via jsPDF (carregado dinamicamente)
    ├── Produtos.jsx          ← CRUD cardápio
    └── Usuarios.jsx          ← CRUD usuários + ativar/desativar
```

### Roteamento

O roteamento é feito com um `switch/case` em `App.jsx` — não usa React Router.
Para adicionar uma nova tela:

1. Criar `src/screens/NovaTela.jsx` com `export default NovaTela`
2. Importar em `App.jsx`: `import NovaTela from "./screens/NovaTela.jsx"`
3. Adicionar `case "novatela":` no switch do `renderView()`
4. Adicionar item no array `nav` em `Sidebar.jsx`
5. Se precisar de ícone novo, adicionar em `Ic.jsx` no objeto `PATHS`

### Tema de cores

```js
T.bg        // #060e06  fundo principal
T.sur       // #0d1a0d  superfícies (sidebar, modais)
T.card      // #111f11  cards
T.amber     // #f5a623  cor primária / CTA
T.grn       // #4ade80  sucesso / verde claro
T.grnDim    // #16a34a  botão success / verde escuro
T.red       // #f87171  erros / alertas
T.redDim    // #dc2626  botão danger
T.pur       // #c084fc  badges / roxo
T.blue      // #60a5fa  informação / azul
T.txt       // #e2dfd0  texto principal
T.txtM      // #8a9e8a  texto secundário
T.txtS      // #5a6e5a  texto terciário / placeholder
T.radius    // 10px     border-radius padrão
T.radiusSm  // 6px      border-radius pequeno
```

### Cliente API (src/lib/api.js)

Cada módulo expõe operações CRUD. Exemplo de uso em qualquer screen:

```js
import { orders as ordersApi } from "../lib/api.js";

const todas = await ordersApi.list();
const nova  = await ordersApi.create({ id, table, items, ... });
const atual = await ordersApi.update(id, { ...campos });
await ordersApi.remove(id);
```

O token JWT é gerenciado automaticamente — salvo em `localStorage` no login,
enviado como `Authorization: Bearer <token>` em toda requisição,
e limpo automaticamente em caso de 401.

### Variáveis de ambiente (frontend)

```env
VITE_API_URL=https://web-production-e7b55.up.railway.app
```

Em desenvolvimento, o proxy do Vite já redireciona — `VITE_API_URL` pode ficar vazio.

---

## Backend — rc-backend/

### Stack
- Node.js 18+ / Express 4
- PostgreSQL via `pg` (pool de conexões)
- JWT via `jsonwebtoken` + senhas com `bcryptjs`
- CORS configurado para aceitar `*.vercel.app` e `*.railway.app`

### Estrutura de pastas

```
src/
├── server.js                 ← Entry point, middlewares, rotas, health check
├── middleware/
│   └── auth.js               ← Valida JWT (req.user fica disponível)
├── db/
│   ├── pool.js               ← Pool PostgreSQL (SSL em produção)
│   ├── schema.sql            ← DDL completo — rodar via migrate.js
│   ├── migrate.js            ← npm run migrate
│   └── seed.js               ← npm run seed (usuarios, produtos, estoque)
└── routes/
    ├── auth.js               ← POST /auth/login, GET /auth/me
    ├── users.js              ← CRUD + toggle ativo
    ├── accounts.js           ← CRUD + PATCH /balance, saldo calculado no GET
    ├── products.js           ← CRUD
    ├── orders.js             ← CRUD + PATCH /close, items em order_items
    ├── stock.js              ← CRUD + PATCH /adjust
    ├── purchases.js          ← GET + POST
    └── shopping.js           ← GET + POST + DELETE
```

### Schema do banco

```
users          id, name, username, password_hash, role, active
accounts       id, name, type, color, icon, initial_balance
products       id, name, price, category, active
orders         id, table_num, client_name, total, account_id, attendant_id,
               attendant_name, status (aberta|fechada), created_at, closed_at
order_items    id (serial), order_id, product_id, name, price, qty
stock          id, name, category, unit, qty, min_qty, cost, supplier
shopping       id, name, qty, unit, cost, supplier, created_at
purchases      id, account_id, amount, description, stock_id, invoice_no,
               supplier, invoice_date, user_id, user_name, created_at
```

### Níveis de acesso

- `admin` / `caixa` → acesso total (adminOnly middleware)
- `garcom`          → acesso somente a GET /orders, POST /orders, GET /products

### Endpoints completos

```
GET    /health                    → Status da API + DB
POST   /auth/login                → { token, user }
GET    /auth/me                   → Usuário atual

GET    /users                     → Lista usuários
POST   /users                     → Cria usuário (senha em plain text → hash interno)
PUT    /users/:id                 → Atualiza (password opcional)
PATCH  /users/:id/toggle          → Ativa/desativa

GET    /accounts                  → Lista com saldo calculado (sales - purchases)
POST   /accounts                  → Cria conta
PUT    /accounts/:id              → Atualiza
PATCH  /accounts/:id/balance      → Atualiza só saldo inicial
DELETE /accounts/:id              → Remove

GET    /products                  → Lista todos
POST   /products                  → Cria
PUT    /products/:id              → Atualiza
DELETE /products/:id              → Remove

GET    /orders                    → Lista com items embutidos
POST   /orders                    → Cria comanda + items em order_items
PUT    /orders/:id                → Atualiza comanda + substitui todos os items
PATCH  /orders/:id/close          → { accountId } → fecha comanda
DELETE /orders/:id                → Cancela

GET    /stock                     → Lista estoque
POST   /stock                     → Cria item
PUT    /stock/:id                 → Atualiza item completo
PATCH  /stock/:id/adjust          → { delta, type, newQty } — type: entrada|saida|ajuste
DELETE /stock/:id                 → Remove

GET    /purchases                 → Lista saídas
POST   /purchases                 → Registra saída

GET    /shopping                  → Lista extras da lista de compras
POST   /shopping                  → Adiciona extra
DELETE /shopping/:id              → Remove extra
```

### Variáveis de ambiente (backend)

```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=hex64chars
JWT_EXPIRES_IN=8h
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://restaurante-caixa.vercel.app
```

### Comandos úteis

```bash
npm run dev          # desenvolvimento com nodemon
npm start            # produção
npm run migrate      # cria/atualiza tabelas (idempotente)
npm run seed         # insere dados iniciais (ON CONFLICT DO NOTHING)

# Rodar migration/seed diretamente no Railway:
railway run npm run migrate
railway run npm run seed
```

---

## Convenções do projeto

### Nomenclatura
- IDs: string no formato `Date.now().toString(36) + random` gerado pelo `uid()` helper
- Datas: ISO 8601 string (`new Date().toISOString()`)
- Valores monetários: `NUMERIC(10,2)` no banco, `parseFloat()` no JS, `fmt()` para exibição

### Adicionar nova funcionalidade (padrão)

1. **Banco**: Adicionar tabela/coluna em `schema.sql` → rodar `npm run migrate`
2. **Backend**: Criar rota em `src/routes/nova.js` → registrar em `server.js`
3. **API Client**: Adicionar módulo em `src/lib/api.js` no frontend
4. **Screen**: Criar `src/screens/NovaTela.jsx`
5. **Rota**: Adicionar `case` em `App.jsx` + item no `Sidebar.jsx`

### Sem confirm() nativo
O projeto usa confirmação inline (estado local `confirmId`) em vez de
`window.confirm()` porque artifacts/iframes bloqueiam dialogs nativos do browser.

### Relatórios PDF
jsPDF e jspdf-autotable são carregados dinamicamente via CDN (não são dependências
do `package.json`) para não aumentar o bundle. A lógica está em `Relatorios.jsx`.
