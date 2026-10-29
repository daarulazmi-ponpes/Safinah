const STORAGE_KEY = "safinah-learning-progres";

function getProgres() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Gagal membaca progres:", e);
  }
  return { babSelesai: [], skorKuis: {}, skorLatihan: {} };
}

function saveProgres(progres) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progres));
  } catch (e) {
    console.warn("Gagal menyimpan progres:", e);
  }
}

function markBabSelesai(babId) {
  const p = getProgres();
  if (!p.babSelesai.includes(babId)) {
    p.babSelesai.push(babId);
    saveProgres(p);
  }
}

function isBabSelesai(babId) {
  const p = getProgres();
  return p.babSelesai.includes(babId);
}

function saveKuisScore(babId, score) {
  const p = getProgres();
  p.skorKuis[babId] = score;
  saveProgres(p);
}

function getKuisScore(babId) {
  const p = getProgres();
  return p.skorKuis[babId] || 0;
}

function saveLatihanScore(babId, score) {
  const p = getProgres();
  if (!p.skorLatihan[babId]) p.skorLatihan[babId] = [];
  p.skorLatihan[babId].push(score);
  saveProgres(p);
}

function getLatihanScores(babId) {
  const p = getProgres();
  return p.skorLatihan[babId] || [];
}

function getAverageScore() {
  const p = getProgres();
  const scores = Object.values(p.skorKuis);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function resetProgres() {
  localStorage.removeItem(STORAGE_KEY);
}
