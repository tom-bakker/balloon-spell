// Drives a single play session for one level (year + difficulty).

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
      decoyCount: this.config.decoyCount,
      onPop: (payload) => this.handlePop(payload),
      onMiss: () => {},
      getPointer: () => this.pointer
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
    this.balloonField.start(this.currentWord);
  }

  handlePop({ letter, isDecoy }) {
    if (!this.running || this.timeLeft <= 0) return;
    const needed = this.currentWord[this.pointer];

    if (!isDecoy && letter === needed) {
      this.pointer += 1;
      this.score += 100;
      SfxBox.correct();
      this.onLetterResult({ correct: true, letter, pointer: this.pointer });

      if (this.pointer >= this.currentWord.length) {
        this.completeWord();
        return;
      }
    } else {
      this.score -= 100;
      this.wordMistake = true;
      SfxBox.wrong();
      this.onLetterResult({ correct: false, letter, pointer: this.pointer });
    }
    this.onUpdate(this.getState());
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
