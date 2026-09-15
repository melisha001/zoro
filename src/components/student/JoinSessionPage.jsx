import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Clock, User, Video, 
  Mic, MicOff, Camera, CameraOff, CheckCircle, ExternalLink 
} from 'lucide-react';
import { STUDENT_DATA } from '../../data/mockData';

export default function JoinSessionPage({ setActiveScreen }) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  const session = STUDENT_DATA.nextSession;

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Breadcrumb Navigation - Screen 7 Top */}
      <button 
        onClick={() => setActiveScreen('student-dash')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Schedule</span>
      </button>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight">Join Your Session</h1>

      {/* Main Grid: Left Session Info + Right Google Meet Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Session Details Card (Wireframe 7 Left Panel) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Live Class</span>
            <h2 className="text-xl font-black text-slate-900 mt-2">{session.course}</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Topic: {session.topic}</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-slate-400 font-semibold">Date</div>
                <div className="font-extrabold text-slate-800 text-sm">{session.date}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-slate-400 font-semibold">Time</div>
                <div className="font-extrabold text-slate-800 text-sm">{session.time}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-slate-400 font-semibold">Trainer</div>
                <div className="font-extrabold text-slate-800 text-sm">{session.trainer}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <Video className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-slate-400 font-semibold">Platform</div>
                <div className="font-extrabold text-slate-800 text-sm">{session.platform}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Google Meet Integration Card (Wireframe 7 Right Panel) */}
        <div className="lg:col-span-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md text-center space-y-6">
          
          {isJoined ? (
            <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 mx-auto shadow-lg animate-bounce">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black">Connected to Google Meet</h3>
                <p className="text-xs text-slate-300 mt-1">Live class in progress with Trainer Priya.</p>
              </div>
              <button
                onClick={() => setIsJoined(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs"
              >
                Leave Class
              </button>
            </div>
          ) : (
            <>
              {/* Google Meet Visual Badge */}
              <div className="w-24 h-24 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                <div className="w-14 h-14 bg-gradient-to-tr from-green-500 via-blue-500 to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <Video className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-black text-slate-900">You're all set!</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Click the button below to join the session. Your attendance will be recorded automatically.
                </p>
              </div>

              {/* Camera & Mic Controls */}
              <div className="flex items-center justify-center space-x-4 py-2">
                <button 
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3 rounded-full border transition-all ${
                    micOn ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`p-3 rounded-full border transition-all ${
                    cameraOn ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {cameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Big Join Session Button */}
              <div>
                <button
                  onClick={() => setIsJoined(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-base px-10 py-4 rounded-xl shadow-xl transition-transform transform hover:scale-105 inline-flex items-center space-x-2"
                >
                  <span>Join Session</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-slate-400 font-semibold mt-3">
                  Make sure your camera and microphone are working.
                </p>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
