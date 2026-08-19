import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AccessTokenPayload } from '../auth/jwt-token.service';
import { CompanyEntity } from '../organization/entities/company.entity';
import { UserEntity } from '../users/entities/user.entity';

export interface ResolvedReportScope {
  unrestricted: boolean;
  companyIds: string[];
}

@Injectable()
export class ReportScopeService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async resolveCompanyScope(user: AccessTokenPayload, requestedCompanyId?: string | null): Promise<ResolvedReportScope> {
    if (user.roles.includes('ADMIN')) {
      return requestedCompanyId ? { unrestricted: false, companyIds: [requestedCompanyId] } : { unrestricted: true, companyIds: [] };
    }

    const row = await this.users.findOne({
      where: { id: user.sub, isActive: true },
      relations: {
        company: true,
        userCompanies: {
          company: true,
        },
      },
    });

    const companies: CompanyEntity[] = [];
    if (row?.company) companies.push(row.company);
    for (const userCompany of row?.userCompanies ?? []) {
      if (userCompany.company) companies.push(userCompany.company);
    }

    const uniqueCompanies = Array.from(new Map(companies.map((company) => [company.id, company])).values());
    const isPrincipal = user.email.toLowerCase().endsWith('@goldfields.com') || uniqueCompanies.some((company) => this.isPrincipalCompany(company));

    if (isPrincipal) {
      return requestedCompanyId ? { unrestricted: false, companyIds: [requestedCompanyId] } : { unrestricted: true, companyIds: [] };
    }

    const allowedCompanyIds = uniqueCompanies.map((company) => company.id);
    if (!requestedCompanyId) return { unrestricted: false, companyIds: allowedCompanyIds };
    return { unrestricted: false, companyIds: allowedCompanyIds.includes(requestedCompanyId) ? [requestedCompanyId] : [] };
  }

  private isPrincipalCompany(company: CompanyEntity): boolean {
    const code = company.code?.trim().toUpperCase() ?? '';
    const name = company.name.trim().toLowerCase();
    return code === 'CORP' || company.isContractor === false || name.includes('gold field');
  }
}
