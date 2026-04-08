/**
 * mockData.js
 * -----------
 * Single source of truth for all admin/demo mock data.
 * This file will be replaced by real API responses in Phase 3.
 *
 * Used by: DatasetContext, HomePage, DatasetsPage
 */

// ─── Admin Datasets ──────────────────────────────────────────
// These are the pre-loaded datasets shown when admin logs in.
export const ADMIN_DATASETS = [
  {
    id: 'ds-1',
    name: 'Sales_Transactions_Q4.csv',
    fileType: 'csv',
    status: 'cleaned',
    records: '1.2M',
    size: '24.5 MB',
    lastUpdated: 'Oct 24, 2023 14:20',
    dimensions: 12,
    measures: 8,
    owner: 'AR',
    ownerColor: 'from-emerald-400 to-cyan-500',
    statusMessage: null,
  },
  {
    id: 'ds-2',
    name: 'Customer_Engagement_Logs.xlsx',
    fileType: 'xlsx',
    status: 'needs_cleaning',
    records: '450k',
    size: '8.1 MB',
    lastUpdated: 'Oct 26, 2023 09:15',
    dimensions: null,
    measures: null,
    owner: 'SC',
    ownerColor: 'from-violet-400 to-purple-500',
    statusMessage: 'Missing values in 3 columns',
  },
  {
    id: 'ds-3',
    name: 'Inventory_Report_Global.csv',
    fileType: 'csv',
    status: 'needs_cleaning',
    records: '—',
    size: '2.3 MB',
    lastUpdated: 'Oct 25, 2023 18:45',
    dimensions: null,
    measures: null,
    owner: 'AR',
    ownerColor: 'from-emerald-400 to-cyan-500',
    statusMessage: 'Schema Mismatch',
  },
  {
    id: 'ds-4',
    name: 'Marketing_Campaign_ROI.json',
    fileType: 'json',
    status: 'cleaned',
    records: '89.2k',
    size: '5.6 MB',
    lastUpdated: 'Oct 23, 2023 11:30',
    dimensions: 8,
    measures: 12,
    owner: 'JD',
    ownerColor: 'from-amber-400 to-orange-500',
    statusMessage: null,
  },
  {
    id: 'ds-5',
    name: 'Website_Analytics_2023.csv',
    fileType: 'csv',
    status: 'cleaned',
    records: '2.1M',
    size: '45.2 MB',
    lastUpdated: 'Oct 22, 2023 16:00',
    dimensions: 15,
    measures: 10,
    owner: 'AR',
    ownerColor: 'from-emerald-400 to-cyan-500',
    statusMessage: null,
  },
  {
    id: 'ds-6',
    name: 'HR_Payroll_Records.xlsx',
    fileType: 'xlsx',
    status: 'needs_cleaning',
    records: '12k',
    size: '1.8 MB',
    lastUpdated: 'Oct 21, 2023 09:00',
    dimensions: null,
    measures: null,
    owner: 'SC',
    ownerColor: 'from-violet-400 to-purple-500',
    statusMessage: 'Duplicate rows detected',
  },
  {
    id: 'ds-7',
    name: 'Product_Reviews_NLP.json',
    fileType: 'json',
    status: 'cleaned',
    records: '340k',
    size: '12.4 MB',
    lastUpdated: 'Oct 20, 2023 14:30',
    dimensions: 6,
    measures: 4,
    owner: 'JD',
    ownerColor: 'from-amber-400 to-orange-500',
    statusMessage: null,
  },
  {
    id: 'ds-8',
    name: 'Supply_Chain_Logistics.csv',
    fileType: 'csv',
    status: 'needs_cleaning',
    records: '780k',
    size: '18.7 MB',
    lastUpdated: 'Oct 19, 2023 11:15',
    dimensions: null,
    measures: null,
    owner: 'AR',
    ownerColor: 'from-emerald-400 to-cyan-500',
    statusMessage: 'Inconsistent date formats',
  },
];

// ─── Admin Quick Stats ───────────────────────────────────────
export const ADMIN_STATS = [
  { label: 'Total Dashboards', value: '12', icon: 'dashboard', color: 'from-blue-500 to-blue-600' },
  { label: 'Datasets', value: '8', icon: 'database', color: 'from-emerald-500 to-emerald-600' },
  { label: 'Storage Used', value: '2.4 GB', icon: 'cloud', color: 'from-violet-500 to-violet-600' },
  { label: 'Last Active', value: 'Just now', icon: 'schedule', color: 'from-amber-500 to-amber-600' },
];

// ─── Empty Stats (new users) ─────────────────────────────────
export const EMPTY_STATS = [
  { label: 'Total Dashboards', value: '0', icon: 'dashboard', color: 'from-blue-500 to-blue-600' },
  { label: 'Datasets', value: '0', icon: 'database', color: 'from-emerald-500 to-emerald-600' },
  { label: 'Storage Used', value: '0 MB', icon: 'cloud', color: 'from-violet-500 to-violet-600' },
  { label: 'Last Active', value: 'Just now', icon: 'schedule', color: 'from-amber-500 to-amber-600' },
];

// ─── Admin Dashboards ────────────────────────────────────────
export const ADMIN_DASHBOARDS = [
  {
    id: 1,
    title: 'Q4 Sales Performance',
    editedTime: 'Edited 2 hours ago',
    thumbnail: 'bar',
    pinned: true,
  },
  {
    id: 2,
    title: 'Customer Churn Analysis',
    editedTime: 'Edited yesterday',
    thumbnail: 'pie',
    pinned: false,
  },
  {
    id: 3,
    title: 'Marketing ROI Dashboard',
    editedTime: 'Edited 3 days ago',
    thumbnail: 'line',
    pinned: true,
  },
  {
    id: 4,
    title: 'Supply Chain Tracker',
    editedTime: 'Edited 1 week ago',
    thumbnail: 'multi',
    pinned: false,
  },
];
