
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Mooring, MooringStatus, Boat } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { Calendar, Globe, Anchor, Ship } from 'lucide-react';

interface StatsPanelProps {
  moorings: Mooring[];
  registry: Boat[];
}

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'total';

const StatsPanel: React.FC<StatsPanelProps> = ({ moorings, registry }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // --- ESTADO ACTUAL (SNAPSHOT) ---
  const currentStats = useMemo(() => {
    return {
      [MooringStatus.AVAILABLE]: moorings.filter(m => m.status === MooringStatus.AVAILABLE).length,
      [MooringStatus.OCCUPIED]: moorings.filter(m => m.status === MooringStatus.OCCUPIED).length,
      [MooringStatus.RESERVED]: moorings.filter(m => m.status === MooringStatus.RESERVED).length,
      [MooringStatus.MAINTENANCE]: moorings.filter(m => m.status === MooringStatus.MAINTENANCE).length,
    };
  }, [moorings]);

  const currentChartData = Object.entries(currentStats).map(([key, value]) => ({
    name: STATUS_LABELS[key as MooringStatus],
    value,
    color: STATUS_COLORS[key as MooringStatus].replace('bg-', '')
  }));

  const occupancyRate = Math.round(((currentStats[MooringStatus.OCCUPIED] + currentStats[MooringStatus.RESERVED]) / moorings.length) * 100);

  // --- LÓGICA TEMPORAL (HISTÓRICO) ---
  const getDateRange = (range: TimeRange): { start: Date, end: Date } => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = start.getDay() || 7; 
        if (day !== 1) start.setHours(-24 * (day - 1));
        break;
      case 'month':
        start.setDate(1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        start.setMonth(currentQuarter * 3, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        break;
      case 'total':
        start.setFullYear(2000); 
        break;
    }
    return { start, end };
  };

  const periodData = useMemo(() => {
    const { start, end } = getDateRange(timeRange);
    
    // Filtrar barcos que estuvieron presentes en algún momento del periodo
    const boatsInPeriod = registry.filter(boat => {
      const arrival = new Date(boat.arrivalDate);
      const departure = boat.departureDate ? new Date(boat.departureDate) : new Date('2099-12-31');
      // Lógica de intersección de rangos: (StartA <= EndB) and (EndA >= StartB)
      return arrival <= end && departure >= start;
    });

    // Separar Base vs Tránsito
    const baseCount = boatsInPeriod.filter(b => b.isBase).length;
    const transitCount = boatsInPeriod.filter(b => !b.isBase).length;

    // Nacionalidades de Tránsito
    const nationalities: Record<string, number> = {};
    boatsInPeriod.filter(b => !b.isBase).forEach(b => {
      // Usar flag o nationality, normalizar si es posible
      const nat = b.nationality || b.flag || 'Desconocido';
      nationalities[nat] = (nationalities[nat] || 0) + 1;
    });

    const nationalityData = Object.entries(nationalities)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Ordenar por cantidad

    return {
      total: boatsInPeriod.length,
      base: baseCount,
      transit: transitCount,
      nationalities: nationalityData
    };
  }, [registry, timeRange]);

  const occupancyBarData = [
    { name: 'Socios / Base', value: periodData.base, fill: '#0f172a' },
    { name: 'Tránsito', value: periodData.transit, fill: '#f59e0b' }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-8 pb-10">
      
      {/* SECCIÓN 1: ESTADO ACTUAL (SNAPSHOT) */}
      <div>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
          <Anchor size={14}/> Estado Actual del Puerto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-bold text-slate-500">Ocupación</span>
              <span className={`text-xs font-black px-2 py-0.5 rounded ${occupancyRate > 80 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{occupancyRate > 80 ? 'ALTA' : 'NORMAL'}</span>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{occupancyRate}%</p>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
               <div className="bg-slate-800 h-full rounded-full transition-all duration-1000" style={{ width: `${occupancyRate}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 h-[220px]">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Distribución por Estado</h4>
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currentChartData.map((entry, index) => {
                     let color = '#94a3b8';
                     if (entry.color === 'emerald-500') color = '#10b981';
                     if (entry.color === 'rose-600') color = '#e11d48';
                     if (entry.color === 'amber-500') color = '#f59e0b';
                     if (entry.color === 'indigo-600') color = '#4f46e5';
                     return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: ANÁLISIS TEMPORAL */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Calendar size={14}/> Análisis Histórico de Ocupación
          </h3>
          
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full">
            {[
              { id: 'today', label: 'Día' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mes' },
              { id: 'quarter', label: 'Trimestre' },
              { id: 'year', label: 'Año' },
              { id: 'total', label: 'Total' },
            ].map((period) => (
              <button 
                key={period.id}
                onClick={() => setTimeRange(period.id as TimeRange)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${timeRange === period.id ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Base vs Tránsito */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Total Amarres por Tipo</h4>
            <p className="text-[10px] text-slate-400 mb-6">Número de embarcaciones únicas atendidas en el periodo</p>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyBarData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} width={80} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                    {occupancyBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-slate-50 pt-4">
               <div className="text-center">
                 <p className="text-[9px] text-slate-400 uppercase font-bold">Total Socios</p>
                 <p className="text-xl font-black text-slate-800">{periodData.base}</p>
               </div>
               <div className="text-center">
                 <p className="text-[9px] text-slate-400 uppercase font-bold">Total Tránsito</p>
                 <p className="text-xl font-black text-amber-500">{periodData.transit}</p>
               </div>
            </div>
          </div>

          {/* Gráfico 2: Nacionalidades de Tránsito */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center gap-2"><Globe size={14}/> Nacionalidad Tránsitos</h4>
            <p className="text-[10px] text-slate-400 mb-6">Procedencia de embarcaciones de visita en el periodo</p>
            
            <div className="flex flex-col md:flex-row items-center gap-6 h-[250px]">
               <div className="flex-1 h-full w-full">
                {periodData.nationalities.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={periodData.nationalities}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {periodData.nationalities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-300 italic">Sin datos de tránsito</div>
                )}
               </div>

               <div className="flex-1 h-full overflow-y-auto custom-scrollbar pr-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[9px] text-slate-400 uppercase border-b border-slate-100">
                        <th className="pb-2 font-bold">País</th>
                        <th className="pb-2 font-bold text-right">Cant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodData.nationalities.map((nat, idx) => (
                        <tr key={nat.name} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 text-[10px] font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="truncate">{nat.name}</span>
                          </td>
                          <td className="py-2 text-[10px] font-bold text-slate-500 text-right">{nat.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
