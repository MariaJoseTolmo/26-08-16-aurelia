import { Children, type ReactNode } from 'react';

type DashboardResponsiveSecondaryGridProps = {
  children: ReactNode;
};

export function DashboardResponsiveSecondaryGrid({ children }: DashboardResponsiveSecondaryGridProps) {
  const items = Children.toArray(children);

  return (
    <div className="h-auto min-h-[278.5px] relative shrink-0 w-full flex flex-wrap gap-[16px]" data-name="Container">
      {items.map((child, index) => {
        const isEvolutionChart = index === 2;

        return (
          <div
            className="min-w-0"
            key={index}
            style={{
              flex: isEvolutionChart ? '1.2 1 366px' : '1 1 305px',
              minWidth: isEvolutionChart ? 366 : 305,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
