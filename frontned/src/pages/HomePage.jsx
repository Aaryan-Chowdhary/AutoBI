import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';

// Mock dashboard cards for UI demonstration
const recentDashboards = [
  { id: 'demo-1', name: 'Q4 Sales Performance', editedAt: 'Edited 2 hours ago', pinned: true, thumbnail: 'bar' },
  { id: 'demo-2', name: 'Customer Churn Analysis', editedAt: 'Edited yesterday', pinned: false, thumbnail: 'pie' },
  { id: 'demo-3', name: 'Marketing ROI Dashboard', editedAt: 'Edited 3 days ago', pinned: true, thumbnail: 'line' },
  { id: 'demo-4', name: 'Supply Chain Tracker', editedAt: 'Edited 1 week ago', pinned: false, thumbnail: 'multi' },
];

function BarChartThumb() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect x="20" y="60" width="30" height="50" rx="4" fill="#93c5fd" />
      <rect x="60" y="30" width="30" height="80" rx="4" fill="#60a5fa" />
      <rect x="100" y="45" width="30" height="65" rx="4" fill="#3b82f6" />
      <rect x="140" y="20" width="30" height="90" rx="4" fill="#2563eb" />
    </svg>
  );
}

function PieChartThumb() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <circle cx="100" cy="60" r="45" fill="none" stroke="#93c5fd" strokeWidth="20" strokeDasharray="70 213" />
      <circle cx="100" cy="60" r="45" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="90 193" strokeDashoffset="-70" />
      <circle cx="100" cy="60" r="45" fill="none" stroke="#1d4ed8" strokeWidth="20" strokeDasharray="123 160" strokeDashoffset="-160" />
    </svg>
  );
}

function LineChartThumb() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <polyline points="20,90 50,70 80,80 120,40 160,55 190,25" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="20,95 50,85 80,90 120,65 160,75 190,50" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
    </svg>
  );
}

function MultiChartThumb() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect x="15" y="70" width="18" height="40" rx="3" fill="#93c5fd" />
      <rect x="38" y="50" width="18" height="60" rx="3" fill="#60a5fa" />
      <rect x="61" y="60" width="18" height="50" rx="3" fill="#3b82f6" />
      <line x1="100" y1="90" x2="130" y2="60" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <line x1="130" y1="60" x2="160" y2="70" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="70" x2="185" y2="40" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const thumbnailMap = {
  bar: BarChartThumb,
  pie: PieChartThumb,
  line: LineChartThumb,
  multi: MultiChartThumb,
};

function HomePage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pinnedDashboards, setPinnedDashboards] = useState(
    recentDashboards.filter((d) => d.pinned).map((d) => d.id)
  );
  const [openMenuId, setOpenMenuId] = useState(null);

  const dashboards = isAdmin ? recentDashboards : [];

  const togglePin = (id) => {
    setPinnedDashboards((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleOpenStudio = (dashboardId) => {
    navigate(`/studio/${dashboardId}`);
  };

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle="Workspace Home" />

        <main className="flex-1 overflow-y-auto px-8 py-6 home-scrollbar">

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Dashboards', value: isAdmin ? '12' : '0', icon: 'dashboard', color: 'from-blue-500 to-blue-600' },
              { label: 'Active Reports', value: isAdmin ? '4' : '0', icon: 'bar_chart', color: 'from-emerald-500 to-emerald-600' },
              { label: 'Plan', value: isAdmin ? 'Pro Plan' : 'Basic Plan', icon: 'workspace_premium', color: 'from-violet-500 to-violet-600' },
              { label: 'Last Updated', value: isAdmin ? '2h ago' : 'Never', icon: 'schedule', color: 'from-amber-500 to-orange-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
              >
                <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-gray-200/50 group-hover:scale-105 transition-transform`}>
                  <span className="material-symbols-outlined text-white text-xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-[#111318] leading-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Create New */}
          <h2 className="text-xl font-bold text-[#111318] mb-5">Create New</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <div
              onClick={() => handleOpenStudio('new')}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-blue-100 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 delay-100" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50 mb-5">
                  <span className="material-symbols-outlined text-white text-2xl">add_to_drive</span>
                </div>
                <h3 className="text-base font-bold text-[#111318] mb-2">Create with Raw Data</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  Open the Studio and start from scratch. Drag and drop charts, KPIs, and tables onto a blank canvas.
                </p>
                <span className="text-primary text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Studio
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </span>
              </div>
            </div>

            <div className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-violet-300/50 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden opacity-60">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200/50 mb-5">
                  <span className="material-symbols-outlined text-white text-2xl">cloud_upload</span>
                </div>
                <h3 className="text-base font-bold text-[#111318] mb-2">Create with Clean Data</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  Upload a CSV or Excel file and auto-generate a dashboard from your data.
                </p>
                <span className="text-violet-500 text-sm font-semibold inline-flex items-center gap-1">
                  Coming Soon
                  <span className="material-symbols-outlined text-lg">lock</span>
                </span>
              </div>
            </div>
          </div>

          {/* Dashboards Section */}
          {dashboards.length > 0 ? (
            <>
              {pinnedDashboards.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-amber-500 text-xl">star</span>
                    <h2 className="text-xl font-bold text-[#111318]">Pinned Dashboards</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {dashboards
                      .filter((d) => pinnedDashboards.includes(d.id))
                      .map((dashboard) => {
                        const ThumbComponent = thumbnailMap[dashboard.thumbnail];
                        return (
                          <DashboardCard
                            key={`pinned-${dashboard.id}`}
                            dashboard={dashboard}
                            isPinned={true}
                            onTogglePin={togglePin}
                            onOpen={handleOpenStudio}
                            ThumbComponent={ThumbComponent}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                          />
                        );
                      })}
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-[#111318]">Recent Dashboards</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {dashboards.map((dashboard) => {
                  const ThumbComponent = thumbnailMap[dashboard.thumbnail];
                  return (
                    <DashboardCard
                      key={dashboard.id}
                      dashboard={dashboard}
                      isPinned={pinnedDashboards.includes(dashboard.id)}
                      onTogglePin={togglePin}
                      onOpen={handleOpenStudio}
                      ThumbComponent={ThumbComponent}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-5xl text-blue-200">dashboard_customize</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No dashboards yet</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Create your first dashboard by opening the Studio and dragging visualizations onto the canvas.
              </p>
              <button
                onClick={() => handleOpenStudio('new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">brush</span>
                Open Studio
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardCard({ dashboard, isPinned, onTogglePin, onOpen, ThumbComponent, openMenuId, setOpenMenuId }) {
  const isMenuOpen = openMenuId === dashboard.id;

  return (
    <div
      onClick={() => onOpen(dashboard.id)}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
    >
      <div className="h-32 bg-linear-to-br from-blue-50 to-slate-50 flex items-center justify-center p-4 relative">
        <ThumbComponent />
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(dashboard.id); }}
          className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
            isPinned
              ? 'bg-amber-100 text-amber-500'
              : 'bg-white/80 text-gray-300 opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isPinned ? '"FILL" 1' : '"FILL" 0' }}>
            star
          </span>
        </button>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#111318] truncate">{dashboard.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{dashboard.editedAt}</p>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(isMenuOpen ? null : dashboard.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              <button onClick={(e) => { e.stopPropagation(); onOpen(dashboard.id); }} className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                <span className="material-symbols-outlined text-base text-gray-400">open_in_new</span>
                Open in Studio
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                <span className="material-symbols-outlined text-base text-gray-400">edit</span>
                Rename
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors">
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
