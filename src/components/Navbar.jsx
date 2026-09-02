import React from 'react';
import { Mail, LogOut, AlertCircle } from 'lucide-react';

export const Navbar = ({
  activeTab,
  setActiveTab,
  user,
  scheduledCount,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200/90 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-8">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-950 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Mail className="w-5 h-5 stroke-[1.6]" />
            </div>
            <div className="leading-tight">
              <span className="font-medium text-sm text-neutral-900 tracking-tight block">
                Email Job
              </span>
              <span className="font-medium text-sm text-neutral-900 tracking-tight block">
                Scheduler
              </span>
            </div>
          </div>

          {/* Center-Left: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              Dashboard
            </button>

            <button
              id="nav-tab-compose"
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              Compose
            </button>

            <button
              id="nav-tab-scheduled"
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'scheduled'
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              <span>Scheduled</span>
              {scheduledCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-normal bg-neutral-200/80 text-neutral-800">
                  {scheduledCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-sent"
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              Sent
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-sm font-normal transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-neutral-100 text-neutral-950 font-medium'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Right Side: Gmail Connection Pill + User Profile */}
        <div className="flex items-center gap-4">
          {user?.gmailConnected !== false ? (
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-normal hover:bg-emerald-100/80 transition-colors cursor-pointer"
              title="Gmail is connected"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Gmail connected</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-normal hover:bg-amber-100 transition-colors cursor-pointer"
              title="Gmail not connected"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Connect Gmail</span>
            </button>
          )}

          {/* User profile & Logout */}
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-neutral-300 shadow-2xs"
            />
            <span className="hidden sm:inline text-sm font-normal text-neutral-800 max-w-[110px] truncate">
              {user?.name || 'Ahmad'}
            </span>
            <button
              id="button-logout"
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 stroke-[1.6]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab row */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-neutral-100 bg-neutral-50/70 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-xs rounded-lg font-normal transition-all ${
            activeTab === 'dashboard' ? 'bg-white shadow-2xs text-neutral-900 font-medium' : 'text-neutral-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-3 py-1.5 text-xs rounded-lg font-normal transition-all ${
            activeTab === 'compose' ? 'bg-white shadow-2xs text-neutral-900 font-medium' : 'text-neutral-600'
          }`}
        >
          Compose
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-3 py-1.5 text-xs rounded-lg font-normal transition-all flex items-center gap-1 ${
            activeTab === 'scheduled' ? 'bg-white shadow-2xs text-neutral-900 font-medium' : 'text-neutral-600'
          }`}
        >
          <span>Scheduled</span>
          {scheduledCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-800 text-[10px] flex items-center justify-center font-normal">
              {scheduledCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-3 py-1.5 text-xs rounded-lg font-normal transition-all ${
            activeTab === 'sent' ? 'bg-white shadow-2xs text-neutral-900 font-medium' : 'text-neutral-600'
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs rounded-lg font-normal transition-all ${
            activeTab === 'settings' ? 'bg-white shadow-2xs text-neutral-900 font-medium' : 'text-neutral-600'
          }`}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
