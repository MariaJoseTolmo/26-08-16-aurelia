import type { RecordStatus } from '../enums';
import type { ID } from '../types/common';
import type { BaseEntity } from './entity.interface';

export interface BusinessUnit extends BaseEntity {
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface Gerencia extends BaseEntity {
  businessUnitId: ID | null;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface Area extends BaseEntity {
  gerenciaId: ID | null;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface Sector extends BaseEntity {
  areaId: ID | null;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
}

export interface Location extends BaseEntity {
  sectorId: ID | null;
  code: string | null;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  altitudeM: number | null;
  macrozone: string | null;
  status: RecordStatus;
}

export interface Company extends BaseEntity {
  code: string | null;
  name: string;
  taxId: string | null;
  companyType: string | null;
  isContractor: boolean;
  status: RecordStatus;
}
