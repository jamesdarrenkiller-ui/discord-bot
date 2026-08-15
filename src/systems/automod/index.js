const { PermissionsBitField } = require('discord.js');
const { getGuild } = require('../../database/repository');
const { log } = require('../../utils/logger');

const links = /(https?:\/\/|www\.|discord\.gg\/)/i;

async function handleMessage(message) {
  if (!message.guild || message.author.bot) return;
  const cfg = await getGuild(message.guild.id);
  if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

  const content = message.content || '';
  const caps = content.length >= 12 && content.replace(/[^A-Za-z]/g, '').length >= 8 && content.replace(/[^A-Z]/g, '').length / Math.max(content.replace(/[^A-Za-z]/g, '').length, 1) > 0.75;
  const blocked = (cfg.antiLink && links.test(content)) || (cfg.antiCaps && caps);
  if (!cfg.automod || !blocked) return;

  await message.delete().catch(() => {});
  const warning = await message.channel.send(`⚠️ ${message.author}, your message was removed by AutoMod.`).catch(() => null);
  if (warning) setTimeout(() => warning.delete().catch(() => {}), 5000);
  await log(message.guild, 'AutoMod', `${message.author.tag} triggered AutoMod in ${message.channel}.`);
}

module.exports = { handleMessage };
