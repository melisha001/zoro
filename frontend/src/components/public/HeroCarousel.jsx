import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * Public Hero Background Component with 0, 1, or >1 image handling:
 * - 0 images: Neutral brand gradient (no stock/Unsplash photos)
 * - 1 image: Static cover background with dark overlay, no animation/timer
 * - >1 images: Automatic crossfade rotation every `intervalSeconds` (default 5s).
 *   - Preloads all images; skips failed images automatically.
 *   - Stable interval with functional updates (timer does NOT reset on every index change).
 *   - Pauses on document.hidden, resumes and advances on document becoming visible.
 *   - Pauses on hover, supports swipe on touch devices.
 *   - Smooth crossfade (no flicker, no blank frames).
 */
export default function HeroCarousel({
  images = [],
  intervalSeconds = 5,
  randomStart = false,
  children
}) {
  const [failedUrls, setFailedUrls] = useState(() => new Set());

  // Filter valid, active, non-failed images
  const validImages = useMemo(() => {
    return (images || []).filter(
      (img) => img && img.active !== false && img.url && !failedUrls.has(img.url)
    );
  }, [images, failedUrls]);

  const count = validImages.length;

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (count > 1 && randomStart) {
      return Math.floor(Math.random() * count);
    }
    return 0;
  });

  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const countRef = useRef(count);
  countRef.current = count;

  // Preload all valid images on mount / list update and catch errors
  useEffect(() => {
    if (!images || images.length === 0) return;
    images.forEach((img) => {
      if (!img?.url || failedUrls.has(img.url)) return;
      try {
        const tester = new Image();
        tester.src = img.url;
        tester.onerror = () => {
          setFailedUrls((prev) => {
            const next = new Set(prev);
            next.add(img.url);
            return next;
          });
        };
      } catch {
        // ignore in non-browser env
      }
    });
  }, [images, failedUrls]);

  // Clamp index if count changes
  useEffect(() => {
    if (count > 0 && currentIndex >= count) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  // Stable next slide transition
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const c = countRef.current;
      if (c <= 1) return 0;
      return (prev + 1) % c;
    });
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const c = countRef.current;
      if (c <= 1) return 0;
      return (prev - 1 + c) % c;
    });
  }, []);

  // Stable timer that does NOT depend on currentIndex!
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const ms = Math.max(1, intervalSeconds) * 1000;
    const interval = setInterval(() => {
      nextSlide();
    }, ms);

    return () => clearInterval(interval);
  }, [count, isPaused, intervalSeconds, nextSlide]);

  // Pause carousel when document is hidden; resume AND advance immediately on visibilitychange
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
        // Resume and advance immediately on tab focus
        if (countRef.current > 1) {
          nextSlide();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [nextSlide]);

  // Touch swipe handling
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || count <= 1) return;
    const touchEndX = e.changedTouches?.[0]?.clientX;
    if (touchEndX !== undefined) {
      const diff = touchStartXRef.current - touchEndX;
      if (diff > 50) {
        nextSlide();
      } else if (diff < -50) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
  };

  // Case 0: No images -> Neutral brand gradient
  if (count === 0) {
    return (
      <section className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />
        <div className="relative z-10 w-full">{children}</div>
      </section>
    );
  }

  // Case 1: Exactly 1 image -> Static cover background, no animation, no indicator dots
  if (count === 1) {
    const single = validImages[0];
    return (
      <section className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={single.url}
            alt={single.altText || 'Zoro Academy Hero'}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />
        <div className="relative z-10 w-full">{children}</div>
      </section>
    );
  }

  // Case > 1: Crossfade Carousel
  return (
    <section
      className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="hero-carousel-section"
      data-current-index={currentIndex}
    >
      {/* Background Slides with Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        {validImages.map((image, idx) => {
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={image.id || image.url || idx}
              data-testid={`hero-slide-${idx}`}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isCurrent ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isCurrent}
            >
              <img
                src={image.url}
                alt={image.altText || `Zoro Academy Hero Slide ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>

      {/* Dark gradient overlay keeping typography readable */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />

      {/* Hero content */}
      <div className="relative z-10 w-full">{children}</div>

      {/* Small Indicator Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {validImages.map((image, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <button
              key={image.id || image.url || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to hero slide ${idx + 1}`}
              className={`transition-all rounded-full cursor-pointer h-2 ${
                isSelected ? 'w-6 bg-blue-500 shadow-sm' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
