// Word banks and level configuration for Balloon Spell.
// Each year (1-6) has a bank of concrete, illustratable words.
// Difficulty (easy/medium/hard) only changes the *mechanics* (timer,
// balloon speed, number of decoy letters) — the word bank is shared
// across all three difficulties for a given year.

const WORD_BANKS = {
  1: [
    ["cat", "🐱"], ["dog", "🐶"], ["sun", "☀️"], ["hat", "🎩"], ["pig", "🐷"],
    ["bed", "🛏️"], ["cup", "☕"], ["bus", "🚌"], ["fish", "🐟"], ["frog", "🐸"],
    ["bird", "🐦"], ["book", "📖"], ["ball", "⚽"], ["milk", "🥛"], ["star", "⭐"]
  ],
  2: [
    ["tree", "🌳"], ["moon", "🌙"], ["kite", "🪁"], ["snake", "🐍"], ["apple", "🍎"],
    ["house", "🏠"], ["cloud", "☁️"], ["spoon", "🥄"], ["clock", "🕐"], ["plant", "🌱"],
    ["chair", "🪑"], ["whale", "🐳"], ["shark", "🦈"], ["mouse", "🐭"], ["sheep", "🐑"]
  ],
  3: [
    ["rabbit", "🐰"], ["monkey", "🐒"], ["dragon", "🐉"], ["castle", "🏰"], ["garden", "🌷"],
    ["forest", "🌲"], ["rocket", "🚀"], ["guitar", "🎸"], ["pencil", "✏️"], ["orange", "🍊"],
    ["planet", "🪐"], ["bridge", "🌉"], ["turtle", "🐢"], ["wizard", "🧙"], ["dolphin", "🐬"]
  ],
  4: [
    ["dinosaur", "🦕"], ["elephant", "🐘"], ["mountain", "⛰️"], ["treasure", "💰"], ["football", "⚽"],
    ["sandwich", "🥪"], ["umbrella", "☂️"], ["computer", "💻"], ["kangaroo", "🦘"], ["alligator", "🐊"],
    ["penguin", "🐧"], ["volcano", "🌋"], ["triangle", "🔺"], ["calendar", "📅"], ["telephone", "☎️"]
  ],
  5: [
    ["butterfly", "🦋"], ["chocolate", "🍫"], ["astronaut", "🧑‍🚀"], ["basketball", "🏀"], ["strawberry", "🍓"],
    ["helicopter", "🚁"], ["skateboard", "🛹"], ["saxophone", "🎷"], ["binoculars", "🔎"], ["submarine", "🚤"],
    ["watermelon", "🍉"], ["caterpillar", "🐛"], ["mushroom", "🍄"], ["volleyball", "🏐"], ["trumpet", "🎺"]
  ],
  6: [
    ["hippopotamus", "🦛"], ["xylophone", "🎼"], ["refrigerator", "🧊"], ["thermometer", "🌡️"], ["telescope", "🔭"],
    ["dictionary", "📖"], ["kaleidoscope", "🔮"], ["constellation", "✨"], ["grasshopper", "🦗"], ["chimpanzee", "🐵"],
    ["rhinoceros", "🦏"], ["motorcycle", "🏍️"], ["skyscraper", "🏙️"], ["firefighter", "🧑‍🚒"], ["waterfall", "🌊"]
  ]
};

const DIFFICULTIES = ["easy", "medium", "hard"];

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   timeLimit: 120, fallDuration: 9000, decoyCount: 4, spawnGap: 1100, scoreColor: "#6BCB77" },
  medium: { label: "Medium", timeLimit: 90,  fallDuration: 7000, decoyCount: 6, spawnGap: 850,  scoreColor: "#FFD93D" },
  hard:   { label: "Hard",   timeLimit: 60,  fallDuration: 5200, decoyCount: 8, spawnGap: 650,  scoreColor: "#FF6B6B" }
};

const YEARS = [1, 2, 3, 4, 5, 6];

const DECOY_LETTER_POOL = "abcdefghijklmnopqrstuvwxyz".split("");

const AVATAR_PRESETS = ["🦊", "🐼", "🦁", "🐸", "🦄", "🐙", "🐧", "🐨", "🦋", "🐢", "🐳", "🐰"];

function levelKey(year, difficulty, mode) {
  mode = mode || "spelling";
  return mode === "spelling" ? `y${year}_${difficulty}` : `${mode}_y${year}_${difficulty}`;
}

function levelLabel(year, difficulty) {
  return `Year ${year} · ${DIFFICULTY_CONFIG[difficulty].label}`;
}

function getWordBank(year) {
  return WORD_BANKS[year] || [];
}

function pickWord(year, excludeWord) {
  const bank = getWordBank(year);
  if (bank.length === 0) return null;
  let candidates = bank;
  if (excludeWord && bank.length > 1) {
    candidates = bank.filter(([w]) => w !== excludeWord);
  }
  const [word, emoji] = candidates[Math.floor(Math.random() * candidates.length)];
  return { word, emoji };
}
