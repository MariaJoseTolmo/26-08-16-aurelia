import type { CreateIncidentRequest, IncidentResponse } from '@aurelia/contracts';
import { httpGet, httpPost } from './http-client';

export function fetchIncidents(): Promise<IncidentResponse[]> {
  return httpGet<IncidentResponse[]>('/incidents');
}

export function submitIncident(payload: CreateIncidentRequest): Promise<IncidentResponse> {
  return httpPost<CreateIncidentRequest, IncidentResponse>('/incidents', payload);
}
