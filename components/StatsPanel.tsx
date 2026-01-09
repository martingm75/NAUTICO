
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Mooring, MooringStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface StatsPanelProps {
  moorings: Mooring[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ moorings }) => {
  const stats = {
    [MooringStatus.AVAILABLE]: moorings.filter(m => m.status === MooringStatus.AVAILABLE).length,
    [MooringStatus.OCCUPIED]: moorings.filter(m => m.status === MooringStatus.OCCUPIED).length,
    [MooringStatus.RESERVED]: moorings.filter(m => m.status === MooringStatus.RESERVED).length,
    [MooringStatus.MAINTENANCE]: moorings.filter(m => m.status === MooringStatus.MAINTENANCE).length,
  };

  const chartData = Object.entries(stats).map(([key, value]) => ({
    name: STATUS_LABELS[key as MooringStatus],
    value,
    color: STATUS_COLORS[key as MooringStatus].replace('bg-', '')
  }));

  const occupancyRate = Math.round(((stats[MooringStatus.OCCUPIED] + stats[MooringStatus.RESERVED]) / moorings.length) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Ocupación</p>
          <p className="text-3xl font-bold text-slate-800">{occupancyRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm">Libres</p>
          <p className="text-3xl font-bold text-emerald-600">{stats[MooringStatus.AVAILABLE]}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[300px]">
        <h3 className="text-lg font-semibold mb-4">Distribución de Amarres</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.color === 'emerald-500' ? '#10b981' :
                  entry.color === 'sky-600' ? '#0284c7' :
                  entry.color === 'amber-500' ? '#f59e0b' : '#f43f5e'
                } />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPanel;
