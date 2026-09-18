import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, User, Search } from 'lucide-react';

export default function AdminDoubtsPage() {
  const [activeTab, setActiveTab] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState({});

  const [doubts, setDoubts] = useState([
    {
      id: 1,
      student: 'S.J. Abhishek',
      batch: 'EN-L2',
      trainer: 'Ms. Priya',
      topic: 'Grammar',
      time: 'Today, 4:20 PM',
      question: 'Can you explain the difference between "is" and "are" with examples?',
      status: 'Open',
      type: 'open'
    },
    {
      id: 2,
      student: 'Nivetha R',
      batch: 'EN-L1',
      trainer: 'Mr. Rajesh',
      topic: 'Vocabulary',
      time: 'Today, 3:15 PM',
      question: 'What does "nevertheless" mean? Can you give a sentence?',
      status: 'Open',
      type: 'open'
    },
    {
      id: 3,
      student: 'Tharun K',
      batch: 'EN-L1',
      trainer: 'Mr. Rajesh',
      topic: 'Pronunciation',
      time: 'Yesterday, 6:10 PM',
      question: 'How do I pronounce the word "Schedule" in British vs American English?',
      answer: 'In British English it is usually pronounced "shed-yool" /ʃɛdjuːl/, whereas in American English it is "sked-jool" /skɛdʒuːl/. Both are correct depending on context!',
      answeredBy: 'Ms. Priya (Trainer)',
      status: 'Answered',
      type: 'answered'
    }
  ]);

  const handleReply = (id) => {
    if (!replyText[id]) return;
    setDoubts(doubts.map(item => {
      if (item.id === id) {
        return {
          ...item,
          answer: replyText[id],
          answeredBy: 'Admin',
          status: 'Answered',
          type: 'answered'
        };
      }
      return item;
    }));
  };

  const filteredDoubts = doubts.filter(d => {
    const matchesTab = d.type === activeTab;
    const matchesSearch = d.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.question.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Student Doubts Oversight</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Monitor and manage student queries across all trainers and courses.</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div className="flex border-b border-slate-200 gap-6 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'open'
                ? 'border-[#0F52BA] text-[#0F52BA]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Open Doubts ({doubts.filter(d => d.type === 'open').length})
          </button>
          <button
            onClick={() => setActiveTab('answered')}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'answered'
                ? 'border-[#0F52BA] text-[#0F52BA]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Answered Doubts ({doubts.filter(d => d.type === 'answered').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or doubt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Doubts Cards */}
      <div className="space-y-4">
        {filteredDoubts.map(doubt => (
          <div key={doubt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {doubt.student.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{doubt.student}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Batch: <span className="font-bold text-[#0F52BA]">{doubt.batch}</span> • Assigned Trainer: <span className="font-semibold text-slate-700">{doubt.trainer}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">{doubt.time}</span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  doubt.status === 'Open'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {doubt.status}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-slate-800 font-medium text-xs leading-relaxed border border-slate-100">
              {doubt.question}
            </div>

            {doubt.status === 'Open' ? (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Admin response / intervention..."
                  value={replyText[doubt.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [doubt.id]: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
                />
                <button
                  onClick={() => handleReply(doubt.id)}
                  className="bg-[#0F52BA] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply as Admin</span>
                </button>
              </div>
            ) : (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-800 text-xs space-y-1">
                <span className="text-[11px] font-bold text-[#0F52BA]">Answered by {doubt.answeredBy}:</span>
                <p className="text-slate-700">{doubt.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
