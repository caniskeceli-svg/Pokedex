// ---- Central Adventure event recorder (Phase 8) ----
// The single funnel every Adventure gameplay action reports through, so
// Daily Quests and Adventure Achievements both read from the same events
// instead of each mechanic (wild battle, catch, gym, evolution, friendship,
// exploring...) growing its own quest/achievement-specific code. Neither
// system mutates the other's state - this just calls each one's own
// idempotent update function. Depends on quest-data.js and
// adventure-achievement-data.js - load both before this file, and this file
// before any page that calls recordAdventureEvent.
function recordAdventureEvent(type, amount) {
  if (typeof updateQuestProgress === "function") updateQuestProgress(type, amount || 1);
  if (typeof checkAndUnlockAdventureAchievements === "function") return checkAndUnlockAdventureAchievements();
  return [];
}
