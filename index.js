require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./src/config');
const { loadCommands } = require('./src/handlers/commandHandler');
const interactionHandler = require('./src/handlers/interactionHandler');
const { registerEvents } = require('./src/handlers/eventHandler');

if (!token) throw new Error('DISCORD_TOKEN is missing. Add it to .env.');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
loadCommands(client);
registerEvents(client);
client.on('interactionCreate', interactionHandler);

client.login(token).catch(error => {
  console.error('Failed to log in to Discord:', error);
  process.exit(1);
});
