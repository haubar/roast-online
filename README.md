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
- 排行榜只保留前 10 名，其餘紀錄會由後端刪除。

## 技術

- HTML / CSS / Vanilla JavaScript
- Netlify
- Netlify Functions
- Supabase PostgreSQL

## 1. 建立 Supabase 資料表

建立 Supabase project，進入 SQL Editor，執行：

`supabase/schema.sql`

## 2. 設定 Netlify

在 Netlify 選擇 **Add new project → Import an existing project → GitHub**，選擇此 repository。

`netlify.toml` 已包含 build 與 Functions 設定，一般不需要額外修改 Build command / Publish directory。

## 3. 設定環境變數

在 Netlify Project configuration → Environment variables 加入：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

這兩個值可在 Supabase project 設定中取得。`SUPABASE_SERVICE_ROLE_KEY` 只能放在 Netlify 環境變數，不可寫進前端或 commit 到 GitHub。

設定後重新 Deploy。

## 本機開發

```bash
npm install
npx netlify dev
```

若要在本機測試排行榜，建立 `.env` 並依 `.env.example` 填入 Supabase 設定。

## 專案結構

```text
.
├── index.html
├── css/style.css
├── js/game.js
├── netlify/functions/
│   ├── _supabase.js
│   ├── leaderboard.js
│   └── submit-score.js
├── supabase/schema.sql
├── netlify.toml
├── package.json
└── .env.example
```

## 排行榜安全性

瀏覽器不直接取得 Supabase service role key。玩家送出的最終總分也不會直接被採信；瀏覽器提交 10 回合的目標時間與實際時間，Netlify Function 會重新計算總分後再寫入排行榜。

此機制適合休閒排行榜，但不是完整的競技級防作弊系統。後續可再加入 server-issued game session、簽章與 rate limit。
