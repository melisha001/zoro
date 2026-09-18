import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { getDoubts, resolveDoubt } from '../../api/doubtApi';
import { useAuth } from '../../context/AuthContext';

export default function TrainerDoubtsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('open');
  const [doubts, setDoubts] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const trainerName = user?.name || 'Priya';

  useEffect(() => {
    loadDoubts();
  }, []);

  const loadDoubts = async () => {
    setLoading(true);
    try {
      const res = await getDoubts();
      setDoubts(res.data || []);
    } catch (err) {
      console.error('Failed to load doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (doubtId) => {
    const text = replyText[doubtId];
    if (!text || !text.trim()) return;

    try {
      const res = await resolveDoubt(doubtId, trainerName, text);
      if (res.success) {
        setMsg('Doubt resolved & answer sent to student!');
        setTimeout(() => setMsg(''), 3000);
        setReplyText(prev => ({ ...prev, [doubtId]: '' }));
        await loadDoubts();
      }
    } catch (err) {
      console.error('Failed to resolve doubt:', err);
    }
  };

  const openDoubts = doubts.filter(d => d.status?.toUpperCase() === 'OPEN');
  const answeredDoubts = doubts.filter(d => d.status?.toUpperCase() === 'RESOLVED' || d.status?.toUpperCase() === 'ANSWERED');

  const filteredDoubts = activeTab === 'open' ? openDoubts : answeredDoubts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Doubts</h1>
        <p className="text-slate-500 text-sm mt-1">Answer student questions and provide guidance as {trainerName}.</p>
      </div>

      {msg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-[#0F52BA] text-xs font-bold rounded-xl">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('open')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'open'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Open ({openDoubts.length})
        </button>
        <button
          onClick={() => setActiveTab('answered')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'answered'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Answered ({answeredDoubts.length})
        </button>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">Loading student doubts...</div>
        ) : filteredDoubts.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
            No {activeTab} doubts found.
          </div>
        ) : (
          filteredDoubts.map(doubt => (
            <div key={doubt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-bold text-base shadow-xs uppercase">
                    {(doubt.studentName || 'S').charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{doubt.studentName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{doubt.course} • {doubt.topic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{doubt.createdOn || 'Recent'}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    doubt.status?.toUpperCase() === 'OPEN'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {doubt.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-slate-800 font-medium text-sm leading-relaxed border border-slate-100">
                {doubt.question}
              </div>

              {doubt.status?.toUpperCase() === 'OPEN' ? (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    aria-label={`Reply to ${doubt.studentName}`}
                    value={replyText[doubt.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [doubt.id]: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
                  />
                  <button 
                    onClick={() => handleReply(doubt.id)}
                    className="bg-[#0F52BA] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              ) : (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-800 text-sm space-y-1">
                  <span className="text-xs font-bold text-[#0F52BA]">Answer by {doubt.trainerName || 'Trainer'}:</span>
                  <p className="text-slate-700">{doubt.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

