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
