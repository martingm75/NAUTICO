
import { Mooring, MooringStatus, PierZone, TariffSeason, Boat } from './types';

// Mapeo para demostración de banderas iniciales
const FLAGS = [
  { name: 'España', code: 'es' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Francia', code: 'fr' },
  { name: 'Reino Unido', code: 'gb' },
  { name: 'Alemania', code: 'de' },
  { name: 'Irlanda', code: 'ie' },
  { name: 'Polonia', code: 'pl' },
  { name: 'Grecia', code: 'gr' },
  { name: 'Italia', code: 'it' },
  { name: 'Suecia', code: 'se' },
  { name: 'Noruega', code: 'no' },
  { name: 'Bélgica', code: 'be' },
  { name: 'Países Bajos', code: 'nl' }
];

const BOAT_NAMES = [
  'Sea Breeze', 'Galerna', 'Albatros', 'Poseidón', 'Mare Nostrum', 'Eolo', 'Sirena del Mar', 'Orca II', 
  'Nereida', 'Odisea', 'Mar de Fondo', 'Estrella Polar', 'Viento del Sur', 'Libertad', 'Amanecer', 
  'Delfín Solitario', 'Vikingo', 'Bahía Azul', 'Cormorán', 'Tempestad', 'Calma Chicha', 'Corsario',
  'Azul Profundo', 'Nautilus', 'Boreal', 'Aventurero', 'Horizonte', 'Marea Alta', 'Brisa Marina',
  'Rayo Verde', 'Capitán Nemo', 'Lobo de Mar', 'Espuma Blanca', 'Siroco', 'Mistral', 'Tramontana',
  'Levante', 'Poniente', 'Acuario', 'Piscis', 'Andrómeda', 'Casiopea', 'Orion', 'Pegaso',
  'Argonauta', 'Calipso', 'Tritón', 'Neptuno', 'Atlántida', 'Pacífico', 'Mediterráneo', 'Cantábrico',
  'Ítaca', 'Troya', 'Esparta', 'Atenas', 'Roma', 'Cartago', 'Fenicia', 'Vikingo II',
  'Drakkar', 'Galeón', 'Fragata', 'Goleta', 'Bergantín', 'Carabela', 'Naos', 'Santa María',
  'Pinta', 'Niña', 'Victoria', 'Trinidad', 'Concepción', 'San Antonio', 'Santiago', 'San Cristóbal',
  'Fortuna', 'Destino', 'Esperanza', 'Gloria', 'Victoria', 'Fama', 'Honor', 'Valor',
  'Audaz', 'Intrépido', 'Valiente', 'Guerrero', 'Defensor', 'Protector', 'Guardián', 'Vigía'
];

const OWNER_NAMES = [
  'Juan Pérez García', 'Marta Rodríguez Ruiz', 'Pierre Dubois', 'Hans Müller', 'Elena García Santos', 
  'Luigi Verdi', 'Antonio Da Silva', 'Robert Smith', 'Krzysztof Nowak', 'Giorgos Papadopoulos',
  'Carmen Lema Varela', 'Santiago Martínez', 'Isabel Castro', 'Francisco Javier Sordo',
  'Ana Belén López', 'Miguel Ángel Torres', 'Laura Díaz', 'Carlos Ruiz', 'John Doe', 'Jane Smith',
  'Michael Johnson', 'Emily Davis', 'David Wilson', 'Sarah Brown', 'James Taylor', 'Jessica Anderson',
  'William Thomas', 'Elizabeth Jackson', 'Richard White', 'Karen Harris', 'Joseph Martin', 'Nancy Thompson',
  'Thomas Garcia', 'Lisa Martinez', 'Charles Robinson', 'Betty Clark', 'Christopher Rodriguez', 'Sandra Lewis',
  'Daniel Lee', 'Ashley Walker', 'Matthew Hall', 'Kimberly Allen', 'Anthony Young', 'Donna Hernandez',
  'Donald King', 'Michelle Wright', 'Paul Lopez', 'Carol Hill', 'Mark Scott', 'Jennifer Green',
  'George Adams', 'Amanda Baker', 'Kenneth Gonzalez', 'Melissa Nelson', 'Steven Carter', 'Stephanie Mitchell',
  'Edward Perez', 'Rebecca Roberts', 'Brian Turner', 'Sharon Phillips', 'Ronald Campbell', 'Cynthia Parker',
  'Kevin Evans', 'Kathleen Edwards', 'Jason Collins', 'Amy Stewart', 'Jeffrey Sanchez', 'Shirley Morris',
  'Ryan Rogers', 'Angela Reed', 'Jacob Cook', 'Helen Morgan', 'Gary Bell', 'Deborah Murphy',
  'Nicholas Bailey', 'Janet Rivera', 'Eric Cooper', 'Maria Richardson', 'Stephen Cox', 'Heather Howard'
];

const REG_PROVINCES = ['CO', 'VI', 'SS', 'BA', 'MA', 'AL', 'GC', 'FE', 'TE', 'HU', 'PM'];

// Función auxiliar para obtener datos únicos secuenciales
const getUniqueData = (index: number) => {
  const boatName = BOAT_NAMES[index % BOAT_NAMES.length] + (index >= BOAT_NAMES.length ? ` ${Math.floor(index/BOAT_NAMES.length) + 1}` : '');
  const ownerName = OWNER_NAMES[index % OWNER_NAMES.length] + (index >= OWNER_NAMES.length ? ` ${Math.floor(index/OWNER_NAMES.length) + 1}` : '');
  return { boatName, ownerName };
};

// Helper para identificar plazas de cabecera (Martillo)
export const isHeadMooring = (id: string) => {
  // Identificamos cabeceras por el sufijo G (P1/26G, P2/25G, P3/35G)
  return id.endsWith('G');
};

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

    // PATRÓN P1 LADO IMPAR (3 a 25): Pares de pozo (3-5, 7-9, etc.)
    // i=3 (TOP), i=5 (BOTTOM) -> Pozo entre 3 y 5
    // i=7 (TOP), i=9 (BOTTOM) -> Pozo entre 7 y 9
    if (prefix === 'P1' && i % 2 !== 0 && i >= 3) {
        const seqIndex = (i - 3) / 2;
        if (seqIndex % 2 === 0) customFinger = 'TOP'; // 3, 7, 11...
        else customFinger = 'BOTTOM'; // 5, 9, 13...
    }

    if (idBase === 'P1/1') { isSingle = true; customFinger = 'BOTTOM'; }
    if (idBase === 'P1/2') { isSingle = true; customFinger = 'TOP'; }
    if (idBase === 'P1/3') { customFinger = 'TOP'; } // Asegurar P1/3 TOP
    if (idBase === 'P1/23') { customFinger = 'TOP'; } // Excepción P1/23

    if (idBase === 'P2/1') { isSingle = false; customFinger = 'TOP'; }
    if (idBase === 'P2/3') { customFinger = 'BOTTOM'; }
    if (idBase === 'P2/2') { customFinger = 'BOTTOM'; }

    // CAMBIO: P2/26C y P2/24C hacen pozo (comparten agua)
    if (idBase === 'P2/24') { customFinger = 'TOP'; }
    if (idBase === 'P2/26') { customFinger = 'BOTTOM'; }

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
      'G': { l: 17, b: 6.5 } // MANGA FIJADA A 6.5 METROS
    }[letter] || { l: 10, b: 4.85 };

    if (overrideLength !== undefined && overrideBeam !== undefined) {
      dims = { l: overrideLength, b: overrideBeam };
    }

    let status = MooringStatus.AVAILABLE;
    let boat: Boat | undefined = undefined;
    let reservation: Mooring['reservation'] = undefined;

    // --- ESCENARIOS ESPECÍFICOS ---
    if (fullId === 'P1/2B') {
        // CASO: Titular en Hibernación
        status = MooringStatus.RESERVED;
        const titularBoatName = "Invernalia One";
        const titularId = `B-HIB-${globalId}`;
        
        reservation = {
            startDate: '2023-11-01',
            endDate: '2024-04-30',
            notes: 'Titular en Hibernación',
            relatedBoatId: titularId,
            relatedBoatName: titularBoatName,
            type: 'MAINTENANCE_HOLD'
        };
        
        boat = {
             id: titularId,
             name: titularBoatName,
             owner: "Winter Stark",
             length: 7.5, beam: 2.8,
             registration: "7ª-BA-2-2020",
             flag: 'Reino Unido', flagCode: 'gb',
             isBase: true,
             isMember: true, 
             isMultihull: false,
             inDryDock: true, 
             maintenanceReason: 'Hibernación',
             titularMooringId: fullId,
             arrivalDate: '2023-05-01',
             departureDate: '2023-11-01',
             phone: "+44 7700 900077",
             email: "lord.stark@winterfell.net"
        } as Boat;

    } else if (fullId === 'P1/4B') {
         // CASO: Titular en Mantenimiento
         status = MooringStatus.RESERVED;
         const titularId = `B-MANT-${globalId}`;
         reservation = {
            startDate: '2024-02-15',
            endDate: '2024-03-01',
            notes: 'Reparación motor',
            relatedBoatId: titularId,
            relatedBoatName: "FixMe Up",
            type: 'MAINTENANCE_HOLD'
         };
         boat = {
             id: titularId,
             name: "FixMe Up",
             owner: "Manolo Mechanic",
             length: 7.8, beam: 2.9,
             registration: "7ª-GC-5-2019",
             flag: 'España', flagCode: 'es',
             isBase: true,
             isMember: false,
             isMultihull: false,
             inDryDock: true,
             maintenanceReason: 'Mantenimiento',
             titularMooringId: fullId,
             arrivalDate: '2023-01-01',
             departureDate: '2024-02-15',
             phone: "+34 600 111 222",
             email: "taller.manolo@reparaciones.es"
        } as Boat;
    
    } else if (fullId === 'P1/10C') {
         // CASO: Catamarán Ocupando Visualmente más espacio
         status = MooringStatus.OCCUPIED;
         boat = {
             id: `B-MULTI-${globalId}`,
             name: "Twin Soul",
             owner: "Carlos Catamarán",
             length: 9.5, beam: 5.8, // Muy ancho
             registration: "7ª-VA-1-2023",
             flag: 'Francia', flagCode: 'fr',
             isBase: false,
             isMember: false,
             isMultihull: true, // MULTICASCO
             inDryDock: false,
             arrivalDate: '2024-01-10',
             departureDate: '',
             phone: "+33 600 000 000",
             email: "carlos.cata@mer.fr"
         } as Boat;

    } else {
        // Generación pseudo-aleatoria pero DETERMINISTA
        const stateCycle = globalId % 7;
        
        if (stateCycle === 0 || stateCycle === 3) status = MooringStatus.OCCUPIED; // Base
        else if (stateCycle === 1 || stateCycle === 6) status = MooringStatus.OCCUPIED; // Tránsito
        else if (stateCycle === 4) status = MooringStatus.RESERVED;
        else if (stateCycle === 5) status = MooringStatus.MAINTENANCE;
        else status = MooringStatus.AVAILABLE;

        if (status === MooringStatus.OCCUPIED) {
            const { boatName, ownerName } = getUniqueData(globalId);
            const randomFlag = FLAGS[globalId % FLAGS.length];
            const randomProv = REG_PROVINCES[globalId % REG_PROVINCES.length];
            
            const nameParts = ownerName.split(' ');
            const emailUser = `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}${globalId}`;
            const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.es', 'icloud.com'];
            const randomDomain = domains[globalId % domains.length];
            
            const isBase = (stateCycle === 0 || stateCycle === 3);
            const isMember = isBase ? (globalId % 5 !== 0) : false; 
            
            // Reducimos la probabilidad aleatoria de multicasco para que destaque el manual
            const isMultihull = false; 

            boat = {
                id: `B-${globalId}`,
                name: boatName,
                owner: ownerName,
                phone: `+34 6${(globalId * 123456).toString().slice(-8).padStart(8, '0')}`,
                email: `${emailUser}@${randomDomain}`,
                length: parseFloat(Math.max(dims.l - ((globalId % 30) / 10), 4).toFixed(1)), 
                beam: parseFloat(Math.max(dims.b - ((globalId % 10) / 10), 2).toFixed(1)),
                arrivalDate: `2024-${((globalId % 12) + 1).toString().padStart(2, '0')}-15`,
                departureDate: '',
                registration: `7ª-${randomProv}-${globalId}-${20 + (globalId % 5)}`,
                flag: randomFlag.name,
                flagCode: randomFlag.code,
                portOfRegistry: randomFlag.name === 'España' ? 'Camariñas' : 'Registro Extranjero',
                skipperId: `${(10000000 + globalId)}X`,
                nationality: randomFlag.name,
                isBase: isBase,
                isMember: isMember,
                isMultihull: isMultihull,
                inDryDock: false,
                titularMooringId: isBase ? fullId : undefined
            };
        } else if (status === MooringStatus.RESERVED) {
            reservation = {
                startDate: '2024-06-01',
                endDate: '2024-06-15',
                notes: `Reserva Tránsito #${globalId}`,
                relatedBoatName: `Visitante Futuro ${globalId}`,
                type: 'TRANSIT_RESERVATION'
            };
        }
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
      boat: boat,
      reservation: reservation
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
  
  // PANTALÁN CENTRAL (P2)
  for (let i = 1; i <= 23; i += 2) {
    if (i === 1) createMooring('P2', i, 'CENTRAL', 'A'); 
    else createMooring('P2', i, 'CENTRAL', 'D');
  }
  // Nueva Cabecera P2
  createMooring('P2', 25, 'CENTRAL', 'G'); 

  for (let i = 2; i <= 24; i += 2) createMooring('P2', i, 'CENTRAL', 'C');
  // P2/26 ahora es una plaza normal C, haciendo pozo con P2/24
  createMooring('P2', 26, 'CENTRAL', 'C');


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
  [MooringStatus.MAINTENANCE]: 'Mantenimiento'
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
