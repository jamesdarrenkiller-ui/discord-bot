const { PermissionsBitField } = require('discord.js');
const { getGuild, save } = require('../utils/database');
const { log } = require('../utils/logger');

function registerEvents(client) {
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('/help | Multipurpose Bot');
  });

  client.on('guildMemberAdd', async member => {
    const cfg = getGuild(member.guild.id);
    if (cfg.welcomeChannel) {
      const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
      if (channel) {
        const message = cfg.welcomeMessage
          .replaceAll('{user}', `<@${member.id}>`)
          .replaceAll('{server}', member.guild.name);
        await channel.send(message).catch(() => {});
      }
    }
    save();
    await log(member.guild, 'Member Joined', `${member.user.tag} joined the server.`);
  });

  client.on('guildMemberRemove', member => {
    log(member.guild, 'Member Left', `${member.user?.tag || member.id} left the server.`);
  });

  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;
    const cfg = getGuild(message.guild.id);
    if (!cfg.automod) return;

    const blocked = ['discord.gg/', 'free nitro', 'free-nitro'];
    if (blocked.some(word => message.content.toLowerCase().includes(word)) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await message.delete().catch(() => {});
      const warning = await message.channel.send(`⚠️ ${message.author}, that message was removed by AutoMod.`).catch(() => null);
      if (warning) setTimeout(() => warning.delete().catch(() => {}), 5000);
      await log(message.guild, 'AutoMod', `${message.author.tag}'s message was removed.`);
    }
  });
}

module.exports = { registerEvents };
