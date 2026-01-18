
import React, { useState, useMemo, useEffect } from 'react';
import { Boat, Mooring, MooringStatus } from '../types';
import { Search, Plus, User, Ruler, Ship, MapPin, Save, X, Trash2, Anchor, ArrowRight, History, Compass, CheckCircle2, Container, Waves, Map, AlertTriangle } from 'lucide-react';
import PrintableMap from './PrintableMap';

interface RegistryManagerProps {
  registry: Boat[];
  moorings: Mooring[];
  activeBoatIds: string[]; // IDs de barcos que están actualmente en un amarre
  onUpdateRegistry: (registry: Boat[]) => void;
  onAssignToMooring: (boat: Boat, mooringId: string) => void;
  initialTab?: RegistryTab;
}

type RegistryTab = 'base_current' | 'base_past' | 'transit' | 'dry_dock';

const RegistryManager: React.FC<RegistryManagerProps> = ({ 
  registry, 
  moorings, 
  activeBoatIds,
  onUpdateRegistry, 
  onAssignToMooring,
  initialTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<RegistryTab>(initialTab || 'base_current');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [assigningBoat, setAssigningBoat] = useState<Boat | null>(null);
  const [showPrintMap, setShowPrintMap] = useState(false);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Estado del formulario
  const [formData, setFormData] = useState<Boat>({
    id: '',
    name: '',
    owner: '',
    length: 0,
    beam: 0,
    registration: '',
    arrivalDate: '',
    departureDate: '',
    isBase: false,
    inDryDock: false
  });

  // Lógica de filtrado principal
  const filteredRegistry = useMemo(() => {
    // 1. Filtrar por búsqueda de texto
    const textFiltered = registry.filter(boat => 
      boat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boat.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boat.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Filtrar por categoría (Pestaña)
    return textFiltered.filter(boat => {
      const isActive = activeBoatIds.includes(boat.id);

      if (activeTab === 'dry_dock') {
        return boat.inDryDock;
      }
      if (activeTab === 'base_current') {
        return boat.isBase && isActive && !boat.inDryDock;
      }
      if (activeTab === 'base_past') {
        return boat.isBase && !isActive && !boat.inDryDock;
      }
      if (activeTab === 'transit') {
        return !boat.isBase && !boat.inDryDock;
      }
      return true;
    });
  }, [registry, searchTerm, activeTab, activeBoatIds]);

  // Conteos para los badges de las pestañas
  const counts = useMemo(() => {
    const base = registry.filter(b => b.isBase && !b.inDryDock);
    const transit = registry.filter(b => !b.isBase && !b.inDryDock);
    const dryDock = registry.filter(b => b.inDryDock);

    return {
      base_current: base.filter(b => activeBoatIds.includes(b.id)).length,
      base_past: base.filter(b => !activeBoatIds.includes(b.id)).length,
      transit: transit.length,
      dry_dock: dryDock.length
    };
  }, [registry, activeBoatIds]);

  // Filtrado de amarres disponibles para asignación
  // NOTA: Las medidas son informativas, así que mostramos todos los disponibles,
  // pero podemos ordenarlos o indicar si encajan.
  const availableMooringsForAssignment = useMemo(() => {
    if (!assigningBoat) return [];
    
    // Obtenemos todos los disponibles
    const allAvailable = moorings.filter(m => m.status === MooringStatus.AVAILABLE);

    // Ordenar: Primero los que encajan perfectamente en dimensiones, luego el resto
    return allAvailable.sort((a, b) => {
      const aFits = a.maxDimensions.length >= assigningBoat.length && a.maxDimensions.beam >= assigningBoat.beam;
      const bFits = b.maxDimensions.length >= assigningBoat.length && b.maxDimensions.beam >= assigningBoat.beam;
      if (aFits && !bFits) return -1;
      if (!aFits && bFits) return 1;
      
      // Si ambos encajan o ambos no, ordenar por ID
      return a.id.localeCompare(b.id);
    });

  }, [assigningBoat, moorings]);

  const handleOpenModal = (boat?: Boat) => {
    if (boat) {
      setEditingBoat(boat);
      setFormData(boat);
    } else {
      setEditingBoat(null);
      setFormData({
        id: Date.now().toString(),
        name: '',
        owner: '',
        length: 0,
        beam: 0,
        registration: '',
        arrivalDate: new Date().toISOString().split('T')[0],
        departureDate: '',
        isBase: activeTab.includes('base'), 
        inDryDock: activeTab === 'dry_dock'
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'length' || name === 'beam' ? parseFloat(value) : value)
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.owner) return; 

    let newRegistry;
    if (editingBoat) {
      newRegistry = registry.map(b => b.id === editingBoat.id ? formData : b);
    } else {
      newRegistry = [...registry, formData];
    }
    
    onUpdateRegistry(newRegistry);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este barco del registro?')) {
      onUpdateRegistry(registry.filter(b => b.id !== id));
    }
  };

  const toggleDryDock = (boat: Boat) => {
    const updatedBoat = { ...boat, inDryDock: !boat.inDryDock };
    const newRegistry = registry.map(b => b.id === boat.id ? updatedBoat : b);
    onUpdateRegistry(newRegistry);
  };

  const handleAssignClick = (boat: Boat) => {
    setAssigningBoat(boat);
  };

  const confirmAssignment = (mooringId: string) => {
    if (assigningBoat) {
      onAssignToMooring(assigningBoat, mooringId);
      setAssigningBoat(null);
    }
  };

  // Renderizado de pestañas
  const TabButton = ({ id, label, icon: Icon, colorClass }: { id: RegistryTab, label: string, icon: any, colorClass: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-tight transition-all border-b-2 ${
        activeTab === id 
          ? `bg-white ${colorClass} border-${colorClass.split('-')[1]}-500` 
          : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
      }`}
    >
      <Icon size={16} />
      {label}
      <span className="ml-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-500 font-black">
        {counts[id]}
      </span>
    </button>
  );

  return (
    <>
      {showPrintMap && (
        <PrintableMap moorings={moorings} onClose={() => setShowPrintMap(false)} />
      )}
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Ship className="text-sky-600" /> Registro de Embarcaciones
            </h2>
            <p className="text-sm text-slate-500 mt-1">Gestión de flota Base, Tránsito y Marina Seca.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPrintMap(true)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Map size={16} /> Plano Actual
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="px-6 py-2 rounded-xl bg-slate-900 text-white font-black hover:bg-black transition-colors flex items-center gap-2 text-sm shadow-lg"
            >
              <Plus size={16} /> Nuevo Barco
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <TabButton id="base_current" label="Base (Actual)" icon={Anchor} colorClass="text-emerald-600 border-emerald-600" />
          <TabButton id="base_past" label="Base (Histórico)" icon={History} colorClass="text-slate-600 border-slate-600" />
          <TabButton id="transit" label="Tránsito" icon={Compass} colorClass="text-amber-600 border-amber-600" />
          <TabButton id="dry_dock" label="Marina Seca" icon={Container} colorClass="text-indigo-600 border-indigo-600" />
        </div>

        {/* Buscador */}
        <div className="p-4 bg-white border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              placeholder="Buscar por nombre, propietario o matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Barcos */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {filteredRegistry.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <Ship size={64} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">
                {activeTab === 'base_current' ? 'No hay barcos base amarrados' :
                 activeTab === 'base_past' ? 'No hay histórico de barcos base' :
                 activeTab === 'dry_dock' ? 'Marina Seca vacía' :
                 'No hay registro de tránsito'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRegistry.map(boat => {
                const isActive = activeBoatIds.includes(boat.id);
                return (
                  <div key={boat.id} className={`group bg-white border rounded-2xl p-5 hover:shadow-xl transition-all relative ${boat.inDryDock ? 'border-indigo-100 hover:border-indigo-300' : boat.isBase ? 'border-emerald-100 hover:border-emerald-300' : 'border-amber-100 hover:border-amber-300'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${boat.inDryDock ? 'bg-indigo-100 text-indigo-600' : boat.isBase ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {boat.inDryDock ? <Container size={20} /> : boat.isBase ? <Anchor size={20} /> : <Compass size={20} />}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(boat)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Save size={14} /></button>
                        <button onClick={() => handleDelete(boat.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-black text-slate-800 text-lg truncate" title={boat.name}>{boat.name}</h3>
                       {isActive && !boat.inDryDock && <CheckCircle2 size={16} className="text-emerald-500" title="Actualmente en puerto" />}
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4 truncate">{boat.owner}</p>
                    
                    <div className="space-y-2 mb-5">
                       <div className="flex justify-between text-xs border-b border-slate-50 pb-1">
                         <span className="text-slate-400 font-medium">Matrícula</span>
                         <span className="font-bold text-slate-700">{boat.registration || '-'}</span>
                       </div>
                       <div className="flex justify-between text-xs border-b border-slate-50 pb-1">
                         <span className="text-slate-400 font-medium">Dimensiones</span>
                         <span className="font-bold text-slate-700">{boat.length}x{boat.beam}m</span>
                       </div>
                    </div>

                    <div className="flex gap-2">
                      {boat.inDryDock ? (
                         <button 
                           onClick={() => toggleDryDock(boat)}
                           className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1"
                         >
                           <Waves size={14} /> Botar
                         </button>
                      ) : isActive ? (
                         <button className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase text-center border border-emerald-100 cursor-default">
                           En Puerto
                         </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleAssignClick(boat)}
                            className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-sky-500 hover:text-white transition-all flex items-center justify-center gap-1"
                            title="Ubicar en Pantalán"
                          >
                            <MapPin size={14} /> Pantalán
                          </button>
                          <button 
                            onClick={() => toggleDryDock(boat)}
                            className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1"
                            title="Mover a Marina Seca"
                          >
                            <Container size={14} /> Seco
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Add/Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <h3 className="font-black uppercase tracking-tight flex items-center gap-2">
                  <Ship className="text-amber-400" /> {editingBoat ? 'Editar Ficha' : 'Nueva Ficha'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Embarcación</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propietario</label>
                    <input name="owner" value={formData.owner} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</label>
                     <input name="registration" value={formData.registration} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-2">
                      <input type="checkbox" name="isBase" checked={formData.isBase} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                      <label className="text-xs font-bold text-slate-700 uppercase">Es Cliente Base</label>
                    </div>
                     <div className="flex items-center gap-2">
                      <input type="checkbox" name="inDryDock" checked={formData.inDryDock} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <label className="text-xs font-bold text-slate-700 uppercase">En Marina Seca</label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eslora (m)</label>
                    <input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manga (m)</label>
                    <input type="number" name="beam" value={formData.beam} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
                
                <button onClick={handleSave} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase text-sm hover:bg-black transition-all shadow-lg mt-4">
                  Guardar Ficha
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Asignación */}
        {assigningBoat && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ubicar "{assigningBoat.name}"</h3>
                   <p className="text-xs text-slate-500 font-medium">Dimensiones del barco: {assigningBoat.length}m x {assigningBoat.beam}m</p>
                 </div>
                 <button onClick={() => setAssigningBoat(null)} className="hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-0 overflow-y-auto flex-1 custom-scrollbar bg-slate-50">
                 {availableMooringsForAssignment.length === 0 ? (
                   <div className="p-10 text-center">
                     <p className="text-slate-400 font-bold mb-2">No hay plazas disponibles</p>
                   </div>
                 ) : (
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 sticky top-0">
                       <tr>
                         <th className="p-4 text-xs font-black text-slate-400 uppercase">Amarre</th>
                         <th className="p-4 text-xs font-black text-slate-400 uppercase">Zona</th>
                         <th className="p-4 text-xs font-black text-slate-400 uppercase">Ref. Dim.</th>
                         <th className="p-4 text-xs font-black text-slate-400 uppercase text-right">Acción</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                       {availableMooringsForAssignment.map(m => {
                         const fits = m.maxDimensions.length >= assigningBoat.length && m.maxDimensions.beam >= assigningBoat.beam;
                         
                         return (
                           <tr key={m.id} className="bg-white hover:bg-sky-50 transition-colors group">
                             <td className="p-4 font-black text-slate-800 flex items-center gap-2">
                               {m.id}
                               {!fits && <AlertTriangle size={14} className="text-amber-500" title="Dimensiones de referencia excedidas" />}
                             </td>
                             <td className="p-4 text-xs font-bold text-slate-500">{m.zone}</td>
                             <td className={`p-4 text-xs font-mono ${fits ? 'text-slate-600' : 'text-amber-600 font-bold'}`}>
                               {m.maxDimensions.length}x{m.maxDimensions.beam}m
                             </td>
                             <td className="p-4 text-right">
                               <button 
                                 onClick={() => confirmAssignment(m.id)}
                                 className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ml-auto ${fits ? 'bg-slate-100 text-slate-600 group-hover:bg-sky-500 group-hover:text-white' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'}`}
                               >
                                 {fits ? 'Asignar' : 'Forzar'} <ArrowRight size={12}/>
                               </button>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistryManager;
