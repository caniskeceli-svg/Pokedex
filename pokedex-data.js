// Shown when the Firestore connection stalls (no response within a
// timeout) or errors out outright - without this, a page's own init() just
// hangs forever on whatever "Yükleniyor..." placeholder it already showed,
// since nothing else ever tells the user something went wrong. Idempotent
// (a second call just replaces the message) and never touches the rest of
// the page, so it's safe to call from any page's cloud-sync error path.
function showConnectionRetryBanner(message) {
  let banner = document.getElementById("connectionRetryBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "connectionRetryBanner";
    banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9998;background:#c0392b;color:#fff;padding:10px 14px;font-family:'Trebuchet MS','Segoe UI',sans-serif;font-size:13px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);";
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <span>⚠️ ${message || "Bağlantı kurulamadı. İnternetini kontrol et."}</span>
    <button id="connectionRetryBtn" style="background:#fff;color:#c0392b;border:none;padding:6px 14px;border-radius:999px;font-weight:bold;cursor:pointer;">🔄 Tekrar Dene</button>`;
  document.getElementById("connectionRetryBtn").addEventListener("click", () => location.reload());
}
function clearConnectionRetryBanner() {
  const banner = document.getElementById("connectionRetryBanner");
  if (banner) banner.remove();
}

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

// ---- Turkish translation (PokeAPI has no Turkish text for species flavor
// text, abilities, or moves) with a persistent cache so we only ever
// translate each English string once, even across visits/devices restarts.
const TRANSLATION_CACHE_KEY = "ayaz_pokedex_translations_v1";
let translationCache = safeParseLS(TRANSLATION_CACHE_KEY, {});

function saveTranslationCache() {
  try { localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(translationCache)); } catch {}
}

async function translateViaMyMemory(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("translate failed");
  const data = await res.json();
  // MyMemory answers HTTP 200 even when the daily quota is used up, with the
  // real failure only visible in this field, so check it before trusting the text.
  if (data.responseStatus && Number(data.responseStatus) !== 200) throw new Error("quota/translate error");
  const translated = data.responseData?.translatedText;
  if (!translated) throw new Error("no translation");
  return translated;
}

async function translateViaGoogleUnofficial(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("translate failed");
  const data = await res.json();
  const translated = data[0].map(chunk => chunk[0]).join('');
  if (!translated) throw new Error("no translation");
  return translated;
}

async function translateToTurkish(text) {
  if (!text) return text;
  if (translationCache[text]) return translationCache[text];
  let translated = null;
  try {
    translated = await translateViaMyMemory(text);
  } catch {
    try { translated = await translateViaGoogleUnofficial(text); } catch { translated = null; }
  }
  if (!translated) return null;
  const clean = translated.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  translationCache[text] = clean;
  saveTranslationCache();
  return clean;
}

// ---- Shared cloud state (Firebase Firestore) ----
// One document holds everything Ayaz's Pokédex needs to share across every
// device/browser: caught Pokémon, trainer XP, bag items, and saved teams.
const MYDEX_KEY = "ayaz_pokedex_v1";
const PLAYER_KEY = "ayaz_trainer_v1";
const INVENTORY_KEY = "ayaz_inventory_v1";
const TEAMS_KEY = "ayaz_teams_v1";

const firebaseConfig = {
  apiKey: "AIzaSyAOC2CO_lS-2C_s4xq_eLH9SVvH1hru5KY",
  authDomain: "ayaz-pokedex.firebaseapp.com",
  projectId: "ayaz-pokedex",
  storageBucket: "ayaz-pokedex.firebasestorage.app",
  messagingSenderId: "881422199985",
  appId: "1:881422199985:web:0683bd269e8eb195cb4690"
};
firebase.initializeApp(firebaseConfig);
const cloudDb = firebase.firestore();
// Reverted: enablePersistence() caused repeated connection-error banners
// in the field (a user got 5 in a row and couldn't even pick a starter
// Pokemon) - worse than the load delay it was meant to fix. Likely an
// IndexedDB persistence layer issue on their device/browser (Safari/iPad
// multi-tab persistence is known to be flaky). Do not re-add without
// testing on an actual affected device first.

function safeParseLS(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null || v === undefined ? fallback : v;
  } catch { return fallback; }
}

const DEFAULT_PLAYER = { xp: 0, discoveredIds: [], discoveredTypes: [], achievements: [] };
const DEFAULT_INVENTORY = { pokeball: 0, berry: 0, "evolution-stone": 0 };

// ---- Adventure RPG foundations (Phase 1) ----
// Each owned Pokémon is becoming an "instance" distinct from its species:
// its own level/XP/friendship/shiny flag, separate from the shared species
// data everyone sees in the Pokédex. Existing entries (added before this
// existed) are upgraded in place the first time they're loaded — additive
// only, so battle.html/teams.html (which still key off plain `id`) keep working.
const POKEMON_XP_PER_LEVEL = 100; // flat cost per level for now; revisit if leveling feels too fast/slow

function pokemonLevelInfo(pxp) {
  const level = Math.min(100, Math.floor(pxp / POKEMON_XP_PER_LEVEL) + 1);
  const xpIntoLevel = pxp - (level - 1) * POKEMON_XP_PER_LEVEL;
  const xpForNextLevel = level >= 100 ? 0 : POKEMON_XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForNextLevel };
}

function makeInstanceId(speciesId) {
  return `inst_${speciesId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function migrateMyDexToInstances(mydex) {
  let changed = false;
  const migrated = mydex.map(p => {
    const needsMigration = !p.instanceId || typeof p.level !== 'number' ||
      typeof p.pxp !== 'number' || typeof p.friendship !== 'number' ||
      typeof p.shiny !== 'boolean' || !p.source;
    if (!needsMigration) return p;
    changed = true;
    return Object.assign({}, p, {
      instanceId: p.instanceId || makeInstanceId(p.id),
      level: typeof p.level === 'number' ? p.level : 1,
      pxp: typeof p.pxp === 'number' ? p.pxp : 0,
      friendship: typeof p.friendship === 'number' ? p.friendship : 0,
      shiny: typeof p.shiny === 'boolean' ? p.shiny : false,
      source: p.source || 'direct'
    });
  });
  return { migrated, changed };
}

// ---- Player profiles ----
// Two people share this app, each with their own catches/XP/teams. The
// device remembers which profile it's playing as; a small chooser appears
// the first time a page loads without one.
const PROFILE_KEY = "ayaz_pokedex_profile_v1";
const PROFILE_INFO = {
  ayaz: { name: "Ayaz", emoji: "👦" },
  baba: { name: "Baba", emoji: "👨" }
};
function getOtherProfile(id) {
  return Object.keys(PROFILE_INFO).find(k => k !== id);
}
let CURRENT_PROFILE = null;
let cloudDocRef = null;

let CLOUD_STATE = { mydex: [], player: DEFAULT_PLAYER, inventory: DEFAULT_INVENTORY, teams: [] };
let cloudReady = false;
let cloudReadyResolvers = [];
let cloudChangeCallbacks = [];
let cloudBootstrapped = false;

function onCloudChange(cb) { cloudChangeCallbacks.push(cb); }
function waitForCloud() {
  if (!cloudBootstrapped) {
    cloudBootstrapped = true;
    bootstrapProfileAndCloud();
  }
  if (cloudReady) return Promise.resolve();
  return new Promise(resolve => cloudReadyResolvers.push(resolve));
}
// Guarded against writing before the real snapshot has ever loaded - see
// adventure-state.js's identical pushAdventureCloud guard for the full
// rationale (a write here before CLOUD_STATE holds real data would merge
// its still-default shape over whatever's actually saved in Firestore).
function pushCloud(partial) {
  if (!cloudReady) { console.error("Cloud verisi henüz yüklenmeden yazma engellendi:", partial); return; }
  cloudDocRef.set(partial, { merge: true }).catch(err => console.error("Firestore yazma hatası:", err));
}

function bootstrapProfileAndCloud() {
  const existing = localStorage.getItem(PROFILE_KEY);
  if (existing && PROFILE_INFO[existing]) {
    startCloudSync(existing);
  } else {
    showProfileChooser();
  }
}

function showProfileChooser() {
  const overlay = document.createElement("div");
  overlay.id = "profileChooserOverlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;";
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:30px 26px;max-width:360px;width:100%;text-align:center;font-family:'Trebuchet MS','Segoe UI',sans-serif;box-shadow:0 12px 0 rgba(0,0,0,0.15);">
      <div style="font-size:22px;font-weight:bold;color:#e3350d;margin-bottom:6px;">Sen kimsin? 🔴</div>
      <div style="font-size:14px;color:#888;margin-bottom:20px;">Bu cihazda kim olarak oynayacaksın?</div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${Object.entries(PROFILE_INFO).map(([id, info]) => `
          <button data-profile="${id}" style="font-size:19px;font-weight:bold;padding:16px;border:none;border-radius:16px;background:#3b6cdb;color:#fff;cursor:pointer;">
            ${info.emoji} ${info.name}
          </button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll("[data-profile]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.profile;
      localStorage.setItem(PROFILE_KEY, id);
      overlay.remove();
      startCloudSync(id);
    });
  });
}

async function startCloudSync(profileId) {
  CURRENT_PROFILE = profileId;
  cloudDocRef = cloudDb.collection("profiles").doc(profileId);

  // A stalled connection (flaky network, Firestore unreachable) otherwise
  // just leaves every page hanging on its own "Yükleniyor..." forever, with
  // nothing telling the user something's wrong - this is the single point
  // that can happen from, so the timeout/error banner only needs wiring
  // here, not on every page.
  const connectionTimeout = setTimeout(() => {
    if (!cloudReady) showConnectionRetryBanner("Bağlantı uzun sürüyor... internetini kontrol et.");
  }, 10000);

  cloudDocRef.onSnapshot(async (snap) => {
    if (!snap.exists) {
      let seed = null;
      if (profileId === "ayaz") {
        // Migrate the original single-profile document (from before the
        // two-player system existed) so Ayaz doesn't lose his progress.
        try {
          const legacy = await cloudDb.collection("pokedex").doc("ayaz").get();
          if (legacy.exists) seed = legacy.data();
        } catch (e) { console.error(e); }
      }
      if (!seed) {
        seed = {
          mydex: safeParseLS(MYDEX_KEY, []),
          player: Object.assign({}, DEFAULT_PLAYER, safeParseLS(PLAYER_KEY, {})),
          inventory: Object.assign({}, DEFAULT_INVENTORY, safeParseLS(INVENTORY_KEY, {})),
          teams: safeParseLS(TEAMS_KEY, [])
        };
      }
      CLOUD_STATE = {
        mydex: seed.mydex || [],
        player: Object.assign({}, DEFAULT_PLAYER, seed.player || {}),
        inventory: Object.assign({}, DEFAULT_INVENTORY, seed.inventory || {}),
        teams: seed.teams || []
      };
      cloudDocRef.set(CLOUD_STATE);
    } else {
      const data = snap.data() || {};
      let mydex = data.mydex || [];
      // Auto-recovery: mypokemon.html lets a player remove Pokemon one at a
      // time, so an empty mydex isn't structurally impossible the way it is
      // in Adventure - but removing every single one down to exactly zero
      // is not a real scenario for a profile that's caught dozens over
      // months, while a stale-write bug producing the same [] is (see the
      // Sep 2026 incident this was added after). Restoring from the last
      // backup on an empty load is the right trade for that likelihood, and
      // it's a silent no-op if the backup is also empty/missing.
      if (mydex.length === 0) {
        try {
          const backupSnap = await cloudDb.collection("profiles").doc(profileId + "_backup").get();
          const backupMydex = backupSnap.exists ? (backupSnap.data() || {}).mydex || [] : [];
          if (backupMydex.length > 0) {
            mydex = backupMydex;
            cloudDocRef.set({ mydex }, { merge: true });
            console.warn("mydex was empty on load - auto-restored", mydex.length, "Pokemon from backup.");
          }
        } catch (e) { console.error("Yedekten geri yükleme hatası:", e); }
      }
      CLOUD_STATE = {
        mydex: mydex,
        player: Object.assign({}, DEFAULT_PLAYER, data.player || {}),
        inventory: Object.assign({}, DEFAULT_INVENTORY, data.inventory || {}),
        teams: data.teams || []
      };
    }
    const { migrated, changed } = migrateMyDexToInstances(CLOUD_STATE.mydex);
    CLOUD_STATE.mydex = migrated;
    if (changed) pushCloud({ mydex: migrated });

    const firstTime = !cloudReady;
    cloudReady = true;
    clearTimeout(connectionTimeout);
    clearConnectionRetryBanner();
    cloudReadyResolvers.forEach(r => r());
    cloudReadyResolvers = [];
    cloudChangeCallbacks.forEach(cb => { try { cb(); } catch (e) { console.error(e); } });
    if (firstTime) {
      personalizeHeader();
      injectProfileBadge();
      injectChallengeBanner();
      injectNotificationButton();
      claimPendingChallengeRewards();
      ensureDailyMyDexBackup(profileId);
    }
  }, (err) => {
    console.error("Firestore bağlantı hatası:", err);
    clearTimeout(connectionTimeout);
    showConnectionRetryBanner("Bağlantı hatası oluştu.");
  });
}

function getMyDexShared() { return CLOUD_STATE.mydex; }
// Refuses to ever collapse a real collection down to empty in one write -
// same guard, same reasoning, as Adventure's saveAdventureDex (added after
// the Sep 2026 incident where a classic profile's whole `mydex` was wiped
// to [] this exact way: a stale tab/page holding an old, already-empty
// CLOUD_STATE.mydex made an unrelated save and clobbered the real 180-
// Pokemon collection with its stale snapshot). Every existing caller only
// ever adds/updates/removes entries in place, none legitimately empties the
// whole array, so this can only ever catch a bug, never block real gameplay.
function saveMyDexShared(list) {
  if (list.length === 0 && CLOUD_STATE.mydex.length > 0) {
    console.error("saveMyDexShared refused: would wipe", CLOUD_STATE.mydex.length, "Pokemon down to 0.");
    return;
  }
  CLOUD_STATE.mydex = list;
  pushCloud({ mydex: list });
  backupMyDexIfChanged();
}

// Mirrors mydex into a separate "<profile>_backup" document whenever the
// Pokemon count actually changes - see adventure-state.js's identical
// backupAdventureDexIfChanged for the full rationale. This is what the
// auto-recovery below restores from if the main document's mydex is ever
// found wiped.
let lastBackedUpMyDexLength = {};
function backupMyDexIfChanged() {
  const mydex = CLOUD_STATE.mydex;
  const key = CURRENT_PROFILE;
  if (!key || mydex.length === 0 || mydex.length === lastBackedUpMyDexLength[key]) return;
  lastBackedUpMyDexLength[key] = mydex.length;
  cloudDb.collection("profiles").doc(key + "_backup")
    .set({ mydex, backedUpAt: firebase.firestore.FieldValue.serverTimestamp() })
    .catch(e => console.error("mydex yedekleme hatası:", e));
}

// The "_backup" doc's top-level mydex only ever holds the LATEST good
// state - it protects against a wipe but not against a bug that corrupts
// mydex into something wrong-but-non-empty, since that bad state would
// just overwrite it too. This keeps one dated snapshot per day inside a
// `history` array on the SAME "_backup" doc (capped at 7 entries), so an
// earlier day's known-good state survives even if today's got corrupted -
// see adventure-state.js's identical ensureDailyAdventureDexBackup.
//
// This was originally a profiles/<id>/daily_backups/<date> subcollection,
// but that hit "Missing or insufficient permissions" in production - this
// project's Firestore security rules only cover direct documents under
// profiles/{id}, not subcollections beneath them, and nobody here can
// change those rules from the app's own code. Folding the history into a
// field on the existing "_backup" doc needs no new document path at all,
// so it works under the same rule that already lets that doc's mydex field
// be written. Runs once per session (on the first successful sync).
const DAILY_BACKUP_RETENTION_DAYS = 7;
async function ensureDailyMyDexBackup(profileId) {
  const mydex = CLOUD_STATE.mydex;
  if (mydex.length === 0) return;
  const dateKey = new Date().toISOString().slice(0, 10);
  const backupRef = cloudDb.collection("profiles").doc(profileId + "_backup");
  try {
    const snap = await backupRef.get();
    const history = (snap.exists && (snap.data() || {}).history) || [];
    if (history.some(h => h.date === dateKey)) return;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - DAILY_BACKUP_RETENTION_DAYS);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    const trimmed = history.filter(h => h.date >= cutoffKey);
    trimmed.push({ date: dateKey, mydex });
    await backupRef.set({ history: trimmed }, { merge: true });
  } catch (e) { console.error("Günlük yedekleme hatası:", e); }
}

function getPlayer() { return CLOUD_STATE.player; }
function savePlayer(p) { CLOUD_STATE.player = p; pushCloud({ player: p }); }

function getInventory() { return CLOUD_STATE.inventory; }
function saveInventory(inv) { CLOUD_STATE.inventory = inv; pushCloud({ inventory: inv }); }

function getTeams() { return CLOUD_STATE.teams; }
function saveTeams(teams) { CLOUD_STATE.teams = teams; pushCloud({ teams: teams }); }

// ---- Fusion breeding: makes up a brand-new creature from two owned Pokémon ----
// (Not real Pokémon biology — a fun made-up mechanic, unlike the egg-group
// logic real breeding would use. Every pair always produces the same fused
// creature, so breeding the same two Pokémon again is consistent.)
function fusionId(idA, idB) {
  const lo = Math.min(idA, idB), hi = Math.max(idA, idB);
  return 900000000 + lo * 100000 + hi;
}

function fuseName(nameA, nameB) {
  const a = nameA.toLowerCase();
  const b = nameB.toLowerCase();
  const cut = Math.max(2, Math.ceil(a.length * 0.5));
  const tail = b.slice(Math.max(1, Math.floor(b.length * 0.4)));
  const raw = a.slice(0, cut) + tail;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Builds a "head-from-A, body-from-B" hybrid instead of a flat double-exposure:
// each sprite is masked with a soft gradient (A fades out past the middle,
// B fades in past the middle) so they knit together at a blended seam.
async function blendSprites(urlA, urlB, size) {
  const loadImg = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  const [imgA, imgB] = await Promise.all([loadImg(urlA), loadImg(urlB)]);

  function drawContained(img) {
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return c;
  }

  function applyVerticalFade(canvas, stops) {
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-in";
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    stops.forEach(([pos, alpha]) => grad.addColorStop(pos, `rgba(0,0,0,${alpha})`));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
    return canvas;
  }

  const topHalf = applyVerticalFade(drawContained(imgA), [[0, 1], [0.44, 1], [0.5, 0], [1, 0]]);
  const bottomHalf = applyVerticalFade(drawContained(imgB), [[0, 0], [0.5, 0], [0.56, 1], [1, 1]]);

  const out = document.createElement("canvas");
  out.width = size; out.height = size;
  const ctx = out.getContext("2d");
  ctx.drawImage(bottomHalf, 0, 0);
  ctx.drawImage(topHalf, 0, 0);
  return out.toDataURL("image/png");
}

// Community fusion generator (pokemon.alexonsager.net) that actually redraws
// a head-from-A/body-from-B creature instead of overlaying two sprites. It
// only has art for the original 151 Kanto Pokémon, so anything outside that
// range (or our own fusion-of-a-fusion ids) falls back to blendSprites.
function realFusionImageUrl(headId, bodyId) {
  return `https://images.alexonsager.net/pokemon/fused/${headId}/${headId}.${bodyId}.png`;
}

function tryLoadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 ? src : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function createFusion(parentA, parentB) {
  const id = fusionId(parentA.id, parentB.id);
  const name = fuseName(parentA.name, parentB.name);

  let img = null;
  if (parentA.id >= 1 && parentA.id <= 151 && parentB.id >= 1 && parentB.id <= 151) {
    img = await tryLoadImage(realFusionImageUrl(parentA.id, parentB.id));
  }
  if (!img) {
    img = await blendSprites(parentA.img, parentB.img, 260);
  }

  const typeSet = [...new Set([parentA.types[0], parentB.types[0]])].slice(0, 2);

  const statKeys = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const stats = {};
  statKeys.forEach(k => {
    stats[k] = Math.round(((parentA.stats?.[k] || 50) + (parentB.stats?.[k] || 50)) / 2);
  });
  const power = Object.values(stats).reduce((s, v) => s + v, 0);

  return { id, name, img, power, types: typeSet, stats, isFusion: true, parents: [parentA.name, parentB.name] };
}

function addFusionToMyDex(fusion) {
  const mydex = getMyDexShared();
  if (mydex.some(p => p.id === fusion.id)) return { added: false, gained: null };
  mydex.push(Object.assign({ favorite: false, nickname: null }, fusion));
  saveMyDexShared(mydex);
  const gained = processCatch(fusion, null);
  return { added: true, gained };
}

// Adds a Pokémon fetched elsewhere (e.g. the full list page) straight to the
// current profile's dex, running the same catch rewards as the main detail
// page (minus the evolution bonus, which needs species data we skip here for speed).
function addPokemonToMyDex(data) {
  const mydex = getMyDexShared();
  if (mydex.some(p => p.id === data.id)) return { added: false, gained: null };

  const statMap = {};
  data.stats.forEach(s => { statMap[s.stat.name] = s.base_stat; });
  const power = data.stats.reduce((s, st) => s + st.base_stat, 0);
  mydex.push({
    id: data.id,
    name: data.name,
    img: data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "",
    power,
    types: data.types.map(t => t.type.name),
    stats: statMap,
    favorite: false,
    nickname: null
  });
  saveMyDexShared(mydex);
  const gained = processCatch(data, null);
  return { added: true, gained };
}

// Swaps the hardcoded "Ayaz" in page headers for whoever is actually playing.
function personalizeHeader() {
  const info = PROFILE_INFO[CURRENT_PROFILE];
  if (!info) return;
  document.querySelectorAll("h1").forEach(h => {
    h.textContent = h.textContent.replace(/Ayaz/g, info.name);
  });
}

// ---- Small "who am I" badge shown on every page, with a way to switch ----
function injectProfileBadge() {
  if (document.getElementById("profileBadge")) return;
  const info = PROFILE_INFO[CURRENT_PROFILE];
  if (!info) return;
  const badge = document.createElement("div");
  badge.id = "profileBadge";
  badge.style.cssText = "position:fixed;top:10px;right:10px;z-index:500;background:#2c3e50;color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;font-family:'Trebuchet MS','Segoe UI',sans-serif;font-weight:bold;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.25);";
  badge.textContent = `${info.emoji} ${info.name} (değiştir)`;
  badge.addEventListener("click", () => {
    if (!confirm(`Profili değiştirmek istiyor musun? (Şu an: ${info.name})`)) return;
    localStorage.removeItem(PROFILE_KEY);
    location.reload();
  });
  document.body.appendChild(badge);
}

// ---- Battle challenges (real-time, between the two profiles) ----
// A challenge snapshots the challenger's team so the fight is fair and
// reproducible even if either team roster changes later.
function sendChallenge(myTeamName, myMembers, hidden, myTeamId) {
  const toProfile = getOtherProfile(CURRENT_PROFILE);
  return cloudDb.collection("challenges").add({
    fromProfile: CURRENT_PROFILE,
    fromName: PROFILE_INFO[CURRENT_PROFILE].name,
    fromTeamName: myTeamName,
    fromTeamId: myTeamId || null,
    fromTeam: myMembers,
    hidden: !!hidden,
    toProfile,
    toName: PROFILE_INFO[toProfile].name,
    status: "pending",
    createdAt: Date.now(),
    fromClaimed: true,
    toClaimed: false
  });
}

function listenIncomingChallenges(callback) {
  return cloudDb.collection("challenges")
    .where("toProfile", "==", CURRENT_PROFILE)
    .where("status", "==", "pending")
    .onSnapshot(snap => {
      callback(snap.docs.map(d => Object.assign({ id: d.id }, d.data())));
    }, err => console.error(err));
}

async function listenMyChallengeHistory(callback) {
  const [asFrom, asTo] = await Promise.all([
    cloudDb.collection("challenges").where("fromProfile", "==", CURRENT_PROFILE).get(),
    cloudDb.collection("challenges").where("toProfile", "==", CURRENT_PROFILE).get()
  ]);
  const all = [...asFrom.docs, ...asTo.docs].map(d => Object.assign({ id: d.id }, d.data()));
  all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  callback(all);
}

function declineChallenge(challengeId) {
  return cloudDb.collection("challenges").doc(challengeId).set({ status: "declined" }, { merge: true });
}

function completeChallenge(challengeId, { toTeamName, toTeamId, rounds, winnerSide }) {
  return cloudDb.collection("challenges").doc(challengeId).set({
    status: "completed",
    toTeamName,
    toTeamId: toTeamId || null,
    rounds,
    winnerSide,
    toClaimed: true
  }, { merge: true });
}

// Wins/losses for one specific saved team, based on completed challenges it took part in.
function computeTeamRecord(teamId, completedChallenges) {
  let wins = 0, losses = 0;
  completedChallenges.forEach(c => {
    const wasFrom = c.fromTeamId === teamId;
    const wasTo = c.toTeamId === teamId;
    if (!wasFrom && !wasTo) return;
    const won = (wasFrom && c.winnerSide === "from") || (wasTo && c.winnerSide === "to");
    if (won) wins++; else losses++;
  });
  return { wins, losses };
}

// Call once per page load (after cloud is ready): grants XP to the
// challenger for any completed battle they haven't been credited for yet.
async function claimPendingChallengeRewards() {
  const snap = await cloudDb.collection("challenges")
    .where("fromProfile", "==", CURRENT_PROFILE)
    .where("status", "==", "completed")
    .where("fromClaimed", "==", false)
    .get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.winnerSide === "from") addXP(30);
    await cloudDb.collection("challenges").doc(doc.id).set({ fromClaimed: true }, { merge: true });
  }
}

// Global "you've been challenged" banner, shown on every page once cloud+profile are ready.
// Which challenge ids we've already fired a browser notification for — kept in
// localStorage (not a page-lifetime variable) so switching pages doesn't
// re-notify for a challenge that's still just sitting there pending.
function getNotifiedChallengeIds() {
  return new Set(safeParseLS(`notified_challenges_${CURRENT_PROFILE}`, []));
}
function saveNotifiedChallengeIds(idSet) {
  try { localStorage.setItem(`notified_challenges_${CURRENT_PROFILE}`, JSON.stringify([...idSet])); } catch {}
}

function injectChallengeBanner() {
  if (document.getElementById("challengeBanner")) return;
  const banner = document.createElement("a");
  banner.id = "challengeBanner";
  banner.href = "battle.html";
  banner.style.cssText = "position:fixed;top:10px;left:10px;z-index:500;background:#c0392b;color:#fff;padding:8px 14px;border-radius:999px;font-size:13px;font-family:'Trebuchet MS','Segoe UI',sans-serif;font-weight:bold;text-decoration:none;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:none;animation:none;";
  document.body.appendChild(banner);

  listenIncomingChallenges(list => {
    if (list.length) {
      banner.textContent = `⚔️ ${list.length} yeni meydan okuma! Görüntüle ➜`;
      banner.style.display = "inline-block";

      const notified = getNotifiedChallengeIds();
      const freshOnes = list.filter(c => !notified.has(c.id));
      if (freshOnes.length && window.Notification && Notification.permission === "granted") {
        const latest = freshOnes[0];
        try {
          new Notification("⚔️ Yeni Meydan Okuma!", {
            body: `${latest.fromName} sana meydan okudu!`,
            icon: "icon-192.png"
          });
        } catch (e) { console.error(e); }
      }
      list.forEach(c => notified.add(c.id));
      saveNotifiedChallengeIds(notified);
    } else {
      banner.style.display = "none";
      saveNotifiedChallengeIds(new Set());
    }
  });
}

// ---- PWA: service worker + notification permission ----
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

function injectNotificationButton() {
  if (!window.Notification || Notification.permission !== "default") return;
  if (document.getElementById("notifyBtn")) return;
  const btn = document.createElement("button");
  btn.id = "notifyBtn";
  btn.textContent = "🔔 Meydan Okuma Bildirimlerini Aç";
  btn.style.cssText = "position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:500;background:#3b6cdb;color:#fff;border:none;padding:10px 16px;border-radius:999px;font-size:13px;font-family:'Trebuchet MS','Segoe UI',sans-serif;font-weight:bold;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,0.3);";
  btn.addEventListener("click", () => {
    Notification.requestPermission().then(() => btn.remove());
  });
  document.body.appendChild(btn);
}

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

// ---- Trainer profile (XP / level / discoveries) ----
const XP_PER_LEVEL = 1000;

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
const ITEM_INFO = {
  pokeball: { name: "Poké Ball", emoji: "⚪" },
  berry: { name: "Berry", emoji: "🍒" },
  "evolution-stone": { name: "Evrim Taşı", emoji: "💎" }
};
function addItems(itemKey, qty) {
  const inv = getInventory();
  inv[itemKey] = (inv[itemKey] || 0) + qty;
  saveInventory(inv);
  return inv;
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

registerServiceWorker();
