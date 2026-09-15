import React from 'react';
import { PhoneCall } from 'lucide-react';

export default function PublicNavbar({ activeScreen, setActiveScreen, onOpenEnquire }) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-10 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => setActiveScreen('public-home')}
        >
          <img 
            src="/assets/logo.png" 
            alt="ZORO Logo" 
            className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" 
          />
          <div className="ml-3">
            <div className="text-2xl font-black tracking-tight text-blue-950 leading-none">
              ZORO
            </div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              Learn | Practice | Grow
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <button 
            onClick={() => setActiveScreen('public-home')}
            className={`hover:text-blue-700 transition-colors ${activeScreen === 'public-home' ? 'text-blue-700 font-bold' : ''}`}
          >
            Home
          </button>
          <a href="#about" className="hover:text-blue-700 transition-colors">
            About
          </a>
          <button 
            onClick={() => setActiveScreen('public-course')}
            className={`hover:text-blue-700 transition-colors ${activeScreen === 'public-course' ? 'text-blue-700 font-bold' : ''}`}
          >
            Courses
          </button>
          <button 
            onClick={() => setActiveScreen('public-competition')}
            className={`hover:text-blue-700 transition-colors ${activeScreen === 'public-competition' ? 'text-blue-700 font-bold' : ''}`}
          >
            Competitions
          </button>
          <a href="#contact" className="hover:text-blue-700 transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenEnquire}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Enquire Now</span>
          </button>
        </div>
      </div>
    </header>
  );
}
