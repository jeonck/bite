// 순수 로직만 담는다 (DOM 접근 없음) — 테스트는 test_logic.js 참고.
const STORAGE_KEY = 'word-loop-state';
const REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const s = JSON.parse(raw);
    return {
      visits: s.visits || [],
      weaknessScores: s.weaknessScores || {},
      lastSeenAt: s.lastSeenAt || {},
      reviewQueue: s.reviewQueue || [],
      streak: s.streak || 0,
    };
  } catch {
    return { visits: [], weaknessScores: {}, lastSeenAt: {}, reviewQueue: [], streak: 0 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 오늘 보여줄 3개 선정: reviewQueue에서 최대 2개(24시간 이내 노출 단어 제외) + 신규 1개, 부족하면 신규/오래된 단어로 채움.
function pickTodayWords(state, wordDb, now = Date.now()) {
  const notCoolingDown = (id) => {
    const seen = state.lastSeenAt[id];
    return !seen || now - seen > REVIEW_COOLDOWN_MS;
  };
  const review = state.reviewQueue.filter(notCoolingDown).slice(0, 2);
  const chosenIds = new Set(review);

  const unseen = wordDb.filter((w) => !state.lastSeenAt[w.id] && !chosenIds.has(w.id));
  const rest = wordDb.filter((w) => !chosenIds.has(w.id) && !unseen.includes(w));

  const fillers = [...unseen, ...rest.sort((a, b) => (state.lastSeenAt[a.id] || 0) - (state.lastSeenAt[b.id] || 0))];

  const ids = [...review];
  for (const w of fillers) {
    if (ids.length >= 3) break;
    if (!chosenIds.has(w.id)) {
      ids.push(w.id);
      chosenIds.add(w.id);
    }
  }
  return ids.map((id) => wordDb.find((w) => w.id === id)).filter(Boolean);
}

// 단어 하나가 끝날 때(스킵 또는 다음으로 넘어갈 때) 약점 점수를 갱신.
function scoreWord(state, wordId, revealed, dwellSec, now = Date.now()) {
  const cur = state.weaknessScores[wordId] || 0;
  let delta = 0;
  if (!revealed) delta = 2;
  else if (dwellSec < 3) delta = 1;
  else if (dwellSec >= 8) delta = -1;
  state.weaknessScores[wordId] = Math.max(0, cur + delta);
  state.lastSeenAt[wordId] = now;
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// 세션 종료 시 1회: 방문 기록 추가, streak 갱신, reviewQueue 재계산. (저장은 호출자가 saveState로)
function endSession(state, clickedIds, durationSec, now = new Date()) {
  const today = todayStr(now);
  const lastVisit = state.visits[state.visits.length - 1];
  if (!lastVisit || lastVisit.date !== today) {
    const yesterday = todayStr(new Date(now.getTime() - 86400000));
    state.streak = lastVisit && lastVisit.date === yesterday ? state.streak + 1 : 1;
  }
  state.visits.push({ date: today, durationSec, clickedIds });

  state.reviewQueue = Object.entries(state.weaknessScores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id));

  return state;
}

if (typeof module !== 'undefined') {
  module.exports = { loadState, saveState, pickTodayWords, scoreWord, todayStr, endSession, STORAGE_KEY, REVIEW_COOLDOWN_MS };
}
