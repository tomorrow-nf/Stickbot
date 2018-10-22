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
	"cgccTeal": "Electrical Modder",
	"cgccLime": "Graphic Designer",
	"cgccPink": "Cable Modder"
}

function emojiToRole(emojiName, messageID) {
	let ret = emojiRoleDict[emojiName];
	
	if (messageID == misc.ids.secondary) {
		ret += " (Secondary)";
	}
	return ret;
}

function cleanupRoles(guild, desiredRole, user){
	var matchingRole;
	if (desiredRole.includes("(Secondary)")){
		matchingRole = desiredRole.replace(' (Secondary)', ''); 
	} else {
		matchingRole = desiredRole + " (Secondary)";
	}

	let hasMatchingRole = false;
	try {
		hasMatchingRole = misc.roleInRoles(matchingRole, guild.member(user).roles.array());
	} catch (e) {
		;
	}

	if(hasMatchingRole){
		// If someone has both a Primary and Secondary role for the same skill, fix that
		var role = guild.roles.find(role => role.name === matchingRole);
		console.log("Removing matching role " + role.name + " for user " + user);
		guild.member(user).removeRole(role);
	}
	
	// Remove all Primary roles before adding the new one
	for (var role in emojiRoleDict) {
		if (!desiredRole.includes("(Secondary)")){
			var removeThisRole = guild.roles.find(removeThisRole => removeThisRole.name === emojiRoleDict[role]);
			guild.member(user).removeRole(removeThisRole);
		}
    }
}

async function handleReactionAdd(messageReaction, user, DiscordBot) {
	if (messageReaction.message.channel.name == "role-assignment") { 
		console.log(messageReaction.emoji.name);
		if (messageReaction.emoji.name == "cgccWhite") {
			console.log("Received cgccWhite react");
			//add role emotes
			removeReacts = false;
			let emojiNames = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));
			for (let i = 0; i < emojiNames.length; i++) {
				await messageReaction.message.react(DiscordBot.emojis.find("name", emojiNames[i]));
			}
			await messageReaction.remove(user); //remove the cgccWhite emoji
			removeReacts = true;
		} else {
			let guild = messageReaction.message.member.guild;
			let hasRole = false;
			let desiredRole = emojiToRole(messageReaction.emoji.name, messageReaction.message.id);
			try {
				hasRole = misc.roleInRoles(desiredRole, guild.member(user).roles.array());
			} catch (e) {
				;
			}

			if (!hasRole) {
				console.log("Add role " + desiredRole + " for user " + user);
				cleanupRoles(guild, desiredRole, user);
				var addingThisRole = guild.roles.find(addingThisRole => addingThisRole.name === desiredRole);
				await guild.member(user).addRole(addingThisRole);
			} else {
				console.log("Remove role " + desiredRole);
				var removingThisRole = guild.roles.find(removingThisRole => removingThisRole.name === desiredRole);
				await guild.member(user).removeRole(removingThisRole);
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
