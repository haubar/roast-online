import { getStore } from '@netlify/blobs';

const TARGETS = [6, 9, 12, 15];
const MAX = 1000;
const BURN = 4;

function calculate(results) {
  if (!Array.isArray(results) || results.length !== 10) throw new Error('無效的遊戲資料');
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

export default async (request) => {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim().slice(0, 16);
    if (!name) throw new Error('請輸入玩家名稱');
    const score = calculate(body.results);
    const store = getStore('roast-leaderboard');
    const entry = { id: crypto.randomUUID(), name, score, created_at: new Date().toISOString() };

    // 排行榜很小；強一致讀取後只保存 Top 10。
    const current = (await store.get('top10', { type: 'json', consistency: 'strong' })) ?? [];
    const board = [...(Array.isArray(current) ? current : []), entry]
      .sort((a, b) => b.score - a.score || new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 10);

    await store.setJSON('top10', board);
    return Response.json({ score, ranked: board.some((x) => x.id === entry.id) });
  } catch (error) {
    console.error('submit-score error', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
};
