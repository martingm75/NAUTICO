
import React, { useState, useEffect } from 'react';
import { TariffSeason, TariffRow } from '../types';
import { Edit2, Save, X, Euro, Calendar, AlertCircle } from 'lucide-react';

interface TariffManagerProps {
  tariffs: TariffSeason[];
  onUpdate: (newTariffs: TariffSeason[]) => void;
}

const TariffManager: React.FC<TariffManagerProps> = ({ tariffs, onUpdate }) => {
  const [activeSeasonId, setActiveSeasonId] = useState<'low' | 'high'>('low');
  const [isEditing, setIsEditing] = useState(false);
  // Buffer para almacenar cambios temporales antes de guardar
  const [editBuffer, setEditBuffer] = useState<TariffSeason[]>(tariffs);

  // Sincronizar el buffer si las props cambian (ej. recarga externa) mientras no se edita
  useEffect(() => {
    if (!isEditing) {
      setEditBuffer(tariffs);
    }
  }, [tariffs, isEditing]);

  const activeSeason = isEditing 
    ? editBuffer.find(s => s.id === activeSeasonId)! 
    : tariffs.find(s => s.id === activeSeasonId)!;

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edición: restaurar buffer al estado real guardado
      setEditBuffer(tariffs);
    } else {
      // Iniciar edición: asegurarse que el buffer tiene los datos actuales
      setEditBuffer(tariffs);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    onUpdate(editBuffer);
    setIsEditing(false);
  };

  const handlePriceChange = (rowId: string, field: keyof TariffRow, value: string) => {
    const numValue = parseFloat(value);
    
    setEditBuffer(prev => prev.map(season => {
      if (season.id !== activeSeasonId) return season;
      return {
        ...season,
        rows: season.rows.map(row => {
          if (row.id !== rowId) return row;
          return { ...row, [field]: isNaN(numValue) ? 0 : numValue };
        })
      };
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Euro className="text-sky-600" /> Tarifas de Amarre
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de precios por eslora y temporada.</p>
        </div>
        
        <div className="flex gap-2">
           {isEditing ? (
             <>
               <button 
                 onClick={handleEditToggle}
                 className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
               >
                 <X size={16} /> Cancelar
               </button>
               <button 
                 onClick={handleSave}
                 className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-colors flex items-center gap-2 text-sm shadow-lg shadow-emerald-200"
               >
                 <Save size={16} /> Guardar Cambios
               </button>
             </>
           ) : (
             <button 
               onClick={handleEditToggle}
               className="px-6 py-2 rounded-xl bg-slate-900 text-white font-black hover:bg-black transition-colors flex items-center gap-2 text-sm shadow-lg"
             >
               <Edit2 size={16} /> Editar Precios
             </button>
           )}
        </div>
      </div>

      {/* Season Tabs */}
      <div className="flex border-b border-slate-100">
        {tariffs.map(season => (
          <button
            key={season.id}
            onClick={() => setActiveSeasonId(season.id)}
            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all ${
              activeSeasonId === season.id 
                ? 'bg-white text-sky-600 border-b-2 border-sky-600' 
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {season.name} <span className="text-[10px] ml-2 font-medium opacity-70">({season.dates})</span>
          </button>
        ))}
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 w-1/4">Eslora</th>
              <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Día (€)</th>
              <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Semana (€)</th>
              <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Mes (€)</th>
              <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 text-right">Anual (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeSeason.rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-700 text-sm">
                  {row.range}
                </td>
                <td className="py-3 px-6 text-right">
                  {isEditing ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={row.daily}
                      onChange={(e) => handlePriceChange(row.id, 'daily', e.target.value)}
                      className="w-20 text-right bg-white border border-sky-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  ) : (
                    <span className="font-medium text-slate-600">{row.daily.toFixed(2)} €</span>
                  )}
                </td>
                <td className="py-3 px-6 text-right">
                  {isEditing ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={row.weekly}
                      onChange={(e) => handlePriceChange(row.id, 'weekly', e.target.value)}
                      className="w-20 text-right bg-white border border-sky-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  ) : (
                    <span className="font-medium text-slate-600">{row.weekly.toFixed(2)} €</span>
                  )}
                </td>
                <td className="py-3 px-6 text-right">
                  {isEditing ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={row.monthly}
                      onChange={(e) => handlePriceChange(row.id, 'monthly', e.target.value)}
                      className="w-20 text-right bg-white border border-sky-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  ) : (
                    <span className="font-medium text-slate-600">{row.monthly.toFixed(2)} €</span>
                  )}
                </td>
                <td className="py-3 px-6 text-right">
                  {isEditing ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={row.annual}
                      onChange={(e) => handlePriceChange(row.id, 'annual', e.target.value)}
                      className="w-20 text-right bg-white border border-sky-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  ) : (
                    <span className="font-bold text-sky-600">{row.annual > 0 ? `${row.annual.toFixed(2)} €` : 'N/D'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-sky-50 p-4 border-t border-sky-100 flex items-start gap-3">
        <AlertCircle size={20} className="text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-800 space-y-1">
          <p className="font-bold">Información Adicional:</p>
          <ul className="list-disc pl-4 space-y-1 opacity-80">
             <li>Estos precios incluyen el IVA, tasa de Portos de Galicia y servicios (agua, luz, aseos, wifi).</li>
             <li>La tarifa mensual se establece para estancias inferiores a 6 meses.</li>
             <li>A los socios del Club Náutico se les aplicará un descuento del 10% sobre estas tarifas.</li>
             <li>Las tarifas marcadas como N/D no están disponibles para esa eslora específica bajo contrato anual.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TariffManager;
