(function () {
  let babData = [];
  let kuisData = [];
  let currentBabId = "";
  let currentQuestions = [];
  let currentQuestionIndex = 0;
  let correctCount = 0;
  let answered = false;
  let audioContext;

  const babSelectorEl = document.getElementById("bab-selector");
  const quizAreaEl = document.getElementById("quiz-area");

  const letters = ["A", "B", "C", "D", "E"];

  function playAnswerSound(isCorrect) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    audioContext = audioContext || new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();

    const notes = isCorrect ? [660, 880] : [330, 220];
    notes.forEach((frequency, index) => {
      const startTime = audioContext.currentTime + index * 0.14;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.14);
    });
  }

  // Load data
  async function loadData() {
    try {
      const [babRes, kuisRes] = await Promise.all([
        fetch("data/bab.json"),
        fetch("data/kuis.json")
      ]);
      const babJson = await babRes.json();
      const kuisJson = await kuisRes.json();
      babData = babJson.bab || [];
      kuisData = kuisJson.kuis || [];
      renderBabSelector();
    } catch (e) {
      console.error("Gagal memuat data:", e);
      quizAreaEl.innerHTML = '<p class="empty-state">Gagal memuat data kuis. Muat ulang halaman.</p>';
    }
  }

  // Render bab selector buttons
  function renderBabSelector() {
    babSelectorEl.innerHTML = "";
    babData.forEach((bab) => {
      const btn = document.createElement("button");
      btn.className = "bab-select-btn";
      btn.setAttribute("aria-label", `Kuis Bab ${bab.nomor}: ${bab.judul}`);

      const existingScore = getKuisScore(bab.id);
      btn.innerHTML = `
        <div>Bab ${bab.nomor}: ${bab.judul}</div>
        ${existingScore > 0 ? `<small>Skor terakhir: ${existingScore}%</small>` : ""}
      `;

      btn.addEventListener("click", () => startQuiz(bab.id));
      babSelectorEl.appendChild(btn);
    });
  }

  // Start quiz for a bab
  function startQuiz(babId) {
    currentBabId = babId;
    currentQuestions = kuisData.filter((q) => q.babId === babId);
    currentQuestionIndex = 0;
    correctCount = 0;
    answered = false;

    if (currentQuestions.length === 0) {
      quizAreaEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>Belum ada kuis</h3>
          <p>Soal kuis untuk Bab ini belum tersedia dalam mode demo.</p>
        </div>
      `;
      return;
    }

    // Highlight active bab button
    document.querySelectorAll(".bab-select-btn").forEach((btn, i) => {
      btn.classList.toggle("active", babData[i].id === babId);
    });

    renderQuestion();
  }

  // Render current question
  function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    const total = currentQuestions.length;
    const progress = `${currentQuestionIndex + 1} / ${total}`;
    answered = false;

    quizAreaEl.innerHTML = `
      <div class="quiz-header">
        <span class="quiz-progress">${progress}</span>
        <span class="quiz-score">Benar: ${correctCount}</span>
      </div>
      <div class="quiz-question" role="region" aria-label="Pertanyaan ${currentQuestionIndex + 1}">
        <h3>${q.pertanyaan}</h3>
        <div class="quiz-options" role="radiogroup" aria-label="Pilihan jawaban">
          ${q.pilihan.map((pilihan, i) => `
            <button class="quiz-option" role="radio" aria-checked="false"
                    data-index="${i}" aria-label="Pilihan ${letters[i]}: ${pilihan}">
              <span class="option-letter">${letters[i]}</span>
              <span>${pilihan}</span>
            </button>
          `).join("")}
        </div>
        <div id="quiz-feedback"></div>
      </div>
    `;

    // Attach click handlers
    quizAreaEl.querySelectorAll(".quiz-option").forEach((btn) => {
      btn.addEventListener("click", () => selectAnswer(parseInt(btn.dataset.index)));
    });

    // Keyboard navigation
    quizAreaEl.querySelector(".quiz-options").addEventListener("keydown", (e) => {
      const options = [...quizAreaEl.querySelectorAll(".quiz-option")];
      const focused = document.activeElement;
      const idx = options.indexOf(focused);
      if (e.key === "ArrowDown" && idx < options.length - 1) {
        e.preventDefault();
        options[idx + 1].focus();
      } else if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        options[idx - 1].focus();
      }
    });

    // Focus first option
    const firstOption = quizAreaEl.querySelector(".quiz-option");
    if (firstOption) firstOption.focus();
  }

  // Handle answer selection
  function selectAnswer(selectedIndex) {
    if (answered) return;
    answered = true;

    const q = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === q.jawabanBenar;
    playAnswerSound(isCorrect);
    const options = quizAreaEl.querySelectorAll(".quiz-option");
    const feedbackEl = document.getElementById("quiz-feedback");

    if (isCorrect) {
      correctCount++;
    }

    // Update UI
    options.forEach((opt, i) => {
      opt.disabled = true;
      opt.style.cursor = "default";
      if (i === q.jawabanBenar) {
        opt.classList.add("correct");
        opt.setAttribute("aria-checked", "true");
      }
      if (i === selectedIndex && !isCorrect) {
        opt.classList.add("wrong");
      }
    });

    // Show feedback
    const feedbackClass = isCorrect ? "correct" : "wrong";
    const feedbackIcon = isCorrect ? "✓ Benar!" : "✗ Salah!";
    feedbackEl.innerHTML = `
      <div class="quiz-feedback ${feedbackClass}" role="alert">
        <strong>${feedbackIcon}</strong> ${q.penjelasan}
      </div>
    `;

    // Show next button
    const isLast = currentQuestionIndex >= currentQuestions.length - 1;
    const nextBtn = document.createElement("div");
    nextBtn.style.marginTop = "20px";
    nextBtn.style.textAlign = "center";
    if (isLast) {
      nextBtn.innerHTML = `<button class="btn btn-gold" id="finish-quiz">Lihat Hasil →</button>`;
    } else {
      nextBtn.innerHTML = `<button class="btn btn-primary" id="next-question">Pertanyaan Berikutnya →</button>`;
    }
    feedbackEl.after(nextBtn);

    // Attach handler
    const btnId = isLast ? "finish-quiz" : "next-question";
    document.getElementById(btnId).addEventListener("click", () => {
      if (isLast) {
        showResults();
      } else {
        currentQuestionIndex++;
        renderQuestion();
      }
    });
  }

  // Show quiz results
  function showResults() {
    const actualScore = Math.round((correctCount / currentQuestions.length) * 100);

    // Save score
    saveKuisScore(currentBabId, actualScore);
    markBabSelesai(currentBabId);

    const icon = actualScore >= 80 ? "🏆" : actualScore >= 50 ? "👍" : "💪";
    const message = actualScore >= 80
      ? "Luar biasa! Pemahamanmu sangat baik!"
      : actualScore >= 50
      ? "Bagus! Terus tingkatkan belajarmu!"
      : "Jangan menyerah! Coba lagi untuk meningkatkan skor.";

    quizAreaEl.innerHTML = `
      <div class="quiz-result" role="region" aria-label="Hasil kuis">
        <div class="result-icon">${icon}</div>
        <h2>Kuis Selesai!</h2>
        <div class="result-score">${actualScore}%</div>
        <p>${message}</p>
        <p>Skor telah disimpan ke progres belajarmu.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:24px;">
          <button class="btn btn-primary" id="retry-quiz">Coba Lagi</button>
          <button class="btn btn-secondary" id="back-selector">Pilih Bab Lain</button>
          <a href="progres.html" class="btn btn-gold">Lihat Progres</a>
        </div>
      </div>
    `;

    document.getElementById("retry-quiz").addEventListener("click", () => {
      startQuiz(currentBabId);
    });
    document.getElementById("back-selector").addEventListener("click", () => {
      quizAreaEl.innerHTML = "";
      document.querySelectorAll(".bab-select-btn").forEach((btn) => btn.classList.remove("active"));
    });
  }

  // Init
  loadData();
})();
