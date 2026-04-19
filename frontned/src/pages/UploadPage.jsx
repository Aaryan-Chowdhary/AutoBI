import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { api } from '../lib/api';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // 'idle', 'processing', 'done', 'error'
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [makingDashboard, setMakingDashboard] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Only accept csv or excel
    if (
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xls') || 
      selectedFile.name.endsWith('.xlsx')
    ) {
      setFile(selectedFile);
      setErrorMsg('');
    } else {
      setErrorMsg('Please upload a valid CSV or Excel file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadState('processing');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        setUploadState('done');
      } else {
        setErrorMsg(data.message || 'Error cleaning data.');
        setUploadState('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to the server.');
      setUploadState('error');
    }
  };

  return (
    <div className="h-screen flex bg-[#f8f9fb] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar pageTitle="Upload Data" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl w-full m-auto">
            
            {uploadState === 'idle' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500">
                    <span className="material-symbols-outlined text-3xl">upload_file</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Raw Data</h2>
                  <p className="text-gray-500 text-sm">Automagically clean and prepare your CSV or Excel files.</p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                    ${isDragging ? 'border-primary bg-blue-50/50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".csv, .xls, .xlsx"
                  />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-5xl text-emerald-500 mb-2">check_circle</span>
                      <p className="font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-4xl text-gray-400 mb-3">cloud_upload</span>
                      <p className="font-medium text-gray-700">Drag and drop your file here</p>
                      <p className="text-xs text-gray-500 mt-1">or click to browse from your computer</p>
                    </div>
                  )}
                </div>

                {errorMsg && <p className="text-red-500 text-sm mt-4 text-center">{errorMsg}</p>}

                <div className="mt-8 flex justify-end gap-3">
                  <button 
                    onClick={() => navigate('/home')}
                    className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={!file}
                    className={`px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all
                      ${file ? 'bg-primary text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-primary/30' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    Start Processing
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </>
            )}

            {uploadState === 'processing' && (
              <div className="text-center py-12">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  {/* Inner icon */}
                  <div className="absolute inset-0 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl animate-pulse">auto_awesome</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 block">Analyzing Data...</h2>
                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                  <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">check_circle</span> Reading file properties
                  </p>
                  <p className="text-sm font-medium text-gray-600 flex items-center gap-2 animate-pulse">
                    <span className="material-symbols-outlined text-base text-primary">hourglass_bottom</span> Normalizing missing values
                  </p>
                  <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">pending</span> Removing duplicates
                  </p>
                </div>
              </div>
            )}

            {uploadState === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <span className="material-symbols-outlined text-3xl">error</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h2>
                <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
                <button 
                  onClick={() => setUploadState('idle')}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {uploadState === 'done' && (
               <div className="text-center py-2 sm:py-4">
                <div className="w-16 h-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200">
                  <span className="material-symbols-outlined text-3xl text-white">task_alt</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Data Cleaned Successfully!</h2>
                
                {/* Modern Stats View */}
                {result?.stats && (
                  <div className="mt-4 mb-6 text-left bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                    <h3 className="text-base font-bold text-[#111318] mb-3 flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-500 text-lg">analytics</span>
                       </div>
                       Data Quality Report
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                       <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm tracking-tight">
                          <p className="text-[11px] text-gray-500 font-medium mb-0.5 line-clamp-1">Total Rows</p>
                          <p className="text-lg font-bold text-[#111318] leading-none">{result.stats.original_rows}</p>
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm tracking-tight">
                          <p className="text-[11px] text-gray-500 font-medium mb-0.5 line-clamp-1">Duplicates Dropped</p>
                          <p className="text-lg font-bold text-emerald-500 leading-none">{result.stats.duplicates_removed}</p>
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm tracking-tight">
                          <p className="text-[11px] text-gray-500 font-medium mb-0.5 line-clamp-1">Missing Values Fixed</p>
                          <p className="text-lg font-bold text-blue-500 leading-none">
                             {Object.values(result.stats.nulls_before).reduce((a, b) => a + b, 0)}
                          </p>
                       </div>
                       <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm tracking-tight">
                          <p className="text-[11px] text-gray-500 font-medium mb-0.5 line-clamp-1">Final Usable Rows</p>
                          <p className="text-lg font-bold text-[#111318] leading-none">{result.stats.final_rows}</p>
                       </div>
                    </div>

                    {Object.values(result.stats.nulls_before).some(val => val > 0) && (
                      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                        <p className="text-xs font-semibold text-[#111318] mb-2 block">Null Fixes by Column (Imputed)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(result.stats.nulls_before).map(([col, count]) => (
                            count > 0 && (
                              <span key={col} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded-lg border border-amber-200">
                                {col}
                                <span className="bg-white rounded-md px-1.5 py-px text-[10px] border border-amber-100">{count}</span>
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a 
                    href={`http://localhost:5000${result?.downloadUrl}`}
                    download
                    className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all group"
                  >
                    <span className="material-symbols-outlined text-2xl text-gray-400 group-hover:text-primary mb-1.5 transition-colors">download</span>
                    <span className="text-sm font-bold text-gray-800">Download Dataset</span>
                    <span className="text-[11px] text-gray-400">Get the clean CSV file</span>
                  </a>
                  
                  <button 
                    onClick={async () => {
                      setMakingDashboard(true);
                      try {
                        // Get the cleaned file name from the download URL
                        const cleanedFileName = result?.downloadUrl?.split('/').pop() || file?.name;
                        
                        // Step 1: Call AI to auto-generate dashboard charts
                        const aiRes = await api('/ai/auto-dashboard', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ datasetName: cleanedFileName })
                        });

                        if (!aiRes.success) throw new Error('AI dashboard generation failed');

                        // Step 2: Create a new dashboard in the DB
                        const dashRes = await api('/dashboards', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: aiRes.dashboardName || `${cleanedFileName} Dashboard`,
                            dataset_id: null,
                            layout_json: [],
                            visuals_json: aiRes.canvasElements
                          })
                        });

                        // Step 3: Navigate to the new dashboard
                        navigate(`/studio/${dashRes.id}`);
                      } catch (err) {
                        console.error('Make Dashboard error:', err);
                        alert('Failed to create dashboard: ' + (err.message || 'Unknown error'));
                        // Fallback: navigate to empty studio
                        navigate('/studio/new');
                      } finally {
                        setMakingDashboard(false);
                      }
                    }}
                    disabled={makingDashboard}
                    className={`flex flex-col items-center p-4 bg-linear-to-br from-primary to-blue-600 border border-transparent rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all group ${makingDashboard ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <span className={`material-symbols-outlined text-2xl text-blue-200 group-hover:text-white mb-1.5 transition-colors ${makingDashboard ? 'animate-spin' : ''}`}>
                      {makingDashboard ? 'hourglass_empty' : 'dashboard_customize'}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {makingDashboard ? 'Creating Dashboard...' : 'Make Dashboard'}
                    </span>
                    <span className="text-[11px] text-blue-100">
                      {makingDashboard ? 'AI is analyzing your data' : 'AI-powered auto dashboard'}
                    </span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}

export default UploadPage;
