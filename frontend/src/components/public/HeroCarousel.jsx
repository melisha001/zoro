import React, { useState, useEffect, useRef } from 'react';

/**
 * Public Hero Background Component with 0, 1, or >1 image handling:
 * - 0 images: Neutral brand gradient (no stock/Unsplash photos)
 * - 1 image: Static cover background with dark overlay, no animation
 * - >1 images: Automatic carousel every 5s (current slides out left, next slides in right),
 *   small indicator dots, next image preloaded, paused when tab is hidden,
 *   reduced-motion fallback (simple fade).
 */
export default function HeroCarousel({ images = [], children }) {
  const activeImages = (images || []).filter((img) => img && img.active !== false && img.url);
  const count = activeImages.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const touchStartXRef = useRef(null);

  // Clamp index if count changes
  useEffect(() => {
    if (count > 0 && currentIndex >= count) {
      setCurrentIndex(0);
      setPrevIndex(null);
    }
  }, [count, currentIndex]);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mediaQuery) return;
      setPrefersReducedMotion(Boolean(mediaQuery.matches));
      const handleChange = (e) => setPrefersReducedMotion(Boolean(e?.matches));
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // ignore
    }
  }, []);

  // Preload next image
  useEffect(() => {
    if (count <= 1) return;
    const nextIdx = (currentIndex + 1) % count;
    const nextUrl = activeImages[nextIdx]?.url;
    if (nextUrl) {
      const preload = new Image();
      preload.src = nextUrl;
    }
  }, [currentIndex, count, activeImages]);

  // Pause carousel while tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 5-second automatic rotation
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setPrevIndex(currentIndex);
      setCurrentIndex((curr) => (curr + 1) % count);
    }, 5000);

    return () => clearInterval(interval);
  }, [count, currentIndex, isPaused]);

  // Handle touch swipes on mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null || count <= 1) return;
    const touchEndX = e.changedTouches[0]?.clientX;
    if (touchEndX !== undefined) {
      const diff = touchStartXRef.current - touchEndX;
      if (diff > 50) {
        // Swiped left -> next
        setPrevIndex(currentIndex);
        setCurrentIndex((curr) => (curr + 1) % count);
      } else if (diff < -50) {
        // Swiped right -> prev
        setPrevIndex(currentIndex);
        setCurrentIndex((curr) => (curr - 1 + count) % count);
      }
    }
    touchStartXRef.current = null;
  };

  // Case 0: No images -> Neutral brand gradient
  if (count === 0) {
    return (
      <section className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30"></div>
        <div className="relative z-10 w-full">{children}</div>
      </section>
    );
  }

  // Case 1: Exactly 1 image -> Static background, no animation
  if (count === 1) {
    const single = activeImages[0];
    return (
      <section className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={single.url}
            alt={single.altText || 'Zoro Academy Hero'}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30"></div>
        <div className="relative z-10 w-full">{children}</div>
      </section>
    );
  }

  // Case > 1: Carousel
  return (
    <section
      className="relative text-white overflow-hidden py-16 md:py-24 min-h-[500px] flex items-center select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {activeImages.map((image, idx) => {
          const isCurrent = idx === currentIndex;
          const isPrev = idx === prevIndex;

          let transformClass = 'translate-x-full opacity-0 pointer-events-none';
          if (prefersReducedMotion) {
            transformClass = isCurrent
              ? 'opacity-100 transition-opacity duration-700 ease-in-out'
              : 'opacity-0 transition-opacity duration-700 ease-in-out pointer-events-none';
          } else {
            if (isCurrent) {
              transformClass = 'translate-x-0 opacity-100 transition-transform duration-700 ease-in-out';
            } else if (isPrev) {
              transformClass = '-translate-x-full opacity-100 transition-transform duration-700 ease-in-out';
            } else {
              transformClass = 'translate-x-full opacity-0 pointer-events-none';
            }
          }

          return (
            <div
              key={image.id || idx}
              className={`absolute inset-0 w-full h-full ${transformClass}`}
              aria-hidden={!isCurrent}
            >
              <img
                src={image.url}
                alt={image.altText || `Zoro Academy Hero Slide ${idx + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          );
        })}
      </div>

      {/* Dark gradient overlay keeping typography readable */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30"></div>

      {/* Hero content */}
      <div className="relative z-10 w-full">{children}</div>

      {/* Small Indicator Dots */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-2">
        {activeImages.map((image, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <button
              key={image.id || idx}
              type="button"
              onClick={() => {
                setPrevIndex(currentIndex);
                setCurrentIndex(idx);
              }}
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
