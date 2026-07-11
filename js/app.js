// Wires together storage, the game engines (spelling + maths) and the UI screens.

const App = {
  profileFormAvatar: null,
  levelMode: "spelling", // "spelling" | "maths" — which game the level-select/pregame/game screens are driving
  selectedYear: null,
  selectedDifficulty: null,
  hsMode: "spelling",
  hsYear: 1,
  hsDifficulty: "easy",
  session: null,

  els: {},

  init() {
    this.cacheEls();
    this.bindEvents();
    SpeechBox.init();
    this.registerServiceWorker();

    const activeProfile = Storage.getActiveProfile();
    if (activeProfile) {
      this.goToMenu();
    } else {
      this.goToProfiles();
    }
  },

  cacheEls() {
    const $ = (id) => document.getElementById(id);
    this.els = {
      profileList: $("profile-list"),
      profileForm: $("profile-form"),
      inputName: $("input-name"),
      avatarGrid: $("avatar-grid"),
      avatarFileInput: $("avatar-file-input"),

      menuAvatar: $("menu-avatar"),
      menuName: $("menu-name"),

      levelsTitle: $("levels-title"),
      yearGrid: $("year-grid"),
      difficultyPanel: $("difficulty-panel"),
      difficultyGrid: $("difficulty-grid"),
      levelBest: $("level-best"),
      btnGotoPregame: $("btn-goto-pregame"),

      pregameLevelLabel: $("pregame-level-label"),
      pregameCopy: $("pregame-copy"),
      pregameTime: $("pregame-time"),
      pregameBestChip: $("pregame-best-chip"),

      hudScoreValue: $("hud-score-value"),
      hudTimerValue: $("hud-timer-value"),
      hudMultiplierValue: $("hud-multiplier-value"),
      timerRingFg: $("timer-ring-fg"),
      wordEmoji: $("word-emoji"),
      mathsQuestion: $("maths-question"),
      wordLetters: $("word-letters"),
      wordCard: document.querySelector(".word-card"),
      balloonLayer: $("balloon-layer"),

      resultsTitle: $("results-title"),
      resultsScoreValue: $("results-score-value"),
      resultsWords: $("results-words"),
      resultsNewBest: $("results-new-best"),
      resultsScoreboard: $("results-scoreboard"),

      hsModeToggle: $("hs-mode-toggle"),
      hsYearGrid: $("hs-year-grid"),
      hsDifficultyGrid: $("hs-difficulty-grid"),
      hsScoreboard: $("hs-scoreboard"),

      exitModal: $("exit-confirm"),

      settingsStatus: $("settings-status"),
      clearCacheModal: $("clear-cache-confirm")
    };
  },

  bindEvents() {
    document.getElementById("btn-new-profile").addEventListener("click", () => this.openProfileForm());
    document.getElementById("btn-cancel-profile").addEventListener("click", () => this.closeProfileForm());
    document.getElementById("btn-save-profile").addEventListener("click", () => this.saveNewProfile());
    document.getElementById("btn-upload-avatar").addEventListener("click", () => this.els.avatarFileInput.click());
    this.els.avatarFileInput.addEventListener("change", (e) => this.handleAvatarUpload(e));

    document.getElementById("btn-switch-profile").addEventListener("click", () => this.goToProfiles());
    document.getElementById("btn-goto-levels").addEventListener("click", () => this.goToLevels("spelling"));
    document.getElementById("btn-goto-maths").addEventListener("click", () => this.goToLevels("maths"));
    document.getElementById("btn-goto-highscores").addEventListener("click", () => this.goToHighScores());
    document.getElementById("btn-open-settings").addEventListener("click", () => this.goToSettings());

    document.getElementById("btn-levels-back").addEventListener("click", () => this.goToMenu());
    document.getElementById("btn-goto-pregame").addEventListener("click", () => this.goToPregame());

    document.getElementById("btn-pregame-back").addEventListener("click", () => this.goToLevels(this.levelMode));
    document.getElementById("btn-start-game").addEventListener("click", () => this.startGame());

    document.getElementById("btn-exit-game").addEventListener("click", () => this.openExitModal());
    document.getElementById("btn-exit-cancel").addEventListener("click", () => this.closeExitModal());
    document.getElementById("btn-exit-confirm").addEventListener("click", () => this.confirmExit());
    document.getElementById("btn-replay-word").addEventListener("click", () => this.replayPrompt());

    document.getElementById("btn-play-again").addEventListener("click", () => this.playAgain());
    document.getElementById("btn-change-level").addEventListener("click", () => this.goToLevels(this.levelMode));
    document.getElementById("btn-results-menu").addEventListener("click", () => this.goToMenu());

    document.getElementById("btn-highscores-back").addEventListener("click", () => this.goToMenu());

    document.getElementById("btn-settings-back").addEventListener("click", () => this.goToMenu());
    document.getElementById("btn-clear-cache").addEventListener("click", () => this.openClearCacheModal());
    document.getElementById("btn-clear-cache-cancel").addEventListener("click", () => this.closeClearCacheModal());
    document.getElementById("btn-clear-cache-confirm").addEventListener("click", () => this.clearCache());
  },

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW registration failed", e));
      });
    }
  },

  // ---------------- Profiles ----------------
  goToProfiles() {
    const profiles = Storage.getProfiles();
    UI.renderProfileList(this.els.profileList, profiles, {
      onSelect: (profile) => {
        Storage.setActiveProfileId(profile.id);
        this.goToMenu();
      }
    });
    this.closeProfileForm();
    UI.showScreen("screen-profiles");
  },

  openProfileForm() {
    this.profileFormAvatar = AVATAR_PRESETS[0];
    this.els.inputName.value = "";
    UI.renderAvatarGrid(this.els.avatarGrid, this.profileFormAvatar, (emoji) => {
      this.profileFormAvatar = emoji;
      UI.markAvatarGridSelection(this.els.avatarGrid, emoji);
    });
    this.els.profileForm.classList.remove("hidden");
    this.els.inputName.focus();
  },

  closeProfileForm() {
    this.els.profileForm.classList.add("hidden");
  },

  handleAvatarUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        this.profileFormAvatar = dataUrl;

        // Show the uploaded photo as a selected tile at the front of the grid.
        const existing = this.els.avatarGrid.querySelector(".avatar-choice.uploaded");
        if (existing) existing.remove();
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "avatar-choice uploaded selected";
        const imgEl = document.createElement("img");
        imgEl.src = dataUrl;
        tile.appendChild(imgEl);
        const selectTile = () => {
          this.profileFormAvatar = dataUrl;
          this.els.avatarGrid.querySelectorAll(".avatar-choice").forEach((btn) => btn.classList.remove("selected"));
          tile.classList.add("selected");
        };
        tile.addEventListener("click", selectTile);
        this.els.avatarGrid.prepend(tile);
        selectTile();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  },

  saveNewProfile() {
    const name = this.els.inputName.value.trim() || "Speller";
    const avatar = this.profileFormAvatar || AVATAR_PRESETS[0];
    Storage.createProfile(name, avatar);
    this.goToMenu();
  },

  // ---------------- Menu ----------------
  goToMenu() {
    const profile = Storage.getActiveProfile();
    if (!profile) {
      this.goToProfiles();
      return;
    }
    UI.fillAvatarEl(this.els.menuAvatar, profile.avatar);
    this.els.menuName.textContent = profile.name;
    UI.showScreen("screen-menu");
  },

  // ---------------- Settings ----------------
  goToSettings() {
    this.els.settingsStatus.textContent = "";
    UI.showScreen("screen-settings");
  },

  openClearCacheModal() {
    this.els.clearCacheModal.classList.remove("hidden");
  },
  closeClearCacheModal() {
    this.els.clearCacheModal.classList.add("hidden");
  },

  async clearCache() {
    this.closeClearCacheModal();
    this.els.settingsStatus.textContent = "Clearing cache…";
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
      this.els.settingsStatus.textContent = "Cache cleared! Reloading…";
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      console.warn("Failed to clear cache", e);
      this.els.settingsStatus.textContent = "Couldn't fully clear the cache — please try again.";
    }
  },

  // ---------------- Level select ----------------
  goToLevels(mode) {
    if (mode) this.levelMode = mode;
    this.els.levelsTitle.textContent = this.levelMode === "maths" ? "Choose a maths level" : "Choose a level";

    const handleYearSelect = (year) => {
      this.selectedYear = year;
      this.selectedDifficulty = null;
      UI.renderYearGrid(this.els.yearGrid, this.selectedYear, handleYearSelect);
      this.els.difficultyPanel.classList.remove("hidden");
      this.renderDifficultyChoice();
    };
    UI.renderYearGrid(this.els.yearGrid, this.selectedYear, handleYearSelect);

    if (this.selectedYear) {
      this.els.difficultyPanel.classList.remove("hidden");
      this.renderDifficultyChoice();
    } else {
      this.els.difficultyPanel.classList.add("hidden");
    }
    UI.showScreen("screen-levels");
  },

  renderDifficultyChoice() {
    const handleDiffSelect = (diff) => {
      this.selectedDifficulty = diff;
      UI.renderDifficultyGrid(this.els.difficultyGrid, this.selectedDifficulty, handleDiffSelect);
      this.updateLevelBest();
      this.els.btnGotoPregame.disabled = false;
    };
    UI.renderDifficultyGrid(this.els.difficultyGrid, this.selectedDifficulty, handleDiffSelect);
    this.updateLevelBest();
    this.els.btnGotoPregame.disabled = !this.selectedDifficulty;
  },

  updateLevelBest() {
    if (!this.selectedYear || !this.selectedDifficulty) {
      this.els.levelBest.textContent = "";
      return;
    }
    const scores = Storage.getHighScores(levelKey(this.selectedYear, this.selectedDifficulty, this.levelMode));
    const best = scores[0];
    this.els.levelBest.textContent = best ? `Top score: ${best.score.toLocaleString()} — ${best.name}` : "";
  },

  // ---------------- Pre-game ----------------
  goToPregame() {
    if (!this.selectedYear || !this.selectedDifficulty) return;
    const config = DIFFICULTY_CONFIG[this.selectedDifficulty];
    this.els.pregameLevelLabel.textContent = levelLabel(this.selectedYear, this.selectedDifficulty);
    this.els.pregameCopy.textContent =
      this.levelMode === "maths"
        ? "Listen to the question, then pop the balloon with the correct answer before time runs out!"
        : "Listen for the word, then pop the balloons in order to spell it before time runs out!";
    this.els.pregameTime.textContent = config.timeLimit;
    const scores = Storage.getHighScores(levelKey(this.selectedYear, this.selectedDifficulty, this.levelMode));
    this.els.pregameBestChip.textContent = `Best: ${scores[0].score.toLocaleString()}`;
    UI.showScreen("screen-pregame");
  },

  // ---------------- Gameplay ----------------
  startGame() {
    SfxBox.ensureCtx();
    const profile = Storage.getActiveProfile();
    if (!profile) {
      this.goToProfiles();
      return;
    }
    if (this.session) this.session.destroy();

    this.els.wordEmoji.textContent = "";
    this.els.mathsQuestion.textContent = "";
    this.els.wordLetters.innerHTML = "";
    this.els.hudScoreValue.textContent = "0";
    this.els.hudMultiplierValue.textContent = "×1.0";

    this.els.wordEmoji.classList.toggle("hidden", this.levelMode === "maths");
    this.els.mathsQuestion.classList.toggle("hidden", this.levelMode !== "maths");

    const sharedOpts = {
      year: this.selectedYear,
      difficulty: this.selectedDifficulty,
      playerName: profile.name,
      onUpdate: (state) => this.renderGameState(state),
      onLetterResult: (result) => this.flashWordCard(result.correct),
      onGameOver: (state) => this.finishGame(state)
    };

    this.session =
      this.levelMode === "maths"
        ? new MathsGameSession(Object.assign({}, sharedOpts, { onQuestionComplete: () => {} }))
        : new GameSession(Object.assign({}, sharedOpts, { onWordComplete: () => {} }));

    UI.showScreen("screen-game");
    this.session.start(this.els.balloonLayer);
    this.renderGameState(this.session.getState());
  },

  renderGameState(state) {
    this.els.hudScoreValue.textContent = state.score.toLocaleString();
    this.els.hudTimerValue.textContent = state.timeLeft;
    this.els.hudMultiplierValue.textContent = `×${state.multiplier.toFixed(1)}`;
    UI.updateTimerRing(this.els.timerRingFg, state.timeLeft, state.timeLimit);

    if (this.levelMode === "maths") {
      this.els.mathsQuestion.textContent = state.question;
      const solved = state.pointer >= 1;
      UI.renderWordLetters(this.els.wordLetters, state.answer, solved ? state.answer.length : 0);
    } else {
      this.els.wordEmoji.textContent = state.emoji;
      UI.renderWordLetters(this.els.wordLetters, state.word, state.pointer);
    }
  },

  flashWordCard(correct) {
    if (!this.els.wordCard) return;
    this.els.wordCard.style.boxShadow = correct
      ? "0 0 0 3px var(--meadow) inset"
      : "0 0 0 3px var(--coral) inset";
    clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this.els.wordCard.style.boxShadow = "none";
    }, 260);
  },

  replayPrompt() {
    if (!this.session) return;
    if (this.levelMode === "maths") {
      if (this.session.currentSpoken) SpeechBox.speakQuestion(this.session.currentSpoken);
    } else if (this.session.currentWord) {
      SpeechBox.speakWord(this.session.currentWord);
    }
  },

  openExitModal() {
    this.els.exitModal.classList.remove("hidden");
  },
  closeExitModal() {
    this.els.exitModal.classList.add("hidden");
  },
  confirmExit() {
    this.closeExitModal();
    if (this.session) this.session.destroy();
    this.goToLevels(this.levelMode);
  },

  // ---------------- Results ----------------
  finishGame(state) {
    const profile = Storage.getActiveProfile();
    const playerName = profile ? profile.name : "Speller";
    const key = levelKey(this.selectedYear, this.selectedDifficulty, this.levelMode);
    const { top3, madeTop3 } = Storage.submitScore(key, playerName, state.score);

    this.els.resultsTitle.textContent = "Time's Up!";
    this.els.resultsScoreValue.textContent = state.score.toLocaleString();

    if (this.levelMode === "maths") {
      const count = state.questionsCompleted;
      this.els.resultsWords.textContent = `${count} question${count === 1 ? "" : "s"} answered`;
    } else {
      const count = state.wordsCompleted;
      this.els.resultsWords.textContent = `${count} word${count === 1 ? "" : "s"} spelled`;
    }

    this.els.resultsNewBest.classList.toggle("hidden", !madeTop3);
    UI.renderScoreboard(this.els.resultsScoreboard, top3, {
      highlightName: madeTop3 ? playerName : null,
      highlightScore: madeTop3 ? state.score : null
    });

    UI.showScreen("screen-results");
  },

  playAgain() {
    UI.showScreen("screen-game");
    this.startGame();
  },

  // ---------------- High scores browser ----------------
  goToHighScores() {
    this.renderHighScoreGrids();
    UI.showScreen("screen-highscores");
  },

  renderHighScoreGrids() {
    UI.renderModeToggle(this.els.hsModeToggle, this.hsMode, (mode) => {
      this.hsMode = mode;
      this.renderHighScoreGrids();
    });
    UI.renderYearGrid(this.els.hsYearGrid, this.hsYear, (year) => {
      this.hsYear = year;
      this.renderHighScoreGrids();
    });
    UI.renderDifficultyGrid(this.els.hsDifficultyGrid, this.hsDifficulty, (diff) => {
      this.hsDifficulty = diff;
      this.renderHighScoreGrids();
    });
    const scores = Storage.getHighScores(levelKey(this.hsYear, this.hsDifficulty, this.hsMode));
    UI.renderScoreboard(this.els.hsScoreboard, scores, {});
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
