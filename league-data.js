// ---- Kanto Pokémon League (Phase 7) ----
// Fully data-driven, same spirit as gym-data.js: LEAGUE_CATALOG is the only
// place a League's badge requirement/Elite Four order/teams/rewards/region-
// unlock live, so a future Johto league is just appending another entry -
// no new UI or battle logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureProgress/
// pushAdventureCloudAtomic) - load it first.
const LEAGUE_CATALOG = [
  {
    leagueId: "kanto", regionId: "kanto",
    requiresBadges: ["boulder", "cascade", "thunder", "rainbow", "soul", "marsh", "volcano", "earth"],
    eliteFour: [
      {
        id: "lorelei", order: 1, name: "Lorelei", type: "ice",
        description: "Buzun ustası Lorelei, Elit Dörtlü'nün ilk üyesi.",
        team: [
          { speciesId: 124, level: 50 }, // Jynx
          { speciesId: 80, level: 52 },  // Slowbro
          { speciesId: 131, level: 54 }  // Lapras
        ],
        rewards: { trainerXp: 500, coins: 750 }
      },
      {
        id: "bruno", order: 2, name: "Bruno", type: "fighting",
        description: "Dövüş ustası Bruno, kaslarıyla değil taktikleriyle savaşır.",
        team: [
          { speciesId: 95, level: 51 },  // Onix
          { speciesId: 107, level: 53 }, // Hitmonchan
          { speciesId: 68, level: 56 }   // Machamp
        ],
        rewards: { trainerXp: 500, coins: 750 }
      },
      {
        id: "agatha", order: 3, name: "Agatha", type: "ghost",
        description: "Hayalet ustası Agatha, gölgelerden saldırır.",
        team: [
          { speciesId: 93, level: 52 },  // Haunter
          { speciesId: 24, level: 54 },  // Arbok
          { speciesId: 94, level: 56 }   // Gengar
        ],
        rewards: { trainerXp: 500, coins: 750 }
      },
      {
        id: "lance", order: 4, name: "Lance", type: "dragon",
        description: "Ejderha ustası Lance, Elit Dörtlü'nün son üyesi.",
        team: [
          { speciesId: 130, level: 54 }, // Gyarados
          { speciesId: 142, level: 56 }, // Aerodactyl
          { speciesId: 149, level: 58 }  // Dragonite
        ],
        rewards: { trainerXp: 500, coins: 750 }
      }
    ],
    champion: {
      id: "champion", order: 5, name: "Blue (Şampiyon)", type: "mixed",
      description: "Rakibin Blue, Kanto Şampiyonu! Son sınav.",
      team: [
        { speciesId: 18, level: 58 },  // Pidgeot
        { speciesId: 103, level: 58 }, // Exeggutor
        { speciesId: 59, level: 59 },  // Arcanine
        { speciesId: 6, level: 61 }    // Charizard
      ],
      rewards: { trainerXp: 1500, coins: 2500 }
    },
    unlocksRegion: "johto"
  },
  {
    // Phase 10D: Johto League. Unlock requires the region itself (granted by
    // awardChampionVictory("kanto") above) AND all 8 Johto badges - both are
    // just requiresBadges/isRegionUnlocked doing what they already do for
    // Kanto, so no new gating logic was needed, only this catalog entry.
    // unlocksRegion is intentionally omitted: Johto's Champion victory must
    // only mark the region completed, never invent/unlock a region beyond it.
    leagueId: "johto_league", regionId: "johto",
    requiresBadges: ["zephyr", "hive", "plain", "fog", "storm", "mineral", "glacier", "rising"],
    eliteFour: [
      {
        id: "will", order: 1, name: "Will", type: "psychic",
        description: "Psişik ustası Will, Johto Elit Dörtlü'nün ilk üyesi.",
        team: [
          { speciesId: 178, level: 40 }, // Xatu
          { speciesId: 124, level: 41 }, // Jynx
          { speciesId: 103, level: 41 }, // Exeggutor
          { speciesId: 80, level: 41 },  // Slowbro
          { speciesId: 178, level: 42 }  // Xatu
        ],
        rewards: { trainerXp: 550, coins: 800 }
      },
      {
        id: "koga", order: 2, name: "Koga", type: "poison",
        description: "Zehir ninjası Koga, gölgelerden vurur.",
        team: [
          { speciesId: 168, level: 40 }, // Ariados
          { speciesId: 205, level: 43 }, // Forretress
          { speciesId: 89, level: 42 },  // Muk
          { speciesId: 169, level: 44 }  // Crobat
        ],
        rewards: { trainerXp: 550, coins: 800 }
      },
      {
        id: "bruno", order: 3, name: "Bruno", type: "fighting",
        description: "Dövüş ustası Bruno, Johto'da tekrar karşında.",
        team: [
          { speciesId: 237, level: 42 }, // Hitmontop
          { speciesId: 106, level: 42 }, // Hitmonlee
          { speciesId: 107, level: 42 }, // Hitmonchan
          { speciesId: 95, level: 43 },  // Onix
          { speciesId: 68, level: 46 }   // Machamp
        ],
        rewards: { trainerXp: 550, coins: 800 }
      },
      {
        id: "karen", order: 4, name: "Karen", type: "dark",
        description: "Karanlık ustası Karen, Johto Elit Dörtlü'nün son üyesi.",
        team: [
          { speciesId: 197, level: 42 }, // Umbreon
          { speciesId: 45, level: 42 },  // Vileplume
          { speciesId: 94, level: 45 },  // Gengar
          { speciesId: 198, level: 44 }, // Murkrow
          { speciesId: 229, level: 47 }  // Houndoom
        ],
        rewards: { trainerXp: 550, coins: 800 }
      }
    ],
    champion: {
      id: "champion", order: 5, name: "Lance (Şampiyon)", type: "dragon",
      description: "Ejderha ustası Lance, Johto Şampiyonu! Son sınav.",
      team: [
        { speciesId: 130, level: 44 }, // Gyarados
        { speciesId: 149, level: 47 }, // Dragonite
        { speciesId: 149, level: 47 }, // Dragonite
        { speciesId: 142, level: 46 }, // Aerodactyl
        { speciesId: 6, level: 46 },   // Charizard
        { speciesId: 149, level: 50 }  // Dragonite
      ],
      rewards: { trainerXp: 1600, coins: 2700 }
    },
    // Phase 14: Johto Champion victory now also unlocks Hoenn, the exact
    // same mechanism Kanto's own entry already uses for Johto - see
    // awardChampionVictory below. (Players who already beat Johto's
    // Champion before this field existed are handled by the one-time
    // backfillHoennUnlock() in adventure-state.js, since that one-time
    // unlock branch below never re-runs for an already-completed league.)
    unlocksRegion: "hoenn"
  },

  // ---- Hoenn (Phase 14) ----
  {
    leagueId: "hoenn_league", regionId: "hoenn",
    requiresBadges: ["stone", "knuckle", "dynamo", "heat", "balance", "feather", "mind", "rain"],
    eliteFour: [
      {
        id: "sidney", order: 1, name: "Sidney", type: "dark",
        description: "Karanlık ustası Sidney, Hoenn Elit Dörtlü'nün ilk üyesi.",
        team: [
          { speciesId: 262, level: 46 }, // Mightyena
          { speciesId: 332, level: 46 }, // Cacturne
          { speciesId: 359, level: 47 }, // Absol
          { speciesId: 319, level: 48 }  // Sharpedo
        ],
        rewards: { trainerXp: 600, coins: 850 }
      },
      {
        id: "phoebe", order: 2, name: "Phoebe", type: "ghost",
        description: "Hayalet ustası Phoebe, Hoenn Elit Dörtlü'nün ikinci üyesi.",
        team: [
          { speciesId: 356, level: 48 }, // Dusclops
          { speciesId: 354, level: 49 }, // Banette
          { speciesId: 302, level: 49 }, // Sableye
          { speciesId: 356, level: 50 }  // Dusclops
        ],
        rewards: { trainerXp: 600, coins: 850 }
      },
      {
        id: "glacia", order: 3, name: "Glacia", type: "ice",
        description: "Buz ustası Glacia, Hoenn Elit Dörtlü'nün üçüncü üyesi.",
        team: [
          { speciesId: 362, level: 50 }, // Glalie
          { speciesId: 364, level: 50 }, // Sealeo
          { speciesId: 362, level: 52 }, // Glalie
          { speciesId: 365, level: 53 }  // Walrein
        ],
        rewards: { trainerXp: 600, coins: 850 }
      },
      {
        id: "drake", order: 4, name: "Drake", type: "dragon",
        description: "Ejderha ustası Drake, Hoenn Elit Dörtlü'nün son üyesi.",
        team: [
          { speciesId: 372, level: 52 }, // Shelgon
          { speciesId: 334, level: 53 }, // Altaria
          { speciesId: 230, level: 53 }, // Kingdra
          { speciesId: 373, level: 55 }  // Salamence
        ],
        rewards: { trainerXp: 600, coins: 850 }
      }
    ],
    champion: {
      id: "champion", order: 5, name: "Wallace (Şampiyon)", type: "water",
      description: "Su ustası Wallace, Hoenn Şampiyonu! Son sınav.",
      team: [
        { speciesId: 370, level: 54 }, // Luvdisc
        { speciesId: 340, level: 55 }, // Whiscash
        { speciesId: 224, level: 56 }, // Tentacruel
        { speciesId: 350, level: 57 }  // Milotic
      ],
      rewards: { trainerXp: 1800, coins: 3000 }
    },
    // Phase 15: Hoenn Champion victory now also unlocks Sinnoh, the exact
    // same mechanism Kanto/Johto's own entries already use - see
    // awardChampionVictory below. Players who already beat Hoenn's Champion
    // before this field existed are handled by backfillSinnohUnlock()
    // (adventure-state.js), since this one-time unlock branch never re-runs
    // for an already-completed league.
    unlocksRegion: "sinnoh"
  },

  // ---- Sinnoh (Phase 15) ----
  {
    leagueId: "sinnoh_league", regionId: "sinnoh",
    requiresBadges: ["coal", "forest", "cobble", "fen", "relic", "mine", "icicle", "beacon"],
    eliteFour: [
      {
        id: "aaron", order: 1, name: "Aaron", type: "bug",
        description: "Böcek ustası Aaron, Sinnoh Elit Dörtlü'nün ilk üyesi.",
        team: [
          { speciesId: 269, level: 49 }, // Dustox
          { speciesId: 416, level: 51 }, // Vespiquen
          { speciesId: 452, level: 53 }, // Drapion
          { speciesId: 214, level: 55 }  // Heracross
        ],
        rewards: { trainerXp: 700, coins: 950 }
      },
      {
        id: "bertha", order: 2, name: "Bertha", type: "ground",
        description: "Toprak ustası Bertha, Sinnoh Elit Dörtlü'nün ikinci üyesi.",
        team: [
          { speciesId: 195, level: 51 }, // Quagsire
          { speciesId: 76, level: 52 },  // Golem
          { speciesId: 450, level: 54 }, // Hippowdon
          { speciesId: 464, level: 56 }  // Rhyperior
        ],
        rewards: { trainerXp: 700, coins: 950 }
      },
      {
        id: "flint", order: 3, name: "Flint", type: "fire",
        description: "Ateş ustası Flint, Sinnoh Elit Dörtlü'nün üçüncü üyesi.",
        team: [
          { speciesId: 78, level: 51 },  // Rapidash
          { speciesId: 467, level: 53 }, // Magmortar
          { speciesId: 229, level: 55 }, // Houndoom
          { speciesId: 392, level: 56 }  // Infernape
        ],
        rewards: { trainerXp: 700, coins: 950 }
      },
      {
        id: "lucian", order: 4, name: "Lucian", type: "psychic",
        description: "Ruh ustası Lucian, Sinnoh Elit Dörtlü'nün son üyesi.",
        team: [
          { speciesId: 203, level: 53 }, // Girafarig
          { speciesId: 437, level: 55 }, // Bronzong
          { speciesId: 122, level: 55 }, // Mr. Mime
          { speciesId: 65, level: 58 }   // Alakazam
        ],
        rewards: { trainerXp: 700, coins: 950 }
      }
    ],
    champion: {
      id: "champion", order: 5, name: "Cynthia (Şampiyon)", type: "mixed",
      description: "Cynthia, Sinnoh Şampiyonu! Son sınav.",
      team: [
        { speciesId: 442, level: 58 }, // Spiritomb
        { speciesId: 407, level: 60 }, // Roserade
        { speciesId: 468, level: 61 }, // Togekiss
        { speciesId: 448, level: 62 }, // Lucario
        { speciesId: 445, level: 64 }  // Garchomp
      ],
      rewards: { trainerXp: 2000, coins: 3200 }
    },
    // Phase 16: Sinnoh Champion victory now also unlocks Unova, the exact
    // same mechanism every prior region's own entry already uses - see
    // awardChampionVictory below. Players who already beat Sinnoh's
    // Champion before this field existed are handled by
    // backfillUnovaUnlock() (adventure-state.js), since this one-time
    // unlock branch never re-runs for an already-completed league.
    unlocksRegion: "unova"
  },

  // ---- Unova (Phase 16) ----
  {
    leagueId: "unova_league", regionId: "unova",
    requiresBadges: ["trio", "basic", "insect", "bolt", "quake", "jet", "freeze", "legend"],
    eliteFour: [
      {
        id: "shauntal", order: 1, name: "Shauntal", type: "ghost",
        description: "Hayalet ustası Shauntal, Unova Elit Dörtlü'nün ilk üyesi.",
        team: [
          { speciesId: 563, level: 52 }, // Cofagrigus
          { speciesId: 609, level: 54 }, // Chandelure
          { speciesId: 623, level: 55 }, // Golurk
          { speciesId: 593, level: 56 }  // Jellicent
        ],
        rewards: { trainerXp: 850, coins: 1050 }
      },
      {
        id: "grimsley", order: 2, name: "Grimsley", type: "dark",
        description: "Karanlık ustası Grimsley, Unova Elit Dörtlü'nün ikinci üyesi.",
        team: [
          { speciesId: 510, level: 53 }, // Liepard
          { speciesId: 553, level: 55 }, // Krookodile
          { speciesId: 625, level: 56 }, // Bisharp
          { speciesId: 560, level: 57 }  // Scrafty
        ],
        rewards: { trainerXp: 850, coins: 1050 }
      },
      {
        id: "caitlin", order: 3, name: "Caitlin", type: "psychic",
        description: "Ruh ustası Caitlin, Unova Elit Dörtlü'nün üçüncü üyesi.",
        team: [
          { speciesId: 576, level: 54 }, // Gothitelle
          { speciesId: 579, level: 56 }, // Reuniclus
          { speciesId: 561, level: 57 }, // Sigilyph
          { speciesId: 518, level: 58 }  // Musharna
        ],
        rewards: { trainerXp: 850, coins: 1050 }
      },
      {
        id: "marshal", order: 4, name: "Marshal", type: "fighting",
        description: "Dövüş ustası Marshal, Unova Elit Dörtlü'nün son üyesi.",
        team: [
          { speciesId: 534, level: 55 }, // Conkeldurr
          { speciesId: 620, level: 57 }, // Mienshao
          { speciesId: 538, level: 58 }, // Throh
          { speciesId: 560, level: 59 }  // Scrafty
        ],
        rewards: { trainerXp: 850, coins: 1050 }
      }
    ],
    champion: {
      id: "champion", order: 5, name: "Alder (Şampiyon)", type: "mixed",
      description: "Alder, Unova Şampiyonu! Son sınav.",
      team: [
        { speciesId: 626, level: 60 }, // Bouffalant
        { speciesId: 621, level: 62 }, // Druddigon
        { speciesId: 584, level: 63 }, // Vanilluxe
        { speciesId: 637, level: 65 }, // Volcarona
        { speciesId: 612, level: 68 }  // Haxorus
      ],
      rewards: { trainerXp: 2400, coins: 3800 }
    }
    // No unlocksRegion - Unova Champion marks Unova completed via the
    // existing generic mechanism (completedRegions) and intentionally does
    // NOT invent a sixth region unlock, per the approved Phase 16 plan.
  }
];

function getLeagueById(leagueId) {
  return LEAGUE_CATALOG.find(l => l.leagueId === leagueId) || null;
}

// The ordered gauntlet: Elite Four in canonical order, then the Champion
// last. Every piece of sequencing logic (unlock order, attempt stage
// advancement) walks this array instead of special-casing any name.
function getLeagueStages(league) {
  const ef = league.eliteFour.slice().sort((a, b) => a.order - b.order)
    .map(m => ({ stageId: m.id, kind: "elitefour", data: m }));
  return ef.concat([{ stageId: league.champion.id, kind: "champion", data: league.champion }]);
}

function isLeagueUnlocked(league, player) {
  const badges = player.badges || [];
  return league.requiresBadges.every(b => badges.includes(b));
}

function getLeagueProgress(player, leagueId) {
  if (!player.leagueProgress) player.leagueProgress = {};
  if (!player.leagueProgress[leagueId]) {
    player.leagueProgress[leagueId] = { eliteFourWins: [], championDefeated: false, completed: false };
  }
  return player.leagueProgress[leagueId];
}

function isLeagueCompleted(player, leagueId) {
  return !!(player.leagueProgress && player.leagueProgress[leagueId] && player.leagueProgress[leagueId].completed);
}

// "Locked" (badges missing) vs "Challenge" (unlocked, not yet completed) vs
// "Completed" (Champion beaten) - the three states the League card UI needs.
function leagueStatus(league, player) {
  if (isLeagueCompleted(player, league.leagueId)) return "completed";
  if (!isLeagueUnlocked(league, player)) return "locked";
  return "challenge";
}

function isRegionUnlocked(player, regionId) {
  return (player.unlockedRegions || ["kanto"]).includes(regionId);
}

// ---- League attempt (the in-progress gauntlet run) ----
// Lives in Adventure `progress`, not `player`, since it's transient run
// state rather than a permanent unlock - see DEFAULT_LEAGUE_ATTEMPT in
// adventure-state.js for why a reset here can never touch Pokemon HP.
// Phase 10D: `progress.leagueAttempts` is a map keyed by leagueId (was a
// single `progress.leagueAttempt` object through Phase 9, when only one
// league existed) - two leagues can now each have their own in-progress
// gauntlet without overwriting each other. Migration of any pre-existing
// single-object attempt into this map happens once, in adventure-state.js's
// onSnapshot handler, before this file ever sees the data.
function getActiveLeagueAttempt(leagueId) {
  const attempt = (getAdventureProgress().leagueAttempts || {})[leagueId];
  if (attempt && attempt.active && attempt.leagueId === leagueId) return attempt;
  return null;
}

// Called only when no active attempt exists (from the party picker) - always
// starts at the gauntlet's first stage, even if some members were beaten (and
// rewarded) in an earlier, since-lost run; see eliteFourWins for why that's
// still reward-safe.
function beginLeagueAttempt(leagueId, instanceId) {
  const league = getLeagueById(leagueId);
  const stages = getLeagueStages(league);
  const attempt = { leagueId, active: true, stage: stages[0].stageId, instanceId, startedAt: Date.now() };
  const progress = getAdventureProgress();
  progress.leagueAttempts = Object.assign({}, progress.leagueAttempts, { [leagueId]: attempt });
  // Scoped to this league's own slot only (not a whole-progress merge) so
  // this can never race with a location visit or another league's attempt
  // over who last wrote `progress` - see pushAdventureCloudAtomic.
  pushAdventureCloudAtomic({ [`progress.leagueAttempts.${leagueId}`]: attempt });
  return attempt;
}

// Moves the active attempt from `stageId` to the next stage in the gauntlet.
// Only advances if the attempt is still actually sitting on `stageId` - a
// duplicate/re-fired call (double click, a stale request after a refresh)
// that arrives after the attempt already moved on is a safe no-op instead of
// skipping a stage.
function advanceLeagueAttemptFrom(leagueId, stageId) {
  const progress = getAdventureProgress();
  const attempt = (progress.leagueAttempts || {})[leagueId];
  if (!attempt || !attempt.active || attempt.leagueId !== leagueId) return null;
  if (attempt.stage !== stageId) return attempt;
  const league = getLeagueById(leagueId);
  const stages = getLeagueStages(league);
  const idx = stages.findIndex(s => s.stageId === stageId);
  const nextIdx = idx + 1;
  if (nextIdx >= stages.length) return attempt;
  const next = Object.assign({}, attempt, { stage: stages[nextIdx].stageId });
  progress.leagueAttempts = Object.assign({}, progress.leagueAttempts, { [leagueId]: next });
  pushAdventureCloudAtomic({ [`progress.leagueAttempts.${leagueId}`]: next });
  return next;
}

// Phase 15: mid-battle switching lets the active fighter change during a
// gauntlet - if the attempt is ever resumed after a page refresh, it must
// reload whichever Pokemon was actually last active, not just the one the
// run started with. Same guarded shape as advanceLeagueAttemptFrom (a no-op
// if the attempt already ended/moved to another league in the meantime).
function updateLeagueAttemptInstance(leagueId, instanceId) {
  const progress = getAdventureProgress();
  const attempt = (progress.leagueAttempts || {})[leagueId];
  if (!attempt || !attempt.active || attempt.leagueId !== leagueId) return;
  const next = Object.assign({}, attempt, { instanceId });
  progress.leagueAttempts = Object.assign({}, progress.leagueAttempts, { [leagueId]: next });
  pushAdventureCloudAtomic({ [`progress.leagueAttempts.${leagueId}`]: next });
}

// Clears the active attempt back to the default (inactive) shape - used on a
// loss, a give-up, or a Champion victory. Never touches player.xp/coins/
// badges or any Pokemon's currentHp/fainted, so losing and re-entering the
// League can never be used to "free-heal" between attempts. Only ever
// touches this league's own slot in the map - another league's in-progress
// attempt is untouched.
function endLeagueAttempt(leagueId) {
  const progress = getAdventureProgress();
  const attempt = (progress.leagueAttempts || {})[leagueId];
  if (!attempt || attempt.leagueId !== leagueId) return;
  const clearedAttempt = { leagueId: null, active: false, stage: null, instanceId: null, startedAt: null };
  progress.leagueAttempts = Object.assign({}, progress.leagueAttempts, { [leagueId]: clearedAttempt });
  pushAdventureCloudAtomic({ [`progress.leagueAttempts.${leagueId}`]: clearedAttempt });
}

let leagueLockFlags = {};

// The single place an Elite Four member's win is ever recorded. Always
// advances the attempt (so the gauntlet keeps moving even on a repeat
// clear), but only grants Trainer XP/coins the first time this member has
// ever been beaten on this save - re-clearing them in a later run (after an
// earlier loss) advances the gauntlet with zero reward, which is the
// intended, exploit-safe behavior (see endLeagueAttempt).
function awardEliteFourVictory(leagueId, memberId) {
  if (leagueLockFlags[memberId]) return { ok: false, reason: "in-progress" };
  leagueLockFlags[memberId] = true;
  try {
    const league = getLeagueById(leagueId);
    if (!league) return { ok: false, reason: "invalid-league" };
    const member = league.eliteFour.find(m => m.id === memberId);
    if (!member) return { ok: false, reason: "invalid-member" };

    const player = getAdventurePlayer();
    const lp = getLeagueProgress(player, leagueId);
    const alreadyWon = lp.eliteFourWins.includes(memberId);
    let trainerXp = 0, coins = 0;
    if (!alreadyWon) {
      lp.eliteFourWins.push(memberId);
      player.xp += member.rewards.trainerXp;
      player.coins = (player.coins || 0) + member.rewards.coins;
      trainerXp = member.rewards.trainerXp;
      coins = member.rewards.coins;
      // Atomic write, not saveAdventurePlayer: same "must never be
      // clobbered by a stale concurrent save" reasoning as gym badges.
      pushAdventureCloudAtomic({
        [`player.leagueProgress.${leagueId}.eliteFourWins`]: firebase.firestore.FieldValue.arrayUnion(memberId),
        "player.xp": firebase.firestore.FieldValue.increment(member.rewards.trainerXp),
        "player.coins": firebase.firestore.FieldValue.increment(member.rewards.coins)
      });
    }
    const nextAttempt = advanceLeagueAttemptFrom(leagueId, memberId);
    return { ok: true, alreadyWon, member, nextAttempt, trainerXp, coins };
  } finally {
    leagueLockFlags[memberId] = false;
  }
}

// The single place a Champion win is ever recorded: marks the league
// permanently completed, grants Trainer XP/coins/region-unlock exactly once
// (re-checked fresh under the same lock pattern as awardGymVictory /
// awardEliteFourVictory), and always closes out the active attempt.
function awardChampionVictory(leagueId) {
  const lockKey = leagueId + ":champion";
  if (leagueLockFlags[lockKey]) return { ok: false, reason: "in-progress" };
  leagueLockFlags[lockKey] = true;
  try {
    const league = getLeagueById(leagueId);
    if (!league) return { ok: false, reason: "invalid-league" };

    const player = getAdventurePlayer();
    const lp = getLeagueProgress(player, leagueId);
    const alreadyCompleted = lp.completed;
    let trainerXp = 0, coins = 0;
    if (!alreadyCompleted) {
      lp.championDefeated = true;
      lp.completed = true;
      player.xp += league.champion.rewards.trainerXp;
      player.coins = (player.coins || 0) + league.champion.rewards.coins;
      if (!player.completedRegions) player.completedRegions = [];
      if (!player.completedRegions.includes(league.regionId)) player.completedRegions.push(league.regionId);
      if (!player.unlockedRegions) player.unlockedRegions = ["kanto"];
      if (league.unlocksRegion && !player.unlockedRegions.includes(league.unlocksRegion)) {
        player.unlockedRegions.push(league.unlocksRegion);
      }
      trainerXp = league.champion.rewards.trainerXp;
      coins = league.champion.rewards.coins;
      // Atomic write, not saveAdventurePlayer: same "must never be
      // clobbered by a stale concurrent save" reasoning as gym badges.
      const atomicFields = {
        [`player.leagueProgress.${leagueId}.championDefeated`]: true,
        [`player.leagueProgress.${leagueId}.completed`]: true,
        "player.xp": firebase.firestore.FieldValue.increment(league.champion.rewards.trainerXp),
        "player.coins": firebase.firestore.FieldValue.increment(league.champion.rewards.coins),
        "player.completedRegions": firebase.firestore.FieldValue.arrayUnion(league.regionId)
      };
      if (league.unlocksRegion) {
        atomicFields["player.unlockedRegions"] = firebase.firestore.FieldValue.arrayUnion(league.unlocksRegion);
      }
      pushAdventureCloudAtomic(atomicFields);
    }
    endLeagueAttempt(leagueId);
    return { ok: true, alreadyCompleted, league, trainerXp, coins };
  } finally {
    leagueLockFlags[lockKey] = false;
  }
}
