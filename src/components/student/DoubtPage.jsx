import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Upload, HelpCircle, CheckCircle, Clock, 
  MessageSquare, ChevronRight, X 
} from 'lucide-react';
import { getDoubts, createDoubt } from '../../api/doubtApi';
import { useAuth } from '../../context/AuthContext';

export default function DoubtPage({ setActiveScreen }) {
  const { user } = useAuth();
  const [doubtsList, setDoubtsList] = useState([]);
  const [course, setCourse] = useState('English Communication');
  const [topic, setTopic] = useState('Pronunciation & Pitch');
  const [question, setQuestion] = useState('');
  const [file, setFile] = useState(null);
  const [activeDoubtModal, setActiveDoubtModal] = useState(null);
  const [msg, setMsg] = useState('');

  const studentName = user?.name || 'Arjun M';
  const studentEmail = user?.email || 'arjun@student.com';

  useEffect(() => {
    loadDoubts();
  }, [studentEmail]);

  const loadDoubts = async () => {
    try {
      const res = await getDoubts();
      if (res.success && res.data) {
        // filter for logged in student
        const myDoubts = res.data.filter(d => d.studentEmail === studentEmail || d.studentName === studentName);
        setDoubtsList(myDoubts.length > 0 ? myDoubts : res.data);
      }
    } catch (err) {
      console.error('Failed to load doubts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      const res = await createDoubt({
        studentName,
        studentEmail,
        course,
        topic,
        question
      });

      if (res.success) {
        setMsg('Doubt submitted successfully!');
        setTimeout(() => setMsg(''), 3000);
        setQuestion('');
        setFile(null);
        await loadDoubts();
      }
    } catch (err) {
      setMsg('Failed to submit doubt.');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Breadcrumb Navigation */}
      <button 
        onClick={() => setActiveScreen('student-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Dashboard</span>
      </button>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ask a Doubt</h1>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-[#0F52BA] text-xs font-bold rounded-xl">
          {msg}
        </div>
      )}

      {/* Main Grid: Left Ask Form + Right Recent Doubts List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Ask Form Panel */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                >
                  <option value="English Communication">English Communication</option>
                  <option value="Abacus Level 3">Abacus Level 3</option>
                  <option value="Chess Mastery">Chess Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Grammar or Pronunciation"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Question</label>
              <textarea
                rows={4}
                required
                placeholder="Type your doubt here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload Image / File (optional)</label>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
                />
                <Upload className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">(JPG, PNG, PDF – Max 10 MB)</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 text-sm"
            >
              Submit Doubt
            </button>
          </form>
        </div>

        {/* Right Recent Doubts List */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Recent Doubts</h3>
            <span className="text-[10px] font-bold text-slate-400">Total: {doubtsList.length}</span>
          </div>

          <div className="space-y-3">
            {doubtsList.map((doubt) => (
              <div 
                key={doubt.id} 
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{doubt.id}</span>
                    <span className="text-xs font-extrabold text-slate-900">{doubt.topic}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    doubt.status?.toUpperCase() === 'RESOLVED' || doubt.status?.toUpperCase() === 'ANSWERED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {doubt.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 font-medium">{doubt.question}</p>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setActiveDoubtModal(doubt)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Answer Modal */}
      {activeDoubtModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setActiveDoubtModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-600">{activeDoubtModal.id}</span>
              <h3 className="text-base font-black text-slate-900">{activeDoubtModal.topic}</h3>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <strong>Question:</strong> {activeDoubtModal.question}
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <strong className="block font-bold">Trainer Response ({activeDoubtModal.trainerName || 'Trainer'}):</strong>
              <p>{activeDoubtModal.answer || 'Trainer is currently reviewing your question.'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

