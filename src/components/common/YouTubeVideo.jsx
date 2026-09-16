import React from 'react';
import { Lock, LogIn } from 'lucide-react';

export default function YouTubeVideo({ url, title, isProtected = false, isAuthenticated = false, onLoginClick }) {
  // Extract YouTube Video ID from various URL formats
  const getEmbedUrl = (rawUrl) => {
    if (!rawUrl) return null;
    let videoId = '';
    if (rawUrl.includes('youtu.be/')) {
      videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (rawUrl.includes('watch?v=')) {
      videoId = rawUrl.split('watch?v=')[1]?.split('&')[0];
    } else {
      videoId = rawUrl;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : null;
  };

  const embedUrl = getEmbedUrl(url);

  if (isProtected && !isAuthenticated) {
    return (
      <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 text-center text-white border border-slate-800 shadow-xl">
        <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center mb-4 text-blue-400">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">Login required to access this course</h3>
        <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
          Please sign in to your Zoro English Academy student account to view enrolled video lessons and learning materials.
        </p>
        <button
          onClick={onLoginClick}
          className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-transform transform hover:scale-105 inline-flex items-center space-x-2 text-xs"
        >
          <LogIn className="w-4 h-4" />
          <span>Login to Continue</span>
        </button>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-bold border border-slate-800">
        No Video Preview Available
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-950">
      <iframe
        src={embedUrl}
        title={title || 'Zoro English Academy Video'}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
