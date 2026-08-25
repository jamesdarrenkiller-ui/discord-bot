const { getGuild } = require('../database/repository');

/**
 * Server owner always bypasses security systems.
 * Extra owners and moderators are configured per guild by the real server owner.
 */
async function hasSecurityBypass(guild, userId) {
  if (!guild || !userId) return false;
  if (guild.ownerId === userId) return true;
  const cfg = await getGuild(guild.id);
  return cfg.extraOwners.includes(userId) || cfg.bypassUsers.includes(userId);
}

module.exports = { hasSecurityBypass };
