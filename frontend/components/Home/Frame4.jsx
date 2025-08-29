import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Comic arrow, tuned to match the first image */
const ComicArrow = ({
  dir = "left", // "left" | "right"
  fill = "#111",
  stroke = "#111",
  strokeWidth = 4, // Increased border width to 4px
  text = "",
  textFill = "#FFD600",
  className = "",
  style = {},
  svgRef = null,
}) => {
  // Left arrow: chunky head, flat tail, slight top “fin”
  const leftPath =
    "M70,135 L250,35 L250,72 L1040,72 Q1065,72 1065,97 L1065,173 Q1065,198 1040,198 L250,198 L250,235 L70,135 Z";
  // Right arrow: ribbon tail notch, chunky head
  const rightPath =
    "M1030,135 L850,235 L850,198 L65,198 Q40,198 40,173 L40,97 Q40,72 65,72 L850,72 L850,35 L1030,135 Z";

  // Text anchors and transforms
  const isLeft = dir === "left";
  const viewBox = "0 0 1100 270";
  const bodyTextX = isLeft ? 650 : 450;
  const bodyTextY = 140;

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <defs>
        <filter id="arrowShadow" x="-20%" y="-40%" width="170%" height="180%">
          <feDropShadow dx="2" dy="4" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      <path
        d={isLeft ? leftPath : rightPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#arrowShadow)"
      />

      <text
        x={bodyTextX}
        y={bodyTextY}
        fontFamily='Montserrat, "Arial Black", Arial, sans-serif'
        fontWeight="800"
        style={{ fontSize: "36px", letterSpacing: "0.04em" }}
        fill={textFill}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {text}
      </text>
    </svg>
  );
};

const Frame4 = () => {
  const frameRef = useRef(null);
  const leftArrowRef = useRef(null);
  const rightArrowRef = useRef(null);

  useEffect(() => {
    if (!frameRef.current || !leftArrowRef.current || !rightArrowRef.current) return;

    // Animate left arrow (move left)
    gsap.fromTo(
      leftArrowRef.current,
      {
        x: 0,
        rotate: 10,
      },
      {
        x: "-10vw",
        rotate: 5,
        scrollTrigger: {
          trigger: frameRef.current,
          start: 'top 40%', // when top of frame hits 90% of viewport (10% from top)
          end: 'top -70%',   // when top of frame hits 80% from top (i.e., 20% viewport)
          scrub: true,
        },
        ease: "none",
      }
    );

    // Animate right arrow (move right)
    gsap.fromTo(
      rightArrowRef.current,
      {
        x: 0,
        rotate: -10,
      },
      {
        x: "10vw",
        rotate: -10,
        scrollTrigger: {
          trigger: frameRef.current,
          start: 'top 40%', // when top of frame hits 90% of viewport (10% from top)
          end: 'top -70%', 
          scrub: true,
        },
        ease: "none",
      }
    );

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="w-full min-h-screen h-screen bg-[#f5f2f2] flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        maxWidth: "1800px", // Increase overall width (add a maxWidth for large screens)
        width: "100vw",     // Ensure it stretches full viewport width
      }}
    >
      {/* Heading */}
      <div className="w-full flex flex-col items-center z-30">
        <span
          className="block text-center font-semibold"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            color: "#111",
            fontSize: "clamp(1.5rem, 4vw, 2.7rem)",
            marginTop: "2.5vw",
            marginBottom: "2.5vw",
            lineHeight: 1.2,
            letterSpacing: "0.01em",
          }}
        >
          हम <span className="font-extrabold"style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '3rem',
            letterSpacing: '0.03em',
            color: 'black',
            margin: '0.1em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }} >GYAAN</span> नहीं,{" "}
          <span className="font-extrabold" style={{
            fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '3rem',
            letterSpacing: '0.03em',
            color: 'transparent', 
            margin: '0.1em',
            textShadow: '0 1px 0 #000, 2px 0 #000',
          }}>SKILLS</span> बांटते हैं।
        </span>
      </div>

      {/* Arrows */}
      <div
        className="relative flex items-center justify-center w-full"
        style={{
          height: "clamp(200px, 36vw, 340px)", // Increased height for bigger arrows
          marginTop: "clamp(1.5rem, 4vw, 2.5rem)",
          marginBottom: "clamp(1.5rem, 4vw, 2.5rem)",
          marginRight: "65vw", // Reduce marginRight to allow more width
          width: "100vw", // Ensure full width
          maxWidth: "1800px", // Match parent
        }}
      > 
          {/* Left (black) */}
        <ComicArrow
          dir="left"
          fill="#111"
          stroke="#111"
          strokeWidth={4} // 4px border
          text="Mentors: Share skills, not lectures”"
          textFill="#FFD600"
          className="absolute z-10"
          svgRef={leftArrowRef}
          style={{
            left: "35%",
            top: "50%",
            transform: "translate(-60%, -50%) rotate(5deg)",
            width: "clamp(400px, 70vw, 1100px)", // Increased width
            height: "clamp(110px, 18vw, 200px)", // Increased height
            maxWidth: "98vw",
            minWidth: "320px",
            minHeight: "90px",
            willChange: "transform",
          }}
        />

        {/* Right (white with black stroke) */}
        <ComicArrow
          dir="right"
          fill="#fff"
          stroke="#111"
          strokeWidth={4} // 4px border
          text="Learners: Gain skills, apply fast"
          textFill="#111"
          className="absolute z-20"
          svgRef={rightArrowRef}
          style={{
            left: "60%",
            top: "70%",
            transform: "translate(0%, -50%) rotate(-10deg)",
            width: "clamp(400px, 70vw, 1100px)", // Increased width
            height: "clamp(110px, 18vw, 200px)", // Increased height
            maxWidth: "98vw",
            minWidth: "320px",
            minHeight: "90px",
            willChange: "transform",
          }}
        /> 
      </div>

      {/* Faint background text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span
          className="font-extrabold opacity-10"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            color: "#111",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            fontSize: "clamp(7vw, 16vw, 16vw)",
            lineHeight: 1,
          }}
        >
          SKILLS, NOT GYAAN
        </span>
      </div>
    </div>
  );
};

export default Frame4;
