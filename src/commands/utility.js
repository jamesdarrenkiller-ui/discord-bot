const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = [
  {
    data: new SlashCommandBuilder().setName('help').setDescription('Show all commands'),
    async execute(interaction) {
      const embed = new EmbedBuilder().setTitle('🤖 Multipurpose Bot').setDescription('All-in-one Discord server management.')
        .addFields(
          { name: '🛡️ Moderation', value: '`/kick` `/ban` `/unban` `/timeout` `/untimeout` `/warn` `/warnings` `/clear` `/lock` `/unlock` `/slowmode`' },
          { name: '🎫 Support', value: '`/ticket` `/close`' },
          { name: '⚙️ Server', value: '`/setlog` `/setwelcome` `/automod`' },
          { name: '💰 Economy', value: '`/balance` `/daily` `/work` `/deposit` `/withdraw` `/pay` `/leaderboard`' },
          { name: '🎉 Fun', value: '`/8ball` `/roll` `/giveaway`' },
          { name: '🔧 Utility', value: '`/ping` `/serverinfo` `/userinfo` `/avatar` `/say`' },
        );
      return interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
    async execute(interaction) { return interaction.reply(`🏓 Pong! ${interaction.client.ws.ping}ms`); },
  },
  {
    data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
    async execute(interaction) {
      const g = interaction.guild;
      const embed = new EmbedBuilder().setTitle(`${g.name} Information`).addFields(
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: `${g.memberCount}`, inline: true },
        { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
      );
      return interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('userinfo').setDescription('Show user information').addUserOption(o => o.setName('user').setDescription('User').setRequired(false)),
    async execute(interaction) {
      const u = interaction.options.getUser('user') || interaction.user;
      const embed = new EmbedBuilder().setTitle(u.tag).setThumbnail(u.displayAvatarURL()).addFields(
        { name: 'ID', value: u.id, inline: true },
        { name: 'Created', value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>`, inline: true },
      );
      return interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder().setName('avatar').setDescription('Show an avatar').addUserOption(o => o.setName('user').setDescription('User').setRequired(false)),
    async execute(interaction) {
      const u = interaction.options.getUser('user') || interaction.user;
      return interaction.reply(u.displayAvatarURL({ size: 1024, extension: 'png' }));
    },
  },
  {
    data: new SlashCommandBuilder().setName('say').setDescription('Send a message').addStringOption(o => o.setName('message').setDescription('Message').setRequired(true)),
    async execute(interaction) {
      const { PermissionsBitField } = require('discord.js');
      const { requirePermission } = require('../utils/permissions');
      if (!await requirePermission(interaction, PermissionsBitField.Flags.ManageMessages, 'Manage Messages')) return;
      return interaction.reply({ content: interaction.options.getString('message'), allowedMentions: { parse: [] } });
    },
  },
];
