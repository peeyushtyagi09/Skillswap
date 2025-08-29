const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies a JWT and loads the user
async function verifyJwtAndGetUser(token) {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        return user || null;
    }catch (e) {
        return null;
    }
}

module.exports = { verifyJwtAndGetUser }

// This code checks if a JWT (JSON Web Token) is valid and, if so, finds the user in the database using the ID from the token. It's needed to confirm a user's identity for protected routes, making sure only logged-in users can access certain features.