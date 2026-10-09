import { useEffect, useRef } from 'react';

/**
 * Custom hook for periodic polling that respects the Page Visibility API.
 * Pauses execution when document.visibilityState is 'hidden' and resumes when visible.
 *
 * @param {Function} callback - Function to execute periodically.
 * @param {number} intervalMs - Interval duration in milliseconds (default: 5000).
 * @param {boolean} enabled - Whether polling is currently active (default: true).
 */
export function usePolling(callback, intervalMs = 5000, enabled = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let timerId = null;

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const tick = async () => {
      if (document.visibilityState === 'visible' && savedCallback.current) {
        try {
          const res = await savedCallback.current();
          if (res && res.status === 401) {
            stopTimer();
          }
        } catch (err) {
          console.error('Error during polling tick:', err);
        }
      }
    };

    const startTimer = () => {
      if (!timerId && document.visibilityState === 'visible') {
        timerId = setInterval(tick, intervalMs);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger immediately on return, then start recurring timer
        tick();
        startTimer();
      } else {
        stopTimer();
      }
    };

    const handleUnauthorized = () => {
      stopTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    startTimer();

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [intervalMs, enabled]);
}

export default usePolling;
