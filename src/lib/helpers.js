export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const fmt = (n) =>
  "R$ " +
  Number(n)
    .toFixed(2)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const fmtDate = (s) =>
  new Date(s).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const groupBy = (arr, fn) =>
  arr.reduce((a, i) => {
    const k = fn(i);
    (a[k] = a[k] || []).push(i);
    return a;
  }, {});
