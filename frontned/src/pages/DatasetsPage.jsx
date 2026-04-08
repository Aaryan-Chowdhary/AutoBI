import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import { useDatasets } from '../context/DatasetContext';
import UploadWizard from '../components/upload/UploadWizard';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

// Datasets now come from DatasetContext (no more hardcoded array here)

const PAGE_SIZE = 4;

function FileIcon({ type }) {
  const colors = {
    csv: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'description' },
    xlsx: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'table_chart' },
    json: { bg: 'bg-violet-100', text: 'text-violet-600', icon: 'data_object' },
  };
  const config = colors[type] || colors.csv;
  return (
    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
      <span className={`material-symbols-outlined text-xl ${config.text}`}>{config.icon}</span>
    </div>
  );
}

function StatusBadge({ status, uploadType, message }) {
  // Distinguish between raw→cleaned (AI) vs pre-cleaned (user uploaded clean)
  let config;
  if (status === 'cleaned' && uploadType === 'raw') {
    config = { dot: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50', label: 'AI CLEANED' };
  } else if (status === 'cleaned') {
    config = { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'CLEANED' };
  } else {
    config = { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'NEEDS CLEANING' };
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      {message && <span className="text-[10px] text-amber-600 font-medium">{message}</span>}
    </div>
  );
}

function ActionButton({ dataset, status }) {
  const navigate = useNavigate();

  const handleCreateDashboard = async () => {
    try {
      const dbDashboard = await api('/dashboards', {
        method: 'POST',
        body: JSON.stringify({
          name: `${dataset.name} Dashboard`,
          dataset_id: dataset.id,
          layout_json: [],
          visuals_json: []
        })
      });
      navigate(`/studio/${dbDashboard.id}`);
    } catch (error) {
      console.error('Failed to create dashboard', error);
      alert('Failed to start new dashboard. Please try again.');
    }
  };

  if (status === 'cleaned') {
    return (
      <button onClick={handleCreateDashboard} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95">
        <span className="material-symbols-outlined text-base">dashboard</span>
        Create Dashboard
      </button>
    );
  }
  if (status === 'needs_cleaning') {
    return (
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all hover:scale-105 active:scale-95">
        <span className="material-symbols-outlined text-base text-amber-500">cleaning_services</span>
        Clean Dataset
      </button>
    );
  }
  return null;
}

function DatasetsPage() {
  const { user, isAdmin } = useAuth();
  const { datasets } = useDatasets();
  const displayName = user?.name || 'Guest';
  const displayInitials = user?.initials || 'G';
  const displayRole = user?.role === 'admin' ? 'Admin' : 'Member';
  const avatarColor = user?.avatarColor || 'from-gray-400 to-gray-500';

  // Upload wizard modal state
  const [uploadOpen, setUploadOpen] = useState(false);

  // Removed: const datasets = isAdmin ? allDatasets : [];
  // Datasets now come from DatasetContext
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  let filtered = datasets.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="material-symbols-outlined text-sm text-gray-300 ml-1">unfold_more</span>;
    return (
      <span className="material-symbols-outlined text-sm text-primary ml-1">
        {sortDir === 'asc' ? 'expand_less' : 'expand_more'}
      </span>
    );
  };

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-[#111318] whitespace-nowrap">Datasets</h1>
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Upload New
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                <p className="text-[11px] text-gray-400">{displayRole}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-md`}>
                {displayInitials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-6 home-scrollbar">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#111318] mb-1">Dataset Management Inventory</h2>
            <p className="text-sm text-gray-500">Manage, monitor, and transform your data assets.</p>
          </div>

          <div className="flex items-center gap-3 mb-6">
            {['all', 'cleaned', 'needs_cleaning'].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {status === 'all' ? 'All Datasets' : status === 'needs_cleaning' ? 'Needs Cleaning' : 'Cleaned'}
              </button>
            ))}
            <div className="flex-1" />
            <span className="text-xs text-gray-400 font-medium">
              {filtered.length} dataset{filtered.length !== 1 ? 's' : ''} total
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr_1fr] gap-4 px-6 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <button onClick={() => handleSort('name')} className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors text-left">
                Dataset Name <SortIcon field="name" />
              </button>
              <button onClick={() => handleSort('status')} className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors text-left">
                Status <SortIcon field="status" />
              </button>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Records</span>
              <button onClick={() => handleSort('lastUpdated')} className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors text-left">
                Last Updated <SortIcon field="lastUpdated" />
              </button>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Download</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</span>
            </div>

            {paginated.length > 0 ? (
              paginated.map((dataset, index) => (
                <div
                  key={dataset.id}
                  className={`grid grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr_1fr] gap-4 px-6 py-4 items-center hover:bg-blue-50/30 transition-colors cursor-pointer group ${
                    index !== paginated.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon type={dataset.fileType} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111318] truncate group-hover:text-primary transition-colors">
                        {dataset.name}
                      </p>
                      {dataset.dimensions !== null && (
                        <p className="text-[11px] text-gray-400">
                          {dataset.dimensions} Dimensions, {dataset.measures} Measures
                        </p>
                      )}
                      {dataset.statusMessage && (
                        <p className="text-[11px] text-red-500 font-medium">{dataset.statusMessage}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={dataset.status} uploadType={dataset.uploadType} />
                  <span className="text-sm font-semibold text-gray-700">{dataset.records}</span>
                  <span className="text-sm text-gray-500">{dataset.lastUpdated}</span>
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Simulate download — creates a dummy file download
                        const blob = new Blob([`Dataset: ${dataset.name}\nStatus: ${dataset.status}`], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = dataset.name;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-primary/10 flex items-center justify-center text-gray-400 hover:text-primary transition-all hover:scale-110 active:scale-95"
                      title={`Download ${dataset.name}`}
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <ActionButton dataset={dataset} status={dataset.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-20 text-center">
                <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-5xl text-blue-200">cloud_upload</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No datasets yet</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                  Upload your first CSV, Excel, or JSON file to start building dashboards and generating insights.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  Upload Your First Dataset
                </button>
                <div className="flex items-center justify-center gap-6 mt-8">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-base text-emerald-400">description</span>
                    .csv
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-base text-blue-400">table_chart</span>
                    .xlsx
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-base text-violet-400">data_object</span>
                    .json
                  </div>
                </div>
              </div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-gray-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} datasets
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      page === currentPage
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Wizard Modal */}
      <UploadWizard
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        mode="raw"
      />
    </div>
  );
}

export default DatasetsPage;
