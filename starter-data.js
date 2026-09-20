// ---- Adventure starter Pokemon (Phase 5A) ----
// Data-driven so adding more starter trios later (Johto etc.) is just
// appending to STARTER_CATALOG - no UI/logic changes needed for that.
// Depends on pokedex-data.js (makeInstanceId/POKEMON_XP_PER_LEVEL) and
// battle-engine.js (computeBattleStats) and adventure-state.js
// (getAdventureDex/saveAdventureDex) - load all three before this file.
const STARTER_CATALOG = [
  { speciesId: 1, name: "Bulbasaur" },
  { speciesId: 4, name: "Charmander" },
  { speciesId: 7, name: "Squirtle" }
];
const STARTER_LEVEL = 5;
const STARTER_FRIENDSHIP = 20; // a little higher than a wild catch's default - your very first partner

let starterLocked = false;

function needsStarter() {
  return getAdventureDex().length === 0;
}

// Builds the starter using the exact same owned-instance shape as a wild
// catch (instanceId/level/pxp/friendship/shiny/source/caughtAt/currentHp/
// fainted/favorite/nickname), just with source:"starter". Refuses if the
// Adventure dex is no longer empty by the time this runs (covers both a
// genuine double-click and migrated/pre-existing Adventure Pokemon).
function giveStarter(speciesData) {
  if (!needsStarter()) return { ok: false, reason: "already-has-pokemon" };
  const level = STARTER_LEVEL;
  const mon = {
    instanceId: makeInstanceId(speciesData.id),
    id: speciesData.id,
    name: speciesData.name,
    nickname: null,
    img: speciesData.img,
    types: speciesData.types,
    stats: speciesData.stats,
    power: speciesData.power,
    level,
    pxp: xpForLevel(level),
    friendship: STARTER_FRIENDSHIP,
    shiny: false,
    source: "starter",
    caughtAt: Date.now(),
    favorite: false,
    fainted: false,
    currentHp: computeBattleStats(speciesData.stats, level).maxHp,
    evolutionHistory: [{ id: speciesData.id, name: speciesData.name, level, at: Date.now() }]
  };
  saveAdventureDex([mon]);
  return { ok: true, mon };
}

// Renders the starter picker into `container` if (and only if) the
// Adventure dex is still empty; returns true if it did so, false if there's
// nothing to show (caller should render its normal content instead).
// `onChosen(mon)` fires once a starter has actually been saved.
function renderStarterGate(container, onChosen) {
  if (!needsStarter()) return false;
  container.style.display = "flex";
  container.innerHTML = `
    <div class="starter-gate-box">
      <div class="starter-gate-title">🎒 İlk Pokémon'unu Seç!</div>
      <div class="starter-gate-sub">Bu senin Adventure'daki ilk ortağın olacak.</div>
      <div class="starter-grid">
        ${STARTER_CATALOG.map(s => `
          <div class="starter-card" data-id="${s.speciesId}">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${s.speciesId}.png" alt="${s.name}">
            <div class="starter-name">${s.name}</div>
          </div>`).join("")}
      </div>
    </div>`;
  container.querySelectorAll(".starter-card").forEach(card => {
    card.addEventListener("click", async () => {
      if (starterLocked) return;
      starterLocked = true;
      container.querySelectorAll(".starter-card").forEach(c => c.style.opacity = "0.5");
      try {
        const speciesData = await fetchPokemonSpeciesData(Number(card.dataset.id));
        const result = giveStarter(speciesData);
        if (result.ok) {
          container.style.display = "none";
          container.innerHTML = "";
          onChosen(result.mon);
        } else {
          // Someone/something else already gave a starter (or Adventure
          // Pokemon already existed) between opening this screen and the
          // click - just drop the gate and show the real page.
          container.style.display = "none";
          container.innerHTML = "";
          onChosen(null);
        }
      } catch (e) {
        console.error("Starter selection failed", e);
        container.querySelectorAll(".starter-card").forEach(c => c.style.opacity = "1");
      } finally {
        starterLocked = false;
      }
    });
  });
  return true;
}
