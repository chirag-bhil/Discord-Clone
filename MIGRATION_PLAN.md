# Migration Plan: SQLite → MongoDB (Prisma)

**Status:** ✅ Complete — data migrated and verified, app switched to MongoDB
**Source DB:** SQLite (`prisma/dev.db`)
**Target DB:** MongoDB 7 (Docker container `mongodb`, `mongodb://localhost:27017/discord-clone`)

## Why this is not a zero-touch swap
1. **ID re-keying.** Prisma-on-MongoDB wants `@db.ObjectId` `_id`s, not UUID strings. Every row ID and every foreign key must be remapped during copy.
2. **Implicit many-to-many is unsupported on Mongo.** The `Member ↔ Role` relation (today Prisma's hidden `_MemberToRole` table) must become an explicit `MemberRole` join model, and the ~6 `include: { roles: true }` call sites updated.

## Data volumes (source snapshot)
| Table | Rows |
|---|---|
| Profile | 4 |
| Server | 6 |
| Member | 11 |
| Channel | 14 |
| Message | 50 |
| Conversation | 7 |
| DirectMessage | 0 |
| Role | 5 |
| _MemberToRole (m2m) | 9 |

> Note: the source is live and mutated by the running app, so a point-in-time copy is taken at migration run. Migration verified Role=5 / m2m=9 at read time (a role deed was deleted by the app between an earlier count and the migration — expected).

## Strategy: keep the working app untouched until the copy is verified
- `prisma/schema.prisma` (SQLite) stays as-is so the running app is unaffected.
- New `prisma/schema.mongo.prisma` generates a **separate** Mongo client into `lib/generated-mongo/`.
- Migration script reads from the existing SQLite client (`lib/generated/`) and writes into the Mongo client.
- Only after data + counts are verified do we swap `schema.prisma` to Mongo and rebuild.

## Phases
- [x] Phase 0 — Safety snapshot (backup `dev.db`, `schema.prisma`) — done
- [x] Phase 1 — Mongo running (Docker `mongodb` container, port 27017) — done
- [x] Phase 2 — Write Mongo schema + generate separate Mongo client (`schema.mongo.prisma`) — done
- [x] Phase 3 — Write migration script — done (`scripts/migrate-sqlite-to-mongo.js`)
- [x] Phase 4 — Run migration, verify per-table counts match source — ✅ ALL OK
- [x] Phase 5 — Swap app code to Mongo (`schema.prisma`), update m2m include call sites — done
- [x] Phase 6 — `prisma validate` + typecheck — ✅; `npm run build` blocked by a PRE-EXISTING unrelated error (`app/(main)/(routes)/page.tsx is not a module`) not caused by this migration
- [x] Phase 7 — Runtime smoke test against Mongo — ✅ (reads + role add/remove inside rollback tx; data unchanged)

## Migration artifacts
- `scripts/migrate-sqlite-to-mongo.js` — re-runnable SQLite→Mongo copy (source pinned to `prisma/dev.db`, target `discord-clone` DB). Usage: `node scripts/migrate-sqlite-to-mongo.js`
- `scripts/smoke-mongo.js` — runtime smoke test (read-only + rollback writes). Usage: `node scripts/smoke-mongo.js`
- `prisma/schema.sqlite.prisma` — archived SQLite schema (client at `lib/generated-sqlite/prisma`)
- `prisma/schema.prisma` — now the MongoDB schema (client at `lib/generated/prisma`, used by the app)

## MongoDB server notes
- Runs in Docker container `mongodb` (`mongo:7`), **single-node replica set** `rs0` on `127.0.0.1:27017` (Prisma requires a replica set).
- Connection string in `.env`: `DATABASE_URL="mongodb://localhost:27017/discord-clone"`.
- Container has `--restart unless-stopped` (auto-starts on boot). To start manually: `docker start mongodb`.
- If the container is ever recreated it MUST include `mongod --replSet rs0` and the member host must stay `127.0.0.1:27017` (already configured).

## Rollback
- `git restore prisma/schema.prisma` — but schema is now Mongo; to go back to SQLite: restore `prisma/schema.prisma.sqlite.bak`, restore `.env` DATABASE_URL to the sqlite file, `npx prisma generate`.
- `prisma/dev.db.pre-mongo.bak` is the untouched source database.

## Rollback
- `git restore prisma/schema.prisma` (SQLite version backed up at `prisma/schema.prisma.sqlite.bak`)
- `prisma/dev.db.pre-mongo.bak` is the untouched source database.