/**
 * UploadingStep.jsx
 * -----------------
 * Step 2 of the upload wizard.
 * Shows a circular progress animation while "uploading" the file.
 * In Phase 1 this is simulated; in Phase 3 it will track real upload progress.
 *
 * Props:
 *   - fileName: string — name of the file being uploaded
 *   - fileSize: string — formatted file size (e.g., "2.4 MB")
 *   - onUploadComplete() — called when upload finishes
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

function UploadingStep({ file, fileName, fileSize, onUploadComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    
    const startUpload = async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Let's pretend progress is 50% while it sends the file
        setProgress(50);
        
        const res = await api('/datasets/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!isCancelled) {
          setProgress(100);
          setTimeout(() => onUploadComplete(res.datasetId), 400);
        }
      } catch (err) {
        console.error('Upload failed', err);
        // Fallback or error state could be handled here
        if (!isCancelled) setProgress(0);
      }
    };

    startUpload();
    return () => { isCancelled = true; };
  }, [file, onUploadComplete]);

  return (
    <div className="py-6 flex flex-col items-center">

      {/* Circular progress ring */}
      <div className="relative w-24 h-24 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor" strokeWidth="8"
            fill="transparent" className="text-gray-100"
          />
          {/* Progress ring */}
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor" strokeWidth="8"
            fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * progress) / 100}
            className="text-primary transition-all duration-200"
            strokeLinecap="round"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
            cloud_upload
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-gray-800 mb-1">Uploading File...</h3>

      {/* File info */}
      <p className="text-xs text-gray-400 mb-4">
        {fileName} · {fileSize}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className="bg-primary h-full transition-all duration-200 rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Progress percentage */}
      <p className="text-xs text-gray-500 font-medium">
        {Math.min(progress, 100)}% completed
      </p>
    </div>
  );
}

export default UploadingStep;
