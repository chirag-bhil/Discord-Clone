// SQLite -> MongoDB migration script (idempotent-safe: drops existing target collections first).
// CommonJS, run with:  DATABASE_URL_OVERRIDE optional; defaults to mongodb://localhost:27017/discord-clone
// Usage: node scripts/migrate-sqlite-to-mongo.js

const path = require('path');
const SqlitePrisma = require('../lib/generated-sqlite/prisma').PrismaClient;
const MongoPrisma = require('../lib/generated-mongo/prisma').PrismaClient;

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/discord-clone';
// Absolute location of the SQLite source file, independent of the app's .env after the Mongo swap.
const SQLITE_URL = 'file:' + path.resolve(__dirname, '../prisma/dev.db');

// UUID-string -> MongoDB ObjectId string (24 hex chars)
function newObjectId(uuid) {
  // stable, deterministic mapping so re-runs produce identical ids
  const hash = Buffer.from(String(uuid)).toString('hex').slice(0, 24);
  const hex = (hash + '000000000000000000000000000000000000000000000000').slice(0, 24);
  return hex;
}

async function main() {
  const src = new SqlitePrisma({ datasources: { db: { url: SQLITE_URL } } });
  const mongo = new MongoPrisma({ datasources: { db: { url: MONGO_URL } } });

  const idMap = new Map();
  const map = (uuid) => {
    if (!idMap.has(uuid)) idMap.set(uuid, newObjectId(uuid));
    return idMap.get(uuid);
  };

  console.log('Reading source (SQLite)...');

  const profiles = await src.profile.findMany();
  const servers = await src.server.findMany();
  const members = await src.member.findMany();
  const channels = await src.channel.findMany();
  const roles = await src.role.findMany();
  const messages = await src.message.findMany();
  const conversations = await src.conversation.findMany();
  const directMessages = await src.directMessage.findMany();
  // Implicit m2m has no Prisma model; read via raw query.
  const m2m = await src.$queryRawUnsafe('SELECT A as memberId, B as roleId FROM _MemberToRole');

  console.log('Clearing target MongoDB collections...');
  await mongo.profile.deleteMany({});
  await mongo.server.deleteMany({});
  await mongo.member.deleteMany({});
  await mongo.channel.deleteMany({});
  await mongo.role.deleteMany({});
  await mongo.message.deleteMany({});
  await mongo.conversation.deleteMany({});
  await mongo.memberRoleLink.deleteMany({});
  await mongo.directMessage.deleteMany({});

  console.log('Inserting Profile...');
  for (const r of profiles) {
    await mongo.profile.create({
      data: {
        id: map(r.id), userId: r.userId, name: r.name, imageUrl: r.imageUrl, email: r.email,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Server...');
  for (const r of servers) {
    await mongo.server.create({
      data: {
        id: map(r.id), name: r.name, imageUrl: r.imageUrl, inviteCode: r.inviteCode,
        profileId: map(r.profileId), createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Member...');
  for (const r of members) {
    await mongo.member.create({
      data: {
        id: map(r.id), role: r.role, profileId: map(r.profileId), serverId: map(r.serverId),
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Channel...');
  for (const r of channels) {
    await mongo.channel.create({
      data: {
        id: map(r.id), name: r.name, type: r.type, profileId: map(r.profileId), serverId: map(r.serverId),
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Role...');
  for (const r of roles) {
    await mongo.role.create({
      data: {
        id: map(r.id), name: r.name, color: r.color, isGradient: r.isGradient, isGlow: r.isGlow, icon: r.icon,
        canManageServer: r.canManageServer, canManageChannels: r.canManageChannels,
        canManageRoles: r.canManageRoles, canManageMessages: r.canManageMessages,
        canKickMembers: r.canKickMembers, canBanMembers: r.canBanMembers,
        canCreateInvite: r.canCreateInvite, canSendMessages: r.canSendMessages, canAttachFiles: r.canAttachFiles,
        serverId: map(r.serverId), createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Message...');
  for (const r of messages) {
    await mongo.message.create({
      data: {
        id: map(r.id), content: r.content, fileUrl: r.fileUrl ?? null,
        memberId: map(r.memberId), channelId: map(r.channelId), deleted: r.deleted,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  console.log('Inserting Conversation...');
  for (const r of conversations) {
    await mongo.conversation.create({
      data: {
        id: map(r.id), memberOneId: map(r.memberOneId), memberTwoId: map(r.memberTwoId),
      },
    });
  }

  console.log('Inserting MemberRoleLink (explicit m2m)...');
  for (const r of m2m) {
    await mongo.memberRoleLink.create({
      data: { memberId: map(r.memberId), roleId: map(r.roleId) },
    });
  }

  console.log('Inserting DirectMessage...');
  for (const r of directMessages) {
    await mongo.directMessage.create({
      data: {
        id: map(r.id), content: r.content, fileUrl: r.fileUrl ?? null,
        memberId: map(r.memberId), conversationId: map(r.conversationId), deleted: r.deleted,
        createdAt: r.createdAt, updatedAt: r.updatedAt,
      },
    });
  }

  // ---- verification ----
  console.log('\n=== VERIFICATION ===');
  const checks = [
    ['Profile', profiles.length, await mongo.profile.count()],
    ['Server', servers.length, await mongo.server.count()],
    ['Member', members.length, await mongo.member.count()],
    ['Channel', channels.length, await mongo.channel.count()],
    ['Role', roles.length, await mongo.role.count()],
    ['Message', messages.length, await mongo.message.count()],
    ['Conversation', conversations.length, await mongo.conversation.count()],
    ['MemberRoleLink', m2m.length, await mongo.memberRoleLink.count()],
    ['DirectMessage', directMessages.length, await mongo.directMessage.count()],
  ];
  let ok = true;
  for (const [name, a, b] of checks) {
    const match = a === b;
    ok = ok && match;
    console.log(`${name}: source=${a} target=${b} ${match ? 'OK' : 'MISMATCH'}`);
  }

  console.log(ok ? '\nALL COUNTS MATCH.' : '\nSOME COUNTS MISMATCH.');

  await src.$disconnect();
  await mongo.$disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});