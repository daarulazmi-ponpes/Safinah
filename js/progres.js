(function () {
  let babData = [];

  const statsEl = document.getElementById("progres-stats");
  const listEl = document.getElementById("progres-list");
  const resetBtn = document.getElementById("reset-progres");

  // Load bab data
  async function loadBabData() {
    try {
      const res = await fetch("data/bab.json");
      const json = await res.json();
      babData = json.bab || [];
      renderDashboard();
    } catch (e) {
      console.error("Gagal memuat data bab:", e);
      listEl.innerHTML = '<p class="empty-state">Gagal memuat data. Muat ulang halaman.</p>';
    }
  }

  // Render dashboard
  function renderDashboard() {
    const progres = getProgres();
    const totalBab = babData.length;
    const babSelesai = progres.babSelesai.length;
    const avgScore = getAverageScore();

    // Total latihan attempts
    let totalLatihan = 0;
    Object.values(progres.skorLatihan).forEach((scores) => {
      totalLatihan += scores.length;
    });

    // Stats cards
    statsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${babSelesai}/${totalBab}</div>
        <div class="stat-label">Bab Selesai</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgScore}%</div>
        <div class="stat-label">Skor Rata-rata Kuis</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalLatihan}</div>
        <div class="stat-label">Total Latihan</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalBab - babSelesai}</div>
        <div class="stat-label">Sisa Bab</div>
      </div>
    `;

    // Progress list
    listEl.innerHTML = "";
    babData.forEach((bab) => {
      const item = document.createElement("div");
      item.className = "progres-item";

      const kuisScore = getKuisScore(bab.id);
      const latihanScores = getLatihanScores(bab.id);
      const bestLatihan = latihanScores.length > 0 ? Math.max(...latihanScores) : 0;
      const selesai = progres.babSelesai.includes(bab.id);

      const displayScore = kuisScore > 0 ? kuisScore : bestLatihan;
      const scoreClass = displayScore > 0 ? "done" : "pending";
      const scoreText = displayScore > 0 ? `${displayScore}%` : "Belum dikerjakan";

      item.innerHTML = `
        <div class="progres-bab">
          <h4>Bab ${bab.nomor}: ${bab.judul}</h4>
          <p>${bab.kategori} ${selesai ? "• ✓ Dipelajari" : ""} ${latihanScores.length > 0 ? `• ${latihanScores.length}x latihan` : ""}</p>
        </div>
        <span class="progres-score ${scoreClass}">${scoreText}</span>
      `;

      listEl.appendChild(item);
    });
  }

  // Reset progress
  resetBtn.addEventListener("click", () => {
    if (confirm("Apakah kamu yakin ingin mereset semua progres? Tindakan ini tidak bisa dibatalkan.")) {
      resetProgres();
      renderDashboard();
    }
  });

  // Init
  loadBabData();
})();
