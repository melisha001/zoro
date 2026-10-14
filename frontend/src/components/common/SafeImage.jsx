import React, { useState, useEffect } from 'react';

const DEFAULT_FALLBACK = '/assets/course-placeholder.svg';

export default function SafeImage({
  src,
  alt = 'Image',
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  loading = 'lazy',
  onError,
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasFailed(false);
  }, [src, fallbackSrc]);

  const handleError = (e) => {
    if (!hasFailed && imgSrc !== fallbackSrc) {
      setHasFailed(true);
      setImgSrc(fallbackSrc);
      if (onError) onError(e);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      {...rest}
    />
  );
}
