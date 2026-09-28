// UI 전용 — 로직은 logic.js, 단어 DB는 words.js.
const state = loadState();
const todayWords = pickTodayWords(state, WORD_DB);
let idx = 0;
let revealed = false;
let shownAt = Date.now();
const clickedIds = [];
const sessionStart = Date.now();

const cardEl = document.getElementById('card');
const phraseEl = document.getElementById('phrase');
const detailEl = document.getElementById('detail');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const speakBtn = document.getElementById('speakBtn');
const progressEl = document.getElementById('progress');
const streakEl = document.getElementById('streak');
const doneScreen = document.getElementById('doneScreen');
const sessionScreen = document.getElementById('sessionScreen');

streakEl.textContent = state.streak > 0 ? `🔥 ${state.streak}일 연속` : '';

function render() {
  const w = todayWords[idx];
  progressEl.textContent = `${idx + 1} / ${todayWords.length}`;
  phraseEl.textContent = w.phrase;
  detailEl.hidden = true;
  nextBtn.hidden = true;
  revealed = false;
  shownAt = Date.now();
}

function reveal() {
  if (revealed) return;
  const w = todayWords[idx];
  document.getElementById('cat').textContent = w.category;
  document.getElementById('pron').textContent = w.pron;
  document.getElementById('example').textContent = w.example;
  detailEl.hidden = false;
  nextBtn.hidden = false;
  revealed = true;
  clickedIds.push(w.id);
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}

function advance() {
  const w = todayWords[idx];
  const dwellSec = (Date.now() - shownAt) / 1000;
  scoreWord(state, w.id, revealed, dwellSec);
  idx += 1;
  if (idx >= todayWords.length) {
    finish();
  } else {
    render();
  }
}

function finish() {
  const durationSec = Math.round((Date.now() - sessionStart) / 1000);
  endSession(state, clickedIds, durationSec);
  saveState(state);
  sessionScreen.hidden = true;
  doneScreen.hidden = false;
  document.getElementById('doneStreak').textContent = state.streak;
}

cardEl.addEventListener('click', reveal);
speakBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  speak(todayWords[idx].phrase);
});
nextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  advance();
});
skipBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  advance();
});

render();
