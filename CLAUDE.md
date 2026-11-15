<!-- claude-workspace-kit:start -->
# Can İskeçeli – Genel Çalışma Kuralları (tüm projeler)

Bu bölüm her projede, her oturumda geçerlidir. Projeye özel kurallar bu dosyanın altında veya projenin kendi README'sindedir; çelişkide projeye özel kural kazanır, ama bu bölümdeki GÜVENLİK kuralları her zaman geçerlidir.

## Kiminle çalışıyorsun
- Kullanıcı: Can. Ona **"Master"** diye hitap et. Türkçe konuş.
- Endüstri mühendisi, IT & Planlama Müdürü. SAP, MRP/APS, tedarik zinciri, LSMW, Python/PowerShell okur. Temel şeyleri açıklama, ama komutu neden çalıştırdığını tek cümleyle söyle.
- Tek kişilik ekip, yazılımcısı yok. Sen onun mühendisisin: planla, uygula, kendini denetle. Can'ı "postacı" yapma: başka bir yere sorması gereken bir şeyi kendin çöz ya da tek net soru sor.

## İletişim
- Doğrudan ve şüpheci ol. Fikir zayıfsa söyle ve nedenini açıkla. Yağcılık, gereksiz özür, "harika soru" yok.
- Emin değilsen "Emin değilim" de ve nasıl doğrulayacağını söyle. Uydurma.
- Kısa yaz. Önce sonuç, sonra gerekiyorsa detay. Raporlarda: ne yapıldı, rakamlar, risk/uyarı, tek bir sonraki adım.
- Can'ın kendisinin çalıştıracağı her komutu **tam, kesilmemiş, tek blokta, kopyalanabilir** ver. Uzun yollar/argümanlar asla kırpılmasın.
- Sistem prosedürlerinde (kurulum, taşıma, deploy) adım adım git: bir adım, sonuç, sonraki adım.
- Mizah olur, ama işin önüne geçmesin.

## Çalışma yöntemi (her iş için)
1. **Anla:** Hedef belirsizse tek soru sor. Netse başla.
2. **Önce salt okunur:** Envanter, sayım, analiz. Hiçbir şeyi değiştirme.
3. **Plan + kuru çalıştırma:** Değişiklik yapacak her script `--kuru` (dry-run) moduna sahip olsun. Kuru çıktı: kaç dosya/kayıt, nereye, 10 örnek, risk satırları.
4. **Denetçi:** Toplu, kalıcı ya da geri dönüşü zor her işlemden ÖNCE `denetci` alt ajanına kuru çıktıyı ve planı gönder. DUR derse düzelt, tekrar gönder. Can'a yalnızca denetçinin onayladığı planı getir.
5. **Onay:** Can'a tek özet + tek soru: "Şu olacak, geri alınabilir, uygulayayım mı?"
6. **Uygula + doğrula:** İşlem sonrası önce/sonra sayı ve toplam boyut karşılaştırması. Tutmuyorsa DUR ve raporla.
7. **Belgele:** README'yi güncelle. Ne değiştiğini ve nasıl geri alınacağını yaz.

## Veri güvenliği (ihlal edilemez)
- **Silme yok.** Kullanıcı verisini silme; bir karantina klasörüne (ör. `.karantina/` veya `_SILINECEK/`) TAŞI. Kalıcı silmeyi Can kendisi yapar. (Ayrıca bir hook silme komutlarını fiziksel olarak engelliyor; engellenirsen etrafından dolaşma, taşıma yöntemine geç.)
- **Üzerine yazma yok.** Çakışmada ada `_1` gibi ek koy.
- **Her toplu işlem loglanır** (eski yol, yeni yol, boyut, sebep) ve bir `--geri-al` modu olur.
- Değiştirmeden önce kritik dosyaların (config, veritabanı) yedeğini al.
- Taşıma işlemlerinde aynı disk içinde yeniden adlandırmayı tercih et; diskler arasıysa kopyala → doğrula → sonra kaynak karantinaya.

## Git kuralları
- `main`'e doğrudan commit, push ve merge serbest. Branch açmak ya da PR açmak zorunlu değil — proje özel bir akış istemediği sürece.
- **Kesinlikle yasak:** `git push --force` (ve `--force-with-lease`), geçmişi yeniden yazıp pushlanmış commit'leri yok eden işlemler (force-push'lu `rebase`, pushlanmış commit'i `reset --hard` ile silmek), branch silme (yerel `-D` ya da uzak).
- Push'tan önce proje testleri/lint varsa çalıştır. Kırmızıysa pushlama, Can'a söyle ve sebebini açıkla.
- Şifre, token, API anahtarı, `.env` gibi gizli bilgiler asla commit'lenmesin — commit'ten önce `git diff`/`git status` ile kontrol et.

## Şifreler ve gizli bilgiler
- Can'dan şifre, anahtar, token **isteme**. Şifre gereken her adım için script `getpass` / gizli giriş ile sorsun; Can komutu **ayrı bir pencerede** kendisi çalıştırsın.
- Şifreleri hiçbir dosyaya, loga, komut satırı argümanına, ortam değişkeni dosyasına yazma. Sohbete düşen bir şifreyi tekrar etme ve değiştirilmesini öner.
- Şifreli verinin geçici çözülmüş kopyaları işlem bitince silinsin ve silindiği doğrulansın (karantina kuralının istisnası budur: kendi ürettiğin geçici dosyalar).
- Kişisel veride (mesaj metinleri, rehber, sağlık, finans) "en az veri" ilkesi: işin gerektirdiğinden fazlasını çıkarma, raporlarda gösterme.

## Doğrulama kültürü
- Sayılar tutmuyorsa "muhtemelen"le geçiştirme: farkın kaynağını bul, kanıtla, sonra devam et.
- Raporu yanıltıcı gösterme (ör. bir grubun yalnızca ilk örneğini "tamamı" gibi gösterme). Dağılım ver.
- Kendi yazdığın kodu gerçek veriyle çalıştırmadıysan "gerçek veriyle denenmedi" diye açıkça söyle.
- Bir araç sessizce boş/0 döndürüyorsa önce izin, yol, kodlama ve filtreyi şüphelen.

## Ne zaman durup sorarsın
- Geri dönüşü olmayan her şeyden önce (toplu taşıma/yeniden adlandırma, sistem ayarı, servis, production deploy, geçmişi etkileyen git işlemi).
- Denetçi DUR dediğinde ve düzeltemediğinde.
- Gerçek veri beklenenden ciddi farklı çıktığında (ör. beklenen 70 bin, çıkan 100 bin).
- Bunların dışında soru sorma, işi yap.
<!-- claude-workspace-kit:end -->


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, no-build Pokédex + "Pokémon Adventure RPG" web app for two family profiles (Ayaz and Baba). Plain HTML/CSS/JS, no bundler, no package manager, no framework — every page is a standalone `.html` file that pulls in a handful of shared `.js` files via plain `<script src>` tags. Data (real Pokémon species/moves/stats) comes from PokeAPI at runtime; all persistent state (collections, Adventure progress, battles) lives in Firebase/Firestore.

UI text is Turkish throughout (comments and code are English).

## Running / testing

There is no build step, no bundler, no package.json, and no test framework. To work on this locally:

- Serve the directory with any static file server (e.g. `python3 -m http.server`) and open the relevant `.html` file — `file://` won't work because of the service worker and fetch calls.
- There is no CI and no automated test suite. The established verification workflow for every change (used throughout this project's history) is:
  1. **Syntax check JS files**: `node -c some-file.js`
  2. **Syntax check inline `<script>` blocks in an HTML file**: extract every `<script>...</script>` body and run it through `new Function(...)`, e.g.:
     ```js
     const fs = require('fs');
     const html = fs.readFileSync('wild-battle.html', 'utf8');
     const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
     new Function(scripts.join('\n;\n')); // throws on a syntax error
     ```
  3. **Behavioral verification**: small standalone Node snippets that `eval()` or re-declare the specific pure functions under test (most game-logic functions are pure and side-effect-free — see Architecture below) and assert on their output. For anything that touches Firestore or full page flow, a mock-Firestore harness (`window.__store`, `__makeDocRef`, atomic `arrayUnion`/`increment` support) injected into a copy of the real page has been used with Playwright for end-to-end smoke tests.
- No linter is configured.

## Git workflow

Development happens on a feature branch, then gets fast-forward-merged into `main` and pushed. There's no PR/review process in this repo's own history — changes land directly.

## Architecture

### Two parallel systems sharing one Firestore project

1. **Classic Pokédex** (`index.html`, `mypokemon.html`, `teams.html`, `alldex.html`, `card.html`, `breed.html`, `quiz.html`, `battle.html`) — the original collection/trading-card/breeding/quiz app. Profile documents live at `profiles/{ayaz|baba}` in Firestore.
2. **Adventure RPG** (`adventure.html`, `adventure-hq.html`, `wild-battle.html`, `gym-battle.html`, `league-battle.html`, `pokemart.html`, `victory-selfie.html`) — a separate region-crawling/catch/battle/evolve game layered on top. Its documents live at `profiles/adventure_{ayaz|baba}` — **completely isolated** from the classic profile documents; the two systems never share Pokémon instances or inventory. `adventure-state.js` is the Adventure equivalent of `pokedex-data.js`'s cloud-sync plumbing (`startAdventureCloudSync`/`getAdventureDex`/`saveAdventureDex`/`pushAdventureCloudAtomic`, etc.).

Both systems are selected via `CURRENT_PROFILE` (`pokedex-data.js`, `PROFILE_INFO = { ayaz, baba }`) and talk to `cloudDb` (Firebase Firestore, compat SDK, initialized in `pokedex-data.js`).

### No module system — script load order is the dependency graph

Every page manually lists its `<script src="...">` includes in dependency order; there is no `import`/`export`, everything is global. A typical Adventure battle page loads, in this exact order:

```
firebase-app-compat.js, firebase-firestore-compat.js   (CDN)
pokedex-data.js      -- Firebase init, PROFILE_INFO, TYPE_* tables, XP/level math, PokeAPI fetch+translate helpers
adventure-state.js   -- Adventure's own Firestore doc sync (parallel to pokedex-data.js's classic sync)
region-data.js        -- REGIONS / LOCATIONS / encounter tables
battle-engine.js      -- shared type-chart / damage math
move-data.js          -- move catalog + per-species learnsets + level-up learning
item-data.js          -- Adventure item catalog + heal/revive/rare-candy effects
gym-data.js / league-data.js   -- gym and league catalogs + victory/unlock logic
quest-data.js / adventure-achievement-data.js / adventure-events.js
```
When adding a new file or function, make sure it's declared before anything that calls it — there's no lazy resolution.

### Data-driven catalog pattern (the core extensibility mechanism)

Nearly every piece of game content is a flat array/object catalog with pure helper functions over it, never hardcoded branching per-species/per-region logic:

- `REGIONS` / `LOCATIONS` (`region-data.js`) — regions and their locations/encounter tables; `getLocationsForRegion`, `isLocationUnlocked`, `generateWildEncounter`.
- `GYM_CATALOG` (`gym-data.js`) — `getGymsForRegion`, `isGymUnlocked`, `awardGymVictory`.
- `LEAGUE_CATALOG` (`league-data.js`) — `getLeagueById`, `getLeagueStages`, `isLeagueUnlocked`, `awardEliteFourVictory`, `awardChampionVictory`.
- `EVOLUTION_CATALOG` (`evolution-data.js`) — `fromId`/`toId`/`method` (`"level"` or `"stone"` — a single generic Evolution Stone item, not real per-species stone types) `/level`; `getEvolutionChainFor`, `performEvolution`.
- `MOVE_CATALOG` / `MOVESETS` (`move-data.js`) — a small set of hand-curated per-species learnsets (the four starter lines + Pikachu) plus a deterministic type-based fallback moveset (`fallbackMovesForTypes`) for every other species, with tiered "stronger move at level N" unlocks so Pokémon keep learning moves well past level 15.
- `QUEST_CATALOG` (`quest-data.js`) and `ACHIEVEMENT_CATALOG` (`adventure-achievement-data.js`) — event-driven (see `adventure-events.js`'s `recordAdventureEvent`), metric/targetValue functions evaluated against a context object.

**Adding a new region (the established, repeated pattern — Johto/Hoenn/Sinnoh/Unova were all added this exact way) means *only* appending data to these existing catalogs — no new mechanics, no new UI, no new functions.** The checklist, in order:
1. `region-data.js`: append `LOCATIONS` entries for the region (`REGIONS` itself usually already has a placeholder entry).
2. `gym-data.js`: append 8 gym entries.
3. `league-data.js`: append a league entry (Elite Four + Champion), and add `unlocksRegion: "<new-region>"` to the **previous** region's league entry (the one deliberate touch to otherwise-untouched existing region data).
4. `evolution-data.js`: append evolutions for the new region's wild species — only `method: "level"` or `method: "stone"` are supported. Evolutions needing friendship/trade/held-item/weather/time-of-day/special-input are deliberately left out of the catalog (documented inline per exclusion); the evolved form is instead placed directly in a wild encounter table as its own catchable entry.
5. `adventure-state.js`: add a `backfillXUnlock(player)` function (idempotent, one-time) mirroring the existing `backfillHoennUnlock`/`backfillSinnohUnlock`/`backfillUnovaUnlock`, and chain it into `startAdventureCloudSync`'s onSnapshot handler.
6. `adventure-achievement-data.js`: append new achievement IDs (never rename/repurpose an existing ID — older tiers stay forever) and additive fields in `buildAdventureAchievementContext`.
7. `adventure-hq.html`: append the new region's badge grid / progress stats / region-card / Hall of Fame blocks, mirroring the previous region's blocks exactly.

Every evolution's wild-reachability should be verified (every `fromId` in the new catalog entries must actually appear in some new region's `encounters[]`) — a past region shipped with an unreachable evolution root and had to be patched after the fact.

### Leveling / XP

`pokemonLevelInfo`/`xpForLevel` (`pokedex-data.js`) is the single source of truth for Pokémon level math — every other file that needs to compute or clamp a level calls these rather than re-deriving the formula. Currently a flat cost (every level costs the same XP) by explicit request after a brief experiment with an increasing-cost curve was reverted for being too slow. Battle XP rewards (`wild-battle.html`'s `WILD_XP_LEVEL_MULTIPLIER`, `gym-battle.html`'s `GYM_XP_LEVEL_MULTIPLIER`, `league-battle.html`'s `LEAGUE_XP_LEVEL_MULTIPLIER`) are based on the enemy's level, not the fighter's own level.

### Firestore write patterns

- `saveAdventureDex` / `pushAdventureCloud` — whole-document merge writes.
- `pushAdventureCloudAtomic` — `firebase.firestore.FieldValue.increment`/`arrayUnion` for anything that must never be clobbered by a stale concurrent write from another tab/device (badges, league completion, XP/coin totals) — used for every "first time this is earned" reward grant (`awardGymVictory`, `awardEliteFourVictory`, `awardChampionVictory`), each of which re-reads fresh state and checks an idempotency guard before granting anything, so a repeat call or a race is always a safe no-op.
- There is no transaction API in use anywhere; last-write-wins is the accepted conflict model, documented inline wherever it matters.

### PWA

`service-worker.js` + `manifest.json` make this an installable PWA. The service worker does not hardcode a file list, so adding new pages/scripts needs no service-worker change.
