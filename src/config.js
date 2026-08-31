module.exports = {
  // Discord
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  prefix: process.env.PREFIX || '?',
  botOwnerId: process.env.BOT_OWNER_ID,

  // Database
  mongoUri: process.env.MONGODB_URI,

  // AI — Groq (primary) + OpenAI fallback
  groqApiKey: process.env.GROQ_API_KEY,
  aiApiKey: process.env.AI_API_KEY,
  aiBaseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',

  // Music — Lavalink nodes
  lavalinkNodes: [
    { name: 'Paloma', url: process.env.LAVALINK_PALOMA_URL || 'lava-all.ajaygarg.dev', port: Number(process.env.LAVALINK_PALOMA_PORT || 443), password: process.env.LAVALINK_PALOMA_PASSWORD || 'ajayisbuisness', secure: true },
    { name: 'Nexus', url: process.env.LAVALINK_NEXUS_URL || 'nexus.lavalink.io', port: Number(process.env.LAVALINK_NEXUS_PORT || 443), password: process.env.LAVALINK_NEXUS_PASSWORD || '', secure: true },
    { name: 'Pruned', url: process.env.LAVALINK_PRUNED_URL || 'pruned.lavalink.io', port: Number(process.env.LAVALINK_PRUNED_PORT || 443), password: process.env.LAVALINK_PRUNED_PASSWORD || '', secure: true },
    { name: 'Harmonix', url: process.env.LAVALINK_HARMONIX_URL || 'lavalink.lgbtq.fyi', port: Number(process.env.LAVALINK_HARMONIX_PORT || 443), password: process.env.LAVALINK_HARMONIX_PASSWORD || '', secure: true },
    { name: 'Zoksy', url: process.env.LAVALINK_ZOKSY_URL || 'lavalink.zoks.xyz', port: Number(process.env.LAVALINK_ZOKSY_PORT || 443), password: process.env.LAVALINK_ZOKSY_PASSWORD || '', secure: true },
  ],
  lavalinkShoukakuFallback: false,

  // Spotify (for search results metadata)
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,

  // TMDB — Movie/TV lookups
  tmdbApiKey: process.env.TMDB_API_KEY,

  // Twitter — Post tweets
  twitterApiKey: process.env.TWITTER_API_KEY,
  twitterApiSecret: process.env.TWITTER_API_SECRET,
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN,
  twitterAccessSecret: process.env.TWITTER_ACCESS_SECRET,
  twitterBearerToken: process.env.TWITTER_BEARER_TOKEN,

  // YouTube — Search
  youtubeApiKey: process.env.YOUTUBE_API_KEY,

  // Brave Search
  braveApiKey: process.env.BRAVE_API_KEY,

  // Dashboard
  dashboardPort: Number(process.env.DASHBOARD_PORT || 3000),
  dashboardSecret: process.env.DASHBOARD_SECRET,
};
