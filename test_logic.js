// node test_logic.js  — 로직 자가 점검. 프레임워크 없음.
const assert = require('assert');

// logic.js가 브라우저 전역(localStorage)에 의존하므로 최소 스텁을 준비한다.
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = v; },
};

const { pickTodayWords, scoreWord, endSession, todayStr } = require('./logic.js');

const wordDb = [1, 2, 3, 4, 5].map((id) => ({ id, phrase: `w${id}`, category: 'x', pron: 'x', example: 'x' }));

// 1) 첫 방문: 전부 신규이므로 3개, reviewQueue 없음
{
  const state = { visits: [], weaknessScores: {}, lastSeenAt: {}, reviewQueue: [], streak: 0 };
  const picked = pickTodayWords(state, wordDb);
  assert.strictEqual(picked.length, 3);
}

// 2) 스킵(클릭 안 함)은 weaknessScore +2, 24시간 내엔 복습 큐에서 쿨다운
{
  const state = { visits: [], weaknessScores: {}, lastSeenAt: {}, reviewQueue: [], streak: 0 };
  const now = Date.now();
  scoreWord(state, 1, false, 0, now);
  assert.strictEqual(state.weaknessScores[1], 2);
  const picked = pickTodayWords(state, wordDb, now); // reviewQueue는 아직 비어있음(세션 종료 시 계산)
  assert.strictEqual(picked.length, 3);
}

// 3) 체류 8초 이상이면 약점 점수 감소(최저 0)
{
  const state = { visits: [], weaknessScores: { 2: 1 }, lastSeenAt: {}, reviewQueue: [], streak: 0 };
  scoreWord(state, 2, true, 10);
  assert.strictEqual(state.weaknessScores[2], 0);
}

// 4) endSession: 약점 점수 있는 단어만 reviewQueue에 내림차순으로 들어간다
{
  const state = { visits: [], weaknessScores: { 1: 2, 2: 0, 3: 4 }, lastSeenAt: {}, reviewQueue: [], streak: 0 };
  endSession(state, [], 5);
  assert.deepStrictEqual(state.reviewQueue, [3, 1]);
}

// 5) 복습 큐 항목은 24시간 이내 재노출 시 제외된다
{
  const now = Date.now();
  const state = { visits: [], weaknessScores: {}, lastSeenAt: { 1: now - 3600 * 1000 }, reviewQueue: [1], streak: 0 };
  const picked = pickTodayWords(state, wordDb, now);
  assert.ok(!picked.some((w) => w.id === 1), '24시간 이내 노출 단어는 복습 큐에서 제외되어야 함');
}

// 6) streak: 어제 방문 있으면 +1, 아니면 1로 리셋
{
  const state = { visits: [{ date: todayStr(new Date(Date.now() - 86400000)), durationSec: 1, clickedIds: [] }], weaknessScores: {}, lastSeenAt: {}, reviewQueue: [], streak: 3 };
  endSession(state, [], 5);
  assert.strictEqual(state.streak, 4);
}

console.log('OK: all logic checks passed');
