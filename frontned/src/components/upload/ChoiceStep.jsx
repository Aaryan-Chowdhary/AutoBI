/**
 * ChoiceStep.jsx
 * ---------------
 * Step 4 of the upload wizard (RAW mode only).
 * After cleaning, asks the user what to do next:
 *   1. Download the cleaned dataset
 *   2. Proceed to create a dashboard
 *
 * Props:
 *   - fileName: string — name of the cleaned file
 *   - cleaningStats: { duplicatesFixed, formatsFixed, missingFilled }
 *   - onDownload() — triggers browser download of cleaned file
 *   - onProceedToDashboard() — advances to dashboard generation
 */

import React from 'react';

function ChoiceStep({ fileName, cleaningStats, onDownload, onProceedToDashboard }) {
  return (
    <div className="py-6 flex flex-col items-center text-center">

      {/* Success icon */}
      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
        <span className="material-symbols-outlined text-4xl">check_circle</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-gray-800 mb-2">Cleaning Complete!</h3>

      {/* Cleaning summary stats */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="material-symbols-outlined text-sm text-emerald-500">content_copy</span>
          <span><strong>{cleaningStats.duplicatesFixed}</strong> duplicates fixed</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="material-symbols-outlined text-sm text-blue-500">calendar_month</span>
          <span><strong>{cleaningStats.formatsFixed}</strong> formats fixed</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="material-symbols-outlined text-sm text-violet-500">data_object</span>
          <span><strong>{cleaningStats.missingFilled}</strong> values filled</span>
        </div>
      </div>

      {/* File info */}
      <p className="text-xs text-gray-400 mb-8">
        Cleaned file: <span className="font-semibold text-gray-600">{fileName}</span>
      </p>

      {/* Choice: What do you want to do? */}
      <p className="text-sm font-semibold text-gray-600 mb-4">What would you like to do?</p>

      <div className="flex flex-col gap-3 w-full">
        {/* Option 1: Proceed to create dashboard */}
        <button
          onClick={onProceedToDashboard}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          Create Dashboard
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* Option 2: Download cleaned file */}
        <button
          onClick={onDownload}
          className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Download Cleaned Dataset
        </button>
      </div>
    </div>
  );
}

export default ChoiceStep;
