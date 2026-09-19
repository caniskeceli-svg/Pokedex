// ---- Kanto Gym system (Phase 6) ----
// Fully data-driven: GYM_CATALOG is the only place a Gym's leader/type/team/
// levels/badge/rewards/unlock-requirement live, so Johto etc. later is just
// appending entries - no new UI or battle logic. Depends on adventure-state.js
// (getAdventurePlayer/saveAdventurePlayer/getAdventureDex) - load it first.
const GYM_CATALOG = [
  {
    gymId: "pewter", regionId: "kanto", locationId: "pewter-city", order: 1,
    leader: "Brock", type: "rock", requiresBadge: null,
    badge: { id: "boulder", name: "Kaya Rozeti", icon: "🪨" },
    description: "Kayaların ustası Brock ile savaş!",
    team: [
      { speciesId: 74, level: 12 }, // Geodude
      { speciesId: 95, level: 14 }  // Onix
    ],
    rewards: { trainerXp: 250, coins: 500 }
  },
  {
    gymId: "cerulean", regionId: "kanto", locationId: "cerulean-city", order: 2,
    leader: "Misty", type: "water", requiresBadge: "boulder",
    badge: { id: "cascade", name: "Şelale Rozeti", icon: "💧" },
    description: "Su ustası Misty ile savaş!",
    team: [
      { speciesId: 120, level: 18 }, // Staryu
      { speciesId: 121, level: 21 }  // Starmie
    ],
    rewards: { trainerXp: 350, coins: 700 }
  },
  {
    gymId: "vermilion", regionId: "kanto", locationId: "vermilion-city", order: 3,
    leader: "Lt. Surge", type: "electric", requiresBadge: "cascade",
    badge: { id: "thunder", name: "Yıldırım Rozeti", icon: "⚡" },
    description: "Elektrik ustası Lt. Surge ile savaş!",
    team: [
      { speciesId: 100, level: 21 }, // Voltorb
      { speciesId: 25, level: 18 },  // Pikachu
      { speciesId: 26, level: 24 }   // Raichu
    ],
    rewards: { trainerXp: 450, coins: 900 }
  },
  {
    gymId: "celadon", regionId: "kanto", locationId: "celadon-city", order: 4,
    leader: "Erika", type: "grass", requiresBadge: "thunder",
    badge: { id: "rainbow", name: "Gökkuşağı Rozeti", icon: "🌈" },
    description: "Çimen ustası Erika ile savaş!",
    team: [
      { speciesId: 114, level: 24 }, // Tangela
      { speciesId: 71, level: 29 }   // Victreebel
    ],
    rewards: { trainerXp: 550, coins: 1100 }
  },
  {
    gymId: "fuchsia", regionId: "kanto", locationId: "fuchsia-city", order: 5,
    leader: "Koga", type: "poison", requiresBadge: "rainbow",
    badge: { id: "soul", name: "Ruh Rozeti", icon: "💜" },
    description: "Zehir ustası Koga ile savaş!",
    team: [
      { speciesId: 109, level: 33 }, // Koffing
      { speciesId: 89, level: 36 },  // Muk
      { speciesId: 110, level: 39 }  // Weezing
    ],
    rewards: { trainerXp: 650, coins: 1300 }
  },
  {
    gymId: "saffron", regionId: "kanto", locationId: "saffron-city", order: 6,
    leader: "Sabrina", type: "psychic", requiresBadge: "soul",
    badge: { id: "marsh", name: "Bataklık Rozeti", icon: "🔮" },
    description: "Ruh ustası Sabrina ile savaş!",
    team: [
      { speciesId: 64, level: 38 },  // Kadabra
      { speciesId: 122, level: 37 }, // Mr. Mime
      { speciesId: 65, level: 43 }   // Alakazam
    ],
    rewards: { trainerXp: 750, coins: 1500 }
  },
  {
    gymId: "cinnabar", regionId: "kanto", locationId: "cinnabar-island", order: 7,
    leader: "Blaine", type: "fire", requiresBadge: "marsh",
    badge: { id: "volcano", name: "Volkan Rozeti", icon: "🌋" },
    description: "Ateş ustası Blaine ile savaş!",
    team: [
      { speciesId: 58, level: 42 },  // Growlithe
      { speciesId: 78, level: 40 },  // Rapidash
      { speciesId: 59, level: 47 }   // Arcanine
    ],
    rewards: { trainerXp: 850, coins: 1700 }
  },
  {
    gymId: "viridian", regionId: "kanto", locationId: "viridian-city", order: 8,
    leader: "Giovanni", type: "ground", requiresBadge: "volcano",
    badge: { id: "earth", name: "Toprak Rozeti", icon: "🏔️" },
    description: "Gizemli lider Giovanni ile son Kanto savaşı!",
    team: [
      { speciesId: 111, level: 45 }, // Rhyhorn
      { speciesId: 31, level: 47 },  // Nidoqueen
      { speciesId: 112, level: 50 }  // Rhydon
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  },

  // ---- Johto (Phase 10C) ----
  // Same catalog, same functions below (getGymById/isGymUnlocked/
  // awardGymVictory/etc.) - `order` is only compared within a region (see
  // getGymsForRegion), so Johto's own 1-8 coexists with Kanto's without
  // clashing. `requiresBadge` chains through Johto's own badge ids only,
  // completely independent of Kanto's chain (Violet is unlocked purely by
  // requiresBadge: null, not by anything Kanto-related - the Kanto-Champion
  // gate lives one level up, at the Johto REGION itself, via
  // isRegionUnlocked/unlockedRegions - see region-data.js/league-data.js).
  {
    gymId: "johto_violet", regionId: "johto", locationId: "violet-city", order: 1,
    leader: "Falkner", type: "flying", requiresBadge: null,
    badge: { id: "zephyr", name: "Meltem Rozeti", icon: "🌪️" },
    description: "Uçan tip ustası Falkner ile savaş!",
    // Phase 17 rebalance: Johto's original 7/9 assumed a player starting
    // completely fresh, the way the real games do. This app carries the
    // same Pokemon (and their XP) across every region with no reset, and
    // wild/gym battles now grant real Pokemon XP - live data pulled from
    // both real profiles showed players arriving in Johto with an already
    // ~27-33 median party level (some individual Pokemon well past that),
    // making the original numbers a non-fight. Rebalanced the whole Johto
    // Gym chain upward to match that, still escalating 1->8 within Johto.
    team: [
      { speciesId: 16, level: 24 }, // Pidgey
      { speciesId: 17, level: 26 }  // Pidgeotto
    ],
    rewards: { trainerXp: 500, coins: 1000 }
  },
  {
    gymId: "johto_azalea", regionId: "johto", locationId: "azalea-town", order: 2,
    leader: "Bugsy", type: "bug", requiresBadge: "zephyr",
    badge: { id: "hive", name: "Kovan Rozeti", icon: "🐝" },
    description: "Böcek tip ustası Bugsy ile savaş!",
    team: [
      { speciesId: 11, level: 28 },  // Metapod
      { speciesId: 14, level: 28 },  // Kakuna
      { speciesId: 123, level: 30 }  // Scyther
    ],
    rewards: { trainerXp: 600, coins: 1200 }
  },
  {
    gymId: "johto_goldenrod", regionId: "johto", locationId: "goldenrod-city", order: 3,
    leader: "Whitney", type: "normal", requiresBadge: "hive",
    badge: { id: "plain", name: "Ova Rozeti", icon: "⚪" },
    description: "Normal tip ustası Whitney ile savaş!",
    team: [
      { speciesId: 35, level: 32 },  // Clefairy
      { speciesId: 241, level: 34 }  // Miltank
    ],
    rewards: { trainerXp: 700, coins: 1400 }
  },
  {
    gymId: "johto_ecruteak", regionId: "johto", locationId: "ecruteak-city", order: 4,
    leader: "Morty", type: "ghost", requiresBadge: "plain",
    badge: { id: "fog", name: "Sis Rozeti", icon: "🌫️" },
    description: "Hayalet tip ustası Morty ile savaş!",
    team: [
      { speciesId: 92, level: 35 }, // Gastly
      { speciesId: 93, level: 35 }, // Haunter
      { speciesId: 94, level: 39 }, // Gengar
      { speciesId: 93, level: 37 }  // Haunter
    ],
    rewards: { trainerXp: 850, coins: 1700 }
  },
  {
    gymId: "johto_cianwood", regionId: "johto", locationId: "cianwood-city", order: 5,
    leader: "Chuck", type: "fighting", requiresBadge: "fog",
    badge: { id: "storm", name: "Fırtına Rozeti", icon: "⛈️" },
    description: "Dövüş tip ustası Chuck ile savaş!",
    team: [
      { speciesId: 57, level: 41 }, // Primeape
      { speciesId: 62, level: 43 }  // Poliwrath
    ],
    rewards: { trainerXp: 1000, coins: 2000 }
  },
  {
    gymId: "johto_olivine", regionId: "johto", locationId: "olivine-city", order: 6,
    leader: "Jasmine", type: "steel", requiresBadge: "storm",
    badge: { id: "mineral", name: "Mineral Rozeti", icon: "💎" },
    description: "Çelik tip ustası Jasmine ile savaş!",
    team: [
      { speciesId: 81, level: 45 },  // Magnemite
      { speciesId: 81, level: 45 },  // Magnemite
      { speciesId: 208, level: 48 }  // Steelix
    ],
    rewards: { trainerXp: 1150, coins: 2300 }
  },
  {
    gymId: "johto_mahogany", regionId: "johto", locationId: "mahogany-town", order: 7,
    leader: "Pryce", type: "ice", requiresBadge: "mineral",
    badge: { id: "glacier", name: "Buzul Rozeti", icon: "🧊" },
    description: "Buz tip ustası Pryce ile savaş!",
    team: [
      { speciesId: 86, level: 47 },  // Seel
      { speciesId: 87, level: 49 },  // Dewgong
      { speciesId: 221, level: 51 }  // Piloswine
    ],
    rewards: { trainerXp: 1300, coins: 2600 }
  },
  {
    gymId: "johto_blackthorn", regionId: "johto", locationId: "blackthorn-city", order: 8,
    leader: "Clair", type: "dragon", requiresBadge: "glacier",
    badge: { id: "rising", name: "Yükselen Rozet", icon: "🐉" },
    description: "Ejderha tip ustası Clair ile Johto'nun son savaşı!",
    team: [
      { speciesId: 148, level: 51 }, // Dragonair
      { speciesId: 148, level: 51 }, // Dragonair
      { speciesId: 148, level: 51 }, // Dragonair
      { speciesId: 230, level: 55 }  // Kingdra
    ],
    rewards: { trainerXp: 1500, coins: 3000 }
  },

  // ---- Hoenn (Phase 14) ----
  // Same catalog/functions, same independence pattern as Johto: Hoenn's own
  // 1-8 badge chain via requiresBadge, gated as a REGION by
  // isRegionUnlocked (checked in gym-battle.html's init()) - not by
  // anything Kanto/Johto-specific. Petalburg is intentionally gym #5 even
  // though its city is reachable early in region-data.js's location
  // chain - requiresBadge:"heat" is what actually gates the challenge, the
  // location being visited is a separate, unrelated concept (see
  // region-data.js's own note on this).
  {
    gymId: "hoenn_rustboro", regionId: "hoenn", locationId: "rustboro-city", order: 1,
    leader: "Roxanne", type: "rock", requiresBadge: null,
    badge: { id: "stone", name: "Taş Rozeti", icon: "🪨" },
    description: "Kaya tipi ustası Roxanne ile Hoenn'in ilk savaşı!",
    // Phase 17 rebalance: cascaded upward after Johto's own rebalance (see
    // johto_violet's comment in this file) - Johto's Champion now peaks
    // around level 66, so Hoenn's original 12-46 range would have been an
    // even bigger cliff than the original Johto problem this was meant to
    // fix. Hoenn's own 1->8 escalation is preserved, just shifted.
    team: [
      { speciesId: 74, level: 58 },  // Geodude
      { speciesId: 299, level: 61 }  // Nosepass
    ],
    rewards: { trainerXp: 1350, coins: 2700 }
  },
  {
    gymId: "hoenn_dewford", regionId: "hoenn", locationId: "dewford-town", order: 2,
    leader: "Brawly", type: "fighting", requiresBadge: "stone",
    badge: { id: "knuckle", name: "Yumruk Rozeti", icon: "👊" },
    description: "Dövüş tipi ustası Brawly ile savaş!",
    team: [
      { speciesId: 66, level: 63 },  // Machop
      { speciesId: 296, level: 65 }  // Makuhita
    ],
    rewards: { trainerXp: 1450, coins: 2900 }
  },
  {
    gymId: "hoenn_mauville", regionId: "hoenn", locationId: "mauville-city", order: 3,
    leader: "Wattson", type: "electric", requiresBadge: "knuckle",
    badge: { id: "dynamo", name: "Dinamo Rozeti", icon: "⚡" },
    description: "Elektrik tipi ustası Wattson ile savaş!",
    team: [
      { speciesId: 100, level: 66 }, // Voltorb
      { speciesId: 82, level: 68 },  // Magneton
      { speciesId: 310, level: 70 }  // Manectric
    ],
    rewards: { trainerXp: 1550, coins: 3100 }
  },
  {
    gymId: "hoenn_lavaridge", regionId: "hoenn", locationId: "lavaridge-town", order: 4,
    leader: "Flannery", type: "fire", requiresBadge: "dynamo",
    badge: { id: "heat", name: "Alev Rozeti", icon: "🌋" },
    description: "Ateş tipi ustası Flannery ile savaş!",
    team: [
      { speciesId: 322, level: 70 }, // Numel
      { speciesId: 218, level: 70 }, // Slugma
      { speciesId: 324, level: 73 }  // Torkoal
    ],
    rewards: { trainerXp: 1650, coins: 3300 }
  },
  {
    gymId: "hoenn_petalburg", regionId: "hoenn", locationId: "petalburg-city", order: 5,
    leader: "Norman", type: "normal", requiresBadge: "heat",
    badge: { id: "balance", name: "Denge Rozeti", icon: "⚖️" },
    description: "Eğitmen babası Norman ile Hoenn'in orta sınavı!",
    team: [
      { speciesId: 287, level: 73 }, // Slakoth
      { speciesId: 264, level: 75 }, // Linoone
      { speciesId: 288, level: 77 }  // Vigoroth
    ],
    rewards: { trainerXp: 1750, coins: 3500 }
  },
  {
    gymId: "hoenn_fortree", regionId: "hoenn", locationId: "fortree-city", order: 6,
    leader: "Winona", type: "flying", requiresBadge: "balance",
    badge: { id: "feather", name: "Tüy Rozeti", icon: "🪶" },
    description: "Uçan tip ustası Winona ile savaş!",
    team: [
      { speciesId: 333, level: 75 }, // Swablu
      { speciesId: 357, level: 76 }, // Tropius
      { speciesId: 334, level: 78 }  // Altaria
    ],
    rewards: { trainerXp: 1850, coins: 3700 }
  },
  {
    gymId: "hoenn_mossdeep", regionId: "hoenn", locationId: "mossdeep-city", order: 7,
    leader: "Tate & Liza", type: "psychic", requiresBadge: "feather",
    badge: { id: "mind", name: "Zihin Rozeti", icon: "🔮" },
    description: "İkiz Ruh ustaları Tate & Liza ile savaş!",
    team: [
      { speciesId: 338, level: 81 }, // Solrock
      { speciesId: 337, level: 81 }  // Lunatone
    ],
    rewards: { trainerXp: 1950, coins: 3900 }
  },
  {
    gymId: "hoenn_sootopolis", regionId: "hoenn", locationId: "sootopolis-city", order: 8,
    leader: "Juan", type: "water", requiresBadge: "mind",
    badge: { id: "rain", name: "Yağmur Rozeti", icon: "🌧️" },
    description: "Su tipi ustası Juan ile Hoenn'in son Salon savaşı!",
    team: [
      { speciesId: 370, level: 83 }, // Luvdisc
      { speciesId: 340, level: 84 }, // Whiscash
      { speciesId: 364, level: 84 }, // Sealeo
      { speciesId: 230, level: 86 }  // Kingdra
    ],
    rewards: { trainerXp: 2100, coins: 4200 }
  },

  // ---- Sinnoh (Phase 15) ----
  // Same catalog/functions, same independence pattern as Johto/Hoenn: Sinnoh's
  // own 1-8 badge chain via requiresBadge, gated as a REGION by
  // isRegionUnlocked (checked in gym-battle.html's init()) once Hoenn's
  // Champion is beaten. Real Sinnoh's own Gym order is notoriously
  // non-linear (Hearthome can be challenged earlier than its position here) -
  // this catalog deliberately uses a clean sequential 1->8 instead, per the
  // approved plan.
  {
    gymId: "sinnoh_oreburgh", regionId: "sinnoh", locationId: "oreburgh-city", order: 1,
    leader: "Roark", type: "rock", requiresBadge: null,
    badge: { id: "coal", name: "Kömür Rozeti", icon: "🪨" },
    description: "Kaya tipi ustası Roark ile Sinnoh'un ilk savaşı!",
    // Phase 17 rebalance: cascaded upward alongside Johto/Hoenn's own
    // rebalance (see johto_violet/hoenn_rustboro's comments) - Hoenn's
    // Champion now peaks around level 95, leaving very little headroom
    // before the level-100 cap. Sinnoh and Unova's own 1->8 escalation is
    // necessarily compressed into that remaining room rather than jumping
    // by the same margin every region did earlier - by this point in the
    // game a plateau near the level cap is the honest, sustainable design,
    // not a bug (see the Phase 17 chat report for the full reasoning).
    team: [
      { speciesId: 74, level: 87 },  // Geodude
      { speciesId: 408, level: 88 }  // Cranidos
    ],
    rewards: { trainerXp: 2200, coins: 4400 }
  },
  {
    gymId: "sinnoh_eterna", regionId: "sinnoh", locationId: "eterna-city", order: 2,
    leader: "Gardenia", type: "grass", requiresBadge: "coal",
    badge: { id: "forest", name: "Orman Rozeti", icon: "🌲" },
    description: "Çimen tipi ustası Gardenia ile savaş!",
    team: [
      { speciesId: 406, level: 88 }, // Budew
      { speciesId: 315, level: 89 }, // Roselia
      { speciesId: 421, level: 90 }  // Cherrim
    ],
    rewards: { trainerXp: 2300, coins: 4600 }
  },
  {
    gymId: "sinnoh_veilstone", regionId: "sinnoh", locationId: "veilstone-city", order: 3,
    leader: "Maylene", type: "fighting", requiresBadge: "forest",
    badge: { id: "cobble", name: "Çakıl Rozeti", icon: "🥊" },
    description: "Dövüş tipi ustası Maylene ile savaş!",
    team: [
      { speciesId: 307, level: 90 }, // Meditite
      { speciesId: 67, level: 91 },  // Machoke
      { speciesId: 448, level: 92 }  // Lucario
    ],
    rewards: { trainerXp: 2400, coins: 4800 }
  },
  {
    gymId: "sinnoh_pastoria", regionId: "sinnoh", locationId: "pastoria-city", order: 4,
    leader: "Crasher Wake", type: "water", requiresBadge: "cobble",
    badge: { id: "fen", name: "Bataklık Rozeti", icon: "🌊" },
    description: "Su tipi ustası Crasher Wake ile savaş!",
    team: [
      { speciesId: 130, level: 91 }, // Gyarados
      { speciesId: 195, level: 91 }, // Quagsire
      { speciesId: 419, level: 92 }  // Floatzel
    ],
    rewards: { trainerXp: 2500, coins: 5000 }
  },
  {
    gymId: "sinnoh_hearthome", regionId: "sinnoh", locationId: "hearthome-city", order: 5,
    leader: "Fantina", type: "ghost", requiresBadge: "fen",
    badge: { id: "relic", name: "Kalıntı Rozeti", icon: "👻" },
    description: "Hayalet tipi ustası Fantina ile savaş!",
    team: [
      { speciesId: 355, level: 92 }, // Duskull
      { speciesId: 93, level: 92 },  // Haunter
      { speciesId: 429, level: 93 }  // Mismagius
    ],
    rewards: { trainerXp: 2600, coins: 5200 }
  },
  {
    gymId: "sinnoh_canalave", regionId: "sinnoh", locationId: "canalave-city", order: 6,
    leader: "Byron", type: "steel", requiresBadge: "relic",
    badge: { id: "mine", name: "Maden Rozeti", icon: "⛏️" },
    description: "Çelik tipi ustası Byron ile savaş!",
    team: [
      { speciesId: 82, level: 93 },  // Magneton
      { speciesId: 208, level: 94 }, // Steelix
      { speciesId: 411, level: 94 }  // Bastiodon
    ],
    rewards: { trainerXp: 2700, coins: 5400 }
  },
  {
    gymId: "sinnoh_snowpoint", regionId: "sinnoh", locationId: "snowpoint-city", order: 7,
    leader: "Candice", type: "ice", requiresBadge: "mine",
    badge: { id: "icicle", name: "Buz Sarkıtı Rozeti", icon: "❄️" },
    description: "Buz tipi ustası Candice ile savaş!",
    team: [
      { speciesId: 215, level: 94 }, // Sneasel
      { speciesId: 308, level: 95 }, // Medicham
      { speciesId: 460, level: 95 }  // Abomasnow
    ],
    rewards: { trainerXp: 2800, coins: 5600 }
  },
  {
    gymId: "sinnoh_sunyshore", regionId: "sinnoh", locationId: "sunyshore-city", order: 8,
    leader: "Volkner", type: "electric", requiresBadge: "icicle",
    badge: { id: "beacon", name: "Fener Rozeti", icon: "🔆" },
    description: "Elektrik tipi ustası Volkner ile Sinnoh'un son Salon savaşı!",
    team: [
      { speciesId: 26, level: 95 },  // Raichu
      { speciesId: 405, level: 96 }, // Luxray
      { speciesId: 466, level: 97 }  // Electivire
    ],
    rewards: { trainerXp: 3000, coins: 6000 }
  },

  // ---- Unova (Phase 16) ----
  // Same catalog/functions, same independence pattern as every prior
  // region. Striaton's canonical three leaders (Cilan/Chili/Cress, each
  // tied to which starter the player picked) have no equivalent in this
  // catalog - there is no starter-tracking field anywhere and no branching
  // mechanism in gym-battle.html, and building one would be a new mechanic
  // this phase is explicitly told to avoid. Reuses the existing type:"mixed"
  // pattern every Champion already uses: one fixed gym, one fixed team of
  // all three elemental monkeys, badge named after its real canonical name
  // (Trio Badge) which already implies the three-leader flavor. Opelucid
  // uses Drayden rather than the version-exclusive Iris for the same
  // "no version-selection mechanic" reason.
  {
    gymId: "unova_striaton", regionId: "unova", locationId: "striaton-city", order: 1,
    leader: "Cilan, Chili & Cress", type: "mixed", requiresBadge: null,
    badge: { id: "trio", name: "Üçlü Rozet", icon: "🍃" },
    description: "Striaton'ın üç kardeş lideri Cilan, Chili ve Cress ile Unova'nın ilk savaşı!",
    // Phase 17 rebalance: cascaded upward alongside every earlier region's
    // own rebalance (see johto_violet/hoenn_rustboro/sinnoh_oreburgh's
    // comments in this file). Sinnoh's Champion already peaks at exactly
    // 100 (the level cap), so Unova - the fifth and currently final
    // region - can't keep escalating by the same margin every earlier
    // region did; its own 1->8 progression is compressed into the little
    // headroom left below the cap, which is the honest, sustainable
    // outcome of a level-100 ceiling, not a design mistake.
    team: [
      { speciesId: 511, level: 90 }, // Pansage
      { speciesId: 513, level: 90 }, // Pansear
      { speciesId: 515, level: 91 }  // Panpour
    ],
    rewards: { trainerXp: 3200, coins: 6400 }
  },
  {
    gymId: "unova_nacrene", regionId: "unova", locationId: "nacrene-city", order: 2,
    leader: "Lenora", type: "normal", requiresBadge: "trio",
    badge: { id: "basic", name: "Temel Rozet", icon: "⬜" },
    description: "Normal tipi ustası Lenora ile savaş!",
    team: [
      { speciesId: 507, level: 91 }, // Herdier
      { speciesId: 505, level: 93 }  // Watchog
    ],
    rewards: { trainerXp: 3300, coins: 6600 }
  },
  {
    gymId: "unova_castelia", regionId: "unova", locationId: "castelia-city", order: 3,
    leader: "Burgh", type: "bug", requiresBadge: "basic",
    badge: { id: "insect", name: "Böcek Rozeti", icon: "🐛" },
    description: "Böcek tipi ustası Burgh ile savaş!",
    team: [
      { speciesId: 544, level: 92 }, // Whirlipede
      { speciesId: 557, level: 93 }, // Dwebble
      { speciesId: 542, level: 94 }  // Leavanny
    ],
    rewards: { trainerXp: 3400, coins: 6800 }
  },
  {
    gymId: "unova_nimbasa", regionId: "unova", locationId: "nimbasa-city", order: 4,
    leader: "Elesa", type: "electric", requiresBadge: "insect",
    badge: { id: "bolt", name: "Şimşek Rozeti", icon: "⚡" },
    description: "Elektrik tipi ustası Elesa ile savaş!",
    team: [
      { speciesId: 587, level: 94 }, // Emolga
      { speciesId: 523, level: 95 }, // Zebstrika
      { speciesId: 596, level: 95 }  // Galvantula
    ],
    rewards: { trainerXp: 3500, coins: 7000 }
  },
  {
    gymId: "unova_driftveil", regionId: "unova", locationId: "driftveil-city", order: 5,
    leader: "Clay", type: "ground", requiresBadge: "bolt",
    badge: { id: "quake", name: "Deprem Rozeti", icon: "🌍" },
    description: "Toprak tipi ustası Clay ile savaş!",
    team: [
      { speciesId: 552, level: 95 }, // Krokorok
      { speciesId: 530, level: 96 }  // Excadrill
    ],
    rewards: { trainerXp: 3600, coins: 7200 }
  },
  {
    gymId: "unova_mistralton", regionId: "unova", locationId: "mistralton-city", order: 6,
    leader: "Skyla", type: "flying", requiresBadge: "quake",
    badge: { id: "jet", name: "Jet Rozeti", icon: "✈️" },
    description: "Uçan tipi ustası Skyla ile savaş!",
    team: [
      { speciesId: 528, level: 96 }, // Swoobat
      { speciesId: 561, level: 96 }, // Sigilyph
      { speciesId: 581, level: 97 }  // Swanna
    ],
    rewards: { trainerXp: 3700, coins: 7400 }
  },
  {
    gymId: "unova_icirrus", regionId: "unova", locationId: "icirrus-city", order: 7,
    leader: "Brycen", type: "ice", requiresBadge: "jet",
    badge: { id: "freeze", name: "Buz Rozeti", icon: "❄️" },
    description: "Buz tipi ustası Brycen ile savaş!",
    team: [
      { speciesId: 583, level: 97 }, // Vanillish
      { speciesId: 615, level: 97 }, // Cryogonal
      { speciesId: 614, level: 98 }  // Beartic
    ],
    rewards: { trainerXp: 3800, coins: 7600 }
  },
  {
    gymId: "unova_opelucid", regionId: "unova", locationId: "opelucid-city", order: 8,
    leader: "Drayden", type: "dragon", requiresBadge: "freeze",
    badge: { id: "legend", name: "Efsane Rozeti", icon: "🐉" },
    description: "Ejderha tipi ustası Drayden ile Unova'nın son Salon savaşı!",
    team: [
      { speciesId: 611, level: 97 }, // Fraxure
      { speciesId: 621, level: 98 }, // Druddigon
      { speciesId: 612, level: 99 }  // Haxorus
    ],
    rewards: { trainerXp: 4000, coins: 8000 }
  }
];

function getGymById(gymId) {
  return GYM_CATALOG.find(g => g.gymId === gymId) || null;
}
function getGymsForRegion(regionId) {
  return GYM_CATALOG.filter(g => g.regionId === regionId).sort((a, b) => a.order - b.order);
}

function hasBadge(player, badgeId) {
  return (player.badges || []).includes(badgeId);
}
function isGymUnlocked(gym, player) {
  return !gym.requiresBadge || hasBadge(player, gym.requiresBadge);
}
function isGymDefeated(gym, player) {
  return hasBadge(player, gym.badge.id);
}
// "Challenge" (unlocked, not yet defeated) vs "Defeated" vs "Locked" - the
// three states the Gym card UI needs.
function gymStatus(gym, player) {
  if (isGymDefeated(gym, player)) return "defeated";
  if (isGymUnlocked(gym, player)) return "challenge";
  return "locked";
}

let gymVictoryLocked = {};

// The single place a Gym win is ever recorded. Re-reads the player fresh
// and checks the badge array before writing anything, so:
//  - pressing "Victory" repeatedly (or two calls racing in the same tab)
//    grants the badge/XP/coins exactly once - every call after the first
//    reports alreadyDefeated:true and changes nothing.
//  - a genuine cross-tab/device race (two tabs both writing at once) is
//    bounded by whichever write reaches Firestore last winning, same as
//    every other save in this app (saveAdventurePlayer/saveAdventureDex) -
//    there is no transaction API in use anywhere in this codebase, so this
//    intentionally doesn't introduce one just for Gyms; see Phase 6 report.
function awardGymVictory(gymId) {
  if (gymVictoryLocked[gymId]) return { ok: false, reason: "in-progress" };
  gymVictoryLocked[gymId] = true;
  try {
    const gym = getGymById(gymId);
    if (!gym) return { ok: false, reason: "invalid-gym" };
    const player = getAdventurePlayer();
    if (!player.badges) player.badges = [];
    if (player.badges.includes(gym.badge.id)) {
      return { ok: true, alreadyDefeated: true, gym };
    }
    player.badges.push(gym.badge.id);
    player.xp += gym.rewards.trainerXp;
    player.coins = (player.coins || 0) + gym.rewards.coins;
    // Atomic write, not saveAdventurePlayer: a badge must never be
    // clobbered by another tab/device's stale whole-player save landing
    // after this one.
    pushAdventureCloudAtomic({
      "player.badges": firebase.firestore.FieldValue.arrayUnion(gym.badge.id),
      "player.xp": firebase.firestore.FieldValue.increment(gym.rewards.trainerXp),
      "player.coins": firebase.firestore.FieldValue.increment(gym.rewards.coins)
    });
    return { ok: true, alreadyDefeated: false, gym, trainerXp: gym.rewards.trainerXp, coins: gym.rewards.coins };
  } finally {
    gymVictoryLocked[gymId] = false;
  }
}
