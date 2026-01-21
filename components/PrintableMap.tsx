
import React from 'react';
import { Mooring, PierZone, MooringStatus } from '../types';
import { Printer, X } from 'lucide-react';

interface PrintableMapProps {
  moorings: Mooring[];
  onClose: () => void;
}

const PrintableMap: React.FC<PrintableMapProps> = ({ moorings, onClose }) => {
  // --- CONFIGURACIÓN GEOMÉTRICA (EXACTA A MOORINGMAP.TSX) ---
  const SVG_WIDTH = 6500; 
  const SVG_HEIGHT = 6000; 
  
  const walkwayWidth = 140; 
  const fingerWidth = 20; 
  const hammerHeight = 150; 
  const fixedHeight = 3600;
  const slotStartY = 450;
  const PIER_Y_OFFSET = 500; 

  const PIER_OFFSETS = {
    'SUR': 1000, 
    'CENTRAL': 3000,
    'NORTE': 5000
  };

  const isHeadMooring = (id: string) => {
    // Reconocer cabeceras por el sufijo G (P1/26G, P2/25G, P3/35G)
    return id.endsWith('G');
  };

  const handlePrint = () => {
    window.print();
  };

  // --- RENDERIZADO DE PANTALÁN ---
  const renderPier = (zone: PierZone, xOffset: number) => {
    const pierMoorings = moorings.filter(m => m.zone === zone);
    const headMooring = pierMoorings.find(m => isHeadMooring(m.id));
    const sideMoorings = pierMoorings.filter(m => m.id !== headMooring?.id);
    
    // Lógica de dedos compartidos (Finger logic)
    const prepareSide = (items: Mooring[]) => {
      let fingerState = true; 
      return items.map((m) => {
        let drawTop = fingerState;
        let drawBottom = false;

        if (m.customFinger === 'TOP') { drawTop = true; drawBottom = false; } 
        else if (m.customFinger === 'BOTTOM') { drawTop = false; drawBottom = true; } 
        else if (m.customFinger === 'BOTH') { drawTop = true; drawBottom = true; } 
        else if (m.customFinger === 'NONE') { drawTop = false; drawBottom = false; } 
        else {
          if (m.isSingle) { drawTop = true; fingerState = true; } 
          else {
            if (fingerState) { fingerState = false; } else { fingerState = true; }
          }
        }
        return { ...m, drawFingerTop: drawTop, drawFingerBottom: drawBottom };
      });
    };

    const leftRaw = sideMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
    const rightRaw = sideMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
    
    const leftSide = prepareSide(leftRaw);
    const rightSide = prepareSide(rightRaw);
    
    const leftSlotHeight = leftSide.length > 0 ? fixedHeight / leftSide.length : 0;
    const rightSlotHeight = rightSide.length > 0 ? fixedHeight / rightSide.length : 0;

    const renderSlot = (item: Mooring & { drawFingerTop: boolean; drawFingerBottom: boolean }, i: number, isRight: boolean) => {
      const m = item;
      const slotHeight = isRight ? rightSlotHeight : leftSlotHeight;
      const y = PIER_Y_OFFSET + slotStartY + (i * slotHeight);
      
      let w = 400; 
      if (m.id.includes('A')) w = 260;
      else if (m.id.includes('B')) w = 320;
      else if (m.id.includes('C')) w = 400;
      else if (m.id.includes('D')) w = 500;
      
      const h = slotHeight - 10; 
      
      // Coordenadas locales
      const xWater = isRight ? walkwayWidth : -w;
      const fingerLen = w * 0.9;
      const fingerX = isRight ? walkwayWidth : -fingerLen;
      const fingerYTop = y - 10; 
      const fingerYBottom = y + h; 
      
      const centerX = xWater + w / 2;
      const centerY = y + h / 2;

      // ESTILOS PARA IMPRESIÓN (Blanco y Negro)
      const isOccupied = m.status === MooringStatus.OCCUPIED || m.status === MooringStatus.RESERVED;
      const strokeColor = "black";
      const strokeWidth = "3";
      // Relleno sutil si está ocupado para diferenciar visualmente en papel
      const fill = isOccupied ? "#f1f5f9" : "none"; 
      
      // TEXTO
      const label = m.boat ? m.boat.name : m.id;
      
      // Rotamos el texto 180 grados para que, al estar el mapa rotado 180, el texto quede derecho (0 grados visuales)
      const textRotation = 180; 

      return (
        <g key={m.id}>
          {/* Fingers */}
          {item.drawFingerTop && <rect x={fingerX} y={fingerYTop} width={fingerLen} height={fingerWidth} fill="black" />}
          {item.drawFingerBottom && <rect x={fingerX} y={fingerYBottom} width={fingerLen} height={fingerWidth} fill="black" />}
          
          {/* Plaza */}
          <rect x={xWater} y={y} width={w} height={h} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} />
          
          {/* Texto (Nombre Barco o ID Plaza) */}
          <g transform={`translate(${centerX}, ${centerY})`}>
             <text 
                transform={`rotate(${textRotation})`}
                textAnchor="middle" 
                dominantBaseline="middle" 
                fontSize="55" 
                fontWeight="bold" 
                fill="black"
                fontFamily="sans-serif"
             >
                {label.length > 15 ? label.substring(0, 15) + '.' : label}
             </text>
             {/* Si hay barco, mostramos dimensiones pequeñas debajo */}
             {m.boat && (
                 <text 
                    transform={`rotate(${textRotation}) translate(0, -40)`} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fontSize="30" 
                    fill="#64748b"
                    fontFamily="sans-serif"
                 >
                    {m.boat.length}x{m.boat.beam}m
                 </text>
             )}
          </g>
        </g>
      );
    };

    const piersEndAt = PIER_Y_OFFSET + slotStartY + fixedHeight;
    const hammerConcreteWidth = 900; 

    return (
      <g key={zone} transform={`translate(${xOffset}, 0)`}>
        {/* Pasillo Principal */}
        <rect x="0" y={PIER_Y_OFFSET} width={walkwayWidth} height={fixedHeight + hammerHeight + slotStartY} fill="none" stroke="black" strokeWidth="6" />
        
        {/* Etiqueta del Pantalán */}
        <g transform={`translate(${walkwayWidth/2}, ${PIER_Y_OFFSET + 250}) rotate(180)`}>
          <text textAnchor="middle" y="30" fontSize="120" fontWeight="900" fill="black" letterSpacing="10">{zone}</text>
        </g>

        {/* Plazas */}
        {leftSide.map((m, i) => renderSlot(m, i, false))}
        {rightSide.map((m, i) => renderSlot(m, i, true))}
        
        {/* Cabecera (Martillo) */}
        {headMooring && (
          <g transform={`translate(${walkwayWidth/2}, ${piersEndAt})`}>
             <rect x={-hammerConcreteWidth / 2} y={-50} width={hammerConcreteWidth} height={hammerHeight + 50} fill="none" stroke="black" strokeWidth="6" />
             <g transform="rotate(180)">
              <rect 
                x={-hammerConcreteWidth / 2} 
                y={-(hammerHeight + 20 + 280)} 
                width={hammerConcreteWidth} 
                height={280} 
                fill={headMooring.boat ? "#f1f5f9" : "none"} 
                stroke="black" 
                strokeWidth="6" 
              />
              <text 
                x={0} 
                y={-(hammerHeight + 20 + 140)} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                fontSize="100" 
                fontWeight="bold" 
                fill="black"
              >
                {headMooring.boat ? headMooring.boat.name : headMooring.id}
              </text>
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto flex flex-col items-center font-sans">
      {/* Barra de Herramientas (No sale en impresión) */}
      <div className="w-full bg-slate-900 text-white p-4 flex justify-between items-center print:hidden sticky top-0 shadow-xl z-50">
        <div>
          <h2 className="text-lg font-bold">Plano Técnico de Ocupación</h2>
          <p className="text-xs text-slate-400">Esquema B/N optimizado para impresora</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg active:scale-95">
            <Printer size={18} /> Imprimir
          </button>
          <button onClick={onClose} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold transition-colors">
            <X size={18} /> Cerrar
          </button>
        </div>
      </div>

      {/* Área Imprimible */}
      <div className="bg-white p-0 w-full max-w-[297mm] flex flex-col items-center">
        <div className="w-full h-full p-4">
          
          {/* Cabecera del Documento Impreso */}
          <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-4">
            <div>
               <h1 className="text-4xl font-black uppercase tracking-tighter">CN Camariñas</h1>
               <p className="text-sm font-bold uppercase tracking-widest mt-1">Plano de ubicación de embarcaciones</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold">Fecha: {new Date().toLocaleDateString()}</p>
               <p className="text-xs text-slate-500">Generado por MarinaPro System</p>
            </div>
          </div>

          {/* SVG MAPA */}
          <svg 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            width="100%" 
            height="auto"
            preserveAspectRatio="xMidYMid meet"
            className="border border-slate-200 print:border-none"
          >
            {/* Rotación 180 grados para que la entrada coincida con la visualización habitual */}
            <g transform={`rotate(180, ${SVG_WIDTH / 2}, ${SVG_HEIGHT / 2})`}>
                {renderPier('SUR', PIER_OFFSETS.SUR)}
                {renderPier('CENTRAL', PIER_OFFSETS.CENTRAL)}
                {renderPier('NORTE', PIER_OFFSETS.NORTE)}
            </g>
            
            {/* Leyenda Simple SVG */}
            <g transform="translate(100, 100)">
               <rect x="0" y="0" width="1000" height="300" fill="white" stroke="black" strokeWidth="2" />
               <text x="50" y="80" fontSize="50" fontWeight="bold">LEYENDA:</text>
               <rect x="50" y="120" width="50" height="50" fill="none" stroke="black" strokeWidth="3" />
               <text x="120" y="160" fontSize="40">Plaza Libre</text>
               <rect x="50" y="200" width="50" height="50" fill="#f1f5f9" stroke="black" strokeWidth="3" />
               <text x="120" y="240" fontSize="40">Ocupada / Reservada</text>
            </g>
          </svg>

        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableMap;
