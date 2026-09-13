const TYPE_TR = {
  normal: "Normal", fire: "Ateş", water: "Su", electric: "Elektrik",
  grass: "Çimen", ice: "Buz", fighting: "Dövüş", poison: "Zehir",
  ground: "Toprak", flying: "Uçan", psychic: "Ruh", bug: "Böcek",
  rock: "Kaya", ghost: "Hayalet", dragon: "Ejderha", dark: "Karanlık",
  steel: "Çelik", fairy: "Peri"
};
const TYPE_EMOJI = {
  normal: "⚪", fire: "🔥", water: "💧", electric: "⚡",
  grass: "🌿", ice: "❄️", fighting: "🥊", poison: "☠️",
  ground: "⛰️", flying: "🌪️", psychic: "🔮", bug: "🐛",
  rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌙",
  steel: "⚙️", fairy: "✨"
};
const TYPE_COLORS = {
  normal:"#A8A77A", fire:"#EE8130", water:"#6390F0", electric:"#F7D02C",
  grass:"#7AC74C", ice:"#96D9D6", fighting:"#C22E28", poison:"#A33EA1",
  ground:"#E2BF65", flying:"#A98FF3", psychic:"#F95587", bug:"#A6B91A",
  rock:"#B6A136", ghost:"#735797", dragon:"#6F35FC", dark:"#705746",
  steel:"#B7B7CE", fairy:"#D685AD"
};
const STAT_TR = {
  hp: "Can", attack: "Saldırı", defense: "Savunma",
  "special-attack": "Özel Saldırı", "special-defense": "Özel Savunma", speed: "Hız"
};
const MAX_ID = 1010;
const MYDEX_KEY = "ayaz_pokedex_v1";

const LEGENDARY_NAMES = [
  "articuno","zapdos","moltres","mewtwo","raikou","entei","suicune","lugia","ho-oh",
  "regirock","regice","registeel","latias","latios","kyogre","groudon","rayquaza",
  "uxie","mesprit","azelf","dialga","palkia","heatran","regigigas","giratina","cresselia",
  "cobalion","terrakion","virizion","tornadus","thundurus","landorus","reshiram","zekrom","kyurem",
  "xerneas","yveltal","zygarde","type-null","silvally","tapu-koko","tapu-lele","tapu-bulu","tapu-fini",
  "cosmog","cosmoem","solgaleo","lunala","necrozma","zacian","zamazenta","eternatus",
  "kubfu","urshifu","regieleki","regidrago","glastrier","spectrier","calyrex","enamorus",
  "wo-chien","chien-pao","ting-lu","chi-yu","koraidon","miraidon","okidogi","munkidori","fezandipiti","ogerpon"
];
const MYTHICAL_NAMES = [
  "mew","celebi","jirachi","deoxys","phione","manaphy","darkrai","shaymin","arceus",
  "victini","keldeo","meloetta","genesect","diancie","hoopa","volcanion","magearna",
  "marshadow","zeraora","meltan","melmetal","zarude","pecharunt"
];

function getMyDexShared() {
  try { return JSON.parse(localStorage.getItem(MYDEX_KEY)) || []; }
  catch { return []; }
}
function saveMyDexShared(list) {
  try { localStorage.setItem(MYDEX_KEY, JSON.stringify(list)); } catch {}
}

// ---- Trainer profile (XP / level / discoveries) ----
const PLAYER_KEY = "ayaz_trainer_v1";
const XP_PER_LEVEL = 1000;

function getPlayer() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYER_KEY));
    if (p) return Object.assign({ xp: 0, discoveredIds: [], discoveredTypes: [], achievements: [] }, p);
  } catch {}
  return { xp: 0, discoveredIds: [], discoveredTypes: [], achievements: [] };
}
function savePlayer(p) {
  try { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); } catch {}
}
function addXP(amount) {
  const p = getPlayer();
  p.xp += amount;
  savePlayer(p);
  return p;
}
function levelInfo(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL };
}

// ---- Inventory / bag ----
const INVENTORY_KEY = "ayaz_inventory_v1";
const ITEM_INFO = {
  pokeball: { name: "Poké Ball", emoji: "⚪" },
  berry: { name: "Berry", emoji: "🍒" },
  "evolution-stone": { name: "Evrim Taşı", emoji: "💎" }
};
function getInventory() {
  try {
    const inv = JSON.parse(localStorage.getItem(INVENTORY_KEY));
    if (inv) return Object.assign({ pokeball: 0, berry: 0, "evolution-stone": 0 }, inv);
  } catch {}
  return { pokeball: 0, berry: 0, "evolution-stone": 0 };
}
function saveInventory(inv) {
  try { localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv)); } catch {}
}
function addItems(itemKey, qty) {
  const inv = getInventory();
  inv[itemKey] = (inv[itemKey] || 0) + qty;
  saveInventory(inv);
  return inv;
}

// ---- Teams ----
const TEAMS_KEY = "ayaz_teams_v1";
function getTeams() {
  try { return JSON.parse(localStorage.getItem(TEAMS_KEY)) || []; }
  catch { return []; }
}
function saveTeams(teams) {
  try { localStorage.setItem(TEAMS_KEY, JSON.stringify(teams)); } catch {}
}

// ---- Achievements ----
const ACHIEVEMENTS = [
  { id: "catch_1", threshold: 1, title: "İlk Adım", desc: "İlk Pokémon'unu yakaladın!", emoji: "🎉" },
  { id: "catch_10", threshold: 10, title: "Acemi Eğitmen", desc: "10 Pokémon yakaladın!", emoji: "🥉" },
  { id: "catch_20", threshold: 20, title: "Yükselen Yıldız", desc: "20 Pokémon yakaladın!", emoji: "🥈" },
  { id: "catch_50", threshold: 50, title: "Usta Eğitmen", desc: "50 Pokémon yakaladın!", emoji: "🥇" },
  { id: "catch_100", threshold: 100, title: "Pokémon Şampiyonu", desc: "100 Pokémon yakaladın!", emoji: "🏆" },
  { id: "all_types", title: "Gökkuşağı Ustası", desc: "Tüm tipleri keşfettin!", emoji: "🌈" },
  { id: "first_evolution", title: "Evrim Avcısı", desc: "İlk evrimleşmiş Pokémon'unu yakaladın!", emoji: "🔄" },
  { id: "first_legendary", title: "Efsane Avcısı", desc: "İlk efsanevi Pokémon'unu yakaladın!", emoji: "✨" },
  { id: "first_team", title: "Takım Kaptanı", desc: "İlk takımını kurdun!", emoji: "🛡️" }
];
function getAchievementInfo(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

// Central catch-reward handler. Call once when a Pokémon is newly added to the dex.
// speciesData is optional (pokemon-species API payload) used for evolution/legendary bonuses.
function processCatch(pokemonData, speciesData) {
  const player = getPlayer();
  const mydex = getMyDexShared();
  const gained = { xpEvents: [], items: [], achievements: [] };

  player.xp += 10;
  gained.xpEvents.push({ label: "Pokémon yakalandı", xp: 10 });

  if (speciesData && speciesData.evolves_from_species) {
    player.xp += 50;
    gained.xpEvents.push({ label: "Evrim tamamlandı", xp: 50 });
  }

  addItems("pokeball", 1);
  gained.items.push({ key: "pokeball", qty: 1 });
  addItems("berry", 2);
  gained.items.push({ key: "berry", qty: 2 });
  if (speciesData && speciesData.evolves_from_species) {
    addItems("evolution-stone", 1);
    gained.items.push({ key: "evolution-stone", qty: 1 });
  }

  const isLegendary = LEGENDARY_NAMES.includes(pokemonData.name);
  const isMythical = MYTHICAL_NAMES.includes(pokemonData.name);

  const unlockAchievement = (id) => {
    if (!player.achievements.includes(id)) {
      player.achievements.push(id);
      player.xp += 100;
      gained.xpEvents.push({ label: "Başarı: " + (getAchievementInfo(id)?.title || id), xp: 100 });
      gained.achievements.push(getAchievementInfo(id));
    }
  };

  ACHIEVEMENTS.filter(a => a.threshold).forEach(a => {
    if (mydex.length >= a.threshold) unlockAchievement(a.id);
  });
  if ((isLegendary || isMythical) ) unlockAchievement("first_legendary");
  if (speciesData && speciesData.evolves_from_species) unlockAchievement("first_evolution");

  savePlayer(player);
  return gained;
}

// Call when a Pokémon detail is viewed (whether caught or not) to award exploration XP.
function processDiscovery(pokemonData) {
  const player = getPlayer();
  const gained = { xpEvents: [] };

  if (!player.discoveredIds.includes(pokemonData.id)) {
    player.discoveredIds.push(pokemonData.id);
    player.xp += 10;
    gained.xpEvents.push({ label: "Yeni Pokémon keşfedildi", xp: 10 });
  }

  (pokemonData.types || []).forEach(t => {
    const typeName = t.type.name;
    if (!player.discoveredTypes.includes(typeName)) {
      player.discoveredTypes.push(typeName);
      player.xp += 20;
      gained.xpEvents.push({ label: "Yeni tip keşfedildi: " + (TYPE_TR[typeName] || typeName), xp: 20 });
    }
  });

  if (player.discoveredTypes.length >= Object.keys(TYPE_TR).length && !player.achievements.includes("all_types")) {
    player.achievements.push("all_types");
    player.xp += 100;
    gained.xpEvents.push({ label: "Başarı: " + getAchievementInfo("all_types").title, xp: 100 });
  }

  savePlayer(player);
  return gained;
}

// ---- Quiz question pool (curated so the quiz doesn't need many live API calls) ----
const QUIZ_POOL = {
  fire: ["charmander", "vulpix", "growlithe", "torchic", "cyndaquil"],
  water: ["squirtle", "psyduck", "magikarp", "totodile", "oshawott"],
  grass: ["bulbasaur", "oddish", "chikorita", "treecko", "snover"],
  electric: ["pikachu", "magnemite", "voltorb", "elekid", "shinx"],
  ice: ["snorunt", "swinub", "sneasel", "vanillite", "spheal"],
  fighting: ["machop", "hitmonlee", "makuhita", "riolu", "throh"],
  poison: ["ekans", "grimer", "koffing", "zubat", "gulpin"],
  ground: ["diglett", "sandshrew", "phanpy", "trapinch", "cubone"],
  flying: ["pidgey", "hoothoot", "taillow", "starly", "fletchling"],
  psychic: ["abra", "drowzee", "ralts", "espeon", "slowpoke"],
  bug: ["caterpie", "weedle", "wurmple", "combee", "venonat"],
  rock: ["geodude", "onix", "rhyhorn", "nosepass", "roggenrola"],
  ghost: ["gastly", "shuppet", "duskull", "misdreavus", "drifloon"],
  dragon: ["dratini", "bagon", "gible", "axew", "goomy"],
  dark: ["poochyena", "houndour", "sneasel", "murkrow", "purrloin"],
  steel: ["magnemite", "skarmory", "aron", "beldum", "klink"],
  fairy: ["cleffa", "snubbull", "togepi", "ralts", "flabebe"],
  normal: ["rattata", "pidgey", "eevee", "meowth", "zigzagoon"]
};
