import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect user inactivity.
 * @param timeoutMinutes Minutes of inactivity before triggering onIdle.
 * @param onIdle Callback function to execute when timeout is reached.
 */
export function useIdleTimeout(timeoutMinutes: number, onIdle: () => void) {
    const lastActivityRef = useRef<number>(Date.now());
    const firedRef = useRef(false);
    const onIdleRef = useRef(onIdle);
    onIdleRef.current = onIdle;

    const handleActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        firedRef.current = false;
    }, []);

    useEffect(() => {
        if (timeoutMinutes <= 0) return;

        const timeoutMs = timeoutMinutes * 60 * 1000;

        const checkActivity = () => {
            if (firedRef.current) return;
            const elapsed = Date.now() - lastActivityRef.current;
            if (elapsed >= timeoutMs) {
                firedRef.current = true;
                onIdleRef.current();
            }
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
        events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

        const interval = setInterval(checkActivity, 5000);

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            clearInterval(interval);
        };
    }, [timeoutMinutes, handleActivity]);
}
