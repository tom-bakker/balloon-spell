// Small collection of pure-ish DOM rendering helpers shared across screens.

const UI = {
  showScreen(id) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    const stage = document.getElementById("stage");
    if (stage) stage.scrollTop = 0;
    if (target) target.scrollTop = 0;
  },

  isPhotoAvatar(avatar) {
    return typeof avatar === "string" && avatar.startsWith("data:");
  },

  fillAvatarEl(el, avatar) {
    el.innerHTML = "";
    if (this.isPhotoAvatar(avatar)) {
      const img = document.createElement("img");
      img.src = avatar;
      img.alt = "";
      el.appendChild(img);
    } else {
      el.textContent = avatar || "🎈";
    }
  },

  renderProfileList(containerEl, profiles, { onSelect, onDelete }) {
    containerEl.innerHTML = "";
    if (profiles.length === 0) {
      const empty = document.createElement("p");
      empty.className = "subtitle";
      empty.textContent = "No players yet — create one below!";
      containerEl.appendChild(empty);
      return;
    }
    profiles.forEach((profile) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "profile-card";
      const avatar = document.createElement("span");
      avatar.className = "avatar avatar-md";
      this.fillAvatarEl(avatar, profile.avatar);
      const name = document.createElement("span");
      name.style.flex = "1";
      name.textContent = profile.name;
      card.appendChild(avatar);
      card.appendChild(name);
      card.addEventListener("click", () => onSelect(profile));
      containerEl.appendChild(card);
    });
  },

  renderAvatarGrid(containerEl, selected, onSelect) {
    containerEl.innerHTML = "";
    AVATAR_PRESETS.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avatar-choice" + (selected === emoji ? " selected" : "");
      btn.textContent = emoji;
      btn.addEventListener("click", () => onSelect(emoji));
      containerEl.appendChild(btn);
    });
  },

  markAvatarGridSelection(containerEl, selected) {
    containerEl.querySelectorAll(".avatar-choice").forEach((btn) => {
      btn.classList.toggle("selected", btn.textContent === selected);
    });
  },

  renderYearGrid(containerEl, selectedYear, onSelect) {
    containerEl.innerHTML = "";
    YEARS.forEach((year) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "year-tile" + (selectedYear === year ? " selected" : "");
      btn.innerHTML = `Year ${year}<span class="year-tile-sub">${WORD_BANKS[year].length} words</span>`;
      btn.addEventListener("click", () => onSelect(year));
      containerEl.appendChild(btn);
    });
  },

  renderDifficultyGrid(containerEl, selectedDiff, onSelect) {
    containerEl.innerHTML = "";
    DIFFICULTIES.forEach((diff) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "difficulty-tile" + (selectedDiff === diff ? " selected" : "");
      btn.dataset.diff = diff;
      btn.textContent = DIFFICULTY_CONFIG[diff].label;
      btn.addEventListener("click", () => onSelect(diff));
      containerEl.appendChild(btn);
    });
  },

  renderScoreboard(containerEl, entries, { highlightName, highlightScore } = {}) {
    containerEl.innerHTML = "";
    entries.forEach((entry, i) => {
      const row = document.createElement("div");
      const isMine = highlightName != null && entry.name === highlightName && entry.score === highlightScore;
      row.className = "scoreboard-row" + (isMine ? " mine" : "");
      const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
      row.innerHTML = `
        <span class="scoreboard-rank">${medal}</span>
        <span class="scoreboard-name">${entry.name}</span>
        <span class="scoreboard-score">${entry.score.toLocaleString()}</span>
      `;
      containerEl.appendChild(row);
    });
  },

  renderWordLetters(containerEl, word, pointer) {
    containerEl.innerHTML = "";
    word.split("").forEach((letter, i) => {
      const box = document.createElement("div");
      box.className = "letter-box" + (i < pointer ? " filled" : "");
      box.textContent = letter.toUpperCase();
      containerEl.appendChild(box);
    });
  },

  updateWordProgress(containerEl, pointer) {
    const boxes = containerEl.querySelectorAll(".letter-box");
    boxes.forEach((box, i) => box.classList.toggle("filled", i < pointer));
  },

  updateTimerRing(fgEl, timeLeft, timeLimit) {
    const circumference = 119.4;
    const ratio = Math.max(0, Math.min(1, timeLeft / timeLimit));
    fgEl.style.strokeDashoffset = String(circumference * (1 - ratio));
    fgEl.style.stroke = ratio < 0.25 ? "var(--coral)" : ratio < 0.5 ? "#E8B93D" : "var(--meadow)";
  }
};
