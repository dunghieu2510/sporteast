# Arena: nền tảng thể thao trực tiếp

Monorepo gồm **Next.js 15** (web), **NestJS 11** (API + realtime), **Prisma 6** (PostgreSQL) và **Redis**, quản lý bằng **npm workspaces + Turborepo**.

```
arena/
├── apps/
│   ├── web/        Next.js 15 · Tailwind v4 · giao diện "Stadium Night"       → :3000
│   └── api/        NestJS 11 · REST /api · Socket.IO namespace /live          → :4000
├── packages/
│   ├── db/         Prisma schema, migrations, seed, PrismaClient dùng chung
│   └── types/      Kiểu TypeScript dùng chung (DTO, sự kiện realtime)
├── docker-compose.yml   Postgres 16 · Redis 7 · Adminer (:8080)
└── turbo.json
```

## Yêu cầu

- Node.js ≥ 20 (đã thử với Node 24)
- Docker Desktop (để chạy Postgres + Redis)

## Bắt đầu

```bash
cp .env.example .env
npm install
npm run db:up        # khởi động Postgres + Redis
npm run db:migrate   # tạo bảng (lần đầu sẽ hỏi tên migration, ví dụ: init)
npm run db:seed      # dữ liệu mẫu
npm run dev          # chạy web + api cùng lúc
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health
- Adminer: http://localhost:8080 (server `postgres`, user/pass `arena`)

> Nếu API chưa chạy, web tự dùng dữ liệu mẫu trong `apps/web/lib/mock.ts` và hiện thông báo, nên vẫn làm giao diện được khi chưa có Docker.

## API hiện có

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/health` | Trạng thái DB + Redis |
| GET | `/api/leagues` | Danh sách giải (NBA, NFL, NHL, MMA) |
| GET | `/api/matches?status=LIVE&league=nba&limit=50` | Danh sách trận (cache Redis 10–60s) |
| GET | `/api/matches/:slug` | Chi tiết trận + diễn biến + stream |
| GET | `/api/teams/:slug` | Thông tin đội + trận gần đây |

**Realtime** (`ws://localhost:4000/live`): `match:join`, `chat:join`, `chat:send` → nhận `match:update`, `match:event`, `chat:message`, `viewers:count`.

## Scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy toàn bộ ở chế độ dev |
| `npm run build` | Build tất cả |
| `npm run typecheck` | Kiểm tra kiểu |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run db:down` | Tắt container |

## Dữ liệu mẫu

Fixtures dùng chung nằm ở [packages/types/src/fixtures.ts](packages/types/src/fixtures.ts). Cả `db:seed` lẫn dữ liệu fallback của web đều đọc từ file này. Thời gian trận tính lệch so với "bây giờ", nên chạy lại `npm run db:seed` sẽ làm mới lịch.

> Trên Windows, hãy tắt API trước khi chạy `npm run build` hoặc `db:generate`, vì API đang chạy sẽ giữ khóa file engine của Prisma (lỗi `EPERM`).

## Nguồn nội dung

Schema giới hạn `Stream.contentSource` ở các nguồn hợp pháp: `UGC` (creator tự phát), `OFFICIAL_EMBED` (kênh chính thức) và `LICENSED`. Ngoài ra có sẵn bảng `DmcaRequest` để xử lý yêu cầu gỡ nội dung.

## Bước tiếp theo

- [ ] Auth (Better Auth / Auth.js) + phân quyền
- [ ] Player HLS (hls.js / Vidstack) + tích hợp Mux / AWS IVS
- [ ] Chat realtime phía client + lưu `ChatMessage` + rate limit
- [ ] Worker BullMQ đồng bộ dữ liệu từ API-Football / TheSportsDB
- [ ] Match Pulse, multi-view, reactions, PWA
