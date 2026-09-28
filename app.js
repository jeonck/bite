// UI 전용 — 로직은 logic.js, 단어 DB는 words.js.
const state = loadState();
let todayWords = pickTodayWords(state, WORD_DB);
let idx = 0;
let revealed = false;
let shownAt = Date.now();
let clickedIds = [];
let sessionStart = Date.now();

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
const moreBtn = document.getElementById('moreBtn');

streakEl.textContent = state.streak > 0 ? `🔥 ${state.streak}일 연속 학습 중` : '';

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
  document.getElementById('meaning').textContent = `(${w.meaning})`;
  document.getElementById('pron').textContent = w.pron;
  document.getElementById('example').textContent = w.example;
  document.getElementById('exampleMeaning').textContent = `(${w.exampleMeaning})`;
  detailEl.hidden = false;
  nextBtn.hidden = false;
  revealed = true;
  clickedIds.push(w.id);
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  // 모바일 브라우저는 이전 발화가 큐에 걸린 채로 남아 다음 재생을 막는 경우가 많아, 매번 비워주고 시작한다.
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  // Chrome/Edge에만 있는 음성이라, 없으면 기본 en-US 음성으로 자동 대체됨.
  const voice = speechSynthesis.getVoices().find((v) => v.name === 'Google US English');
  if (voice) u.voice = voice;
  if (DEBUG) {
    const s = speechSynthesis;
    debugLog(`▶ "${text}" voice=${voice ? voice.name : '(default)'} voices=${s.getVoices().length} speaking=${s.speaking} pending=${s.pending} paused=${s.paused}`);
    u.onstart = () => debugLog('  start');
    u.onend = () => debugLog('  end');
    u.onerror = (e) => debugLog(`  error: ${e.error}`);
  }
  speechSynthesis.speak(u);
}

// ?debug=1 일 때만 화면 하단에 TTS 상태 로그 표시 (모바일 원인 확인용, 확인 후 제거 예정)
const DEBUG = new URLSearchParams(location.search).has('debug');
function debugLog(msg) {
  let el = document.getElementById('debugLog');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'debugLog';
    el.style.cssText = 'font-size:11px;white-space:pre-wrap;text-align:left;width:100%;max-width:480px;padding:8px 16px;color:#555';
    document.body.appendChild(el);
  }
  el.textContent += `${msg}\n`;
}
if (DEBUG) debugLog(navigator.userAgent);
// 음성 목록은 비동기로 로드되므로 미리 한 번 트리거해둔다(Chrome 계열).
if ('speechSynthesis' in window) speechSynthesis.getVoices();

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
  document.getElementById('doneTotal').textContent = Object.keys(state.lastSeenAt).length;
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
moreBtn.addEventListener('click', () => {
  todayWords = pickTodayWords(state, WORD_DB);
  idx = 0;
  clickedIds = [];
  sessionStart = Date.now();
  doneScreen.hidden = true;
  sessionScreen.hidden = false;
  render();
});

render();
