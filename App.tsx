
import React, { useState, useMemo } from 'react';
import { Mooring, MooringStatus, Boat } from './types';
import { INITIAL_MOORINGS, STATUS_COLORS } from './constants';
import MooringMap from './components/MooringMap';
import MooringEditor from './components/MooringEditor';
import StatsPanel from './components/StatsPanel';
import Calculator from './components/Calculator';
import { getMooringAdvice } from './services/geminiService';
import { Search, Ship, LayoutGrid, BarChart3, Bot, Menu, Anchor, RefreshCw, Calculator as CalcIcon } from 'lucide-react';

const App: React.FC = () => {
  const [moorings, setMoorings] = useState<Mooring[]>(INITIAL_MOORINGS);
  const [selectedMooring, setSelectedMooring] = useState<Mooring | null>(moorings[0]);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats' | 'ai' | 'calculator'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMessage, setAiMessage] = useState<string>('¡Hola! Soy tu asistente de puerto. ¿En qué puedo ayudarte hoy?');
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transitingBoat, setTransitingBoat] = useState<{ boat: Boat; sourceId: string; targetId: string } | null>(null);

  const filteredMoorings = useMemo(() => {
    return moorings.filter(m => 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [moorings, searchQuery]);

  const handleUpdateMooring = (updated: Mooring) => {
    setMoorings(prev => prev.map(m => m.id === updated.id ? updated : m));
    if (selectedMooring?.id === updated.id) {
      setSelectedMooring(updated);
    }
  };

  const handleMoveBoat = (sourceId: string, targetId: string) => {
    const sourceMooring = moorings.find(m => m.id === sourceId);
    if (!sourceMooring || !sourceMooring.boat) return;

    setTransitingBoat({
      boat: sourceMooring.boat,
      sourceId,
      targetId
    });

    setMoorings(prev => prev.map(m => 
      m.id === sourceId ? { ...m, boat: undefined, status: MooringStatus.AVAILABLE } : m
    ));
    
    setSelectedMooring(null);
  };

  const handleAnimationComplete = (targetId: string, boat: Boat) => {
    setMoorings(prev => prev.map(m => 
      m.id === targetId ? { ...m, boat: boat, status: MooringStatus.OCCUPIED } : m
    ));
    setTransitingBoat(null);
    
    const newMooring = moorings.find(m => m.id === targetId);
    if (newMooring) setSelectedMooring({ ...newMooring, boat, status: MooringStatus.OCCUPIED });
  };

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await getMooringAdvice(moorings, aiInput);
      setAiMessage(response || "No tengo una respuesta clara ahora mismo.");
    } catch (error) {
      setAiMessage("Error de conexión con el servicio de IA.");
    } finally {
      setIsAiLoading(false);
      setAiInput('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}/>}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 mb-8">
          <Ship className="text-amber-400" size={24} />
          <h1 className="text-xl font-bold tracking-tight">MarinaPro</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          {[
            { id: 'map', label: 'Mapa', icon: LayoutGrid },
            { id: 'list', label: 'Listado', icon: Search },
            { id: 'stats', label: 'Analítica', icon: BarChart3 },
            { id: 'calculator', label: 'Calculadora', icon: CalcIcon },
            { id: 'ai', label: 'IA Advisor', icon: Bot },
          ].map((item) => (
            <button key={item.id} onClick={() => {setActiveTab(item.id as any); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl capitalize transition-all ${activeTab === item.id ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
              <item.icon size={20}/>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">
            Diseño creado por<br/>Martín González
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button>
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">CN Camariñas</h2>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {activeTab === 'map' ? 'Mapa Interactivo' : activeTab === 'list' ? 'Gestión' : activeTab === 'stats' ? 'Estado' : activeTab === 'calculator' ? 'Cálculos Rápidos' : 'IA Advisor'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col relative min-h-[500px] lg:min-h-0">
            {activeTab === 'map' ? (
              <MooringMap 
                moorings={moorings} 
                onSelectMooring={setSelectedMooring} 
                selectedId={selectedMooring?.id || null} 
                transitingBoat={transitingBoat}
                onAnimationComplete={handleAnimationComplete}
              />
            ) : activeTab === 'list' ? (
               <div className="p-4 overflow-auto h-full">
                 <table className="w-full text-left">
                   <thead><tr className="text-xs uppercase text-slate-500 border-b font-bold"><th className="pb-2">ID</th><th className="pb-2">Estado</th><th className="pb-2">Embarcación</th><th className="pb-2 text-right">Dimensiones</th></tr></thead>
                   <tbody>
                     {filteredMoorings.map(m => (
                       <tr key={m.id} className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0" onClick={() => setSelectedMooring(m)}>
                         <td className="py-4 font-bold text-slate-900">{m.id}</td>
                         <td><span className={`px-2 py-0.5 rounded text-[10px] text-white font-bold ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                         <td className="text-sm font-medium">{m.boat?.name || '-'}</td>
                         <td className="text-right text-xs text-slate-500">{m.maxDimensions.length}x{m.maxDimensions.beam}m</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : activeTab === 'stats' ? <div className="p-6 overflow-auto"><StatsPanel moorings={moorings}/></div> : 
             activeTab === 'calculator' ? <div className="p-6 flex items-center justify-center h-full bg-slate-50"><Calculator /></div> :
             <div className="p-6 flex flex-col h-full max-w-2xl mx-auto w-full">
               <div className="flex-1 bg-slate-50 border rounded-2xl p-6 mb-4 overflow-auto space-y-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{aiMessage}</p>
                 </div>
               </div>
               <div className="flex gap-2 bg-white p-2 border rounded-2xl shadow-lg">
                 <input className="flex-1 px-4 py-2 outline-none text-sm" placeholder="Pregunta algo sobre la gestión del puerto..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()}/>
                 <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition-all" onClick={handleAiAsk} disabled={isAiLoading}>{isAiLoading ? 'Pensando...' : 'Preguntar'}</button>
               </div>
             </div>
            }
          </div>

          <div className="w-full lg:w-80 shrink-0 space-y-4 flex flex-col lg:h-full">
            <div className="flex-1 overflow-y-visible lg:overflow-y-auto min-h-0">
              {selectedMooring ? (
                <MooringEditor 
                  mooring={selectedMooring} 
                  allMoorings={moorings}
                  onUpdate={handleUpdateMooring} 
                  onMoveBoat={handleMoveBoat}
                  onClose={() => setSelectedMooring(null)}
                />
              ) : (
               <div className="bg-white rounded-2xl border p-8 text-center text-slate-400 border-dashed border-2 flex flex-col items-center justify-center h-48 lg:h-full">
                 <Anchor size={32} className="opacity-20 mb-2"/>
                 <p className="text-xs font-bold uppercase tracking-widest">Selecciona un amarre</p>
               </div>
              )}
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw size={80} className="rotate-12" /></div>
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">Resumen de Estado</h3>
              <div className="space-y-3 relative z-10">
                {Object.entries(MooringStatus).map(([key, val]) => (
                  <div key={val} className="flex justify-between items-center text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[val as MooringStatus]}`}></div>
                      <span className="text-slate-300 uppercase">{val}</span>
                    </div>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black">{moorings.filter(m => m.status === val).length}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
