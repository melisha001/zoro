import React, { useState } from 'react';
import { 
  ArrowLeft, Upload, FileText, Download, Play, 
  CheckCircle2, Clock, AlertCircle, File 
} from 'lucide-react';

export default function AssignmentPage({ setActiveScreen }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsSubmitted(true);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Breadcrumb - Screen 8 Top */}
      <button 
        onClick={() => setActiveScreen('student-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </button>

      {/* Assignment Header Title & Due Date Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Worksheet 5</h1>
          <p className="text-xs font-bold text-slate-500">Abacus Level 3 | Topic: Division</p>
        </div>

        <div className="bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-2xl text-xs font-black inline-flex items-center space-x-2 self-start sm:self-center">
          <Clock className="w-4 h-4 text-rose-600" />
          <span>Due Date: 15 Sep 2026</span>
        </div>
      </div>

      {/* Main Grid: Left Upload Form + Right Assignment Meta & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Instructions & Dropzone (Wireframe 8 Left) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
          
          {/* Instructions Box */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">Instructions</h3>
            <ol className="space-y-2 text-xs font-bold text-slate-600">
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] shrink-0 font-extrabold">1</span>
                <span>Solve all questions clearly on your practice sheet.</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] shrink-0 font-extrabold">2</span>
                <span>Upload clear photos or a single compiled PDF file.</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] shrink-0 font-extrabold">3</span>
                <span>Write your name and date on each page before capturing.</span>
              </li>
            </ol>
          </div>

          {/* Upload Submission Box */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Upload Your Submission</h3>

            {isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-black text-emerald-900">Submission Successful!</h4>
                <p className="text-xs font-bold text-emerald-700">Uploaded file: {selectedFile ? selectedFile.name : 'Worksheet5_Arjun.pdf'}</p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs font-bold text-emerald-800 underline pt-2"
                >
                  Resubmit file
                </button>
              </div>
            ) : (
              <>
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                  <input type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                  <Upload className="w-10 h-10 text-blue-600 mb-2" />
                  <span className="text-xs font-extrabold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1">
                    (PDF, JPG, PNG – Max 10 MB)
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!selectedFile}
                  className={`w-full py-4 rounded-xl font-extrabold text-sm shadow-md transition-all ${
                    selectedFile
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Assignment
                </button>
              </>
            )}
          </form>

        </div>

        {/* Right Column: Assignment Details Card & Resources (Wireframe 8 Right) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Assignment Details Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Assignment Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Status</span>
                <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase ${
                  isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSubmitted ? 'Submitted' : 'Pending'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Assigned On</span>
                <span className="font-extrabold text-slate-800">10 Sep 2026</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Trainer</span>
                <span className="font-extrabold text-blue-900">Priya</span>
              </div>
            </div>
          </div>

          {/* Resources Download Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">Resources</h3>

            <div className="space-y-2 text-xs">
              <a href="#" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 font-bold text-blue-700 transition-colors">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Sample Questions.pdf</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a href="#" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 font-bold text-blue-700 transition-colors">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-purple-600" />
                  <span>Reference Video</span>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
