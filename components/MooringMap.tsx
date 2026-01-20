
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mooring, PierZone, MooringStatus, Boat } from '../types';
import { MAP_BASE_BOAT_COLOR, MAP_TRANSIT_BOAT_COLOR } from '../constants';
import { Maximize, Info, X } from 'lucide-react';

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
  
  // Estados de animación
  const [animPos, setAnimPos] = useState<{ x: number; y: number; rotation: number } | null>(null);
  const [sailorPos, setSailorPos] = useState<{ 
    x: number; 
    y: number; 
    opacity: number; 
    rotation: number; 
    bob: number; 
    tick: number; // Para animar extremidades
    isCatching: boolean; // Recogiendo cabo
    isWaving: boolean;   // Despidiendo
  } | null>(null);
  const [ropePath, setRopePath] = useState<string | null>(null);

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

  const isHeadMooring = (id: string) => {
    return id.endsWith('G') || id === 'P2/26C' || id.includes('P3/35');
  };

  // --- Lógica de Animación ---
  useEffect(() => {
    if (!transitingBoat) {
      setAnimPos(null);
      setSailorPos(null);
      setRopePath(null);
      return;
    }
    
    const getCoords = (mooringId: string) => {
      if (mooringId === 'EXIT' || mooringId === 'ENTRY') {
        return { x: 100, y: 5800, w: 0, h: 0, isRight: true, isHead: false, zone: null };
      }

      const mooring = moorings.find(m => m.id === mooringId);
      if (!mooring) return { x: 0, y: 0, w: 0, h: 0, isRight: false, zone: null };
      
      const xOffset = PIER_OFFSETS[mooring.zone];
      const isHead = isHeadMooring(mooring.id);
      
      if (isHead) {
        return { 
          x: xOffset + walkwayWidth / 2, 
          y: PIER_Y_OFFSET + fixedHeight + hammerHeight + 250, 
          w: 800, 
          h: 400, 
          isRight: false,
          isHead: true,
          zone: mooring.zone
        };
      }

      const pierMoorings = moorings.filter(m => m.zone === mooring.zone && !isHeadMooring(m.id));
      
      const leftSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 !== 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      const rightSide = pierMoorings.filter(m => parseInt(m.id.split('/')[1]) % 2 === 0).sort((a, b) => parseInt(a.id.split('/')[1]) - parseInt(b.id.split('/')[1]));
      
      const num = parseInt(mooring.id.split('/')[1]);
      const isRight = num % 2 === 0; 
      const sideList = isRight ? rightSide : leftSide;
      const index = sideList.findIndex(m => m.id === mooringId);
      
      const slotHeight = fixedHeight / sideList.length;
      
      const y = PIER_Y_OFFSET + slotStartY + (index * slotHeight);
      const h = slotHeight - 10;
      
      let w = 400;
      if (mooring.id.includes('A')) w = 260; 
      else if (mooring.id.includes('B')) w = 320;
      else if (mooring.id.includes('C')) w = 400;
      else if (mooring.id.includes('D')) w = 500;
      else if (mooring.id.includes('G')) w = 600;
      
      const x = isRight ? xOffset + walkwayWidth : xOffset - w;

      return { x: x + w/2, y: y + h/2, w, h, isRight, isHead: false, zone: mooring.zone };
    };

    const start = getCoords(transitingBoat.sourceId);
    const end = getCoords(transitingBoat.targetId);

    // --- CONFIGURACIÓN MARINERO (ENTRADA Y SALIDA) ---
    let sailorStartPoint = null;
    let sailorEndPoint = null;
    let sailorAngle = 0;
    
    const isEntry = transitingBoat.sourceId === 'ENTRY';
    const isExit = transitingBoat.targetId === 'EXIT';

    if (isEntry && end.zone) {
      // Entrada: Corre desde el inicio del pantalán hasta la plaza
      const zoneOffset = PIER_OFFSETS[end.zone as PierZone];
      sailorStartPoint = { x: zoneOffset + walkwayWidth / 2, y: PIER_Y_OFFSET };
      sailorEndPoint = { x: zoneOffset + walkwayWidth / 2, y: end.y };
      sailorAngle = Math.atan2(sailorEndPoint.y - sailorStartPoint.y, sailorEndPoint.x - sailorStartPoint.x) * (180 / Math.PI) + 90;
    } else if (isExit && start.zone) {
      // Salida: Aparece en el pantalán cerca de la plaza y despide
      const zoneOffset = PIER_OFFSETS[start.zone as PierZone];
      // Empieza un poco antes en el pasillo y corre hacia la posición exacta del barco
      sailorStartPoint = { x: zoneOffset + walkwayWidth / 2, y: start.y - 200 };
      sailorEndPoint = { x: zoneOffset + walkwayWidth / 2, y: start.y };
      
      // Orientación hacia el mar/salida
      sailorAngle = 180; 
    }
    // -----------------------

    const waypoints = [];

    if (transitingBoat.targetId === 'EXIT') {
      waypoints.push({ x: start.x, y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: PIER_Y_OFFSET + SNL_Y });
      waypoints.push({ x: 100, y: PIER_Y_OFFSET + SNL_Y }); 
      waypoints.push({ x: 100, y: 5800 }); 
    } else if (transitingBoat.sourceId === 'ENTRY') {
      waypoints.push({ x: 100, y: 5800 }); 
      waypoints.push({ x: 100, y: PIER_Y_OFFSET + SNL_Y }); 
      waypoints.push({ x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: PIER_Y_OFFSET + SNL_Y }); 
      waypoints.push({ x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: end.y }); 
      waypoints.push({ x: end.x, y: end.y }); 
    } else {
      // Traslado interno
      waypoints.push({ x: start.x, y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: start.y });
      waypoints.push({ x: start.isHead ? start.x : (start.isRight ? start.x + 800 : start.x - 800), y: PIER_Y_OFFSET + SNL_Y });
      waypoints.push({ x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: PIER_Y_OFFSET + SNL_Y });
      waypoints.push({ x: end.isHead ? end.x : (end.isRight ? end.x + 800 : end.x - 800), y: end.y });
      waypoints.push({ x: end.x, y: end.y });
    }

    let currentWaypoint = 0;
    let startTime = performance.now();
    const speed = 0.5; 

    let totalDist = 0;
    for(let i=0; i<waypoints.length-1; i++) {
        totalDist += Math.sqrt(Math.pow(waypoints[i+1].x - waypoints[i].x, 2) + Math.pow(waypoints[i+1].y - waypoints[i].y, 2));
    }
    const totalDuration = totalDist / speed;

    const animate = (time: number) => {
      if (currentWaypoint >= waypoints.length - 1) {
        onAnimationComplete?.(transitingBoat.targetId, transitingBoat.boat);
        setSailorPos(null);
        setRopePath(null);
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

      // --- ANIMACIÓN MARINERO Y CABO ---
      if (sailorStartPoint && sailorEndPoint) {
         let currentSailorPos = { x: sailorEndPoint.x, y: sailorEndPoint.y };
         let isCatching = false;
         let isWaving = false;
         let bob = 0;

         // Lógica de Entrada (Original)
         if (isEntry) {
             if (currentWaypoint < 2) {
                 const sailorDistY = sailorEndPoint.y - sailorStartPoint.y;
                 const sailorProgress = Math.min((performance.now() - (startTime - elapsed)) / (totalDuration * 0.4), 1);
                 const sailorY = sailorStartPoint.y + sailorDistY * sailorProgress;
                 
                 bob = Math.sin(time / 50) * 15; 
                 currentSailorPos = { x: sailorEndPoint.x, y: sailorY };
             } else {
                 isCatching = true;
                 currentSailorPos = { x: sailorEndPoint.x, y: sailorEndPoint.y };
             }
         } 
         // Lógica de Salida (Nueva: Correr -> Despedir)
         else if (isExit) {
             const runDuration = 1000; // Corre durante el primer segundo
             const timeSinceStart = performance.now() - (startTime - elapsed); // Tiempo absoluto aproximado de animación
             
             // Fase 1: Correr a posición
             if (currentWaypoint === 0 && t < 0.5) {
                 const progress = t * 2; // Normalizado 0-1
                 const sailorDistY = sailorEndPoint.y - sailorStartPoint.y;
                 const sailorY = sailorStartPoint.y + sailorDistY * progress;
                 bob = Math.sin(time / 50) * 15;
                 currentSailorPos = { x: sailorEndPoint.x, y: sailorY };
             } 
             // Fase 2: Saludar
             else {
                 isWaving = true;
                 currentSailorPos = { x: sailorEndPoint.x, y: sailorEndPoint.y };
                 // Si es salida, el marinero mira hacia el barco que se va
                 // Ajustamos la rotación para que mire al canal (90 o -90)
                 sailorAngle = start.isRight ? -90 : 90;
             }
         }

         setSailorPos({ 
            x: currentSailorPos.x, 
            y: currentSailorPos.y, 
            opacity: 1, 
            rotation: sailorAngle, 
            bob: bob,
            tick: time,
            isCatching: isCatching,
            isWaving: isWaving
         });

         // --- LÓGICA CABO (SOLO ENTRADA) ---
         if (isEntry) {
             const distToSailor = Math.sqrt(Math.pow(curX - currentSailorPos.x, 2) + Math.pow(curY - currentSailorPos.y, 2));
             const THROW_DISTANCE_START = 1600; 
             const THROW_DISTANCE_END = 800;    

             if (currentWaypoint >= waypoints.length - 2 && distToSailor < THROW_DISTANCE_START) {
                 const angleRad = (angle - 90) * (Math.PI / 180);
                 const bowOffset = 300; 
                 const bowX = curX + bowOffset * Math.cos(angleRad);
                 const bowY = curY + bowOffset * Math.sin(angleRad);

                 let throwProgress = (THROW_DISTANCE_START - distToSailor) / (THROW_DISTANCE_START - THROW_DISTANCE_END);
                 throwProgress = Math.max(0, Math.min(1, throwProgress));

                 const ropeTipX = bowX + (currentSailorPos.x - bowX) * throwProgress;
                 const ropeTipY = bowY + (currentSailorPos.y - bowY) * throwProgress;

                 const midX = (bowX + ropeTipX) / 2;
                 const midY = (bowY + ropeTipY) / 2;
                 
                 const gravityFactor = throwProgress < 1 ? 0.05 : 0.15;
                 const gravity = distToSailor * gravityFactor;
                 const controlX = midX; 
                 const controlY = midY + gravity; 

                 setRopePath(`M ${bowX} ${bowY} Q ${controlX} ${controlY} ${ropeTipX} ${ropeTipY}`);
             } else {
                 setRopePath(null);
             }
         } else {
             setRopePath(null);
         }
      }

      if (t >= 1) {
        currentWaypoint++;
        startTime = time;
      }
      requestAnimationFrame(animate);
    };

    const animReq = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animReq);
  }, [transitingBoat, moorings, onAnimationComplete]);

  // Manejadores de eventos (Mouse/Touch) - Sin cambios sustanciales
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
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      lastTouchRef.current = { dist };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const scaleFactor = dist / lastTouchRef.current.dist;
      setScale(Math.min(Math.max(scale * scaleFactor, minScale), 5));
      lastTouchRef.current = { dist };
    }
  };
  const handleTouchEnd = () => { setIsPanning(false); lastTouchRef.current = null; };

  // --- Renderizado de Iconos ---

  const BoatIcon = ({ width, height, isBase = false }: { width: number, height: number, isBase?: boolean }) => {
    const boatColor = isBase ? MAP_BASE_BOAT_COLOR : MAP_TRANSIT_BOAT_COLOR;
    return (
      <g>
        <path d={`M ${width*0.5} ${height} L ${width*0.05} ${height*0.75} Q ${width*0.05} ${height*0.2}, ${width*0.5} 0 Q ${width*0.95} ${height*0.2}, ${width*0.95} ${height*0.75} Z`} fill="black" fillOpacity="0.2" transform="translate(10, 10)"/>
        <path d={`M ${width*0.5} ${height} L 0 ${height*0.75} Q 0 ${height*0.12}, ${width*0.5} 0 Q ${width} ${height*0.12}, ${width} ${height*0.75} Z`} fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        <path d={`M ${width*0.5} ${height*0.96} L ${width*0.1} ${height*0.72} Q ${width*0.1} ${height*0.2}, ${width*0.5} ${height*0.1} Q ${width*0.9} ${height*0.2}, ${width*0.9} ${height*0.72} Z`} fill={boatColor} />
        <path d={`M ${width*0.25} ${height*0.65} L ${width*0.75} ${height*0.65} L ${width*0.8} ${height*0.45} Q ${width*0.5} ${height*0.35}, ${width*0.2} ${height*0.45} Z`} fill="white" fillOpacity="0.8" />
        <rect x={width*0.35} y={height*0.7} width={width*0.3} height={height*0.18} rx={width*0.03} fill="white" fillOpacity="0.3" />
        {/* Cleat/Cornamusa en proa para que el cabo salga de algo físico */}
        <circle cx={width*0.5} cy={height*0.05} r={width*0.04} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      </g>
    );
  };

  const SailorIcon = ({ tick, isCatching, isWaving }: { tick: number, isCatching: boolean, isWaving: boolean }) => {
    // Animación de carrera (Braceo opuesto a piernas)
    const swing = (isCatching || isWaving) ? 0 : Math.sin(tick / 50); 
    
    // Multiplicadores para amplitud de movimiento
    const armSwing = swing * 4;
    const legSwing = swing * 3;

    // Animación de saludo
    const waveSwing = isWaving ? Math.sin(tick / 100) * 10 : 0; // Oscilación mano saludando

    // Coordenadas locales para extremidades
    // isCatching: Brazos adelante (-Y) y abiertos (X) para recibir cabo.
    // isWaving: Brazo derecho levantado y saludando
    const leftArmY = isCatching ? -8 : -3 + armSwing; 
    // Si saluda, brazo derecho (en pantalla a la derecha) sube mucho (-12) y oscila en X
    const rightArmY = isWaving ? -12 : (isCatching ? -8 : -3 - armSwing);
    
    const leftArmX = isCatching ? -6 : -8; 
    const rightArmX = isWaving ? 8 + waveSwing/2 : (isCatching ? 6 : 8); // Oscilación ligera en X si saluda

    const leftLegY = (isCatching || isWaving) ? 4 : 4 - legSwing; 
    const rightLegY = (isCatching || isWaving) ? 4 : 4 + legSwing;

    return (
      <g transform="scale(6)"> 
        {/* Sombra */}
        <ellipse cx="0" cy="5" rx="7" ry="3" fill="black" opacity="0.3" />
        
        {/* Piernas (Pantalón Azul Marino) */}
        {/* Usamos Path con stroke grueso para dar volumen a las piernas */}
        <path d={`M -3 2 L -3 ${leftLegY}`} stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
        <path d={`M 3 2 L 3 ${rightLegY}`} stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Zapatos (Negros) */}
        <circle cx="-3" cy={leftLegY} r="1.8" fill="#0f172a" />
        <circle cx="3" cy={rightLegY} r="1.8" fill="#0f172a" />

        {/* Torso (Chaleco Naranja Alta Visibilidad) */}
        {/* Forma trapezoidal para simular hombros */}
        <path d="M -6 -5 L 6 -5 L 5 4 L -5 4 Z" fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
        
        {/* Cintas Reflectantes (Amarillo intenso) */}
        <path d="M -6 -2 L 6 -2" stroke="#fde047" strokeWidth="2" /> {/* Cinta Horizontal Pecho */}
        <path d="M -5 -5 L -4 4" stroke="#fde047" strokeWidth="1" opacity="0.7" /> {/* Tirante Izq */}
        <path d="M 5 -5 L 4 4" stroke="#fde047" strokeWidth="1" opacity="0.7" /> {/* Tirante Der */}

        {/* Cabeza (Piel) */}
        <circle cx="0" cy="-5" r="4.5" fill="#fcd34d" stroke="#d97706" strokeWidth="0.5" />
        
        {/* Gorra Marinero (Blanca) */}
        <path d="M -5 -6 Q 0 -11 5 -6 L 5 -4 L -5 -4 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
        {/* Visera */}
        <path d="M -5 -4 Q 0 -1 5 -4" fill="none" stroke="#f8fafc" strokeWidth="2" />

        {/* Brazos (Mangas azules + Manos piel) */}
        {/* Brazo Izquierdo */}
        <path d={`M -6 -4 L ${leftArmX} ${leftArmY}`} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
        <circle cx={leftArmX} cy={leftArmY} r="2" fill="#fcd34d" stroke="#d97706" strokeWidth="0.5" /> 

        {/* Brazo Derecho */}
        {/* Si saluda, el brazo rota desde el hombro */}
        <path d={`M 6 -4 L ${rightArmX} ${rightArmY}`} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
        <circle cx={rightArmX} cy={rightArmY} r="2" fill="#fcd34d" stroke="#d97706" strokeWidth="0.5" /> 
        
        {/* Si saluda, añadir líneas de movimiento tipo "onda" */}
        {isWaving && (
             <path d={`M ${rightArmX + 3} ${rightArmY - 2} Q ${rightArmX + 6} ${rightArmY} ${rightArmX + 3} ${rightArmY + 2}`} fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
        )}
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
      let w = 400; 
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
      
      // LOGICA DE COLORES DEL SLOT (AGUA)
      let slotFill = "rgba(255, 255, 255, 0.15)"; // Por defecto (Ocupado o neutro)
      
      if (isSelected) {
        slotFill = "rgba(255, 255, 255, 0.5)";
      } else if (m.status === MooringStatus.AVAILABLE) {
        slotFill = "rgba(16, 185, 129, 0.4)"; // VERDE ESMERALDA (LIBRE)
      } else if (m.status === MooringStatus.RESERVED) {
        slotFill = "rgba(251, 191, 36, 0.6)"; // ÁMBAR (RESERVA)
      } else if (m.status === MooringStatus.MAINTENANCE) {
        slotFill = "rgba(79, 70, 229, 0.6)"; // ÍNDIGO (MANTENIMIENTO)
      }

      const slotStroke = isSelected ? "white" : "rgba(255,255,255,0.3)";
      const boatBeam = h * 0.8;
      const boatLength = w * 0.85;
      const rotation = isRight ? -90 : 90;

      return (
        <g key={m.id}>
          {item.drawFingerTop && <rect x={fingerX} y={fingerYTop} width={fingerLen} height={fingerWidth} fill="#334155" rx="2"/>}
          {item.drawFingerBottom && <rect x={fingerX} y={fingerYBottom} width={fingerLen} height={fingerWidth} fill="#334155" rx="2"/>}
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

    let headSlotFill = "rgba(255, 255, 255, 0.15)";
    if (headMooring) {
        if (selectedId === headMooring.id) headSlotFill = "rgba(255, 255, 255, 0.4)";
        else if (headMooring.status === MooringStatus.AVAILABLE) headSlotFill = "rgba(16, 185, 129, 0.4)";
        else if (headMooring.status === MooringStatus.RESERVED) headSlotFill = "rgba(251, 191, 36, 0.6)";
        else if (headMooring.status === MooringStatus.MAINTENANCE) headSlotFill = "rgba(79, 70, 229, 0.6)";
    }

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
             <rect x={-hammerConcreteWidth / 2} y={-50} width={hammerConcreteWidth} height={hammerHeight + 50} fill="#1e293b" rx="10" />
             <g onClick={(e) => { e.stopPropagation(); onSelectMooring(headMooring); }} className="cursor-pointer">
              <rect x={-hammerConcreteWidth / 2} y={hammerHeight + 20} width={hammerConcreteWidth} height={280} fill={headSlotFill} stroke={selectedId === headMooring.id ? "white" : "rgba(255,255,255,0.3)"} strokeWidth={10} rx="40" />
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

            {/* CABO: Dibujado ANTES del marinero y barco para que quede debajo de las manos si es necesario, o encima del agua */}
            {ropePath && (
               <path d={ropePath} stroke="#d97706" strokeWidth="18" fill="none" strokeLinecap="round" />
            )}

            {sailorPos && (
               <g transform={`translate(${sailorPos.x}, ${sailorPos.y + sailorPos.bob}) rotate(${sailorPos.rotation})`}>
                  <SailorIcon tick={sailorPos.tick} isCatching={sailorPos.isCatching} isWaving={sailorPos.isWaving} />
               </g>
            )}

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
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#1e293b]"></div><span className="text-[10px] font-bold text-slate-700 uppercase">BASE</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-[#ef4444]"></div><span className="text-[10px] font-bold text-slate-700 uppercase">TRÁNSITO</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-500/50"></div><span className="text-[10px] font-bold text-slate-700 uppercase">LIBRE</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-white bg-[#fcd34d]/60"></div><span className="text-[10px] font-bold text-slate-700 uppercase">RESERVA</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded border-2 border-white bg-indigo-600/60"></div><span className="text-[10px] font-bold text-slate-700 uppercase">MANTENIMIENTO</span></div>
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
