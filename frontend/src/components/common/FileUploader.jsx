import React, { useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { uploadFile } from '../../api/fileApi';

export default function FileUploader({ 
  onFileSelect, 
  onUploadComplete,
  onUploadingStateChange,
  category = 'document',
  accept = ".jpg,.png,.jpeg,.pdf,.docx,.xlsx,.pptx", 
  label = "Click to upload or drag and drop" 
}) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError('');
      setProgress(0);

      if (category) {
        setIsUploading(true);
        if (onUploadingStateChange) onUploadingStateChange(true);

        try {
          const res = await uploadFile(selected, category, (percent) => setProgress(percent));
          setIsUploading(false);
          if (onUploadingStateChange) onUploadingStateChange(false);
          if (onUploadComplete) onUploadComplete(res);
          if (onFileSelect) onFileSelect(selected, res.url);
        } catch (err) {
          setIsUploading(false);
          if (onUploadingStateChange) onUploadingStateChange(false);
          setError(err.message || 'Upload failed');
          if (onFileSelect) onFileSelect(null, null);
        }
      } else {
        if (onFileSelect) onFileSelect(selected, null);
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFile(null);
    setProgress(0);
    setError('');
    setIsUploading(false);
    if (onUploadingStateChange) onUploadingStateChange(false);
    if (onFileSelect) onFileSelect(null, null);
  };

  return (
    <div className="w-full">
      <label className={`border-2 border-dashed ${error ? 'border-red-400 bg-red-50/50' : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50'} rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center relative group`}>
        <input 
          type="file" 
          accept={accept}
          onChange={handleChange}
          disabled={isUploading}
          className="hidden"
        />
        
        {file ? (
          <div className="flex flex-col w-full max-w-sm bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between overflow-hidden text-left">
              <div className="flex items-center space-x-3 truncate">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {!isUploading && (
                <button 
                  type="button" 
                  onClick={handleClear}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-200 rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
                <p className="text-[10px] font-bold text-blue-600 mt-1 text-center">Uploading... {progress}%</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">{label}</span>
            <span className="text-[10px] font-semibold text-slate-400 mt-1">
              (Allowed: {accept})
            </span>
          </>
        )}
      </label>

      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-xs font-bold mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
