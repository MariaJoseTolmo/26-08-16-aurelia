import { AssignUserCompanyRequest } from '@aurelia/contracts';
import { IsUUID } from 'class-validator';

export class AssignUserCompanyDto implements AssignUserCompanyRequest {
  @IsUUID()
  companyId: string;
}
