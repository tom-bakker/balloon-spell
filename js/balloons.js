// Handles the floating balloons: spawning, animating, and popping.
// Generalized to work with any sequence of "tokens" — single letters for
// the spelling game, or a single answer string for the maths game — so
// both modes share the same floating/weighting/pop-animation behaviour.
//
// Balloons spawn continuously (not as a one-shot batch) for as long as a
// prompt is active, so a missed or wrongly-popped token always gets another
// chance to float up again before time runs out.
//
// Difficulty is expressed here as maxCorrectOnScreen: how many balloons
// carrying the correct "next" token are allowed on screen at once. There is
// always a hard guarantee of at least 1, regardless of difficulty — that
// guarantee bypasses the general on-screen density cap, since correctness
// takes priority over not overcrowding the sky.

const BALLOON_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#9D7FE8", "#4FC3E8", "#FF9F6B"];
const MAX_CONCURRENT_BALLOONS = 8;
const POP_PARTICLE_COUNT = 8;
const POP_ANIMATION_MS = 420;

// Spawn-pool weighting for the "extra" (non-guaranteed) slots: other
// still-needed tokens spawn moderately, decoys spawn least of all.
const OTHER_TOKEN_WEIGHT = 2.5;
const DECOY_WEIGHT_SCALE = 0.4;
const MIN_DECOY_WEIGHT = 0.5;

class BalloonField {
  /**
   * @param {HTMLElement} containerEl
   * @param {object} opts
   * @param {number} opts.fallDuration - ms for a balloon to travel from the bottom to the top of the play area
   * @param {number} opts.spawnGap - ms between spawns
   * @param {number} opts.decoyWeightBase - scales how often decoys appear (bigger = more decoys)
   * @param {number} [opts.maxCorrectOnScreen] - difficulty cap on simultaneous correct-next-token balloons (default 3)
   * @param {function} opts.getRemainingTokens - () => string[] of tokens still needed, in priority order
   * @param {function} opts.decoyGenerator - () => string, produces one wrong token
   * @param {function} [opts.formatLabel] - (token) => string, how to render the token on the balloon
   * @param {function} [opts.onPop] - ({token, isDecoy, el}) => boolean|undefined ("was this correct?")
   * @param {function} [opts.onMiss] - (token) => void, called when a balloon falls off-screen unpopped
   */
  constructor(containerEl, { fallDuration, spawnGap, decoyWeightBase, maxCorrectOnScreen, getRemainingTokens, decoyGenerator, formatLabel, onPop, onMiss }) {
    this.container = containerEl;
    this.fallDuration = fallDuration;
    this.spawnGap = spawnGap;
    this.decoyWeightBase = decoyWeightBase != null ? decoyWeightBase : 6;
    this.maxCorrectOnScreen = maxCorrectOnScreen != null ? Math.max(1, maxCorrectOnScreen) : 3;
    this.getRemainingTokens = getRemainingTokens || (() => []);
    this.decoyGenerator = decoyGenerator || (() => "?");
    this.formatLabel = formatLabel || ((token) => token);
    this.onPop = onPop || (() => {});
    this.onMiss = onMiss || (() => {});
    this.spawnTimer = null;
    this.activeBalloons = new Set();
    this.laneCount = 7;
    this.lastLanes = [];
    this.active = false;
  }

  // Begin (or restart) the continuous spawn loop for a new prompt (word or question).
  start() {
    this.stop();
    this.active = true;
    // Guarantee a correct balloon is visible from the very first frame,
    // rather than waiting for the first scheduled spawn.
    this.ensureCorrectPresence();
    this.scheduleNext(500);
  }

  scheduleNext(delay) {
    clearTimeout(this.spawnTimer);
    this.spawnTimer = setTimeout(() => {
      if (!this.active) return;
      this.spawnOne();
      const jitter = this.spawnGap * 0.25 * (Math.random() - 0.5);
      this.scheduleNext(Math.max(200, this.spawnGap + jitter));
    }, delay);
  }

  countActiveToken(token) {
    let count = 0;
    this.activeBalloons.forEach((el) => {
      if (el.dataset.decoy !== "1" && el.dataset.token === token) count += 1;
    });
    return count;
  }

  // Counts every active, non-decoy balloon whose token is anywhere in the
  // given set of still-needed tokens (not just the immediate next one).
  countActiveTokensInSet(tokenSet) {
    let count = 0;
    this.activeBalloons.forEach((el) => {
      if (el.dataset.decoy !== "1" && tokenSet.has(el.dataset.token)) count += 1;
    });
    return count;
  }

  // Hard guarantee: if there's currently no balloon on screen carrying the
  // correct next token, spawn one immediately — this deliberately bypasses
  // MAX_CONCURRENT_BALLOONS, since keeping the answer reachable takes
  // priority over the general density cap.
  ensureCorrectPresence() {
    if (!this.active) return;
    const remaining = this.getRemainingTokens() || [];
    if (remaining.length === 0) return;
    const nextToken = remaining[0];
    if (this.countActiveToken(nextToken) === 0) {
      this.spawnBalloon(nextToken, false);
    }
  }

  spawnOne() {
    const remaining = this.getRemainingTokens() || [];
    if (remaining.length === 0) return; // prompt already solved — caller should stop() shortly

    this.ensureCorrectPresence();

    // Don't let the sky get too crowded — skip this tick if it's already busy,
    // the loop will simply try again next tick. (The guarantee above already
    // ran and is exempt from this cap.)
    if (this.activeBalloons.size >= MAX_CONCURRENT_BALLOONS) return;

    const nextToken = remaining[0];
    const otherTokens = remaining.slice(1);
    // The difficulty cap applies to the whole "correct family" collectively
    // — any balloon matching ANY still-needed token, not just the immediate
    // next one. Otherwise uncapped "other remaining letter" balloons could
    // pile up and later become the next-needed letter, blowing past the cap.
    const familyCount = this.countActiveTokensInSet(new Set(remaining));

    const pool = [];
    if (familyCount < this.maxCorrectOnScreen) {
      pool.push({ isDecoy: false, token: nextToken, weight: 3 });
      otherTokens.forEach((token) => pool.push({ isDecoy: false, token, weight: OTHER_TOKEN_WEIGHT }));
    }
    pool.push({ isDecoy: true, token: null, weight: Math.max(MIN_DECOY_WEIGHT, this.decoyWeightBase * DECOY_WEIGHT_SCALE) });

    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = pool[pool.length - 1];
    for (const entry of pool) {
      if (roll < entry.weight) {
        chosen = entry;
        break;
      }
      roll -= entry.weight;
    }

    if (chosen.isDecoy) {
      this.spawnBalloon(this.decoyGenerator(), true);
    } else {
      this.spawnBalloon(chosen.token, false);
    }
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

  spawnBalloon(token, isDecoy) {
    if (!this.container) return;
    const width = this.container.clientWidth || 320;
    const laneWidth = width / this.laneCount;
    const lane = this.pickLane();
    const jitter = (Math.random() - 0.5) * laneWidth * 0.4;
    const x = lane * laneWidth + laneWidth / 2 + jitter;
    const label = this.formatLabel(token);
    const wide = String(label).length > 2;

    const el = document.createElement("div");
    el.className = "balloon" + (wide ? " balloon-wide" : "");
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--half-width", wide ? "34px" : "26px");
    el.style.setProperty("--fall-duration", `${this.fallDuration}ms`);
    el.style.setProperty("--balloon-color", BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]);
    el.dataset.token = token;
    el.dataset.decoy = isDecoy ? "1" : "0";

    const body = document.createElement("div");
    body.className = "balloon-body";
    body.textContent = label;
    el.appendChild(body);

    const knot = document.createElement("div");
    knot.className = "balloon-knot";
    el.appendChild(knot);

    const string = document.createElement("div");
    string.className = "balloon-string";
    el.appendChild(string);

    const missTimer = setTimeout(() => {
      this.removeBalloon(el);
      this.onMiss(token);
    }, this.fallDuration + 350);

    const pop = (evt) => {
      evt.preventDefault();
      clearTimeout(missTimer);
      this.popBalloon(el, token, isDecoy);
    };
    el.addEventListener("pointerdown", pop, { once: true });

    el.__missTimer = missTimer;
    this.container.appendChild(el);
    this.activeBalloons.add(el);
  }

  popBalloon(el, token, isDecoy) {
    if (!el.isConnected) return;
    // Freeze the balloon exactly where it currently is before cancelling the
    // float animation — otherwise removing the animation would snap it back
    // to its pre-animation position (top: 105%, off the bottom) for one
    // visible frame.
    el.style.top = getComputedStyle(el).top;
    // onPop returns true (correct), false (wrong) or undefined (ignored, e.g. game already over) —
    // used to colour the burst animation appropriately.
    const result = this.onPop({ token, isDecoy, el });
    el.classList.add("popping");
    el.classList.add(result === true ? "pop-correct" : result === false ? "pop-wrong" : "pop-neutral");
    this.spawnBurst(el);
    setTimeout(() => this.removeBalloon(el), POP_ANIMATION_MS);
    // The pop may have advanced the pointer (new "next" token) or removed
    // the only correct balloon — re-check the guarantee right away rather
    // than waiting for the next scheduled tick.
    this.ensureCorrectPresence();
  }

  spawnBurst(el) {
    for (let i = 0; i < POP_PARTICLE_COUNT; i++) {
      const particle = document.createElement("div");
      particle.className = "pop-particle";
      const angle = (Math.PI * 2 * i) / POP_PARTICLE_COUNT + (Math.random() * 0.5 - 0.25);
      const dist = 24 + Math.random() * 18;
      particle.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      particle.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      particle.style.animationDelay = `${Math.random() * 40}ms`;
      el.appendChild(particle);
    }
  }

  removeBalloon(el) {
    if (el.__missTimer) clearTimeout(el.__missTimer);
    this.activeBalloons.delete(el);
    if (el.isConnected) el.remove();
    // A balloon disappearing (missed off the top of the screen) may have
    // been the last correct one — replenish immediately if so.
    this.ensureCorrectPresence();
  }

  // Stop the spawn loop and clear every balloon currently on screen —
  // called when a prompt is completed, the level is exited, or time runs out.
  stop() {
    this.active = false;
    clearTimeout(this.spawnTimer);
    this.spawnTimer = null;
    this.activeBalloons.forEach((el) => {
      if (el.__missTimer) clearTimeout(el.__missTimer);
      if (el.isConnected) el.remove();
    });
    this.activeBalloons.clear();
    if (this.container) this.container.innerHTML = "";
  }
}
