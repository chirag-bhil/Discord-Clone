# Discord Clone — Project, Demo, and Viva Guide

This guide explains the project as it currently exists: how to run it, how the main features work, where data is stored, and how to answer common presentation questions.

> Never show `.env` during a presentation. It contains private Clerk, database, and UploadThing credentials.

## 1. One-minute explanation

This is a Discord-style communication application built with Next.js. Users authenticate through Clerk, create or join servers, communicate in server channels, and send personal messages to other members. MongoDB stores application data, Prisma provides typed database access, Docker runs MongoDB locally, UploadThing stores uploaded files, and Socket.IO delivers realtime chat updates.

There are two chat modes:

- Server channels: messages belong to a channel inside a server.
- Personal conversations: messages belong to a conversation between two server members.

The browser reads message history through REST API routes and receives new messages, edits, and deletions through Socket.IO. The sender also updates the local React Query cache immediately, so a sent reply does not require a page reload.

## 2. Technology stack

| Area | Technology | Purpose |
| --- | --- | --- |
| UI/routing | Next.js 15 App Router | Pages, layouts, server components, API routes |
| Language | TypeScript | Type safety across UI, APIs, and database calls |
| UI | React 19, Tailwind CSS, Radix UI, Lucide | Components, styling, accessibility primitives, icons |
| Authentication | Clerk | Sign-up, sign-in, sessions, identity, user management |
| Database | MongoDB 7 | Persistent document database |
| Local database runtime | Docker | Reproducible local MongoDB container |
| Database access | Prisma 6 | Schema, generated client, relations, typed queries |
| Uploads | UploadThing | Image/PDF storage and hosted URLs |
| Realtime | Socket.IO | Live message, edit, and delete events |
| Client cache | TanStack React Query | Message history, pagination, optimistic/cache updates |
| Client state | Zustand | Active modal and modal data |

## 3. High-level architecture

```text
Browser (React client components)
        |
        | Clerk session cookie
        v
Next.js pages/layouts and server components
        |
        +--> Clerk middleware + server auth helpers
        |
        +--> REST routes under app/api
        |       |
        |       +--> Prisma generated client --> MongoDB in Docker
        |
        +--> Pages API Socket.IO routes
                |
                +--> save to MongoDB
                +--> emit chat:<id>:messages events

UploadThing stores binary files separately; MongoDB stores their URLs.
```

## 4. Launch instructions

### Prerequisites

- Node.js and npm.
- Docker running.
- A configured `.env` file.
- The `mongodb` container initialized as a single-node replica set.

### Normal startup

```bash
npm install
docker start mongodb
npm run dev
```

Open `http://localhost:3000`.

The dev server can be stopped with `Ctrl+C`. If port 3000 is busy:

```bash
npm run dev -- --port 3001
```

### Verify before the demo

```bash
docker ps
docker exec mongodb mongosh --quiet --eval 'rs.status().members.map(m => ({name:m.name,state:m.stateStr}))'
node scripts/smoke-mongo.js
```

The smoke test reads the main collections and tests a role add/remove inside a transaction that is deliberately rolled back. It should finish with `SMOKE TEST PASSED` and leave data unchanged.

### Build checks

```bash
npx tsc --noEmit
npm run lint -- --quiet
npm run build
```

The build may print existing unused-variable and hook-dependency warnings. Those are warnings; the successful build is the important result.

## 5. Recommended presentation flow

1. Start MongoDB and the Next.js app.
2. Sign up/sign in with Clerk.
3. Explain that the first authenticated visit creates a local `Profile` linked to the Clerk user ID.
4. Create a server with a name and image.
5. Show the automatically created `general` channel and admin membership.
6. Create an invite and join from a second account/browser session.
7. Send a channel message and show it appearing immediately in the other session.
8. Edit and delete a message to demonstrate update events.
9. Click another member and show the personal-message conversation.
10. Create a custom role, choose permissions/colors, and assign it to a member.
11. Toggle light/dark theme and open a dialog to show themed overlays.
12. Upload an image or PDF and explain that MongoDB stores the URL.
13. Open MongoDB and show a `Server`, `Message`, `Role`, or `DirectMessage` document.

If time is short, demonstrate sign-in, server creation, realtime messaging in two sessions, a personal message, and one MongoDB document.

## 6. Authentication and Clerk

### What is Clerk?

Clerk is an external identity and authentication service. It handles account creation, sign-in UI, session cookies, identity verification, and user management. This project does not store user passwords.

### Where it is integrated

- `app/layout.tsx` wraps the app in `ClerkProvider`.
- The sign-in route renders Clerk's `SignIn` component.
- The sign-up route renders Clerk's `SignUp` component.
- `middleware.ts` runs `clerkMiddleware()` and supplies authentication context.
- `lib/current-profile.ts` uses server-side `auth()`.
- `lib/current-profile-pages.ts` uses `getAuth(req)` for Pages API/Socket.IO routes.

### Clerk user versus local profile

Clerk supplies an external `userId`. The application stores that value in `Profile.userId`:

```text
Clerk user userId  --->  Profile.userId  --->  Server/Member/Channel records
```

`initialProfile()` does the first-login setup:

1. Get the current Clerk user.
2. Redirect unauthenticated users to `/sign-in`.
3. Find a local profile by `userId`.
4. Create one with the Clerk name, image, and email if missing.

### Important environment variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: browser-safe Clerk instance identifier.
- `CLERK_SECRET_KEY`: server-only secret; never expose it.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: auth paths.
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: post-auth paths.

### Strong presentation answer

Authentication context is installed by Clerk middleware, and every important server page/API checks the current profile. Channel APIs verify server membership; personal-message APIs verify conversation participation. Knowing a MongoDB ID is not enough to access another user's data.

## 7. MongoDB and Docker

### What is MongoDB?

MongoDB is a document-oriented NoSQL database. It stores JSON-like BSON documents inside collections instead of SQL rows inside tables.

| SQL term | MongoDB term |
| --- | --- |
| Table | Collection |
| Row | Document |
| Column | Field |
| Foreign key | Referenced ObjectId field |

### Where is the data?

MongoDB runs in the Docker container named `mongodb`. The app uses:

```text
mongodb://localhost:27017/discord-clone
```

The container uses a persistent Docker volume named `mongodb_data`, so stopping the container does not remove the data. Its effective configuration is:

```text
image: mongo:7
command: mongod --replSet rs0
port: 27017 -> 27017
database: discord-clone
```

### Why a replica set for one local MongoDB server?

Prisma transactions on MongoDB require replica-set support. `rs0` is a single-node replica set: still one local server, but with the transaction capabilities Prisma expects.

### Project collections

The active schema is `prisma/schema.prisma`, backed by the generated client in `lib/generated/prisma`.

- `Profile`: local user profile linked to Clerk.
- `Server`: a Discord-style server/community.
- `Member`: profile membership in a server and built-in `ADMIN`, `MODERATOR`, or `GUEST` role.
- `Channel`: text/audio/video channel.
- `Message`: channel message, optional file URL, deletion flag, timestamps.
- `Conversation`: a two-member personal conversation.
- `DirectMessage`: message in a personal conversation.
- `Role`: custom server role and permission flags.
- `MemberRoleLink`: explicit member-to-custom-role assignment.

### MongoDB IDs

MongoDB uses ObjectId values. Prisma represents them as strings and maps them to `_id`:

```prisma
id String @id @default(auto()) @map("_id") @db.ObjectId
```

The old SQLite migration converted old IDs and foreign-key references to stable ObjectId-compatible values.

### Current sample-data snapshot

Counts change as the app is used. One smoke-test run reported:

| Collection | Documents |
| --- | ---: |
| Profile | 4 |
| Server | 6 |
| Member | 11 |
| Channel | 14 |
| Message | 50 |
| Conversation | 7 |
| DirectMessage | 0 |
| Role | 6 |
| MemberRoleLink | 4 |

## 8. Docker and MongoDB commands

### Container lifecycle

```bash
docker ps
docker ps -a
docker start mongodb
docker stop mongodb
docker restart mongodb
docker logs --tail 100 mongodb
docker logs -f mongodb
```

Do not run `docker rm mongodb` or delete the `mongodb_data` volume during the demo; that can remove the local database.

### Open the Mongo shell

```bash
docker exec -it mongodb mongosh
```

Then:

```javascript
use discord-clone
show collections
db.Server.find().limit(5).pretty()
db.Message.find().sort({ createdAt: -1 }).limit(10).pretty()
```

The generated Mongo client currently uses capitalized singular collection names such as `Server`, `Message`, and `Profile`.

### Useful live-demo queries

```javascript
use discord-clone

// Counts
db.Profile.countDocuments()
db.Server.countDocuments()
db.Member.countDocuments()
db.Channel.countDocuments()
db.Message.countDocuments()
db.DirectMessage.countDocuments()
db.Role.countDocuments()

// Servers and profiles
db.Server.find({}, { name: 1, imageUrl: 1, profileId: 1 }).pretty()
db.Profile.find({}, { name: 1, email: 1, userId: 1 }).pretty()

// Newest messages
db.Message.find({}, { content: 1, memberId: 1, channelId: 1, createdAt: 1, deleted: 1 })
  .sort({ createdAt: -1 }).limit(10).pretty()

// Personal messages and role assignments
db.Conversation.find().pretty()
db.DirectMessage.find().sort({ createdAt: -1 }).limit(10).pretty()
db.Role.find().pretty()
db.MemberRoleLink.find().pretty()
```

MongoDB Compass can connect with:

```text
mongodb://127.0.0.1:27017/?replicaSet=rs0
```

Select the `discord-clone` database.

## 9. What Prisma does

Prisma is not the database. It is the typed data-access layer between Next.js and MongoDB.

It provides:

1. A schema describing models, relations, indexes, and defaults.
2. A generated TypeScript client in `lib/generated/prisma`.
3. Type-safe queries such as `db.server.findUnique(...)` and `db.message.create(...)`.
4. Relation loading with `include`.
5. Transaction support.
6. Validation and generation tools.

Example:

```ts
const messages = await db.message.findMany({
  where: { channelId },
  take: 10,
  orderBy: { createdAt: "desc" },
  include: { member: { include: { profile: true } } },
});
```

`lib/db.ts` exports one shared Prisma client. In development it is kept on `globalThis` so hot reload does not create a new database client on every reload.

Useful commands:

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

`npx prisma db push --schema prisma/schema.prisma` can apply schema changes to MongoDB; use it deliberately and back up important data first.

## 10. Why `MemberRoleLink` exists

A member can have several custom roles, and a custom role can be assigned to several members. That is a many-to-many relationship:

```text
Member 1 ---- many MemberRoleLink many ---- 1 Role
```

MongoDB does not support Prisma's original implicit many-to-many relation in the same way as SQLite, so the project uses an explicit join document with a unique `(memberId, roleId)` constraint.

There are two permission layers:

- `Member.role`: built-in `ADMIN`, `MODERATOR`, or `GUEST`, used by basic moderation checks.
- `Role` + `MemberRoleLink`: custom visual roles and flags such as `canManageRoles`, `canSendMessages`, and `canAttachFiles`.

The role UI supports creating, editing, deleting, assigning, and removing custom roles, including name, color, gradient/glow effects, icon, and permission flags.

## 11. Server and channel flow

### Creating a server

`POST /api/servers`:

1. Reads the authenticated local profile.
2. Receives `name` and `imageUrl`.
3. Creates the server with a unique invite code.
4. Creates a `general` text channel.
5. Creates the creator as an `ADMIN` member.

Prisma nested writes create these related records together.

### Joining with an invite

The route `/invite/[inviteCode]` checks the authenticated profile, avoids duplicate membership, adds a `Member`, and redirects to the server.

### Loading a server

The server layout verifies that the current profile belongs to the requested server before rendering the server sidebar. The sidebar loads channels and members, groups channels by type, and provides member/channel search.

## 12. Channel-message flow

### Read history

The client calls `GET /api/messages?channelId=...`. The API:

1. Gets the current profile.
2. Verifies membership in the server that owns the channel.
3. Returns 10 messages at a time, newest first.
4. Includes member, profile, and custom-role data.
5. Returns a cursor for older pages.

### Send a message

The client posts to `POST /api/socket/messages?serverId=...&channelId=...`.

The API authenticates, checks server/channel membership, creates the message in MongoDB, loads the response shape, emits `chat:<channelId>:messages`, and returns the created message.

### Why replies appear immediately

The sender inserts the returned HTTP response into the React Query cache immediately. Socket.IO updates other clients. Socket handlers deduplicate by message ID, so HTTP and socket delivery do not display a duplicate.

### Edit and delete

`pages/api/socket/messages/[messageId].ts` handles PATCH and DELETE. It checks author/moderator/admin rules, performs a soft delete by changing the content and setting `deleted: true`, and emits `chat:<channelId>:messages:update`.

## 13. Personal-message flow

```text
Member + Member --> Conversation --> DirectMessage[]
```

The page is `/servers/[serverId]/conversations/[memberId]`. It verifies that both members belong to the same server, then finds or creates the conversation. Both member orderings are checked so A → B and B → A reuse one conversation.

Endpoints:

- `GET /api/direct-messages?conversationId=...`
- `POST /api/socket/direct-messages?conversationId=...`
- `PATCH /api/socket/direct-messages/[directMessageId]?conversationId=...`
- `DELETE /api/socket/direct-messages/[directMessageId]?conversationId=...`

Every personal-message read/write verifies that the current profile is one of the two participants.

## 14. Socket.IO and realtime updates

`pages/api/socket/io.ts` creates one Socket.IO server on the Next.js HTTP server and stores it at `res.socket.server.io`. This avoids constructing a new realtime server per request.

The browser connects to `/api/socket/io`. These hooks implement chat updates:

- `hooks/use-chat-query.ts`: paginated REST history.
- `hooks/use-chat-socket.ts`: subscriptions and cache changes.

Normal flow:

```text
POST message
   |
   +--> write MongoDB
   +--> return HTTP response to sender
   +--> emit Socket.IO event to connected clients
   +--> update React Query caches
```

If the socket disconnects, history still works through REST and a slower five-second fallback poll runs until realtime reconnects.

## 15. File and image uploads

UploadThing stores the binary file. MongoDB stores only the returned URL.

### Server image endpoint

- Endpoint name: `serverImage`.
- Images only.
- Maximum one file.
- Maximum size 4 MB.
- URL is stored in `Server.imageUrl`.

### Message file endpoint

- Endpoint name: `messageFile`.
- Images and PDFs.
- URL is stored in `Message.fileUrl` or `DirectMessage.fileUrl`.

Important files:

- `components/file-upload.tsx`: client preview and upload UI.
- `lib/uploadthing.ts`: typed UploadThing components.
- `app/api/uploadthing/core.ts`: endpoint limits, auth middleware, completion callbacks.
- `app/api/uploadthing/route.ts`: UploadThing route handler.

Security note: the current demo upload helper falls back to an `anonymous` metadata value when Clerk auth is unavailable. That prevents the demo UI from crashing, but a production version should reject unauthenticated uploads instead.

## 16. Theme and UI structure

- `next-themes` stores the selected theme under `discord-clone-theme`.
- The theme is applied through a CSS class.
- `app/globals.css` defines semantic colors for background, foreground, card, popover, muted, accent, primary, border, input, and ring.
- Dialogs, popovers, role forms, menus, and overlays use semantic tokens so dark mode also applies to them.
- The layout is responsive: navigation rail, server sidebar, channel/member sections, mobile controls, and chat area.

## 17. Project structure

```text
app/
  page.tsx                         authenticated entry point
  layout.tsx                       root HTML, Clerk, theme
  (auth)/                          sign-in/sign-up routes
  (main)/                          authenticated server routes/providers
  (invite)/                        invite-code route
  api/                             App Router REST endpoints

components/
  chat/                            header, input, messages, message items
  server/                          server/sidebar/channel/member UI
  models/                          dialogs and role-management UI
  provider/                        theme/query/socket/modal providers

lib/
  db.ts                            shared Prisma client
  current-profile.ts               App Router profile lookup
  current-profile-pages.ts         Pages API profile lookup
  initial-profile.ts               first-login profile creation
  conversation.ts                  find/create personal conversation

pages/api/socket/
  io.ts                            Socket.IO initialization
  messages/                        channel message create/update/delete
  direct-messages/                 personal message create/update/delete

prisma/
  schema.prisma                    active MongoDB schema
  dev.db                           old SQLite artifact
  *.bak / schema.sqlite.prisma     migration backups

scripts/
  migrate-sqlite-to-mongo.js       SQLite to Mongo migration
  smoke-mongo.js                   read + rollback verification
```

## 18. SQLite-to-MongoDB migration history

The project originally used SQLite. The migration:

1. Backed up the SQLite database and schema.
2. Created a Mongo schema and generated client.
3. Read profiles, servers, members, channels, messages, conversations, roles, and role links from SQLite.
4. Converted IDs and foreign-key references to Mongo ObjectId-compatible values.
5. Replaced implicit member-role many-to-many data with `MemberRoleLink`.
6. Copied data and verified collection counts.
7. Switched the active app client to MongoDB.
8. Ran a smoke test including a transaction that rolls back role changes.

Migration artifacts remain for rollback/audit:

- `prisma/dev.db.pre-mongo.bak`
- `prisma/schema.prisma.sqlite.bak`
- `prisma/schema.sqlite.prisma`
- `lib/generated-sqlite`
- `lib/generated-mongo`

The active application uses MongoDB. The SQLite files are historical backups, not active runtime storage.

## 19. Common professor questions

### Why MongoDB instead of SQL?

MongoDB is a document database suited to evolving chat data. Prisma gives us typed relations and a disciplined schema while MongoDB provides the storage engine.

### Is MongoDB inside Next.js?

No. It is a separate Docker container. Next.js connects through `DATABASE_URL` on port 27017.

### What does Docker add?

Docker packages MongoDB and its replica-set configuration so the project uses the same database version and setup on the development machine.

### Where are passwords stored?

They are not stored by this application. Clerk manages authentication and sessions. The app stores a local profile linked to Clerk's user ID.

### Does the browser write directly to MongoDB?

No. The browser calls a Next.js API endpoint. The server authenticates and authorizes the request, Prisma writes MongoDB, and Socket.IO broadcasts the result.

### How do you prevent cross-server data access?

The channel API verifies membership in the server owning the channel. Personal-message APIs verify that the current profile participates in the conversation. IDs alone are not authorization.

### Why both App Router and Pages API routes?

Normal REST operations use modern App Router handlers under `app/api`. Socket.IO uses Pages API because it needs access to the underlying Node HTTP server at `res.socket.server`.

### How does realtime work?

The server saves the message and emits a named Socket.IO event. Clients listen to the event and update their React Query cache. The sender also applies the HTTP response optimistically.

### What happens if Socket.IO disconnects?

REST history still works, and a slower five-second polling fallback runs until the socket reconnects.

### How are files stored?

UploadThing stores the binary file and returns a hosted URL. MongoDB stores only that URL in `imageUrl` or `fileUrl`.

### How are roles stored?

Built-in moderation uses `Member.role`. Custom roles live in `Role`, and assignments live in `MemberRoleLink`.

### What does Prisma generate?

It generates a TypeScript client from the schema, providing autocomplete, type checking, relation queries, and database operations.

### What is server-side versus client-side?

Server components/pages perform authentication checks and database reads. Client components handle forms, dialogs, theme toggles, chat input, cache updates, and Socket.IO subscriptions.

### How is pagination implemented?

The message APIs return batches of 10 and a cursor based on the last message ID. React Query can request older pages without loading the complete conversation.

### What was optimized?

Socket, React Query, and modal providers were moved out of public/auth pages. React Query uses a short stale cache and avoids focus refetch. Disconnected polling was reduced from one second to five seconds. Next's workspace root was pinned to this project. The modal provider keeps a stable render structure to avoid hook-order problems during development.

## 20. Honest limitations and future work

- Audio/video channel types exist in the model/UI grouping, but WebRTC voice/video is not implemented.
- Custom role permission fields are stored and edited, while some legacy checks still primarily use the built-in `Member.role`. Production work should centralize all permission evaluation.
- UploadThing's anonymous fallback should be replaced with a hard authentication failure in production.
- This is a Discord-inspired clone, not a complete Discord replacement.
- Search is application/server-sidebar search, not a distributed full-text search service.
- Socket.IO expects a long-running Node-compatible server; a serverless deployment would need a separate realtime service or architecture.
- Historical SQLite files remain for migration safety but are not active storage.

## 21. Troubleshooting

### The page keeps loading or redirects slowly

1. Stop and restart the dev server.
2. Confirm `docker ps` shows `mongodb`.
3. Confirm replica-set state: `docker exec mongodb mongosh --quiet --eval 'rs.status().myState'` should print `1`.
4. Confirm Clerk variables exist in `.env` without displaying values.
5. Clear localhost site data or use an incognito window if Clerk has a stale development session.

### Prisma cannot reach MongoDB

```bash
docker start mongodb
docker logs --tail 100 mongodb
node scripts/smoke-mongo.js
```

### Transactions require a replica set

The container must run `mongod --replSet rs0`, and the member host should be `127.0.0.1:27017`.

### Upload fails

Check UploadThing variables, signed-in state, file type/size limits, and network access to UploadThing.

### Messages do not update live

Check that the Next.js process is running, `/api/socket/io` is available, and the browser console has no Socket.IO connection error. The REST endpoint should still work when the socket is disconnected.

## 22. Closing statement

“We built a Discord-style, authenticated, multi-server chat application. Clerk manages identity, MongoDB stores domain data, Prisma provides typed database access, Docker gives us a reproducible local MongoDB environment, UploadThing handles files, and Socket.IO provides realtime updates. Authorization happens on the server, chat history is paginated, messages are cached on the client, and personal conversations reuse the same chat UI as server channels.”
