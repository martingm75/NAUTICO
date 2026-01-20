
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Mooring, MooringStatus, Boat, TariffSeason } from './types';
import { INITIAL_MOORINGS, STATUS_COLORS, INITIAL_TARIFFS, STATUS_LABELS } from './constants';
import MooringMap from './components/MooringMap';
import MooringEditor from './components/MooringEditor';
import StatsPanel from './components/StatsPanel';
import Calculator from './components/Calculator';
import TariffManager from './components/TariffManager';
import RegistryManager from './components/RegistryManager';
import { getMooringAdvice } from './services/geminiService';
import { Search, Ship, LayoutGrid, BarChart3, Bot, Menu, Anchor, RefreshCw, Calculator as CalcIcon, Euro, Database, Container } from 'lucide-react';

const App: React.FC = () => {
  // --- ESTADO DE AMARRES CON PERSISTENCIA ---
  const [moorings, setMoorings] = useState<Mooring[]>(() => {
    try {
      const savedMoorings = localStorage.getItem('marina_moorings_data');
      return savedMoorings ? JSON.parse(savedMoorings) : INITIAL_MOORINGS;
    } catch (error) {
      console.error("Error cargando amarres:", error);
      return INITIAL_MOORINGS;
    }
  });

  // --- ESTADO DE TARIFAS CON PERSISTENCIA ---
  const [tariffs, setTariffs] = useState<TariffSeason[]>(() => {
    try {
      const savedTariffs = localStorage.getItem('marina_tariffs_data');
      return savedTariffs ? JSON.parse(savedTariffs) : INITIAL_TARIFFS;
    } catch (error) {
      console.error("Error cargando tarifas:", error);
      return INITIAL_TARIFFS;
    }
  });

  // --- ESTADO DEL REGISTRO DE BARCOS CON PERSISTENCIA ---
  const [boatRegistry, setBoatRegistry] = useState<Boat[]>(() => {
    try {
      const savedRegistry = localStorage.getItem('marina_boat_registry');
      if (savedRegistry) return JSON.parse(savedRegistry);
      
      // Si el registro está vacío, lo inicializamos con los barcos que hay en los amarres iniciales
      return INITIAL_MOORINGS.filter(m => m.boat).map(m => m.boat!);
    } catch (error) {
      console.error("Error cargando registro:", error);
      return [];
    }
  });

  const [selectedMooring, setSelectedMooring] = useState<Mooring | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats' | 'ai' | 'calculator' | 'tariffs' | 'registry' | 'dry_dock'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMessage, setAiMessage] = useState<string>('¡Hola! Soy tu asistente de puerto. ¿En qué puedo ayudarte hoy?');
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transitingBoat, setTransitingBoat] = useState<{ boat: Boat; sourceId: string; targetId: string } | null>(null);

  // --- EFECTOS DE GUARDADO AUTOMÁTICO ---
  useEffect(() => {
    localStorage.setItem('marina_moorings_data', JSON.stringify(moorings));
  }, [moorings]);

  useEffect(() => {
    localStorage.setItem('marina_tariffs_data', JSON.stringify(tariffs));
  }, [tariffs]);

  useEffect(() => {
    localStorage.setItem('marina_boat_registry', JSON.stringify(boatRegistry));
  }, [boatRegistry]);


  const filteredMoorings = useMemo(() => {
    return moorings.filter(m => 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [moorings, searchQuery]);

  const activeBoatIds = useMemo(() => {
    return moorings
      .filter(m => (m.status === MooringStatus.OCCUPIED || m.status === MooringStatus.RESERVED) && m.boat)
      .map(m => m.boat!.id);
  }, [moorings]);

  // Sincronizar un barco individual con el registro
  const syncBoatToRegistry = useCallback((boat: Boat) => {
    setBoatRegistry(prev => {
      const exists = prev.some(b => b.id === boat.id);
      if (exists) {
        return prev.map(b => b.id === boat.id ? { ...b, ...boat } : b);
      }
      return [...prev, boat];
    });
  }, []);

  const handleUpdateMooring = (updated: Mooring) => {
    if (updated.boat) {
      if (!updated.boat.arrivalDate) {
        updated.boat.arrivalDate = new Date().toISOString().split('T')[0];
      }
      syncBoatToRegistry(updated.boat);
    }

    const oldMooring = moorings.find(m => m.id === updated.id);
    const isNewArrival = oldMooring?.status === MooringStatus.AVAILABLE && updated.status === MooringStatus.OCCUPIED && updated.boat;

    if (isNewArrival && updated.boat) {
      setTransitingBoat({
        boat: updated.boat,
        sourceId: 'ENTRY',
        targetId: updated.id
      });
      setActiveTab('map');
      setSelectedMooring(null);
      return; 
    }

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
    setActiveTab('map');
  };

  const handleDeparture = useCallback((mooringId: string, boatData?: Boat) => {
    const mooring = moorings.find(m => m.id === mooringId);
    const boatToDepart = boatData || mooring?.boat;

    if (!boatToDepart) return;

    // 1. Iniciamos animación de salida
    setTransitingBoat({
      boat: { ...boatToDepart },
      sourceId: mooringId,
      targetId: 'EXIT'
    });

    // 2. Liberamos la plaza físicamente
    setMoorings(prev => prev.map(m => 
      m.id === mooringId ? { ...m, boat: undefined, status: MooringStatus.AVAILABLE } : m
    ));

    // 3. ACTUALIZACIÓN CRÍTICA: Trasladar al registro histórico con fecha de salida
    const today = new Date().toISOString().split('T')[0];
    setBoatRegistry(prev => {
      const exists = prev.some(b => b.id === boatToDepart.id);
      const updatedBoat = { ...boatToDepart, departureDate: today, inDryDock: false };
      
      if (exists) {
        return prev.map(b => b.id === boatToDepart.id ? updatedBoat : b);
      } else {
        return [...prev, updatedBoat];
      }
    });

    setActiveTab('map');
    setSelectedMooring(null);
  }, [moorings]);

  const handleAnimationComplete = (targetId: string, boat: Boat) => {
    if (targetId === 'EXIT') {
      setTransitingBoat(null);
      return;
    }

    const boatWithArrivalDate = {
      ...boat,
      arrivalDate: boat.arrivalDate || new Date().toISOString().split('T')[0]
    };

    // Al llegar a una plaza, nos aseguramos de que esté en el registro
    syncBoatToRegistry(boatWithArrivalDate);

    setMoorings(prev => prev.map(m => 
      m.id === targetId ? { ...m, boat: boatWithArrivalDate, status: MooringStatus.OCCUPIED } : m
    ));
    setTransitingBoat(null);
    
    const newMooring = moorings.find(m => m.id === targetId);
    if (newMooring) {
      setTimeout(() => {
         setSelectedMooring({ ...newMooring, boat: boatWithArrivalDate, status: MooringStatus.OCCUPIED });
      }, 100);
    }
  };

  const handleAssignRegistryBoat = (boat: Boat, mooringId: string) => {
    const boatToDock = {
      ...boat,
      inDryDock: false,
      arrivalDate: new Date().toISOString().split('T')[0],
      departureDate: '' 
    };

    syncBoatToRegistry(boatToDock);
    setTransitingBoat({
      boat: boatToDock,
      sourceId: 'ENTRY',
      targetId: mooringId
    });
    setActiveTab('map');
    setSelectedMooring(null);
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
          <h1 className="text-xl font-bold tracking-tight uppercase">MarinaPro</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          {[
            { id: 'map', label: 'Plano de Puerto', icon: LayoutGrid },
            { id: 'registry', label: 'Registro Central', icon: Database },
            { id: 'dry_dock', label: 'Marina Seca', icon: Container },
            { id: 'list', label: 'Gestión Listado', icon: Search },
            { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
            { id: 'tariffs', label: 'Tarifas', icon: Euro },
            { id: 'calculator', label: 'Calculadora', icon: CalcIcon },
            { id: 'ai', label: 'Asistente IA', icon: Bot },
          ].map((item) => (
            <button key={item.id} onClick={() => {setActiveTab(item.id as any); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl capitalize transition-all text-xs font-bold tracking-widest ${activeTab === item.id ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={18}/>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">
            Gestión Náutica Camariñas<br/>v2.5 Full Registry
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button>
            <div className="flex items-baseline gap-2">
              <Anchor className="text-amber-400 self-center mr-1" size={20} />
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">CN Camariñas</h2>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {activeTab === 'map' ? 'Control de Accesos' : 
                 activeTab === 'registry' ? 'Registro Histórico' :
                 activeTab === 'dry_dock' ? 'Marina Seca' :
                 activeTab === 'list' ? 'Gestión' : 
                 activeTab === 'stats' ? 'Analítica' : 
                 activeTab === 'tariffs' ? 'Precios' : 
                 activeTab === 'calculator' ? 'Cálculos' : 'Asistente Inteligente'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col relative min-h-[500px] lg:min-h-0">
            {activeTab === 'map' ? (
              <MooringMap moorings={moorings} onSelectMooring={setSelectedMooring} selectedId={selectedMooring?.id || null} transitingBoat={transitingBoat} onAnimationComplete={handleAnimationComplete} />
            ) : (activeTab === 'registry' || activeTab === 'dry_dock') ? (
              <RegistryManager registry={boatRegistry} moorings={moorings} activeBoatIds={activeBoatIds} onUpdateRegistry={setBoatRegistry} onAssignToMooring={handleAssignRegistryBoat} initialTab={activeTab === 'dry_dock' ? 'dry_dock' : undefined} />
            ) : activeTab === 'list' ? (
               <div className="p-4 overflow-auto h-full">
                 <table className="w-full text-left">
                   <thead className="sticky top-0 bg-white"><tr className="text-[10px] uppercase text-slate-400 border-b font-black tracking-widest"><th className="pb-4">Amarre</th><th className="pb-4">Estado</th><th className="pb-4">Embarcación</th><th className="pb-4">Patrón</th><th className="pb-4 text-right">Dimensiones</th></tr></thead>
                   <tbody>
                     {filteredMoorings.map(m => (
                       <tr key={m.id} className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0" onClick={() => setSelectedMooring(m)}>
                         <td className="py-4 font-black text-slate-900">{m.id}</td>
                         <td><span className={`px-2 py-0.5 rounded text-[9px] text-white font-black uppercase tracking-tighter ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span></td>
                         <td className="text-xs font-bold text-slate-700 uppercase">{m.boat?.name || '-'}</td>
                         <td className="text-[10px] font-medium text-slate-500 uppercase">{m.boat?.owner || '-'}</td>
                         <td className="text-right text-[10px] font-black text-slate-400">{m.maxDimensions.length}x{m.maxDimensions.beam}m</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : activeTab === 'stats' ? <div className="p-6 overflow-auto"><StatsPanel moorings={moorings}/></div> : 
             activeTab === 'calculator' ? <div className="p-6 flex items-center justify-center h-full bg-slate-50"><Calculator /></div> :
             activeTab === 'tariffs' ? <div className="h-full"><TariffManager tariffs={tariffs} onUpdate={setTariffs} /></div> :
             <div className="p-6 flex flex-col h-full max-w-2xl mx-auto w-full">
               <div className="flex-1 bg-slate-50 border rounded-2xl p-6 mb-4 overflow-auto space-y-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{aiMessage}</p>
                 </div>
               </div>
               <div className="flex gap-2 bg-white p-2 border rounded-2xl shadow-lg">
                 <input className="flex-1 px-4 py-2 outline-none text-sm" placeholder="Consulta estado del puerto o asignaciones..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiAsk()}/>
                 <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition-all" onClick={handleAiAsk} disabled={isAiLoading}>{isAiLoading ? 'Pensando...' : 'Preguntar'}</button>
               </div>
             </div>
            }
          </div>

          {activeTab !== 'tariffs' && activeTab !== 'registry' && activeTab !== 'dry_dock' && (
            <div className="w-full lg:w-80 shrink-0 space-y-4 flex flex-col lg:h-full">
              <div className="flex-1 overflow-y-visible lg:overflow-y-auto min-h-0">
                {selectedMooring ? (
                  <MooringEditor mooring={selectedMooring} allMoorings={moorings} onUpdate={handleUpdateMooring} onMoveBoat={handleMoveBoat} onDepart={handleDeparture} onClose={() => setSelectedMooring(null)} />
                ) : (
                <div className="bg-white rounded-2xl border p-8 text-center text-slate-300 border-dashed border-2 flex flex-col items-center justify-center h-48 lg:h-full">
                  <Anchor size={32} className="opacity-10 mb-2"/>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Gestión de Amarre</p>
                  <p className="text-[9px] text-slate-400 mt-2">Seleccione una plaza en el plano para editar</p>
                </div>
                )}
              </div>
              
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw size={80} className="rotate-12" /></div>
                <h3 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Resumen General</h3>
                <div className="space-y-3 relative z-10">
                  {Object.entries(MooringStatus).map(([key, val]) => (
                    <div key={val} className="flex justify-between items-center text-[10px] font-black tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[val as MooringStatus]}`}></div>
                        <span className="text-slate-400">{STATUS_LABELS[val as MooringStatus]}</span>
                      </div>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[9px]">{moorings.filter(m => m.status === val).length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
