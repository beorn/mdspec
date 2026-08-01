// Public API for mdspec - used by integrations and standalone CLI

export interface BlockOptions {
  exit?: number
  cwd?: string
  env?: Record<string, string>
  reset?: boolean
  timeout?: number // Timeout in milliseconds (default: 30000ms / 30s)

  /**
   * `set -u` inside the block. Default TRUE.
   *
   * An unset variable aborts the command instead of silently expanding to the
   * empty string — which is how `<destructive-command> "$ROOT"` becomes
   * `<destructive-command> ""` (a no-op that reads as success) or, once a
   * suffix is appended, an absolute path under `/`. `set -e` is deliberately
   * NOT applied: the runner asserts on exit codes itself and specs routinely
   * exercise failing commands.
   *
   * Opt out per block with `nounset=false` when a spec legitimately reads a
   * possibly-unset variable; prefer `${VAR:-}` in the spec instead.
   */
  nounset?: boolean

  // Custom command mode (persistent subprocess)
  cmd?: string // Custom command to run (e.g., "km sh board.md")
  minWait?: number // Min silence (ms) before capture complete (default: 100)
  maxWait?: number // Max total wait (ms) per command (default: 2000)
  startupDelay?: number // Ms to wait for subprocess ready (default: 0)
  pty?: boolean // PTY mode (default on POSIX). Set false for pipe mode (separate stderr)
}

// Note: Programmatic API is not yet implemented.
// Use the CLI (mdspec) or Bun integration (mdspec/bun) instead.
// See README.md for usage.

export interface CommandResult {
  command: string
  displayName: string // Includes $ prefix if enabled
  passed: boolean
  duration: number // milliseconds
  stdout: string[]
  stderr: string[]
  exitCode: number
  expected?: {
    stdout: string[]
    stderr: string[]
    exitCode: number
  }
  diff?: string // Human-readable diff if failed
}

export interface HeadingResult {
  level: number
  title: string
  slug: string
  path: string[] // Hierarchical path: ['Setup', 'Import']
  commands: CommandResult[]
}

export interface FileResult {
  path: string
  headings: HeadingResult[]
  totalCommands: number
  passedCommands: number
  duration: number
}
