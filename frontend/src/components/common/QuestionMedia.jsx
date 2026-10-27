import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle, RefreshCw, ZoomIn, X, Loader2 } from 'lucide-react';
import { getFileLink, resolveFileUrl } from '../../api/fileApi';
import AudioPromptPlayer from './AudioPromptPlayer';
import SafeVideo from './SafeVideo';

/**
 * Shared QuestionMedia Component
 * Authoritative viewer for exam question media prompts across:
 * - Candidate Exam Screens
 * - Trainer Evaluation Screens
 * - Admin Candidate Evaluation Previews
 *
 * Enforces:
 * - Storage rule: images and audio in Bunny Storage (signed-link flow), video in Bunny Stream
 * - File access rule: private files opened only via signed-link flow (no bare /api/files/{id})
 * - No default/placeholder fallback images (shows clean retry on failure)
 */
export default function QuestionMedia({
  questionFormat = 'MCQ',
  mediaRef,
  fileId,
  audioUrl,
  imageUrl,
  videoUrl,
  title = 'Question Media Prompt',
  className = '',
  imageClassName = 'max-h-[380px] w-auto max-w-full mx-auto object-contain rounded-2xl shadow-xs border border-slate-200'
}) {
  const effectiveFormat = (questionFormat || 'MCQ').toUpperCase();
  const rawRef = mediaRef || fileId || imageUrl || videoUrl || audioUrl || '';

  // Image signed-link state
  const [signedImgUrl, setSignedImgUrl] = useState('');
  const [loadingImg, setLoadingImg] = useState(false);
  const [imgError, setImgError] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const resolveImage = async () => {
    if (!rawRef || typeof rawRef !== 'string' || !rawRef.trim()) {
      setImgError('No image attached to this question.');
      setLoadingImg(false);
      return;
    }

    setLoadingImg(true);
    setImgError(null);

    const trimmed = rawRef.trim();

    // If external CDN or direct blob/data URI
    if ((trimmed.startsWith('http://') || trimmed.startsWith('https://')) && !trimmed.includes('/api/files/')) {
      setSignedImgUrl(trimmed);
      setLoadingImg(false);
      return;
    }

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      setSignedImgUrl(trimmed);
      setLoadingImg(false);
      return;
    }

    // Extract UUID if present or use bare ID
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const targetId = uuidMatch ? uuidMatch[0] : trimmed.replace(/^\/?api\/files\//, '').split('?')[0];

    try {
      const linkData = await getFileLink(targetId);
      const resolved = linkData?.url || linkData?.fileUrl || linkData?.directUrl;
      if (resolved) {
        setSignedImgUrl(resolved);
      } else {
        setSignedImgUrl(resolveFileUrl(trimmed));
      }
      setLoadingImg(false);
    } catch (err) {
      console.error('Failed to resolve signed image link:', err);
      setImgError('Could not load question image. Please verify access permission.');
      setLoadingImg(false);
    }
  };

  useEffect(() => {
    if (effectiveFormat === 'IMAGE') {
      resolveImage();
    }
  }, [effectiveFormat, rawRef]);

  if (!rawRef && effectiveFormat !== 'TEXT') {
    return null;
  }

  // 1. IMAGE PROMPT
  if (effectiveFormat === 'IMAGE') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <span>Image Prompt</span>
        </div>

        {loadingImg && (
          <div className="h-56 bg-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2 border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500">Loading secure question image...</span>
          </div>
        )}

        {imgError && !loadingImg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{imgError}</span>
            </div>
            <button
              type="button"
              onClick={resolveImage}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-rose-300 rounded-xl text-rose-700 font-bold hover:bg-rose-100 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {signedImgUrl && !loadingImg && !imgError && (
          <div className="relative group inline-block w-full text-center">
            <img
              src={signedImgUrl}
              alt={title || 'Question prompt'}
              className={`${imageClassName} cursor-pointer hover:opacity-95 transition`}
              onClick={() => setIsZoomed(true)}
              onError={() => {
                setImgError('Failed to display image from storage.');
              }}
            />
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition flex items-center space-x-1 cursor-pointer"
              title="Expand image"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Expand</span>
            </button>
          </div>
        )}

        {/* Fullscreen Zoom Modal */}
        {isZoomed && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <div
              className="relative max-w-5xl max-h-[90vh] bg-white rounded-3xl p-3 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">{title}</span>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh]">
                <img
                  src={signedImgUrl}
                  alt={title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. VIDEO PROMPT (Bunny Stream)
  if (effectiveFormat === 'VIDEO') {
    return (
      <div className={`space-y-2 ${className}`}>
        <SafeVideo
          bunnyVideoId={rawRef}
          src={rawRef}
          title={title}
          containerClassName="rounded-2xl overflow-hidden shadow-xs border border-slate-200"
        />
      </div>
    );
  }

  // 3. AUDIO PROMPT (Bunny Storage via AudioPromptPlayer)
  if (effectiveFormat === 'AUDIO') {
    return (
      <div className={`space-y-2 ${className}`}>
        <AudioPromptPlayer
          src={rawRef}
          fileId={rawRef}
          title={title}
          label="Question Audio Prompt"
        />
      </div>
    );
  }

  return null;
}
