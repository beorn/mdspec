// Constants and default values for mdspec
// Centralized to avoid magic numbers scattered across the codebase

// ============ OSC 133 Shell Integration Patterns ============
// Protocol sequences (using BEL \x07 as terminator):
// - \x1b]133;A\x07 — Prompt start (REPL is ready for input)
// - \x1b]133;C\x07 — Command start (execution beginning)
// - \x1b]133;D;N\x07 — Command end with exit code N

/** Match OSC 133;A (prompt start — REPL is ready for input) */
export const OSC_133_A_PATTERN = /\x1b\]133;A\x07/

/** Match OSC 133;D with optional exit code: \x1b]133;D;N\x07 or \x1b]133;D\x07 */
export const OSC_133_D_PATTERN = /\x1b\]133;D(?:;(-?\d+))?\x07/

/** Match any OSC 133 sequence for stripping (global) */
export const OSC_133_ANY_PATTERN = /\x1b\]133;[A-Z](?:;[^\x07]*)?\x07/g

/**
 * Default timeout values in milliseconds
 */
export const DEFAULTS = {
  /** Global command timeout (30 seconds) */
  TIMEOUT: 30000,

  /** Maximum output length before truncation in error messages */
  OUTPUT_MAX_LENGTH: 500,

  /** Width for truncating long lines in output */
  TRUNCATE_WIDTH: 70,

  /** CmdSession (pipe-based) defaults */
  CMD_SESSION: {
    /** Milliseconds of silence before assuming command complete */
    MIN_WAIT: 100,
    /** Maximum wait time per command */
    MAX_WAIT: 2000,
    /** Milliseconds to wait for subprocess to be ready (0 = no startup wait) */
    STARTUP_DELAY: 0,
  },

  /** PtySession (PTY-based) defaults */
  PTY_SESSION: {
    /** Milliseconds of silence before assuming command complete */
    MIN_WAIT: 50,
    /** Maximum wait time per command */
    MAX_WAIT: 2000,
    /** Milliseconds to wait for subprocess to be ready */
    STARTUP_DELAY: 300,
  },
} as const
