
import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface FuelReceiptProps {
  price: number;
  liters: number;
  onClose: () => void;
}

const FuelReceipt: React.FC<FuelReceiptProps> = ({ price, liters, onClose }) => {
  const [formData, setFormData] = useState({
    header1: "Lugar Peirao Novo s/n 15123",
    header2: "CIF: G15364623",
    header3: "Tlf: 981 73 70 73",
    fecha: new Date().toLocaleDateString('es-ES'),
    hora: new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}),
    barco: "",
    dni: "",
    precio: price.toFixed(3),
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

      <div className="bg-white w-full max-w-[80mm] min-h-[150mm] p-6 shadow-2xl print:shadow-none print:m-0 font-mono text-black relative flex flex-col items-center">
        
        {/* LOGO CN CAMARIÑAS CORREGIDO (Vector Geométrico) */}
        <div className="w-full flex flex-col items-center mb-4">
           {/* Contenedor del Logo */}
           <div className="w-32 h-20 mb-3">
              <svg viewBox="0 0 300 180" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Definiciones para recorte y sombra */}
                <defs>
                  <filter id="flagShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1"/>
                  </filter>
                  <clipPath id="flagClip">
                     <path d="M 10 10 L 290 90 L 10 170 Z" />
                  </clipPath>
                </defs>

                {/* Fondo del Banderín (Triángulo Blanco) */}
                <path d="M 10 10 L 290 90 L 10 170 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="2" filter="url(#flagShadow)" />

                {/* Cruz Azul - Recortada a la forma del banderín */}
                <g clipPath="url(#flagClip)">
                   {/* Barra Vertical */}
                   <rect x="80" y="0" width="40" height="180" fill="#2563eb" />
                   {/* Barra Horizontal */}
                   <rect x="0" y="70" width="300" height="40" fill="#2563eb" />
                </g>
                
                {/* Timón Rojo en la intersección */}
                <g transform="translate(100, 90)">
                   {/* Aro exterior */}
                   <circle r="22" fill="none" stroke="#dc2626" strokeWidth="6" />
                   {/* Centro */}
                   <circle r="6" fill="#dc2626" />
                   {/* Radios */}
                   <g stroke="#dc2626" strokeWidth="5" strokeLinecap="round">
                     <line x1="0" y1="-30" x2="0" y2="30" />
                     <line x1="-30" y1="0" x2="30" y2="0" />
                     <line x1="-21" y1="-21" x2="21" y2="21" />
                     <line x1="21" y1="-21" x2="-21" y2="21" />
                   </g>
                   {/* Empuñaduras del timón */}
                   <circle cx="0" cy="-34" r="3" fill="#dc2626" />
                   <circle cx="0" cy="34" r="3" fill="#dc2626" />
                   <circle cx="-34" cy="0" r="3" fill="#dc2626" />
                   <circle cx="34" cy="0" r="3" fill="#dc2626" />
                </g>
              </svg>
           </div>
           
           <h1 className="text-lg font-black tracking-tight uppercase leading-none mt-1">C.N. CAMARIÑAS</h1>
           
           <div className="text-[9px] text-center w-full font-bold text-slate-600 mt-2 space-y-0.5">
             <input name="header1" value={formData.header1} onChange={handleInputChange} className="w-full text-center bg-transparent border-none outline-none p-0"/>
             <input name="header2" value={formData.header2} onChange={handleInputChange} className="w-full text-center bg-transparent border-none outline-none p-0"/>
             <input name="header3" value={formData.header3} onChange={handleInputChange} className="w-full text-center bg-transparent border-none outline-none p-0"/>
           </div>
           
           <div className="w-full border-b border-dashed border-slate-400 my-4"></div>
        </div>

        {/* DETALLES DEL TICKET */}
        <div className="w-full space-y-3 text-xs font-bold leading-relaxed">
          <div className="flex justify-between">
            <span>FECHA: {formData.fecha}</span>
            <span>HORA: {formData.hora}</span>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] text-slate-500 uppercase">Embarcación / Vessel</label>
            <input 
              name="barco"
              value={formData.barco} 
              onChange={handleInputChange}
              placeholder="NOMBRE BARCO"
              className="w-full bg-slate-50 border-b border-slate-300 outline-none uppercase py-1" 
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] text-slate-500 uppercase">Cliente / Customer ID</label>
            <input 
              name="dni"
              value={formData.dni} 
              onChange={handleInputChange}
              placeholder="DNI / PASAPORTE / CIF"
              className="w-full bg-slate-50 border-b border-slate-300 outline-none uppercase py-1" 
            />
          </div>

          <div className="w-full border-b border-dashed border-slate-400 my-2 pt-2"></div>

          <table className="w-full text-right">
             <tbody>
               <tr>
                 <td className="text-left py-1">Producto</td>
                 <td className="py-1">Gasoleo B</td>
               </tr>
               <tr>
                 <td className="text-left py-1">Precio/L</td>
                 <td className="py-1">
                   <input 
                     name="precio"
                     value={formData.precio} 
                     onChange={handleInputChange}
                     className="w-16 text-right bg-transparent outline-none" 
                   /> €
                 </td>
               </tr>
               <tr>
                 <td className="text-left py-1">Volumen</td>
                 <td className="py-1">
                    <input 
                      name="liters"
                      value={formData.liters} 
                      onChange={handleInputChange}
                      className="w-16 text-right bg-transparent outline-none" 
                    /> L
                 </td>
               </tr>
             </tbody>
          </table>

          <div className="w-full border-b border-black my-2"></div>

          <div className="flex justify-between items-end text-lg font-black mt-2">
            <span>TOTAL</span>
            <div className="flex items-baseline">
               <input 
                 name="total"
                 value={formData.total} 
                 onChange={handleInputChange}
                 className="w-24 text-right bg-transparent outline-none" 
               />
               <span>€</span>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="w-full mt-auto pt-8 text-center">
          <p className="text-[10px] font-bold">IVA INCLUIDO</p>
          <input 
            name="footer"
            value={formData.footer}
            onChange={handleInputChange}
            className="text-[10px] text-center w-full bg-transparent border-none outline-none uppercase mt-1"
          />
          <div className="mt-4 flex justify-center opacity-80">
             <svg className="w-full h-8 max-w-[200px]" viewBox="0 0 100 20">
                <rect x="0" y="0" width="10" height="20" fill="black"/>
                <rect x="15" y="0" width="5" height="20" fill="black"/>
                <rect x="25" y="0" width="15" height="20" fill="black"/>
                <rect x="45" y="0" width="8" height="20" fill="black"/>
                <rect x="58" y="0" width="20" height="20" fill="black"/>
                <rect x="85" y="0" width="10" height="20" fill="black"/>
             </svg>
          </div>
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
          ::placeholder {
            color: transparent !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FuelReceipt;
