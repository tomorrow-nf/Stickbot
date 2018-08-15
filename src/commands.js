/*
    commands.js
    Handles comands, performing assorted responses to input.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
*/

const fs = require("fs");
const misc = require("./misc.js");
const blacklist = require("./blacklist.js");
let todoList = JSON.parse(fs.readFileSync("./info/todo.json", "utf8"));
let cotwList = JSON.parse(fs.readFileSync("./info/cotw.json", "utf8"));
let userCommandList = JSON.parse(fs.readFileSync("./info/userCommands.json", "utf8"));

let commandPrefix = "=";
let helpString = ["", ""];

helpString[0] += "`=members` - Tell us how many members are on a server, and how many are online.\n";
helpString[0] += "`=top PLACEMENTS NUM_MESSAGES CHANNEL_NAME` - Tells you the top `PLACEMENTS` most frequent posters over the last `NUM_MESSAGES` messages in #`CHANNEL_NAME` (more messages = more time)\n";
helpString[0] += "`=setcommand COMMAND_NAME text` - Will create a user-accessible =`COMMAND_NAME` that will make Gifkin return any text after `COMMAND_NAME`.\n";
helpString[0] += "`=describecommand COMMAND_NAME description` - Adds a description to display in `=help` for the users.\n";
helpString[0] += "`=removecommand COMMAND_NAME` - Will remove the user-accessible =`COMMAND_NAME`, if it exists.\n";
helpString[0] += "`=hidecommand COMMAND_NAME` - Toggles visibility of a help command.\n";
helpString[0] += "`=helpcount` - Show number of uses each user command has recieved.\n";
helpString[0] += "`=helphidden` - Display hidden user commands.\n";
helpString[0] += "`=kill` - End this bot instance. Bot should automatically restart.\n";
helpString[0] += "`=refresh` - Remove all reacts not by Gifkin in the roles channel.\n";
helpString[0] += "`=say CHANNEL MESSAGE` - Send any message to any channel.\n";
helpString[0] += "`=purge CHANNEL NUMBER` - Delete NUMBER messages from CHANNEL.\n";
helpString[0] += "`=remindme DAYS MESSAGE` - Send an automatic message to the bot-spam channel after `DAYS` days have passed.\n";

helpString[1] += "`=emotelist EMOTES` - The list of emotes to add to a message when reacting with :wavedash:.\n";
helpString[1] += "`=checkvoice` - Manually check voice channels to see if any additions or removals need to be made.\n";
helpString[1] += "`=scrape` - Scrape icons.gg/news for the latest posted news article.\n";
helpString[1] += "`=scrape post` - Do the same as above, and if it's a new one actually posted it to #announcements or #patch-notes.\n";
helpString[1] += "`=todo` - Display the todo list.\n";
helpString[1] += "`=todo add task` - Adds `task` to the todo list.\n";
helpString[1] += "`=todo remove task` - Removes `task` from the todo list. Either by string or number.\n";
helpString[1] += "`=blacklist` - List all words currently on the blacklist.\n";
helpString[1] += "`=blacklist add word` - Add `word` to the blacklist.\n";
helpString[1] += "`=blacklist remove word` - Remove `word` from the blacklist.\n";
helpString[1] += "`=blacklist violations ID|Tag` - List all words that were removed as violations from a user with that ID or Tag.\n";
helpString[1] += "`=blacklist warnings ID|Tag` - List all words that were flagged as warnings from a user with that ID or Tag.\n";
helpString[1] += "`=log` - Print a log of all users with recorded blacklist warnings or infractions.\n";
helpString[1] += "`=logfile` - Send a .csv file containing users and the quantity of violations/warnings.\n"



async function modCommands(message, args) {
	if (args[0] == "=members") {
		let memberList = message.guild.members.array();
		let memberCount = message.guild.memberCount;
		let onlineCount = 0;
		for (let i = 0; i < memberList.length; i++) {
			if (memberList[i].presence.status != "offline")
				onlineCount += 1;
		}
		return await message.channel.send(message.guild.name + " currently has " + memberCount + " total members. " + onlineCount + " members are currently online.");
	} else if (args[0] == "=todo") {
		if (args.length == 1) {
			let str = "Todo list:\n\n";
			for (let i = 0; i < todoList.length; i++)
				str += i.toString() + ": " + todoList[i] + "\n";
			return await message.channel.send(str);
		}
		else if (args.length == 2) {
			if (args[1] == "add")
				return await message.channel.send("Usage: `=todo add item`");
			else if (args[1] == "remove")
				return await message.channel.send("Usage: `=todo remove item`");
		} else if (args.length > 2) {
			let task = message.content.substring(("=todo "+args[1]+" ").length);
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
	} else if (args[0] == "=top") {
		if (args.length < 4) {
			return await message.channel.send("USAGE: `=top PLACEMENTS QUANTITY_MESSAGES CHANNEL_NAME` -- For Example `=top 5 10000 general` would return the Top 5 posters over the last 10000 messages in #general.");
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
	} else if (args[0] == "=purge") {
		if (args.length < 3)
			return await message.channel.send("USAGE: `=purge CHANNEL QUANTITY` -- example: `=purge general 100` will delete the last 100 messages in #general.");

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
	} else if (args[0] == "=modhelp") {
		let s = "I'm the IconsBot! Here are some commands I can do for Moderators:\n\n";
		if (args.length == 1)
			s += helpString[0];
		else
			s += helpString[parseInt(args[1])];
		s += "-----\n";
		s += "`=contenthelp` - Commands for the Content Team.\n";
		s += "`=help` - Commands for all users.\n";
		s += "I also manage roles in the #set-your-roles channel!\n";
		s += "Try `=modhelp 0` or `=modhelp 1` for more commands.";
		await message.channel.send(s);
	} else if (args[0] == "=logfile") {
		await message.channel.send({
			files: [{
				attachment: "./info/censorshipInfo.csv",
				name: "IconsLog.csv"
			}]
		});
	} else if (args[0] == "=kill") {
		console.log("Received =kill.");
		process.exit(1);
	} else if (args[0] == "=scrape") {
		let post = args[1] && args[1] == "post";
		let scrape = await misc.scrapeNews(message, !post);
		await message.channel.send(scrape.link);
		if (post) {
			if (scrape.new) {
				let channelToSend = scrape.type == "news" ? message.guild.channels.get(misc.ids.announcements) : message.guild.channels.get(misc.ids.patchnotes);
				await channelToSend.send(scrape.link);
			}
		}
	} else if (args[0] == "=say") {
		
		if (args.length < 3) {
			return await message.channel.send("USAGE: `=say CHANNEL MESSAGE` -- example: `=say general Hello world!`");
		}
		let len = args[0].length + args[1].length + 2;
		if (args[1].startsWith("#")) {
			args[1] = args[1].substring(1);
		}
		let relevant_channel = null;
		try {
			relevant_channel = message.guild.channels.find("name", args[1]);
			//console.log(relevant_channel);
		} catch (e) {
			return await message.channel.send(e.message);
		}
		if (relevant_channel == null) {
			return await message.channel.send("I couldn't find a channel with that name.");
		}

		return await relevant_channel.send(message.content.substring(len));
		
	} 
	else if (args[0] == "=remindme") {
		if (args.length < 3) {
			return await message.channel.send("USAGE EXAMPLE: `=remindme 3 unban ThatGuy#0001` - 72 hours (3 days) after posting this, I will send the message `unban ThatGuy#0001`.");
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
	}	
	else if (args[0] == "=setyourroles") {

		await message.channel.send("**Welcome to the #set-your-roles channel! Here, you can use Discord reactions to assign your roles throughout this server. Just click on any of the reactions for either your characters or your region, and I'll make sure you have the corresponding role! To remove a role from yourself, just react again!**")

		await message.channel.send({
			files: [{
				attachment: "./img/SetYourMain.png",
				name: "SetYourMain.png"
			}]
		});

		await message.channel.send({
			files: [{
				attachment: "./img/SetYourSecondary.png",
				name: "SetYourSecondary.png"
			}]
		});

		await message.channel.send({
			files: [{
				attachment: "./img/SetYourRegion.png",
				name: "SetYourMain.png"
			}]
		});
	} else if (args[0] == "=checkvoice") {
		await misc.manageVoiceChannels(message);
	} else if (args[0] == "=emotelist") {
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
			return await message.channel.send("Example usage: `=emotelist Kidd Raymer Ashani Xana Zhurong AfiGalu`.");
		}
	} else if (args[0] == "=setcommand") {
		if (args.length < 3) {
			return await message.channel.send("USAGE: `=setcommand COMMAND_NAME text` -- For example the command `=setcommand controllers Here's some useful controller info!` would create a command `=controllers` that woult print `Here's some useful controller info!`.");
		} else {
			//first check if such a command already exists
			let exists = false;
			for (let i = 0; i < userCommandList.length; i++) {
				if (userCommandList[i].command == commandPrefix + args[1]) {
					//userCommandList.splice(i, 1); //remove this from the command list
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
	} else if (args[0] == "=removecommand") {
		if (args.length < 2) {
			return await message.channel.send("USAGE: `=removecommand COMMAND_NAME` - For example `=removecommand controllers` would remove the `=controllers` command.");
		}

		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].command == commandPrefix + args[1]) {
				userCommandList.splice(i, 1);
			}
		}

		fs.writeFileSync("./info/userCommands.json", JSON.stringify(userCommandList, null, "\t"), "utf8");
		return await message.channel.send("Removed `" + commandPrefix + args[1] + "`.");
	} else if (args[0] == "=describecommand") {
		if (args.length < 3) {
			return await message.channel.send("USAGE: `=describecommand COMMAND_NAME description` - For example `=describecommand controllers Controller support info.` would set the description of `=controllers` to `Controller support info.`");
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
	} else if (args[0] == "=hidecommand") {
		if (args.length < 2)
			return await message.channel.send("USAGE: `=hidecommand COMMANDNAME` ie to hide the `=ping` command type `=hidecommand ping`.");
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
	else if (args[0] == "=helpcount") {
		let s = "Command usage stats:\n";
		for (let i = 0; i < userCommandList.length; i++) {
			s += "`" + userCommandList[i].command + "`: " + (userCommandList[i].count ? userCommandList[i].count.toString() : "0") + "\n";
		}
		return await message.channel.send(s);
	} else if (args[0] == "=helphidden") {
		let s = "Hidden help commands:\n";
		for (let i = 0; i < userCommandList.length; i++) {
			if (userCommandList[i].hide) {
				s += "`" + userCommandList[i].command + "`\n";
			}
		}
		return await message.channel.send(s);
	}
}

async function contentTeamCommands(message, args) {
	if (args[0] == "=contenthelp") {
		let s = "Content Team Commands\n\n";
		s += "`=cotwfile` - I'll send you a .json file containing all of the links submitted to me\n";
		s += "`=cotwempty` - I'll send you a .json file of all current submissions, then completely empty the list so new submissions can come through\n";
		return await message.channel.send(s);
	} else if (args[0] == "=cotwfile") {
		await message.channel.send({
			files: [{
				attachment: "./info/cotw.json",
				name: "CotW_Submissions.json"
			}]
		});
	} else if (args[0] == "=cotwempty") {
		await message.channel.send({
			files: [{
				attachment: "./info/cotw.json",
				name: "CotW_Submissions.json"
			}]
		});
		cotwList = {};
		fs.writeFileSync("./info/cotw.json", JSON.stringify(cotwList, null, "\t"), "utf8");
		return await message.channel.send("The submissions list has now been cleared.");
	}
}

async function userCommands(message, args) {
	if (args[0] == commandPrefix + "help") {
		let s = "Gifkin User Commands:\n";
		s += "`=cotw` - See your currently submitted clips, if you have any.\n";
		s += "`=cotw https://twitch.tv/clip` - Submits a clip (doesn't have to be Twitch) as a COTW candidate. May submit up to 3 per week.\n";
		s += "`=cotwclear` - Clear your entry(s) from my memory, because you want to submit better ones!\n";
		for (let i = 0; i < userCommandList.length; i++) {
			if (!userCommandList[i].hide) {
				let desc = userCommandList[i].description;
				if (!desc || desc.length == 0) {
					desc = "Tell a mod to set a description with `=describecommand`.";
				}
				s += "`" + userCommandList[i].command + "` - " + desc + "\n";
			}
		}
		return await message.channel.send(s);
	} else if (args[0] == commandPrefix + "cotw") {
		if (args.length > 1) {
			if (args[1].indexOf(".") != -1 && args[1].indexOf("/") != -1) { //lazy check -- if it contains a . and a /, assume it's a link
				if (!cotwList[message.author.tag]) {
					cotwList[message.author.tag] = [message.content.split(" ")[1]];
					await message.channel.send(message.author.username + ", I have received your submission for Clip of the Week. Thanks!");
				} else {
					if (cotwList[message.author.tag].length >= 3) {
						await message.channel.send("You've already submitted three clips, " + message.author.username + ". If you'd like, you can type `=cotwclear` to wipe all of your submissions from my memory and submit new ones, or you can wait until the Content Team clears out the submission list.");
					} else {
						cotwList[message.author.tag].push(message.content.split(" ")[1]);
						await message.channel.send(message.author.username + ", I have received your submission for Clip of the Week. Thanks!");
					}
				}
	
				fs.writeFileSync("./info/cotw.json", JSON.stringify(cotwList, null, "\t"), "utf8");
			} else {
				return await message.channel.send("Please include a valid link. Example: `=cotw https://twitch.tv/clip`");
			}
		} else {
			if (cotwList[message.author.tag]) {
				let s = "Here are the clips I currently have stored for " + message.author.username + ":\n\n";
				for (let i = 0; i < cotwList[message.author.tag].length; i++) {
					s += "`" + cotwList[message.author.tag][i] + "`\n";
				}
				s += "\nIf you'd like to clear this list, type `=cotwclear`.";
				return await message.channel.send(s);
			} else {
				return await message.channel.send("I currently don't have any clips stored for " + message.author.username + ".\n\nTry submitting some with `=cotw CLIP`!");
			}
		}
	} else if (args[0] == commandPrefix + "cotwclear") {
		if (cotwList[message.author.tag]) {
			cotwList[message.author.tag] = undefined;
			fs.writeFileSync("./info/cotw.json", JSON.stringify(cotwList, null, "\t"), "utf8");
			await message.channel.send(message.author.username + ", I have cleared your submissions from my memory.");
		} else {
			await message.channel.send("I don't have any saved submissions from you, " + message.author.username + ".");
		}
	}
	else if (args[0] == commandPrefix + "feedback") {
		if (message.guild && message.guild.id == misc.ids.server) {
			return await message.channel.send("To send the Discord Mod Team some anonymous feedback, please use `=feedback MESSAGE` in a Direct Message with me!");
		} 
		else if (!misc.mainGuild.members.get(message.author.id)) {
			return await message.reply("Feedback not sent.");
		} 
		else {
			let feedbacks = JSON.parse(fs.readFileSync("./info/feedbacks.json", "utf8"));
			let id = message.author.id;
			if (!feedbacks[id] || (feedbacks[id].count < 5 && !feedbacks[id].blocked && feedbacks[id].blacklistedWords < 2)) {
				if (!feedbacks[id])
					feedbacks[id] = {count: 0, blocked: false, blacklistedWords: 0};
				feedbacks[id].count += 1;

				for (let i = 0; i < args.length; i++) {
					if (blacklist.blacklist.indexOf(args[i]) != -1) {
						feedbacks[id].blacklistedWords += 1;
						feedbacks[id].count += 1; //the more blacklisted words in their message, the fewer messages they can send
					}
				}

				if (feedbacks[id].blacklistedWords >= 2)
					return await message.reply("Feedback not sent. If you believe this to be an error, please contact the Mod team.");
				feedbacks[id].blacklistedWords = 0; //this check is only for individual messages
				fs.writeFileSync("./info/feedbacks.json", JSON.stringify(feedbacks), "utf8");

				let feedbackChannel = misc.mainGuild.channels.get(misc.ids.feedback);
				await feedbackChannel.send("Feedback Recieved: " + message.content.substring(args[0].length + 1));
				return await message.reply("Your feedback has been sent to the mod team.");
			} else {
				if (feedbacks[id].blocked || feedbacks[id].blacklistedWords >= 2)
					return await message.reply("Feedback not sent. If you believe this to be an error, please contact the Mod team.");
				feedbacks[id].count += 1;
				if (feedbacks[id].count >= 15)
					feedbacks[id].blocked = true;
				fs.writeFileSync("./info/feedbacks.json", JSON.stringify(feedbacks), "utf8");
				
				return await message.reply("Please wait before submitting additional feedback.");
			}
		}
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

module.exports.modCommands = modCommands;
module.exports.userCommands = userCommands;
module.exports.contentTeamCommands = contentTeamCommands;
