
import React from 'react';
import { Mooring, MooringStatus, PierZone } from '../types';

interface MooringMapProps {
  moorings: Mooring[];
  onSelectMooring: (mooring: Mooring) => void;
  selectedId: string | null;
}

const MooringMap: React.FC<MooringMapProps> = ({ moorings, onSelectMooring, selectedId }) => {
  
  const TextLogo = () => (
    <g transform="translate(50, 120)">
      <rect x="-10" y="-55" width="450" height="90" fill="white" fillOpacity="0.8" rx="15" />
      <text x="0" y="0" style={{ fontFamily: 'Arial Black, sans-serif', fontWeight: 900 }}>
        <tspan fill="#b45309" fontSize="64">CN</tspan>
        <tspan fill="#0f172a" fontSize="64" dx="15" letterSpacing="-4px">CAMARIÑAS</tspan>
      </text>
      <text x="5" y="25" className="fill-slate-600 text-[16px] font-black tracking-[0.5em] uppercase">Club Náutico Premium</text>
    </g>
  );

  const BoatIcon = ({ width, height, isHorizontal = true }: { 
    width: number, height: number, isHorizontal?: boolean 
  }) => {
    // Diseño fiel a la imagen: madera ocre, cabina blanca, parabrisas gris oscuro
    const renderBoatContent = () => {
      return (
        <g>
          <path 
            d={`M 2 ${height/2} C 2 4, ${width*0.3} 2, ${width} 6 L ${width} ${height-6} C ${width*0.3} ${height-4}, 2 ${height-2}, 2 ${height/2} Z`} 
            fill="black" fillOpacity="0.1" transform="translate(3, 3)"
          />
          <path 
            d={`M 0 ${height/2} C 0 2, ${width*0.25} 0, ${width} 5 L ${width} ${height-5} C ${width*0.25} ${height}, 0 ${height/2} Z`} 
            fill="white" stroke="#94a3b8" strokeWidth="1" 
          />
          <path 
            d={`M ${width*0.08} ${height/2} C ${width*0.08} ${height*0.15}, ${width*0.3} ${height*0.1}, ${width*0.94} ${height*0.15} L ${width*0.94} ${height*0.85} C ${width*0.3} ${height*0.9}, ${width*0.08} ${height*0.85}, ${width*0.08} ${height/2} Z`} 
            fill="#c27e47" 
          />
          <path 
            d={`M ${width*0.3} ${height*0.25} L ${width*0.9} ${height*0.25} L ${width*0.9} ${height*0.75} L ${width*0.3} ${height*0.75} Q ${width*0.2} ${height/2} ${width*0.3} ${height*0.25} Z`} 
            fill="white" 
          />
          <path 
            d={`M ${width*0.32} ${height*0.38} Q ${width*0.48} ${height/2} ${width*0.32} ${height*0.62} L ${width*0.42} ${height*0.62} Q ${width*0.58} ${height/2} ${width*0.42} ${height*0.38} Z`} 
            fill="#334155" 
          />
          <path 
            d={`M ${width*0.6} ${height*0.45} Q ${width*0.75} ${height/2} ${width*0.6} ${height*0.55} L ${width*0.7} ${height*0.55} Q ${width*0.85} ${height/2} ${width*0.7} ${height*0.45} Z`} 
            fill="#334155" 
          />
        </g>
      );
    };

    return (
      <g transform={isHorizontal ? "" : `rotate(90 ${width/2} ${height/2}) translate(0, ${-height/2 + width/2})`}>
        {renderBoatContent()}
      </g>
    );
  };

  const renderPier = (zone: PierZone, xOffset: number) => {
    const pierMoorings = moorings.filter(m => m.zone === zone);
    const headMooring = pierMoorings.find(m => m.id === 'P3/35G' || m.id === 'P1/25C' || m.id === 'P2/26C');
    const sideMoorings = pierMoorings.filter(m => m.id !== headMooring?.id);
    
    const leftSide = sideMoorings.filter(m => {
      const numStr = m.id.split('/')[1].replace(/[A-Z]/g, '');
      return parseInt(numStr) % 2 === 0;
    }).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));

    const rightSide = sideMoorings.filter(m => {
      const numStr = m.id.split('/')[1].replace(/[A-Z]/g, '');
      return parseInt(numStr) % 2 !== 0;
    }).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));

    const fixedTotalHeight = 950;
    const slotTotalHeight = fixedTotalHeight / (Math.max(leftSide.length, rightSide.length) + 1);

    const renderSide = (mooringsList: Mooring[], isRight: boolean) => {
      return mooringsList.map((m, i) => {
        const y = 300 + (i * slotTotalHeight);
        const mooringWidth = m.id.includes('A') ? 70 : m.id.includes('B') ? 80 : m.id.includes('D') ? 110 : 95;
        const xPos = isRight ? 72 : 58 - mooringWidth;
        const isSelected = selectedId === m.id;
        
        // FINGERS ESTANDARIZADOS: Misma longitud y grosor para todos
        const fingerWidth = 65; 
        const fingerHeight = 8;
        const fingerX = isRight ? 72 : 58 - fingerWidth;

        return (
          <g key={m.id} className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); onSelectMooring(m); }}>
            <rect 
              x={xPos} y={y} width={mooringWidth} height={slotTotalHeight - 4} 
              fill={isSelected ? "rgba(180, 83, 9, 0.2)" : "rgba(255,255,255,0.7)"} 
              stroke={isSelected ? "#b45309" : "#cbd5e1"} 
              strokeWidth={isSelected ? "4" : "1.5"} 
            />
            
            {/* Finger Estandarizado */}
            <rect x={fingerX} y={y + slotTotalHeight - 10} width={fingerWidth} height={fingerHeight} fill="#475569" rx="2" />
            <rect x={fingerX} y={y + slotTotalHeight - 10} width={fingerWidth} height={2} fill="#94a3b8" rx="1" />

            {m.status === MooringStatus.OCCUPIED && (
              <g transform={`translate(${xPos + (isRight ? 12 : 8)}, ${y + 6})`}>
                <BoatIcon width={mooringWidth - 20} height={slotTotalHeight - 16} />
              </g>
            )}

            <text 
              x={xPos + mooringWidth / 2} y={y + slotTotalHeight / 2 + 8} 
              textAnchor="middle" 
              className={`text-[18px] font-black pointer-events-none transition-all ${isSelected ? 'fill-amber-900 scale-125' : 'fill-slate-900'}`}
              style={{ filter: 'drop-shadow(0px 1px 1px white)' }}
            >
              {m.id.split('/')[1]}
            </text>
          </g>
        );
      });
    };

    return (
      <g key={zone} transform={`translate(${xOffset}, 0)`}>
        {/* Pantalán Principal */}
        <rect x="58" y="250" width="14" height={fixedTotalHeight + 60} fill="#334155" />
        <rect x="61" y="250" width="8" height={fixedTotalHeight + 60} fill="#475569" />
        
        {/* ETIQUETA PANTALÁN - MUCHO MÁS VISIBLE */}
        <g transform="translate(65, 240)">
          <rect x="-100" y="-55" width="200" height="70" fill="white" rx="10" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
          <text textAnchor="middle" className="text-[52px] font-black fill-slate-900 tracking-tighter uppercase">
            {zone}
          </text>
          <rect x="-70" y="8" width="140" height="10" fill="#b45309" rx="5" />
        </g>

        {renderSide(leftSide, false)}
        {renderSide(rightSide, true)}

        {/* CABECERA (T-Head) */}
        {headMooring && (
          <g transform={`translate(15, ${300 + fixedTotalHeight + 80})`} className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); onSelectMooring(headMooring); }}>
            <rect x="47" y="-75" width="6" height="75" fill="#334155" />
            <rect x="-50" y="0" width="200" height="35" fill="#1e293b" rx="6" />
            
            <rect 
              x="-60" y="35" width="220" height="120" 
              fill={selectedId === headMooring.id ? "rgba(180, 83, 9, 0.2)" : "rgba(255,255,255,0.6)"} 
              stroke={selectedId === headMooring.id ? "#b45309" : "#cbd5e1"} 
              strokeWidth={selectedId === headMooring.id ? "6" : "2"} rx="10"
            />

            {headMooring.status === MooringStatus.OCCUPIED && (
              <g transform="translate(55, 45)">
                <BoatIcon width={110} height={100} isHorizontal={false} />
              </g>
            )}

            <rect x="20" y="-20" width="60" height="40" fill="#b45309" rx="10" />
            <text x="50" y="8" textAnchor="middle" className="text-[22px] font-black fill-white">
              {headMooring.id.split('/')[1]}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] overflow-hidden flex items-center justify-center p-0 select-none relative" onClick={() => onSelectMooring(null as any)}>
      <svg 
        viewBox="0 0 1000 1600" 
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMin meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="wavesGrid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 0 50 Q 25 25, 50 50 T 100 50" fill="none" stroke="#e2e8f0" strokeWidth="2" />
          </pattern>
        </defs>

        <rect width="1000" height="1600" fill="#f0f9ff" />
        <rect width="1000" height="1600" fill="url(#wavesGrid)" />
        
        <TextLogo />
        
        {renderPier('NORTE', 130)}
        {renderPier('CENTRAL', 460)}
        {renderPier('SUR', 790)}
        
        {/* Muelle Tierra */}
        <rect x="0" y="0" width="1000" height="60" fill="#f1f5f9" />
        <line x1="0" y1="60" x2="1000" y2="60" stroke="#cbd5e1" strokeWidth="4" />
      </svg>
    </div>
  );
};

export default MooringMap;
