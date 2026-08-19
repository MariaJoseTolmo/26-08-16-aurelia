export type ID = string;
export type ISODateString = string;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: ISODateString;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
