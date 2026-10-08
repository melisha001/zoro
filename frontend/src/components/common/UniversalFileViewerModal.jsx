import React from 'react';
import { X, Download, FileText, Film, Music, Image as ImageIcon, FileSpreadsheet, Archive } from 'lucide-react';

export default function UniversalFileViewerModal({ isOpen, onClose, file, hideDownload = false }) {
  if (!isOpen || !file) return null;

  const fileName = file.name || file.title || file.filename || 'Attachment File';
  const fileUrl = file.url || file.fileUrl || file.path || '#';
  const fileSize = file.size || file.fileSize || 'Standard';

  // Extract Extension & MIME
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mimeType = (file.mimeType || file.type || '').toLowerCase();

  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimeType.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || mimeType.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext) || mimeType.startsWith('audio/');
  const isPdf = ext === 'pdf' || mimeType === 'application/pdf';
  const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext);
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {isImage && <ImageIcon className="w-5 h-5" />}
              {isVideo && <Film className="w-5 h-5" />}
              {isAudio && <Music className="w-5 h-5" />}
              {isPdf && <FileText className="w-5 h-5 text-red-600" />}
              {isSpreadsheet && <FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
              {isArchive && <Archive className="w-5 h-5 text-purple-600" />}
              {!isImage && !isVideo && !isAudio && !isPdf && !isSpreadsheet && !isArchive && (
                <FileText className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {fileName}
              </h3>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {ext ? `${ext.toUpperCase()} File` : 'Document'} • {fileSize}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200 rounded-full transition-colors shrink-0 shadow-xs border border-slate-200 cursor-pointer"
            aria-label="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100/50 min-h-[300px]">
          {/* 1. IMAGE VIEWER */}
          {isImage && (
            <div className="max-h-full max-w-full flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-lg border border-slate-200 bg-white"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800';
                }}
              />
            </div>
          )}

          {/* 2. VIDEO PLAYER */}
          {isVideo && (
            <div className="w-full max-w-3xl flex flex-col items-center">
              <video
                src={fileUrl}
                controls
                controlsList="nodownload"
                className="w-full max-h-[70vh] rounded-2xl shadow-xl bg-black border border-slate-800"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* 3. AUDIO PLAYER */}
          {isAudio && (
            <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center">
              <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Music className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">{fileName}</h4>
                <p className="text-xs font-semibold text-slate-400 mt-1">Audio File • Ready to Play</p>
              </div>
              <audio src={fileUrl} controls controlsList="nodownload" className="w-full">
                Your browser does not support HTML5 audio playback.
              </audio>
            </div>
          )}

          {/* 4. PDF EMBED */}
          {isPdf && (
            <div className="w-full h-[70vh] bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              <iframe
                src={fileUrl}
                title={fileName}
                className="w-full h-full"
              />
            </div>
          )}

          {/* 5. DOCUMENTS / OTHER FALLBACK */}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                {isSpreadsheet ? <FileSpreadsheet className="w-10 h-10 text-emerald-600" /> : <FileText className="w-10 h-10 text-blue-600" />}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">{fileName}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {ext ? `${ext.toUpperCase()} Document` : 'File Attachment'} • {fileSize}
                </p>
                <p className="text-xs text-slate-400 pt-2">
                  Preview in viewer mode.
                </p>
              </div>

              {!hideDownload && fileUrl && fileUrl !== '#' && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fileName}
                  className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs shadow-md transition-all w-full cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Open File</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-400">
            Zoro Universal File Viewer
          </div>
          <div className="flex items-center space-x-3">
            {!hideDownload && fileUrl && fileUrl !== '#' && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
