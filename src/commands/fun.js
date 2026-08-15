const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  { data:new SlashCommandBuilder().setName('8ball').setDescription('Ask the magic 8-ball').addStringOption(o=>o.setName('question').setDescription('Question').setRequired(true)), async execute(i){const a=['Yes.','No.','Maybe.','Definitely.','Very likely.','Ask again later.','I do not think so.'];return i.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`);} },
  { data:new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'), async execute(i){return i.reply(Math.random()<0.5?'🪙 Heads!':'🪙 Tails!');} },
  { data:new SlashCommandBuilder().setName('dice').setDescription('Roll dice').addIntegerOption(o=>o.setName('sides').setDescription('Sides').setMinValue(2).setMaxValue(100)), async execute(i){const s=i.options.getInteger('sides')||6;return i.reply(`🎲 You rolled **${Math.floor(Math.random()*s)+1}** on a d${s}.`);} },
  { data:new SlashCommandBuilder().setName('rps').setDescription('Rock Paper Scissors').addStringOption(o=>o.setName('choice').setDescription('Your choice').setRequired(true).addChoices({name:'Rock',value:'rock'},{name:'Paper',value:'paper'},{name:'Scissors',value:'scissors'})), async execute(i){const user=i.options.getString('choice',true),choices=['rock','paper','scissors'],bot=choices[Math.floor(Math.random()*3)];const win=user===bot?'Draw':((user==='rock'&&bot==='scissors')||(user==='paper'&&bot==='rock')||(user==='scissors'&&bot==='paper')?'You win!':'I win!');return i.reply(`✊ You: **${user}**\n🤖 Me: **${bot}**\n🏆 **${win}**`);} },
];
