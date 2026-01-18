
export enum MooringStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

export type PierZone = 'NORTE' | 'CENTRAL' | 'SUR';

export interface Boat {
  id: string;
  name: string;
  owner: string;
  length: number; // in meters
  beam: number;   // in meters
  arrivalDate: string;
  departureDate: string;
  registration: string;
  isBase?: boolean; // New property to distinguish base boats
}

export interface Mooring {
  id: string;
  number: number;
  zone: PierZone;
  status: MooringStatus;
  isSingle?: boolean; // Propiedad para plazas que van solas entre fingers
  customFinger?: 'TOP' | 'BOTTOM' | 'BOTH' | 'NONE'; // Control manual del finger (Babor/Estribor)
  boat?: Boat;
  maxDimensions: {
    length: number;
    beam: number;
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
  range: string; // e.g. "De 5 a 5,99 mts."
  daily: number;
  weekly: number;
  monthly: number;
}

export interface TariffSeason {
  id: 'low' | 'high';
  name: string;
  dates: string;
  rows: TariffRow[];
}
