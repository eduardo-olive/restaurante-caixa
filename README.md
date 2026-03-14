# 🍽️ Restaurante Caixa

Sistema de controle financeiro para restaurante — React + Vite, dados salvos em `localStorage`.

## Estrutura

```
src/
├── lib/
│   ├── db.js          ← localStorage adapter
│   ├── helpers.js     ← uid, fmt, fmtDate, groupBy
│   └── seeds.js       ← dados iniciais (usuários, produtos, estoque)
├── theme/
│   ├── index.js       ← paleta de cores (T)
│   └── GlobalStyle.jsx← CSS global
├── components/
│   ├── Ic.jsx         ← ícones SVG
│   ├── Btn.jsx        ← botão com variantes
│   ├── Badge.jsx      ← badge colorido
│   ├── Modal.jsx      ← modal genérico
│   ├── Toast.jsx      ← notificação
│   └── Sidebar.jsx    ← navegação lateral
├── screens/
│   ├── LoginScreen.jsx
│   ├── Dashboard.jsx
│   ├── NovaComanda.jsx
│   ├── ComandasAbertas.jsx
│   ├── Contas.jsx
│   ├── Historico.jsx
│   ├── Estoque.jsx
│   ├── ListaCompras.jsx
│   ├── EntradaNota.jsx
│   ├── Produtos.jsx
│   └── Usuarios.jsx
├── App.jsx            ← estado global + roteamento
└── main.jsx           ← entry point React
```

## Como rodar

### Pré-requisito
Node.js ≥ 18 instalado — https://nodejs.org

### Passos

```bash
# 1. Instalar dependências (só na primeira vez)
npm install

# 2. Rodar em desenvolvimento
npm run dev
```

Acesse **http://localhost:5173** no navegador.

### Logins padrão

| Usuário  | Senha      | Perfil        |
|----------|------------|---------------|
| `admin`  | `admin123` | Administrador |
| `maria`  | `123456`   | Caixa         |
| `joao`   | `123456`   | Garçom        |

### Build para produção

```bash
npm run build   # gera pasta dist/
npm run preview # pré-visualiza o build
```

## Dados

Todos os dados ficam no `localStorage` do navegador.  
Para zerar, abra o DevTools → Application → Local Storage → limpar as chaves `rc_*`.

## Notas de desenvolvimento

- `src/lib/db.js` usa `localStorage` localmente. Em produção no Claude artifact, trocar por `window.storage`.
- Os seeds em `src/lib/seeds.js` só são usados na primeira execução (quando o localStorage está vazio).
