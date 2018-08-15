/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
*/

const fs = require("fs");
const misc = require("./misc.js");

let removeReacts = true;
const emojiRoleDict = {
	"EastCoast": "East Coast",
	"WestCoast": "West Coast",
	"SouthAmerica": "South America",
	"AfiGalu": "Afi & Galu"
}

function emojiToRole(emojiName, messageID) {
	let ret = emojiName;
	if (emojiRoleDict[emojiName])
		ret = emojiRoleDict[emojiName];

	if (messageID == misc.ids.secondary) {
		ret += " (Secondary)";
	}
	return ret;
}

async function handleReactionAdd(messageReaction, user, DiscordBot) {
	if (messageReaction.message.channel.name == "set-your-roles") { //if we're in the set-your-roles channel
		console.log(messageReaction.emoji.name);
		if (messageReaction.emoji.name == "wavedash") {
			//add character emotes
			removeReacts = false;
			let emojiNames = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8")); //["Ashani", "Kidd", "Xana", "Raymer", "Zhurong", "AfiGalu"];
			for (let i = 0; i < emojiNames.length; i++) {
				await messageReaction.message.react(DiscordBot.emojis.find("name", emojiNames[i]));
			}
			await messageReaction.remove(user); //remove the wavedash emoji
			removeReacts = true;
		} else if (messageReaction.emoji.name == "icons") {
			//add region emotes
			removeReacts = false;
			let emojiNames = ["WestCoast", "Midwest", "Southwest", "EastCoast", "Mexico", "Canada", "SouthAmerica", "Europe", "Australia", "Asia", "Africa"];
			for (let i = 0; i < emojiNames.length; i++) {
				await messageReaction.message.react(DiscordBot.emojis.find("name", emojiNames[i]));
			}
			await messageReaction.remove(user); //remove the icons emoji
			removeReacts = true;
		}
		else {
			let guild = messageReaction.message.member.guild;
			let hasRole = false;
			try {
				hasRole = misc.roleInRoles(emojiToRole(messageReaction.emoji.name, messageReaction.message.id), guild.member(user).roles.array());
			} catch (e) {
				;
			}

			if (!hasRole) {
				console.log("Add role " + emojiToRole(messageReaction.emoji.name, messageReaction.message.id));
				await guild.member(user).addRole(guild.roles.find("name", emojiToRole(messageReaction.emoji.name, messageReaction.message.id)));
			} else {
				console.log("Remove role " + emojiToRole(messageReaction.emoji.name));
				await guild.member(user).removeRole(guild.roles.find("name", emojiToRole(messageReaction.emoji.name, messageReaction.message.id)));
			}

			if (removeReacts)
				await messageReaction.remove(user); //as per desired behavior, remove their reaction after they add it
		}
	}
}

async function handleReactionRemove(messageReaction, user, DiscordBot) {
	return null;
}

module.exports.handleReactionAdd = handleReactionAdd;
module.exports.handleReactionRemove = handleReactionRemove;