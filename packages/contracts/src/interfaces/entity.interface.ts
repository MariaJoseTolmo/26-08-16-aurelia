import type { ID, ISODateString } from '../types/common';

export interface BaseEntity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
