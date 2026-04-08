import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: 'dashboard', path: '/home' },
  { id: 'datasets', label: 'Datasets', icon: 'database', path: '/datasets' },
  { id: 'studio', label: 'Studio', icon: 'brush', path: '/studio' },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
  { id: 'signout', label: 'Sign Out', icon: 'logout', action: 'signout' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const collapseTimer = useRef(null);
  const sidebarRef = useRef(null);

  const isOpen = expanded || pinned;

  const handleNavClick = (item) => {
    if (item.action === 'signout') {
      logout();
      navigate('/login');
      return;
    }
    navigate(item.path);
    if (!pinned) {
      setExpanded(false);
    }
  };

  const handleMouseEnter = () => {
    if (pinned) return;
    clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setExpanded(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (pinned) return;
    clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setExpanded(false);
    }, 300);
  };

  useEffect(() => {
    return () => clearTimeout(collapseTimer.current);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        h-screen bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out shrink-0
        ${isOpen ? 'w-[240px]' : 'w-[72px]'}
        z-20 relative
      `}
    >
      {/* Logo & Brand */}
      <div className={`flex items-center border-b border-gray-100 h-16 shrink-0 ${isOpen ? 'px-5' : 'justify-center'}`}>
        <div
          className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          onClick={() => setPinned(!pinned)}
          title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
        >
          <svg className="size-5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
          </svg>
        </div>
        <div className={`min-w-0 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 max-w-[160px] ml-3' : 'opacity-0 max-w-0 ml-0'}`}>
          <span className="text-[#111318] text-base font-bold tracking-tight block whitespace-nowrap">AutoBI Studio</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Professional Plan</span>
            {pinned && (
              <span className="material-symbols-outlined text-xs text-primary" title="Sidebar pinned">push_pin</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation — takes up available space, pushes bottom items down */}
      <nav className="flex-1 pt-4 px-4 space-y-1.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`
              w-full flex items-center rounded-xl text-sm font-medium
              transition-all duration-200 group relative h-10
              ${isOpen ? 'px-3 gap-3' : 'justify-center'}
              ${isActive(item.path)
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }
            `}
            title={!isOpen ? item.label : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <span className={`material-symbols-outlined text-xl ${isActive(item.path) ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} transition-colors duration-200`}>
                {item.icon}
              </span>
            </div>
            <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
              {item.label}
            </span>
            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full transition-all duration-200" />
            )}
          </button>
        ))}
      </nav>

      {/* Separator */}
      <div className={`mx-4 border-t border-gray-100 transition-all duration-300`} />

      {/* Bottom Section */}
      <div className="px-4 py-3 space-y-1.5">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`
              w-full flex items-center rounded-xl text-sm font-medium
              text-gray-500 hover:bg-gray-50 hover:text-gray-700
              transition-all duration-200 group h-10
              ${isOpen ? 'px-3 gap-3' : 'justify-center'}
            `}
            title={!isOpen ? item.label : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl text-gray-400 group-hover:text-gray-600 transition-colors duration-200">
                {item.icon}
              </span>
            </div>
            <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;

