import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        lastScrollYRef.current = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const diff = scrollY - lastScrollYRef.current;
            if (Math.abs(diff) > 10) {
                setScrollDirection(diff > 0 ? 'down' : 'up');
            }
            lastScrollYRef.current = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener('scroll', updateScrollDirection, { passive: true });
        return () => {
            window.removeEventListener('scroll', updateScrollDirection);
        };
    }, []);

    return scrollDirection;
}
