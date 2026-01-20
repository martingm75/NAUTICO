
import React, { useState, useEffect } from 'react';
import { Mooring, MooringStatus, Boat } from '../types';
import { STATUS_LABELS, STATUS_COLORS, BASE_BOAT_COLOR, FLAG_ISO_MAP } from '../constants';
import { Anchor, User, Ruler, Calendar, Trash2, Save, X, CheckCircle2, AlertTriangle, MoveHorizontal, Search, Clock, Ship, Phone, Mail, Globe, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

interface MooringEditorProps {
  mooring: Mooring;
  allMoorings: Mooring[];
  onUpdate: (mooring: Mooring) => void;
  onMoveBoat: (sourceId: string, targetId: string) => void;
  onDepart: (mooringId: string, boatData: Boat) => void;
  onClose: () => void;
}

const MooringEditor: React.FC<MooringEditorProps> = ({ mooring, allMoorings, onUpdate, onMoveBoat, onDepart, onClose }) => {
  const [editedMooring, setEditedMooring] = useState<Mooring>(mooring);
  const [targetId, setTargetId] = useState('');
  const [moveError, setMoveError] = useState('');

  useEffect(() => {
    setEditedMooring(mooring);
    setTargetId('');
    setMoveError('');
  }, [mooring]);

  const handleBoatChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setEditedMooring(prev => {
      const currentBoat = prev.boat || { 
        id: Date.now().toString(), 
        name: '', 
        owner: '', 
        length: 0, 
        beam: 0, 
        arrivalDate: new Date().toISOString().split('T')[0], 
        departureDate: '', 
        registration: '', 
        isBase: false 
      };

      const updatedBoat = {
        ...currentBoat,
        [name]: type === 'checkbox' ? checked : (name === 'length' || name === 'beam' ? parseFloat(value) : value)
      };

      if (name === 'flag') {
        updatedBoat.flagCode = FLAG_ISO_MAP[value] || '';
      }

      return { ...prev, boat: updatedBoat };
    });
  };

  const handleStatusChange = (status: MooringStatus) => {
    const emptyBoat: Boat = { 
      id: Date.now().toString(), 
      name: '', 
      owner: '', 
      length: 0, 
      beam: 0, 
      arrivalDate: new Date().toISOString().split('T')[0], 
      departureDate: '', 
      registration: '', 
      flag: 'España',
      flagCode: 'es',
      isBase: false 
    };

    setEditedMooring(prev => ({ 
      ...prev, 
      status, 
      boat: status === MooringStatus.AVAILABLE ? undefined : (prev.boat || emptyBoat)
    }));
  };

  const fitsLength = (editedMooring.boat?.length || 0) <= editedMooring.maxDimensions.length;
  const fitsBeam = (editedMooring.boat?.beam || 0) <= editedMooring.maxDimensions.beam;
  const currentColorClass = (editedMooring.boat?.isBase && editedMooring.status === MooringStatus.OCCUPIED) ? BASE_BOAT_COLOR : STATUS_COLORS[editedMooring.status];

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className={`p-5 flex justify-between items-center text-white transition-colors duration-500 ${currentColorClass}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Anchor size={24} />
            <h2 className="text-2xl font-black tracking-tight uppercase">Amarre {editedMooring.id}</h2>
          </div>
          <p className="text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded uppercase tracking-widest">Pantalán {editedMooring.zone} • Ref: {editedMooring.maxDimensions.length}x{editedMooring.maxDimensions.beam}m</p>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={24} /></button>
      </div>

      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
        <section>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Estado de la Plaza</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => handleStatusChange(key as MooringStatus)} className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${editedMooring.status === key ? 'border-slate-800 bg-slate-800 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
        </section>

        {editedMooring.status !== MooringStatus.AVAILABLE && editedMooring.boat && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* GRUPO 1: DATOS DE LA EMBARCACIÓN */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                <Ship size={16} className="text-sky-600" />
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Datos de la Embarcación</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Barco</label>
                  <input name="name" value={editedMooring.boat.name} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</label>
                  <input name="registration" value={editedMooring.boat.registration} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={10}/> Pabellón</label>
                  <div className="flex gap-2 items-center mt-1">
                    <select name="flag" value={editedMooring.boat.flag} onChange={handleBoatChange} className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-bold outline-none">
                      {Object.keys(FLAG_ISO_MAP).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    {editedMooring.boat.flagCode && (
                      <img src={`https://flagcdn.com/w40/${editedMooring.boat.flagCode.toLowerCase()}.png`} className="w-8 h-5 rounded-sm shadow-sm" alt="Flag" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={10}/> Puerto de Registro</label>
                  <input name="portOfRegistry" value={editedMooring.boat.portOfRegistry || ''} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Ruler size={10}/> Eslora</label>
                    <input type="number" name="length" value={editedMooring.boat.length} onChange={handleBoatChange} className={`w-full mt-1 bg-white border rounded-xl px-4 py-2 text-xs font-bold ${!fitsLength ? 'border-amber-400 text-amber-600' : 'border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Ruler size={10}/> Manga</label>
                    <input type="number" name="beam" value={editedMooring.boat.beam} onChange={handleBoatChange} className={`w-full mt-1 bg-white border rounded-xl px-4 py-2 text-xs font-bold ${!fitsBeam ? 'border-amber-400 text-amber-600' : 'border-slate-200'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 2: DATOS DEL PATRÓN / ARMADOR */}
            <div className="bg-sky-50/50 rounded-2xl border border-sky-100 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-sky-100 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-sky-600" />
                  <h3 className="text-[11px] font-black text-sky-900 uppercase tracking-widest">Datos del Patrón</h3>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-[9px] font-black text-sky-700">SOCIO</span>
                  <input type="checkbox" name="isBase" checked={editedMooring.boat.isBase} onChange={handleBoatChange} className="w-3.5 h-3.5 rounded border-sky-200 text-sky-600 focus:ring-sky-500" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Nombre Completo</label>
                  <input name="owner" value={editedMooring.boat.owner} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-sky-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><CreditCard size={10}/> DNI / Pasaporte</label>
                  <input name="skipperId" value={editedMooring.boat.skipperId || ''} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-sky-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Nacionalidad</label>
                  <input name="nationality" value={editedMooring.boat.nationality || ''} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-sky-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><Phone size={10}/> Teléfono</label>
                  <input name="phone" value={editedMooring.boat.phone || ''} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-sky-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-1"><Mail size={10}/> Email</label>
                  <input name="email" value={editedMooring.boat.email || ''} onChange={handleBoatChange} className="w-full mt-1 bg-white border border-sky-100 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
                </div>
              </div>
            </div>

            {/* FECHAS */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10}/> Fecha Llegada</label>
                <input type="date" name="arrivalDate" value={editedMooring.boat.arrivalDate} onChange={handleBoatChange} className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> Fecha Salida</label>
                <input type="date" name="departureDate" value={editedMooring.boat.departureDate || ''} disabled className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none opacity-50" />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t border-slate-100 z-[100] pb-2">
          {editedMooring.status !== MooringStatus.AVAILABLE && editedMooring.boat && (
            <button onClick={(e) => { e.preventDefault(); onDepart(mooring.id, { ...editedMooring.boat! }); }} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"><Ship size={18} /> ZARPAR</button>
          )}
          <button onClick={() => onUpdate(editedMooring)} className="flex-[2] bg-slate-900 text-white py-3 px-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all"><Save size={18} /> ACTUALIZAR DATOS</button>
          <button onClick={() => { if(confirm("¿Liberar plaza sin registrar salida?")) handleStatusChange(MooringStatus.AVAILABLE); }} className="p-3 border-2 border-slate-100 text-slate-300 rounded-2xl hover:text-rose-500 hover:border-rose-100 transition-all"><Trash2 size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default MooringEditor;
