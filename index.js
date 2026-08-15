require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./src/config');
const { connectDatabase } = require('./src/database/mongodb');
const { loadCommands } = require('./src/handlers/commandHandler');
const interactionHandler = require('./src/handlers/interactionHandler');
const { registerEvents } = require('./src/handlers/eventHandler');
const { setupMusic } = require('./src/music/player');

if (!token) throw new Error('DISCORD_TOKEN is missing. Add it to .env.');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
loadCommands(client);
registerEvents(client);
client.on('interactionCreate', interactionHandler);

(async () => {
  await connectDatabase();
  await setupMusic(client);
  await client.login(token);
})().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
