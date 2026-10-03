// Bun test integration for .spec.md files
// Usage: Create a wrapper test file that calls registerMdTests()
//
// Example: tests/md.test.ts
// import { registerMdTests } from 'mdspec/bun'
// await registerMdTests('tests/e2e/**/*.spec.md')

import type { FrameworkAdapter } from "./shared.js"
import {
  registerMdTests as registerMdTestsShared,
  registerMdTestFile as registerMdTestFileShared,
  discoverMdTests,
} from "./shared.js"
import { portableShell } from "../spawn.js"

// Load the runner only when registration is requested. Discovery and bunShell
// remain usable when this public entry is imported under Node.js.
let bunAdapterPromise: Promise<FrameworkAdapter> | undefined

function getBunAdapter(): Promise<FrameworkAdapter> {
  return (bunAdapterPromise ??= import("bun:test")
    .then(({ test, describe, beforeAll, afterAll, beforeEach, afterEach }) => ({
      describe: (name, fn) => describe.serial(name, fn),
      test: (name, fn, timeout) => test.serial(name, fn, timeout),
      beforeAll,
      afterAll,
      beforeEach,
      afterEach,
    }))
    .catch((cause: unknown) => {
      const error = new Error(
        "mdspec/bun registration requires the Bun runtime; importing for discovery and bunShell is supported under Node.js",
        { cause },
      )
      error.name = "MdspecBunRuntimeError"
      throw error
    }))
}

// Re-export discovery API
export { discoverMdTests }

// Register all .spec.md files as Bun tests
export async function registerMdTests(pattern: string | string[] = "**/*.spec.md"): Promise<void> {
  return registerMdTestsShared(await getBunAdapter(), pattern)
}

// Register a single .spec.md file as Bun tests
export async function registerMdTestFile(filePath: string): Promise<void> {
  return registerMdTestFileShared(await getBunAdapter(), filePath)
}

// ============ Shell Adapter ============

/**
 * Execute command via portable spawn (Bun.spawn or Node.js child_process)
 *
 * @param cmd - Command array (e.g., ['bash', '-lc', script])
 * @param opts - Execution options (cwd, env, timeout)
 * @returns Promise<ShellResult> with stdout, stderr, exitCode
 */
export const bunShell = portableShell
