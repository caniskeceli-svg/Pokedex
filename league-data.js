// ---- Kanto Pokémon League (Phase 7) ----
// Fully data-driven, same spirit as gym-data.js: LEAGUE_CATALOG is the only
// place a League's badge requirement/Elite Four order/teams/rewards/region-
// unlock live, so a future Johto league is just appending another entry -
// no new UI or battle logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureProgress/
// saveAdventureProgress) - load it first.
const LEAGUE_CATALOG = [
  {
    leagueId: "kanto", regionId: "kanto",
    requiresBadges: ["boulder", "cascade", "thunder", "rainbow", "soul", "marsh", "volcano", "earth"],
    eliteFour: [
      {
        id: "lorelei", order: 1, name: "Lorelei", type: "ice",
        description: "Buzun ustası Lorelei, Elite Four'un ilk üyesi.",
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
        description: "Ejderha ustası Lance, Elite Four'un son üyesi.",
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
      description: "Rakibin Blue, Kanto Champion'ı! Son sınav.",
      team: [
        { speciesId: 18, level: 58 },  // Pidgeot
        { speciesId: 103, level: 58 }, // Exeggutor
        { speciesId: 59, level: 59 },  // Arcanine
        { speciesId: 6, level: 61 }    // Charizard
      ],
      rewards: { trainerXp: 1500, coins: 2500 }
    },
    unlocksRegion: "johto"
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
function getActiveLeagueAttempt(leagueId) {
  const attempt = getAdventureProgress().leagueAttempt;
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
  saveAdventureProgress(Object.assign({}, progress, { leagueAttempt: attempt }));
  return attempt;
}

// Moves the active attempt from `stageId` to the next stage in the gauntlet.
// Only advances if the attempt is still actually sitting on `stageId` - a
// duplicate/re-fired call (double click, a stale request after a refresh)
// that arrives after the attempt already moved on is a safe no-op instead of
// skipping a stage.
function advanceLeagueAttemptFrom(leagueId, stageId) {
  const progress = getAdventureProgress();
  const attempt = progress.leagueAttempt;
  if (!attempt || !attempt.active || attempt.leagueId !== leagueId) return null;
  if (attempt.stage !== stageId) return attempt;
  const league = getLeagueById(leagueId);
  const stages = getLeagueStages(league);
  const idx = stages.findIndex(s => s.stageId === stageId);
  const nextIdx = idx + 1;
  if (nextIdx >= stages.length) return attempt;
  const next = Object.assign({}, attempt, { stage: stages[nextIdx].stageId });
  saveAdventureProgress(Object.assign({}, progress, { leagueAttempt: next }));
  return next;
}

// Clears the active attempt back to the default (inactive) shape - used on a
// loss, a give-up, or a Champion victory. Never touches player.xp/coins/
// badges or any Pokemon's currentHp/fainted, so losing and re-entering the
// League can never be used to "free-heal" between attempts.
function endLeagueAttempt(leagueId) {
  const progress = getAdventureProgress();
  if (!progress.leagueAttempt || progress.leagueAttempt.leagueId !== leagueId) return;
  saveAdventureProgress(Object.assign({}, progress, {
    leagueAttempt: { leagueId: null, active: false, stage: null, instanceId: null, startedAt: null }
  }));
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
      saveAdventurePlayer(player);
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
      saveAdventurePlayer(player);
    }
    endLeagueAttempt(leagueId);
    return { ok: true, alreadyCompleted, league, trainerXp, coins };
  } finally {
    leagueLockFlags[lockKey] = false;
  }
}
