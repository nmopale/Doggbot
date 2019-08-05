// Utility

// Variables for post counts to be sent to sql db
var cachedPosts = {};
var sent = false;
const mysql = require('mysql');
const sqlfunctions = require("../sql/SQLFunctions.js");

module.exports = {
  // Store UID and points in array
  cachePosts: async function(uid, posts) {
    let messages = 0;
    if (cachedPosts[uid])
      messages = cachedPosts[uid];
    cachedPosts[uid] = messages + posts;
  },
  getCachedPosts: async function() {
    return Object.values(cachedPosts);
  },
  getCachedPostsSize: async function() {
    return Object.keys(cachedPosts).length;;
  },
  buildPostsQuery: async function() {
    let queryString = "INSERT INTO dga_users (discord_uid, post_count) VALUES"
    Object.keys(cachedPosts).forEach(key => {
      queryString += ` (${key}, ${cachedPosts[key]}),`;
    });
    //Remove the last comma added
    queryString = queryString.slice(0, -1);
    //Then add the finishing touches
    queryString += ` ON DUPLICATE KEY UPDATE post_count = post_count + VALUES(post_count)`;
    return queryString;
  },
  sendPostsQuery: async function(query) {
    const connection = await sqlfunctions.getConnection();
    if (query.includes("length")) {
      return;
    } else {
      connection.query(query, function(err, res) {
        if (err)
          throw err;
      });
    }
  },
  // Empty the array
  clearPostsCache: async function() {
    cachedPosts = {};
    return;
  },
}
