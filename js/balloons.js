// Handles the falling letter balloons: spawning, animating, and popping.
// Balloons spawn continuously (not as a one-shot batch) for as long as a
// word is active, so a missed or wrongly-popped letter always gets another
// chance to fall again before time runs out.

const BALLOON_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#9D7FE8", "#4FC3E8", "#FF9F6B"];
const MAX_CONCURRENT_BALLOONS = 6;

class BalloonField {
  constructor(containerEl, { fallDuration, spawnGap, decoyCount, onPop, onMiss, getPointer }) {
    this.container = containerEl;
    this.fallDuration = fallDuration;
    this.spawnGap = spawnGap;
    this.decoyCount = decoyCount;
    this.onPop = onPop || (() => {});
    this.onMiss = onMiss || (() => {});
    this.getPointer = getPointer || (() => 0);
    this.spawnTimer = null;
    this.activeBalloons = new Set();
    this.laneCount = 7;
    this.lastLanes = [];
    this.active = false;
    this.word = "";
  }

  // Begin (or restart) the continuous spawn loop for a new word.
  start(word) {
    this.stop();
    this.word = word;
    this.active = true;
    this.scheduleNext(500);
  }

  scheduleNext(delay) {
    clearTimeout(this.spawnTimer);
    this.spawnTimer = setTimeout(() => {
      if (!this.active) return;
      this.spawnOne();
      const jitter = this.spawnGap * 0.25 * (Math.random() - 0.5);
      this.scheduleNext(Math.max(250, this.spawnGap + jitter));
    }, delay);
  }

  spawnOne() {
    const pointer = this.getPointer();
    const remaining = this.word.slice(pointer).split("");
    if (remaining.length === 0) return; // word already solved — caller should stop() shortly

    // Don't let the sky get too crowded — skip this tick if it's already busy,
    // the loop will simply try again next tick.
    if (this.activeBalloons.size >= MAX_CONCURRENT_BALLOONS) return;

    // Probability of a "useful" letter scales with how many are still needed
    // vs. the difficulty's decoy weight, so the mix stays sensible as the
    // word nears completion.
    const probLetter = remaining.length / (remaining.length + this.decoyCount);
    if (Math.random() < probLetter) {
      const letter = remaining[Math.floor(Math.random() * remaining.length)];
      this.spawnBalloon(letter, false);
    } else {
      this.spawnBalloon(this.pickDecoyLetter(), true);
    }
  }

  pickDecoyLetter() {
    const wordSet = new Set(this.word.split(""));
    let candidate;
    do {
      candidate = DECOY_LETTER_POOL[Math.floor(Math.random() * DECOY_LETTER_POOL.length)];
    } while (wordSet.has(candidate));
    return candidate;
  }

  pickLane() {
    let lane;
    let attempts = 0;
    do {
      lane = Math.floor(Math.random() * this.laneCount);
      attempts++;
    } while (this.lastLanes.includes(lane) && attempts < 5);
    this.lastLanes.push(lane);
    if (this.lastLanes.length > 2) this.lastLanes.shift();
    return lane;
  }

  spawnBalloon(letter, isDecoy) {
    if (!this.container) return;
    const width = this.container.clientWidth || 320;
    const laneWidth = width / this.laneCount;
    const lane = this.pickLane();
    const jitter = (Math.random() - 0.5) * laneWidth * 0.4;
    const x = lane * laneWidth + laneWidth / 2 + jitter;

    const el = document.createElement("div");
    el.className = "balloon";
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--fall-duration", `${this.fallDuration}ms`);
    el.style.setProperty("--balloon-color", BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]);
    el.dataset.letter = letter;

    const body = document.createElement("div");
    body.className = "balloon-body";
    body.textContent = letter.toUpperCase();
    el.appendChild(body);

    const knot = document.createElement("div");
    knot.className = "balloon-knot";
    el.appendChild(knot);

    const string = document.createElement("div");
    string.className = "balloon-string";
    el.appendChild(string);

    const missTimer = setTimeout(() => {
      this.removeBalloon(el);
      this.onMiss(letter);
    }, this.fallDuration + 350);

    const pop = (evt) => {
      evt.preventDefault();
      clearTimeout(missTimer);
      this.popBalloon(el, letter, isDecoy);
    };
    el.addEventListener("pointerdown", pop, { once: true });

    el.__missTimer = missTimer;
    this.container.appendChild(el);
    this.activeBalloons.add(el);
  }

  popBalloon(el, letter, isDecoy) {
    if (!el.isConnected) return;
    el.classList.add("popping");
    this.onPop({ letter, isDecoy, el });
    setTimeout(() => this.removeBalloon(el), 180);
  }

  removeBalloon(el) {
    if (el.__missTimer) clearTimeout(el.__missTimer);
    this.activeBalloons.delete(el);
    if (el.isConnected) el.remove();
  }

  // Stop the spawn loop and clear every balloon currently on screen —
  // called when a word is completed, the level is exited, or time runs out.
  stop() {
    this.active = false;
    clearTimeout(this.spawnTimer);
    this.spawnTimer = null;
    this.activeBalloons.forEach((el) => this.removeBalloon(el));
    this.activeBalloons.clear();
    if (this.container) this.container.innerHTML = "";
  }
}
