import type { ReactNode } from 'react';

type DashboardResponsiveCompanyAnalysisSectionProps = {
  cardA: ReactNode;
  cardB: ReactNode;
  cardC: ReactNode;
  cardD: ReactNode;
  chart: ReactNode;
};

export function DashboardResponsiveCompanyAnalysisSection({ cardA, cardB, cardC, cardD, chart }: DashboardResponsiveCompanyAnalysisSectionProps) {
  const cards = [cardA, cardB, cardC, cardD];

  return (
    <>
      <div className="h-auto min-h-[93px] relative shrink-0 w-full flex flex-wrap gap-[12px]" data-name="Container">
        {cards.map((card, index) => (
          <div className="min-w-0" key={index} style={{ flex: '1 1 243px', minWidth: 243 }}>
            {card}
          </div>
        ))}
      </div>
      {chart}
    </>
  );
}
