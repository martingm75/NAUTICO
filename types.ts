
export enum MooringStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

export type PierZone = 'NORTE' | 'CENTRAL' | 'SUR';

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationality: string;
  documentType: string;
  visa?: string;
}

export interface Boat {
  id: string;
  name: string;
  owner: string;
  phone?: string;
  email?: string;
  length: number; 
  beam: number;   
  arrivalDate: string;
  arrivalTime?: string;
  departureDate: string;
  departureTime?: string;
  registration: string;
  flag?: string; 
  flagCode?: string; 
  portOfRegistry?: string;
  skipperId?: string; 
  nationality?: string;
  isBase?: boolean; 
  inDryDock?: boolean;
  // Campos específicos Anexo 2
  lastPort?: string;
  lastCountry?: string;
  nextPort?: string;
  nextCountry?: string;
  passengers?: Passenger[];
}

export interface Mooring {
  id: string;
  number: number;
  zone: PierZone;
  status: MooringStatus;
  isSingle?: boolean;
  customFinger?: 'TOP' | 'BOTTOM' | 'BOTH' | 'NONE';
  boat?: Boat;
  maxDimensions: {
    length: number;
    beam: number;
  };
  reservation?: {
    startDate: string;
    endDate: string;
    notes?: string;
  };
}

export interface MarinaStats {
  total: number;
  occupied: number;
  reserved: number;
  available: number;
  maintenance: number;
}

export interface TariffRow {
  id: string;
  range: string;
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface TariffSeason {
  id: 'low' | 'high';
  name: string;
  dates: string;
  rows: TariffRow[];
}
