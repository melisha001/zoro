import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { resolveFileUrl } from '../../api/fileApi';

export default function SafeVideo({
  src,
  embedUrl,
  libraryId = '784226',
  poster,
  title = 'Video Player',
  className = '',
  containerClassName = '',
  isIframe = false,
  autoPlay = false,
  controls = true,
  muted = false,
  bunnyVideoId,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  const effectiveIframe = isIframe || Boolean(bunnyVideoId) || Boolean(embedUrl) || (src && src.includes('mediadelivery.net'));
  const resolvedSrc = src ? resolveFileUrl(src) : '';
  const effectiveSrc = embedUrl || (bunnyVideoId ? (bunnyVideoId.includes('http') ? bunnyVideoId : `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}`) : resolvedSrc);

  return (
    <div className={`relative w-full aspect-video overflow-hidden bg-slate-900 rounded-xl ${containerClassName}`}>
      {!isLoaded && (
        <div
          role="status"
          aria-busy="true"
          className="absolute inset-0 bg-slate-800 animate-pulse flex flex-col items-center justify-center text-slate-500 z-10"
        >
          <Video className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-xs font-semibold">Loading video...</span>
        </div>
      )}

      {effectiveIframe ? (
        <iframe
          src={effectiveSrc}
          title={title}
          className={`absolute inset-0 w-full h-full border-0 object-contain transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          {...rest}
        />
      ) : (
        <video
          src={effectiveSrc}
          poster={poster}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoadedData={() => setIsLoaded(true)}
          {...rest}
        />
      )}
    </div>
  );
}
