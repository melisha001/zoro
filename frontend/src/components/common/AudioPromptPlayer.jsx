import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, AlertCircle, RefreshCw, Loader2, Music } from 'lucide-react';
import { getFileLink, resolveFileUrl } from '../../api/fileApi';

export default function AudioPromptPlayer({
  src,
  fileId,
  title = 'Audio Prompt',
  label,
  className = '',
  autoPlay = false,
  onEnded,
}) {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const resolveAudioSource = async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = fileId || src || '';
      if (!raw) {
        setError('No audio source provided');
        setLoading(false);
        return;
      }

      // If already a data URI, blob URL, or has token attached, use directly
      if (typeof raw === 'string' && (raw.startsWith('data:') || raw.startsWith('blob:') || raw.includes('token='))) {
        setResolvedUrl(resolveFileUrl(raw));
        setLoading(false);
        return;
      }

      // Check for UUID in raw or src
      const match = String(raw).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (match) {
        const linkData = await getFileLink(match[0]);
        if (linkData?.url) {
          setResolvedUrl(linkData.url);
          setLoading(false);
          return;
        }
      }

      // Fallback to resolveFileUrl
      setResolvedUrl(resolveFileUrl(raw));
      setLoading(false);
    } catch (err) {
      console.error('Failed to resolve audio signed link:', err);
      setError(err?.message || 'Could not load audio. Please verify access permission.');
      setLoading(false);
    }
  };

  useEffect(() => {
    resolveAudioSource();
  }, [src, fileId]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setLoading(false);
      setError(null);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0);
    }
  };

  const handleAudioError = (e) => {
    console.error('Audio playback error:', e);
    // Don't flag error if src is empty or loading
    if (resolvedUrl) {
      setError('Unable to stream audio track. Click retry to refresh access token.');
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs select-none transition-all ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : error ? (
              <VolumeX className="w-4 h-4 text-red-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {label || title}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              {loading
                ? 'Loading audio track...'
                : error
                ? 'Audio unavailable'
                : duration > 0
                ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                : 'Audio prompt'}
            </span>
          </div>
        </div>

        {error && (
          <button
            type="button"
            onClick={resolveAudioSource}
            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs cursor-pointer transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>

      {error ? (
        <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mt-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">{error}</span>
        </div>
      ) : (
        <div className="mt-1">
          {resolvedUrl ? (
            <audio
              ref={audioRef}
              src={resolvedUrl}
              controls
              controlsList="nodownload noplaybackrate"
              preload="metadata"
              autoPlay={autoPlay}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onError={handleAudioError}
              onEnded={onEnded}
              className="w-full h-9 rounded-lg focus:outline-hidden"
            />
          ) : (
            <div className="h-9 bg-slate-200/60 rounded-lg animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
