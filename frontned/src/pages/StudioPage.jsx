import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';
import { useDatasets } from '../context/DatasetContext';
import { toPng } from 'html-to-image';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatNumber = (num) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return parseFloat(num).toFixed(2);
};

const VisualsLibrary = [
  { id: 'bar',     name: 'Bar Chart',    icon: 'bar_chart',    category: 'Comparison' },
  { id: 'line',    name: 'Line Chart',   icon: 'show_chart',   category: 'Trends' },
  { id: 'pie',     name: 'Pie Chart',    icon: 'pie_chart',    category: 'Composition' },
  { id: 'area',    name: 'Area Chart',   icon: 'area_chart',   category: 'Trends' },
  { id: 'scatter', name: 'Scatter Plot', icon: 'scatter_plot', category: 'Relationship' },
  { id: 'kpi',     name: 'KPI Card',     icon: 'view_agenda',  category: 'Key Metric' },
  { id: 'table',   name: 'Data Table',   icon: 'table_rows',   category: 'Detail' },
  { id: 'map',     name: 'Geo Map',      icon: 'map',          category: 'Geographic' },
  { id: 'gauge',   name: 'Gauge',        icon: 'speed',        category: 'Key Metric' },
];

// ── Toast helper ─────────────────────────────────────────────────────
const TOAST_ICONS = { success: 'check_circle', error: 'error', info: 'info', warn: 'warning' };
const TOAST_COLORS = {
  success: 'bg-emerald-600', error: 'bg-red-500', info: 'bg-blue-500', warn: 'bg-amber-500'
};

function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${TOAST_COLORS[t.type] || TOAST_COLORS.info} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold min-w-[240px] max-w-xs animate-in slide-in-from-right-4 fade-in duration-300`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">{TOAST_ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function StudioPage() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { datasets } = useDatasets();

  const [dashboard, setDashboard]       = useState(null);
  const [datasetFields, setDatasetFields] = useState({ name: 'Loading...', fields: [] });

  const [activeTab, setActiveTab]         = useState('fields');
  const [selectedVisual, setSelectedVisual] = useState(null);
  const [zoomLevel, setZoomLevel]         = useState(100);
  const [canvasElements, setCanvasElements] = useState([]);
  const canvasRef     = useRef(null);
  const previewRef    = useRef(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [isGenerating, setIsGenerating]   = useState(false);
  const [insight, setInsight]             = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Field configurator per-visual state
  const [fieldConfig, setFieldConfig]     = useState({ xAxis: '', yAxis: '', aggregation: 'SUM' });
  const [queryLoading, setQueryLoading]   = useState(false);

  // Toast system
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Load dashboard on mount ──────────────────────────────────────
  useEffect(() => {
    if (!dashboardId) return;
    const loadDashboard = async () => {
      try {
        const dbDash = await api(`/dashboards/${dashboardId}`);
        setDashboard(dbDash);
        if (dbDash.visuals_json?.length > 0) setCanvasElements(dbDash.visuals_json);

        let resolvedName = null, fields = [];

        if (dbDash.dataset_id) {
          let match = datasets.find(d => d.id === dbDash.dataset_id);
          if (!match) { const all = await api('/datasets'); match = all.find(d => d.id === dbDash.dataset_id); }
          if (match) {
            resolvedName = match.name;
            if (match.schema) {
              fields = (typeof match.schema === 'string' ? JSON.parse(match.schema) : match.schema).map(col => {
                const isNum = ['BIGINT','DOUBLE','INTEGER','FLOAT','int','float','number'].includes((col.column_type ?? '').toUpperCase());
                return { name: col.column_name, type: isNum ? 'number' : col.column_type === 'DATE' ? 'date' : 'string', role: isNum ? 'measure' : 'dimension' };
              });
            }
          }
        }

        if (!resolvedName && dbDash.name) {
          const base = dbDash.name.replace(/ ?[Dd]ashboard$/, '').trim();
          for (const c of [base + '.csv', base, 'cleaned_' + base + '.csv']) {
            try { const r = await fetch(`http://localhost:5000/uploads/${c}`, { method: 'HEAD' }); if (r.ok) { resolvedName = c; break; } } catch {}
          }
        }

        if (!resolvedName && datasets.length > 0) {
          const cleaned = datasets.find(d => d.name?.startsWith('cleaned_'));
          resolvedName = cleaned ? cleaned.name : datasets[0].name;
        }

        // ── Fallback: if we have a filename but no fields, read schema directly from CSV ──
        if (resolvedName && fields.length === 0) {
          try {
            const schemaRes = await api(`/ai/schema?datasetName=${encodeURIComponent(resolvedName)}`);
            if (schemaRes.success && schemaRes.fields?.length > 0) {
              fields = schemaRes.fields;
            }
          } catch (schemaErr) {
            console.warn('Could not fetch schema from CSV:', schemaErr);
          }
        }

        setDatasetFields({ name: resolvedName || 'Unknown Dataset', fields });
      } catch (err) { console.error('Failed to load dashboard:', err); }
    };
    loadDashboard();
  }, [dashboardId, datasets]);

  // ── Sync fieldConfig when selected visual changes ────────────────
  useEffect(() => {
    if (!selectedVisual) return;
    const el = canvasElements.find(e => e.id === selectedVisual);
    if (el) {
      setFieldConfig({
        xAxis: el.xAxis || datasetFields.fields.find(f => f.role === 'dimension')?.name || '',
        yAxis: el.yAxis || datasetFields.fields.find(f => f.role === 'measure')?.name || '',
        aggregation: el.aggregation || 'SUM',
      });
    }
  }, [selectedVisual]);

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!dashboardId) return;
    try {
      await api(`/dashboards/${dashboardId}`, {
        method: 'PUT',
        body: JSON.stringify({ visuals_json: canvasElements, layout_json: [] })
      });
      showToast('Dashboard saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save dashboard', err);
      showToast('Failed to save dashboard', 'error');
    }
  };

  // ── AI Suggest ───────────────────────────────────────────────────
  const handleAISuggest = async () => {
    if (!dashboard) { showToast('No dashboard loaded.', 'warn'); return; }
    let dsName = datasetFields.name;
    if (!dsName || dsName === 'Unknown Dataset' || dsName === 'Loading...') {
      showToast('No dataset linked. Upload a dataset first.', 'warn'); return;
    }

    // Ensure the name has a .csv extension — the backend needs the exact filename
    if (!dsName.toLowerCase().endsWith('.csv')) dsName = dsName + '.csv';

    setIsGenerating(true);
    try {
      const res = await api('/ai/auto-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetName: dsName })
      });
      if (res.success && res.canvasElements?.length > 0) {
        setCanvasElements(res.canvasElements);
        showToast('AI dashboard generated!', 'success');
        if (dashboardId) {
          try {
            await api(`/dashboards/${dashboardId}`, {
              method: 'PUT',
              body: JSON.stringify({ name: res.dashboardName || dashboard?.name, visuals_json: res.canvasElements, layout_json: [] })
            });
          } catch {}
        }
      } else if (res.error) {
        showToast('Backend error: ' + res.error, 'error');
      } else {
        showToast('AI returned no charts. Try again.', 'warn');
      }
    } catch (err) {
      showToast('AI Generation failed: ' + (err.message || 'Unknown error'), 'error');
    } finally { setIsGenerating(false); }
  };


  // ── Fetch real data for a chart via ALASQL ───────────────────────
  const fetchChartData = async (chartType, xAxis, yAxis, aggregation = 'SUM') => {
    let dsName = datasetFields.name;
    if (!dsName || dsName === 'Unknown Dataset' || dsName === 'Loading...') return null;
    if (!dsName.toLowerCase().endsWith('.csv')) dsName = dsName + '.csv';
    try {
      const res = await api('/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetName: dsName, chartType, xAxis, yAxis, aggregation })
      });
      return res.success ? res.data : null;
    } catch { return null; }
  };

  // ── Select a visual + auto-load insight ─────────────────────────
  const handleSelectVisual = useCallback(async (id) => {
    setSelectedVisual(id);
    if (!id) { setInsight(null); return; }
    const el = canvasElements.find(e => e.id === id);
    if (!el) return;
    setActiveTab('insights');
    setInsight(null);
    setInsightLoading(true);
    try {
      const res = await api('/ai/chart-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartType: el.type, title: el.title, data: el.data, xAxis: el.xAxis, yAxis: el.yAxis })
      });
      if (res.success) setInsight(res.insight);
      else setInsight(null);
    } catch { setInsight(null); } 
    finally { setInsightLoading(false); }
  }, [canvasElements]);

  // ── Apply field configuration (re-query data) ────────────────────
  const handleFieldApply = async () => {
    if (!selectedVisual) return;
    const el = canvasElements.find(e => e.id === selectedVisual);
    if (!el) return;
    if (!fieldConfig.yAxis) { showToast('Please select a Y-Axis (measure) field.', 'warn'); return; }

    setQueryLoading(true);
    try {
      const data = await fetchChartData(el.type, fieldConfig.xAxis, fieldConfig.yAxis, fieldConfig.aggregation);
      if (data) {
        const updates = { data, xAxis: fieldConfig.xAxis, yAxis: fieldConfig.yAxis, aggregation: fieldConfig.aggregation };
        setCanvasElements(prev => prev.map(e => e.id === selectedVisual ? { ...e, ...updates } : e));
        showToast('Chart updated with real data!', 'success');
      } else {
        showToast('Could not fetch data. Check field names.', 'error');
      }
    } finally { setQueryLoading(false); }
  };

  // ── Drag & Drop ─────────────────────────────────────────────────
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('visualType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('visualType');
    if (!type || type === 'dimension' || type === 'measure') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoomLevel / 100);
    const y = (e.clientY - rect.top) / (zoomLevel / 100);

    // Auto-pick first dimension + first measure
    const dims = datasetFields.fields.filter(f => f.role === 'dimension');
    const meas = datasetFields.fields.filter(f => f.role === 'measure');
    const autoX = dims[0]?.name || '';
    const autoY = meas[0]?.name || '';

    const newElement = {
      id: Date.now().toString(),
      type,
      x: x - 200,
      y: y - 150,
      w: type === 'kpi' ? 300 : 450,
      h: type === 'kpi' ? 160 : 300,
      title: VisualsLibrary.find(v => v.id === type)?.name || 'New Chart',
      xAxis: autoX,
      yAxis: autoY,
      aggregation: 'SUM',
      data: null,  // will fill below
    };

    // Add placeholder first so user sees it immediately
    setCanvasElements(prev => [...prev, newElement]);
    setSelectedVisual(newElement.id);

    // Fetch real data in background
    if (autoY) {
      const realData = await fetchChartData(type, autoX, autoY, 'SUM');
      if (realData) {
        setCanvasElements(prev =>
          prev.map(el => el.id === newElement.id ? { ...el, data: realData } : el)
        );
        showToast('Real data loaded for chart!', 'success');
      }
    }
  };

  const updateElement = (id, updates) =>
    setCanvasElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));

  const deleteElement = (id) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    if (selectedVisual === id) { setSelectedVisual(null); setInsight(null); }
  };

  // ── Export: JSON ─────────────────────────────────────────────────
  const exportJSON = () => {
    const payload = { dashboardName: dashboard?.name, exportedAt: new Date().toISOString(), canvasElements };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${dashboard?.name || 'dashboard'}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exported!', 'success');
  };

  // ── Export: PNG ──────────────────────────────────────────────────
  const exportPNG = async () => {
    const node = previewRef.current || canvasRef.current;
    if (!node) return;
    showToast('Generating PNG...', 'info');
    try {
      const url = await toPng(node, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: 1.5 });
      const a = document.createElement('a');
      a.href = url; a.download = `${dashboard?.name || 'dashboard'}.png`; a.click();
      showToast('PNG downloaded!', 'success');
    } catch (err) {
      showToast('PNG export failed: ' + err.message, 'error');
    }
  };

  // ── Selected element helper ───────────────────────────────────────
  const selectedEl = canvasElements.find(e => e.id === selectedVisual);

  return (
    <div className="h-screen flex bg-[#f0f2f5] overflow-hidden font-sans">
      <ToastContainer toasts={toasts} />
      <Sidebar />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Toolbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <nav className="flex items-center text-xs text-gray-400 gap-2 mb-0.5">
                <span>Workspace</span>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span>Dashboards</span>
              </nav>
              <h1 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                {dashboard?.name || 'Untitled Dashboard'}
                <span className="material-symbols-outlined text-xs text-blue-500 cursor-pointer hover:scale-110 transition-transform">edit</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-lg">download</span>
                Export
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30 hidden group-hover:block w-44">
                <button onClick={exportJSON} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="material-symbols-outlined text-sm text-blue-500">data_object</span>
                  Export as JSON
                </button>
                <button onClick={exportPNG} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <span className="material-symbols-outlined text-sm text-purple-500">image</span>
                  Export as PNG
                </button>
              </div>
            </div>

            <button onClick={() => setIsPreviewMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Preview
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={handleAISuggest} disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all ${isGenerating ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              <span className={`material-symbols-outlined text-lg ${isGenerating ? 'animate-spin' : ''}`}>
                {isGenerating ? 'hourglass_empty' : 'auto_awesome'}
              </span>
              {isGenerating ? 'Thinking...' : 'AI Suggest'}
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-blue-600 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-all">
              Save
            </button>
          </div>
        </header>

        {/* Horizontal Visuals Ribbon */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8 shrink-0 z-10 shadow-sm overflow-x-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Insert Visuals</span>
            <div className="flex items-center gap-2">
              {VisualsLibrary.map(visual => (
                <button
                  key={visual.id} draggable
                  onDragStart={(e) => handleDragStart(e, visual.id)}
                  className="flex flex-col items-center justify-center p-2 w-16 rounded-xl transition-all border-2 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200"
                  title={visual.name}
                >
                  <span className="material-symbols-outlined text-[24px] mb-1">{visual.icon}</span>
                  <span className="text-[9px] font-medium truncate w-full text-center">{visual.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-12 w-px bg-gray-200 mt-4" />

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dashboard Tools</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(Math.round((window.innerWidth - 370) / 1600 * 100))}
                className="flex flex-col items-center gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl border-2 border-transparent hover:border-blue-200 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-500">fit_screen</span>
                Fit Width
              </button>
              <button
                onClick={() => { if (window.confirm('Clear all visuals from the canvas?')) setCanvasElements([]); }}
                className="flex flex-col items-center gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl border-2 border-transparent hover:border-red-200 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-red-400">delete_sweep</span>
                Clear All
              </button>
              <button
                onClick={handleSave}
                className="flex flex-col items-center gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl border-2 border-transparent hover:border-emerald-200 transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-emerald-500">save</span>
                Quick Save
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">

          {/* Center: Canvas Workspace */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#e9ecef] overflow-hidden">

            {/* Zoom toolbar */}
            <div className="shrink-0 flex justify-center py-2 bg-[#e9ecef] z-10">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-4 hover:bg-white transition-all">
                <div className="flex items-center gap-1">
                  <button onClick={() => setZoomLevel(Math.max(25, zoomLevel - 10))} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="text-[11px] font-bold text-gray-600 tabular-nums w-8 text-center">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                  <span className="material-symbols-outlined text-lg">grid_on</span>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                  <span className="material-symbols-outlined text-lg">undo</span>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                  <span className="material-symbols-outlined text-lg">redo</span>
                </button>
              </div>
            </div>

            {/* Canvas scroll area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-8">
              <div style={{ width: `${1600 * (zoomLevel / 100)}px`, minHeight: `${900 * (zoomLevel / 100)}px`, margin: '0 auto', position: 'relative' }}>
                <div
                  ref={canvasRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => { setSelectedVisual(null); setInsight(null); }}
                  className="bg-white shadow-xl relative studio-canvas-grid border border-gray-200"
                  style={{ width: '1600px', minHeight: '900px', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}
                >
                  {canvasElements.map((el) => (
                    <CanvasElement
                      key={el.id} element={el}
                      isSelected={selectedVisual === el.id}
                      onSelect={(e) => { e.stopPropagation(); handleSelectVisual(el.id); }}
                      onUpdate={(updates) => updateElement(el.id, updates)}
                      onDelete={() => deleteElement(el.id)}
                      zoomLevel={zoomLevel}
                    />
                  ))}
                  {canvasElements.length === 0 && (
                    <>
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.03] select-none pointer-events-none">
                        <span className="material-symbols-outlined text-[200px]">dashboard_customize</span>
                        <p className="text-4xl font-black uppercase tracking-tighter">AutoBI Canvas</p>
                      </div>
                      <div className="p-12 text-center mt-48 pointer-events-none">
                        <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
                          <span className="material-symbols-outlined text-5xl">add_to_drive</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">Drag visuals from the top ribbon</h3>
                        <p className="text-sm text-gray-400 mt-2">Real data will be loaded automatically from your dataset.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Right: Fields + AI Insights Panel */}
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
            {/* Tabs: Fields | Insights */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'fields' ? 'text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Fields
                {activeTab === 'fields' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'insights' ? 'text-violet-600 bg-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Insights
                {activeTab === 'insights' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-600" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* ── FIELDS TAB ───────────────────────────────────── */}
              {activeTab === 'fields' && (
                <div className="p-4 flex flex-col gap-4">
                  {/* Dataset info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-500 text-lg">data_usage</span>
                      <span className="text-xs font-bold text-gray-700 truncate max-w-[130px]" title={datasetFields.name}>{datasetFields.name}</span>
                    </div>
                    <button className="text-[10px] text-blue-600 font-bold hover:underline">Change</button>
                  </div>

                  {/* ── Field Configurator (only when a visual is selected) ── */}
                  {selectedEl ? (
                    <div className="flex flex-col gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-blue-500 text-[16px]">
                          {VisualsLibrary.find(v => v.id === selectedEl.type)?.icon || 'bar_chart'}
                        </span>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Configure Chart</p>
                      </div>

                      {/* X-Axis — hidden for KPI */}
                      {selectedEl.type !== 'kpi' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            {selectedEl.type === 'pie' ? 'Label Field' : 'X-Axis / Category'}
                          </label>
                          <select
                            value={fieldConfig.xAxis}
                            onChange={e => setFieldConfig(p => ({ ...p, xAxis: e.target.value }))}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">— Select field —</option>
                            {datasetFields.fields.filter(f => f.role === 'dimension').map(f => (
                              <option key={f.name} value={f.name}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Y-Axis */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          {selectedEl.type === 'kpi' ? 'Value Field' : selectedEl.type === 'pie' ? 'Value Field' : 'Y-Axis / Measure'}
                        </label>
                        <select
                          value={fieldConfig.yAxis}
                          onChange={e => setFieldConfig(p => ({ ...p, yAxis: e.target.value }))}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">— Select field —</option>
                          {datasetFields.fields.filter(f => f.role === 'measure').map(f => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Aggregation */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Aggregation</label>
                        <div className="flex gap-1 flex-wrap">
                          {['SUM','AVG','COUNT','MAX','MIN'].map(agg => (
                            <button
                              key={agg}
                              onClick={() => setFieldConfig(p => ({ ...p, aggregation: agg }))}
                              className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${fieldConfig.aggregation === agg ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'}`}
                            >
                              {agg}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleFieldApply}
                        disabled={queryLoading}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-60"
                      >
                        <span className={`material-symbols-outlined text-sm ${queryLoading ? 'animate-spin' : ''}`}>
                          {queryLoading ? 'hourglass_empty' : 'play_arrow'}
                        </span>
                        {queryLoading ? 'Fetching...' : 'Apply & Fetch Data'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[10px] text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <span className="material-symbols-outlined text-2xl text-gray-300 block mb-1">touch_app</span>
                      Select a chart to configure its fields
                    </div>
                  )}

                  {/* All dataset fields list */}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Dimensions
                    </h3>
                    {datasetFields.fields.filter(f => f.role === 'dimension').map(field => (
                      <div key={field.name} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50">
                        <span className={`material-symbols-outlined text-sm ${field.type === 'date' ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {field.type === 'date' ? 'calendar_month' : 'abc'}
                        </span>
                        <span className="text-xs text-gray-600 font-medium truncate">{field.name}</span>
                      </div>
                    ))}
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span> Measures
                    </h3>
                    {datasetFields.fields.filter(f => f.role === 'measure').map(field => (
                      <div key={field.name} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50">
                        <span className="material-symbols-outlined text-sm text-orange-400">functions</span>
                        <span className="text-xs text-gray-600 font-medium truncate">{field.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AI INSIGHTS TAB ──────────────────────────────── */}
              {activeTab === 'insights' && (
                <div className="p-4 flex flex-col gap-3">
                  {!selectedVisual && !insightLoading && (
                    <div className="flex flex-col items-center text-center py-10 gap-3">
                      <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-violet-300">touch_app</span>
                      </div>
                      <p className="text-xs font-bold text-gray-400">Click any chart, KPI, or graph</p>
                      <p className="text-[10px] text-gray-400 leading-relaxed">AI will instantly analyse what that visual is showing and explain it in plain language.</p>
                    </div>
                  )}

                  {insightLoading && (
                    <div className="flex flex-col items-center text-center py-8 gap-3">
                      <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-2xl text-violet-400 animate-spin">psychology</span>
                      </div>
                      <p className="text-xs font-bold text-gray-400">Analysing your visual...</p>
                    </div>
                  )}

                  {!insightLoading && insight && (() => {
                    const el = canvasElements.find(e => e.id === selectedVisual);
                    const visual = VisualsLibrary.find(v => v.id === el?.type);
                    const lines = insight.split('\n').filter(l => l.trim());
                    const headline = lines[0];
                    const bullets = lines.slice(1);
                    return (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-xl border border-violet-100">
                          <span className="material-symbols-outlined text-violet-500 text-[18px]">{visual?.icon || 'bar_chart'}</span>
                          <div>
                            <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Analysing</p>
                            <p className="text-[11px] font-bold text-gray-700 truncate max-w-[180px]">{el?.title}</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-3 text-white">
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">auto_awesome</span>
                            <p className="text-[11px] font-semibold leading-relaxed">{headline}</p>
                          </div>
                        </div>
                        {bullets.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {bullets.map((b, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-violet-400 text-sm shrink-0 mt-0.5">•</span>
                                <p className="text-[10px] text-gray-600 leading-relaxed">{b.replace(/^[•\-\*]\s*/, '')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleSelectVisual(selectedVisual)}
                          className="flex items-center justify-center gap-1.5 w-full py-2 border border-violet-200 rounded-xl text-[10px] font-bold text-violet-500 hover:bg-violet-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Regenerate Insight
                        </button>
                      </div>
                    );
                  })()}

                  {/* No insight + visual selected (mock data case) */}
                  {!insightLoading && !insight && selectedVisual && (
                    <div className="flex flex-col items-center text-center py-6 gap-2">
                      <span className="material-symbols-outlined text-3xl text-gray-300">info</span>
                      <p className="text-xs font-bold text-gray-400">No data to analyse yet</p>
                      <p className="text-[10px] text-gray-400">Configure fields in the Fields tab and click "Apply" to load real data first.</p>
                      <button onClick={() => setActiveTab('fields')} className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-all">
                        Go to Fields →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom: Visual info */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                <span>Visual Selected</span>
                <span className="text-blue-600 truncate max-w-[140px]">
                  {selectedEl ? selectedEl.title : 'NONE'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── FULLSCREEN PREVIEW MODAL ───────────────────────────────── */}
      {isPreviewMode && (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
          <div className="h-12 bg-gray-900/95 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white/50 text-lg">visibility</span>
              <span className="text-sm font-bold text-white/80">{dashboard?.name || 'Dashboard Preview'}</span>
              <span className="text-[10px] bg-white/10 text-white/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">download</span>
                Save as PNG
              </button>
              <button onClick={() => setIsPreviewMode(false)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
                Exit Preview
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
            <div style={{ width: `${1600 * Math.min(1, (window.innerWidth - 64) / 1600)}px`, minHeight: `${900 * Math.min(1, (window.innerWidth - 64) / 1600)}px`, position: 'relative' }}>
              <div
                ref={previewRef}
                className="bg-white shadow-2xl relative"
                style={{ width: '1600px', minHeight: '900px', transform: `scale(${Math.min(1, (window.innerWidth - 64) / 1600)})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, borderRadius: '12px' }}
              >
                {canvasElements.map((el) => (
                  <CanvasElement key={el.id} element={el} isSelected={false} onSelect={() => {}} onUpdate={() => {}} onDelete={() => {}} zoomLevel={100} />
                ))}
                {canvasElements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-6xl mb-4">dashboard_customize</span>
                    <p className="text-lg font-bold">No visuals on canvas</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// CanvasElement — drag, resize, chart render
// ────────────────────────────────────────────────────────────────────
function CanvasElement({ element, isSelected, onSelect, onUpdate, onDelete, zoomLevel }) {
  const isDragging  = useRef(false);
  const isResizing  = useRef(false);
  const startPos    = useRef({ x: 0, y: 0 });
  const startDim    = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleMouseDown = (e, action) => {
    e.stopPropagation();
    onSelect(e);
    if (action === 'move')   isDragging.current  = true;
    if (action === 'resize') isResizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startDim.current = { w: element.w, h: element.h, x: element.x, y: element.y };

    const onMove = (mv) => {
      const dx = (mv.clientX - startPos.current.x) / (zoomLevel / 100);
      const dy = (mv.clientY - startPos.current.y) / (zoomLevel / 100);
      if (isDragging.current)  onUpdate({ x: Math.round(startDim.current.x + dx), y: Math.round(startDim.current.y + dy) });
      if (isResizing.current)  onUpdate({ w: Math.max(200, Math.round(startDim.current.w + dx)), h: Math.max(150, Math.round(startDim.current.h + dy)) });
    };
    const onUp = () => {
      isDragging.current = false; isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const visual = VisualsLibrary.find(v => v.id === element.type);

  const MOCK_DATA = [
    { name: 'Cat A', value: 4000 }, { name: 'Cat B', value: 3000 },
    { name: 'Cat C', value: 5000 }, { name: 'Cat D', value: 2000 }
  ];

  const data = element.data || MOCK_DATA;
  const isUsingMockData = !element.data;

  const renderChart = () => {
    if (element.type === 'kpi') {
      const val = data[0]?.value ?? 0;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-blue-600 tabular-nums">{val >= 1000 ? formatNumber(val) : val}</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{element.yAxis || 'Metric'}</span>
        </div>
      );
    }
    if (element.type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={formatNumber} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (element.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={formatNumber} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (element.type === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={formatNumber} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    if (element.type === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded border border-dashed border-gray-200">
        <span className="material-symbols-outlined text-4xl text-gray-300 opacity-50 mb-2">{visual?.icon}</span>
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{element.type} Visual</span>
      </div>
    );
  };

  return (
    <div
      className={`absolute group cursor-move transition-all duration-150 ${isSelected ? 'ring-2 ring-blue-500 shadow-xl z-30 bg-white' : 'hover:ring-1 hover:ring-gray-300 z-10 bg-white shadow-sm'}`}
      style={{ left: `${element.x}px`, top: `${element.y}px`, width: `${element.w}px`, height: `${element.h}px`, borderRadius: '8px' }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Title bar */}
      <div className={`h-10 flex items-center justify-between px-3 bg-white/90 border-b border-gray-100 rounded-t-lg transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-blue-500 text-[16px] shrink-0">{visual?.icon || 'insert_chart'}</span>
          <span className="text-[11px] font-bold text-gray-700 truncate">{element.title}</span>
          {isUsingMockData && (
            <span className="text-[8px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">SAMPLE</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1 hover:bg-gray-100 rounded text-gray-400" onMouseDown={e => e.stopPropagation()}>
            <span className="material-symbols-outlined text-[16px]">more_vert</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" onMouseDown={e => e.stopPropagation()}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize z-40 shadow-sm"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}

      {/* Chart render */}
      <div className="w-full select-none p-3" style={{ height: 'calc(100% - 40px)', minWidth: '100px', minHeight: '80px' }}>
        {mounted ? renderChart() : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-200 animate-pulse">hourglass_empty</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudioPage;
