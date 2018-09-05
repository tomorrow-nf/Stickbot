/*
    blacklist.js

    Handles adding/removing to/from a given blacklist, removing messages containing those words and/or notifying mods about messages that may or may not contain them.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
*/

const fs = require("fs");
const misc = require("./misc.js");

let blacklist = JSON.parse(fs.readFileSync('./info/blacklist.json', 'utf8'));
let censorshipInfo = JSON.parse(fs.readFileSync("./info/censorshipInfo.json", "utf8"));

let blacklistIgnore = JSON.parse(fs.readFileSync('./info/blacklistIgnore.json', 'utf8'));
let blacklistWarningSpecialCases = JSON.parse(fs.readFileSync('./info/blacklistWarningSpecialCases.json', 'utf8'));

function censorshipToCSV() {
	let str = "id,tag,violations,warnings\n";
	let keys = Object.keys(censorshipInfo);
	for (let i = 0; i < keys.length; i++) {
		let user = censorshipInfo[keys[i]];
		str += keys[i] + "," + user.tag + "," + user.violations.length + "," + user.warnings.length + "\n";
	}
	fs.writeFileSync("./info/censorshipInfo.csv", str, "utf8");
}

function censorshipUserByIdOrTag(user) {
	//check if exists by Id
	if (censorshipInfo[user] != undefined) {
		return censorshipInfo[user];
	} else {
		let keys = Object.keys(censorshipInfo);
		for (let i = 0; i < keys.length; i++) {
			let u = censorshipInfo[keys[i]];
			if (u.tag.toLowerCase() == user)
				return u;
		}
		return null;
	}
}

function censorshipInfoAddViolation(user, word) {
	if (!censorshipInfo[user.id]) {
		censorshipInfo[user.id] = {};
		censorshipInfo[user.id].tag = user.tag;
		censorshipInfo[user.id].violations = [];
		censorshipInfo[user.id].warnings = [];
	}
	censorshipInfo[user.id].tag = user.tag;
	censorshipInfo[user.id].violations.push(word);
	fs.writeFileSync("./info/censorshipInfo.json", JSON.stringify(censorshipInfo), "utf8");
	censorshipToCSV();
}

function censorshipInfoAddWarning(user, word) {
	if (!censorshipInfo[user.id]) {
		censorshipInfo[user.id] = {};
		censorshipInfo[user.id].tag = user.tag;
		censorshipInfo[user.id].violations = [];
		censorshipInfo[user.id].warnings = [];
	}
	censorshipInfo[user.id].tag = user.tag;
	censorshipInfo[user.id].warnings.push(word);
	fs.writeFileSync("./info/censorshipInfo.json", JSON.stringify(censorshipInfo), "utf8");
	censorshipToCSV();
}

async function blacklistAlertMods(message, violatingWord, warning) {
	let violationChannel = message.guild.channels.find("name", "bot-log");
	let bars = "----------------------\n";
	if (!warning)
		return await violationChannel.send(bars + "Removed message with violation (`" + violatingWord + "`) in #" + message.channel.name + " posted by `@" + message.author.tag + "`:\n`" + message.content + "`");
	else {
		return await violationChannel.send(bars + "Potential violation (`" + violatingWord + "`) in #" + message.channel.name + " posted by `@" + message.author.tag + "`:\n`" + message.content + "`");
	}
}

async function handleBlacklist(message, DiscordBotTag) {
	let updatedText = message.content.toLowerCase().replace(/\n/g, " ");
	let strippedText = updatedText.replace(/[^a-z ]/gi, '');
	
	let words = strippedText.split(" ");
	//check blacklist
	let censoredWord = "";
	for (let i = 0; i < words.length; i++) {
		if (blacklist.includes(words[i])) {
			censoredWord = words[i];
			break;
		}
	}
	if (censoredWord && message.author.tag != DiscordBotTag && !misc.memberIsMod(message) && !(misc.memberIsMod(message) && message.content.startsWith("=blacklist")) && blacklistIgnore.indexOf(message.channel.id) == -1) {
		await message.delete();

		try {
			let warning = await message.author.send("Please refrain from using language like '" + censoredWord + "' on the Icons server.\n\n`" + message.content + "`");
		} catch (e) {
			let warning = await message.channel.send("<@" + message.author.id + ">, please refrain from using that language on this server.");
			warning.delete(2250);
		} 
		censorshipInfoAddViolation(message.author, censoredWord);
		await blacklistAlertMods(message, censoredWord, false);
		return true;
	}
	return false;
}

async function handleBlacklistPotential(message, DiscordBotTag) {
	let updatedText = message.content.toLowerCase().replace(/\n/g, " ");
	let strippedText = updatedText.replace(/[^a-z]/gi, '');
	strippedText = strippedText
			.replace(/@/g, "a")
			.replace(/0/g, "o")
			.replace(/$/g, "s")
			.replace(/5/g, "s")
			.replace(/4/g, "a")
			.replace(/#/g, "h")
			.replace(/3/g, "e")
			.replace(/1/g, "i")
			.replace(/7/g, "t")
			.replace(/6/g, "g")
			.replace(/8/g, "b");	

	let potentialViolation = "";
	for (let i = 0; i < blacklist.length; i++) {
		if (strippedText.indexOf(blacklist[i]) > -1) {
			let specialCaseIndex = blacklistWarningSpecialCases.indexOf(blacklist[i]);
			if (specialCaseIndex < 0) {
				potentialViolation = blacklist[i];
				break;
			} else {
				console.log("Caught a blacklist special case.");
			}
		}
	}
	if (potentialViolation && message.author.tag != DiscordBotTag && !misc.memberIsMod(message) && !(misc.memberIsMod(message) && message.content.startsWith("=blacklist")) && blacklistIgnore.indexOf(message.channel.id) == -1) {
		await blacklistAlertMods(message, potentialViolation, true);
		censorshipInfoAddWarning(message.author, potentialViolation);
	}
}

async function handleBlacklistCommands(message, args) {
	if (args[0] == "=blacklist" && misc.memberIsMod(message)) {
		if (args.length == 1) {
			let str = "Words on the blacklist: \n`";
			for (let i = 0; i < blacklist.length; i++) {
				str += blacklist[i] + "\n";
			}
			str += "`";
			return await message.channel.send(str);
		}
		else if (args.length > 1 && args[1] == "add") {
			if (args.length > 2) {
				blacklist.push(args[2]);
				fs.writeFileSync('./info/blacklist.json', JSON.stringify(blacklist), 'utf8');
				await message.channel.send("`" + args[2] + "` has been added to the blacklist.");
			} else {
				await message.channel.send("Usage: `=blacklist add word`");
			}
		} else if (args.length > 1 && args[1] == "remove") {
			if (args.length > 2) {
				let ind = blacklist.indexOf(args[2]);
				if (ind > -1) {
					blacklist.splice(ind, 1);
					fs.writeFileSync('./info/blacklist.json', JSON.stringify(blacklist), 'utf8');
					await message.channel.send("`" + args[2] + "` has been removed from the blacklist.");
				} else {
					await message.channel.send("`" + args[2] + "` was not found in the blacklist.");
				}
			} else {
				await message.channel.send("Usage: `=blacklist remove word`");
			}
		} else if (args.length > 1 && args[1] == "violations") {
			if (args.length > 2) {
				let user = censorshipUserByIdOrTag(args[2]);
				if (user) {
					let str = "Here is a list of all violating words posted by @" + user.tag + ":\n\n`";
					for (let i = 0; i < user.violations.length; i++) {
						str += user.violations[i] + ", "
					}
					str = str.substr(0, str.length - 2); //remove final comma and space
					str += "`";
					await message.channel.send(str);
				} else {
					await message.channel.send("Could not find a user by that ID or tag.");
				}
			} else {
				await message.channel.send("Usage: `=blacklist violations ID|Tag`");
			}
		} else if (args.length > 1 && args[1] == "warnings") {
			if (args.length > 2) {
				let user = censorshipUserByIdOrTag(args[2]);
				if (user) {
					let str = "Here is a list of all words flagged for warning posted by @" + user.tag + ":\n\n`";
					for (let i = 0; i < user.warnings.length; i++) {
						str += user.warnings[i] + ", "
					}
					str = str.substr(0, str.length - 2); //remove final comma and space
					str += "`";
					await message.channel.send(str);
				} else {
					await message.channel.send("Could not find a user by that ID or tag.");
				}
			} else {
				await message.channel.send("Usage: `=blacklist warnings ID|Tag`");
			}
		} 
	} else if (args[0] == "=log" && misc.memberIsMod(message)) {
		let keys = Object.keys(censorshipInfo);
		let str = "```";
		for (let i = 0; i < keys.length; i++) {
			str += keys[i] + " | " + censorshipInfo[keys[i]].tag +  " | Violations: " + censorshipInfo[keys[i]].violations.length + " | Warnings: " + censorshipInfo[keys[i]].warnings.length + "\n";
		}
		str += "```";
		await message.channel.send(str);
	}
}

module.exports.blacklist = blacklist;
module.exports.handleBlacklist = handleBlacklist;
module.exports.handleBlacklistCommands = handleBlacklistCommands;
module.exports.handleBlacklistPotential = handleBlacklistPotential;
