const { handleMessage } = require('../systems/automod');
const { awardMessageXp } = require('../systems/leveling');
const { memberJoined, memberLeft } = require('../systems/welcome');
const { checkMemberAdd } = require('../systems/security');
const { log } = require('../utils/logger');

function registerEvents(client) {
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('/help | All-in-One Bot');
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
  });
}

module.exports = { registerEvents };
