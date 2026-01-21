
import React, { useState, useEffect } from 'react';
import { Mooring, MooringStatus, Boat } from '../types';
import { STATUS_LABELS, STATUS_COLORS, BASE_BOAT_COLOR, FLAG_ISO_MAP } from '../constants';
import { Anchor, User, Ruler, Calendar, Trash2, Save, X, AlertTriangle, Clock, Ship, Phone, Mail, MapPin, CreditCard, Container, Wrench, Snowflake, ChevronRight } from 'lucide-react';

interface MooringEditorProps {
  mooring: Mooring;
  allMoorings: Mooring[];
  onUpdate: (mooring: Mooring) => void;
  onMoveBoat: (sourceId: string, targetId: string) => void;
  onDepart: (mooringId: string, boatData: Boat) => void;
  onMoveToDryDock: (mooringId: string, boat: Boat, reason: 'Mantenimiento' | 'Hibernación', returnDate: string) => void;
  onClose: () => void;
}

const MooringEditor: React.FC<MooringEditorProps> = ({ mooring, allMoorings, onUpdate, onMoveBoat, onDepart, onMoveToDryDock, onClose }) => {
  const [editedMooring, setEditedMooring] = useState<Mooring>(mooring);
  
  // Estado para el formulario de Marina Seca
  const [showDryDockForm, setShowDryDockForm] = useState(false);
  const [dryDockReason, setDryDockReason] = useState<'Mantenimiento' | 'Hibernación'>('Mantenimiento');
  const [dryDockReturnDate, setDryDockReturnDate] = useState('');

  useEffect(() => {
    setEditedMooring(mooring);
  }, [mooring]);

  // Inicializar fecha de retorno por defecto (1 mes) al abrir el formulario
  useEffect(() => {
    if (showDryDockForm && !dryDockReturnDate) {
       const nextMonth = new Date();
       nextMonth.setMonth(nextMonth.getMonth() + 1);
       setDryDockReturnDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [showDryDockForm]);

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

  const handleConfirmDryDock = () => {
    if (editedMooring.boat && dryDockReturnDate) {
      onMoveToDryDock(mooring.id, { ...editedMooring.boat }, dryDockReason, dryDockReturnDate);
      setShowDryDockForm(false);
    }
  };

  const handleSaveAttempt = () => {
    // VALIDACIÓN DE FECHAS EN PLAZAS RESERVADAS (TITULAR FUERA)
    // Si la plaza tiene una reserva activa y estamos intentando guardar un barco que NO es el titular de la reserva
    if (editedMooring.reservation && editedMooring.reservation.relatedBoatId !== editedMooring.boat?.id && editedMooring.status !== MooringStatus.AVAILABLE) {
      const reservationEnd = new Date(editedMooring.reservation.endDate);
      const limitDate = new Date(reservationEnd);
      limitDate.setDate(limitDate.getDate() - 1); // Un día antes de que vuelva el titular

      const boatDeparture = editedMooring.boat?.departureDate ? new Date(editedMooring.boat.departureDate) : null;
      
      const limitDateStr = limitDate.toLocaleDateString();
      const returnDateStr = reservationEnd.toLocaleDateString();

      // Caso 1: No hay fecha de salida definida
      if (!boatDeparture) {
        alert(`⚠️ ALERTA DE DISPONIBILIDAD\n\nEl titular (${editedMooring.reservation.relatedBoatName}) vuelve el ${returnDateStr}.\n\nPara ocupar esta plaza temporalmente, DEBE establecer una fecha de salida igual o anterior al ${limitDateStr}.`);
        return;
      }

      // Caso 2: La fecha de salida es posterior a la fecha límite
      if (boatDeparture > limitDate) {
        alert(`⛔ CONFLICTO DE FECHAS\n\nEl barco actual saldría el ${boatDeparture.toLocaleDateString()}, pero el titular regresa el ${returnDateStr}.\n\nLa plaza debe quedar libre el día ${limitDateStr} como máximo.`);
        return;
      }
    }

    // Si pasa validaciones, guardar
    onUpdate(editedMooring);
  };

  const fitsLength = (editedMooring.boat?.length || 0) <= editedMooring.maxDimensions.length;
  const fitsBeam = (editedMooring.boat?.beam || 0) <= editedMooring.maxDimensions.beam;
  const currentColorClass = (editedMooring.boat?.isBase && editedMooring.status === MooringStatus.OCCUPIED) ? BASE_BOAT_COLOR : STATUS_COLORS[editedMooring.status];

  // Cálculo de fecha límite para mostrar en UI
  let availabilityWarning = null;
  if (editedMooring.reservation && editedMooring.reservation.relatedBoatId !== editedMooring.boat?.id) {
     const limitDate = new Date(editedMooring.reservation.endDate);
     limitDate.setDate(limitDate.getDate() - 1);
     availabilityWarning = `Plaza disponible solo hasta: ${limitDate.toLocaleDateString()}`;
  }

  // VISTA: FORMULARIO DE MARINA SECA
  if (showDryDockForm) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
         <div className="bg-indigo-600 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
               <Container size={24} />
               <h2 className="text-xl font-black tracking-tight uppercase">Pase a Marina Seca</h2>
            </div>
            <button onClick={() => setShowDryDockForm(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={20} /></button>
         </div>
         
         <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <p className="text-xs text-indigo-800 mb-2 font-bold uppercase">Embarcación seleccionada</p>
               <h3 className="text-lg font-black text-slate-800">{editedMooring.boat?.name}</h3>
               <p className="text-xs text-slate-500">{editedMooring.boat?.registration} • {editedMooring.boat?.owner}</p>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Motivo del Varado</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setDryDockReason('Mantenimiento')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${dryDockReason === 'Mantenimiento' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-300 text-slate-400'}`}
                     >
                        <Wrench size={24} />
                        <span className="text-xs font-black uppercase">Mantenimiento</span>
                     </button>
                     <button 
                        onClick={() => setDryDockReason('Hibernación')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${dryDockReason === 'Hibernación' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-100 hover:border-slate-300 text-slate-400'}`}
                     >
                        <Snowflake size={24} />
                        <span className="text-xs font-black uppercase">Hibernación</span>
                     </button>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Fecha Prevista de Retorno (Al agua)</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                     <input 
                        type="date" 
                        value={dryDockReturnDate} 
                        onChange={(e) => setDryDockReturnDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                     />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 italic">
                     * Esta fecha se usará para reservar la plaza {editedMooring.id} hasta el regreso.
                  </p>
               </div>
            </div>

            <div className="mt-auto pt-4">
               <button 
                  onClick={handleConfirmDryDock}
                  disabled={!dryDockReturnDate}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                  <Container size={18} /> Confirmar Traslado
               </button>
            </div>
         </div>
      </div>
    );
  }

  // VISTA: EDITOR NORMAL
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

        {/* ALERTA DE RESERVA TITULAR */}
        {editedMooring.status === MooringStatus.RESERVED && editedMooring.reservation && (
           <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={20} />
              <div>
                 <p className="text-xs font-black text-amber-800 uppercase">Plaza Reservada</p>
                 <p className="text-[10px] text-amber-700 mt-1">
                    {editedMooring.reservation.type === 'MAINTENANCE_HOLD' 
                       ? `Titular en Mantenimiento: ${editedMooring.reservation.relatedBoatName}` 
                       : `Reserva: ${editedMooring.reservation.relatedBoatName}`}
                 </p>
                 <p className="text-[10px] text-amber-700 font-bold mt-1">Hasta: {editedMooring.reservation.endDate}</p>
                 {editedMooring.reservation.notes && <p className="text-[10px] text-amber-600 italic mt-1">{editedMooring.reservation.notes}</p>}
                 
                 {/* AVISO DISPONIBILIDAD TEMPORAL */}
                 {editedMooring.reservation.type === 'MAINTENANCE_HOLD' && (
                     <div className="mt-2 bg-white/50 p-2 rounded border border-amber-300 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                         <Clock size={12} />
                         Disponible para tránsito hasta: {
                             (() => {
                                 const d = new Date(editedMooring.reservation.endDate);
                                 d.setDate(d.getDate() - 1);
                                 return d.toLocaleDateString();
                             })()
                         }
                     </div>
                 )}
              </div>
           </div>
        )}

        {/* SI ESTÁ OCUPADO (aunque sea temporalmente) EN UNA PLAZA RESERVADA */}
        {availabilityWarning && editedMooring.status === MooringStatus.OCCUPIED && (
             <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-700 animate-pulse">
                 <AlertTriangle size={16} />
                 <span className="text-[10px] font-black uppercase">{availabilityWarning}</span>
             </div>
        )}

        {editedMooring.status !== MooringStatus.AVAILABLE && editedMooring.boat && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* GRUPO 1: DATOS DE LA EMBARCACIÓN */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                 <div className="flex items-center gap-2">
                    <Ship size={16} className="text-sky-600" />
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Datos de la Embarcación</h3>
                 </div>
                 {/* BANDERA EN LA CABECERA */}
                 <div className="flex items-center gap-2">
                     <select name="flag" value={editedMooring.boat.flag} onChange={handleBoatChange} className="text-[10px] font-bold bg-transparent outline-none text-right cursor-pointer text-slate-500 hover:text-sky-600">
                        {Object.keys(FLAG_ISO_MAP).map(f => <option key={f} value={f}>{f}</option>)}
                     </select>
                     {editedMooring.boat.flagCode && (
                        <img src={`https://flagcdn.com/w40/${editedMooring.boat.flagCode.toLowerCase()}.png`} className="w-6 h-4 rounded-sm shadow-sm" alt="Flag" />
                     )}
                 </div>
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
                {/* Bandera movida arriba, pero mantenemos el campo de puerto registro */}
                <div className="">
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
                <input 
                  type="date" 
                  name="departureDate" 
                  value={editedMooring.boat.departureDate || ''} 
                  onChange={handleBoatChange} 
                  className={`w-full mt-1 bg-slate-100 border rounded-xl px-3 py-2 text-xs font-black outline-none ${availabilityWarning ? 'border-amber-400 text-amber-700' : 'border-slate-200'}`} 
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 sticky bottom-0 bg-white border-t border-slate-100 z-[100] pb-2 flex-wrap">
          {editedMooring.status !== MooringStatus.AVAILABLE && editedMooring.boat && (
            <>
               <button onClick={(e) => { e.preventDefault(); onDepart(mooring.id, { ...editedMooring.boat! }); }} className="flex-1 px-3 py-3 bg-rose-600 text-white rounded-xl font-black text-[9px] flex items-center justify-center gap-1 hover:bg-rose-700 active:scale-95 transition-all"><Ship size={16} /> ZARPAR</button>
               
               {/* BOTÓN A MARINA SECA (ABRE FORMULARIO) */}
               <button onClick={(e) => { e.preventDefault(); setShowDryDockForm(true); }} className="flex-1 px-3 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] flex items-center justify-center gap-1 hover:bg-indigo-700 active:scale-95 transition-all"><Container size={16} /> A SECO</button>
            </>
          )}
          <button onClick={handleSaveAttempt} className="flex-[2] bg-slate-900 text-white py-3 px-4 rounded-xl font-black text-[9px] flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all"><Save size={16} /> GUARDAR</button>
          <button onClick={() => { if(confirm("¿Liberar plaza sin registrar salida?")) handleStatusChange(MooringStatus.AVAILABLE); }} className="p-3 border-2 border-slate-100 text-slate-300 rounded-xl hover:text-rose-500 hover:border-rose-100 transition-all"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default MooringEditor;
