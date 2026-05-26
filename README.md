# QuantGems 金融資料庫

獨立的台股金融資料查詢系統，連線本機 PostgreSQL（與 QuantGems 主站共用資料庫）。

## 功能

- **資料庫總覽**：各資料表筆數、最新日期、分類統計
- **股票列表**：代號 / 名稱搜尋、市場篩選
- **個股詳情**：股價、PE/PB、報酬率、月營收、三大法人、融資融券、財報
- **資料表瀏覽**：通用分頁查詢（白名單表，唯讀）

## 涵蓋資料表

| 分類 | 資料表 |
|------|--------|
| 行情 | tw_stock_symbols, tw_stock_prices, tw_stock_returns |
| 估值 | tw_stock_bwibbu |
| 財報 | tw_balance_sheet, tw_income_statement, tw_financial_ratios, tw_income_ratios |
| 營收 | tw_monthly_revenue, stock_monthly_revenue, mops_monthly_revenue |
| 資金 | tw_institutional_trades, margin_trades |

## 快速開始

```bash
# 1. 複製環境設定（指向本機 quantgem 資料庫）
cp backend/.env.example backend/.env
# 編輯 backend/.env，填入 DB 密碼（若有的話）

# 2. 安裝依賴
npm install

# 3. 同時啟動前後端
npm run dev
```

- 前端：http://localhost:5180
- 後端 API：http://localhost:3010

## 部署（db.quantgems.com）

### Vercel 设定

1. 推送代码到 GitHub，Vercel 专案 `quantgems-financial-db` 会自动部署
2. **Settings → Environment Variables** 必须设置：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | 生产 PostgreSQL 连线字串（可与主站共用 Neon） |
| `USE_NEON_DB` | `true`（若使用 Neon） |

3. **Settings → Domains** 绑定 `db.quantgems.com`（从主站专案 Move 过来）
4. Cloudflare CNAME：`db` → Vercel 提供的 target（灰云 DNS only）

### 404 排查

若前端能开但控制台显示 **HTTP 404**，代表 API 未部署。确认：
- 根目录有 `vercel.json`（`/api/*` 转发到 `backend/server.js`）
- `backend/server.js` 有 `export default app`
- Vercel 已 Redeploy

重新部署后测试：
```bash
curl https://db.quantgems.com/api/meta/health
# 应回 {"ok":true,"db":"connected",...}
```

## 專案結構

```
quantgems-financial-db/
├── backend/          Express API（唯讀查詢）
├── frontend/         Vue 3 + Vite + ECharts
└── package.json      根目錄 dev 腳本
```

## 環境變數

| 變數 | 說明 | 預設 |
|------|------|------|
| PORT | 後端埠 | 3010 |
| DB_HOST | PostgreSQL 主機 | localhost |
| DB_PORT | 埠 | 5432 |
| DB_USER | 使用者 | postgres |
| DB_PASSWORD | 密碼 | （空） |
| DB_NAME | 資料庫 | quantgem |
| DATABASE_URL | 連線字串（優先） | — |
