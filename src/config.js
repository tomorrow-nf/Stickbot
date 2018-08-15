/*
	config.js

	Handles Gifkin configuration on startup -- will alert the user to missing files, create them if necessary, etc.
	(C) Adam Gincel 2018
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

	if (!fs.existsSync("./info/cotw.json")) {
		didConfigure = true;
		console.log("Cotw file not found. Contains all users' cotw submissions until cleared.");
		fs.writeFileSync("./info/cotw.json", "{}", "utf8");
		console.log("./info/cotw.json created.");
	}

	if (!fs.existsSync("./info/discordToken.txt")) {
		didConfigure = true;
		console.log("Discord Token text file not found. This file should contain your Discord Bot token.");
		fs.writeFileSync("./info/discordToken.txt", "Yah2hAtenajce0ay342CA.ABC123.esUgasemrawfa_Pc9Q", "utf8");
		console.log("./info/discordToken.txt created and filled with example token.");
	}

	if (!fs.existsSync("./info/ids.json")) {
		didConfigure = true;
		let ids = {
			roles: "123456",
			secondary: "654321",
			announcements: "3123131",
			patchnotes: "71563715631"
		};
		console.log("ids file not found. This file contains the specific IDs of either messages or channels that are used for things like reading specific message reactions, posting to specific server channels, etc.");
		fs.writeFileSync("./info/ids.json", JSON.stringify(ids), "utf8");
		console.log("./info/ids.json created and populated with example data.");
	}

	if (!fs.existsSync("./info/recent-news.txt")) {
		didConfigure = true;
		fs.writeFileSync("./info/recent-news.txt", "", "utf8");
		console.log("./info/recent-news.txt created. This tracks the latest Icons news link. Unused as of time of writing.");
	}

	if (!fs.existsSync("./info/roleEmoji.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/roleEmoji.json", "[]", "utf8");
		console.log("./info/roleEmoji.json created. This list is what gets added to any message in the set-your-roles channel after it sees a :wavedash: react. Configured with the =emotelist command.");
	}

	if (!fs.existsSync("./info/todo.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/todo.json", "[]", "utf8");
		console.log("./info/todo.json created. This is a todolist, modified with =todo.");
	}

	if (!fs.existsSync("./info/userCommands.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/userCommands.json", "[]", "utf8");
		console.log("./info/userCommands.json created. This is the list of dynamically created call-and-response commands for all users, managed with =setcommand, =describecommand, and =deletecommand");
	}

	if (!fs.existsSync("./info/voicechannels.json")) {
		didConfigure = true;
		let vc = {
			category: "123456789",
			default: [
				"123456789"
			],
			dynamic: [
				{name: "Dynamic Voice 1", id: null},
				{name: "Dynamic Voice 2", id: null},
				{name: "Final Dynamic Voice", id: null}
			]
		};
		fs.writeFileSync("./info/voicechannels.json", JSON.stringify(vc), "utf8");
		console.log("./info/voicechannels.json created. This contains the category ID where all dynamic voice channels should be placed, a list of Default voice channels that will never be destroyed, and a list of dynamic channel names with null IDs, which will be populated and de-populated at runtime.");
	}

	if (!fs.existsSync("./info/reminders.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/reminders.json", "[]", "utf8");
		console.log("./info/reminders.json created. A list of objects with Dates and Messages, sent to the ids.reminders channel once the given date is passed.");
	}	

	if (!fs.existsSync("./info/feedbacks.json")) {
		didConfigure = true;
		fs.writeFileSync("./info/feedbacks.json", "{}", "utf8");
		console.log("./info/feedbacks.json created. Maps feedback givers IDs (not usernames, not used to track who is submitting what feedback)'s quantity of submitted feedback messages, to put a limit on griefing.");
	}

	if (didConfigure) {
		console.log("Configuration complete.");
		console.log("The bot may not work properly until the created files are populated with accurate information, if applicable.");
	}
}

module.exports.configure = configure;
