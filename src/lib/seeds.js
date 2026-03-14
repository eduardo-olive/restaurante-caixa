export const SEED_USERS = [
  { id: "u1", name: "Administrador", username: "admin",  password: "admin123", role: "admin",  active: true },
  { id: "u2", name: "João Garçom",   username: "joao",   password: "123456",   role: "garcom", active: true },
  { id: "u3", name: "Maria Caixa",   username: "maria",  password: "123456",   role: "caixa",  active: true },
];

export const SEED_ACCOUNTS = [
  { id: "a1", name: "Caixa Física", type: "cash",   color: "#16a34a", icon: "💵", initialBalance: 500 },
  { id: "a2", name: "PicPay",       type: "picpay", color: "#21c25e", icon: "📱", initialBalance: 0 },
  { id: "a3", name: "Nubank",       type: "nubank", color: "#8b5cf6", icon: "💜", initialBalance: 0 },
];

export const SEED_PRODUCTS = [
  { id: "p1",  name: "Cerveja 600ml",     price: 12, category: "Bebidas",         active: true },
  { id: "p2",  name: "Refrigerante Lata", price: 6,  category: "Bebidas",         active: true },
  { id: "p3",  name: "Água Mineral",      price: 4,  category: "Bebidas",         active: true },
  { id: "p4",  name: "Suco Natural",      price: 9,  category: "Bebidas",         active: true },
  { id: "p5",  name: "Picanha Grelhada",  price: 85, category: "Carnes",          active: true },
  { id: "p6",  name: "Frango Grelhado",   price: 45, category: "Carnes",          active: true },
  { id: "p7",  name: "Costela BBQ",       price: 65, category: "Carnes",          active: true },
  { id: "p8",  name: "Batata Frita",      price: 22, category: "Acompanhamentos", active: true },
  { id: "p9",  name: "Mandioca Frita",    price: 18, category: "Acompanhamentos", active: true },
  { id: "p10", name: "Salada Mista",      price: 18, category: "Saladas",         active: true },
  { id: "p11", name: "Pão de Alho",       price: 12, category: "Acompanhamentos", active: true },
  { id: "p12", name: "Sobremesa do Dia",  price: 14, category: "Sobremesas",      active: true },
];

export const SEED_STOCK = [
  { id: "s1",  name: "Cerveja 600ml",      category: "Bebidas",    unit: "un",  qty: 48,  minQty: 12, cost: 6.5,  supplier: "Distribuidora BH" },
  { id: "s2",  name: "Refrigerante Lata",  category: "Bebidas",    unit: "un",  qty: 36,  minQty: 12, cost: 2.5,  supplier: "Distribuidora BH" },
  { id: "s3",  name: "Água Mineral 500ml", category: "Bebidas",    unit: "cx",  qty: 5,   minQty: 2,  cost: 18,   supplier: "Distribuidora BH" },
  { id: "s4",  name: "Picanha",            category: "Carnes",     unit: "kg",  qty: 8.5, minQty: 3,  cost: 55,   supplier: "Açougue Central" },
  { id: "s5",  name: "Frango",             category: "Carnes",     unit: "kg",  qty: 12,  minQty: 4,  cost: 16,   supplier: "Açougue Central" },
  { id: "s6",  name: "Costela Bovina",     category: "Carnes",     unit: "kg",  qty: 6,   minQty: 2,  cost: 38,   supplier: "Açougue Central" },
  { id: "s7",  name: "Batata",             category: "Hortifruti", unit: "kg",  qty: 15,  minQty: 5,  cost: 4.5,  supplier: "CEASA" },
  { id: "s8",  name: "Mandioca",           category: "Hortifruti", unit: "kg",  qty: 8,   minQty: 3,  cost: 3.5,  supplier: "CEASA" },
  { id: "s9",  name: "Alface",             category: "Hortifruti", unit: "un",  qty: 6,   minQty: 4,  cost: 2,    supplier: "CEASA" },
  { id: "s10", name: "Tomate",             category: "Hortifruti", unit: "kg",  qty: 4,   minQty: 2,  cost: 6,    supplier: "CEASA" },
  { id: "s11", name: "Pão de Alho (pct)",  category: "Padaria",    unit: "pct", qty: 10,  minQty: 3,  cost: 5,    supplier: "Padaria Sol" },
  { id: "s12", name: "Óleo de Soja",       category: "Secos",      unit: "L",   qty: 5,   minQty: 2,  cost: 8,    supplier: "Atacadão" },
  { id: "s13", name: "Sal",                category: "Secos",      unit: "kg",  qty: 3,   minQty: 1,  cost: 2.5,  supplier: "Atacadão" },
  { id: "s14", name: "Gás de Cozinha",     category: "Insumos",    unit: "un",  qty: 2,   minQty: 1,  cost: 110,  supplier: "Gas Express" },
];
