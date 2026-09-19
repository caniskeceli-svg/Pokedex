// ---- Adventure Hall of Fame / Victory Selfie / Memories (Phase 9) ----
// Sits on top of adventure-state.js's raw getAdventureMemories/
// saveAdventureMemories exactly the way gym-data.js/league-data.js sit on
// top of getAdventurePlayer - this file owns the victory-memory domain
// logic: deterministic victory keys, the idempotent save, and the small
// shared memory-viewer modal used by both adventure-hq.html and
// victory-selfie.html. Depends on adventure-state.js and quest-data.js
// (getServerTimestampMs) - load both before this file.
//
// Sep 2026: this used to upload the composed JPEG to Firebase Storage and
// keep just its download URL in Firestore. Storage was never actually
// provisioned for this project (its bucket 404s - a one-time Firebase
// console step nobody here can do from the app's own code), so every save
// failed with "Yükleme başarısız oldu". Storing the image as a data: URL
// straight in Firestore instead needs no Storage bucket at all. Each
// memory's image lives in its OWN document
// (profiles/<ADVENTURE_DOC_ID>_memory_<memoryId>, a direct child of
// `profiles` - the same pattern the already-working "_backup" docs use,
// not a subcollection, which this project's security rules don't cover)
// rather than embedded in the `memories` array on the main profile
// document - a season's worth of victories (gyms + Elite Four + Champion,
// times three regions) could otherwise push that one document past
// Firestore's 1MB-per-document limit and start silently failing every
// OTHER write to it (badges, progress, mydex). The main profile's
// `memories` array only ever holds lightweight metadata, never the image.
//
// Only ever touches profiles/adventure - never Ayaz/Baba.

// A victory is identified the same way regardless of type, so the rest of
// this file (and the idempotency check) never special-cases gym vs league.
function victoryKeyForGym(gymId) { return `gym_${gymId}`; }
function victoryKeyForEliteFour(leagueId, stageId) { return `league_elitefour_${leagueId}_${stageId}`; }
function victoryKeyForChampion(leagueId) { return `league_champion_${leagueId}`; }

function getMemoryByVictoryKey(victoryKey) {
  return getAdventureMemories().find(m => m.victoryKey === victoryKey) || null;
}

function memoryIdForVictoryKey(victoryKey) { return `victory_${victoryKey}`; }
function memoryImageDocId(memoryId) { return `${ADVENTURE_DOC_ID}_memory_${memoryId}`; }

// Fetches a memory's actual image on demand - the metadata list
// (getAdventureMemories) never holds it, only imageDocId.
async function fetchMemoryImage(memoryId) {
  const snap = await cloudDb.collection("profiles").doc(memoryImageDocId(memoryId)).get();
  return snap.exists ? (snap.data() || {}).imageDataUrl || null : null;
}

let memorySaveLocked = {};

// The single place a victory memory is ever created. Re-checks for an
// existing memory both before AND after the image-document write, under a
// synchronous per-victoryKey lock, so a double click, a Promise.all race,
// or re-entering the same already-memorialized victory later from Hall of
// Fame can only ever produce exactly one memory - never a duplicate image
// write or a duplicate Firestore metadata record.
async function saveVictoryMemory({ victoryKey, memoryData, imageDataUrl }) {
  if (memorySaveLocked[victoryKey]) return { ok: false, reason: "in-progress" };
  memorySaveLocked[victoryKey] = true;
  try {
    const existing = getMemoryByVictoryKey(victoryKey);
    if (existing) return { ok: true, alreadyExists: true, memory: existing };

    const memoryId = memoryIdForVictoryKey(victoryKey);
    try {
      await cloudDb.collection("profiles").doc(memoryImageDocId(memoryId)).set({ imageDataUrl });
    } catch (e) {
      console.error("Memory image write failed", e);
      return { ok: false, reason: "upload-failed" };
    }

    // Re-check again after the image write - another tab/call could have
    // finished saving this exact victory's memory while we were writing.
    // The image doc this call already wrote becomes a harmless orphan in
    // that rare case rather than a duplicate metadata record.
    const stillMissing = !getMemoryByVictoryKey(victoryKey);
    if (!stillMissing) return { ok: true, alreadyExists: true, memory: getMemoryByVictoryKey(victoryKey) };

    const memory = Object.assign({}, memoryData, {
      id: memoryId,
      victoryKey,
      imageDocId: memoryImageDocId(memoryId)
    });
    try {
      saveAdventureMemories(getAdventureMemories().concat([memory]));
    } catch (e) {
      console.error("Memory metadata write failed", e);
      return { ok: false, reason: "metadata-write-failed" };
    }
    return { ok: true, alreadyExists: false, memory };
  } finally {
    memorySaveLocked[victoryKey] = false;
  }
}

function formatMemoryDate(ms) {
  try {
    return new Date(ms).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  } catch (e) {
    return "";
  }
}

// A small shared bottom-sheet viewer, appended straight to <body>. Both
// adventure-hq.html and victory-selfie.html include this file and define
// the same `.memory-viewer-overlay`/`.memory-viewer-box` CSS classes in
// their own stylesheet (every page in this app already keeps its own
// inline <style>, no shared stylesheet exists) - this function only
// builds/shows the markup.
async function showMemoryViewer(memory) {
  let overlay = document.getElementById("memoryViewerOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "memoryViewerOverlay";
    overlay.className = "memory-viewer-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) hideMemoryViewer(); });
  }
  // The image lives in its own document (see the file header) and isn't
  // on `memory` itself - fetched on demand, with a spinner placeholder
  // while it loads.
  overlay.innerHTML = `
    <div class="memory-viewer-box">
      <div style="text-align:center;padding:40px 0;color:#999;">Yükleniyor...</div>
      <div class="memory-viewer-title">${memory.title || ""}</div>
      <div class="memory-viewer-sub">${memory.subtitle || ""}</div>
      <div class="memory-viewer-date">${formatMemoryDate(memory.createdAt)}</div>
      <button class="memory-viewer-close" id="memoryViewerCloseBtn">Kapat</button>
    </div>`;
  overlay.classList.add("show");
  document.getElementById("memoryViewerCloseBtn").addEventListener("click", hideMemoryViewer);
  try {
    const imageDataUrl = await fetchMemoryImage(memory.id);
    if (!overlay.classList.contains("show")) return;
    const placeholder = overlay.querySelector(".memory-viewer-box > div");
    if (placeholder) {
      if (imageDataUrl) {
        placeholder.outerHTML = `<img src="${imageDataUrl}" alt="${memory.title || 'Memory'}">`;
      } else {
        placeholder.textContent = "Fotoğraf bulunamadı.";
      }
    }
  } catch (e) {
    console.error("Memory image fetch failed", e);
  }
}

function hideMemoryViewer() {
  const overlay = document.getElementById("memoryViewerOverlay");
  if (overlay) overlay.classList.remove("show");
}
