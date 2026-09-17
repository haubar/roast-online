# 🔥 Roast Online 烤肉王

瀏覽器烤肉計時挑戰遊戲。玩家依指定熟度控制烤肉時間，每局 10 回合，依時間誤差計分，完成後可提交全站 Top 10 排行榜。

## 遊戲規則

- 三分熟：6 秒
- 五分熟：9 秒
- 七分熟：12 秒
- 全熟：15 秒
- 越接近目標時間分數越高，每片基礎最高 1000 分。
- 誤差 0.6 秒內可累積 Combo 加分。
- 超過目標 4 秒視為烤焦，該片 0 分。
- 排行榜永遠只儲存前 10 名，10 名外不保留。

## 技術

- HTML / CSS / Vanilla JavaScript
- Netlify
- Netlify Functions
- Netlify Blobs

排行榜使用 Netlify 內建 Blobs，不需要 Supabase、外部資料庫或資料庫環境變數。

## 部署到 Netlify

1. 在 Netlify 選擇 **Add new project → Import an existing project → GitHub**。
2. 選擇 `haubar/roast-online`。
3. `netlify.toml` 已包含 publish 與 Functions 設定，直接 Deploy 即可。
4. 第一次有人送出成績時，Netlify 會自動建立 `roast-leaderboard` Blob store 與 `top10` 資料。

部署後可在 Netlify 專案的 **Data & Storage → Blobs** 查看排行榜資料。

## 本機開發

```bash
npm install
npx netlify dev
```

Netlify Dev 使用本機 sandbox Blob store，因此本機測試資料不會讀取或修改正式站的排行榜。

## 專案結構

```text
.
├── index.html
├── css/style.css
├── js/game.js
├── netlify/functions/
│   ├── leaderboard.js
│   └── submit-score.js
├── netlify.toml
└── package.json
```

## 排行榜資料方式

排行榜使用 `getStore('roast-leaderboard')` 的 site-wide Netlify Blob store，key 為 `top10`，內容只是一個最多 10 筆的 JSON array。每次玩家提交成績，Function 重新計算分數、與既有排行榜合併排序，只把前 10 名寫回 Blob。

寫入時使用 Blob ETag 條件更新，降低多人同時提交成績互相覆蓋的風險。

## 防作弊

玩家送出的最終總分不會直接被採信。瀏覽器只提交 10 回合的目標時間與實際時間，Netlify Function 會依遊戲規則重新計算總分。

目前屬於休閒遊戲等級防作弊；若之後要做正式多人競技，可再加入 server-issued game session、簽章與 rate limit。
