
import { Mooring, MooringStatus, PierZone } from './types';

const generateMoorings = (): Mooring[] => {
  const moorings: Mooring[] = [];
  
  const config = [
    { zone: 'NORTE' as PierZone, prefix: 'P1', sideCount: 24, headId: 'P1/25C' },
    { zone: 'CENTRAL' as PierZone, prefix: 'P2', sideCount: 25, headId: 'P2/26C' },
    { zone: 'SUR' as PierZone, prefix: 'P3', sideCount: 34, headId: 'P3/35G' }
  ];

  let globalId = 1;

  config.forEach(pier => {
    // Generar plazas laterales
    for (let i = 1; i <= pier.sideCount; i++) {
      let letter = 'C';
      if (pier.prefix === 'P3' && i <= 15) letter = 'A';
      else if (pier.prefix === 'P1' && i === 24) letter = 'D'; // P1/24D
      else if (i % 4 === 0) letter = 'D';
      else if (i % 2 === 0) letter = 'B';

      addMooring(`${pier.prefix}/${i}${letter}`, i, pier.zone, letter);
    }

    // Añadir plaza de cabecera
    const headLetter = pier.headId.slice(-1);
    addMooring(pier.headId, 99, pier.zone, headLetter);
  });

  function addMooring(id: string, num: number, zone: PierZone, letter: string) {
    const statusRoll = Math.random();
    let status = MooringStatus.AVAILABLE;
    if (statusRoll > 0.6) status = MooringStatus.OCCUPIED;
    else if (statusRoll > 0.9) status = MooringStatus.RESERVED;

    const dims = {
      'A': { l: 8, b: 3.1 },
      'B': { l: 10, b: 4.65 },
      'C': { l: 12, b: 4.8 },
      'D': { l: 15, b: 5.2 },
      'G': { l: 20, b: 6.5 }
    }[letter] || { l: 10, b: 4 };

    moorings.push({
      id: id,
      number: num,
      zone: zone,
      status: status,
      maxDimensions: {
        length: dims.l,
        beam: dims.b
      },
      boat: status === MooringStatus.OCCUPIED ? {
        id: `B-${globalId}`,
        name: `Embarcación ${globalId}`,
        owner: `Socio ${globalId}`,
        length: dims.l - 1.5,
        beam: dims.b - 0.8,
        arrivalDate: '2024-01-15',
        departureDate: '2024-12-31',
        registration: `7ª-CO-${globalId}-${24}`,
        isBase: Math.random() > 0.6
      } : undefined
    });
    globalId++;
  }

  return moorings;
};

export const INITIAL_MOORINGS = generateMoorings();

export const STATUS_COLORS = {
  [MooringStatus.AVAILABLE]: 'bg-emerald-500',
  [MooringStatus.OCCUPIED]: 'bg-rose-600',
  [MooringStatus.RESERVED]: 'bg-amber-500',
  [MooringStatus.MAINTENANCE]: 'bg-slate-400'
};

export const BASE_BOAT_COLOR = 'bg-slate-900';
export const MAP_BASE_BOAT_COLOR = '#1e293b'; 
export const MAP_TRANSIT_BOAT_COLOR = '#ef4444'; // Cambiado a ROJO según solicitud

export const STATUS_LABELS = {
  [MooringStatus.AVAILABLE]: 'Disponible',
  [MooringStatus.OCCUPIED]: 'Ocupado',
  [MooringStatus.RESERVED]: 'Reservado',
  [MooringStatus.MAINTENANCE]: 'Mantenimiento'
};
