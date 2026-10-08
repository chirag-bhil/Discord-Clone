// Runtime smoke test for the Mongo-backed app client (lib/generated/prisma).
// Writes happen inside a transaction that rolls back, so the migrated data stays intact.
const { PrismaClient } = require('../lib/generated/prisma');
const client = new PrismaClient({ datasources: { db: { url: process.env.MONGO_URL || 'mongodb://localhost:27017/discord-clone' } } });

async function main() {
  console.log('profiles:', await client.profile.count());
  console.log('servers:', await client.server.count());
  console.log('members:', await client.member.count());
  console.log('channels:', await client.channel.count());
  console.log('messages:', await client.message.count());
  console.log('memberRoleLinks:', await client.memberRoleLink.count());

  // read: server + members + memberRoles (the shape the UI/APIs need)
  const server = await client.server.findFirst({
    include: {
      channels: true,
      members: { include: { profile: true, memberRoles: { include: { role: true } } }, orderBy: { role: 'asc' } },
    },
  });
  console.log('server:', server?.name, '| channels:', server?.channels.length, '| members:', server?.members.length);
  const m = server?.members[0];
  console.log('first member roles:', (m?.memberRoles ?? []).map((mr) => mr.role.name).join(',') || '(none)');

  // read: messages with member include (chat query shape)
  const msgs = await client.message.findMany({
    take: 2,
    where: { channelId: server?.channels[0]?.id },
    include: { member: { include: { profile: true, memberRoles: { include: { role: true } } } } },
  });
  console.log('messages sample:', msgs.length);

  // write paths (rolled back) — find a member+role pair that isn't already linked
  let member = null;
  let role = null;
  const members = await client.member.findMany({ include: { memberRoles: true } });
  for (const m of members) {
    const r = await client.role.findFirst({ where: { memberLinks: { none: { memberId: m.id } } } });
    if (r) { member = m; role = r; break; }
  }
  if (!member || !role) throw new Error('no unlinked member/role pair found');
  console.log('testing link on member', member.id, '<-> role', role.name);
  try {
    await client.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: member.id },
        data: { memberRoles: { create: { roleId: role.id } } },
      });
      const afterAdd = await tx.member.findUnique({ where: { id: member.id }, include: { memberRoles: { include: { role: true } } } });
      console.log('ROLE ADD ok -> links:', afterAdd.memberRoles.map((mr) => mr.role.name).join(','));
      await tx.member.update({
        where: { id: member.id },
        data: { memberRoles: { deleteMany: { roleId: role.id } } },
      });
      const afterDel = await tx.member.findUnique({ where: { id: member.id }, include: { memberRoles: true } });
      console.log('ROLE DELETE ok -> links:', afterDel.memberRoles.length);
      throw new Error('__rollback__');
    });
  } catch (e) {
    if (e.message !== '__rollback__') throw e;
    console.log('transaction rolled back (data unchanged)');
  }

  const finalLinks = await client.memberRoleLink.count();
  console.log('memberRoleLinks after rollback:', finalLinks);
  console.log('\nSMOKE TEST PASSED');
  await client.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });