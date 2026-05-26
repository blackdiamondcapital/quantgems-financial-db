# db.quantgems.com 迁移检查清单

## 1. Vercel 网域（最重要）

### quantgems-financial-db 专案
- [ ] Domains 有 `db.quantgems.com` → Valid Configuration
- [ ] Root Directory = **留空**（repo 根目录）
- [ ] Output Directory = **dist**
- [ ] Environment Variables 有 `DATABASE_URL`（Neon 连线字串）

### taiwan-stock-returns-quantgems 主站专案
- [ ] Domains **没有** `db.quantgems.com`（已 Remove 或 Move 走）
- [ ] 保留 `www.quantgems.com` / `quantgems.com`

## 2. Cloudflare DNS

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | db | Vercel 提供的 CNAME | 灰云 DNS only |

## 3. 浏览器清缓存（看到旧主站时必做）

旧主站曾绑在 `db.quantgems.com`，浏览器/PWA 可能缓存了 Alpha 引擎。

1. Chrome → `F12` → **Application**
2. **Service Workers** → Unregister 所有 worker
3. **Storage** → Clear site data
4. `chrome://net-internals/#dns` → Clear host cache
5. **Cmd+Shift+R** 硬刷新，或用无痕视窗开 https://db.quantgems.com

正确画面：左侧 sidebar「QuantGems Financial Database」，不是顶部横条「Alpha 引擎」。

## 4. 验证

```bash
# 应回 金融資料庫
curl -sL https://db.quantgems.com/ | grep title

# 应回 {"ok":true,"db":"connected"}
curl -sL https://db.quantgems.com/api/meta/health
```
