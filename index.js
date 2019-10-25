const botconfig = require("./botconfig.json");
const tokenfile = require("./token.json");
const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client({ disableEveryone: true });
bot.commands = new Discord.Collection();
let coins = require("./coins.json");
let xp = require("./xp.json");
let purple = botconfig.purple;
let cooldown = new Set();
let cdseconds = 5;

fs.readdir("./commands/", (err, file) => {

  if (err) console.log(err);

  let jsfile = file.filter(f => f.split(".").pop() === "js")
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands!");
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    bot.commands.set(props.help.name, props);
  });

});



bot.on("ready", async () => {
  console.log(`${bot.user.username} is online!`);
  bot.user.setActivity("You! | !help", { type: "WATCHING" });
});

bot.on("guildMemberAdd", async member => {
  console.log(`${member.id} joined the server!`);

  let welcomechannel = member.guild.channels.find(`name`, "🎉-welcome");
  welcomechannel.send(`${member} has joined the server! Please read our rules in the rules channel!`);
});

bot.on("guildMemberRemove", async = member => {
  console.log(`${member.id} left the server!`);

  let welcomechannel = member.guild.channels.find(`name`, "👋-goodbye");
  welcomechannel.send(`${member} has left the server!`);
});

bot.on("messageDelete", async message => {
  let logchannel = message.guild.channels.find(`name`, "message-delete-log");
  if (!logchannel) return message.channel.send(`You deleted ${message.content} but we couldn't log it!`);
  logchannel.send(message);
});


bot.on("channelCreate", async channel => {
  console.log(`${channel.name} has been created.`);

  let sChannel = channel.guild.channels.find(`name`, "mod-logs");
  sChannel.send(`${channel.name} has been created.`);
});

bot.on("channelDelete", async channel => {

  console.log(`${channel.name} has been deleted.`);

  let sChannel = channel.guild.channels.find(`name`, "mod-logs");
  sChannel.send(`${channel.name} has been deleted.`);

});

bot.on("message", async message => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;

  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));
  if(!prefixes[message.guild.id]) {
    prefixes[message.guild.id] = {
      prefixes: botconfig.prefix
    };
  }

  if(!coins[message.author.id]){
    coins[message.author.id] = {
      coins: 0
    };
  }

  let coinAmt = Math.floor(Math.random() * 15) + 1;
  let baseAmt = Math.floor(Math.random() * 15) + 1;
  console.log(`${coinAmt} ; ${baseAmt}`);

  if(coinAmt === baseAmt){
    coins[message.author.id] = {
      coins: coins[message.author.id].coins + coinAmt
    };
  fs.writeFile("./coins.json", JSON.stringify(coins), (err) => {
    if (err) console.log(err)
  });  
  let coinEmbed = new Discord.RichEmbed()
  .setAuthor(message.author.username)
  .setColor("#a009eb")
  .addField("💸", `${coinAmt} coins added!`);

  message.channel.send(coinEmbed).then(msg => {msg.delete(5000)});
  }

  let xpAdd = Math.floor(Math.random() * 7) + 8;
  console.log(xpAdd);

  if(!xp[message.author.id]){
    xp[message.author.id] = {
      xp: 0,
      level: 1
    };
  }


  let curxp = xp[message.author.id].xp;
  let curlvl = xp[message.author.id].level;
  let nxtLvl = xp[message.author.id].level * 300;
  xp[message.author.id].xp = curxp + xpAdd;
  if(nxtLvl <= xp[message.author.id].xp){
    xp[message.author.id].level = curlvl + 1;
    let lvlup = new Discord.RichEmbed()
    .setTitle("Level Up!")
    .setColor(purple)
    .addField("New Level", curlvl + 1);

    message.channel.send(lvlup).then(msg => {msg.delete(5000)});

  }
  fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
    if(err) console.log(err)
  });
  let prefix = prefixes[message.guild.id].prefixes;
  if(!message.content.startsWith(prefix)) return;
  if(cooldown.has(message.author.id)){
    message.delete();
    return message.reply("You have to wait 5 seconds between commands.")
  }
  //if(!message.member.hasPermission("ADMINISTRATOR")){
    cooldown.add(message.author.discriminator);
  //}


  let messagearray = message.content.split(" ");
  let cmd = messagearray[0];
  let args = messagearray.slice(1);

  let commandfile = bot.commands.get(cmd.slice(prefix.length));
  if (commandfile) commandfile.run(bot, message, args);

  setTimeout(() => {
    cooldown.delete(message.author.id)
  }, cdseconds * 1000)

  if (cmd === `${prefix}kick`) {

    ///!kick @someone reason

    if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You don't have permission to kick!");
    if (args[0] == "help") {
      message.reply("Usage: !kick <user> <reason>");
      return;
    }
    let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if (!kUser) return message.channel.send("Can't find user!");
    let kReason = args.join(" ").slice(22);
    if (!kReason) return message.channel.send('Please provide a reason');
    if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You don't have permission to kick!");
    if (kUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be kicked!");

    let kickembed = new Discord.RichEmbed()
      .setDescription("~kick~")
      .setColor("#a009eb")
      .addField("Kicked User", `${kUser} with ID ${kUser.id}`)
      .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
      .addField("Kicked In", message.channel)
      .addField("Time", message.createdAt)
      .addField("Reason", kReason);

    let kicksChannel = message.guild.channels.find(`name`, "kicks");
    if (!kicksChannel) return message.channel.send("Can't find kicks channel!");

    message.guild.member(kUser).kick(kReason);
    kicksChannel.send(kickembed);

    return;
  }

  if (cmd === `${prefix}ban`) {

    if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You don't have permission to ban!");
    if (args[0] == "help") {
      message.reply("Usage: !ban <user> <reason>");
      return;
    }
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if (!bUser) return message.channel.send("Can't find user!");
    let bReason = args.join(" ").slice(22);
    if (!bReason) return message.channel.send('Please provide a reason');
    if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You don't have permission to ban!");
    if (!bUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("You can't ban that person");

    let banembed = new Discord.RichEmbed()
      .setDescription("~ban~")
      .setColor("#a009eb")
      .addField("Banned User", `${bUser} with ID ${bUser.id}`)
      .addField("Banned By", `<@${message.author.id}> with ID ${message.author.id}`)
      .addField("Banned In", message.channel)
      .addField("Time", message.createdAt)
      .addField("Reason", bReason);

    let bansChannel = message.guild.channels.find(`name`, "bans");
    if (!bansChannel) return message.channel.send("Can't find ban channel!");

    message.guild.member(bUser).ban(bReason);
    bansChannel.send(banembed);

    return;
  }

  if (cmd === `${prefix}report`) {

    ///!report @ned this is the reason

    let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if (!rUser) return message.channel.send("Couldn't find user.");
    let reason = args.join(" ").slice(22);

    let reportembed = new Discord.RichEmbed()
      .setDescription("Reports")
      .setColor("#a009eb")
      .addField("Reported User", `${rUser} with ID: ${rUser.id}`)
      .addField("Reported By", `${message.author} with ID: ${message.author.id}`)
      .addField("Channel", message.channel)
      .addField("Time", message.createdAt)
      .addField("Reason", reason);

    let reportschannel = message.guild.channels.find(`name`, "reports");
    if (!reportschannel) return message.channel.send("Couldn't find reports channel.");


    message.delete().catch(O_o => { });
    reportschannel.send(reportembed);

    return;
  }



  if (cmd === `${prefix}serverinfo`) {

    let sicon = message.guild.iconURL;
    letserverembed = new Discord.RichEmbed()
      .setDescription("Server Information")
      .setColor("#a009eb")
      .setThumbnail(sicon)
      .addField("Server Name", message.guild.name)
      .addField("Created On", message.guild.createdAt)
      .addField("You Joined", message.member.joinedAt)
      .addField("Total Members", message.guild.memberCount);




    return message.channel.send(letserverembed);
  }

  if (cmd === `${prefix}down`) {

    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permissions for that command!");
    message.delete().catch();
    let sicon = message.guild.iconURL;
    letserverembed = new Discord.RichEmbed()
      .setDescription("Bot Status")
      .setColor("#FF0000")
      .setThumbnail(sicon)
      .addField("The Bot is currently undermaintenance.", "It will be back online soon...")




    return message.channel.send(letserverembed);
  }

  if (cmd === `${prefix}up`) {

    if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.reply("You don't have permissions for that command!");
    message.delete().catch();
    let sicon = message.guild.iconURL;
    letserverembed = new Discord.RichEmbed()
      .setDescription("Bot Status")
      .setColor("#00FF2B")
      .setThumbnail(sicon)
      .addField("The Bot is now back and running", "Jump in the chat and enjoy!")




    return message.channel.send(letserverembed);
  }

  if (cmd === `${prefix}hello`) {
    return message.channel.send("Hello!");
  }
  if (cmd === `${prefix}botinfo`) {

    let bicon = bot.user.displayAvatarURL;
    let botembed = new Discord.RichEmbed()
      .setDescription("Bot Information")
      .setColor("#a009eb")
      .setThumbnail(bicon)
      .addField("Bot Name", bot.user.username)
      .addField("Created On", bot.user.createdAt);

    return message.channel.send(botembed);
  }

});

bot.login(tokenfile.token);
