import React, { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket } from '../../lib/socket';
import CallRatingModal from './CallRatingModal';

// Enhanced 1:1 WebRTC call component with rating system
export default function VideoCall({ sessionId, peerId }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const pcRef = useRef(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [callStartTime, setCallStartTime] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Default ICE servers; could be fetched from server in future
    const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

    // Keep a ref to the socket to ensure we always use the same instance
    const socketRef = useRef(null);

    // Timer for call duration
    useEffect(() => {
        let interval;
        if (isCallActive && callStartTime) {
            interval = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isCallActive, callStartTime]);

    useEffect(() => {
        // Always use connectSocket() only once and keep the instance
        let s = socketRef.current;
        if (!s) {
            s = connectSocket();
            socketRef.current = s;
        }

        // Join session room as soon as component mounts
        if (typeof s.emit === 'function') {
            s.emit('call:join', { sessionId, peerId });
        } else {
            console.error('Socket instance does not have emit function:', s);
        }

        const handleOffer = async ({ payload }) => {
            await ensurePeerConnection();
            await pcRef.current.setRemoteDescription(new window.RTCSessionDescription(payload));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            if (typeof s.emit === 'function') {
                s.emit('call:answer', { sessionId, payload: answer });
            }
            setIsCallActive(true);
            setCallStartTime(Date.now());
        };

        const handleAnswer = async ({ payload }) => {
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription(new window.RTCSessionDescription(payload));
            setIsCallActive(true);
            setCallStartTime(Date.now());
        };

        const handleIceCandidate = async ({ payload }) => {
            if (!pcRef.current) return;
            try {
                await pcRef.current.addIceCandidate(new window.RTCIceCandidate(payload));
            } catch (error) {
                console.error('Failed to add ICE candidate:', error);
            }
        };

        const handleCallEnd = () => {
            // Remote ended call: cleanup
            endCall();
        };

        s.on('call:offer', handleOffer);
        s.on('call:answer', handleAnswer);
        s.on('call:ice-candidate', handleIceCandidate);
        s.on('call:end', handleCallEnd);

        return () => {
            s.off('call:offer', handleOffer);
            s.off('call:answer', handleAnswer);
            s.off('call:ice-candidate', handleIceCandidate);
            s.off('call:end', handleCallEnd);
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
        };
        // eslint-disable-next-line
    }, [sessionId, peerId]);

    async function ensurePeerConnection() {
        if (pcRef.current) return pcRef.current;
        // Always use the same socket instance
        const s = socketRef.current || getSocket();
        const pc = new window.RTCPeerConnection({ iceServers });
        pcRef.current = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate && typeof s.emit === 'function') {
                s.emit('call:ice-candidate', { sessionId, payload: e.candidate });
            }
        };

        pc.ontrack = (e) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = e.streams[0];
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setLocalStream(stream);
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            return pc;
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    }

    const startCall = async () => {
        // For accepted sessions, starting a call means creating an offer.
        const s = socketRef.current || getSocket();
        const pc = await ensurePeerConnection();
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (typeof s.emit === 'function') {
            s.emit('call:offer', { sessionId, payload: offer });
        }
        setIsCallActive(true);
        setCallStartTime(Date.now());
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const endCall = () => {
        const s = socketRef.current || getSocket();
        if (typeof s.emit === 'function') {
            s.emit('call:end', { sessionId });
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setIsCallActive(false);
        setCallStartTime(null);

        // Show rating modal if call was active
        if (callDuration > 0) {
            setShowRatingModal(true);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRatingSubmit = () => {
        setShowRatingModal(false);
        // Reset call duration
        setCallDuration(0);
    };

    return (
        <>
            <div className="bg-base-100 p-6 rounded-lg shadow-lg">
                {/* Call Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-primary">Video Call</h2>
                    <p className="text-base-content/70">Session: {sessionId}</p>
                    {isCallActive && (
                        <div className="text-lg font-semibold text-success mt-2">
                            Duration: {formatDuration(callDuration)}
                        </div>
                    )}
                </div>

                {/* Video Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Local Video */}
                    <div className="relative">
                        <div className="bg-base-200 rounded-lg p-2">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-64 object-cover rounded-lg bg-black"
                            />
                            <div className="absolute top-4 left-4 bg-base-300/80 px-3 py-1 rounded-full text-sm">
                                You
                            </div>
                            {isMuted && (
                                <div className="absolute top-4 right-4 bg-error/80 px-3 py-1 rounded-full text-sm">
                                    🔇 Muted
                                </div>
                            )}
                            {isVideoOff && (
                                <div className="absolute top-4 right-4 bg-error/80 px-3 py-1 rounded-full text-sm">
                                    📹 Off
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative">
                        <div className="bg-base-200 rounded-lg p-2">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-64 object-cover rounded-lg bg-black"
                            />
                            <div className="absolute top-4 left-4 bg-base-300/80 px-3 py-1 rounded-full text-sm">
                                Peer
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call Controls */}
                <div className="flex flex-col items-center gap-4">
                    {!isCallActive ? (
                        <button 
                            className="btn btn-primary btn-lg px-8"
                            onClick={startCall}
                        >
                            📞 Start Call
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button 
                                className={`btn btn-circle btn-lg ${isMuted ? 'btn-error' : 'btn-primary'}`}
                                onClick={toggleMute}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? '🔇' : '🎤'}
                            </button>
                            
                            <button 
                                className={`btn btn-circle btn-lg ${isVideoOff ? 'btn-error' : 'btn-primary'}`}
                                onClick={toggleVideo}
                                title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                            >
                                {isVideoOff ? '📹' : '📷'}
                            </button>
                            
                            <button 
                                className="btn btn-circle btn-lg btn-error"
                                onClick={endCall}
                                title="End call"
                            >
                                📞
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rating Modal */}
            <CallRatingModal
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                sessionId={sessionId}
                peerId={peerId}
                callDuration={callDuration}
                onSubmitSuccess={handleRatingSubmit}
            />
        </>
    );
}