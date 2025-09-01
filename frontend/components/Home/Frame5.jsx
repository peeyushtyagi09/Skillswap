import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const cards = [
  { label: "Content", info: "Content strategy and creation details." },
  { label: "Google", info: "Google integration details." },
  { label: "Video", info: "Video production and streaming details." },
  { label: "Design", info: "Design workflows and UI principles." },
  { label: "Motion", info: "Motion graphics and animation integration." },
  { label: "Email", info: "Email automation and campaigns." },
  { label: "AI", info: "How we integrate AI into our process." },
  { label: "LinkedIn", info: "LinkedIn strategy and networking." },
];

const BASE_RADIUS = 330;
const ROTATE_SPEED = 0.0025;

export default function Frame5() {
  const [rotation, setRotation] = useState(0);
  const [ringHover, setRingHover] = useState(false);
  const [centerHover, setCenterHover] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [animatedRadius, setAnimatedRadius] = useState(BASE_RADIUS);
  const req = useRef();

  // rotate ring
  useEffect(() => {
    let last = performance.now();
    const tick = (now) => {
      const d = now - last;
      last = now;
      setRotation((p) => p + ROTATE_SPEED * (d / 16.67));
      req.current = requestAnimationFrame(tick);
    };
    req.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req.current);
  }, []);

  // ease radius on hover of center card
  useEffect(() => {
    let raf;
    const step = () => {
      setAnimatedRadius((prev) => {
        const target = ringHover ? BASE_RADIUS + 30 : BASE_RADIUS;
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.15;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ringHover]);

  const positions = cards.map((c, i) => {
    const a = (2 * Math.PI * i) / cards.length - Math.PI / 2 + rotation;
    const x = animatedRadius * Math.cos(a);
    const y = animatedRadius * Math.sin(a);
    return { ...c, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  });

  return (
    <div className="w-full h-screen bg-[#f5f2f2] flex items-center justify-center relative overflow-hidden">

      {/* Center trio */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {/* Left card, animated by centerHover */}
        <motion.div
          className="absolute w-48 h-64 rounded-xl shadow-lg overflow-hidden"
          initial={{ x: 0, rotate: -10, scale: 0.9, opacity: 0.8,  }}
          animate={
            centerHover
              ? { x: -160, rotateY: 6, opacity: 1 }
              : { x: -50, rotateY: 0, opacity: 0.8 }
          }
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <img src="https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714738/Qmbqv4ogPHw74KFXqGcKsjo5ujJp3thmk4MEZueUzQmNWP_lhukal.avif" alt="Card" className="w-48 h-64 object-cover" draggable={false} />
        </motion.div>

        {/* Center card triggers both ring radius and side slide */}
        <motion.div
          className="relative z-20 w-56 h-72 rounded-xl shadow-xl overflow-hidden"
          onHoverStart={() => { setRingHover(true); setCenterHover(true); }}
          onHoverEnd={() => { setRingHover(false); setCenterHover(false); }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <img src="https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714732/QmPUgiRv7D5FDuS8U1Mp3sh1v4rV3akXrcj5mJfqeFmZMF_eggkr6.avif" alt="Card" className="w-56 h-72 object-cover" draggable={false} />
        </motion.div>

        {/* Right card, animated by centerHover */}
        <motion.div
          className="absolute w-48 h-64 rounded-xl shadow-lg overflow-hidden"
          initial={{ x: 140, rotate: 10, scale: 0.9, opacity: 0.8 }}
          animate={
            centerHover
              ? { x: 160, rotateY: -6, opacity: 1 }
              : { x: 50, rotateY: 0, opacity: 0.8 }
          }
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <img src="https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714714/QmPYZZ2f8FkyYNRabT3SUycwUhS5jHzev1xzehSFFwFi2g_vbfejd.avif" alt="Card" className="w-48 h-64 object-cover" draggable={false} />
        </motion.div>
      </div>

      {/* Orbiting cards */}
      <div className="absolute w-full h-full pointer-events-none">
        {positions.map((c) => (
          <div
            key={c.label}
            className="absolute flex items-center justify-center"
            style={{ left: c.left, top: c.top, transform: "translate(-50%, -50%)" }}
          >
            <button
              onClick={() => setActiveCard(c)}
              className="bg-white text-black font-bold px-6 py-3 rounded-xl shadow-lg text-lg pointer-events-auto transition-transform duration-200 hover:scale-110 hover:shadow-xl select-none"
            >
              {c.label}
            </button>
          </div>
        ))}
      </div>

      {/* Modal with bounce drop from top */}
<AnimatePresence>
  {activeCard && (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setActiveCard(null)}
    >
      <motion.div
        className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-2xl relative flex flex-col gap-4"
        initial={{ y: -220, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -220, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
          onClick={() => setActiveCard(null)}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          className=" bg-gray-200 rounded-xl py-2 px-4 w-fit shadow-md"
          style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '1.7rem',
            letterSpacing: '0.03em',
            color: 'white',
            marginRight: '0.5em',
            textShadow: '0 2px 0 #000, 0 4px 0 #000',
            opacity:1,
          }}
        >
          {activeCard.label}
        </h2>

        {/* Info */}
        <p className="text-gray-700 text-center leading-relaxed">
          {activeCard.info}
        </p>

        {/* Action Button */}
        <div className="flex justify-end mt-4">
          <button
            className="px-5 py-2 rounded-xl font-semibold border-2 border-green-500 bg-green-400 text-white hover:bg-green-500 hover:scale-105 transition-all"
            onClick={() => setActiveCard(null)}
          >
            More Info
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
