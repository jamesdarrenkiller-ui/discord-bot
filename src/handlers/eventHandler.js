const { handleMessage } = require('../systems/automod');
const { awardMessageXp } = require('../systems/leveling');
const { memberJoined, memberLeft } = require('../systems/welcome');
const { checkMemberAdd } = require('../systems/security');
const { handlePrefixModeration } = require('../systems/prefixModeration');
const { log } = require('../utils/logger');
const { prefix, botOwnerId } = require('../config');
const { getGuild } = require('../database/repository');

async function isNoPrefix(message) { const cfg=await getGuild(message.guild.id); return cfg.noPrefixUsers.includes(message.author.id); }

function registerEvents(client) {
  client.once('ready', () => { console.log(`Logged in as ${client.user.tag}`); client.user.setActivity(`${prefix}help | All-in-One Bot`); });
  client.on('guildMemberAdd', async member => { await memberJoined(member); await checkMemberAdd(member); await log(member.guild,'Member Joined',`${member.user.tag} joined the server.`); });
  client.on('guildMemberRemove', async member => { await memberLeft(member); await log(member.guild,'Member Left',`${member.user?.tag||member.id} left the server.`); });
  client.on('messageCreate', async message => {
    if(message.author.bot||!message.guild)return;
    await handleMessage(message); await awardMessageXp(message);
    const noPrefix=await isNoPrefix(message),raw=message.content.trim(),usesPrefix=raw.startsWith(prefix); if(!usesPrefix&&!noPrefix)return;
    const body=usesPrefix?raw.slice(prefix.length).trim():raw,args=body.split(/\s+/),commandName=(args.shift()||'').toLowerCase(); if(!commandName)return;
    if(commandName==='help'||commandName==='h') return message.reply(['🤖 **All-in-One Bot — Prefix Help**','',`Prefix: **${prefix}**`,'','🛡️ **Moderation** — `ban`, `kick`, `timeout`, `untimeout`, `warn`, `warnings`, `unwarn`, `warnings-clear`, `clear`, `lock`, `unlock`, `unban`, `softban`, `slowmode`, `nick`, `deafen`, `undeafen`, `voicekick`, `modlogs`','🛡️ **Security** — `automod`, `antilink`, `anticaps`, `antiraid`, `antinuke`','💰 **Economy** — `balance`, `daily`, `weekly`, `work`, `beg`, `pay`, `leaderboard`','🎵 **Music** — `play`, `pause`, `resume`, `skip`, `stop`, `queue`, `volume`, `loop`, `shuffle`, `mode`, `modes`','🎫 **Tickets** — `ticket`','🔧 **Utility** — `ping`, `serverinfo`, `userinfo`, `avatar`, `botinfo`, `uptime`','🧠 **AI** — `ai`'].join('\n'));
    if(commandName==='ping')return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    if(commandName==='prefix')return message.reply(`⚙️ My prefix is **${prefix}**`);
    if(commandName==='noprefix'){
      if(message.author.id!==botOwnerId)return message.reply('❌ Only the bot owner can use this command.'); const sub=(args.shift()||'').toLowerCase(),user=message.mentions.users.first(); if(!['add','remove','list'].includes(sub))return message.reply(`Usage: ${prefix}noprefix <add|remove|list> @user`); const cfg=await getGuild(message.guild.id); if(sub==='list')return message.reply(cfg.noPrefixUsers.length?`🚫 No-prefix users: ${cfg.noPrefixUsers.map(id=>`<@${id}>`).join(', ')}`:'🚫 No no-prefix users configured.'); if(!user)return message.reply(`Usage: ${prefix}noprefix ${sub} @user`); if(user.bot)return message.reply('❌ Bots cannot be added to no-prefix.'); if(sub==='add'){if(!cfg.noPrefixUsers.includes(user.id))cfg.noPrefixUsers.push(user.id);await cfg.save();return message.reply(`✅ ${user} can now use commands without the prefix.`);} cfg.noPrefixUsers=cfg.noPrefixUsers.filter(id=>id!==user.id);await cfg.save();return message.reply(`✅ ${user} no-prefix access removed.`);
    }
    const handled=await handlePrefixModeration(message,commandName,args); if(handled!==false)return handled;
  });
}
module.exports = { registerEvents };
