import { Injectable } from '@nestjs/common';
import {
  CountReportRowResponse,
  IncidentActionPlanStatus,
  IncidentStatus,
  IncidentSummaryReportResponse,
  InspectionFindingStatus,
  InspectionStatus,
  InspectionSummaryReportResponse,
  OpenItemsReportResponse,
  PeriodReportRowResponse,
  ReportFilterRequest,
  ReportSummaryResponse,
} from '@aurelia/contracts';
import { DataSource } from 'typeorm';

type QueryParts = {
  sql: string;
  params: unknown[];
};

@Injectable()
export class ReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async summary(filter: ReportFilterRequest): Promise<ReportSummaryResponse> {
    const [inspections, incidents, byLevel] = await Promise.all([
      this.inspectionsSummary(filter),
      this.incidentsSummary(filter),
      this.incidentsByLevel(filter),
    ]);

    return {
      totalInspections: inspections.total,
      totalIncidents: incidents.total,
      openIncidents: incidents.open,
      byRiskLevel: this.rowsToRecord(byLevel),
      byStatus: incidents.byStatus,
    };
  }

  async inspectionsSummary(filter: ReportFilterRequest): Promise<InspectionSummaryReportResponse> {
    const where = this.buildWhere('i', filter, 'created_at');
    const findingsWhere = this.buildWhere('i', filter, 'created_at');
    const openWhere = this.withExtra(where, 'i.status NOT IN ($next, $next)', [InspectionStatus.CLOSED, InspectionStatus.CANCELLED]);
    const closedWhere = this.withExtra(where, 'i.status = $next', [InspectionStatus.CLOSED]);
    const cancelledWhere = this.withExtra(where, 'i.status = $next', [InspectionStatus.CANCELLED]);
    const openFindingsWhere = this.withExtra(findingsWhere, 'f.status NOT IN ($next, $next)', [InspectionFindingStatus.CLOSED, InspectionFindingStatus.CANCELLED]);
    const overdueFindingsWhere = this.withExtra(findingsWhere, 'f.due_at IS NOT NULL AND f.due_at < NOW() AND f.status NOT IN ($next, $next)', [InspectionFindingStatus.CLOSED, InspectionFindingStatus.CANCELLED]);
    const byStatus = await this.countByStatus('inspections', 'i', filter, 'created_at');

    const [total, open, closed, cancelled, openFindings, overdueFindings] = await Promise.all([
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspections i ${where.sql}`, where.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspections i ${openWhere.sql}`, openWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspections i ${closedWhere.sql}`, closedWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspections i ${cancelledWhere.sql}`, cancelledWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspection_findings f JOIN inspections i ON i.id = f.inspection_id ${openFindingsWhere.sql}`, openFindingsWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM inspection_findings f JOIN inspections i ON i.id = f.inspection_id ${overdueFindingsWhere.sql}`, overdueFindingsWhere.params),
    ]);

    return { total, open, closed, cancelled, openFindings, overdueFindings, byStatus };
  }

  async incidentsSummary(filter: ReportFilterRequest): Promise<IncidentSummaryReportResponse> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const actionPlanWhere = this.buildWhere('i', filter, 'reported_at');
    const openWhere = this.withExtra(where, 'i.status NOT IN ($next, $next)', [IncidentStatus.CLOSED, IncidentStatus.CANCELLED]);
    const closedWhere = this.withExtra(where, 'i.status = $next', [IncidentStatus.CLOSED]);
    const cancelledWhere = this.withExtra(where, 'i.status = $next', [IncidentStatus.CANCELLED]);
    const overdueSlaWhere = this.withExtra(where, 'i.sla_due_at IS NOT NULL AND i.sla_due_at < NOW() AND i.status NOT IN ($next, $next)', [IncidentStatus.CLOSED, IncidentStatus.CANCELLED]);
    const dueSoonWhere = this.withExtra(where, "i.sla_due_at IS NOT NULL AND i.sla_due_at >= NOW() AND i.sla_due_at <= NOW() + INTERVAL '24 hours' AND i.status NOT IN ($next, $next)", [IncidentStatus.CLOSED, IncidentStatus.CANCELLED]);
    const openActionPlansWhere = this.withExtra(actionPlanWhere, 'ap.status NOT IN ($next, $next)', [IncidentActionPlanStatus.COMPLETED, IncidentActionPlanStatus.CANCELLED]);
    const overdueActionPlansWhere = this.withExtra(actionPlanWhere, 'ap.due_at IS NOT NULL AND ap.due_at < NOW() AND ap.status NOT IN ($next, $next)', [IncidentActionPlanStatus.COMPLETED, IncidentActionPlanStatus.CANCELLED]);
    const byStatus = await this.countByStatus('incidents', 'i', filter, 'reported_at');
    const actionPlanByStatus = await this.countActionPlansByStatus(filter);

    const [total, open, closed, cancelled, overdueSla, dueSoonNext24Hours, actionPlansTotal, actionPlansOpen, actionPlansOverdue] = await Promise.all([
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${where.sql}`, where.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${openWhere.sql}`, openWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${closedWhere.sql}`, closedWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${cancelledWhere.sql}`, cancelledWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${overdueSlaWhere.sql}`, overdueSlaWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incidents i ${dueSoonWhere.sql}`, dueSoonWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incident_action_plans ap JOIN incidents i ON i.id = ap.incident_id ${actionPlanWhere.sql}`, actionPlanWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incident_action_plans ap JOIN incidents i ON i.id = ap.incident_id ${openActionPlansWhere.sql}`, openActionPlansWhere.params),
      this.countScalar(`SELECT COUNT(*)::int AS count FROM incident_action_plans ap JOIN incidents i ON i.id = ap.incident_id ${overdueActionPlansWhere.sql}`, overdueActionPlansWhere.params),
    ]);

    return {
      total,
      open,
      closed,
      cancelled,
      overdueSla,
      dueSoonNext24Hours,
      byStatus,
      actionPlans: {
        total: actionPlansTotal,
        open: actionPlansOpen,
        overdue: actionPlansOverdue,
        byStatus: actionPlanByStatus,
      },
    };
  }

  async incidentsByLevel(filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const rows = await this.dataSource.query(
      `SELECT l.code AS key,
              l.name AS label,
              COUNT(*)::int AS count
       FROM incidents i
       JOIN incident_levels l ON l.id = i.incident_level_id
       ${where.sql}
       GROUP BY l.code, l.name, l.level_number
       ORDER BY l.level_number ASC`,
      where.params,
    ) as Array<{ key: string; label: string | null; count: string | number }>;

    return this.normalizeCountRows(rows);
  }

  async incidentsByType(filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const rows = await this.dataSource.query(
      `SELECT t.code AS key,
              t.name AS label,
              COUNT(*)::int AS count
       FROM incidents i
       JOIN incident_types t ON t.id = i.incident_type_id
       ${where.sql}
       GROUP BY t.code, t.name
       ORDER BY count DESC, t.name ASC`,
      where.params,
    ) as Array<{ key: string; label: string | null; count: string | number }>;

    return this.normalizeCountRows(rows);
  }

  async incidentsByCompany(filter: ReportFilterRequest): Promise<CountReportRowResponse[]> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const rows = await this.dataSource.query(
      `SELECT COALESCE(c.code, 'NO_COMPANY') AS key,
              COALESCE(c.name, 'Sin empresa') AS label,
              COUNT(*)::int AS count
       FROM incidents i
       LEFT JOIN companies c ON c.id = i.company_id
       ${where.sql}
       GROUP BY COALESCE(c.code, 'NO_COMPANY'), COALESCE(c.name, 'Sin empresa')
       ORDER BY count DESC, label ASC`,
      where.params,
    ) as Array<{ key: string; label: string | null; count: string | number }>;

    return this.normalizeCountRows(rows);
  }

  async incidentsByPeriod(filter: ReportFilterRequest): Promise<PeriodReportRowResponse[]> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const rows = await this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', i.reported_at), 'YYYY-MM') AS period,
              COUNT(*)::int AS count
       FROM incidents i
       ${where.sql}
       GROUP BY DATE_TRUNC('month', i.reported_at)
       ORDER BY DATE_TRUNC('month', i.reported_at) ASC`,
      where.params,
    ) as Array<{ period: string; count: string | number }>;

    return rows.map((row) => ({ period: row.period, count: Number(row.count) }));
  }

  async openItems(filter: ReportFilterRequest): Promise<OpenItemsReportResponse> {
    const inspections = await this.inspectionsSummary(filter);
    const incidents = await this.incidentsSummary(filter);

    return {
      inspectionsOpen: inspections.open,
      inspectionFindingsOpen: inspections.openFindings,
      inspectionFindingsOverdue: inspections.overdueFindings,
      incidentsOpen: incidents.open,
      incidentSlaOverdue: incidents.overdueSla,
      incidentActionPlansOpen: incidents.actionPlans.open,
      incidentActionPlansOverdue: incidents.actionPlans.overdue,
    };
  }

  private async countByStatus(table: string, alias: string, filter: ReportFilterRequest, dateColumn: string): Promise<Record<string, number>> {
    const where = this.buildWhere(alias, filter, dateColumn);
    const rows = await this.dataSource.query(
      `SELECT ${alias}.status AS key, COUNT(*)::int AS count FROM ${table} ${alias} ${where.sql} GROUP BY ${alias}.status ORDER BY ${alias}.status ASC`,
      where.params,
    ) as Array<{ key: string; count: string | number }>;

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.key] = Number(row.count);
      return acc;
    }, {});
  }

  private async countActionPlansByStatus(filter: ReportFilterRequest): Promise<Record<string, number>> {
    const where = this.buildWhere('i', filter, 'reported_at');
    const rows = await this.dataSource.query(
      `SELECT ap.status AS key, COUNT(*)::int AS count
       FROM incident_action_plans ap
       JOIN incidents i ON i.id = ap.incident_id
       ${where.sql}
       GROUP BY ap.status
       ORDER BY ap.status ASC`,
      where.params,
    ) as Array<{ key: string; count: string | number }>;

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.key] = Number(row.count);
      return acc;
    }, {});
  }

  private async countScalar(sql: string, params: unknown[]): Promise<number> {
    const rows = await this.dataSource.query(sql, params) as Array<{ count: string | number }>;
    return Number(rows[0]?.count ?? 0);
  }

  private buildWhere(alias: string, filter: ReportFilterRequest, dateColumn: string): QueryParts {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.companyId) {
      params.push(filter.companyId);
      conditions.push(`${alias}.company_id = $${params.length}`);
    }

    if (filter.areaId) {
      params.push(filter.areaId);
      conditions.push(`${alias}.area_id = $${params.length}`);
    }

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`${alias}.status = $${params.length}`);
    }

    if (filter.from) {
      params.push(filter.from);
      conditions.push(`${alias}.${dateColumn} >= $${params.length}`);
    }

    if (filter.to) {
      params.push(filter.to);
      conditions.push(`${alias}.${dateColumn} <= $${params.length}`);
    }

    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private withExtra(parts: QueryParts, condition: string, values: unknown[] = []): QueryParts {
    const params = [...parts.params];
    let renderedCondition = condition;

    for (const value of values) {
      params.push(value);
      renderedCondition = renderedCondition.replace('$next', `$${params.length}`);
    }

    return {
      sql: parts.sql ? `${parts.sql} AND ${renderedCondition}` : `WHERE ${renderedCondition}`,
      params,
    };
  }

  private normalizeCountRows(rows: Array<{ key: string; label: string | null; count: string | number }>): CountReportRowResponse[] {
    return rows.map((row) => ({ key: row.key, label: row.label, count: Number(row.count) }));
  }

  private rowsToRecord(rows: CountReportRowResponse[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.key] = row.count;
      return acc;
    }, {});
  }
}
