// Low-level local-first persistence. Single JSON blob in localStorage.
// Abstracted so a Supabase sync adapter can replace this later (EPIC: cloud).

const KEY = "ct.v2.state";

export function loadRaw() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    console.warn("storage load failed", e);
    return null;
  }
}

export function saveRaw(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("storage save failed", e);
  }
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  return JSON.parse(text);
}

export function wipe() {
  localStorage.removeItem(KEY);
}
