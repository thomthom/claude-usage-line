import { expect, test } from 'claude-code/testing'

const USAGE = {
  startedAt: 0,
  context: { tokens: 83_691, window: 1_000_000, percent: 8 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 71, resetsAt: '2026-10-16T13:17:00Z' }],
}

test('draws a label per gauge on every surface', async ($, on) => {
  on('session.usage', () => ({ value: USAGE }))
  on('clock.now', () => ({ value: Date.parse('2026-10-16T12:00:00Z') }))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'usage-line',
      surface,
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10 } as never,
    })
    expect(await ui.find({ type: 'Text', text: /71%/ })).toBeDefined()
    await ui.unmount()
  }
})
