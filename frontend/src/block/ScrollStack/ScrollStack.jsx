"use client";
import React, { useLayoutEffect, useRef, useCallback } from "react";

// Single card
export const ScrollStackItem = ({ children, itemClassName = "" }) => (
  <div
    className={`scroll-stack-card relative w-full h-96 my-8 p-8 rounded-2xl shadow-lg bg-white ${itemClassName}`}
    style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
  >
    {children}
  </div>
);

const ScrollStack = ({
  children,
  className = "",
  itemDistance = 40,
  itemScale = 0.03,
  itemStackDistance = 40,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  onStackComplete,
  debug = false, // set true to disable transforms while testing
}) => {
  const cardsRef = useRef([]);
  const lastTransformsRef = useRef(new Map());
  const stackCompletedRef = useRef(false);

  const calcProgress = useCallback((y, a, b) => (y <= a ? 0 : y >= b ? 1 : (y - a) / (b - a)), []);
  const parsePct = useCallback((v, h) => (String(v).includes("%") ? (parseFloat(v) / 100) * h : parseFloat(v)), []);

  const update = useCallback(() => {
    if (debug) return; // show cards without motion
    const scrollTop = window.scrollY;
    const vh = window.innerHeight;
    const stackPx = parsePct(stackPosition, vh);
    const scaleEndPx = parsePct(scaleEndPosition, vh);
    const pinEnd = document.body.scrollHeight - vh;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      // absolute top of card relative to document
      const cardTop = card.getBoundingClientRect().top + window.scrollY;

      const start = cardTop - stackPx - itemStackDistance * i;
      const end = cardTop - scaleEndPx;

      const prog = calcProgress(scrollTop, start, end);
      const targetScale = baseScale + i * itemScale;
      const scale = 1 - prog * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * prog : 0;

      // blur behind top card
      let blur = 0;
      if (blurAmount) {
        let topIdx = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jt = cardsRef.current[j].getBoundingClientRect().top + window.scrollY;
          const js = jt - stackPx - itemStackDistance * j;
          if (scrollTop >= js) topIdx = j;
        }
        if (i < topIdx) blur = Math.max(0, (topIdx - i) * blurAmount);
      }

      // pin logic
      let translateY = 0;
      const pinStart = start;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
      if (isPinned) {
        translateY = scrollTop - cardTop + stackPx + itemStackDistance * i;
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPx + itemStackDistance * i;
      }

      const next = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      };

      const prev = lastTransformsRef.current.get(i);
      const changed =
        !prev ||
        Math.abs(prev.translateY - next.translateY) > 0.1 ||
        Math.abs(prev.scale - next.scale) > 0.001 ||
        Math.abs(prev.rotation - next.rotation) > 0.1 ||
        Math.abs(prev.blur - next.blur) > 0.1;

      if (changed) {
        card.style.transform = `translate3d(0, ${next.translateY}px, 0) scale(${next.scale}) rotate(${next.rotation}deg)`;
        card.style.filter = next.blur ? `blur(${next.blur}px)` : "";
        lastTransformsRef.current.set(i, next);
      }

      // completion signal on last card
      if (i === cardsRef.current.length - 1) {
        const inView = scrollTop >= pinStart && scrollTop <= pinEnd;
        if (inView && !stackCompletedRef.current) {
          stackCompletedRef.current = true;
          onStackComplete?.();
        } else if (!inView && stackCompletedRef.current) {
          stackCompletedRef.current = false;
        }
      }
    });
  }, [
    debug,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    blurAmount,
    onStackComplete,
    calcProgress,
    parsePct,
  ]);

  useLayoutEffect(() => {
    const cards = Array.from(document.querySelectorAll(".scroll-stack-card"));
    cardsRef.current = cards;

    cards.forEach((c, i) => {
      if (i < cards.length - 1) c.style.marginBottom = `${itemDistance}px`;
      c.style.willChange = "transform, filter";
      c.style.transformOrigin = "top center";
      if (debug) {
        c.style.transform = "none";
        c.style.filter = "none";
      }
    });

    const onScroll = () => requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cardsRef.current = [];
      lastTransformsRef.current.clear();
      stackCompletedRef.current = false;
    };
  }, [itemDistance, update, debug]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="scroll-stack-inner px-6">
        {children}
        <div className="scroll-stack-end w-full h-px" />
      </div>
    </div>
  );
};

export default ScrollStack;
