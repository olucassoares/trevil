export const reportPeriods = [7, 30, 90] as const;
export type ReportPeriod = typeof reportPeriods[number];

export function normalizeReportPeriod(value: number): ReportPeriod {
  return reportPeriods.includes(value as ReportPeriod) ? value as ReportPeriod : 30;
}

export function percentageGrowth(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
