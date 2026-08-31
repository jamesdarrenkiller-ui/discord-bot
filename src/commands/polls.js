const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Poll } = require('../database/repository');

const OPTION_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Create a poll')
      .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
      .addStringOption(o => o.setName('options').setDescription('Comma-separated options (2–10)').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes (default: 60)').setMinValue(1).setMaxValue(10080)),
    async execute(i) {
      const question = i.options.getString('question', true);
      const optionsRaw = i.options.getString('options', true).split(',').map(s => s.trim()).filter(Boolean);

      if (optionsRaw.length < 2 || optionsRaw.length > 10) {
        return i.reply({ content: '❌ Provide between 2 and 10 options.', ephemeral: true });
      }

      const minutes = i.options.getInteger('minutes') || 60;
      const endsAt = new Date(Date.now() + minutes * 60000);

      const options = optionsRaw.map((label, idx) => ({
        label,
        emoji: OPTION_EMOJIS[idx],
      }));

      const desc = options.map(o => `${o.emoji} **${o.label}**`).join('\n');
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${question}`)
        .setDescription(desc)
        .setFooter({ text: `Ends in ${minutes}m • React to vote!` })
        .setColor(0xFEE75C);

      const msg = await i.channel.send({ embeds: [embed] });

      for (const opt of options) {
        await msg.react(opt.emoji).catch(() => {});
      }

      await Poll.create({
        guildId: i.guild.id,
        channelId: i.channel.id,
        messageId: msg.id,
        question,
        options,
        authorId: i.user.id,
        endsAt,
      });

      return i.reply({ content: `✅ Poll created! Ends in ${minutes} minute(s).`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('poll-end')
      .setDescription('End a poll early')
      .addStringOption(o => o.setName('message_id').setDescription('Poll message ID').setRequired(true)),
    async execute(i) {
      const messageId = i.options.getString('message_id', true);
      const poll = await Poll.findOne({ messageId, guildId: i.guild.id });
      if (!poll) return i.reply({ content: '❌ Poll not found.', ephemeral: true });
      if (poll.ended) return i.reply({ content: '❌ This poll already ended.', ephemeral: true });

      const channel = i.guild.channels.cache.get(poll.channelId);
      const msg = channel && await channel.messages.fetch(messageId).catch(() => null);

      if (!msg) {
        poll.ended = true;
        await poll.save();
        return i.reply({ content: '❌ Poll message no longer exists.', ephemeral: true });
      }

      const results = [];
      for (const opt of poll.options) {
        const reaction = msg.reactions.cache.get(opt.emoji);
        if (reaction) {
          const users = await reaction.users.fetch();
          const count = users.filter(u => !u.bot).size;
          results.push({ label: opt.label, emoji: opt.emoji, count });
        } else {
          results.push({ label: opt.label, emoji: opt.emoji, count: 0 });
        }
      }

      results.sort((a, b) => b.count - a.count);
      const winner = results[0];
      const total = results.reduce((s, r) => s + r.count, 0);
      const bar = results.map(r => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        const filled = Math.round(pct / 10);
        return `${r.emoji} **${r.label}**: ${r.count} votes (${pct}%)`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${poll.question}`)
        .setDescription(`**Results** — ${total} vote(s)\n\n${bar}\n\n🏆 **Winner: ${winner.label}**`)
        .setColor(0x57F287);

      await msg.edit({ embeds: [embed] });
      poll.ended = true;
      await poll.save();

      return i.reply({ content: `✅ Poll ended. ${winner.label} won with ${winner.count} vote(s).`, ephemeral: true });
    },
  },
];
