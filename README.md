# 🤖 All-in-One Discord Bot

A modular, multi-server Discord bot built with **Node.js, discord.js v14 and MongoDB**.

## Features

- 🛡️ **Moderation** — ban, kick, timeout, untimeout, warn, warnings, clear, lock/unlock, slowmode
- 🤖 **AutoMod** — anti-link, anti-caps, anti-spam foundation
- 🚨 **Security** — anti-raid and anti-nuke alert foundation
- 📋 **Logging** — joins/leaves, moderation and AutoMod events
- 🎫 **Tickets** — support/report/partnership tickets, close button
- 💰 **Economy** — balance, daily, weekly, work, beg, deposit, withdraw, pay, leaderboard
- 🎮 **Fun** — 8ball, coinflip, dice, RPS
- 🎵 **Music** — play, pause, resume, skip, stop, queue, volume, loop, shuffle, nowplaying
- 👋 **Welcome** — welcome/goodbye channels and autorole
- 📈 **Leveling** — XP and level-up engine
- 🎉 **Giveaways** — start, end and reroll
- 🧠 **AI** — configurable AI provider via environment variables
- ⚙️ **Server configuration** — per-server moderation, security, welcome, logging and economy settings
- 🌐 **Dashboard API** — authenticated server configuration endpoints

## Multi-server data isolation

Every guild has independent configuration and user data. MongoDB documents use `guildId`, and user records have a unique compound index on `{ guildId, userId }`.

That means the same Discord user can have completely different:

- economy balance
- XP and level
- warnings
- server settings

across different servers.

## Project structure

```text
index.js
src/
├── commands/
│   ├── admin.js
│   ├── ai.js
│   ├── economy.js
│   ├── fun.js
│   ├── giveaway.js
│   ├── music.js
│   ├── moderation.js
│   ├── ticket.js
│   └── utility.js
├── database/
│   ├── mongodb.js
│   ├── models.js
│   └── repository.js
├── dashboard/
├── handlers/
├── music/
├── services/
├── systems/
│   ├── automod/
│   ├── leveling/
│   ├── security/
│   └── welcome/
├── utils/
└── deploy.js
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set:

```env
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=...
MONGODB_URI=mongodb+srv://...
```

Optional AI and dashboard variables are documented in `.env.example`.

**Never commit `.env`, Discord tokens, MongoDB credentials or API keys.**

### 3. Register slash commands

For a fast development server registration:

```bash
npm run deploy
```

To register globally, leave `GUILD_ID` empty.

### 4. Start

```bash
npm start
```

### 5. Dashboard

```bash
npm run dashboard
```

The protected dashboard endpoints use:

```text
Authorization: Bearer <DASHBOARD_SECRET>
```

## Discord permissions

Give the bot only the permissions it needs for your enabled modules. Moderation, AutoMod, tickets, music and welcome/autorole features each require different Discord permissions and intents.

## Music

The project includes `discord-player`, `@discord-player/extractor` and `ffmpeg-static`. `/play` accepts search text and supported media URLs; queue management includes loop and shuffle.

## Production notes

- Use MongoDB Atlas or another managed MongoDB service.
- Store all secrets in the hosting provider's secret manager.
- Test anti-raid/anti-nuke behavior on a private test server before enabling aggressive automated actions.
- For production hosting, use a process manager or container platform that restarts the bot on failure.

## License

MIT
