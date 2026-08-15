const { mongoose } = require('./mongodb');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cash: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  inventory: { type: Map, of: Number, default: {} },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastDaily: { type: Date, default: 0 },
  lastWeekly: { type: Date, default: 0 },
  lastWork: { type: Date, default: 0 },
  afk: { type: String, default: '' },
});

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  welcomeChannelId: String,
  welcomeMessage: { type: String, default: 'Welcome {user} to {server}! 🎉' },
  goodbyeChannelId: String,
  autoRoleId: String,
  logChannelId: String,
  ticketCategoryId: String,
  automod: { type: Boolean, default: true },
  antiLink: { type: Boolean, default: true },
  antiSpam: { type: Boolean, default: true },
  antiCaps: { type: Boolean, default: false },
  antiRaid: { type: Boolean, default: true },
  antiNuke: { type: Boolean, default: false },
  xpEnabled: { type: Boolean, default: true },
  xpCooldown: { type: Number, default: 60000 },
  xpPerMessage: { type: Number, default: 10 },
});

const WarningSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, index: true },
  channelId: { type: String, unique: true },
  userId: String,
  type: { type: String, default: 'support' },
  claimedBy: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const GiveawaySchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  messageId: String,
  prize: String,
  winners: { type: Number, default: 1 },
  endsAt: Date,
  requirements: { roles: [String], minAccountAge: Number, minServerAge: Number },
  ended: { type: Boolean, default: false },
}, { timestamps: true });

const Guild = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Warning = mongoose.models.Warning || mongoose.model('Warning', WarningSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
const Giveaway = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);

module.exports = { Guild, User, Warning, Ticket, Giveaway };
