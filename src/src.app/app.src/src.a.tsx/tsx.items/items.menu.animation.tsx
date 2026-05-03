// items.menu.animation.ts
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export const useMenuScroll = <T extends HTMLElement>(
  scrollRef: RefObject<T | null>,
  threshold = 5
): boolean => {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    lastScrollTop.current = el.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = el.scrollTop;
      const diff = currentScrollTop - lastScrollTop.current;

      if (Math.abs(diff) > threshold) {
        setIsHidden(diff > 0);
      }

      lastScrollTop.current = currentScrollTop;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef, threshold]);

  return isHidden;
};