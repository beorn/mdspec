// Bash plugin for mdspec - default execution mode
// Extracts state-based bash execution logic into plugin interface

import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { safeRemoveSync } from "removely"
import { splitNorm, trimTrailingEmptyLines } from "../core.js"
import { buildScript, buildHookScript } from "../shell.js"
import { portableShell } from "../spawn.js"
import { DEFAULTS } from "../constants.js"
import type { Plugin, FileOpts, BlockOpts, ExecFn, ReplResult } from "../types.js"
import type { ShellResult, ShellOptions } from "../shell.js"

/** Shell function signature matching bunShell/vitestShell */
export type ShellFn = (cmd: string[], opts?: ShellOptions) => Promise<ShellResult>

/**
 * Remove a harness-owned temp root and PROVE it is gone.
 *
 * This used to be a hand-rolled mirror of the shared primitive, written that
 * way because the primitive lived inside an agent harness that mdspec could not
 * depend on without breaking the standalone-clone rule. `removely` is that same
 * primitive rehomed as a zero-dependency npm leaf, so the mirror is deleted and
 * the real check is used — which also fixes where the copy had drifted: the
 * mirror only `console.error`d on a survivor and returned, so a fixture leak
 * left the suite green. `safeRemoveSync` throws.
 */
function removeVerified(root: string): void {
  // `root` is already realpath-resolved at creation, and safeRemoveSync
  // re-resolves both sides before comparing, so the unresolved-vs-resolved
  // `/var/folders` prefix trap cannot bite.
  safeRemoveSync(root, { within: realpathSync(tmpdir()), allowMissing: true })
}

/** Options for the bash plugin factory */
export interface BashPluginOptions {
  /** Custom shell function. Defaults to bunShell. */
  shellFn?: ShellFn
}

/**
 * Bash plugin - default mdspec execution mode
 * Uses stateful bash execution with env/cwd/function persistence
 */
export function bash(opts: FileOpts, pluginOpts?: BashPluginOptions): Plugin {
  const shell: ShellFn = pluginOpts?.shellFn ?? portableShell

  // Create temp directory for state files
  const stateDir = realpathSync(mkdtempSync(join(tmpdir(), "mdspec-")))
  const envFile = join(stateDir, ".env")
  const cwdFile = join(stateDir, ".cwd")
  const funcFile = join(stateDir, ".functions")

  // Harness-owned scratch directory, exported to every block as $MDSPEC_FIXTURE.
  //
  // Specs must not run their own `mktemp -d` and must not write their own
  // teardown: a trailing cleanup step only runs when every preceding block
  // succeeded, so any earlier failure, timeout or abort leaks the root — and a
  // hand-rolled recursive delete of a possibly-unset variable is exactly the
  // shape that makes a leak dangerous rather than merely untidy. The harness
  // owns creation and removal; the spec owns assertions.
  const fixtureDir = realpathSync(mkdtempSync(join(tmpdir(), "mdspec-fixture-")))

  // Write initial state files
  writeFileSync(envFile, "")
  writeFileSync(cwdFile, process.cwd())
  writeFileSync(funcFile, "")

  // Write all file= blocks to cwd (the test's working directory)
  const cwd = process.cwd()
  for (const [filename, content] of opts.files) {
    const filePath = join(cwd, filename)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content)
  }

  return {
    block(opts: BlockOpts): ExecFn | null {
      // Skip file= blocks (already written in factory)
      if (opts.file) return null

      const lifecycleFence = ["beforeAll", "afterAll", "beforeEach", "afterEach"].includes(opts.type)

      // Handle executable examples plus raw shell lifecycle fences.
      if (!["console", "sh", "bash"].includes(opts.type) && !lifecycleFence) {
        return null
      }

      // Handle reset option: clear state files
      if (opts.reset) {
        writeFileSync(envFile, "")
        writeFileSync(cwdFile, process.cwd())
        writeFileSync(funcFile, "")
      }

      // Return execution function
      return async (cmd: string): Promise<ReplResult> => {
        const timeout = (opts.timeout as number | undefined) ?? DEFAULTS.TIMEOUT
        const cwd = (opts.cwd as string | undefined) ?? process.cwd()

        // Convert BlockOpts to BlockOptions for buildScript
        const blockOpts = {
          exit: opts.exit as number | undefined,
          cwd: opts.cwd as string | undefined,
          // Namespaced deliberately: `FIXTURE` is a name specs already use for
          // their own scratch roots, and injecting into it would silently
          // clobber theirs every block. Harness-owned state gets a harness-owned
          // name. Listed first so an explicit block `env` can still override it.
          env: { MDSPEC_FIXTURE: fixtureDir, ...((opts.env as Record<string, string> | undefined) ?? {}) },
          reset: opts.reset as boolean | undefined,
          timeout: opts.timeout as number | undefined,
          nounset: opts.nounset as boolean | undefined,
        }

        // Build script with state persistence
        const command = lifecycleFence ? `set -e\n${cmd}` : cmd
        const script = buildScript([command], blockOpts, envFile, cwdFile, funcFile)

        // Execute command
        // Specs inherit the caller's explicit environment. A login shell
        // re-runs host profiles and may replace PATH (and therefore the Bun,
        // Git, or CLI version under test) with an unrelated machine default.
        const res = await shell(["bash", "--noprofile", "--norc", "-c", script], {
          cwd,
          env: process.env as Record<string, string>,
          timeout,
        })

        // Parse output
        const stdout = splitNorm(res.stdout.toString())
        const stderr = splitNorm(res.stderr.toString())

        // Remove trailing empty lines
        trimTrailingEmptyLines(stdout)
        trimTrailingEmptyLines(stderr)

        return {
          stdout: stdout.join("\n"),
          stderr: stderr.join("\n"),
          exitCode: res.exitCode ?? 0,
        }
      }
    },

    // Lifecycle hooks - call bash functions from state
    async beforeAll(): Promise<void> {
      await callHook("beforeAll")
    },

    async afterAll(): Promise<void> {
      await callHook("afterAll")
      // Harness-owned teardown, verified. A cleanup that silently no-ops leaves
      // the run green while the root survives — the defect class that let 2026-07-31
      // pass unnoticed — so removal failure is reported, not swallowed.
      removeVerified(stateDir)
      removeVerified(fixtureDir)
    },

    async beforeEach(): Promise<void> {
      await callHook("beforeEach")
    },

    async afterEach(): Promise<void> {
      await callHook("afterEach")
    },
  }

  // Helper to call bash hooks
  async function callHook(hookName: string): Promise<void> {
    const script = buildHookScript(hookName, envFile, cwdFile, funcFile)
    await shell(["bash", "--noprofile", "--norc", "-c", script], {
      cwd: process.cwd(),
      env: process.env as Record<string, string>,
    })
  }
}
