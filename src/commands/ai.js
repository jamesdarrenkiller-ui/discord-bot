const { SlashCommandBuilder } = require('discord.js');
const { chat } = require('../services/ai');

module.exports = [
  {
    data: new SlashCommandBuilder().setName('ai').setDescription('Ask the AI server assistant a question').addStringOption(o => o.setName('prompt').setDescription('Your question').setRequired(true)),
    async execute(i) {
      await i.deferReply();
      const prompt = i.options.getString('prompt', true);
      const answer = await chat([
        { role: 'system', content: 'You are a helpful Discord server assistant. Be concise, friendly and safe. Do not claim to have performed actions you did not perform.' },
        { role: 'user', content: prompt },
      ]);
      return i.editReply(answer.slice(0, 3900));
    },
  },
];
