const  Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {

   let helpembed = new Discord.RichEmbed()
   .setDescription("Help Menu")
   .setColor("#a009eb")
   .addField("Member Commands", "help, serverinfo, botinfo, report, coins, level, hello.");

   message.channel.send(helpembed);
   if(message.member.hasPermission("MANAGE_MESSAGES")){
   let modembed = new Discord.RichEmbed()
   .setDescription("Mod Help Menu")
   .setColor("#a009eb")
   .addField("Mode Commands", "kick, warn, warnlevel, ban, clear, tempmute");

   try{
     await message.author.send(modembed);
     message.react("👍")
   }catch(e){
      message.reply("Your DMs are locked. I cannot send you the mod commands!");
   }
}

}

module.exports.help = {
    name: "help"
}