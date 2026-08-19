import { AssignUserRoleRequest } from '@aurelia/contracts';
import { IsUUID } from 'class-validator';

export class AssignUserRoleDto implements AssignUserRoleRequest {
  @IsUUID()
  roleId: string;
}
