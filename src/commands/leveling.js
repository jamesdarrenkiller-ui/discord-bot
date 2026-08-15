const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, User } = require('../database/repository');
const { levelForXp } = require('../systems/leveling');

module.exports = [
  { data:new SlashCommandBuilder().setName('rank').setDescription('Show your or another user rank').addUserOption(o=>o.setName('user').setDescription('User').setRequired(false)), async execute(i){const target=i.options.getUser('user')||i.user,u=await getUser(target.id),level=levelForXp(u.xp),next=(level+1)**2*100;return i.reply({embeds:[new EmbedBuilder().setTitle(`🏆 ${target.tag} Rank`).setThumbnail(target.displayAvatarURL()).addFields({name:'Level',value:String(level),inline:true},{name:'XP',value:`${u.xp}/${next}`,inline:true})]});} },
  { data:new SlashCommandBuilder().setName('levels').setDescription('Show the server XP leaderboard'), async execute(i){const users=await User.find({}).sort({xp:-1}).limit(10);const text=users.length?users.map((u,n)=>`**${n+1}.** <@${u.userId}> — Level **${levelForXp(u.xp)}** (${u.xp} XP)`).join('\n'):'No XP data yet.';return i.reply({embeds:[new EmbedBuilder().setTitle('🏆 XP Leaderboard').setDescription(text)]});} },
];
