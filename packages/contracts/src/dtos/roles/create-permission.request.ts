export interface CreatePermissionRequest {
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}
