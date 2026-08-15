const { handleMessage } = require('../systems/automod');
const { awardMessageXp } = require('../systems/leveling');
const { memberJoined, memberLeft } = require('../systems/welcome');
const { checkMemberAdd } = require('../systems/security');
const { log } = require('../utils/logger');
const { prefix } = require('../config');

function registerEvents(client) {
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(`${prefix}help | All-in-One Bot`);
  });

  client.on('guildMemberAdd', async member => {
    await memberJoined(member);
    await checkMemberAdd(member);
    await log(member.guild, 'Member Joined', `${member.user.tag} joined the server.`);
  });

  client.on('guildMemberRemove', async member => {
    await memberLeft(member);
    await log(member.guild, 'Member Left', `${member.user?.tag || member.id} left the server.`);
  });

  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    await handleMessage(message);
    await awardMessageXp(message);

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = (args.shift() || '').toLowerCase();
    if (!commandName) return;

    if (commandName === 'help' || commandName === 'h') {
      return message.reply([
        '🤖 **All-in-One Bot — Prefix Help**',
        '',
        `Prefix: **${prefix}**`,
        '',
        '🛡️ **Moderation** — `ban`, `kick`, `timeout`, `warn`, `warnings`, `clear`, `lock`, `unlock`',
        '💰 **Economy** — `balance`, `daily`, `weekly`, `work`, `beg`, `pay`, `leaderboard`',
        '🎮 **Fun** — `8ball`, `coinflip`, `dice`, `rps`',
        '🎵 **Music** — `play`, `pause`, `resume`, `skip`, `stop`, `queue`, `volume`',
        '🎫 **Tickets** — `ticket`',
        '🔧 **Utility** — `ping`, `serverinfo`, `userinfo`, `avatar`, `botinfo`, `uptime`',
        '🧠 **AI** — `ai`',
        '',
        'Slash commands are also available with `/help`.'
      ].join('\n'));
    }

    if (commandName === 'ping') return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    if (commandName === 'prefix') return message.reply(`⚙️ My prefix is **${prefix}**`);
  });
}

module.exports = { registerEvents };
