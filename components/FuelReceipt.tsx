
import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface FuelReceiptProps {
  price: number;
  liters: number;
  onClose: () => void;
}

const FuelReceipt: React.FC<FuelReceiptProps> = ({ price, liters, onClose }) => {
  const [formData, setFormData] = useState({
    header1: "Lugar Peirao Novo s/n 15123 G15364623",
    header2: "CAMARIÑAS",
    fecha: new Date().toLocaleDateString('es-ES'),
    precio: price.toFixed(2),
    liters: liters.toFixed(2),
    total: (price * liters).toFixed(2),
    footer: "GRACIAS POR SU VISITA"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'precio' || name === 'liters') {
        const p = parseFloat(name === 'precio' ? value : prev.precio);
        const l = parseFloat(name === 'liters' ? value : prev.liters);
        updated.total = (isNaN(p) || isNaN(l)) ? "0.00" : (p * l).toFixed(2);
      }
      return updated;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex flex-col items-center overflow-y-auto py-10 print:p-0 print:bg-white print:overflow-visible">
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-[210]">
        <button 
          onClick={handlePrint}
          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-2xl transition-all active:scale-95"
        >
          <Printer size={18} /> Imprimir Recibo
        </button>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-white w-full max-w-[80mm] min-h-[120mm] p-8 shadow-2xl print:shadow-none print:m-0 font-sans text-black relative">
        
        {/* LOGO CN CAMARIÑAS (Fiel al PDF) */}
        <div className="flex flex-col items-center mb-2">
           <div className="w-48 h-28 mb-1">
              <svg viewBox="0 0 240 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Mástil */}
                <line x1="60" y1="20" x2="60" y2="120" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                
                {/* Cuerpo de la bandera (Forma dinámica) */}
                <path d="M60 25 C 100 20, 140 30, 180 25 L 210 55 L 180 85 C 140 80, 100 90, 60 85 Z" fill="white" stroke="#1e293b" strokeWidth="2" />
                
                {/* Triángulo azul (Punta de la bandera) */}
                <path d="M160 27 C 180 26, 195 25, 210 55 L 180 85 C 170 84, 165 83, 160 83 L 175 55 Z" fill="#1d4ed8" />

                {/* Rueda/Timón Rojo (Estilo PDF) */}
                <g transform="translate(100, 48) scale(1.1)">
                   <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                   <circle cx="0" cy="0" r="3.5" fill="#ef4444" />
                   {[...Array(8)].map((_, i) => (
                      <line 
                        key={i} 
                        x1="0" y1="0" 
                        x2={16 * Math.cos((i * 45) * Math.PI / 180)} 
                        y2={16 * Math.sin((i * 45) * Math.PI / 180)} 
                        stroke="#ef4444" 
                        strokeWidth="2.5" 
                      />
                   ))}
                </g>

                {/* Ondas azules abajo (Estilo PDF) */}
                <g transform="translate(75, 75)">
                  <path d="M0 0 Q 15 -8, 30 0 T 60 0 T 90 0" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M0 6 Q 15 -2, 30 6 T 60 6 T 90 6" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
           </div>
           
           <h1 className="text-xl font-black tracking-tighter uppercase mb-2">CNCAMARIÑAS</h1>
           
           <input 
              name="header1"
              value={formData.header1}
              onChange={handleInputChange}
              className="text-[10px] text-center w-full bg-transparent border-none outline-none font-bold text-slate-700"
           />
           <input 
              name="header2"
              value={formData.header2}
              onChange={handleInputChange}
              className="text-[10px] text-center w-full bg-transparent border-none outline-none font-bold uppercase mb-2 text-slate-700"
           />
           
           <div className="w-full text-center text-[10px] mb-6 font-bold text-slate-400">
             --------------------------------------------------
           </div>
        </div>

        {/* CUERPO DEL RECIBO (Fiel al layout del PDF) */}
        <div className="space-y-6 text-sm font-bold">
          <div className="flex items-center gap-2">
            <label className="shrink-0">Fecha:</label>
            <input 
              name="fecha"
              value={formData.fecha} 
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none outline-none font-black text-black" 
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="shrink-0">Precio combustible:</label>
            <div className="flex items-center">
              <input 
                name="precio"
                value={formData.precio} 
                onChange={handleInputChange}
                className="w-16 bg-transparent border-none outline-none font-black text-black text-right" 
              />
              <span className="ml-1">€/l.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="shrink-0">Litros repostados:</label>
            <input 
              name="liters"
              value={formData.liters} 
              onChange={handleInputChange}
              className="flex-1 bg-transparent border-none outline-none font-black text-black" 
            />
          </div>

          <div className="pt-8 flex items-baseline gap-4">
            <span className="text-xl font-black uppercase tracking-tighter">TOTAL:</span>
            <div className="flex-1 flex items-baseline gap-1 border-b-2 border-black pb-1">
              <input 
                name="total"
                value={formData.total} 
                onChange={handleInputChange}
                className="text-4xl font-black outline-none w-full bg-transparent border-none text-right" 
              />
              <span className="text-2xl font-black">€</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-20 text-center">
          <input 
            name="footer"
            value={formData.footer}
            onChange={handleInputChange}
            className="text-sm font-black text-center w-full bg-transparent border-none outline-none uppercase tracking-widest"
          />
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .print:hidden {
            display: none !important;
          }
          input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            appearance: none;
            -moz-appearance: textfield;
          }
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FuelReceipt;
