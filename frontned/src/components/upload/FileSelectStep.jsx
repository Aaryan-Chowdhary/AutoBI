/**
 * FileSelectStep.jsx
 * ------------------
 * Step 1 of the upload wizard.
 * Provides a drag-and-drop zone + click-to-browse file picker.
 *
 * Props:
 *   - mode: "raw" | "cleaned" — changes the subtitle text
 *   - onFileSelected(file) — called when a valid file is chosen
 */

import React from 'react';

function FileSelectStep({ mode, onFileSelected }) {

  // ─── Handle file input change ───────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelected(file);
  };

  // ─── Handle drag-and-drop ──────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Hidden file input — triggered by clicking the zone */}
      <input
        type="file"
        className="absolute inset-0 opacity-0 cursor-pointer"
        accept=".csv,.xlsx,.xls,.json"
        onChange={handleFileChange}
      />

      {/* Upload icon */}
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white transition-all shadow-sm">
        <span className="material-symbols-outlined text-3xl text-gray-300 group-hover:text-primary transition-colors">
          upload_file
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-gray-700 mb-1">
        Click or drag file to upload
      </h3>

      {/* Subtitle — changes based on upload mode */}
      <p className="text-xs text-gray-400 max-w-[240px]">
        {mode === 'raw'
          ? 'Up to 50MB per file. AI will automatically clean your data.'
          : 'Up to 50MB. Upload your pre-cleaned CSV, Excel, or JSON file.'
        }
      </p>

      {/* Supported formats */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <span className="text-[10px] text-gray-300 font-medium px-2 py-1 bg-gray-50 rounded">.csv</span>
        <span className="text-[10px] text-gray-300 font-medium px-2 py-1 bg-gray-50 rounded">.xlsx</span>
        <span className="text-[10px] text-gray-300 font-medium px-2 py-1 bg-gray-50 rounded">.json</span>
      </div>
    </div>
  );
}

export default FileSelectStep;
