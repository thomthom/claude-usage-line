import type { SessionContextUsage, SessionRateLimit } from 'claude-code'

export type Level = 'normal' | 'warning' | 'critical'

export type Gauge = {
  key: string
  label: string
  percent: number
  detail: string
  level: Level
}

const LIMIT_LABELS: Record<string, string> = {
  five_hour: 'Session',
  seven_day: 'Weekly',
}

export function formatTimeLeft(resetsAt: string, now: number): string {
  const minutes = Math.max(0, Math.round((Date.parse(resetsAt) - now) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${Number((tokens / 1_000_000).toFixed(1))}M`
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k`
  return `${tokens}`
}

export function levelOf(percent: number): Level {
  if (percent >= 90) return 'critical'
  if (percent >= 70) return 'warning'
  return 'normal'
}

export function gauges(
  context: SessionContextUsage,
  rateLimits: SessionRateLimit[],
  now: number,
): Gauge[] {
  const result: Gauge[] = []
  if (context.percent !== undefined) {
    result.push({
      key: 'context',
      label: 'Context',
      percent: context.percent,
      detail: `${formatTokens(context.tokens ?? 0)} / ${formatTokens(context.window)}`,
      level: levelOf(context.percent),
    })
  }
  for (const limit of rateLimits) {
    const percent = Math.round(limit.percentUsed)
    result.push({
      key: limit.kind,
      label: LIMIT_LABELS[limit.kind] ?? limit.kind,
      percent,
      detail: limit.resetsAt ? `resets in ${formatTimeLeft(limit.resetsAt, now)}` : '',
      level: levelOf(percent),
    })
  }
  return result
}

const BAR_COLORS: Record<Level, string> = {
  normal: '#3b82f6',
  warning: '#e0a526',
  critical: '#e5534b',
}

export const BAR_HEIGHT = 4

// The viewBox is 100 units wide so the filled width is the percentage itself, and
// preserveAspectRatio="none" stretches it to whatever width the column has.
// The track is grey at partial opacity so it reads on light and dark themes.
export function barSvg(percent: number, level: Level): string {
  const filled = Math.min(100, Math.max(0, percent))
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${BAR_HEIGHT}" ` +
    `viewBox="0 0 100 ${BAR_HEIGHT}" preserveAspectRatio="none">` +
    `<rect width="100" height="${BAR_HEIGHT}" fill="#808080" fill-opacity="0.35"/>` +
    `<rect width="${filled}" height="${BAR_HEIGHT}" fill="${BAR_COLORS[level]}"/>` +
    '</svg>'
  )
}
