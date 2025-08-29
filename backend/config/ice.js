const config = require('./env');

// Build ICE server list form env (Twilio or custom TURN can be supplied)

function getIceServers() {
    const iceServers = [];
    if (config.ICE_STUN_URLS.length) {
        iceServers.push({ urls: config.ICE_STUN_URLS});
    }
    if(config.ICE_TURN_URLS.length && config.TURN_USER && config.TURN_PASSWORD) {
        iceServers.push({ urls: config.ICE_TURN_URLS, username: config.TURN_USER, credential: config.TURN_PASSWORD});
    }
    return iceServers;
}

module.exports = { getIceServers };