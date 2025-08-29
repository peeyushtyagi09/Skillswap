import React from 'react'
import { motion } from "motion/react" 
import CountUp from '../../src/TextAnimations/CountUp/CountUp'
const Frame2 = () => { 
  const handleStart = () => {
    alert("You have to login or register first");
    }
  
  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row items-center justify-center bg-[#f5f2f2] transition-all duration-300">
      {/* Left: Video */}
      <div className="w-8/12 md:w-[40%] aspect-[1/1.05] mx-2 md:mx-6 my-4 flex items-center justify-center transition-all duration-300 overflow-hidden">
        <img
          src="/video/video3.gif"
          alt="animated gif"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* Right: Content */}
      <div className="w-11/12 md:w-[48%] flex flex-col gap-4 px-4 py-6">
        {/* Top stats */}
        <div className="flex flex-wrap gap-4 mb-4">
          {[
            { to: 500, label: "Skills Shared" },
            { to: 200, label: "Successful Swaps" },
            { to: 50, label: "Active Communities" },
          ].map((item, i) => (
            <div key={i} className="flex-1 min-w-[120px]">
              <div className="daisyui-card bg-transparent border-4 border-black rounded-xl px-4 py-2 text-center shadow">
                <div className="text-xl md:text-2xl font-bold text-black">
                  <CountUp from={0} to={item.to} separator="," duration={1} />+
                </div>
                <div className="text-xs md:text-sm font-medium text-gray-700">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features List */}
        <ul className="mb-8 space-y-4">
          {[
            { word: "LEARN", text: <>Grow faster through <span className="bg-black text-white p-1 md:p-2 rounded">skill swaps</span></> },
            { word: "BOOKS", text: <><span className="bg-black text-white p-1 md:p-2 rounded">Learn smarter</span> with real stories</> },
            { word: "SCREEN", text: <>Connect live, <span className="bg-black text-white p-1 md:p-2 rounded">learn together</span> with  creators</> },
            { word: "TEACHERS", text: <>Share knowledge, <span className="bg-black text-white p-1 md:p-2 rounded">gain true experience</span></> },
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 bg-white/80 rounded-xl border border-black shadow-md px-4 py-3 hover:scale-[1.025] transition-transform duration-200"
            >
              <span
                className="relative inline-block font-extrabold drop-shadow-lg text-lg sm:text-xl md:text-2xl lg:text-3xl"
                style={{
                  fontFamily:
                    '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
                  fontStyle: "italic",
                  color: "white",
                  textShadow: "0 2px 0 #000, 0 4px 0 #000",
                }}
              >
                <span
                  className="absolute left-0 right-0 top-1/2"
                  style={{
                    borderTop: "0.4rem solid black",
                    width: "120%",
                    left: "50%",
                    transform: "translate(-50%, 0%)",
                    position: "absolute",
                    zIndex: 1,
                  }}
                />
                <span className="relative z-10 ">{item.word}</span>
              </span>
              <span className="text-sm sm:text-base md:text-lg text-[#28303d] font-semibold ml-5 " style={{ fontFamily: '"Montserrat", sans-serif' }}>
                {item.text}
              </span>
            </li>
          ))}
        </ul>

        {/* Button */}
        <motion.button
          ref={(el) => (window.gsapBtn2 = el)}
          className="relative px-2 py-3 md:py-4 bg-white border-2 border-black rounded-lg shadow-[4px_6px_0_0_rgba(0,0,0,1)] font-extrabold text-black text-lg md:text-2xl w-[90%] mx-auto"
          style={{
            fontFamily:
              '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontStyle: "italic",
            textShadow: "0 1px 0 #000, 2px 0 #000",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          onClick={handleStart}
        >
          Let’s Start &rarr;
        </motion.button>
      </div>
    </div>
  );
}


export default Frame2
