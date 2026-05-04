import { useEffect, useRef, useState } from "react";
import { type RefObject } from "react";

export const useMenuScrollFade = (
    scrollRef?: RefObject<HTMLUListElement | null>,
    threshold: number = 5
) => {
    const [isFaded, setIsFaded] = useState(false);
    const lastScrollTop = useRef(0);

    useEffect(() => {
        const el = scrollRef?.current;
        if (!el) return;

        lastScrollTop.current = el.scrollTop;

        const onScroll = () => {
            const current = el.scrollTop;
            const diff = current - lastScrollTop.current;

            const shouldFade = diff > threshold;
            const shouldShow = diff < -threshold;

            shouldFade && setIsFaded(true);
            shouldShow && setIsFaded(false);

            lastScrollTop.current = current;
        };

        el.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            el.removeEventListener("scroll", onScroll);
        };
    }, [scrollRef, threshold]);

    return !!isFaded;
};