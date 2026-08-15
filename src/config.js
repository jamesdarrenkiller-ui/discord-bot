module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || '!',
  mongoUri: process.env.MONGODB_URI,
  aiApiKey: process.env.AI_API_KEY,
  aiBaseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  dashboardPort: Number(process.env.DASHBOARD_PORT || 3000),
  dashboardSecret: process.env.DASHBOARD_SECRET,
};
