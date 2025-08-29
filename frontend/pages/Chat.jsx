import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/Chat/ChatWindow';
import useFriendshipGuard from '../hooks/useFriendshipGuard';

export default function ChatPage() {
  const [params] = useSearchParams();
  const peerId = params.get('peerId');
  const { isValid, loading } = useFriendshipGuard(peerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-600">Verifying friendship...</p>
        </div>
      </div>
    );
  }

  if (!peerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Missing Peer ID</h3>
          <p className="text-gray-600">Please provide a valid peer ID to start chatting.</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return null; // Will redirect via useFriendshipGuard
  }

  return <ChatWindow peerId={peerId} />;
}
