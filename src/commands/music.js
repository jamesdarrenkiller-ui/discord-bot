const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { availableModes, applyMode } = require('../music/effects');

function voiceChannel(interaction) { return interaction.member?.voice?.channel; }
function getQueue(interaction) { return interaction.client.player.nodes.get(interaction.guildId); }
function sameChannel(interaction, queue) {
  const channel = voiceChannel(interaction);
  const connection = queue?.channel;
  return !connection || !channel || connection.id === channel.id;
}

const modeChoices = availableModes().map(mode => ({ name: mode.toUpperCase(), value: mode }));

module.exports = [
  {
    data: new SlashCommandBuilder().setName('play').setDescription('Play or queue a song').addStringOption(o => o.setName('query').setDescription('Song, artist, playlist or supported URL').setRequired(true)),
    async execute(i) {
      const channel = voiceChannel(i); if (!channel) return i.reply({ content: '❌ Join a voice channel first.', ephemeral: true });
      await i.deferReply();
      try { const { track } = await i.client.player.play(channel, i.options.getString('query', true), { nodeOptions: { metadata: { channel: i.channel } } }); return i.editReply(`🎶 Queued **${track.cleanTitle}**`); }
      catch (e) { console.error('Play error:', e); return i.editReply('❌ I could not play that track. Check the query/URL and try again.'); }
    },
  },
  { data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'), async execute(i) { const q=getQueue(i); if(!q?.isPlaying())return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); q.node.skip(); return i.reply('⏭️ Skipped.'); } },
  { data: new SlashCommandBuilder().setName('pause').setDescription('Pause music'), async execute(i) { const q=getQueue(i); if(!q?.isPlaying())return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); q.node.pause(); return i.reply('⏸️ Paused.'); } },
  { data: new SlashCommandBuilder().setName('resume').setDescription('Resume music'), async execute(i) { const q=getQueue(i); if(!q)return i.reply({content:'❌ Nothing is queued.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); q.node.resume(); return i.reply('▶️ Resumed.'); } },
  { data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear queue'), async execute(i) { const q=getQueue(i); if(!q)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); q.delete(); return i.reply('⏹️ Music stopped and queue cleared.'); } },
  { data: new SlashCommandBuilder().setName('queue').setDescription('Show current queue'), async execute(i) { const q=getQueue(i); if(!q?.currentTrack)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); const tracks=q.tracks.toArray().slice(0,10); const lines=tracks.length?tracks.map((t,n)=>`${n+1}. **${t.cleanTitle}**`).join('\n'):'No more songs queued.'; return i.reply({embeds:[new EmbedBuilder().setTitle('🎵 Music Queue').addFields({name:'Now Playing',value:`**${q.currentTrack.cleanTitle}**`},{name:'Up Next',value:lines})]}); } },
  { data: new SlashCommandBuilder().setName('volume').setDescription('Set music volume').addIntegerOption(o=>o.setName('level').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100)), async execute(i) { const q=getQueue(i); if(!q?.isPlaying())return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); const n=i.options.getInteger('level',true); q.node.setVolume(n); return i.reply(`🔊 Volume set to **${n}%**.`); } },
  { data: new SlashCommandBuilder().setName('loop').setDescription('Set loop mode').addStringOption(o=>o.setName('mode').setDescription('Loop mode').setRequired(true).addChoices({name:'Off',value:'0'},{name:'Track',value:'1'},{name:'Queue',value:'2'})), async execute(i) { const q=getQueue(i); if(!q?.currentTrack)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); const n=Number(i.options.getString('mode',true)); q.setRepeatMode(n); return i.reply(`🔁 Loop: **${['Off','Track','Queue'][n]}**.`); } },
  { data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle queue'), async execute(i) { const q=getQueue(i); if(!q?.currentTrack)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); if(q.tracks.size<2)return i.reply({content:'❌ Need at least 2 queued tracks.',ephemeral:true}); q.tracks.shuffle(); return i.reply(`🔀 Shuffled **${q.tracks.size}** tracks.`); } },
  { data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show current song'), async execute(i) { const q=getQueue(i); if(!q?.currentTrack)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); return i.reply(`🎵 Now playing **${q.currentTrack.cleanTitle}**`); } },
  { data: new SlashCommandBuilder().setName('mode').setDescription('Apply a music sound mode').addStringOption(o=>o.setName('mode').setDescription('Sound preset').setRequired(true).addChoices(...modeChoices)), async execute(i) { const q=getQueue(i); if(!q?.currentTrack)return i.reply({content:'❌ Nothing is playing.',ephemeral:true}); if(!sameChannel(i,q))return i.reply({content:'❌ Join my voice channel first.',ephemeral:true}); const mode=i.options.getString('mode',true); try { applyMode(q,mode); return i.reply(`🎚️ Sound mode: **${mode.toUpperCase()}**.`); } catch(e) { console.error(e); return i.reply({content:'❌ Could not apply that mode.',ephemeral:true}); } } },
  { data: new SlashCommandBuilder().setName('modes').setDescription('List available music sound modes'), async execute(i) { return i.reply(`🎚️ **Modes:** ${availableModes().map(m=>`\`${m}\``).join(', ')}`); } },
];
