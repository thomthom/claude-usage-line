// Milliseconds since the epoch, from $.clock.now().
export type Timestamp = number

declare module 'claude-code' {
  interface PluginState {
    'usage-line': { measuredAt: Timestamp }
  }
}
