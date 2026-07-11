// Persistence layer — profiles and high score tables, backed by localStorage.

const STORE_KEYS = {
  profiles: "bs_profiles",
  activeProfile: "bs_active_profile",
  scores: "bs_scores_" // + levelKey
};

const DEFAULT_SEED_SCORES = [20000, 10000, 7000];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Storage full or unavailable — fail silently, game still playable this session.
    console.warn("Could not save to localStorage", e);
  }
}

const Storage = {
  // ---------- Profiles ----------
  getProfiles() {
    return readJSON(STORE_KEYS.profiles, []);
  },

  saveProfiles(profiles) {
    writeJSON(STORE_KEYS.profiles, profiles);
  },

  createProfile(name, avatar) {
    const profiles = Storage.getProfiles();
    const profile = {
      id: `p_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name: name.trim().slice(0, 20) || "Speller",
      avatar: avatar || AVATAR_PRESETS[0],
      createdAt: Date.now()
    };
    profiles.push(profile);
    Storage.saveProfiles(profiles);
    Storage.setActiveProfileId(profile.id);
    return profile;
  },

  updateProfile(id, changes) {
    const profiles = Storage.getProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    profiles[idx] = { ...profiles[idx], ...changes };
    Storage.saveProfiles(profiles);
    return profiles[idx];
  },

  deleteProfile(id) {
    const profiles = Storage.getProfiles().filter((p) => p.id !== id);
    Storage.saveProfiles(profiles);
    if (Storage.getActiveProfileId() === id) {
      Storage.setActiveProfileId(profiles.length ? profiles[0].id : null);
    }
  },

  getActiveProfileId() {
    return localStorage.getItem(STORE_KEYS.activeProfile);
  },

  setActiveProfileId(id) {
    if (id) localStorage.setItem(STORE_KEYS.activeProfile, id);
    else localStorage.removeItem(STORE_KEYS.activeProfile);
  },

  getActiveProfile() {
    const id = Storage.getActiveProfileId();
    if (!id) return null;
    return Storage.getProfiles().find((p) => p.id === id) || null;
  },

  // ---------- High scores ----------
  getHighScores(levelKey) {
    const key = STORE_KEYS.scores + levelKey;
    const existing = readJSON(key, null);
    if (existing) return existing;
    const seeded = DEFAULT_SEED_SCORES.map((score) => ({ name: "—", score }));
    writeJSON(key, seeded);
    return seeded;
  },

  submitScore(levelKey, playerName, score) {
    const key = STORE_KEYS.scores + levelKey;
    const current = Storage.getHighScores(levelKey);
    const combined = [...current, { name: playerName, score }];
    combined.sort((a, b) => b.score - a.score);
    const top3 = combined.slice(0, 3);
    writeJSON(key, top3);
    const rank = top3.findIndex((entry) => entry.name === playerName && entry.score === score);
    return { top3, madeTop3: rank !== -1, rank: rank === -1 ? null : rank + 1 };
  }
};
