import type { RecordStatus } from '../../enums';

export interface CreateCompanyRequest {
  code?: string;
  name: string;
  taxId?: string;
  companyType?: string;
  isContractor?: boolean;
  status?: RecordStatus;
}
