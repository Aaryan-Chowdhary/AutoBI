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
      <button onClick={handleCreateDashboard} className="px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors">
        Create Dashboard
      </button>
    );
  }
  return (
    <button className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-bold rounded-lg transition-colors cursor-not-allowed">
      Needs Clean
    </button>
  );
}

function DatasetsPage() {
  const { user, isAdmin } = useAuth();
  const { datasets } = useDatasets();
  const displayName = user?.name || 'Alex Rivera';
  const displayRole = user?.role === 'admin' ? 'Lead Analyst' : 'Lead Analyst';
  const displayInitials = user?.initials || 'AR';
  const avatarColor = user?.avatarColor || 'from-slate-700 to-slate-900';

  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  let filtered = datasets.filter((d) => {
    return d.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Dynamic Metrics Calculation
  const totalDatasets = datasets.length;
  // Count of cleaned datasets
  const cleanedDatasetsCount = datasets.filter(d => d.status === 'cleaned').length;
  const rawDatasetsCount = datasets.filter(d => d.status === 'needs_cleaning').length;
  
  const formattedCleanedCount = cleanedDatasetsCount.toString();


  // Current session timestamp formatted
  const currentSessionTimestamp = new Date().toLocaleString('en-IN', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });

  const aiInsights = '0'; 
  const lastUpdatedStat = currentSessionTimestamp;

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopBar 
          pageTitle="Dataset Manager" 
          onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }} 
        />

        <main className="flex-1 overflow-y-auto px-10 py-8 home-scrollbar">
          {/* Header Area */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[26px] font-bold text-[#111318] mb-1">Inventory</h2>
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Workspace</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-600">Dataset Inventory</span>
              </div>
            </div>
            <div className="flex items-center gap-4">

              <button 
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                Upload Now
              </button>
            </div>
          </div>

          {/* Cards Area */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4 h-[110px] border border-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                </div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Datasets</p>
              </div>
              <h3 className="text-[28px] font-bold text-[#111318] leading-none pl-1">{totalDatasets}</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4 h-[110px] border border-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
                </div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cleaned Datasets</p>
              </div>
              <h3 className="text-[28px] font-bold text-[#111318] leading-none pl-1">{formattedCleanedCount}</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4 h-[110px] border border-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">AI Insights</p>
              </div>
              <h3 className="text-[28px] font-bold text-[#111318] leading-none pl-1">{aiInsights}</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center gap-4 h-[110px] border border-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50/80 text-gray-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">update</span>
                </div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
              </div>
              <h3 className="text-[18px] font-bold text-[#111318] leading-none pl-1 pb-1">{lastUpdatedStat}</h3>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            {/* Table Header Row */}
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center text-[#111318]">
              <h3 className="text-[14px] font-bold">All Datasets</h3>

            </div>

            {/* Table Columns Title */}
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-gray-50 bg-white">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Dataset Name</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">File Type</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Date Uploaded</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Data Type</span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</span>
            </div>

            {/* Table Rows */}
            <div className="flex-1 flex flex-col">
              {paginated.length > 0 ? (
                paginated.map((dataset, index) => {
                  const isCsv = dataset.fileType === 'csv';
                  const isCleaned = dataset.status === 'cleaned';
                  
                  return (
                    <div key={dataset.id} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                      {/* Name section */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-50/50 border border-blue-100 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-blue-500 text-[20px]">{isCsv ? 'data_table' : 'table_view'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#111318] truncate">{dataset.name}</p>
                          <p className="text-[11px] text-gray-400 font-medium tracking-tight mt-0.5">
                            {(dataset.size || '12.4 MB')} • {dataset.records || '—'} records
                          </p>
                        </div>
                      </div>

                      {/* File Type */}
                      <div className="flex justify-center">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${isCsv ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' : 'bg-blue-50/50 text-blue-600 border-blue-100'}`}>
                          <span className="material-symbols-outlined text-[13px]">description</span>
                          <span className="text-[11px] font-medium uppercase tracking-wider">{dataset.fileType || 'CSV'}</span>
                        </div>
                      </div>

                      {/* Date Uploaded */}
                      <div className="flex justify-center">
                        <span className="text-[12px] font-medium text-gray-500">{dataset.lastUpdated || 'Oct 24, 2023'}</span>
                      </div>

                      {/* Data Type (Status) */}
                      <div className="flex justify-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-widest ${isCleaned ? 'bg-indigo-50/80 text-indigo-500 border border-indigo-100/50' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                            {isCleaned ? 'Cleaned' : 'Raw'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3 text-primary">
                        <button className="hover:opacity-70 transition-opacity"><span className="material-symbols-outlined text-[20px] mt-1">visibility</span></button>
                        <ActionButton dataset={dataset} status={dataset.status} />
                        <button className="hover:opacity-70 transition-opacity"><span className="material-symbols-outlined text-[20px] mt-1 text-gray-400">edit_square</span></button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl text-gray-300">dataset</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">No datasets found</h3>
                  <p className="text-xs text-gray-400 mb-4">Upload your first dataset to start analysis</p>
                  <button 
                    onClick={() => setUploadOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Upload Dataset
                  </button>
                </div>
              )}
            </div>

            {/* Pagination Banner */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50 pt-6">
              <span className="text-[11px] font-medium text-gray-400">Showing {paginated.length} of {filtered.length} datasets</span>
              <div className="flex items-center gap-1">
                 <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 disabled:opacity-30" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                 </button>
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded ${page === currentPage ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {page}
                    </button>
                  ))}
                 <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 disabled:opacity-30" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                 </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <UploadWizard isOpen={uploadOpen} onClose={() => setUploadOpen(false)} mode="raw" />
    </div>
  );
}

export default DatasetsPage;
