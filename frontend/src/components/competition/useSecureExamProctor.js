import { useState, useEffect, useRef, useCallback } from 'react';
import { recordProctorEvent } from '../../api/competitionApi';

export function useSecureExamProctor({
  attemptId,
  isActive = false,
  initialViolationCount = 0,
  maxViolations = 3,
  onAutoSubmit
}) {
  const [violationCount, setViolationCount] = useState(initialViolationCount);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentViolationReason, setCurrentViolationReason] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const lastViolationTimeRef = useRef(0);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    setViolationCount(initialViolationCount);
  }, [initialViolationCount]);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      }

      // Best effort keyboard lock
      if (navigator.keyboard && typeof navigator.keyboard.lock === 'function') {
        try {
          await navigator.keyboard.lock(['Escape']);
        } catch (e) {
          // Non-critical if browser denies keyboard lock
        }
      }
      setIsLocked(true);
      setWarningModalOpen(false);
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    setIsLocked(false);
    if (navigator.keyboard && typeof navigator.keyboard.unlock === 'function') {
      try {
        navigator.keyboard.unlock();
      } catch (e) {}
    }
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      } catch (e) {}
    }
  }, []);

  const handleViolation = useCallback(async (eventType, reason) => {
    if (!isActive || !isLocked || autoSubmittedRef.current) return;

    // Rate-limit violations to prevent multiple triggers for 1 single switch
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2500) {
      return;
    }
    lastViolationTimeRef.current = now;

    const newCount = violationCount + 1;
    setViolationCount(newCount);
    setCurrentViolationReason(reason);

    try {
      if (attemptId) {
        const res = await recordProctorEvent(attemptId, eventType, {
          reason,
          count: newCount,
          timestamp: new Date().toISOString()
        });

        if (res?.data?.autoSubmitted || newCount >= maxViolations) {
          autoSubmittedRef.current = true;
          setWarningModalOpen(false);
          await exitFullscreen();
          if (onAutoSubmit) {
            onAutoSubmit(reason);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Failed to log proctor violation:', err);
    }

    if (newCount >= maxViolations) {
      autoSubmittedRef.current = true;
      setWarningModalOpen(false);
      await exitFullscreen();
      if (onAutoSubmit) {
        onAutoSubmit(reason);
      }
    } else {
      setWarningModalOpen(true);
    }
  }, [isActive, isLocked, violationCount, maxViolations, attemptId, onAutoSubmit, exitFullscreen]);

  // Fullscreen change listener
  useEffect(() => {
    if (!isActive || !isLocked) return;

    const onFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!inFullscreen && isLocked && !autoSubmittedRef.current) {
        handleViolation('FULLSCREEN_EXIT', 'Exited fullscreen examination mode');
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [isActive, isLocked, handleViolation]);

  // Visibility & Blur listener (Tab switch / window minimizing / app change)
  useEffect(() => {
    if (!isActive || !isLocked) return;

    let blurTimeout = null;

    const onVisibilityChange = () => {
      if (document.hidden && isLocked && !autoSubmittedRef.current) {
        handleViolation('TAB_SWITCH', 'Switched browser tab or minimized window');
      }
    };

    const onWindowBlur = () => {
      if (!isLocked || autoSubmittedRef.current) return;
      // Slight delay to ignore internal clicks / select inputs
      blurTimeout = setTimeout(() => {
        if (!document.hasFocus() && isLocked && !autoSubmittedRef.current) {
          handleViolation('WINDOW_BLUR', 'Switched application focus outside of the examination');
        }
      }, 350);
    };

    const onWindowFocus = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [isActive, isLocked, handleViolation]);

  // Keyboard shortcut lockdown & context menu disabling
  useEffect(() => {
    if (!isActive || !isLocked) return;

    const onKeyDown = (e) => {
      // F12 or devtools shortcuts (Ctrl+Shift+I/J/C)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation('RESTRICTED_KEY', 'Attempted to open browser developer tools');
        return false;
      }

      // Ctrl+U (view source), Ctrl+P (print), Ctrl+S (save)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Alt+Tab, Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleViolation('RESTRICTED_KEY', 'Pressed Escape key during proctored exam');
        return false;
      }
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('contextmenu', onContextMenu, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [isActive, isLocked, handleViolation]);

  const resumeFullscreen = useCallback(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  return {
    isLocked,
    violationCount,
    warningModalOpen,
    currentViolationReason,
    enterFullscreen,
    exitFullscreen,
    resumeFullscreen
  };
}
