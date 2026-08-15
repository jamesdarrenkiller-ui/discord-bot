const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('../database/repository');

async function log(guild, title, description) {
  const cfg = await getGuild(guild.id);
  const channelId = cfg.logChannelId;
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;
  await channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp()] }).catch(() => {});
}

module.exports = { log };
