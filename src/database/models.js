const { mongoose } = require('./mongodb');

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  prefix: { type: String, default: '!' },
  adminRoles: { type: [String], default: [] },
  modRoles: { type: [String], default: [] },
  welcomeChannelId: String,
  welcomeMessage: { type: String, default: 'Welcome {user} to {server}! 🎉' },
  goodbyeChannelId: String,
  autoRoleId: String,
  logChannelId: String,
  ticketCategoryId: String,
  ticketSupportRoleId: String,
  automod: { type: Boolean, default: true },
  antiLink: { type: Boolean, default: false },
  antiSpam: { type: Boolean, default: true },
  antiCaps: { type: Boolean, default: false },
  antiRaid: { type: Boolean, default: true },
  antiNuke: { type: Boolean, default: false },
  xpEnabled: { type: Boolean, default: true },
  xpCooldown: { type: Number, default: 60000 },
  xpPerMessage: { type: Number, default: 10 },
  economyEnabled: { type: Boolean, default: true },
  musicEnabled: { type: Boolean, default: true },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  cash: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  inventory: { type: Map, of: Number, default: {} },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastWeekly: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastBeg: { type: Date, default: null },
  afk: { type: String, default: '' },
}, { timestamps: true });
UserSchema.index({ guildId: 1, userId: 1 }, { unique: true });

const WarningSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, unique: true },
  userId: String,
  type: { type: String, default: 'support' },
  claimedBy: String,
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const GiveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  channelId: String,
  messageId: { type: String, unique: true },
  prize: String,
  winners: { type: Number, default: 1 },
  endsAt: Date,
  ended: { type: Boolean, default: false },
}, { timestamps: true });

const Guild = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Warning = mongoose.models.Warning || mongoose.model('Warning', WarningSchema);
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);
const Giveaway = mongoose.models.Giveaway || mongoose.model('Giveaway', GiveawaySchema);

module.exports = { Guild, User, Warning, Ticket, Giveaway };
