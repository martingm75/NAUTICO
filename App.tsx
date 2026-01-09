
import React, { useState, useEffect, useMemo } from 'react';
import { Mooring, MooringStatus } from './types';
import { INITIAL_MOORINGS, STATUS_COLORS, BASE_BOAT_COLOR } from './constants';
import MooringMap from './components/MooringMap';
import MooringEditor from './components/MooringEditor';
import StatsPanel from './components/StatsPanel';
import { getMooringAdvice } from './services/geminiService';
import { Search, Ship, LayoutGrid, BarChart3, Bot, Menu, X, Info, Anchor } from 'lucide-react';

const App: React.FC = () => {
  const [moorings, setMoorings] = useState<Mooring[]>(INITIAL_MOORINGS);
  const [selectedMooring, setSelectedMooring] = useState<Mooring | null>(moorings[0]);
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats' | 'ai'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMessage, setAiMessage] = useState<string>('¡Hola! Soy tu asistente de puerto. ¿En qué puedo ayudarte hoy?');
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredMoorings = useMemo(() => {
    return moorings.filter(m => 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.boat?.owner.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [moorings, searchQuery]);

  const handleUpdateMooring = (updated: Mooring) => {
    setMoorings(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelectedMooring(updated);
  };

  const handleAiAsk = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await getMooringAdvice(moorings, aiInput);
      setAiMessage(response || "Lo siento, no he podido procesar tu solicitud.");
    } catch (error) {
      setAiMessage("Hubo un error al conectar con el servidor de IA.");
    } finally {
      setIsAiLoading(false);
      setAiInput('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 border-r border-slate-800
      `}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Ship className="text-amber-400" size={24} />
            <h1 className="text-xl font-bold tracking-tight">MarinaPro</h1>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          <button 
            onClick={() => {setActiveTab('map'); setSidebarOpen(false);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'map' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <LayoutGrid size={20} /> Mapa
          </button>
          <button 
            onClick={() => {setActiveTab('list'); setSidebarOpen(false);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Search size={20} /> Listado
          </button>
          <button 
            onClick={() => {setActiveTab('stats'); setSidebarOpen(false);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 size={20} /> Estadísticas
          </button>
          <button 
            onClick={() => {setActiveTab('ai'); setSidebarOpen(false);}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Bot size={20} /> IA
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'map' ? 'Mapa' : activeTab === 'list' ? 'Gestión' : activeTab === 'stats' ? 'Analítica' : 'IA'}
            </h2>
          </div>
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar barco, socio..."
              className="w-full bg-slate-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
              {activeTab === 'map' ? (
                <div className="flex-1 w-full h-full p-0">
                  <MooringMap 
                    moorings={moorings} 
                    onSelectMooring={setSelectedMooring} 
                    selectedId={selectedMooring?.id || null} 
                  />
                </div>
              ) : activeTab === 'list' ? (
                <div className="flex-1 overflow-auto p-4">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold sticky top-0">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Barco</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMoorings.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 group cursor-pointer" onClick={() => setSelectedMooring(m)}>
                          <td className="px-4 py-4 font-bold">{m.id}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold text-white ${STATUS_COLORS[m.status]}`}>
                                {m.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm">{m.boat?.name || '-'}</td>
                          <td className="px-4 py-4">
                            <button className="text-sky-600 font-bold text-xs hover:underline">GESTIONAR</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'stats' ? (
                <div className="p-6 h-full overflow-y-auto"><StatsPanel moorings={moorings} /></div>
              ) : (
                <div className="h-full flex flex-col p-6 max-w-2xl mx-auto w-full">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm"><Bot className="text-sky-600" size={24} /></div>
                        <div>
                          <p className="font-bold text-sky-900 mb-1 uppercase text-xs tracking-wider">Marina AI Advisor</p>
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {isAiLoading ? (
                              <div className="flex gap-1 items-center mt-2">
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                              </div>
                            ) : aiMessage}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                    <input 
                      className="flex-1 bg-transparent rounded-xl px-4 py-3 outline-none text-sm font-medium"
                      placeholder="Ej: ¿Qué amarres de 12m están libres?"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                    />
                    <button 
                      onClick={handleAiAsk}
                      disabled={isAiLoading}
                      className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-all active:scale-95"
                    >
                      Preguntar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto h-auto lg:h-full">
              {selectedMooring ? (
                <MooringEditor 
                  mooring={selectedMooring} 
                  onUpdate={handleUpdateMooring} 
                  onClose={() => setSelectedMooring(null)} 
                />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center text-slate-400 border-dashed border-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Anchor size={24} className="opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Selecciona Amarre</p>
                  <p className="text-[11px] mt-2 leading-relaxed">Haz clic en una plaza del mapa para visualizar y editar la embarcación.</p>
                </div>
              )}
              
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
                <h3 className="font-bold mb-5 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                  <Info size={14} className="text-amber-400" /> Referencias
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                      <span className="text-slate-300 uppercase">Disponible</span>
                    </div>
                    <span className="bg-white/10 px-2 py-0.5 rounded">{moorings.filter(m => m.status === MooringStatus.AVAILABLE).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded bg-rose-600 shadow-sm shadow-rose-600/50"></div>
                      <span className="text-slate-300 uppercase">Ocupado</span>
                    </div>
                    <span className="bg-white/10 px-2 py-0.5 rounded">{moorings.filter(m => m.status === MooringStatus.OCCUPIED).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded bg-amber-500 shadow-sm shadow-amber-500/50"></div>
                      <span className="text-slate-300 uppercase">Reservado</span>
                    </div>
                    <span className="bg-white/10 px-2 py-0.5 rounded">{moorings.filter(m => m.status === MooringStatus.RESERVED).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
