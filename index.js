//index.js
//@author litdogg
//@coauthor flashy <3

//Required imports
const Discord = require('discord.js');
const sqlfunctions = require("./sql/SQLFunctions.js");
const embedfunctions = require("./embeds/EmbedFunctions.js");
const utility = require("./utils/Utility");

//Define constants
const cfg = require("./config/cfg.json");

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  doPostsTimer();
});

async function doPostsTimer() {
  setInterval(async function() {
      let cache = await utility.getCachedPosts();
      let query = await utility.buildPostsQuery();
      let size = await utility.getCachedPostsSize();
      if (size > 0) {
          let send = await utility.sendPostsQuery(query);
          let cpc = await utility.clearPostsCache();
      }
  }, 5 * 1000);
}


// Message-based commands
client.on('message', async msg => {
  //Ignore messages from bots
  if (msg.author.bot)
    return;

  var usr = msg.author;
  var user_id = usr.id;
  var name = usr.tag;
  var str = msg.content.toLowerCase();

  const addPosts = await utility.cachePosts(user_id, 1);

  //Must begin with the prefix
  if (!str.startsWith(cfg.prefix))
    return;

  const args = str.slice(cfg.prefix.length).split(/\s+/);
  const action = args.shift();
  let exists = await sqlfunctions.checkIfUserExists(user_id);

  // Ping the bot
  if (action === "ping") {
    const m = await msg.channel.send("Pong!");
    m.edit(`Latency: ${m.createdTimestamp - msg.createdTimestamp}ms. API Latency: ${Math.round(client.ping)}ms`);
    console.debug(`Latency: ${m.createdTimestamp - msg.createdTimestamp}ms, API Latency: ${Math.round(client.ping)}ms`);
  }
  // Register the UID of the person sending the message in our database
  if (action === 'register') {
    if (exists) {
      msg.channel.send("User ID already exists.");
    } else {
      sqlfunctions.registerAccount(user_id);
      msg.channel.send("Updated user ID to DGA database.");
      return;
    }
  }
  if (action === 'addp') {
    const c = await utility.cachePosts(user_id, 5);
    console.log("Add points = " + c);
  }
  if (action === 'getp') {
    let tmp = await utility.getCachedIdByKey(args[0]);
    console.log("Get points = " + tmp);
  }
  // test embedfunctions
  if (action === "embed") {
    var euid = await getOtherID(args[0]);
    var userObject = await client.users.get(euid);
    const e = await embedfunctions.generateProfile(args[0], euid, userObject);
    msg.channel.send({
      embed: e
    });
  }
  if (exists) {
    // Set social media accounts, email, nickame
    if (action === 'set') {
      switch (args[0]) {
        case "email":
        case "nickname":
        case "soundcloud":
        case "facebook":
        case "twitter":
        case "instagram":
        case "spotify":
          sqlfunctions.setSocialKey(user_id, args[0], args[1]);
          break;
        default:
          const m = await msg.channel.send("Sorry, I don't know that one!");
          m.edit("Try nickname, email, soundcloud, facebook, twitter, or instagram.");
          return;
      }
      msg.reply(`${args[0]} set to ${args[1]}.`)
    }
    // Get social media accounts, email, nickname of target user
    if (action === 'get') {
      switch (args[0]) {
        case "email":
        case "nickname":
        case "soundcloud":
        case "facebook":
        case "twitter":
        case "instagram":
        case "spotify":
          try {
            let otherid = await getOtherID(args[1]);
            let returnValue = await sqlfunctions.getSocialKey(args[0], otherid);
            if (returnValue.length > 0) {
              msg.channel.send(`${args[1]}'s ${args[0]} is ${returnValue}.`);
            } else {
              msg.channel.send(`${args[1]}'s ${args[0]} is not yet listed. Remind them to update it! :)`);
            }
          } catch (err) {
            console.debug(err);
            msg.channel.send(`${args[1]}'s profile is not in our database...`);
            msg.channel.send(`Invite them to come join us here at DGA! :)`);
          }
          break;
        case "profile":
          var euid = await getOtherID(args[1]);
          var userObject = await client.users.get(id);
          const e = await embedfunctions.generateProfile(args[1], euid, userObject);
          if (euid > 0) {
            msg.channel.send({
              embed: e
            });
          } else {
            const m = await msg.channel.send("Sorry, I couldn't find that user.");
            return;
          }
          break;
        default:
          const m = await msg.channel.send("Sorry, I don't know that one!");
          m.edit("Try nickname, email, spotify, soundcloud, facebook, twitter, or instagram.");
          break;
      }
    }
  } else {
    msg.reply("hey! Please register your user ID by using $register first!");
    return;
  }
});

// Resolve user ID by username
async function getOtherID(searchName) {
  return new Promise((resolve, reject) => {
    let search = client.guilds.array();
    for (let i = 0; i < search.length; i++) {
      client.guilds.get(search[i].id).fetchMembers().then(r => {
        r.members.array().forEach(r => {
          let username = r.user.username.toLowerCase();
          if (searchName === username) {
            resolve(r.user.id);
          }
        });
      });
    }
  });
}

// Turn the bot on
client.login(cfg.token);
