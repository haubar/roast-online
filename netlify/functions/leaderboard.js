const { getStore } = require('@netlify/blobs');

exports.handler = async () => {
  try {
    const store = getStore('roast-leaderboard');
    const rows = (await store.get('top10', { type: 'json', consistency: 'strong' })) || [];

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      body: JSON.stringify(rows.slice(0, 10)),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
