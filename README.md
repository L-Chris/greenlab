# GreenLab

植物重量记录和 Home Assistant 环境数据可视化平台。

## 技术栈

- Next.js App Router + 服务端渲染
- TypeScript + Tailwind CSS
- Prisma + MySQL
- Docker Compose，默认加入 `base_base` 外部网络

## 本地开发

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```

打开 `http://localhost:3000`。

## 数据库

默认数据库名是 `greenlab`，连接方式参考 `/home/projects/mishu/book_search` 的共享 MySQL 容器配置：

```env
DATABASE_URL=mysql://root:123456@shared-mysql:3306/greenlab
```

如果共享 MySQL 没有自动建库，先执行：

```sql
CREATE DATABASE greenlab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Home Assistant 同步

在 `.env` 里配置：

```env
HA_BASE_URL=http://home.home.com
HA_TOKEN=你的 Home Assistant 长期访问令牌
HA_ENTITY_IDS=sensor.temperature_entity,sensor.humidity_entity
```

手动同步：

```bash
npm run sync:ha
```

HTTP 触发同步：

```bash
curl -X POST http://localhost:3000/api/sync/homeassistant \
  -H "x-sync-secret: $SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"from":"2026-04-21T16:00:00Z","to":"2026-04-22T15:59:59Z"}'
```

## Docker 部署

```bash
cp .env.example .env
docker compose up -d --build
```

默认访问 `http://localhost:8096`。`ha-sync` 服务会按 `HA_SYNC_INTERVAL_SECONDS` 周期同步最近 `HA_SYNC_LOOKBACK_HOURS` 小时的 HA 历史数据。
