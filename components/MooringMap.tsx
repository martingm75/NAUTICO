
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Mooring, PierZone, MooringStatus, Boat } from '../types';
import { MAP_BASE_BOAT_COLOR, MAP_TRANSIT_BOAT_COLOR } from '../constants';
import { ZoomIn, ZoomOut, Maximize, Info, ChevronRight, Anchor } from 'lucide-react';

interface MooringMapProps {
  moorings: Mooring[];
  onSelectMooring: (mooring: Mooring) => void;
  selectedId: string | null;
  transitingBoat?: { boat: Boat; sourceId: string; targetId: string } | null;
  onAnimationComplete?: (targetId: string, boat: Boat) => void;
}

const MooringMap: React.FC<MooringMapProps> = ({ 
  moorings, 
  onSelectMooring, 
  selectedId, 
  transitingBoat,
  onAnimationComplete 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dimensiones virtuales optimizadas para ver los 3 pantalanes
  const SVG_WIDTH = 8500; 
  const SVG_HEIGHT = 6500; 
  
  const [scale, setScale] = useState(0.1);
  const [minScale, setMinScale] = useState(0.1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(false);
  const [animPos, setAnimPos] = useState<{ x: number; y: number; rotation: number } | null>(null);

  const walkwayWidth = 175; 
  const hammerHeight = 225; 
  const fixedHeight = 3600;
  const slotStartY = 450;
  const SNL_Y = 5300;

  const PIER_OFFSETS = {
    'SUR': 1800, 
    'CENTRAL': 4250,
    'NORTE': 6700
  };

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Margen para asegurar que nada toque los bordes
    const margin = 40;
    const availableWidth = clientWidth - (margin * 2);
    const availableHeight = clientHeight - (margin * 2);

    const scaleX = availableWidth / SVG_WIDTH;
    const scaleY = availableHeight / SVG_HEIGHT;
    const newScale = Math.min(scaleX, scaleY);
    
    setScale(newScale);
    setMinScale(newScale); 
    
    // Centrado exacto
    const x = (clientWidth - (SVG_WIDTH * newScale)) / 2;
    const y = (clientHeight - (SVG_HEIGHT * newScale)) / 2;
    
    setPosition({ x, y });
  }, []);

  useLayoutEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => fitToScreen());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [fitToScreen]);

  // Lógica de navegación
  useEffect(() => {
    if (!transitingBoat) {
      setAnimPos(null);
      return;
    }

    const getCoords = (mooringId: string) => {
      const mooring = moorings.find(m => m.id === mooringId);
      if (!mooring) return { x: 0, y: 0, w: 0, h: 0, isRight: false };
      
      const xOffset = PIER_OFFSETS[mooring.zone];
      const isHead = mooring.id.includes('G') || mooring.id.includes('25C') || mooring.id.includes('26C');
      
      if (isHead) {
        return { 
          x: xOffset + walkwayWidth / 2, 
          y: slotStartY + fixedHeight + hammerHeight + 330,
          w: 2000, 
          h: 600, 
          isRight: false,
          isHead: true 
        };
      }

      const pierMoorings = moorings.filter(m => m.zone === mooring.zone && !m.id.endsWith('G') && !m.id.endsWith('25C') && !m.id.endsWith('26C'));
      const leftSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      const rightSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      
      const num = parseInt(mooring.id.split('/')[1]);
      const isRight = num % 2 !== 0;
      const sideList = isRight ? rightSide : leftSide;
      const index = sideList.findIndex(m => m.id === mooringId);
      
      const maxSlots = Math.max(leftSide.length, rightSide.length);
      const slotHeight = (fixedHeight / (maxSlots + 1));
      const y = slotStartY + (index * slotHeight);
      const h = slotHeight - 40;
      const w = mooring.id.includes('A') ? 280 : mooring.id.includes('B') ? 350 : mooring.id.includes('D') ? 550 : 420;
      const x = isRight ? xOffset + walkwayWidth : xOffset - w;

      return { x: x + w/2, y: y + h/2, w, h, isRight, isHead: false };
    };

    const start = getCoords(transitingBoat.sourceId);
    const end = getCoords(transitingBoat.targetId);

    const waypoints = [
      { x: start.x, y: start.y },
      { x: start.isHead ? start.x : (start.isRight ? start.x + 900 : start.x - 900), y: start.y },
      { x: start.isHead ? start.x : (start.isRight ? start.x + 900 : start.x - 900), y: SNL_Y },
      { x: end.isHead ? end.x : (end.isRight ? end.x + 900 : end.x - 900), y: SNL_Y },
      { x: end.isHead ? end.x : (end.isRight ? end.x + 900 : end.x - 900), y: end.y },
      { x: end.x, y: end.y }
    ];

    let currentWaypoint = 0;
    let startTime = performance.now();
    const speed = 4.0;

    const animate = (time: number) => {
      if (currentWaypoint >= waypoints.length - 1) {
        onAnimationComplete?.(transitingBoat.targetId, transitingBoat.boat);
        return;
      }

      const p1 = waypoints[currentWaypoint];
      const p2 = waypoints[currentWaypoint + 1];
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const duration = dist / speed;
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);

      const curX = p1.x + (p2.x - p1.x) * t;
      const curY = p1.y + (p2.y - p1.y) * t;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI) + 90;

      setAnimPos({ x: curX, y: curY, rotation: angle });

      if (t >= 1) {
        currentWaypoint++;
        startTime = time;
      }
      requestAnimationFrame(animate);
    };

    const animReq = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animReq);
  }, [transitingBoat, moorings, onAnimationComplete]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale(prev => Math.min(Math.max(prev + delta, minScale), 6));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleEnd = () => setIsPanning(false);

  // BARCO REALISTA (SVG)
  const BoatIcon = ({ width, height, isBase = false }: { width: number, height: number, isBase?: boolean }) => {
    const boatColor = isBase ? MAP_BASE_BOAT_COLOR : MAP_TRANSIT_BOAT_COLOR;
    return (
      <g>
        {/* Sombra */}
        <path d={`M ${width*0.5} ${height} L ${width*0.05} ${height*0.7} Q ${width*0.05} ${height*0.2}, ${width*0.5} 0 Q ${width*0.95} ${height*0.2}, ${width*0.95} ${height*0.7} Z`} fill="black" fillOpacity="0.15" transform="translate(10, 10)"/>
        
        {/* Casco Principal */}
        <path d={`M ${width*0.5} ${height} L 0 ${height*0.7} Q 0 ${height*0.15}, ${width*0.5} 0 Q ${width} ${height*0.15}, ${width} ${height*0.7} Z`} fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
        
        {/* Cubierta/Interior */}
        <path d={`M ${width*0.5} ${height*0.92} L ${width*0.1} ${height*0.68} Q ${width*0.1} ${height*0.25}, ${width*0.5} ${height*0.1} Q ${width*0.9} ${height*0.25}, ${width*0.9} ${height*0.68} Z`} fill={boatColor} />
        
        {/* Cabina/Windshield */}
        <path d={`M ${width*0.25} ${height*0.6} L ${width*0.75} ${height*0.6} L ${width*0.82} ${height*0.4} Q ${width*0.5} ${height*0.3}, ${width*0.18} ${height*0.4} Z`} fill="white" fillOpacity="0.9" stroke="white" strokeWidth="2" />
        
        {/* Detalle de bañera (Cockpit) */}
        <rect x={width*0.35} y={height*0.65} width={width*0.3} height={height*0.15} rx={width*0.02} fill="white" fillOpacity="0.4" />
        
        {/* Proa Detalle */}
        <line x1={width*0.5} y1={height*0.1} x2={width*0.5} y2={height*0.3} stroke="white" strokeWidth="2" strokeOpacity="0.5" />
      </g>
    );
  };

  const renderPier = (zone: PierZone, xOffset: number) => {
    const pierMoorings = moorings.filter(m => m.zone === zone);
    const headMooring = pierMoorings.find(m => m.id.endsWith('G') || m.id.endsWith('25C') || m.id.endsWith('26C'));
    const sideMoorings = pierMoorings.filter(m => m.id !== headMooring?.id);
    
    const leftSide = sideMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
    const rightSide = sideMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));

    const maxSlots = Math.max(leftSide.length, rightSide.length);
    const slotHeight = (fixedHeight / (maxSlots + 1));

    const renderSlot = (m: Mooring, i: number, isRight: boolean) => {
      const y = slotStartY + (i * slotHeight);
      const w = m.id.includes('A') ? 280 : m.id.includes('B') ? 350 : m.id.includes('D') ? 550 : 420;
      const x = isRight ? walkwayWidth : -w;
      const isSelected = selectedId === m.id;
      const h = slotHeight - 40;
      const centerX = x + w / 2;
      const centerY = y + h / 2;

      let labelStroke = m.boat ? "white" : "#1e293b";
      let labelFill = m.boat ? "#1e293b" : "rgba(255, 255, 255, 0.95)";
      let labelTextFill = m.boat ? "fill-white" : "fill-slate-900";

      if (m.status === MooringStatus.AVAILABLE) labelStroke = "#10b981";
      else if (m.status === MooringStatus.RESERVED) {
        labelStroke = "#f59e0b";
        labelFill = "#fffbeb";
        labelTextFill = "fill-amber-700";
      }

      const shouldDrawFinger = isRight ? (i % 2 !== 0) : (i % 2 === 0);

      return (
        <g key={m.id} onClick={(e) => { e.stopPropagation(); onSelectMooring(m); }} className="cursor-pointer">
          <rect x={x} y={y} width={w} height={h} fill={isSelected ? "rgba(14, 165, 233, 0.15)" : (m.status === MooringStatus.RESERVED ? "#fffbeb" : "rgba(255,255,255,0.95)")} stroke={isSelected ? "#0ea5e9" : "#cbd5e1"} strokeWidth={isSelected ? "15" : "3"} rx="10" />
          {m.boat && (
            <g transform={isRight ? `translate(${centerX - (w*0.8)/2}, ${centerY - (h*0.85)/2})` : `translate(${centerX + (w*0.8)/2}, ${centerY - (h*0.85)/2}) scale(-1, 1)`} style={{ pointerEvents: 'none' }}>
              <BoatIcon width={w * 0.8} height={h * 0.85} isBase={m.boat.isBase} />
            </g>
          )}
          <g transform={`translate(${centerX}, ${centerY}) rotate(180)`} style={{ pointerEvents: 'none' }}>
            <rect x="-130" y="-65" width="260" height="130" rx="30" fill={labelFill} stroke={labelStroke} strokeWidth="10" />
            <text textAnchor="middle" y="25" className={`text-[90px] font-black tracking-tighter ${labelTextFill}`}>{m.id}</text>
          </g>
          {shouldDrawFinger && (
             <rect x={isRight ? walkwayWidth : -(w * 1.05)} y={y + slotHeight - 65} width={w * 1.05} height={65} fill="#334155" rx="8" />
          )}
        </g>
      );
    };

    const piersEndAt = slotStartY + fixedHeight;

    return (
      <g key={zone} transform={`translate(${xOffset}, 200)`}>
        <rect x="0" y="0" width={walkwayWidth} height={piersEndAt} fill="#1e293b" rx="10" />
        <g transform={`translate(${walkwayWidth/2}, 250) rotate(180)`}>
          <rect x="-350" y="-120" width="700" height="200" fill="#1e293b" stroke="#ffffff" strokeWidth="8" rx="40" />
          <text textAnchor="middle" y="30" className="text-[130px] font-black fill-white uppercase tracking-tighter">{zone}</text>
        </g>
        {leftSide.map((m, i) => renderSlot(m, i, false))}
        {rightSide.map((m, i) => renderSlot(m, i, true))}
        {headMooring && (
          <g transform={`translate(${walkwayWidth/2}, ${piersEndAt})`} onClick={(e) => { e.stopPropagation(); onSelectMooring(headMooring); }} className="cursor-pointer">
            <rect x="-1000" y="-10" width="2000" height={hammerHeight} fill="#1e293b" rx="10" />
            <rect x="-1000" y={hammerHeight + 40} width="2000" height="700" fill={selectedId === headMooring.id ? "rgba(14, 165, 233, 0.1)" : "rgba(255,255,255,0.95)"} stroke={selectedId === headMooring.id ? "#0ea5e9" : "#cbd5e1"} strokeWidth="15" rx="50" />
            {headMooring.boat && (
              <g transform={`translate(-900, ${hammerHeight + 150})`} style={{ pointerEvents: 'none' }}>
                <BoatIcon width={1800} height={500} isBase={headMooring.boat.isBase} />
              </g>
            )}
            <g transform={`translate(0, ${hammerHeight + 390}) rotate(180)`} style={{ pointerEvents: 'none' }}>
              <rect x="-550" y="-150" width="1100" height="300" rx="60" fill={headMooring.boat ? "#1e293b" : "#ffffff"} stroke={headMooring.status === MooringStatus.AVAILABLE ? "#10b981" : "white"} strokeWidth="25" />
              <text textAnchor="middle" y="80" className={`text-[210px] font-black tracking-tighter ${headMooring.boat ? 'fill-white' : 'fill-slate-900'}`}>{headMooring.id}</text>
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#f8fafc] relative overflow-hidden flex items-center justify-center ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-xl text-amber-400"><Anchor size={20} /></div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Puerto Deportivo</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Camariñas</span>
          </div>
        </div>
      </div>

      <div 
        style={{ 
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isPanning ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          transformOrigin: '0 0'
        }}
      >
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width={SVG_WIDTH} height={SVG_HEIGHT} xmlns="http://www.w3.org/2000/svg" onClick={() => onSelectMooring(null as any)}>
          <defs>
            <pattern id="ocean-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M0 100 Q 50 80, 100 100 T 200 100" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            </pattern>
          </defs>
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#f0f9ff" />
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#ocean-pattern)" />
          
          <g transform={`rotate(180, ${SVG_WIDTH/2}, ${SVG_HEIGHT/2})`}>
            {renderPier('SUR', PIER_OFFSETS.SUR)}
            {renderPier('CENTRAL', PIER_OFFSETS.CENTRAL)}
            {renderPier('NORTE', PIER_OFFSETS.NORTE)}

            {animPos && transitingBoat && (
              <g transform={`translate(${animPos.x}, ${animPos.y}) rotate(${animPos.rotation})`}>
                <g transform="translate(-150, -325)">
                   <BoatIcon width={300} height={650} isBase={transitingBoat.boat.isBase} />
                </g>
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-20">
        <button onClick={() => setScale(prev => Math.min(prev + 0.5, 6))} className="p-4 bg-white shadow-2xl rounded-2xl hover:bg-slate-50 text-slate-700 transition-all border border-slate-200 active:scale-90"><ZoomIn size={24} /></button>
        <button onClick={() => setScale(prev => Math.max(prev - 0.5, minScale))} disabled={scale <= minScale} className={`p-4 bg-white shadow-2xl rounded-2xl text-slate-700 transition-all border border-slate-200 active:scale-90 ${scale <= minScale ? 'opacity-30' : 'hover:bg-slate-50'}`}><ZoomOut size={24} /></button>
        <button onClick={fitToScreen} className="p-4 bg-slate-900 shadow-2xl rounded-2xl hover:bg-black text-white transition-all active:scale-90"><Maximize size={24} /></button>
      </div>

      <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-3">
        <div className={`bg-white/95 backdrop-blur-md rounded-[2rem] border border-slate-200 shadow-2xl transition-all duration-500 overflow-hidden ${showLegend ? 'w-56 p-6 opacity-100' : 'w-14 h-14 flex items-center justify-center cursor-pointer hover:bg-slate-50'}`} onClick={() => !showLegend && setShowLegend(true)}>
          {showLegend ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Referencias</span>
                <button onClick={(e) => { e.stopPropagation(); setShowLegend(false); }} className="text-slate-400 hover:text-slate-600 p-1"><ChevronRight size={20} /></button>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-[#1e293b]"></div><span className="text-xs font-bold text-slate-700 uppercase">BASE</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-md bg-[#ef4444]"></div><span className="text-xs font-bold text-slate-700 uppercase">TRÁNSITO</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-lg border-2 border-emerald-500"></div><span className="text-xs font-bold text-emerald-600 uppercase">LIBRE</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-lg border-2 border-amber-500 bg-amber-50"></div><span className="text-xs font-bold text-amber-600 uppercase">RESERVA</span></div>
              </div>
            </div>
          ) : (
            <Info size={28} className="text-slate-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MooringMap;
