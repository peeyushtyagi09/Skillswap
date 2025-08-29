// Recorder service abstraction.In Production, intergrate mediosoup/Janus.
// Here we provide a minimal no-op with thw same API for local dev.

async function startRecording(sessionId) {
    // ToDo: Intergrate with a medio server to start server-side recording.
    return {ok : false, message: 'Recorder disabled', provider: 'none'};
}

async function stopRecording(sessionId) {
    // ToDO: stop recording and return a URL where the asset is accessible.
    return {
        ok: false, url: null, provider: 'none'
    };
}

module.exports = {startRecording, stopRecording};