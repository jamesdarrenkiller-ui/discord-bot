# 🤖 All-in-One Discord Bot

A modular Discord server-management ecosystem built with **Node.js, discord.js v14 and MongoDB**.

## 🚀 Core Modules

- 🛡️ Moderation: ban, kick, timeout, warnings, purge, lock/unlock, slowmode
- 🤖 AutoMod: anti-link, anti-caps, spam/raid protection foundation
- 🔐 Security: anti-raid and anti-nuke detection foundation
- 📋 Logging: moderation, joins/leaves and AutoMod events
- 🎫 Tickets: support/report/partnership ticket creation and closing
- 💰 Economy: balance, daily, weekly, work, beg, deposit, withdraw, pay, leaderboard
- 🎮 Fun: 8ball, coinflip, dice, RPS
- 🎵 Music: Discord Player module and voice-state support
- 👋 Welcome: welcome/goodbye channels and autorole
- 📈 Leveling: MongoDB XP and level-up engine
- 🎉 Giveaways: start, end and reroll
- 🧠 AI: provider-agnostic `/ai` server assistant
- ⚙️ Admin configuration: logs, welcome, AutoMod, security and autorole
- 🌐 Dashboard API: authenticated server configuration endpoints

## 📁 Architecture

```text
bot/
├── index.js
├── package.json
├── .env.example
├── README.md
└── src/
    ├── commands/
    │   ├── moderation.js
    │   ├── economy.js
    │   ├── music.js
    │   ├── fun.js
    │   ├── utility.js
    │   ├── ticket.js
    │   ├── giveaway.js
    │   ├── admin.js
    │   └── ai.js
    ├── events/
    ├── handlers/
    ├── systems/
    │   ├── automod/
    │   ├── antinuke/security
    │   ├── leveling/
    │   └── welcome/
    ├── database/
    │   ├── mongodb.js
    │   ├── models.js
    │   └── repository.js
    ├── services/
    │   └── ai.js
    ├── dashboard/
    ├── music/
    ├── config.js
    └── deploy.js
```

## 🔧 Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and set:

```env
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=...
MONGODB_URI=mongodb+srv://...
AI_API_KEY=...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
DASHBOARD_PORT=3000
DASHBOARD_SECRET=...
```

**Never commit `.env`, Discord tokens, MongoDB credentials or AI API keys.**

### 3. Register slash commands

```bash
npm run deploy
```

### 4. Start bot

```bash
npm start
```

### 5. Dashboard API

```bash
npm run dashboard
```

The dashboard API uses `Authorization: Bearer <DASHBOARD_SECRET>` for protected configuration routes.

## 🗄️ MongoDB

MongoDB stores per-server configuration, users/economy, XP, warnings, tickets and giveaway records. Add your MongoDB connection string through `MONGODB_URI`.

## 🧠 AI

The bot does not contain a hard-coded AI key. Put your key in `.env` or your hosting provider's secret manager. The AI service uses an OpenAI-compatible `/chat/completions` endpoint and can be configured with `AI_BASE_URL` and `AI_MODEL`.

## 🔒 Security

Use the least Discord permissions necessary. Keep dashboard access behind HTTPS and a strong secret. Anti-nuke/raid systems should be tested on a private server before enabling aggressive automatic actions.

## 📜 License

MIT
