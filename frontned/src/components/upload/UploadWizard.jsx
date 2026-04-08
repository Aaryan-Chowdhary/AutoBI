/**
 * UploadWizard.jsx
 * -----------------
 * Orchestrator for the upload workflow.
 *
 * Manages the step state machine for two upload modes:
 *   - "raw":     select → uploading → cleaning → choice → generating → /studio
 *   - "cleaned": select → uploading → generating → /studio
 *
 * Key responsibilities:
 *   - Renders the correct step component based on current state
 *   - Passes callbacks between steps
 *   - Adds dataset to DatasetContext after upload/cleaning
 *   - Navigates to /studio when dashboard generation completes
 *
 * Props:
 *   - isOpen: boolean — controls modal visibility
 *   - onClose: () => void — closes the modal
 *   - mode: "raw" | "cleaned" — determines the step flow
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatasets } from '../../context/DatasetContext';
import FileSelectStep from './FileSelectStep';
import UploadingStep from './UploadingStep';
import CleaningStep from './CleaningStep';
import ChoiceStep from './ChoiceStep';
import DashboardGeneratingStep from './DashboardGeneratingStep';

// ─── Helper: Format file size for display ──────────────────
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Helper: Get file extension without dot ────────────────
function getFileExtension(fileName) {
  return fileName.split('.').pop().toLowerCase();
}

function UploadWizard({ isOpen, onClose, mode = 'raw' }) {
  const navigate = useNavigate();
  const { addDataset } = useDatasets();

  // ─── State ──────────────────────────────────────────────────
  const [step, setStep] = useState('select');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDatasetId, setUploadedDatasetId] = useState(null);
  const [cleaningStats, setCleaningStats] = useState(null);
  const datasetSavedRef = useRef(false); // Guard against React StrictMode double-fires

  // ─── Reset state when modal opens/closes ───────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedFile(null);
      setUploadedDatasetId(null);
      setCleaningStats(null);
      datasetSavedRef.current = false; // Reset guard on close
    }
  }, [isOpen]);

  // ─── Step transitions ─────────────────────────────────────

  /** Step 1 → 2: User selected a file */
  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setStep('uploading');
  };

  /** Step 2 → 3 (raw) or Step 2 → generating (cleaned) */
  const handleUploadComplete = useCallback((datasetId) => {
    // Save the datasetId returned by the backend upload endpoint
    if (datasetId) {
      setUploadedDatasetId(datasetId);
    }

    if (mode === 'raw') {
      // Raw data: proceed to cleaning
      setStep('cleaning');
    } else {
      // Cleaned data: save to datasets and go straight to dashboard generation
      if (selectedFile && !datasetSavedRef.current) {
        datasetSavedRef.current = true; // Prevent duplicate saves
        addDataset({
          name: selectedFile.name,
          fileType: getFileExtension(selectedFile.name),
          status: 'cleaned',
          uploadType: 'cleaned', // Distinguish: user uploaded pre-cleaned data
          records: '—',
          size: formatFileSize(selectedFile.size),
        });
      }
      setStep('generating');
    }
  }, [mode, selectedFile, addDataset]);

  /** Step 3 → 4: Cleaning finished (raw mode only) */
  const handleCleaningComplete = useCallback((stats) => {
    setCleaningStats(stats);

    // Save the cleaned dataset to context (with guard against double-fire)
    if (selectedFile && !datasetSavedRef.current) {
      datasetSavedRef.current = true; // Prevent duplicate saves
      addDataset({
        name: selectedFile.name,
        fileType: getFileExtension(selectedFile.name),
        status: 'cleaned',
        uploadType: 'raw', // Distinguish: was raw, AI cleaned it
        records: '—',
        size: formatFileSize(selectedFile.size),
      });
    }

    setStep('choice');
  }, [selectedFile, addDataset]);

  /** Step 4 → Download: User wants to download cleaned file */
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('autobi_token');
      const response = await fetch(`http://localhost:5000/api/datasets/${uploadedDatasetId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cleaned_${selectedFile?.name || 'dataset.csv'}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download cleaned file. Please try again.');
    }

    // Close the modal after download
    onClose();
  };

  /** Step 4 → 5: User wants to create a dashboard */
  const handleProceedToDashboard = () => {
    setStep('generating');
  };

  /** Step 5 done: Navigate to Studio */
  const handleDashboardComplete = useCallback((dashboardId) => {
    onClose();
    if (dashboardId) navigate(`/studio/${dashboardId}`);
    else navigate('/studio');
  }, [onClose, navigate]);

  // ─── Don't render if closed ────────────────────────────────
  if (!isOpen) return null;

  // ─── Modal header title based on current step ──────────────
  const stepTitles = {
    select: mode === 'raw' ? 'Upload Raw Data' : 'Upload Cleaned Data',
    uploading: 'Uploading',
    cleaning: 'AI Cleaning',
    choice: 'Cleaning Complete',
    generating: 'Generating Dashboard',
  };

  const stepSubtitles = {
    select: 'CSV, Excel, or JSON formats supported',
    uploading: 'Please wait while we process your file',
    cleaning: 'Our AI is fixing data quality issues',
    choice: 'Choose your next step',
    generating: 'Building your dashboard automatically',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0c10]/60 backdrop-blur-sm"
        onClick={step === 'select' ? onClose : undefined} // Only allow closing on select step
      />

      {/* Modal container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              step === 'cleaning' ? 'bg-violet-50' :
              step === 'generating' ? 'bg-emerald-50' :
              step === 'choice' ? 'bg-emerald-50' :
              'bg-primary/10'
            }`}>
              <span className={`material-symbols-outlined ${
                step === 'cleaning' ? 'text-violet-500' :
                step === 'generating' ? 'text-emerald-500' :
                step === 'choice' ? 'text-emerald-500' :
                'text-primary'
              }`}>
                {step === 'cleaning' ? 'auto_awesome' :
                 step === 'generating' ? 'dashboard_customize' :
                 step === 'choice' ? 'check_circle' :
                 'cloud_upload'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">
                {stepTitles[step]}
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">
                {stepSubtitles[step]}
              </p>
            </div>
          </div>

          {/* Close button — only on select & choice steps */}
          {(step === 'select' || step === 'choice') && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400 text-xl">close</span>
            </button>
          )}
        </div>

        {/* Body — renders the active step */}
        <div className="p-8">
          {step === 'select' && (
            <FileSelectStep mode={mode} onFileSelected={handleFileSelected} />
          )}

          {step === 'uploading' && selectedFile && (
            <UploadingStep
              file={selectedFile}
              fileName={selectedFile.name}
              fileSize={formatFileSize(selectedFile.size)}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {step === 'cleaning' && selectedFile && (
            <CleaningStep
              fileName={selectedFile.name}
              datasetId={uploadedDatasetId}
              onCleaningComplete={handleCleaningComplete}
            />
          )}

          {step === 'choice' && selectedFile && cleaningStats && (
            <ChoiceStep
              fileName={selectedFile.name}
              cleaningStats={cleaningStats}
              onDownload={handleDownload}
              onProceedToDashboard={handleProceedToDashboard}
            />
          )}

          {step === 'generating' && selectedFile && (
            <DashboardGeneratingStep
              fileName={selectedFile.name}
              datasetId={uploadedDatasetId || 'unknown'}
              onComplete={handleDashboardComplete}
            />
          )}
        </div>

        {/* Footer info — only on select step */}
        {step === 'select' && (
          <div className="px-8 py-5 bg-gray-50 flex items-center gap-2 border-t border-gray-100">
            <span className="material-symbols-outlined text-primary text-sm">info</span>
            <p className="text-[10px] text-gray-500">
              Your data is encrypted and secure. AutoBI does not store sensitive personal information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadWizard;
