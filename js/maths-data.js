// Procedurally generates maths questions per year level (1-6), scaled by
// difficulty. Every question resolves to a plain numeric (or one-decimal)
// answer string so it can be spawned as a single balloon token, the same
// way the spelling game spawns single letters.

const MATHS_DIFFICULTY_INDEX = { easy: 0, medium: 1, hard: 2 };

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildQuestion(question, spoken, answer) {
  return { question, spoken, answer: String(answer) };
}

function genYear1(d) {
  const max = [5, 8, 10][d];
  const a = randInt(0, max);
  const b = randInt(0, max);
  if (Math.random() < 0.5) {
    return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, a + b);
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return buildQuestion(`${hi} - ${lo} = ?`, `What is ${hi} minus ${lo}?`, hi - lo);
}

function genYear2(d) {
  const max = [20, 50, 100][d];
  const a = randInt(1, max);
  const b = randInt(1, max);
  if (Math.random() < 0.5) {
    return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, a + b);
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return buildQuestion(`${hi} - ${lo} = ?`, `What is ${hi} minus ${lo}?`, hi - lo);
}

function genYear3(d) {
  if (Math.random() < 0.45) {
    const tablesPool = [[2, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 10]][d];
    const table = tablesPool[randInt(0, tablesPool.length - 1)];
    const factor = randInt(1, 10);
    return buildQuestion(`${table} x ${factor} = ?`, `What is ${table} times ${factor}?`, table * factor);
  }
  const max = [100, 300, 500][d];
  const a = randInt(10, max);
  const b = randInt(10, max);
  if (Math.random() < 0.5) {
    return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, a + b);
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return buildQuestion(`${hi} - ${lo} = ?`, `What is ${hi} minus ${lo}?`, hi - lo);
}

function genYear4(d) {
  const roll = Math.random();
  if (roll < 0.35) {
    const table = randInt(2, 12);
    const factor = randInt(2, [8, 10, 12][d]);
    return buildQuestion(`${table} x ${factor} = ?`, `What is ${table} times ${factor}?`, table * factor);
  }
  if (roll < 0.65) {
    const divisor = randInt(2, 12);
    const quotient = randInt(2, [8, 10, 12][d]);
    const dividend = divisor * quotient;
    return buildQuestion(`${dividend} \u00F7 ${divisor} = ?`, `What is ${dividend} divided by ${divisor}?`, quotient);
  }
  const max = [200, 600, 1000][d];
  const a = randInt(50, max);
  const b = randInt(50, max);
  if (Math.random() < 0.5) {
    return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, a + b);
  }
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return buildQuestion(`${hi} - ${lo} = ?`, `What is ${hi} minus ${lo}?`, hi - lo);
}

function genYear5(d) {
  const roll = Math.random();
  if (roll < 0.3) {
    const a = randInt(11, [20, 30, 40][d]);
    const b = randInt(2, 9);
    return buildQuestion(`${a} x ${b} = ?`, `What is ${a} times ${b}?`, a * b);
  }
  if (roll < 0.55) {
    const divisor = randInt(2, 12);
    const quotient = randInt(10, [15, 20, 25][d]);
    const dividend = divisor * quotient;
    return buildQuestion(`${dividend} \u00F7 ${divisor} = ?`, `What is ${dividend} divided by ${divisor}?`, quotient);
  }
  if (roll < 0.8) {
    const denom = [2, 4, 5, 10][randInt(0, 3)];
    const multiplier = randInt(2, [6, 8, 10][d]);
    const number = denom * multiplier;
    return buildQuestion(
      `1/${denom} of ${number} = ?`,
      `What is one over ${denom} of ${number}?`,
      number / denom
    );
  }
  const a = (randInt(10, 99) / 10).toFixed(1);
  const b = (randInt(10, 99) / 10).toFixed(1);
  const sum = (parseFloat(a) + parseFloat(b)).toFixed(1);
  return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, sum);
}

function genYear6(d) {
  const roll = Math.random();
  if (roll < 0.3) {
    const percent = [10, 20, 25, 50][randInt(0, 3)];
    const base = randInt(1, [10, 15, 20][d]);
    const multiplierByPercent = { 10: 10, 20: 5, 25: 4, 50: 2 };
    const number = base * multiplierByPercent[percent];
    return buildQuestion(
      `${percent}% of ${number} = ?`,
      `What is ${percent} percent of ${number}?`,
      (number * percent) / 100
    );
  }
  if (roll < 0.55) {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    const c = randInt(2, 12);
    const variant = randInt(0, 2);
    if (variant === 0) {
      return buildQuestion(`(${a} + ${b}) x ${c} = ?`, `What is ${a} plus ${b}, times ${c}?`, (a + b) * c);
    }
    if (variant === 1) {
      return buildQuestion(`${a} x ${b} + ${c} = ?`, `What is ${a} times ${b}, plus ${c}?`, a * b + c);
    }
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return buildQuestion(`(${hi} - ${lo}) x ${c} = ?`, `What is ${hi} minus ${lo}, times ${c}?`, (hi - lo) * c);
  }
  if (roll < 0.8) {
    const a = (randInt(50, 400) / 10).toFixed(1);
    const b = (randInt(10, 200) / 10).toFixed(1);
    if (Math.random() < 0.5) {
      const sum = (parseFloat(a) + parseFloat(b)).toFixed(1);
      return buildQuestion(`${a} + ${b} = ?`, `What is ${a} plus ${b}?`, sum);
    }
    const hi = Math.max(parseFloat(a), parseFloat(b)).toFixed(1);
    const lo = Math.min(parseFloat(a), parseFloat(b)).toFixed(1);
    const diff = (parseFloat(hi) - parseFloat(lo)).toFixed(1);
    return buildQuestion(`${hi} - ${lo} = ?`, `What is ${hi} minus ${lo}?`, diff);
  }
  const a = randInt(11, [20, 25, 30][d]);
  const b = randInt(11, [15, 18, 20][d]);
  return buildQuestion(`${a} x ${b} = ?`, `What is ${a} times ${b}?`, a * b);
}

const MATHS_GENERATORS = { 1: genYear1, 2: genYear2, 3: genYear3, 4: genYear4, 5: genYear5, 6: genYear6 };

function generateMathsQuestion(year, difficulty, excludeQuestion) {
  const d = MATHS_DIFFICULTY_INDEX[difficulty] != null ? MATHS_DIFFICULTY_INDEX[difficulty] : 0;
  const generator = MATHS_GENERATORS[year] || genYear1;
  let attempt = generator(d);
  let tries = 0;
  while (excludeQuestion && attempt.question === excludeQuestion && tries < 4) {
    attempt = generator(d);
    tries += 1;
  }
  return attempt;
}

// Produces a plausible wrong answer, formatted with the same precision
// (integer vs one-decimal) as the correct answer.
function generateDecoyAnswer(correctAnswerStr) {
  const isDecimal = correctAnswerStr.includes(".");
  const correctNum = parseFloat(correctAnswerStr);
  let candidate;
  let attempts = 0;
  do {
    const spread = Math.max(3, Math.round(Math.abs(correctNum) * 0.3) + 2);
    const offset = randInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    let val = correctNum + offset;
    if (val < 0) val = correctNum + Math.abs(offset);
    candidate = isDecimal ? val.toFixed(1) : String(Math.round(val));
    attempts += 1;
  } while (candidate === correctAnswerStr && attempts < 10);
  return candidate;
}
