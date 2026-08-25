const { PermissionsBitField } = require('discord.js');
const { getGuild } = require('../../database/repository');
const { log } = require('../../utils/logger');

const links=/(https?:\/\/|www\.|discord\.gg\/)/i;
const recentMessages=new Map();

async function punish(message, reason, timeoutMs=0){
  await message.delete().catch(()=>{});
  if(timeoutMs && message.member?.moderatable) await message.member.timeout(timeoutMs,`AutoMod: ${reason}`).catch(()=>{});
  const warning=await message.channel.send(`⚠️ ${message.author}, your message was removed by AutoMod: **${reason}**`).catch(()=>null);
  if(warning)setTimeout(()=>warning.delete().catch(()=>{}),5000);
  await log(message.guild,'AutoMod',`${message.author.tag} triggered ${reason} in ${message.channel}.`);
}

async function handleMessage(message){
  if(!message.guild||message.author.bot)return;
  const cfg=await getGuild(message.guild.id);
  if(!cfg.automod||message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))return;
  const content=message.content||'';
  const letters=content.replace(/[^A-Za-z]/g,'');
  const caps=letters.length>=8&&(letters.replace(/[^A-Z]/g,'').length/letters.length)>0.75;
  if(cfg.antiLink&&links.test(content))return punish(message,'Anti-link');
  if(cfg.antiCaps&&content.length>=12&&caps)return punish(message,'Anti-caps');
  if(cfg.antiSpam){
    const key=`${message.guild.id}:${message.author.id}`,now=Date.now(),list=(recentMessages.get(key)||[]).filter(t=>now-t<7000); list.push(now); recentMessages.set(key,list);
    if(list.length>=5){recentMessages.set(key,[]);return punish(message,'Anti-spam',30000);}
  }
}
module.exports={handleMessage};
