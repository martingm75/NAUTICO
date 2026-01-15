
import React, { useState, useEffect } from 'react';
import { Mooring, MooringStatus, Boat } from '../types';
import { STATUS_LABELS, STATUS_COLORS, BASE_BOAT_COLOR } from '../constants';
import { Anchor, User, Ruler, Calendar, Trash2, Save, X, CheckCircle2, AlertTriangle, MoveHorizontal, Search } from 'lucide-react';

interface MooringEditorProps {
  mooring: Mooring;
  allMoorings: Mooring[];
  onUpdate: (mooring: Mooring) => void;
  onMoveBoat: (sourceId: string, targetId: string) => void;
  onClose: () => void;
}

const MooringEditor: React.FC<MooringEditorProps> = ({ mooring, allMoorings, onUpdate, onMoveBoat, onClose }) => {
  const [editedMooring, setEditedMooring] = useState<Mooring>(mooring);
  const [targetId, setTargetId] = useState('');
  const [moveError, setMoveError] = useState('');

  useEffect(() => {
    setEditedMooring(mooring);
    setTargetId('');
    setMoveError('');
  }, [mooring]);

  const handleBoatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditedMooring(prev => ({
      ...prev,
      boat: {
        ...(prev.boat || { id: Date.now().toString(), name: '', owner: '', length: 0, beam: 0, arrivalDate: '', departureDate: '', registration: '', isBase: false }),
        [name]: type === 'checkbox' ? checked : (name === 'length' || name === 'beam' ? parseFloat(value) : value)
      }
    }));
  };

  const handleStatusChange = (status: MooringStatus) => {
    setEditedMooring(prev => ({ ...prev, status, boat: status === MooringStatus.AVAILABLE ? undefined : prev.boat }));
  };

  const handleMove = () => {
    const target = allMoorings.find(m => m.id.toUpperCase() === targetId.toUpperCase());
    if (!target) {
      setMoveError('La plaza de destino no existe.');
      return;
    }
    if (target.id === mooring.id) {
      setMoveError('El destino es el mismo amarre.');
      return;
    }
    onMoveBoat(mooring.id, target.id);
  };

  const fitsLength = (editedMooring.boat?.length || 0) <= editedMooring.maxDimensions.length;
  const fitsBeam = (editedMooring.boat?.beam || 0) <= editedMooring.maxDimensions.beam;
  const currentColorClass = (editedMooring.boat?.isBase && editedMooring.status === MooringStatus.OCCUPIED) ? BASE_BOAT_COLOR : STATUS_COLORS[editedMooring.status];

  // Sugerencias de plazas disponibles
  const suggestions = allMoorings
    .filter(m => m.status === MooringStatus.AVAILABLE && m.id.toUpperCase().includes(targetId.toUpperCase()) && targetId.length > 0)
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className={`p-5 flex justify-between items-center text-white transition-colors duration-500 ${currentColorClass}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Anchor size={24} />
            <h2 className="text-2xl font-black tracking-tight uppercase">Amarre {editedMooring.id}</h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold bg-black/20 w-fit px-2 py-1 rounded">
             <span>PANTALÁN {editedMooring.zone}</span>
             <span className="w-1 h-1 bg-white/40 rounded-full"></span>
             <span>MÁX: {editedMooring.maxDimensions.length}x{editedMooring.maxDimensions.beam}m</span>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={24} /></button>
      </div>

      <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
        {/* Traslado de Barco (Nuevo módulo) */}
        {mooring.boat && (
          <section className="bg-sky-50 p-5 rounded-2xl border border-sky-100 space-y-4">
            <div className="flex items-center gap-2">
              <MoveHorizontal size={18} className="text-sky-600" />
              <h3 className="font-black text-sky-900 uppercase text-xs tracking-widest">Traslado de Embarcación</h3>
            </div>
            <p className="text-[11px] text-sky-700 font-medium">Introduce el ID de la plaza de destino para mover este barco.</p>
            <div className="space-y-2 relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={14} />
                  <input 
                    className="w-full bg-white border border-sky-200 rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="Ej: P2/15C"
                    value={targetId}
                    onChange={(e) => { setTargetId(e.target.value); setMoveError(''); }}
                  />
                </div>
                <button 
                  onClick={handleMove}
                  disabled={!targetId}
                  className="bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-sky-700 disabled:opacity-50 transition-all"
                >
                  TRASLADAR
                </button>
              </div>
              
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-sky-100 rounded-xl shadow-lg z-10 overflow-hidden">
                  {suggestions.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => setTargetId(s.id)}
                      className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-sky-50 border-b border-sky-50 last:border-0"
                    >
                      Sugerencia: {s.id} (Libre)
                    </button>
                  ))}
                </div>
              )}
            </div>
            {moveError && <p className="text-rose-500 text-[10px] font-bold flex items-center gap-1"><AlertTriangle size={12}/> {moveError}</p>}
          </section>
        )}

        <section>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Estado de la Plaza</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key as MooringStatus)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${editedMooring.status === key ? 'border-slate-800 bg-slate-800 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {editedMooring.status === key && <CheckCircle2 size={14} />}
                {label}
              </button>
            ))}
          </div>
        </section>

        {(editedMooring.status === MooringStatus.OCCUPIED || editedMooring.status === MooringStatus.RESERVED) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-tight"><User size={18} className="text-sky-600" /> Datos del Barco</h3>
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <span className={`text-[10px] font-black transition-colors ${editedMooring.boat?.isBase ? 'text-slate-900' : 'text-slate-400'}`}>CLIENTE BASE</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isBase" checked={editedMooring.boat?.isBase || false} onChange={handleBoatChange} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Embarcación</label>
                <input name="name" value={editedMooring.boat?.name || ''} onChange={handleBoatChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Ej: My Dream Yacht" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</label>
                <input name="registration" value={editedMooring.boat?.registration || ''} onChange={handleBoatChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propietario</label>
                <input name="owner" value={editedMooring.boat?.owner || ''} onChange={handleBoatChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none font-medium" />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Ruler size={12} /> Eslora (m)</label>
                  <input name="length" type="number" value={editedMooring.boat?.length || 0} onChange={handleBoatChange} className={`w-full px-3 py-2 border rounded-lg text-sm font-bold outline-none ${!fitsLength ? 'border-rose-300 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-700'}`} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Ruler size={12} /> Manga (m)</label>
                  <input name="beam" type="number" value={editedMooring.boat?.beam || 0} onChange={handleBoatChange} className={`w-full px-3 py-2 border rounded-lg text-sm font-bold outline-none ${!fitsBeam ? 'border-rose-300 text-rose-600 bg-rose-50' : 'border-slate-200 text-slate-700'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100">
          <button onClick={() => onUpdate(editedMooring)} className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-95">
            <Save size={18} /> ACTUALIZAR DATOS
          </button>
          <button onClick={() => { if(confirm("¿Estás seguro?")) handleStatusChange(MooringStatus.AVAILABLE); }} className="p-3 border-2 border-slate-100 text-slate-400 rounded-2xl hover:border-rose-100 hover:text-rose-500 transition-all active:scale-95" title="Liberar">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MooringEditor;
