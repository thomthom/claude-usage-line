import { expect, test } from 'claude-code/testing'
import { formatTimeLeft, formatTokens, gauges, levelOf } from './format'

const NOW = Date.parse('2026-10-16T12:00:00Z')

test('builds a gauge for context and each limit', async () => {
  const shown = gauges(
    { tokens: 83_691, window: 1_000_000, percent: 8 },
    [
      { kind: 'five_hour', percentUsed: 71, resetsAt: '2026-10-16T13:17:00Z' },
      { kind: 'seven_day', percentUsed: 10.4, resetsAt: '2026-10-18T19:00:00Z' },
    ],
    NOW,
  )
  expect(shown.map(gauge => [gauge.label, gauge.percent, gauge.detail, gauge.level])).toEqual([
    ['Context', 8, '84k / 1M', 'normal'],
    ['Session', 71, 'resets in 1h 17m', 'warning'],
    ['Weekly', 10, 'resets in 2d 7h', 'normal'],
  ])
})

test('leaves out figures the engine has not reported yet', async () => {
  expect(gauges({ window: 1_000_000 }, [], NOW)).toEqual([])
})

test('turns red from 90%', async () => {
  expect(levelOf(89)).toBe('warning')
  expect(levelOf(90)).toBe('critical')
})

test('shortens token counts and times', async () => {
  expect(formatTokens(200_000)).toBe('200k')
  expect(formatTokens(1_500_000)).toBe('1.5M')
  expect(formatTimeLeft('2026-10-16T12:05:00Z', NOW)).toBe('5m')
})
