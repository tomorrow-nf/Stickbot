/*
	CGCC StickBot index.js
	
	Originally written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server. 
	Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

//@ts-check

//Node imports
const fs = require("fs");
const Discord = require("discord.js");

//Run configuration
const config = require("./src/config.js");
config.configure();

//Local imports
const misc = require("./src/misc.js");
const blacklist = require("./src/blacklist.js");
const commands = require("./src/commands.js");
const reaction = require("./src/reaction.js");

//Read in Token
const discordToken = fs.readFileSync("./info/discordToken.txt", "utf8").replace("\n", "");

//Instance Data
const utcHourToCheck = 23; //11pm EST
let lastMessageDate = new Date();
const updateCacheEvery = 500;
let numMessages = 0;
let mainGuild = null;

//Intro text
let intros = JSON.parse(fs.readFileSync("./info/intros.json", "utf8"));

//Spambot detection
let spambots = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));

//Create DiscordBot
const DiscordBot = new Discord.Client({ 
	//autofetch: ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'],
	messageCacheMaxSize: updateCacheEvery + 50
});

//Executed upon a message being sent to any channel the bot can look at
DiscordBot.on('message', async message => {
	if (message.author.bot) return;
	
	let args = message.content.toLowerCase().split(" ");

	//Mod specific handlers:
	if (misc.memberIsMod(message)) {
		await commands.modCommands(message, args);
		await blacklist.handleBlacklistCommands(message, args);

		if (args[0] == "=refresh") //needs to use the DiscordBot object directly, so it's in index
			await misc.cacheRoleMessages(DiscordBot);
	}

	// Check all messages for userCommands
	await commands.userCommands(message, args);

	// If someone asks StickBot a question
	if (message.isMemberMentioned(DiscordBot.user) && message.content[message.content.length - 1] == "?") {
		await misc.botReply(message, DiscordBot);
	}
	
	//Handle Gallery posts
	await misc.galleryImagesOnly(message);
	
	//Remove Contributor role after a single post
	await misc.removeContributor(message);
	
	//Handle all blacklist removal/warning
	let censored = await blacklist.handleBlacklist(message, DiscordBot.user.tag);
	if (!censored) {
		await blacklist.handleBlacklistPotential(message, DiscordBot.user.tag);
	}

	//Every `updateCacheEvery` messages, update the cache to hopefully ensure the reaction messages are never bumped out of cache
	if (++numMessages >= updateCacheEvery) {
		numMessages = 0;
		await misc.cacheRoleMessages(DiscordBot);
	}

	let reminderToSend = misc.checkReminders();
	if (reminderToSend) {
		let reminderChannel = mainGuild.channels.get(misc.ids.botlog);
		await reminderChannel.send(reminderToSend.message);
		misc.removeReminder(reminderToSend.id);
	}
});

//Executed upon a reaction being added to a message in the cache
DiscordBot.on("messageReactionAdd", async (messageReaction, user) => {
	await reaction.handleReactionAdd(messageReaction, user, DiscordBot);
});

//Executed upon a reaction being removed from a message in the cache
DiscordBot.on("messageReactionRemove", async (messageReaction, user) => {
	await reaction.handleReactionRemove(messageReaction, user, DiscordBot);
});

DiscordBot.on("voiceStateUpdate", async(oldMember, newMember) => {
	await misc.manageVoiceChannels(newMember.guild);
})

//Executed upon a new user joining the server
DiscordBot.on('guildMemberAdd', async(member) => {
	let introductionsChannel = DiscordBot.channels.get(misc.ids.introductions);
	var rulesAndRoles = " Please read through "+ DiscordBot.channels.get(misc.ids.rules) + ", set a role in " + DiscordBot.channels.get(misc.ids.roleassignment) + ", and have a great time here!";
	var ran = Math.floor(Math.random() * intros.length);
	
	//Handle spambots and send intro messages
	var spam = false;
	for (let i = 0; i < spambots.length && !spam; i++){
		if (member.displayName.toLowerCase().includes(spambots[i])){
			console.log("Kicking a spambot: " + member.displayName);
			member.send("Spambots are not welcome in this server. If you believe this was in error, remove the URL or spam phrase from your username before rejoining.");
			spam = true;
			await member.kick("Spambot eliminated");
		}
	}
	if (!spam){
		if (member.id === "118603282670288898" ) {
			await introductionsChannel.send("Making notches better than Mike Haze! It's- oh, well this is awkward... Ughhh, hi Mike, you make very nice notches btw. Welcome " + "<@!" + member.id + ">" + "!" + rulesAndRoles);
		}
		else {
			await introductionsChannel.send(intros[ran] + "<@!" + member.id + ">" + "!" + rulesAndRoles);
		}
	}
});


//Log into Discord using /info/DiscordToken.txt
console.log("Time to log in.");
DiscordBot.login(discordToken).catch(function (reason) {
	console.log(reason);
});

//Executed upon successful login
DiscordBot.on('ready', async () => {
	mainGuild = DiscordBot.guilds.get(misc.ids.server);
	misc.mainGuild = mainGuild;
	console.log('Stickbot is ready');
	DiscordBot.setMaxListeners(0); //done to ensure it responds to everything regardless of how busy the server gets
	await DiscordBot.user.setActivity("Type !help for commands!");
	await misc.cacheRoleMessages(DiscordBot);
});

