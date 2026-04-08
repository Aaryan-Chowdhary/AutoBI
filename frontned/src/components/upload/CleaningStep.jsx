/**
 * CleaningStep.jsx
 * ----------------
 * Step 3 of the upload wizard (RAW mode only).
 * Polls the real Python/Pandas cleaning service for live progress.
 * Shows actual cleaning stats per step (duplicates removed, values imputed, etc).
 *
 * Props:
 *   - fileName: string — name of the file being cleaned
 *   - datasetId: string — UUID of the dataset being cleaned
 *   - onCleaningComplete(stats) — called when cleaning finishes
 */

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';

// ─── 6 Real cleaning steps matching the Python service ──────
const CLEANING_STEPS = [
  { label: 'Analyzing schema', icon: 'manage_search', key: 'Schema Analysis' },
  { label: 'Removing duplicates', icon: 'content_copy', key: 'Duplicate Removal' },
  { label: 'Imputing missing values', icon: 'data_object', key: 'Missing Value Imputation' },
  { label: 'Normalizing dates', icon: 'calendar_month', key: 'Date Normalization' },
  { label: 'Standardizing categories', icon: 'category', key: 'Category Standardization' },
  { label: 'Capping outliers (IQR)', icon: 'check_circle', key: 'Outlier Capping' },
];

function CleaningStep({ fileName, datasetId, onCleaningComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepDetails, setStepDetails] = useState({});
  const [statusText, setStatusText] = useState('Connecting to cleaning engine...');
  const [elapsedSec, setElapsedSec] = useState(0);
  const startTimeRef = useRef(Date.now());
  const doneRef = useRef(false);

  // ─── Elapsed time counter ──────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Poll the real backend /datasets/:id/status ────────────
  useEffect(() => {
    let isCancelled = false;

    const pollProgress = async () => {
      if (!datasetId || isCancelled || doneRef.current) return;

      try {
        const data = await api(`/datasets/${datasetId}/status`);

        if (data.status === 'cleaned') {
          if (doneRef.current) return;
          doneRef.current = true;

          setCurrentStep(7); // Past all 6 steps
          setProgress(100);

          // Parse cleaning log
          const log = data.cleaning_log || [];
          const details = {};
          log.forEach(entry => { details[entry.name] = entry.details; });
          setStepDetails(details);

          const step2 = details['Duplicate Removal'] || {};
          const step3 = details['Missing Value Imputation'] || {};
          const step6 = details['Outlier Capping'] || {};

          setStatusText('Cleaning complete!');

          setTimeout(() => {
            if (!isCancelled) {
              onCleaningComplete({
                duplicatesFixed: step2.duplicates_removed || 0,
                formatsFixed: step6.total_outliers_capped || 0,
                missingFilled: step3.total_values_imputed || 0,
              });
            }
          }, 1500);
          return;
        }

        if (data.status === 'failed') {
          setStatusText('Cleaning failed. Please try again.');
          setProgress(0);
          return;
        }

        // Still in progress
        const step = data.current_step || 0;
        setCurrentStep(step);
        setProgress(Math.round(Math.min((step / 6) * 100, 95)));

        if (data.steps && data.steps.length > 0) {
          const details = {};
          data.steps.forEach(s => { details[s.name] = s.details; });
          setStepDetails(details);
        }

        if (step > 0 && step <= CLEANING_STEPS.length) {
          setStatusText(CLEANING_STEPS[step - 1].label + '...');
        }

      } catch (err) {
        console.error('Polling error:', err);
      }

      if (!isCancelled && !doneRef.current) {
        setTimeout(pollProgress, 1200);
      }
    };

    // Small delay before first poll to let the backend register the dataset
    const initialDelay = setTimeout(pollProgress, 800);
    return () => {
      isCancelled = true;
      clearTimeout(initialDelay);
    };
  }, [datasetId, onCleaningComplete]);

  const formatTime = (sec) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  // Format a detail stat for display
  const getStepStat = (stepKey) => {
    const d = stepDetails[stepKey];
    if (!d) return null;

    switch (stepKey) {
      case 'Schema Analysis':
        return `${d.rows?.toLocaleString()} rows × ${d.columns} cols — ${d.total_null_values} nulls found`;
      case 'Duplicate Removal':
        return d.duplicates_removed > 0
          ? `Removed ${d.duplicates_removed} duplicate rows`
          : 'No duplicates found — data is unique';
      case 'Missing Value Imputation':
        return d.total_values_imputed > 0
          ? `Filled ${d.total_values_imputed} missing values across ${d.columns_imputed} columns`
          : 'No missing values — dataset is complete';
      case 'Date Normalization':
        return d.date_columns_found > 0
          ? `Normalized ${d.date_columns_found} date column(s)`
          : 'No date columns detected';
      case 'Category Standardization':
        return d.total_categories_merged > 0
          ? `Merged ${d.total_categories_merged} duplicate categories`
          : 'Categories already standardized';
      case 'Outlier Capping':
        return d.total_outliers_capped > 0
          ? `Capped ${d.total_outliers_capped} outliers in ${d.columns_with_outliers} columns`
          : 'No significant outliers detected';
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">

      {/* Progress ring + percentage */}
      <div className="relative w-28 h-28 mb-5">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="7" fill="transparent" />
          <circle
            cx="50" cy="50" r="42"
            stroke="url(#progressGrad)" strokeWidth="7"
            fill="transparent"
            strokeDasharray={263.9}
            strokeDashoffset={263.9 - (263.9 * progress) / 100}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#8b5cf6' }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6' }} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-gray-800">{progress}%</span>
          <span className="text-[9px] text-gray-400 font-bold">{formatTime(elapsedSec)}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-gray-800 mb-0.5">Pandas AI is Cleaning</h3>
      <p className="text-[11px] text-gray-400 mb-1 truncate max-w-[280px]">{fileName}</p>
      <p className="text-[11px] text-violet-600 font-semibold mb-4">{statusText}</p>

      {/* Step checklist with REAL stats */}
      <div className="w-full space-y-1.5">
        {CLEANING_STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isDone = currentStep > stepNum || (progress === 100);
          const isCurrent = stepNum === currentStep && progress < 100;
          const stat = getStepStat(step.key);

          return (
            <div
              key={step.key}
              className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-50/80'
                  : isCurrent
                    ? 'bg-violet-50 ring-1 ring-violet-200'
                    : 'opacity-40'
              }`}
            >
              {/* Icon */}
              <span className={`material-symbols-outlined text-sm mt-0.5 ${
                isDone ? 'text-emerald-500' : isCurrent ? 'text-violet-500 animate-spin' : 'text-gray-300'
              }`}>
                {isDone ? 'check_circle' : isCurrent ? 'progress_activity' : 'radio_button_unchecked'}
              </span>

              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold block leading-tight ${
                  isDone ? 'text-emerald-700' : isCurrent ? 'text-violet-700' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>

                {/* Real stat from Pandas */}
                {stat && isDone && (
                  <span className="text-[10px] text-gray-500 block mt-0.5 leading-tight">
                    {stat}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CleaningStep;
