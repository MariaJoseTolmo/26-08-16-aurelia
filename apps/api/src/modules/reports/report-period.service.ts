import { Injectable } from '@nestjs/common';
import type { PeriodicReportRequest, ReportPeriod } from '@aurelia/contracts';

export interface ResolvedReportPeriod {
  year: number;
  period: ReportPeriod;
  start: Date;
  end: Date;
  months: number[];
  label: string;
}

const periods: ReportPeriod[] = ['year', 'q1', 'q2', 'q3', 'q4', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'];
const quarterMonths: Record<'q1' | 'q2' | 'q3' | 'q4', number[]> = {
  q1: [0, 1, 2],
  q2: [3, 4, 5],
  q3: [6, 7, 8],
  q4: [9, 10, 11],
};

@Injectable()
export class ReportPeriodService {
  resolve(request: PeriodicReportRequest = {}): ResolvedReportPeriod {
    const currentYear = new Date().getUTCFullYear();
    const parsedYear = typeof request.year === 'number' ? request.year : Number(request.year);
    const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= currentYear + 1 ? parsedYear : currentYear;
    const period = periods.includes(request.period as ReportPeriod) ? request.period as ReportPeriod : 'year';
    const months = this.getMonths(period);
    const startMonth = months[0] ?? 0;
    const endMonth = months[months.length - 1] ?? 11;

    return {
      year,
      period,
      months,
      start: new Date(Date.UTC(year, startMonth, 1)),
      end: new Date(Date.UTC(year, endMonth + 1, 1)),
      label: this.getLabel(year, period, months),
    };
  }

  getMonths(period: ReportPeriod): number[] {
    if (period === 'year') return Array.from({ length: 12 }, (_, index) => index);
    if (period.startsWith('m')) return [Number(period.slice(1)) - 1];
    return quarterMonths[period as keyof typeof quarterMonths] ?? quarterMonths.q1;
  }

  private getLabel(year: number, period: ReportPeriod, months: number[]): string {
    if (period === 'year') return `Año ${year}`;
    if (period.startsWith('m')) {
      const month = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, months[0] ?? 0, 1)));
      return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
    }
    const labels: Record<string, string> = {
      q1: `Año ${year} · Trimestre 1`,
      q2: `Año ${year} · Trimestre 2`,
      q3: `Año ${year} · Trimestre 3`,
      q4: `Año ${year} · Trimestre 4`,
    };
    return labels[period] ?? `Año ${year}`;
  }
}
