/*
	config.js

	Handles CGCC Bot configuration on startup -- will alert the user to missing files, create them if necessary, etc.
	(C) Adam Gincel 2018
	Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");

function configure() {
	let didConfigure = false;
	if (!fs.existsSync("./info/blacklistIgnore.json")) {
		didConfigure = true;
		console.log("Blacklist Ignore file not found. This file contains an array of Channel IDs in which to not enforce the blacklist.");
		fs.writeFileSync("./info/blacklistIgnore.json", "[]", "utf8");
		console.log("./info/blacklistIgnore.json created.");
	}

	if (!fs.existsSync("./info/blacklist.json")) {
		didConfigure = true;
		console.log("Blacklist file not found. This file contains an array of words which, if found, are to have their containing message removed, or warned about.");
		fs.writeFileSync("./info/blacklist.json", "[]", "utf8");
		console.log("./info/blacklist.json created.");
	}

	if (!fs.existsSync("./info/blacklistWarningSpecialCases.json")) {
		didConfigure = true;
		console.log("Blacklist Warning Special Cases file not found. This file contains any words which, due to their short nature, come up frequently as false warning positives. These are ignored.");
		fs.writeFileSync("./info/blacklistWarningSpecialCases.json", "[]", "utf8");
		console.log("./info/blacklistWarningSpecialCases.json created.");
	}

	if (!fs.existsSync("./info/censorshipInfo.json")) {
		didConfigure = true;
		console.log("Censorship info not found. This is a list of users with infractions.");
		fs.writeFileSync("./info/censorshipInfo.json", "{}", "utf8");
		fs.writeFileSync("./info/censorshipInfo.csv", "", "utf8");
		console.log("./info/censorshipInfo.json and .csv created.");
	}

	if (!fs.existsSync("./info/discordToken.txt")) {
		didConfigure = true;
		console.log("Discord Token text file not found. This file should contain your Discord Bot token.");
		fs.writeFileSync("./info/discordToken.txt", "PutYour.Token_Here", "utf8");
		console.log("./info/discordToken.txt created and filled with example token.");
	}

	if (!fs.existsSync("./info/ids.json")) {
		didConfigure = true;
		let ids = {
			roles: "123456",
			secondary: "654321",
			announcements: "3123131",
		};
		console.log("ids file not found. This file contains the specific IDs of either messages or channels that are used for things like reading specific message reactions, posting to specific server channels, etc.");
		fs.writeFileSync("./info/ids.json", JSON.stringify(ids), "utf8");
		console.log("./info/ids.json created and populated with example data.");
	}

	if (!fs.existsSync("./info/roleEmoji.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/roleEmoji.json", "[]", "utf8");
		console.log("./info/roleEmoji.json created. This list is what gets added to any message in the role-assignment channel after it sees a :cgccWhite: react. Configured with the !emotelist command.");
	}

	if (!fs.existsSync("./info/todo.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/todo.json", "[]", "utf8");
		console.log("./info/todo.json created. This is a todolist, modified with !todo.");
	}

	if (!fs.existsSync("./info/userCommands.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/userCommands.json", "[]", "utf8");
		console.log("./info/userCommands.json created. This is the list of dynamically created call-and-response commands for all users, managed with !setcommand, !describecommand, and !deletecommand");
	}

	if (!fs.existsSync("./info/reminders.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/reminders.json", "[]", "utf8");
		console.log("./info/reminders.json created. A list of objects with Dates and Messages, sent to the ids.reminders channel once the given date is passed.");
	}	

	if (didConfigure) {
		console.log("Configuration complete.");
		console.log("The bot may not work properly until the created files are populated with accurate information, if applicable.");
	}
}

module.exports.configure = configure;
