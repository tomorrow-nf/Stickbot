/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
    Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");
const misc = require("./misc.js");

let removeReacts = true;
const emojiRoleDict = {
	"cgccPurple": "Button Creator",
	"cgccGreen": "Controller Painter",
	"cgccOrange": "Functional Modder",
	"cgccBlue": "Electrical Modder",
	"cgccLime": "Graphic Designer",
	"cgccYellow": "Cable Modder"
}

function emojiToRole(emojiName, messageID) {
	let ret = emojiRoleDict[emojiName];
	
	if (messageID == misc.ids.secondary) {
		ret += " (Secondary)";
	}
	return ret;
}

async function handleReactionAdd(messageReaction, user, DiscordBot) {
	if (messageReaction.message.channel.name == "role-assignment") { 
		console.log(messageReaction.emoji.name);
		if (messageReaction.emoji.name == "zhuW") {
			//add role emotes
			removeReacts = false;
			let emojiNames = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));
			for (let i = 0; i < emojiNames.length; i++) {
				await messageReaction.message.react(DiscordBot.emojis.find("name", emojiNames[i]));
			}
			await messageReaction.remove(user); //remove the zhuW emoji
			removeReacts = true;
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
