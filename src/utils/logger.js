const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('./database');

async function log(guild, title, description) {
  const channelId = getGuild(guild.id).logChannel;
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;
  await channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp()] }).catch(() => {});
}

module.exports = { log };
