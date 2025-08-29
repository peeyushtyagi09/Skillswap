const Friend = require('../models/Friend.models');
// Imports the Friend model to interact with the friends collection in the database.

// Return true if two userIds are friends (mutual)

// Defines an async function to check if two users are friends.
async function areFriends(userIdA, userIdB) {
    // Returns false if either user ID is missing, since friendship can't be checked.
 if (!userIdA || !userIdB) return false;
// Creates a sorted array of user IDs as strings to ensure order doesn't matter when searching.
 const pair = [userIdA.toString(), userIdB.toString()].sort();
// Queries the Friend collection for a document where the users field matches the sorted pair
 const friend = await Friend.findOne({ users: pair}).lean();
//  Returns true if a friendship document is found, otherwise false.
 return Boolean(friend);   
}

module.exports = { areFriends };