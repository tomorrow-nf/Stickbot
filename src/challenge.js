const fs = require('fs');
/*
	challenge.js
  This contains helpers for challenge configuration.
	Written by Dylan "Luberry" Kozicki for the CGCC Discord Server.
*/

let Config = JSON.parse(fs.readFileSync('./info/challengeConfig.json', 'utf8'));

function handleCmd(args) {
  if (args.length < 1) {
    return help();
  }
  switch (args[0]) {
    case 'help':
      return help();
    case 'vote':
      return handleVoteCmd(args.slice(1));
    case 'submission':
      return handleSubCmd(args.slice(1));
    default:
      return help();
  }
}

function handleVoteCmd(args) {
  if (args.length < 1) {
    return helpVote();
  }
  switch (args[0]) {
    case 'help':
      return helpVote();
    case 'start':
      return handleVoteStart(args.slice(1));
    case 'end':
      return handleVoteEnd(args.slice(1));
    default:
      return helpVote();
  }
}

function handleSubCmd(args) {
  if (args.length < 1) {
    return helpSub();
  }
  switch (args[0]) {
    case 'help':
      return helpSub();
    case 'start':
      return handleSubStart(args.slice(1));
    case 'end':
      return handleSubEnd(args.slice(1));
    default:
      return helpSub();
  }
}

function handleSubStart(args) {
  if (args.length < 1) {
    Config.submissionStart = new Date();
  } else {
    const d = parseDate(args);
    if (isNaN(d)) {
      return helpSubStart();
    }
    Config.submissionStart = d;
  }
  writeCfg();
  return 'new submission start date is ' + Config.submissionStart;
}
function handleSubEnd(args) {
  if (args.length < 1) {
    Config.submissionEnd = new Date();
  } else {
    const d = parseDate(args);
    if (isNaN(d)) {
      return helpSubEnd();
    }
    Config.submissionEnd = d;
  }
  writeCfg();
  return 'new submission end date is ' + Config.submissionEnd;
}
function handleVoteStart(args) {
  if (args.length < 1) {
    Config.voteStart = new Date();
  } else {
    const d = parseDate(args);
    if (isNaN(d)) {
      return helpVoteStart();
    }
    Config.voteStart = d;
  }
  writeCfg();
  return 'new vote start date is ' + Config.voteStart;
}
function handleVoteEnd(args) {
  if (args.length < 1) {
    Config.voteEnd = new Date();
  } else {
    const d = parseDate(args);
    if (isNaN(d)) {
      return helpVoteEnd();
    }
    Config.voteEnd = d;
    writeCfg();
  }
  return 'new vote end date is ' + Config.voteEnd;
}
function parseDate(args) {
  return new Date(args.join(' '));
}

function helpSubCmd(type, cmd) {
  return (
    '`!challengeedit ' +
    type +
    ' ' +
    cmd +
    ' [date]`' +
    'sets the challenge ' +
    type +
    ' ' +
    cmd +
    ' date, if no date is provided this command will use the current date.\n'
  );
}

function writeCfg() {
  fs.writeFileSync(
    './info/challengeConfig.json',
    JSON.stringify(Config, null, '\t')
  );
}

function help() {
  return helpSub() + helpVote(false);
}
function helpSub() {
  return helpSubStart() + helpSubEnd();
}
function helpVote() {
  return helpVoteStart() + helpVoteEnd();
}
function helpSubStart() {
  return helpSubCmd('submission', 'start');
}
function helpSubEnd() {
  return helpSubCmd('submission', 'end');
}
function helpVoteStart() {
  return helpSubCmd('vote', 'start');
}
function helpVoteEnd() {
  return helpSubCmd('vote', 'end');
}
module.exports.Config = Config;
module.exports.help = help;
module.exports.handleCmd = handleCmd;
