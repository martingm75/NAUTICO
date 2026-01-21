
import React, { useState, useMemo, useEffect } from 'react';
import { Boat, Mooring, MooringStatus } from '../types';
import { FLAG_ISO_MAP } from '../constants';
import { Search, Plus, User, Ruler, Ship, Save, X, Trash2, Anchor, History, Compass, Container, Waves, Calendar, Clock, Phone, Mail, CreditCard, FileText, Snowflake, Wrench, RefreshCw } from 'lucide-react';
import PrintableMap from './PrintableMap';
import DeclarationForm from './DeclarationForm';

interface RegistryManagerProps {
  registry: Boat[];
  moorings: Mooring[];
  activeBoatIds: string[];
  onUpdateRegistry: (registry: Boat[]) => void;
  onAssignToMooring: (boat: Boat, mooringId: string) => void;
  initialTab?: RegistryTab;
}

type RegistryTab = 'base_current' | 'base_past' | 'transit_current' | 'transit_past' | 'dry_dock';

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
  const [showPrintMap, setShowPrintMap] = useState(false);
  const [boatForDeclaration, setBoatForDeclaration] = useState<Boat | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const [formData, setFormData] = useState<Boat>({
    id: '', name: '', owner: '', phone: '', email: '', length: 0, beam: 0, registration: '',
    flag: 'España', flagCode: 'es', portOfRegistry: '', skipperId: '', nationality: '',
    arrivalDate: '', departureDate: '', isBase: false, inDryDock: false, passengers: [], history: []
  });

  const filteredRegistry = useMemo(() => {
    const textFiltered = registry.filter(boat => 
      boat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boat.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      boat.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return textFiltered.filter(boat => {
      const isActive = activeBoatIds.includes(boat.id);
      
      if (activeTab === 'dry_dock') return boat.inDryDock;
      
      if (activeTab === 'base_current') return boat.isBase && isActive && !boat.inDryDock;
      if (activeTab === 'base_past') return boat.isBase && !isActive && !boat.inDryDock;
      
      if (activeTab === 'transit_current') return !boat.isBase && isActive && !boat.inDryDock;
      if (activeTab === 'transit_past') return !boat.isBase && !isActive && !boat.inDryDock;
      
      return true;
    });
  }, [registry, searchTerm, activeTab, activeBoatIds]);

  const counts = useMemo(() => {
    const base = registry.filter(b => b.isBase && !b.inDryDock);
    const transit = registry.filter(b => !b.isBase && !b.inDryDock);
    const dryDock = registry.filter(b => b.inDryDock);
    return {
      base_current: base.filter(b => activeBoatIds.includes(b.id)).length,
      base_past: base.filter(b => !activeBoatIds.includes(b.id)).length,
      transit_current: transit.filter(b => activeBoatIds.includes(b.id)).length,
      transit_past: transit.filter(b => !activeBoatIds.includes(b.id)).length,
      dry_dock: dryDock.length
    };
  }, [registry, activeBoatIds]);

  const handleOpenModal = (boat?: Boat) => {
    if (boat) {
      setEditingBoat(boat);
      setFormData(boat);
    } else {
      setEditingBoat(null);
      setFormData({
        id: Date.now().toString(), name: '', owner: '', phone: '', email: '', length: 0, beam: 0, registration: '',
        flag: 'España', flagCode: 'es', portOfRegistry: '', skipperId: '', nationality: '',
        arrivalDate: new Date().toISOString().split('T')[0], departureDate: '', isBase: activeTab.includes('base'), inDryDock: activeTab === 'dry_dock',
        passengers: [], history: []
      });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => {
      const update = {
        ...prev,
        [name]: type === 'checkbox' ? checked : (name === 'length' || name === 'beam' ? parseFloat(value) : value)
      };
      if (name === 'flag') { update.flagCode = FLAG_ISO_MAP[value] || ''; }
      return update;
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.owner) return; 
    onUpdateRegistry(editingBoat ? registry.map(b => b.id === editingBoat.id ? formData : b) : [...registry, formData]);
    setIsModalOpen(false);
  };

  const handleGenerateDeclaration = (boat: Boat) => {
    setBoatForDeclaration(boat);
  };

  const handleDeclarationSave = (updatedBoat: Boat) => {
    onUpdateRegistry(registry.map(b => b.id === updatedBoat.id ? updatedBoat : b));
    setBoatForDeclaration(null);
  };

  // Función wrapper para botadura inteligente
  const handleLaunch = (boat: Boat) => {
      // Si tiene titular y está libre/reservada para él, pasar el ID directamente
      // App.tsx manejará la lógica, pero aquí podemos pre-validar
      if (boat.titularMooringId) {
          const m = moorings.find(m => m.id === boat.titularMooringId);
          if (m && (m.status === MooringStatus.AVAILABLE || (m.status === MooringStatus.RESERVED && m.reservation?.relatedBoatId === boat.id))) {
              onAssignToMooring(boat, boat.titularMooringId);
              return;
          }
      }
      // Si no, sugerir al usuario que use la vista de mapa
      alert("Por favor, seleccione una plaza libre en la vista de Mapa para asignar este barco.");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      {showPrintMap && <PrintableMap moorings={moorings} onClose={() => setShowPrintMap(false)} />}
      
      {boatForDeclaration && (
        <DeclarationForm 
          boat={boatForDeclaration} 
          onSave={handleDeclarationSave} 
          onClose={() => setBoatForDeclaration(null)} 
        />
      )}
      
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><Ship className="text-sky-600" /> Registro Central</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Histórico de movimientos y fichas de embarcación</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-6 py-2 rounded-xl bg-slate-900 text-white font-black hover:bg-black transition-all flex items-center gap-2 text-sm shadow-lg"><Plus size={16} /> Nueva Ficha</button>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto shrink-0 bg-white">
        {[
          { id: 'base_current', label: 'Base Actual', icon: Anchor, color: 'emerald' },
          { id: 'base_past', label: 'Histórico Base', icon: History, color: 'slate' },
          { id: 'transit_current', label: 'Tránsito Actual', icon: Compass, color: 'amber' },
          { id: 'transit_past', label: 'Histórico Tránsito', icon: History, color: 'orange' },
          { id: 'dry_dock', label: 'Marina Seca', icon: Container, color: 'indigo' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 min-w-max ${
              activeTab === tab.id ? `bg-white text-${tab.color}-600 border-${tab.color}-600` : 'bg-slate-50 text-slate-400 border-transparent'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            <span className="ml-1 px-1.5 py-0.5 bg-slate-200/50 rounded text-[9px] text-slate-600 font-black">{counts[tab.id as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      <div className="p-4 bg-white border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500 transition-all" placeholder="Buscar por nombre, patrón, matrícula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRegistry.map(boat => {
            const isActive = activeBoatIds.includes(boat.id);
            return (
              <div key={boat.id} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-1 px-2 text-[8px] font-black uppercase ${
                  boat.inDryDock 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : isActive 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                }`}>
                  {boat.inDryDock ? 'EN SECO' : (isActive ? 'AMARRADO' : 'FUERA')}
                </div>
                
                {/* ETIQUETA HIBERNACIÓN / MANTENIMIENTO */}
                {boat.inDryDock && (
                  <div className={`absolute top-0 left-0 p-1 px-2 text-[8px] font-black uppercase flex items-center gap-1 ${
                    boat.maintenanceReason === 'Hibernación' 
                      ? 'bg-sky-100 text-sky-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {boat.maintenanceReason === 'Hibernación' ? <Snowflake size={10} /> : <Wrench size={10} />}
                    {boat.maintenanceReason || 'MANTENIMIENTO'}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex items-center gap-2">
                    {boat.flagCode && <img src={`https://flagcdn.com/w40/${boat.flagCode.toLowerCase()}.png`} className="w-7 h-4.5 shadow-sm rounded-sm object-cover" alt={boat.flag} />}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{boat.flag}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleGenerateDeclaration(boat)} title="Generar Declaración Oficial" className="p-2 hover:bg-sky-50 rounded-lg text-sky-600"><FileText size={14} /></button>
                    <button onClick={() => handleOpenModal(boat)} title="Editar Ficha" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Save size={14} /></button>
                    <button onClick={() => { if(confirm("¿Eliminar?")) onUpdateRegistry(registry.filter(b => b.id !== boat.id)) }} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-black text-slate-800 text-base truncate uppercase tracking-tight">{boat.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-black">{boat.registration}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{boat.length}x{boat.beam}m</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-3 border-t border-slate-50">
                  <div className="flex items-start gap-2">
                    <User size={12} className="text-sky-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-800 truncate uppercase">{boat.owner}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">Patrón / Armador</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold">
                    <div className="text-slate-500 flex items-center gap-1"><Calendar size={10} /> {boat.arrivalDate}</div>
                    {boat.departureDate && <div className="text-rose-500 flex items-center gap-1"><Clock size={10} /> {boat.departureDate}</div>}
                  </div>
                </div>

                {!isActive && !boat.inDryDock && (
                  <button onClick={() => handleLaunch(boat)} className="w-full mt-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-1 shadow-lg shadow-slate-200">
                    <RefreshCw size={12} className="mr-1"/> Reasignar / Nueva Estancia
                  </button>
                )}
                
                {boat.inDryDock && (
                   <button onClick={() => handleLaunch(boat)} className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 shadow-lg shadow-indigo-200">
                     <Waves size={12} /> Botar al Agua
                   </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <h3 className="font-black uppercase tracking-tight flex items-center gap-2"><Ship className="text-amber-400" /> Ficha Maestra de Embarcación</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                
                {/* BLOQUE EMBARCACIÓN */}
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Ship size={16} className="text-sky-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Embarcación</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Nombre</label>
                      <input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Matrícula</label>
                      <input name="registration" value={formData.registration} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase">Pabellón</label>
                        <select name="flag" value={formData.flag} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-bold outline-none">
                          {Object.keys(FLAG_ISO_MAP).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end justify-center pb-1">
                        {formData.flagCode && <img src={`https://flagcdn.com/w40/${formData.flagCode.toLowerCase()}.png`} className="w-12 h-8 rounded shadow-sm border" alt="Flag" />}
                      </div>
                    </div>
                    
                    {/* TOGGLE MARINA SECA */}
                    <div className="pt-2">
                       <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <input type="checkbox" name="inDryDock" checked={formData.inDryDock} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">En Marina Seca</span>
                       </label>
                    </div>
                    
                    {/* PLAZA TITULAR */}
                    <div>
                       <label className="text-[9px] font-black text-slate-500 uppercase">Plaza Titular (Opcional)</label>
                       <input name="titularMooringId" value={formData.titularMooringId || ''} onChange={handleChange} placeholder="Ej: P1/2B" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                    </div>
                  </div>
                </div>

                {/* BLOQUE PATRÓN */}
                <div className="col-span-2 md:col-span-1 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User size={16} className="text-sky-600" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patrón / Armador</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Nombre Completo</label>
                      <input name="owner" value={formData.owner} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">DNI / Pasaporte</label>
                      <input name="skipperId" value={formData.skipperId} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase">Teléfono</label>
                      <input name="phone" value={formData.phone} onChange={handleChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none" />
                    </div>
                  </div>
                </div>

                {/* OTROS DATOS */}
                <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Eslora</label>
                    <input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Manga</label>
                    <input type="number" name="beam" value={formData.beam} onChange={handleChange} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Llegada Actual</label>
                    <input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase">Salida</label>
                    <input type="date" name="departureDate" value={formData.departureDate} onChange={handleChange} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                  </div>
                </div>

                {/* HISTORIAL DE ESTANCIAS */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <History size={16} className="text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial de Estancias</span>
                  </div>
                  {formData.history && formData.history.length > 0 ? (
                    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100">
                          <tr>
                             <th className="p-3 text-[9px] font-black uppercase text-slate-500">Llegada</th>
                             <th className="p-3 text-[9px] font-black uppercase text-slate-500">Salida</th>
                             <th className="p-3 text-[9px] font-black uppercase text-slate-500">Amarre</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {formData.history.map((stay, idx) => (
                            <tr key={idx}>
                              <td className="p-3 text-[10px] font-bold text-slate-700">{stay.arrivalDate}</td>
                              <td className="p-3 text-[10px] font-bold text-slate-700">{stay.departureDate}</td>
                              <td className="p-3 text-[10px] font-bold text-slate-700">{stay.mooringId || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 italic py-4 border border-dashed border-slate-200 rounded-xl">Sin historial registrado</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                 <button onClick={() => { handleSave(); handleGenerateDeclaration(formData); }} className="flex-1 bg-sky-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-sky-700 transition-all shadow-xl shadow-sky-100 flex items-center justify-center gap-2">
                  <FileText size={18} /> Guardar y Abrir Declaración
                </button>
                <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                  <Save size={18} /> Solo Guardar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryManager;
