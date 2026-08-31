const { handleMessage } = require('../systems/automod');
const { awardMessageXp } = require('../systems/leveling');
const { memberJoined, memberLeft } = require('../systems/welcome');
const { checkMemberAdd } = require('../systems/security');
const { handlePrefixModeration } = require('../systems/prefixModeration');
const { log } = require('../utils/logger');
const { prefix, botOwnerId } = require('../config');
const { getGuild, getUser, ReactionRole, StickyMessage, User } = require('../database/repository');
const { EmbedBuilder } = require('discord.js');

async function isNoPrefix(message) { const cfg=await getGuild(message.guild.id); return cfg.noPrefixUsers.includes(message.author.id); }

function registerEvents(client) {
  client.once('ready', () => { console.log(`Logged in as ${client.user.tag}`); client.user.setActivity(`${prefix}help | All-in-One Bot`); });

  // Member join/leave
  client.on('guildMemberAdd', async member => {
    await memberJoined(member);
    await checkMemberAdd(member);
    await log(member.guild,'Member Joined',`${member.user.tag} joined the server.`);
  });

  client.on('guildMemberRemove', async member => {
    await memberLeft(member);
    await log(member.guild,'Member Left',`${member.user?.tag||member.id} left the server.`);
  });

  // Advanced logging: voice state changes
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const guild = oldState.guild;
    const cfg = await getGuild(guild.id);
    if (!cfg.logVoiceActivity || !cfg.logChannelId) return;

    const member = newState.member;
    if (!member || member.user.bot) return;

    if (!oldState.channel && newState.channel) {
      await log(guild, '🔊 Voice Join', `${member.user.tag} joined **${newState.channel.name}**`);
    } else if (oldState.channel && !newState.channel) {
      await log(guild, '🔊 Voice Leave', `${member.user.tag} left **${oldState.channel.name}**`);
    } else if (oldState.channel.id !== newState.channel.id) {
      await log(guild, '🔊 Voice Move', `${member.user.tag} moved from **${oldState.channel.name}** to **${newState.channel.name}**`);
    }
  });

  // Advanced logging: role changes
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const guild = oldMember.guild;
    const cfg = await getGuild(guild.id);
    if (!cfg.logRoleChanges || !cfg.logChannelId) return;

    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0) {
      const roleNames = addedRoles.map(r => r.name).join(', ');
      await log(guild, '🎭 Role Added', `${newMember.user.tag} was given **${roleNames}**`);
    }
    if (removedRoles.size > 0) {
      const roleNames = removedRoles.map(r => r.name).join(', ');
      await log(guild, '🎭 Role Removed', `${newMember.user.tag} lost **${roleNames}**`);
    }
  });

  // Advanced logging: message edits and deletes
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const cfg = await getGuild(oldMessage.guild.id);
    if (!cfg.logMessageEdits || !cfg.logChannelId) return;

    const before = oldMessage.content?.slice(0, 500) || '(empty)';
    const after = newMessage.content?.slice(0, 500) || '(empty)';
    await log(oldMessage.guild, '📝 Message Edited',
      `${oldMessage.author.tag} in ${oldMessage.channel}\n\n**Before:** ${before}\n**After:** ${after}`);
  });

  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    const cfg = await getGuild(message.guild.id);
    if (!cfg.logMessageDeletes || !cfg.logChannelId) return;

    const content = message.content?.slice(0, 500) || '(empty or embed)';
    await log(message.guild, '🗑️ Message Deleted',
      `${message.author?.tag || 'Unknown'} in ${message.channel}\n\n**Content:** ${content}`);
  });

  // Message create: AFK clear, automod, XP, sticky, reaction role, prefix commands
  client.on('messageCreate', async message => {
    if(message.author.bot||!message.guild)return;

    // --- AFK auto-clear ---
    const userDoc = await getUser(message.guild.id, message.author.id);
    if (userDoc.afk) {
      userDoc.afk = '';
      userDoc.afkSince = null;
      await userDoc.save();
      message.reply(`👋 Welcome back! Your AFK has been cleared.`).catch(() => {});
    }

    // --- AFK ping notification ---
    const mentionedUsers = [...message.mentions.users.values()];
    for (const mentioned of mentionedUsers) {
      if (mentioned.bot) continue;
      const mentionedDoc = await getUser(message.guild.id, mentioned.id);
      if (mentionedDoc.afk) {
        const since = mentionedDoc.afkSince
          ? `<t:${Math.floor(mentionedDoc.afkSince.getTime() / 1000)}:R>`
          : 'recently';
        message.reply(`💤 **${mentioned.tag}** is AFK: ${mentionedDoc.afk} (since ${since})`).catch(() => {});
      }
    }

    // --- AutoMod ---
    await handleMessage(message);
    // --- XP ---
    await awardMessageXp(message);

    // --- Sticky message counter ---
    const sticky = await StickyMessage.findOne({ channelId: message.channel.id });
    if (sticky) {
      sticky.messageCount += 1;
      if (sticky.messageCount >= sticky.interval) {
        sticky.messageCount = 0;
        await sticky.save();
        await message.channel.send(sticky.content).catch(() => {});
      } else {
        await sticky.save();
      }
    }

    // --- Reaction role self-assign via mention (optional text fallback) ---
    // Reaction roles are handled via reactionAdd/Remove below; this is a no-op placeholder.

    const noPrefix=await isNoPrefix(message),raw=message.content.trim(),usesPrefix=raw.startsWith(prefix); if(!usesPrefix&&!noPrefix)return;
    const body=usesPrefix?raw.slice(prefix.length).trim():raw,args=body.split(/\s+/),commandName=(args.shift()||'').toLowerCase(); if(!commandName)return;

    if(commandName==='help'||commandName==='h') return message.reply(['🤖 **All-in-One Bot — Prefix Help**','',`Prefix: **${prefix}**`,'','🛡️ **Moderation** — `ban`, `kick`, `timeout`, `warn`, `clear`, `lock`','🛡️ **Security** — `automod`, `antilink`, `anticaps`, `antiraid`, `antinuke`','💰 **Economy** — `balance`, `daily`, `weekly`, `work`, `beg`, `pay`','🎵 **Music** — `play`, `skip`, `pause`, `stop`, `queue`, `volume`, `shuffle`, `loop`','🎬 **Movies** — `/movie`, `/tv`, `/movie-details`','🐦 **Social** — `/tweet`, `/search-tweets`, `/search`','▶️ **YouTube** — `/youtube`, `/video`','🧠 **AI** — `/ai` (Groq-powered)','🏷️ **Tags** — `?tag <name>`','⏰ **Reminders** — `/remind`','📊 **Polls** — `/poll create`','🎭 **Roles** — `/reactionrole setup`, `/temprole`',''].join('\n'));
    if(commandName==='ping')return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    if(commandName==='prefix')return message.reply(`⚙️ My prefix is **${prefix}**`);
    if(commandName==='tag'){
      const tagName=(args.shift()||'').toLowerCase().replace(/\s+/g,'-');
      if(!tagName)return message.reply('Usage: ?tag <name>');
      const { Tag } = require('../database/repository');
      const tag=await Tag.findOne({guildId:message.guild.id,name:tagName});
      if(!tag)return message.reply(`❌ Tag \`${tagName}\` not found.`);
      tag.useCount+=1;await tag.save();
      return message.reply(tag.content.slice(0,2000));
    }
    if(commandName==='noprefix'){
      if(message.author.id!==botOwnerId)return message.reply('❌ Only the bot owner can use this command.'); const sub=(args.shift()||'').toLowerCase(),user=message.mentions.users.first(); if(!['add','remove','list'].includes(sub))return message.reply(`Usage: ${prefix}noprefix <add|remove|list> @user`); const cfg=await getGuild(message.guild.id); if(sub==='list')return message.reply(cfg.noPrefixUsers.length?`🚫 No-prefix users: ${cfg.noPrefixUsers.map(id=>`<@${id}>`).join(', ')}`:'🚫 No no-prefix users configured.'); if(!user)return message.reply(`Usage: ${prefix}noprefix ${sub} @user`); if(user.bot)return message.reply('❌ Bots cannot be added to no-prefix.'); if(sub==='add'){if(!cfg.noPrefixUsers.includes(user.id))cfg.noPrefixUsers.push(user.id);await cfg.save();return message.reply(`✅ ${user} can now use commands without the prefix.`);} cfg.noPrefixUsers=cfg.noPrefixUsers.filter(id=>id!==user.id);await cfg.save();return message.reply(`✅ ${user} no-prefix access removed.`);
    }
    const handled=await handlePrefixModeration(message,commandName,args); if(handled!==false)return handled;
  });

  // --- Reaction Role handling ---
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    // Handle partial reactions
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const rr = await ReactionRole.findOne({ messageId: reaction.message.id });
    if (!rr) return;

    const roleId = rr.mappings.get(reaction.emoji.name) || rr.mappings.get(reaction.emoji.toString());
    if (!roleId) return;

    const guild = client.guilds.cache.get(rr.guildId);
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.add(role, 'Reaction role').catch(() => {});
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const rr = await ReactionRole.findOne({ messageId: reaction.message.id });
    if (!rr) return;

    const roleId = rr.mappings.get(reaction.emoji.name) || rr.mappings.get(reaction.emoji.toString());
    if (!roleId) return;

    const guild = client.guilds.cache.get(rr.guildId);
    if (!guild) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.remove(role, 'Reaction role removed').catch(() => {});
  });
}

module.exports = { registerEvents };
