const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { requirePermission } = require('../utils/permissions');
const { save, getWarnings } = require('../utils/database');
const { log } = require('../utils/logger');

module.exports = [
  {
    data: new SlashCommandBuilder().setName('kick').setDescription('Kick a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.KickMembers, 'Kick Members')) return;
      const u=i.options.getUser('user', true); const m=await i.guild.members.fetch(u.id).catch(()=>null); const reason=i.options.getString('reason')||'No reason provided';
      if(!m?.moderatable) return i.reply({content:'❌ I cannot moderate that member.',ephemeral:true});
      await m.kick(reason); await log(i.guild,'Member Kicked',`${u.tag} was kicked by ${i.user.tag}. Reason: ${reason}`); return i.reply(`✅ ${u.tag} has been kicked.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('ban').setDescription('Ban a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.BanMembers, 'Ban Members')) return;
      const u=i.options.getUser('user', true); const m=await i.guild.members.fetch(u.id).catch(()=>null); const reason=i.options.getString('reason')||'No reason provided';
      if(!m?.bannable) return i.reply({content:'❌ I cannot ban that member.',ephemeral:true});
      await m.ban({reason}); await log(i.guild,'Member Banned',`${u.tag} was banned by ${i.user.tag}. Reason: ${reason}`); return i.reply(`✅ ${u.tag} has been banned.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('unban').setDescription('Unban a user').addStringOption(o=>o.setName('user_id').setDescription('User ID').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.BanMembers, 'Ban Members')) return;
      const id=i.options.getString('user_id', true); await i.guild.members.unban(id); return i.reply(`✅ <@${id}> has been unbanned.`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addIntegerOption(o=>o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(40320)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ModerateMembers, 'Moderate Members')) return;
      const u=i.options.getUser('user', true); const m=await i.guild.members.fetch(u.id).catch(()=>null); const min=i.options.getInteger('minutes', true);
      if(!m?.moderatable) return i.reply({content:'❌ I cannot timeout that member.',ephemeral:true}); await m.timeout(min*60000,`By ${i.user.tag}`); return i.reply(`✅ ${u.tag} timed out for ${min} minute(s).`);
    },
  },
  {
    data: new SlashCommandBuilder().setName('untimeout').setDescription('Remove a timeout').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)),
    async execute(i) {
      if (!await requirePermission(i, PermissionsBitField.Flags.ModerateMembers, 'Moderate Members')) return;
      const m=await i.guild.members.fetch(i.options.getUser('user', true).id).catch(()=>null); if(!m?.moderatable)return i.reply({content:'❌ I cannot modify that member.',ephemeral:true}); await m.timeout(null); return i.reply('✅ Timeout removed.');
    },
  },
  {
    data: new SlashCommandBuilder().setName('clear').setDescription('Delete messages').addIntegerOption(o=>o.setName('amount').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(i) { if(!await requirePermission(i, PermissionsBitField.Flags.ManageMessages,'Manage Messages'))return; const n=i.options.getInteger('amount',true); const d=await i.channel.bulkDelete(n,true); return i.reply({content:`🧹 Deleted ${d.size} message(s).`,ephemeral:true}); },
  },
  {
    data: new SlashCommandBuilder().setName('lock').setDescription('Lock this channel'),
    async execute(i) { if(!await requirePermission(i,PermissionsBitField.Flags.ManageChannels,'Manage Channels'))return; await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:false}); return i.reply('🔒 Channel locked.'); },
  },
  {
    data: new SlashCommandBuilder().setName('unlock').setDescription('Unlock this channel'),
    async execute(i) { if(!await requirePermission(i,PermissionsBitField.Flags.ManageChannels,'Manage Channels'))return; await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:true}); return i.reply('🔓 Channel unlocked.'); },
  },
  {
    data: new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode').addIntegerOption(o=>o.setName('seconds').setDescription('0-21600').setRequired(true).setMinValue(0).setMaxValue(21600)),
    async execute(i) { if(!await requirePermission(i,PermissionsBitField.Flags.ManageChannels,'Manage Channels'))return; const s=i.options.getInteger('seconds',true); await i.channel.setRateLimitPerUser(s); return i.reply(`🐌 Slowmode set to ${s}s.`); },
  },
  {
    data: new SlashCommandBuilder().setName('warn').setDescription('Warn a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
    async execute(i) { if(!await requirePermission(i,PermissionsBitField.Flags.ModerateMembers,'Moderate Members'))return; const u=i.options.getUser('user',true); const warnings=getWarnings(i.guild.id,u.id); warnings.push({reason:i.options.getString('reason')||'No reason',by:i.user.id,at:Date.now()}); save(); await log(i.guild,'Member Warned',`${u.tag} was warned by ${i.user.tag}.`); return i.reply(`⚠️ ${u.tag} warned. Total warnings: ${warnings.length}`); },
  },
  {
    data: new SlashCommandBuilder().setName('warnings').setDescription('Show member warnings').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(false)),
    async execute(i) { const u=i.options.getUser('user')||i.user; const warnings=getWarnings(i.guild.id,u.id); const text=warnings.length?warnings.map((w,n)=>`${n+1}. ${w.reason}`).join('\n'):'No warnings.'; return i.reply({content:`⚠️ **${u.tag}**\n${text}`,ephemeral:true}); },
  },
];
