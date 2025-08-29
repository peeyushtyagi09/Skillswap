import React, { useEffect, useRef, useState } from 'react';

// Client-side MediaRecorder fallback. Expects a MediaStream via props
export default function RecordingControls({ stream }) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = () => {
    if (!stream) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `skillswap-recording-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    rec.start(250);
    setRecording(true);
  };

  const stop = () => { recorderRef.current?.stop(); setRecording(false); };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {!recording ? <button onClick={start}>Start Recording (client)</button> : <button onClick={stop}>Stop & Download</button>}
    </div>
  );
}
