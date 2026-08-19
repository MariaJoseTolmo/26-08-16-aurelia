export type AuthClientApplication = 'web' | 'mobile-inspecciones' | 'mobile-incidentes';

export interface LoginRequest {
  email: string;
  password: string;
  client?: AuthClientApplication;
}
