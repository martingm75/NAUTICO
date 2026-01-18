
import { Mooring, MooringStatus, PierZone, TariffSeason } from './types';

const generateMoorings = (): Mooring[] => {
  const moorings: Mooring[] = [];
  let globalId = 1;

  // Lista de plazas que van solas (Single) y sus letras específicas si difieren de la norma
  // NOTA: Las letras definidas aquí pueden ser sobrescritas por la lógica de bucles posterior si se pasan explícitamente.
  const specialSingles: Record<string, string> = {
    'P1/1': 'C',
    'P1/2': 'B', 
    'P1/24': 'D',
    'P2/1': 'A',
    'P2/2': 'C',
    'P3/1': 'A',
    'P3/2': 'A' // P3/2 es A (6m)
  };

  const createMooring = (
    prefix: string, 
    i: number, 
    zone: PierZone, 
    defaultLetter: string, 
    overrideLength?: number, 
    overrideBeam?: number
  ) => {
    const idBase = `${prefix}/${i}`;
    let letter = defaultLetter;
    let isSingle = false;
    let customFinger: 'TOP' | 'BOTTOM' | 'BOTH' | 'NONE' | undefined = undefined;

    // Verificar si es una plaza especial con letra o single
    if (specialSingles[idBase]) {
      isSingle = true;
    }

    // --- CONFIGURACIÓN DE FINGERS MANUALES ---
    
    // P1/1: Unitaria, finger arriba
    if (idBase === 'P1/1') {
      isSingle = true;
      customFinger = 'TOP';
    }

    // P1/2: Unitaria, finger arriba
    if (idBase === 'P1/2') {
      isSingle = true;
      customFinger = 'TOP';
    }
    
    // P2/1: No es solitaria, forma dúo con P2/3. Finger Top.
    if (idBase === 'P2/1') {
      isSingle = false; 
      customFinger = 'TOP'; 
    }
    
    // P2/3: Forma dúo con P2/1. Finger Bottom.
    if (idBase === 'P2/3') {
      customFinger = 'BOTTOM';
    }

    // P2/2: Plaza C, no tiene finger por estribor (Top visual al inicio). Ponemos BOTTOM para compartir con P2/4.
    if (idBase === 'P2/2') {
       customFinger = 'BOTTOM';
    }

    // P3/1: Unitaria, Finger abajo
    if (idBase === 'P3/1') {
      isSingle = true;
      customFinger = 'BOTTOM';
    }

    // P3/2: Plaza A, no tiene finger por estribor (Top visual). Ponemos BOTTOM.
    if (idBase === 'P3/2') {
      customFinger = 'BOTTOM';
    }
    
    // P3 Lado Derecho (Impares): Configuración patrón específico para 8 fingers
    if (zone === 'SUR' && i >= 3 && i % 2 !== 0) {
      if (i === 3 || i === 5) {
        customFinger = 'NONE';
      } else {
        if ((i - 7) % 4 === 0) {
          customFinger = 'TOP';
        } else {
          customFinger = 'NONE';
        }
      }
    }
    
    // P1/24: Caso especial (Single al final)
    if (idBase === 'P1/24') {
       isSingle = true;
    }

    const fullId = `${idBase}${letter}`;
    
    // Dimensiones ESTÁNDAR por letra
    // A: 6m, B: 8m, C: 10m, D: 12m, G: Cabecera
    let dims = {
      'A': { l: 6, b: 3.1 },  
      'B': { l: 8, b: 3.75 }, 
      'C': { l: 10, b: 4.85 },  
      'D': { l: 12, b: 5.15 },  
      'G': { l: 17, b: 6.5 }
    }[letter] || { l: 10, b: 4.85 };

    // Si se pasan dimensiones explícitas, tienen prioridad
    if (overrideLength !== undefined && overrideBeam !== undefined) {
      dims = { l: overrideLength, b: overrideBeam };
    }

    // Estado aleatorio
    const statusRoll = Math.random();
    let status = MooringStatus.AVAILABLE;
    if (statusRoll > 0.6) status = MooringStatus.OCCUPIED;
    else if (statusRoll > 0.9) status = MooringStatus.RESERVED;

    moorings.push({
      id: fullId,
      number: i,
      zone: zone,
      status: status,
      isSingle: isSingle,
      customFinger: customFinger,
      maxDimensions: {
        length: dims.l,
        beam: dims.b
      },
      boat: status === MooringStatus.OCCUPIED ? {
        id: `B-${globalId}`,
        name: `Embarcación ${globalId}`,
        owner: `Socio ${globalId}`,
        length: Math.max(dims.l - 1.5, 4), 
        beam: Math.max(dims.b - 0.5, 2),
        arrivalDate: '2024-01-15',
        departureDate: '2024-12-31',
        registration: `7ª-CO-${globalId}-${24}`,
        isBase: Math.random() > 0.6
      } : undefined
    });
    globalId++;
  };

  // --- PANTALÁN 1 (NORTE) ---
  
  // Lado Derecho (Impares): 1...25
  // "Todas las plazas de 10 metros de eslora x 4.85 de manga" -> Letra C
  for (let i = 1; i <= 25; i += 2) {
    createMooring('P1', i, 'NORTE', 'C');
  }

  // Lado Izquierdo (Pares): 2...24
  for (let i = 2; i <= 24; i += 2) {
    if (i === 2 || i === 4) {
      // "P1/2B y p1/4B son de 8 metros de eslora x 3.75 metros de manga" -> Letra B
      createMooring('P1', i, 'NORTE', 'B');
    } else if (i >= 6 && i <= 12) {
      // "P1/6C a P1/12D (todas estas acaban en D)"
      // REGLA SUPERIOR: "Las plazas de 10 metros de eslora acaban todas en C"
      createMooring('P1', i, 'NORTE', 'C');
    } else {
      // "El resto son de 12 metros de eslora X 5.15 metros de manga" -> Letra D
      createMooring('P1', i, 'NORTE', 'D');
    }
  }
  
  // Cabecera P1
  createMooring('P1', 26, 'NORTE', 'G');


  // --- PANTALÁN 2 (CENTRAL) ---

  // Lado Derecho (Impares): 1...23
  for (let i = 1; i <= 23; i += 2) {
    if (i === 1) {
      // P2/1 pequeña/mediana. Usamos A (6m) o B (8m). Por defecto A.
      createMooring('P2', i, 'CENTRAL', 'A'); 
    } else {
      // "Desde P2/3D son de 12 metros de eslora por 5.15 de manga y acaban en letra D" -> Letra D
      createMooring('P2', i, 'CENTRAL', 'D');
    }
  }

  // Lado Izquierdo (Pares): 2...24
  // "Las del lado izquierdo son todas de 10 metros de eslora x 4.85 de manga" -> Letra C
  for (let i = 2; i <= 24; i += 2) {
    createMooring('P2', i, 'CENTRAL', 'C');
  }

  // Cabecera P2: P2/26C (Si es 12m debería ser D, si es 10m C. Mantenemos C o G para cabecera)
  createMooring('P2', 26, 'CENTRAL', 'G');


  // --- PANTALÁN 3 (SUR) ---

  // Lado Derecho (Impares): 1...33
  for (let i = 1; i <= 33; i += 2) {
    if (i <= 19) {
      // "De P3/1A a P3/19A ... 10 plazas de 6 metros x 3.1" -> Letra A
      createMooring('P3', i, 'SUR', 'A');
    } else {
      // "El resto... 8 metros ... acaban con letra B" -> Letra B
      createMooring('P3', i, 'SUR', 'B');
    }
  }

  // Lado Izquierdo (Pares): 2...26
  // "P3/2A es 6m, el resto son 10m (Letra C)"
  for (let i = 2; i <= 26; i += 2) {
    if (i === 2) {
      createMooring('P3', i, 'SUR', 'A');
    } else {
      createMooring('P3', i, 'SUR', 'C');
    }
  }

  // Cabecera P3: P3/35G
  createMooring('P3', 35, 'SUR', 'G'); 

  return moorings;
};

export const INITIAL_MOORINGS = generateMoorings();

export const INITIAL_TARIFFS: TariffSeason[] = [
  {
    id: 'low',
    name: 'TEMPORADA BAJA',
    dates: 'NOVIEMBRE A ABRIL',
    rows: [
      { id: '1', range: '< 5 mts.', daily: 5.50, weekly: 33.00, monthly: 132.00 },
      { id: '2', range: 'De 5 a 5,99 mts.', daily: 6.50, weekly: 39.00, monthly: 156.00 },
      { id: '3', range: 'De 6 a 6,99 mts.', daily: 7.00, weekly: 45.00, monthly: 180.00 },
      { id: '4', range: 'De 7 a 7,99 mts.', daily: 8.00, weekly: 48.00, monthly: 192.00 },
      { id: '5', range: 'De 8 a 8,99 mts.', daily: 10.00, weekly: 60.00, monthly: 240.00 },
      { id: '6', range: 'De 9 a 9,99 mts.', daily: 12.00, weekly: 71.00, monthly: 288.00 },
      { id: '7', range: 'De 10 a 10,99 mts.', daily: 14.00, weekly: 84.00, monthly: 336.00 },
      { id: '8', range: 'De 11 a 11,99 mts.', daily: 18.00, weekly: 108.00, monthly: 432.00 },
      { id: '9', range: 'De 12 a 12,99 mts.', daily: 19.00, weekly: 114.00, monthly: 456.00 },
      { id: '10', range: 'De 13 a 14,99 mts.', daily: 22.00, weekly: 137.00, monthly: 528.00 },
      { id: '11', range: 'De 15 a 17,99 mts.', daily: 27.50, weekly: 165.00, monthly: 660.00 },
      { id: '12', range: 'De 18 a 20,00 mts.', daily: 33.00, weekly: 193.00, monthly: 792.00 },
      { id: '13', range: '> 20 mts.', daily: 44.00, weekly: 244.00, monthly: 1056.00 },
    ]
  },
  {
    id: 'high',
    name: 'TEMPORADA ALTA',
    dates: 'MAYO A OCTUBRE',
    rows: [
      { id: '1', range: '< 5 mts.', daily: 6.50, weekly: 39.00, monthly: 156.00 },
      { id: '2', range: 'De 5 a 5,99 mts.', daily: 7.50, weekly: 45.00, monthly: 180.00 },
      { id: '3', range: 'De 6 a 6,99 mts.', daily: 9.00, weekly: 54.00, monthly: 216.00 },
      { id: '4', range: 'De 7 a 7,99 mts.', daily: 12.00, weekly: 72.00, monthly: 288.00 },
      { id: '5', range: 'De 8 a 8,99 mts.', daily: 14.50, weekly: 87.00, monthly: 348.00 },
      { id: '6', range: 'De 9 a 9,99 mts.', daily: 16.50, weekly: 99.00, monthly: 396.00 },
      { id: '7', range: 'De 10 a 10,99 mts.', daily: 20.00, weekly: 120.00, monthly: 480.00 },
      { id: '8', range: 'De 11 a 11,99 mts.', daily: 22.00, weekly: 132.00, monthly: 528.00 },
      { id: '9', range: 'De 12 a 12,99 mts.', daily: 26.50, weekly: 159.00, monthly: 636.00 },
      { id: '10', range: 'De 13 a 14,99 mts.', daily: 31.00, weekly: 186.00, monthly: 744.00 },
      { id: '11', range: 'De 15 a 17,99 mts.', daily: 38.50, weekly: 231.00, monthly: 924.00 },
      { id: '12', range: 'De 18 a 20,00 mts.', daily: 47.50, weekly: 285.00, monthly: 1140.00 },
      { id: '13', range: '> 20 mts.', daily: 60.50, weekly: 363.00, monthly: 1452.00 },
    ]
  }
];

export const STATUS_COLORS = {
  [MooringStatus.AVAILABLE]: 'bg-emerald-500',
  [MooringStatus.OCCUPIED]: 'bg-rose-600',
  [MooringStatus.RESERVED]: 'bg-amber-500',
  [MooringStatus.MAINTENANCE]: 'bg-slate-400'
};

export const BASE_BOAT_COLOR = 'bg-slate-900';
export const MAP_BASE_BOAT_COLOR = '#1e293b'; 
export const MAP_TRANSIT_BOAT_COLOR = '#ef4444';

export const STATUS_LABELS = {
  [MooringStatus.AVAILABLE]: 'Disponible',
  [MooringStatus.OCCUPIED]: 'Ocupado',
  [MooringStatus.RESERVED]: 'Reservado',
  [MooringStatus.MAINTENANCE]: 'Mantenimiento'
};
