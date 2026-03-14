// ─── Storage Layer ────────────────────────────────────────────────────────────
// Usa localStorage para rodar localmente.
// Para produção na nuvem (Claude artifact), troque por window.storage.
const DB = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("DB.set:", e);
    }
  },
  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("DB.remove:", e);
    }
  },
};

export default DB;
