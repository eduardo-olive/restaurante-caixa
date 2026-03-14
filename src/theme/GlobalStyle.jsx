import T from "./index.js";

const GlobalStyle = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, #root {
      background: ${T.bg};
      color: ${T.txt};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: ${T.sur}; }
    ::-webkit-scrollbar-thumb { background: ${T.bdrBr}; border-radius: 2px; }
    input, select, textarea {
      background: ${T.card};
      border: 1px solid ${T.bdr};
      color: ${T.txt};
      border-radius: ${T.radiusSm};
      padding: 10px 12px;
      font-size: 14px;
      outline: none;
      transition: border-color .15s;
      width: 100%;
      font-family: inherit;
    }
    input:focus, select:focus, textarea:focus { border-color: ${T.amber}; }
    input::placeholder { color: ${T.txtS}; }
    select option { background: ${T.card}; }
    button { cursor: pointer; font-family: inherit; border: none; outline: none; transition: all .15s; }
    .fade-in { animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

export default GlobalStyle;
