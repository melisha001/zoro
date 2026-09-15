import React, { useState } from 'react';
import { Calendar, DollarSign, Clock, Monitor, Trophy, Play, CheckCircle2, Award } from 'lucide-react';
import { COMPETITION } from '../../data/mockData';

export default function CompetitionPage({ onOpenEnquire }) {
  const [activeTab, setActiveTab] = useState('about');

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title Banner - Screen 3 Top */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
            National Championship 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {COMPETITION.title}
          </h1>
          <p className="text-lg font-bold text-emerald-600">
            {COMPETITION.tagline}
          </p>
        </div>

        {/* Media & Key Detail Card Grid - Screen 3 Middle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Visual Banner (Left 8 cols) */}
          <div className="lg:col-span-8">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group bg-slate-950">
              <img
                src={COMPETITION.bannerUrl}
                alt={COMPETITION.title}
                className="w-full h-80 sm:h-96 object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-8">
                <div className="self-end bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full font-black text-xs uppercase shadow">
                  Live Online Event
                </div>
                <div className="space-y-2">
                  <img 
                    src="/assets/logo.png" 
                    alt="ZORO Logo" 
                    className="h-12 w-auto object-contain bg-white p-1 rounded-xl shadow-md" 
                  />
                  <h3 className="text-2xl font-black text-white">ZORO COMPETITION 2026</h3>
                  <p className="text-slate-300 text-xs max-w-md">Watch past competition highlights and see how champions solve 50 problems in 3 minutes!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Detail Info Card (Right 4 cols) - Screen 3 Card */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Event Details</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Competition Date</div>
                  <div className="text-sm font-extrabold text-slate-800">{COMPETITION.date}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Registration Fee</div>
                  <div className="text-sm font-extrabold text-slate-800">{COMPETITION.fee}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Last Date to Register</div>
                  <div className="text-sm font-extrabold text-slate-800">{COMPETITION.lastDateToRegister}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Mode</div>
                  <div className="text-sm font-extrabold text-slate-800">{COMPETITION.mode}</div>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenEnquire}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5 text-center text-sm"
            >
              Register Now
            </button>
          </div>

        </div>

        {/* Competition Tabs & Information Panel - Screen 3 Bottom */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
          
          {/* Nav Tabs */}
          <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold overflow-x-auto">
            {['about', 'instructions', 'training video', 'prizes', 'faqs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 transition-all capitalize border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-emerald-600 text-emerald-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Views */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">About the Championship</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{COMPETITION.about}</p>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Rules & Guidelines</h3>
              <ul className="space-y-3">
                {COMPETITION.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start space-x-3 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Awards & Rewards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COMPETITION.prizes.map((p, idx) => (
                  <div key={idx} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black shadow">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-800">{p.rank}</div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">{p.reward}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'training video' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Sample Speed Test Video</h3>
              <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 p-8 text-center text-white space-y-4">
                <Play className="w-12 h-12 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-slate-300">Training Session: Solving 3-digit mental addition under 10 seconds.</p>
              </div>
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Competition FAQs</h3>
              <p className="text-xs text-slate-600">For registration assistance, call our helpline or click Register Now above.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
