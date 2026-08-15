require('dotenv').config();
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./src/config');
const { connectDatabase } = require('./src/database/mongodb');
const { loadCommands, getCommandPayload } = require('./src/handlers/commandHandler');
const interactionHandler = require('./src/handlers/interactionHandler');
const { registerEvents } = require('./src/handlers/eventHandler');
const { setupMusic } = require('./src/music/player');

if (!token) throw new Error('DISCORD_TOKEN is missing. Add it to .env.');
if (!clientId) throw new Error('CLIENT_ID is missing. Add your Discord Application ID to .env.');

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

async function registerSlashCommands() {
  const commands = getCommandPayload(client);
  const rest = new REST({ version: '10' }).setToken(token);
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  console.log(`📦 Loaded ${commands.length} slash commands.`);
  console.log(guildId
    ? `🚀 Registering slash commands to guild ${guildId}...`
    : '🌍 Registering global slash commands...');

  await rest.put(route, { body: commands });
  console.log(`✅ Registered ${commands.length} slash commands.`);
  if (!guildId) console.log('⏳ Global commands may take a while to appear.');
}

registerEvents(client);
client.on('interactionCreate', interactionHandler);
global.__discordClient = client;

(async () => {
  try {
    await connectDatabase();
    await setupMusic(client);
    await registerSlashCommands();
    await client.login(token);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
})();
