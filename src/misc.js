/*
    misc.js
    Contains useful miscellaneous functions used throughout the bot.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
*/
const fs = require("fs");
const request = null;
const uuid = require("uuid/v4");

const ids = JSON.parse(fs.readFileSync("./info/ids.json", "utf8"));
let voicechannels = JSON.parse(fs.readFileSync("./info/voicechannels.json", "utf8"));

let reminders = JSON.parse(fs.readFileSync("./info/reminders.json", "utf8"));
let mainGuild = null;

let isCheckingVoice = false;

function delay(t) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, t)
	});
}

function writeVoiceChannels() {
	fs.writeFileSync("./info/voicechannels.json", JSON.stringify(voicechannels, null, "\t"), "utf8");
}

function getDynamicByName(name) {
	for (let i = 0; i < voicechannels.dynamic.length; i++) {
		if (voicechannels.dynamic[i].name == name)
			return voicechannels.dynamic[i];
	}
	return null;
}

function setDynamicByName(name, id) {
	for (let i = 0; i < voicechannels.dynamic.length; i++) {
		if (voicechannels.dynamic[i].name == name) {
			voicechannels.dynamic[i].id = id;
			writeVoiceChannels();
		}
	}
}

function getUnusedDynamic() {
	for (let i = 0; i < voicechannels.dynamic.length; i++) {
		if (voicechannels.dynamic[i].id == null || voicechannels.dynamic[i].id == "") {
			return voicechannels.dynamic[i];
		}
	}
	return null;
}

function addReminder(date, message) {
	let o = {
		date: date,
		message: message,
		id: uuid()
	}

	reminders.push(o);
	fs.writeFileSync("./info/reminders.json", JSON.stringify(reminders, null, "\t"), "utf8");
	console.log("Added reminder: " + message);
}

function removeReminder(id) {
	let indexToRemove = -1;
	for (let i = 0; i < reminders.length; i++) {
		if (reminders[i].id == id) {
			indexToRemove = i;
			break;
		}
	}

	if (indexToRemove > -1) {
		reminders.splice(indexToRemove, 1);
		fs.writeFileSync("./info/reminders.json", JSON.stringify(reminders, null, "\t"), "utf8");
		console.log("Removed reminder.");
	} else {
		console.log("Tried to remove invalid reminder?");
	}
}

function checkReminders() {
	let currentDate = new Date();

	for (let i = 0; i < reminders.length; i++) {
		if (currentDate > new Date(reminders[i].date)) {
			return reminders[i];
		}
	}
	return null;
}

function memberIsMod(message) {
	//adding all possible names for mods here to make code a bit cleaner
	let ret = false;
	const modNames = ["Mod", "Moderator", "Wavedash Staff", "Admin"];
	for (let i = 0; i < modNames.length; i++) {
		ret = ret || memberHasRole(message, modNames[i]);		
	}
	return ret;
}

function memberHasRole(message, roleName) {
	let ret = false;
	try {
		ret = roleInRoles(roleName, message.guild.member(message.author).roles.array());
	} catch (e) {
		ret = false;
	}
	
	return ret;
}

function roleInRoles(roleName, roles) {
	for (let i = 0; i < roles.length; i++) {
		if (roles[i].name == roleName)
			return true;
	}
	return false;
}

async function botReply(message, DiscordBot) {
	let a = Math.floor(Math.random() * 10);
	let s = ["gifhappy", "gifhappy", "gifcool", "gifcrylaugh", "gifhearteyes", "gifmad", "gifsad", "gifthink", "gifthonk", "gifthonk"];
	let selectedName = s[Math.floor(Math.random() * s.length)];
	
	let emote = DiscordBot.emojis.find("name", selectedName);
		
	return await message.channel.send(emote.toString());
}


async function manageVoiceChannels(guild) {
	//first, check through the four default Playtest voice channels and any dynamically created voice channels
	//if all but one open, do nothing
	//if two open, and one of those is an empty dynamic channel, destroy that empty dynamic channel
	if (!isCheckingVoice) {

		console.log("Checking voice channels.");
		try {
			isCheckingVoice = true;

			let emptyChannels = [];
			let occupiedChannels = [];
			let totalChannels = 0;
			let emptyDynamicChannels = [];

			//default channels
			for (let i = 0; i < voicechannels.default.length; i++) {
				totalChannels += 1;
				let voiceChannel = await guild.channels.get(voicechannels.default[i]); //yes I am implicitly assuming we won't delete the default Alpha channel.
				if (voiceChannel && voiceChannel.members.array().length > 0)
					occupiedChannels.push(voiceChannel);
				else
					emptyChannels.push(voiceChannel);
			}

			//dynamic channels
			for (let i = 0; i < voicechannels.dynamic.length; i++) {
				//if its id is set it is actually a channel that exists, supposedly
				if (voicechannels.dynamic[i].id != null && voicechannels.dynamic[i].id != "") {
					let voiceChannel = null;
					try {
						voiceChannel = await guild.channels.get(voicechannels.dynamic[i].id);
						totalChannels += 1;
						if (voiceChannel.members.array().length > 0) {
							occupiedChannels.push(voiceChannel);
						} else {
							emptyChannels.push(voiceChannel);
							emptyDynamicChannels.push(voiceChannel);
						}
					} catch (e) {
						//we must assume a mod deleted this channel
						setDynamicByName(voicechannels.dynamic[i].name, null);
						console.log("Did a mod delete the " + voicechannels.dynamic[i].name + " voice channel?");
					}
				}
			}

			if (occupiedChannels.length >= totalChannels) {
				//if all are occupied, make a new one
				console.log("Time to make a new channel.");
				let unused = getUnusedDynamic();
				if (unused != null) {
					console.log("Going to make channel, its name will be " + unused.name);
					let newVoiceChannel = await guild.createChannel(unused.name, "voice", null, "Dynamically create voice channel for playtesters.");
					setDynamicByName(unused.name, newVoiceChannel.id);
					let category = await guild.channels.get(voicechannels.category);
					newVoiceChannel.setParent(category, "Move dynamic voice channel into the Voice category.");
					newVoiceChannel.setUserLimit(8, "Pixel said so.");
				}
			} else if (emptyChannels.length > 1 && emptyDynamicChannels.length > 0) {
				//if there's at least two channels open, and one of those is dynamic, then remove that dynamic channel
				console.log("Time to remove a dynamic channel.");
				let used = getDynamicByName(emptyDynamicChannels[emptyDynamicChannels.length - 1].name); //remove the latest empty dynamic channel in the list
				if (used != null) {
					console.log("Going to remove the channel named " + used.name);
					await emptyDynamicChannels[emptyDynamicChannels.length - 1].delete("Remove unused dynamic channel.");
					setDynamicByName(used.name, null);
				}
			}
		} catch (e) {
			console.log(e);
		}
		//we never want an error preventing the semaphore from being set back to false.
		isCheckingVoice = false;
	}
}

async function scrapeNews(message, justCheck) {
	//let req = await request("https://icons.gg/news");
	let req = {body: "http://icons.gg/news/"};
	//after trying the hard way to do DOM traversal
	//we're going to do the lazy approach and just traverse the raw string for the first instance of "https://icons.gg/news/", get that full URL, and then print it if relevant
	let firstNewsIndex = req.body.indexOf("http://icons.gg/news/"); //temp after site revamp
	let splicedReq = req.body.substring(firstNewsIndex);
	let endLinkIndex = splicedReq.indexOf("\""); //yes, this assumes they'll end their link with a " -- I hope that remains true
	let link = splicedReq.substring(0, endLinkIndex); //will return the full link -- ie https://icons.gg/news/patch-notes
	let type = link.indexOf("patch-notes") != -1 ? "patch" : "news";

	let recentNews = fs.readFileSync("./info/recent-news.txt", "utf8");

	if (recentNews.indexOf(link) == -1) {
		//it's new!
		if (!justCheck)
			fs.writeFileSync("./info/recent-news.txt", link, "utf8");
		return {
			"new": true,
			"type": type,
			"link": link
		};
	} else {
		//this is the same as previously
		return {
			"new": false,
			"type": type,
			"link": link
		};
	}
}

async function giveBeta(message) {
	//Deprecated, was used back when there was a separate Beta server.
	if (message.channel.name == "welcome-room" && !memberHasRole(message, "Beta") && !memberHasRole(message, "Removed")) {
		await message.guild.member(message.author).addRole(message.guild.roles.find("name", "Beta"));
		
		let msg = await message.channel.sendMessage("<@" + message.author.id + ">, you have been given the Beta role. Welcome to the Icons: Combat Arena closed beta!");
		await msg.delete(5000); //remove that message after 5 seconds.
	}
}

async function cacheRoleMessages(DiscordBot) {
	await DiscordBot.channels.get(ids.roles).fetchMessages({limit: 50}); //get back messages from the #set-your-roles channel
	let messages = DiscordBot.channels.get(ids.roles).messages;
	let keys = messages.keyArray();
	for (let i = 0; i < keys.length; i++) {
		let reactionKeys = messages.get(keys[i]).reactions.keyArray();
		for (let j = 0; j < reactionKeys.length; j++) {
			let reactedUsers = await messages.get(keys[i]).reactions.get(reactionKeys[j]).fetchUsers();
			reactedUsers = reactedUsers.array();
			for (let k = 0; k < reactedUsers.length; k++) {
				if (DiscordBot.user != reactedUsers[k]) {
					console.log("Attempting to remove " + reactedUsers[k].tag);
					await messages.get(keys[i]).reactions.get(reactionKeys[j]).remove(reactedUsers[k]);
				}
			}
		}
	}

	let feedbacks = JSON.parse(fs.readFileSync("./info/feedbacks.json", "utf8"));
	keys = Object.keys(feedbacks);
	for (let i = 0; i < keys.length; i++) {
		feedbacks[keys[i]].count -= 1;
		if (feedbacks[keys[i]].count < 0)
			feedbacks[keys[i]].count = 0;
	}
	fs.writeFileSync("./info/feedbacks.json", JSON.stringify(feedbacks), "utf8");

	process.stdout.write("Cached role messages. ");
}

module.exports.delay = delay;
module.exports.roleInRoles = roleInRoles;
module.exports.memberIsMod = memberIsMod;
module.exports.memberHasRole = memberHasRole;
module.exports.giveBeta = giveBeta;
module.exports.scrapeNews = scrapeNews;
module.exports.cacheRoleMessages = cacheRoleMessages;
module.exports.ids = ids;
module.exports.manageVoiceChannels = manageVoiceChannels;
module.exports.botReply = botReply;
module.exports.reminders = reminders;
module.exports.addReminder = addReminder;
module.exports.removeReminder = removeReminder;
module.exports.checkReminders = checkReminders;
module.exports.mainGuild = mainGuild;
