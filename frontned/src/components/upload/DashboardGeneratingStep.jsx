/**
 * DashboardGeneratingStep.jsx
 * ----------------------------
 * Final step of the upload wizard.
 * Shows an animated "generating dashboard" progress screen.
 * After completion, navigates to the Studio page.
 *
 * Props:
 *   - fileName: string — dataset name being used
 *   - onComplete() — called when generation finishes (navigate to /studio)
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';

function DashboardGeneratingStep({ fileName, datasetId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  // ─── Simulate dashboard generation and call API ─────────
  useEffect(() => {
    let dashboardGeneratedId = null;

    const createDashboardRecord = async () => {
      try {
        const dbDashboard = await api('/dashboards', {
          method: 'POST',
          body: JSON.stringify({
            name: `${fileName} Defaults`,
            dataset_id: datasetId,
            layout_json: [],
            visuals_json: []
          })
        });
        dashboardGeneratedId = dbDashboard.id;
      } catch (err) {
        console.error('Failed generative step:', err);
      }
    };
    
    // Fire it to prepare it
    createDashboardRecord();

    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        setProgress((next / GENERATION_STEPS.length) * 100);

        if (next >= GENERATION_STEPS.length) {
          clearInterval(intervalRef.current);
          setTimeout(() => onComplete(dashboardGeneratedId), 800);
          return prev;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(intervalRef.current);
  }, [onComplete, datasetId, fileName]);

  return (
    <div className="py-6 flex flex-col items-center">

      {/* Animated progress ring */}
      <div className="relative w-24 h-24 mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor" strokeWidth="8"
            fill="transparent" className="text-gray-100"
          />
          <circle
            cx="48" cy="48" r="40"
            stroke="currentColor" strokeWidth="8"
            fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * progress) / 100}
            className="text-emerald-500 transition-all duration-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-emerald-500 animate-pulse">
            dashboard_customize
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-gray-800 mb-1">Generating Dashboard...</h3>
      <p className="text-xs text-gray-400 mb-6">Based on {fileName}</p>

      {/* Progress bar */}
      <div className="w-full max-w-xs bg-gray-100 h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step checklist */}
      <div className="space-y-3 w-full max-w-xs">
        {GENERATION_STEPS.map((step, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step.label}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isDone || isCurrent ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {/* Status icon */}
              <span className={`material-symbols-outlined text-base ${
                isDone
                  ? 'text-emerald-500'
                  : isCurrent
                    ? 'text-emerald-500 animate-pulse'
                    : 'text-gray-300'
              }`}>
                {isDone ? 'check_circle' : step.icon}
              </span>

              {/* Step label */}
              <span className={`text-xs ${
                isDone ? 'text-gray-600 font-medium' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Simulated generation steps ──────────────────────────────
const GENERATION_STEPS = [
  { label: 'Analyzing data schema...', icon: 'schema' },
  { label: 'Identifying key metrics...', icon: 'insights' },
  { label: 'Selecting best visualizations...', icon: 'auto_graph' },
  { label: 'Building dashboard layout...', icon: 'dashboard_customize' },
  { label: 'Rendering final output...', icon: 'brush' },
];

export default DashboardGeneratingStep;
