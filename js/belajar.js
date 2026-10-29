(function () {
  let babData = [];
  let currentBabIndex = -1;
  let arabicDetailsVisible = false;

  const babListEl = document.getElementById("bab-list");
  const materiDetailEl = document.getElementById("materi-detail");

  // Load bab data from JSON
  async function loadBabData() {
    try {
      const res = await fetch("data/bab.json");
      const json = await res.json();
      babData = json.bab || [];
      renderBabList();
    } catch (e) {
      console.error("Gagal memuat data bab:", e);
      babListEl.innerHTML = '<p class="empty-state">Gagal memuat data Bab. Muat ulang halaman.</p>';
    }
  }

  // Render bab card grid
  function renderBabList() {
    babListEl.innerHTML = "";
    babData.forEach((bab, index) => {
      const card = document.createElement("article");
      card.className = "bab-card";
      card.setAttribute("role", "listitem");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Bab ${bab.nomor}: ${bab.judul}`);

      const selesai = isBabSelesai(bab.id);
      const fasalCount = (bab.fasals || []).length;
      card.innerHTML = `
        <span class="bab-number">${bab.kategori}</span>
        <h3>Bab ${bab.nomor}: ${bab.judul}</h3>
        <p>${bab.materi.substring(0, 100)}...</p>
        <p class="fasal-count">${fasalCount} Fasal</p>
        <span class="bab-status ${selesai ? "done" : "pending"}">
          ${selesai ? "✓ Selesai" : "○ Belum selesai"}
        </span>
      `;

      card.addEventListener("click", () => showMateri(index));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showMateri(index);
        }
      });

      babListEl.appendChild(card);
    });
  }

  // Show materi detail panel with Fasal list and Arabic hapalan text
  function showMateri(index) {
    currentBabIndex = index;
    const bab = babData[index];
    if (!bab) return;

    // Mark as selesai
    markBabSelesai(bab.id);

    // Update status badges
    renderBabList();

    // Build detail panel with Fasal list and Arabic text
    const totalBab = babData.length;
    const fasals = bab.fasals || [];
    const arabTexts = bab.arabText || [];
    const transliterasi = bab.transliterasi || [];
    const terjemahan = bab.terjemahan || [];
    let fasalListHTML = "";
    if (fasals.length > 0) {
      const fasalItems = fasals.map((f, i) => {
        const arabText = arabTexts[i] || "";
        const arabBlock = arabText ? `
          <div class="arab-text" dir="rtl" lang="ar">
            <p>${arabText}</p>
          </div>
          <div class="arab-details" id="arabic-details-${i}" ${arabicDetailsVisible ? "" : "hidden"}>
            <p><strong>Transliterasi:</strong> ${transliterasi[i] || "Belum tersedia."}</p>
            <p><strong>Terjemahan:</strong> ${terjemahan[i] || "Belum tersedia."}</p>
          </div>
        ` : "";
        return `
          <li role="listitem" class="fasal-item">
            <div class="fasal-header">
              <span class="fasal-number">${i + 1}.</span>
              <span class="fasal-title">${f}</span>
            </div>
            ${arabBlock}
          </li>
        `;
      }).join("");

      fasalListHTML = `
        <div class="fasal-list" role="list" aria-label="Daftar Fasal dan Hapalan">
          <h3>📖 Daftar Fasal & Hapalan</h3>
          <button class="arab-toggle" id="toggle-arabic-details" type="button"
                  aria-expanded="${arabicDetailsVisible}"
                  aria-controls="${arabTexts.map((text, i) => text ? `arabic-details-${i}` : "").filter(Boolean).join(" ")}">
            ${arabicDetailsVisible ? "Sembunyikan" : "Tampilkan"} transliterasi & terjemahan
          </button>
          <ul>
            ${fasalItems}
          </ul>
        </div>
      `;
    }

    materiDetailEl.innerHTML = `
      <div class="materi-panel" role="region" aria-label="Materi ${bab.judul}">
        <span class="demo-badge">Mode Demo</span>
        <h2>Bab ${bab.nomor}: ${bab.judul}</h2>
        <p class="materi-category">${bab.kategori}</p>
        <div class="materi-body">
          <p>${bab.materi}</p>
        </div>
        ${fasalListHTML}
        <div class="materi-ayat">
          <p>${bab.ayat}</p>
        </div>
        <div class="nav-buttons">
          <button class="nav-btn secondary" ${index <= 0 ? "disabled" : ""}
                  aria-label="Bab sebelumnya"
                  onclick="window.belajarPrev()">
            ← Sebelumnya
          </button>
          <button class="nav-btn" ${index >= totalBab - 1 ? "disabled" : ""}
                  aria-label="Bab berikutnya"
                  onclick="window.belajarNext()">
            Berikutnya →
          </button>
        </div>
      </div>
    `;

    const arabicToggle = materiDetailEl.querySelector("#toggle-arabic-details");
    if (arabicToggle) {
      arabicToggle.addEventListener("click", () => {
        arabicDetailsVisible = !arabicDetailsVisible;
        materiDetailEl.querySelectorAll(".arab-details").forEach((details) => {
          details.hidden = !arabicDetailsVisible;
        });
        arabicToggle.setAttribute("aria-expanded", String(arabicDetailsVisible));
        arabicToggle.textContent = `${arabicDetailsVisible ? "Sembunyikan" : "Tampilkan"} transliterasi & terjemahan`;
      });
    }

    // Scroll to detail
    materiDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Expose navigation functions globally
  window.belajarPrev = function () {
    if (currentBabIndex > 0) {
      showMateri(currentBabIndex - 1);
    }
  };

  window.belajarNext = function () {
    if (currentBabIndex < babData.length - 1) {
      showMateri(currentBabIndex + 1);
    }
  };

  // Check URL hash for direct link to a bab
  function checkHash() {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("bab-")) {
      const index = babData.findIndex((b) => b.id === hash);
      if (index >= 0) {
        setTimeout(() => showMateri(index), 100);
      }
    }
  }

  // Init
  loadBabData().then(() => {
    if (window.location.hash) checkHash();
  });
})();
