import React from 'react';

export default function ScreenShareButton({ pc }) {
  const start = async () => {
    if (!pc) return;
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    display.getTracks().forEach((t) => pc.addTrack(t, display));
  };
  return <button onClick={start}>Share Screen</button>;
}
