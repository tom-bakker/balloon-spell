// Wires together storage, the game engine and the UI screens.

const App = {
  profileFormAvatar: null,
  selectedYear: null,
  selectedDifficulty: null,
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

      yearGrid: $("year-grid"),
      difficultyPanel: $("difficulty-panel"),
      difficultyGrid: $("difficulty-grid"),
      levelBest: $("level-best"),
      btnGotoPregame: $("btn-goto-pregame"),

      pregameLevelLabel: $("pregame-level-label"),
      pregameTime: $("pregame-time"),
      pregameBestChip: $("pregame-best-chip"),

      hudScoreValue: $("hud-score-value"),
      hudTimerValue: $("hud-timer-value"),
      hudMultiplierValue: $("hud-multiplier-value"),
      timerRingFg: $("timer-ring-fg"),
      wordEmoji: $("word-emoji"),
      wordLetters: $("word-letters"),
      wordCard: document.querySelector(".word-card"),
      balloonLayer: $("balloon-layer"),

      resultsTitle: $("results-title"),
      resultsScoreValue: $("results-score-value"),
      resultsWords: $("results-words"),
      resultsNewBest: $("results-new-best"),
      resultsScoreboard: $("results-scoreboard"),

      hsYearGrid: $("hs-year-grid"),
      hsDifficultyGrid: $("hs-difficulty-grid"),
      hsScoreboard: $("hs-scoreboard"),

      exitModal: $("exit-confirm")
    };
  },

  bindEvents() {
    document.getElementById("btn-new-profile").addEventListener("click", () => this.openProfileForm());
    document.getElementById("btn-cancel-profile").addEventListener("click", () => this.closeProfileForm());
    document.getElementById("btn-save-profile").addEventListener("click", () => this.saveNewProfile());
    document.getElementById("btn-upload-avatar").addEventListener("click", () => this.els.avatarFileInput.click());
    this.els.avatarFileInput.addEventListener("change", (e) => this.handleAvatarUpload(e));

    document.getElementById("btn-switch-profile").addEventListener("click", () => this.goToProfiles());
    document.getElementById("btn-goto-levels").addEventListener("click", () => this.goToLevels());
    document.getElementById("btn-goto-highscores").addEventListener("click", () => this.goToHighScores());

    document.getElementById("btn-levels-back").addEventListener("click", () => this.goToMenu());
    document.getElementById("btn-goto-pregame").addEventListener("click", () => this.goToPregame());

    document.getElementById("btn-pregame-back").addEventListener("click", () => this.goToLevels());
    document.getElementById("btn-start-game").addEventListener("click", () => this.startGame());

    document.getElementById("btn-exit-game").addEventListener("click", () => this.openExitModal());
    document.getElementById("btn-exit-cancel").addEventListener("click", () => this.closeExitModal());
    document.getElementById("btn-exit-confirm").addEventListener("click", () => this.confirmExit());
    document.getElementById("btn-replay-word").addEventListener("click", () => {
      if (this.session && this.session.currentWord) SpeechBox.speakWord(this.session.currentWord);
    });

    document.getElementById("btn-play-again").addEventListener("click", () => this.playAgain());
    document.getElementById("btn-change-level").addEventListener("click", () => this.goToLevels());
    document.getElementById("btn-results-menu").addEventListener("click", () => this.goToMenu());

    document.getElementById("btn-highscores-back").addEventListener("click", () => this.goToMenu());
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

  // ---------------- Level select ----------------
  goToLevels() {
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
    const scores = Storage.getHighScores(levelKey(this.selectedYear, this.selectedDifficulty));
    const best = scores[0];
    this.els.levelBest.textContent = best ? `Top score: ${best.score.toLocaleString()} — ${best.name}` : "";
  },

  // ---------------- Pre-game ----------------
  goToPregame() {
    if (!this.selectedYear || !this.selectedDifficulty) return;
    const config = DIFFICULTY_CONFIG[this.selectedDifficulty];
    this.els.pregameLevelLabel.textContent = levelLabel(this.selectedYear, this.selectedDifficulty);
    this.els.pregameTime.textContent = config.timeLimit;
    const scores = Storage.getHighScores(levelKey(this.selectedYear, this.selectedDifficulty));
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
    this.els.wordLetters.innerHTML = "";
    this.els.hudScoreValue.textContent = "0";
    this.els.hudMultiplierValue.textContent = "×1.0";

    this.session = new GameSession({
      year: this.selectedYear,
      difficulty: this.selectedDifficulty,
      playerName: profile.name,
      onUpdate: (state) => this.renderGameState(state),
      onLetterResult: (result) => this.flashWordCard(result.correct),
      onWordComplete: () => {},
      onGameOver: (state) => this.finishGame(state)
    });

    UI.showScreen("screen-game");
    this.session.start(this.els.balloonLayer);
    this.renderGameState(this.session.getState());
  },

  renderGameState(state) {
    this.els.hudScoreValue.textContent = state.score.toLocaleString();
    this.els.hudTimerValue.textContent = state.timeLeft;
    this.els.hudMultiplierValue.textContent = `×${state.multiplier.toFixed(1)}`;
    UI.updateTimerRing(this.els.timerRingFg, state.timeLeft, state.timeLimit);
    this.els.wordEmoji.textContent = state.emoji;
    UI.renderWordLetters(this.els.wordLetters, state.word, state.pointer);
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

  openExitModal() {
    this.els.exitModal.classList.remove("hidden");
  },
  closeExitModal() {
    this.els.exitModal.classList.add("hidden");
  },
  confirmExit() {
    this.closeExitModal();
    if (this.session) this.session.destroy();
    this.goToLevels();
  },

  // ---------------- Results ----------------
  finishGame(state) {
    const profile = Storage.getActiveProfile();
    const playerName = profile ? profile.name : "Speller";
    const key = levelKey(this.selectedYear, this.selectedDifficulty);
    const { top3, madeTop3 } = Storage.submitScore(key, playerName, state.score);

    this.els.resultsTitle.textContent = "Time's Up!";
    this.els.resultsScoreValue.textContent = state.score.toLocaleString();
    this.els.resultsWords.textContent = `${state.wordsCompleted} word${state.wordsCompleted === 1 ? "" : "s"} spelled`;
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
    UI.renderYearGrid(this.els.hsYearGrid, this.hsYear, (year) => {
      this.hsYear = year;
      this.renderHighScoreGrids();
    });
    UI.renderDifficultyGrid(this.els.hsDifficultyGrid, this.hsDifficulty, (diff) => {
      this.hsDifficulty = diff;
      this.renderHighScoreGrids();
    });
    const scores = Storage.getHighScores(levelKey(this.hsYear, this.hsDifficulty));
    UI.renderScoreboard(this.els.hsScoreboard, scores, {});
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
