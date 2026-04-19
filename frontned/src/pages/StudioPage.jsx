import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';
import { useDatasets } from '../context/DatasetContext';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const formatNumber = (num) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return parseFloat(num).toFixed(2);
};

const VisualsLibrary = [
  { id: 'bar', name: 'Bar Chart', icon: 'bar_chart', category: 'Comparison' },
  { id: 'line', name: 'Line Chart', icon: 'show_chart', category: 'Trends' },
  { id: 'pie', name: 'Pie Chart', icon: 'pie_chart', category: 'Composition' },
  { id: 'area', name: 'Area Chart', icon: 'area_chart', category: 'Trends' },
  { id: 'scatter', name: 'Scatter Plot', icon: 'scatter_plot', category: 'Relationship' },
  { id: 'kpi', name: 'KPI Card', icon: 'view_agenda', category: 'Key Metric' },
  { id: 'table', name: 'Data Table', icon: 'table_rows', category: 'Detail' },
  { id: 'map', name: 'Geo Map', icon: 'map', category: 'Geographic' },
  { id: 'gauge', name: 'Gauge', icon: 'speed', category: 'Key Metric' },
];

function StudioPage() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { datasets } = useDatasets();
  
  const [dashboard, setDashboard] = useState(null);
  const [datasetFields, setDatasetFields] = useState({ name: 'Loading...', fields: [] });

  const [activeTab, setActiveTab] = useState('fields'); 
  const [selectedVisual, setSelectedVisual] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [canvasElements, setCanvasElements] = useState([]);
  const canvasRef = useRef(null);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!dashboardId) return;
    
    const loadDashboard = async () => {
      try {
        const dbDash = await api(`/dashboards/${dashboardId}`);
        setDashboard(dbDash);
        
        if (dbDash.visuals_json && dbDash.visuals_json.length > 0) {
          setCanvasElements(dbDash.visuals_json);
        }

        let matchingDataset = datasets.find(d => d.id === dbDash.dataset_id);
        
        if (!matchingDataset) {
           const allDatasets = await api('/datasets');
           matchingDataset = allDatasets.find(d => d.id === dbDash.dataset_id);
        }

        if (matchingDataset && matchingDataset.schema) {
           const fields = matchingDataset.schema.map(col => {
             const isNum = ['BIGINT', 'DOUBLE', 'INTEGER', 'FLOAT', 'int', 'float', 'number'].includes(col.column_type?.toUpperCase() || 'STRING');
             const type = isNum ? 'number' : col.column_type === 'DATE' ? 'date' : 'string';
             const role = isNum ? 'measure' : 'dimension';
             return { name: col.column_name, type, role };
           });
           setDatasetFields({ name: matchingDataset.name, fields });
        } else if (matchingDataset) {
           // Fallback to filename if no schema
           setDatasetFields({ name: matchingDataset.name, fields: [] });
        } else {
           setDatasetFields({ name: 'Unknown Dataset', fields: [] });
        }

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      }
    };
    
    loadDashboard();
  }, [dashboardId, datasets]);

  const handleSave = async () => {
    if (!dashboardId) return;
    try {
      await api(`/dashboards/${dashboardId}`, {
        method: 'PUT',
        body: JSON.stringify({
           visuals_json: canvasElements,
           layout_json: [],
        })
      });
      alert('Dashboard saved successfully!');
    } catch (err) {
      console.error('Failed to save dashboard', err);
      alert('Failed to save dashboard');
    }
  };

  const handleAISuggest = async () => {
    if (!dashboard || !datasetFields.name) {
       alert("Need a dashboard and dataset attached to generate AI suggestions.");
       return;
    }

    setIsGenerating(true);
    try {
      const res = await api('/ai/auto-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           datasetName: datasetFields.name
        })
      });

      if (res.success && res.canvasElements) {
        setCanvasElements(res.canvasElements);
        
        // Auto-save the generated dashboard
        if (dashboardId) {
          try {
            await api(`/dashboards/${dashboardId}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: res.dashboardName || dashboard?.name,
                visuals_json: res.canvasElements,
                layout_json: [],
              })
            });
          } catch (saveErr) {
            console.warn('Auto-save after AI generation failed:', saveErr);
          }
        }
      }
    } catch(err) {
      console.error('AI Generation failed', err);
      alert('AI Generation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragStart = (e, type, fieldName = null) => {
    e.dataTransfer.setData('visualType', type);
    if (fieldName) {
      e.dataTransfer.setData('fieldName', fieldName);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('visualType');
    if (!type || type === 'dimension' || type === 'measure') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoomLevel / 100);
    const y = (e.clientY - rect.top) / (zoomLevel / 100);

    const newElement = {
      id: Date.now().toString(),
      type,
      x: x - 150,
      y: y - 100,
      w: 400,
      h: 300,
      title: VisualsLibrary.find(v => v.id === type)?.name || 'New Chart'
    };

    setCanvasElements([...canvasElements, newElement]);
    setSelectedVisual(newElement.id);
  };

  const updateElement = (id, updates) => {
    setCanvasElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    if (selectedVisual === id) setSelectedVisual(null);
  };

  return (
    <div className="h-screen flex bg-[#f0f2f5] overflow-hidden font-sans">
      <Sidebar />

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Toolbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
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

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Preview
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button 
              onClick={handleAISuggest}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all ${isGenerating ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
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
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-8 shrink-0 z-10 shadow-sm relative overflow-x-auto">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Insert Visuals</span>
             <div className="flex items-center gap-2">
                {VisualsLibrary.map(visual => (
                  <button
                    key={visual.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, visual.id)}
                    onClick={() => setSelectedVisual(visual.id)}
                    className={`flex flex-col items-center justify-center p-2 w-16 rounded-xl transition-all group border-2 ${
                      selectedVisual === visual.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm' 
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                    title={visual.name}
                  >
                    <span className="material-symbols-outlined text-[24px] mb-1">{visual.icon}</span>
                    <span className="text-[9px] font-medium truncate w-full text-center">
                      {visual.name}
                    </span>
                  </button>
                ))}
             </div>
          </div>
          
          <div className="h-12 w-px bg-gray-200 mt-4" />

          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Add Elements</span>
             <div className="flex items-center gap-2">
                  <button className="flex items-center justify-center flex-col gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all">
                    <span className="material-symbols-outlined text-[20px] text-emerald-500">title</span>
                    Text Box
                  </button>
                  <button className="flex items-center justify-center flex-col gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all">
                    <span className="material-symbols-outlined text-[20px] text-orange-500">crop_square</span>
                    Shapes
                  </button>
                  <button className="flex items-center justify-center flex-col gap-1 w-16 px-1 py-2 text-[9px] font-medium text-gray-600 hover:bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all">
                    <span className="material-symbols-outlined text-[20px] text-purple-500">image</span>
                    Image
                  </button>
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Center: Canvas Workspace */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#e9ecef] relative overflow-hidden">
            {/* Canvas Toolbar (Floating inside Canvas area) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-4 z-10 transition-all hover:bg-white cursor-default">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">remove</span>
                </button>
                <span className="text-[11px] font-bold text-gray-600 tabular-nums w-8 text-center">{zoomLevel}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                >
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

            {/* The Actual Canvas */}
            <div className="flex-1 overflow-auto p-12 flex justify-center items-start custom-scrollbar">
              <div 
                ref={canvasRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => setSelectedVisual(null)}
                className="bg-white shadow-xl shrink-0 relative studio-canvas-grid transform-gpu transition-transform border border-gray-200"
                style={{ 
                  width: '1600px', 
                  minHeight: '900px', // Landscape aspect ratio 16:9 like Power BI
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                {/* Visual Elements on Canvas */}
                {canvasElements.map((el) => (
                  <CanvasElement 
                    key={el.id}
                    element={el}
                    isSelected={selectedVisual === el.id}
                    onSelect={(e) => { e.stopPropagation(); setSelectedVisual(el.id); }}
                    onUpdate={(updates) => updateElement(el.id, updates)}
                    onDelete={() => deleteElement(el.id)}
                    zoomLevel={zoomLevel}
                  />
                ))}
                {/* Canvas Watermark/Instructions (Only show if empty) */}
                {canvasElements.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-[0.03] select-none pointer-events-none">
                    <span className="material-symbols-outlined text-[200px]">dashboard_customize</span>
                    <p className="text-4xl font-black uppercase tracking-tighter">AutoBI Canvas</p>
                  </div>
                )}

                {canvasElements.length === 0 && (
                  <div className="p-12 text-center mt-48 pointer-events-none">
                    <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-5xl">add_to_drive</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-400">Drag items from top ribbon to build</h3>
                    <p className="text-sm text-gray-400 mt-2">The landscape canvas is perfectly tuned for 16:9 dashboards.</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right: Data & Properties (Remains pinned strictly to right as requested) */}
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 relative">
            {/* Tab Switches */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
              <button 
                onClick={() => setActiveTab('fields')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'fields' ? 'text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Fields
                {activeTab === 'fields' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button 
                onClick={() => setActiveTab('format')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'format' ? 'text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Format
                {activeTab === 'format' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button 
                onClick={() => setActiveTab('filters')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'filters' ? 'text-blue-600 bg-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Filters
                {activeTab === 'filters' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'fields' && (
                <div className="p-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-blue-500 text-lg">data_usage</span>
                       <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]" title={datasetFields.name}>
                          {datasetFields.name}
                       </span>
                    </div>
                    <button className="text-[10px] text-blue-600 font-bold hover:underline">Change</button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Dimensions
                    </h3>
                    {datasetFields.fields.filter(f => f.role === 'dimension').map(field => (
                      <div key={field.name} draggable onDragStart={(e) => handleDragStart(e, 'dimension', field.name)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${field.type === 'date' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {field.type === 'date' ? 'calendar_month' : 'abc'}
                          </span>
                          <span className="text-xs text-gray-600 font-medium truncate max-w-[160px]">{field.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-sm text-gray-300 opacity-0 group-hover:opacity-100">drag_indicator</span>
                      </div>
                    ))}

                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-6 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400"></span> Measures
                    </h3>
                    {datasetFields.fields.filter(f => f.role === 'measure').map(field => (
                      <div key={field.name} draggable onDragStart={(e) => handleDragStart(e, 'measure', field.name)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-grab active:cursor-grabbing border border-transparent hover:border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-orange-400">functions</span>
                          <span className="text-xs text-gray-600 font-medium truncate max-w-[160px]">{field.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-sm text-gray-300 opacity-0 group-hover:opacity-100">drag_indicator</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'format' && (
                <div className="p-5 animate-in slide-in-from-right-4 duration-300">
                   <div className="text-center py-10">
                      <span className="material-symbols-outlined text-4xl text-gray-200">edit_note</span>
                      <p className="text-xs text-gray-400 mt-2">Select a visual to <br/> see formatting options</p>
                   </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="p-5 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Filters on this page</h4>
                    <p className="text-[10px] text-gray-400">No active filters.</p>
                  </div>
                  <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                    + Add Filter
                  </button>
                </div>
              )}
            </div>

            {/* Bottom: Visual State */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto">
               <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                  <span>Visual Selected</span>
                  <span className="text-blue-600">{selectedVisual ? selectedVisual.toUpperCase() : 'NONE'}</span>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CanvasElement({ element, isSelected, onSelect, onUpdate, onDelete, zoomLevel }) {
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startDim = useRef({ w: 0, h: 0, x: 0, y: 0 });

  const handleMouseDown = (e, action) => {
    e.stopPropagation();
    onSelect(e);
    
    if (action === 'move') isDragging.current = true;
    if (action === 'resize') isResizing.current = true;
    
    startPos.current = { x: e.clientX, y: e.clientY };
    startDim.current = { w: element.w, h: element.h, x: element.x, y: element.y };

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startPos.current.x) / (zoomLevel / 100);
      const dy = (moveEvent.clientY - startPos.current.y) / (zoomLevel / 100);

      if (isDragging.current) {
        onUpdate({
          x: Math.round(startDim.current.x + dx),
          y: Math.round(startDim.current.y + dy)
        });
      }

      if (isResizing.current) {
        onUpdate({
          w: Math.max(200, Math.round(startDim.current.w + dx)),
          h: Math.max(150, Math.round(startDim.current.h + dy))
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const visual = VisualsLibrary.find(v => v.id === element.type);

  // Render Real Chart Data via Recharts or Fallback mock
  const renderChart = () => {
    // If element.data exists, it was generated by AI Suggest ALASQL!
    const data = element.data || [
      { name: 'Cat A', value: 4000 },
      { name: 'Cat B', value: 3000 },
      { name: 'Cat C', value: 5000 },
      { name: 'Cat D', value: 2000 }
    ];

    if (element.type === 'kpi') {
      const val = data[0]?.value || 0;
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-blue-600 tabular-nums">
              {val > 1000 ? formatNumber(val) : val}
            </span>
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">
              {element.yAxis || 'Metric'}
            </span>
        </div>
      );
    }

    if (element.type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%" minWidth={50} minHeight={50}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={formatNumber} />
            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={formatNumber} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
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
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6b7280'}} tickFormatter={formatNumber} />
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded border border-dashed border-gray-200">
         <span className="material-symbols-outlined text-4xl text-gray-300 opacity-50 mb-2">{visual?.icon}</span>
         <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
           {element.type.toUpperCase()} Visual
         </span>
      </div>
    );
  };

  return (
    <div 
      className={`absolute group cursor-move transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-xl z-30 bg-white' : 'hover:ring-1 hover:ring-gray-300 z-10 bg-white shadow-sm'
      }`}
      style={{ 
        left: `${element.x}px`, 
        top: `${element.y}px`, 
        width: `${element.w}px`, 
        height: `${element.h}px`,
        borderRadius: '8px'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* INTERNAL Title Bar (Replaces old absolute top-10 overlap) */}
      <div className={`h-10 flex items-center justify-between px-3 bg-white/90 border-b border-gray-100 rounded-t-lg transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
           <span className="material-symbols-outlined text-blue-500 text-[16px] shrink-0">{visual?.icon || 'insert_chart'}</span>
           <span className="text-[11px] font-bold text-gray-700 truncate">{element.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
           <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
              <span className="material-symbols-outlined text-[16px]">more_vert</span>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(); }}
             className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
           >
              <span className="material-symbols-outlined text-[16px]">close</span>
           </button>
        </div>
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div 
          className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize z-40 shadow-sm"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}

      {/* Chart Render Area */}
      <div className="w-full select-none p-4" style={{ height: 'calc(100% - 40px)', minWidth: '100px', minHeight: '80px' }}>
        {renderChart()}
      </div>
    </div>
  );
}

export default StudioPage;
