import { getStore } from '@netlify/blobs';

export default async () => {
  try {
    const store = getStore('roast-leaderboard');
    const rows = (await store.get('top10', { type: 'json', consistency: 'strong' })) ?? [];
    return Response.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error('leaderboard error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
