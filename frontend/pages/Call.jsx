import React from 'react';
import { useSearchParams } from 'react-router-dom';
import useFriendshipGuard from '../hooks/useFriendshipGuard';
import VideoCall from '../components/Call/VideoCall';
import RecordingControls from '../components/Call/RecordingControls';
import Whiteboard from '../components/Whiteboard/Whiteboard';
import SharedNotes from '../components/Notes/SharedNotes';
import { useNavigate } from 'react-router-dom';

export default function CallPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const peerId = params.get('peerId');
  useFriendshipGuard(peerId);

  if (!sessionId || !peerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Missing Information</h2>
          <p className="text-gray-500">Session ID or Peer ID is missing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-100 p-0 sm:p-4">
      <button
            onClick={() => navigate('/friends')}
            className="border-4 hover:border-gray-200 bg-gray-400 w-fit text-white text-bold p-2 rounded-xl duration-500"
            aria-label="Go back"
            title="Go back"
          >
            ← Back
          </button>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-extrabold text-primary mb-2 tracking-tight drop-shadow">Video Call Session</h1>
          <p className="text-gray-600">Collaborate with your friend in real-time</p>
        </div>

        {/* Main Call Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Video Call - Takes 2/3 of the width on large screens */}
          <div className="xl:col-span-2 flex flex-col h-full">
            <div className="bg-white/90 rounded-2xl shadow-lg p-2 sm:p-4 h-full flex flex-col justify-center">
              <VideoCall sessionId={sessionId} peerId={peerId} />
            </div>
          </div>
          
          {/* Recording Controls - Takes 1/3 of the width */}
          <div className="xl:col-span-1 flex flex-col h-full">
            <div className="bg-white/90 rounded-2xl shadow-lg p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
                <span role="img" aria-label="Recording">🎥</span> Recording
              </h3>
              <RecordingControls />
            </div>
          </div>
        </div>

        {/* Collaboration Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* Whiteboard */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
              <span role="img" aria-label="Whiteboard">📝</span> Collaborative Whiteboard
            </h3>
            <Whiteboard sessionId={sessionId} peerId={peerId} />
          </div>
          
          {/* Shared Notes */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center gap-2">
              <span role="img" aria-label="Notes">📒</span> Shared Notes
            </h3>
            <SharedNotes sessionId={sessionId} peerId={peerId} />
          </div>
        </div>
      </div>
    </div>
  );
}
