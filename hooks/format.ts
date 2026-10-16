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

const RING_COLORS: Record<Level, string> = {
  normal: '#3b82f6',
  warning: '#e0a526',
  critical: '#e5534b',
}

export function ringSvg(percent: number, level: Level): string {
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * circumference
  // The track is grey at partial opacity so it reads on light and dark themes.
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">' +
    `<circle cx="13" cy="13" r="${radius}" fill="none" stroke="#808080" stroke-opacity="0.35" stroke-width="3"/>` +
    `<circle cx="13" cy="13" r="${radius}" fill="none" stroke="${RING_COLORS[level]}" stroke-width="3" ` +
    `stroke-linecap="round" stroke-dasharray="${filled.toFixed(2)} ${circumference.toFixed(2)}" transform="rotate(-90 13 13)"/>` +
    '</svg>'
  )
}
