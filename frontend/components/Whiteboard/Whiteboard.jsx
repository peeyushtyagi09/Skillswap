import React, { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../lib/socket';

// Lightweight canvas whiteboard synced via sockets
export default function Whiteboard({ sessionId, peerId }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    const c = canvasRef.current;
    const context = c.getContext('2d');
    setCtx(context);
    const s = getSocket();
    const onStroke = ({ from, stroke }) => drawStroke(context, stroke);
    const onClear = () => context.clearRect(0, 0, c.width, c.height);
    s.on('whiteboard:stroke', onStroke);
    s.on('whiteboard:clear', onClear);
    return () => { s.off('whiteboard:stroke', onStroke); s.off('whiteboard:clear', onClear); };
  }, [sessionId]);

  function drawStroke(context, stroke) {
    context.beginPath();
    context.moveTo(stroke.from.x, stroke.from.y);
    context.lineTo(stroke.to.x, stroke.to.y);
    context.strokeStyle = stroke.color || '#333';
    context.lineWidth = stroke.width || 2;
    context.stroke();
  }

  function handleMove(e) {
    if (!drawing || !ctx) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    drawStroke(ctx, { from: last.current, to: { x, y } });
    const s = getSocket(); s.emit('whiteboard:stroke', { sessionId, peerId, stroke: { from: last.current, to: { x, y } } });
    last.current = { x, y };
  }

  const last = useRef({ x: 0, y: 0 });
  function handleDown(e) {
    setDrawing(true);
    const rect = e.target.getBoundingClientRect();
    last.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function handleUp() { setDrawing(false); }
  const clear = () => { const s = getSocket(); s.emit('whiteboard:clear', { sessionId, peerId }); };

  return (
    <div>
      <canvas ref={canvasRef} width={480} height={360} style={{ border: '1px solid #ccc' }}
        onMouseMove={handleMove} onMouseDown={handleDown} onMouseUp={handleUp} onMouseLeave={handleUp}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
