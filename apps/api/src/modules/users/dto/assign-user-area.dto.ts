import { AssignUserAreaRequest } from '@aurelia/contracts';
import { IsUUID } from 'class-validator';

export class AssignUserAreaDto implements AssignUserAreaRequest {
  @IsUUID()
  areaId: string;
}
