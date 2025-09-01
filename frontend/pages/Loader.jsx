import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713341/LoaderImage1_wd8psj.png",
  "images/LoaderImage2.jpg",
  "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713342/LoaderImage3_nktpak.png",
  "images/LoaderImage4.png",
  "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713342/LoaderImage5_mw0wle.png",
  "images/LoaderImage6.png",
];

export default function Loader({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Progress bar runs for 10 seconds (10000 ms)
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval);
          onFinish?.();
          return 100;
        }
        return p + 1; // 1% every 100ms → 10s
      });
    }, 100);

    // Image stack updates every ~1.6s (6 images over 10s)
    const stepInterval = setInterval(() => {
      setStep((s) => {
        if (s >= images.length) {
          clearInterval(stepInterval);
          return s;
        }
        return s + 1;
      });
    }, 1600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [onFinish]);

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row items-center justify-center gap-10 bg-gray-50 overflow-hidden">
      
      {/* Left: Progress */}
      <div className="flex flex-col items-start">
        <div className="w-48 h-1 bg-gray-200 relative overflow-hidden rounded">
          <motion.div
            className="h-1 bg-gray-700"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        <p className="text-sm text-gray-700 mt-2">loading your experience</p>
      </div>

      {/* Right: Image stack */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        <AnimatePresence>
          {images.slice(0, step).map((src, i) => (
            
            <motion.img
              key={src}
              src={src}
              className="absolute w-80 h-80 object-cover  shadow-xl"
              initial={{ scale: 1, opacity: 0, rotate: 10, y: 40 }}
              animate={{
                scale: 1 - i * 0.15,
                opacity: 1,
                rotate: ((i + 1) * 6) * (i % 2 === 0 ? 1 : -1),
                y: i * 10,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              exit={{ opacity: 0 }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
