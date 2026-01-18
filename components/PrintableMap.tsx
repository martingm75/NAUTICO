
import React from 'react';
import { Mooring, PierZone } from '../types';
import { Printer, X, Download } from 'lucide-react';

interface PrintableMapProps {
  moorings: Mooring[];
  onClose: () => void;
}

const PrintableMap: React.FC<PrintableMapProps> = ({ moorings, onClose }) => {
  // Configuración del dibujo
  const SVG_WIDTH = 1123; // A4 Landscape aprox width en pixels (96dpi)
  const SVG_HEIGHT = 794; // A4 Landscape height
  const PIER_SPACING = 350;
  const START_X = 200;
  const START_Y = 100;
  const SLOT_HEIGHT = 28; // Altura de cada plaza en el esquema
  const PIER_WIDTH = 40;  // Ancho del pasillo central

  // Agrupar amarres
  const getPierData = (zone: PierZone) => {
    const raw = moorings.filter(m => m.zone === zone);
    const head = raw.find(m => m.id.includes('G') || m.id === 'P2/26C');
    
    // Separar pares e impares para simular lados (como en el mapa interactivo)
    // Asumimos: Impares Izquierda, Pares Derecha (o viceversa según constante, aquí visual)
    const leftSide = raw.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0 && m !== head).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
    const rightSide = raw.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0 && m !== head).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));

    return { head, leftSide, rightSide };
  };

  const renderPierColumn = (zone: PierZone, xOffset: number, title: string) => {
    const { head, leftSide, rightSide } = getPierData(zone);
    const maxRows = Math.max(leftSide.length, rightSide.length);
    const pierLength = maxRows * SLOT_HEIGHT + 50;
    
    // Ajuste dinámico del ancho de la caja del título para "MARTILLO X"
    const titleBoxWidth = 260;
    const titleBoxX = (PIER_WIDTH / 2) - (titleBoxWidth / 2);

    return (
      <g transform={`translate(${xOffset}, ${START_Y})`}>
        {/* Título del Pantalán (Martillo) */}
        <rect x={titleBoxX} y={-60} width={titleBoxWidth} height={40} fill="none" stroke="black" strokeWidth="2" />
        <text x={PIER_WIDTH/2} y={-35} textAnchor="middle" fontSize="20" fontWeight="bold" fontFamily="sans-serif">{title}</text>

        {/* Pasarela Central */}
        <rect x={0} y={0} width={PIER_WIDTH} height={pierLength} fill="none" stroke="black" strokeWidth="2" />

        {/* Plazas Izquierda */}
        {leftSide.map((m, i) => {
          const y = i * SLOT_HEIGHT;
          return (
            <g key={m.id} transform={`translate(0, ${y})`}>
              {/* Finger outline shape - path simulando el "notch" */}
              <path d={`M 0 0 L -80 0 L -90 ${SLOT_HEIGHT/2} L -80 ${SLOT_HEIGHT} L 0 ${SLOT_HEIGHT}`} fill="none" stroke="black" strokeWidth="1.5" />
              {/* Texto: Nombre barco o ID */}
              <text x={-5} y={SLOT_HEIGHT/2 + 4} textAnchor="end" fontSize="10" fontFamily="sans-serif" fontWeight={m.boat ? "bold" : "normal"}>
                {m.boat ? (m.boat.name.length > 12 ? m.boat.name.substring(0, 12) + '.' : m.boat.name) : m.id}
              </text>
            </g>
          );
        })}

        {/* Plazas Derecha */}
        {rightSide.map((m, i) => {
          const y = i * SLOT_HEIGHT;
          return (
            <g key={m.id} transform={`translate(${PIER_WIDTH}, ${y})`}>
              {/* Finger outline shape */}
              <path d={`M 0 0 L 80 0 L 90 ${SLOT_HEIGHT/2} L 80 ${SLOT_HEIGHT} L 0 ${SLOT_HEIGHT}`} fill="none" stroke="black" strokeWidth="1.5" />
              {/* Texto */}
              <text x={5} y={SLOT_HEIGHT/2 + 4} textAnchor="start" fontSize="10" fontFamily="sans-serif" fontWeight={m.boat ? "bold" : "normal"}>
                {m.boat ? (m.boat.name.length > 12 ? m.boat.name.substring(0, 12) + '.' : m.boat.name) : m.id}
              </text>
            </g>
          );
        })}

        {/* Cabecera */}
        {head && (
          <g transform={`translate(${PIER_WIDTH/2}, ${pierLength})`}>
            <rect x={-100} y={0} width={200} height={40} fill="none" stroke="black" strokeWidth="2" />
            <text x={0} y={25} textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
              {head.boat ? head.boat.name : head.id}
            </text>
          </g>
        )}
      </g>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto flex flex-col items-center">
      {/* Controls - Hidden when printing */}
      <div className="w-full bg-slate-900 text-white p-4 flex justify-between items-center print:hidden sticky top-0 shadow-xl">
        <div>
          <h2 className="text-lg font-bold">Plano de Ocupación Actual</h2>
          <p className="text-xs text-slate-400">Vista esquemática para impresión</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg font-bold transition-colors">
            <Printer size={18} /> Imprimir / PDF
          </button>
          <button onClick={onClose} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold transition-colors">
            <X size={18} /> Cerrar
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-8 print:p-0 w-full max-w-[1200px] flex-1 flex flex-col items-center">
        <div className="print:w-full w-full border border-slate-200 print:border-none shadow-2xl print:shadow-none p-10 bg-white">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">CN Camariñas</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Plano de ubicación de embarcaciones</p>
            <p className="text-xs text-slate-400 mt-1">Fecha: {new Date().toLocaleDateString()}</p>
          </div>

          <svg 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            width="100%" 
            height="auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {renderPierColumn('NORTE', START_X, 'MARTILLO NORTE')}
            {renderPierColumn('CENTRAL', START_X + PIER_SPACING, 'MARTILLO CENTRAL')}
            {renderPierColumn('SUR', START_X + (PIER_SPACING * 2), 'MARTILLO SUR')}
            
            {/* Leyenda simple en el mapa */}
            <g transform={`translate(${SVG_WIDTH - 200}, ${SVG_HEIGHT - 50})`}>
               <text fontSize="10" fill="#64748b" textAnchor="end">Generado por MarinaPro</text>
            </g>
          </svg>

        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableMap;
