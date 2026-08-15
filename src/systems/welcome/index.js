const { getGuild } = require('../../database/repository');

async function memberJoined(member) {
  const cfg = await getGuild(member.guild.id);
  if (cfg.welcomeChannelId) {
    const channel = member.guild.channels.cache.get(cfg.welcomeChannelId);
    if (channel) {
      const text = cfg.welcomeMessage.replaceAll('{user}', `<@${member.id}>`).replaceAll('{server}', member.guild.name).replaceAll('{count}', String(member.guild.memberCount));
      await channel.send(text).catch(() => {});
    }
  }
  if (cfg.autoRoleId) await member.roles.add(cfg.autoRoleId).catch(() => {});
}

async function memberLeft(member) {
  const cfg = await getGuild(member.guild.id);
  if (!cfg.goodbyeChannelId) return;
  const channel = member.guild.channels.cache.get(cfg.goodbyeChannelId);
  if (channel) await channel.send(`👋 **${member.user?.tag || 'A member'}** left ${member.guild.name}.`).catch(() => {});
}

module.exports = { memberJoined, memberLeft };
