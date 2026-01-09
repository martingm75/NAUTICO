
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
