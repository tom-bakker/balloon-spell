// Drives a single maths session for one level (year + difficulty).
// Mirrors GameSession's flow and scoring rules exactly, but each "prompt"
// is a maths question with one correct answer-token instead of a word
// spelled out letter by letter — so popping the one correct-answer balloon
// completes the question in a single pop.

class MathsGameSession {
  constructor({ year, difficulty, playerName, onUpdate, onQuestionComplete, onLetterResult, onGameOver }) {
    this.year = year;
    this.difficulty = difficulty;
    this.config = DIFFICULTY_CONFIG[difficulty];
    this.playerName = playerName;
    this.onUpdate = onUpdate || (() => {});
    this.onQuestionComplete = onQuestionComplete || (() => {});
    this.onLetterResult = onLetterResult || (() => {});
    this.onGameOver = onGameOver || (() => {});

    this.score = 0;
    this.multiplier = 1.0;
    this.timeLeft = this.config.timeLimit;
    this.questionsCompleted = 0;
    this.currentQuestion = "";
    this.currentSpoken = "";
    this.currentAnswer = "";
    this.pointer = 0; // 0 = unanswered, 1 = solved
    this.mistakeOnQuestion = false;
    this.running = false;
    this.interval = null;
    this.nextQuestionTimer = null;
    this.balloonField = null;
  }

  getState() {
    return {
      score: this.score,
      multiplier: this.multiplier,
      timeLeft: this.timeLeft,
      timeLimit: this.config.timeLimit,
      question: this.currentQuestion,
      answer: this.currentAnswer,
      pointer: this.pointer,
      questionsCompleted: this.questionsCompleted
    };
  }

  start(containerEl) {
    this.balloonField = new BalloonField(containerEl, {
      fallDuration: this.config.fallDuration,
      spawnGap: this.config.spawnGap,
      decoyWeightBase: this.config.decoyCount,
      getRemainingTokens: () => (this.pointer === 0 ? [this.currentAnswer] : []),
      decoyGenerator: () => generateDecoyAnswer(this.currentAnswer),
      formatLabel: (token) => token,
      onPop: (payload) => this.handlePop(payload),
      onMiss: () => {}
    });
    this.running = true;
    this.timeLeft = this.config.timeLimit;
    this.score = 0;
    this.multiplier = 1.0;
    this.questionsCompleted = 0;
    this.nextQuestion();
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

  nextQuestion() {
    if (!this.running) return;
    const q = generateMathsQuestion(this.year, this.difficulty, this.currentQuestion);
    this.currentQuestion = q.question;
    this.currentSpoken = q.spoken;
    this.currentAnswer = q.answer;
    this.pointer = 0;
    this.mistakeOnQuestion = false;
    this.onUpdate(this.getState());
    SpeechBox.speakQuestion(this.currentSpoken);
    this.balloonField.start();
  }

  // Returns true/false so the balloon's pop animation can be coloured
  // correctly; returns undefined if the pop should be ignored entirely.
  handlePop({ token, isDecoy }) {
    if (!this.running || this.timeLeft <= 0) return undefined;
    let correct = false;

    if (!isDecoy && this.pointer === 0 && token === this.currentAnswer) {
      correct = true;
      this.pointer = 1;
      this.score += 100;
      SfxBox.correct();
      this.onLetterResult({ correct: true, letter: token, pointer: this.pointer });
      this.completeQuestion();
      return correct;
    }

    this.score -= 100;
    this.mistakeOnQuestion = true;
    SfxBox.wrong();
    this.onLetterResult({ correct: false, letter: token, pointer: this.pointer });
    this.onUpdate(this.getState());
    return correct;
  }

  completeQuestion() {
    const bonus = Math.round(300 * this.multiplier);
    this.score += bonus;
    this.questionsCompleted += 1;
    if (!this.mistakeOnQuestion) {
      this.multiplier += 1.0;
    } else {
      this.multiplier = 1.0;
    }
    SfxBox.wordComplete();
    this.balloonField.stop();
    this.onQuestionComplete({ question: this.currentQuestion, bonus, multiplier: this.multiplier, state: this.getState() });
    this.onUpdate(this.getState());

    this.nextQuestionTimer = setTimeout(() => this.nextQuestion(), 1300);
  }

  end() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.interval);
    clearTimeout(this.nextQuestionTimer);
    if (this.balloonField) this.balloonField.stop();
    this.onGameOver(this.getState());
  }

  destroy() {
    this.running = false;
    clearInterval(this.interval);
    clearTimeout(this.nextQuestionTimer);
    if (this.balloonField) this.balloonField.stop();
  }
}
