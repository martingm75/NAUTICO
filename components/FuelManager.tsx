
import React, { useState, useEffect } from 'react';
import { FuelState } from '../types';
import { Fuel, Droplets, Receipt, Save, Settings, Printer, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import FuelReceipt from './FuelReceipt';

const FuelManager: React.FC = () => {
  const [fuel, setFuel] = useState<FuelState>(() => {
    const saved = localStorage.getItem('marina_fuel_data');
    return saved ? JSON.parse(saved) : {
      pricePerLiter: 1.55,
      currentLiters: 8500,
      maxCapacity: 10000
    };
  });

  const [supplyLiters, setSupplyLiters] = useState<string>('0.00');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);

  useEffect(() => {
    localStorage.setItem('marina_fuel_data', JSON.stringify(fuel));
  }, [fuel]);

  const handleUpdateFuel = (field: keyof FuelState, value: string) => {
    const num = parseFloat(value);
    setFuel(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const handleRegisterSupply = () => {
    const liters = parseFloat(supplyLiters);
    if (isNaN(liters) || liters <= 0) return;
    
    if (liters > fuel.currentLiters) {
      alert("No hay suficiente combustible en el depósito.");
      return;
    }

    setLastTotal(liters * fuel.pricePerLiter);
    setFuel(prev => ({ ...prev, currentLiters: prev.currentLiters - liters }));
    setShowReceipt(true);
  };

  const tankPercentage = Math.min(Math.max((fuel.currentLiters / fuel.maxCapacity) * 100, 0), 100);
  const isLow = tankPercentage < 20;

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
      {showReceipt && (
        <FuelReceipt 
          price={fuel.pricePerLiter} 
          liters={parseFloat(supplyLiters)} 
          onClose={() => setShowReceipt(false)} 
        />
      )}

      <div className="max-w-4xl mx-auto w-full space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <Fuel className="text-sky-600" size={32} /> Gestión de Combustible
            </h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Estación de Suministro CN Camariñas</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* TANQUE VISUAL */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-slate-200 w-full flex flex-col items-center gap-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Nivel de Depósito</h3>
              
              <div className="relative w-32 h-64 bg-slate-100 rounded-3xl border-8 border-slate-800 overflow-hidden shadow-inner">
                {/* Indicador de Fluido */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out flex items-center justify-center ${isLow ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ height: `${tankPercentage}%` }}
                >
                  <div className="w-full h-full opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent)] animate-pulse"></div>
                  <span className="absolute top-4 text-white font-black text-xs drop-shadow-md">
                    {Math.round(tankPercentage)}%
                  </span>
                </div>
                {/* Marcas de escala */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="absolute w-4 h-1 bg-slate-300 left-0" style={{ bottom: `${(i+1)*20}%` }}></div>
                ))}
              </div>

              <div className="text-center space-y-1">
                <p className="text-2xl font-black text-slate-800">{fuel.currentLiters.toLocaleString()} L</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibles</p>
              </div>

              <div className="w-full pt-4 border-t border-slate-100 space-y-3">
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Settings size={10} /> Capacidad Max (L)
                    </label>
                    <input 
                      type="number" 
                      value={fuel.maxCapacity} 
                      onChange={(e) => handleUpdateFuel('maxCapacity', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1">
                      <Edit3 size={10} /> Ajustar Stock Actual (L)
                    </label>
                    <input 
                      type="number" 
                      value={fuel.currentLiters} 
                      onChange={(e) => handleUpdateFuel('currentLiters', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500"
                    />
                 </div>
              </div>
            </div>
          </div>

          {/* CALCULADORA DE SUMINISTRO */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                 <div className="bg-sky-100 p-3 rounded-2xl text-sky-600">
                    <Droplets size={24} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Registrar Repostaje</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cálculo de facturación directa</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Precio Gasoil (€/L)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.001"
                      value={fuel.pricePerLiter} 
                      onChange={(e) => handleUpdateFuel('pricePerLiter', e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-800 focus:border-sky-500 outline-none transition-all"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400">€/L</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Litros Suministrados</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      value={supplyLiters} 
                      onChange={(e) => setSupplyLiters(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-800 focus:border-sky-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400">L</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-lg shadow-slate-200">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total a Pagar</p>
                  <p className="text-5xl font-black tracking-tighter">
                    {(parseFloat(supplyLiters) * fuel.pricePerLiter || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
                <button 
                  onClick={handleRegisterSupply}
                  disabled={!parseFloat(supplyLiters)}
                  className="w-full md:w-auto bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-sky-500/20"
                >
                  <Receipt size={20} /> Generar Recibo
                </button>
              </div>

              <div className="mt-auto flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
                 <AlertCircle size={24} className="shrink-0" />
                 <p className="text-[10px] font-bold uppercase leading-relaxed">
                   El registro de suministro descontará automáticamente los litros indicados del stock del depósito central. 
                   Asegúrese de que el precio sea el correcto antes de procesar.
                 </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelManager;
