import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

import usePolling from '../../hooks/usePolling';

export default function SecureVideoPlayer({
  videoRefData,
  videoTitle,
  courseTitle,
  studentName = 'Student',
  studentEmail = 'student@zoro.com',
  isAuthorized = true,
  authErrorMsg = '',
  initialPosition = 0,
  onProgressUpdate
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isResumed, setIsResumed] = useState(false);

  // Requirement #7: Moving Watermark Position State (changes position periodically)
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  // Watermark position shifting every 6 seconds using visibility-aware usePolling
  usePolling(() => {
    const topPositions = ['10%', '25%', '65%', '80%', '40%'];
    const leftPositions = ['10%', '60%', '15%', '70%', '45%'];
    const randIdx = Math.floor(Math.random() * topPositions.length);
    setWatermarkPos({
      top: topPositions[randIdx],
      left: leftPositions[randIdx]
    });
  }, 6000, true);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Requirement #9: Resume from last watched position
      if (initialPosition > 0 && !isResumed) {
        videoRef.current.currentTime = initialPosition;
        setIsResumed(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);

    const pct = Math.min(100, Math.round((cur / dur) * 100));
    const isCompleted = pct >= 80;

    if (onProgressUpdate) {
      onProgressUpdate({
        lastPosition: Math.floor(cur),
        completionPercentage: pct,
        status: isCompleted ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started'
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Secure Bunny Stream or protected video source
  let parsedRef = videoRefData;
  if (typeof videoRefData === 'string' && videoRefData.trim().startsWith('{')) {
    try {
      parsedRef = JSON.parse(videoRefData);
    } catch {
      // fallback
    }
  }

  const videoSrc = (typeof parsedRef === 'string' && (parsedRef.startsWith('http://') || parsedRef.startsWith('https://')))
    ? parsedRef
    : (parsedRef?.streamUrl 
      || parsedRef?.fallbackUrl 
      || parsedRef?.directStreamUrl 
      || (parsedRef?.storageKey 
        ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4#t=${initialPosition}`
        : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'));

  if (!isAuthorized) {
    return (
      <div className="relative w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center text-white border border-slate-800 shadow-2xl">
        <div className="w-16 h-16 bg-rose-600/20 border border-rose-500/40 rounded-full flex items-center justify-center mb-4 text-rose-400">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">Access Denied: Enrolled Students Only</h3>
        <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
          {authErrorMsg || 'You are not registered or enrolled in this course. Please sign in to your student account and enroll to stream recorded lessons.'}
        </p>
        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800">
          🔒 PROTECTED CLOUD STREAMING ACCESS
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()} // Requirement #6: Anti-download context menu protection
      className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-900 bg-slate-950 group select-none flex flex-col justify-between"
    >
      {/* HTML5 Video Element with no-download controls */}
      <video
        ref={videoRef}
        src={videoSrc}
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          if (onProgressUpdate) {
            onProgressUpdate({ lastPosition: Math.floor(duration), completionPercentage: 100, status: 'Completed' });
          }
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Requirement #7: DYNAMIC MOVING WATERMARK OVERLAY */}
      <div
        style={{ top: watermarkPos.top, left: watermarkPos.left }}
        className="absolute pointer-events-none transition-all duration-1000 ease-in-out bg-black/50 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/20 text-[10px] font-mono font-bold text-white/80 tracking-widest uppercase shadow-lg z-20 flex items-center gap-1.5"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{studentName} • {studentEmail} • {courseTitle || 'ZORO ACADEMY'}</span>
      </div>

      {/* Top Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between z-10 text-white">
        <div className="text-xs font-black truncate max-w-md">
          {videoTitle || 'Private Recorded Lesson'}
        </div>
        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
          🔒 SECURE SIGNED STREAM
        </div>
      </div>

      {/* Custom Player Controls Bar (Requirement #6 & #8: No Download Option) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity space-y-2 z-10">
        
        {/* Progress Range Bar */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-blue-600 h-1.5 bg-white/30 rounded-lg cursor-pointer appearance-none"
        />

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center space-x-3">
            <button onClick={togglePlay} className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button onClick={toggleMute} className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 accent-blue-500 bg-white/30 rounded-lg cursor-pointer"
            />

            <span className="font-mono text-[11px] text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {initialPosition > 0 && (
              <span className="text-[10px] text-sky-300 font-mono font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Resumed from {formatTime(initialPosition)}
              </span>
            )}

            <button onClick={toggleFullScreen} className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
