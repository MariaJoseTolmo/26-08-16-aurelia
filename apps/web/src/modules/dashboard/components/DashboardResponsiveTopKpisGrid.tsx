import { Children, type ReactNode } from 'react';

type DashboardResponsiveTopKpisGridProps = {
  children: ReactNode;
};

export function DashboardResponsiveTopKpisGrid({ children }: DashboardResponsiveTopKpisGridProps) {
  const items = Children.toArray(children);

  return (
    <div className="h-auto relative shrink-0 w-full flex flex-wrap gap-[12px]" data-name="Container">
      {items.map((child, index) => (
        <div className="min-w-0" key={index} style={{ flex: '1 1 158px', minWidth: 158 }}>
          {child}
        </div>
      ))}
    </div>
  );
}
