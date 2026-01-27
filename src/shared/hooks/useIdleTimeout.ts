import { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect user inactivity.
 * @param timeoutMinutes Minutes of inactivity before triggering onIdle.
 * @param onIdle Callback function to execute when timeout is reached.
 */
export function useIdleTimeout(timeoutMinutes: number, onIdle: () => void) {
    const [isIdle, setIsIdle] = useState(false);
    const lastActivityRef = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // If 0 or negative, disable timeout
        if (timeoutMinutes <= 0) return;

        const timeoutMs = timeoutMinutes * 60 * 1000;

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
            if (isIdle) setIsIdle(false);
        };

        const checkActivity = () => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivityRef.current;

            if (timeSinceLastActivity >= timeoutMs) {
                if (!isIdle) {
                    setIsIdle(true);
                    onIdle();
                }
            }
        };

        // Events to track
        const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

        // Attach listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Check every minute if we exceeded the limit
        // (Checking more frequently is fine too, but 1s is enough precision for session timeout)
        timerRef.current = setInterval(checkActivity, 1000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeoutMinutes, onIdle, isIdle]);

    return isIdle;
}
