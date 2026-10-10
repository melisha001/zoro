import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, Monitor, Trophy, Play, CheckCircle2, Award, ChevronRight, Tag } from 'lucide-react';
import { getCompetitions } from '../../api/competitionApi';
import { getWebsiteSettings } from '../../api/websiteSettingsApi';
import { resolveFileUrl } from '../../api/fileApi';
import CompetitionRegisterModal from './CompetitionRegisterModal';

export default function CompetitionPage({ currentUser }) {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompId, setSelectedCompId] = useState('');
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [registeringComp, setRegisteringComp] = useState(null);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    async function loadComps() {
      setLoading(true);
      try {
        const settingsRes = await getWebsiteSettings();
        if (settingsRes.success && settingsRes.data?.portalControls?.publicWebsite) {
          setAllowRegistration(settingsRes.data.portalControls.publicWebsite.enablePublicCompetitionReg !== false);
        }

        const res = await getCompetitions();
        if (res.success && Array.isArray(res.data)) {
          // REQUIREMENT #2 & #6: Active Events section MUST show ONLY status === 'Active' (or 'Registration Open')
          const activeComps = res.data.filter(c => {
            const st = (c.status || '').toLowerCase();
            return st === 'active' || st === 'registration open';
          });
          setCompetitions(activeComps);
          if (activeComps.length > 0) {
            setSelectedCompId(activeComps[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load competitions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadComps();
  }, []);

  const activeComp = competitions.find(c => c.id === selectedCompId) || competitions[0];

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen py-20 text-center text-xs font-bold text-slate-400">
        Loading active competitions...
      </div>
    );
  }

  if (!activeComp) {
    return (
      <div className="bg-slate-50 min-h-screen py-20 text-center space-y-4">
        <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">No Active Events Right Now</h2>
        <p className="text-xs text-slate-500">Check back soon for upcoming national championships and speed calculation contests!</p>
      </div>
    );
  }

  const instructionsList = activeComp.instructions 
    ? activeComp.instructions.split('\n').filter(Boolean)
    : [
        'Webcam and microphone required during live evaluation.',
        'Speed round answers must be submitted within the allotted timeframe.',
        'Decisions of the official Zoro Academy judging panel are final.'
      ];

  const regFee = Number(activeComp.registrationFee ?? activeComp.fee ?? 0);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Selector Header if multiple active competitions exist */}
        {competitions.length > 1 && (
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 items-center">
            <span className="text-xs font-extrabold text-slate-500 px-3 uppercase tracking-wider">Active Events:</span>
            {competitions.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedCompId(comp.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  comp.id === activeComp.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {comp.name}
              </button>
            ))}
          </div>
        )}

        {/* Header Title Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
            {activeComp.status || 'Active Event'}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {activeComp.name}
          </h1>
          <p className="text-lg font-bold text-emerald-600">
            {activeComp.courseName ? `Official Competition for ${activeComp.courseName}` : 'National Championship 2026'}
          </p>
        </div>

        {/* Media & Key Detail Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Visual Banner */}
          <div className="lg:col-span-8">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 group bg-slate-950">
              <img
                src={resolveFileUrl(activeComp.banner || activeComp.bannerUrl) || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800'}
                alt={activeComp.name}
                className="w-full h-80 sm:h-96 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-8">
                <div className="self-end bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full font-black text-xs uppercase shadow">
                  {activeComp.venue || 'Live Online Event'}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white">{activeComp.name}</h3>
                  <p className="text-slate-300 text-xs max-w-md">{activeComp.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Detail Info Card */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">Event Details</h3>

            <div className="space-y-4">
              {/* Registration Dates */}
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Registration Period</div>
                  <div className="text-sm font-extrabold text-blue-900">
                    {activeComp.regStartDate || '01/10/2026'} – {activeComp.regEndDate || activeComp.deadline || '08/10/2026'}
                  </div>
                </div>
              </div>

              {/* Competition Event Dates */}
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Competition Start & End Date</div>
                  <div className="text-sm font-extrabold text-slate-800">
                    {activeComp.startDate || activeComp.date}
                    {activeComp.endDate && activeComp.endDate !== (activeComp.startDate || activeComp.date) ? ` – ${activeComp.endDate}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Timing</div>
                  <div className="text-sm font-extrabold text-slate-800">
                    {activeComp.startTime || '10:00 AM'} – {activeComp.endTime || '01:00 PM'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Registration Fee</div>
                  <div className="text-sm font-extrabold text-emerald-700">
                    {regFee > 0 ? `₹${regFee}` : 'FREE (₹0)'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Venue / Platform</div>
                  <div className="text-sm font-extrabold text-slate-800">{activeComp.venue || 'Online'}</div>
                </div>
              </div>
            </div>

            <button
              disabled={!allowRegistration}
              onClick={() => allowRegistration && setRegisteringComp(activeComp)}
              className={`w-full font-black py-4 rounded-xl shadow-lg transition-transform text-center text-sm ${
                allowRegistration
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:-translate-y-0.5'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {allowRegistration ? 'Register Now' : 'Registration Closed by Admin'}
            </button>
          </div>

        </div>

        {/* Tabs Panel */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold overflow-x-auto">
            {['about', 'instructions', 'contact & rules'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 transition-all capitalize border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? 'border-emerald-600 text-emerald-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">About the Championship</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{activeComp.description}</p>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Rules & Guidelines</h3>
              <ul className="space-y-3">
                {instructionsList.map((inst, i) => (
                  <li key={i} className="flex items-start space-x-3 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'contact & rules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900">Contact & Details</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div><strong>Helpline Contact:</strong> {activeComp.contactDetails || '+91 98765 43210 | competition@zoro.com'}</div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* REGISTRATION DIALOG / MODAL */}
      <CompetitionRegisterModal
        competition={registeringComp}
        isOpen={Boolean(registeringComp)}
        currentUser={currentUser}
        onClose={() => setRegisteringComp(null)}
      />
    </div>
  );
}

