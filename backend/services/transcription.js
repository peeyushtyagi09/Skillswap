// Pluggable transcription provider adapter. For now, a mock implementation.

async function transcribeAudio(bufferOrUrl, options = {}) {
    // In production, send media to a provider (e.g., Deepgram, AssemblyAI, OpenAI).
    // Here we return a deterministic mock string.
    return {
        ok: true,
        provider: 'mock',
        text: '[Transcription placeholder] Key moments captured during the session.'
    };
}

module.exports = { transcribeAudio };
