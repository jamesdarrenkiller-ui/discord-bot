const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  { data:new SlashCommandBuilder().setName('8ball').setDescription('Ask the magic 8-ball').addStringOption(o=>o.setName('question').setDescription('Question').setRequired(true)), async execute(i){ const a=['Yes.','No.','Maybe.','Definitely.','Very likely.','Ask again later.','I do not think so.']; return i.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`); } },
  { data:new SlashCommandBuilder().setName('roll').setDescription('Roll dice').addIntegerOption(o=>o.setName('sides').setDescription('Sides').setRequired(false).setMinValue(2).setMaxValue(100)), async execute(i){ const s=i.options.getInteger('sides')||6; return i.reply(`🎲 You rolled **${Math.floor(Math.random()*s)+1}** on a d${s}.`); } },
];
