import { AssignRolePermissionRequest } from '@aurelia/contracts';
import { IsUUID } from 'class-validator';

export class AssignRolePermissionDto implements AssignRolePermissionRequest {
  @IsUUID()
  permissionId: string;
}
