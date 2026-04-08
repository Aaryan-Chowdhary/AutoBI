/**
 * DatasetContext.jsx
 * ------------------
 * Global state manager for datasets across the app.
 *
 * - Admin users get pre-loaded ADMIN_DATASETS on login.
 * - Regular users start with an empty array.
 * - Both can add datasets via the upload wizard.
 * - Datasets persist in React state (will be replaced by API in Phase 3).
 *
 * Usage:
 *   const { datasets, addDataset } = useDatasets();
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [datasets, setDatasets] = useState([]);

  // ─── Fetch real datasets from API ─────────────────────────────
  const fetchDatasets = async () => {
    if (!user) {
      setDatasets([]);
      return;
    }
    try {
      const data = await api('/datasets');
      
      // format for frontend consumption
      const formatted = data.map(d => {
        let sizeStr = '—';
        if (d.file_size_bytes) {
          const kb = d.file_size_bytes / 1024;
          sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
        }

        return {
          id: d.id,
          name: d.name,
          status: d.status,
          fileType: 'csv', // DuckDB Parquet engine primarily runs on CSV ingestion currently
          size: sizeStr,
          records: d.row_count ? d.row_count.toLocaleString() : '—',
          uploadType: d.status === 'needs_cleaning' ? 'raw' : 'cleaned',
          lastUpdated: new Date(d.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          schema: d.schema ? JSON.parse(d.schema) : null,
        };
      });
      setDatasets(formatted);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [user]);

  /**
   * Add a new dataset to the list.
   * Called by the UploadWizard after upload (or after cleaning for raw data).
   *
   * @param {Object} dataset - { name, fileType, status, size, records, ... }
   * @returns {Object} The created dataset with generated id and timestamp.
   */
  const addDataset = (dataset) => {
    const newDataset = {
      id: `ds-${Date.now()}`,               // Unique ID
      owner: user?.initials || 'U',          // Current user's initials
      ownerColor: user?.avatarColor || 'from-gray-400 to-gray-500',
      lastUpdated: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      dimensions: null,
      measures: null,
      statusMessage: null,
      ...dataset, // Caller can override any defaults
    };

    setDatasets((prev) => [newDataset, ...prev]); // Newest first
    return newDataset;
  };

  /**
   * Get total count of datasets (for stats display).
   */
  const datasetCount = datasets.length;

  return (
    <DatasetContext.Provider value={{ datasets, addDataset, fetchDatasets, datasetCount }}>
      {children}
    </DatasetContext.Provider>
  );
}

/**
 * Hook to access dataset state from any component.
 * Must be used inside <DatasetProvider>.
 */
export function useDatasets() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDatasets must be used within a DatasetProvider');
  }
  return context;
}

export default DatasetContext;
