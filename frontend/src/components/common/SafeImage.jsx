import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../api/fileApi';

const DEFAULT_FALLBACK = '/assets/course-placeholder.svg';

export default function SafeImage({
  src,
  alt = 'Image',
  className = '',
  containerClassName = '',
  fallbackSrc = DEFAULT_FALLBACK,
  loading = 'lazy',
  onError,
  ...rest
}) {
  const resolved = resolveFileUrl(src) || fallbackSrc;
  const [imgSrc, setImgSrc] = useState(resolved);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const next = resolveFileUrl(src) || fallbackSrc;
    setImgSrc(next);
    setHasFailed(false);
    setIsLoaded(false);
  }, [src, fallbackSrc]);

  const handleError = (e) => {
    if (!hasFailed && imgSrc !== fallbackSrc) {
      setHasFailed(true);
      setImgSrc(fallbackSrc);
      setIsLoaded(true);
      if (onError) onError(e);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!isLoaded && (
        <div
          role="status"
          aria-busy="true"
          className="absolute inset-0 bg-slate-200 animate-pulse"
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </div>
  );
}
