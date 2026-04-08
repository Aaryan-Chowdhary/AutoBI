import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';

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

  const [activeTab, setActiveTab] = useState('fields'); // fields, format, filters
  const [selectedVisual, setSelectedVisual] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [canvasElements, setCanvasElements] = useState([]);
  const canvasRef = useRef(null);

  // Load dashboard from API
  useEffect(() => {
    if (!dashboardId) return;
    
    const loadDashboard = async () => {
      try {
        const dbDash = await api(`/dashboards/${dashboardId}`);
        setDashboard(dbDash);
        
        // Load layout/visuals if they exist
        if (dbDash.visuals_json && dbDash.visuals_json.length > 0) {
          setCanvasElements(dbDash.visuals_json);
        }

        // Find associated dataset to parse schema
        let matchingDataset = datasets.find(d => d.id === dbDash.dataset_id);
        
        // Fallback: If context is empty (e.g. direct refresh), fetch manually
        if (!matchingDataset) {
           const allDatasets = await api('/datasets');
           matchingDataset = allDatasets.find(d => d.id === dbDash.dataset_id);
        }

        if (matchingDataset && matchingDataset.schema) {
           const fields = matchingDataset.schema.map(col => {
             // Basic DuckDB typing heuristic
             const isNum = ['BIGINT', 'DOUBLE', 'INTEGER', 'FLOAT'].includes(col.column_type);
             const type = isNum ? 'number' : col.column_type === 'DATE' ? 'date' : 'string';
             const role = isNum ? 'measure' : 'dimension';
             return { name: col.column_name, type, role };
           });
           setDatasetFields({ name: matchingDataset.name, fields });
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
      x: x - 150, // Center on mouse (assuming 300px width)
      y: y - 100, // Center on mouse (assuming 200px height)
      w: 300,
      h: 200,
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
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
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
            <button className="flex items-center gap-2 px-4 py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              AI Suggest
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-blue-600 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-all">
              Save
            </button>
          </div>
        </header>

        {/* Content Body: 3 Columns */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Visuals Library */}
          <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Visualizations</h2>
              <div className="grid grid-cols-3 gap-2">
                {VisualsLibrary.map((visual) => (
                  <button
                    key={visual.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, visual.id)}
                    onClick={() => setSelectedVisual(visual.id)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all group active:cursor-grabbing cursor-grab ${
                      selectedVisual === visual.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-transparent bg-gray-50 hover:border-gray-200 hover:bg-white'
                    }`}
                    title={visual.name}
                  >
                    <span className={`material-symbols-outlined text-xl ${
                      selectedVisual === visual.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      {visual.icon}
                    </span>
                    <span className="text-[9px] mt-1 font-medium text-gray-500 group-hover:text-gray-700 truncate w-full px-1 text-center">
                      {visual.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              <div>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Add Elements</h2>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                    <span className="material-symbols-outlined text-lg text-emerald-500">title</span>
                    Text Label
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                    <span className="material-symbols-outlined text-lg text-orange-500">crop_square</span>
                    Shapes & Frames
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                    <span className="material-symbols-outlined text-lg text-purple-500">image</span>
                    Image Upload
                  </button>
                </div>
              </div>

              <div className="mt-auto p-4 bg-linear-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-100">
                <p className="text-[11px] font-bold text-blue-700 mb-1">Pro Tip</p>
                <p className="text-[10px] text-blue-600/80 leading-relaxed">
                  Drag any visual to the canvas to start building your report.
                </p>
              </div>
            </div>
          </aside>

          {/* Center: Canvas Workspace */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#e9ecef] relative overflow-hidden">
            {/* Canvas Toolbar (Floating) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 flex items-center gap-4 z-10 transition-all hover:bg-white cursor-default">
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
                className="bg-white shadow-2xl shrink-0 relative studio-canvas-grid transform-gpu transition-transform"
                style={{ 
                  width: '1080px', 
                  minHeight: '1440px',
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
                    <p className="text-4xl font-black uppercase tracking-tighter">AutoBI Studio Canvas</p>
                  </div>
                )}

                {canvasElements.length === 0 && (
                  <div className="p-12 text-center mt-32 pointer-events-none">
                    <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-5xl">add_to_drive</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-300">Drag items here to start building</h3>
                    <p className="text-sm text-gray-400 mt-2">The canvas is your playground.</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right: Data & Properties */}
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0">
            {/* Tab Switches */}
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('fields')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'fields' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Fields
                {activeTab === 'fields' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button 
                onClick={() => setActiveTab('format')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'format' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Format
                {activeTab === 'format' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
              <button 
                onClick={() => setActiveTab('filters')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'filters' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Filters
                {activeTab === 'filters' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'fields' && (
                <div className="p-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-blue-500 text-lg">data_usage</span>
                       <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]" title={datasetFields.name}>
                          {datasetFields.name}
                       </span>
                    </div>
                    <button className="text-[10px] text-blue-600 font-bold hover:underline">Change</button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Dimensions</h3>
                    {datasetFields.fields.filter(f => f.role === 'dimension').map(field => (
                      <div key={field.name} draggable onDragStart={(e) => handleDragStart(e, 'dimension', field.name)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${field.type === 'date' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {field.type === 'date' ? 'calendar_month' : 'abc'}
                          </span>
                          <span className="text-xs text-gray-600 font-medium">{field.name}</span>
                        </div>
                        <span className="material-symbols-outlined text-sm text-gray-300 opacity-0 group-hover:opacity-100">drag_indicator</span>
                      </div>
                    ))}

                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 mt-4">Measures</h3>
                    {datasetFields.fields.filter(f => f.role === 'measure').map(field => (
                      <div key={field.name} draggable onDragStart={(e) => handleDragStart(e, 'measure', field.name)} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-orange-400">functions</span>
                          <span className="text-xs text-gray-600 font-medium">{field.name}</span>
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
            <div className="p-4 border-t border-gray-200 bg-gray-50">
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
          w: Math.max(100, Math.round(startDim.current.w + dx)),
          h: Math.max(100, Math.round(startDim.current.h + dy))
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

  return (
    <div 
      className={`absolute group cursor-move transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 shadow-xl z-20' : 'hover:ring-1 hover:ring-blue-300 z-10'
      }`}
      style={{ 
        left: `${element.x}px`, 
        top: `${element.y}px`, 
        width: `${element.w}px`, 
        height: `${element.h}px`,
        backgroundColor: 'white'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Top Bar for Dragging and Actions */}
      <div className={`absolute -top-10 left-0 right-0 h-8 flex items-center justify-between px-2 bg-white rounded-lg shadow-lg border border-gray-100 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100'}`}>
        <div className="flex items-center gap-2">
           <span className="material-symbols-outlined text-blue-500 text-sm">{visual?.icon || 'insert_chart'}</span>
           <span className="text-[10px] font-bold text-gray-700">{element.title}</span>
        </div>
        <div className="flex items-center gap-1">
           <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
              <span className="material-symbols-outlined text-sm">settings</span>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(); }}
             className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
           >
              <span className="material-symbols-outlined text-sm">delete</span>
           </button>
        </div>
      </div>

      {/* Resize Handle */}
      {isSelected && (
        <div 
          className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize z-30 shadow-sm"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}

      {/* Mock Chart Content */}
      <div className="w-full h-full flex flex-col p-4 border border-gray-100 rounded-sm overflow-hidden select-none">
        <div className="flex-1 flex items-center justify-center bg-gray-50/50 rounded border border-dashed border-gray-100 relative">
           <span className="material-symbols-outlined text-4xl text-gray-100 absolute opacity-30">{visual?.icon}</span>
           <div className="w-full h-full flex items-end justify-between px-4 pb-4 gap-2">
              {element.type === 'bar' && [40, 70, 50, 90, 60].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
              {element.type === 'line' && (
                <svg className="w-full h-full overflow-visible">
                   <polyline points="0,50 40,30 80,60 120,40 200,10" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {element.type === 'pie' && (
                <div className="w-20 h-20 rounded-full border-10 border-blue-100 border-r-blue-300 border-t-indigo-100" />
              )}
              {element.type === 'kpi' && (
                <div className="text-center">
                   <p className="text-2xl font-black text-blue-600">$12,480</p>
                   <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Revenue</p>
                </div>
              )}
              {(!['bar', 'line', 'pie', 'kpi'].includes(element.type)) && (
                <div className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                  {element.type.toUpperCase()} Visual
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

export default StudioPage;
