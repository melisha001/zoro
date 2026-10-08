import React, { useState } from 'react';
import { Upload, CheckCircle2, FileText, X } from 'lucide-react';

export default function FileUploader({ onFileSelect, accept = ".jpg,.png,.jpeg,.pdf", label = "Click to upload or drag and drop" }) {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (onFileSelect) onFileSelect(selected);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setFile(null);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full">
      <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center relative group">
        <input 
          type="file" 
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-between w-full max-w-sm bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3 overflow-hidden text-left">
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">{label}</span>
            <span className="text-[10px] font-semibold text-slate-400 mt-1">
              (JPG, PNG, PDF – Max 10 MB)
            </span>
          </>
        )}
      </label>
    </div>
  );
}
