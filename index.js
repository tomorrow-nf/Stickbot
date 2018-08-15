/*
	IconsBot index.js
	
	Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
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

//Create DiscordBot
const DiscordBot = new Discord.Client({ 
	//autofetch: ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'],
	messageCacheMaxSize: updateCacheEvery + 50
});



//Executed upon a message being sent to any channel the bot can look at
DiscordBot.on('message', async message => {
	let args = message.content.toLowerCase().split(" ");

	//Mod specific handlers:
	if (misc.memberIsMod(message)) {
		await commands.modCommands(message, args);
		await blacklist.handleBlacklistCommands(message, args);

		if (args[0] == "=refresh") //needs to use the DiscordBot object directly, so it's in index
			await misc.cacheRoleMessages(DiscordBot);
	}

	//Content Team (and Mod) specific handlers:
	if (misc.memberHasRole(message, "Content Team") || misc.memberIsMod(message)) {
		await commands.contentTeamCommands(message, args);
	}

	//Check all messages for userCommands
	await commands.userCommands(message, args);

	//If someone asks Gifkin a question
	if (message.isMemberMentioned(DiscordBot.user) && message.content[message.content.length - 1] == "?") {
		await misc.botReply(message, DiscordBot);
	}
	
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

	//if lastMessageDate is before 11pm EST  and now we're after, scrape website
	if (lastMessageDate.getHours() < utcHourToCheck && new Date().getHours() >= utcHourToCheck) {
		/*let scrape = await misc.scrapeNews(message, false);
		console.log("Scraping news");
		if (scrape.new) {
			let channelToSend = scrape.type == "news" ? message.guild.channels.get(misc.ids.announcements) : message.guild.channels.get(misc.ids.patchnotes);
			console.log("Sending " + scrape.link);
			await channelToSend.send(scrape.link);
		}*/ //disabling this for now as requested
	}
	lastMessageDate = new Date();

	let reminderToSend = misc.checkReminders();
	if (reminderToSend) {
		let reminderChannel = mainGuild.channels.get(misc.ids.reminders);
		await reminderChannel.send(reminderToSend.message);
		misc.removeReminder(reminderToSend.id);
	}
});

//Executed upon a reaction being added to a message in the cache
DiscordBot.on("messageReactionAdd", async (messageReaction, user) => {
	await reaction.handleReactionAdd(messageReaction, user, DiscordBot);
});

//Executed uon a reaction being removed from a message in the cache
DiscordBot.on("messageReactionRemove", async (messageReaction, user) => {
	await reaction.handleReactionRemove(messageReaction, user, DiscordBot);
});

DiscordBot.on("voiceStateUpdate", async(oldMember, newMember) => {
	await misc.manageVoiceChannels(newMember.guild);
})

//Log into Discord using /info/DiscordToken.txt
console.log("Time to log in.");
DiscordBot.login(discordToken).catch(function (reason) {
	console.log(reason);
});

//Executed upon successful login
DiscordBot.on('ready', async () => {
	mainGuild = DiscordBot.guilds.get(misc.ids.server);
	misc.mainGuild = mainGuild;
	console.log('Gifkin is ready to shffl.');
	DiscordBot.setMaxListeners(0); //done to ensure it responds to everything regardless of how busy the server gets
	await DiscordBot.user.setActivity("Type =help for commands!");
	await misc.cacheRoleMessages(DiscordBot);
});

