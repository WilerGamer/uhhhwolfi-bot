const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");
let warns = JSON.parse(fs.readFileSync("./warnings.json", "utf8"));

module.exports.run = async (bot, message, args) => {

    //!warn @someone <reason>

    if(!message.member.hasPermission("MANAGE_MEMBERS")) return message.reply("You don't have permissions!");
    if(args[0] == "help"){
        message.reply("Usage: !warn <user> <reason>");
        return;
      }
    let wUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
    if(!wUser) return message.reply("Couldn't find that member!");
    if(wUser.hasPermission("MANAGE_MESSAGES")) return message.reply("This member can't get reported!");
    let reason = args.join(" ").slice(22);

    if(!warns[wUser.id]) warns[wUser.id] = {
        warns: 0
    };

    warns[wUser.id].warns++;

    fs.writeFile("./warnings.json", JSON.stringify(warns), (err) => {
        if (err) console.log(err)
    });

    let warnEmbed = new Discord.RichEmbed()
    .setDescription("Warns")
    .setAuthor(message.author.username)
    .setColor("#a009eb")
    .addField("Warned User", wUser.tag)
    .addField("Warned In", message.channel)
    .addField("Number of Warnings", warns[wUser.id].warns)
    .addField("Reason", reason);

    let warnchannel = message.guild.channels.find(`name`, "warnings");
    if(!warnchannel) return message.reply("Couldn't find channel!");

    warnchannel.send(warnEmbed);

    if(warns[wUser.id].warns == 2){
      let muterole = message.guild.roles.find(`name`, "Muted");
      if(!muterole) return message.reply("You shouldn't create that role!");

      let mutetime = "10s";
      await(wUser.addRole(muterole.id));
      message.channel.send(`${wUser.tag} has been temporarily muted`);

      setTimeout(function(){
          wUser.removeRole(muterole.id)
          message.reply(`<@${wUser.id}> have been unmuted!`)
      }, ms(mutetime))
    }
    if(warns[wUser.id].warns == 3){
      message.guild.member(wUser).ban(reason);
      message.reply(`@${wUser.tag} has been banned!`)
    }

}

module.exports.help = {
    name: "warn"
}