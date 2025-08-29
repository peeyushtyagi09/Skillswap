const rateLimit = require('express-rate-limit');

// Create a named limiter for socket-related REST endpoints
const chatLimiter = rateLimit({ windowMs: 10 * 1000, limit: 30 });
const signalingLimiter = rateLimit({ windowMs: 10 * 1000, limit: 50 });

module.exports = { chatLimiter, signalingLimiter };