import type { ISODateString } from '../../types/common';

export interface InspectionFindingTypeResponse {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InspectionFindingSeverityResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  closureTimeLabel: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InspectionRiskProbabilityResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  score: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InspectionRiskConsequenceResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  score: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
