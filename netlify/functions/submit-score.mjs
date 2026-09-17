import { getStore } from '@netlify/blobs';

const TARGETS = [6, 9, 12, 15];
const ROUNDS = 3;
const MAX = 1000;
const BURN = 4;

function calculate(results) {
  if (!Array.isArray(results) || results.length !== ROUNDS) throw new Error('無效的遊戲資料');
  let total = 0;
  let combo = 0;
  for (const item of results) {
    const target = Number(item.target);
    const elapsed = Number(item.elapsed);
    if (!TARGETS.includes(target) || !Number.isFinite(elapsed) || elapsed < 0 || elapsed > 60) throw new Error('無效的回合資料');
    const diff = Math.abs(elapsed - target);
    const burnt = elapsed >= target + BURN;
    let points = burnt ? 0 : Math.max(0, Math.round(MAX - diff * 300));
    combo = diff <= 0.6 && !burnt ? combo + 1 : 0;
    if (combo >= 2) points += Math.min(200, (combo - 1) * 40);
    total += points;
  }
  return total;
}

function normalizeName(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 16);
}

function nameKey(name) {
  return normalizeName(name).toLocaleLowerCase();
}

export default async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await request.json();
    const name = normalizeName(body.name);
    if (!name) throw new Error('請輸入玩家名稱');
    const score = calculate(body.results);
    const store = getStore('roast-leaderboard');
    const current = (await store.get('top10', { type: 'json', consistency: 'strong' })) ?? [];
    const rows = Array.isArray(current) ? current : [];
    const key = nameKey(name);
    const existing = rows.find((x) => nameKey(x.name) === key);

    // 同一名稱排行榜只保留一筆；新成績較高才更新。
    if (existing && Number(existing.score) >= score) {
      return Response.json({ score, ranked: true, updated: false, existingScore: Number(existing.score), message: `「${existing.name}」已在排行榜中，目前最高 ${Number(existing.score).toLocaleString()} 分，本次成績未超越，因此不更新。` });
    }

    const entry = existing
      ? { ...existing, name, score, created_at: new Date().toISOString() }
      : { id: crypto.randomUUID(), name, score, created_at: new Date().toISOString() };

    // 同名舊資料全部移除後再加入新紀錄，可順便清掉歷史上已存在的重複名稱。
    const uniqueByName = new Map();
    for (const row of rows.filter((x) => nameKey(x.name) !== key)) {
      const rowKey = nameKey(row.name);
      const saved = uniqueByName.get(rowKey);
      if (!saved || Number(row.score) > Number(saved.score)) uniqueByName.set(rowKey, row);
    }
    const board = [...uniqueByName.values(), entry]
      .sort((a, b) => Number(b.score) - Number(a.score) || new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 10);

    await store.setJSON('top10', board);
    const ranked = board.some((x) => x.id === entry.id);
    return Response.json({ score, ranked, updated: Boolean(existing), message: existing && ranked ? `已更新「${name}」的最高分！` : undefined });
  } catch (error) {
    console.error('submit-score error', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
};
