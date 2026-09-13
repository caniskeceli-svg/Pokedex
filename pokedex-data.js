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

// ---- Type effectiveness chart (attacker -> {defender: multiplier}); anything not listed is 1x ----
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};
function typeMultiplier(attackType, defenderTypes) {
  return (defenderTypes || []).reduce((mult, dt) => mult * (TYPE_CHART[attackType]?.[dt] ?? 1), 1);
}
function bestMultiplier(attackerTypes, defenderTypes) {
  return Math.max(...(attackerTypes || ["normal"]).map(at => typeMultiplier(at, defenderTypes)));
}

// Aggregate stats + type analysis for a set of mydex-style pokemon objects.
function computeTeamDetails(members) {
  const totalPower = members.reduce((s, m) => s + (m.power || 0), 0);
  const avgPower = members.length ? Math.round(totalPower / members.length) : 0;
  const coverage = [...new Set(members.flatMap(m => m.types || []))];

  const statKeys = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const hasStats = members.some(m => m.stats);
  const statTotals = {};
  statKeys.forEach(k => {
    statTotals[k] = members.reduce((s, m) => s + (m.stats?.[k] || 0), 0);
  });

  const weaknessCounts = {};
  const strengthCounts = {};
  Object.keys(TYPE_TR).forEach(t => {
    weaknessCounts[t] = members.filter(m => typeMultiplier(t, m.types) > 1).length;
    strengthCounts[t] = members.filter(m => bestMultiplier(m.types, [t]) > 1).length;
  });
  const weaknesses = Object.entries(weaknessCounts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  const strengths = Object.entries(strengthCounts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);

  return { members, totalPower, avgPower, coverage, hasStats, statTotals, weaknesses, strengths };
}

// Fills in missing `stats` for Pokémon caught before stat-tracking existed.
// Safe to call every time a page loads: it's a no-op once everything has stats.
async function backfillMissingStats() {
  const mydex = getMyDexShared();
  const missing = mydex.filter(p => !p.stats);
  if (!missing.length) return mydex;

  await Promise.all(missing.map(async (p) => {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
      const data = await res.json();
      const statMap = {};
      data.stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });
      p.stats = statMap;
    } catch {}
  }));

  saveMyDexShared(mydex);
  return mydex;
}

// ---- Shared team-detail HTML rendering (used by teams.html and battle.html) ----
const STAT_TR_SHORT = {
  hp: "Can", attack: "Saldırı", defense: "Savunma",
  "special-attack": "Öz.Saldırı", "special-defense": "Öz.Savunma", speed: "Hız"
};
function typeChipHtml(t, count) {
  return `<span class="type-chip" style="background:${TYPE_COLORS[t]}">${TYPE_TR[t] || t}${count ? `<span class="cnt">×${count}</span>` : ''}</span>`;
}
function renderTeamDetailHtml(memberObjs) {
  const d = computeTeamDetails(memberObjs);

  let statHtml = '';
  if (d.hasStats) {
    const maxStat = Math.max(1, ...Object.values(d.statTotals));
    statHtml = `<div class="detail-label">📊 Toplam İstatistikler</div><div class="team-statbars">` +
      Object.keys(STAT_TR_SHORT).map(k => {
        const val = d.statTotals[k];
        const pct = Math.min(100, (val / maxStat) * 100);
        return `<div class="team-statbar-row">
          <div class="team-statbar-label">${STAT_TR_SHORT[k]}</div>
          <div class="team-statbar-track"><div class="team-statbar-fill" style="width:${pct}%"></div></div>
          <div class="team-statbar-val">${val}</div>
        </div>`;
      }).join('') + `</div>`;
  } else if (memberObjs.length) {
    statHtml = `<div class="no-stats-note">Bazı Pokémon'lar için detaylı istatistik henüz yüklenmedi.</div>`;
  }

  return `
    <div class="team-members">
      ${memberObjs.map(m => `
        <div class="team-member">
          <img src="${m.img}" alt="${m.name}">
          <span>${m.nickname || m.name}</span>
        </div>`).join('') || '<span style="color:#999;font-size:13px;">Henüz üye yok</span>'}
    </div>
    <div class="team-stats">
      <div><b>${memberObjs.length}/6</b>Üye</div>
      <div><b>${d.totalPower}</b>Toplam Güç</div>
      <div><b>${d.avgPower}</b>Ortalama Güç</div>
    </div>
    ${statHtml}
    <div class="detail-label">🧬 Takımdaki Tipler</div>
    <div class="team-coverage">${d.coverage.map(t => typeChipHtml(t)).join('') || '<span style="color:#999;font-size:12px;">Tip yok</span>'}</div>
    <div class="detail-label">😣 Takımın Zayıf Olduğu Tipler</div>
    <div class="team-coverage">${d.weaknesses.length ? d.weaknesses.map(([t, c]) => typeChipHtml(t, c)).join('') : '<span style="color:#999;font-size:12px;">Belirgin bir zayıflık yok 💪</span>'}</div>
    <div class="detail-label">💥 Takımın Güçlü Olduğu Tipler</div>
    <div class="team-coverage">${d.strengths.length ? d.strengths.map(([t, c]) => typeChipHtml(t, c)).join('') : '<span style="color:#999;font-size:12px;">Bilgi yok</span>'}</div>`;
}

// ---- Temporary (unsaved) battle opponent team, kept only for this browser tab ----
// Unlike Ayaz's saved teams (which reference his caught Pokémon by id), the guest
// team can be built from ANY Pokémon, so it stores full Pokémon objects directly.
const TEMP_TEAM_KEY = "ayaz_temp_team_v1";
function getTempTeam() {
  try {
    const t = JSON.parse(sessionStorage.getItem(TEMP_TEAM_KEY));
    if (t && Array.isArray(t.members)) return t;
  } catch {}
  return { name: "Rakip Takım", members: [] };
}
function saveTempTeam(team) {
  try { sessionStorage.setItem(TEMP_TEAM_KEY, JSON.stringify(team)); } catch {}
}
async function fetchPokemonAsTeamMember(query) {
  const key = String(query).toLowerCase().trim();
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
  if (!res.ok) throw new Error('not found');
  const data = await res.json();
  const statMap = {};
  data.stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });
  return {
    id: data.id,
    name: data.name,
    img: data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '',
    power: data.stats.reduce((s, st) => s + st.base_stat, 0),
    types: data.types.map(t => t.type.name),
    stats: statMap
  };
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
