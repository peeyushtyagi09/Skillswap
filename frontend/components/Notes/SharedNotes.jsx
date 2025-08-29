import React, { useEffect, useState } from 'react';
import api from '../../src/api';
import { getSocket } from '../../lib/socket';

// Shared notes synced optimistically via socket, persisted via REST
export default function SharedNotes({ sessionId, peerId }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    const s = getSocket();
    const handler = ({ from, content }) => setContent(content);
    s.on('notes:update', handler);
    return () => s.off('notes:update', handler);
  }, [sessionId]);

  const save = async () => {
    const token = localStorage.getItem('accessToken');
    await api.post(`/calls/${sessionId}/notes`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    const s = getSocket(); s.emit('notes:update', { sessionId, peerId, content });
  };

  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} cols={48} />
      <div>
        <button onClick={save}>Save Notes</button>
      </div>
    </div>
  );
}
