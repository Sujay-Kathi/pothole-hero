import { useState, useEffect, useRef } from 'react';

interface UseScrollHeaderOptions {
    hideOnLoad?: boolean; // For submit report page
    threshold?: number; // Minimum scroll distance to trigger
}

export const useScrollHeader = (options: UseScrollHeaderOptions = {}) => {
    const { hideOnLoad = false, threshold = 10 } = options;
    const [isVisible, setIsVisible] = useState(!hideOnLoad);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

                    // Only update if scroll difference exceeds threshold
                    if (scrollDifference > threshold) {
                        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                            // Scrolling down - hide header
                            setIsVisible(false);
                        } else if (currentScrollY < lastScrollY.current) {
                            // Scrolling up - show header
                            setIsVisible(true);
                        }
                        lastScrollY.current = currentScrollY;
                    }

                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        // Set initial scroll position
        lastScrollY.current = window.scrollY;

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [threshold]);

    return isVisible;
};
