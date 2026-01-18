
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mooring, PierZone, MooringStatus, Boat } from '../types';
import { MAP_BASE_BOAT_COLOR, MAP_TRANSIT_BOAT_COLOR } from '../constants';
import { Maximize, Info, ChevronRight, Anchor, X } from 'lucide-react';

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
  const lastTouchRef = useRef<{ dist: number } | null>(null);
  
  const SVG_WIDTH = 6500; 
  const SVG_HEIGHT = 6000; 
  
  // Estado inicial
  const [scale, setScale] = useState(0.05); 
  const [minScale, setMinScale] = useState(0.01);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(false);
  const [animPos, setAnimPos] = useState<{ x: number; y: number; rotation: number } | null>(null);

  // Configuración geométrica
  const walkwayWidth = 140; 
  const fingerWidth = 20; 
  const hammerHeight = 150; 
  const fixedHeight = 3600;
  const slotStartY = 450;
  const SNL_Y = 5000; 

  const PIER_OFFSETS = {
    'SUR': 1000, 
    'CENTRAL': 3000,
    'NORTE': 5000
  };

  const PIER_Y_OFFSET = 500; 

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    const bounds = {
      minX: 400,
      maxX: 5600, 
      minY: 400,
      maxY: 5200 
    };
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    const paddingFactor = 0.95; 
    const scaleX = (clientWidth * paddingFactor) / contentWidth;
    const scaleY = (clientHeight * paddingFactor) / contentHeight;
    const newScale = Math.min(scaleX, scaleY); 

    const safeScale = Math.min(Math.max(newScale, 0.01), 3);

    setScale(safeScale);
    setMinScale(safeScale * 0.5); 

    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;

    const x = (clientWidth / 2) - (contentCenterX * safeScale);
    const y = (clientHeight / 2) - (contentCenterY * safeScale);
    
    setPosition({ x, y });
  }, []);

  // UseEffect normal con debounce para evitar parpadeo
  useEffect(() => {
    fitToScreen();
    
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fitToScreen();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [fitToScreen]);

  // Helper para identificar cabeceras
  const isHeadMooring = (id: string) => {
    return id.endsWith('G') || id === 'P2/26C' || id.includes('P3/35');
  };

  // --- Lógica de Animación ---
  useEffect(() => {
    if (!transitingBoat) {
      setAnimPos(null);
      return;
    }
    
    const getCoords = (mooringId: string) => {
      if (mooringId === 'EXIT') {
        return { x: 100, y: 5800, w: 0, h: 0, isRight: true, isHead: false };
      }

      const mooring = moorings.find(m => m.id === mooringId);
      if (!mooring) return { x: 0, y: 0, w: 0, h: 0, isRight: false };
      
      const xOffset = PIER_OFFSETS[mooring.zone];
      const isHead = isHeadMooring(mooring.id);
      
      if (isHead) {
        return { 
          x: xOffset + walkwayWidth / 2, 
          y: PIER_Y_OFFSET + fixedHeight + hammerHeight + 250, 
          w: 800, 
          h: 400, 
          isRight: false,
          isHead: true 
        };
      }

      const pierMoorings = moorings.filter(m => m.zone === mooring.zone && !isHeadMooring(m.id));
      
      // Separar lados
      const leftSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      const rightSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      
      const num = parseInt(mooring.id.split('/')[1]);
      const isRight = num % 2 === 0; 
      const sideList = isRight ? rightSide : leftSide;
      const index = sideList.findIndex(m => m.id === mooringId);
      
      const slotHeight = fixedHeight / sideList.length;
      
      const y = PIER_Y_OFFSET + slotStartY + (index * slotHeight);
      const h = slotHeight - 10;
      
      // Cálculo del ancho visual para animación (debe coincidir con renderSlot)
      let w = 400; // Default C
      if (mooring.id.includes('A')) w = 260; // 6m
      else if (mooring.id.includes('B')) w = 320; // 8m
      else if (mooring.id.includes('C')) w = 400; // 10m
      else if (mooring.id.includes('D')) w = 500; // 12m
      else if (mooring.id.includes('G')) w = 600; // Head
      
      const x = isRight ? xOffset + walkwayWidth : xOffset - w;

      return { x: x + w/2, y: y + h/2, w, h, isRight, isHead: false };
    };

    const start = getCoords(transitingBoat.sourceId);
    const end = getCoords(transitingBoat.targetId);

    const waypoints = [
      { x: start.x, y: start.y },
      { x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: start.y },
      { x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: PIER_Y_OFFSET + SNL_Y },
      { x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: PIER_Y_OFFSET + SNL_Y },
      { x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: end.y },
      { x: end.x, y: end.y }
    ];

    if (transitingBoat.targetId === 'EXIT') {
      waypoints.length = 0; 
      waypoints.push({ x: start.x, y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: PIER_Y_OFFSET + SNL_Y });
      waypoints.push({ x: 100, y: PIER_Y_OFFSET + SNL_Y });
      waypoints.push({ x: 100, y: 5800 });
    }

    let currentWaypoint = 0;
    let startTime = performance.now();
    const speed = 1.8; 

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

  // --- Manejo de eventos del Mouse (Desktop) ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.01 : 0.01;
    setScale(prev => Math.min(Math.max(prev + delta, minScale), 5));
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

  const handleEnd = () => setIsPanning(false);

  // --- Manejo de eventos Táctiles (Mobile) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchRef.current = { dist };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const scaleFactor = dist / lastTouchRef.current.dist;
      const newScale = Math.min(Math.max(scale * scaleFactor, minScale), 5);
      
      setScale(newScale);
      lastTouchRef.current = { dist };
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    lastTouchRef.current = null;
  };

  // --- Renderizado ---

  const BoatIcon = ({ width, height, isBase = false }: { width: number, height: number, isBase?: boolean }) => {
    const boatColor = isBase ? MAP_BASE_BOAT_COLOR : MAP_TRANSIT_BOAT_COLOR;
    return (
      <g>
        <path d={`M ${width*0.5} ${height} L ${width*0.05} ${height*0.75} Q ${width*0.05} ${height*0.2}, ${width*0.5} 0 Q ${width*0.95} ${height*0.2}, ${width*0.95} ${height*0.75} Z`} fill="black" fillOpacity="0.2" transform="translate(10, 10)"/>
        <path d={`M ${width*0.5} ${height} L 0 ${height*0.75} Q 0 ${height*0.12}, ${width*0.5} 0 Q ${width} ${height*0.12}, ${width} ${height*0.75} Z`} fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        <path d={`M ${width*0.5} ${height*0.96} L ${width*0.1} ${height*0.72} Q ${width*0.1} ${height*0.2}, ${width*0.5} ${height*0.1} Q ${width*0.9} ${height*0.2}, ${width*0.9} ${height*0.72} Z`} fill={boatColor} />
        <path d={`M ${width*0.25} ${height*0.65} L ${width*0.75} ${height*0.65} L ${width*0.8} ${height*0.45} Q ${width*0.5} ${height*0.35}, ${width*0.2} ${height*0.45} Z`} fill="white" fillOpacity="0.8" />
        <rect x={width*0.35} y={height*0.7} width={width*0.3} height={height*0.18} rx={width*0.03} fill="white" fillOpacity="0.3" />
      </g>
    );
  };

  const renderPier = (zone: PierZone, xOffset: number) => {
    const pierMoorings = moorings.filter(m => m.zone === zone);
    const headMooring = pierMoorings.find(m => isHeadMooring(m.id));
    const sideMoorings = pierMoorings.filter(m => m.id !== headMooring?.id);
    
    const prepareSide = (items: Mooring[]) => {
      let fingerState = true; 
      return items.map((m, index) => {
        let drawTop = fingerState;
        let drawBottom = false;

        if (m.customFinger === 'TOP') {
          drawTop = true;
          drawBottom = false;
        } else if (m.customFinger === 'BOTTOM') {
          drawTop = false;
          drawBottom = true;
        } else if (m.customFinger === 'BOTH') {
          drawTop = true;
          drawBottom = true;
        } else if (m.customFinger === 'NONE') {
          drawTop = false;
          drawBottom = false;
        } else {
          if (m.isSingle) {
             drawTop = true; 
             fingerState = true; 
          } else {
            if (fingerState) {
               fingerState = false;
            } else {
               fingerState = true;
            }
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
      
      // ANCHO VISUAL SEGÚN LETRA (Eslora)
      // A(6m): 260, B(8m): 320, C(10m): 400, D(12m): 500
      let w = 400; // Default C
      if (m.id.includes('A')) w = 260;
      else if (m.id.includes('B')) w = 320;
      else if (m.id.includes('C')) w = 400;
      else if (m.id.includes('D')) w = 500;
      
      const h = slotHeight - 10; 
      const isSelected = selectedId === m.id;
      
      const xWater = isRight ? walkwayWidth : -w;
      
      const fingerLen = w * 0.9;
      const fingerX = isRight ? walkwayWidth : -fingerLen;
      const fingerYTop = y - 10; 
      const fingerYBottom = y + h; 

      const centerX = xWater + w / 2;
      const centerY = y + h / 2;

      const pillFill = "rgba(255, 255, 255, 0.95)";
      const pillStroke = m.boat ? "#1e293b" : "#cbd5e1";
      const textFill = "fill-slate-900";

      const slotFill = isSelected 
        ? "rgba(255, 255, 255, 0.4)" 
        : (m.status === MooringStatus.RESERVED 
          ? "rgba(251, 191, 36, 0.6)" 
          : "rgba(255, 255, 255, 0.15)"); 

      const slotStroke = isSelected ? "white" : "rgba(255,255,255,0.3)";

      const boatBeam = h * 0.8;
      const boatLength = w * 0.85;

      const rotation = isRight ? -90 : 90;

      return (
        <g key={m.id}>
          {item.drawFingerTop && (
            <rect 
              x={fingerX} 
              y={fingerYTop} 
              width={fingerLen} 
              height={fingerWidth} 
              fill="#334155" 
              rx="2"
            />
          )}
          
          {item.drawFingerBottom && (
            <rect 
              x={fingerX} 
              y={fingerYBottom} 
              width={fingerLen} 
              height={fingerWidth} 
              fill="#334155" 
              rx="2"
            />
          )}

          <g onClick={(e) => { e.stopPropagation(); onSelectMooring(m); }} className="cursor-pointer">
            <rect x={xWater} y={y} width={w} height={h} fill={slotFill} stroke={slotStroke} strokeWidth={isSelected ? "15" : "3"} rx="10" />
            
            {m.boat && (
              <g transform={`translate(${centerX}, ${centerY}) rotate(${rotation}) translate(${-boatBeam/2}, ${-boatLength/2})`} style={{ pointerEvents: 'none' }}>
                <BoatIcon width={boatBeam} height={boatLength} isBase={m.boat.isBase} />
              </g>
            )}

            <g transform={`translate(${centerX}, ${centerY}) rotate(180)`} style={{ pointerEvents: 'none' }}>
              <rect x="-110" y="-50" width="220" height="100" rx="25" fill={pillFill} stroke={pillStroke} strokeWidth="6" />
              <text textAnchor="middle" y="25" className={`text-[65px] font-black tracking-tighter ${textFill}`}>{m.id}</text>
            </g>
          </g>
        </g>
      );
    };

    const piersEndAt = PIER_Y_OFFSET + slotStartY + fixedHeight;
    const hammerConcreteWidth = 900; 

    const headBoatLength = hammerConcreteWidth - 100;
    const headBoatBeam = 240;

    return (
      <g key={zone} transform={`translate(${xOffset}, 0)`}>
        <rect x="0" y={PIER_Y_OFFSET} width={walkwayWidth} height={fixedHeight + hammerHeight + slotStartY} fill="#1e293b" rx="10" />
        
        <g transform={`translate(${walkwayWidth/2}, ${PIER_Y_OFFSET + 250}) rotate(180)`}>
          <rect x="-350" y="-120" width="700" height="200" fill="#1e293b" stroke="#ffffff" strokeWidth="8" rx="40" />
          <text textAnchor="middle" y="30" className="text-[145px] font-black fill-white uppercase tracking-tighter">{zone}</text>
        </g>
        
        {leftSide.map((m, i) => renderSlot(m, i, false))}
        {rightSide.map((m, i) => renderSlot(m, i, true))}
        
        {headMooring && (
          <g transform={`translate(${walkwayWidth/2}, ${piersEndAt})`}>
             <rect 
               x={-hammerConcreteWidth / 2} 
               y={-50} 
               width={hammerConcreteWidth} 
               height={hammerHeight + 50} 
               fill="#1e293b" 
               rx="10" 
             />

             <g onClick={(e) => { e.stopPropagation(); onSelectMooring(headMooring); }} className="cursor-pointer">
              <rect 
                x={-hammerConcreteWidth / 2} 
                y={hammerHeight + 20} 
                width={hammerConcreteWidth} 
                height={280} 
                fill={selectedId === headMooring.id ? "rgba(255,255,255,0.4)" : (headMooring.status === MooringStatus.RESERVED ? "rgba(251, 191, 36, 0.6)" : "rgba(255,255,255,0.15)")} 
                stroke={selectedId === headMooring.id ? "white" : "rgba(255,255,255,0.3)"} 
                strokeWidth={10} 
                rx="40" 
              />
              
              {headMooring.boat && (
                <g transform={`translate(0, ${hammerHeight + 20 + 140}) rotate(90) translate(${-headBoatBeam/2}, ${-headBoatLength/2})`} style={{ pointerEvents: 'none' }}>
                   <BoatIcon width={headBoatBeam} height={headBoatLength} isBase={headMooring.boat.isBase} />
                </g>
              )}
              
              <g transform={`translate(0, ${hammerHeight + 160}) rotate(180)`} style={{ pointerEvents: 'none' }}>
                 <rect x="-140" y="-50" width="280" height="100" rx="25" fill="rgba(255,255,255,0.95)" stroke="#1e293b" strokeWidth="6" />
                <text textAnchor="middle" y="25" className="text-[70px] font-black tracking-tighter fill-slate-900">{headMooring.id}</text>
              </g>
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#3b82f6] relative overflow-hidden touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: 'none', 
          transformOrigin: '0 0',
        }}
      >
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width={SVG_WIDTH} height={SVG_HEIGHT} xmlns="http://www.w3.org/2000/svg" onClick={() => onSelectMooring(null as any)}>
          <defs>
            <pattern id="water-pattern-1" x="0" y="0" width="3000" height="3000" patternUnits="userSpaceOnUse">
               <path d="M0 1500 Q 750 1200, 1500 1500 T 3000 1500" fill="none" stroke="white" strokeWidth="20" opacity="0.15" />
               <path d="M0 500 Q 750 200, 1500 500 T 3000 500" fill="none" stroke="white" strokeWidth="20" opacity="0.15" />
               <path d="M0 2500 Q 750 2200, 1500 2500 T 3000 2500" fill="none" stroke="white" strokeWidth="20" opacity="0.15" />
               <animateTransform attributeName="patternTransform" type="translate" from="0,0" to="-1500,0" dur="25s" repeatCount="indefinite" />
            </pattern>
            <pattern id="water-pattern-2" x="0" y="0" width="1000" height="1000" patternUnits="userSpaceOnUse">
               <path d="M0 250 Q 250 150, 500 250 T 1000 250" fill="none" stroke="white" strokeWidth="8" opacity="0.1" />
               <path d="M0 750 Q 250 650, 500 750 T 1000 750" fill="none" stroke="white" strokeWidth="8" opacity="0.1" />
               <animateTransform attributeName="patternTransform" type="translate" from="0,0" to="500,0" dur="15s" repeatCount="indefinite" />
            </pattern>
          </defs>
          
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#3b82f6" />
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#water-pattern-1)" />
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#water-pattern-2)" />
          
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

      <button 
        onClick={fitToScreen} 
        className="absolute bottom-6 left-6 p-3 bg-white shadow-xl rounded-full hover:bg-slate-50 text-slate-700 transition-all active:scale-95 border border-slate-200 z-50" 
        title="Restablecer vista"
      >
        <Maximize size={24} />
      </button>

      <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-5">
        <div className={`bg-white/95 backdrop-blur-lg rounded-[2.5rem] border border-slate-200 shadow-2xl transition-all duration-300 overflow-hidden ${showLegend ? 'w-64 p-6' : 'w-12 h-12 flex items-center justify-center cursor-pointer hover:bg-slate-50 rounded-full'}`} onClick={() => !showLegend && setShowLegend(true)}>
          {showLegend ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leyenda</span>
                <button onClick={(e) => { e.stopPropagation(); setShowLegend(false); }} className="text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#1e293b]"></div><span className="text-[10px] font-bold text-slate-700 uppercase">SOCIO</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#ef4444]"></div><span className="text-[10px] font-bold text-slate-700 uppercase">TRÁNSITO</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-white bg-white/20"></div><span className="text-[10px] font-bold text-slate-700 uppercase">LIBRE</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-white bg-[#fcd34d]/60"></div><span className="text-[10px] font-bold text-slate-700 uppercase">RESERVA</span></div>
              </div>
            </div>
          ) : (
            <Info size={24} className="text-slate-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MooringMap;
