export function addInspectionBusinessDays(value: Date, businessDays: number): Date {
  const result = new Date(value);
  let remaining = Math.max(0, Math.trunc(businessDays));
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export function inspectionBusinessDaysUntil(from: Date, dueAt: Date | null): number {
  if (!dueAt || dueAt.getTime() <= from.getTime()) return 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const target = new Date(dueAt);
  target.setHours(0, 0, 0, 0);
  let days = 0;
  while (cursor.getTime() < target.getTime()) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
}
