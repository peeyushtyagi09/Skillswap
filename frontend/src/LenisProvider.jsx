import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

const LenisProvider = ({ children }) => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    lenisRef.current = new Lenis({
      duration: 2,
      smoothWheel: true,
      smoothTouch: true,
    });

    const raf = (time) => {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lenisRef.current?.destroy();
    };
  }, []);

  return children;
};

export default LenisProvider;
