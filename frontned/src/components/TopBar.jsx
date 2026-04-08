import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function TopBar({ pageTitle = 'Workspace Home' }) {
  const { user } = useAuth();
  const displayName = user?.name || 'Guest';
  const displayInitials = user?.initials || 'G';
  const displayRole = user?.role === 'admin' ? 'Admin' : 'Member';
  const avatarColor = user?.avatarColor || 'from-gray-400 to-gray-500';
  const [searchQuery, setSearchQuery] = useState('');

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, text: 'Dashboard "Q4 Sales" was shared with you', time: '2 min ago', unread: true },
    { id: 2, text: 'Data cleaning completed for "marketing_data.csv"', time: '1 hour ago', unread: true },
    { id: 3, text: 'Your plan renews in 5 days', time: '1 day ago', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
      {/* Left — Page Title */}
      <h1 className="text-lg font-bold text-[#111318] whitespace-nowrap">{pageTitle}</h1>

      {/* Center — Search */}
      <div className="flex-1 max-w-lg mx-8">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search dashboards, datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right — Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500 text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {n.unread && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                    <div className={n.unread ? '' : 'ml-4'}>
                      <p className="text-sm text-gray-700 leading-snug">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2 border-t border-gray-100">
                <button className="text-xs text-primary font-semibold hover:underline">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
              <p className="text-[11px] text-gray-400">{displayRole}</p>
            </div>
            <div className={`w-10 h-10 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-md`}>
              {displayInitials}
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-800">{displayName}</p>
                <p className="text-xs text-gray-400">{user?.email || ''}</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                  My Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-lg text-gray-400">settings</span>
                  Account Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-lg text-gray-400">help</span>
                  Help & Support
                </button>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
