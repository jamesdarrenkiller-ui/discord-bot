require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client, GatewayIntentBits, PermissionsBitField, REST, Routes,
  SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder,
  ButtonBuilder, ButtonStyle
} = require('discord.js');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, guilds: {}, giveaways: {} }, null, 2));
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
function save() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function userData(id) { db.users[id] ??= { cash: 0, bank: 0, daily: 0, work: 0 }; return db.users[id]; }
function guildData(id) { db.guilds[id] ??= { logChannel: null, welcomeChannel: null, welcomeMessage: 'Welcome {user} to {server}! 🎉', automod: true }; return db.guilds[id]; }
function ok(interaction, permission) { return interaction.memberPermissions?.has(permission); }
function need(interaction, permission, label) { if (!ok(interaction, permission)) { interaction.reply({ content: `❌ You need **${label}**.`, ephemeral: true }); return false; } return true; }
function duration(ms) { return `${Math.ceil(ms / 1000)}s`; }

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('Show all commands'),
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server information'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Show user information').addUserOption(o=>o.setName('user').setDescription('User').setRequired(false)),
  new SlashCommandBuilder().setName('avatar').setDescription('Show an avatar').addUserOption(o=>o.setName('user').setDescription('User').setRequired(false)),
  new SlashCommandBuilder().setName('say').setDescription('Send a message').addStringOption(o=>o.setName('message').setDescription('Message').setRequired(true)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('unban').setDescription('Unban a user').addStringOption(o=>o.setName('user_id').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addIntegerOption(o=>o.setName('minutes').setDescription('Minutes').setRequired(true).setMinValue(1).setMaxValue(40320)),
  new SlashCommandBuilder().setName('untimeout').setDescription('Remove a timeout').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('Delete messages').addIntegerOption(o=>o.setName('amount').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName('lock').setDescription('Lock this channel'),
  new SlashCommandBuilder().setName('unlock').setDescription('Unlock this channel'),
  new SlashCommandBuilder().setName('slowmode').setDescription('Set slowmode').addIntegerOption(o=>o.setName('seconds').setDescription('0-21600').setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder().setName('warn').setDescription('Warn a member').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')),
  new SlashCommandBuilder().setName('warnings').setDescription('Show a member warning count').addUserOption(o=>o.setName('user').setDescription('Member').setRequired(false)),
  new SlashCommandBuilder().setName('ticket').setDescription('Create a private support ticket'),
  new SlashCommandBuilder().setName('close').setDescription('Close the current ticket'),
  new SlashCommandBuilder().setName('setlog').setDescription('Set the moderation log channel').addChannelOption(o=>o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName('setwelcome').setDescription('Set the welcome channel').addChannelOption(o=>o.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
  new SlashCommandBuilder().setName('automod').setDescription('Enable or disable basic automod').addBooleanOption(o=>o.setName('enabled').setDescription('Enabled').setRequired(true)),
  new SlashCommandBuilder().setName('balance').setDescription('Check your wallet'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim daily coins'),
  new SlashCommandBuilder().setName('work').setDescription('Work for coins'),
  new SlashCommandBuilder().setName('deposit').setDescription('Deposit coins').addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder().setName('withdraw').setDescription('Withdraw coins').addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder().setName('pay').setDescription('Pay another user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)).addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Show richest users'),
  new SlashCommandBuilder().setName('8ball').setDescription('Ask the magic 8-ball').addStringOption(o=>o.setName('question').setDescription('Question').setRequired(true)),
  new SlashCommandBuilder().setName('roll').setDescription('Roll dice').addIntegerOption(o=>o.setName('sides').setDescription('Sides').setMinValue(2).setMaxValue(100)),
  new SlashCommandBuilder().setName('giveaway').setDescription('Start a giveaway').addIntegerOption(o=>o.setName('seconds').setDescription('Duration in seconds').setRequired(true).setMinValue(10).setMaxValue(604800)).addStringOption(o=>o.setName('prize').setDescription('Prize').setRequired(true)),
].map(c=>c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
async function registerCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) return;
  const route = process.env.GUILD_ID ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log('Commands registered.');
}
async function log(guild, title, description) {
  const channelId = guildData(guild.id).logChannel;
  const channel = channelId ? guild.channels.cache.get(channelId) : null;
  if (channel) channel.send({ embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp()] }).catch(()=>{});
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.once('ready', ()=>{ console.log(`Logged in as ${client.user.tag}`); client.user.setActivity('/help | Multipurpose Bot'); });

client.on('guildMemberAdd', async member => {
  const cfg = guildData(member.guild.id); save();
  if (cfg.welcomeChannel) { const ch = member.guild.channels.cache.get(cfg.welcomeChannel); if (ch) ch.send(cfg.welcomeMessage.replaceAll('{user}', `<@${member.id}>`).replaceAll('{server}', member.guild.name)).catch(()=>{}); }
  await log(member.guild, 'Member Joined', `${member.user.tag} joined the server.`);
});
client.on('guildMemberRemove', member => log(member.guild, 'Member Left', `${member.user?.tag || member.id} left the server.`));

const badWords = ['discord.gg/', 'free nitro', 'free-nitro'];
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  const cfg = guildData(message.guild.id);
  if (cfg.automod && badWords.some(x=>message.content.toLowerCase().includes(x)) && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    await message.delete().catch(()=>{});
    const m = await message.channel.send(`⚠️ ${message.author}, that message was removed by AutoMod.`).catch(()=>null);
    if (m) setTimeout(()=>m.delete().catch(()=>{}), 5000);
    await log(message.guild, 'AutoMod', `${message.author.tag}'s message was removed.`);
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton() && interaction.customId === 'ticket-close') {
      if (!interaction.channel.name.startsWith('ticket-')) return interaction.reply({content:'❌ This is not a ticket.', ephemeral:true});
      await interaction.reply('🔒 Closing ticket in 5 seconds...');
      setTimeout(()=>interaction.channel.delete().catch(()=>{}), 5000); return;
    }
    if (!interaction.isChatInputCommand()) return;
    const { commandName, guild } = interaction;
    if (!guild) return interaction.reply({content:'❌ This bot only works inside servers.', ephemeral:true});

    if (commandName==='help') return interaction.reply({embeds:[new EmbedBuilder().setTitle('🤖 Multipurpose Bot').setDescription('All-in-one Discord server management.').addFields(
      {name:'🛡️ Moderation',value:'`/kick` `/ban` `/unban` `/timeout` `/untimeout` `/warn` `/warnings` `/clear` `/lock` `/unlock` `/slowmode`'},
      {name:'🎫 Support',value:'`/ticket` `/close`'}, {name:'⚙️ Server',value:'`/setlog` `/setwelcome` `/automod`'},
      {name:'💰 Economy',value:'`/balance` `/daily` `/work` `/deposit` `/withdraw` `/pay` `/leaderboard`'},
      {name:'🎮 Fun',value:'`/8ball` `/roll` `/giveaway`'}, {name:'🔧 Utility',value:'`/ping` `/serverinfo` `/userinfo` `/avatar` `/say`'}
    )]});
    if(commandName==='ping') return interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
    if(commandName==='serverinfo') return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${guild.name} Information`).addFields(
      {name:'Owner',value:`<@${guild.ownerId}>`,inline:true},{name:'Members',value:`${guild.memberCount}`,inline:true},{name:'Channels',value:`${guild.channels.cache.size}`,inline:true},{name:'Created',value:`<t:${Math.floor(guild.createdTimestamp/1000)}:D>`,inline:true})]});
    if(commandName==='userinfo') { const u=interaction.options.getUser('user')||interaction.user; return interaction.reply({embeds:[new EmbedBuilder().setTitle(u.tag).setThumbnail(u.displayAvatarURL()).addFields({name:'ID',value:u.id,inline:true},{name:'Created',value:`<t:${Math.floor(u.createdTimestamp/1000)}:D>`,inline:true})]}); }
    if(commandName==='avatar') { const u=interaction.options.getUser('user')||interaction.user; return interaction.reply(u.displayAvatarURL({size:1024,extension:'png'})); }
    if(commandName==='say') { if(!need(interaction,PermissionsBitField.Flags.ManageMessages,'Manage Messages')) return; return interaction.reply({content:interaction.options.getString('message'),allowedMentions:{parse:[]}}); }

    if(['kick','ban'].includes(commandName)) { const p=commandName==='kick'?PermissionsBitField.Flags.KickMembers:PermissionsBitField.Flags.BanMembers; if(!need(interaction,p,commandName==='kick'?'Kick Members':'Ban Members'))return; const u=interaction.options.getUser('user',true),m=await guild.members.fetch(u.id).catch(()=>null),r=interaction.options.getString('reason')||'No reason provided'; if(!m?.moderatable)return interaction.reply({content:'❌ I cannot moderate that member.',ephemeral:true}); if(commandName==='kick')await m.kick(r);else await m.ban({reason:r}); await log(guild,commandName.toUpperCase(),`${u.tag} was ${commandName}ed by ${interaction.user.tag}. Reason: ${r}`); return interaction.reply(`✅ ${u.tag} has been ${commandName}ed.`); }
    if(commandName==='unban') { if(!need(interaction,PermissionsBitField.Flags.BanMembers,'Ban Members'))return; const id=interaction.options.getString('user_id',true); await guild.members.unban(id); return interaction.reply(`✅ <@${id}> has been unbanned.`); }
    if(commandName==='timeout') { if(!need(interaction,PermissionsBitField.Flags.ModerateMembers,'Moderate Members'))return; const u=interaction.options.getUser('user',true),m=await guild.members.fetch(u.id).catch(()=>null),min=interaction.options.getInteger('minutes',true); if(!m?.moderatable)return interaction.reply({content:'❌ I cannot timeout that member.',ephemeral:true}); await m.timeout(min*60000,`By ${interaction.user.tag}`); return interaction.reply(`✅ ${u.tag} timed out for ${min} minute(s).`); }
    if(commandName==='untimeout') { if(!need(interaction,PermissionsBitField.Flags.ModerateMembers,'Moderate Members'))return; const m=await guild.members.fetch(interaction.options.getUser('user',true).id).catch(()=>null); if(!m?.moderatable)return interaction.reply({content:'❌ I cannot modify that member.',ephemeral:true}); await m.timeout(null); return interaction.reply('✅ Timeout removed.'); }
    if(commandName==='clear') { if(!need(interaction,PermissionsBitField.Flags.ManageMessages,'Manage Messages'))return; const n=interaction.options.getInteger('amount',true),d=await interaction.channel.bulkDelete(n,true); return interaction.reply({content:`🧹 Deleted ${d.size} message(s).`,ephemeral:true}); }
    if(['lock','unlock'].includes(commandName)) { if(!need(interaction,PermissionsBitField.Flags.ManageChannels,'Manage Channels'))return; await interaction.channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:commandName==='unlock'}); return interaction.reply(commandName==='lock'?'🔒 Channel locked.':'🔓 Channel unlocked.'); }
    if(commandName==='slowmode') { if(!need(interaction,PermissionsBitField.Flags.ManageChannels,'Manage Channels'))return; const s=interaction.options.getInteger('seconds',true); await interaction.channel.setRateLimitPerUser(s); return interaction.reply(`🐌 Slowmode set to ${s}s.`); }
    if(commandName==='warn') { if(!need(interaction,PermissionsBitField.Flags.ModerateMembers,'Moderate Members'))return; const u=interaction.options.getUser('user',true), key=`warn_${guild.id}_${u.id}`; db.users[key]??={count:0}; db.users[key].count++; save(); await log(guild,'Member Warned',`${u.tag} warned by ${interaction.user.tag}. Reason: ${interaction.options.getString('reason')||'No reason'}`); return interaction.reply(`⚠️ ${u.tag} warned. Total warnings: ${db.users[key].count}`); }
    if(commandName==='warnings') { const u=interaction.options.getUser('user')||interaction.user,key=`warn_${guild.id}_${u.id}`; return interaction.reply(`⚠️ ${u.tag} has **${db.users[key]?.count||0}** warning(s).`); }

    if(commandName==='setlog') { if(!need(interaction,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return; guildData(guild.id).logChannel=interaction.options.getChannel('channel',true).id; save(); return interaction.reply('📋 Log channel configured.'); }
    if(commandName==='setwelcome') { if(!need(interaction,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return; guildData(guild.id).welcomeChannel=interaction.options.getChannel('channel',true).id; save(); return interaction.reply('👋 Welcome channel configured.'); }
    if(commandName==='automod') { if(!need(interaction,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return; guildData(guild.id).automod=interaction.options.getBoolean('enabled',true); save(); return interaction.reply(`🛡️ AutoMod ${guildData(guild.id).automod?'enabled':'disabled'}.`); }

    if(commandName==='ticket') { const existing=guild.channels.cache.find(c=>c.name===`ticket-${interaction.user.id}`); if(existing)return interaction.reply({content:`❌ You already have a ticket: ${existing}`,ephemeral:true}); const ch=await guild.channels.create({name:`ticket-${interaction.user.id}`,type:ChannelType.GuildText,permissionOverwrites:[{id:guild.roles.everyone.id,deny:[PermissionsBitField.Flags.ViewChannel]},{id:interaction.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ReadMessageHistory]},{id:client.user.id,allow:[PermissionsBitField.Flags.ViewChannel,PermissionsBitField.Flags.SendMessages,PermissionsBitField.Flags.ManageChannels]}]}); const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket-close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)); await ch.send({content:`🎫 Welcome <@${interaction.user.id}>! Staff will be with you soon.`,components:[row]}); return interaction.reply({content:`✅ Ticket created: ${ch}`,ephemeral:true}); }
    if(commandName==='close') { if(!interaction.channel.name.startsWith('ticket-'))return interaction.reply({content:'❌ Use this inside a ticket.',ephemeral:true}); await interaction.reply('🔒 Closing ticket in 5 seconds...'); return setTimeout(()=>interaction.channel.delete().catch(()=>{}),5000); }

    if(['balance','daily','work','deposit','withdraw','pay','leaderboard'].includes(commandName)) {
      const me=userData(interaction.user.id);
      if(commandName==='balance')return interaction.reply(`💰 Wallet: **${me.cash}** | Bank: **${me.bank}** | Total: **${me.cash+me.bank}** coins`);
      if(commandName==='daily'){if(Date.now()-me.daily<86400000)return interaction.reply(`⏳ Daily available in ${duration(86400000-(Date.now()-me.daily))}.`);me.cash+=500;me.daily=Date.now();save();return interaction.reply('🎁 You received **500** coins!');}
      if(commandName==='work'){if(Date.now()-me.work<3600000)return interaction.reply(`⏳ Work available in ${duration(3600000-(Date.now()-me.work))}.`);const n=Math.floor(Math.random()*401)+100;me.cash+=n;me.work=Date.now();save();return interaction.reply(`💼 You earned **${n}** coins.`);}
      if(commandName==='deposit'){const n=interaction.options.getInteger('amount',true);if(me.cash<n)return interaction.reply('❌ Not enough wallet coins.');me.cash-=n;me.bank+=n;save();return interaction.reply(`🏦 Deposited **${n}** coins.`);}
      if(commandName==='withdraw'){const n=interaction.options.getInteger('amount',true);if(me.bank<n)return interaction.reply('❌ Not enough bank coins.');me.bank-=n;me.cash+=n;save();return interaction.reply(`🏧 Withdrew **${n}** coins.`);}
      if(commandName==='pay'){const u=interaction.options.getUser('user',true),n=interaction.options.getInteger('amount',true);if(u.id===interaction.user.id)return interaction.reply('❌ You cannot pay yourself.');if(me.cash<n)return interaction.reply('❌ Not enough wallet coins.');me.cash-=n;userData(u.id).cash+=n;save();return interaction.reply(`💸 Paid **${n}** coins to ${u}.`);}
      if(commandName==='leaderboard'){const rows=Object.entries(db.users).filter(([id,v])=>!id.startsWith('warn_')).map(([id,v])=>({id,total:(v.cash||0)+(v.bank||0)})).sort((a,b)=>b.total-a.total).slice(0,10);return interaction.reply('🏆 **Economy Leaderboard**\n'+(rows.map((r,i)=>`${i+1}. <@${r.id}> — **${r.total}**`).join('\n')||'No users yet.'));}
    }

    if(commandName==='8ball'){const a=['Yes.','No.','Maybe.','Definitely.','Ask again later.','Very likely.','I do not think so.'];return interaction.reply(`🎱 ${a[Math.floor(Math.random()*a.length)]}`);}
    if(commandName==='roll'){const s=interaction.options.getInteger('sides')||6;return interaction.reply(`🎲 You rolled **${Math.floor(Math.random()*s)+1}** on a d${s}.`);}
    if(commandName==='giveaway') { if(!need(interaction,PermissionsBitField.Flags.ManageGuild,'Manage Server'))return; const seconds=interaction.options.getInteger('seconds',true),prize=interaction.options.getString('prize',true); const end=Date.now()+seconds*1000; const msg=await interaction.channel.send({embeds:[new EmbedBuilder().setTitle('🎉 Giveaway!').setDescription(`Prize: **${prize}**\nReact with 🎉 to enter!\nEnds <t:${Math.floor(end/1000)}:R>`)]}); await msg.react('🎉'); return interaction.reply({content:`✅ Giveaway started for **${prize}**.`,ephemeral:true}).then(()=>setTimeout(async()=>{const m=await interaction.channel.messages.fetch(msg.id).catch(()=>null);if(!m)return;const users=await m.reactions.cache.get('🎉')?.users.fetch().catch(()=>null);const entries=users?.filter(u=>!u.bot).map(u=>u.id)||[];if(!entries.length)return m.reply('🎉 Giveaway ended, but nobody entered.');const winner=entries[Math.floor(Math.random()*entries.length)];m.reply(`🎉 Giveaway ended! Congratulations <@${winner}> — you won **${prize}**!`);},seconds*1000)); }
  } catch(e) { console.error(e); if(interaction.replied||interaction.deferred) interaction.followUp({content:'❌ Something went wrong.',ephemeral:true}).catch(()=>{}); else interaction.reply({content:'❌ Something went wrong.',ephemeral:true}).catch(()=>{}); }
});

(async()=>{ await registerCommands(); await client.login(process.env.DISCORD_TOKEN); })();
