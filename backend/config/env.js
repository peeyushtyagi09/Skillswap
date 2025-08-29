// Centeralized env loader with defaults.
require('dotenv').config();

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '8000', 10),
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    MONGODB_URI: process.env.MONGODB_URI,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ICE_STUN_URLS: (process.env.ICE_STUN_URLS || 'stun:stun.l.google.com:19302').split(','),
    ICE_TURN_URLS: (process.env.ICE_TURN_URLS || '').split(',').filter(Boolean),
    TURN_USER: process.env.TURN_USER || '',
    TURN_PASSWORD: process.env.TURN_PASSWORD || '',
    RECORDER_ENABLED: (process.env.RECORDER_ENABLED || 'false') === 'true',
    RECORDER_PROVIDER: process.env.RECORDER_PROVIDER || 'none'
};

module.exports = config;