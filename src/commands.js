/*
    commands.js
    Handles comands, performing assorted responses to input.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
	Modified by Tyler "NFreak" Morrow for the CGCC Discord Server.
*/

const fs = require("fs");
const misc = require("./misc.js");
const blacklist = require("./blacklist.js");

//let challengeList = JSON.parse(fs.readFileSync("./info/challenge.json", "utf8"));
let voteList = JSON.parse(fs.readFileSync("./info/votes.json", "utf8"));
let challengeList = JSON.parse(fs.readFileSync("./info/challenge.json", "utf8"));
let todoList = JSON.parse(fs.readFileSync("./info/todo.json", "utf8"));
let userCommandList = JSON.parse(fs.readFileSync("./info/userCommands.json", "utf8"));

//Spambot detection
let spamlist = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));

let commandPrefix = "!";
let helpString = ["", ""];

helpString[0] += "`!members` - Tell us how many members are on a server, and how many are online.\n";
helpString[0] += "`!top PLACEMENTS NUM_MESSAGES CHANNEL_NAME` - Tells you the top `PLACEMENTS` most frequent posters over the last `NUM_MESSAGES` messages in #`CHANNEL_NAME` (more messages = more time)\n";
helpString[0] += "`!setcommand COMMAND_NAME text` - Will create a user-accessible =`COMMAND_NAME` that will make the bot return any text after `COMMAND_NAME`.\n";
helpString[0] += "`!describecommand COMMAND_NAME description` - Adds a description to display in `!help` for the users.\n";
helpString[0] += "`!removecommand COMMAND_NAME` - Will remove the user-accessible =`COMMAND_NAME`, if it exists.\n";
helpString[0] += "`!hidecommand COMMAND_NAME` - Toggles visibility of a help command.\n";
helpString[0] += "`!helpcount` - Show number of uses each user command has recieved.\n";
helpString[0] += "`!helphidden` - Display hidden user commands.\n";
helpString[0] += "`!kill` - End this bot instance. Bot should automatically restart.\n";
helpString[0] += "`!refresh` - Remove all reacts not by the bot in the roles channel.\n";
helpString[0] += "`!say CHANNEL MESSAGE` - Send any message to any channel.\n";
helpString[0] += "`!purge CHANNEL NUMBER` - Delete NUMBER messages from CHANNEL.\n";
helpString[0] += "`!remindme DAYS MESSAGE` - Send an automatic message to the bot-log channel after `DAYS` days have passed.\n";

helpString[1] += "`!emotelist EMOTES` - The list of emotes to add to a message when reacting with :cgccWhite:.\n";
helpString[1] += "`!todo` - Display the todo list.\n";
helpString[1] += "`!todo add task` - Adds `task` to the todo list.\n";
helpString[1] += "`!todo remove task` - Removes `task` from the todo list. Either by string or number.\n";
helpString[1] += "`!blacklist` - List all words currently on the blacklist.\n";
helpString[1] += "`!blacklist add word` - Add `word` to the blacklist.\n";
helpString[1] += "`!blacklist remove word` - Remove `word` from the blacklist.\n";
helpString[1] += "`!blacklist violations ID|Tag` - List all words that were removed as violations from a user with that ID or Tag.\n";
helpString[1] += "`!blacklist warnings ID|Tag` - List all words that were flagged as warnings from a user with that ID or Tag.\n";
helpString[1] += "`!log` - Print a log of all users with recorded blacklist warnings or infractions.\n";
helpString[1] += "`!logfile` - Send a .csv file containing users and the quantity of violations/warnings.\n";
helpString[1] += "`!spambots add phrase` - Add a string to the new user spambot filter.\n";
helpString[1] += "`!spambots remove phrase` - Add a string to the new user spambot filter.\n";
helpString[1] += "`!resetchallenge` - Clears the challenge and voting lists.\n";
helpString[1] += "`!getvotes` - Gets all current challenge votes.\n";


async function modCommands(message, args) {
	if (args[0] == "!members") {
		let memberList = message.guild.members.array();
		let memberCount = message.guild.memberCount;
		let onlineCount = 0;
		for (let i = 0; i < memberList.length; i++) {
			if (memberList[i].presence.status != "offline")
				onlineCount += 1;
		}
		return await message.channel.send(message.guild.name + " currently has " + memberCount + " total members. " + onlineCount + " members are currently online.");
	} else if (args[0] == "!todo") {
		if (args.length == 1) {
			let str = "Todo list:\n\n";
			for (let i = 0; i < todoList.length; i++)
				str += i.toString() + ": " + todoList[i] + "\n";
			return await message.channel.send(str);
		}
		else if (args.length == 2) {
			if (args[1] == "add")
				return await message.channel.send("Usage: `!todo add item`");
			else if (args[1] == "remove")
				return await message.channel.send("Usage: `!todo remove item`");
		} else if (args.length > 2) {
			let task = message.content.substring(("!todo "+args[1]+" ").length);
			if (args[1] == "add") {
				todoList.push(task);
				fs.writeFileSync('./info/todo.json', JSON.stringify(todoList, null, "\t"));
				return await message.channel.send("Added `" + task + "` to the todo list.");
			} else if (args[1] == "remove") {
				if (Number(task) == NaN) {
					let ind = todoList.indexOf(task);
					if (ind < 0) {
						return await message.channel.send("Could not find `" + task + "` on the todo list.");
					} else {
						todoList.splice(ind, 1);
						fs.writeFileSync('./info/todo.json', JSON.stringify(todoList, null, "\t"));
						return await message.channel.send("Removed `" + task + "` from the todo list.");
					}
				} else {
					let ind = parseInt(task);
					if (ind < todoList.length) {
						task = todoList[ind];
						todoList.splice(ind, 1);
						fs.writeFileSync('./info/todo.json', JSON.stringify(todoList, null, "\t"));
						return await message.channel.send("Removed `" + task + "` from the todo list.");
					} else {
						return await message.channel.send("Index " + args[2] + " is not a valid number on the todo list.");
					}
				}
			}
		}
	} else if (args[0] == "!top") {
		if (args.length < 4) {
			return await message.channel.send("USAGE: `!top PLACEMENTS QUANTITY_MESSAGES CHANNEL_NAME` -- For Example `!top 5 10000 general` would return the Top 5 posters over the last 10000 messages in #general.");
		}
		let quantity_messages = 0;
		let relevant_channel = "";
		let placements = 0;
		try {
			placements = parseInt(args[1]);
			quantity_messages = parseInt(parseFloat(args[2]) / 100);
			if (quantity_messages < 1)
				quantity_messages = 1;
			if (args[3].startsWith("#")) {
				args[3] = args[3].substring(1);
			}
			relevant_channel = message.guild.channels.find("name", args[3]);
			console.log(relevant_channel);
		} catch (e) {
			return await message.channel.send(e.message);
		}
		let resultsMessage = await message.channel.send("*Calculating...*");
		let msgArray = [];
		let before = "";
		for (let i = 0; i < quantity_messages; i++) {
			let options = {limit: 100};
			if (before != "")
				options.before = before;
				
			let msgs = await relevant_channel.fetchMessages(options);
			msgs = msgs.array();
			msgArray = msgArray.concat(msgs);
			before = msgs[msgs.length - 1].id;
		}
		
		let dict = {};
		for (let i = 0; i < msgArray.length; i++) {
			if (msgArray[i].author.id in dict) {
				dict[msgArray[i].author.id][0] += 1;
			} else {
				dict[msgArray[i].author.id] = [];
				dict[msgArray[i].author.id][0] = 1;
				dict[msgArray[i].author.id][1] = msgArray[i].author.tag;
			}
		}
		let dictArray = [];
		for (let user in dict) {
			dictArray.push([user, dict[user][0], dict[user][1]]);
		}
		dictArray.sort(function(a, b) {
			return b[1] - a[1];
		});
		let str = "Top " + placements + " #" + args[3] + " posters as of the last " + args[2] + " messages, since `" + msgArray[msgArray.length - 1].createdAt + "`:\n\n";
		for (let i = 0; i < placements && i < dictArray.length; i++) {
			str += dictArray[i][2] + ": " + dictArray[i][1] + "\n";
		}
		console.log(str);
		return await resultsMessage.edit(str);
	} else if (args[0] == "!purge") {
		if (args.length < 3)
			return await message.channel.send("USAGE: `!purge CHANNEL QUANTITY` -- example: `!purge general 100` will delete the last 100 messages in #general.");

		let relevant_channel = null;
		let quantity_messages = 0;
		try {
			if (args[1].startsWith("#"))
				args[1] = args[1].substring(1);
			quantity_messages = parseInt(args[2]);
			relevant_channel = message.guild.channels.find("name", args[1]);
		} catch (e) {
			return await message.channel.send(e.message);
		}
		if (relevant_channel == null) {
			return await message.channel.send("Could not find a channel with that name.");
		}
		let mChannel = message.channel;
		await message.delete();
		let msgArray = [];
		let before = "";
		for (let i = 0; i < quantity_messages; i++) {
			let options = {limit: 1};
			
			let msgs = await relevant_channel.fetchMessages(options);
			msgs = msgs.array();
			for (let j = 0; j < msgs.length; j++) {
				await msgs[j].delete();
			}
		}
		return await mChannel.send(quantity_messages.toString() + " messages deleted from " + args[1] + ".");
	} else if (args[0] == "!modhelp") {
		let s = "Here are some commands I can do for Moderators:\n\n";
		await message.channel.send(s + helpString[0]);
		await message.channel.send(helpString[1] + "`!help` - Commands for all users.\n");
	} else if (args[0] == "!logfile") {
		await message.channel.send({
			files: [{
				attachment: "./info/censorshipInfo.csv",
				name: "CgccLog.csv"
			}]
		});
	} else if (args[0] == "!kill") {
		console.log("Received !kill.");
		process.exit(1);
	} else if (args[0] == "!say") {
		
		if (args.length < 3) {
			return await message.channel.send("USAGE: `!say CHANNEL MESSAGE` -- example: `!say general Hello world!`");
		}
		let len = args[0].length + args[1].length + 2;
		if (args[1].startsWith("#")) {
			args[1] = args[1].substring(1);
		}
		let relevant_channel = null;
		try {
			relevant_channel = message.guild.channels.find("name", args[1]);
		} catch (e) {
			return await message.channel.send(e.message);
		}
		if (relevant_channel == null) {
			return await message.channel.send("I couldn't find a channel with that name.");
		}

		return await relevant_channel.send(message.content.substring(len));
		
	} 
	else if (args[0] == "!remindme") {
		if (args.length < 3) {
			return await message.channel.send("USAGE EXAMPLE: `!remindme 3 unban ThatGuy#0001` - 72 hours (3 days) after posting this, I will send the message `unban ThatGuy#0001`.");
		}
		let time = parseFloat(args[1]);
		if (time) {
			let msg = message.content.substring(args[0].length + args[1].length + 2);
			let currentDate = new Date();
			misc.addReminder(new Date(currentDate.getTime() + (1000 * 60 * 60 * 24) * time), msg);
			return await message.channel.send("Added reminder in " + args[1] + " days to: " + msg);
		} else {
			return await message.channel.send("Invalid number of days provided.");
		}
	} else if (args[0] == "!roleassign") {
		console.log("Setting up role assignment channel");
		await message.channel.send({
			files: [{
				attachment: "./img/HeaderRoles.png",
				name: "HeaderRoles.png"
			}]
		});
		await message.channel.send("CGCC has a number of controller modding skill roles! Here, you can use Discord reactions to assign your server-wide roles. Just click on the color-coded emote reactions below, and you'll be automatically assigned a role. To remove a role from yourself, just react again!");
		await message.channel.send({
			files: [{
				attachment: "./img/Roles1.png",
				name: "Roles1.png"
			}]
		});await message.channel.send({
			files: [{
				attachment: "./img/Roles2.png",
				name: "Roles2.png"
			}]
		});await message.channel.send({
			files: [{
				attachment: "./img/Roles3.png",
				name: "Roles3.png"
			}]
		});
		await message.channel.send("**Set your roles below**");
		await message.channel.send("*Your primary role is your strongest skill, and also sets your name color. Secondary roles are for anything else you work with or dabble in!*");
		await message.channel.send({
			files: [{
				attachment: "./img/RolesPrimary.png",
				name: "RolesPrimary.png"
			}]
		});
		await message.channel.send({
			files: [{
				attachment: "./img/RolesSecondary.png",
				name: "RolesSecondary.png"
			}]
		});
	} else if (args[0] == "!emotelist") {
		if (args.length > 1) {
			let arr = [];
			if (args[1] != "none") {
				let argsNorm = message.content.split(" ");
				for (let i = 1; i < argsNorm.length; i++) {
					arr.push(argsNorm[i]);
				}
			}

			fs.writeFileSync("./info/roleEmoji.json", JSON.stringify(arr), "utf8");

			return await message.channel.send("Set emotelist to: " + arr.length == 0 ? "Empty." : arr.toString());
		} else {
			return await message.channel.send("Example usage: `!emotelist zhuW zhuW2 puffWhat`.");
		}
	} else if (args[0] == "!setcommand" || args[0] == "!addcommand") {
		if (args.length < 3) {
			return await message.channel.send("USAGE: `!setcommand COMMAND_NAME text` -- For example the command `!setcommand controllers Here's some useful controller info!` would create a command `!controllers` that would print `Here's some useful controller info!`.");
		} else {
			//first check if such a command already exists
			let exists = false;
			for (let i = 0; i < userCommandList.length; i++) {
				if (userCommandList[i].command == commandPrefix + args[1]) {
					//just update its text
					userCommandList[i].text = message.content.substring(args[0].length + args[1].length + 2);
					exists = true;
				}
			}

			if (!exists) { //add new command
				let toAdd = {
					"command": commandPrefix + args[1],
					"text": message.content.substring(args[0].length + args[1].length + 2),
					"description": ""
				}
				userCommandList.push(toAdd);
			}

			fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");
			let s = exists ? "Modified " : "Created ";
			return await message.channel.send(s + "the `" + commandPrefix + args[1] + "` command.");
		}
	} else if (args[0] == "!removecommand") {
		if (args.length < 2) {
			return await message.channel.send("USAGE: `!removecommand COMMAND_NAME` - For example `!removecommand controllers` would remove the `!controllers` command.");
		}

		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].command == commandPrefix + args[1]) {
				userCommandList.splice(i, 1);
			}
		}

		fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");
		return await message.channel.send("Removed `" + commandPrefix + args[1] + "`.");
	} else if (args[0] == "!describecommand") {
		if (args.length < 3) {
			return await message.channel.send("USAGE: `!describecommand COMMAND_NAME description` - For example `!describecommand controllers Controller support info.` would set the description of `!controllers` to `Controller support info.`");
		}

		//first find the relevant element index
		let index = -1;
		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].command == commandPrefix + args[1]) {
				index = i;
			}
		}

		if (index > -1) {
			userCommandList[index].description = message.content.substring(args[0].length + args[1].length + 2);
			fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");

			return await message.channel.send("Updated description of `" + commandPrefix + args[1] + "`.");
		} else {
			return await message.channel.send("Could not find `" + commandPrefix + args[1] + "`.");
		}
	} else if (args[0] == "!hidecommand") {
		if (args.length < 2)
			return await message.channel.send("USAGE: `!hidecommand COMMANDNAME` ie to hide the `!ping` command type `!hidecommand ping`.");
		if (args[1][0] == commandPrefix) //remove user-typed prefix if it exists
			args[1] = args[1].substring(1);
		let index = -1;
		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].command == commandPrefix + args[1])
				index = i;
		}
		if (index != -1) {
			if (!userCommandList[index].hide)
				userCommandList[index].hide = true;
			else
				userCommandList[index].hide = false;
			fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");
			return await message.channel.send("Set `" + commandPrefix + args[1] + "` to " + (userCommandList[index].hide ? "hidden" : "visible") + ".");
		} else {
			return await message.channel.send("Could not find the command `" + commandPrefix + args[1] + "`.");
		}
	}
	else if (args[0] == "!helpcount") {
		let s = "Command usage stats:\n";
		for (let i = 0; i < userCommandList.length; i++) {
			s += "`" + userCommandList[i].command + "`: " + (userCommandList[i].count ? userCommandList[i].count.toString() : "0") + "\n";
		}
		return await message.channel.send(s);
	} else if (args[0] == "!helphidden") {
		let s = "Hidden help commands:\n";
		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].hide) {
				s += "`" + userCommandList[i].command + "`\n";
			}
		}
		return await message.channel.send(s);
	}
	else if (args[0] == "!getvotes") {
		let output = "CHALLENGE VOTES:\n*============================*\n";
		for (let n = 0; n < challengeList.length; n++){
			let totalVotes = 0;
			for (let i = 0; i < voteList.length; i++){
				if (voteList[i].vote == (n+1)){
					totalVotes++;
				}
			}
			output += "Total votes for entry " + (n+1) + ": `" + totalVotes + "`\n";
		}
		return await message.author.send(output);
	}
	else if (args[0] == "!resetchallenge") {
		challengeList.splice(0, challengeList.length);
		voteList.splice(0, voteList.length);
		fs.writeFileSync('./info/challenge.json', JSON.stringify(challengeList), 'utf8');
		fs.writeFileSync('./info/votes.json', JSON.stringify(voteList), 'utf8');		return await message.channel.send("Challenge submissions and votes have been reset");
	}
	else if (args[0] == "!spambots") {
		if (args.length == 1) {
			let str = "Words on the spambot filter: \n`";
			for (let i = 0; i < spamlist.length; i++) {
				str += spamlist[i] + "\n";
			}
			str += "`";
			return await message.channel.send(str);
		}
		else if (args.length > 1 && args[1] == "add") {
			if (args.length > 2) {
				spamlist.push(args[2]);
				fs.writeFileSync('./info/spam.json', JSON.stringify(spamlist), 'utf8');
				await message.channel.send("`" + args[2] + "` has been added to the spamlist.");
			} else {
				await message.channel.send("Usage: `!spamlist add word`");
			}
		} else if (args.length > 1 && args[1] == "remove") {
			if (args.length > 2) {
				let ind = spamlist.indexOf(args[2]);
				if (ind > -1) {
					spamlist.splice(ind, 1);
					fs.writeFileSync('./info/spam.json', JSON.stringify(spamlist), 'utf8');
					await message.channel.send("`" + args[2] + "` has been removed from the spamlist.");
				} else {
					await message.channel.send("`" + args[2] + "` was not found in the spamlist.");
				}
			} else {
				await message.channel.send("Usage: `!spamlist remove word`");
			}
		}
	}
}

async function userCommands(message, args) {
	if (args[0] == "!contribute") {
		let guild = message.member.guild;
		await guild.member(message.author).addRole(guild.roles.find("name", "Contributor"));
		await message.channel.send("<@!" + message.author.id + ">, you are now a Contributor. You can post **ONE** message to " + message.guild.channels.find("name", "resources") + ". Thank you for your contribution!");
		return setTimeout(() => {
			guild.member(message.author).removeRole(guild.roles.find("name", "Contributor"));
		}, 300000) // 5 minutes
	}
	// CHALLENGE COMMANDS
	else if (args[0] == "!challenge") {
		// TODO: Mod command to provide and set these dates
		var currentDate = new Date();
		var submissionStart = new Date('November 10, 2018 08:00 GMT-04:00');
		var submissionDeadline = new Date('November 11, 2018 23:59 GMT-04:00');
		var voteStart = new Date('November 12, 2018 08:00 GMT-04:00');
		var voteEnd = new Date('November 14, 2018 08:00 GMT-04:00');
		console.log("Current date: " + currentDate + " Submission start: " + submissionStart + " Deadline: " + submissionDeadline + " Voting start: " + voteStart + " Voting end:" + voteEnd);

		if (args[1] == "help" || args.length < 2 ||
			(args[1] != "submit" && args[1] != "vote" && args[1] != "view")) {
			return await message.channel.send("CustomGCC Challenge commands:\n`!challenge submit LINK-TO-ENTRY DESCRIPTION`: Submit your entry with a link and description" +
																		   "\n`!challenge vote ENTRY-NUMBER`: Vote for the provided entry" + 
																		   "\n`!challenge view`: View all submissions (must have DMs enabled on this server)" +
																		   "\n`!challenge help`: Display this message\n" +
											 "\n Challenge submissions open: `" + submissionStart.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT`" +
											 "\n Submission deadline: `" + submissionDeadline.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT`" +
											 "\n Voting begins: `" + voteStart.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT`" +
											 "\n Voting deadline: `" + voteEnd.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT`");
		} 
		else if (args[1] == "submit"){
			if (message.channel.type != "dm"){
				await message.delete();
			}
			if (args.length < 4) {
				return await message.channel.send("USAGE: `!challenge submit LINK-TO-ENTRY DESCRIPTION`, where 'LINK-TO-ENTRY' is an imgur/google drive/etc link, and 'DESCRIPTION' is a title or writeup on your entry.");
			} 
			if (currentDate < submissionStart){
				return await message.channel.send("Challenge submissions are not yet open. Submit your entry after: " + submissionStart.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT");
			}
			if (currentDate > submissionDeadline){
				return await message.channel.send("Challenge submissions are now closed, sorry!");
			}
			
			//first check if this user has an entry already
			let exists = false;
			for (let i = 0; i < challengeList.length; i++) {
				if (challengeList[i].ID == message.author.toString()) {
					challengeList[i].entry = args[2].toString();
					challengeList[i].descr = message.content.substring(("!challenge submit " + args[2] +" ").length);
					exists = true;
				}
			}
			if (exists) {
				console.log("Updating entry for user : " + message.author.username);
				fs.writeFileSync("./info/challenge.json", JSON.stringify(challengeList, null, "\t"), "utf8");
				return await message.channel.send("Your challenge entry has been updated! Good luck!");
			}
			else { 
				let toAdd = {
					"user": message.author.username,
					"ID": message.author.toString(),
					"entry": args[2],
					"descr": args[3]
				}
				challengeList.push(toAdd);
				console.log("Submitting challenge entry for user : " + message.author.username);
				fs.writeFileSync("./info/challenge.json", JSON.stringify(challengeList, null, "\t"), "utf8");
				return await message.channel.send("Thank you for entering the CustomGCC Challenge. Good luck!");
			}
		}
		else if (args[1] == "vote") {
			if (message.channel.type != "dm"){
				await message.delete();
			}
			if (args.length != 3) {
				return await message.channel.send("USAGE: `!challenge vote ENTRY-NUMBER`");
			} 
			if (currentDate < voteStart){
				return await message.channel.send("Challenge voting is not yet open. Voting will open on: " + voteStart.toLocaleString('en-US', { timeZone: "America/Montserrat" }) + " EDT");
			}
			if (currentDate > voteEnd){
				return await message.channel.send("Challenge voting has closed, sorry! Check back for the next challenge");
			}
			if (new Date(message.member.joined_at) > voteStart){
				return await message.channel.send("Sorry, to prevent tampering, only previously active server members are eligible to vote in this challenge.");
			}
			// First check if this user has voted already. Hash user IDs to help prevent tampering.
			// Add 1 to the vote, we don't want to start at 0
			let exists = false;
			for (let i = 0; i < voteList.length; i++) {
				if (voteList[i].userID == hashCode(message.author.toString())) {
					voteList[i].vote = args[2].toString();
					exists = true;
				}
			}
			// Check if the vote is valid, and if so, that the submission voted for actually exists
			var voteInt = parseInt(args[2].toString());
			if (isNaN(voteInt) || voteInt > challengeList.length || voteInt <= 0){
				return await message.channel.send("Please vote for a valid entry.");
			}

			if (exists) {
				fs.writeFileSync("./info/votes.json", JSON.stringify(voteList, null, "\t"), "utf8");
				return await message.channel.send("Your vote has been updated!");
			}
			else { 
				let toAdd = {
					"userID": hashCode(message.author.toString()),
					"vote": args[2].toString()
				}
				voteList.push(toAdd);
				fs.writeFileSync("./info/votes.json", JSON.stringify(voteList, null, "\t"), "utf8");
				return await message.channel.send("Your vote has been accepted!");
			}
		}
		else if (args[1] == "view"){
			if (currentDate < voteStart){
				return await message.channel.send("Sorry, challenge entries are not yet available to view. Check back soon!");
			}
			let allSubmissions = "Here are all the entries to the current CustomGCC Challenge:\n========================\n";
			for (let i = 0; i < challengeList.length; i++) {
				allSubmissions += "`Entry " + (i+1) + "`:\n" + challengeList[i].entry + "\n" + challengeList[i].descr + "\n========================\n";
			}
			await message.channel.send("Please check your private messages to view the full challenge list! (You must have messages from server members enabled. If not, please check the latest announcements for the list)");
			return await message.author.send(allSubmissions);
		}
	}
	// End of CHALLENGE commands
	else if (args[0] == "!help") {
		let userHelpString = "`!contribute` - Allows you to submit a single post to #resources\n";
		userHelpString += "`!challenge` - Use `!challenge help` to view Challenge commands\n";
		for (let i = 0; i < userCommandList.length; i++) {
			if (!userCommandList[i].hide){
				userHelpString += "`" + userCommandList[i].command + "` -  " + userCommandList[i].description + "\n";
			}
		}
		return await message.channel.send("Here's a list of commands for all users:\n" + userHelpString);
	}
	else if (args[0].startsWith(commandPrefix)) {
		for (let i = 0; i < userCommandList.length; i++) {
			//check through all defined userCommands
			if (args[0] == userCommandList[i].command) {
				if (!userCommandList[i].count)
					userCommandList[i].count = 0;
				userCommandList[i].count += 1;
				fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");	
				return await message.channel.send(userCommandList[i].text);
			}
		}
	}
}

function hashCode(s) {
    for(var i = 0, h = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return h;
}

module.exports.modCommands = modCommands;
module.exports.userCommands = userCommands;
