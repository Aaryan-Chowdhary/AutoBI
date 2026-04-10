import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

const navItems = [
  { id: 'workspace', label: 'dashboard', icon: 'dashboard', path: '/home' },
  { id: 'datasets', label: 'datasets', icon: 'database', path: '/datasets' },
  { id: 'studio', label: 'studio', icon: 'brush', path: '/studio' },
];

const bottomItems = [
  { id: 'settings', label: 'settings', icon: 'settings', path: '/settings' },
  { id: 'signout', label: 'logout', icon: 'logout', action: 'signout' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef(null);

  const handleNavClick = (item) => {
    if (item.action === 'signout') {
      logout();
      navigate('/login');
      return;
    }
    navigate(item.path);
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      ref={sidebarRef}
      className={`
        h-screen bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out shrink-0
        ${isExpanded ? 'w-[260px]' : 'w-[80px]'}
        z-30 relative group/sidebar
      `}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`
          absolute top-8 -right-3 w-6 h-6 bg-white border border-gray-100 
          rounded-md shadow-sm flex items-center justify-center 
          z-40 hover:bg-gray-50 transition-all duration-300 group
          ${isExpanded ? 'rotate-0' : 'rotate-180'}
        `}
      >
        <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-primary transition-colors">
          chevron_left
        </span>
      </button>

      {/* Logo & Brand */}
      <div className={`flex items-center border-b border-gray-100 h-16 shrink-0 transition-all duration-300 ${isExpanded ? 'px-6' : 'justify-center'}`}>
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <svg className="size-4.5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
          </svg>
        </div>
        
        <div className={`min-w-0 flex-1 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[160px] ml-3' : 'opacity-0 max-w-0 ml-0'}`}>
          <span className="text-[#111318] text-[15px] font-bold tracking-tight block whitespace-nowrap">AutoBI Studio</span>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">PRO PLAN</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-6 space-y-1 outline-none px-3">
        {navItems.map((item) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center rounded-xl text-[13px] font-medium
                transition-all duration-200 group h-11
                ${isExpanded ? 'px-3 gap-3' : 'justify-center'}
                ${isActive(item.path)
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }
              `}
              title={!isExpanded ? t(item.label) : undefined}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[20px] ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                  {item.icon}
                </span>
              </div>
              <span className={`whitespace-nowrap font-semibold transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
                {t(item.label)}
              </span>
            </button>
            {isActive(item.path) && !isExpanded && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" />
            )}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="pb-6 space-y-1 px-3">
        <div className={`mx-3 mb-4 border-t border-gray-100 transition-all duration-300`} />
        {bottomItems.map((item) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => handleNavClick(item)}
              className={`
                w-full flex items-center rounded-xl text-[13px] font-medium
                text-gray-500 hover:bg-gray-50 hover:text-gray-700
                transition-all duration-200 group h-11
                ${isExpanded ? 'px-3 gap-3' : 'justify-center'}
                ${isActive(item.path)
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : ''
                }
              `}
              title={!isExpanded ? t(item.label) : undefined}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[20px] ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                  {item.icon}
                </span>
              </div>
              <span className={`whitespace-nowrap font-semibold transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
                {t(item.label)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;

