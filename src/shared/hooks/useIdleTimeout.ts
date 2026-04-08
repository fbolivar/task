import { useEffect, useRef, useCallback } from 'react';

const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to detect user inactivity.
 * @param timeoutMinutes Minutes of inactivity before triggering onIdle.
 * @param onIdle Callback function to execute when timeout is reached.
 * @param onWarning Optional callback fired 5 minutes before the timeout.
 */
export function useIdleTimeout(
    timeoutMinutes: number,
    onIdle: () => void,
    onWarning?: () => void,
) {
    const lastActivityRef = useRef<number>(Date.now());
    const firedRef = useRef(false);
    const warnedRef = useRef(false);
    const onIdleRef = useRef(onIdle);
    const onWarningRef = useRef(onWarning);
    onIdleRef.current = onIdle;
    onWarningRef.current = onWarning;

    const handleActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        firedRef.current = false;
        warnedRef.current = false;
    }, []);

    useEffect(() => {
        if (timeoutMinutes <= 0) return;

        const timeoutMs = timeoutMinutes * 60 * 1000;

        const checkActivity = () => {
            if (firedRef.current) return;

            const elapsed = Date.now() - lastActivityRef.current;

            // Fire warning when within the last 5 minutes (but not yet expired)
            if (
                !warnedRef.current &&
                onWarningRef.current &&
                timeoutMs > WARNING_BEFORE_MS &&
                elapsed >= timeoutMs - WARNING_BEFORE_MS
            ) {
                warnedRef.current = true;
                onWarningRef.current();
            }

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
