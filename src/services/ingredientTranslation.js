// SCRUM-117 — O Spoonacular só entende inglês. Traduz os nomes da despensa e as
// restrições do perfil (escritos em português) antes da pesquisa.
// Dicionário local: funciona offline e não gasta pedidos de outra API.

export const normalizeName = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Formas possíveis no singular: "ovos" -> ovo, "nozes" -> noz, "limoes" -> limao.
const singulars = (word) => {
  if (word.length <= 3 || !word.endsWith("s")) return [word];
  const forms = [word, word.slice(0, -1), word.slice(0, -2)];
  if (word.endsWith("oes") || word.endsWith("aes"))
    forms.push(word.slice(0, -3) + "ao");
  return forms;
};

// Procura a expressão inteira (em todas as combinações de singular) e devolve o 1.º valor.
const findIn = (table, words) => {
  let phrases = [""];
  for (const word of words) {
    phrases = phrases.flatMap((p) =>
      singulars(word).map((w) => (p ? `${p} ${w}` : w)),
    );
    if (phrases.length > 64) break;
  }
  for (const phrase of phrases) if (table[phrase]) return table[phrase];
  return null;
};

// Chaves já normalizadas (sem acentos, minúsculas, singular).
const INGREDIENTS = {
  // proteína
  ovo: "egg",
  frango: "chicken",
  "peito de frango": "chicken breast",
  peru: "turkey",
  "carne picada": "ground beef",
  vaca: "beef",
  carne: "beef",
  porco: "pork",
  bacon: "bacon",
  fiambre: "ham",
  presunto: "prosciutto",
  chourico: "chorizo",
  salsicha: "sausage",
  atum: "tuna",
  salmao: "salmon",
  bacalhau: "cod",
  pescada: "hake",
  sardinha: "sardines",
  peixe: "fish",
  camarao: "shrimp",
  lula: "squid",
  polvo: "octopus",
  mexilhao: "mussels",
  tofu: "tofu",
  "grao de bico": "chickpeas",
  grao: "chickpeas",
  feijao: "beans",
  "feijao preto": "black beans",
  lentilha: "lentils",
  ervilha: "peas",
  // laticínios
  leite: "milk",
  natas: "heavy cream",
  nata: "heavy cream",
  manteiga: "butter",
  queijo: "cheese",
  "queijo ralado": "grated cheese",
  mozzarella: "mozzarella",
  iogurte: "yogurt",
  requeijao: "ricotta",
  // cereais e massas
  arroz: "rice",
  massa: "pasta",
  esparguete: "spaghetti",
  macarrao: "macaroni",
  pao: "bread",
  farinha: "flour",
  aveia: "oats",
  cuscuz: "couscous",
  quinoa: "quinoa",
  "pao ralado": "breadcrumbs",
  milho: "corn",
  tortilha: "tortillas",
  // legumes
  batata: "potato",
  "batata doce": "sweet potato",
  cebola: "onion",
  alho: "garlic",
  tomate: "tomato",
  cenoura: "carrot",
  alface: "lettuce",
  espinafre: "spinach",
  couve: "cabbage",
  "couve flor": "cauliflower",
  brocolo: "broccoli",
  pimento: "bell pepper",
  pepino: "cucumber",
  curgete: "zucchini",
  courgette: "zucchini",
  beringela: "eggplant",
  cogumelo: "mushrooms",
  abobora: "pumpkin",
  "feijao verde": "green beans",
  "alho frances": "leek",
  aipo: "celery",
  rucula: "arugula",
  abacate: "avocado",
  azeitona: "olives",
  // fruta
  maca: "apple",
  banana: "banana",
  laranja: "orange",
  limao: "lemon",
  lima: "lime",
  morango: "strawberries",
  pera: "pear",
  pessego: "peach",
  ananas: "pineapple",
  manga: "mango",
  uva: "grapes",
  mirtilo: "blueberries",
  framboesa: "raspberries",
  melao: "melon",
  kiwi: "kiwi",
  // despensa
  azeite: "olive oil",
  oleo: "vegetable oil",
  acucar: "sugar",
  sal: "salt",
  mel: "honey",
  vinagre: "vinegar",
  chocolate: "chocolate",
  cacau: "cocoa powder",
  fermento: "baking powder",
  "polpa de tomate": "tomato sauce",
  "molho de tomate": "tomato sauce",
  "caldo de galinha": "chicken broth",
  amendoim: "peanuts",
  noz: "walnuts",
  amendoa: "almonds",
  avela: "hazelnuts",
  caju: "cashews",
  coco: "coconut",
  salsa: "parsley",
  coentro: "cilantro",
  manjericao: "basil",
  oregao: "oregano",
  louro: "bay leaf",
  pimenta: "pepper",
  canela: "cinnamon",
  gengibre: "ginger",
  cominho: "cumin",
};

/**
 * Nome em inglês para o Spoonacular. Tenta o nome completo, depois cada palavra;
 * se não conhecer, devolve o nome normalizado (marcas como "Nutella" passam assim).
 */
export function toEnglishIngredient(name) {
  const normalized = normalizeName(name);
  if (!normalized) return "";

  const words = normalized.split(" ");
  const whole = findIn(INGREDIENTS, words);
  if (whole) return whole;
  // "Arroz agulha" -> arroz, "Leite meio gordo" -> leite
  for (const word of words) {
    const hit = findIn(INGREDIENTS, [word]);
    if (hit) return hit;
  }
  return normalized;
}
// SCRUM-124 — Sentido inverso (inglês -> português), para mostrar ao utilizador os
// ingredientes do Spoonacular. Só traduz o que existe no dicionário de cima, para
// que toEnglishIngredient(nome em português) volte sempre ao mesmo nome inglês.
export const PORTUGUESE_NAMES = {
  // proteína
  egg: "Ovos",
  chicken: "Frango",
  "chicken breast": "Peito de frango",
  turkey: "Peru",
  "ground beef": "Carne picada",
  beef: "Carne de vaca",
  pork: "Porco",
  bacon: "Bacon",
  ham: "Fiambre",
  prosciutto: "Presunto",
  chorizo: "Chouriço",
  sausage: "Salsichas",
  tuna: "Atum",
  salmon: "Salmão",
  cod: "Bacalhau",
  hake: "Pescada",
  sardines: "Sardinhas",
  fish: "Peixe",
  shrimp: "Camarão",
  squid: "Lulas",
  octopus: "Polvo",
  mussels: "Mexilhões",
  tofu: "Tofu",
  chickpeas: "Grão-de-bico",
  beans: "Feijão",
  "black beans": "Feijão preto",
  lentils: "Lentilhas",
  peas: "Ervilhas",
  // laticínios
  milk: "Leite",
  "heavy cream": "Natas",
  butter: "Manteiga",
  cheese: "Queijo",
  "grated cheese": "Queijo ralado",
  mozzarella: "Mozzarella",
  yogurt: "Iogurte",
  ricotta: "Requeijão",
  // cereais e massas
  rice: "Arroz",
  pasta: "Massa",
  spaghetti: "Esparguete",
  macaroni: "Macarrão",
  bread: "Pão",
  flour: "Farinha",
  oats: "Aveia",
  couscous: "Cuscuz",
  quinoa: "Quinoa",
  breadcrumbs: "Pão ralado",
  corn: "Milho",
  tortillas: "Tortilhas",
  // legumes
  potato: "Batatas",
  "sweet potato": "Batata-doce",
  onion: "Cebola",
  garlic: "Alho",
  tomato: "Tomate",
  carrot: "Cenoura",
  lettuce: "Alface",
  spinach: "Espinafres",
  cabbage: "Couve",
  cauliflower: "Couve-flor",
  broccoli: "Brócolos",
  "bell pepper": "Pimento",
  cucumber: "Pepino",
  zucchini: "Curgete",
  eggplant: "Beringela",
  mushrooms: "Cogumelos",
  pumpkin: "Abóbora",
  "green beans": "Feijão verde",
  leek: "Alho-francês",
  celery: "Aipo",
  arugula: "Rúcula",
  avocado: "Abacate",
  olives: "Azeitonas",
  // fruta
  apple: "Maçãs",
  banana: "Bananas",
  orange: "Laranjas",
  lemon: "Limão",
  lime: "Lima",
  strawberries: "Morangos",
  pear: "Peras",
  peach: "Pêssegos",
  pineapple: "Ananás",
  mango: "Manga",
  grapes: "Uvas",
  blueberries: "Mirtilos",
  raspberries: "Framboesas",
  melon: "Melão",
  kiwi: "Kiwi",
  // despensa
  "olive oil": "Azeite",
  "vegetable oil": "Óleo",
  sugar: "Açúcar",
  salt: "Sal",
  honey: "Mel",
  vinegar: "Vinagre",
  chocolate: "Chocolate",
  "cocoa powder": "Cacau",
  "baking powder": "Fermento",
  "tomato sauce": "Polpa de tomate",
  "chicken broth": "Caldo de galinha",
  peanuts: "Amendoim",
  walnuts: "Nozes",
  almonds: "Amêndoas",
  hazelnuts: "Avelãs",
  cashews: "Cajus",
  coconut: "Coco",
  parsley: "Salsa",
  cilantro: "Coentros",
  basil: "Manjericão",
  oregano: "Orégãos",
  "bay leaf": "Louro",
  pepper: "Pimenta",
  cinnamon: "Canela",
  ginger: "Gengibre",
  cumin: "Cominhos",
};

// O Spoonacular tanto escreve "egg" como "eggs": experimenta o singular e o plural.
const englishForms = (name) => {
  const forms = [name, `${name}s`, `${name}es`];
  if (name.endsWith("ies")) forms.push(name.slice(0, -3) + "y");
  if (name.endsWith("es")) forms.push(name.slice(0, -2));
  if (name.endsWith("s")) forms.push(name.slice(0, -1));
  if (name.endsWith("y")) forms.push(name.slice(0, -1) + "ies");
  return forms;
};

const capitalize = (text) =>
  text ? text.charAt(0).toLocaleUpperCase("pt-PT") + text.slice(1) : "";

/**
 * Nome em português de um ingrediente do Spoonacular ("eggs" -> "Ovos").
 * Se não estiver no dicionário fica o nome original, só com maiúscula inicial
 * ("garam masala" -> "Garam masala").
 */
export function toPortugueseIngredient(name) {
  const original = String(name ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = normalizeName(original);
  if (!normalized) return "";

  for (const form of englishForms(normalized)) {
    if (PORTUGUESE_NAMES[form]) return PORTUGUESE_NAMES[form];
  }
  return capitalize(original);
}

// Valores aceites pelo Spoonacular.
const DIETS = {
  vegetarian: "vegetarian",
  vegetariano: "vegetarian",
  vegan: "vegan",
  vegano: "vegan",
  pescatarian: "pescetarian",
  pescetarian: "pescetarian",
  pescetariano: "pescetarian",
};

const INTOLERANCES = {
  amendoim: "peanut",
  peanut: "peanut",
  leite: "dairy",
  lactose: "dairy",
  laticinio: "dairy",
  lacticinio: "dairy",
  dairy: "dairy",
  ovo: "egg",
  egg: "egg",
  gluten: "gluten",
  trigo: "wheat",
  wheat: "wheat",
  cereal: "grain",
  grain: "grain",
  marisco: "shellfish",
  crustaceo: "shellfish",
  camarao: "shellfish",
  molusco: "shellfish",
  shellfish: "shellfish",
  peixe: "seafood",
  seafood: "seafood",
  soja: "soy",
  soy: "soy",
  sesamo: "sesame",
  sesame: "sesame",
  sulfito: "sulfite",
  sulfite: "sulfite",
  "fruto seco": "tree nut",
  noz: "tree nut",
  amendoa: "tree nut",
  avela: "tree nut",
  caju: "tree nut",
  pistacio: "tree nut",
  "tree nut": "tree nut",
};

const lookup = (table, value) => {
  const normalized = normalizeName(value);
  return normalized ? findIn(table, normalized.split(" ")) : null;
};

const unique = (values) => [...new Set(values.filter(Boolean))];

/**
 * Converte o perfil ativo para os parâmetros do Spoonacular.
 * Alergias sem intolerância equivalente passam a ingredientes excluídos (por segurança).
 */
export function toSpoonacularProfile(profile = {}) {
  const diets = unique((profile?.diets ?? []).map((d) => lookup(DIETS, d)));
  const allergies = [];
  const excluded = (profile?.excludedIngredients ?? []).map(
    toEnglishIngredient,
  );

  for (const allergy of profile?.allergies ?? []) {
    const intolerance = lookup(INTOLERANCES, allergy);
    if (intolerance) allergies.push(intolerance);
    else excluded.push(toEnglishIngredient(allergy));
  }

  return {
    diets,
    allergies: unique(allergies),
    excludedIngredients: unique(excluded),
  };
}
