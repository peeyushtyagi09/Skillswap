import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * CallInviteModal
 * - Displays incoming/outgoing ringing UI with accept/reject/cancel actions
 * - Plays a looping ringtone while visible
 * - Accessibility: uses role="dialog" and aria-modal
 *
 * Props:
 * - isOpen: boolean
 * - mode: 'incoming' | 'outgoing'
 * - peerName: string
 * - secondsLeft: number (countdown display)
 * - onAccept: () => void
 * - onReject: () => void
 * - onClose: () => void (closes modal only, does not alter server state)
 */
export default function CallInviteModal({
  isOpen,
  mode, // 'incoming' | 'outgoing'
  peerName = 'Friend',
  secondsLeft = 45,
  onAccept,
  onReject,
  onClose,
}) {
  const audioRef = useRef(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  const animateClose = (cb) => {
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!overlayRef.current || !panelRef.current || reduce) {
      if (cb) cb();
      return;
    }
    gsap.timeline({ onComplete: () => cb && cb() })
      .to(panelRef.current, { y: 16, opacity: 0, scale: 0.98, duration: 0.2, ease: 'power2.in' })
      .to(overlayRef.current, { opacity: 0, duration: 0.18, ease: 'power2.in' }, '<');
  };

  const handleClose = () => animateClose(onClose);
  const handleReject = () => animateClose(onReject);
  const handleAccept = () => { if (onAccept) onAccept(); };

  useEffect(() => {
    if (!isOpen) return;
    // Play ringtone on open. Ensure the asset exists or replace with a hosted file.
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch {}
    return () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && overlayRef.current && panelRef.current) {
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(panelRef.current, { y: 16, opacity: 0, scale: 0.98 });
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' })
        .to(panelRef.current, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power3.out' }, '<');
    }
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      gsap.killTweensOf(overlayRef.current);
      gsap.killTweensOf(panelRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        ref={panelRef}
        className="bg-black text-white font-bold rounded-2xl shadow-2xl border border-base-300 p-6 w-[min(92vw,420px)] will-change-transform"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="avatar relative">
            {mode === 'incoming' && (
              <span className="absolute inset-0 rounded-full ring ring-success/50 motion-safe:animate-ping" aria-hidden="true" />
            )}
            <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-neutral-focus text-neutral-content flex items-center justify-center text-lg font-bold">
              {peerName ? peerName.charAt(0).toUpperCase() : 'F'}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">
              {mode === 'incoming' ? 'Incoming Video Call' : 'Calling…'}
            </div>
            <div className="text-sm opacity-70">{peerName} </div>
          </div>
        </div>

        <div className="text-center text-sm opacity-80 mb-4">
          {mode === 'incoming'
            ? 'Would you like to accept this call?'
            : 'Waiting for the recipient to answer…'}
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="badge badge-outline">Auto-cancel in {secondsLeft}s</div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {mode === 'incoming' ? (
            <>
              <button className="border p-2 bg-green-400 rounded-full " onClick={handleAccept} aria-label="Accept call"> ✆ Accept</button>
              <button className="border p-2 bg-red-400 rounded-full " onClick={handleReject} aria-label="Reject call"> 📞 Reject</button>
            </>
          ) : (
            <button className="border p-2 bg-red-400 rounded-full" onClick={handleReject} aria-label="Cancel call">Cancel</button>
          )}
          <button className="border p-2 bg-black text-white fount-bold rounded-full" onClick={handleClose} aria-label="Close">Close</button>
        </div>

        {/* Replace with your ringtone asset path */}
        <audio ref={audioRef} src="src/public/sound/callSound.mp4" loop preload="auto" />
      </div>
    </div>
  );
}
