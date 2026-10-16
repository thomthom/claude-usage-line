import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { BAR_HEIGHT, barSvg, gauges } from './format'

// The band reads this only so that each new measurement redraws it.
const measuredAt = atom({ plugin: 'usage-line', key: 'measuredAt' } as const, 0)

async function remeasure($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  await update($, measuredAt, () => now)
}

const LEVEL_COLORS = { normal: undefined, warning: 'warning', critical: 'error' } as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    // Re-measuring each minute keeps the time until each limit resets current between turns.
    $.clock.every(60_000, () => remeasure($))
    await remeasure($)
    return started
  })

  on('session.measure', async ($, e, next) => {
    const measured = await next(e)
    await remeasure($)
    return measured
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    await read($, measuredAt)
    if (e.props.hasSurvey) return next(e)

    const { context, rateLimits } = await $.session.usage()
    const shown = gauges(context, rateLimits, await $.clock.now())
    if (shown.length === 0) return next(e)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="row" gap={3}>
          {shown.map(gauge => (
            <Text key={gauge.key} color={LEVEL_COLORS[gauge.level]}>
              {gauge.label} {gauge.percent}% <Text dimColor>{gauge.detail}</Text>
            </Text>
          ))}
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap="lg">
        {shown.map(gauge => (
          <Box key={gauge.key} flexDirection="column" gap="xs" flexGrow={1} flexShrink={1}>
            <Box flexDirection="row" justifyContent="space-between" gap="sm">
              <Text weight="medium">{gauge.label}</Text>
              <Text size="footnote" dimColor tabular color={LEVEL_COLORS[gauge.level]}>
                {gauge.percent}%{gauge.detail ? ` · ${gauge.detail}` : ''}
              </Text>
            </Box>
            {/* An Svg is sized in pixels. A Box's height counts text rows, which is far too tall for a bar. */}
            <Svg
              source={barSvg(gauge.percent, gauge.level)}
              alt={`${gauge.label} ${gauge.percent}%`}
              height={BAR_HEIGHT}
            />
          </Box>
        ))}
      </Box>
    )
  })
}
