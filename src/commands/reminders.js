const { SlashCommandBuilder } = require('discord.js');
const { Reminder } = require('../database/repository');

function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const ms = unit === 's' ? n * 1000 : unit === 'm' ? n * 60000 : unit === 'h' ? n * 3600000 : n * 86400000;
  return ms;
}

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('remind')
      .setDescription('Set a reminder')
      .addStringOption(o => o.setName('time').setDescription('Duration (e.g. 30m, 2h, 1d)').setRequired(true))
      .addStringOption(o => o.setName('text').setDescription('What to remind you about').setRequired(true)),
    async execute(i) {
      const duration = parseDuration(i.options.getString('time', true));
      if (!duration || duration < 10000 || duration > 604800000) {
        return i.reply({ content: '❌ Invalid duration. Use 10s–7d format (e.g. `30m`, `2h`, `1d`).', ephemeral: true });
      }
      const text = i.options.getString('text', true);
      const remindAt = new Date(Date.now() + duration);

      await Reminder.create({
        guildId: i.guild.id,
        channelId: i.channel.id,
        userId: i.user.id,
        text,
        remindAt,
      });

      const secs = Math.round(duration / 1000);
      const timeStr = secs >= 86400 ? `${Math.round(secs / 86400)}d`
        : secs >= 3600 ? `${Math.round(secs / 3600)}h`
        : `${Math.round(secs / 60)}m`;

      return i.reply({ content: `⏰ Reminder set for **${timeStr}** from now: ${text}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('reminders')
      .setDescription('View your active reminders'),
    async execute(i) {
      const reminders = await Reminder.find({
        userId: i.user.id,
        guildId: i.guild.id,
        delivered: false,
      }).sort({ remindAt: 1 });

      if (!reminders.length) return i.reply({ content: '📭 You have no active reminders.', ephemeral: true });

      const lines = reminders.map((r, idx) => {
        const timeLeft = Math.max(0, r.remindAt.getTime() - Date.now());
        const mins = Math.round(timeLeft / 60000);
        const timeStr = mins >= 1440 ? `${Math.round(mins / 1440)}d` : mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;
        return `**${idx + 1}.** ${r.text} — in ${timeStr}`;
      });

      return i.reply({ content: `⏰ **Your Reminders**\n${lines.join('\n')}`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('remind-cancel')
      .setDescription('Cancel a reminder')
      .addIntegerOption(o => o.setName('number').setDescription('Reminder number (from /reminders)').setRequired(true).setMinValue(1)),
    async execute(i) {
      const num = i.options.getInteger('number', true);
      const reminders = await Reminder.find({
        userId: i.user.id,
        guildId: i.guild.id,
        delivered: false,
      }).sort({ remindAt: 1 });

      if (num > reminders.length) return i.reply({ content: '❌ Invalid reminder number.', ephemeral: true });

      const target = reminders[num - 1];
      await Reminder.deleteOne({ _id: target._id });
      return i.reply({ content: `✅ Cancelled reminder: ${target.text}`, ephemeral: true });
    },
  },
];
