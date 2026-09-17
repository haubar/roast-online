const { getStore } = require('@netlify/blobs');

const TARGETS = [6, 9, 12, 15];
const MAX = 1000;
const BURN = 4;

function calc(results) {
  if (!Array.isArray(results) || results.length !== 10) throw new Error('無效的遊戲資料');
  let total = 0;
  let combo = 0;

  for (const round of results) {
    const target = Number(round.target);
    const elapsed = Number(round.elapsed);
    if (!TARGETS.includes(target) || !Number.isFinite(elapsed) || elapsed < 0 || elapsed > 60) {
      throw new Error('無效的回合資料');
    }

    const diff = Math.abs(elapsed - target);
    const burnt = elapsed >= target + BURN;
    let points = burnt ? 0 : Math.max(0, Math.round(MAX - diff * 300));
    if (diff <= 0.6 && !burnt) combo += 1;
    else combo = 0;
    if (combo >= 2) points += Math.min(200, (combo - 1) * 40);
    total += points;
  }
  return total;
}

function sortTop10(rows) {
  return rows
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 10);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const name = String(body.name || '').trim().slice(0, 16);
    if (!name) throw new Error('請輸入玩家名稱');

    const score = calc(body.results);
    const store = getStore('roast-leaderboard');
    const current = await store.getWithMetadata('top10', { type: 'json', consistency: 'strong' });
    const rows = Array.isArray(current?.data) ? current.data : [];
    const entry = {
      id: crypto.randomUUID(),
      name,
      score,
      createdAt: new Date().toISOString(),
    };
    const top10 = sortTop10([...rows, entry]);

    // ETag 條件寫入可避免兩個玩家同時送分時直接覆蓋較新的排行榜。
    let result;
    if (current?.etag) {
      result = await store.setJSON('top10', top10, { onlyIfMatch: current.etag });
    } else {
      result = await store.setJSON('top10', top10, { onlyIfNew: true });
    }

    // 若剛好發生競爭寫入，重新讀取最新資料、合併後再嘗試一次。
    if (!result.modified) {
      const latest = await store.getWithMetadata('top10', { type: 'json', consistency: 'strong' });
      const latestRows = Array.isArray(latest?.data) ? latest.data : [];
      const merged = sortTop10([...latestRows.filter((row) => row.id !== entry.id), entry]);
      const retry = await store.setJSON('top10', merged, { onlyIfMatch: latest.etag });
      if (!retry.modified) throw new Error('排行榜正在更新，請再送出一次');
    }

    const finalRows = (await store.get('top10', { type: 'json', consistency: 'strong' })) || [];
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ score, ranked: finalRows.some((row) => row.id === entry.id) }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
