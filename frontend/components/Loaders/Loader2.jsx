import React, { useState,useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";


const SKILLWAP_LETTERS = ['S', 'K', 'I', 'L', 'L', 'S', 'W', 'A', 'P'];
const loader2 = () => {
  // Letter animation
  const letterRefs = useRef(SKILLWAP_LETTERS.map(() => React.createRef()));

    const smallStair = useRef(null);

    useGSAP(() => {
        gsap.timeline({
          repeat: -1, // infinite loop
          yoyo: true, // smoothly reverse instead of restarting
        })
          .fromTo(
            ".stair-2",
            { y: 0 },
            {
              y: "100%",
              duration: 0.5, // speed of each move
              stagger: { amount: 0.5 },
              ease: "power1.inOut", // smooth easing
            }
          );
      });
      const [rotations] = useState(() => SKILLWAP_LETTERS.map(() => (Math.random() * 16 - 4).toFixed(1)))
  return (
  <div  className='h-screen w-screen overflow-hidden bg-[#f6f4f4] text-black flex flex-col justify-between'>
      <div className='h-[20%] w-full  m-10'>
      <div style={{ display: 'flex', marginBottom: '0.2em', transform: 'rotate(-3deg)' }}>
          {SKILLWAP_LETTERS.map((char, i) => (
            <span key={`skillwap-${i}`} ref={letterRefs.current[i]} style={{
              display: 'inline-block',
              transform: `rotate(${rotations[i]}deg)`,
              fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
              fontWeight: 1000,
              fontSize: '4.5rem',
              lineHeight: 1,
              color: '#f6f4f4',
              letterSpacing: '0.01em',
              textShadow: '0 2px 0 #000, 0 4px 0 #000, 0 6px 0 #000, 0 8px 0 #000',
              WebkitTextStroke: '4px #000',
              background: 'transparent',
              padding: 0,
              margin: 0,
              textTransform: 'uppercase',
              opacity: 1,
            }}>{char}</span>
          ))}
        </div>
      </div>
      <div className='h-[20%] w-full  justify-end  items-end flex'> 
         <div useRef={smallStair} className='h-12 w-24 m-10 mr-15 flex overflow-hidden'>
            <div className=' stair-2 h-full w-1/5 bg-black'></div>
            <div className=' stair-2 h-full w-1/5 bg-black'></div>
            <div className=' stair-2 h-full w-1/5 bg-black'></div>
            <div className=' stair-2 h-full w-1/5 bg-black'></div>
            <div className=' stair-2 h-full w-1/5 bg-black'></div>
         </div>
      </div>
    </div>
  )
}

export default loader2
