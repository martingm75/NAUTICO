
import { Mooring, MooringStatus, PierZone, TariffSeason } from './types';

// Mapeo para demostración de banderas iniciales
const FLAGS = [
  { name: 'España', code: 'es' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Francia', code: 'fr' },
  { name: 'Reino Unido', code: 'gb' },
  { name: 'Alemania', code: 'de' },
  { name: 'Irlanda', code: 'ie' },
  { name: 'Polonia', code: 'pl' },
  { name: 'Grecia', code: 'gr' }
];

// Listas para datos realistas
const BOAT_NAMES = [
  'Sea Breeze', 'Galerna', 'Albatros', 'Poseidón', 'Mare Nostrum', 'Eolo', 'Sirena del Mar', 'Orca II', 
  'Nereida', 'Odisea', 'Mar de Fondo', 'Estrella Polar', 'Viento del Sur', 'Libertad', 'Amanecer', 
  'Delfín Solitario', 'Vikingo', 'Bahía Azul', 'Cormorán', 'Tempestad', 'Calma Chicha', 'Corsario',
  'Azul Profundo', 'Nautilus', 'Boreal', 'Aventurero', 'Horizonte', 'Marea Alta'
];

const OWNER_NAMES = [
  'Juan Pérez García', 'Marta Rodríguez Ruiz', 'Pierre Dubois', 'Hans Müller', 'Elena García Santos', 
  'Luigi Verdi', 'Antonio Da Silva', 'Robert Smith', 'Krzysztof Nowak', 'Giorgos Papadopoulos',
  'Carmen Lema Varela', 'Santiago Martínez', 'Isabel Castro', 'Francisco Javier Sordo',
  'Ana Belén López', 'Miguel Ángel Torres', 'Laura Díaz', 'Carlos Ruiz'
];

const REG_PROVINCES = ['CO', 'VI', 'SS', 'BA', 'MA', 'AL', 'GC'];

const generateMoorings = (): Mooring[] => {
  const moorings: Mooring[] = [];
  let globalId = 1;

  const specialSingles: Record<string, string> = {
    'P1/1': 'C',
    'P1/2': 'B', 
    'P1/24': 'D',
    'P2/1': 'A',
    'P2/2': 'C',
    'P3/1': 'A',
    'P3/2': 'A'
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
    let isSingle = specialSingles[idBase] ? true : false;
    let customFinger: 'TOP' | 'BOTTOM' | 'BOTH' | 'NONE' | undefined = undefined;

    if (idBase === 'P1/1') { isSingle = true; customFinger = 'TOP'; }
    if (idBase === 'P1/2') { isSingle = true; customFinger = 'TOP'; }
    if (idBase === 'P2/1') { isSingle = false; customFinger = 'TOP'; }
    if (idBase === 'P2/3') { customFinger = 'BOTTOM'; }
    if (idBase === 'P2/2') { customFinger = 'BOTTOM'; }
    if (idBase === 'P3/1') { isSingle = true; customFinger = 'BOTTOM'; }
    if (idBase === 'P3/2') { customFinger = 'BOTTOM'; }
    if (zone === 'SUR' && i >= 3 && i % 2 !== 0) {
      if (i === 3 || i === 5) customFinger = 'NONE';
      else if ((i - 7) % 4 === 0) customFinger = 'TOP';
      else customFinger = 'NONE';
    }
    if (idBase === 'P1/24') isSingle = true;

    const fullId = `${idBase}${letter}`;
    let dims = {
      'A': { l: 6, b: 3.1 },  
      'B': { l: 8, b: 3.75 }, 
      'C': { l: 10, b: 4.85 },  
      'D': { l: 12, b: 5.15 },  
      'G': { l: 17, b: 6.5 }
    }[letter] || { l: 10, b: 4.85 };

    if (overrideLength !== undefined && overrideBeam !== undefined) {
      dims = { l: overrideLength, b: overrideBeam };
    }

    // Probabilidades ajustadas para más ocupación y mantenimiento
    const statusRoll = Math.random();
    let status = MooringStatus.AVAILABLE;
    
    if (statusRoll < 0.60) {
      status = MooringStatus.OCCUPIED;
    } else if (statusRoll < 0.70) {
      status = MooringStatus.RESERVED;
    } else if (statusRoll < 0.80) { // 10% probabilidad de mantenimiento/hibernación
      status = MooringStatus.MAINTENANCE;
    } else {
      status = MooringStatus.AVAILABLE;
    }

    const randomFlag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
    const randomBoatName = BOAT_NAMES[Math.floor(Math.random() * BOAT_NAMES.length)];
    const randomOwner = OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)];
    const randomProv = REG_PROVINCES[Math.floor(Math.random() * REG_PROVINCES.length)];
    const randomYear = 20 + Math.floor(Math.random() * 5);

    // Creamos barco si está ocupado O si está en mantenimiento (barco en marina seca asociado)
    const hasBoat = status === MooringStatus.OCCUPIED || status === MooringStatus.MAINTENANCE;

    const boatData = hasBoat ? {
      id: `B-${globalId}`,
      name: randomBoatName,
      owner: randomOwner,
      phone: `+34 6${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `${randomBoatName.toLowerCase().replace(/\s/g, '')}@gmail.com`,
      length: Math.max(dims.l - (Math.random() * 2), 4).toFixed(1) as any, 
      beam: Math.max(dims.b - (Math.random() * 1), 2).toFixed(1) as any,
      arrivalDate: `2024-${Math.floor(Math.random() * 12 + 1).toString().padStart(2, '0')}-15`,
      departureDate: '',
      registration: `7ª-${randomProv}-${globalId}-${randomYear}`,
      flag: randomFlag.name,
      flagCode: randomFlag.code,
      portOfRegistry: randomFlag.name === 'España' ? 'Camariñas' : 'Registro Extranjero',
      skipperId: `${Math.floor(10000000 + Math.random() * 90000000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      nationality: randomFlag.name,
      isBase: Math.random() > 0.6, // Más probabilidad de Base
      // Si está en mantenimiento, simulamos hibernación
      inDryDock: status === MooringStatus.MAINTENANCE,
      maintenanceReturnDate: status === MooringStatus.MAINTENANCE 
        ? `2024-${(new Date().getMonth() + 2).toString().padStart(2,'0')}-01` 
        : undefined
    } : undefined;

    // Forzar que si es Mantenimiento, sea de Base
    if (status === MooringStatus.MAINTENANCE && boatData) {
      boatData.isBase = true;
    }

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
      boat: boatData
    });
    globalId++;
  };

  for (let i = 1; i <= 25; i += 2) createMooring('P1', i, 'NORTE', 'C');
  for (let i = 2; i <= 24; i += 2) {
    if (i === 2 || i === 4) createMooring('P1', i, 'NORTE', 'B');
    else if (i >= 6 && i <= 12) createMooring('P1', i, 'NORTE', 'C');
    else createMooring('P1', i, 'NORTE', 'D');
  }
  createMooring('P1', 26, 'NORTE', 'G');
  for (let i = 1; i <= 23; i += 2) {
    if (i === 1) createMooring('P2', i, 'CENTRAL', 'A'); 
    else createMooring('P2', i, 'CENTRAL', 'D');
  }
  for (let i = 2; i <= 24; i += 2) createMooring('P2', i, 'CENTRAL', 'C');
  createMooring('P2', 26, 'CENTRAL', 'G');
  for (let i = 1; i <= 33; i += 2) {
    if (i <= 19) createMooring('P3', i, 'SUR', 'A');
    else createMooring('P3', i, 'SUR', 'B');
  }
  for (let i = 2; i <= 26; i += 2) {
    if (i === 2) createMooring('P3', i, 'SUR', 'A');
    else createMooring('P3', i, 'SUR', 'C');
  }
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
      { id: '1', range: '< 5 mts.', daily: 5.50, weekly: 33.00, monthly: 132.00, annual: 290.00 },
      { id: '2', range: 'De 5 a 5,99 mts.', daily: 6.50, weekly: 39.00, monthly: 156.00, annual: 356.00 },
      { id: '3', range: 'De 6 a 6,99 mts.', daily: 7.50, weekly: 45.00, monthly: 180.00, annual: 488.00 },
      { id: '4', range: 'De 7 a 7,99 mts.', daily: 8.00, weekly: 48.00, monthly: 192.00, annual: 550.00 },
      { id: '5', range: 'De 8 a 8,99 mts.', daily: 10.00, weekly: 60.00, monthly: 240.00, annual: 715.00 },
      { id: '6', range: 'De 9 a 9,99 mts.', daily: 12.00, weekly: 71.00, monthly: 288.00, annual: 924.00 },
      { id: '7', range: 'De 10 a 10,99 mts.', daily: 14.00, weekly: 84.00, monthly: 336.00, annual: 990.00 },
      { id: '8', range: 'De 11 a 11,99 mts.', daily: 18.00, weekly: 108.00, monthly: 432.00, annual: 1100.00 },
      { id: '9', range: 'De 12 a 12,99 mts.', daily: 19.00, weekly: 122.00, monthly: 456.00, annual: 1320.00 },
      { id: '10', range: 'De 13 a 14,99 mts.', daily: 22.00, weekly: 137.00, monthly: 528.00, annual: 1650.00 },
      { id: '11', range: 'De 15 a 17,99 mts.', daily: 27.50, weekly: 165.00, monthly: 660.00, annual: 2090.00 },
      { id: '12', range: 'De 18 a 20,00 mts.', daily: 33.00, weekly: 193.00, monthly: 792.00, annual: 0.00 },
      { id: '13', range: '> 20 mts.', daily: 44.00, weekly: 244.00, monthly: 1056.00, annual: 0.00 },
    ]
  },
  {
    id: 'high',
    name: 'TEMPORADA ALTA',
    dates: 'MAYO A OCTUBRE',
    rows: [
      { id: '1', range: '< 5 mts.', daily: 6.50, weekly: 39.00, monthly: 156.00, annual: 290.00 },
      { id: '2', range: 'De 5 a 5,99 mts.', daily: 7.50, weekly: 45.00, monthly: 180.00, annual: 356.00 },
      { id: '3', range: 'De 6 a 6,99 mts.', daily: 9.00, weekly: 54.00, monthly: 216.00, annual: 488.00 },
      { id: '4', range: 'De 7 a 7,99 mts.', daily: 12.00, weekly: 72.00, monthly: 288.00, annual: 550.00 },
      { id: '5', range: 'De 8 a 8,99 mts.', daily: 14.50, weekly: 87.00, monthly: 348.00, annual: 715.00 },
      { id: '6', range: 'De 9 a 9,99 mts.', daily: 16.50, weekly: 99.00, monthly: 396.00, annual: 924.00 },
      { id: '7', range: 'De 10 a 10,99 mts.', daily: 20.00, weekly: 120.00, monthly: 480.00, annual: 990.00 },
      { id: '8', range: 'De 11 a 11,99 mts.', daily: 22.00, weekly: 132.00, monthly: 528.00, annual: 1100.00 },
      { id: '9', range: 'De 12 a 12,99 mts.', daily: 26.50, weekly: 159.00, monthly: 636.00, annual: 1320.00 },
      { id: '10', range: 'De 13 a 14,99 mts.', daily: 31.00, weekly: 186.00, monthly: 744.00, annual: 1650.00 },
      { id: '11', range: 'De 15 a 17,99 mts.', daily: 38.50, weekly: 231.00, monthly: 924.00, annual: 2090.00 },
      { id: '12', range: 'De 18 a 20,00 mts.', daily: 47.50, weekly: 285.00, monthly: 1140.00, annual: 0.00 },
      { id: '13', range: '> 20 mts.', daily: 60.50, weekly: 363.00, monthly: 1452.00, annual: 0.00 },
    ]
  }
];

export const STATUS_COLORS = {
  [MooringStatus.AVAILABLE]: 'bg-emerald-500',
  [MooringStatus.OCCUPIED]: 'bg-rose-600',
  [MooringStatus.RESERVED]: 'bg-amber-500',
  [MooringStatus.MAINTENANCE]: 'bg-indigo-600'
};

export const BASE_BOAT_COLOR = 'bg-slate-900';
export const MAP_BASE_BOAT_COLOR = '#1e293b'; 
export const MAP_TRANSIT_BOAT_COLOR = '#ef4444';

export const STATUS_LABELS = {
  [MooringStatus.AVAILABLE]: 'Disponible',
  [MooringStatus.OCCUPIED]: 'Ocupado',
  [MooringStatus.RESERVED]: 'Reservado',
  [MooringStatus.MAINTENANCE]: 'Marina Seca / Mant.'
};

export const FLAG_ISO_MAP: Record<string, string> = {
  'España': 'es',
  'Portugal': 'pt',
  'Francia': 'fr',
  'Reino Unido': 'gb',
  'Alemania': 'de',
  'Italia': 'it',
  'Bélgica': 'be',
  'Holanda': 'nl',
  'Irlanda': 'ie',
  'Polonia': 'pl',
  'Grecia': 'gr',
  'EEUU': 'us',
  'Canadá': 'ca'
};
