// Drives a single spelling session for one level (year + difficulty).

class GameSession {
  constructor({ year, difficulty, playerName, onUpdate, onWordComplete, onLetterResult, onGameOver }) {
    this.year = year;
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
    this.playerName = playerName;
    this.onUpdate = onUpdate || (() => {});
    this.onWordComplete = onWordComplete || (() => {});
    this.onLetterResult = onLetterResult || (() => {});
    this.onGameOver = onGameOver || (() => {});

    this.score = 0;
    this.multiplier = 1.0;
    this.timeLeft = this.config.timeLimit;
    this.wordsCompleted = 0;
    this.currentWord = "";
    this.currentEmoji = "";
    this.pointer = 0;
    this.wordMistake = false;
    this.running = false;
    this.interval = null;
    this.nextWordTimer = null;
    this.balloonField = null;
  }

  getState() {
    return {
      score: this.score,
      multiplier: this.multiplier,
      timeLeft: this.timeLeft,
      timeLimit: this.config.timeLimit,
      word: this.currentWord,
      emoji: this.currentEmoji,
      pointer: this.pointer,
      wordsCompleted: this.wordsCompleted
    };
  }

  start(containerEl) {
    this.balloonField = new BalloonField(containerEl, {
      fallDuration: this.config.fallDuration,
      spawnGap: this.config.spawnGap,
      decoyWeightBase: this.config.decoyCount,
      maxCorrectOnScreen: this.config.maxCorrectOnScreen,
      getRemainingTokens: () => this.currentWord.slice(this.pointer).split(""),
      decoyGenerator: () => this.pickDecoyLetter(),
      formatLabel: (letter) => letter.toUpperCase(),
      onPop: (payload) => this.handlePop(payload),
      onMiss: () => {}
    });
    this.running = true;
    this.timeLeft = this.config.timeLimit;
    this.score = 0;
    this.multiplier = 1.0;
    this.wordsCompleted = 0;
    this.nextWord();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    if (!this.running) return;
    this.timeLeft -= 1;
    this.onUpdate(this.getState());
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.end();
    }
  }

  nextWord() {
    if (!this.running) return;
    const picked = pickWord(this.year, this.currentWord);
    if (!picked) {
      this.end();
      return;
    }
    this.currentWord = picked.word;
    this.currentEmoji = picked.emoji;
    this.pointer = 0;
    this.wordMistake = false;
    this.onUpdate(this.getState());
    SpeechBox.speakWord(this.currentWord);
    this.balloonField.start();
  }

  pickDecoyLetter() {
    const wordSet = new Set(this.currentWord.split(""));
    let candidate;
    do {
      candidate = DECOY_LETTER_POOL[Math.floor(Math.random() * DECOY_LETTER_POOL.length)];
    } while (wordSet.has(candidate));
    return candidate;
  }

  // Returns true/false so the balloon's pop animation can be coloured
  // correctly; returns undefined if the pop should be ignored entirely
  // (e.g. the session already ended).
  handlePop({ token, isDecoy }) {
    if (!this.running || this.timeLeft <= 0) return undefined;
    const needed = this.currentWord[this.pointer];
    let correct = false;

    if (!isDecoy && token === needed) {
      correct = true;
      this.pointer += 1;
      this.score += 100;
      SfxBox.correct();
      this.onLetterResult({ correct: true, letter: token, pointer: this.pointer });

      if (this.pointer >= this.currentWord.length) {
        this.completeWord();
        return correct;
      }
    } else {
      this.score -= 100;
      this.wordMistake = true;
      SfxBox.wrong();
      this.onLetterResult({ correct: false, letter: token, pointer: this.pointer });
    }
    this.onUpdate(this.getState());
    return correct;
  }

  completeWord() {
    const bonus = Math.round(300 * this.multiplier);
    this.score += bonus;
    this.wordsCompleted += 1;
    if (!this.wordMistake) {
      this.multiplier += 1.0;
    } else {
      this.multiplier = 1.0;
    }
    SfxBox.wordComplete();
    this.balloonField.stop();
    this.onWordComplete({ word: this.currentWord, bonus, multiplier: this.multiplier, state: this.getState() });
    this.onUpdate(this.getState());

    this.nextWordTimer = setTimeout(() => this.nextWord(), 1300);
  }

  end() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.interval);
    clearTimeout(this.nextWordTimer);
    if (this.balloonField) this.balloonField.stop();
    this.onGameOver(this.getState());
  }

  destroy() {
    this.running = false;
    clearInterval(this.interval);
    clearTimeout(this.nextWordTimer);
    if (this.balloonField) this.balloonField.stop();
  }
}
