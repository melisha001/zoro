import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function TrainerDoubtsPage() {
  const [activeTab, setActiveTab] = useState('open');
  const [replyText, setReplyText] = useState({});

  const doubts = [
    {
      id: 1,
      student: 'S.J. Abhishek',
      batch: 'EN-L2',
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
      topic: 'Pronunciation',
      time: 'Yesterday, 6:10 PM',
      question: 'How do I pronounce the word "Schedule" in British vs American English?',
      answer: 'In British English it is usually pronounced "shed-yool" /ʃɛdjuːl/, whereas in American English it is "sked-jool" /skɛdʒuːl/. Both are correct depending on context!',
      status: 'Answered',
      type: 'answered'
    }
  ];

  const filteredDoubts = doubts.filter(d => d.type === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Doubts</h1>
        <p className="text-slate-500 text-sm mt-1">Answer student questions and provide guidance.</p>
      </div>

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
          Open (2)
        </button>
        <button
          onClick={() => setActiveTab('answered')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'answered'
              ? 'border-[#0F52BA] text-[#0F52BA]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Answered (10)
        </button>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {filteredDoubts.map(doubt => (
          <div key={doubt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F52BA] text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {doubt.student.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{doubt.student}</h3>
                  <p className="text-xs text-slate-500 font-medium">{doubt.batch} • {doubt.topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">{doubt.time}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  doubt.status === 'Open'
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

            {doubt.status === 'Open' ? (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  aria-label={`Reply to ${doubt.student}`}
                  value={replyText[doubt.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [doubt.id]: e.target.value })}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA]"
                />
                <button className="bg-[#0F52BA] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5 shadow-xs transition-colors">
                  <Send className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            ) : (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-800 text-sm space-y-1">
                <span className="text-xs font-bold text-[#0F52BA]">Your Answer:</span>
                <p className="text-slate-700">{doubt.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
