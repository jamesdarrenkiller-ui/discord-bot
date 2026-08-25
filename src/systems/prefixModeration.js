const { PermissionsBitField } = require('discord.js');
const { addWarning, getWarnings, Warning, getGuild } = require('../database/repository');
const { log } = require('../utils/logger');

const need = (message, permission) => message.member.permissions.has(permission);
const getMember = (message, raw) => { const id = raw?.replace(/[<@!>]/g, ''); return id ? message.guild.members.fetch(id).catch(() => null) : null; };

async function handlePrefixModeration(message, command, args) {
  const reply = text => message.reply(text);
  const m = await getMember(message, args[0]);
  if (['unban'].includes(command)) {
    if (!need(message, PermissionsBitField.Flags.BanMembers)) return reply('❌ You need Ban Members permission.');
    if (!args[0]) return reply('Usage: ?unban <user-id>');
    await message.guild.members.unban(args[0]); return reply('✅ User unbanned.');
  }
  if (['softban'].includes(command)) {
    if (!need(message, PermissionsBitField.Flags.BanMembers)) return reply('❌ You need Ban Members permission.');
    if (!m?.bannable) return reply('❌ I cannot softban that member.');
    const reason = args.slice(1).join(' ') || 'Softban'; await m.ban({ deleteMessageSeconds: 86400, reason }); await message.guild.members.unban(m.id, reason).catch(() => {}); await log(message.guild,'Member Softbanned',`${m.user.tag} by ${message.author.tag}. ${reason}`); return reply(`✅ ${m.user.tag} has been softbanned.`);
  }
  if (['untimeout'].includes(command)) {
    if (!need(message, PermissionsBitField.Flags.ModerateMembers)) return reply('❌ You need Moderate Members permission.');
    if (!m?.moderatable) return reply('❌ I cannot modify that member.'); await m.timeout(null); return reply(`✅ Timeout removed from ${m.user.tag}.`);
  }
  if (['unwarn','warnings-clear','warnings'].includes(command)) {
    if (command !== 'warnings' && !need(message, PermissionsBitField.Flags.ModerateMembers)) return reply('❌ You need Moderate Members permission.');
    if (!m) return reply('❌ Mention a valid member.');
    const warnings = await getWarnings(message.guild.id,m.id);
    if (command === 'warnings') return reply(warnings.length ? `⚠️ ${m.user.tag}\n${warnings.map((w,n)=>`${n+1}. ID: ${w._id} — ${w.reason}`).join('\n')}` : `⚠️ ${m.user.tag} has no warnings.`);
    if (command === 'unwarn') { const id=args[1]; if(!id)return reply('Usage: ?unwarn @user <warning-id>'); const w=await Warning.findOneAndDelete({_id:id,guildId:message.guild.id,userId:m.id}); return reply(w?`✅ Warning removed from ${m.user.tag}.`:'❌ Warning not found.'); }
    const r=await Warning.deleteMany({guildId:message.guild.id,userId:m.id}); return reply(`✅ Cleared ${r.deletedCount} warning(s) from ${m.user.tag}.`);
  }
  if (['slowmode'].includes(command)) { if(!need(message,PermissionsBitField.Flags.ManageChannels))return reply('❌ You need Manage Channels permission.'); const s=Number(args[0]); if(!Number.isInteger(s)||s<0||s>21600)return reply('Usage: ?slowmode <0-21600>'); await message.channel.setRateLimitPerUser(s); return reply(`🐌 Slowmode set to ${s}s.`); }
  if (command === 'nick') { if(!need(message,PermissionsBitField.Flags.ManageNicknames))return reply('❌ You need Manage Nicknames permission.'); if(!m)return reply('Usage: ?nick @user <nickname>'); const n=args.slice(1).join(' '); if(!n)return reply('Usage: ?nick @user <nickname>'); if(!m.moderatable)return reply('❌ I cannot change that nickname.'); await m.setNickname(n,`By ${message.author.tag}`); return reply(`✅ Nickname changed for ${m.user.tag}.`); }
  if (['deafen','undeafen'].includes(command)) { if(!need(message,PermissionsBitField.Flags.DeafenMembers))return reply('❌ You need Deafen Members permission.'); if(!m?.voice.channel)return reply('❌ User is not in voice.'); await m.voice.setDeaf(command==='deafen',`By ${message.author.tag}`); return reply(`✅ ${m.user.tag} ${command==='deafen'?'deafened':'undeafened'}.`); }
  if (command === 'voicekick') { if(!need(message,PermissionsBitField.Flags.MoveMembers))return reply('❌ You need Move Members permission.'); if(!m?.voice.channel)return reply('❌ User is not in voice.'); await m.voice.disconnect(`By ${message.author.tag}`); return reply(`👢 ${m.user.tag} disconnected.`); }
  if (command === 'modlogs') { if(!need(message,PermissionsBitField.Flags.ViewAuditLog))return reply('❌ You need View Audit Log permission.'); if(!m)return reply('Usage: ?modlogs @user'); const warnings=await getWarnings(message.guild.id,m.id); return reply(warnings.length?`📋 ${m.user.tag}\n${warnings.map(w=>`• ${w.reason} — <t:${Math.floor(w.createdAt.getTime()/1000)}:R>`).join('\n')}`:`📋 No stored warnings for ${m.user.tag}.`); }
  if (command === 'antinuke') { if(!need(message,PermissionsBitField.Flags.Administrator))return reply('❌ Administrator permission required.'); const g=await getGuild(message.guild.id); g.antiNuke=!g.antiNuke; await g.save(); return reply(`🛡️ Anti-nuke ${g.antiNuke?'enabled':'disabled'}.`); }
  if (command === 'antiraid') { if(!need(message,PermissionsBitField.Flags.ManageGuild))return reply('❌ Manage Server permission required.'); const g=await getGuild(message.guild.id); g.antiRaid=!g.antiRaid; await g.save(); return reply(`🚨 Anti-raid ${g.antiRaid?'enabled':'disabled'}.`); }
  if (command === 'antilink' || command === 'anticaps' || command === 'automod') { if(!need(message,PermissionsBitField.Flags.ManageGuild))return reply('❌ Manage Server permission required.'); const g=await getGuild(message.guild.id); const key={antilink:'antiLink',anticaps:'antiCaps',automod:'automod'}[command]; g[key]=!g[key]; await g.save(); return reply(`🛡️ ${command} ${g[key]?'enabled':'disabled'}.`); }
  return false;
}
module.exports = { handlePrefixModeration };
