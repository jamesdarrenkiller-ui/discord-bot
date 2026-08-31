const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { StickyMessage } = require('../database/repository');
const { requirePermission } = require('../utils/permissions');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('sticky')
      .setDescription('Set a sticky message that re-posts in this channel')
      .addStringOption(o => o.setName('message').setDescription('Message to make sticky').setRequired(true))
      .addIntegerOption(o => o.setName('interval').setDescription('Post every N messages (default: 10)').setMinValue(3).setMaxValue(100)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageChannels, 'Manage Channels')) return;

      const content = i.options.getString('message', true);
      const interval = i.options.getInteger('interval') || 10;

      const existing = await StickyMessage.findOne({ channelId: i.channel.id });
      if (existing) {
        existing.content = content;
        existing.interval = interval;
        existing.messageCount = 0;
        await existing.save();
        return i.reply({ content: '✅ Sticky message updated.', ephemeral: true });
      }

      await StickyMessage.create({
        guildId: i.guild.id,
        channelId: i.channel.id,
        content,
        interval,
        messageCount: 0,
      });

      return i.reply({ content: '✅ Sticky message set. It will re-post every ' + interval + ' messages.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('unsticky')
      .setDescription('Remove the sticky message from this channel'),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ManageChannels, 'Manage Channels')) return;

      const removed = await StickyMessage.findOneAndDelete({ channelId: i.channel.id });
      if (!removed) return i.reply({ content: '❌ No sticky message in this channel.', ephemeral: true });
      return i.reply({ content: '✅ Sticky message removed.', ephemeral: true });
    },
  },
];
