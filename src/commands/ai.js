const { SlashCommandBuilder } = require('discord.js');
const { chat } = require('../services/ai');
const { groqApiKey } = require('../config');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('ai')
      .setDescription('Ask the AI assistant a question')
      .addStringOption(o => o.setName('prompt').setDescription('Your question').setRequired(true))
      .addStringOption(o => o.setName('model').setDescription('AI model (Groq)')
        .addChoices(
          { name: 'Llama 3.3 70B (best)', value: 'llama-3.3-70b-versatile' },
          { name: 'Llama 3.1 8B (fast)', value: 'llama-3.1-8b-instant' },
          { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
        )),
    async execute(i) {
      await i.deferReply();
      const prompt = i.options.getString('prompt', true);
      const model = i.options.getString('model');
      try {
        const answer = await chat([
          { role: 'system', content: 'You are a helpful Discord server assistant. Be concise, friendly and safe. Do not claim to have performed actions you did not perform. Use markdown formatting suitable for Discord.' },
          { role: 'user', content: prompt },
        ], model ? { model } : {});
        return i.editReply(answer.slice(0, 3900));
      } catch (e) {
        return i.editReply(`❌ AI error: ${e.message}`);
      }
    },
  },
];
