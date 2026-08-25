const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const { getGuild } = require('../../database/repository');
const { log } = require('../../utils/logger');
const { hasSecurityBypass } = require('../../utils/bypass');

async function checkMemberAdd(member) {
  const cfg = await getGuild(member.guild.id);
  if (!cfg.antiRaid) return;
  const recent = member.guild.members.cache.filter(m => Date.now() - m.joinedTimestamp < 15000).size;
  if (recent >= 8) {
    await log(member.guild, '🚨 Raid Detection', `Rapid join activity detected: ${recent} members joined recently.`);
  }
}

async function checkAudit(guild, type, threshold = 3) {
  const cfg = await getGuild(guild.id);
  if (!cfg.antiNuke) return;
  const entries = await guild.fetchAuditLogs({ type, limit: threshold }).catch(() => null);
  if (!entries) return;
  const now = Date.now();
  const recent = entries.entries.filter(e => now - e.createdTimestamp < 60000);
  const suspicious = recent.filter(e => !hasSecurityBypass(guild, e.executor?.id));
  if (suspicious.length >= threshold) {
    await log(guild, '🚨 Anti-Nuke Alert', `${suspicious.length} rapid audit actions detected for ${type}.`);
  }
}

module.exports = { checkMemberAdd, checkAudit };
