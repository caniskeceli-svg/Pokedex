// ---- Adventure Hall of Fame / Victory Selfie / Memories (Phase 9) ----
// Sits on top of adventure-state.js's raw getAdventureMemories/
// saveAdventureMemories exactly the way gym-data.js/league-data.js sit on
// top of getAdventurePlayer - this file owns the victory-memory domain
// logic: deterministic victory keys, the idempotent save (Storage upload +
// Firestore metadata), and the small shared memory-viewer modal used by
// both adventure-hq.html and victory-selfie.html. Depends on
// adventure-state.js and quest-data.js (getServerTimestampMs) - load both
// before this file. Firebase Storage's own SDK
// (firebase-storage-compat.js) is only needed by pages that actually
// upload (victory-selfie.html); viewing a saved memory is just an <img>
// tag against its already-public download URL.
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
function storagePathForMemory(memoryId) { return `adventure/memories/${memoryId}.jpg`; }

// Uploads the composed JPEG blob and returns its Storage path + a public
// download URL. Never called a second time for the same victory - the
// idempotency check in saveVictoryMemory happens before this runs.
async function uploadMemoryImage(memoryId, blob) {
  const path = storagePathForMemory(memoryId);
  const storageRef = firebase.storage().ref().child(path);
  const snapshot = await storageRef.put(blob, { contentType: "image/jpeg" });
  const url = await snapshot.ref.getDownloadURL();
  return { path, url };
}

let memorySaveLocked = {};

// The single place a victory memory is ever created. Re-checks for an
// existing memory both before AND after the (slow, network) Storage
// upload, under a synchronous per-victoryKey lock, so a double click, a
// Promise.all race, or re-entering the same already-memorialized victory
// later from Hall of Fame can only ever produce exactly one memory - never
// a duplicate upload or a duplicate Firestore record.
async function saveVictoryMemory({ victoryKey, memoryData, imageBlob }) {
  if (memorySaveLocked[victoryKey]) return { ok: false, reason: "in-progress" };
  memorySaveLocked[victoryKey] = true;
  try {
    const existing = getMemoryByVictoryKey(victoryKey);
    if (existing) return { ok: true, alreadyExists: true, memory: existing };

    const memoryId = memoryIdForVictoryKey(victoryKey);
    let upload;
    try {
      upload = await uploadMemoryImage(memoryId, imageBlob);
    } catch (e) {
      console.error("Memory image upload failed", e);
      return { ok: false, reason: "upload-failed" };
    }

    // Re-check again after the upload round trip - another tab/call could
    // have finished saving this exact victory's memory while we were
    // uploading. The already-uploaded file this call made becomes a
    // harmless orphan in that rare case rather than a duplicate record.
    const stillMissing = !getMemoryByVictoryKey(victoryKey);
    if (!stillMissing) return { ok: true, alreadyExists: true, memory: getMemoryByVictoryKey(victoryKey) };

    const memory = Object.assign({}, memoryData, {
      id: memoryId,
      victoryKey,
      imageStoragePath: upload.path,
      imageUrl: upload.url
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
function showMemoryViewer(memory) {
  let overlay = document.getElementById("memoryViewerOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "memoryViewerOverlay";
    overlay.className = "memory-viewer-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) hideMemoryViewer(); });
  }
  overlay.innerHTML = `
    <div class="memory-viewer-box">
      <img src="${memory.imageUrl}" alt="${memory.title || 'Memory'}">
      <div class="memory-viewer-title">${memory.title || ""}</div>
      <div class="memory-viewer-sub">${memory.subtitle || ""}</div>
      <div class="memory-viewer-date">${formatMemoryDate(memory.createdAt)}</div>
      <button class="memory-viewer-close" id="memoryViewerCloseBtn">Kapat</button>
    </div>`;
  overlay.classList.add("show");
  document.getElementById("memoryViewerCloseBtn").addEventListener("click", hideMemoryViewer);
}

function hideMemoryViewer() {
  const overlay = document.getElementById("memoryViewerOverlay");
  if (overlay) overlay.classList.remove("show");
}
